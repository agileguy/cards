# Cards - Two Player Card Game Server

A multiplayer card game server using Colyseus framework with TypeScript, Docker, and comprehensive observability.

## Features

- TypeScript-based Colyseus game server
- Matchmaking lobby system with FIFO algorithm
- Docker-first development environment
- Prometheus metrics and Grafana dashboards
- Test-driven development with comprehensive test coverage
- Card and Deck utilities for building card games

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
├── src/
│   ├── server/
│   │   ├── index.ts          # Server entry point
│   │   └── config.ts         # Configuration
│   ├── rooms/
│   │   └── LobbyRoom.ts      # Matchmaking lobby
│   ├── schemas/
│   │   ├── Player.ts         # Player schema
│   │   └── LobbyState.ts     # Lobby state schema
│   └── utils/
│       ├── Card.ts           # Card class
│       ├── Deck.ts           # Deck class
│       ├── Matchmaker.ts     # Matchmaking logic
│       └── metrics.ts        # Prometheus metrics
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docker-compose.yml        # Multi-service orchestration
├── Dockerfile                # Multi-stage build
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

### WebSocket Rooms

- `ws://localhost:2567/lobby` - Matchmaking lobby room

## Testing Philosophy

This project follows strict **Test-Driven Development (TDD)**. See [TESTING.md](./TESTING.md) for details.

## Contributing

1. Write tests first (TDD approach)
2. Ensure all tests pass in Docker
3. Follow existing code style
4. Update documentation

## License

ISC
