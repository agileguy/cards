import { BaseGameState } from '../schemas/BaseGameState';

export interface GameAction {
  type: string;
  playerId: string;
  payload?: any;
}

export interface ActionResult<TState extends BaseGameState> {
  success: boolean;
  newState: TState;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface IGameEngine<TState extends BaseGameState> {
  /**
   * Initialize game state with players
   */
  initialize(players: any[]): TState;

  /**
   * Process a game action and return updated state
   */
  processAction(state: TState, action: GameAction): ActionResult<TState>;

  /**
   * Validate if an action is legal in the current state
   */
  validateAction(state: TState, action: GameAction): ValidationResult;

  /**
   * Check if the game has ended
   */
  isGameOver(state: TState): boolean;

  /**
   * Get the winner if game is over
   */
  getWinner(state: TState): string | null;

  /**
   * Get current game state
   */
  getGameState(): TState;
}
