// vitest.setup.ts
// Глобальная конфигурация и setup для всех тестов

import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

// ==================== GLOBAL MOCKS ====================

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

// Mock sessionStorage (аналогично localStorage)
class SessionStorageMock extends LocalStorageMock {}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

// Mock console methods для тестов (опционально)
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// ==================== GLOBAL SETUP ====================

beforeAll(() => {
  // Инициализация глобальных моков
  global.localStorage = new LocalStorageMock() as any;
  global.sessionStorage = new SessionStorageMock() as any;

  // Подавление console.error в тестах (опционально)
  // Раскомментируйте если хотите подавить ошибки в консоли
  // console.error = vi.fn();
  // console.warn = vi.fn();
});

afterAll(() => {
  // Восстановление оригинальных методов
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});

// ==================== PER-TEST SETUP ====================

beforeEach(() => {
  // Очистка localStorage перед каждым тестом
  global.localStorage.clear();
  global.sessionStorage.clear();

  // Сброс всех моков
  vi.clearAllMocks();

  // Сброс таймеров
  vi.clearAllTimers();

  // Устанавливаем фиксированное время для тестов (опционально)
  // vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterEach(() => {
  // Очистка после React компонентов (если используете @testing-library/react)
  cleanup();

  // Восстановление всех моков
  vi.restoreAllMocks();

  // Восстановление реального времени
  // vi.useRealTimers();
});

// ==================== CUSTOM MATCHERS ====================

// Расширение expect с кастомными matchers
expect.extend({
  // Проверка что число находится в диапазоне
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },

  // Проверка что объект имеет определенную структуру
  toHaveStructure(received: any, expected: any) {
    const checkStructure = (obj: any, structure: any): boolean => {
      if (typeof structure !== 'object' || structure === null) {
        return typeof obj === typeof structure;
      }

      if (Array.isArray(structure)) {
        return Array.isArray(obj);
      }

      for (const key in structure) {
        if (!(key in obj)) {
          return false;
        }
        if (!checkStructure(obj[key], structure[key])) {
          return false;
        }
      }

      return true;
    };

    const pass = checkStructure(received, expected);
    return {
      pass,
      message: () =>
        pass
          ? `expected object not to have the specified structure`
          : `expected object to have the specified structure`,
    };
  },

  // Проверка что массив содержит объект с определенными свойствами
  toContainObjectMatching(received: any[], expected: Partial<any>) {
    const pass = received.some(item => {
      return Object.keys(expected).every(key => item[key] === expected[key]);
    });

    return {
      pass,
      message: () =>
        pass
          ? `expected array not to contain object matching ${JSON.stringify(expected)}`
          : `expected array to contain object matching ${JSON.stringify(expected)}`,
    };
  },

  // Проверка что значение близко к ожидаемому (с процентной погрешностью)
  toBeCloseToPercent(received: number, expected: number, percentTolerance: number = 1) {
    const difference = Math.abs(received - expected);
    const tolerance = Math.abs(expected * (percentTolerance / 100));
    const pass = difference <= tolerance;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within ${percentTolerance}% of ${expected}`
          : `expected ${received} to be within ${percentTolerance}% of ${expected}, but difference is ${difference} (tolerance: ${tolerance})`,
    };
  },
});

// ==================== GLOBAL TEST UTILITIES ====================

// Утилита для ожидания
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Утилита для пропуска фреймов React
export const waitForNextFrame = (): Promise<void> => {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
};

// Утилита для множественного ожидания
export const waitFor = async (
  callback: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await callback()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

// ==================== GLOBAL TEST CONSTANTS ====================

export const TEST_CONSTANTS = {
  // Временные константы
  SHORT_TIMEOUT: 1000,
  MEDIUM_TIMEOUT: 5000,
  LONG_TIMEOUT: 10000,

  // Тестовые данные
  TEST_DATE: new Date('2024-01-01T00:00:00.000Z'),
  TEST_SESSION_ID: 'test-session-123',

  // Лимиты производительности
  PERFORMANCE_THRESHOLDS: {
    FAST: 10, // ms
    ACCEPTABLE: 100, // ms
    SLOW: 1000, // ms
  },

  // Размеры тестовых данных
  DATA_SIZES: {
    TINY: 5,
    SMALL: 10,
    MEDIUM: 50,
    LARGE: 100,
    HUGE: 1000,
  },
} as const;

// ==================== GLOBAL ERROR HANDLERS ====================

// Обработчик непойманных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// ==================== CUSTOM TYPES FOR TESTS ====================

declare global {
  namespace Vi {
    interface Matchers<R = any> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveStructure(expected: any): R;
      toContainObjectMatching(expected: Partial<any>): R;
      toBeCloseToPercent(expected: number, percentTolerance?: number): R;
    }
  }
}

// ==================== TEST HELPERS ====================

/**
 * Создаетspy для функции с типизацией
 */
export function createTypedSpy<T extends (...args: any[]) => any>(
  implementation?: T
): T & { mock: { calls: Parameters<T>[] } } {
  const spy = vi.fn(implementation) as any;
  return spy;
}

/**
 * Мокает модуль с partial implementation
 */
export function mockModule<T extends Record<string, any>>(
  modulePath: string,
  implementation: Partial<T>
): void {
  vi.mock(modulePath, () => implementation);
}

/**
 * Создает mock для async функции
 */
export function createAsyncMock<T>(
  resolvedValue?: T,
  delay: number = 0
): () => Promise<T> {
  return vi.fn().mockImplementation(async () => {
    if (delay > 0) {
      await wait(delay);
    }
    return resolvedValue;
  });
}

/**
 * Создает mock который реджектится
 */
export function createRejectingMock(error: Error | string): () => Promise<never> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return vi.fn().mockRejectedValue(errorObj);
}

// ==================== SNAPSHOT UTILITIES ====================

/**
 * Нормализует объект для snapshot тестирования
 * Удаляет динамические поля типа timestamps, ids и т.д.
 */
export function normalizeForSnapshot(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeForSnapshot);
  }

  if (obj instanceof Date) {
    return '[Date]';
  }

  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const key in obj) {
      // Пропускаем динамические поля
      if (
        key === 'id' ||
        key === 'timestamp' ||
        key === 'sessionId' ||
        key === 'createdAt' ||
        key === 'updatedAt'
      ) {
        normalized[key] = '[DYNAMIC]';
      } else {
        normalized[key] = normalizeForSnapshot(obj[key]);
      }
    }
    return normalized;
  }

  return obj;
}

// ==================== PERFORMANCE TESTING ====================

/**
 * Измеряет производительность функции
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
  iterations: number = 1
): Promise<{
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  result: T;
}> {
  const times: number[] = [];
  let lastResult: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    lastResult = await fn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);

  return {
    name,
    iterations,
    totalTime,
    avgTime: totalTime / iterations,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    result: lastResult!,
  };
}

/**
 * Проверяет что функция выполняется быстрее заданного порога
 */
export async function expectPerformance<T>(
  fn: () => T | Promise<T>,
  maxDuration: number,
  message?: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (duration > maxDuration) {
    throw new Error(
      message ||
        `Expected function to complete in less than ${maxDuration}ms but took ${duration.toFixed(2)}ms`
    );
  }

  return result;
}

// ==================== DATA VALIDATION ====================

/**
 * Проверяет что значение является валидным числом
 */
export function assertValidNumber(
  value: any,
  name: string = 'value'
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Expected ${name} to be a valid number, got ${value}`);
  }
}

