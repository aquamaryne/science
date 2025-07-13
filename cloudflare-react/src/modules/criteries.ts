// src/modules/block_three_criteria.ts - КРИТЕРИИ БЕЗ ИНТЕРФЕЙСА

// ==================== КРИТЕРИЙ 1: ПРОТЯЖНОСТЬ В КИЛОМЕТРАХ ====================

export interface LengthAnalysis {
  totalNetworkLength: number;
  averageLength: number;
  maxLength: number;
  minLength: number;
  lengthDistribution: {
    short: { count: number; range: string; totalLength: number }; // < 10 км
    medium: { count: number; range: string; totalLength: number }; // 10-50 км
    long: { count: number; range: string; totalLength: number }; // > 50 км
  };
}

export function analyzeLengthDistribution(sections: any[]): LengthAnalysis {
  if (sections.length === 0) {
    return {
      totalNetworkLength: 0,
      averageLength: 0,
      maxLength: 0,
      minLength: 0,
      lengthDistribution: {
        short: { count: 0, range: '< 10 км', totalLength: 0 },
        medium: { count: 0, range: '10-50 км', totalLength: 0 },
        long: { count: 0, range: '> 50 км', totalLength: 0 }
      }
    };
  }

  const lengths = sections.map(s => s.length);
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  
  const shortSections = sections.filter(s => s.length < 10);
  const mediumSections = sections.filter(s => s.length >= 10 && s.length <= 50);
  const longSections = sections.filter(s => s.length > 50);

  return {
    totalNetworkLength: totalLength,
    averageLength: totalLength / sections.length,
    maxLength: Math.max(...lengths),
    minLength: Math.min(...lengths),
    lengthDistribution: {
      short: {
        count: shortSections.length,
        range: '< 10 км',
        totalLength: shortSections.reduce((sum, s) => sum + s.length, 0)
      },
      medium: {
        count: mediumSections.length,
        range: '10-50 км',
        totalLength: mediumSections.reduce((sum, s) => sum + s.length, 0)
      },
      long: {
        count: longSections.length,
        range: '> 50 км',
        totalLength: longSections.reduce((sum, s) => sum + s.length, 0)
      }
    }
  };
}

// ==================== КРИТЕРИЙ 2: КОЛИЧЕСТВО ДОРОГ ОДНОЙ КАТЕГОРИИ ====================

export interface RoadCategoryStats {
  category: 1 | 2 | 3 | 4 | 5;
  count: number;
  totalLength: number;
  averageLength: number;
  percentage: number;
  avgTrafficIntensity: number;
  maxIntensityForCategory: number;
  description: string;
}

export interface CategoryAnalysis {
  byCategory: RoadCategoryStats[];
  bySignificance: {
    state: { count: number; length: number; percentage: number };
    local: { count: number; length: number; percentage: number };
  };
  categoryDistribution: {
    mostCommon: { category: number; count: number };
    leastCommon: { category: number; count: number };
  };
}

export function analyzeCategoryDistribution(sections: any[]): CategoryAnalysis {
  const totalSections = sections.length;
  const totalLength = sections.reduce((sum, s) => sum + s.length, 0);
  
  const ROAD_CATEGORIES = {
    1: { name: 'I категорія', maxIntensity: 20000, description: 'Автомагістралі' },
    2: { name: 'II категорія', maxIntensity: 12000, description: 'Швидкісні дороги' },
    3: { name: 'III категорія', maxIntensity: 6000, description: 'Основні дороги' },
    4: { name: 'IV категорія', maxIntensity: 2000, description: 'Регіональні дороги' },
    5: { name: 'V категорія', maxIntensity: 500, description: 'Місцеві дороги' }
  };

  // Анализ по категориям
  const categoryStats: RoadCategoryStats[] = [];
  const categoryCounts: Record<number, number> = {};
  
  for (let cat = 1; cat <= 5; cat++) {
    const sectionsInCategory = sections.filter(s => s.category === cat);
    const categoryLength = sectionsInCategory.reduce((sum, s) => sum + s.length, 0);
    const avgTraffic = sectionsInCategory.length > 0 
      ? sectionsInCategory.reduce((sum, s) => sum + s.trafficIntensity, 0) / sectionsInCategory.length 
      : 0;

    categoryCounts[cat] = sectionsInCategory.length;

    categoryStats.push({
      category: cat as 1|2|3|4|5,
      count: sectionsInCategory.length,
      totalLength: categoryLength,
      averageLength: sectionsInCategory.length > 0 ? categoryLength / sectionsInCategory.length : 0,
      percentage: totalSections > 0 ? (sectionsInCategory.length / totalSections) * 100 : 0,
      avgTrafficIntensity: avgTraffic,
      maxIntensityForCategory: ROAD_CATEGORIES[cat as keyof typeof ROAD_CATEGORIES].maxIntensity,
      description: ROAD_CATEGORIES[cat as keyof typeof ROAD_CATEGORIES].description
    });
  }

  // Анализ по значению
  const stateSections = sections.filter(s => s.significance === 'state');
  const localSections = sections.filter(s => s.significance === 'local');
  const stateLength = stateSections.reduce((sum, s) => sum + s.length, 0);
  const localLength = localSections.reduce((sum, s) => sum + s.length, 0);

  // Определение самой распространенной и редкой категории
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => Number(b[1]) - Number(a[1]));
  const mostCommon = { category: Number(sortedCategories[0]?.[0] || 3), count: Number(sortedCategories[0]?.[1] || 0) };
  const leastCommon = { category: Number(sortedCategories[sortedCategories.length - 1]?.[0] || 5), count: Number(sortedCategories[sortedCategories.length - 1]?.[1] || 0) };

  return {
    byCategory: categoryStats,
    bySignificance: {
      state: { 
        count: stateSections.length, 
        length: stateLength, 
        percentage: totalLength > 0 ? (stateLength / totalLength) * 100 : 0 
      },
      local: { 
        count: localSections.length, 
        length: localLength, 
        percentage: totalLength > 0 ? (localLength / totalLength) * 100 : 0 
      }
    },
    categoryDistribution: {
      mostCommon,
      leastCommon
    }
  };
}

