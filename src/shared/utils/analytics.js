/**
 * Deferred beacon queue with batch flush
 */

const queue = [];
const MAX_BATCH = 100;

const flush = async () => {
  if (!queue.length) return;
  
  const batch = queue.splice(0, MAX_BATCH);
  try {
    await fetch('/beacon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      // Use sendBeacon API if available for reliable delivery
      keepalive: 'sendBeacon' in navigator
    });
  } catch (e) {
    console.debug('Beacon failed:', e.message);
  }
};

// Flush on page hide or visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
}

export const enqueue = (event) => {
  queue.push({
    ...event,
    ts: new Date().toISOString()
  });
  
  // Flush if batch size reached
  if (queue.length >= MAX_BATCH) {
    flush();
  }
};