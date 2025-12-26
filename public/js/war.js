import { GameClient } from './client.js';
import { createCard, createCardBack, clearCards, animateCardDeal } from './components/card.js';

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
const battleArea = document.querySelector('.battle-area');
const playerSlot = document.querySelector('.card-slot.player-slot');
const opponentSlot = document.querySelector('.card-slot.opponent-slot');
const roundIndicator = document.querySelector('.round-indicator');
const warIndicator = document.querySelector('.war-indicator');
const flipCardBtn = document.getElementById('flipCardBtn');
const statusMessage = document.querySelector('.status-message');
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

  // Get my hand size
  const myHand = gameState.playerHands.get(mySessionId);
  const myHandSize = myHand ? myHand.cards.length : 0;
  playerHandSizeEl.textContent = `${myHandSize} cards`;

  // Get opponent
  const players = Array.from(gameState.players.values());
  const opponent = players.find(p => p.sessionId !== mySessionId);

  if (opponent) {
    const opponentHand = gameState.playerHands.get(opponent.sessionId);
    const opponentHandSize = opponentHand ? opponentHand.cards.length : 0;
    opponentHandSizeEl.textContent = `${opponentHandSize} cards`;
  }
}

/**
 * Update battle area display
 */
function updateBattleArea() {
  if (!gameState || !gameState.battlePile) return;

  const battleCards = Array.from(gameState.battlePile);
  const players = Array.from(gameState.players.values());
  const opponent = players.find(p => p.sessionId !== mySessionId);

  console.log('=== UPDATE BATTLE AREA ===');
  console.log('Battle pile length:', battleCards.length);
  console.log('Battle cards:', battleCards);
  console.log('Players:', players);
  console.log('My session ID:', mySessionId);

  // Clear both slots
  clearCards(playerSlot);
  clearCards(opponentSlot);

  if (battleCards.length === 0) {
    // Show placeholders
    const playerPlaceholder = document.createElement('div');
    playerPlaceholder.className = 'slot-placeholder';
    playerPlaceholder.textContent = 'Waiting...';
    playerSlot.appendChild(playerPlaceholder);

    const opponentPlaceholder = document.createElement('div');
    opponentPlaceholder.className = 'slot-placeholder';
    opponentPlaceholder.textContent = 'Waiting...';
    opponentSlot.appendChild(opponentPlaceholder);
    return;
  }

  // Cards are interleaved: player1, player2, player1, player2, ...
  // Determine which player is which index
  const player1Id = players[0]?.sessionId;
  const myIndex = player1Id === mySessionId ? 0 : 1;
  const opponentIndex = myIndex === 0 ? 1 : 0;

  console.log('Player 1 ID:', player1Id);
  console.log('My index:', myIndex, 'Opponent index:', opponentIndex);

  // Get the last card for each player from the battle pile
  let myLastCard = null;
  let opponentLastCard = null;

  for (let i = myIndex; i < battleCards.length; i += 2) {
    myLastCard = battleCards[i];
  }

  for (let i = opponentIndex; i < battleCards.length; i += 2) {
    opponentLastCard = battleCards[i];
  }

  console.log('My last card:', myLastCard);
  console.log('Opponent last card:', opponentLastCard);

  // Display my card
  if (myLastCard) {
    if (myLastCard.faceUp) {
      const card = createCard(myLastCard.suit, myLastCard.rank);
      playerSlot.appendChild(card);
    } else {
      const cardBack = createCardBack();
      playerSlot.appendChild(cardBack);
    }
  } else {
    const playerPlaceholder = document.createElement('div');
    playerPlaceholder.className = 'slot-placeholder';
    playerPlaceholder.textContent = 'Waiting...';
    playerSlot.appendChild(playerPlaceholder);
  }

  // Display opponent's card
  if (opponentLastCard) {
    if (opponentLastCard.faceUp) {
      const card = createCard(opponentLastCard.suit, opponentLastCard.rank);
      opponentSlot.appendChild(card);
    } else {
      const cardBack = createCardBack();
      opponentSlot.appendChild(cardBack);
    }
  } else {
    const opponentPlaceholder = document.createElement('div');
    opponentPlaceholder.className = 'slot-placeholder';
    opponentPlaceholder.textContent = 'Waiting...';
    opponentSlot.appendChild(opponentPlaceholder);
  }
}

/**
 * Update round indicator
 */
function updateRoundIndicator() {
  if (!gameState) return;

  roundIndicator.textContent = `Round ${gameState.roundNumber || 0}`;
}

/**
 * Update WAR indicator
 */
function updateWarIndicator() {
  if (!gameState) return;

  if (gameState.inWar) {
    warIndicator.classList.add('active');
  } else {
    warIndicator.classList.remove('active');
  }
}

/**
 * Update action buttons
 */
function updateActionButtons() {
  if (!gameState) return;

  const isPlaying = gameState.status === 'playing';
  const myHand = gameState.playerHands.get(mySessionId);
  const hasCards = myHand && myHand.cards.length > 0;
  const alreadyFlipped = gameState.playersReady && gameState.playersReady.includes(mySessionId);

  // Enable button if:
  // - Game is playing
  // - I have cards
  // - I haven't flipped yet this round
  flipCardBtn.disabled = !isPlaying || !hasCards || alreadyFlipped;
}

