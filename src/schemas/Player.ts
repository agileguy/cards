import { Schema, type } from '@colyseus/schema';

export type PlayerStatus = 'waiting' | 'matched' | 'disconnected';

export class Player extends Schema {
  @type('string') public sessionId: string;
  @type('string') public name: string;
  @type('number') public joinedAt: number;
  @type('string') public status: PlayerStatus;
  @type('string') public gameType: string;

  constructor(sessionId: string, name: string = 'Player', gameType: string = 'snap') {
    super();
    this.sessionId = sessionId;
    this.name = name;
    this.joinedAt = Date.now();
    this.status = 'waiting';
    this.gameType = gameType;
  }

  public setStatus(status: PlayerStatus): void {
    this.status = status;
  }

  public isTimedOut(timeoutMs: number): boolean {
    return Date.now() - this.joinedAt > timeoutMs;
  }
}
