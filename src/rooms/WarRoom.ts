import { Client } from 'colyseus';
import { GameRoom } from './GameRoom';
import { WarGameState } from '../schemas/WarGameState';
import { WarEngine } from '../games/war/WarEngine';
import { IGameEngine, GameAction } from '../games/IGameEngine';
import { createLogger } from '../utils/logger';

const log = createLogger('war-room');

export class WarRoom extends GameRoom<WarGameState> {
  gameType = 'war';
  minPlayers = 2;
  maxPlayers = 2;

  createGameEngine(): IGameEngine<WarGameState> {
    return new WarEngine();
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

    // Set up message handlers for war-specific actions
    this.onMessage('flip_card', (client, message) => {
      this.handleFlipCard(client, message);
    });

    log('Game started, cards dealt, message handlers registered:', {
      player1Hand: players[0]
        ? this.state.getHandSize(players[0].sessionId)
        : 0,
      player2Hand: players[1]
        ? this.state.getHandSize(players[1].sessionId)
        : 0,
      roundNumber: this.state.roundNumber,
    });
  }

  private handleFlipCard(client: Client, _message: any): void {
    log('handleFlipCard:', {
      sessionId: client.sessionId,
      playersReady: this.state.playersReady.length,
      roundNumber: this.state.roundNumber,
    });

    // Validate action
    const action: GameAction = {
      type: 'FLIP_CARD',
      playerId: client.sessionId,
    };

    const validation = this.gameEngine.validateAction(this.state, action);
    if (!validation.valid) {
      log.error('Invalid flip_card action:', {
        sessionId: client.sessionId,
        error: validation.error,
      });
      client.send('error', { message: validation.error });
      return;
    }

    // Capture state BEFORE processAction
    const handSizeBefore = this.state.getHandSize(client.sessionId);
    const battlePileSizeBefore = this.state.battlePile.length;

    // Process action
    const result = this.gameEngine.processAction(this.state, action);

    if (result.success) {
      log('Card flipped successfully:', {
        sessionId: client.sessionId,
        handSizeAfter: this.state.getHandSize(client.sessionId),
        battlePileSize: this.state.battlePile.length,
        playersReady: this.state.playersReady.length,
        bothReady: this.state.areBothPlayersReady(),
      });

      // Broadcast card flipped event
      this.broadcast('card_flipped', {
        playerId: client.sessionId,
        handSize: this.state.getHandSize(client.sessionId),
        battlePileSize: this.state.battlePile.length,
      });

      // If battle was resolved (both players flipped), broadcast battle result
      if (
        handSizeBefore === this.state.getHandSize(client.sessionId) + 1 &&
        this.state.battlePile.length === 0
      ) {
        // Battle pile was cleared, battle was resolved
        const players = Array.from(this.state.players.keys());

        log('Battle resolved:', {
          player1HandSize: this.state.getHandSize(players[0]),
          player2HandSize: this.state.getHandSize(players[1]),
          roundNumber: this.state.roundNumber,
        });

        this.broadcast('battle_resolved', {
          player1HandSize: this.state.getHandSize(players[0]),
          player2HandSize: this.state.getHandSize(players[1]),
          roundNumber: this.state.roundNumber,
        });
      }

      // Check for war state
      if (this.state.inWar) {
        log('WAR triggered:', {
          warDepth: this.state.warDepth,
          battlePileSize: this.state.battlePile.length,
        });

        this.broadcast('war_started', {
          warDepth: this.state.warDepth,
          battlePileSize: this.state.battlePile.length,
        });
      }

      // Check if game is over
      if (this.gameEngine.isGameOver(this.state)) {
        const winner = this.gameEngine.getWinner(this.state);
        log('Game over:', {
          winner,
          roundNumber: this.state.roundNumber,
        });

        this.endGame(winner);
      }
    } else {
      log.error('Flip card failed:', {
        sessionId: client.sessionId,
        error: result.error,
      });
      client.send('error', { message: result.error });
    }
  }
}
