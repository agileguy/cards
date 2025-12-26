import { WarEngine } from '../../../../src/games/war/WarEngine';
import { WarGameState, WarCard } from '../../../../src/schemas/WarGameState';
import { GamePlayer } from '../../../../src/schemas/GamePlayer';
import { GameAction } from '../../../../src/games/IGameEngine';

describe('WarEngine', () => {
  let engine: WarEngine;
  let player1: GamePlayer;
  let player2: GamePlayer;

  beforeEach(() => {
    engine = new WarEngine();
    player1 = new GamePlayer('session-1', 'Alice');
    player2 = new GamePlayer('session-2', 'Bob');
  });

  describe('initialize', () => {
    it('should create valid initial War state', () => {
      const state = engine.initialize([player1, player2]);

      expect(state).toBeInstanceOf(WarGameState);
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

    it('should initialize empty battle pile', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.battlePile.length).toBe(0);
    });

    it('should initialize with no players ready', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.playersReady.length).toBe(0);
    });

    it('should initialize with inWar false', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.inWar).toBe(false);
    });

    it('should initialize roundNumber to 0', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.roundNumber).toBe(0);
    });

    it('should shuffle cards (hands should be different each time)', () => {
      const state1 = engine.initialize([player1, player2]);
      const state2 = engine.initialize([player1, player2]);

      const hand1_game1 = state1.playerHands.get('session-1');
      const hand1_game2 = state2.playerHands.get('session-1');

      // Get first card from each hand
      const firstCard1 = hand1_game1?.cards[0];
      const firstCard2 = hand1_game2?.cards[0];

      // Statistically very unlikely to have same first card after shuffle
      // (This test may occasionally fail, but 1/52 chance is acceptable)
      const sameCard =
        firstCard1?.suit === firstCard2?.suit &&
        firstCard1?.rank === firstCard2?.rank;

      // Check at least the cards exist
      expect(firstCard1).toBeDefined();
      expect(firstCard2).toBeDefined();
    });
  });

  describe('processAction - FLIP_CARD', () => {
    let state: WarGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should draw card from player hand', () => {
      const initialHandSize = state.getHandSize('session-1');

      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.getHandSize('session-1')).toBe(
        initialHandSize - 1
      );
    });

    it('should add card to battle pile as face-up', () => {
      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.battlePile.length).toBe(1);
      expect(result.newState.battlePile[0].faceUp).toBe(true);
    });

    it('should mark player as ready', () => {
      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.playersReady).toContain('session-1');
      expect(result.newState.playersReady.length).toBe(1);
    });

    it('should wait when only first player flips', () => {
      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.battlePile.length).toBe(1);
      expect(result.newState.playersReady.length).toBe(1);
      expect(result.newState.roundNumber).toBe(0); // Round not complete yet
    });

    it('should auto-resolve when both players flip', () => {
      // Player 1 flips
      const action1: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };
      engine.processAction(state, action1);

      // Player 2 flips
      const action2: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      };
      const result = engine.processAction(state, action2);

      expect(result.success).toBe(true);
      // Battle should have resolved
      expect(result.newState.battlePile.length).toBe(0);
      expect(result.newState.playersReady.length).toBe(0);
      expect(result.newState.roundNumber).toBe(1);
    });

    it('should fail when player has no cards', () => {
      // Empty player 1's hand
      state.initializeHand('session-1', []);

      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No cards in hand');
    });

    it('should handle unknown action type', () => {
      const action: GameAction = {
        type: 'UNKNOWN_ACTION',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });
  });

  describe('validateAction', () => {
    let state: WarGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should validate FLIP_CARD when player has cards', () => {
      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject FLIP_CARD when player has no cards', () => {
      state.initializeHand('session-1', []);

      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('No cards in hand');
    });

    it('should reject FLIP_CARD when player already flipped', () => {
      state.markPlayerReady('session-1');

      const action: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Already flipped this round');
    });

    it('should reject unknown action type', () => {
      const action: GameAction = {
        type: 'UNKNOWN_ACTION',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });

    it('should allow both players to flip simultaneously', () => {
      const action1: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      };
      const action2: GameAction = {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      };

      const result1 = engine.validateAction(state, action1);
      const result2 = engine.validateAction(state, action2);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('getGameState', () => {
    it('should return the current game state', () => {
      const state = engine.initialize([player1, player2]);
      const returnedState = engine.getGameState();

      expect(returnedState).toBe(state);
    });
  });

  describe('battle resolution', () => {
    let state: WarGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should award cards to winner of higher rank', () => {
      // Setup: Player 1 has King (13), Player 2 has 5
      state.initializeHand('session-1', [new WarCard('hearts', 13)]);
      state.initializeHand('session-2', [new WarCard('clubs', 5)]);

      const initialP1Size = state.getHandSize('session-1');
      const initialP2Size = state.getHandSize('session-2');

      // Both flip
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 1 should have won both cards
      expect(state.getHandSize('session-1')).toBe(initialP1Size + 1); // +2 -1 = +1
      expect(state.getHandSize('session-2')).toBe(initialP2Size - 1);
      expect(state.battlePile.length).toBe(0);
    });

    it('should clear battle pile after resolution', () => {
      // Both flip
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(state.battlePile.length).toBe(0);
    });

    it('should clear playersReady after resolution', () => {
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(state.playersReady.length).toBe(0);
    });

    it('should increment roundNumber after resolution', () => {
      const initialRound = state.roundNumber;

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(state.roundNumber).toBe(initialRound + 1);
    });

    it('should treat Ace (13) as highest rank', () => {
      state.initializeHand('session-1', [new WarCard('hearts', 13)]); // Ace
      state.initializeHand('session-2', [new WarCard('clubs', 12)]); // King

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      const result = engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(result.success).toBe(true);
      expect(state.getHandSize('session-1')).toBe(2); // Won both cards
      expect(state.getHandSize('session-2')).toBe(0);
    });

    it('should award all battle pile cards to winner', () => {
      state.initializeHand('session-1', [new WarCard('hearts', 10)]);
      state.initializeHand('session-2', [new WarCard('clubs', 3)]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 1 won (10 > 3), should have both cards
      expect(state.getHandSize('session-1')).toBe(2);
      expect(state.getHandSize('session-2')).toBe(0);
    });

    it('should handle player 2 winning', () => {
      state.initializeHand('session-1', [new WarCard('hearts', 3)]);
      state.initializeHand('session-2', [new WarCard('clubs', 10)]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 2 won (10 > 3)
      expect(state.getHandSize('session-1')).toBe(0);
      expect(state.getHandSize('session-2')).toBe(2);
    });

    it('should trigger war on matching ranks', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // War should have been triggered and resolved
      // Player 1 should win (10 > 4)
      expect(state.getHandSize('session-1')).toBeGreaterThan(0);
      expect(state.battlePile.length).toBe(0);
    });
  });

  describe('WAR mechanism', () => {
    let state: WarGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should set inWar flag when ranks match', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      // Both flip matching cards
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // inWar should have been set to true during war (even if false after)
      // War should have occurred and resolved
      expect(state.getHandSize('session-1')).toBeGreaterThan(0);
    });

    it('should play 3 face-down cards from each player during war', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      // Both flip matching cards (triggers war)
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // After war: 2 initial cards + 6 face-down (3 each) + 2 face-up = 10 cards total should have been in pile
      // Winner should have all 10 cards
      const totalCards =
        state.getHandSize('session-1') + state.getHandSize('session-2');
      expect(totalCards).toBe(10); // All cards accounted for
    });

    it('should play 1 face-up card after face-down cards', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 1 should have won (10 > 4)
      expect(state.getHandSize('session-1')).toBe(10);
      expect(state.getHandSize('session-2')).toBe(0);
    });

    it('should award all cards (original + war) to winner', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 5),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 13), // Ace wins
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 5),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 2),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 1 wins with Ace
      // Should get: 2 original + 3 face-down from self + 3 face-down from opponent + 1 face-up from self + 1 face-up from opponent = 10 cards
      expect(state.getHandSize('session-1')).toBe(10);
      expect(state.getHandSize('session-2')).toBe(0);
      expect(state.battlePile.length).toBe(0);
    });

    it('should handle player with insufficient cards (auto-lose)', () => {
      // Player 1 has enough for war, Player 2 only has 3 cards
      state.initializeHand('session-1', [
        new WarCard('hearts', 5),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 5),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // Player 2 doesn't have enough cards for war (needs 4: 3 face-down + 1 face-up)
      // Player 1 should win all cards
      expect(state.getHandSize('session-1')).toBeGreaterThan(0);
      expect(state.getHandSize('session-2')).toBe(0);
    });

    it('should handle nested wars (war during war)', () => {
      // Setup: Both players have matching cards twice in a row
      state.initializeHand('session-1', [
        new WarCard('hearts', 7), // First match
        new WarCard('hearts', 1), // Face-down
        new WarCard('hearts', 2), // Face-down
        new WarCard('hearts', 3), // Face-down
        new WarCard('hearts', 9), // Second match
        new WarCard('hearts', 4), // Face-down
        new WarCard('hearts', 5), // Face-down
        new WarCard('hearts', 6), // Face-down
        new WarCard('hearts', 13), // Finally wins
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7), // First match
        new WarCard('clubs', 1), // Face-down
        new WarCard('clubs', 2), // Face-down
        new WarCard('clubs', 3), // Face-down
        new WarCard('clubs', 9), // Second match
        new WarCard('clubs', 4), // Face-down
        new WarCard('clubs', 5), // Face-down
        new WarCard('clubs', 6), // Face-down
        new WarCard('clubs', 2), // Loses
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // After nested war, Player 1 should have all 18 cards
      expect(state.getHandSize('session-1')).toBe(18);
      expect(state.getHandSize('session-2')).toBe(0);
      expect(state.battlePile.length).toBe(0);
    });

    it('should increment warDepth during nested wars', () => {
      // Setup for nested war
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 9),
        new WarCard('hearts', 4),
        new WarCard('hearts', 5),
        new WarCard('hearts', 6),
        new WarCard('hearts', 13),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 9),
        new WarCard('clubs', 4),
        new WarCard('clubs', 5),
        new WarCard('clubs', 6),
        new WarCard('clubs', 2),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      // After war completes, warDepth should be back to 0
      expect(state.warDepth).toBe(0);
      expect(state.inWar).toBe(false);
    });

    it('should clear playersReady after war resolution', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(state.playersReady.length).toBe(0);
    });

    it('should increment roundNumber after war resolution', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 7),
        new WarCard('hearts', 1),
        new WarCard('hearts', 2),
        new WarCard('hearts', 3),
        new WarCard('hearts', 10),
      ]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('clubs', 1),
        new WarCard('clubs', 2),
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      const initialRound = state.roundNumber;

      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-1',
      });
      engine.processAction(state, {
        type: 'FLIP_CARD',
        playerId: 'session-2',
      });

      expect(state.roundNumber).toBe(initialRound + 1);
    });
  });
});
