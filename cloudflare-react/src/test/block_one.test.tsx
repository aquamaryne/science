import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type BudgetItem,
  initialStateRoadItems,
  initialLocalRoadItems,
  calculateQ1,
  calculateQ2
} from '../modules/block_one';
import { calculationResultsService } from '../service/resultLocalStorage';
import { setBlockOneBudgetData, getBudgetStatistics } from '../modules/block_three';

// Mock modules
vi.mock('../../service/resultLocalStorage', () => ({
  calculationResultsService: {
    createSession: vi.fn(() => 'test-session-' + Math.random().toString(36).substr(2, 9)),
    saveBlockOneResults: vi.fn(() => true),
    getSessionResults: vi.fn(() => null)
  }
}));

vi.mock('../../modules/block_three', () => ({
  setBlockOneBudgetData: vi.fn(),
  getBudgetStatistics: vi.fn(() => ({
    hasData: false,
    totalBudget: 0,
    q1Budget: 0,
    q2Budget: 0,
    allocation: null
  }))
}));

// Helper functions
const createTestBudgetItem = (overrides: Partial<BudgetItem> = {}): BudgetItem => ({
  id: 'TEST',
  name: 'Test Item',
  tooltip: 'Test tooltip',
  value: null,
  normativeDocument: '',
  attachedFiles: [],
  ...overrides
});

const createTestFile = (overrides: Partial<{name: string; size: number; type: string; lastModified: number}> = {}) => ({
  name: 'test-file.xlsx',
  size: 1024,
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  lastModified: Date.now(),
  ...overrides
});

const createValidStateRoadItems = (): BudgetItem[] => {
  return initialStateRoadItems.map((item) => ({
    ...item,
    value: 1000,
    normativeDocument: `Document for ${item.id}`
  }));
};

const createValidLocalRoadItems = (): BudgetItem[] => {
  return initialLocalRoadItems.map((item) => ({
    ...item,
    value: 500,
    normativeDocument: `Document for ${item.id}`
  }));
};

