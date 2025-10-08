import { beforeAll, afterAll, beforeEach, afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ==================== GLOBAL SETUP ====================

beforeAll(() => {
  // Mock IntersectionObserver
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

  // Mock ResizeObserver
  if (!global.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      unobserve() {}
    } as any;
  }

  // Mock window.matchMedia
  if (typeof window !== 'undefined' && !window.matchMedia) {
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

  // Mock window.scrollTo
  if (typeof window !== 'undefined' && !window.scrollTo) {
    window.scrollTo = vi.fn();
  }

  // Suppress specific console warnings/errors in tests
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress known React/Testing Library warnings
    if (
      message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      message.includes('Error: Could not parse CSS stylesheet') ||
      message.includes('Not implemented: navigation')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('ReactDOM.render') ||
      message.includes('useLayoutEffect')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

// ==================== PER-TEST SETUP ====================

beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      localStorage.clear();
    }
    if (window.sessionStorage) {
      sessionStorage.clear();
    }
  }

  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset all modules to ensure clean state
  vi.resetModules();
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();

  // Restore all mocks
  vi.restoreAllMocks();
  
  // Clear all timers
  vi.clearAllTimers();
});

afterAll(() => {
  // Final cleanup
  vi.clearAllTimers();
  vi.restoreAllMocks();
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
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `expected value to be an array, but received ${typeof received}`,
      };
    }

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

  toBeValidBudgetItem(received: any) {
    const requiredFields = ['id', 'name', 'tooltip', 'value', 'normativeDocument'];
    const hasAllFields = requiredFields.every(field => field in received);
    const hasCorrectTypes = 
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.tooltip === 'string' &&
      typeof received.normativeDocument === 'string';

    const pass = hasAllFields && hasCorrectTypes;

    return {
      pass,
      message: () =>
        pass
          ? `expected object not to be a valid BudgetItem`
          : `expected object to be a valid BudgetItem with all required fields and correct types`,
    };
  },

  toBeValidRoadSection(received: any) {
    const requiredFields = [
      'id', 'name', 'length', 'category', 'trafficIntensity',
      'strengthModulus', 'roughnessProfile', 'rutDepth', 
      'frictionCoeff', 'significance'
    ];
    const hasAllFields = requiredFields.every(field => field in received);
    
    const pass = hasAllFields &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.length === 'number' &&
      received.length > 0 &&
      [1, 2, 3, 4, 5].includes(received.category) &&
      ['state', 'local'].includes(received.significance);

    return {
      pass,
      message: () =>
        pass
          ? `expected object not to be a valid RoadSection`
          : `expected object to be a valid RoadSection with all required fields and correct types`,
    };
  },

  toHaveValidCoefficients(received: any) {
    const coefficientFields = [
      'intensityCoeff',
      'strengthCoeff',
      'evennessCoeff',
      'rutCoeff',
      'frictionFactorCoeff'
    ];

    const hasAllCoeffs = coefficientFields.every(field => field in received);
    const allAreNumbers = coefficientFields.every(field => 
      typeof received[field] === 'number' && 
      Number.isFinite(received[field])
    );
    const allArePositive = coefficientFields.every(field => received[field] >= 0);

    const pass = hasAllCoeffs && allAreNumbers && allArePositive;

    return {
      pass,
      message: () =>
        pass
          ? `expected object not to have valid coefficients`
          : `expected object to have all coefficient fields as positive numbers`,
    };
  },

  toBeValidWorkType(received: any) {
    const validWorkTypes = [
      'current_repair',
      'capital_repair',
      'reconstruction',
      'no_work_needed'
    ];

    const pass = validWorkTypes.includes(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid work type`
          : `expected ${received} to be one of: ${validWorkTypes.join(', ')}`,
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
    toBeValidBudgetItem(): T;
    toBeValidRoadSection(): T;
    toHaveValidCoefficients(): T;
    toBeValidWorkType(): T;
  }
}

// ==================== HELPER UTILITIES ====================

export const testHelpers = {
  // Create a mock session ID
  createMockSessionId: () => 'test-session-' + Math.random().toString(36).substr(2, 9),
  
  // Create mock file
  createMockFile: (name: string, size: number = 1024, type: string = 'application/pdf') => {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
  },
  
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Suppress specific console methods during test
  suppressConsole: (methods: Array<'log' | 'warn' | 'error'> = ['error', 'warn']) => {
    const mocks: Record<string, any> = {};
    methods.forEach(method => {
      mocks[method] = vi.spyOn(console, method).mockImplementation(() => {});
    });
    return () => {
      Object.values(mocks).forEach((mock: any) => mock.mockRestore());
    };
  },
};

// Make helpers globally available for tests
if (typeof global !== 'undefined') {
  (global as any).testHelpers = testHelpers;
}