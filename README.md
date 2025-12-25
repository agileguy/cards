# Cards - Two Player Card Game Server

A multiplayer card game server using Colyseus framework with TypeScript, Docker, and comprehensive observability.

## Features

- TypeScript-based Colyseus game server
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
│   └── utils/
│       ├── Card.ts           # Card class
│       ├── Deck.ts           # Deck class
│       └── metrics.ts        # Prometheus metrics
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── docker-compose.yml        # Multi-service orchestration
├── Dockerfile                # Multi-stage build
├── prometheus.yml            # Prometheus config
└── grafana/                  # Grafana provisioning
```

## Observability

### Metrics

The server exposes Prometheus metrics at `/metrics`:

- `cards_connections_total` - Total connections
- `cards_connections_active` - Active connections
- `cards_rooms_total` - Total rooms created
- `cards_rooms_active` - Active rooms
- `cards_room_players` - Players per room (histogram)
- `cards_games_started_total` - Games started
- `cards_games_completed_total` - Games completed
- `cards_game_duration_seconds` - Game duration (histogram)
- `cards_message_latency_seconds` - Message latency (histogram)

### Grafana Dashboards

Access Grafana at http://localhost:3000 (admin/admin) to visualize metrics.

## API Endpoints

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /colyseus` - Colyseus monitor dashboard

## Testing Philosophy

This project follows strict **Test-Driven Development (TDD)**. See [TESTING.md](./TESTING.md) for details.

## Contributing

1. Write tests first (TDD approach)
2. Ensure all tests pass in Docker
3. Follow existing code style
4. Update documentation

## License

ISC
