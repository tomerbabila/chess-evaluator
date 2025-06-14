import express from 'express';
import { getBestMove } from '../analyze/bestMove.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { fen } = req.body;
  if (!fen) return res.status(400).json({ error: 'Missing FEN' });

  try {
    const move = await getBestMove(fen);
    res.json({ bestMove: move });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
