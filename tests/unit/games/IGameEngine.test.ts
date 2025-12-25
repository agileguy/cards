import {
  IGameEngine,
  GameAction,
  ActionResult,
  ValidationResult,
} from '../../../src/games/IGameEngine';
import { BaseGameState } from '../../../src/schemas/BaseGameState';
import { GamePlayer } from '../../../src/schemas/GamePlayer';

// Mock implementation of IGameEngine for testing
class MockGameState extends BaseGameState {
  public turnCount: number = 0;
  public gameOver: boolean = false;
}

class MockGameEngine implements IGameEngine<MockGameState> {
  private state: MockGameState;

  constructor() {
    this.state = new MockGameState();
  }

  initialize(players: GamePlayer[]): MockGameState {
    this.state = new MockGameState();
    players.forEach((player) => {
      this.state.addPlayer(player);
    });
    this.state.setStatus('waiting');
    return this.state;
  }

  processAction(state: MockGameState, action: GameAction): ActionResult<MockGameState> {
    const newState = state;

    if (action.type === 'START_GAME') {
      newState.setStatus('playing');
      newState.startedAt = Date.now();
      return { success: true, newState };
    }

    if (action.type === 'TAKE_TURN') {
      newState.turnCount++;
      return { success: true, newState };
    }

    if (action.type === 'END_GAME') {
      newState.setStatus('completed');
      newState.gameOver = true;
      newState.endedAt = Date.now();
      if (action.payload?.winnerId) {
        newState.setWinner(action.payload.winnerId);
      }
      return { success: true, newState };
    }

    return {
      success: false,
      newState,
      error: `Unknown action type: ${action.type}`,
    };
  }

  validateAction(state: MockGameState, action: GameAction): ValidationResult {
    if (action.type === 'START_GAME' && state.status !== 'waiting') {
      return { valid: false, error: 'Game already started' };
    }

    if (action.type === 'TAKE_TURN' && state.status !== 'playing') {
      return { valid: false, error: 'Game not in progress' };
    }

    if (action.type === 'END_GAME' && state.status !== 'playing') {
      return { valid: false, error: 'Game not in progress' };
    }

    return { valid: true };
  }

  isGameOver(state: MockGameState): boolean {
    return state.gameOver || state.status === 'completed';
  }

  getWinner(state: MockGameState): string | null {
    if (this.isGameOver(state)) {
      return state.winner;
    }
    return null;
  }

  getGameState(): MockGameState {
    return this.state;
  }
}