// ==================== КРИТЕРИЙ 3: ИНДИВИДУАЛЬНЫЕ ДАННЫЕ ====================

export interface IndividualRoadData {
  id: string;
  name: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  trafficIntensity: number;
  strengthModulus: number;
  roughnessProfile: number;
  roughnessBump: number;
  rutDepth: number;
  frictionCoeff: number;
  significance: 'state' | 'local';
  region?: string;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  hasLighting?: boolean;
  criticalInfrastructureCount?: number;
}

export function createEmptyRoadSection(): IndividualRoadData {
  return {
    id: `section_${Date.now()}`,
    name: '',
    length: 1.0,
    category: 3,
    trafficIntensity: 1000,
    strengthModulus: 300,
    roughnessProfile: 3.5,
    roughnessBump: 150,
    rutDepth: 25,
    frictionCoeff: 0.35,
    significance: 'local',
    region: 'Київська'
  };
}

export function validateRoadSection(section: IndividualRoadData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!section.name || section.name.trim() === '') {
    errors.push('Назва ділянки є обов\'язковою');
  }
  
  if (section.length <= 0) {
    errors.push('Протяжність має бути більше 0');
  }
  
  if (section.trafficIntensity < 0) {
    errors.push('Інтенсивність руху не може бути від\'ємною');
  }
  
  if (section.strengthModulus <= 0) {
    errors.push('Модуль пружності має бути більше 0');
  }
  
  if (section.frictionCoeff < 0 || section.frictionCoeff > 1) {
    errors.push('Коефіцієнт зчеплення має бути від 0 до 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== КРИТЕРИЙ 4: ОБЩИЕ КОЭФФИЦИЕНТЫ ====================

export interface TechnicalCoefficients {
  intensityCoeff: number;
  strengthCoeff: number;
  evennessCoeff: number;
  rutCoeff: number;
  frictionFactorCoeff: number;
}

export interface ComplianceStatus {
  categoryCompliant: boolean;
  strengthCompliant: boolean;
  evennessCompliant: boolean;
  rutCompliant: boolean;
  frictionCompliant: boolean;
  overallCompliant: boolean;
  complianceScore: number; // от 0 до 5
}

const ROAD_CATEGORIES = {
  1: { maxIntensity: 20000, minStrength: 1.0 },
  2: { maxIntensity: 12000, minStrength: 1.0 },
  3: { maxIntensity: 6000, minStrength: 0.95 },
  4: { maxIntensity: 2000, minStrength: 0.90 },
  5: { maxIntensity: 500, minStrength: 0.85 }
};

export function calculateTechnicalCoefficients(section: IndividualRoadData): TechnicalCoefficients {
  const category = ROAD_CATEGORIES[section.category];
  
  // Коэффициент интенсивности движения
  const intensityCoeff = Number((category.maxIntensity / Math.max(section.trafficIntensity, 1)).toFixed(3));
  
  // Коэффициент прочности дорожной одежды
  const requiredStrengthModulus = 300 + section.category * 50;
  const strengthCoeff = Number((section.strengthModulus / requiredStrengthModulus).toFixed(3));
  
  // Коэффициент ровности
  const maxAllowedRoughness = 2.7 + section.category * 0.4;
  const evennessCoeff = Number((maxAllowedRoughness / Math.max(section.roughnessProfile, 0.1)).toFixed(3));
  
  // Коэффициент колейности
  const maxAllowedRutDepth = 15 + section.category * 5;
  const rutCoeff = Number((maxAllowedRutDepth / Math.max(section.rutDepth, 1)).toFixed(3));
  
  // Коэффициент сцепления
  const frictionFactorCoeff = Number((section.frictionCoeff / 0.35).toFixed(3));

  return {
    intensityCoeff,
    strengthCoeff,
    evennessCoeff,
    rutCoeff,
    frictionFactorCoeff
  };
}

// ==================== КРИТЕРИЙ 5: ВОЗМОЖНОСТЬ ВВОДА КАТЕГОРИЙ ДОРОГ ====================

export interface RoadCategoryDefinition {
  category: 1 | 2 | 3 | 4 | 5;
  name: string;
  maxIntensity: number;
  minStrength: number;
  description: string;
  typicalUse: string[];
}

export const ROAD_CATEGORY_DEFINITIONS: RoadCategoryDefinition[] = [
  {
    category: 1,
    name: 'I категорія',
    maxIntensity: 20000,
    minStrength: 1.0,
    description: 'Автомагістралі',
    typicalUse: ['Міжміські швидкісні магістралі', 'Транспортні коридори', 'Обхідні дороги великих міст']
  },
  {
    category: 2,
    name: 'II категорія',
    maxIntensity: 12000,
    minStrength: 1.0,
    description: 'Швидкісні дороги',
    typicalUse: ['Швидкісні дороги', 'Основні міжміські з\'єднання', 'Підходи до великих міст']
  },
  {
    category: 3,
    name: 'III категорія',
    maxIntensity: 6000,
    minStrength: 0.95,
    description: 'Основні дороги',
    typicalUse: ['Основні дороги державного значення', 'Зв\'язки між обласними центрами', 'Дороги до кордонів']
  },
  {
    category: 4,
    name: 'IV категорія',
    maxIntensity: 2000,
    minStrength: 0.90,
    description: 'Регіональні дороги',
    typicalUse: ['Регіональні дороги', 'Зв\'язки з районними центрами', 'Дороги місцевого значення']
  },
  {
    category: 5,
    name: 'V категорія',
    maxIntensity: 500,
    minStrength: 0.85,
    description: 'Місцеві дороги',
    typicalUse: ['Місцеві дороги', 'Під\'їзди до населених пунктів', 'Внутрішньогосподарські дороги']
  }
];

export function getCategoryRequirements(category: 1 | 2 | 3 | 4 | 5): RoadCategoryDefinition {
  return ROAD_CATEGORY_DEFINITIONS.find(def => def.category === category) || ROAD_CATEGORY_DEFINITIONS[2];
}

export function suggestCategoryByIntensity(trafficIntensity: number): { recommendedCategory: number; reasoning: string } {
  for (const categoryDef of ROAD_CATEGORY_DEFINITIONS) {
    if (trafficIntensity <= categoryDef.maxIntensity) {
      return {
        recommendedCategory: categoryDef.category,
        reasoning: `При інтенсивності ${trafficIntensity} авт/добу рекомендується ${categoryDef.name} (макс. ${categoryDef.maxIntensity})`
      };
    }
  }
  
  return {
    recommendedCategory: 1,
    reasoning: `При інтенсивності ${trafficIntensity} авт/добу потрібна I категорія або реконструкція`
  };
}

// ==================== КРИТЕРИЙ 6: ЗАМЕНА НА КОЭФФИЦИЕНТЫ ====================

export function calculateComplianceStatus(
  section: IndividualRoadData, 
  coefficients: TechnicalCoefficients
): ComplianceStatus {
  const category = ROAD_CATEGORIES[section.category];
  
  const categoryCompliant = coefficients.intensityCoeff >= 1.0;
  const strengthCompliant = coefficients.strengthCoeff >= category.minStrength;
  const evennessCompliant = coefficients.evennessCoeff >= 1.0;
  const rutCompliant = coefficients.rutCoeff >= 1.0;
  const frictionCompliant = coefficients.frictionFactorCoeff >= 1.0;
  
  const compliantCount = [
    categoryCompliant,
    strengthCompliant,
    evennessCompliant,
    rutCompliant,
    frictionCompliant
  ].filter(Boolean).length;
  
  return {
    categoryCompliant,
    strengthCompliant,
    evennessCompliant,
    rutCompliant,
    frictionCompliant,
    overallCompliant: compliantCount === 5,
    complianceScore: compliantCount
  };
}

export function getComplianceColor(isCompliant: boolean): 'green' | 'red' | 'yellow' {
  return isCompliant ? 'green' : 'red';
}

export function getComplianceIcon(isCompliant: boolean): '✓' | '✗' {
  return isCompliant ? '✓' : '✗';
}

// ==================== КРИТЕРИЙ 7: ВИДЫ РЕМОНТА ====================

export type WorkType = 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';

export interface RepairRecommendation {
  workType: WorkType;
  workTypeDisplay: string;
  reasoning: string[];
  priority: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expectedDuration: number; // месяцы
}

const WORK_TYPE_DISPLAY = {
  'current_repair': 'Поточний ремонт',
  'capital_repair': 'Капітальний ремонт',
  'reconstruction': 'Реконструкція',
  'no_work_needed': 'Не потрібно'
};

export function determineRepairType(
  section: IndividualRoadData,
  coefficients: TechnicalCoefficients,
  compliance: ComplianceStatus
): RepairRecommendation {
  const reasoning: string[] = [];
  let workType: WorkType = 'no_work_needed';
  let priority = 999;
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let expectedDuration = 0;

  // Проверка на реконструкцию (п. 4.2.3.1)
  if (!compliance.categoryCompliant) {
    workType = 'reconstruction';
    reasoning.push('Перевищення проектної інтенсивності руху для даної категорії дороги');
    reasoning.push(`Фактична інтенсивність: ${section.trafficIntensity}, максимальна для категорії: ${ROAD_CATEGORIES[section.category].maxIntensity}`);
    priority = Math.floor(Math.random() * 10) + 1;
    urgency = 'high';
    expectedDuration = 18;
  }
  // Проверка на капитальный ремонт (п. 4.2.3.2)
  else if (!compliance.strengthCompliant) {
    workType = 'capital_repair';
    reasoning.push('Недостатня міцність дорожнього одягу');
    reasoning.push(`Коефіцієнт міцності: ${coefficients.strengthCoeff}, мінімум для категорії: ${ROAD_CATEGORIES[section.category].minStrength}`);
    priority = Math.floor(Math.random() * 20) + 10;
    urgency = 'medium';
    expectedDuration = 12;
  }
  // Проверка на текущий ремонт (п. 4.2.3.3-4.2.3.5)
  else if (!compliance.evennessCompliant || !compliance.rutCompliant || !compliance.frictionCompliant) {
    workType = 'current_repair';
    const issues = [];
    if (!compliance.evennessCompliant) {
      issues.push(`рівність (коеф. ${coefficients.evennessCoeff})`);
    }
    if (!compliance.rutCompliant) {
      issues.push(`колійність (коеф. ${coefficients.rutCoeff})`);
    }
    if (!compliance.frictionCompliant) {
      issues.push(`зчеплення (коеф. ${coefficients.frictionFactorCoeff})`);
    }
    reasoning.push(`Невідповідність нормативам за показниками: ${issues.join(', ')}`);
    priority = Math.floor(Math.random() * 30) + 20;
    urgency = 'medium';
    expectedDuration = 6;
  }
  else {
    workType = 'no_work_needed';
    reasoning.push('Всі показники відповідають нормативним вимогам');
    priority = 999;
    urgency = 'low';
    expectedDuration = 0;
  }

  // Корректировка приоритета для специальных дорог
  if (section.isDefenseRoad && workType !== 'no_work_needed') {
    priority = Math.max(1, priority - 10);
    urgency = urgency === 'low' ? 'medium' : urgency === 'medium' ? 'high' : 'critical';
    reasoning.push('Підвищений пріоритет через оборонне значення');
  }

  if (section.isInternationalRoad && workType !== 'no_work_needed') {
    priority = Math.max(1, priority - 5);
    reasoning.push('Підвищений пріоритет через міжнародне значення');
  }

  return {
    workType,
    workTypeDisplay: WORK_TYPE_DISPLAY[workType],
    reasoning,
    priority,
    urgency,
    expectedDuration
  };
}

// ==================== КРИТЕРИЙ 8: ДАННЫЕ О СТОИМОСТИ ====================

export interface CostStandards {
  reconstruction: Record<1|2|3|4|5, number>;
  capital_repair: Record<1|2|3|4|5, number>;
  current_repair: Record<1|2|3|4|5, number>;
}

export interface CostFactors {
  regional: Record<string, number>;
  special: {
    international: number;
    defense: number;
    lighting: number;
    borderCrossing: number;
    criticalInfrastructure: number;
  };
}

export const DEFAULT_COST_STANDARDS: CostStandards = {
  reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 },
  capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
  current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 }
};

