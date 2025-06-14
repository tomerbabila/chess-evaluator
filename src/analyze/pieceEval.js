import ChessService from '../services/chessService.js';
import StockfishService from '../services/stockfishService.js';

export async function evaluatePieceMoves(fen, pieceCode) {
  const chess = ChessService.create(fen);
  const stockfish = StockfishService.getInstance();

  const legalMoves = chess.moves({ verbose: true });
  const pieceMoves = legalMoves.filter((move) => move.piece === pieceCode.toLowerCase());

  const scores = {};
  for (const move of pieceMoves) {
    const moveStr = move.from + move.to;
    const score = await stockfish.getEvalForMove(fen, moveStr);
    scores[moveStr] = score;
  }

  return scores;
}
