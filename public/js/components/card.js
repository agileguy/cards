/**
 * Card rendering utilities
 */

/**
 * Get suit symbol
 */
export function getSuitSymbol(suit) {
  const symbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
  };
  return symbols[suit] || suit;
}

/**
 * Get rank name
 */
export function getRankName(rank) {
  const names = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K'
  };
  return names[rank] || rank.toString();
}

/**
 * Get suit class for styling
 */
export function getSuitClass(suit) {
  return `suit-${suit}`;
}

/**
 * Create a card element
 */
export function createCard(suit, rank, faceUp = true) {
  const card = document.createElement('div');
  card.className = 'card';

  if (!faceUp) {
    card.classList.add('card-back');
    return card;
  }

  card.classList.add(getSuitClass(suit));

  const suitEl = document.createElement('div');
  suitEl.className = `card-suit ${getSuitClass(suit)}`;
  suitEl.textContent = getSuitSymbol(suit);

  const rankEl = document.createElement('div');
  rankEl.className = 'card-rank';
  rankEl.textContent = getRankName(rank);

  card.appendChild(suitEl);
  card.appendChild(rankEl);

  return card;
}

/**
 * Create a card back element
 */
export function createCardBack() {
  return createCard(null, null, false);
}

/**
 * Animate card deal
 */
export function animateCardDeal(card, delay = 0) {
  setTimeout(() => {
    card.classList.add('card-dealing');
    setTimeout(() => {
      card.classList.remove('card-dealing');
    }, 500);
  }, delay);
}

/**
 * Animate card flip
 */
export function animateCardFlip(card) {
  card.classList.add('card-flip');
  setTimeout(() => {
    card.classList.remove('card-flip');
  }, 600);
}

/**
 * Animate snap effect
 */
export function animateSnap(element) {
  element.classList.add('snap-animation');
  setTimeout(() => {
    element.classList.remove('snap-animation');
  }, 400);
}

/**
 * Clear container
 */
export function clearCards(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
