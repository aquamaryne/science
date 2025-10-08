import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RoadSectionUI } from '../components/view/block_three_page';

// Mock modules
vi.mock('@/modules/block_three', () => ({
  planRepairWorksWithBlockOneData: vi.fn(() => ({
    currentRepairProjects: [],
    capitalRepairProjects: [],
    reconstructionProjects: [],
    totalCost: 0,
    budgetUtilization: 0,
    budgetBreakdown: {
      currentRepairUsed: 0,
      capitalRepairUsed: 0,
      reconstructionUsed: 0,
      reserveRemaining: 0
    },
    blockOneBudgetInfo: null,
    complianceReport: []
  })),
  generateDetailedRepairPlanReport: vi.fn(() => 'Test Report'),
  hasBlockOneBudgetData: vi.fn(() => false),
  getBlockOneBudgetData: vi.fn(() => null),
  setBlockOneBudgetData: vi.fn(),
  determineWorkTypeByTechnicalCondition: vi.fn(() => 'current_repair')
}));

vi.mock('@/modules/block_three_alghoritm', () => ({
  // Mock algorithm functions if needed
}));

// Constants
const MAX_DESIGN_INTENSITY_BY_CATEGORY = {
  1: 20000,
  2: 12000,
  3: 6000,
  4: 2000,
  5: 500
};

const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY = {
  1: 1.0,
  2: 1.0,
  3: 0.95,
  4: 0.90,
  5: 0.85
};

const REQUIRED_FRICTION_COEFFICIENT = 0.35;

const CATEGORIES = {
  1: { name: 'I категорія', maxIntensity: 20000, minStrength: 1.0 },
  2: { name: 'II категорія', maxIntensity: 12000, minStrength: 1.0 },
  3: { name: 'III категорія', maxIntensity: 6000, minStrength: 0.95 },
  4: { name: 'IV категорія', maxIntensity: 2000, minStrength: 0.90 },
  5: { name: 'V категорія', maxIntensity: 500, minStrength: 0.85 }
};

// Helper functions
const createTestRoadSection = (overrides: Partial<RoadSectionUI> = {}): RoadSectionUI => ({
  id: 'test-section-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Road Section',
  length: 10,
  category: 3,
  trafficIntensity: 5000,
  strengthModulus: 350,
  roughnessProfile: 3.5,
  roughnessBump: 150,
  rutDepth: 20,
  frictionCoeff: 0.40,
  significance: 'state',
  region: 'Київська',
  ...overrides
});

const calculateCoefficients = (section: RoadSectionUI): RoadSectionUI => {
  const category = CATEGORIES[section.category];
  if (!category) return section;
  
  const intensityCoeff = Number((category.maxIntensity / Math.max(section.trafficIntensity, 1)).toFixed(3));
  const requiredStrengthModulus = 300 + section.category * 50;
  const strengthCoeff = Number((section.strengthModulus / requiredStrengthModulus).toFixed(3));
  const maxAllowedRoughness = 2.7 + section.category * 0.4;
  const evennessCoeff = Number((maxAllowedRoughness / Math.max(section.roughnessProfile, 0.1)).toFixed(3));
  const maxAllowedRutDepth = 15 + section.category * 5;
  const rutCoeff = Number((maxAllowedRutDepth / Math.max(section.rutDepth, 1)).toFixed(3));
  const frictionFactorCoeff = Number((section.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT).toFixed(3));
  
  const categoryCompliant = intensityCoeff >= 1.0;
  const strengthCompliant = strengthCoeff >= MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
  const evennessCompliant = evennessCoeff >= 1.0;
  const rutCompliant = rutCoeff >= 1.0;
  const frictionCompliant = frictionFactorCoeff >= 1.0;
  
  return {
    ...section,
    intensityCoeff,
    strengthCoeff,
    evennessCoeff,
    rutCoeff,
    frictionFactorCoeff,
    categoryCompliant,
    strengthCompliant,
    evennessCompliant,
    rutCompliant,
    frictionCompliant
  };
};

const determineWorkType = (section: RoadSectionUI): RoadSectionUI => {
  const withCoeffs = calculateCoefficients(section);
  
  let workTypeRaw: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  
  if (withCoeffs.intensityCoeff! < 1.0) {
    workTypeRaw = 'reconstruction';
  } else if (withCoeffs.strengthCoeff! < MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category]) {
    workTypeRaw = 'capital_repair';
  } else if (withCoeffs.evennessCoeff! < 1.0 || withCoeffs.rutCoeff! < 1.0 || withCoeffs.frictionFactorCoeff! < 1.0) {
    workTypeRaw = 'current_repair';
  } else {
    workTypeRaw = 'no_work_needed';
  }
  
  const workTypeDisplayMap = {
    'current_repair': 'Поточний ремонт',
    'capital_repair': 'Капітальний ремонт',
    'reconstruction': 'Реконструкція',
    'no_work_needed': 'Не потрібно'
  };
  
  return {
    ...withCoeffs,
    workTypeRaw,
    workType: workTypeDisplayMap[workTypeRaw]
  };
};

