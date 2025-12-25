import { GameClient } from './client.js';
import { createCard, createCardBack, clearCards, animateCardDeal, animateSnap } from './components/card.js';

// Get URL parameters
const params = new URLSearchParams(window.location.search);
const matchId = params.get('matchId');
const playerName = params.get('name') || 'Player';

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
  if (!gameState || !gameState.playerHands) {
    console.log('⚠️ Cannot update hand sizes - no game state or player hands');
    return;
  }

  console.log('Updating hand sizes...');
  console.log('Player hands:', gameState.playerHands);
  console.log('My session ID:', mySessionId);

  // Get my hand size
  const myHand = gameState.playerHands.get(mySessionId);
  const myHandSize = myHand ? myHand.cards.length : 0;
  console.log('My hand:', myHand, 'size:', myHandSize);
  playerHandSizeEl.textContent = `${myHandSize} cards`;

  // Get opponent
  const players = Array.from(gameState.players.values());
  const opponent = players.find(p => p.sessionId !== mySessionId);

  if (opponent) {
    const opponentHand = gameState.playerHands.get(opponent.sessionId);
    const opponentHandSize = opponentHand ? opponentHand.cards.length : 0;
    console.log('Opponent hand:', opponentHand, 'size:', opponentHandSize);
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
  console.log('=== GAME.JS INITIALIZING ===');
  console.log('Match ID:', matchId);
  console.log('Player Name:', playerName);

  if (!matchId) {
    console.error('No match ID provided');
    showError('No match ID provided');
    return;
  }

  try {
    console.log('Setting initial connection status to disconnected');
    updateConnectionStatus(false);

    console.log('Calling client.joinGame with name:', playerName);
    currentRoom = await client.joinGame(matchId, playerName);
    mySessionId = currentRoom.sessionId;

    console.log('✓ Successfully joined game!');
    console.log('  - Session ID:', currentRoom.sessionId);
    console.log('  - Room ID:', currentRoom.roomId);
    console.log('  - Initial state:', currentRoom.state);

    updateConnectionStatus(true);
    console.log('Connection status updated to connected');

    // Set up state change listeners
    console.log('Setting up state change listeners...');

    // Use a simpler approach - listen to the whole state change
    currentRoom.onStateChange((state) => {
      console.log('🔄 State changed');
      gameState = state;
      updateUI();
    });

    // Try setting up field-specific listeners with error handling
    try {
      if (currentRoom.state.hasOwnProperty('currentTurn')) {
        currentRoom.state.listen('currentTurn', (value) => {
          console.log('🎯 Turn changed to:', value);
          gameState = currentRoom.state;
          updateTurnIndicator();
          updateActionButtons();
        });
      }
    } catch (e) {
      console.warn('Could not set up currentTurn listener:', e);
    }

    try {
      if (currentRoom.state.hasOwnProperty('snapAvailable')) {
        currentRoom.state.listen('snapAvailable', (value) => {
          console.log('⚡ Snap available changed to:', value);
          gameState = currentRoom.state;
          updateActionButtons();
        });
      }
    } catch (e) {
      console.warn('Could not set up snapAvailable listener:', e);
    }

    // Listen for changes to the central pile array
    if (currentRoom.state.centralPile) {
      currentRoom.state.centralPile.onAdd = (card, index) => {
        console.log('🃏 Card added to pile at index', index, ':', card);
        gameState = currentRoom.state;
        updateCentralPile();
        updateHandSizes();
      };

      currentRoom.state.centralPile.onRemove = (card, index) => {
        console.log('🗑️ Card removed from pile at index', index);
        gameState = currentRoom.state;
        updateCentralPile();
        updateHandSizes();
      };
    }

    // Listen for player hand map changes (when hands are added)
    if (currentRoom.state.playerHands) {
      currentRoom.state.playerHands.onAdd = (hand, sessionId) => {
        console.log('👋 Hand added for player:', sessionId, 'with', hand.cards.length, 'cards');
        gameState = currentRoom.state;

        // Set up listener for this hand's cards array
        if (hand.cards) {
          hand.cards.onAdd = (card, index) => {
            console.log('🃏 Card added to', sessionId, 'hand at index', index);
            gameState = currentRoom.state;
            updateHandSizes();
          };

          hand.cards.onRemove = (card, index) => {
            console.log('🗑️ Card removed from', sessionId, 'hand at index', index);
            gameState = currentRoom.state;
            updateHandSizes();
          };
        }

        updateHandSizes();
      };
    }

    console.log('✓ State listeners set up');

    // Wait for state to fully sync, then set up listeners for existing hands
    setTimeout(() => {
      console.log('Setting up listeners for existing hands...');
      console.log('PlayerHands:', currentRoom.state.playerHands);

      if (currentRoom.state.playerHands) {
        currentRoom.state.playerHands.forEach((hand, sessionId) => {
          console.log('📋 Setting up listener for existing hand:', sessionId, 'with', hand?.cards?.length || 0, 'cards');

          if (hand && hand.cards) {
            hand.cards.onAdd = (card, index) => {
              console.log('🃏 Card added to', sessionId, 'hand at index', index);
              gameState = currentRoom.state;
              updateHandSizes();
            };

            hand.cards.onRemove = (card, index) => {
              console.log('🗑️ Card removed from', sessionId, 'hand at index', index);
              gameState = currentRoom.state;
              updateHandSizes();
            };
          }
        });
      }
    }, 200);

    // Listen for game messages
    currentRoom.onMessage('card_played', (message) => {
      console.log('Card played message:', message);
      statusMessage.textContent = `Card played by ${message.playerId === mySessionId ? 'you' : 'opponent'}`;
      updateUI();
    });

    currentRoom.onMessage('snap_success', (message) => {
      console.log('Snap success message:', message);
      const isMe = message.playerId === mySessionId;
      statusMessage.textContent = isMe ? 'You got the pile!' : 'Opponent got the pile!';
      animateSnap(centralPile);
      updateUI();
    });

    currentRoom.onMessage('snap_fail', (message) => {
      console.log('Snap fail message:', message);
      const isMe = message.playerId === mySessionId;
      statusMessage.textContent = isMe ? 'Wrong! Penalty card lost' : 'Opponent snapped wrong!';
      updateUI();
    });

    currentRoom.onMessage('error', (message) => {
      console.error('Game error message:', message);
      showError(message.message || 'An error occurred');
    });

    currentRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      showError(`Connection error: ${message}`);
      updateConnectionStatus(false);
    });

    currentRoom.onLeave((code) => {
      console.log('Left room with code:', code);
      updateConnectionStatus(false);

      if (code > 1000) {
        showError('Connection lost');
      }
    });

    // Set initial game state
    console.log('Setting initial game state');
    gameState = currentRoom.state;
    console.log('Initial game state:', {
      status: gameState?.status,
      players: gameState?.players ? gameState.players.size : 0,
      currentTurn: gameState?.currentTurn,
      pileSize: gameState?.centralPile ? gameState.centralPile.length : 0
    });

    // Initial UI update
    console.log('Performing initial UI update');
    updateUI();

  } catch (error) {
    console.error('❌ Failed to join game:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    showError('Failed to connect to game. Please try again.');
    updateConnectionStatus(false);
  }
}

console.log('=== GAME.JS LOADED ===');

// Initialize when page loads
initGame();

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (currentRoom) {
    currentRoom.leave();
  }
});
