// test-utilities.ts
// Вспомогательные утилиты для тестирования Block Three

import type { SimpleRoadSection, BlockOneBudgetData } from '../modules/block_three';

// ==================== TYPE GUARDS ====================

export const isValidBudgetData = (data: any): data is BlockOneBudgetData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.q1Value === 'number' &&
    typeof data.q2Value === 'number' &&
    Array.isArray(data.q1Items) &&
    Array.isArray(data.q2Items) &&
    typeof data.sessionId === 'string'
  );
};

export const isValidRoadSection = (section: any): section is SimpleRoadSection => {
  return (
    typeof section === 'object' &&
    section !== null &&
    typeof section.id === 'string' &&
    typeof section.name === 'string' &&
    typeof section.length === 'number' &&
    typeof section.category === 'number' &&
    (section.significance === 'state' || section.significance === 'local') &&
    typeof section.technicalCondition === 'object' &&
    typeof section.trafficIntensity === 'number'
  );
};

// ==================== TEST DATA GENERATORS ====================

export class TestDataGenerator {
  private static counter = 0;

  static resetCounter() {
    this.counter = 0;
  }

  static getNextId(): string {
    return `test-${Date.now()}-${this.counter++}`;
  }

  // Генерация секции дороги с реалистичными данными
  static generateRealisticSection(
    workTypeHint?: 'reconstruction' | 'capital_repair' | 'current_repair' | 'no_work_needed'
  ): SimpleRoadSection {
    const baseSection: SimpleRoadSection = {
      id: this.getNextId(),
      name: `Test Road ${this.counter}`,
      category: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
      length: Math.random() * 50 + 1,
      significance: Math.random() > 0.5 ? 'state' : 'local',
      technicalCondition: {
        intensityCoefficient: 1.2,
        strengthCoefficient: 1.0,
        evennessCoefficient: 1.0,
        rutCoefficient: 1.0,
        frictionCoefficient: 1.0
      },
      trafficIntensity: Math.floor(Math.random() * 20000) + 1000,
      estimatedCost: Math.floor(Math.random() * 5000000) + 100000
    };

    // Настройка коэффициентов в зависимости от желаемого типа работ
    if (workTypeHint === 'reconstruction') {
      baseSection.technicalCondition.intensityCoefficient = 0.5 + Math.random() * 0.4; // 0.5 - 0.9
    } else if (workTypeHint === 'capital_repair') {
      baseSection.technicalCondition.intensityCoefficient = 1.1 + Math.random() * 0.2;
      baseSection.technicalCondition.strengthCoefficient = 0.7 + Math.random() * 0.15; // 0.7 - 0.85
    } else if (workTypeHint === 'current_repair') {
      baseSection.technicalCondition.intensityCoefficient = 1.1 + Math.random() * 0.2;
      baseSection.technicalCondition.strengthCoefficient = 1.0 + Math.random() * 0.2;
      baseSection.technicalCondition.evennessCoefficient = 0.7 + Math.random() * 0.25; // 0.7 - 0.95
    } else if (workTypeHint === 'no_work_needed') {
      baseSection.technicalCondition.intensityCoefficient = 1.2 + Math.random() * 0.5;
      baseSection.technicalCondition.strengthCoefficient = 1.1 + Math.random() * 0.5;
      baseSection.technicalCondition.evennessCoefficient = 1.1 + Math.random() * 0.5;
      baseSection.technicalCondition.rutCoefficient = 1.1 + Math.random() * 0.5;
      baseSection.technicalCondition.frictionCoefficient = 1.1 + Math.random() * 0.5;
    }

    return baseSection;
  }

  // Генерация набора секций с разными типами работ
  static generateMixedSections(count: number): SimpleRoadSection[] {
    const workTypes: Array<'reconstruction' | 'capital_repair' | 'current_repair' | 'no_work_needed'> = 
      ['reconstruction', 'capital_repair', 'current_repair', 'no_work_needed'];
    
    return Array.from({ length: count }, (_, i) => 
      this.generateRealisticSection(workTypes[i % workTypes.length])
    );
  }
  
  // Генерация бюджетных данных
  static generateBudgetData(scale: 'small' | 'medium' | 'large' = 'medium'): BlockOneBudgetData {
    const scales = {
      small: { q1: 1000000, q2: 300000 },
      medium: { q1: 5000000, q2: 1500000 },
      large: { q1: 20000000, q2: 5000000 }
    };

    const { q1, q2 } = scales[scale];

    return {
      q1Value: q1,
      q2Value: q2,
      totalBudget: q1 + q2,
      q1Items: [],
      q2Items: [],
      sessionId: `session-${this.getNextId()}`,
      timestamp: new Date()
    };
  }

