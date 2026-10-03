type SessionListener = () => void;
const listeners = new Set<SessionListener>();

export const sessionEvents = {
  subscribe(listener: SessionListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  expired() {
    for (const listener of listeners) listener();
  },
};
