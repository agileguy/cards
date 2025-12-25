import { Registry, Counter, Gauge, Histogram } from 'prom-client';

export class MetricsCollector {
    public readonly register: Registry;

    // Connection metrics
    public readonly connectionsTotal: Counter;
    public readonly connectionsActive: Gauge;

    // Room metrics
    public readonly roomsTotal: Counter;
    public readonly roomsActive: Gauge;
    public readonly roomPlayers: Histogram;

    // Game metrics
    public readonly gamesStarted: Counter;
    public readonly gamesCompleted: Counter;
    public readonly gameDuration: Histogram;

    // Performance metrics
    public readonly messageLatency: Histogram;

    constructor() {
        this.register = new Registry();

        // Connection metrics
        this.connectionsTotal = new Counter({
            name: 'cards_connections_total',
            help: 'Total number of connections',
            registers: [this.register],
        });

        this.connectionsActive = new Gauge({
            name: 'cards_connections_active',
            help: 'Current number of active connections',
            registers: [this.register],
        });

        // Room metrics
        this.roomsTotal = new Counter({
            name: 'cards_rooms_total',
            help: 'Total number of rooms created',
            registers: [this.register],
        });

        this.roomsActive = new Gauge({
            name: 'cards_rooms_active',
            help: 'Current number of active rooms',
            registers: [this.register],
        });

        this.roomPlayers = new Histogram({
            name: 'cards_room_players',
            help: 'Number of players per room',
            buckets: [0, 1, 2, 3, 4],
            registers: [this.register],
        });

        // Game metrics
        this.gamesStarted = new Counter({
            name: 'cards_games_started_total',
            help: 'Total number of games started',
            registers: [this.register],
        });

        this.gamesCompleted = new Counter({
            name: 'cards_games_completed_total',
            help: 'Total number of games completed',
            registers: [this.register],
        });

        this.gameDuration = new Histogram({
            name: 'cards_game_duration_seconds',
            help: 'Game duration in seconds',
            buckets: [10, 30, 60, 120, 300, 600],
            registers: [this.register],
        });

        // Performance metrics
        this.messageLatency = new Histogram({
            name: 'cards_message_latency_seconds',
            help: 'Message processing latency',
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.register],
        });
    }

    public getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}

// Singleton instance
export const metrics = new MetricsCollector();
