import { LobbyState } from '../schemas/LobbyState';
import { Player } from '../schemas/Player';

export interface MatchResult {
  matchId: string;
  player1SessionId: string;
  player2SessionId: string;
  matchedAt: number;
}

export class Matchmaker {
  private timeoutMs: number;

  constructor(timeoutMs: number = 30000) {
    this.timeoutMs = timeoutMs;
  }

  public findMatch(state: LobbyState): MatchResult | null {
    const validPlayers = this.getValidWaitingPlayers(state);

    if (validPlayers.length < 2) {
      return null;
    }

    // FIFO: Take the two oldest players
    const player1 = validPlayers[0];
    const player2 = validPlayers[1];

    return {
      matchId: this.generateMatchId(),
      player1SessionId: player1.sessionId,
      player2SessionId: player2.sessionId,
      matchedAt: Date.now(),
    };
  }

  public getTimedOutPlayers(state: LobbyState): string[] {
    const timedOutIds: string[] = [];

    state.waitingPlayers.forEach((player, sessionId) => {
      if (player.status === 'waiting' && player.isTimedOut(this.timeoutMs)) {
        timedOutIds.push(sessionId);
      }
    });

    return timedOutIds;
  }

  private getValidWaitingPlayers(state: LobbyState): Player[] {
    const validPlayers: Player[] = [];

    state.waitingPlayers.forEach((player) => {
      if (player.status === 'waiting' && !player.isTimedOut(this.timeoutMs)) {
        validPlayers.push(player);
      }
    });

    // Sort by joinedAt (FIFO - oldest first)
    validPlayers.sort((a, b) => a.joinedAt - b.joinedAt);

    return validPlayers;
  }

  private generateMatchId(): string {
    return `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
