# Cards - Two Player Card Game Server

## Project Overview

A multiplayer card game server that allows players to match in a lobby and play various card games. The minimum viable product (MVP) will support a game of **Snap**, with an architecture designed to easily add new games in the future.

## Technology Stack

### Core Framework: Colyseus

We will use **Colyseus** as our game server framework. Colyseus provides:

- Real-time multiplayer game server for Node.js
- - Built-in room management and matchmaking
- - State synchronization between server and clients
- - WebSocket-based communication
- - Schema-based state serialization for efficient bandwidth usage
- - Built-in lobby system
         
- ### Why Colyseus?
         
- 1. **Battle-tested**: Used in production by many multiplayer games
            2. 2. **Room-based architecture**: Perfect for card games where players join game rooms
               3. 3. **State management**: Automatic state sync reduces boilerplate code
                  4. 4. **Scalability**: Supports horizontal scaling with Redis
                     5. 5. **TypeScript support**: Full TypeScript definitions included
                        6. 6. **Active community**: Well-maintained with good documentation
                          
                           7. ### Additional Dependencies
                          
                           8. - **@colyseus/schema**: State serialization
- - **@colyseus/monitor**: Admin dashboard for monitoring rooms
- - **express**: HTTP server for REST endpoints
- - **uuid**: Unique identifier generation
                                   
- ## Architecture
                                   
- ### High-Level Design
                                   
- ```
                                      ┌─────────────────────────────────────────────────────────────┐
                                      │                        Clients                               │
                                      │         (Web browsers / Mobile apps)                         │
                                      └─────────────────────┬───────────────────────────────────────┘

                                      ### Docker Development Environment

                                      All development MUST be done using Docker from the earliest stages of the project. This ensures consistent development environments and simplifies deployment.

                                      #### Requirements

- **Docker**: All services run in containers
- **Docker Compose**: Orchestration for the complete system
- **docker-compose.yml**: Must be maintained from day one

                                      #### Development Workflow

                                      1. **Local Development**: `docker-compose up` starts the entire system
                                      2. **Testing**: All tests run inside Docker containers
                                      3. **CI/CD**: GitHub Actions use Docker for consistent builds

                                      #### Docker Compose Services

                                      ```yaml
                                      services:
                                        # Game server
                                        server:
                                          build: .
                                          ports:
- "2567:2567"
                                          volumes:
- .:/app
- /app/node_modules
                                          environment:
- NODE_ENV=development

                                        # Test runner
                                        test:
                                          build: .
                                          command: npm test
                                          volumes:
- .:/app
- /app/node_modules

                                        # Optional: Redis for scaling (future)
                                        # redis:
                                        #   image: redis:alpine
                                        #   ports:
                                        #     - "6379:6379"
                                      ```
                                   
                                      #### Benefits
                                   
- **Consistency**: Same environment for all developers
- - **Isolation**: No conflicts with local Node.js versions
- - **Integration Testing**: Easy to test full system locally
- - **Production Parity**: Development matches production setup
- 
                                            ### Observability and Metrics
                                         
                                            **All services MUST emit metrics to Prometheus from the outset.** Observability is not optional - it is a core requirement from day one.
                                         
                                            #### Requirements
                                         
- **Prometheus**: Metrics collection and storage
- - **Grafana**: Visualization and dashboards
- - **prom-client**: Node.js Prometheus client library
- - All services expose `/metrics` endpoint
                                                 
- #### Metrics to Collect
                                                 
- From the start, the server MUST emit:
                                                 
- 1. **Connection Metrics**
                                                    2.    - `cards_connections_total` - Total connections (counter)
-    - `cards_connections_active` - Current active connections (gauge)
                                                           
- 2. **Room Metrics**
                                                                 3.    - `cards_rooms_total` - Total rooms created (counter)
-    - `cards_rooms_active` - Current active rooms (gauge)
-    - `cards_room_players` - Players per room (histogram)
                                                                             
- 3. **Game Metrics**
                                                                                   4.    - `cards_games_started_total` - Games started (counter)
-    - `cards_games_completed_total` - Games completed (counter)
-    - `cards_game_duration_seconds` - Game duration (histogram)
                                                                                               
- 4. **Performance Metrics**
                                                                                                     5.    - `cards_message_latency_seconds` - Message processing time (histogram)
-    - `cards_state_sync_duration_seconds` - State sync time (histogram)
                                                                                                            
- #### Docker Compose Integration
                                                                                                            
- Prometheus and Grafana are included in the development environment:
                                                                                                            
- ```yaml
                                                                                                                  services:
                                                                                                                    # ... existing services ...

                                                                                                                    prometheus:
                                                                                                                      image: prom/prometheus:latest
                                                                                                                      ports:
