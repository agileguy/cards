# Cards - Two Player Card Game Server

A multiplayer card game server using Colyseus framework with TypeScript, Docker, and comprehensive observability.

## Features

- TypeScript-based Colyseus game server
- Matchmaking lobby system with FIFO algorithm
- Full frontend UI with real-time synchronization
- Vanilla JavaScript with ES6 modules (no build step)
- Comprehensive E2E testing with Playwright
- Docker-first development environment
- Prometheus metrics and Grafana dashboards
- Test-driven development with comprehensive test coverage
- Card and Deck utilities for building card games
- Professional animations and responsive design

## Frontend

Access the game UI at **http://localhost:2567**

### Pages

- `/` - Landing page with game selection
- `/lobby.html` - Join matchmaking queue and select game type
- `/game.html?matchId=<id>` - Play Snap card game
- `/war.html?matchId=<id>` - Play War card game

### Features

- **Real-time multiplayer**: Colyseus WebSocket synchronization
- **Responsive design**: Mobile, tablet, and desktop support
- **Animations**: Smooth card dealing, snap effects, victory confetti
- **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- **No build step**: Vanilla JavaScript with ES6 modules

### Frontend Development

```bash
# Start server (frontend served at root)
docker compose up

# Run E2E tests
docker compose run e2e

# Run E2E tests in headed mode
docker compose run e2e npx playwright test --headed

# Run E2E tests in debug mode
docker compose run e2e npx playwright test --debug
```

See [docs/FRONTEND.md](./docs/FRONTEND.md) for complete frontend architecture guide.

## Games

The server implements a pluggable game architecture supporting multiple card games. All games use the same lobby system for matchmaking, with players matched based on their selected game type.

### Snap

**Type**: Turn-based card game
**Players**: 2
**Objective**: Collect all 52 cards by winning snap battles

**Rules:**
1. Players alternate playing cards to a central pile
2. When two consecutive cards have the same rank, players race to click "Snap!"
3. First player to snap correctly wins the entire pile
4. Incorrect snaps incur a one-card penalty
5. Game ends when one player collects all cards

**Architecture:**
- State: `SnapGameState` (central pile, turn tracking)
- Engine: `SnapEngine` (turn-based logic, snap validation)
- Room: `SnapRoom` (message handlers for play_card and snap)

### War

**Type**: Simultaneous-play card game
**Players**: 2
**Objective**: Collect all 52 cards by winning battles

**Rules:**
1. Deck is split evenly (26 cards each)
2. Both players flip cards simultaneously
3. Higher rank wins both cards (Ace = 13 is highest)
4. On tie → WAR: Each player plays 3 face-down cards, then 1 face-up. Winner of face-up battle takes all cards
5. Game ends when one player has all cards or runs out during a war

**Architecture:**
- State: `WarGameState` (battle pile, ready tracking, war state)
- Engine: `WarEngine` (simultaneous play, war mechanism, battle resolution)
- Room: `WarRoom` (message handler for flip_card)

**Key Differences from Snap:**
- No turn system (both players can act simultaneously)
- Cards have faceUp state (for face-down cards during war)
- playersReady tracking to detect when both have flipped
- Recursive war mechanism for nested ties

## Prerequisites

- Docker >= 20.x
- Docker Compose >= 2.x
- Node.js >= 18.x (for local development)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/agileguy/cards.git
cd cards

# Start the entire system (server + observability)
docker compose up

# The following services will be available:
# - Game Server: http://localhost:2567
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000 (admin/admin)
# - Colyseus Monitor: http://localhost:2567/colyseus
# - Metrics: http://localhost:2567/metrics
# - Health Check: http://localhost:2567/health
```

## Development

### Running Tests

```bash
# Run all tests in Docker
docker compose run test

# Run tests in watch mode
docker compose run test npm run test:watch

# Run tests with coverage
docker compose run test npm run test:coverage
```

### Debug Logging

The application uses the `debug` package for structured logging. Logs are **disabled by default** in production. Enable them using the `DEBUG` environment variable:

```bash
# Enable all logs
DEBUG=cards:* docker compose up

# Enable specific namespace logs
DEBUG=cards:lobby docker compose up
DEBUG=cards:server docker compose up

