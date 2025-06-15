import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StockfishService {
  static instance;

  constructor() {
    const stockfishPath = path.join(__dirname, '../../stockfish/stockfish');
    this.engine = spawn(stockfishPath);

    this.currentPromiseResolve = null; // To hold the resolve function of the current active promise
    this.currentPromiseReject = null; // To hold the reject function of the current active promise
    this.outputBuffer = ''; // Buffer for accumulating output for the *current* command
    this.commandQueue = []; // Queue for pending commands

    this.engine.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean); // Split by newline and remove empty strings

      lines.forEach((line) => {
        // Accumulate all output for the current command
        this.outputBuffer += line + '\n';

        // Check for termination signals based on the expected command response
        if (this.currentPromiseResolve) {
          if (line.includes('bestmove') || line.includes('readyok')) {
            const resolve = this.currentPromiseResolve;
            const reject = this.currentPromiseReject;

            // Clear the promise holders immediately
            this.currentPromiseResolve = null;
            this.currentPromiseReject = null;

            // Resolve the promise with the accumulated buffer for this command
            resolve(this.outputBuffer);

            // Clear the buffer after resolving for the next command
            this.outputBuffer = '';

            // Run the next command in the queue
            this._runNextCommand();
          }
        }
      });
    });

    this.engine.stderr.on('data', (err) => {
      console.error('Stockfish error:', err.toString());
      if (this.currentPromiseReject) {
        this.currentPromiseReject(new Error(`Stockfish error: ${err.toString()}`));
        this.currentPromiseReject = null;
        this.currentPromiseResolve = null;
        this.outputBuffer = ''; // Clear buffer on error
        this._runNextCommand(); // Attempt to run next command, though engine might be in a bad state
      }
    });

    this.engine.on('close', (code) => {
      console.warn(`Stockfish process exited with code ${code}`);
      if (this.currentPromiseReject) {
        this.currentPromiseReject(new Error(`Stockfish process exited with code ${code}`));
        this.currentPromiseReject = null;
        this.currentPromiseResolve = null;
        this.outputBuffer = '';
      }
      // Consider re-spawning or handling this more gracefully in a production environment
    });

    // Initial setup for the engine
    this._sendCommands(['uci', 'isready'])
      .then(() => {
        console.log('Stockfish engine ready.');
      })
      .catch((error) => {
        console.error('Failed to initialize Stockfish:', error);
      });
  }

  static getInstance() {
    if (!StockfishService.instance) {
      StockfishService.instance = new StockfishService();
    }
    return StockfishService.instance;
  }

  /**
   * Sends an array of commands to Stockfish and returns a Promise that resolves
   * when a 'bestmove' or 'readyok' is received.
   * @param {string[]} commands - An array of commands to send.
   * @returns {Promise<string>} - The full output from Stockfish for these commands.
   */
  _sendCommands(commands) {
    return new Promise((resolve, reject) => {
      // Add the command and its promise handlers to the queue
      this.commandQueue.push({ commands, resolve, reject });
      this._runNextCommand();
    });
  }

  _runNextCommand() {
    // Only run if no command is currently being processed and there are commands in the queue
    if (!this.currentPromiseResolve && this.commandQueue.length > 0) {
      const { commands, resolve, reject } = this.commandQueue.shift(); // Get and remove from queue

      this.currentPromiseResolve = resolve;
      this.currentPromiseReject = reject;
      this.outputBuffer = ''; // Ensure buffer is clear before sending new commands

      commands.forEach((cmd) => {
        this.engine.stdin.write(cmd + '\n');
      });
    }
  }

  async getBestMove(fen) {
    // Send both position and go commands as a single unit to the engine
    const result = await this._sendCommands([`position fen ${fen}`, 'go depth 20']);
    const match = result.match(/bestmove\s(\S+)/);
    return match ? match[1] : null;
  }

  async evaluatePosition(fen) {
    const result = await this._sendCommands([`position fen ${fen}`, 'go depth 20']);

    // Stockfish outputs score on lines like: "info depth 10 seldepth 14 multipv 1 score cp 22 nodes 181934 time 93 pv d2d4 d7d5 g1f3 g8f6 c2c4 e7e6 b1c3 b8c6 c1g5 f8e7 e2e3 e8g8 c4d5 f6d5 g5e7 d5e7 f1e2 e7d5 e1g1 d5c3 b2c3"
    // We need to find the latest 'score' line. Reverse is a good strategy.
    const lines = result.split('\n').filter(Boolean);
    const scoreLine = lines.reverse().find((line) => line.includes('score'));

    if (!scoreLine) {
      console.warn('No score line found in Stockfish output for evaluation.');
      return null;
    }

    const match = scoreLine.match(/score (cp|mate) (-?\d+)/);

    if (!match) return null;
    return match[1] === 'cp' ? parseInt(match[2]) : match[2] > 0 ? 10000 : -10000; // Represent mate as high/low score
  }
}

export default StockfishService;
