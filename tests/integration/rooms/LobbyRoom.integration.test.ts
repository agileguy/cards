import { ColyseusTestServer, boot } from '@colyseus/testing';
import { LobbyRoom } from '../../../src/rooms/LobbyRoom';

describe('LobbyRoom Integration', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot({
      initializeGameServer: (gameServer) => {
        gameServer.define('lobby', LobbyRoom);
      },
    });
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  describe('join_lobby message', () => {
    it('should handle player joining lobby', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      const joinedLobbyPromise = new Promise<any>((resolve) => {
        client.onMessage('joined_lobby', (message) => resolve(message));
      });

      await client.send('join_lobby', { name: 'Alice' });

      const message = await joinedLobbyPromise;

      expect(message).toBeDefined();
      expect(message.sessionId).toBe(client.sessionId);

      await client.leave();
    });

    it('should send waitingCount in joined_lobby message', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      const joinedLobbyPromise = new Promise<any>((resolve) => {
        client.onMessage('joined_lobby', (message) => resolve(message));
      });

      await client.send('join_lobby', { name: 'Alice' });

      const message = await joinedLobbyPromise;

      expect(message.waitingCount).toBeGreaterThanOrEqual(1);

      await client.leave();
    });
  });

  describe('leave_lobby message', () => {
    it('should handle player leaving lobby', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      const leftLobbyPromise = new Promise<any>((resolve) => {
        client.onMessage('left_lobby', (message) => resolve(message));
      });

      await client.send('join_lobby', { name: 'Alice' });
      await new Promise((resolve) => setTimeout(resolve, 100));

      await client.send('leave_lobby', {});

      const message = await leftLobbyPromise;

      expect(message).toBeDefined();

      await client.leave();
    });
  });

  describe('matchmaking', () => {
    it('should match two waiting players', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client1 = await colyseus.connectTo(room);
      const client2 = await colyseus.connectTo(room);

      const matchedPromise1 = new Promise<any>((resolve) => {
        client1.onMessage('matched', (message) => resolve(message));
      });

      const matchedPromise2 = new Promise<any>((resolve) => {
        client2.onMessage('matched', (message) => resolve(message));
      });

      await client1.send('join_lobby', { name: 'Alice' });
      await client2.send('join_lobby', { name: 'Bob' });

      const match1 = await matchedPromise1;
      const match2 = await matchedPromise2;

      expect(match1.matchId).toBeDefined();
      expect(match2.matchId).toBe(match1.matchId);
      expect(match1.opponentSessionId).toBe(client2.sessionId);
      expect(match2.opponentSessionId).toBe(client1.sessionId);

      await client1.leave();
      await client2.leave();
    });

    it('should remove matched players from waiting list', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client1 = await colyseus.connectTo(room);
      const client2 = await colyseus.connectTo(room);

      const matchedPromise = new Promise<void>((resolve) => {
        let count = 0;
        client1.onMessage('matched', () => {
          count++;
          if (count === 1) resolve();
        });
        client2.onMessage('matched', () => {
          count++;
          if (count === 1) resolve();
        });
      });

      await client1.send('join_lobby', { name: 'Alice' });
      await client2.send('join_lobby', { name: 'Bob' });

      await matchedPromise;

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check state after match
      const waitingCount = room.state.getWaitingCount();
      expect(waitingCount).toBe(0);

      await client1.leave();
      await client2.leave();
    });

    it('should not match a single player', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      let matchReceived = false;
      client.onMessage('matched', () => {
        matchReceived = true;
      });

      await client.send('join_lobby', { name: 'Alice' });

      // Wait a bit to ensure no match happens
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(matchReceived).toBe(false);

      await client.leave();
    });

    it('should continue matching with 3+ players', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client1 = await colyseus.connectTo(room);
      const client2 = await colyseus.connectTo(room);
      const client3 = await colyseus.connectTo(room);

      let client3Matched = false;
      const matchedPromise = new Promise<void>((resolve) => {
        let count = 0;
        client1.onMessage('matched', () => {
          count++;
          if (count >= 2) resolve();
        });
        client2.onMessage('matched', () => {
          count++;
          if (count >= 2) resolve();
        });
      });

      client3.onMessage('matched', () => {
        client3Matched = true;
      });

      await client1.send('join_lobby', { name: 'Alice' });
      await client2.send('join_lobby', { name: 'Bob' });
      await client3.send('join_lobby', { name: 'Charlie' });

      await matchedPromise;

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Client1 and Client2 should be matched, Client3 should not
      expect(client3Matched).toBe(false);

      // Client3 should still be waiting
      const player3 = room.state.waitingPlayers.get(client3.sessionId);
      expect(player3).toBeDefined();

      await client1.leave();
      await client2.leave();
      await client3.leave();
    });
  });

  describe('timeout handling', () => {
    it('should send timeout message to timed out players', async () => {
      jest.setTimeout(35000);

      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      const timeoutPromise = new Promise<any>((resolve) => {
        client.onMessage('timeout', (message) => resolve(message));
      });

      await client.send('join_lobby', { name: 'Alice' });

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually set player joinedAt to trigger timeout
      const player = room.state.waitingPlayers.get(client.sessionId);
      if (player) {
        player.joinedAt = Date.now() - 31000; // 31 seconds ago
      }

      // Wait for timeout check interval (5 seconds + buffer)
      const timeoutMessage = await timeoutPromise;

      expect(timeoutMessage).toBeDefined();
      expect(timeoutMessage.reason).toBe('No match found in time');

      await client.leave();
    });
  });

  describe('state synchronization', () => {
    it('should sync state to connected clients', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      await client.send('join_lobby', { name: 'Alice' });

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(room.state.waitingPlayers.size).toBeGreaterThan(0);
      expect(room.state.waitingPlayers.get(client.sessionId)).toBeDefined();

      await client.leave();
    });

    it('should update state when player leaves', async () => {
      const room = await colyseus.createRoom('lobby', {});
      const client = await colyseus.connectTo(room);

      await client.send('join_lobby', { name: 'Alice' });

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      await client.send('leave_lobby', {});

      // Wait for state sync
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(room.state.waitingPlayers.size).toBe(0);

      await client.leave();
    });
  });
});
