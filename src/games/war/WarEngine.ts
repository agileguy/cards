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
   * Stub for now - will be implemented in Commit 6
   */
  private resolveBattle(state: WarGameState): void {
    log('resolveBattle called (stub)');

    // Stub implementation: Just clear battle pile and ready state
    state.clearBattlePile();
    state.clearPlayersReady();
    state.roundNumber++;
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
