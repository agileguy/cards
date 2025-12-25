import { LobbyState } from '../../../src/schemas/LobbyState';
import { Player } from '../../../src/schemas/Player';

describe('LobbyState Schema', () => {
  let lobbyState: LobbyState;

  beforeEach(() => {
    lobbyState = new LobbyState();
  });

  describe('initialization', () => {
    it('should initialize with empty waitingPlayers MapSchema', () => {
      expect(lobbyState.waitingPlayers).toBeDefined();
      expect(lobbyState.waitingPlayers.size).toBe(0);
    });

    it('should initialize with waiting status', () => {
      expect(lobbyState.status).toBe('waiting');
    });
  });

  describe('addPlayer', () => {
    it('should add a player to waitingPlayers map', () => {
      const player = new Player('session-123', 'Alice');

      const result = lobbyState.addPlayer(player);

      expect(result).toBe(true);
      expect(lobbyState.waitingPlayers.size).toBe(1);
      expect(lobbyState.waitingPlayers.get('session-123')).toBe(player);
    });

    it('should add multiple players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      expect(lobbyState.waitingPlayers.size).toBe(2);
      expect(lobbyState.waitingPlayers.get('session-123')).toBe(player1);
      expect(lobbyState.waitingPlayers.get('session-456')).toBe(player2);
    });

    it('should return false when adding duplicate sessionId', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-123', 'Bob');

      lobbyState.addPlayer(player1);
      const result = lobbyState.addPlayer(player2);

      expect(result).toBe(false);
      expect(lobbyState.waitingPlayers.size).toBe(1);
      expect(lobbyState.waitingPlayers.get('session-123')).toBe(player1);
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from waitingPlayers map', () => {
      const player = new Player('session-123', 'Alice');
      lobbyState.addPlayer(player);

      const result = lobbyState.removePlayer('session-123');

      expect(result).toBe(true);
      expect(lobbyState.waitingPlayers.size).toBe(0);
      expect(lobbyState.waitingPlayers.get('session-123')).toBeUndefined();
    });

    it('should return false when removing non-existent player', () => {
      const result = lobbyState.removePlayer('session-999');

      expect(result).toBe(false);
      expect(lobbyState.waitingPlayers.size).toBe(0);
    });

    it('should only remove the specified player', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      lobbyState.removePlayer('session-123');

      expect(lobbyState.waitingPlayers.size).toBe(1);
      expect(lobbyState.waitingPlayers.get('session-123')).toBeUndefined();
      expect(lobbyState.waitingPlayers.get('session-456')).toBe(player2);
    });
  });

  describe('getWaitingCount', () => {
    it('should return 0 when no players', () => {
      expect(lobbyState.getWaitingCount()).toBe(0);
    });

    it('should return count of waiting players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      expect(lobbyState.getWaitingCount()).toBe(2);
    });

    it('should only count players with waiting status', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      player2.setStatus('matched');
      player3.setStatus('disconnected');

      expect(lobbyState.getWaitingCount()).toBe(1);
    });

    it('should update count when player status changes', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      expect(lobbyState.getWaitingCount()).toBe(2);

      player1.setStatus('matched');
      expect(lobbyState.getWaitingCount()).toBe(1);

      player1.setStatus('waiting');
      expect(lobbyState.getWaitingCount()).toBe(2);
    });
  });

  describe('getWaitingPlayerIds', () => {
    it('should return empty array when no players', () => {
      expect(lobbyState.getWaitingPlayerIds()).toEqual([]);
    });

    it('should return array of waiting player sessionIds', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const ids = lobbyState.getWaitingPlayerIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('session-123');
      expect(ids).toContain('session-456');
    });

    it('should only include players with waiting status', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      player2.setStatus('matched');

      const ids = lobbyState.getWaitingPlayerIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('session-123');
      expect(ids).toContain('session-789');
      expect(ids).not.toContain('session-456');
    });
  });

  describe('MapSchema serialization', () => {
    it('should maintain MapSchema structure for Colyseus sync', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      // MapSchema should have forEach method
      expect(typeof lobbyState.waitingPlayers.forEach).toBe('function');

      // MapSchema should have size property
      expect(lobbyState.waitingPlayers.size).toBe(2);

      // MapSchema should be iterable
      const sessionIds: string[] = [];
      lobbyState.waitingPlayers.forEach((player, sessionId) => {
        sessionIds.push(sessionId);
      });
      expect(sessionIds).toHaveLength(2);
    });

    it('should preserve player data after map operations', () => {
      const player = new Player('session-123', 'Alice');
      lobbyState.addPlayer(player);

      const retrieved = lobbyState.waitingPlayers.get('session-123');

      expect(retrieved?.sessionId).toBe('session-123');
      expect(retrieved?.name).toBe('Alice');
      expect(retrieved?.status).toBe('waiting');
    });
  });
});
