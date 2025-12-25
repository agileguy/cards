import { Server } from 'colyseus';
import { createServer } from 'http';
import express from 'express';
import request from 'supertest';
import { metrics } from '../../src/utils/metrics';
import { config } from '../../src/server/config';

describe('Server Integration', () => {
    let app: express.Application;
    let httpServer: ReturnType<typeof createServer>;
    let gameServer: Server;

    beforeAll(() => {
        app = express();
        httpServer = createServer(app);
        gameServer = new Server({ server: httpServer });

        app.get('/health', (req, res) => {
            res.json({ status: 'ok' });
        });

        app.get(config.metricsPath, async (req, res) => {
            res.set('Content-Type', metrics.register.contentType);
            const metricsData = await metrics.getMetrics();
            res.end(metricsData);
        });
    });

    afterAll(async () => {
        await gameServer.gracefullyShutdown();
        httpServer.close();
    });

    describe('GET /health', () => {
        it('should return 200 OK', async () => {
            const response = await request(httpServer).get('/health');

            expect(response.status).toBe(200);
        });

        it('should return status ok', async () => {
            const response = await request(httpServer).get('/health');

            expect(response.body.status).toBe('ok');
        });
    });

    describe('GET /metrics', () => {
        it('should return 200 OK', async () => {
            const response = await request(httpServer).get('/metrics');

            expect(response.status).toBe(200);
        });

        it('should return Prometheus format metrics', async () => {
            const response = await request(httpServer).get('/metrics');

            expect(response.text).toContain('cards_connections_total');
            expect(response.text).toContain('cards_rooms_total');
        });

        it('should set correct content type', async () => {
            const response = await request(httpServer).get('/metrics');

            expect(response.headers['content-type']).toMatch(/^text\/plain/);
        });
    });
});
