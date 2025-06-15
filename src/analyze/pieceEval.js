import ChessService from '../services/chessService.js';
import StockfishService from '../services/stockfishService.js';

export async function evaluatePieceMoves(fen, pieceCode) {
  const chess = ChessService.create(fen);
  const stockfish = StockfishService.getInstance();

  const legalMoves = chess.moves({ verbose: true });
  const pieceMoves = legalMoves.filter((move) => move.from === pieceCode.toLowerCase());

  const scores = {};

  for (const move of pieceMoves) {
    chess.move(move); // make move
    const newFen = chess.fen();
    chess.undo(); // revert back

    const moveStr = move.from + move.to;
    const score = await stockfish.evaluatePosition(newFen); // evaluate new position

    scores[moveStr] = score;
  }

  return scores;
}
