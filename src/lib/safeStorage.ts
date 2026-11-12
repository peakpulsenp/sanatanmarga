/**
 * safeStorage.ts
 * Fail-safe wrapper around localStorage and sessionStorage.
 * Prevents Apple/WebKit and Private Browsing SecurityError / DOMException crashes.
 */

const memoryStore = new Map<string, string>();
const sessionMemoryStore = new Map<string, string>();

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window[type];
    if (!storage) return false;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasLocalStorage = isStorageAvailable('localStorage');
const hasSessionStorage = isStorageAvailable('sessionStorage');

export const safeLocalStorage = {
  getItem: (key: string, defaultValue: string | null = null): string | null => {
    try {
      if (hasLocalStorage && typeof window !== 'undefined') {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : defaultValue;
      }
    } catch (e) {
      // Fall through to memoryStore
    }
    return memoryStore.has(key) ? (memoryStore.get(key) ?? defaultValue) : defaultValue;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (hasLocalStorage && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Silent fallback
    }
    memoryStore.set(key, String(value));
  },

  removeItem: (key: string): void => {
    try {
      if (hasLocalStorage && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    memoryStore.delete(key);
  },

  clear: (): void => {
    try {
      if (hasLocalStorage && typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch (e) {}
    memoryStore.clear();
  }
};

export const safeSessionStorage = {
  getItem: (key: string, defaultValue: string | null = null): string | null => {
    try {
      if (hasSessionStorage && typeof window !== 'undefined') {
        const val = window.sessionStorage.getItem(key);
        return val !== null ? val : defaultValue;
      }
    } catch (e) {
      // Fall through to sessionMemoryStore
    }
    return sessionMemoryStore.has(key) ? (sessionMemoryStore.get(key) ?? defaultValue) : defaultValue;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (hasSessionStorage && typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      // Silent fallback
    }
    sessionMemoryStore.set(key, String(value));
  },

  removeItem: (key: string): void => {
    try {
      if (hasSessionStorage && typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {}
    sessionMemoryStore.delete(key);
  },

  clear: (): void => {
    try {
      if (hasSessionStorage && typeof window !== 'undefined') {
        window.sessionStorage.clear();
      }
    } catch (e) {}
    sessionMemoryStore.clear();
  }
};