export const DEFAULT_COST_FACTORS: CostFactors = {
  regional: {
    'Київська': 1.20,
    'Львівська': 1.10,
    'Харківська': 1.05,
    'Дніпропетровська': 1.08,
    'Одеська': 1.12,
    'Закарпатська': 1.15,
    'Івано-Франківська': 1.18,
    'Чернівецька': 1.12,
    'Житомирська': 1.08,
    'Вінницька': 1.06
  },
  special: {
    international: 1.15,
    defense: 1.10,
    lighting: 1.05,
    borderCrossing: 1.08,
    criticalInfrastructure: 1.02
  }
};

export function calculateEstimatedCost(
  section: IndividualRoadData,
  repairRecommendation: RepairRecommendation,
  costStandards: CostStandards = DEFAULT_COST_STANDARDS,
  costFactors: CostFactors = DEFAULT_COST_FACTORS
): number {
  if (repairRecommendation.workType === 'no_work_needed') {
    return 0;
  }

  const workType = repairRecommendation.workType;
  const baseRate = costStandards[workType][section.category];
  let totalCost = baseRate * section.length;

  // Применяем корректирующие коэффициенты
  if (section.isInternationalRoad) {
    totalCost *= costFactors.special.international;
  }
  
  if (section.isDefenseRoad) {
    totalCost *= costFactors.special.defense;
  }
  
  if (section.hasLighting) {
    totalCost *= costFactors.special.lighting;
  }
  
  if (section.criticalInfrastructureCount && section.criticalInfrastructureCount > 0) {
    totalCost *= Math.pow(costFactors.special.criticalInfrastructure, section.criticalInfrastructureCount);
  }
  
  if (section.region && costFactors.regional[section.region]) {
    totalCost *= costFactors.regional[section.region];
  }

  return Number(totalCost.toFixed(2));
}

