import { GameClient } from './client.js';
import { createCard, createCardBack, clearCards, animateCardDeal, animateSnap } from './components/card.js';

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const matchId = params.get('matchId');
const sessionId = params.get('session');

// Initialize game client
const client = new GameClient();

// DOM elements
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const opponentNameEl = document.querySelector('.opponent-name');
const opponentHandSizeEl = document.querySelector('.opponent-area .hand-size');
const playerNameEl = document.querySelector('.player-name');
const playerHandSizeEl = document.querySelector('.player-area .hand-size');
const centralPile = document.querySelector('.central-pile');
const pileSizeEl = document.querySelector('.pile-size');
const playCardBtn = document.getElementById('playCardBtn');
const snapBtn = document.getElementById('snapBtn');
const statusMessage = document.querySelector('.status-message');
const turnIndicator = document.querySelector('.turn-indicator');
const gameOverSection = document.querySelector('.game-over');
const gameOverResult = document.querySelector('.game-over .result');
const gameOverMessage = document.querySelector('.game-over .message');
const errorMessage = document.querySelector('.error-message');

// State
let currentRoom = null;
let mySessionId = null;
let gameState = null;

/**
 * Update connection status
 */
function updateConnectionStatus(connected) {
  if (connected) {
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';
  } else {
    statusIndicator.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');

  setTimeout(() => {
    errorMessage.classList.remove('active');
  }, 5000);
}

/**
 * Update player names
 */
function updatePlayerNames() {
  if (!gameState || !gameState.players) return;

  const players = Array.from(gameState.players.values());
  const opponent = players.find(p => p.sessionId !== mySessionId);

  if (opponent) {
    opponentNameEl.textContent = opponent.name;
  }

  const me = players.find(p => p.sessionId === mySessionId);
  if (me) {
    playerNameEl.textContent = me.name;
  }
}

/**
 * Update hand sizes
 */
function updateHandSizes() {
  if (!gameState) return;

  const myHandSize = gameState.getHandSize ? gameState.getHandSize(mySessionId) : 0;
  playerHandSizeEl.textContent = `${myHandSize} cards`;

  const players = Array.from(gameState.players.values());
  const opponent = players.find(p => p.sessionId !== mySessionId);

  if (opponent) {
    const opponentHandSize = gameState.getHandSize ? gameState.getHandSize(opponent.sessionId) : 0;
    opponentHandSizeEl.textContent = `${opponentHandSize} cards`;
  }
}

/**
 * Update central pile display
 */
function updateCentralPile() {
  if (!gameState || !gameState.centralPile) return;

  clearCards(centralPile);

  const pileCards = Array.from(gameState.centralPile);
  pileSizeEl.textContent = `${pileCards.length} cards in pile`;

  if (pileCards.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'pile-placeholder';
    placeholder.textContent = 'No cards played yet';
    centralPile.appendChild(placeholder);
    return;
  }

  // Show only the last few cards (stacked effect)
  const cardsToShow = Math.min(pileCards.length, 3);
  const startIndex = pileCards.length - cardsToShow;

  for (let i = startIndex; i < pileCards.length; i++) {
    const cardData = pileCards[i];
    const card = createCard(cardData.suit, cardData.rank);
    centralPile.appendChild(card);
  }

  // Add snap highlight if available
  if (gameState.snapAvailable) {
    centralPile.classList.add('snap-available');
  } else {
    centralPile.classList.remove('snap-available');
  }
}

/**
 * Update turn indicator
 */
function updateTurnIndicator() {
  if (!gameState) return;

  const isMyTurn = gameState.currentTurn === mySessionId;

  if (isMyTurn) {
    turnIndicator.textContent = 'Your turn!';
    turnIndicator.className = 'turn-indicator your-turn';
  } else {
    turnIndicator.textContent = "Opponent's turn";
    turnIndicator.className = 'turn-indicator opponent-turn';
  }
}

/**
 * Update action buttons
 */
function updateActionButtons() {
  if (!gameState) return;

  const isMyTurn = gameState.currentTurn === mySessionId;
  const isPlaying = gameState.status === 'playing';

  playCardBtn.disabled = !isMyTurn || !isPlaying;
  snapBtn.disabled = !gameState.snapAvailable || !isPlaying;
}

/**
 * Update all UI
 */
function updateUI() {
  updatePlayerNames();
  updateHandSizes();
  updateCentralPile();
  updateTurnIndicator();
  updateActionButtons();
}

/**
 * Show game over
 */
function showGameOver(winnerId) {
  gameOverSection.classList.add('active');

  if (winnerId === mySessionId) {
    gameOverResult.textContent = 'You Won!';
    gameOverResult.className = 'result won';
    gameOverMessage.textContent = 'Congratulations! You collected all the cards!';
  } else {
    gameOverResult.textContent = 'You Lost';
    gameOverResult.className = 'result lost';
    gameOverMessage.textContent = 'Better luck next time!';
  }
}

/**
 * Handle play card button click
 */
playCardBtn.addEventListener('click', () => {
  if (!currentRoom) return;

  currentRoom.send('play_card', {});
  statusMessage.textContent = 'Playing card...';
});

/**
 * Handle snap button click
 */
snapBtn.addEventListener('click', () => {
  if (!currentRoom) return;

  currentRoom.send('snap', {});
  animateSnap(centralPile);
  statusMessage.textContent = 'SNAP!';
});

/**
 * Initialize game
 */
async function initGame() {
  if (!matchId) {
    showError('No match ID provided');
    return;
  }

  try {
    updateConnectionStatus(false);

    // Join the snap game room
    currentRoom = await client.createGame('snap', {});
    mySessionId = currentRoom.sessionId;
    updateConnectionStatus(true);

    console.log('Joined game:', currentRoom.sessionId);

    // Listen for state changes
    currentRoom.state.onChange = () => {
      gameState = currentRoom.state;
      updateUI();
    };

    // Listen for specific properties
    currentRoom.state.listen('centralPile', () => {
      updateCentralPile();
    });

    currentRoom.state.listen('currentTurn', () => {
      updateTurnIndicator();
      updateActionButtons();
    });

    currentRoom.state.listen('status', (value) => {
      if (value === 'completed') {
        const winnerId = currentRoom.state.winner;
        showGameOver(winnerId);
      }
    });

    // Listen for game messages
    currentRoom.onMessage('card_played', (message) => {
      console.log('Card played:', message);
      statusMessage.textContent = `Card played by ${message.playerId === mySessionId ? 'you' : 'opponent'}`;
      updateUI();
    });

    currentRoom.onMessage('snap_success', (message) => {
      console.log('Successful snap:', message);
      const isMe = message.playerId === mySessionId;
      statusMessage.textContent = isMe ? 'You got the pile!' : 'Opponent got the pile!';
      animateSnap(centralPile);
      updateUI();
    });

    currentRoom.onMessage('snap_fail', (message) => {
      console.log('Failed snap:', message);
      const isMe = message.playerId === mySessionId;
      statusMessage.textContent = isMe ? 'Wrong! Penalty card lost' : 'Opponent snapped wrong!';
      updateUI();
    });

    currentRoom.onMessage('error', (message) => {
      console.error('Game error:', message);
      showError(message.message || 'An error occurred');
    });

    currentRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      showError(`Connection error: ${message}`);
      updateConnectionStatus(false);
    });

    currentRoom.onLeave((code) => {
      console.log('Left room:', code);
      updateConnectionStatus(false);

      if (code > 1000) {
        showError('Connection lost');
      }
    });

    // Initial state
    gameState = currentRoom.state;
    updateUI();

  } catch (error) {
    console.error('Failed to join game:', error);
    showError('Failed to connect to game. Please try again.');
    updateConnectionStatus(false);
  }
}

// Initialize when page loads
initGame();

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (currentRoom) {
    currentRoom.leave();
  }
});
