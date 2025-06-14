import express from 'express';
import { evaluatePieceMoves } from '../analyze/pieceEval.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { fen, piece } = req.body;
  if (!fen || !piece) return res.status(400).json({ error: 'Missing FEN or piece' });

  try {
    const result = await evaluatePieceMoves(fen, piece);
    res.json({ pieceMoves: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
