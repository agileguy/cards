import { Card, Suit } from './Card';

export class Deck {
    private cards: Card[];

    constructor() {
        this.cards = [];
        this.initializeDeck();
    }

    private initializeDeck(): void {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

        for (const suit of suits) {
            for (let rank = 1; rank <= 13; rank++) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    public shuffle(): void {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    public draw(count: number): Card[] {
        if (count > this.cards.length) {
            throw new Error('Not enough cards in deck to draw');
        }

        return this.cards.splice(0, count);
    }

    public drawOne(): Card {
        if (this.isEmpty()) {
            throw new Error('Deck is empty');
        }

        return this.cards.shift()!;
    }

    public reset(): void {
        this.cards = [];
        this.initializeDeck();
    }

    public isEmpty(): boolean {
        return this.cards.length === 0;
    }

    public size(): number {
        return this.cards.length;
    }

    public peek(): Card {
        if (this.isEmpty()) {
            throw new Error('Deck is empty');
        }

        return this.cards[0];
    }

    public getCards(): Card[] {
        // Return copy to prevent external modification
        return [...this.cards];
    }
}