export interface CostAnalysis {
  totalEstimatedCost: number;
  costByWorkType: Record<string, number>;
  costByCategory: Record<number, number>;
  costByRegion: Record<string, number>;
  averageCostPerKm: number;
  costDistribution: {
    min: number;
    max: number;
    median: number;
    standardDeviation: number;
  };
}

export function analyzeCosts(sections: (IndividualRoadData & { estimatedCost?: number })[]): CostAnalysis {
  const sectionsWithCost = sections.filter(s => s.estimatedCost && s.estimatedCost > 0);
  const costs = sectionsWithCost.map(s => s.estimatedCost!);
  
  const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
  const totalLength = sectionsWithCost.reduce((sum, s) => sum + s.length, 0);

  // Группировка по типам работ
  const costByWorkType: Record<string, number> = {};
  const costByCategory: Record<number, number> = {};
  const costByRegion: Record<string, number> = {};

  sectionsWithCost.forEach(section => {
    // По типам работ (нужно добавить поле workType в section)
    const workType = 'Не визначено'; // заглушка
    costByWorkType[workType] = (costByWorkType[workType] || 0) + section.estimatedCost!;
    
    // По категориям
    costByCategory[section.category] = (costByCategory[section.category] || 0) + section.estimatedCost!;
    
    // По регионам
    if (section.region) {
      costByRegion[section.region] = (costByRegion[section.region] || 0) + section.estimatedCost!;
    }
  });

  // Статистические показатели
  const sortedCosts = [...costs].sort((a, b) => a - b);
  const median = sortedCosts.length > 0 ? 
    sortedCosts.length % 2 === 0 ? 
      (sortedCosts[sortedCosts.length / 2 - 1] + sortedCosts[sortedCosts.length / 2]) / 2 :
      sortedCosts[Math.floor(sortedCosts.length / 2)] : 0;
  
  const mean = costs.length > 0 ? totalCost / costs.length : 0;
  const variance = costs.length > 0 ? 
    costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length : 0;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalEstimatedCost: totalCost,
    costByWorkType,
    costByCategory,
    costByRegion,
    averageCostPerKm: totalLength > 0 ? totalCost / totalLength : 0,
    costDistribution: {
      min: costs.length > 0 ? Math.min(...costs) : 0,
      max: costs.length > 0 ? Math.max(...costs) : 0,
      median,
      standardDeviation
    }
  };
}