  // Генерация секции с экстремальными значениями
  static generateExtremeSection(type: 'minimal' | 'maximal'): SimpleRoadSection {
    if (type === 'minimal') {
      return {
        id: this.getNextId(),
        name: 'Minimal Section',
        category: 5,
        length: 0.1,
        significance: 'local',
        technicalCondition: {
          intensityCoefficient: 0.1,
          strengthCoefficient: 0.1,
          evennessCoefficient: 0.1,
          rutCoefficient: 0.1,
          frictionCoefficient: 0.1
        },
        trafficIntensity: 1,
        estimatedCost: 1000
      };
    } else {
      return {
        id: this.getNextId(),
        name: 'Maximal Section',
        category: 1,
        length: 1000,
        significance: 'state',
        technicalCondition: {
          intensityCoefficient: 10.0,
          strengthCoefficient: 10.0,
          evennessCoefficient: 10.0,
          rutCoefficient: 10.0,
          frictionCoefficient: 10.0
        },
        trafficIntensity: 100000,
        estimatedCost: 100000000
      };
    }
  }
}

// ==================== TEST ASSERTIONS ====================

export class TestAssertions {
  // Проверка, что планирование соблюдает бюджетные ограничения
  static assertBudgetConstraints(
    result: any,
    budgetData: BlockOneBudgetData
  ): void {
    const totalBudget = budgetData.q1Value + budgetData.q2Value;
    
    if (result.totalCost > totalBudget) {
      throw new Error(
        `Budget exceeded: planned ${result.totalCost} but budget is ${totalBudget}`
      );
    }
  }

  // Проверка распределения по типам работ
  static assertWorkTypeDistribution(result: any): void {
    const hasProjects = 
      result.reconstructionProjects.length > 0 ||
      result.capitalRepairProjects.length > 0 ||
      result.currentRepairProjects.length > 0;

    if (!hasProjects && result.totalCost > 0) {
      throw new Error('Total cost > 0 but no projects planned');
    }
  }

  // Проверка что все проекты имеют необходимые поля
  static assertProjectStructure(projects: any[]): void {
    projects.forEach((project, index) => {
      if (!project.sectionId) {
        throw new Error(`Project ${index} missing sectionId`);
      }
      if (typeof project.estimatedCost !== 'number') {
        throw new Error(`Project ${index} has invalid estimatedCost`);
      }
      if (project.estimatedCost < 0) {
        throw new Error(`Project ${index} has negative cost`);
      }
    });
  }

  // Проверка разделения государственного и местного бюджета
  static assertBudgetSeparation(
    result: any,
    sections: SimpleRoadSection[],
    q1Budget: number,
    q2Budget: number
  ): void {
    const allProjects = [
      ...result.reconstructionProjects,
      ...result.capitalRepairProjects,
      ...result.currentRepairProjects
    ];

    let stateCost = 0;
    let localCost = 0;

    allProjects.forEach(project => {
      const section = sections.find(s => s.id === project.sectionId);
      if (section) {
        if (section.significance === 'state') {
          stateCost += project.estimatedCost;
        } else {
          localCost += project.estimatedCost;
        }
      }
    });

    if (stateCost > q1Budget) {
      throw new Error(
        `State budget exceeded: ${stateCost} > ${q1Budget}`
      );
    }

    if (localCost > q2Budget) {
      throw new Error(
        `Local budget exceeded: ${localCost} > ${q2Budget}`
      );
    }
  }
}

// ==================== MOCK HELPERS ====================

export class MockHelpers {
  // Создание мока localStorage с расширенными возможностями
  static createLocalStorageMock() {
    let store: Record<string, string> = {};
    const listeners: Array<(key: string, value: string) => void> = [];

    return {
      getItem: (key: string) => store[key] || null,
      
      setItem: (key: string, value: string) => {
        store[key] = value;
        listeners.forEach(listener => listener(key, value));
      },
      
      removeItem: (key: string) => {
        delete store[key];
      },
      
      clear: () => {
        store = {};
      },
      
      get length() {
        return Object.keys(store).length;
      },
      
      key: (index: number) => Object.keys(store)[index] || null,
      
      // Дополнительные методы для тестирования
      getAllKeys: () => Object.keys(store),
      
      getAllData: () => ({ ...store }),
      
      addListener: (listener: (key: string, value: string) => void) => {
        listeners.push(listener);
      },
      
      removeAllListeners: () => {
        listeners.length = 0;
      }
    };
  }

  // Создание spy для отслеживания вызовов функций
  static createFunctionSpy<T extends (...args: any[]) => any>(
    original: T
  ): T & { calls: any[][]; callCount: number; reset: () => void } {
    const calls: any[][] = [];
    
    const spyFn = ((...args: any[]) => {
      calls.push(args);
      return original(...args);
    }) as any;

    spyFn.calls = calls;
    Object.defineProperty(spyFn, 'callCount', {
      get: () => calls.length
    });
    spyFn.reset = () => {
      calls.length = 0;
    };

    return spyFn;
  }
}

// ==================== SNAPSHOT HELPERS ====================

export class SnapshotHelpers {
  // Создание снапшота структуры объекта (без конкретных значений)
  static createStructureSnapshot(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.length > 0 ? [this.createStructureSnapshot(obj[0])] : [];
    }

    if (typeof obj === 'object') {
      const snapshot: any = {};
      for (const key in obj) {
        snapshot[key] = this.createStructureSnapshot(obj[key]);
      }
      return snapshot;
    }

