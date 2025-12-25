import { GameRoom } from '../../../src/rooms/GameRoom';
import { BaseGameState } from '../../../src/schemas/BaseGameState';
import { IGameEngine } from '../../../src/games/IGameEngine';
import { Client } from 'colyseus';

// Concrete test implementation of GameRoom for testing
class TestGameState extends BaseGameState {
  // Empty test state
}

class TestGameEngine implements IGameEngine<TestGameState> {
  private state: TestGameState;

  constructor() {
    this.state = new TestGameState();
  }

  initialize(players: any[]): TestGameState {
    this.state = new TestGameState();
    return this.state;
  }

  processAction(state: TestGameState, action: any): any {
    return { success: true, newState: state };
  }

  validateAction(state: TestGameState, action: any): any {
    return { valid: true };
  }

  isGameOver(state: TestGameState): boolean {
    return false;
  }

  getWinner(state: TestGameState): string | null {
    return null;
  }

  getGameState(): TestGameState {
    return this.state;
  }
}

class TestGameRoom extends GameRoom<TestGameState> {
  gameType = 'test';
  minPlayers = 2;
  maxPlayers = 4;

  createGameEngine(): IGameEngine<TestGameState> {
    return new TestGameEngine();
  }

  onGameStart(): void {
    // Test implementation
  }
}

describe('GameRoom', () => {
  let room: TestGameRoom;

  beforeEach(() => {
    room = new TestGameRoom();
    // Mock setMetadata to prevent errors in unit tests
    room.setMetadata = jest.fn();
  });

  afterEach(() => {
    // Clean up any intervals or timers
    if (room['gameStartTimeout']) {
      clearTimeout(room['gameStartTimeout']);
    }
  });

  describe('onCreate', () => {
    it('should initialize game engine', () => {
      room.onCreate({});

      expect(room['gameEngine']).toBeDefined();
      expect(room['gameEngine']).toBeInstanceOf(TestGameEngine);
    });

    it('should initialize BaseGameState', () => {
      room.onCreate({});

      expect(room.state).toBeDefined();
      expect(room.state).toBeInstanceOf(BaseGameState);
    });

    it('should set game status to waiting', () => {
      room.onCreate({});

      expect(room.state.status).toBe('waiting');
    });

    it('should accept options parameter', () => {
      const options = { gameMode: 'ranked' };

      expect(() => room.onCreate(options)).not.toThrow();
    });
  });

  describe('onJoin', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should add player to state', () => {
      const mockClient = { sessionId: 'session-123' } as Client;

      room.onJoin(mockClient, { name: 'Alice' });

      expect(room.state.players.size).toBe(1);
      expect(room.state.players.get('session-123')).toBeDefined();
    });

    it('should use provided player name', () => {
      const mockClient = { sessionId: 'session-123' } as Client;

      room.onJoin(mockClient, { name: 'Alice' });

      const player = room.state.players.get('session-123');
      expect(player?.name).toBe('Alice');
    });

    it('should use default name when not provided', () => {
      const mockClient = { sessionId: 'session-123' } as Client;

      room.onJoin(mockClient, {});

      const player = room.state.players.get('session-123');
      expect(player?.name).toBe('Player');
    });

    it('should handle multiple players joining', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.players.size).toBe(2);
    });

    it('should reject players when room is full', () => {
      const clients = [
        { sessionId: 'session-1' } as Client,
        { sessionId: 'session-2' } as Client,
        { sessionId: 'session-3' } as Client,
        { sessionId: 'session-4' } as Client,
        { sessionId: 'session-5' } as Client,
      ];

      // Join max players (4)
      clients.slice(0, 4).forEach((client, index) => {
        room.onJoin(client, { name: `Player${index + 1}` });
      });

      expect(room.state.players.size).toBe(4);

      // Try to join 5th player - should throw
      expect(() => {
        room.onJoin(clients[4], { name: 'Player5' });
      }).toThrow('Room is full');
    });

    it('should start game when minPlayers is reached', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      const startGameSpy = jest.spyOn(room as any, 'startGame');

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      // startGame should be called after reaching minPlayers
      expect(startGameSpy).toHaveBeenCalled();
    });
  });

  describe('onLeave', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should remove player from state when consented', () => {
      const mockClient = { sessionId: 'session-123' } as Client;
      room.onJoin(mockClient, { name: 'Alice' });

      room.onLeave(mockClient, true);

      expect(room.state.players.size).toBe(0);
    });

    it('should remove player when not consented', () => {
      const mockClient = { sessionId: 'session-123' } as Client;
      room.onJoin(mockClient, { name: 'Alice' });

      room.onLeave(mockClient, false);

      expect(room.state.players.size).toBe(0);
    });

    it('should handle leaving when player does not exist', () => {
      const mockClient = { sessionId: 'session-999' } as Client;

      expect(() => room.onLeave(mockClient, true)).not.toThrow();
    });

    it('should only remove the specific player', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      room.onLeave(mockClient1, true);

      expect(room.state.players.size).toBe(1);
      expect(room.state.players.get('session-456')).toBeDefined();
    });

    it('should end game if too few players remain during active game', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      // Set game to playing status
      room.state.setStatus('playing');

      const endGameSpy = jest.spyOn(room as any, 'endGame');

      room.onLeave(mockClient1, true);

      expect(endGameSpy).toHaveBeenCalled();
    });
  });

  describe('onDispose', () => {
    it('should clean up resources', () => {
      room.onCreate({});

      expect(() => room.onDispose()).not.toThrow();
    });

    it('should handle dispose when not initialized', () => {
      expect(() => room.onDispose()).not.toThrow();
    });
  });

  describe('abstract methods enforcement', () => {
    it('should require gameType to be defined', () => {
      expect(room.gameType).toBe('test');
    });

    it('should require minPlayers to be defined', () => {
      expect(room.minPlayers).toBe(2);
    });

    it('should require maxPlayers to be defined', () => {
      expect(room.maxPlayers).toBe(4);
    });

    it('should require createGameEngine to be implemented', () => {
      const engine = room.createGameEngine();
      expect(engine).toBeDefined();
    });

    it('should require onGameStart to be implemented', () => {
      expect(() => room.onGameStart()).not.toThrow();
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should set status to playing', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.status).toBe('playing');
    });

    it('should set startedAt timestamp', () => {
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      const beforeTime = Date.now();

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      const afterTime = Date.now();

      expect(room.state.startedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(room.state.startedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should call onGameStart hook', () => {
      const onGameStartSpy = jest.spyOn(room, 'onGameStart');
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(onGameStartSpy).toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      room.onCreate({});
      const mockClient1 = { sessionId: 'session-123' } as Client;
      const mockClient2 = { sessionId: 'session-456' } as Client;
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });
    });

    it('should set status to completed', () => {
      room['endGame']('session-123');

      expect(room.state.status).toBe('completed');
    });

    it('should set winner when provided', () => {
      room['endGame']('session-123');

      expect(room.state.winner).toBe('session-123');
    });

    it('should handle no winner (draw)', () => {
      room['endGame'](null);

      expect(room.state.winner).toBeNull();
      expect(room.state.status).toBe('completed');
    });

    it('should set endedAt timestamp', () => {
      const beforeTime = Date.now();

      room['endGame']('session-123');

      const afterTime = Date.now();

      expect(room.state.endedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(room.state.endedAt).toBeLessThanOrEqual(afterTime);
    });
  });
});
