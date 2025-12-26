import { WarGameState, WarCard } from '../../../src/schemas/WarGameState';
import { GamePlayer } from '../../../src/schemas/GamePlayer';

describe('WarGameState', () => {
  let state: WarGameState;
  let player1: GamePlayer;
  let player2: GamePlayer;

  beforeEach(() => {
    state = new WarGameState();
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

    it('should initialize with empty battle pile', () => {
      expect(state.battlePile.length).toBe(0);
    });

    it('should initialize with empty player hands', () => {
      expect(state.playerHands.size).toBe(0);
    });

    it('should initialize with no players ready', () => {
      expect(state.playersReady.length).toBe(0);
    });

    it('should initialize with inWar false', () => {
      expect(state.inWar).toBe(false);
    });

    it('should initialize with warDepth 0', () => {
      expect(state.warDepth).toBe(0);
    });

    it('should initialize with roundNumber 0', () => {
      expect(state.roundNumber).toBe(0);
    });
  });

  describe('WarCard schema', () => {
    it('should create card with suit, rank, and faceUp', () => {
      const card = new WarCard('hearts', 5, true);

      expect(card.suit).toBe('hearts');
      expect(card.rank).toBe(5);
      expect(card.faceUp).toBe(true);
    });

    it('should default faceUp to false', () => {
      const card = new WarCard('clubs', 7);

      expect(card.faceUp).toBe(false);
    });

    it('should support all suits', () => {
      const hearts = new WarCard('hearts', 1);
      const diamonds = new WarCard('diamonds', 2);
      const clubs = new WarCard('clubs', 3);
      const spades = new WarCard('spades', 4);

      expect(hearts.suit).toBe('hearts');
      expect(diamonds.suit).toBe('diamonds');
      expect(clubs.suit).toBe('clubs');
      expect(spades.suit).toBe('spades');
    });

    it('should support all ranks 1-13', () => {
      for (let rank = 1; rank <= 13; rank++) {
        const card = new WarCard('hearts', rank);
        expect(card.rank).toBe(rank);
      }
    });

    it('should allow faceUp to be set', () => {
      const card = new WarCard('hearts', 5, false);
      card.faceUp = true;

      expect(card.faceUp).toBe(true);
    });

    it('should be serializable in ArraySchema', () => {
      state.addToBattlePile(new WarCard('hearts', 5, true));
      expect(state.battlePile[0]).toBeInstanceOf(WarCard);
    });
  });

  describe('addToBattlePile', () => {
    it('should add card to battle pile', () => {
      const card = new WarCard('hearts', 5, true);

      state.addToBattlePile(card);

      expect(state.battlePile.length).toBe(1);
      expect(state.battlePile[0].suit).toBe('hearts');
      expect(state.battlePile[0].rank).toBe(5);
      expect(state.battlePile[0].faceUp).toBe(true);
    });

    it('should add multiple cards to battle pile', () => {
      state.addToBattlePile(new WarCard('hearts', 5, true));
      state.addToBattlePile(new WarCard('clubs', 7, true));

      expect(state.battlePile.length).toBe(2);
    });

    it('should maintain card order', () => {
      state.addToBattlePile(new WarCard('hearts', 5, true));
      state.addToBattlePile(new WarCard('clubs', 7, false));
      state.addToBattlePile(new WarCard('diamonds', 10, true));

      expect(state.battlePile[0].rank).toBe(5);
      expect(state.battlePile[1].rank).toBe(7);
      expect(state.battlePile[2].rank).toBe(10);
    });

    it('should preserve faceUp state', () => {
      state.addToBattlePile(new WarCard('hearts', 5, true));
      state.addToBattlePile(new WarCard('clubs', 7, false));

      expect(state.battlePile[0].faceUp).toBe(true);
      expect(state.battlePile[1].faceUp).toBe(false);
    });
  });

  describe('clearBattlePile', () => {
    it('should clear all cards from battle pile', () => {
      state.addToBattlePile(new WarCard('hearts', 5, true));
      state.addToBattlePile(new WarCard('clubs', 7, true));

      state.clearBattlePile();

      expect(state.battlePile.length).toBe(0);
    });

    it('should work when battle pile is already empty', () => {
      expect(() => state.clearBattlePile()).not.toThrow();
      expect(state.battlePile.length).toBe(0);
    });
  });

  describe('markPlayerReady', () => {
    it('should add player to playersReady', () => {
      state.markPlayerReady('session-1');

      expect(state.playersReady.length).toBe(1);
      expect(state.playersReady[0]).toBe('session-1');
    });

    it('should track multiple players', () => {
      state.markPlayerReady('session-1');
      state.markPlayerReady('session-2');

      expect(state.playersReady.length).toBe(2);
      expect(state.playersReady).toContain('session-1');
      expect(state.playersReady).toContain('session-2');
    });

    it('should not duplicate player if already ready', () => {
      state.markPlayerReady('session-1');
      state.markPlayerReady('session-1');

      expect(state.playersReady.length).toBe(1);
    });
  });

  describe('clearPlayersReady', () => {
    it('should clear all players from playersReady', () => {
      state.markPlayerReady('session-1');
      state.markPlayerReady('session-2');

      state.clearPlayersReady();

      expect(state.playersReady.length).toBe(0);
    });

    it('should work when playersReady is already empty', () => {
      expect(() => state.clearPlayersReady()).not.toThrow();
      expect(state.playersReady.length).toBe(0);
    });
  });

  describe('areBothPlayersReady', () => {
    it('should return false when no players ready', () => {
      expect(state.areBothPlayersReady()).toBe(false);
    });

    it('should return false when only one player ready', () => {
      state.markPlayerReady('session-1');

      expect(state.areBothPlayersReady()).toBe(false);
    });

    it('should return true when both players ready', () => {
      state.markPlayerReady('session-1');
      state.markPlayerReady('session-2');

      expect(state.areBothPlayersReady()).toBe(true);
    });

    it('should return false after clearing', () => {
      state.markPlayerReady('session-1');
      state.markPlayerReady('session-2');
      state.clearPlayersReady();

      expect(state.areBothPlayersReady()).toBe(false);
    });
  });

  describe('war state tracking', () => {
    it('should start with inWar false', () => {
      expect(state.inWar).toBe(false);
    });

    it('should allow setting inWar to true', () => {
      state.inWar = true;

      expect(state.inWar).toBe(true);
    });

    it('should track warDepth', () => {
      expect(state.warDepth).toBe(0);

      state.warDepth = 1;
      expect(state.warDepth).toBe(1);

      state.warDepth = 2;
      expect(state.warDepth).toBe(2);
    });

    it('should allow resetting war state', () => {
      state.inWar = true;
      state.warDepth = 2;

      state.inWar = false;
      state.warDepth = 0;

      expect(state.inWar).toBe(false);
      expect(state.warDepth).toBe(0);
    });
  });

  describe('getHandSize', () => {
    it('should return 0 for uninitialized hand', () => {
      expect(state.getHandSize('session-1')).toBe(0);
    });

    it('should return correct hand size', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 5),
        new WarCard('clubs', 7),
      ]);

      expect(state.getHandSize('session-1')).toBe(2);
    });

    it('should update when cards are added', () => {
      state.initializeHand('session-1', []);
      const hand = state.playerHands.get('session-1');
      if (hand) {
        hand.push(new WarCard('hearts', 5));
      }

      expect(state.getHandSize('session-1')).toBe(1);
    });

    it('should update when cards are removed', () => {
      state.initializeHand('session-1', [
        new WarCard('hearts', 5),
        new WarCard('clubs', 7),
      ]);
      const hand = state.playerHands.get('session-1');
      if (hand) {
        hand.shift();
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
        new WarCard('hearts', 5),
        new WarCard('clubs', 7),
        new WarCard('diamonds', 10),
      ];

      state.initializeHand('session-1', cards);

      expect(state.getHandSize('session-1')).toBe(3);
    });

    it('should replace existing hand', () => {
      state.initializeHand('session-1', [new WarCard('hearts', 5)]);
      state.initializeHand('session-1', []);

      expect(state.getHandSize('session-1')).toBe(0);
    });

    it('should initialize both player hands', () => {
      state.initializeHand('session-1', [new WarCard('hearts', 5)]);
      state.initializeHand('session-2', [
        new WarCard('clubs', 7),
        new WarCard('diamonds', 10),
      ]);

      expect(state.getHandSize('session-1')).toBe(1);
      expect(state.getHandSize('session-2')).toBe(2);
    });
  });

  describe('roundNumber tracking', () => {
    it('should start with roundNumber 0', () => {
      expect(state.roundNumber).toBe(0);
    });

    it('should allow incrementing roundNumber', () => {
      state.roundNumber = 1;
      expect(state.roundNumber).toBe(1);

      state.roundNumber = 2;
      expect(state.roundNumber).toBe(2);
    });
  });

  describe('integration - war game scenario', () => {
    it('should handle simultaneous card flipping', () => {
      // Initialize hands
      state.initializeHand('session-1', [new WarCard('hearts', 10)]);
      state.initializeHand('session-2', [new WarCard('clubs', 5)]);

      // Both players flip cards
      const hand1 = state.playerHands.get('session-1');
      const hand2 = state.playerHands.get('session-2');

      const card1 = hand1?.shift();
      const card2 = hand2?.shift();

      if (card1) {
        card1.faceUp = true;
        state.addToBattlePile(card1);
        state.markPlayerReady('session-1');
      }

      if (card2) {
        card2.faceUp = true;
        state.addToBattlePile(card2);
        state.markPlayerReady('session-2');
      }

      // Check state
      expect(state.battlePile.length).toBe(2);
      expect(state.areBothPlayersReady()).toBe(true);
      expect(state.battlePile[0].faceUp).toBe(true);
      expect(state.battlePile[1].faceUp).toBe(true);
    });

    it('should handle war scenario setup', () => {
      // Initialize hands with enough cards for war
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
        new WarCard('clubs', 3),
        new WarCard('clubs', 4),
      ]);

      // Both players flip matching cards (triggers war)
      const hand1 = state.playerHands.get('session-1');
      const hand2 = state.playerHands.get('session-2');

      // First flip (match)
      const card1 = hand1?.shift();
      const card2 = hand2?.shift();

      if (card1 && card2) {
        card1.faceUp = true;
        card2.faceUp = true;
        state.addToBattlePile(card1);
        state.addToBattlePile(card2);
      }

      expect(card1?.rank).toBe(card2?.rank); // Match detected

      // Set war state
      state.inWar = true;
      state.warDepth = 1;

      // Play 3 face-down cards each
      for (let i = 0; i < 3; i++) {
        const downCard1 = hand1?.shift();
        const downCard2 = hand2?.shift();
        if (downCard1 && downCard2) {
          downCard1.faceUp = false;
          downCard2.faceUp = false;
          state.addToBattlePile(downCard1);
          state.addToBattlePile(downCard2);
        }
      }

      expect(state.battlePile.length).toBe(8); // 2 + (3*2)
      expect(state.inWar).toBe(true);
      expect(state.warDepth).toBe(1);
    });
  });
});
