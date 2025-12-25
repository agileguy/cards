import { MetricsCollector } from '../../../src/utils/metrics';

describe('MetricsCollector', () => {
    let collector: MetricsCollector;

    beforeEach(() => {
        collector = new MetricsCollector();
    });

    describe('initialization', () => {
        it('should initialize all connection metrics', () => {
            expect(collector.connectionsTotal).toBeDefined();
            expect(collector.connectionsActive).toBeDefined();
        });

        it('should initialize all room metrics', () => {
            expect(collector.roomsTotal).toBeDefined();
            expect(collector.roomsActive).toBeDefined();
            expect(collector.roomPlayers).toBeDefined();
        });

        it('should initialize all game metrics', () => {
            expect(collector.gamesStarted).toBeDefined();
            expect(collector.gamesCompleted).toBeDefined();
            expect(collector.gameDuration).toBeDefined();
        });

        it('should initialize performance metrics', () => {
            expect(collector.messageLatency).toBeDefined();
        });

        it('should have a registry', () => {
            expect(collector.register).toBeDefined();
        });
    });

    describe('getMetrics', () => {
        it('should return metrics in Prometheus format', async () => {
            const metricsOutput = await collector.getMetrics();

            expect(metricsOutput).toContain('cards_connections_total');
            expect(metricsOutput).toContain('cards_connections_active');
            expect(metricsOutput).toContain('cards_rooms_total');
        });

        it('should include metric help text', async () => {
            const metricsOutput = await collector.getMetrics();

            expect(metricsOutput).toContain('HELP cards_connections_total');
            expect(metricsOutput).toContain('TYPE cards_connections_total counter');
        });
    });

    describe('metric tracking', () => {
        it('should increment connection counter', async () => {
            collector.connectionsTotal.inc();
            collector.connectionsTotal.inc();

            const metricsOutput = await collector.getMetrics();
            expect(metricsOutput).toContain('cards_connections_total 2');
        });

        it('should set active connections gauge', async () => {
            collector.connectionsActive.set(5);

            const metricsOutput = await collector.getMetrics();
            expect(metricsOutput).toContain('cards_connections_active 5');
        });

        it('should observe room players histogram', async () => {
            collector.roomPlayers.observe(2);

            const metricsOutput = await collector.getMetrics();
            expect(metricsOutput).toContain('cards_room_players');
        });
    });
});
