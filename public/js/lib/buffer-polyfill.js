/**
 * Minimal Buffer polyfill for browser
 * Colyseus UMD build expects Buffer to exist
 */
(function() {
  'use strict';

  if (typeof window.Buffer !== 'undefined') {
    return; // Already defined
  }

  // Minimal Buffer implementation for Colyseus
  class BufferPolyfill {
    constructor(data) {
      if (typeof data === 'number') {
        // Buffer.alloc(size)
        this.data = new Uint8Array(data);
      } else if (data instanceof ArrayBuffer) {
        this.data = new Uint8Array(data);
      } else if (data instanceof Uint8Array) {
        this.data = data;
      } else if (Array.isArray(data)) {
        this.data = new Uint8Array(data);
      } else {
        this.data = new Uint8Array(0);
      }
      this.length = this.data.length;
    }

    static alloc(size) {
      return new BufferPolyfill(size);
    }

    static from(data) {
      return new BufferPolyfill(data);
    }

    static isBuffer(obj) {
      return obj instanceof BufferPolyfill;
    }

    toString(encoding) {
      // Simple UTF-8 decode
      const decoder = new TextDecoder(encoding || 'utf-8');
      return decoder.decode(this.data);
    }

    slice(start, end) {
      return new BufferPolyfill(this.data.slice(start, end));
    }
  }

  // Expose as global
  window.Buffer = BufferPolyfill;
  console.log('✓ Buffer polyfill loaded');
})();
