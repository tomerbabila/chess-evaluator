import pkg from 'stockfish';
const Stockfish = pkg.default || pkg;

class StockfishService {
  static instance;

  constructor() {
    this.engine = Stockfish();
    this.ready = false;
    this.queue = [];
    this.buffer = '';

    this.engine.onmessage = (line) => {
      this.buffer += line + '\n';

      if (/readyok|bestmove/.test(line)) {
        const callback = this.queue.shift();
        if (callback) callback(this.buffer);
        this.buffer = '';
      }
    };

    this.engine.postMessage('uci');
    this.engine.postMessage('isready');
    this.ready = true;
  }

  static getInstance() {
    if (!StockfishService.instance) {
      StockfishService.instance = new StockfishService();
    }
    return StockfishService.instance;
  }

  send(commands) {
    return new Promise((resolve) => {
      commands.forEach((cmd) => this.engine.postMessage(cmd));
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
    return match[1] === 'cp' ? parseInt(match[2]) : match[2] > 0 ? 10000 : -10000;
  }
}

export default StockfishService;
