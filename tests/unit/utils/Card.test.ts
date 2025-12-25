import { Card } from '../../../src/utils/Card';

describe('Card', () => {
  describe('constructor', () => {
    it('should create a card with valid suit and rank', () => {
      const card = new Card('hearts', 1);

      expect(card.suit).toBe('hearts');
      expect(card.rank).toBe(1);
      expect(card.faceUp).toBe(false);
    });

    it('should create a card with faceUp set to true', () => {
      const card = new Card('spades', 13, true);

      expect(card.faceUp).toBe(true);
    });

    it('should throw error for invalid suit', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new Card('invalid' as any, 1)).toThrow('Invalid suit');
    });

    it('should throw error for rank less than 1', () => {
      expect(() => new Card('hearts', 0)).toThrow('Invalid rank');
    });

    it('should throw error for rank greater than 13', () => {
      expect(() => new Card('hearts', 14)).toThrow('Invalid rank');
    });
  });

  describe('flip', () => {
    it('should flip card from face down to face up', () => {
      const card = new Card('diamonds', 7);

      card.flip();

      expect(card.faceUp).toBe(true);
    });

    it('should flip card from face up to face down', () => {
      const card = new Card('clubs', 10, true);

      card.flip();

      expect(card.faceUp).toBe(false);
    });

    it('should toggle faceUp state multiple times', () => {
      const card = new Card('hearts', 5);

      card.flip();
      expect(card.faceUp).toBe(true);

      card.flip();
      expect(card.faceUp).toBe(false);
    });
  });

  describe('getRankName', () => {
    it('should return "Ace" for rank 1', () => {
      const card = new Card('hearts', 1);
      expect(card.getRankName()).toBe('Ace');
    });

    it('should return "Jack" for rank 11', () => {
      const card = new Card('spades', 11);
      expect(card.getRankName()).toBe('Jack');
    });

    it('should return "Queen" for rank 12', () => {
      const card = new Card('diamonds', 12);
      expect(card.getRankName()).toBe('Queen');
    });

    it('should return "King" for rank 13', () => {
      const card = new Card('clubs', 13);
      expect(card.getRankName()).toBe('King');
    });

    it('should return numeric string for ranks 2-10', () => {
      const card5 = new Card('hearts', 5);
      expect(card5.getRankName()).toBe('5');

      const card10 = new Card('spades', 10);
      expect(card10.getRankName()).toBe('10');
    });
  });

  describe('toString', () => {
    it('should return formatted string for Ace of Hearts', () => {
      const card = new Card('hearts', 1);
      expect(card.toString()).toBe('Ace of Hearts');
    });

    it('should return formatted string for King of Spades', () => {
      const card = new Card('spades', 13);
      expect(card.toString()).toBe('King of Spades');
    });

    it('should return formatted string for 7 of Diamonds', () => {
      const card = new Card('diamonds', 7);
      expect(card.toString()).toBe('7 of Diamonds');
    });

    it('should capitalize suit name', () => {
      const card = new Card('clubs', 10);
      expect(card.toString()).toBe('10 of Clubs');
    });
  });

  describe('equals', () => {
    it('should return true for cards with same rank and suit', () => {
      const card1 = new Card('hearts', 5);
      const card2 = new Card('hearts', 5);

      expect(card1.equals(card2)).toBe(true);
    });

    it('should return false for cards with different ranks', () => {
      const card1 = new Card('hearts', 5);
      const card2 = new Card('hearts', 6);

      expect(card1.equals(card2)).toBe(false);
    });

    it('should return false for cards with different suits', () => {
      const card1 = new Card('hearts', 5);
      const card2 = new Card('spades', 5);

      expect(card1.equals(card2)).toBe(false);
    });

    it('should ignore faceUp state when comparing', () => {
      const card1 = new Card('hearts', 5, true);
      const card2 = new Card('hearts', 5, false);

      expect(card1.equals(card2)).toBe(true);
    });
  });

  describe('hasSameRank', () => {
    it('should return true for cards with same rank', () => {
      const card1 = new Card('hearts', 7);
      const card2 = new Card('spades', 7);

      expect(card1.hasSameRank(card2)).toBe(true);
    });

    it('should return false for cards with different ranks', () => {
      const card1 = new Card('hearts', 7);
      const card2 = new Card('hearts', 8);

      expect(card1.hasSameRank(card2)).toBe(false);
    });
  });
});