    return typeof obj;
  }

  // Сравнение структур двух объектов
  static compareStructures(obj1: any, obj2: any): boolean {
    const snapshot1 = this.createStructureSnapshot(obj1);
    const snapshot2 = this.createStructureSnapshot(obj2);
    
    return JSON.stringify(snapshot1) === JSON.stringify(snapshot2);
  }

  // Создание снапшота с округленными числовыми значениями
  static createRoundedSnapshot(obj: any, precision: number = 2): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'number') {
      return Number(obj.toFixed(precision));
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.createRoundedSnapshot(item, precision));
    }

    if (typeof obj === 'object') {
      const snapshot: any = {};
      for (const key in obj) {
        snapshot[key] = this.createRoundedSnapshot(obj[key], precision);
      }
      return snapshot;
    }

    return obj;
  }
}

// ==================== PERFORMANCE HELPERS ====================

export class PerformanceHelpers {
  // Измерение времени выполнения функции
  static async measureExecutionTime<T>(
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    return { result, duration };
  }

  // Измерение использования памяти (если доступно)
  static measureMemoryUsage<T>(fn: () => T): { result: T; memoryDelta?: number } {
    let memoryBefore: number | undefined;
    let memoryAfter: number | undefined;

    if ((performance as any).memory) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    const result = fn();

    if ((performance as any).memory) {
      memoryAfter = (performance as any).memory.usedJSHeapSize;
    }

    return {
      result,
      memoryDelta: memoryBefore !== undefined && memoryAfter !== undefined
        ? memoryAfter - memoryBefore
        : undefined
    };
  }

  // Запуск benchmark теста
  static async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 100
  ): Promise<{ name: string; avgTime: number; minTime: number; maxTime: number }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      times.push(duration);
    }

    return {
      name,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }
}

// ==================== ERROR TESTING HELPERS ====================

export class ErrorTestHelpers {
  // Проверка что функция выбрасывает ошибку с определенным сообщением
  static expectErrorMessage(
    fn: () => void,
    expectedMessage: string | RegExp
  ): void {
    try {
      fn();
      throw new Error('Expected function to throw but it did not');
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;
        if (typeof expectedMessage === 'string') {
          if (!message.includes(expectedMessage)) {
            throw new Error(
              `Expected error message to include "${expectedMessage}" but got "${message}"`
            );
          }
        } else {
          if (!expectedMessage.test(message)) {
            throw new Error(
              `Expected error message to match ${expectedMessage} but got "${message}"`
            );
          }
        }
      }
    }
  }

  // Создание набора инвалидных данных для тестирования
  static getInvalidInputs(): any[] {
    return [
      null,
      undefined,
      NaN,
      Infinity,
      -Infinity,
      '',
      [],
      {},
      { invalid: 'data' },
      'not a number',
      true,
      false,
      () => {},
      Symbol('test')
    ];
  }
}

// ==================== SCENARIO BUILDERS ====================

export class ScenarioBuilder {
  private sections: SimpleRoadSection[] = [];
  private budgetData?: BlockOneBudgetData;

  withSections(count: number): this {
    this.sections = TestDataGenerator.generateMixedSections(count);
    return this;
  }

  withSpecificSection(section: SimpleRoadSection): this {
    this.sections.push(section);
    return this;
  }

  withBudget(scale: 'small' | 'medium' | 'large'): this {
    this.budgetData = TestDataGenerator.generateBudgetData(scale);
    return this;
  }

  withCustomBudget(q1Value: number, q2Value: number): this {
    this.budgetData = {
      q1Value,
      q2Value,
      totalBudget: q1Value + q2Value,
      q1Items: [],
      q2Items: [],
      sessionId: TestDataGenerator.getNextId(),
      timestamp: new Date()
    };
    return this;
  }

  build(): { sections: SimpleRoadSection[]; budgetData?: BlockOneBudgetData } {
    return {
      sections: [...this.sections],
      budgetData: this.budgetData
    };
  }
}

// ==================== EXPORTS ====================

export const TestUtils = {
  Generator: TestDataGenerator,
  Assertions: TestAssertions,
  Mocks: MockHelpers,
  Snapshots: SnapshotHelpers,
  Performance: PerformanceHelpers,
  Errors: ErrorTestHelpers,
  Scenario: ScenarioBuilder
};

// Готовые наборы тестовых данных
export const TestFixtures = {
  // Минимальный рабочий набор
  minimal: {
    sections: [TestDataGenerator.generateRealisticSection('no_work_needed')],
    budget: TestDataGenerator.generateBudgetData('small')
  },

  // Типичный сценарий
  typical: {
    sections: TestDataGenerator.generateMixedSections(10),
    budget: TestDataGenerator.generateBudgetData('medium')
  },

  // Большой набор данных
  large: {
    sections: TestDataGenerator.generateMixedSections(100),
    budget: TestDataGenerator.generateBudgetData('large')
  },

  // Критические случаи
  edge: {
    minimal: TestDataGenerator.generateExtremeSection('minimal'),
    maximal: TestDataGenerator.generateExtremeSection('maximal')
  }
};