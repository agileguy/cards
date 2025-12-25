import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema';
import { BaseGameState } from './BaseGameState';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/**
 * Snap-specific card schema for network synchronization
 */
export class SnapCard extends Schema {
  @type('string') public suit: Suit;
  @type('number') public rank: number; // 1-13 (Ace-King)

  constructor(suit: Suit = 'hearts', rank: number = 1) {
    super();
    this.suit = suit;
    this.rank = rank;
  }
}

/**
 * Wrapper for a player's hand of cards
 */
export class PlayerHand extends Schema {
  @type([SnapCard]) public cards = new ArraySchema<SnapCard>();

  public get length(): number {
    return this.cards.length;
  }

  public push(card: SnapCard): void {
    this.cards.push(card);
  }

  public shift(): SnapCard | undefined {
    if (this.cards.length === 0) return undefined;
    const card = this.cards[0];
    this.cards.splice(0, 1);
    return card;
  }
}

export interface SnapResult {
  success: boolean;
  winnerId: string | null;
  cardsWon?: number;
  penalty?: boolean;
}

export class SnapGameState extends BaseGameState {
  @type([SnapCard]) public centralPile = new ArraySchema<SnapCard>();
  @type({ map: PlayerHand }) public playerHands = new MapSchema<PlayerHand>();
  @type('string') public currentTurn: string | null = null;
  @type('boolean') public snapAvailable: boolean = false;
  @type('string') public lastSnapAttempt: string | null = null;

  /**
   * Add a card to the central pile and check for match
   */
  public addToPile(card: SnapCard): boolean {
    this.centralPile.push(card);

    // Check if last two cards match
    if (this.centralPile.length >= 2) {
      const lastCard = this.centralPile[this.centralPile.length - 1];
      const secondLastCard = this.centralPile[this.centralPile.length - 2];

      if (lastCard.rank === secondLastCard.rank) {
        this.snapAvailable = true;
        return true;
      }
    }

    this.snapAvailable = false;
    return false;
  }

  /**
   * Handle a snap attempt
   */
  public handleSnap(sessionId: string): SnapResult {
    this.lastSnapAttempt = sessionId;

    // Check if snap is valid
    if (!this.snapAvailable) {
      // Failed snap - penalize player
      return this.penalizePlayer(sessionId);
    }

    // Successful snap - award pile to player
    const cardsWon = this.centralPile.length;
    const playerHand = this.playerHands.get(sessionId);

    if (playerHand) {
      // Add all cards from pile to player's hand
      this.centralPile.forEach((card) => {
        playerHand.push(card);
      });
    }

    // Clear the pile
    this.centralPile.clear();
    this.snapAvailable = false;

    return {
      success: true,
      winnerId: sessionId,
      cardsWon,
    };
  }

  /**
   * Penalize player for failed snap
   */
  private penalizePlayer(sessionId: string): SnapResult {
    const playerHand = this.playerHands.get(sessionId);

    if (playerHand && playerHand.length > 0) {
      // Remove one card from player's hand and add to pile
      const penaltyCard = playerHand.shift();
      if (penaltyCard) {
        this.centralPile.push(penaltyCard);
      }
    }

    return {
      success: false,
      winnerId: null,
      penalty: true,
    };
  }

  /**
   * Switch to next player's turn
   */
  public nextTurn(): void {
    const playerIds = Array.from(this.players.keys());

    if (playerIds.length === 0) {
      return;
    }

    if (this.currentTurn === null) {
      this.currentTurn = playerIds[0];
      return;
    }

    const currentIndex = playerIds.indexOf(this.currentTurn);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.currentTurn = playerIds[nextIndex];
  }

  /**
   * Get the number of cards in a player's hand
   */
  public getHandSize(sessionId: string): number {
    const hand = this.playerHands.get(sessionId);
    return hand ? hand.length : 0;
  }

  /**
   * Initialize a player's hand with cards
   */
  public initializeHand(sessionId: string, cards: SnapCard[]): void {
    const hand = new PlayerHand();
    cards.forEach((card) => hand.push(card));
    this.playerHands.set(sessionId, hand);
  }
}