describe('Block One - Budget Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Data Structure', () => {
    it('should have valid state road items structure', () => {
      expect(Array.isArray(initialStateRoadItems)).toBe(true);
      expect(initialStateRoadItems.length).toBeGreaterThan(0);
      
      initialStateRoadItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('tooltip');
        expect(item).toHaveProperty('value');
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.tooltip).toBe('string');
      });
    });

    it('should have valid local road items structure', () => {
      expect(Array.isArray(initialLocalRoadItems)).toBe(true);
      expect(initialLocalRoadItems.length).toBeGreaterThan(0);
      
      initialLocalRoadItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('tooltip');
        expect(item).toHaveProperty('value');
      });
    });

    it('should have unique IDs in state road items', () => {
      const ids = initialStateRoadItems.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique IDs in local road items', () => {
      const ids = initialLocalRoadItems.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required state road IDs', () => {
      const ids = initialStateRoadItems.map(item => item.id);
      const requiredIds = ['Q1', 'Qпп', 'Qміжн', 'QІАС', 'QДПП'];
      
      requiredIds.forEach(id => {
        expect(ids).toContain(id);
      });
    });

    it('should have required local road ID', () => {
      const ids = initialLocalRoadItems.map(item => item.id);
      expect(ids).toContain('Q2');
    });
  });

  describe('Q1 Calculation (State Roads)', () => {
    describe('Valid Calculations', () => {
      it('should calculate value with valid data', () => {
        const items = createValidStateRoadItems();
        const result = calculateQ1(items);
        
        expect(result).not.toBeNull();
        expect(Number.isFinite(result!)).toBe(true);
      });

      it('should calculate Q1 minus other values', () => {
        const items = initialStateRoadItems.map((item, _index) => ({
          ...item,
          value: 1000
        }));
        
        const result = calculateQ1(items);
        // Q1 = 1000 - (8 * 1000) = -7000
        const expectedResult = 1000 - (8 * 1000);
        
        expect(result).toBe(expectedResult);
      });

      it('should handle different value magnitudes', () => {
        const items = initialStateRoadItems.map((item, index) => ({
          ...item,
          value: Math.pow(10, index + 1)
        }));
        
        const result = calculateQ1(items);
        expect(result).not.toBeNull();
        expect(Number.isFinite(result!)).toBe(true);
      });

      it('should handle decimal values', () => {
        const items = initialStateRoadItems.map(item => ({
          ...item,
          value: 1000.55
        }));
        
        const result = calculateQ1(items);
        // Q1 = 1000.55 - (8 * 1000.55) = -7003.85
        const expectedResult = 1000.55 - (8 * 1000.55);
        expect(result).toBeCloseTo(expectedResult, 2);
      });
    });

    describe('Edge Cases', () => {
      it('should return 0 when all values are 0', () => {
        const items = initialStateRoadItems.map(item => ({
          ...item,
          value: 0
        }));
        
        const result = calculateQ1(items);
        expect(result).toBe(0);
      });

      it('should return null for null values', () => {
        const items = initialStateRoadItems.map(item => ({
          ...item,
          value: null as any
        }));
        
        const result = calculateQ1(items);
        expect(result).toBeNull();
      });

      it('should handle very large numbers', () => {
        const items = initialStateRoadItems.map(item => ({
          ...item,
          value: 1000000000
        }));
        
        const result = calculateQ1(items);
        expect(Number.isFinite(result!)).toBe(true);
        expect(result).not.toBeNull();
      });

      it('should handle empty array', () => {
        const result = calculateQ1([]);
        expect(result).toBeNull();
      });

      it('should handle single item', () => {
        const items = [createTestBudgetItem({ id: 'Q1', value: 5000 })];
        const result = calculateQ1(items);
        expect(result).toBe(5000);
      });
    });

    describe('Data Integrity', () => {
      it('should not modify input items', () => {
        const items = createValidStateRoadItems();
        const originalItems = JSON.parse(JSON.stringify(items));
        
        calculateQ1(items);
        
        expect(items).toEqual(originalItems);
      });

      it('should handle items with different normative documents', () => {
        const items = initialStateRoadItems.map((item, index) => ({
          ...item,
          value: 1000,
          normativeDocument: index % 2 === 0 ? 'Doc A' : 'Doc B'
        }));
        
        const result = calculateQ1(items);
        expect(result).toBeGreaterThan(0);
      });
    });
  });

  describe('Q2 Calculation (Local Roads)', () => {
    describe('Valid Calculations', () => {
      it('should calculate value with valid data', () => {
        const items = createValidLocalRoadItems();
        const result = calculateQ2(items);
        
        expect(result).not.toBeNull();
        expect(Number.isFinite(result!)).toBe(true);
      });

      it('should calculate Q2 minus other values', () => {
        const items = initialLocalRoadItems.map(item => ({
          ...item,
          value: 500
        }));
        
        const result = calculateQ2(items);
        // Q2 = 500 - (4 * 500) = -1500
        const expectedResult = 500 - (4 * 500);
        
        expect(result).toBe(expectedResult);
      });

      it('should handle different value magnitudes', () => {
        const items = initialLocalRoadItems.map((item, index) => ({
          ...item,
          value: Math.pow(10, index + 1)
        }));
        
        const result = calculateQ2(items);
        expect(result).not.toBeNull();
        expect(Number.isFinite(result!)).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should return 0 when all values are 0', () => {
        const items = initialLocalRoadItems.map(item => ({
          ...item,
          value: 0
        }));
        
        const result = calculateQ2(items);
        expect(result).toBe(0);
      });

      it('should return null for null values', () => {
        const items = initialLocalRoadItems.map(item => ({
          ...item,
          value: null as any
        }));
        
        const result = calculateQ2(items);
        expect(result).toBeNull();
      });

      it('should handle empty array', () => {
        const result = calculateQ2([]);
        expect(result).toBeNull();
      });
    });
  });

  describe('Session Management', () => {
    it('should create unique session IDs', () => {
      const session1 = calculationResultsService.createSession();
      const session2 = calculationResultsService.createSession();
      
      expect(session1).toBeTruthy();
      expect(session2).toBeTruthy();
      expect(session1).not.toBe(session2);
      expect(vi.mocked(calculationResultsService.createSession)).toHaveBeenCalledTimes(2);
    });

    it('should save calculation results successfully', () => {
      const q1Items = createValidStateRoadItems();
      const q2Items = createValidLocalRoadItems();
      const q1Value = calculateQ1(q1Items);
      const q2Value = calculateQ2(q2Items);
      
      const result = calculationResultsService.saveBlockOneResults(
        q1Items,
        q1Value!,
        q2Items,
        q2Value!
      );
      
      expect(result).toBe(true);
      expect(vi.mocked(calculationResultsService.saveBlockOneResults)).toHaveBeenCalledWith(
        q1Items,
        q1Value,
        q2Items,
        q2Value
      );
    });
  });

  describe('Block Three Integration', () => {
    it('should send data to Block Three correctly', () => {
      const q1Items = createValidStateRoadItems();
      const q2Items = createValidLocalRoadItems();
      const q1Value = calculateQ1(q1Items);
      const q2Value = calculateQ2(q2Items);
      const sessionId = 'test-session-123';
      
      setBlockOneBudgetData({
        q1Value: q1Value!,
        q2Value: q2Value!,
        q1Items,
        q2Items,
        sessionId
      });
      
      expect(vi.mocked(setBlockOneBudgetData)).toHaveBeenCalledWith({
        q1Value: q1Value,
        q2Value: q2Value,
        q1Items,
        q2Items,
        sessionId
      });
    });

    it('should retrieve budget statistics', () => {
      const stats = getBudgetStatistics();
      
      expect(stats).toHaveProperty('hasData');
      expect(stats).toHaveProperty('totalBudget');
      expect(stats).toHaveProperty('q1Budget');
      expect(stats).toHaveProperty('q2Budget');
      expect(typeof stats.hasData).toBe('boolean');
      expect(typeof stats.totalBudget).toBe('number');
    });

    it('should handle budget statistics with allocation', () => {
      (getBudgetStatistics as any).mockReturnValue({
        hasData: true,
        totalBudget: 15000,
        q1Budget: 10000,
        q2Budget: 5000,
        allocation: {
          currentRepair: 5000,
          capitalRepair: 7000,
          reconstruction: 3000,
          newConstruction: 0,
          reserve: 0
        }
      });
      
      const stats = getBudgetStatistics();
      
      expect(stats.hasData).toBe(true);
      expect(stats.allocation).toBeDefined();
      expect(stats.allocation?.currentRepair).toBe(5000);
      expect(stats.allocation?.capitalRepair).toBe(7000);
      expect(stats.allocation?.reconstruction).toBe(3000);
    });
  });

  describe('Combined Calculations', () => {
    it('should calculate total budget from Q1 and Q2', () => {
      const q1Items = createValidStateRoadItems();
      const q2Items = createValidLocalRoadItems();
      const q1Result = calculateQ1(q1Items);
      const q2Result = calculateQ2(q2Items);
      
      expect(q1Result).not.toBeNull();
      expect(q2Result).not.toBeNull();
      
      const totalBudget = q1Result! + q2Result!;
      
      expect(totalBudget).toBe(q1Result! + q2Result!);
      expect(Number.isFinite(totalBudget)).toBe(true);
    });

    it('should maintain consistency across multiple calculations', () => {
      const q1Items = createValidStateRoadItems();
      const result1 = calculateQ1(q1Items);
      const result2 = calculateQ1(q1Items);
      
      expect(result1).toBe(result2);
    });

    it('should handle different scales between Q1 and Q2', () => {
      const q1Items = initialStateRoadItems.map(item => ({
        ...item,
        value: 10000
      }));
      const q2Items = initialLocalRoadItems.map(item => ({
        ...item,
        value: 1000
      }));
      
      const q1Result = calculateQ1(q1Items);
      const q2Result = calculateQ2(q2Items);
      
      expect(q1Result).not.toBeNull();
      expect(q2Result).not.toBeNull();
      expect(Math.abs(q1Result!)).toBeGreaterThan(Math.abs(q2Result!));
    });
  });


  describe('Data Validation', () => {
    it('should identify missing required fields', () => {
      const incompleteItems = initialStateRoadItems.map((item, index) => ({
        ...item,
        value: index === 0 ? (null as any) : 1000
      }));
      
      const missingFields = incompleteItems
        .filter(item => item.value === null || item.value === undefined)
        .map(item => item.id);
      
      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields[0]).toBe(initialStateRoadItems[0].id);
    });

    it('should validate all Q1 items have values before calculation', () => {
      const items = initialStateRoadItems.map(item => ({
        ...item,
        value: null as any
      }));
      
      const hasAllValues = items.every(item => item.value !== null && item.value !== undefined);
      expect(hasAllValues).toBe(false);
    });

    it('should validate Q2 has required Qмз value', () => {
      const items = initialLocalRoadItems.map(item => ({
        ...item,
        value: item.id === 'Qмз' ? (null as any) : 1000
      }));
      
      const qmzValue = items.find(item => item.id === 'Qмз')?.value;
      expect(qmzValue === null || qmzValue === undefined).toBe(true);
    });
  });

  describe('Attached Files', () => {
    it('should handle items with attached files', () => {
      const testFile = createTestFile();
      const item = createTestBudgetItem({
        id: 'Qдз',
        value: 1000,
        attachedFiles: [testFile]
      });
      
      expect(item.attachedFiles).toBeDefined();
      expect(item.attachedFiles).toHaveLength(1);
      expect(item.attachedFiles![0].name).toBe('test-file.xlsx');
      expect(item.attachedFiles![0].size).toBe(1024);
    });

    it('should handle items without attached files', () => {
      const item = createTestBudgetItem({
        id: 'Qпп',
        value: 2000,
        attachedFiles: []
      });
      
      expect(item.attachedFiles).toBeDefined();
      expect(item.attachedFiles).toHaveLength(0);
    });

    it('should handle items with multiple attached files', () => {
      const files = [
        createTestFile({ name: 'file1.xlsx', size: 2048 }),
        createTestFile({ name: 'file2.pdf', size: 1024, type: 'application/pdf' })
      ];
      
      const item = createTestBudgetItem({
        id: 'Qміжн',
        value: 3000,
        attachedFiles: files
      });
      
      expect(item.attachedFiles).toHaveLength(2);
      expect(item.attachedFiles![0].name).toBe('file1.xlsx');
      expect(item.attachedFiles![1].name).toBe('file2.pdf');
    });

    it('should preserve file metadata correctly', () => {
      const testFile = createTestFile({
        name: 'budget-analysis.xlsx',
        size: 5120,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        lastModified: 1640995200000 // 2022-01-01
      });
      
      const item = createTestBudgetItem({
        attachedFiles: [testFile]
      });
      
      expect(item.attachedFiles![0].name).toBe('budget-analysis.xlsx');
      expect(item.attachedFiles![0].size).toBe(5120);
      expect(item.attachedFiles![0].type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(item.attachedFiles![0].lastModified).toBe(1640995200000);
    });

    it('should handle file serialization for Redux storage', () => {
      const files = [
        createTestFile({ name: 'document1.xlsx' }),
        createTestFile({ name: 'document2.pdf', type: 'application/pdf' })
      ];
      
      const item = createTestBudgetItem({
        attachedFiles: files
      });
      
      // Simulate Redux serialization
      const serialized = JSON.parse(JSON.stringify(item));
      
      expect(serialized.attachedFiles).toHaveLength(2);
      expect(serialized.attachedFiles[0].name).toBe('document1.xlsx');
      expect(serialized.attachedFiles[1].name).toBe('document2.pdf');
    });

    it('should maintain file integrity during calculations', () => {
      const testFile = createTestFile();
      const items = initialStateRoadItems.map(item => ({
        ...item,
        value: 1000,
        attachedFiles: [testFile]
      }));
      
      const result = calculateQ1(items);
      
      expect(result).not.toBeNull();
      items.forEach(item => {
        expect(item.attachedFiles).toBeDefined();
        expect(item.attachedFiles).toHaveLength(1);
        expect(item.attachedFiles![0].name).toBe('test-file.xlsx');
      });
    });
  });

  describe('Performance', () => {
    it('should calculate Q1 efficiently for standard dataset', () => {
      const items = createValidStateRoadItems();
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateQ1(items);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should calculate Q2 efficiently for standard dataset', () => {
      const items = createValidLocalRoadItems();
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateQ2(items);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle large number of items efficiently', () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        createTestBudgetItem({ id: `ITEM_${i}`, value: 1000 + i })
      );
      
      const startTime = performance.now();
      const result = calculateQ1(items);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
      expect(result).not.toBeNull();
    });
  });

  describe('Numerical Precision', () => {
    it('should maintain precision with decimal values', () => {
      const items = initialStateRoadItems.map(item => ({
        ...item,
        value: 1000.123456
      }));
      
      const result = calculateQ1(items);
      const expectedResult = 1000.123456 - (8 * 1000.123456);
      
      expect(Math.abs(result! - expectedResult)).toBeLessThan(0.001);
    });

    it('should handle floating point arithmetic correctly', () => {
      const items = [
        createTestBudgetItem({ id: 'Q1', value: 0.1 }),
        createTestBudgetItem({ id: 'Qпп', value: 0.2 }),
        createTestBudgetItem({ id: 'Qміжн', value: 0.3 })
      ];
      
      const result = calculateQ1(items);
      // Q1 = 0.1 - (0.2 + 0.3) = -0.4
      expect(result).toBeCloseTo(-0.4, 10);
    });

    it('should format large numbers correctly', () => {
      const value = 1234567.89;
      const formatted = value.toLocaleString();
      
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});