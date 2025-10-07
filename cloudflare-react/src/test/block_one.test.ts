// vitest.setup.ts
import { beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
class LocalStorageMock {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

// Установка моков перед всеми тестами
global.localStorage = new LocalStorageMock() as any;

// Очистка перед каждым тестом
beforeEach(() => {
  global.localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  global.localStorage.clear();
  vi.restoreAllMocks();
});