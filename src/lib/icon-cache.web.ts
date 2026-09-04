export const iconCache = {
  getItem: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => {
    globalThis.localStorage?.setItem(key, value);
  },
};
