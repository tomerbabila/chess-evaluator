import { Chess } from 'chess.js';

class ChessService {
  static create(fen) {
    const chess = new Chess(fen);
    if (!chess.validate_fen(fen).valid) {
      throw new Error('Invalid FEN string');
    }
    return chess;
  }
}

export default ChessService;
