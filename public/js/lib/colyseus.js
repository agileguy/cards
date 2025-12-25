/**
 * Colyseus JavaScript Client Loader
 * Tries local vendored version first, falls back to CDN if needed
 */

export async function loadColyseusClient() {
  if (window.Colyseus) {
    return window.Colyseus;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    // Try local vendored version first
    script.src = '/js/lib/colyseus-vendored.js';

    script.onload = () => {
      if (window.Colyseus) {
        console.log('✓ Loaded Colyseus from local vendor');
        resolve(window.Colyseus);
      } else {
        reject(new Error('Colyseus loaded but not found on window'));
      }
    };

    script.onerror = () => {
      console.warn('Failed to load local Colyseus, trying CDN...');
      // Fallback to CDN
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://unpkg.com/colyseus.js@^0.15.0/dist/colyseus.js';
      cdnScript.onload = () => resolve(window.Colyseus);
      cdnScript.onerror = () => reject(new Error('Failed to load Colyseus from CDN'));
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(script);
  });
}
