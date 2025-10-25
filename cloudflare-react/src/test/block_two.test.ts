import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  calculateTotalFunding,
  calculateTrafficIntensityCoefficient,
  calculateEuropeanRoadCoefficient,
  calculateBorderCrossingCoefficient,
  calculateLightingCoefficient,
  calculateRepairCoefficient,
  calculateCriticalInfrastructureCoefficient,
  generateSampleRegionData,
  getRegionCoefficients,
  type RoadSection,
  type RegionRoads,
  type RegionCoefficients,
  type PriceIndexes
} from '../modules/block_two';


const createTestRoadSection = (overrides: Partial<RoadSection> = {}): RoadSection => ({
  category: 1,
  stateImportance: true,
  length: 100,
  trafficIntensity: 15000,
  hasEuropeanStatus: false,
  isBorderCrossing: false,
  hasLighting: false,
  recentlyRepaired: false,
  europeanIndexLength: 0,
  ...overrides
});

const createTestRegionData = (regionalName: string = 'Київська'): RegionRoads => 
  generateSampleRegionData(regionalName);

const createTestPriceIndexes = (inflationIndex: number = 1.1): PriceIndexes => ({ 
  inflationIndex 
});


const BASE_RATES = {
  STATE: 604.761,
  LOCAL: 360.544
} as const;

const INFLATION_INDEX = {
  STANDARD: 1.1,
  NO_INFLATION: 1.0,
  HIGH_INFLATION: 2.0
} as const;

const CATEGORIES = [1, 2, 3, 4, 5] as const;

const COEFFICIENT_RANGES = {
  TRAFFIC_INTENSITY: { MIN: 1.0, MAX: 3.9 },
  EUROPEAN_ROAD: { MIN: 1.0, MAX: 1.5 },
  BORDER_CROSSING: { MIN: 1.0, MAX: 1.5 },
  LIGHTING: { MIN: 1.0, MAX: 2.0 },
  REPAIR: { MIN: 0.5, MAX: 1.0 },
  CRITICAL_INFRASTRUCTURE: { MIN: 1.0, MAX: 1.15 }
} as const;

const EXPECTED_RATES = {
  STATE: {
    CATEGORY_1: 604.761 * 1.80 * 1.1, // 1197.42678
    CATEGORY_2: 604.761 * 1.00 * 1.1  // 665.2371
  },
  STATE_SERVICE_COEFFICIENT: 1.16
} as const;

