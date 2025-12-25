import { Client } from './lib/colyseus-esm/index.mjs';

/**
 * GameClient - WebSocket client wrapper for Colyseus
 */
export class GameClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl || this.getServerUrl();
    this.client = null;
    this.currentRoom = null;
    this.ready = false;
  }

  /**
   * Get server URL based on current location
   */
  getServerUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  /**
   * Initialize the Colyseus client
   */
  async initialize() {
    if (this.ready) return;

    this.client = new Client(this.serverUrl);
    this.ready = true;
  }

  /**
   * Join or create a lobby room
   */
  async joinLobby(playerName) {
    if (!this.ready) {
      await this.initialize();
    }

    this.currentRoom = await this.client.joinOrCreate('lobby', {
      name: playerName
    });

    return this.currentRoom;
  }

  /**
   * Join a specific game room by ID
   */
  async joinGame(roomId) {
    if (!this.ready) {
      await this.initialize();
    }

    this.currentRoom = await this.client.joinById(roomId);
    return this.currentRoom;
  }

  /**
   * Create a new game room
   */
  async createGame(gameType, options = {}) {
    if (!this.ready) {
      await this.initialize();
    }

    this.currentRoom = await this.client.create(gameType, options);
    return this.currentRoom;
  }

  /**
   * Leave current room
   */
  async disconnect() {
    if (this.currentRoom) {
      await this.currentRoom.leave();
      this.currentRoom = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.currentRoom !== null;
  }
}
