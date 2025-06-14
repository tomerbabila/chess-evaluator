import StockfishService from '../services/stockfishService.js';

export async function evaluatePosition(fen) {
  const stockfish = StockfishService.getInstance();
  const score = await stockfish.evaluatePosition(fen);
  return score;
}
