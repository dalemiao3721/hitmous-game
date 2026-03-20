import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/game.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/game', gameRoutes);

app.use(errorHandler);

export default app;