// ==================== КРИТЕРИЙ 9: ИЗМЕНЕНИЕ ДАННЫХ ====================

export interface DataChangeLog {
  sectionId: string;
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  userId?: string;
  reason?: string;
}

export function createChangeLog(
  sectionId: string,
  field: string,
  oldValue: any,
  newValue: any,
  reason?: string
): DataChangeLog {
  return {
    sectionId,
    timestamp: new Date(),
    field,
    oldValue,
    newValue,
    reason
  };
}

export function validateDataChange(
  field: keyof IndividualRoadData,
  newValue: any,
  section: IndividualRoadData
): { isValid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = [];
  
  switch (field) {
    case 'length':
      if (newValue <= 0) {
        return { isValid: false, error: 'Протяжність має бути більше 0' };
      }
      if (newValue > 200) {
        warnings.push('Дуже велика протяжність ділянки');
      }
      break;
      
    case 'trafficIntensity':
      if (newValue < 0) {
        return { isValid: false, error: 'Інтенсивність руху не може бути від\'ємною' };
      }
      const maxIntensityForCategory = ROAD_CATEGORIES[section.category].maxIntensity;
      if (newValue > maxIntensityForCategory * 1.5) {
        warnings.push(`Інтенсивність значно перевищує норму для ${section.category} категорії`);
      }
      break;
      
    case 'strengthModulus':
      if (newValue <= 0) {
        return { isValid: false, error: 'Модуль пружності має бути більше 0' };
      }
      if (newValue > 1000) {
        warnings.push('Дуже високий модуль пружності');
      }
      break;
      
    case 'frictionCoeff':
      if (newValue < 0 || newValue > 1) {
        return { isValid: false, error: 'Коефіцієнт зчеплення має бути від 0 до 1' };
      }
      if (newValue < 0.3) {
        warnings.push('Дуже низький коефіцієнт зчеплення');
      }
      break;
      
    case 'category':
      if (![1, 2, 3, 4, 5].includes(newValue)) {
        return { isValid: false, error: 'Категорія має бути від 1 до 5' };
      }
      break;
  }
  
  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

// ==================== КРИТЕРИЙ 10: РАБОТА С EXCEL ====================

export interface ExcelImportResult {
  success: boolean;
  importedSections: IndividualRoadData[];
  errors: string[];
  warnings: string[];
  skippedRows: number[];
}

export interface ExcelExportOptions {
  includeCalculatedFields: boolean;
  includeCoefficients: boolean;
  includeCosts: boolean;
  includeSocioEconomic: boolean;
  format: 'detailed' | 'summary' | 'custom';
}

export function parseExcelRow(row: any[], rowIndex: number): { section: IndividualRoadData | null; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Проверяем обязательные поля
    if (!row[0]) {
      errors.push(`Рядок ${rowIndex}: відсутня назва ділянки`);
      return { section: null, errors };
    }
    
    const section: IndividualRoadData = {
      id: `imported_${Date.now()}_${rowIndex}`,
      name: String(row[0]).trim(),
      length: parseFloat(row[1]) || 1,
      category: (parseInt(row[2]) as 1|2|3|4|5) || 3,
      trafficIntensity: parseInt(row[3]) || 1000,
      strengthModulus: parseInt(row[4]) || 300,
      roughnessProfile: parseFloat(row[5]) || 3.5,
      roughnessBump: parseInt(row[6]) || 150,
      rutDepth: parseInt(row[7]) || 25,
      frictionCoeff: parseFloat(row[8]) || 0.35,
      significance: row[9] === 'державна' ? 'state' : 'local',
      region: row[10] || 'Київська',
      isDefenseRoad: row[11] === 'так' || row[11] === true,
      isInternationalRoad: row[12] === 'так' || row[12] === true,
      isEuropeanNetwork: row[13] === 'так' || row[13] === true,
      hasLighting: row[14] === 'так' || row[14] === true
    };
    
    // Валидация импортированных данных
    const validation = validateRoadSection(section);
    if (!validation.isValid) {
      errors.push(`Рядок ${rowIndex}: ${validation.errors.join(', ')}`);
    }
    
    return { section, errors };
    
  } catch (error) {
    errors.push(`Рядок ${rowIndex}: помилка парсингу - ${error}`);
    return { section: null, errors };
  }
}

