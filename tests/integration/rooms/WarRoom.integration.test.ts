import { ColyseusTestServer, boot } from '@colyseus/testing';
import { WarRoom } from '../../../src/rooms/WarRoom';

describe('WarRoom Integration', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot({
      initializeGameServer: (gameServer) => {
        gameServer.define('war', WarRoom).filterBy(['matchId']);
      },
    });
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  describe('game initialization', () => {
    it('should allow two players to join and start game', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-1' });

      const client1 = await colyseus.connectTo(room, { name: 'Alice' });
      const client2 = await colyseus.connectTo(room, { name: 'Bob' });

      // Wait for game to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.status).toBe('playing');
      expect(room.state.players.size).toBe(2);
      expect(room.state.getHandSize(client1.sessionId)).toBe(26);
      expect(room.state.getHandSize(client2.sessionId)).toBe(26);

      await client1.leave();
      await client2.leave();
    });

    it('should initialize empty battle pile', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-2' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.battlePile.length).toBe(0);
      expect(room.state.playersReady.length).toBe(0);
      expect(room.state.inWar).toBe(false);
      expect(room.state.roundNumber).toBe(0);

      await client1.leave();
      await client2.leave();
    });
  });

  describe('flip_card action', () => {
    it('should handle first player flipping card', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-3' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const cardFlippedPromise = new Promise<any>((resolve) => {
        client1.onMessage('card_flipped', (message) => resolve(message));
      });

      await client1.send('flip_card', {});

      const message = await cardFlippedPromise;

      expect(message).toBeDefined();
      expect(message.playerId).toBe(client1.sessionId);
      expect(room.state.battlePile.length).toBe(1);
      expect(room.state.playersReady.length).toBe(1);

      await client1.leave();
      await client2.leave();
    });

    it('should resolve battle when both players flip', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-4' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const battleResolvedPromise = new Promise<any>((resolve) => {
        client1.onMessage('battle_resolved', (message) => resolve(message));
      });

      // Both players flip
      await client1.send('flip_card', {});
      await client2.send('flip_card', {});

      const message = await battleResolvedPromise;

      expect(message).toBeDefined();
      expect(message.roundNumber).toBe(1);
      expect(room.state.battlePile.length).toBe(0);
      expect(room.state.playersReady.length).toBe(0);

      await client1.leave();
      await client2.leave();
    });

    it('should prevent player from flipping twice in same round', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-5' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const errorPromise = new Promise<any>((resolve) => {
        client1.onMessage('error', (message) => resolve(message));
      });

      // First flip should succeed
      await client1.send('flip_card', {});

      // Second flip should fail
      await client1.send('flip_card', {});

      const errorMessage = await errorPromise;

      expect(errorMessage).toBeDefined();
      expect(errorMessage.message).toContain('Already flipped');

      await client1.leave();
      await client2.leave();
    });
  });

  describe('battle resolution', () => {
    it('should update hand sizes after battle', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-6' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const initialSize1 = room.state.getHandSize(client1.sessionId);
      const initialSize2 = room.state.getHandSize(client2.sessionId);

      await client1.send('flip_card', {});
      await client2.send('flip_card', {});

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newSize1 = room.state.getHandSize(client1.sessionId);
      const newSize2 = room.state.getHandSize(client2.sessionId);

      // One player should have more cards, one should have fewer
      expect(newSize1 + newSize2).toBe(initialSize1 + initialSize2);
      expect(newSize1).not.toBe(initialSize1);
      expect(newSize2).not.toBe(initialSize2);

      await client1.leave();
      await client2.leave();
    });

    it('should increment round number after battle', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-7' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.roundNumber).toBe(0);

      await client1.send('flip_card', {});
      await client2.send('flip_card', {});

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.roundNumber).toBe(1);

      await client1.leave();
      await client2.leave();
    });
  });

  describe('game over', () => {
    it('should detect game over when player has no cards', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-8' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Manually set one player to have no cards (for testing)
      const state = room.state as any;
      state.initializeHand(client1.sessionId, []);

      // Check if game over is detected
      const isGameOver = (room as any).gameEngine.isGameOver(state);
      expect(isGameOver).toBe(true);

      const winner = (room as any).gameEngine.getWinner(state);
      expect(winner).toBe(client2.sessionId);

      await client1.leave();
      await client2.leave();
    });
  });

  describe('disconnect handling', () => {
    it('should handle player disconnect gracefully', async () => {
      const room = await colyseus.createRoom('war', { matchId: 'test-9' });

      const client1 = await colyseus.connectTo(room, { name: 'Player1' });
      const client2 = await colyseus.connectTo(room, { name: 'Player2' });

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.players.size).toBe(2);

      // Disconnect one player
      await client1.leave();

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(room.state.players.size).toBe(1);

      await client2.leave();
    });
  });
});
