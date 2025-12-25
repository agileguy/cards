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
                                                                        
                                                                         - ### Phase 1: Project Setup (Week 1)
                                                                         - - [ ] Initialize Colyseus project
                                                                           - [ ] - [ ] Set up TypeScript configuration
                                                                           - [ ] - [ ] Create basic server structure
                                                                           - [ ] - [ ] Implement Card and Deck classes with tests
                                                                           - [ ] - [ ] Set up WebSocket connection handling
                                                                          
                                                                           - [ ] ### Phase 2: Lobby System (Week 2)
                                                                           - [ ] - [ ] Create LobbyRoom class
                                                                           - [ ] - [ ] Implement matchmaking logic
                                                                           - [ ] - [ ] Player queue management
                                                                           - [ ] - [ ] Lobby state synchronization
                                                                           - [ ] - [ ] Timeout handling for inactive players
                                                                          
                                                                           - [ ] ### Phase 3: Game Room Framework (Week 2-3)
                                                                           - [ ] - [ ] Create base GameRoom class
                                                                           - [ ] - [ ] Implement IGameEngine interface
                                                                           - [ ] - [ ] Room lifecycle management
                                                                           - [ ] - [ ] State serialization setup
                                                                           - [ ] - [ ] Client message handling
                                                                          
                                                                           - [ ] ### Phase 4: Snap Game (Week 3-4)
                                                                           - [ ] - [ ] Implement SnapState schema
                                                                           - [ ] - [ ] Create SnapGame engine
                                                                           - [ ] - [ ] Turn management
                                                                           - [ ] - [ ] Snap detection and validation
                                                                           - [ ] - [ ] Win condition checking
                                                                           - [ ] - [ ] Game over handling
                                                                          
                                                                           - [ ] ### Phase 5: Testing & Polish (Week 4)
                                                                           - [ ] - [ ] Unit tests for game logic
                                                                           - [ ] - [ ] Integration tests for rooms
                                                                           - [ ] - [ ] Load testing
                                                                           - [ ] - [ ] Bug fixes
                                                                           - [ ] - [ ] Documentation
                                                                          
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
