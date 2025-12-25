import { Matchmaker, MatchResult } from '../../../src/utils/Matchmaker';
import { LobbyState } from '../../../src/schemas/LobbyState';
import { Player } from '../../../src/schemas/Player';

describe('Matchmaker', () => {
  let matchmaker: Matchmaker;
  let lobbyState: LobbyState;

  beforeEach(() => {
    matchmaker = new Matchmaker(30000);
    lobbyState = new LobbyState();
  });

  describe('constructor', () => {
    it('should create with default timeout of 30000ms', () => {
      const mm = new Matchmaker();
      expect(mm).toBeDefined();
    });

    it('should create with custom timeout', () => {
      const mm = new Matchmaker(60000);
      expect(mm).toBeDefined();
    });
  });

  describe('findMatch', () => {
    it('should return null when no players', () => {
      const match = matchmaker.findMatch(lobbyState);

      expect(match).toBeNull();
    });

    it('should return null with only one player', () => {
      const player1 = new Player('session-123', 'Alice');
      lobbyState.addPlayer(player1);

      const match = matchmaker.findMatch(lobbyState);

      expect(match).toBeNull();
    });

    it('should return match with two waiting players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const match = matchmaker.findMatch(lobbyState);

      expect(match).not.toBeNull();
      expect(match?.matchId).toBeDefined();
      expect(match?.player1SessionId).toBe('session-123');
      expect(match?.player2SessionId).toBe('session-456');
      expect(match?.matchedAt).toBeGreaterThan(0);
    });

    it('should follow FIFO order (oldest players first)', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      // Add players in order
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      // Manually set joinedAt to ensure order
      player1.joinedAt = Date.now() - 3000;
      player2.joinedAt = Date.now() - 2000;
      player3.joinedAt = Date.now() - 1000;

      const match = matchmaker.findMatch(lobbyState);

      expect(match?.player1SessionId).toBe('session-123');
      expect(match?.player2SessionId).toBe('session-456');
    });

    it('should exclude non-waiting players from matching', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      player1.setStatus('matched');

      const match = matchmaker.findMatch(lobbyState);

      expect(match?.player1SessionId).toBe('session-456');
      expect(match?.player2SessionId).toBe('session-789');
    });

    it('should exclude timed out players from matching', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      // Make player1 timed out (31 seconds ago, timeout is 30s)
      player1.joinedAt = Date.now() - 31000;
      player2.joinedAt = Date.now() - 2000;
      player3.joinedAt = Date.now() - 1000;

      const match = matchmaker.findMatch(lobbyState);

      expect(match?.player1SessionId).toBe('session-456');
      expect(match?.player2SessionId).toBe('session-789');
    });

    it('should return null when only one valid player remaining', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      player1.setStatus('matched');

      const match = matchmaker.findMatch(lobbyState);

      expect(match).toBeNull();
    });

    it('should generate unique matchIds for different matches', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const match1 = matchmaker.findMatch(lobbyState);

      // Add new players for second match
      const player3 = new Player('session-789', 'Charlie');
      const player4 = new Player('session-101', 'Dave');
      lobbyState.addPlayer(player3);
      lobbyState.addPlayer(player4);

      const match2 = matchmaker.findMatch(lobbyState);

      expect(match1?.matchId).not.toBe(match2?.matchId);
    });

    it('should set matchedAt timestamp to current time', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const before = Date.now();
      const match = matchmaker.findMatch(lobbyState);
      const after = Date.now();

      expect(match?.matchedAt).toBeGreaterThanOrEqual(before);
      expect(match?.matchedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getTimedOutPlayers', () => {
    it('should return empty array when no players', () => {
      const timedOut = matchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toEqual([]);
    });

    it('should return empty array when no timed out players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const timedOut = matchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toEqual([]);
    });

    it('should detect timed out players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      // Make player1 timed out
      player1.joinedAt = Date.now() - 31000;

      const timedOut = matchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toHaveLength(1);
      expect(timedOut).toContain('session-123');
    });

    it('should detect multiple timed out players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      const player3 = new Player('session-789', 'Charlie');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);
      lobbyState.addPlayer(player3);

      // Make player1 and player3 timed out
      player1.joinedAt = Date.now() - 31000;
      player3.joinedAt = Date.now() - 32000;

      const timedOut = matchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toHaveLength(2);
      expect(timedOut).toContain('session-123');
      expect(timedOut).toContain('session-789');
    });

    it('should only check waiting players', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      // Make both timed out but player2 is matched
      player1.joinedAt = Date.now() - 31000;
      player2.joinedAt = Date.now() - 32000;
      player2.setStatus('matched');

      const timedOut = matchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toHaveLength(1);
      expect(timedOut).toContain('session-123');
    });
  });

  describe('custom timeout', () => {
    it('should respect custom timeout value', () => {
      const customMatchmaker = new Matchmaker(10000); // 10 seconds
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');

      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      // 11 seconds ago - timed out with 10s timeout
      player1.joinedAt = Date.now() - 11000;
      // 9 seconds ago - not timed out with 10s timeout
      player2.joinedAt = Date.now() - 9000;

      const timedOut = customMatchmaker.getTimedOutPlayers(lobbyState);

      expect(timedOut).toHaveLength(1);
      expect(timedOut).toContain('session-123');
    });
  });

  describe('MatchResult interface', () => {
    it('should return properly structured MatchResult', () => {
      const player1 = new Player('session-123', 'Alice');
      const player2 = new Player('session-456', 'Bob');
      lobbyState.addPlayer(player1);
      lobbyState.addPlayer(player2);

      const match = matchmaker.findMatch(lobbyState) as MatchResult;

      expect(match).toHaveProperty('matchId');
      expect(match).toHaveProperty('player1SessionId');
      expect(match).toHaveProperty('player2SessionId');
      expect(match).toHaveProperty('matchedAt');

      expect(typeof match.matchId).toBe('string');
      expect(typeof match.player1SessionId).toBe('string');
      expect(typeof match.player2SessionId).toBe('string');
      expect(typeof match.matchedAt).toBe('number');
    });
  });
});