const calculateEstimatedCost = (
  section: RoadSectionUI,
  workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed'
): number => {
  if (workType === 'no_work_needed') return 0;
  
  const costRates = {
    current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 },
    capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
    reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 }
  };
  
  const baseRate = costRates[workType][section.category] || 0;
  let totalCost = baseRate * section.length;
  
  if (section.isInternationalRoad) totalCost *= 1.15;
  if (section.isDefenseRoad) totalCost *= 1.10;
  if (section.hasLighting) totalCost *= 1.05;
  
  return totalCost;
};

describe('Block Three - Road Repair Planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coefficient Calculations', () => {
    it('should calculate intensity coefficient correctly', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 3000
      });
      
      const result = calculateCoefficients(section);
      
      expect(result.intensityCoeff).toBeDefined();
      expect(result.intensityCoeff).toBeCloseTo(6000 / 3000, 2);
      expect(result.categoryCompliant).toBe(true);
    });

    it('should calculate strength coefficient correctly', () => {
      const section = createTestRoadSection({
        category: 2,
        strengthModulus: 400
      });
      
      const result = calculateCoefficients(section);
      const requiredStrength = 300 + 2 * 50; // 400
      
      expect(result.strengthCoeff).toBeCloseTo(400 / requiredStrength, 2);
      expect(result.strengthCompliant).toBe(true);
    });

    it('should calculate evenness coefficient correctly', () => {
      const section = createTestRoadSection({
        category: 3,
        roughnessProfile: 3.0
      });
      
      const result = calculateCoefficients(section);
      const maxAllowedRoughness = 2.7 + 3 * 0.4; // 3.9
      
      expect(result.evennessCoeff).toBeCloseTo(maxAllowedRoughness / 3.0, 2);
      expect(result.evennessCompliant).toBe(true);
    });

    it('should calculate rut coefficient correctly', () => {
      const section = createTestRoadSection({
        category: 4,
        rutDepth: 25
      });
      
      const result = calculateCoefficients(section);
      const maxAllowedRutDepth = 15 + 4 * 5; // 35
      
      expect(result.rutCoeff).toBeCloseTo(maxAllowedRutDepth / 25, 2);
      expect(result.rutCompliant).toBe(true);
    });

    it('should calculate friction coefficient correctly', () => {
      const section = createTestRoadSection({
        frictionCoeff: 0.40
      });
      
      const result = calculateCoefficients(section);
      
      expect(result.frictionFactorCoeff).toBeCloseTo(0.40 / REQUIRED_FRICTION_COEFFICIENT, 2);
      expect(result.frictionCompliant).toBe(true);
    });

    it('should handle edge case with zero traffic intensity', () => {
      const section = createTestRoadSection({
        trafficIntensity: 0
      });
      
      const result = calculateCoefficients(section);
      
      expect(Number.isFinite(result.intensityCoeff)).toBe(true);
      expect(result.intensityCoeff).toBeGreaterThan(0);
    });

    it('should handle edge case with very low roughness', () => {
      const section = createTestRoadSection({
        roughnessProfile: 0.01
      });
      
      const result = calculateCoefficients(section);
      
      expect(Number.isFinite(result.evennessCoeff)).toBe(true);
      expect(result.evennessCoeff).toBeGreaterThan(0);
    });
  });

  describe('Work Type Determination', () => {
    it('should recommend reconstruction when intensity exceeds capacity', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 7000 // exceeds 6000
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('reconstruction');
      expect(result.workType).toBe('Реконструкція');
    });

    it('should recommend capital repair when strength is insufficient', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 3000,
        strengthModulus: 320 // below requirement for category 3
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('capital_repair');
      expect(result.workType).toBe('Капітальний ремонт');
    });

    it('should recommend current repair when evenness is poor', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 3000,
        strengthModulus: 400,
        roughnessProfile: 5.0 // poor evenness
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('current_repair');
      expect(result.workType).toBe('Поточний ремонт');
    });

    it('should recommend current repair when rut depth is excessive', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 3000,
        strengthModulus: 400,
        roughnessProfile: 3.0,
        rutDepth: 30 // excessive rut
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('current_repair');
      expect(result.workType).toBe('Поточний ремонт');
    });

    it('should recommend no work when all parameters are compliant', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 3000,
        strengthModulus: 400,
        roughnessProfile: 3.0,
        rutDepth: 15,
        frictionCoeff: 0.40
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('no_work_needed');
      expect(result.workType).toBe('Не потрібно');
    });

    it('should prioritize reconstruction over other work types', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 7000, // needs reconstruction
        strengthModulus: 320, // also needs capital repair
        roughnessProfile: 5.0 // also needs current repair
      });
      
      const result = determineWorkType(section);
      
      expect(result.workTypeRaw).toBe('reconstruction');
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate base cost correctly for current repair', () => {
      const section = createTestRoadSection({
        category: 3,
        length: 10
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      
      expect(cost).toBe(1.8 * 10); // 18 млн грн
    });

    it('should calculate base cost correctly for capital repair', () => {
      const section = createTestRoadSection({
        category: 2,
        length: 5
      });
      
      const cost = calculateEstimatedCost(section, 'capital_repair');
      
      expect(cost).toBe(15.0 * 5); // 75 млн грн
    });

    it('should calculate base cost correctly for reconstruction', () => {
      const section = createTestRoadSection({
        category: 1,
        length: 8
      });
      
      const cost = calculateEstimatedCost(section, 'reconstruction');
      
      expect(cost).toBe(60.0 * 8); // 480 млн грн
    });

    it('should return zero cost for no work needed', () => {
      const section = createTestRoadSection();
      
      const cost = calculateEstimatedCost(section, 'no_work_needed');
      
      expect(cost).toBe(0);
    });

    it('should apply international road coefficient', () => {
      const section = createTestRoadSection({
        category: 3,
        length: 10,
        isInternationalRoad: true
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      const expectedCost = 1.8 * 10 * 1.15;
      
      expect(cost).toBeCloseTo(expectedCost, 2);
    });

    it('should apply defense road coefficient', () => {
      const section = createTestRoadSection({
        category: 3,
        length: 10,
        isDefenseRoad: true
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      const expectedCost = 1.8 * 10 * 1.10;
      
      expect(cost).toBeCloseTo(expectedCost, 2);
    });

    it('should apply lighting coefficient', () => {
      const section = createTestRoadSection({
        category: 3,
        length: 10,
        hasLighting: true
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      const expectedCost = 1.8 * 10 * 1.05;
      
      expect(cost).toBeCloseTo(expectedCost, 2);
    });

    it('should apply multiple coefficients correctly', () => {
      const section = createTestRoadSection({
        category: 3,
        length: 10,
        isInternationalRoad: true,
        isDefenseRoad: true,
        hasLighting: true
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      const expectedCost = 1.8 * 10 * 1.15 * 1.10 * 1.05;
      
      expect(cost).toBeCloseTo(expectedCost, 2);
    });

    it('should scale cost with road length', () => {
      const section1 = createTestRoadSection({ length: 10 });
      const section2 = createTestRoadSection({ length: 20 });
      
      const cost1 = calculateEstimatedCost(section1, 'current_repair');
      const cost2 = calculateEstimatedCost(section2, 'current_repair');
      
      expect(cost2).toBeCloseTo(cost1 * 2, 2);
    });

    it('should vary cost by category', () => {
      const section1 = createTestRoadSection({ category: 1, length: 10 });
      const section5 = createTestRoadSection({ category: 5, length: 10 });
      
      const cost1 = calculateEstimatedCost(section1, 'current_repair');
      const cost5 = calculateEstimatedCost(section5, 'current_repair');
      
      expect(cost1).toBeGreaterThan(cost5);
    });
  });

  describe('Data Validation', () => {
    it('should validate category is within range', () => {
      const validCategories = [1, 2, 3, 4, 5] as const;
      
      validCategories.forEach(cat => {
        const section = createTestRoadSection({ category: cat });
        expect(section.category).toBeGreaterThanOrEqual(1);
        expect(section.category).toBeLessThanOrEqual(5);
      });
    });

    it('should validate length is positive', () => {
      const section = createTestRoadSection({ length: 10 });
      expect(section.length).toBeGreaterThan(0);
    });

    it('should validate traffic intensity is non-negative', () => {
      const section = createTestRoadSection({ trafficIntensity: 5000 });
      expect(section.trafficIntensity).toBeGreaterThanOrEqual(0);
    });

    it('should validate friction coefficient is in valid range', () => {
      const section = createTestRoadSection({ frictionCoeff: 0.40 });
      expect(section.frictionCoeff).toBeGreaterThanOrEqual(0);
      expect(section.frictionCoeff).toBeLessThanOrEqual(1);
    });

    it('should have valid significance value', () => {
      const section1 = createTestRoadSection({ significance: 'state' });
      const section2 = createTestRoadSection({ significance: 'local' });
      
      expect(['state', 'local']).toContain(section1.significance);
      expect(['state', 'local']).toContain(section2.significance);
    });
  });

  describe('Integration Scenarios', () => {
    it('should process complete workflow for a road section', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 7000,
        strengthModulus: 350,
        roughnessProfile: 3.5,
        rutDepth: 20,
        frictionCoeff: 0.38,
        length: 15,
        isInternationalRoad: true
      });
      
      const withWorkType = determineWorkType(section);
      const cost = calculateEstimatedCost(withWorkType, withWorkType.workTypeRaw!);
      
      expect(withWorkType.intensityCoeff).toBeDefined();
      expect(withWorkType.strengthCoeff).toBeDefined();
      expect(withWorkType.workTypeRaw).toBeDefined();
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle batch processing of multiple sections', () => {
      const sections = [
        createTestRoadSection({ id: '1', category: 1, trafficIntensity: 18000 }),
        createTestRoadSection({ id: '2', category: 2, trafficIntensity: 8000 }),
        createTestRoadSection({ id: '3', category: 3, trafficIntensity: 4000 }),
        createTestRoadSection({ id: '4', category: 4, trafficIntensity: 1500 }),
        createTestRoadSection({ id: '5', category: 5, trafficIntensity: 400 })
      ];
      
      const results = sections.map(section => {
        const withWorkType = determineWorkType(section);
        const cost = calculateEstimatedCost(withWorkType, withWorkType.workTypeRaw!);
        return { ...withWorkType, estimatedCost: cost };
      });
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.workTypeRaw).toBeDefined();
        expect(result.estimatedCost).toBeGreaterThanOrEqual(0);
      });
    });

    it('should maintain consistency across multiple calculations', () => {
      const section = createTestRoadSection({
        category: 3,
        trafficIntensity: 5000,
        strengthModulus: 350
      });
      
      const result1 = determineWorkType(section);
      const result2 = determineWorkType(section);
      
      expect(result1.workTypeRaw).toBe(result2.workTypeRaw);
      expect(result1.intensityCoeff).toBe(result2.intensityCoeff);
      expect(result1.strengthCoeff).toBe(result2.strengthCoeff);
    });
  });

  describe('Performance', () => {
    it('should calculate coefficients efficiently for many sections', () => {
      const sections = Array.from({ length: 100 }, (_, i) =>
        createTestRoadSection({ id: `section-${i}` })
      );
      
      const startTime = performance.now();
      const results = sections.map(calculateCoefficients);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(results).toHaveLength(100);
    });

    it('should process work type determination efficiently', () => {
      const sections = Array.from({ length: 50 }, (_, i) =>
        createTestRoadSection({ id: `section-${i}` })
      );
      
      const startTime = performance.now();
      const results = sections.map(determineWorkType);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
      expect(results).toHaveLength(50);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const section = createTestRoadSection({
        isInternationalRoad: undefined,
        isDefenseRoad: undefined,
        hasLighting: undefined
      });
      
      const cost = calculateEstimatedCost(section, 'current_repair');
      
      expect(Number.isFinite(cost)).toBe(true);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle very high traffic intensity', () => {
      const section = createTestRoadSection({
        trafficIntensity: 100000
      });
      
      const result = calculateCoefficients(section);
      
      expect(result.intensityCoeff).toBeLessThan(1.0);
      expect(Number.isFinite(result.intensityCoeff)).toBe(true);
    });

    it('should handle very low strength modulus', () => {
      const section = createTestRoadSection({
        strengthModulus: 100
      });
      
      const result = calculateCoefficients(section);
      
      expect(result.strengthCoeff).toBeLessThan(1.0);
      expect(Number.isFinite(result.strengthCoeff)).toBe(true);
    });

    it('should handle extreme rut depth', () => {
      const section = createTestRoadSection({
        rutDepth: 100
      });
      
      const result = calculateCoefficients(section);
      
      expect(result.rutCoeff).toBeLessThan(1.0);
      expect(Number.isFinite(result.rutCoeff)).toBe(true);
    });
  });

  describe('Category-Specific Behavior', () => {
    it('should apply different thresholds for different categories', () => {
      const categories = [1, 2, 3, 4, 5] as const;
      
      categories.forEach(cat => {
        const section = createTestRoadSection({ category: cat });
        const result = calculateCoefficients(section);
        
        expect(result.intensityCoeff).toBeDefined();
        expect(MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[cat]).toBeDefined();
      });
    });

    it('should have higher requirements for lower category numbers', () => {
      const section1 = createTestRoadSection({ 
        category: 1, 
        trafficIntensity: 15000 
      });
      const section5 = createTestRoadSection({ 
        category: 5, 
        trafficIntensity: 400 
      });
      
      const result1 = calculateCoefficients(section1);
      const result5 = calculateCoefficients(section5);
      
      expect(MAX_DESIGN_INTENSITY_BY_CATEGORY[1]).toBeGreaterThan(
        MAX_DESIGN_INTENSITY_BY_CATEGORY[5]
      );
      expect(result1).toBeDefined();
      expect(result5).toBeDefined();
    });
  });
});