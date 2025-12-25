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
  public readonly gamePlayersConnected: Gauge;

  // Performance metrics
  public readonly messageLatency: Histogram;

  // Lobby metrics
  public readonly lobbyPlayersWaiting: Gauge;
  public readonly lobbyMatchesTotal: Counter;
  public readonly lobbyMatchDuration: Histogram;
  public readonly lobbyTimeoutsTotal: Counter;

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
      labelNames: ['game_type'],
      registers: [this.register],
    });

    this.gamesCompleted = new Counter({
      name: 'cards_games_completed_total',
      help: 'Total number of games completed',
      labelNames: ['game_type'],
      registers: [this.register],
    });

    this.gameDuration = new Histogram({
      name: 'cards_game_duration_seconds',
      help: 'Game duration in seconds',
      labelNames: ['game_type'],
      buckets: [10, 30, 60, 120, 300, 600],
      registers: [this.register],
    });

    this.gamePlayersConnected = new Gauge({
      name: 'cards_game_players_connected',
      help: 'Current number of players connected to game rooms',
      labelNames: ['game_type'],
      registers: [this.register],
    });

    // Performance metrics
    this.messageLatency = new Histogram({
      name: 'cards_message_latency_seconds',
      help: 'Message processing latency',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register],
    });

    // Lobby metrics
    this.lobbyPlayersWaiting = new Gauge({
      name: 'cards_lobby_players_waiting',
      help: 'Current number of players waiting in lobby',
      registers: [this.register],
    });

    this.lobbyMatchesTotal = new Counter({
      name: 'cards_lobby_matches_total',
      help: 'Total number of successful matches in lobby',
      registers: [this.register],
    });

    this.lobbyMatchDuration = new Histogram({
      name: 'cards_lobby_match_duration_seconds',
      help: 'Time taken to find a match in seconds',
      buckets: [1, 5, 10, 15, 20, 30],
      registers: [this.register],
    });

    this.lobbyTimeoutsTotal = new Counter({
      name: 'cards_lobby_timeouts_total',
      help: 'Total number of lobby timeouts',
      registers: [this.register],
    });
  }

  public getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}

// Singleton instance
export const metrics = new MetricsCollector();
