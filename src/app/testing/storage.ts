// The unit-test DOM has no persistent browser origin. Supply the Storage contract
// explicitly; persistence across service recreation is tested against this store.
export function installTestStorage(): void {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    key: index => [...values.keys()][index] ?? null,
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
}
