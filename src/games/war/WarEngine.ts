import {
  IGameEngine,
  GameAction,
  ActionResult,
  ValidationResult,
} from '../IGameEngine';
import { WarGameState, WarCard } from '../../schemas/WarGameState';
import { GamePlayer } from '../../schemas/GamePlayer';
import { Deck } from '../../utils/Deck';
import { createLogger } from '../../utils/logger';

const log = createLogger('war-engine');

export class WarEngine implements IGameEngine<WarGameState> {
  private state: WarGameState;

  constructor() {
    this.state = new WarGameState();
  }

  /**
   * Initialize game with players and deal cards
   * IMPORTANT: Modifies the passed state in place to avoid schema ownership issues
   */
  initialize(players: GamePlayer[]): WarGameState {
    log('Initializing War game', { playerCount: players.length });

    // Don't create new state, use the one we have
    if (!this.state) {
      this.state = new WarGameState();
    }

    // Add players to state if not already there
    players.forEach((player) => {
      if (!this.state.players.has(player.sessionId)) {
        this.state.addPlayer(player);
      }
    });

    // Create and shuffle deck
    const deck = new Deck();
    deck.shuffle();

    // Deal cards to players
    const playerIds = players.map((p) => p.sessionId);
    const hands = this.dealCards(deck, playerIds);

    // Initialize player hands directly in the state
    playerIds.forEach((sessionId) => {
      const cards = hands.get(sessionId) || [];
      const warCards = cards.map(
        (card) => new WarCard(card.suit, card.rank, false)
      );
      this.state.initializeHand(sessionId, warCards);
    });

    // Initialize roundNumber
    this.state.roundNumber = 0;

    log('War game initialized', {
      players: playerIds,
      handSizes: playerIds.map((id) => this.state.getHandSize(id)),
    });

    return this.state;
  }

  /**
   * Deal cards evenly to all players
   */
  private dealCards(deck: Deck, playerIds: string[]): Map<string, any[]> {
    const hands = new Map<string, any[]>();
    playerIds.forEach((id) => hands.set(id, []));

    let currentPlayerIndex = 0;
    while (!deck.isEmpty()) {
      const card = deck.drawOne();
      if (card) {
        const playerId = playerIds[currentPlayerIndex];
        const hand = hands.get(playerId);
        if (hand) {
          hand.push(card);
        }
        currentPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      }
    }

    return hands;
  }

  /**
   * Process a game action
   */
  processAction(
    state: WarGameState,
    action: GameAction
  ): ActionResult<WarGameState> {
    log('Processing action', { type: action.type, playerId: action.playerId });

    if (action.type === 'FLIP_CARD') {
      return this.handleFlipCard(state, action.playerId);
    }

    return {
      success: false,
      newState: state,
      error: `Unknown action type: ${action.type}`,
    };
  }

  /**
   * Handle flipping a card
   */
  private handleFlipCard(
    state: WarGameState,
    playerId: string
  ): ActionResult<WarGameState> {
    const hand = state.playerHands.get(playerId);

    if (!hand || hand.length === 0) {
      return {
        success: false,
        newState: state,
        error: 'No cards in hand',
      };
    }

    // Draw card from top of hand
    const card = hand.shift();
    if (!card) {
      return {
        success: false,
        newState: state,
        error: 'Failed to draw card',
      };
    }

    // Set card face up (normal battle)
    card.faceUp = true;

    // Add to battle pile
    state.addToBattlePile(card);

    // Mark player ready
    state.markPlayerReady(playerId);

    log('Card flipped', {
      playerId,
      card: { suit: card.suit, rank: card.rank },
      battlePileSize: state.battlePile.length,
      bothReady: state.areBothPlayersReady(),
    });

    // Check if both players have flipped
    if (state.areBothPlayersReady()) {
      this.resolveBattle(state);
    }

    return {
      success: true,
      newState: state,
    };
  }

  /**
   * Resolve battle between two flipped cards
   */
  private resolveBattle(state: WarGameState): void {
    log('Resolving battle', { battlePileSize: state.battlePile.length });

    const players = Array.from(state.players.keys());

    // Get last card from each player (their face-up card)
    const player1Cards = this.getPlayerBattleCards(state, players[0]);
    const player2Cards = this.getPlayerBattleCards(state, players[1]);

    if (player1Cards.length === 0 || player2Cards.length === 0) {
      log.error('No cards in battle for one player');
      return;
    }

    const card1 = player1Cards[player1Cards.length - 1];
    const card2 = player2Cards[player2Cards.length - 1];

    log('Comparing cards', {
      player1: { rank: card1.rank, suit: card1.suit },
      player2: { rank: card2.rank, suit: card2.suit },
    });

    if (card1.rank > card2.rank) {
      log('Player 1 wins battle');
      this.awardBattlePile(state, players[0]);
    } else if (card2.rank > card1.rank) {
      log('Player 2 wins battle');
      this.awardBattlePile(state, players[1]);
    } else {
      log('WAR! Ranks match');
      this.handleWar(state);
      return; // War will handle cleanup
    }

    // Cleanup after normal battle
    state.roundNumber++;
    state.clearPlayersReady();
  }

