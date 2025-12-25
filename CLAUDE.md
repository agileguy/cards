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

**Next Phase:** Game room implementation

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
console.log('[LobbyRoom] Player joined:', {
  sessionId: client.sessionId,
  name: playerName,
  waitingCount: this.state.getWaitingCount(),
  timestamp: new Date().toISOString(),
});

// Good: Error logging with full context
console.error('[LobbyRoom] Match failed:', {
  error: error.message,
  player1: match.player1SessionId,
  player2: match.player2SessionId,
  stack: error.stack,
});

// Bad: Minimal logging
console.log('Player joined');
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

1.  Check logs for the sequence of events leading to the failure
2.  Verify all expected operations were logged
3.  Look for error messages with full context
4.  Use timestamps to understand timing issues
5.  Compare successful vs failed scenarios in logs

         6. ## CRITICAL: Docker-First Development

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

                                                                     7. ## Do NOT

                                                                     8. - Write implementation code without tests
                                                                        - - Skip tests for "simple" functions
                                                                          - - Commit code that breaks existing tests
                                                                            - - Ignore test coverage requirements
                                                                              - - Write tests after implementation (except for legacy code)

                                                                                - ## Remember

                                                                                - Tests are not optional. Tests are not an afterthought. Tests come FIRST.

                                                                                - This project values quality and maintainability over speed. Take the time to write proper tests.
