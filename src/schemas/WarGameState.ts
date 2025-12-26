import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema';
import { BaseGameState } from './BaseGameState';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/**
 * War-specific card schema for network synchronization
 */
export class WarCard extends Schema {
  @type('string') public suit: Suit;
  @type('number') public rank: number; // 1-13 (Ace=13 is highest)
  @type('boolean') public faceUp: boolean = false; // Visibility state for war mechanism

  constructor(suit: Suit = 'hearts', rank: number = 1, faceUp: boolean = false) {
    super();
    this.suit = suit;
    this.rank = rank;
    this.faceUp = faceUp;
  }
}

/**
 * Wrapper for a player's hand of cards
 */
export class PlayerHand extends Schema {
  @type([WarCard]) public cards = new ArraySchema<WarCard>();

  public get length(): number {
    return this.cards.length;
  }

  public push(card: WarCard): void {
    this.cards.push(card);
  }

  public shift(): WarCard | undefined {
    if (this.cards.length === 0) {
      return undefined;
    }
    const card = this.cards[0];
    this.cards.splice(0, 1);
    return card;
  }
}

/**
 * War game state - extends BaseGameState with War-specific properties
 */
export class WarGameState extends BaseGameState {
  // Player hands (face-down decks)
  @type({ map: PlayerHand }) public playerHands = new MapSchema<PlayerHand>();

  // Current battle pile (cards in play this round)
  @type([WarCard]) public battlePile = new ArraySchema<WarCard>();

  // Track who has flipped this round (enables simultaneous play)
  @type(['string']) public playersReady = new ArraySchema<string>();

  // War state tracking
  @type('boolean') public inWar: boolean = false;
  @type('number') public warDepth: number = 0; // Supports nested wars

  // Game metadata
  @type('number') public roundNumber: number = 0;
  @type('number') public lastActionAt: number = 0;

  /**
   * Add a card to the battle pile
   */
  public addToBattlePile(card: WarCard): void {
    this.battlePile.push(card);
  }

  /**
   * Clear all cards from the battle pile
   */
  public clearBattlePile(): void {
    this.battlePile.clear();
  }

  /**
   * Mark a player as ready (has flipped their card)
   */
  public markPlayerReady(sessionId: string): void {
    if (!this.playersReady.includes(sessionId)) {
      this.playersReady.push(sessionId);
    }
  }

  /**
   * Clear all players from ready state
   */
  public clearPlayersReady(): void {
    this.playersReady.clear();
  }

  /**
   * Check if both players are ready (have flipped)
   */
  public areBothPlayersReady(): boolean {
    return this.playersReady.length === 2;
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
  public initializeHand(sessionId: string, cards: WarCard[]): void {
    const hand = new PlayerHand();
    cards.forEach((card) => hand.push(card));
    this.playerHands.set(sessionId, hand);
  }
}
