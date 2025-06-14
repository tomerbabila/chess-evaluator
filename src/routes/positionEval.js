import express from 'express';
import { evaluatePosition } from '../analyze/positionEval.js';
const router = express.Router();

router.post('/', async (req, res) => {
  const { fen } = req.body;

  if (!fen) {
    return res.status(400).json({ error: 'FEN is required' });
  }

  try {
    const score = await evaluatePosition(fen);
    res.json({ score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error evaluating position' });
  }
});

export default router;
