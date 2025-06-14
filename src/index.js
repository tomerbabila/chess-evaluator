import express from 'express';
import bodyParser from 'body-parser';
import bestMoveRoute from './routes/bestMove.js';
import pieceEvalRoute from './routes/pieceEval.js';

const app = express();
app.use(bodyParser.json());

app.use('/best-move', bestMoveRoute);
app.use('/piece-eval', pieceEvalRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
