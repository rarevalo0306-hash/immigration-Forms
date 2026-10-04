/** An in-memory localStorage for storage tests; Object.keys() lists saved keys, as in a browser. */
export function useMemoryStorage() {
  const m = new Map<string, string>();
  const store = {
    get length() { return m.size; },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
  const proxy = new Proxy(store, {
    ownKeys: () => [...m.keys()],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
  (globalThis as unknown as { localStorage: Storage }).localStorage = proxy as unknown as Storage;
  return m;
}
