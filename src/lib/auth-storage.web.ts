const serverStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const authStorage = typeof globalThis.localStorage === 'undefined'
  ? serverStorage
  : globalThis.localStorage;
