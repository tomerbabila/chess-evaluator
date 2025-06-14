import StockfishService from '../services/stockfishService.js';

export async function getBestMove(fen) {
  const stockfish = StockfishService.getInstance();
  return await stockfish.getBestMove(fen);
}
