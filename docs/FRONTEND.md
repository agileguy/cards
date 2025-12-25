# Frontend Architecture Guide

Complete guide to the Cards game frontend implementation.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Client Architecture](#client-architecture)
- [State Management](#state-management)
- [Component System](#component-system)
- [Styling System](#styling-system)
- [Animation System](#animation-system)
- [Testing Strategy](#testing-strategy)
- [Development Workflow](#development-workflow)
- [Adding New Games](#adding-new-games)
- [Performance Optimization](#performance-optimization)
- [Accessibility](#accessibility)

## Overview

The frontend is built with vanilla JavaScript and ES6 modules, providing a lightweight, fast, and maintainable codebase without build complexity.

### Design Principles

1. **Vanilla JavaScript**: No framework overhead, maximum performance
2. **ES6 Modules**: Modern module system with native browser support
3. **Progressive Enhancement**: Works without JavaScript (for static content)
4. **Mobile-First**: Responsive design starting from smallest screens
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Real-Time Sync**: Colyseus handles state synchronization

## Project Structure

```
public/
├── index.html              # Landing page
├── lobby.html              # Matchmaking page
├── game.html               # Game board page
│
├── css/
│   ├── style.css           # Main styles (454 lines)
│   ├── cards.css           # Card rendering (221 lines)
│   └── animations.css      # Animations (460 lines)
│
└── js/
    ├── client.js           # GameClient wrapper for Colyseus
    ├── lobby.js            # Lobby page logic
    ├── game.js             # Game page logic
    │
    ├── lib/
    │   └── colyseus.js     # Colyseus client CDN loader
    │
    ├── components/
    │   └── card.js         # Card rendering utilities
    │
    └── utils/
        └── animations.js   # Animation utilities
```

## Technology Stack

### Core Technologies

- **HTML5**: Semantic markup, accessibility attributes
- **CSS3**: Flexbox, Grid, custom properties, animations
- **ES6+ JavaScript**: Modules, async/await, classes
- **Colyseus Client**: Real-time WebSocket communication

### No Build Step

The project intentionally avoids build tools:
- No bundler (Webpack, Vite, etc.)
- No transpiler (Babel, TypeScript compilation)
- No CSS preprocessor (Sass, Less)

**Benefits:**
- Instant development iteration
- Simple Docker setup
- Easy debugging
- Smaller learning curve

**Trade-offs:**
- No TypeScript type checking (could add with JSDoc)
- No CSS nesting (use BEM methodology instead)
- Manual dependency management

## Client Architecture

### GameClient (`/js/client.js`)

Wrapper around Colyseus client providing clean API.

```javascript
export class GameClient {
  constructor(serverUrl);
  async initialize();
  async joinLobby(playerName);
  async joinGame(roomId);
  async createGame(gameType, options);
  async disconnect();
  isConnected();
}
```

**Usage:**

```javascript
import { GameClient } from './client.js';

const client = new GameClient();

// Join lobby
const room = await client.joinLobby('PlayerName');

// Join specific game
const gameRoom = await client.joinGame(matchId);
```

### Colyseus Integration

The client is loaded dynamically from CDN:

```javascript
// /js/lib/colyseus.js
export async function loadColyseusClient() {
  if (window.Colyseus) return window.Colyseus;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/colyseus.js@^0.15.0/dist/colyseus.js';
    script.onload = () => resolve(window.Colyseus);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

**Why CDN?**
- No npm dependency
- Smaller repository size
- Browser caching across sites
- Automatic updates (within version range)

## State Management

### Colyseus State Synchronization

The server owns the game state; clients receive updates automatically.

```javascript
// Listen to all state changes
room.state.onChange = () => {
  gameState = room.state;
  updateUI();
};

// Listen to specific properties
room.state.listen('centralPile', (value) => {
  updateCentralPile();
});

room.state.listen('currentTurn', (value) => {
  updateTurnIndicator();
  updateActionButtons();
});
```

### Local UI State

For UI-only state (animations, modals), use local variables:

```javascript
// Local state
let isModalOpen = false;
let currentAnimation = null;
let errorTimeout = null;

// State updates
function showModal() {
  isModalOpen = true;
  modal.classList.add('active');
}

function hideModal() {
  isModalOpen = false;
  modal.classList.remove('active');
}
```

### No Global State Library

We don't use Redux, MobX, or similar because:
- Colyseus handles server state
- UI state is minimal
- Event-driven updates are sufficient

## Component System

### Utility-Based Components

Instead of web components (Shadow DOM), we use utility functions:

```javascript
// /js/components/card.js

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
```

**Usage:**

```javascript
import { createCard, animateCardDeal } from './components/card.js';

const card = createCard('hearts', 1);  // Ace of Hearts
container.appendChild(card);
animateCardDeal(card);
```

### Helper Functions

```javascript
// Suit symbols
export function getSuitSymbol(suit) {
  const symbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
  };
  return symbols[suit] || suit;
}

// Rank names
export function getRankName(rank) {
  const names = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K'
  };
  return names[rank] || rank.toString();
}

// Clear container
export function clearCards(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}
```

## Styling System

### CSS Architecture

**1. CSS Custom Properties (Variables)**

```css
:root {
  /* Colors */
  --primary-color: #2196F3;
  --secondary-color: #4CAF50;
  --danger-color: #F44336;
  --bg-color: #1a1a2e;
  --text-color: #eee;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Timing */
  --transition-fast: 0.15s;
  --transition-normal: 0.3s;
  --transition-slow: 0.5s;
}
```

**2. BEM Methodology**

```css
/* Block */
.card {}

/* Element */
.card__suit {}
.card__rank {}

/* Modifier */
.card--flipped {}
.card--back {}
```

**3. Mobile-First Responsive**

```css
/* Mobile (default) */
.game-board {
  flex-direction: column;
}

/* Tablet */
@media (min-width: 768px) {
  .game-board {
    flex-direction: row;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .game-board {
    max-width: 1200px;
  }
}
```

### CSS Organization

1. **style.css**: Layout, typography, forms, buttons
2. **cards.css**: Card-specific styles and animations
3. **animations.css**: Reusable animation keyframes

## Animation System

### CSS Animations

Preferred for performance (GPU-accelerated):

```css
@keyframes dealCard {
  from {
    transform: translateY(-100px) rotate(-10deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) rotate(0) scale(1);
    opacity: 1;
  }
}

.card-dealing {
  animation: dealCard 0.5s ease-out;
}
```

### JavaScript Animations

For complex timing or conditional logic:

```javascript
import { animateDeal, showVictoryConfetti } from './utils/animations.js';

// Staggered card dealing
animateDeal(cards, container, 100);

// Victory celebration
if (wonGame) {
  showVictoryConfetti();
}
```

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Strategy

### E2E Testing with Playwright

All user flows are tested end-to-end:

```typescript
// tests/e2e/game-play.spec.ts
test('game page loads and connects', async ({ page }) => {
  await page.goto('/game.html?matchId=test-1');
  await expect(page.locator('.game-board')).toBeVisible();
  await expect(page.locator('.status-text')).toContainText('Connected');
});
```

### Test Categories

1. **Lobby Flow**: Joining, matchmaking, navigation
2. **Game Play**: Card playing, snapping, turn management
3. **Full Game**: Complete game from start to finish
4. **Error Handling**: Network errors, validation, timeouts
5. **Accessibility**: Keyboard nav, screen readers, ARIA
6. **Responsive**: Mobile, tablet, desktop viewports

### Running Tests

```bash
# Run all E2E tests
docker compose run e2e

# Run specific test file
docker compose run e2e npx playwright test lobby-flow

# Run in headed mode (with browser UI)
docker compose run e2e npx playwright test --headed

# Run in debug mode
docker compose run e2e npx playwright test --debug
```

## Development Workflow

### Setup

1. **Start the server**:
   ```bash
   docker compose up
   ```

2. **Access the app**:
   ```
   http://localhost:2567
   ```

3. **Make changes**:
   - Edit files in `public/`
   - Refresh browser (no build step!)

4. **Run tests**:
   ```bash
   docker compose run e2e
   ```

### File Watching

Since there's no build step, changes are instant:
- HTML/CSS changes: Just refresh
- JavaScript changes: Hard refresh (Ctrl+Shift+R)
- Server changes: Auto-reload with nodemon

### Debugging

**Browser DevTools:**
- Source maps work natively (no transpilation)
- Set breakpoints directly in source files
- Network tab shows WebSocket frames

**Console Logging:**
```javascript
console.log('State updated:', gameState);
console.table(players);
console.time('render');
updateUI();
console.timeEnd('render');
```

## Adding New Games

### 1. Create Game Files

```
public/
├── new-game.html           # Game page
└── js/
    └── new-game.js         # Game logic
```

### 2. Implement Game Logic

```javascript
// /js/new-game.js
import { GameClient } from './client.js';

const client = new GameClient();
const matchId = new URLSearchParams(window.location.search).get('matchId');

async function initGame() {
  const room = await client.joinGame(matchId);

  room.state.onChange = () => {
    updateUI(room.state);
  };

  room.onMessage('game_event', (message) => {
    handleGameEvent(message);
  });

  // Action handlers
  document.getElementById('actionBtn').addEventListener('click', () => {
    room.send('action', { type: 'move' });
  });
}

initGame();
```

### 3. Add Game to Lobby

Update matchmaking to support the new game type.

### 4. Create E2E Tests

```typescript
// tests/e2e/new-game.spec.ts
test('new game works', async ({ page }) => {
  await page.goto('/new-game.html?matchId=test-1');
  await expect(page.locator('.game-board')).toBeVisible();
});
```

## Performance Optimization

### Best Practices

**1. Minimize DOM Manipulation**

```javascript
// Bad: Multiple reflows
for (let card of cards) {
  container.appendChild(card);
}

// Good: Single reflow
const fragment = document.createDocumentFragment();
for (let card of cards) {
  fragment.appendChild(card);
}
container.appendChild(fragment);
```

**2. Use Event Delegation**

```javascript
// Bad: Multiple listeners
cards.forEach(card => {
  card.addEventListener('click', handleClick);
});

// Good: Single listener
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('card')) {
    handleClick(e);
  }
});
```

**3. Debounce Expensive Operations**

```javascript
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const debouncedUpdate = debounce(updateUI, 100);
room.state.onChange = debouncedUpdate;
```

**4. Use RequestAnimationFrame**

```javascript
function smoothUpdate() {
  requestAnimationFrame(() => {
    updateUI();
  });
}
```

### Bundle Size

Current sizes (unminified):
- `style.css`: ~20 KB
- `cards.css`: ~10 KB
- `animations.css`: ~15 KB
- `client.js`: ~3 KB
- `lobby.js`: ~4 KB
- `game.js`: ~10 KB

Total: ~62 KB (before compression)

With gzip: ~15 KB

## Accessibility

### Keyboard Navigation

All interactive elements must be keyboard-accessible:

```javascript
// Tab order
<button tabindex="0">Play Card</button>
<button tabindex="0">SNAP!</button>

// Enter/Space activation
button.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    button.click();
  }
});
```

### ARIA Attributes

```html
<!-- Button states -->
<button aria-label="Play Card" aria-disabled="true">
  Play Card
</button>

<!-- Status messages -->
<div role="status" aria-live="polite">
  Your turn!
</div>

<!-- Alerts -->
<div role="alert" class="error-message">
  Connection lost
</div>
```

### Screen Reader Support

```html
<!-- Descriptive labels -->
<input
  type="text"
  id="playerName"
  aria-label="Enter your player name"
  required
/>

<!-- Status announcements -->
<div aria-live="polite" class="sr-only">
  Card played: Ace of Hearts
</div>
```

### Color Contrast

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: Visual indicators beyond color

## Common Patterns

### Error Handling

```javascript
try {
  const room = await client.joinLobby(playerName);
  updateConnectionStatus(true);
} catch (error) {
  console.error('Failed to join:', error);
  showError('Failed to connect. Please try again.');
  updateConnectionStatus(false);
}
```

### Loading States

```javascript
function showLoadingSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  container.appendChild(spinner);
  return spinner;
}

const spinner = showLoadingSpinner();
try {
  await longOperation();
} finally {
  spinner.remove();
}
```

### Form Validation

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  if (!name) {
    showError('Please enter your name');
    return;
  }

  if (name.length < 2 || name.length > 20) {
    showError('Name must be 2-20 characters');
    return;
  }

  submitForm(name);
});
```

## Further Reading

- [Colyseus Client SDK](https://docs.colyseus.io/client/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [WCAG Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
