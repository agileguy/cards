import { SnapGameState, SnapCard } from '../../../src/schemas/SnapGameState';
import { GamePlayer } from '../../../src/schemas/GamePlayer';

describe('SnapGameState', () => {
  let state: SnapGameState;
  let player1: GamePlayer;
  let player2: GamePlayer;

  beforeEach(() => {
    state = new SnapGameState();
    player1 = new GamePlayer('session-1', 'Alice');
    player2 = new GamePlayer('session-2', 'Bob');
    state.addPlayer(player1);
    state.addPlayer(player2);
  });

  describe('initialization', () => {
    it('should inherit BaseGameState properties', () => {
      expect(state.players.size).toBe(2);
      expect(state.status).toBe('waiting');
    });

    it('should initialize with empty central pile', () => {
      expect(state.centralPile.length).toBe(0);
    });

    it('should initialize with empty player hands', () => {
      expect(state.playerHands.size).toBe(0);
    });

    it('should initialize with no current turn', () => {
      expect(state.currentTurn).toBeNull();
    });

    it('should initialize with snapAvailable false', () => {
      expect(state.snapAvailable).toBe(false);
    });

    it('should initialize with null lastSnapAttempt', () => {
      expect(state.lastSnapAttempt).toBeNull();
    });
  });

  describe('addToPile', () => {
    it('should add card to central pile', () => {
      const card = new SnapCard('hearts', 5);

      const hasMatch = state.addToPile(card);

      expect(state.centralPile.length).toBe(1);
      expect(state.centralPile[0].suit).toBe('hearts');
      expect(state.centralPile[0].rank).toBe(5);
      expect(hasMatch).toBe(false);
    });

    it('should detect match when two consecutive cards have same rank', () => {
      state.addToPile(new SnapCard('hearts', 5));
      const hasMatch = state.addToPile(new SnapCard('clubs', 5));

      expect(hasMatch).toBe(true);
      expect(state.snapAvailable).toBe(true);
      expect(state.centralPile.length).toBe(2);
    });

    it('should not detect match with different ranks', () => {
      state.addToPile(new SnapCard('hearts', 5));
      const hasMatch = state.addToPile(new SnapCard('clubs', 7));

      expect(hasMatch).toBe(false);
      expect(state.snapAvailable).toBe(false);
    });

    it('should only check last two cards for match', () => {
      state.addToPile(new SnapCard('hearts', 3));
      state.addToPile(new SnapCard('clubs', 5));
      const hasMatch = state.addToPile(new SnapCard('diamonds', 3));

      expect(hasMatch).toBe(false);
      expect(state.snapAvailable).toBe(false);
    });

    it('should handle first card (no match possible)', () => {
      const hasMatch = state.addToPile(new SnapCard('hearts', 5));

      expect(hasMatch).toBe(false);
      expect(state.snapAvailable).toBe(false);
    });
  });

  describe('handleSnap', () => {
    beforeEach(() => {
      // Set up a match scenario
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 5));
    });

    it('should return success when snap is valid', () => {
      const result = state.handleSnap('session-1');

      expect(result.success).toBe(true);
      expect(result.winnerId).toBe('session-1');
      expect(result.cardsWon).toBe(2);
    });

    it('should award pile to correct player', () => {
      // Initialize player hands
      state.initializeHand('session-1', []);
      state.initializeHand('session-2', []);

      state.handleSnap('session-1');

      expect(state.getHandSize('session-1')).toBe(2);
      expect(state.centralPile.length).toBe(0);
    });

    it('should return failure when no match exists', () => {
      state = new SnapGameState();
      state.addPlayer(player1);
      state.addPlayer(player2);
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 7));

      const result = state.handleSnap('session-1');

      expect(result.success).toBe(false);
      expect(result.winnerId).toBeNull();
    });

    it('should penalize player on failed snap', () => {
      state = new SnapGameState();
      state.addPlayer(player1);
      state.addPlayer(player2);
      state.initializeHand('session-1', [new SnapCard('diamonds', 3)]);
      state.initializeHand('session-2', []);
      state.addToPile(new SnapCard('hearts', 5));
      state.addToPile(new SnapCard('clubs', 7));

      state.handleSnap('session-1');

      // Player should lose a card as penalty
      expect(state.getHandSize('session-1')).toBe(0);
      expect(state.centralPile.length).toBeGreaterThan(2);
    });

    it('should clear snapAvailable after successful snap', () => {
      state.initializeHand('session-1', []);
      state.handleSnap('session-1');

      expect(state.snapAvailable).toBe(false);
    });

    it('should track last snap attempt', () => {
      state.initializeHand('session-1', []);
      state.handleSnap('session-1');

      expect(state.lastSnapAttempt).toBe('session-1');
    });
  });

  describe('nextTurn', () => {
    it('should alternate between players', () => {
      state.currentTurn = 'session-1';

      state.nextTurn();

      expect(state.currentTurn).toBe('session-2');

      state.nextTurn();

      expect(state.currentTurn).toBe('session-1');
    });

    it('should handle null current turn', () => {
      state.currentTurn = null;

      expect(() => state.nextTurn()).not.toThrow();
    });

    it('should work with two players', () => {
      state.currentTurn = 'session-1';

      state.nextTurn();
      expect(state.currentTurn).toBe('session-2');

      state.nextTurn();
      expect(state.currentTurn).toBe('session-1');
    });
  });

  describe('getHandSize', () => {
    it('should return 0 for uninitialized hand', () => {
      expect(state.getHandSize('session-1')).toBe(0);
    });

    it('should return correct hand size', () => {
      state.initializeHand('session-1', [
        new SnapCard('hearts', 5),
        new SnapCard('clubs', 7),
      ]);

      expect(state.getHandSize('session-1')).toBe(2);
    });

    it('should update when cards are added', () => {
      state.initializeHand('session-1', []);
      const hand = state.playerHands.get('session-1');
      if (hand) {
        hand.push(new SnapCard('hearts', 5));
      }

      expect(state.getHandSize('session-1')).toBe(1);
    });
  });

  describe('initializeHand', () => {
    it('should create hand for player', () => {
      state.initializeHand('session-1', []);

      expect(state.playerHands.has('session-1')).toBe(true);
      expect(state.getHandSize('session-1')).toBe(0);
    });

    it('should initialize hand with cards', () => {
      const cards = [
        new SnapCard('hearts', 5),
        new SnapCard('clubs', 7),
        new SnapCard('diamonds', 10),
      ];

      state.initializeHand('session-1', cards);

      expect(state.getHandSize('session-1')).toBe(3);
    });

    it('should replace existing hand', () => {
      state.initializeHand('session-1', [new SnapCard('hearts', 5)]);
      state.initializeHand('session-1', []);

      expect(state.getHandSize('session-1')).toBe(0);
    });
  });

  describe('SnapCard schema', () => {
    it('should create card with suit and rank', () => {
      const card = new SnapCard('hearts', 5);

      expect(card.suit).toBe('hearts');
      expect(card.rank).toBe(5);
    });

    it('should support all suits', () => {
      const hearts = new SnapCard('hearts', 1);
      const diamonds = new SnapCard('diamonds', 2);
      const clubs = new SnapCard('clubs', 3);
      const spades = new SnapCard('spades', 4);

      expect(hearts.suit).toBe('hearts');
      expect(diamonds.suit).toBe('diamonds');
      expect(clubs.suit).toBe('clubs');
      expect(spades.suit).toBe('spades');
    });

    it('should support all ranks 1-13', () => {
      for (let rank = 1; rank <= 13; rank++) {
        const card = new SnapCard('hearts', rank);
        expect(card.rank).toBe(rank);
      }
    });

    it('should be serializable in ArraySchema', () => {
      state.addToPile(new SnapCard('hearts', 5));
      expect(state.centralPile[0]).toBeInstanceOf(SnapCard);
    });
  });

  describe('integration - game scenario', () => {
    it('should handle complete snap game flow', () => {
      // Initialize hands
      state.initializeHand('session-1', [
        new SnapCard('hearts', 5),
        new SnapCard('clubs', 7),
      ]);
      state.initializeHand('session-2', [
        new SnapCard('diamonds', 5),
        new SnapCard('spades', 9),
      ]);
      state.currentTurn = 'session-1';

      // Player 1 plays card
      const hand1 = state.playerHands.get('session-1');
      if (hand1) {
        const card1 = hand1.shift();
        if (card1) {
          state.addToPile(card1);
        }
      }
      state.nextTurn();

      expect(state.centralPile.length).toBe(1);
      expect(state.currentTurn).toBe('session-2');

      // Player 2 plays matching card
      const hand2 = state.playerHands.get('session-2');
      if (hand2) {
        const card2 = hand2.shift();
        if (card2) {
          const hasMatch = state.addToPile(card2);
          expect(hasMatch).toBe(true);
        }
      }

      // Player 2 snaps successfully
      const snapResult = state.handleSnap('session-2');
      expect(snapResult.success).toBe(true);
      expect(state.getHandSize('session-2')).toBe(3); // 1 remaining + 2 from pile
      expect(state.centralPile.length).toBe(0);
    });
  });
});
