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

    // Group players by gameType
    const playersByGame = new Map<string, Player[]>();
    validPlayers.forEach((player) => {
      const gameType = player.gameType || 'snap';
      if (!playersByGame.has(gameType)) {
        playersByGame.set(gameType, []);
      }
      playersByGame.get(gameType)!.push(player);
    });

    // Find first game type with 2+ players
    for (const [gameType, players] of playersByGame.entries()) {
      if (players.length >= 2) {
        // FIFO: Take the two oldest players for this game type
        const player1 = players[0];
        const player2 = players[1];

        return {
          matchId: this.generateMatchId(),
          player1SessionId: player1.sessionId,
          player2SessionId: player2.sessionId,
          matchedAt: Date.now(),
        };
      }
    }

    return null;
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
