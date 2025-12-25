import { Schema, type, MapSchema } from '@colyseus/schema';
import { GamePlayer } from './GamePlayer';

export type GameStatus = 'waiting' | 'playing' | 'completed';

export class BaseGameState extends Schema {
  @type({ map: GamePlayer }) public players = new MapSchema<GamePlayer>();
  @type('string') public status: GameStatus = 'waiting';
  @type('string') public winner: string | null = null;
  @type('number') public startedAt: number = 0;
  @type('number') public endedAt: number = 0;

  public addPlayer(player: GamePlayer): boolean {
    if (this.players.has(player.sessionId)) {
      return false;
    }
    this.players.set(player.sessionId, player);
    return true;
  }

  public getPlayer(sessionId: string): GamePlayer | undefined {
    return this.players.get(sessionId);
  }

  public removePlayer(sessionId: string): boolean {
    return this.players.delete(sessionId);
  }

  public setWinner(sessionId: string): void {
    this.winner = sessionId;
  }

  public setStatus(status: GameStatus): void {
    this.status = status;
  }
}
