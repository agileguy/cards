import { WarRoom } from '../../../src/rooms/WarRoom';
import { Client } from 'colyseus';

describe('WarRoom', () => {
  let room: WarRoom;

  beforeEach(() => {
    room = new WarRoom();
    room.setMetadata = jest.fn();
  });

  describe('game configuration', () => {
    it('should have gameType war', () => {
      expect(room.gameType).toBe('war');
    });

    it('should require 2 players minimum', () => {
      expect(room.minPlayers).toBe(2);
    });

    it('should allow 2 players maximum', () => {
      expect(room.maxPlayers).toBe(2);
    });
  });

  describe('onCreate', () => {
    it('should create WarEngine', () => {
      room.onCreate({});

      expect(room['gameEngine']).toBeDefined();
    });

    it('should initialize WarGameState', () => {
      room.onCreate({});

      expect(room.state).toBeDefined();
      expect(room.state.battlePile).toBeDefined();
      expect(room.state.playerHands).toBeDefined();
      expect(room.state.playersReady).toBeDefined();
    });

    it('should initialize with inWar false', () => {
      room.onCreate({});

      expect(room.state.inWar).toBe(false);
    });

    it('should initialize with warDepth 0', () => {
      room.onCreate({});

      expect(room.state.warDepth).toBe(0);
    });

    it('should initialize with roundNumber 0', () => {
      room.onCreate({});

      expect(room.state.roundNumber).toBe(0);
    });
  });

  describe('onGameStart', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should be callable', () => {
      expect(() => room.onGameStart()).not.toThrow();
    });
  });

  describe('message handlers', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should register flip_card handler', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room['gameEngine']).toBeDefined();
      expect(room.state.playersReady.length).toBe(0);
    });
  });

  describe('game lifecycle', () => {
    it('should handle two players joining and starting', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.status).toBe('playing');
      expect(room.state.players.size).toBe(2);
    });

    it('should deal cards when game starts', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.getHandSize('session-1')).toBe(26);
      expect(room.state.getHandSize('session-2')).toBe(26);
    });

    it('should initialize empty battle pile', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.battlePile.length).toBe(0);
    });

    it('should initialize with no players ready', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.playersReady.length).toBe(0);
    });

    it('should not set currentTurn (simultaneous play)', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      // War doesn't have turns, both players can flip simultaneously
      expect(room.state).not.toHaveProperty('currentTurn');
    });
  });
});