  /**
   * Get all cards in battle pile belonging to this player
   * Cards are interleaved (player1, player2, player1, player2, ...)
   */
  private getPlayerBattleCards(state: WarGameState, playerId: string): WarCard[] {
    const players = Array.from(state.players.keys());
    const playerIndex = players.indexOf(playerId);

    const cards: WarCard[] = [];
    for (let i = playerIndex; i < state.battlePile.length; i += 2) {
      cards.push(state.battlePile[i]);
    }

    return cards;
  }

  /**
   * Award all battle pile cards to the winner
   */
  private awardBattlePile(state: WarGameState, winnerId: string): void {
    log('Awarding battle pile to', winnerId, {
      cardsWon: state.battlePile.length,
    });

    const winnerHand = state.playerHands.get(winnerId);
    if (!winnerHand) {
      log.error('Winner hand not found');
      return;
    }

    // Add all battle pile cards to bottom of winner's hand
    state.battlePile.forEach((card) => {
      winnerHand.push(card);
    });

    // Clear battle pile
    state.clearBattlePile();

    log('Battle pile awarded', {
      winnerId,
      newHandSize: state.getHandSize(winnerId),
    });
  }

  /**
   * Handle WAR mechanism
   * When ranks match, each player plays 3 face-down cards + 1 face-up card
   * Winner of face-up battle takes all cards
   * Supports nested wars (matching ranks during war)
   */
  private handleWar(state: WarGameState): void {
    log('WAR! Ranks matched, starting war mechanism');

    state.inWar = true;
    state.warDepth++;

    const players = Array.from(state.players.keys());

    // Check if both players have enough cards for war (need 4: 3 face-down + 1 face-up)
    const player1Hand = state.playerHands.get(players[0]);
    const player2Hand = state.playerHands.get(players[1]);

    if (!player1Hand || !player2Hand) {
      log.error('Player hand not found during war');
      state.inWar = false;
      state.warDepth--;
      return;
    }

    // If either player has insufficient cards, they lose immediately
    if (player1Hand.length < 4) {
      log('Player 1 has insufficient cards for war, Player 2 wins');
      this.awardBattlePile(state, players[1]);
      // Also give remaining cards from player 1 to player 2
      while (player1Hand.length > 0) {
        const card = player1Hand.shift();
        if (card) {
          player2Hand.push(card);
        }
      }
      state.inWar = false;
      state.warDepth--;
      state.roundNumber++;
      state.clearPlayersReady();
      return;
    }

    if (player2Hand.length < 4) {
      log('Player 2 has insufficient cards for war, Player 1 wins');
      this.awardBattlePile(state, players[0]);
      // Also give remaining cards from player 2 to player 1
      while (player2Hand.length > 0) {
        const card = player2Hand.shift();
        if (card) {
          player1Hand.push(card);
        }
      }
      state.inWar = false;
      state.warDepth--;
      state.roundNumber++;
      state.clearPlayersReady();
      return;
    }

    // Both players have enough cards, proceed with war
    log('Both players have enough cards, proceeding with war');

    // Each player plays 3 face-down cards
    for (let i = 0; i < 3; i++) {
      const card1 = player1Hand.shift();
      const card2 = player2Hand.shift();

      if (card1 && card2) {
        card1.faceUp = false; // Face-down
        card2.faceUp = false; // Face-down
        state.addToBattlePile(card1);
        state.addToBattlePile(card2);
      }
    }

    // Each player plays 1 face-up card
    const faceUpCard1 = player1Hand.shift();
    const faceUpCard2 = player2Hand.shift();

    if (faceUpCard1 && faceUpCard2) {
      faceUpCard1.faceUp = true;
      faceUpCard2.faceUp = true;
      state.addToBattlePile(faceUpCard1);
      state.addToBattlePile(faceUpCard2);
    }

    log('War cards played, resolving battle', {
      battlePileSize: state.battlePile.length,
      warDepth: state.warDepth,
    });

    // Reset war state before recursion
    state.inWar = false;
    state.warDepth--;

    // Recursively resolve the battle (may trigger another war)
    this.resolveBattle(state);
  }

  /**
   * Validate if an action is legal
   */
  validateAction(state: WarGameState, action: GameAction): ValidationResult {
    if (action.type === 'FLIP_CARD') {
      const hand = state.playerHands.get(action.playerId);
      if (!hand || hand.length === 0) {
        return {
          valid: false,
          error: 'No cards in hand',
        };
      }

      // Check if player already flipped this round
      if (state.playersReady.includes(action.playerId)) {
        return {
          valid: false,
          error: 'Already flipped this round',
        };
      }

      return { valid: true };
    }

    return {
      valid: false,
      error: `Unknown action type: ${action.type}`,
    };
  }

  /**
   * Check if game has ended
   * Stub for now - will be implemented in Commit 10
   */
  isGameOver(state: WarGameState): boolean {
    // Stub implementation
    return false;
  }

  /**
   * Get the winner (player with all cards)
   * Stub for now - will be implemented in Commit 10
   */
  getWinner(state: WarGameState): string | null {
    // Stub implementation
    return null;
  }

  /**
   * Get current game state
   */
  getGameState(): WarGameState {
    return this.state;
  }
}