# Enable multiple namespaces
DEBUG=cards:lobby,cards:server docker compose up
```

Available namespaces:
- `cards:server` - Server startup, shutdown, configuration
- `cards:lobby` - Lobby room operations, matchmaking

The logger is production-safe - no logs are emitted unless explicitly enabled.

### Local Development (without Docker)

```bash
npm install
npm run start:dev    # Start with hot reload
npm test            # Run tests
npm run build       # Build TypeScript
```

## Project Structure

```
cards/
├── src/                      # Backend (TypeScript)
│   ├── server/
│   │   ├── index.ts          # Server entry point
│   │   └── config.ts         # Configuration
│   ├── rooms/
│   │   ├── LobbyRoom.ts      # Matchmaking lobby
│   │   ├── GameRoom.ts       # Abstract game base class
│   │   ├── SnapRoom.ts       # Snap game implementation
│   │   └── WarRoom.ts        # War game implementation
│   ├── games/
│   │   ├── IGameEngine.ts    # Game engine interface
│   │   ├── snap/
│   │   │   └── SnapEngine.ts # Snap game logic
│   │   └── war/
│   │       └── WarEngine.ts  # War game logic
│   ├── schemas/
│   │   ├── Player.ts         # Player schema
│   │   ├── LobbyState.ts     # Lobby state schema
│   │   ├── BaseGameState.ts  # Base game state
│   │   ├── SnapGameState.ts  # Snap game state
│   │   └── WarGameState.ts   # War game state
│   └── utils/
│       ├── Card.ts           # Card class
│       ├── Deck.ts           # Deck class
│       ├── Matchmaker.ts     # Matchmaking logic
│       └── metrics.ts        # Prometheus metrics
│
├── public/                   # Frontend (Vanilla JS)
│   ├── index.html            # Landing page
│   ├── lobby.html            # Matchmaking page
│   ├── game.html             # Snap game board
│   ├── war.html              # War game board
│   ├── css/
│   │   ├── style.css         # Main styles
│   │   ├── cards.css         # Card rendering
│   │   ├── animations.css    # Animation library
│   │   └── war.css           # War game specific styles
│   └── js/
│       ├── client.js         # Colyseus client wrapper
│       ├── lobby.js          # Lobby page logic
│       ├── game.js           # Snap game page logic
│       ├── war.js            # War game page logic
│       ├── lib/              # External libraries
│       ├── components/       # UI components
│       └── utils/            # Utilities
│
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests (Playwright)
│
├── docs/
│   ├── API.md                # WebSocket API documentation
│   ├── FRONTEND.md           # Frontend architecture guide
│   ├── PLAN.md               # Project roadmap
│   └── TESTING.md            # Testing philosophy
│
├── docker-compose.yml        # Multi-service orchestration
├── Dockerfile                # Multi-stage build
├── playwright.config.ts      # E2E test configuration
├── prometheus.yml            # Prometheus config
└── grafana/                  # Grafana provisioning
```

## Lobby System

The lobby system provides automatic matchmaking for players using a FIFO (First-In-First-Out) algorithm.

### Connecting to the Lobby

Connect to the lobby room via WebSocket:

```javascript
const client = new Colyseus.Client('ws://localhost:2567');
const lobby = await client.joinOrCreate('lobby', { name: 'PlayerName' });
```

### WebSocket Messages

**Client → Server:**
- `join_lobby` - Join the matchmaking queue (sent after connecting to room)
- `leave_lobby` - Leave the matchmaking queue

**Server → Client:**
- `joined_lobby` - Acknowledgment with `{ sessionId, waitingCount }`
- `left_lobby` - Acknowledgment of leave
- `matched` - Match found! Contains `{ matchId, opponentSessionId, matchedAt }`
- `timeout` - No match found within 30 seconds, being disconnected

### Example Usage

```javascript
// Join the lobby
lobby.send('join_lobby', { name: 'Alice' });

// Listen for match
lobby.onMessage('matched', (message) => {
  console.log('Matched!', message.matchId, message.opponentSessionId);
  // Join game room with matchId
});

// Listen for timeout
lobby.onMessage('timeout', (message) => {
  console.log('No match found:', message.reason);
});
```

### Configuration

Lobby behavior can be configured via environment variables:

- `LOBBY_TIMEOUT_MS` - Maximum wait time before timeout (default: 30000ms)
- `LOBBY_CHECK_INTERVAL_MS` - How often to check for timeouts (default: 5000ms)

## Observability

### Metrics

The server exposes Prometheus metrics at `/metrics`:

**Connection Metrics:**
- `cards_connections_total` - Total connections
- `cards_connections_active` - Active connections

**Room Metrics:**
- `cards_rooms_total` - Total rooms created
- `cards_rooms_active` - Active rooms
- `cards_room_players` - Players per room (histogram)

**Lobby Metrics:**
- `cards_lobby_players_waiting` - Current number of players waiting in lobby
- `cards_lobby_matches_total` - Total successful matches
- `cards_lobby_match_duration_seconds` - Time to find match (histogram)
- `cards_lobby_timeouts_total` - Total lobby timeouts

**Game Metrics:**
- `cards_games_started_total` - Games started
- `cards_games_completed_total` - Games completed
- `cards_game_duration_seconds` - Game duration (histogram)

**Performance Metrics:**
- `cards_message_latency_seconds` - Message latency (histogram)

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/admin) to visualize metrics.

## API Endpoints

### REST API

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /colyseus` - Colyseus monitor dashboard
- `GET /api/lobby/count` - Get current number of waiting players in lobby
- `GET /api/games` - List available games

### WebSocket Rooms

- `ws://localhost:2567/lobby` - Matchmaking lobby room
- `ws://localhost:2567/snap` - Snap card game room
- `ws://localhost:2567/war` - War card game room

See [docs/API.md](./docs/API.md) for complete WebSocket API documentation.

## Testing Philosophy

This project follows strict **Test-Driven Development (TDD)**. See [TESTING.md](./TESTING.md) for details.

## Contributing

1. Write tests first (TDD approach)
2. Ensure all tests pass in Docker
3. Follow existing code style
4. Update documentation

## License

ISC
