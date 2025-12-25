import { Room, Client } from 'colyseus';
import { LobbyState } from '../schemas/LobbyState';
import { Player } from '../schemas/Player';
import { Matchmaker } from '../utils/Matchmaker';

export class LobbyRoom extends Room<LobbyState> {
  private matchmaker: Matchmaker;
  private timeoutInterval: NodeJS.Timeout;

  onCreate(options: any): void {
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
  }

  onJoin(client: Client, options: any): void {
    const player = new Player(client.sessionId, options.name || 'Player');
    this.state.addPlayer(player);
  }

  onLeave(client: Client, consented: boolean): void {
    const player = this.state.waitingPlayers.get(client.sessionId);

    if (!player) {
      return;
    }

    if (consented) {
      this.state.removePlayer(client.sessionId);
    } else {
      player.setStatus('disconnected');
    }
  }

  onDispose(): void {
    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
    }
  }

  private handleJoinLobby(client: Client, message: any): void {
    const waitingCount = this.state.getWaitingCount();
    this.broadcast(
      'joined_lobby',
      { sessionId: client.sessionId, waitingCount },
      { except: client }
    );
    client.send('joined_lobby', { sessionId: client.sessionId, waitingCount });

    // Attempt to match after a player joins
    this.attemptMatch();
  }

  private handleLeaveLobby(client: Client): void {
    this.state.removePlayer(client.sessionId);
    client.send('left_lobby', {});
  }

  private handleTimeouts(): void {
    const timedOutIds = this.matchmaker.getTimedOutPlayers(this.state);

    timedOutIds.forEach((sessionId) => {
      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (client) {
        client.send('timeout', { reason: 'No match found in time' });
        this.state.removePlayer(sessionId);
      }
    });
  }

  private attemptMatch(): void {
    const match = this.matchmaker.findMatch(this.state);

    if (!match) {
      return;
    }

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
      }

      if (client2) {
        client2.send('matched', {
          matchId: match.matchId,
          opponentSessionId: match.player1SessionId,
          matchedAt: match.matchedAt,
        });
      }

      // Remove matched players from lobby
      this.state.removePlayer(match.player1SessionId);
      this.state.removePlayer(match.player2SessionId);
    }
  }
}
