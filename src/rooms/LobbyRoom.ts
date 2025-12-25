import { Room, Client } from 'colyseus';
import { LobbyState } from '../schemas/LobbyState';
import { Player } from '../schemas/Player';
import { Matchmaker } from '../utils/Matchmaker';
import { metrics } from '../utils/metrics';
import { createLogger } from '../utils/logger';
import { config } from '../server/config';

const log = createLogger('lobby');

export class LobbyRoom extends Room<LobbyState> {
  private matchmaker: Matchmaker;
  private timeoutInterval: NodeJS.Timeout;

  onCreate(options: any): void {
    log('onCreate:', {
      roomId: this.roomId,
      options,
      timestamp: new Date().toISOString(),
    });

    this.setState(new LobbyState());
    this.matchmaker = new Matchmaker(config.lobbyTimeoutMs);

    // Set initial metadata
    this.updateMetadata();

    // Set up message handlers
    this.onMessage('join_lobby', (client, message) => {
      this.handleJoinLobby(client, message);
    });

    this.onMessage('leave_lobby', (client) => {
      this.handleLeaveLobby(client);
    });

    // Set up timeout interval
    this.timeoutInterval = setInterval(() => {
      this.handleTimeouts();
    }, config.lobbyMatchCheckIntervalMs);

    log('onCreate complete:', {
      roomId: this.roomId,
      matchmakerTimeout: config.lobbyTimeoutMs,
      checkInterval: config.lobbyMatchCheckIntervalMs,
    });
  }

  onJoin(client: Client, options: any): void {
    const playerName = options.name || 'Player';
    log('onJoin:', {
      sessionId: client.sessionId,
      name: playerName,
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
    });

    const player = new Player(client.sessionId, playerName);
    const added = this.state.addPlayer(player);

    log('Player added to state:', {
      sessionId: client.sessionId,
      added,
      totalPlayers: this.state.waitingPlayers.size,
      waitingCount: this.state.getWaitingCount(),
    });

    // Update metrics and metadata
    metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
    this.updateMetadata();
  }

  onLeave(client: Client, consented: boolean): void {
    log('onLeave:', {
      sessionId: client.sessionId,
      consented,
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
    });

    const player = this.state.waitingPlayers.get(client.sessionId);

    if (!player) {
      log.warn('Player not found in state:', {
        sessionId: client.sessionId,
      });
      return;
    }

    // Always remove player from lobby when they leave
    // No reconnection handler exists, so keeping disconnected players would cause memory leak
    this.state.removePlayer(client.sessionId);
    log('Player removed:', {
      sessionId: client.sessionId,
      consented,
      remainingPlayers: this.state.waitingPlayers.size,
    });

    // Update metrics and metadata
    metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
    this.updateMetadata();
  }