export function generateExcelHeaders(options: ExcelExportOptions): string[] {
  const baseHeaders = [
    'Найменування',
    'Протяжність (км)',
    'Категорія',
    'Інтенсивність (авт/добу)',
    'Модуль пружності (МПа)',
    'Рівність (м/км)',
    'Рівність поштовхомір (см/км)',
    'Глибина колії (мм)',
    'Коеф. зчеплення',
    'Значення',
    'Регіон',
    'Оборонна',
    'Міжнародна',
    'Європейська',
    'Освітлення'
  ];
  
  if (options.includeCoefficients) {
    baseHeaders.push(
      'Коеф. інтенсивності',
      'Коеф. міцності',
      'Коеф. рівності',
      'Коеф. колійності',
      'Коеф. зчеплення розрах.',
      'Відповідність інтенсивності',
      'Відповідність міцності',
      'Відповідність рівності',
      'Відповідність колійності',
      'Відповідність зчеплення'
    );
  }
  
  if (options.includeCalculatedFields) {
    baseHeaders.push(
      'Вид робіт',
      'Обґрунтування',
      'Пріоритет',
      'Терміновість',
      'Очікувана тривалість (міс.)'
    );
  }
  
  if (options.includeCosts) {
    baseHeaders.push(
      'Базова вартість (млн грн)',
      'Регіональний коефіцієнт',
      'Спеціальні коефіцієнти',
      'Загальна вартість (млн грн)',
      'Вартість за км (млн грн/км)'
    );
  }
  
  if (options.includeSocioEconomic) {
    baseHeaders.push(
      'Економія на транспорті (тис. грн/рік)',
      'Економія часу (тис. грн/рік)',
      'Зниження аварійності (тис. грн/рік)',
      'Екологічні вигоди (тис. грн/рік)',
      'Загальні річні вигоди (тис. грн/рік)',
      'NPV (тис. грн)',
      'BCR',
      'Період окупності (років)'
    );
  }
  
  return baseHeaders;
}

// ==================== КРИТЕРИЙ 11: СОЦИАЛЬНО-ЭКОНОМИЧЕСКИЙ ЭФФЕКТ ====================

export interface SocioEconomicEffect {
  // Прямые выгоды
  vehicleOperatingCostSavings: number; // Экономия эксплуатационных расходов транспорта
  timeSavings: number; // Экономия времени пользователей
  accidentReduction: number; // Снижение аварийности
  environmentalBenefits: number; // Экологические выгоды
  
  // Дополнительные выгоды
  comfortImprovement: number; // Повышение комфорта езды
  reliabilityImprovement: number; // Повышение надежности сообщения
  economicDevelopment: number; // Стимулирование экономического развития
  
  // Итоговые показатели
  totalAnnualBenefits: number; // Общие годовые выгоды
  totalProjectBenefits: number; // Общие выгоды за период проекта
  
  // Финансовые показатели
  npv: number; // Чистая приведенная стоимость
  bcr: number; // Соотношение выгод к затратам
  eirr: number; // Экономическая внутренняя норма доходности
  paybackPeriod: number; // Период окупности
  
  // Детали расчета
  projectCost: number;
  discountRate: number;
  projectLife: number; // лет
  calculationDate: Date;
}

export interface SocioEconomicCalculationParams {
  projectCost: number;
  discountRate: number;
  projectLife: number;
  maintenanceCostRate: number; // процент от стоимости проекта
  trafficGrowthRate: number; // годовой рост трафика
  benefitInflationRate: number; // инфляция выгод
}

export const DEFAULT_SOCIO_ECONOMIC_PARAMS: SocioEconomicCalculationParams = {
  projectCost: 0,
  discountRate: 0.05,
  projectLife: 15,
  maintenanceCostRate: 0.03,
  trafficGrowthRate: 0.02,
  benefitInflationRate: 0.03
};

export function calculateSocioEconomicEffect(
  section: IndividualRoadData,
  repairRecommendation: RepairRecommendation,
  projectCost: number,
  params: SocioEconomicCalculationParams = DEFAULT_SOCIO_ECONOMIC_PARAMS
): SocioEconomicEffect {
  
  if (projectCost === 0 || repairRecommendation.workType === 'no_work_needed') {
    return createEmptySocioEconomicEffect(projectCost, params);
  }

  const annualTrafficVolume = section.trafficIntensity * 365 * section.length;
  
  // 1. Экономия эксплуатационных расходов транспорта
  const fuelSavingsRate = getFuelSavingsRate(repairRecommendation.workType);
  const maintenanceSavingsRate = getMaintenanceSavingsRate(repairRecommendation.workType);
  const vehicleOperatingCostSavings = annualTrafficVolume * (fuelSavingsRate + maintenanceSavingsRate);
  
  // 2. Экономия времени пользователей
  const speedImprovementFactor = getSpeedImprovementFactor(repairRecommendation.workType);
  const averageSpeed = getAverageSpeedByCategory(section.category);
  const timeValuePerHour = getTimeValuePerHour(section.significance);
  const timeSavings = (annualTrafficVolume / averageSpeed) * speedImprovementFactor * timeValuePerHour;
  
  // 3. Снижение аварийности
  const accidentRateReduction = getAccidentRateReduction(repairRecommendation.workType);
  const averageAccidentCost = getAverageAccidentCost();
  const baseAccidentRate = getBaseAccidentRate(section.category);
  const accidentReduction = annualTrafficVolume * (baseAccidentRate * accidentRateReduction) * averageAccidentCost;
  
  // 4. Экологические выгоды
  const emissionReductionRate = getEmissionReductionRate(repairRecommendation.workType);
  const carbonCostPerTon = getCarbonCostPerTon();
  const environmentalBenefits = annualTrafficVolume * emissionReductionRate * carbonCostPerTon;
  
  // 5. Дополнительные выгоды
  const comfortImprovement = calculateComfortImprovement(section, repairRecommendation, annualTrafficVolume);
  const reliabilityImprovement = calculateReliabilityImprovement(section, repairRecommendation, annualTrafficVolume);
  const economicDevelopment = calculateEconomicDevelopment(section, repairRecommendation, projectCost);
  
  // Общие годовые выгоды
  const totalAnnualBenefits = vehicleOperatingCostSavings + timeSavings + accidentReduction + 
                             environmentalBenefits + comfortImprovement + reliabilityImprovement + economicDevelopment;
  
  // Расчет NPV и других финансовых показателей
  const { npv, bcr, eirr, totalProjectBenefits } = calculateFinancialIndicators(
    totalAnnualBenefits, 
    projectCost, 
    params
  );
  
  const paybackPeriod = totalAnnualBenefits > 0 ? projectCost / totalAnnualBenefits : 999;
  
  return {
    vehicleOperatingCostSavings,
    timeSavings,
    accidentReduction,
    environmentalBenefits,
    comfortImprovement,
    reliabilityImprovement,
    economicDevelopment,
    totalAnnualBenefits,
    totalProjectBenefits,
    npv,
    bcr,
    eirr,
    paybackPeriod,
    projectCost,
    discountRate: params.discountRate,
    projectLife: params.projectLife,
    calculationDate: new Date()
  };
}

