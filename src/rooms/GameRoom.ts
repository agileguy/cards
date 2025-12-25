import { Room, Client } from 'colyseus';
import { BaseGameState } from '../schemas/BaseGameState';
import { GamePlayer } from '../schemas/GamePlayer';
import { IGameEngine } from '../games/IGameEngine';
import { metrics } from '../utils/metrics';
import { createLogger } from '../utils/logger';

const log = createLogger('game-room');

export abstract class GameRoom<TState extends BaseGameState> extends Room<TState> {
  protected gameEngine: IGameEngine<TState>;
  protected gameStartTimeout: NodeJS.Timeout | null = null;

  abstract gameType: string;
  abstract minPlayers: number;
  abstract maxPlayers: number;

  /**
   * Create the game engine instance for this room
   */
  abstract createGameEngine(): IGameEngine<TState>;

  /**
   * Hook called when the game starts
   */
  abstract onGameStart(): void;

  onCreate(options: any): void {
    log(`onCreate: ${this.gameType}`, {
      roomId: this.roomId,
      options,
      timestamp: new Date().toISOString(),
    });

    // Create game engine
    this.gameEngine = this.createGameEngine();

    // Initialize state through the engine
    const initialState = this.gameEngine.initialize([]);
    this.setState(initialState);

    // Set initial metadata
    this.updateMetadata();

    log('onCreate complete:', {
      roomId: this.roomId,
      gameType: this.gameType,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
    });
  }

  onJoin(client: Client, options: any): void {
    const playerName = options.name || 'Player';

    log('onJoin:', {
      sessionId: client.sessionId,
      name: playerName,
      roomId: this.roomId,
      gameType: this.gameType,
      currentPlayers: this.state.players.size,
      timestamp: new Date().toISOString(),
    });

    // Check if room is full
    if (this.state.players.size >= this.maxPlayers) {
      log.error('Room is full:', {
        sessionId: client.sessionId,
        currentPlayers: this.state.players.size,
        maxPlayers: this.maxPlayers,
      });
      throw new Error('Room is full');
    }

    // Add player to state
    const player = new GamePlayer(client.sessionId, playerName);
    const added = this.state.addPlayer(player);

    log('Player added to state:', {
      sessionId: client.sessionId,
      added,
      totalPlayers: this.state.players.size,
    });

    // Update metadata
    this.updateMetadata();

    // Update metrics
    metrics.gamePlayersConnected.inc({ game_type: this.gameType });

    // Check if we should start the game
    if (this.state.players.size >= this.minPlayers && this.state.status === 'waiting') {
      this.startGame();
    }
  }

  onLeave(client: Client, consented: boolean): void {
    log('onLeave:', {
      sessionId: client.sessionId,
      consented,
      roomId: this.roomId,
      gameType: this.gameType,
      timestamp: new Date().toISOString(),
    });

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      log.warn('Player not found in state:', {
        sessionId: client.sessionId,
      });
      return;
    }

    // Remove player from state
    this.state.removePlayer(client.sessionId);

    log('Player removed:', {
      sessionId: client.sessionId,
      consented,
      remainingPlayers: this.state.players.size,
    });

    // Update metrics
    metrics.gamePlayersConnected.dec({ game_type: this.gameType });

    // If game is in progress and we now have too few players, end the game
    if (this.state.status === 'playing' && this.state.players.size < this.minPlayers) {
      log('Ending game due to insufficient players:', {
        remainingPlayers: this.state.players.size,
        minPlayers: this.minPlayers,
      });
      this.endGame(null);
    }

    // Update metadata
    this.updateMetadata();
  }

  onDispose(): void {
    log('onDispose:', {
      roomId: this.roomId,
      gameType: this.gameType,
      remainingPlayers: this.state?.players?.size ?? 0,
      timestamp: new Date().toISOString(),
    });

    if (this.gameStartTimeout) {
      clearTimeout(this.gameStartTimeout);
      log('Game start timeout cleared');
    }
  }

  /**
   * Start the game
   */
  protected startGame(): void {
    log('Starting game:', {
      roomId: this.roomId,
      gameType: this.gameType,
      playerCount: this.state.players.size,
      timestamp: new Date().toISOString(),
    });

    // Update state
    this.state.setStatus('playing');
    this.state.startedAt = Date.now();

    // Update all players to playing status
    this.state.players.forEach((player) => {
      player.setStatus('playing');
    });

    // Update metadata
    this.updateMetadata();

    // Update metrics
    metrics.gamesStarted.inc({ game_type: this.gameType });

    // Call the game-specific start hook
    this.onGameStart();

    log('Game started:', {
      roomId: this.roomId,
      gameType: this.gameType,
      startedAt: this.state.startedAt,
    });
  }

  /**
   * End the game
   */
  protected endGame(winnerId: string | null): void {
    log('Ending game:', {
      roomId: this.roomId,
      gameType: this.gameType,
      winnerId,
      timestamp: new Date().toISOString(),
    });

    // Update state
    this.state.setStatus('completed');
    this.state.endedAt = Date.now();

    if (winnerId) {
      this.state.setWinner(winnerId);
    }

    // Update all players to finished status
    this.state.players.forEach((player) => {
      player.setStatus('finished');
    });

    // Calculate game duration
    const duration = this.state.endedAt - this.state.startedAt;

    log('Game ended:', {
      roomId: this.roomId,
      gameType: this.gameType,
      winnerId,
      duration,
    });

    // Update metadata
    this.updateMetadata();

    // Update metrics
    metrics.gamesCompleted.inc({ game_type: this.gameType });
    metrics.gameDuration.observe({ game_type: this.gameType }, duration / 1000);
  }

  /**
   * Update room metadata for discovery
   */
  private updateMetadata(): void {
    this.setMetadata({
      gameType: this.gameType,
      playerCount: this.state.players.size,
      maxPlayers: this.maxPlayers,
      status: this.state.status,
    });
  }
}
