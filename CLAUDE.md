# CLAUDE.md - Guidelines for Claude Code

This file provides guidance for Claude Code when working on this project.

## Phase 1 Status: ✅ COMPLETE

**Completed:**

- Docker development environment with docker-compose
- TypeScript configuration
- Card and Deck classes with tests
- Prometheus metrics infrastructure
- Basic Colyseus server with /metrics endpoint
- Grafana dashboard setup

## Phase 2 Status: ✅ COMPLETE

**Completed:**

- Player and LobbyState schemas with comprehensive tests
- Matchmaker utility with FIFO algorithm
- LobbyRoom with full message handler implementation
- Integration tests for matchmaking flow (10 tests passing)
- REST API endpoint GET /api/lobby/count (4 tests passing)
- 4 lobby metrics (players_waiting, matches_total, match_duration, timeouts)
- Comprehensive logging throughout lobby system
- Server integration and configuration

## Phase 3 Status: ✅ COMPLETE

**Completed:**

- Base GameRoom abstract class with full lifecycle management
- IGameEngine interface for pluggable game logic
- SnapGameState and SnapEngine with complete game rules
- SnapRoom with real-time multiplayer functionality
- Complete frontend UI (vanilla JavaScript + ES6 modules)
  - Landing page, lobby page, game page
  - Real-time WebSocket synchronization with Colyseus
  - Card rendering with suit symbols and animations
  - Responsive design (mobile, tablet, desktop)
- E2E test suite with Playwright (50+ tests)
  - Game play flow tests
  - Error handling tests
  - Accessibility tests
- Comprehensive animations system
  - CSS animations (card dealing, snapping, confetti)
  - JavaScript animation utilities
  - Reduced motion support
- Complete documentation
  - API documentation (WebSocket messages, state schemas)
  - Frontend architecture guide
  - Updated README with all features

**Achievements:**

Phase 3 delivered a full-stack multiplayer card game:
- Backend: Robust game room framework with abstract base classes
- Frontend: Professional UI with no build step
- Testing: Comprehensive unit, integration, and E2E tests
- Documentation: Complete guides for both backend and frontend

**Next Phase:** Additional game types or advanced features

---

## CRITICAL: Test-First Development

**ALWAYS write tests BEFORE implementation code.**

This is non-negotiable. Every feature, bug fix, or change MUST follow this workflow:

1. **Write the test first** - Define expected behavior before writing any implementation
2. **Run the test** - Verify it fails (red phase)
3. **Write minimal implementation** - Only enough code to make the test pass
4. **Run the test** - Verify it passes (green phase)
5. **Refactor** - Improve code quality while keeping tests green
6. **Commit** - With descriptive message following conventional commits

---

## CRITICAL: Detailed Logging for Debugging

**ALWAYS include comprehensive logging in all new functionality.**

Logging is essential for debugging test failures, production issues, and understanding system behavior.

### Using the Debug Logger

**NEVER use console.log, console.warn, or console.error directly.** Instead, use the `createLogger` utility from `src/utils/logger.ts`:

```typescript
import { createLogger } from '../utils/logger';

const log = createLogger('lobby'); // Create a namespaced logger

// Info logging
log('Player joined:', {
  sessionId: client.sessionId,
  name: playerName,
  waitingCount: this.state.getWaitingCount(),
  timestamp: new Date().toISOString(),
});

// Warning logging
log.warn('Player not found in state:', {
  sessionId: client.sessionId,
});

// Error logging
log.error('Match failed:', {
  error: error.message,
  player1: match.player1SessionId,
  player2: match.player2SessionId,
  stack: error.stack,
});
```

### Enabling Debug Logs

Logs are **disabled by default in production**. Enable them using the `DEBUG` environment variable:

```bash
# Enable all cards logs
DEBUG=cards:* npm start

# Enable only lobby logs
DEBUG=cards:lobby npm start

# Enable multiple namespaces
DEBUG=cards:lobby,cards:server npm start

# Enable all logs (including dependencies)
DEBUG=* npm start
```

In Docker:
```bash
docker compose run -e DEBUG=cards:* server npm start
```

### Logger Namespaces

Use descriptive namespaces for different modules:

- `cards:server` - Server startup, shutdown, configuration
- `cards:lobby` - Lobby room operations
- `cards:matchmaker` - Matchmaking logic
- `cards:game` - Game room operations

### Logging Requirements

1. **Log all critical operations** - Room lifecycle, matchmaking, state changes
2. **Log errors with full context** - Include all relevant data when logging errors
3. **Use structured logging** - Include timestamps, sessionIds, and operation context
4. **Log entry and exit points** - Track function calls and their results
5. **Log state transitions** - Track player status changes, room state updates
6. **Include diagnostic data** - Counts, IDs, timestamps for debugging

### Logging Best Practices

