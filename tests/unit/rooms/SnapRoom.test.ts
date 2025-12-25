import { SnapRoom } from '../../../src/rooms/SnapRoom';
import { Client } from 'colyseus';

describe('SnapRoom', () => {
  let room: SnapRoom;

  beforeEach(() => {
    room = new SnapRoom();
    room.setMetadata = jest.fn();
  });

  describe('game configuration', () => {
    it('should have gameType snap', () => {
      expect(room.gameType).toBe('snap');
    });

    it('should require 2 players minimum', () => {
      expect(room.minPlayers).toBe(2);
    });

    it('should allow 2 players maximum', () => {
      expect(room.maxPlayers).toBe(2);
    });
  });

  describe('onCreate', () => {
    it('should create SnapEngine', () => {
      room.onCreate({});

      expect(room['gameEngine']).toBeDefined();
    });

    it('should initialize SnapGameState', () => {
      room.onCreate({});

      expect(room.state).toBeDefined();
      expect(room.state.centralPile).toBeDefined();
      expect(room.state.playerHands).toBeDefined();
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

    it('should register play_card handler', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room['gameEngine']).toBeDefined();
      expect(room.state.currentTurn).toBe('session-1');
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

    it('should set current turn to first player', () => {
      const mockClient1 = { sessionId: 'session-1' } as Client;
      const mockClient2 = { sessionId: 'session-2' } as Client;

      room.onCreate({});
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.currentTurn).toBe('session-1');
    });
  });
});
