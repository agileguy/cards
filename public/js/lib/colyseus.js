/**
 * Colyseus JavaScript Client (vendored version)
 * This is a minimal import statement for the Colyseus client
 * In production, use CDN: https://unpkg.com/colyseus.js@^0.15.0/dist/colyseus.js
 */

// For now, we'll use a dynamic import from CDN
export async function loadColyseusClient() {
  if (window.Colyseus) {
    return window.Colyseus;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/colyseus.js@^0.15.0/dist/colyseus.js';
    script.onload = () => resolve(window.Colyseus);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