function createEmptySocioEconomicEffect(projectCost: number, params: SocioEconomicCalculationParams): SocioEconomicEffect {
  return {
    vehicleOperatingCostSavings: 0,
    timeSavings: 0,
    accidentReduction: 0,
    environmentalBenefits: 0,
    comfortImprovement: 0,
    reliabilityImprovement: 0,
    economicDevelopment: 0,
    totalAnnualBenefits: 0,
    totalProjectBenefits: 0,
    npv: -projectCost,
    bcr: 0,
    eirr: 0,
    paybackPeriod: 999,
    projectCost,
    discountRate: params.discountRate,
    projectLife: params.projectLife,
    calculationDate: new Date()
  };
}

// Вспомогательные функции для расчета социально-экономического эффекта

function getFuelSavingsRate(workType: WorkType): number {
  const rates = {
    'current_repair': 0.5,
    'capital_repair': 0.8,
    'reconstruction': 1.2,
    'no_work_needed': 0
  };
  return rates[workType] || 0;
}

function getMaintenanceSavingsRate(workType: WorkType): number {
  const rates = {
    'current_repair': 0.3,
    'capital_repair': 0.5,
    'reconstruction': 0.7,
    'no_work_needed': 0
  };
  return rates[workType] || 0;
}

function getSpeedImprovementFactor(workType: WorkType): number {
  const factors = {
    'current_repair': 0.05,
    'capital_repair': 0.10,
    'reconstruction': 0.20,
    'no_work_needed': 0
  };
  return factors[workType] || 0;
}

function getAverageSpeedByCategory(category: number): number {
  const speeds = { 1: 90, 2: 80, 3: 70, 4: 60, 5: 50 };
  return speeds[category as keyof typeof speeds] || 50;
}

function getTimeValuePerHour(significance: 'state' | 'local'): number {
  return significance === 'state' ? 60 : 40; // грн/час
}

function getAccidentRateReduction(workType: WorkType): number {
  const reductions = {
    'current_repair': 0.10,
    'capital_repair': 0.25,
    'reconstruction': 0.40,
    'no_work_needed': 0
  };
  return reductions[workType] || 0;
}

function getAverageAccidentCost(): number {
  return 750000; // грн за предотвращенную аварию
}

function getBaseAccidentRate(category: number): number {
  const rates = { 1: 0.5, 2: 0.6, 3: 0.8, 4: 1.0, 5: 1.2 };
  return (rates[category as keyof typeof rates] || 1.0) / 1000000; // аварий на авто-км
}

function getEmissionReductionRate(workType: WorkType): number {
  const rates = {
    'current_repair': 0.03,
    'capital_repair': 0.05,
    'reconstruction': 0.08,
    'no_work_needed': 0
  };
  return rates[workType] || 0;
}

function getCarbonCostPerTon(): number {
  return 1000; // грн/тонна CO2
}

function calculateComfortImprovement(
  _section: IndividualRoadData, 
  repairRecommendation: RepairRecommendation, 
  annualTrafficVolume: number
): number {
  const comfortFactor = repairRecommendation.workType === 'reconstruction' ? 0.15 : 
                       repairRecommendation.workType === 'capital_repair' ? 0.10 : 0.05;
  return annualTrafficVolume * comfortFactor * 0.5;
}

function calculateReliabilityImprovement(
  _section: IndividualRoadData, 
  repairRecommendation: RepairRecommendation, 
  annualTrafficVolume: number
): number {
  const reliabilityFactor = repairRecommendation.workType === 'reconstruction' ? 0.20 : 
                           repairRecommendation.workType === 'capital_repair' ? 0.15 : 0.08;
  return annualTrafficVolume * reliabilityFactor * 0.3;
}

function calculateEconomicDevelopment(
  section: IndividualRoadData, 
  repairRecommendation: RepairRecommendation, 
  projectCost: number
): number {
  const multiplier = section.significance === 'state' ? 0.15 : 0.08;
  const workTypeMultiplier = repairRecommendation.workType === 'reconstruction' ? 1.5 : 1.0;
  return projectCost * multiplier * workTypeMultiplier / 15; // распределено на срок проекта
}

