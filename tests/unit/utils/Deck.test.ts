import { Deck } from '../../../src/utils/Deck';
import { Card } from '../../../src/utils/Card';

describe('Deck', () => {
    describe('constructor', () => {
        it('should create a standard 52-card deck', () => {
            const deck = new Deck();

            expect(deck.size()).toBe(52);
        });

        it('should have 13 cards of each suit', () => {
            const deck = new Deck();
            const cards = deck.getCards();

            const hearts = cards.filter(c => c.suit === 'hearts');
            const diamonds = cards.filter(c => c.suit === 'diamonds');
            const clubs = cards.filter(c => c.suit === 'clubs');
            const spades = cards.filter(c => c.suit === 'spades');

            expect(hearts.length).toBe(13);
            expect(diamonds.length).toBe(13);
            expect(clubs.length).toBe(13);
            expect(spades.length).toBe(13);
        });

        it('should have ranks 1-13 for each suit', () => {
            const deck = new Deck();
            const cards = deck.getCards();
            const hearts = cards.filter(c => c.suit === 'hearts');

            const ranks = hearts.map(c => c.rank).sort((a, b) => a - b);
            expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        });

        it('should create all cards face down by default', () => {
            const deck = new Deck();
            const cards = deck.getCards();

            expect(cards.every(c => !c.faceUp)).toBe(true);
        });
    });

    describe('shuffle', () => {
        it('should maintain deck size after shuffle', () => {
            const deck = new Deck();

            deck.shuffle();

            expect(deck.size()).toBe(52);
        });

        it('should randomize card order', () => {
            const deck1 = new Deck();
            const deck2 = new Deck();

            const original = deck1.getCards().map(c => c.toString());

            deck2.shuffle();
            const shuffled = deck2.getCards().map(c => c.toString());

            // Extremely unlikely that shuffle produces same order
            expect(shuffled).not.toEqual(original);
        });

        it('should maintain all original cards', () => {
            const deck = new Deck();
            const originalCards = deck.getCards().map(c => c.toString()).sort();

            deck.shuffle();
            const shuffledCards = deck.getCards().map(c => c.toString()).sort();

            expect(shuffledCards).toEqual(originalCards);
        });
    });

    describe('draw', () => {
        it('should draw specified number of cards', () => {
            const deck = new Deck();

            const drawn = deck.draw(5);

            expect(drawn.length).toBe(5);
            expect(deck.size()).toBe(47);
        });

        it('should remove drawn cards from deck', () => {
            const deck = new Deck();
            const originalSize = deck.size();

            deck.draw(10);

            expect(deck.size()).toBe(originalSize - 10);
        });

        it('should draw from top of deck', () => {
            const deck = new Deck();
            const topCard = deck.getCards()[0];

            const drawn = deck.draw(1);

            expect(drawn[0].equals(topCard)).toBe(true);
        });

        it('should throw error when drawing more cards than available', () => {
            const deck = new Deck();

            expect(() => deck.draw(53)).toThrow('Not enough cards');
        });

        it('should throw error when drawing from empty deck', () => {
            const deck = new Deck();
            deck.draw(52);

            expect(() => deck.draw(1)).toThrow('Not enough cards');
        });

        it('should handle drawing zero cards', () => {
            const deck = new Deck();

            const drawn = deck.draw(0);

            expect(drawn).toEqual([]);
            expect(deck.size()).toBe(52);
        });
    });

    describe('drawOne', () => {
        it('should draw a single card', () => {
            const deck = new Deck();

            const card = deck.drawOne();

            expect(card).toBeInstanceOf(Card);
            expect(deck.size()).toBe(51);
        });

        it('should throw error when deck is empty', () => {
            const deck = new Deck();
            deck.draw(52);

            expect(() => deck.drawOne()).toThrow('Deck is empty');
        });
    });

    describe('reset', () => {
        it('should restore deck to 52 cards', () => {
            const deck = new Deck();
            deck.draw(20);

            deck.reset();

            expect(deck.size()).toBe(52);
        });

        it('should restore all suits and ranks', () => {
            const deck = new Deck();
            deck.draw(30);

            deck.reset();
            const cards = deck.getCards();

            const hearts = cards.filter(c => c.suit === 'hearts');
            expect(hearts.length).toBe(13);
        });

        it('should reset cards to face down', () => {
            const deck = new Deck();
            deck.getCards().forEach(c => c.flip());

            deck.reset();

            expect(deck.getCards().every(c => !c.faceUp)).toBe(true);
        });
    });

    describe('isEmpty', () => {
        it('should return false for full deck', () => {
            const deck = new Deck();

            expect(deck.isEmpty()).toBe(false);
        });

        it('should return false for partially empty deck', () => {
            const deck = new Deck();
            deck.draw(25);

            expect(deck.isEmpty()).toBe(false);
        });

        it('should return true for empty deck', () => {
            const deck = new Deck();
            deck.draw(52);

            expect(deck.isEmpty()).toBe(true);
        });
    });

    describe('size', () => {
        it('should return 52 for new deck', () => {
            const deck = new Deck();

            expect(deck.size()).toBe(52);
        });

        it('should return correct size after drawing cards', () => {
            const deck = new Deck();
            deck.draw(15);

            expect(deck.size()).toBe(37);
        });

        it('should return 0 for empty deck', () => {
            const deck = new Deck();
            deck.draw(52);

            expect(deck.size()).toBe(0);
        });
    });

    describe('peek', () => {
        it('should return top card without removing it', () => {
            const deck = new Deck();
            const initialSize = deck.size();

            const peeked = deck.peek();

            expect(peeked).toBeInstanceOf(Card);
            expect(deck.size()).toBe(initialSize);
        });

        it('should return same card on multiple peeks', () => {
            const deck = new Deck();

            const first = deck.peek();
            const second = deck.peek();

            expect(first.equals(second)).toBe(true);
        });

        it('should throw error when deck is empty', () => {
            const deck = new Deck();
            deck.draw(52);

            expect(() => deck.peek()).toThrow('Deck is empty');
        });
    });
});
