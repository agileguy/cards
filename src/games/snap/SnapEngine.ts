import { IGameEngine, GameAction, ActionResult, ValidationResult } from '../IGameEngine';
import { SnapGameState, SnapCard } from '../../schemas/SnapGameState';
import { GamePlayer } from '../../schemas/GamePlayer';
import { Deck } from '../../utils/Deck';
import { createLogger } from '../../utils/logger';

const log = createLogger('snap-engine');

export class SnapEngine implements IGameEngine<SnapGameState> {
  private state: SnapGameState;

  constructor() {
    this.state = new SnapGameState();
  }

  /**
   * Initialize game with players and deal cards
   * IMPORTANT: Modifies the passed state in place to avoid schema ownership issues
   */
  initialize(players: GamePlayer[]): SnapGameState {
    log('Initializing Snap game', { playerCount: players.length });

    // Don't create new state, use the one we have
    if (!this.state) {
      this.state = new SnapGameState();
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
      const snapCards = cards.map((card) => new SnapCard(card.suit, card.rank));
      this.state.initializeHand(sessionId, snapCards);
    });

    // Set first player's turn
    if (playerIds.length > 0) {
      this.state.currentTurn = playerIds[0];
    }

    log('Snap game initialized', {
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
  processAction(state: SnapGameState, action: GameAction): ActionResult<SnapGameState> {
    log('Processing action', { type: action.type, playerId: action.playerId });

    if (action.type === 'PLAY_CARD') {
      return this.handlePlayCard(state, action.playerId);
    }

    if (action.type === 'SNAP') {
      return this.handleSnap(state, action.playerId);
    }

    return {
      success: false,
      newState: state,
      error: `Unknown action type: ${action.type}`,
    };
  }

  /**
   * Handle playing a card
   */
  private handlePlayCard(state: SnapGameState, playerId: string): ActionResult<SnapGameState> {
    const hand = state.playerHands.get(playerId);

    if (!hand || hand.length === 0) {
      return {
        success: false,
        newState: state,
        error: 'No cards in hand',
      };
    }

    // Remove card from hand and add to pile
    const card = hand.shift();
    if (!card) {
      return {
        success: false,
        newState: state,
        error: 'Failed to draw card',
      };
    }

    const hasMatch = state.addToPile(card);

    // Switch to next player's turn
    state.nextTurn();

    log('Card played', {
      playerId,
      card: { suit: card.suit, rank: card.rank },
      hasMatch,
      pileSize: state.centralPile.length,
      nextTurn: state.currentTurn,
    });

    return {
      success: true,
      newState: state,
    };
  }

  /**
   * Handle snap attempt
   */
  private handleSnap(state: SnapGameState, playerId: string): ActionResult<SnapGameState> {
    const result = state.handleSnap(playerId);

    if (result.success) {
      log('Successful snap', {
        playerId,
        cardsWon: result.cardsWon,
        newHandSize: state.getHandSize(playerId),
      });

      return {
        success: true,
        newState: state,
      };
    } else {
      log('Failed snap (penalty)', {
        playerId,
        newHandSize: state.getHandSize(playerId),
      });

      return {
        success: false,
        newState: state,
        error: 'No match - penalty applied',
      };
    }
  }

  /**
   * Validate if an action is legal
   */
  validateAction(state: SnapGameState, action: GameAction): ValidationResult {
    if (action.type === 'PLAY_CARD') {
      if (state.currentTurn !== action.playerId) {
        return {
          valid: false,
          error: 'Not your turn',
        };
      }

      const hand = state.playerHands.get(action.playerId);
      if (!hand || hand.length === 0) {
        return {
          valid: false,
          error: 'No cards in hand',
        };
      }

      return { valid: true };
    }

    if (action.type === 'SNAP') {
      // Snap is always valid to attempt (penalty handled in processing)
      return { valid: true };
    }

    return {
      valid: false,
      error: `Unknown action type: ${action.type}`,
    };
  }

  /**
   * Check if game has ended
   */
  isGameOver(state: SnapGameState): boolean {
    const playerIds = Array.from(state.players.keys());

    // Game is over when one player has all the cards (or no cards to play)
    let playersWithCards = 0;
    playerIds.forEach((id) => {
      if (state.getHandSize(id) > 0) {
        playersWithCards++;
      }
    });

    // Game ends when only one or zero players have cards
    return playersWithCards <= 1;
  }

  /**
   * Get the winner (player with all cards)
   */
  getWinner(state: SnapGameState): string | null {
    if (!this.isGameOver(state)) {
      return null;
    }

    const playerIds = Array.from(state.players.keys());

    for (const id of playerIds) {
      if (state.getHandSize(id) > 0) {
        return id;
      }
    }

    // No winner (all players out of cards somehow)
    return null;
  }

  /**
   * Get current game state
   */
  getGameState(): SnapGameState {
    return this.state;
  }
}