- "9090:9090"
                                                                                                                      volumes:
- ./prometheus.yml:/etc/prometheus/prometheus.yml
- prometheus_data:/prometheus
                                                                                                                      command:
- '--config.file=/etc/prometheus/prometheus.yml'

                                                                                                                    grafana:
                                                                                                                      image: grafana/grafana:latest
                                                                                                                      ports:
- "3000:3000"
                                                                                                                      volumes:
- grafana_data:/var/lib/grafana
- ./grafana/dashboards:/etc/grafana/provisioning/dashboards
                                                                                                                      environment:
- GF_SECURITY_ADMIN_PASSWORD=admin
                                                                                                                      depends_on:
- prometheus

                                                                                                                  volumes:
                                                                                                                    prometheus_data:
                                                                                                                    grafana_data:
                                                                                                                  ```
                                                   
                                                                                                                  #### Prometheus Configuration
                                                   
                                                                                                                  ```yaml
                                                                                                                  # prometheus.yml
                                                                                                                  global:
                                                                                                                    scrape_interval: 15s

                                                                                                                  scrape_configs:
- job_name: 'cards-server'
                                                                                                                      static_configs:
- targets: ['server:2567']
                                                                                                                  ```
                                                   
                                                                                                                  #### Implementation Notes
                                                   
- Use `prom-client` npm package for metrics
- - Expose metrics on `/metrics` endpoint
- - Create default Grafana dashboard for game metrics
- - Set up alerts for critical metrics (high latency, connection drops)
                                                            │ WebSocket
                                      ┌─────────────────────▼───────────────────────────────────────┐
                                      │                   Colyseus Server                            │
                                      │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
                                      │  │   Lobby     │  │  Game Room  │  │   Game Room         │  │
                                      │  │   Room      │  │   (Snap)    │  │   (Future Game)     │  │
                                      │  └─────────────┘  └─────────────┘  └─────────────────────┘  │
                                      │                                                              │
                                      │  ┌───────────────────────────────────────────────────────┐  │
                                      │  │              Game Engine (Pluggable)                   │  │
                                      │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐   │  │
                                      │  │  │  Snap   │  │  War    │  │   Future Games      │   │  │
                                      │  │  │ Engine  │  │ Engine  │  │      ...            │   │  │
                                      │  │  └─────────┘  └─────────┘  └─────────────────────┘   │  │
                                      │  └───────────────────────────────────────────────────────┘  │
                                      └─────────────────────────────────────────────────────────────┘
                                      ```

                                      ### Directory Structure

                                      ```
                                      src/
                                      ├── server/
                                      │   ├── index.ts              # Server entry point
                                      │   ├── config.ts             # Server configuration
                                      │   └── ColyseusServer.ts     # Colyseus server setup
                                      ├── rooms/
                                      │   ├── LobbyRoom.ts          # Matchmaking lobby
                                      │   ├── GameRoom.ts           # Base game room class
                                      │   └── SnapRoom.ts           # Snap-specific room
                                      ├── games/
                                      │   ├── BaseGame.ts           # Abstract game interface
                                      │   ├── snap/
                                      │   │   ├── SnapGame.ts       # Snap game logic
                                      │   │   ├── SnapState.ts      # Snap state schema
                                      │   │   └── SnapRules.ts      # Snap rules/validation
                                      │   └── [future-game]/        # Future game implementations
                                      ├── schemas/
                                      │   ├── Player.ts             # Player schema
                                      │   ├── Card.ts               # Card schema
                                      │   ├── Deck.ts               # Deck schema
                                      │   └── LobbyState.ts         # Lobby state schema
                                      ├── utils/
                                      │   ├── CardDeck.ts           # Standard 52-card deck
                                      │   └── Matchmaker.ts         # Matchmaking logic
                                      └── types/
                                          └── index.ts              # TypeScript type definitions
                                      ```

                                      ## Core Components

                                      ### 1. Lobby System

                                      The lobby handles player matchmaking:

- Players join the lobby room
- - System matches two players for a game
- - Players can specify game preferences
- - Automatic timeout for unmatched players
                                           
