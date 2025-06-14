import { Chess, validateFen } from 'chess.js';

class ChessService {
  static create(fen) {
    const chess = new Chess(fen);
    if (!validateFen(fen).ok) {
      throw new Error('Invalid FEN string');
    }
    return chess;
  }
}

export default ChessService;