```typescript
// Good: Detailed logging with context
log('Player joined:', {
  sessionId: client.sessionId,
  name: playerName,
  waitingCount: this.state.getWaitingCount(),
  timestamp: new Date().toISOString(),
});

// Good: Warning logging
log.warn('Unexpected state:', {
  expected: 'waiting',
  actual: player.status,
});

// Good: Error logging with full context
log.error('Database query failed:', {
  error: error.message,
  query: queryString,
  stack: error.stack,
});

// Bad: Using console.log directly
console.log('Player joined'); // DON'T DO THIS

// Bad: Minimal logging
log('Player joined'); // Too little context
```

### When to Add Logging

- **All room lifecycle methods** - onCreate, onJoin, onLeave, onDispose
- **All message handlers** - Every client message handler
- **All error handlers** - Catch blocks and error conditions
- **All state mutations** - Player status changes, matchmaking results
- **All external API calls** - REST endpoints, database queries
- **All timer/interval operations** - Timeout checks, periodic tasks

### Debugging with Logs

When debugging test failures or production issues:

1. Enable debug logs: `DEBUG=cards:* npm test`
2. Check logs for the sequence of events leading to the failure
3. Verify all expected operations were logged
4. Look for error messages with full context
5. Use timestamps to understand timing issues
6. Compare successful vs failed scenarios in logs

### Benefits of Debug Logger

- **Security**: No sensitive data leaked to production logs by default
- **Performance**: Zero overhead when disabled (logs compiled out)
- **Flexibility**: Enable/disable logs per namespace without code changes
- **Clarity**: Namespaced logs make it easy to filter and search
- **Production-safe**: Logs only appear when explicitly enabled

---

## CRITICAL: Prometheus Metrics

**ALWAYS add Prometheus metrics where appropriate during development.**

Metrics are essential for observability, monitoring, and understanding system behavior in production.

### Metrics Requirements

1. **Add metrics for all significant operations** - Connections, matches, games, errors
2. **Choose the right metric type** - Counter, Gauge, or Histogram
3. **Use consistent naming** - Prefix with `cards_`, use snake_case
4. **Add help text** - Clearly describe what each metric measures
5. **Update tests** - Add tests for new metrics in metrics.test.ts

### Metric Types

```typescript
// Counter - Monotonically increasing count (total connections, total matches)
this.connectionsTotal = new Counter({
  name: 'cards_connections_total',
  help: 'Total number of connections',
  registers: [this.register],
});

// Gauge - Value that can go up or down (active connections, waiting players)
this.connectionsActive = new Gauge({
  name: 'cards_connections_active',
  help: 'Current number of active connections',
  registers: [this.register],
});

// Histogram - Distribution of values (duration, latency)
this.gameDuration = new Histogram({
  name: 'cards_game_duration_seconds',
  help: 'Game duration in seconds',
  buckets: [10, 30, 60, 120, 300, 600],
  registers: [this.register],
});
```

### When to Add Metrics

- **Connection events** - Track total and active connections
- **Room lifecycle** - Track room creation, disposal, active rooms
- **Game events** - Track games started, completed, duration
- **Matchmaking** - Track matches found, waiting players, timeouts
- **Performance** - Track message latency, processing time
- **Errors** - Track error counts by type
- **Business metrics** - Track domain-specific events

### Metrics Best Practices

```typescript
// Good: Increment counter when event occurs
metrics.lobbyMatchesTotal.inc();

// Good: Set gauge to current value
metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());

// Good: Observe histogram with calculated value
const duration = (Date.now() - startTime) / 1000;
metrics.lobbyMatchDuration.observe(duration);

// Bad: Forgetting to update metrics
// (Always update metrics when significant events occur)
```

### Metric Naming Convention

- Prefix: `cards_`
- Format: `snake_case`
- Suffix:
- `_total` for counters
- `_seconds` for time measurements
- No suffix for gauges

Examples:
- `cards_connections_total` ✅
- `cards_lobby_players_waiting` ✅
- `cards_game_duration_seconds` ✅

### Testing Metrics

Always add tests for new metrics:

```typescript
it('should increment lobby matches counter', async () => {
  collector.lobbyMatchesTotal.inc();
  const metricsOutput = await collector.getMetrics();
  expect(metricsOutput).toContain('cards_lobby_matches_total 1');
});
```

---

## CRITICAL: Docker-First Development

         7. **ALL development MUST be done using Docker.**

         8. This project uses Docker and Docker Compose from the earliest stages:

         9. 1. **Start development environment**: `docker-compose up`
            2. 2. **Run tests**: `docker-compose run test`
               3. 3. **Never install dependencies locally** - Use containers only
                  4. 4. **Keep docker-compose.yml updated** - It must always work

                     5. ### Docker Commands

                     6. ```bash
                        # Start the development server
                        docker-compose up

                        # Run tests
                        docker-compose run test

                        # Run tests with watch mode
                        docker-compose run test npm run test:watch

                        # Rebuild containers after dependency changes
                        docker-compose build --no-cache
                        ```

                        ### Why Docker?

