import { GameClient } from './client.js';

// Initialize game client
console.log('=== LOBBY.JS LOADING ===');
console.log('GameClient:', GameClient);
console.log('Creating client...');

const client = new GameClient();
console.log('✓ Client created:', client);

// DOM elements
const joinForm = document.getElementById('joinLobbyForm');
const playerNameInput = document.getElementById('playerName');
const joinFormSection = document.querySelector('.join-form');
const lobbyInfoSection = document.querySelector('.lobby-info');
const waitingCountElement = document.querySelector('.waiting-count .count');
const statusIndicator = document.querySelector('.status-indicator');
const statusText = document.querySelector('.status-text');
const errorMessage = document.querySelector('.error-message');

// State
let currentRoom = null;

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
 * Update waiting count
 */
function updateWaitingCount(count) {
  waitingCountElement.textContent = count;
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
 * Show lobby waiting state
 */
function showLobbyWaiting() {
  joinFormSection.style.display = 'none';
  lobbyInfoSection.classList.add('active');
}

/**
 * Hide lobby waiting state
 */
function hideLobbyWaiting() {
  joinFormSection.style.display = 'block';
  lobbyInfoSection.classList.remove('active');
}

/**
 * Handle form submission
 */
joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const playerName = playerNameInput.value.trim();

  console.log('=== LOBBY FORM SUBMIT ===');
  console.log('Player name:', playerName);

  if (!playerName) {
    showError('Please enter your name');
    return;
  }

  try {
    console.log('Showing lobby waiting state...');
    // Show waiting state
    showLobbyWaiting();
    updateConnectionStatus(false);

    console.log('Attempting to join lobby...');
    console.log('Client:', client);
    console.log('Client type:', typeof client);

    // Join lobby
    currentRoom = await client.joinLobby(playerName);
    console.log('✓ Joined lobby!');
    updateConnectionStatus(true);

    console.log('Joined lobby:', currentRoom.sessionId);

    // Listen for lobby events
    currentRoom.onMessage('joined_lobby', (message) => {
      console.log('Joined lobby message:', message);
      updateWaitingCount(message.waitingCount);
    });

    currentRoom.onMessage('matched', (message) => {
      console.log('Matched!', message);

      // Redirect to game page with match ID
      const gameUrl = `/game.html?matchId=${message.matchId}&session=${currentRoom.sessionId}`;
      window.location.href = gameUrl;
    });

    currentRoom.onMessage('timeout', (message) => {
      console.log('Matchmaking timeout:', message);
      showError('No match found. Please try again.');
      hideLobbyWaiting();
      updateConnectionStatus(false);

      if (currentRoom) {
        currentRoom.leave();
        currentRoom = null;
      }
    });

    currentRoom.onError((code, message) => {
      console.error('Room error:', code, message);
      showError(`Connection error: ${message}`);
      hideLobbyWaiting();
      updateConnectionStatus(false);
    });

    currentRoom.onLeave((code) => {
      console.log('Left room:', code);
      if (code > 1000) {
        // Abnormal closure
        showError('Connection lost');
        hideLobbyWaiting();
        updateConnectionStatus(false);
      }
    });

    // Send join lobby message
    currentRoom.send('join_lobby', { name: playerName });

  } catch (error) {
    console.error('Failed to join lobby:', error);
    showError('Failed to connect to server. Please try again.');
    hideLobbyWaiting();
    updateConnectionStatus(false);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (currentRoom) {
    currentRoom.leave();
  }
});

// Focus on name input
playerNameInput.focus();