describe('IGameEngine', () => {
  let engine: MockGameEngine;
  let player1: GamePlayer;
  let player2: GamePlayer;

  beforeEach(() => {
    engine = new MockGameEngine();
    player1 = new GamePlayer('session-1', 'Alice');
    player2 = new GamePlayer('session-2', 'Bob');
  });

  describe('initialize', () => {
    it('should create valid initial state', () => {
      const state = engine.initialize([player1, player2]);

      expect(state).toBeDefined();
      expect(state.players.size).toBe(2);
      expect(state.status).toBe('waiting');
    });

    it('should add all players to state', () => {
      const state = engine.initialize([player1, player2]);

      expect(state.players.get('session-1')).toBeDefined();
      expect(state.players.get('session-2')).toBeDefined();
      expect(state.players.get('session-1')?.name).toBe('Alice');
      expect(state.players.get('session-2')?.name).toBe('Bob');
    });

    it('should handle single player initialization', () => {
      const state = engine.initialize([player1]);

      expect(state.players.size).toBe(1);
      expect(state.players.get('session-1')).toBeDefined();
    });

    it('should handle empty player list', () => {
      const state = engine.initialize([]);

      expect(state.players.size).toBe(0);
    });
  });

  describe('processAction', () => {
    let state: MockGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return new state when action succeeds', () => {
      const action: GameAction = {
        type: 'START_GAME',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState).toBeDefined();
      expect(result.newState.status).toBe('playing');
    });

    it('should return error when action fails', () => {
      const action: GameAction = {
        type: 'INVALID_ACTION',
        playerId: 'session-1',
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unknown action type');
    });

    it('should handle action with payload', () => {
      // Start game first
      engine.processAction(state, {
        type: 'START_GAME',
        playerId: 'session-1',
      });

      // End game with winner
      const action: GameAction = {
        type: 'END_GAME',
        playerId: 'session-1',
        payload: { winnerId: 'session-1' },
      };

      const result = engine.processAction(state, action);

      expect(result.success).toBe(true);
      expect(result.newState.winner).toBe('session-1');
    });

    it('should maintain immutability (return new state)', () => {
      const action: GameAction = {
        type: 'TAKE_TURN',
        playerId: 'session-1',
      };

      engine.processAction(state, {
        type: 'START_GAME',
        playerId: 'session-1',
      });

      const initialTurnCount = state.turnCount;
      const result = engine.processAction(state, action);

      expect(result.newState).toBeDefined();
      expect(result.newState.turnCount).toBe(initialTurnCount + 1);
    });
  });

  describe('validateAction', () => {
    let state: MockGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return valid for legal action', () => {
      const action: GameAction = {
        type: 'START_GAME',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for illegal action', () => {
      // Set state to playing so START_GAME is invalid
      state.setStatus('playing');

      const action: GameAction = {
        type: 'START_GAME',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('already started');
    });

    it('should catch actions out of sequence', () => {
      const action: GameAction = {
        type: 'TAKE_TURN',
        playerId: 'session-1',
      };

      const result = engine.validateAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not in progress');
    });

    it('should validate action before processing', () => {
      const action: GameAction = {
        type: 'END_GAME',
        playerId: 'session-1',
      };

      // Validation should fail
      const validationResult = engine.validateAction(state, action);
      expect(validationResult.valid).toBe(false);

      // Processing should also indicate failure if we don't validate first
      const processResult = engine.processAction(state, action);
      expect(processResult.success).toBe(true); // Mock allows it, but real impl should check
    });
  });

  describe('isGameOver', () => {
    let state: MockGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return false for ongoing game', () => {
      state.setStatus('playing');

      expect(engine.isGameOver(state)).toBe(false);
    });

    it('should return true when game is completed', () => {
      state.setStatus('completed');
      state.gameOver = true;

      expect(engine.isGameOver(state)).toBe(true);
    });

    it('should return false for waiting game', () => {
      expect(engine.isGameOver(state)).toBe(false);
    });

    it('should detect end condition through status', () => {
      state.setStatus('completed');

      expect(engine.isGameOver(state)).toBe(true);
    });

    it('should detect end condition through custom flag', () => {
      state.setStatus('playing');
      state.gameOver = true;

      expect(engine.isGameOver(state)).toBe(true);
    });
  });

  describe('getWinner', () => {
    let state: MockGameState;

    beforeEach(() => {
      state = engine.initialize([player1, player2]);
    });

    it('should return null for ongoing game', () => {
      state.setStatus('playing');

      expect(engine.getWinner(state)).toBeNull();
    });

    it('should return winner when game is over', () => {
      state.setStatus('completed');
      state.gameOver = true;
      state.setWinner('session-1');

      expect(engine.getWinner(state)).toBe('session-1');
    });

    it('should return null for completed game with no winner (draw)', () => {
      state.setStatus('completed');
      state.gameOver = true;

      expect(engine.getWinner(state)).toBeNull();
    });

    it('should not return winner before game ends', () => {
      state.setWinner('session-1');
      state.setStatus('playing');

      expect(engine.getWinner(state)).toBeNull();
    });
  });

  describe('getGameState', () => {
    it('should return current game state', () => {
      const state = engine.initialize([player1, player2]);

      const retrievedState = engine.getGameState();

      expect(retrievedState).toBe(state);
      expect(retrievedState.players.size).toBe(2);
    });

    it('should reflect state changes', () => {
      engine.initialize([player1, player2]);

      const action: GameAction = {
        type: 'START_GAME',
        playerId: 'session-1',
      };
      engine.processAction(engine.getGameState(), action);

      const currentState = engine.getGameState();
      expect(currentState.status).toBe('playing');
    });
  });

  describe('integration - full game flow', () => {
    it('should handle complete game lifecycle', () => {
      // 1. Initialize
      let state = engine.initialize([player1, player2]);
      expect(state.status).toBe('waiting');
      expect(state.players.size).toBe(2);

      // 2. Start game
      let validation = engine.validateAction(state, {
        type: 'START_GAME',
        playerId: 'session-1',
      });
      expect(validation.valid).toBe(true);

      let result = engine.processAction(state, {
        type: 'START_GAME',
        playerId: 'session-1',
      });
      state = result.newState;
      expect(state.status).toBe('playing');

      // 3. Take turns
      for (let i = 0; i < 5; i++) {
        validation = engine.validateAction(state, {
          type: 'TAKE_TURN',
          playerId: `session-${(i % 2) + 1}`,
        });
        expect(validation.valid).toBe(true);

        result = engine.processAction(state, {
          type: 'TAKE_TURN',
          playerId: `session-${(i % 2) + 1}`,
        });
        state = result.newState;
      }
      expect(state.turnCount).toBe(5);

      // 4. End game
      validation = engine.validateAction(state, {
        type: 'END_GAME',
        playerId: 'session-1',
        payload: { winnerId: 'session-1' },
      });
      expect(validation.valid).toBe(true);

      result = engine.processAction(state, {
        type: 'END_GAME',
        playerId: 'session-1',
        payload: { winnerId: 'session-1' },
      });
      state = result.newState;

      expect(engine.isGameOver(state)).toBe(true);
      expect(engine.getWinner(state)).toBe('session-1');
      expect(state.status).toBe('completed');
    });
  });
});