- ```typescript
                                              // Lobby state tracks waiting players
                                              class LobbyState extends Schema {
                                                @type({ map: Player }) waitingPlayers = new MapSchema<Player>();
                                                @type("string") status = "waiting";
                                              }
                                              ```

                                              ### 2. Game Room Base Class

                                              Abstract base class that all game rooms extend:

                                              ```typescript
                                              abstract class GameRoom<T extends BaseGameState> extends Room<T> {
                                                abstract gameType: string;
                                                abstract minPlayers: number;
                                                abstract maxPlayers: number;

                                                abstract onGameStart(): void;
                                                abstract onPlayerAction(client: Client, action: GameAction): void;
                                                abstract checkGameOver(): boolean;
                                              }
                                              ```

                                              ### 3. Game Engine Interface

                                              Pluggable game logic interface:

                                              ```typescript
                                              interface IGameEngine {
                                                initialize(players: Player[]): GameState;
                                                processAction(state: GameState, action: GameAction): GameState;
                                                validateAction(state: GameState, action: GameAction): boolean;
                                                isGameOver(state: GameState): boolean;
                                                getWinner(state: GameState): Player | null;
                                              }
                                              ```

                                              ### 4. Card and Deck System

                                              Reusable card/deck utilities:

                                              ```typescript
                                              class Card extends Schema {
                                                @type("string") suit: string;    // hearts, diamonds, clubs, spades
                                                @type("number") rank: number;    // 1-13 (Ace-King)
                                                @type("boolean") faceUp: boolean;
                                              }

                                              class Deck {
                                                cards: Card[];
                                                shuffle(): void;
                                                draw(count: number): Card[];
                                                reset(): void;
                                              }
                                              ```

                                              ## MVP: Snap Game

                                              ### Game Rules

                                              1. Deck is split evenly between two players
                                              2. 2. Players take turns placing cards face-up on a central pile
                                                 3. 3. When two consecutive cards match (same rank), players race to call "SNAP!"
                                                    4. 4. First player to snap wins the pile
                                                       5. 5. Player who collects all cards wins
                                                         
                                                          6. ### Snap-Specific Implementation
                                                         
                                                          7. ```typescript
                                                             class SnapState extends Schema {
                                                               @type({ map: Player }) players = new MapSchema<Player>();
                                                               @type([Card]) centralPile = new ArraySchema<Card>();
                                                               @type("string") currentTurn: string;  // player session ID
                                                               @type("boolean") snapAvailable: boolean;
                                                               @type("string") winner: string | null;
                                                             }

                                                             class SnapGame implements IGameEngine {
                                                               // Implement snap-specific logic
                                                               processAction(state: SnapState, action: SnapAction): SnapState {
                                                                 switch (action.type) {
                                                                   case "PLAY_CARD": return this.playCard(state, action);
                                                                   case "SNAP": return this.handleSnap(state, action);
                                                                 }
                                                               }
                                                             }
                                                             ```

                                                             ### Client Actions

- `PLAY_CARD`: Play top card from player's deck
- - `SNAP`: Attempt to claim the pile
                                                              
- ### Server Events
                                                              
- - `gameStart`: Game begins, initial state sent
- - `cardPlayed`: A card was played
- - `snapResult`: Result of a snap attempt
- - `turnChange`: Turn changed to other player
- - `gameOver`: Game ended, winner announced
                                                                        
- ## Implementation Phases
                                                                        
- ### Phase 1: Project Setup (Week 1) ✅ COMPLETE
- - [x] Initialize Colyseus project
- [x] - [x] Set up TypeScript configuration
- [x] - [x] Create basic server structure
- [x] - [x] Implement Card and Deck classes with tests
- [x] - [x] Set up WebSocket connection handling
- [x] - [x] Configure Docker development environment
- [x] - [x] Integrate Prometheus metrics
- [x] - [x] Set up Grafana dashboards
                                                                          
- [x] ### Phase 2: Lobby System (Week 2) ✅ COMPLETE
- [x] - [x] Create LobbyRoom class
- [x] - [x] Implement matchmaking logic
- [x] - [x] Player queue management
- [x] - [x] Lobby state synchronization
- [x] - [x] Timeout handling for inactive players
                                                                          
- [x] ### Phase 3: Game Room Framework + Full Frontend ✅ COMPLETE
- [x] Create base GameRoom abstract class
- [x] Implement IGameEngine interface
- [x] Room lifecycle management
- [x] State serialization with Colyseus Schema
- [x] Client message handling
- [x] SnapRoom implementation with full game logic
- [x] Complete frontend UI (HTML/CSS/JS)
- [x] Real-time state synchronization
- [x] Card rendering and animations
- [x] E2E test suite with Playwright
- [x] Comprehensive documentation (API + Frontend guides)
                                                                          
- [x] ### Phase 4: Snap Game ✅ COMPLETE (Implemented in Phase 3)
- [x] Implement SnapGameState schema
- [x] Create SnapEngine game logic
- [x] Turn management with currentTurn state
- [x] Snap detection and validation (matching ranks)
- [x] Win condition checking (player with all cards)
- [x] Game over handling with winner announcement
                                                                          
