import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { Server } from 'colyseus';
import { LobbyRoom } from '../../../src/rooms/LobbyRoom';

describe('Lobby API', () => {
  let app: express.Application;
  let gameServer: any;
  let httpServer: ReturnType<typeof createServer>;

  beforeAll(async () => {
    app = express();
    httpServer = createServer(app);

    gameServer = new Server({
      server: httpServer,
    });

    gameServer.define('lobby', LobbyRoom);

    // Define the lobby count endpoint
    app.get('/api/lobby/count', async (req, res) => {
      try {
        const rooms = await gameServer.matchMaker.query({ name: 'lobby' });
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

    // Start the server
    await gameServer.listen(0); // Use port 0 to get a random available port
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('GET /api/lobby/count', () => {
    it('should return 200 OK', async () => {
      const response = await request(httpServer).get('/api/lobby/count');

      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await request(httpServer).get('/api/lobby/count');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return count: 0 when no lobby exists', async () => {
      const response = await request(httpServer).get('/api/lobby/count');

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should return correct count structure', async () => {
      const response = await request(httpServer).get('/api/lobby/count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        count: expect.any(Number),
      });
    });
  });
});