/**
 * Update all UI
 */
function updateUI() {
  updatePlayerNames();
  updateHandSizes();
  updateBattleArea();
  updateRoundIndicator();
  updateWarIndicator();
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
 * Handle flip card button click
 */
flipCardBtn.addEventListener('click', () => {
  if (!currentRoom) return;

  currentRoom.send('flip_card', {});
  statusMessage.textContent = 'Flipping card...';
});

/**
 * Initialize game
 */
async function initGame() {
  console.log('=== WAR.JS INITIALIZING ===');
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
    currentRoom = await client.joinGame(matchId, playerName, 'war');
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
      if (currentRoom.state.hasOwnProperty('roundNumber')) {
        currentRoom.state.listen('roundNumber', (value) => {
          console.log('🎯 Round changed to:', value);
          gameState = currentRoom.state;
          updateRoundIndicator();
        });
      }
    } catch (e) {
      console.warn('Could not set up roundNumber listener:', e);
    }

    try {
      if (currentRoom.state.hasOwnProperty('inWar')) {
        currentRoom.state.listen('inWar', (value) => {
          console.log('⚔️ inWar changed to:', value);
          gameState = currentRoom.state;
          updateWarIndicator();
        });
      }
    } catch (e) {
      console.warn('Could not set up inWar listener:', e);
    }

    // Listen for changes to the battle pile array
    if (currentRoom.state.battlePile) {
      currentRoom.state.battlePile.onAdd = (card, index) => {
        console.log('🃏 Card added to battle pile at index', index, ':', card);
        gameState = currentRoom.state;
        updateBattleArea();
        updateHandSizes();
        updateActionButtons();
      };

      currentRoom.state.battlePile.onRemove = (card, index) => {
        console.log('🗑️ Card removed from battle pile at index', index);
        gameState = currentRoom.state;
        updateBattleArea();
        updateHandSizes();
        updateActionButtons();
      };
    }

    // Listen for changes to playersReady array
    if (currentRoom.state.playersReady) {
      currentRoom.state.playersReady.onAdd = (sessionId, index) => {
        console.log('✋ Player ready:', sessionId, 'at index', index);
        gameState = currentRoom.state;
        updateActionButtons();
      };

      currentRoom.state.playersReady.onRemove = (sessionId, index) => {
        console.log('🗑️ Player unready:', sessionId, 'at index', index);
        gameState = currentRoom.state;
        updateActionButtons();
      };
    }

    // Listen for player hand map changes (when hands are added)
    if (currentRoom.state.playerHands) {
      currentRoom.state.playerHands.onAdd = (hand, sessionId) => {
        console.log('👋 Hand added for player:', sessionId, 'with', hand.cards?.length || 0, 'cards');
        gameState = currentRoom.state;

        // Set up listener for this hand's cards array
        if (hand.cards) {
          hand.cards.onAdd = (card, index) => {
            console.log('🃏 Card added to', sessionId, 'hand at index', index);
            gameState = currentRoom.state;
            updateHandSizes();
            updateActionButtons();
          };

          hand.cards.onRemove = (card, index) => {
            console.log('🗑️ Card removed from', sessionId, 'hand at index', index);
            gameState = currentRoom.state;
            updateHandSizes();
            updateActionButtons();
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
              updateActionButtons();
            };

            hand.cards.onRemove = (card, index) => {
              console.log('🗑️ Card removed from', sessionId, 'hand at index', index);
              gameState = currentRoom.state;
              updateHandSizes();
              updateActionButtons();
            };
          }
        });
      }
    }, 200);

    // Listen for game messages
    currentRoom.onMessage('card_flipped', (message) => {
      console.log('Card flipped message:', message);
      const isMe = message.playerId === mySessionId;
      statusMessage.textContent = isMe ? 'You flipped a card!' : 'Opponent flipped a card!';
      updateUI();
    });

    currentRoom.onMessage('battle_resolved', (message) => {
      console.log('Battle resolved message:', message);
      statusMessage.textContent = `Battle resolved! Round ${message.roundNumber}`;
      updateUI();
    });

    currentRoom.onMessage('war_started', (message) => {
      console.log('WAR started message:', message);
      statusMessage.textContent = 'WAR!';
      updateWarIndicator();
      updateUI();
    });

    currentRoom.onMessage('error', (message) => {
      console.error('Game error message:', message);
      showError(message.message || 'An error occurred');
    });

    currentRoom.onMessage('game_over', (message) => {
      console.log('Game over message:', message);
      showGameOver(message.winner);
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
      roundNumber: gameState?.roundNumber,
      battlePileSize: gameState?.battlePile ? gameState.battlePile.length : 0
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

console.log('=== WAR.JS LOADED ===');

// Initialize when page loads
initGame();

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (currentRoom) {
    currentRoom.leave();
  }
});
