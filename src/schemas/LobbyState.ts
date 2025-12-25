import { Schema, MapSchema, type } from '@colyseus/schema';
import { Player } from './Player';

export class LobbyState extends Schema {
  @type({ map: Player }) public waitingPlayers = new MapSchema<Player>();
  @type('string') public status: string = 'waiting';

  public addPlayer(player: Player): boolean {
    if (this.waitingPlayers.has(player.sessionId)) {
      return false;
    }
    this.waitingPlayers.set(player.sessionId, player);
    return true;
  }

  public removePlayer(sessionId: string): boolean {
    if (!this.waitingPlayers.has(sessionId)) {
      return false;
    }
    this.waitingPlayers.delete(sessionId);
    return true;
  }

  public getWaitingCount(): number {
    let count = 0;
    this.waitingPlayers.forEach((player) => {
      if (player.status === 'waiting') {
        count++;
      }
    });
    return count;
  }

  public getWaitingPlayerIds(): string[] {
    const ids: string[] = [];
    this.waitingPlayers.forEach((player, sessionId) => {
      if (player.status === 'waiting') {
        ids.push(sessionId);
      }
    });
    return ids;
  }
}
