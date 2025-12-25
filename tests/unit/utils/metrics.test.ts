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

    it('should initialize lobby metrics', () => {
      expect(collector.lobbyPlayersWaiting).toBeDefined();
      expect(collector.lobbyMatchesTotal).toBeDefined();
      expect(collector.lobbyMatchDuration).toBeDefined();
      expect(collector.lobbyTimeoutsTotal).toBeDefined();
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

  describe('lobby metrics', () => {
    it('should set lobby players waiting gauge', async () => {
      collector.lobbyPlayersWaiting.set(3);

      const metricsOutput = await collector.getMetrics();
      expect(metricsOutput).toContain('cards_lobby_players_waiting 3');
    });

    it('should increment lobby matches counter', async () => {
      collector.lobbyMatchesTotal.inc();
      collector.lobbyMatchesTotal.inc();

      const metricsOutput = await collector.getMetrics();
      expect(metricsOutput).toContain('cards_lobby_matches_total 2');
    });

    it('should observe lobby match duration histogram', async () => {
      collector.lobbyMatchDuration.observe(5.2);

      const metricsOutput = await collector.getMetrics();
      expect(metricsOutput).toContain('cards_lobby_match_duration_seconds');
    });

    it('should increment lobby timeouts counter', async () => {
      collector.lobbyTimeoutsTotal.inc();

      const metricsOutput = await collector.getMetrics();
      expect(metricsOutput).toContain('cards_lobby_timeouts_total 1');
    });

    it('should include lobby metrics in output', async () => {
      collector.lobbyPlayersWaiting.set(2);
      collector.lobbyMatchesTotal.inc();
      collector.lobbyMatchDuration.observe(3.5);
      collector.lobbyTimeoutsTotal.inc();

      const metricsOutput = await collector.getMetrics();

      expect(metricsOutput).toContain('cards_lobby_players_waiting');
      expect(metricsOutput).toContain('cards_lobby_matches_total');
      expect(metricsOutput).toContain('cards_lobby_match_duration_seconds');
      expect(metricsOutput).toContain('cards_lobby_timeouts_total');
    });
  });
});
