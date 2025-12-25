import { GamePlayer } from '../../../src/schemas/GamePlayer';

describe('GamePlayer', () => {
  describe('constructor', () => {
    it('should initialize with sessionId and name', () => {
      const player = new GamePlayer('session-123', 'Alice');

      expect(player.sessionId).toBe('session-123');
      expect(player.name).toBe('Alice');
    });

    it('should initialize with waiting status', () => {
      const player = new GamePlayer('session-123', 'Alice');

      expect(player.status).toBe('waiting');
    });

    it('should set joinedAt timestamp', () => {
      const beforeTime = Date.now();
      const player = new GamePlayer('session-123', 'Alice');
      const afterTime = Date.now();

      expect(player.joinedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(player.joinedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('setStatus', () => {
    let player: GamePlayer;

    beforeEach(() => {
      player = new GamePlayer('session-123', 'Alice');
    });

    it('should update status to ready', () => {
      player.setStatus('ready');

      expect(player.status).toBe('ready');
    });

    it('should update status to playing', () => {
      player.setStatus('playing');

      expect(player.status).toBe('playing');
    });

    it('should update status to finished', () => {
      player.setStatus('finished');

      expect(player.status).toBe('finished');
    });

    it('should allow status transitions', () => {
      expect(player.status).toBe('waiting');

      player.setStatus('ready');
      expect(player.status).toBe('ready');

      player.setStatus('playing');
      expect(player.status).toBe('playing');

      player.setStatus('finished');
      expect(player.status).toBe('finished');
    });
  });

  describe('schema serialization', () => {
    it('should be instance of Schema', () => {
      const player = new GamePlayer('session-123', 'Alice');

      expect(player).toBeInstanceOf(GamePlayer);
    });

    it('should have all required properties', () => {
      const player = new GamePlayer('session-123', 'Alice');

      expect(player.sessionId).toBeDefined();
      expect(player.name).toBeDefined();
      expect(player.joinedAt).toBeDefined();
      expect(player.status).toBeDefined();
    });

    it('should allow property access', () => {
      const player = new GamePlayer('session-123', 'Alice');

      expect(player.sessionId).toBe('session-123');
      expect(player.name).toBe('Alice');
      expect(typeof player.joinedAt).toBe('number');
      expect(player.status).toBe('waiting');
    });
  });

  describe('use cases', () => {
    it('should handle game lifecycle for a player', () => {
      const player = new GamePlayer('session-123', 'Alice');

      // Player joins (waiting)
      expect(player.status).toBe('waiting');

      // Player readies up
      player.setStatus('ready');
      expect(player.status).toBe('ready');

      // Game starts
      player.setStatus('playing');
      expect(player.status).toBe('playing');

      // Game ends
      player.setStatus('finished');
      expect(player.status).toBe('finished');
    });

    it('should track player join time correctly', () => {
      const player1 = new GamePlayer('session-1', 'Alice');

      // Small delay
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      return delay(10).then(() => {
        const player2 = new GamePlayer('session-2', 'Bob');

        expect(player2.joinedAt).toBeGreaterThan(player1.joinedAt);
      });
    });

    it('should distinguish players by sessionId', () => {
      const player1 = new GamePlayer('session-1', 'Alice');
      const player2 = new GamePlayer('session-2', 'Alice');

      expect(player1.sessionId).not.toBe(player2.sessionId);
      expect(player1.name).toBe(player2.name);
    });

    it('should allow same name for different players', () => {
      const player1 = new GamePlayer('session-1', 'Alice');
      const player2 = new GamePlayer('session-2', 'Alice');

      expect(player1.name).toBe(player2.name);
      expect(player1.sessionId).not.toBe(player2.sessionId);
    });
  });
});
