import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import { monitor } from '@colyseus/monitor';
import { metrics } from '../utils/metrics';
import { config } from './config';
import { LobbyRoom } from '../rooms/LobbyRoom';
import { SnapRoom } from '../rooms/SnapRoom';
import { createLogger } from '../utils/logger';

const log = createLogger('server');

const app = express();
const httpServer = createServer(app);

const gameServer = new Server({
  server: httpServer,
});

// Define lobby room
gameServer.define('lobby', LobbyRoom);

// Define snap game room
gameServer.define('snap', SnapRoom);

// Serve static files from public directory
app.use(express.static('public'));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get(config.metricsPath, async (req, res) => {
  try {
    res.set('Content-Type', metrics.register.contentType);
    const metricsData = await metrics.getMetrics();
    res.end(metricsData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).end(errorMessage);
  }
});

// Available games endpoint
app.get('/api/games', (req, res) => {
  res.json({ games: ['snap'] });
});

// Lobby count endpoint
app.get('/api/lobby/count', async (req, res) => {
  try {
    const rooms = await (gameServer as any).matchMaker.query({ name: 'lobby' });
    if (rooms.length === 0) {
      res.json({ count: 0 });
      return;
    }
    // Read waiting count from room metadata
    const count = rooms[0].metadata?.waitingCount ?? 0;
    res.json({ count });
  } catch (error) {
    // If query fails, assume no lobby exists
    res.json({ count: 0 });
  }
});

// Colyseus monitor
app.use(config.monitorPath, monitor());

// Track connections
gameServer.onShutdown(() => {
  log('Server shutting down...');
});

// Start server
gameServer
  .listen(config.port)
  .then(() => {
    log(`✅ Colyseus server listening on port ${config.port}`);
    log(
      `📊 Metrics available at http://localhost:${config.port}${config.metricsPath}`
    );
    log(
      `🎮 Monitor available at http://localhost:${config.port}${config.monitorPath}`
    );
    log(`❤️  Health check at http://localhost:${config.port}/health`);
  })
  .catch((error) => {
    log.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully...');
  gameServer
    .gracefullyShutdown()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully...');
  gameServer
    .gracefullyShutdown()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
});