/**
 * Проверяет что значение положительное
 */
export function assertPositive(
  value: number,
  name: string = 'value'
): asserts value is number {
  assertValidNumber(value, name);
  if (value <= 0) {
    throw new Error(`Expected ${name} to be positive, got ${value}`);
  }
}

/**
 * Проверяет что значение в диапазоне
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  name: string = 'value'
): asserts value is number {
  assertValidNumber(value, name);
  if (value < min || value > max) {
    throw new Error(
      `Expected ${name} to be in range [${min}, ${max}], got ${value}`
    );
  }
}

// ==================== LOGGING ====================

/**
 * Утилита для debug логирования в тестах
 */
export const testLogger = {
  enabled: process.env.DEBUG_TESTS === 'true',

  log(...args: any[]) {
    if (this.enabled) {
      console.log('[TEST]', ...args);
    }
  },

  error(...args: any[]) {
    if (this.enabled) {
      console.error('[TEST ERROR]', ...args);
    }
  },

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn('[TEST WARN]', ...args);
    }
  },

  group(label: string) {
    if (this.enabled) {
      console.group(`[TEST] ${label}`);
    }
  },

  groupEnd() {
    if (this.enabled) {
      console.groupEnd();
    }
  },
};

// ==================== EXPORTS ====================

export {
  LocalStorageMock,
  SessionStorageMock,
  IntersectionObserverMock,
  ResizeObserverMock,
};

// Экспортируем для использования в тестах
export const testSetup = {
  wait,
  waitForNextFrame,
  waitFor,
  createTypedSpy,
  mockModule,
  createAsyncMock,
  createRejectingMock,
  normalizeForSnapshot,
  measurePerformance,
  expectPerformance,
  assertValidNumber,
  assertPositive,
  assertInRange,
  testLogger,
  TEST_CONSTANTS,
};

export default testSetup;