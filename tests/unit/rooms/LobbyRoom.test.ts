import { LobbyRoom } from '../../../src/rooms/LobbyRoom';
import { LobbyState } from '../../../src/schemas/LobbyState';

describe('LobbyRoom', () => {
  let room: LobbyRoom;

  beforeEach(() => {
    room = new LobbyRoom();
    // Mock setMetadata to prevent errors in unit tests
    room.setMetadata = jest.fn();
  });

  afterEach(() => {
    if (room['timeoutInterval']) {
      clearInterval(room['timeoutInterval']);
    }
  });

  describe('onCreate', () => {
    it('should initialize LobbyState', () => {
      room.onCreate({});

      expect(room.state).toBeInstanceOf(LobbyState);
    });

    it('should initialize Matchmaker', () => {
      room.onCreate({});

      expect(room['matchmaker']).toBeDefined();
    });

    it('should set up timeout interval', () => {
      room.onCreate({});

      expect(room['timeoutInterval']).toBeDefined();
    });

    it('should accept options parameter', () => {
      const options = { timeout: 60000 };

      expect(() => room.onCreate(options)).not.toThrow();
    });
  });

  describe('onJoin', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should add player to state', () => {
      const mockClient = { sessionId: 'session-123' } as any;

      room.onJoin(mockClient, { name: 'Alice' });

      expect(room.state.waitingPlayers.size).toBe(1);
      expect(room.state.waitingPlayers.get('session-123')).toBeDefined();
    });

    it('should use provided player name', () => {
      const mockClient = { sessionId: 'session-123' } as any;

      room.onJoin(mockClient, { name: 'Alice' });

      const player = room.state.waitingPlayers.get('session-123');
      expect(player?.name).toBe('Alice');
    });

    it('should use default name when not provided', () => {
      const mockClient = { sessionId: 'session-123' } as any;

      room.onJoin(mockClient, {});

      const player = room.state.waitingPlayers.get('session-123');
      expect(player?.name).toBe('Player');
    });

    it('should set player status to waiting', () => {
      const mockClient = { sessionId: 'session-123' } as any;

      room.onJoin(mockClient, { name: 'Alice' });

      const player = room.state.waitingPlayers.get('session-123');
      expect(player?.status).toBe('waiting');
    });

    it('should handle multiple players joining', () => {
      const mockClient1 = { sessionId: 'session-123' } as any;
      const mockClient2 = { sessionId: 'session-456' } as any;

      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      expect(room.state.waitingPlayers.size).toBe(2);
    });
  });

  describe('onLeave', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should remove player from state when consented', () => {
      const mockClient = { sessionId: 'session-123' } as any;
      room.onJoin(mockClient, { name: 'Alice' });

      room.onLeave(mockClient, true);

      expect(room.state.waitingPlayers.size).toBe(0);
    });

    it('should mark player as disconnected when not consented', () => {
      const mockClient = { sessionId: 'session-123' } as any;
      room.onJoin(mockClient, { name: 'Alice' });

      room.onLeave(mockClient, false);

      const player = room.state.waitingPlayers.get('session-123');
      expect(player?.status).toBe('disconnected');
    });

    it('should handle leaving when player does not exist', () => {
      const mockClient = { sessionId: 'session-999' } as any;

      expect(() => room.onLeave(mockClient, true)).not.toThrow();
    });

    it('should only remove the specific player', () => {
      const mockClient1 = { sessionId: 'session-123' } as any;
      const mockClient2 = { sessionId: 'session-456' } as any;
      room.onJoin(mockClient1, { name: 'Alice' });
      room.onJoin(mockClient2, { name: 'Bob' });

      room.onLeave(mockClient1, true);

      expect(room.state.waitingPlayers.size).toBe(1);
      expect(room.state.waitingPlayers.get('session-456')).toBeDefined();
    });
  });

  describe('onDispose', () => {
    it('should clear timeout interval', () => {
      room.onCreate({});
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      room.onDispose();

      expect(clearIntervalSpy).toHaveBeenCalledWith(room['timeoutInterval']);
    });

    it('should handle dispose when interval not set', () => {
      expect(() => room.onDispose()).not.toThrow();
    });
  });

  describe('handleTimeouts', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should be called periodically by interval', () => {
      // Wait for interval to trigger (default 5000ms, but we can test the setup)
      expect(room['timeoutInterval']).toBeDefined();
    });
  });

  describe('integration with Matchmaker', () => {
    beforeEach(() => {
      room.onCreate({});
    });

    it('should have matchmaker initialized after onCreate', () => {
      expect(room['matchmaker']).toBeDefined();
      expect(typeof room['matchmaker'].findMatch).toBe('function');
    });

    it('should have state accessible for matchmaking', () => {
      const mockClient = { sessionId: 'session-123' } as any;
      room.onJoin(mockClient, { name: 'Alice' });

      expect(room.state.getWaitingCount()).toBe(1);
    });
  });
});
