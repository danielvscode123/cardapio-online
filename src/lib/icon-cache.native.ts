import Storage from 'expo-sqlite/kv-store';

export const iconCache = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
};
