import { Client } from 'colyseus';
import { GameRoom } from './GameRoom';
import { SnapGameState } from '../schemas/SnapGameState';
import { SnapEngine } from '../games/snap/SnapEngine';
import { IGameEngine, GameAction } from '../games/IGameEngine';
import { createLogger } from '../utils/logger';

const log = createLogger('snap-room');

export class SnapRoom extends GameRoom<SnapGameState> {
  gameType = 'snap';
  minPlayers = 2;
  maxPlayers = 2;

  createGameEngine(): IGameEngine<SnapGameState> {
    return new SnapEngine();
  }

  onGameStart(): void {
    log('onGameStart:', {
      roomId: this.roomId,
      players: Array.from(this.state.players.keys()),
    });

    // Pass the room's state to the engine to initialize in place
    // This avoids schema ownership issues
    const players = Array.from(this.state.players.values());

    // Give the engine access to our state
    (this.gameEngine as any).state = this.state;

    // Initialize will modify this.state directly
    this.gameEngine.initialize(players);

    // Set up message handlers for snap-specific actions
    this.onMessage('play_card', (client, message) => {
      this.handlePlayCard(client, message);
    });

    this.onMessage('snap', (client) => {
      this.handleSnap(client);
    });

    log('Game started, cards dealt, message handlers registered:', {
      player1Hand: players[0] ? this.state.getHandSize(players[0].sessionId) : 0,
      player2Hand: players[1] ? this.state.getHandSize(players[1].sessionId) : 0,
      currentTurn: this.state.currentTurn,
    });
  }

  private handlePlayCard(client: Client, _message: any): void {
    log('handlePlayCard:', {
      sessionId: client.sessionId,
      currentTurn: this.state.currentTurn,
    });

    // Validate action
    const action: GameAction = {
      type: 'PLAY_CARD',
      playerId: client.sessionId,
    };

    const validation = this.gameEngine.validateAction(this.state, action);
    if (!validation.valid) {
      log.error('Invalid play_card action:', {
        sessionId: client.sessionId,
        error: validation.error,
      });
      client.send('error', { message: validation.error });
      return;
    }

    // Process action
    const result = this.gameEngine.processAction(this.state, action);

    if (result.success) {
      log('Card played successfully:', {
        sessionId: client.sessionId,
        pileSize: this.state.centralPile.length,
        nextTurn: this.state.currentTurn,
        snapAvailable: this.state.snapAvailable,
      });

      // Broadcast to all clients
      this.broadcast('card_played', {
        playerId: client.sessionId,
        pileSize: this.state.centralPile.length,
        snapAvailable: this.state.snapAvailable,
      });

      // Check if game is over
      if (this.gameEngine.isGameOver(this.state)) {
        const winner = this.gameEngine.getWinner(this.state);
        this.endGame(winner);
      }
    } else {
      client.send('error', { message: result.error });
    }
  }

  private handleSnap(client: Client): void {
    log('handleSnap:', {
      sessionId: client.sessionId,
      snapAvailable: this.state.snapAvailable,
    });

    const action: GameAction = {
      type: 'SNAP',
      playerId: client.sessionId,
    };

    const result = this.gameEngine.processAction(this.state, action);

    if (result.success) {
      log('Successful snap:', {
        sessionId: client.sessionId,
        cardsWon: this.state.centralPile.length,
        newHandSize: this.state.getHandSize(client.sessionId),
      });

      this.broadcast('snap_success', {
        playerId: client.sessionId,
        cardsWon: this.state.centralPile.length,
      });

      // Check if game is over
      if (this.gameEngine.isGameOver(this.state)) {
        const winner = this.gameEngine.getWinner(this.state);
        this.endGame(winner);
      }
    } else {
      log('Failed snap:', {
        sessionId: client.sessionId,
        error: result.error,
      });

      this.broadcast('snap_fail', {
        playerId: client.sessionId,
      });
    }
  }
}
