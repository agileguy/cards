import { Room, Client } from 'colyseus';
import { LobbyState } from '../schemas/LobbyState';
import { Player } from '../schemas/Player';
import { Matchmaker } from '../utils/Matchmaker';
import { metrics } from '../utils/metrics';

export class LobbyRoom extends Room<LobbyState> {
  private matchmaker: Matchmaker;
  private timeoutInterval: NodeJS.Timeout;

  onCreate(options: any): void {
    console.log('[LobbyRoom] onCreate:', {
      roomId: this.roomId,
      options,
      timestamp: new Date().toISOString(),
    });

    this.setState(new LobbyState());
    this.matchmaker = new Matchmaker(30000);

    // Set up message handlers
    this.onMessage('join_lobby', (client, message) => {
      this.handleJoinLobby(client, message);
    });

    this.onMessage('leave_lobby', (client) => {
      this.handleLeaveLobby(client);
    });

    // Set up timeout interval (check every 5 seconds)
    this.timeoutInterval = setInterval(() => {
      this.handleTimeouts();
    }, 5000);

    console.log('[LobbyRoom] onCreate complete:', {
      roomId: this.roomId,
      matchmakerTimeout: 30000,
      checkInterval: 5000,
    });
  }

  onJoin(client: Client, options: any): void {
    const playerName = options.name || 'Player';
    console.log('[LobbyRoom] onJoin:', {
      sessionId: client.sessionId,
      name: playerName,
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
    });

    const player = new Player(client.sessionId, playerName);
    const added = this.state.addPlayer(player);

    console.log('[LobbyRoom] Player added to state:', {
      sessionId: client.sessionId,
      added,
      totalPlayers: this.state.waitingPlayers.size,
      waitingCount: this.state.getWaitingCount(),
    });

    // Update metrics
    metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
  }

  onLeave(client: Client, consented: boolean): void {
    console.log('[LobbyRoom] onLeave:', {
      sessionId: client.sessionId,
      consented,
      roomId: this.roomId,
      timestamp: new Date().toISOString(),
    });

    const player = this.state.waitingPlayers.get(client.sessionId);

    if (!player) {
      console.warn('[LobbyRoom] Player not found in state:', {
        sessionId: client.sessionId,
      });
      return;
    }

    if (consented) {
      this.state.removePlayer(client.sessionId);
      console.log('[LobbyRoom] Player removed (consented):', {
        sessionId: client.sessionId,
        remainingPlayers: this.state.waitingPlayers.size,
      });
    } else {
      player.setStatus('disconnected');
      console.log('[LobbyRoom] Player marked disconnected:', {
        sessionId: client.sessionId,
        waitingCount: this.state.getWaitingCount(),
      });
    }

    // Update metrics
    metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
  }

  onDispose(): void {
    console.log('[LobbyRoom] onDispose:', {
      roomId: this.roomId,
      remainingPlayers: this.state?.waitingPlayers?.size ?? 0,
      timestamp: new Date().toISOString(),
    });

    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      console.log('[LobbyRoom] Timeout interval cleared');
    }
  }

  private handleJoinLobby(client: Client, message: any): void {
    console.log('[LobbyRoom] handleJoinLobby:', {
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

    console.log('[LobbyRoom] Sent joined_lobby message:', {
      sessionId: client.sessionId,
      waitingCount,
    });

    // Attempt to match after a player joins
    this.attemptMatch();
  }

  private handleLeaveLobby(client: Client): void {
    console.log('[LobbyRoom] handleLeaveLobby:', {
      sessionId: client.sessionId,
      timestamp: new Date().toISOString(),
    });

    const removed = this.state.removePlayer(client.sessionId);
    client.send('left_lobby', {});

    console.log('[LobbyRoom] Player left lobby:', {
      sessionId: client.sessionId,
      removed,
      remainingPlayers: this.state.waitingPlayers.size,
    });
  }

  private handleTimeouts(): void {
    const timedOutIds = this.matchmaker.getTimedOutPlayers(this.state);

    if (timedOutIds.length > 0) {
      console.log('[LobbyRoom] handleTimeouts:', {
        timedOutCount: timedOutIds.length,
        timedOutIds,
        timestamp: new Date().toISOString(),
      });
    }

    timedOutIds.forEach((sessionId) => {
      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (client) {
        client.send('timeout', { reason: 'No match found in time' });
        this.state.removePlayer(sessionId);
        console.log('[LobbyRoom] Player timed out:', {
          sessionId,
          remainingPlayers: this.state.waitingPlayers.size,
        });

        // Update metrics
        metrics.lobbyTimeoutsTotal.inc();
      }
    });

    // Update waiting players metric after timeouts
    if (timedOutIds.length > 0) {
      metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
    }
  }

  private attemptMatch(): void {
    const waitingCount = this.state.getWaitingCount();

    if (waitingCount < 2) {
      return;
    }

    console.log('[LobbyRoom] attemptMatch:', {
      waitingCount,
      timestamp: new Date().toISOString(),
    });

    const match = this.matchmaker.findMatch(this.state);

    if (!match) {
      console.log('[LobbyRoom] No match found despite waiting players:', {
        waitingCount,
      });
      return;
    }

    console.log('[LobbyRoom] Match found:', {
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
        console.log('[LobbyRoom] Sent matched message to player1:', {
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
        console.log('[LobbyRoom] Sent matched message to player2:', {
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

      console.log('[LobbyRoom] Match complete:', {
        matchId: match.matchId,
        matchDurationSeconds: matchDuration,
        remainingPlayers: this.state.waitingPlayers.size,
        remainingWaiting: this.state.getWaitingCount(),
      });

      // Update metrics
      metrics.lobbyMatchesTotal.inc();
      metrics.lobbyMatchDuration.observe(matchDuration);
      metrics.lobbyPlayersWaiting.set(this.state.getWaitingCount());
    } else {
      console.error('[LobbyRoom] Match failed - players not found:', {
        player1Found: !!player1,
        player2Found: !!player2,
        match,
      });
    }
  }
}
