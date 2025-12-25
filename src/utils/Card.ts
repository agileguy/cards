export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export class Card {
    public suit: Suit;
    public rank: number; // 1-13 (Ace-King)
    public faceUp: boolean;

    constructor(suit: Suit, rank: number, faceUp = false) {
        this.validateSuit(suit);
        this.validateRank(rank);

        this.suit = suit;
        this.rank = rank;
        this.faceUp = faceUp;
    }

    private validateSuit(suit: string): void {
        const validSuits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        if (!validSuits.includes(suit as Suit)) {
            throw new Error('Invalid suit: must be hearts, diamonds, clubs, or spades');
        }
    }

    private validateRank(rank: number): void {
        if (rank < 1 || rank > 13) {
            throw new Error('Invalid rank: must be between 1 and 13');
        }
    }

    public flip(): void {
        this.faceUp = !this.faceUp;
    }

    public getRankName(): string {
        const rankNames: { [key: number]: string } = {
            1: 'Ace',
            11: 'Jack',
            12: 'Queen',
            13: 'King',
        };

        return rankNames[this.rank] || this.rank.toString();
    }

    public toString(): string {
        const suitCapitalized = this.suit.charAt(0).toUpperCase() + this.suit.slice(1);
        return `${this.getRankName()} of ${suitCapitalized}`;
    }

    public equals(other: Card): boolean {
        return this.suit === other.suit && this.rank === other.rank;
    }

    public hasSameRank(other: Card): boolean {
        return this.rank === other.rank;
    }
}