describe('Block Two - Maintenance Calculations', () => {
  
  describe('State Road Maintenance Rates', () => {
    describe('Basic Calculations', () => {
      it('should calculate positive rates for all categories', () => {
        CATEGORIES.forEach(category => {
          const result = calculateStateRoadMaintenanceRate(
            category, 
            INFLATION_INDEX.STANDARD
          );
          
          expect(result).toBeGreaterThan(0);
          expect(Number.isFinite(result)).toBe(true);
        });
      });

      it('should apply correct category coefficients', () => {
        const cat1 = calculateStateRoadMaintenanceRate(
          1, 
          INFLATION_INDEX.STANDARD
        );
        const cat2 = calculateStateRoadMaintenanceRate(
          2, 
          INFLATION_INDEX.STANDARD
        );
        
        expect(cat1).toBeCloseTo(EXPECTED_RATES.STATE.CATEGORY_1, 1);
        expect(cat2).toBeCloseTo(EXPECTED_RATES.STATE.CATEGORY_2, 1);
        expect(cat1).toBeGreaterThan(cat2);
      });

      it('should maintain descending order by category', () => {
        const rates = CATEGORIES.map(cat => 
          calculateStateRoadMaintenanceRate(cat, INFLATION_INDEX.STANDARD)
        );
        
        for (let i = 0; i < rates.length - 1; i++) {
          expect(rates[i]).toBeGreaterThan(rates[i + 1]);
        }
      });
    });

    describe('Inflation Impact', () => {
      it('should return base rate with no inflation', () => {
        const result = calculateStateRoadMaintenanceRate(
          2, 
          INFLATION_INDEX.NO_INFLATION
        );
        
        expect(result).toBeCloseTo(BASE_RATES.STATE, 2);
      });

      it('should scale proportionally with inflation', () => {
        const baseResult = calculateStateRoadMaintenanceRate(
          2, 
          INFLATION_INDEX.NO_INFLATION
        );
        const inflatedResult = calculateStateRoadMaintenanceRate(
          2, 
          INFLATION_INDEX.HIGH_INFLATION
        );
        
        expect(inflatedResult / baseResult).toBeCloseTo(INFLATION_INDEX.HIGH_INFLATION, 2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero inflation', () => {
        const result = calculateStateRoadMaintenanceRate(2, 0);
        expect(result).toBe(0);
      });

      it('should handle very high inflation', () => {
        const result = calculateStateRoadMaintenanceRate(2, 100);
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThan(0);
      });

      it('should handle invalid category gracefully', () => {
        // Функція використовує значення за замовчуванням для невалідних категорій
        const result1 = calculateStateRoadMaintenanceRate(0 as any, INFLATION_INDEX.STANDARD);
        const result2 = calculateStateRoadMaintenanceRate(6 as any, INFLATION_INDEX.STANDARD);

        expect(Number.isFinite(result1)).toBe(true);
        expect(Number.isFinite(result2)).toBe(true);
        expect(result1).toBeGreaterThan(0);
        expect(result2).toBeGreaterThan(0);
      });
    });
  });

  describe('Local Road Maintenance Rates', () => {
    describe('Basic Calculations', () => {
      it('should calculate positive rates for all categories', () => {
        CATEGORIES.forEach(category => {
          const result = calculateLocalRoadMaintenanceRate(
            category, 
            INFLATION_INDEX.STANDARD
          );
          
          expect(result).toBeGreaterThan(0);
          expect(Number.isFinite(result)).toBe(true);
        });
      });

      it('should be lower than state road rates', () => {
        CATEGORIES.forEach(category => {
          const stateRate = calculateStateRoadMaintenanceRate(
            category, 
            INFLATION_INDEX.STANDARD
          );
          const localRate = calculateLocalRoadMaintenanceRate(
            category, 
            INFLATION_INDEX.STANDARD
          );
          
          expect(stateRate).toBeGreaterThan(localRate);
        });
      });

      it('should maintain descending order by category', () => {
        const rates = CATEGORIES.map(cat => 
          calculateLocalRoadMaintenanceRate(cat, INFLATION_INDEX.STANDARD)
        );
        
        for (let i = 0; i < rates.length - 1; i++) {
          expect(rates[i]).toBeGreaterThan(rates[i + 1]);
        }
      });
    });
  });

  describe('Traffic Coefficients', () => {
    let testSections: RoadSection[];

    beforeEach(() => {
      testSections = [createTestRoadSection()];
    });

    describe('Traffic Intensity Coefficient', () => {
      it('should calculate within valid range', () => {
        const result = calculateTrafficIntensityCoefficient(testSections, 100);
        
        expect(result).toBeGreaterThanOrEqual(COEFFICIENT_RANGES.TRAFFIC_INTENSITY.MIN);
        expect(result).toBeLessThanOrEqual(COEFFICIENT_RANGES.TRAFFIC_INTENSITY.MAX);
      });

      it('should return 1.0 for empty sections', () => {
        const result = calculateTrafficIntensityCoefficient([], 0);
        expect(result).toBe(1.0);
      });

      it('should return 1.0 for zero total length', () => {
        const result = calculateTrafficIntensityCoefficient(testSections, 0);
        expect(result).toBe(1.0);
      });

      it('should handle high traffic intensity', () => {
        testSections[0].trafficIntensity = 25000;
        const result = calculateTrafficIntensityCoefficient(testSections, 100);
        
        expect(result).toBeGreaterThan(1.0);
      });
    });

    describe('European Road Coefficient', () => {
      it('should return max coefficient for all European roads', () => {
        testSections[0].hasEuropeanStatus = true;
        const result = calculateEuropeanRoadCoefficient(testSections, 100);
        
        expect(result).toBeCloseTo(COEFFICIENT_RANGES.EUROPEAN_ROAD.MAX, 1);
      });

      it('should return 1.0 for no European roads', () => {
        testSections[0].hasEuropeanStatus = false;
        const result = calculateEuropeanRoadCoefficient(testSections, 100);
        
        expect(result).toBe(1.0);
      });

      it('should calculate proportionally for partial coverage', () => {
        const sections = [
          createTestRoadSection({ length: 50, hasEuropeanStatus: true }),
          createTestRoadSection({ length: 50, hasEuropeanStatus: false })
        ];
        
        const result = calculateEuropeanRoadCoefficient(sections, 100);
        const expectedCoeff = (1.5 * 50 + 50) / 100; // (1.5 * 50 + (100 - 50)) / 100 = 1.25
        
        expect(result).toBeCloseTo(expectedCoeff, 2);
      });
    });

    describe('Border Crossing Coefficient', () => {
      it('should return max coefficient for all border roads', () => {
        testSections[0].isBorderCrossing = true;
        const result = calculateBorderCrossingCoefficient(testSections, 100);
        
        expect(result).toBeCloseTo(COEFFICIENT_RANGES.BORDER_CROSSING.MAX, 1);
      });

      it('should return 1.0 for no border crossings', () => {
        testSections[0].isBorderCrossing = false;
        const result = calculateBorderCrossingCoefficient(testSections, 100);
        
        expect(result).toBe(1.0);
      });
    });

    describe('Lighting Coefficient', () => {
      it('should return max coefficient for fully lit roads', () => {
        testSections[0].hasLighting = true;
        const result = calculateLightingCoefficient(testSections, 100);
        
        expect(result).toBeCloseTo(COEFFICIENT_RANGES.LIGHTING.MAX, 1);
      });

      it('should return 1.0 for no lighting', () => {
        testSections[0].hasLighting = false;
        const result = calculateLightingCoefficient(testSections, 100);
        
        expect(result).toBe(1.0);
      });
    });

    describe('Repair Coefficient', () => {
      it('should return reduction for recently repaired roads', () => {
        testSections[0].recentlyRepaired = true;
        const result = calculateRepairCoefficient(testSections, 100);
        
        expect(result).toBeCloseTo(COEFFICIENT_RANGES.REPAIR.MIN, 1);
        expect(result).toBeLessThan(1.0);
      });

      it('should return 1.0 for no repairs', () => {
        testSections[0].recentlyRepaired = false;
        const result = calculateRepairCoefficient(testSections, 100);
        
        expect(result).toBe(1.0);
      });
    });

    describe('Critical Infrastructure Coefficient', () => {
      const testCases = [
        { count: 0, expectedMin: 1.0 },
        { count: 1, expectedMin: 1.0 },
        { count: 5, expectedMin: 1.0 },
        { count: 10, expectedMin: 1.0 }
      ];

      testCases.forEach(({ count, expectedMin }) => {
        it(`should calculate correctly for ${count} infrastructure objects`, () => {
          const result = calculateCriticalInfrastructureCoefficient(count);
          
          expect(result).toBeGreaterThanOrEqual(expectedMin);
          expect(result).toBeLessThanOrEqual(COEFFICIENT_RANGES.CRITICAL_INFRASTRUCTURE.MAX);
        });
      });

      it('should not exceed maximum even with many objects', () => {
        const result = calculateCriticalInfrastructureCoefficient(100);
        expect(result).toBeLessThanOrEqual(COEFFICIENT_RANGES.CRITICAL_INFRASTRUCTURE.MAX);
      });
    });
  });

  describe('Total Funding Calculation', () => {
    let regionData: RegionRoads;
    let regionCoeff: RegionCoefficients;
    let priceIndexes: PriceIndexes;

    beforeEach(() => {
      regionData = createTestRegionData();
      regionCoeff = getRegionCoefficients()[0];
      priceIndexes = createTestPriceIndexes();
    });

    describe('Basic Funding', () => {
      it('should calculate positive funding amounts', () => {
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.stateFunding).toBeGreaterThan(0);
        expect(result.localFunding).toBeGreaterThan(0);
        expect(result.totalFunding).toBeGreaterThan(0);
      });

      it('should sum state and local funding correctly', () => {
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.totalFunding).toBe(result.stateFunding + result.localFunding);
      });

      it('should provide complete breakdown details', () => {
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.details).toBeDefined();
        expect(result.details.stateRoadLength).toBeGreaterThan(0);
        expect(result.details.localRoadLength).toBeGreaterThan(0);
        expect(result.details.stateRoadBaseRate).toBeGreaterThan(0);
        expect(result.details.localRoadBaseRate).toBeGreaterThan(0);
        expect(result.details.appliedCoefficients).toBeDefined();
      });

      it('should apply state service coefficient', () => {
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.details.appliedCoefficients.stateServiceCoefficient)
          .toBe(EXPECTED_RATES.STATE_SERVICE_COEFFICIENT);
      });
    });

    describe('Regional Variations', () => {
      it('should handle regions with only state roads', () => {
        regionData.roadSections = regionData.roadSections.filter(s => s.stateImportance);
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.stateFunding).toBeGreaterThan(0);
        expect(result.localFunding).toBe(0);
      });

      it('should handle regions with only local roads', () => {
        regionData.roadSections = regionData.roadSections.filter(s => !s.stateImportance);
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.stateFunding).toBe(0);
        expect(result.localFunding).toBeGreaterThan(0);
      });

      it('should handle regions with no roads', () => {
        regionData.roadSections = [];
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        
        expect(result.stateFunding).toBe(0);
        expect(result.localFunding).toBe(0);
        expect(result.totalFunding).toBe(0);
      });
    });

    describe('Coefficient Application', () => {
      it('should apply all relevant coefficients', () => {
        const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
        const coeffs = result.details.appliedCoefficients;
        
        expect(coeffs.mountainous).toBeGreaterThanOrEqual(1.0);
        expect(coeffs.operatingConditions).toBeGreaterThanOrEqual(1.0);
        expect(coeffs.stateServiceCoefficient).toBe(1.16);
      });

      it('should increase funding with higher coefficients', () => {
        const normalCoeff: RegionCoefficients = {
          regionalName: 'Test',
          mountainous: 1.0,
          operatingConditions: 1.0,
          criticalInfrastructure: 1.0
        };
        const highCoeff: RegionCoefficients = {
          regionalName: 'Test',
          mountainous: 1.5,
          operatingConditions: 1.5,
          criticalInfrastructure: 1.0
        };
        
        const normalResult = calculateTotalFunding(regionData, normalCoeff, priceIndexes);
        const highResult = calculateTotalFunding(regionData, highCoeff, priceIndexes);
        
        expect(highResult.totalFunding).toBeGreaterThan(normalResult.totalFunding);
      });
    });

    describe('Inflation Impact', () => {
      it('should scale funding with inflation', () => {
        const noInflation = createTestPriceIndexes(1.0);
        const withInflation = createTestPriceIndexes(2.0);
        
        const normalResult = calculateTotalFunding(regionData, regionCoeff, noInflation);
        const inflatedResult = calculateTotalFunding(regionData, regionCoeff, withInflation);
        
        expect(inflatedResult.totalFunding).toBeGreaterThan(normalResult.totalFunding);
      });
    });
  });

  describe('Region Data', () => {
    describe('Sample Data Generation', () => {
      it('should generate valid regional structure', () => {
        const data = generateSampleRegionData('Київська');
        
        expect(data.regionalName).toBe('Київська');
        expect(Array.isArray(data.roadSections)).toBe(true);
        expect(data.roadSections.length).toBeGreaterThan(0);
        expect(data.criticalInfrastructureCount).toBeGreaterThanOrEqual(0);
      });

      it('should generate sections with valid properties', () => {
        const data = generateSampleRegionData('Львівська');
        
        data.roadSections.forEach(section => {
          expect(CATEGORIES).toContain(section.category);
          expect(section.length).toBeGreaterThan(0);
          expect(section.trafficIntensity).toBeGreaterThan(0);
          expect(typeof section.stateImportance).toBe('boolean');
          expect(typeof section.hasEuropeanStatus).toBe('boolean');
          expect(typeof section.isBorderCrossing).toBe('boolean');
          expect(typeof section.hasLighting).toBe('boolean');
          expect(typeof section.recentlyRepaired).toBe('boolean');
        });
      });

      it('should include both state and local roads', () => {
        const data = generateSampleRegionData('Одеська');
        
        const stateRoads = data.roadSections.filter(s => s.stateImportance);
        const localRoads = data.roadSections.filter(s => !s.stateImportance);
        
        expect(stateRoads.length).toBeGreaterThan(0);
        expect(localRoads.length).toBeGreaterThan(0);
      });
    });

    describe('Region Coefficients', () => {
      it('should have coefficients for all regions', () => {
        const regions = getRegionCoefficients();
        
        expect(regions.length).toBeGreaterThan(20);
      });

      it('should have valid coefficient values', () => {
        const regions = getRegionCoefficients();
        
        regions.forEach(region => {
          expect(region.regionalName).toBeTruthy();
          expect(region.mountainous).toBeGreaterThanOrEqual(1.0);
          expect(region.operatingConditions).toBeGreaterThanOrEqual(1.0);
          expect(region.mountainous).toBeLessThanOrEqual(2.0);
          expect(region.operatingConditions).toBeLessThanOrEqual(2.0);
        });
      });

      it('should have unique region names', () => {
        const regions = getRegionCoefficients();
        const names = regions.map(r => r.regionalName);
        const uniqueNames = new Set(names);
        
        expect(uniqueNames.size).toBe(names.length);
      });

      it('should include major regions', () => {
        const regions = getRegionCoefficients();
        const regionNames = regions.map(r => r.regionalName);
        
        const majorRegions = ['Київська', 'Львівська', 'Харківська', 'Одеська'];
        majorRegions.forEach(name => {
          expect(regionNames).toContain(name);
        });
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow for a region', () => {
      const regionData = generateSampleRegionData('Київська');
      const regionCoeff = getRegionCoefficients().find(r => r.regionalName === 'Київська')!;
      const priceIndexes = createTestPriceIndexes(1.25);
      
      expect(regionData).toBeDefined();
      expect(regionCoeff).toBeDefined();
      
      const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
      
      expect(result.totalFunding).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
    });

    it('should maintain consistency across multiple calculations', () => {
      const regionData = generateSampleRegionData('Харківська');
      const regionCoeff = getRegionCoefficients()[0];
      const priceIndexes = createTestPriceIndexes();
      
      const result1 = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
      const result2 = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
      
      expect(result1.totalFunding).toBe(result2.totalFunding);
      expect(result1.stateFunding).toBe(result2.stateFunding);
      expect(result1.localFunding).toBe(result2.localFunding);
    });
  });

  describe('European Index Length', () => {
    it('should handle road sections with European index length', () => {
      const section = createTestRoadSection({
        hasEuropeanStatus: true,
        europeanIndexLength: 50
      });
      
      expect(section.europeanIndexLength).toBe(50);
      expect(section.hasEuropeanStatus).toBe(true);
    });

    it('should handle road sections without European index length', () => {
      const section = createTestRoadSection({
        hasEuropeanStatus: false,
        europeanIndexLength: 0
      });
      
      expect(section.europeanIndexLength).toBe(0);
      expect(section.hasEuropeanStatus).toBe(false);
    });

    it('should maintain European index length during calculations', () => {
      const sections = [
        createTestRoadSection({ europeanIndexLength: 25, hasEuropeanStatus: true }),
        createTestRoadSection({ europeanIndexLength: 0, hasEuropeanStatus: false }),
        createTestRoadSection({ europeanIndexLength: 75, hasEuropeanStatus: true })
      ];
      
      const regionData: RegionRoads = {
        regionalName: 'Test Region',
        roadSections: sections,
        criticalInfrastructureCount: 5
      };
      
      const regionCoeff = getRegionCoefficients()[0];
      const priceIndexes = createTestPriceIndexes();
      
      const result = calculateTotalFunding(regionData, regionCoeff, priceIndexes);
      
      expect(result.totalFunding).toBeGreaterThan(0);
      expect(sections[0].europeanIndexLength).toBe(25);
      expect(sections[1].europeanIndexLength).toBe(0);
      expect(sections[2].europeanIndexLength).toBe(75);
    });

    it('should handle European index length in sample data generation', () => {
      const data = generateSampleRegionData('Київська');
      
      data.roadSections.forEach(section => {
        // europeanIndexLength может быть undefined в старых данных
        if (section.europeanIndexLength !== undefined) {
          expect(typeof section.europeanIndexLength).toBe('number');
          expect(section.europeanIndexLength).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should correlate European status with index length', () => {
      const sections = [
        createTestRoadSection({ hasEuropeanStatus: true, europeanIndexLength: 100 }),
        createTestRoadSection({ hasEuropeanStatus: false, europeanIndexLength: 0 }),
        createTestRoadSection({ hasEuropeanStatus: true, europeanIndexLength: 50 })
      ];
      
      sections.forEach(section => {
        if (section.hasEuropeanStatus) {
          expect(section.europeanIndexLength).toBeGreaterThan(0);
        } else {
          expect(section.europeanIndexLength).toBe(0);
        }
      });
    });

    it('should handle large European index lengths', () => {
      const section = createTestRoadSection({
        hasEuropeanStatus: true,
        europeanIndexLength: 1000
      });
      
      expect(section.europeanIndexLength).toBe(1000);
      expect(Number.isFinite(section.europeanIndexLength)).toBe(true);
    });

    it('should maintain data integrity with European index length', () => {
      const originalSection = createTestRoadSection({
        category: 2,
        length: 200,
        trafficIntensity: 10000,
        hasEuropeanStatus: true,
        europeanIndexLength: 150
      });
      
      // Simulate data processing
      const processedSection = { ...originalSection };
      
      expect(processedSection.europeanIndexLength).toBe(originalSection.europeanIndexLength);
      expect(processedSection.hasEuropeanStatus).toBe(originalSection.hasEuropeanStatus);
      expect(processedSection.category).toBe(originalSection.category);
      expect(processedSection.length).toBe(originalSection.length);
    });
  });

  describe('Performance', () => {
    it('should calculate rates efficiently for many iterations', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateStateRoadMaintenanceRate(2, INFLATION_INDEX.STANDARD);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', () => {
      const largeRegionData: RegionRoads = {
        regionalName: 'Test Large',
        roadSections: Array.from({ length: 500 }, (_, i) => 
          createTestRoadSection({
            category: ((i % 5) + 1) as 1|2|3|4|5,
            stateImportance: i % 2 === 0,
            length: 10 + i % 100,
            europeanIndexLength: i % 3 === 0 ? 10 + i % 50 : 0
          })
        ),
        criticalInfrastructureCount: 10
      };
      
      const regionCoeff = getRegionCoefficients()[0];
      const priceIndexes = createTestPriceIndexes();
      
      const startTime = performance.now();
      const result = calculateTotalFunding(largeRegionData, regionCoeff, priceIndexes);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(result.totalFunding).toBeGreaterThan(0);
    });
  });
});