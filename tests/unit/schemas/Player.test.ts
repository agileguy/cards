import { Player } from '../../../src/schemas/Player';

describe('Player Schema', () => {
  describe('constructor', () => {
    it('should create a player with sessionId and default name', () => {
      const player = new Player('session-123');

      expect(player.sessionId).toBe('session-123');
      expect(player.name).toBe('Player');
      expect(player.status).toBe('waiting');
      expect(player.joinedAt).toBeGreaterThan(0);
      expect(player.joinedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should create a player with custom name', () => {
      const player = new Player('session-456', 'Alice');

      expect(player.sessionId).toBe('session-456');
      expect(player.name).toBe('Alice');
      expect(player.status).toBe('waiting');
    });

    it('should set joinedAt timestamp to current time', () => {
      const before = Date.now();
      const player = new Player('session-789');
      const after = Date.now();

      expect(player.joinedAt).toBeGreaterThanOrEqual(before);
      expect(player.joinedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('setStatus', () => {
    it('should update player status to matched', () => {
      const player = new Player('session-123');

      player.setStatus('matched');

      expect(player.status).toBe('matched');
    });

    it('should update player status to disconnected', () => {
      const player = new Player('session-123');

      player.setStatus('disconnected');

      expect(player.status).toBe('disconnected');
    });

    it('should update player status back to waiting', () => {
      const player = new Player('session-123');
      player.setStatus('matched');

      player.setStatus('waiting');

      expect(player.status).toBe('waiting');
    });
  });

  describe('isTimedOut', () => {
    it('should return false for recently joined player', () => {
      const player = new Player('session-123');

      const result = player.isTimedOut(30000);

      expect(result).toBe(false);
    });

    it('should return true when timeout exceeded', () => {
      const player = new Player('session-123');
      // Manually set joinedAt to 31 seconds ago
      player.joinedAt = Date.now() - 31000;

      const result = player.isTimedOut(30000);

      expect(result).toBe(true);
    });

    it('should return false when exactly at timeout threshold', () => {
      const player = new Player('session-123');
      // Manually set joinedAt to exactly 30 seconds ago
      player.joinedAt = Date.now() - 30000;

      const result = player.isTimedOut(30000);

      expect(result).toBe(false);
    });

    it('should work with different timeout values', () => {
      const player = new Player('session-123');
      player.joinedAt = Date.now() - 15000; // 15 seconds ago

      expect(player.isTimedOut(10000)).toBe(true);
      expect(player.isTimedOut(20000)).toBe(false);
    });
  });

  describe('schema serialization', () => {
    it('should have all required schema properties', () => {
      const player = new Player('session-123', 'Bob');

      // These properties should be defined for Colyseus schema
      expect(player.sessionId).toBeDefined();
      expect(player.name).toBeDefined();
      expect(player.joinedAt).toBeDefined();
      expect(player.status).toBeDefined();
    });

    it('should maintain state after status changes', () => {
      const player = new Player('session-123', 'Charlie');
      const originalJoinedAt = player.joinedAt;

      player.setStatus('matched');

      expect(player.sessionId).toBe('session-123');
      expect(player.name).toBe('Charlie');
      expect(player.joinedAt).toBe(originalJoinedAt);
      expect(player.status).toBe('matched');
    });
  });
});