- Consistent environment across all developers
- - No "works on my machine" issues
- - Easy integration testing of the full system
- Production parity from day one
               7. ## Development Workflow

               8. ### Before Writing Any Code

               9. 1. Understand the requirement completely
                  2. 2. Write test cases that define the expected behavior
                     3. 3. Consider edge cases and error conditions
                        4. 4. Write tests for those edge cases too

                           5. ### Test Structure

                           6. ```javascript
                              describe('FeatureName', () => {
                                describe('functionName', () => {
                                  it('should [expected behavior] when [condition]', () => {
                                    // Arrange - set up test data
                                    // Act - call the function
                                    // Assert - verify the result
                                  });
                                });
                              });
                              ```

                              ### Commit Messages

                              Follow conventional commits:
- `feat:` new features
- - `fix:` bug fixes
- - `test:` adding or updating tests
- - `docs:` documentation changes
- - `refactor:` code refactoring
- - `chore:` maintenance tasks

- ## Project Structure

- ```
                                          cards/
                                          ├── src/              # Source code
                                          │   └── index.js      # Main entry point
                                          ├── tests/            # Test files
                                          │   ├── unit/         # Unit tests
                                          │   └── integration/  # Integration tests
                                          ├── .github/
                                          │   └── workflows/    # CI/CD workflows
                                          ├── package.json      # Dependencies and scripts
                                          └── jest.config.js    # Jest configuration
                                          ```

                                          ## Commands

                                          ```bash
                                          npm test              # Run all tests
                                          npm run test:watch    # Run tests in watch mode
                                          npm run test:coverage # Run tests with coverage
                                          npm run lint          # Run ESLint
                                          npm run lint:fix      # Fix linting issues
                                          npm start             # Run the application
                                          ```

                                          ## Code Quality Standards

- All new code MUST have tests
- - Test coverage should be maintained above 80%
- - No code should be merged without passing CI
- - Use meaningful variable and function names
- - Keep functions small and focused
- - Document complex logic with comments

- ## When Asked to Implement a Feature

- 1. **Ask clarifying questions** if requirements are unclear
                                                      2. 2. **Write tests first** that capture the requirements
                                                         3. 3. **Show the failing tests** to the user
                                                            4. 4. **Implement the feature** to make tests pass
                                                               5. 5. **Refactor if needed** while keeping tests green
                                                                  6. 6. **Update documentation** if necessary

                                                                     7. ---

## CRITICAL: Pre-PR Checklist

**ALWAYS run these checks locally BEFORE creating a pull request.**

All PRs must pass CI checks. Running these locally ensures faster iteration and prevents CI failures.

### Quick Check (Run This First!)

```bash
# Run all checks in sequence - stops on first failure
docker compose run --rm test npm run ci:check
```

This runs all checks in the exact same order as CI:
1. TypeScript type checking (`typecheck`)
2. Build verification (`build`)
3. Prettier formatting (`format:check`)
4. ESLint linting (`lint`)
5. Tests (`test`)

If this passes, your PR will pass CI! ✅

### Individual Checks

If the quick check fails, run these individually to identify the issue:

```bash
# 1. Format checking (MUST RUN FIRST - fixes before linting)
docker compose run --rm test npm run format:check

# 2. TypeScript type checking
docker compose run --rm test npm run typecheck

# 3. Build check
docker compose run --rm test npm run build

# 4. Linting
docker compose run --rm test npm run lint

# 5. Tests
docker compose run --rm test npm test

# 6. Test coverage (should maintain 80%+)
docker compose run --rm test npm run test:coverage
```

### What CI Checks

The GitHub Actions CI workflow runs:
- **Lint job**:
- `npm run format:check` - Prettier code formatting
- `npm run lint` - ESLint
- **Test jobs**: Tests on Node 18.x and 20.x with coverage

**CRITICAL**: CI runs `format:check` BEFORE `lint`. Always run format:check first locally too!

All of these must pass before a PR can be merged.

### Fixing Issues

If checks fail, fix them in this order:

```bash
# 1. Fix formatting issues FIRST (auto-fix)
docker compose run --rm test npm run format

# 2. Verify formatting is fixed
docker compose run --rm test npm run format:check

# 3. Fix linting issues (auto-fix where possible)
docker compose run --rm test npm run lint:fix

# 4. Verify linting passes
docker compose run --rm test npm run lint

# 5. Fix TypeScript errors (manual)
# Review compiler errors and fix manually

# 6. Fix failing tests (manual)
# Review test output and fix code/tests
```

**Note**: Always fix formatting before linting - Prettier can auto-fix many style issues that ESLint would warn about.

---

## Do NOT

                                                                     8. - Write implementation code without tests
- - Skip tests for "simple" functions
- - Commit code that breaks existing tests
- - Ignore test coverage requirements
- - Write tests after implementation (except for legacy code)

- ## Remember

- Tests are not optional. Tests are not an afterthought. Tests come FIRST.

- This project values quality and maintainability over speed. Take the time to write proper tests.