function calculateFinancialIndicators(
  annualBenefits: number, 
  projectCost: number, 
  params: SocioEconomicCalculationParams
): { npv: number; bcr: number; eirr: number; totalProjectBenefits: number } {
  
  let totalDiscountedBenefits = 0;
  let totalDiscountedCosts = projectCost;
  
  // Расчет дисконтированных выгод и затрат
  for (let year = 1; year <= params.projectLife; year++) {
    const discountFactor = Math.pow(1 + params.discountRate, -year);
    
    // Выгоды с учетом роста трафика и инфляции
    const adjustedBenefits = annualBenefits * 
      Math.pow(1 + params.trafficGrowthRate, year - 1) *
      Math.pow(1 + params.benefitInflationRate, year - 1);
    
    totalDiscountedBenefits += adjustedBenefits * discountFactor;
    
    // Затраты на содержание
    const maintenanceCost = projectCost * params.maintenanceCostRate;
    totalDiscountedCosts += maintenanceCost * discountFactor;
  }
  
  const npv = totalDiscountedBenefits - totalDiscountedCosts;
  const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;
  
  // Упрощенный расчет EIRR методом итераций
  let eirr = params.discountRate;
  for (let rate = 0.01; rate <= 1.0; rate += 0.001) {
    let testNpv = -projectCost;
    for (let year = 1; year <= params.projectLife; year++) {
      const adjustedBenefits = annualBenefits * 
        Math.pow(1 + params.trafficGrowthRate, year - 1) *
        Math.pow(1 + params.benefitInflationRate, year - 1);
      const maintenanceCost = projectCost * params.maintenanceCostRate;
      testNpv += (adjustedBenefits - maintenanceCost) / Math.pow(1 + rate, year);
    }
    if (Math.abs(testNpv) < 1000) {
      eirr = rate;
      break;
    }
  }
  
  return {
    npv,
    bcr,
    eirr,
    totalProjectBenefits: totalDiscountedBenefits
  };
}

// ==================== АГРЕГИРОВАННЫЙ АНАЛИЗ ====================

export interface AggregatedSocioEconomicAnalysis {
  totalInvestment: number;
  totalAnnualBenefits: number;
  totalNPV: number;
  averageBCR: number;
  projectsWithPositiveNPV: number;
  projectsWithBCRAboveOne: number;
  benefitBreakdown: {
    vehicleOperatingCosts: number;
    timeSavings: number;
    accidentReduction: number;
    environmentalBenefits: number;
    additionalBenefits: number;
  };
  recommendations: string[];
}

export function calculateAggregatedSocioEconomicAnalysis(
  effects: SocioEconomicEffect[]
): AggregatedSocioEconomicAnalysis {
  
  const totalInvestment = effects.reduce((sum, effect) => sum + effect.projectCost, 0);
  const totalAnnualBenefits = effects.reduce((sum, effect) => sum + effect.totalAnnualBenefits, 0);
  const totalNPV = effects.reduce((sum, effect) => sum + effect.npv, 0);
  const averageBCR = effects.length > 0 ? effects.reduce((sum, effect) => sum + effect.bcr, 0) / effects.length : 0;
  
  const projectsWithPositiveNPV = effects.filter(effect => effect.npv > 0).length;
  const projectsWithBCRAboveOne = effects.filter(effect => effect.bcr > 1).length;
  
  const benefitBreakdown = {
    vehicleOperatingCosts: effects.reduce((sum, effect) => sum + effect.vehicleOperatingCostSavings, 0),
    timeSavings: effects.reduce((sum, effect) => sum + effect.timeSavings, 0),
    accidentReduction: effects.reduce((sum, effect) => sum + effect.accidentReduction, 0),
    environmentalBenefits: effects.reduce((sum, effect) => sum + effect.environmentalBenefits, 0),
    additionalBenefits: effects.reduce((sum, effect) => sum + effect.comfortImprovement + effect.reliabilityImprovement + effect.economicDevelopment, 0)
  };
  
  const recommendations: string[] = [];
  
  if (projectsWithPositiveNPV / effects.length > 0.7) {
    recommendations.push('Більшість проектів є економічно доцільними');
  } else if (projectsWithPositiveNPV / effects.length < 0.3) {
    recommendations.push('Необхідний перегляд критеріїв відбору проектів');
  }
  
  if (averageBCR > 2.0) {
    recommendations.push('Високий рівень економічної ефективності портфеля проектів');
  } else if (averageBCR < 1.0) {
    recommendations.push('Портфель проектів потребує оптимізації');
  }
  
  if (totalNPV > totalInvestment * 0.5) {
    recommendations.push('Інвестиції в дорожню інфраструктуру принесуть значний економічний ефект');
  }
  
  return {
    totalInvestment,
    totalAnnualBenefits,
    totalNPV,
    averageBCR,
    projectsWithPositiveNPV,
    projectsWithBCRAboveOne,
    benefitBreakdown,
    recommendations
  };
}

// ==================== ЭКСПОРТ ВСЕХ ФУНКЦИЙ ====================

export default {
  // Критерий 1: Протяженность
  analyzeLengthDistribution,
  
  // Критерий 2: Категории дорог
  analyzeCategoryDistribution,
  getCategoryRequirements,
  suggestCategoryByIntensity,
  
  // Критерий 3: Индивидуальные данные
  createEmptyRoadSection,
  validateRoadSection,
  
  // Критерий 4: Технические коэффициенты
  calculateTechnicalCoefficients,
  
  // Критерий 5: Категории дорог
  ROAD_CATEGORY_DEFINITIONS,
  
  // Критерий 6: Соответствие нормативам
  calculateComplianceStatus,
  getComplianceColor,
  getComplianceIcon,
  
  // Критерий 7: Виды ремонта
  determineRepairType,
  
  // Критерий 8: Стоимость
  calculateEstimatedCost,
  analyzeCosts,
  DEFAULT_COST_STANDARDS,
  DEFAULT_COST_FACTORS,
  
  // Критерий 9: Изменение данных
  createChangeLog,
  validateDataChange,
  
  // Критерий 10: Excel
  parseExcelRow,
  generateExcelHeaders,
  
  // Критерий 11: Социально-экономический эффект
  calculateSocioEconomicEffect,
  calculateAggregatedSocioEconomicAnalysis,
  DEFAULT_SOCIO_ECONOMIC_PARAMS
};