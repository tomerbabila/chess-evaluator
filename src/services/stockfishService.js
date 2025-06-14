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

    this.queue = [];
    this.buffer = '';
    this.isBusy = false;

    this.engine.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);

      lines.forEach((line) => {
        this.buffer += line + '\n';

        if (/bestmove|readyok/.test(line)) {
          const callback = this.queue.shift();
          if (callback) {
            callback(this.buffer);
            this.buffer = '';
          }
        }
      });
    });

    this.engine.stderr.on('data', (err) => {
      console.error('Stockfish error:', err.toString());
    });

    this.engine.on('exit', (code) => {
      console.log(`Stockfish process exited with code ${code}`);
    });

    this.engine.stdin.write('uci\n');
    this.engine.stdin.write('isready\n');
  }

  static getInstance() {
    if (!StockfishService.instance) {
      StockfishService.instance = new StockfishService();
    }
    return StockfishService.instance;
  }

  send(commands) {
    return new Promise((resolve) => {
      const trySend = () => {
        if (this.isBusy) return setTimeout(trySend, 25);

        this.isBusy = true;
        this.buffer = '';

        this.queue.push((output) => {
          this.isBusy = false;
          resolve(output);
        });

        for (const cmd of commands) {
          this.engine.stdin.write(cmd + '\n');
        }
      };

      trySend();
    });
  }

  async getBestMove(fen) {
    await this.send([`position fen ${fen}`]);
    const result = await this.send(['go depth 10']);
    const match = result.match(/bestmove\s(\S+)/);
    return match ? match[1] : null;
  }

  async evaluatePosition(fen) {
    await this.send([`position fen ${fen}`]);
    const result = await this.send(['go depth 10']);

    const line = result
      .split('\n')
      .reverse()
      .find((l) => l.includes('score'));
    const match = line?.match(/score (cp|mate) (-?\d+)/);

    if (!match) return null;
    return match[1] === 'cp' ? parseInt(match[2]) : match[2] > 0 ? 10000 : -10000;
  }
}

export default StockfishService;
