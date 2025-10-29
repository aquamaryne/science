// src/test/block_two.test.ts
import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  calculateTrafficIntensityCoefficient,
  calculateEuropeanRoadCoefficient,
  calculateBorderCrossingCoefficient,
  calculateLightingCoefficient,
  calculateRepairCoefficient,
  calculateCriticalInfrastructureCoefficient,
  calculateStateRoadMaintenanceFunding,
  calculateLocalRoadMaintenanceFunding,
  calculateTotalFunding,
  getRegionCoefficients,
  generateSampleRegionData,
  type RoadSection,
  type RegionCoefficients,
  type RegionRoads,
  type PriceIndexes,
  MAINTENANCE_CONSTANTS,
} from '../modules/block_two';

describe('Road Maintenance Calculations - Section III', () => {
  const INFLATION_INDEX = 1.0; // Без інфляції для спрощення тестів

  describe('3.2 - State Road Maintenance Rate (H_j^о)', () => {
    it('повинен правильно розраховувати норматив для II категорії', () => {
      const rate = calculateStateRoadMaintenanceRate(2, INFLATION_INDEX);
      expect(rate).toBeCloseTo(604.761, 2);
    });

    it('повинен застосовувати коефіцієнт для I категорії (1.80)', () => {
      const rate = calculateStateRoadMaintenanceRate(1, INFLATION_INDEX);
      expect(rate).toBeCloseTo(604.761 * 1.80, 2);
    });

    it('повинен застосовувати коефіцієнт для V категорії (0.39)', () => {
      const rate = calculateStateRoadMaintenanceRate(5, INFLATION_INDEX);
      expect(rate).toBeCloseTo(604.761 * 0.39, 2);
    });

    it('повинен враховувати індекс інфляції', () => {
      const inflationIndex = 1.5;
      const rate = calculateStateRoadMaintenanceRate(2, inflationIndex);
      expect(rate).toBeCloseTo(604.761 * 1.5, 2);
    });
  });

  describe('3.3 - Local Road Maintenance Rate (H_j^м)', () => {
    it('повинен правильно розраховувати норматив для II категорії', () => {
      const rate = calculateLocalRoadMaintenanceRate(2, INFLATION_INDEX);
      expect(rate).toBeCloseTo(360.544, 2);
    });

    it('повинен застосовувати коефіцієнт для I категорії (1.71)', () => {
      const rate = calculateLocalRoadMaintenanceRate(1, INFLATION_INDEX);
      expect(rate).toBeCloseTo(360.544 * 1.71, 2);
    });

    it('повинен застосовувати коефіцієнт для V категорії (0.40)', () => {
      const rate = calculateLocalRoadMaintenanceRate(5, INFLATION_INDEX);
      expect(rate).toBeCloseTo(360.544 * 0.40, 2);
    });
  });

  describe('3.5 - Traffic Intensity Coefficient (K_інт.д^i)', () => {
    it('повинен повертати 1.0 для доріг без високої інтенсивності', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateTrafficIntensityCoefficient(sections, 100);
      expect(coefficient).toBe(1.0);
    });

    it('повинен застосовувати коефіцієнт 2.3 для 15000-20000 авт./добу', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 16000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateTrafficIntensityCoefficient(sections, 100);
      // Формула: (2.3 * 100 + (100 - 100)) / 100 = 2.3
      expect(coefficient).toBeCloseTo(2.3, 2);
    });

    it('повинен застосовувати коефіцієнт 3.5 для 20001-30000 авт./добу', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 25000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateTrafficIntensityCoefficient(sections, 100);
      expect(coefficient).toBeCloseTo(3.5, 2);
    });

    it('повинен застосовувати коефіцієнт 3.9 для >30000 авт./добу', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 35000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateTrafficIntensityCoefficient(sections, 100);
      expect(coefficient).toBeCloseTo(3.9, 2);
    });

    it('повинен правильно розраховувати для змішаних ділянок', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 50,
          trafficIntensity: 16000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
        {
          category: 2,
          stateImportance: true,
          length: 50,
          trafficIntensity: 5000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateTrafficIntensityCoefficient(sections, 100);
      // Формула: (2.3 * 50 + (100 - 50)) / 100 = (115 + 50) / 100 = 1.65
      expect(coefficient).toBeCloseTo(1.65, 2);
    });
  });

  describe('3.5 - European Road Coefficient (K_e.д^i)', () => {
    it('повинен повертати 1.0 для доріг без європейського статусу', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateEuropeanRoadCoefficient(sections, 100);
      expect(coefficient).toBe(1.0);
    });

    it('повинен застосовувати коефіцієнт 1.5 для європейських доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: true,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateEuropeanRoadCoefficient(sections, 100);
      // Формула: (1.5 * 100 + (100 - 100)) / 100 = 1.5
      expect(coefficient).toBeCloseTo(1.5, 2);
    });

    it('повинен правильно розраховувати для частково європейських доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 60,
          trafficIntensity: 10000,
          hasEuropeanStatus: true,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
        {
          category: 2,
          stateImportance: true,
          length: 40,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateEuropeanRoadCoefficient(sections, 100);
      // Формула: (1.5 * 60 + (100 - 60)) / 100 = (90 + 40) / 100 = 1.3
      expect(coefficient).toBeCloseTo(1.3, 2);
    });
  });

  describe('3.5 - Border Crossing Coefficient (K_мпп.д^i)', () => {
    it('повинен повертати 1.0 для доріг без прикордонних пунктів', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateBorderCrossingCoefficient(sections, 100);
      expect(coefficient).toBe(1.0);
    });

    it('повинен застосовувати коефіцієнт 1.5 для прикордонних доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: true,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateBorderCrossingCoefficient(sections, 100);
      expect(coefficient).toBeCloseTo(1.5, 2);
    });
  });

  describe('3.5 - Lighting Coefficient (K_осв^i)', () => {
    it('повинен повертати 1.0 для доріг без освітлення', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateLightingCoefficient(sections, 100);
      expect(coefficient).toBe(1.0);
    });

    it('повинен застосовувати коефіцієнт 2.0 для доріг з освітленням', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: true,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateLightingCoefficient(sections, 100);
      expect(coefficient).toBeCloseTo(2.0, 2);
    });

    it('повинен правильно розраховувати для частково освітлених доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 30,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: true,
          recentlyRepaired: false,
        },
        {
          category: 2,
          stateImportance: true,
          length: 70,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateLightingCoefficient(sections, 100);
      // Формула: (2.0 * 30 + (100 - 30)) / 100 = (60 + 70) / 100 = 1.3
      expect(coefficient).toBeCloseTo(1.3, 2);
    });
  });

  describe('3.5 - Repair Coefficient (K_рем^i)', () => {
    it('повинен повертати 1.0 для доріг без нещодавнього ремонту', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateRepairCoefficient(sections, 100);
      expect(coefficient).toBe(1.0);
    });

    it('повинен застосовувати коефіцієнт 0.5 для відремонтованих доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 100,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: true,
        },
      ];
      const coefficient = calculateRepairCoefficient(sections, 100);
      expect(coefficient).toBeCloseTo(0.5, 2);
    });

    it('повинен правильно розраховувати для частково відремонтованих доріг', () => {
      const sections: RoadSection[] = [
        {
          category: 2,
          stateImportance: true,
          length: 40,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: true,
        },
        {
          category: 2,
          stateImportance: true,
          length: 60,
          trafficIntensity: 10000,
          hasEuropeanStatus: false,
          isBorderCrossing: false,
          hasLighting: false,
          recentlyRepaired: false,
        },
      ];
      const coefficient = calculateRepairCoefficient(sections, 100);
      // Формула: (0.5 * 40 + (100 - 40)) / 100 = (20 + 60) / 100 = 0.8
      expect(coefficient).toBeCloseTo(0.8, 2);
    });
  });

  describe('3.5 - Critical Infrastructure Coefficient (K_кр.і^i)', () => {
    it('повинен повертати 1.00 для 0 об\'єктів', () => {
      const coefficient = calculateCriticalInfrastructureCoefficient(0);
      expect(coefficient).toBe(1.0);
    });

    it('повинен повертати 1.01 для 1-4 об\'єктів', () => {
      expect(calculateCriticalInfrastructureCoefficient(1)).toBe(1.01);
      expect(calculateCriticalInfrastructureCoefficient(2)).toBe(1.01);
      expect(calculateCriticalInfrastructureCoefficient(4)).toBe(1.01);
    });

    it('повинен повертати 1.03 для 5-9 об\'єктів', () => {
      expect(calculateCriticalInfrastructureCoefficient(5)).toBe(1.03);
      expect(calculateCriticalInfrastructureCoefficient(7)).toBe(1.03);
      expect(calculateCriticalInfrastructureCoefficient(9)).toBe(1.03);
    });

    it('повинен повертати 1.05 для 10+ об\'єктів', () => {
      expect(calculateCriticalInfrastructureCoefficient(10)).toBe(1.05);
      expect(calculateCriticalInfrastructureCoefficient(11)).toBe(1.05);
      expect(calculateCriticalInfrastructureCoefficient(20)).toBe(1.05);
    });
  });

  describe('3.5 - State Road Maintenance Funding (Q_i^о)', () => {
    // ... попередні тести ...
  
    it('повинен застосовувати правило вибору максимального коефіцієнта', () => {
      // Тест 1: Дорога з traffic=2.3 і european=1.5 одночасно
      const region1: RegionRoads = {
        regionalName: 'Тест максимального вибору',
        roadSections: [
          {
            category: 2,
            stateImportance: true,
            length: 100,
            trafficIntensity: 16000,     // C_інт = 2.3
            hasEuropeanStatus: true,     // C_e = 1.5
            isBorderCrossing: false,     // C_мпп = 1.0
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };
  
      const coeffs: RegionCoefficients = {
        regionalName: 'Тест',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };
  
      const funding1 = calculateStateRoadMaintenanceFunding(region1, coeffs, INFLATION_INDEX);
  
      // Очікується максимальний коефіцієнт 2.3 (а не обидва: 2.3 * 1.5)
      const expected1 = 604.761 * 100 * 1.16 * 1.0 * 1.0 * 2.3 * 1.0 * 1.0 * 1.0 * 1.0 * 1.0;
      expect(funding1).toBeCloseTo(expected1, 0);
    });
  
    it('повинен застосовувати всі незалежні коефіцієнти', () => {
      // Тест 2: Освітлення і ремонт застосовуються незалежно від traffic/euro/border
      const region2: RegionRoads = {
        regionalName: 'Тест незалежних коефіцієнтів',
        roadSections: [
          {
            category: 2,
            stateImportance: true,
            length: 100,
            trafficIntensity: 16000,     // C_інт = 2.3
            hasEuropeanStatus: false,    
            isBorderCrossing: false,     
            hasLighting: true,           // K_осв = 2.0 (застосовується завжди)
            recentlyRepaired: true,      // K_рем = 0.5 (застосовується завжди)
          },
        ],
        criticalInfrastructureCount: 6, // K_кр = 1.03 (застосовується завжди)
      };
  
      const coeffs: RegionCoefficients = {
        regionalName: 'Тест',
        mountainous: 1.15,
        operatingConditions: 1.15,
      };
  
      const funding2 = calculateStateRoadMaintenanceFunding(region2, coeffs, INFLATION_INDEX);
  
      // Освітлення, ремонт і крит.інфраструктура застосовуються незалежно
      const expected2 = 604.761 * 100 * 1.16 * 1.15 * 1.15 * 2.3 * 1.0 * 1.0 * 2.0 * 0.5 * 1.03;
      expect(funding2).toBeCloseTo(expected2, 0);
    });
  
    it('повинен обирати border crossing (1.5) якщо він максимальний', () => {
      const region3: RegionRoads = {
        regionalName: 'Тест прикордонної дороги',
        roadSections: [
          {
            category: 2,
            stateImportance: true,
            length: 100,
            trafficIntensity: 10000,     // низька інтенсивність
            hasEuropeanStatus: false,    
            isBorderCrossing: true,      // C_мпп = 1.5 (максимальний)
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };
  
      const coeffs: RegionCoefficients = {
        regionalName: 'Тест',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };
  
      const funding3 = calculateStateRoadMaintenanceFunding(region3, coeffs, INFLATION_INDEX);
  
      // Прикордонний коефіцієнт 1.5 застосовується
      const expected3 = 604.761 * 100 * 1.16 * 1.0 * 1.0 * 1.0 * 1.5 * 1.0 * 1.0 * 1.0 * 1.0;
      expect(funding3).toBeCloseTo(expected3, 0);
    });
  
    it('повинен правильно розраховувати для змішаних ділянок', () => {
      // Складний реальний випадок
      const region4: RegionRoads = {
        regionalName: 'Реальний регіон',
        roadSections: [
          // Ділянка 1: висока інтенсивність (обирається 3.5)
          {
            category: 2,
            stateImportance: true,
            length: 50,
            trafficIntensity: 25000,     // C_інт = 3.5 (максимальний)
            hasEuropeanStatus: true,     // C_e = 1.5 (ігнорується)
            isBorderCrossing: false,
            hasLighting: true,           // K_осв = 2.0
            recentlyRepaired: false,
          },
          // Ділянка 2: європейська без високої інтенсивності (обирається 1.5)
          {
            category: 3,
            stateImportance: true,
            length: 80,
            trafficIntensity: 8000,      // низька
            hasEuropeanStatus: true,     // C_e = 1.5 (застосовується)
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: true,      // K_рем = 0.5
          },
          // Ділянка 3: звичайна дорога
          {
            category: 4,
            stateImportance: true,
            length: 70,
            trafficIntensity: 5000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 3,
      };
  
      const coeffs: RegionCoefficients = {
        regionalName: 'Реальний регіон',
        mountainous: 1.10,
        operatingConditions: 1.10,
      };
  
      const funding4 = calculateStateRoadMaintenanceFunding(region4, coeffs, INFLATION_INDEX);
  
      // Розрахунок базового фінансування
      const base1 = 604.761 * 50;  // кат. 2
      const base2 = 604.761 * 0.89 * 80;  // кат. 3
      const base3 = 604.761 * 0.61 * 70;  // кат. 4
      const baseFunding = base1 + base2 + base3;
  
  
      // K_інт: ділянка 1 має 3.5, решта 1.0
      // (3.5 * 50 + 1.0 * 150) / 200 = (175 + 150) / 200 = 1.625
      const K_int = 1.625;
  
      // K_e: ділянка 2 має 1.5 (ділянка 1 використала traffic), решта 1.0
      // (1.5 * 80 + 1.0 * 120) / 200 = (120 + 120) / 200 = 1.2
      const K_e = 1.2;
  
      // K_осв: тільки ділянка 1
      // (2.0 * 50 + 1.0 * 150) / 200 = (100 + 150) / 200 = 1.25
      const K_light = 1.25;
  
      // K_рем: тільки ділянка 2
      // (0.5 * 80 + 1.0 * 120) / 200 = (40 + 120) / 200 = 0.8
      const K_repair = 0.8;
  
      const expected4 = baseFunding * 1.16 * 1.10 * 1.10 * K_int * K_e * 1.0 * K_light * K_repair * 1.01;
  
      expect(funding4).toBeCloseTo(expected4, 0);
    });
  
    it('повинен повертати 0 для регіону без державних доріг', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: false, // місцева дорога
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };
  
      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };
  
      const funding = calculateStateRoadMaintenanceFunding(
        region,
        regionCoefficients,
        INFLATION_INDEX
      );
  
      expect(funding).toBe(0);
    });
  });

  describe('3.6 - Local Road Maintenance Funding (Q_i^м)', () => {
    it('повинен правильно розраховувати базове фінансування', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: false,
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };

      const funding = calculateLocalRoadMaintenanceFunding(
        region,
        regionCoefficients,
        INFLATION_INDEX
      );

      // Базовий розрахунок: 360.544 * 100 * 1.0 * 1.0 * 1.0
      const expected = 360.544 * 100;
      expect(funding).toBeCloseTo(expected, 2);
    });

    it('НЕ повинен застосовувати коефіцієнт K_д = 1.16', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: false,
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };

      const funding = calculateLocalRoadMaintenanceFunding(
        region,
        regionCoefficients,
        INFLATION_INDEX
      );

      // Перевіряємо, що K_д НЕ застосовано
      expect(funding / (360.544 * 100)).toBeCloseTo(1.0, 2);
    });

    it('повинен застосовувати тільки базові коефіцієнти з формули п.3.6', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: false,
            length: 100,
            trafficIntensity: 16000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.15,
        operatingConditions: 1.15,
      };

      const funding = calculateLocalRoadMaintenanceFunding(
        region,
        regionCoefficients,
        INFLATION_INDEX
      );

      // Очікувана формула (спрощена): 360.544 * 100 * 1.15 * 1.15 * 2.3
      const expected = 360.544 * 100 * 1.15 * 1.15 * 2.3;
      expect(funding).toBeCloseTo(expected, 0);
    });

    it('повинен повертати 0 для регіону без місцевих доріг', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: true, // державна дорога
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };

      const funding = calculateLocalRoadMaintenanceFunding(
        region,
        regionCoefficients,
        INFLATION_INDEX
      );

      expect(funding).toBe(0);
    });
  });

  describe('3.7 - Total Funding (Q)', () => {
    it('повинен правильно розраховувати загальне фінансування', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: true,
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
          {
            category: 2,
            stateImportance: false,
            length: 100,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 0,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.0,
        operatingConditions: 1.0,
      };

      const priceIndexes: PriceIndexes = {
        inflationIndex: INFLATION_INDEX,
      };

      const result = calculateTotalFunding(region, regionCoefficients, priceIndexes);

      // Державні: 604.761 * 100 * 1.16 = 70152.28
      // Місцеві: 360.544 * 100 = 36054.4
      const expectedState = 604.761 * 100 * 1.16;
      const expectedLocal = 360.544 * 100;

      expect(result.stateFunding).toBeCloseTo(expectedState, 0);
      expect(result.localFunding).toBeCloseTo(expectedLocal, 0);
      expect(result.totalFunding).toBeCloseTo(expectedState + expectedLocal, 0);
    });

    it('повинен повертати правильні деталі розрахунку', () => {
      const region: RegionRoads = {
        regionalName: 'Тестова область',
        roadSections: [
          {
            category: 2,
            stateImportance: true,
            length: 150,
            trafficIntensity: 10000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
          {
            category: 3,
            stateImportance: false,
            length: 200,
            trafficIntensity: 5000,
            hasEuropeanStatus: false,
            isBorderCrossing: false,
            hasLighting: false,
            recentlyRepaired: false,
          },
        ],
        criticalInfrastructureCount: 3,
      };

      const regionCoefficients: RegionCoefficients = {
        regionalName: 'Тестова область',
        mountainous: 1.15,
        operatingConditions: 1.15,
      };

      const priceIndexes: PriceIndexes = {
        inflationIndex: 1.2,
      };

      const result = calculateTotalFunding(region, regionCoefficients, priceIndexes);

      expect(result.details.stateRoadLength).toBe(150);
      expect(result.details.localRoadLength).toBe(200);
      expect(result.details.stateRoadBaseRate).toBeCloseTo(604.761 * 1.2, 2);
      expect(result.details.localRoadBaseRate).toBeCloseTo(360.544 * 1.2, 2);
      expect(result.details.appliedCoefficients.mountainous).toBe(1.15);
      expect(result.details.appliedCoefficients.operatingConditions).toBe(1.15);
      expect(result.details.appliedCoefficients.stateServiceCoefficient).toBe(1.16);
      expect(result.details.appliedCoefficients.criticalInfrastructure).toBe(1.01);
    });
  });

  describe('Допоміжні функції', () => {
    it('getRegionCoefficients повинен повертати 27 регіонів', () => {
      const coefficients = getRegionCoefficients();
      expect(coefficients.length).toBe(27);
    });

    it('getRegionCoefficients повинен містити правильні значення для Івано-Франківської', () => {
      const coefficients = getRegionCoefficients();
      const ivanFrankivsk = coefficients.find(c => c.regionalName === 'Івано-Франківська');
      
      expect(ivanFrankivsk).toBeDefined();
      expect(ivanFrankivsk?.mountainous).toBe(1.13);
      expect(ivanFrankivsk?.operatingConditions).toBe(1.13);
    });

    it('generateSampleRegionData повинен створювати валідні дані', () => {
      const sampleData = generateSampleRegionData('Тестова область');
      
      expect(sampleData.regionalName).toBe('Тестова область');
      expect(sampleData.roadSections.length).toBeGreaterThan(0);
      expect(sampleData.criticalInfrastructureCount).toBeGreaterThanOrEqual(0);
    });

    it('MAINTENANCE_CONSTANTS повинні містити правильні базові значення', () => {
      expect(MAINTENANCE_CONSTANTS.STATE_ROAD_BASE_COST).toBe(604.761);
      expect(MAINTENANCE_CONSTANTS.LOCAL_ROAD_BASE_COST).toBe(360.544);
      expect(MAINTENANCE_CONSTANTS.STATE_SERVICE_COEFFICIENT).toBe(1.16);
      expect(MAINTENANCE_CONSTANTS.EUROPEAN_ROAD_COEFFICIENT).toBe(1.5);
      expect(MAINTENANCE_CONSTANTS.BORDER_CROSSING_COEFFICIENT).toBe(1.5);
      expect(MAINTENANCE_CONSTANTS.LIGHTING_COEFFICIENT).toBe(2.0);
      expect(MAINTENANCE_CONSTANTS.REPAIR_COEFFICIENT).toBe(0.5);
    });
  });
});