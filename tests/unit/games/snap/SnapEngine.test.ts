import { SnapEngine } from '../../../../src/games/snap/SnapEngine';
import { SnapGameState, SnapCard } from '../../../../src/schemas/SnapGameState';
import { GamePlayer } from '../../../../src/schemas/GamePlayer';
import { GameAction } from '../../../../src/games/IGameEngine';

describe('SnapEngine', () => {
  let engine: SnapEngine;
  let player1: GamePlayer;
  let player2: GamePlayer;

  beforeEach(() => {
    engine = new SnapEngine();
    player1 = new GamePlayer('session-1', 'Alice');
    player2 = new GamePlayer('session-2', 'Bob');
  });

  describe('initialize', () => {
    it('should create valid initial Snap state', () => {
      const state = engine.initialize([player1, player2]);

      expect(state).toBeInstanceOf(SnapGameState);
      expect(state.players.size).toBe(2);
      expect(state.status).toBe('waiting');
    });

    it('should deal cards evenly to both players', () => {
      const state = engine.initialize([player1, player2]);

      const hand1Size = state.getHandSize('session-1');
      const hand2Size = state.getHandSize('session-2');

      expect(hand1Size).toBe(26); // 52 cards / 2 players
      expect(hand2Size).toBe(26);
    });

    it('should initialize empty central pile', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.centralPile.length).toBe(0);
    });

    it('should set first player as current turn', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.currentTurn).toBe('session-1');
    });

    it('should initialize snapAvailable to false', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.snapAvailable).toBe(false);
    });
  });

  describe('processAction - PLAY_CARD', () => {
    let state: SnapGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should add card to pile and switch turn', () => {
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.centralPile.length).toBe(1);
      expect(result.newState.currentTurn).toBe('session-2');
    });

    it('should reduce player hand size', () => {
      const initialHandSize = state.getHandSize('session-1');

      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.newState.getHandSize('session-1')).toBe(initialHandSize - 1);
    });

    it('should fail when player has no cards', () => {
      // Empty player 1's hand
      state.initializeHand('session-1', []);

      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No cards in hand');
    });

    it('should detect snap opportunity when ranks match', () => {
      // Set up a scenario where next cards will match
      const matchingCard = new SnapCard('hearts', 5);
      state.addToPile(matchingCard);
      state.initializeHand('session-1', [new SnapCard('clubs', 5)]);
      state.currentTurn = 'session-1';

      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.snapAvailable).toBe(true);
    });
  });

  describe('processAction - SNAP', () => {
    let state: SnapGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should award pile on correct snap', () => {
      // Create a match
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 5));
      const initialPileSize = state.centralPile.length;
      const initialHandSize = state.getHandSize('session-1');

      const action: GameAction = {
        type: 'SNAP',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.getHandSize('session-1')).toBe(
        initialHandSize + initialPileSize
      );
      expect(result.newState.centralPile.length).toBe(0);
    });

    it('should penalize player on incorrect snap', () => {
      // No match
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 7));
      const initialHandSize = state.getHandSize('session-1');

      const action: GameAction = {
        type: 'SNAP',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.newState.getHandSize('session-1')).toBe(initialHandSize - 1);
      expect(result.error).toContain('No match');
    });

    it('should handle snap when player has no cards to penalize', () => {
      state.initializeHand('session-1', []);
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 7));

      const action: GameAction = {
        type: 'SNAP',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.newState.getHandSize('session-1')).toBe(0);
    });
  });

  describe('validateAction', () => {
    let state: SnapGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should validate PLAY_CARD when it is player turn', () => {
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should invalidate PLAY_CARD when not player turn', () => {
      const action: GameAction = {
        type: 'PLAY_CARD',
        playerId: 'session-2',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Not your turn');
    });

    it('should validate SNAP when match exists', () => {
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 5));

      const action: GameAction = {
        type: 'SNAP',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should still validate SNAP when no match (penalty is handled in processing)', () => {
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 7));

      const action: GameAction = {
        type: 'SNAP',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      // Snap action is always valid to attempt, but may fail in processing
      expect(result.valid).toBe(true);
    });

    it('should invalidate unknown action types', () => {
      const action: GameAction = {
        type: 'UNKNOWN_ACTION',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('isGameOver', () => {
    let state: SnapGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return false when both players have cards', () => {
      expect(engine.isGameOver(state)).toBe(false);
    });

    it('should return true when one player has all cards', () => {
      // Give all cards to player 1
      state.initializeHand('session-1', [
        ...Array(52)
          .fill(null)
          .map(() => new SnapCard('hearts', 5)),
      ]);
      state.initializeHand('session-2', []);

      expect(engine.isGameOver(state)).toBe(true);
    });

    it('should return false when game just started', () => {
      expect(engine.isGameOver(state)).toBe(false);
    });
  });

  describe('getWinner', () => {
    let state: SnapGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return null when game is not over', () => {
      expect(engine.getWinner(state)).toBeNull();
    });

    it('should return player with all cards', () => {
      state.initializeHand('session-1', [
        ...Array(52)
          .fill(null)
          .map(() => new SnapCard('hearts', 5)),
      ]);
      state.initializeHand('session-2', []);

      expect(engine.getWinner(state)).toBe('session-1');
    });

    it('should return null when both players have cards', () => {
      expect(engine.getWinner(state)).toBeNull();
    });
  });

  describe('getGameState', () => {
    it('should return current game state', () => {
      const state = engine.initialize([player1, player2]);

      const retrievedState = engine.getGameState();

      expect(retrievedState).toBe(state);
    });
  });

  describe('integration - full game simulation', () => {
    it('should handle alternating plays until snap', () => {
      const state = engine.initialize([player1, player2]);

      // Play a few cards
      for (let i = 0; i < 5; i++) {
        const playerId = i % 2 === 0 ? 'session-1' : 'session-2';
        const action: GameAction = {
          type: 'PLAY_CARD',
          playerId,
        };

        const result = engine.processAction(state, action);
        expect(result.success).toBe(true);
      }

      expect(state.centralPile.length).toBe(5);
    });

    it('should handle complete snap cycle', () => {
      const state = engine.initialize([player1, player2]);

      // Set up a guaranteed match
      state.initializeHand('session-1', [new SnapCard('hearts', 5)]);
      state.addToPile(new SnapCard('clubs', 5));
      state.currentTurn = 'session-1';

      // Play matching card
      let result = engine.processAction(state, {
        type: 'PLAY_CARD',
        playerId: 'session-1',
      });
      expect(result.success).toBe(true);
      expect(state.snapAvailable).toBe(true);

      // Snap!
      result = engine.processAction(state, {
        type: 'SNAP',
        playerId: 'session-1',
      });
      expect(result.success).toBe(true);
      expect(state.centralPile.length).toBe(0);
      expect(state.getHandSize('session-1')).toBe(2); // Won 2 cards
    });
  });
});
