// vitest.setup.ts
import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ==================== GLOBAL SETUP ====================

beforeAll(() => {
  // Mock IntersectionObserver (если не поддерживается)
  if (!global.IntersectionObserver) {
    global.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      takeRecords() {
        return [];
      }
      unobserve() {}
    } as any;
  }

  // Mock ResizeObserver (если не поддерживается)
  if (!global.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
    } as any;
  }

  // Mock window.matchMedia (если не поддерживается)
  if (!window.matchMedia) {
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
  }
});

// ==================== PER-TEST SETUP ====================

beforeEach(() => {
  // Очистка localStorage и sessionStorage
  if (window.localStorage) {
    localStorage.clear();
  }
  if (window.sessionStorage) {
    sessionStorage.clear();
  }

  // Очистка всех моков
  vi.clearAllMocks();
});

afterEach(() => {
  // Очистка React компонентов
  cleanup();

  // Восстановление всех моков
  vi.restoreAllMocks();
});

afterAll(() => {
  // Финальная очистка
  vi.clearAllTimers();
});

// ==================== CUSTOM MATCHERS ====================

expect.extend({
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
});

// ==================== TYPE EXTENSIONS ====================

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toBeCloseToPercent(expected: number, percentTolerance?: number): T;
    toHaveStructure(expected: any): T;
    toContainObjectMatching(expected: Partial<any>): T;
  }
}