- [x] ### Phase 5: Testing & Documentation ✅ COMPLETE
- [x] Unit tests for all game logic (GameRoom, IGameEngine, SnapEngine)
- [x] Integration tests for rooms (SnapRoom full flow)
- [x] E2E test suite (50+ tests with Playwright)
- [x] Comprehensive API documentation
- [x] Frontend architecture guide
- [x] Updated README with all features
                                                                          
- [ ] ## Adding New Games
                                                                          
- [ ] To add a new card game:
                                                                          
- [ ] 1. **Create game state schema** in `src/schemas/[game]State.ts`
- [ ] 2. **Implement game engine** in `src/games/[game]/[Game]Game.ts`
- [ ] 3. **Create game room** in `src/rooms/[Game]Room.ts`
- [ ] 4. **Register room** in server configuration
- [ ] 5. **Add game type** to lobby matchmaking
                                                                          
- [ ] Example for adding "War":
                                                                          
- [ ] ```typescript
- [ ] // src/games/war/WarGame.ts
- [ ] class WarGame implements IGameEngine {
- [ ]   // Implement War-specific rules
- [ ]   }
                                                                          
- [ ]   // src/rooms/WarRoom.ts
- [ ]   class WarRoom extends GameRoom<WarState> {
- [ ]     gameType = "war";
- [ ]   minPlayers = 2;
- [ ]     maxPlayers = 2;
- [ ] }
                                                                          
- [ ] // Register in server
- [ ] gameServer.define("war", WarRoom);
- [ ] ```
                                                                          
- [ ] ## API Endpoints
                                                                          
- [ ] ### REST API (via Express)
                                                                          
- [ ] - `GET /api/status` - Server status
- [ ] - `GET /api/games` - Available game types
- [ ] - `GET /api/lobby/count` - Players in lobby
                                                                          
- [ ] ### WebSocket Messages
                                                                          
- [ ] #### Client to Server
- [ ] - `join_lobby` - Join matchmaking queue
- [ ] - `leave_lobby` - Leave matchmaking queue
- [ ] - `play_card` - Play a card (in game)
- [ ] - `snap` - Call snap (in Snap game)
- [ ] - `forfeit` - Forfeit current game
                                                                          
- [ ] #### Server to Client
- [ ] - `matched` - Matched with opponent, game starting
- [ ] - `game_state` - Full game state update
- [ ] - `card_played` - A card was played
- [ ] - `snap_result` - Result of snap attempt
- [ ] - `game_over` - Game ended
                                                                          
- [ ] ## Testing Strategy
                                                                          
- [ ] Following TDD principles (as per CLAUDE.md):
                                                                          
- [ ] 1. **Unit Tests**
- [ ]    - Card/Deck manipulation
- [ ]       - Game rule validation
- [ ]      - State transitions
                                                                          
- [ ]  2. **Integration Tests**
- [ ]     - Room lifecycle
- [ ]    - Matchmaking flow
- [ ]       - Game completion scenarios
                                                                          
- [ ]   3. **E2E Tests**
- [ ]      - Full game playthrough
- [ ]     - Disconnection handling
- [ ]    - Reconnection scenarios
                                                                          
- [ ]    ## Future Considerations
                                                                          
- [ ]    - **Persistence**: Save game history, player stats
- [ ]    - **Authentication**: User accounts, sessions
- [ ]    - **Scaling**: Redis for multi-server deployment
- [ ]    - **Spectators**: Watch ongoing games
- [ ]    - **Tournaments**: Bracket-based competitions
- [ ]    - **More Games**: War, Go Fish, Crazy Eights, etc.
                                                                          
- [ ]    ## Dependencies
                                                                          
- [ ]    ```json
- [ ]    {
- [ ]      "dependencies": {
- [ ]      "colyseus": "^0.15.x",
- [ ]      "@colyseus/schema": "^2.0.x",
- [ ]      "@colyseus/monitor": "^0.15.x",
- [ ]      "express": "^4.18.x"
- [ ]    },
- [ ]      "devDependencies": {
- [ ]      "@colyseus/testing": "^0.15.x",
- [ ]      "typescript": "^5.x"
- [ ]    }
- [ ]    }
- [ ]    ```
                                                                          
- [ ]    ## Success Metrics
                                                                          
- [ ]    - Players can successfully match in lobby
- [ ]    - Two players can complete a full game of Snap
- [ ]    - Game state syncs correctly between clients
- [ ]    - Snap detection has < 100ms latency
- [ ]    - New game can be added in < 1 day of development
