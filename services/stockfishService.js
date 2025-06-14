import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StockfishService {
  static instance;

  constructor() {
    const stockfishPath = path.join(__dirname, '../stockfish/stockfish'); // or just 'stockfish' on Linux/Mac
    this.engine = spawn(stockfishPath);

    this.queue = [];
    this.buffer = '';

    // Listen to stdout data, not onmessage (that's for Web Workers)
    this.engine.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);

      lines.forEach((line) => {
        this.buffer += line + '\n';

        if (/readyok|bestmove/.test(line)) {
          const callback = this.queue.shift();
          if (callback) callback(this.buffer);
          this.buffer = '';
        }
      });
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
      commands.forEach((cmd) => this.engine.stdin.write(cmd + '\n'));
      this.queue.push(resolve);
    });
  }

  async getBestMove(fen) {
    await this.send([`position fen ${fen}`]);
    const result = await this.send(['go depth 12']);
    const match = result.match(/bestmove\s(\S+)/);
    return match ? match[1] : null;
  }

  async getEvalForMove(fen, move) {
    await this.send([`position fen ${fen} moves ${move}`]);
    const result = await this.send(['go depth 10']);

    const line = result
      .split('\n')
      .reverse()
      .find((l) => l.includes('score'));
    const match = line?.match(/score (cp|mate) (-?\d+)/);

    if (!match) return null;
    return match[1] === 'cp' ? parseInt(match[2]) : match[2] > 0 ? 10000 : -100;
  }
}

export default StockfishService;
