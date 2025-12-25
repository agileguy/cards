import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import { monitor } from '@colyseus/monitor';
import { metrics } from '../utils/metrics';
import { config } from './config';
import { LobbyRoom } from '../rooms/LobbyRoom';

const app = express();
const httpServer = createServer(app);

const gameServer = new Server({
  server: httpServer,
});

// Define lobby room
gameServer.define('lobby', LobbyRoom);

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

// Lobby count endpoint
app.get('/api/lobby/count', async (req, res) => {
  try {
    const rooms = await (gameServer as any).matchMaker.query({ name: 'lobby' });
    if (rooms.length === 0 || !rooms[0].state) {
      res.json({ count: 0 });
      return;
    }
    const count = rooms[0].state.getWaitingCount();
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
  // eslint-disable-next-line no-console
  console.log('Server shutting down...');
});

// Start server
gameServer
  .listen(config.port)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`✅ Colyseus server listening on port ${config.port}`);
    // eslint-disable-next-line no-console
    console.log(
      `📊 Metrics available at http://localhost:${config.port}${config.metricsPath}`
    );
    // eslint-disable-next-line no-console
    console.log(
      `🎮 Monitor available at http://localhost:${config.port}${config.monitorPath}`
    );
    // eslint-disable-next-line no-console
    console.log(`❤️  Health check at http://localhost:${config.port}/health`);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully...');
  gameServer
    .gracefullyShutdown()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
});

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('SIGINT received, shutting down gracefully...');
  gameServer
    .gracefullyShutdown()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    });
});