  onDispose(): void {
    log('onDispose:', {
      roomId: this.roomId,
      remainingPlayers: this.state?.waitingPlayers?.size ?? 0,
      timestamp: new Date().toISOString(),
    });

    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      log('Timeout interval cleared');
    }
  }

  private handleJoinLobby(client: Client, message: any): void {
    log('handleJoinLobby:', {
      sessionId: client.sessionId,
      message,
      timestamp: new Date().toISOString(),
    });

    const waitingCount = this.state.getWaitingCount();
    this.broadcast(
      'joined_lobby',
      { sessionId: client.sessionId, waitingCount },
      { except: client }
    );
    client.send('joined_lobby', { sessionId: client.sessionId, waitingCount });

    log('Sent joined_lobby message:', {
      sessionId: client.sessionId,
      waitingCount,
    });

    // Attempt to match after a player joins
    this.attemptMatch();
  }

  private handleLeaveLobby(client: Client): void {
    log('handleLeaveLobby:', {
      sessionId: client.sessionId,
      timestamp: new Date().toISOString(),
    });

    const removed = this.state.removePlayer(client.sessionId);
    client.send('left_lobby', {});

    log('Player left lobby:', {
      sessionId: client.sessionId,
      removed,
      remainingPlayers: this.state.waitingPlayers.size,
    });

    // Update metrics and metadata
    metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
    this.updateMetadata();
  }

  private handleTimeouts(): void {
    const timedOutIds = this.matchmaker.getTimedOutPlayers(this.state);

    if (timedOutIds.length > 0) {
      log('handleTimeouts:', {
        timedOutCount: timedOutIds.length,
        timedOutIds,
        timestamp: new Date().toISOString(),
      });
    }

    timedOutIds.forEach((sessionId) => {
      const client = this.clients.find((c) => c.sessionId === sessionId);

      // Send timeout message to client if they're still connected
      if (client) {
        client.send('timeout', { reason: 'No match found in time' });
      }

      // Always remove timed out player from state, even if client disconnected
      this.state.removePlayer(sessionId);

      log('Player timed out:', {
        sessionId,
        clientFound: !!client,
        remainingPlayers: this.state.waitingPlayers.size,
      });

      // Update metrics
      metrics.lobbyTimeoutsTotal.inc();
    });

    // Update waiting players metric and metadata after timeouts
    if (timedOutIds.length > 0) {
      metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
      this.updateMetadata();
    }
  }

  private attemptMatch(): void {
    const waitingCount = this.state.getWaitingCount();

    if (waitingCount < 2) {
      return;
    }

    log('attemptMatch:', {
      waitingCount,
      timestamp: new Date().toISOString(),
    });

    const match = this.matchmaker.findMatch(this.state);

    if (!match) {
      log('No match found despite waiting players:', {
        waitingCount,
      });
      return;
    }

    log('Match found:', {
      matchId: match.matchId,
      player1: match.player1SessionId,
      player2: match.player2SessionId,
      matchedAt: match.matchedAt,
    });

    // Mark players as matched
    const player1 = this.state.waitingPlayers.get(match.player1SessionId);
    const player2 = this.state.waitingPlayers.get(match.player2SessionId);

    if (player1 && player2) {
      player1.setStatus('matched');
      player2.setStatus('matched');

      // Send matched message to both players
      // They will both use joinOrCreate with the same matchId
      // The first one will create the room, the second will join it
      const client1 = this.clients.find(
        (c) => c.sessionId === match.player1SessionId
      );
      const client2 = this.clients.find(
        (c) => c.sessionId === match.player2SessionId
      );

      if (client1) {
        client1.send('matched', {
          matchId: match.matchId,
          opponentSessionId: match.player2SessionId,
          matchedAt: match.matchedAt,
        });
        log('Sent matched message to player1:', {
          sessionId: match.player1SessionId,
          matchId: match.matchId,
        });
      }

      if (client2) {
        client2.send('matched', {
          matchId: match.matchId,
          opponentSessionId: match.player1SessionId,
          matchedAt: match.matchedAt,
        });
        log('Sent matched message to player2:', {
          sessionId: match.player2SessionId,
          matchId: match.matchId,
        });
      }

      // Remove matched players from lobby
      this.state.removePlayer(match.player1SessionId);
      this.state.removePlayer(match.player2SessionId);

      // Calculate match duration (time from when first player joined until match)
      const matchDuration =
        (match.matchedAt - Math.min(player1.joinedAt, player2.joinedAt)) / 1000;

      log('Match complete:', {
        matchId: match.matchId,
        matchDurationSeconds: matchDuration,
        remainingPlayers: this.state.waitingPlayers.size,
        remainingWaiting: this.state.getWaitingCount(),
      });

      // Update metrics and metadata
      metrics.lobbyMatchesTotal.inc();
      metrics.lobbyMatchDuration.observe(matchDuration);
      metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
      this.updateMetadata();
    } else {
      log.error('Match failed - players not found:', {
        player1Found: !!player1,
        player2Found: !!player2,
        match,
      });
    }
  }

  private updateMetadata(): void {
    this.setMetadata({ waitingCount: this.state.getWaitingCount() });
  }
}
