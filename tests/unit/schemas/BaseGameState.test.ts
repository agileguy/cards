import { BaseGameState } from '../../../src/schemas/BaseGameState';
import { GamePlayer } from '../../../src/schemas/GamePlayer';

describe('BaseGameState', () => {
  let state: BaseGameState;

  beforeEach(() => {
    state = new BaseGameState();
  });

  describe('initialization', () => {
    it('should initialize with empty players map', () => {
      expect(state.players.size).toBe(0);
    });

    it('should initialize with waiting status', () => {
      expect(state.status).toBe('waiting');
    });

    it('should initialize with null winner', () => {
      expect(state.winner).toBeNull();
    });

    it('should initialize with zero timestamps', () => {
      expect(state.startedAt).toBe(0);
      expect(state.endedAt).toBe(0);
    });
  });

  describe('addPlayer', () => {
    it('should add a new player', () => {
      const player = new GamePlayer('session-123', 'Alice');

      const result = state.addPlayer(player);

      expect(result).toBe(true);
      expect(state.players.size).toBe(1);
      expect(state.players.get('session-123')).toBe(player);
    });

    it('should return false when adding duplicate player', () => {
      const player1 = new GamePlayer('session-123', 'Alice');
      const player2 = new GamePlayer('session-123', 'AliceDuplicate');

      state.addPlayer(player1);
      const result = state.addPlayer(player2);

      expect(result).toBe(false);
      expect(state.players.size).toBe(1);
      expect(state.players.get('session-123')?.name).toBe('Alice');
    });

    it('should add multiple players with different IDs', () => {
      const player1 = new GamePlayer('session-123', 'Alice');
      const player2 = new GamePlayer('session-456', 'Bob');

      state.addPlayer(player1);
      state.addPlayer(player2);

      expect(state.players.size).toBe(2);
      expect(state.players.get('session-123')).toBeDefined();
      expect(state.players.get('session-456')).toBeDefined();
    });
  });

  describe('getPlayer', () => {
    it('should return player when it exists', () => {
      const player = new GamePlayer('session-123', 'Alice');
      state.addPlayer(player);

      const result = state.getPlayer('session-123');

      expect(result).toBe(player);
      expect(result?.name).toBe('Alice');
    });

    it('should return undefined when player does not exist', () => {
      const result = state.getPlayer('session-999');

      expect(result).toBeUndefined();
    });
  });

  describe('removePlayer', () => {
    it('should remove existing player', () => {
      const player = new GamePlayer('session-123', 'Alice');
      state.addPlayer(player);

      const result = state.removePlayer('session-123');

      expect(result).toBe(true);
      expect(state.players.size).toBe(0);
      expect(state.players.get('session-123')).toBeUndefined();
    });

    it('should return false when removing non-existent player', () => {
      const result = state.removePlayer('session-999');

      expect(result).toBe(false);
      expect(state.players.size).toBe(0);
    });

    it('should only remove specified player', () => {
      const player1 = new GamePlayer('session-123', 'Alice');
      const player2 = new GamePlayer('session-456', 'Bob');
      state.addPlayer(player1);
      state.addPlayer(player2);

      state.removePlayer('session-123');

      expect(state.players.size).toBe(1);
      expect(state.players.get('session-123')).toBeUndefined();
      expect(state.players.get('session-456')).toBeDefined();
    });
  });

  describe('setWinner', () => {
    it('should set winner', () => {
      state.setWinner('session-123');

      expect(state.winner).toBe('session-123');
    });

    it('should update winner when called multiple times', () => {
      state.setWinner('session-123');
      state.setWinner('session-456');

      expect(state.winner).toBe('session-456');
    });
  });

  describe('setStatus', () => {
    it('should set status to playing', () => {
      state.setStatus('playing');

      expect(state.status).toBe('playing');
    });

    it('should set status to completed', () => {
      state.setStatus('completed');

      expect(state.status).toBe('completed');
    });

    it('should transition through all statuses', () => {
      expect(state.status).toBe('waiting');

      state.setStatus('playing');
      expect(state.status).toBe('playing');

      state.setStatus('completed');
      expect(state.status).toBe('completed');
    });
  });

  describe('schema serialization', () => {
    it('should be instance of Schema', () => {
      expect(state).toBeInstanceOf(BaseGameState);
    });

    it('should serialize players map', () => {
      const player = new GamePlayer('session-123', 'Alice');
      state.addPlayer(player);

      // MapSchema should be serializable
      expect(state.players).toBeDefined();
      expect(state.players.size).toBe(1);
    });

    it('should have all required properties', () => {
      expect(state.players).toBeDefined();
      expect(state.status).toBeDefined();
      expect(state.winner).toBeDefined();
      expect(state.startedAt).toBeDefined();
      expect(state.endedAt).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full game lifecycle', () => {
      // Waiting phase
      expect(state.status).toBe('waiting');
      expect(state.players.size).toBe(0);

      // Add players
      state.addPlayer(new GamePlayer('session-1', 'Alice'));
      state.addPlayer(new GamePlayer('session-2', 'Bob'));
      expect(state.players.size).toBe(2);

      // Start game
      state.setStatus('playing');
      state.startedAt = Date.now();
      expect(state.status).toBe('playing');
      expect(state.startedAt).toBeGreaterThan(0);

      // End game with winner
      state.setWinner('session-1');
      state.setStatus('completed');
      state.endedAt = Date.now();

      expect(state.status).toBe('completed');
      expect(state.winner).toBe('session-1');
      expect(state.endedAt).toBeGreaterThan(state.startedAt);
    });

    it('should handle player leaving mid-game', () => {
      state.addPlayer(new GamePlayer('session-1', 'Alice'));
      state.addPlayer(new GamePlayer('session-2', 'Bob'));
      state.setStatus('playing');

      state.removePlayer('session-1');

      expect(state.players.size).toBe(1);
      expect(state.players.get('session-2')).toBeDefined();
    });
  });
});
