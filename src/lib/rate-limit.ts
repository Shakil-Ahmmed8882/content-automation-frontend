let limitedUntil = 0;
const listeners = new Set<() => void>();

export const rateLimit = {
  getSnapshot: () => limitedUntil,
  getServerSnapshot: () => 0,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  pause(seconds = 60) {
    limitedUntil = Math.max(limitedUntil, Date.now() + seconds * 1000);
    for (const listener of listeners) listener();
  },
};
