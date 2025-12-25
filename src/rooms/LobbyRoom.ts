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

  private handleTimeouts(): void {
    // Stub for now - will implement timeout handling in next commit
  }

  private attemptMatch(): void {
    // Stub for now - will implement matching in next commit
  }
}
