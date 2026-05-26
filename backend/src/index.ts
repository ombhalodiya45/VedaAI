import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import { initWebSocket } from './websocket/wsServer';
import assignmentsRouter from './routes/assignments';
import groupsRouter from './routes/groups';
import toolkitRouter from './routes/toolkit';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = { api: 'ok' };

  checks.mongodb = mongoose.connection.readyState === 1 ? 'ok' : 'unavailable';

  try {
    await getRedisClient().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'unavailable';
  }

  const healthy = Object.values(checks).every(v => v === 'ok');
  res.status(healthy ? 200 : 503).json({ ...checks, timestamp: new Date().toISOString() });
});

app.use('/api/assignments', assignmentsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/toolkit', toolkitRouter);

initWebSocket(server);

const PORT = parseInt(process.env.PORT || '5000');

async function start() {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket available on ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

start();
