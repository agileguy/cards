# Game API Documentation

Complete API reference for the Cards multiplayer game system.

## Table of Contents

- [WebSocket Connection](#websocket-connection)
- [Lobby Room API](#lobby-room-api)
- [Snap Room API](#snap-room-api)
- [State Schemas](#state-schemas)
- [REST Endpoints](#rest-endpoints)
- [Error Handling](#error-handling)

## WebSocket Connection

The game uses Colyseus WebSocket protocol for real-time communication.

### Connection URL

```
ws://localhost:2567  (development)
wss://your-domain.com (production)
```

### Client Initialization

```javascript
import { GameClient } from './client.js';

const client = new GameClient();
await client.joinLobby('PlayerName');
```

## Lobby Room API

The lobby room handles matchmaking between players.

### Joining the Lobby

**Client → Server**

```javascript
room = await client.joinLobby(playerName);
```

**Options:**
```typescript
{
  name: string  // Player display name
}
```

### Lobby Messages

#### `joined_lobby`

**Server → Client**

Sent when player successfully joins the lobby.

```typescript
{
  sessionId: string;      // Player's unique session ID
  waitingCount: number;   // Number of players currently waiting
}
```

**Example:**
```javascript
room.onMessage('joined_lobby', (message) => {
  console.log(`Joined as ${message.sessionId}`);
  console.log(`${message.waitingCount} players waiting`);
});
```

#### `matched`

**Server → Client**

Sent when matchmaking finds an opponent.

```typescript
{
  matchId: string;              // Game room ID
  opponentSessionId: string;    // Opponent's session ID
}
```

**Example:**
```javascript
room.onMessage('matched', (message) => {
  window.location.href = `/game.html?matchId=${message.matchId}`;
});
```

#### `timeout`

**Server → Client**

Sent when matchmaking times out.

```typescript
{
  reason: string;  // Timeout reason
}
```

**Example:**
```javascript
room.onMessage('timeout', () => {
  showError('No match found. Please try again.');
});
```

### Lobby State Schema

```typescript
class LobbyState extends Schema {
  @type({ map: LobbyPlayer })
  players: MapSchema<LobbyPlayer>;

  @type('number')
  waitingCount: number;
}

class LobbyPlayer extends Schema {
  @type('string')
  sessionId: string;

  @type('string')
  name: string;

  @type('number')
  joinedAt: number;
}
```

## Snap Room API

The Snap room handles game logic and state for the card game.

### Joining a Game

**Client → Server**

```javascript
room = await client.createGame('snap', {});
// or
room = await client.joinGame(matchId);
```

### Game Actions

#### `play_card`

**Client → Server**

Play the top card from player's hand to the central pile.

```javascript
room.send('play_card', {});
```

**Response:** `card_played` message

#### `snap`

**Client → Server**

Attempt to snap the pile when cards match.

```javascript
room.send('snap', {});
```

**Response:** `snap_success` or `snap_fail` message

### Game Messages

#### `game_started`

**Server → Client**

Sent when the game begins.

```typescript
{
  playerIds: string[];  // Array of player session IDs
}
```

#### `card_played`

**Server → Client**

Sent when a card is played.

```typescript
{
  playerId: string;     // Who played the card
  card: {
    suit: string;       // 'hearts' | 'diamonds' | 'clubs' | 'spades'
    rank: number;       // 1-13 (1=Ace, 11=Jack, 12=Queen, 13=King)
  }
}
```

**Example:**
```javascript
room.onMessage('card_played', (message) => {
  console.log(`${message.playerId} played ${message.card.rank} of ${message.card.suit}`);
});
```

#### `snap_success`

**Server → Client**

Sent when a snap attempt succeeds.

```typescript
{
  playerId: string;     // Player who snapped
  winner: string;       // Same as playerId
  pileSize: number;     // Number of cards won
}
```

**Example:**
```javascript
room.onMessage('snap_success', (message) => {
  if (message.playerId === mySessionId) {
    showMessage('You got the pile!');
  } else {
    showMessage('Opponent got the pile!');
  }
});
```

#### `snap_fail`

**Server → Client**

Sent when a snap attempt fails (no match).

```typescript
{
  playerId: string;     // Player who snapped
  penalty: boolean;     // Whether penalty was applied
}
```

**Example:**
```javascript
room.onMessage('snap_fail', (message) => {
  if (message.playerId === mySessionId) {
    showMessage('Wrong! Penalty card lost');
  }
});
```

#### `game_over`

**Server → Client**

Sent when the game ends.

```typescript
{
  winner: string;       // Session ID of winner
  reason: string;       // 'all_cards' | 'opponent_disconnected'
}
```

**Example:**
```javascript
room.onMessage('game_over', (message) => {
  showGameOver(message.winner === mySessionId);
});
```

#### `error`

**Server → Client**

Sent when an error occurs.

```typescript
{
  message: string;      // Error description
  code?: string;        // Optional error code
}
```

## State Schemas

### SnapGameState

The game state automatically synchronized to all clients.

```typescript
class SnapGameState extends BaseGameState {
  // Central pile of played cards
  @type([SnapCard])
  centralPile: ArraySchema<SnapCard>;

  // Each player's hand
  @type({ map: PlayerHand })
  playerHands: MapSchema<PlayerHand>;

  // Current player's turn
  @type('string')
  currentTurn: string;

  // Whether snap is available
  @type('boolean')
  snapAvailable: boolean;
}
```

### SnapCard

```typescript
class SnapCard extends Schema {
  @type('string')
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';

  @type('number')
  rank: number;  // 1-13
}
```

### PlayerHand

```typescript
class PlayerHand extends Schema {
  @type([SnapCard])
  cards: ArraySchema<SnapCard>;
}
```

### BaseGameState

```typescript
class BaseGameState extends Schema {
  @type({ map: GamePlayer })
  players: MapSchema<GamePlayer>;

  @type('string')
  status: 'waiting' | 'playing' | 'completed';

  @type('string')
  winner: string | null;

  @type('number')
  startedAt: number;

  @type('number')
  endedAt: number;
}
```

### GamePlayer

```typescript
class GamePlayer extends Schema {
  @type('string')
  sessionId: string;

  @type('string')
  name: string;

  @type('number')
  joinedAt: number;
}
```

## State Listening

### onChange

Listen to any state change:

```javascript
room.state.onChange = () => {
  console.log('State updated');
  renderGameState();
};
```

### listen (Specific Properties)

Listen to specific property changes:

```javascript
room.state.listen('centralPile', (value) => {
  console.log('Central pile updated:', value.length);
  updatePileDisplay();
});

room.state.listen('currentTurn', (value) => {
  console.log('Turn changed to:', value);
  updateTurnIndicator();
});

room.state.listen('status', (value) => {
  if (value === 'completed') {
    showGameOver();
  }
});
```

## REST Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "version": "0.1.0"
}
```

### Metrics

```
GET /metrics
```

**Response:** Prometheus metrics in text format

### Available Games

```
GET /api/games
```

**Response:**
```json
{
  "games": ["snap"]
}
```

### Lobby Status

```
GET /api/lobby/count
```

**Response:**
```json
{
  "waitingCount": 5
}
```

## Error Handling

### Connection Errors

```javascript
room.onError((code, message) => {
  console.error(`Error ${code}: ${message}`);
  showError(`Connection error: ${message}`);
});
```

**Common Error Codes:**
- `4000`: Bad request
- `4001`: Unauthorized
- `4004`: Room not found
- `4010`: Room is full
- `4011`: Game already started

### Room Leave Events

```javascript
room.onLeave((code) => {
  console.log('Left room:', code);

  if (code > 1000) {
    // Abnormal closure
    showError('Connection lost');
  }
});
```

**Leave Codes:**
- `1000`: Normal closure
- `1001`: Going away
- `1006`: Abnormal closure
- `4000+`: Custom application codes

## Rate Limiting

The server implements rate limiting on actions:

- **Play Card**: Max 1 per second
- **Snap**: Max 2 per second
- **Join Lobby**: Max 3 per minute

Exceeding limits results in temporary action blocking.

## Example: Complete Game Flow

```javascript
import { GameClient } from './client.js';

const client = new GameClient();

// 1. Join lobby
const lobbyRoom = await client.joinLobby('Alice');

lobbyRoom.onMessage('joined_lobby', (msg) => {
  console.log(`Waiting for opponent (${msg.waitingCount} waiting)`);
});

lobbyRoom.onMessage('matched', async (msg) => {
  console.log('Match found!');

  // 2. Join game room
  const gameRoom = await client.joinGame(msg.matchId);

  // 3. Listen for game events
  gameRoom.state.onChange = () => {
    updateUI(gameRoom.state);
  };

  gameRoom.onMessage('card_played', (msg) => {
    animateCardPlay(msg.card);
  });

  gameRoom.onMessage('snap_success', (msg) => {
    if (msg.playerId === gameRoom.sessionId) {
      showVictory();
    }
  });

  // 4. Play the game
  playCardBtn.addEventListener('click', () => {
    gameRoom.send('play_card', {});
  });

  snapBtn.addEventListener('click', () => {
    gameRoom.send('snap', {});
  });

  // 5. Handle game over
  gameRoom.onMessage('game_over', (msg) => {
    showGameOver(msg.winner === gameRoom.sessionId);
  });
});
```

## Best Practices

1. **Always handle errors**: Implement `onError` and `onLeave` handlers
2. **Clean up on unmount**: Call `room.leave()` when navigating away
3. **Debounce actions**: Don't spam action messages
4. **Use state listeners**: Prefer `room.state.listen()` for specific updates
5. **Validate client-side**: Check action validity before sending to server
6. **Handle reconnection**: Implement reconnection logic for network issues
7. **Show loading states**: Display spinners while waiting for server responses
8. **Provide feedback**: Show animations and messages for all actions

## TypeScript Types

For TypeScript projects, import types from the server:

```typescript
import type { SnapGameState } from '../server/schemas/SnapGameState';
import type { GameAction } from '../server/games/IGameEngine';
```

## Further Reading

- [Colyseus Client Documentation](https://docs.colyseus.io/client/)
- [Colyseus State Handling](https://docs.colyseus.io/state/overview/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
