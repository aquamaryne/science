// src/modules/block_three_algorithm.ts - АЛГОРИТМИЧЕСКИЙ МОДУЛЬ

/**
 * ПОВНА РЕАЛІЗАЦІЯ ВСІХ АЛГОРИТМІВ РОЗДІЛУ IV
 * Детальні алгоритми для інтеграції з основним модулем block_three.ts
 */

// ==================== ЕКСПОРТ ТИПІВ ====================

// Детальні технічні характеристики дороги
export interface DetailedTechnicalCondition {
  // 4.2.2.1 - Коефіцієнт інтенсивності руху
  intensityCoefficient: number;
  maxDesignIntensity: number;
  actualIntensity: number;
  
  // 4.2.2.2 - Коефіцієнт міцності дорожнього одягу
  strengthCoefficient: number;
  isRigidPavement: boolean;
  actualElasticModulus?: number;
  requiredElasticModulus?: number;
  
  // 4.2.2.3 - Коефіцієнт рівності
  evennessCoefficient: number;
  iriIndex?: number;
  bumpIndex?: number;
  maxAllowedEvenness: number;
  
  // 4.2.2.4 - Коефіцієнт колійності
  rutCoefficient: number;
  actualRutDepth: number;
  maxAllowedRutDepth: number;
  
  // 4.2.2.5 - Коефіцієнт зчеплення
  frictionCoefficient: number;
  actualFrictionValue: number;
  requiredFrictionValue: number;
}

// Повна оцінка секції дороги
export interface ComprehensiveRoadAssessment {
  sectionId: string;
  currentInspections: boolean;
  targetedInspections: boolean;
  seasonalInspections: boolean;
  specialSurveys: boolean;
  diagnostics: boolean;
  
  technicalState: {
    intensityCoefficient: number;
    strengthCoefficient: number;
    evennessCoefficient: number;
    rutCoefficient: number;
    frictionCoefficient: number;
  };
  
  comparisonResults: {
    intensityCompliant: boolean;
    strengthCompliant: boolean;
    evennessCompliant: boolean;
    rutCompliant: boolean;
    frictionCompliant: boolean;
  };
  
  recommendedWorkType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  estimatedCost: number;
  costBenefitAnalysis?: {
    enpv: number;
    eirr: number;
    bcr: number;
    vehicleFleetReduction: number;
    transportCostSavings: number;
    accidentReduction: number;
    environmentalBenefits: number;
    totalBenefits: number;
    totalCosts: number;
    discountRate: number;
    paybackPeriod: number;
  };
  priority: number;
  rankingCriteria: string;
}

// Експертна оцінка
export interface ExpertAssessment {
  operationalStateIndex: number;
  trafficIntensity: number;
  detailedDescription?: string;
}

// Тип секції дороги для алгоритмів
export interface RoadSection {
  id: string;
  name: string;
  category: 1 | 2 | 3 | 4 | 5;
  length: number;
  significance: 'state' | 'local';
  region: string;
  detailedCondition: DetailedTechnicalCondition;
  trafficIntensity: number;
  estimatedCost?: number;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  isAccessRoad?: boolean;
  lastRepairYear?: number;
  hasLighting?: boolean;
  nearBorderCrossing?: boolean;
  criticalInfrastructureCount?: number;
}

// ==================== КОНСТАНТИ З МЕТОДИКИ ====================

export const MAX_DESIGN_INTENSITY_BY_CATEGORY: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 20000,
  2: 12000,
  3: 6000,
  4: 2000,
  5: 500
};

export const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1.0,
  2: 1.0,
  3: 0.95,
  4: 0.90,
  5: 0.85
};

export const REQUIRED_FRICTION_COEFFICIENT = 0.35;

// Базові норми вартості робіт (тис. грн/км, ціни 2023 року)
export const BASE_REPAIR_COSTS: Record<'current_repair' | 'capital_repair' | 'reconstruction', Record<1 | 2 | 3 | 4 | 5, number>> = {
  current_repair: {
    1: 3500,
    2: 2500,
    3: 1800,
    4: 1200,
    5: 900
  },
  capital_repair: {
    1: 18000,
    2: 15000,
    3: 12000,
    4: 9000,
    5: 7000
  },
  reconstruction: {
    1: 60000,
    2: 50000,
    3: 35000,
    4: 28000,
    5: 22000
  }
};

// Рівні вимог до якості доріг (Таблиця 9.1-9.3)
export const ROAD_QUALITY_LEVELS = {
  level1: { maxIRI: 2.7, maxBumpIndex: 100, maxRutDepth: 20 },
  level2: { maxIRI: 3.1, maxBumpIndex: 130, maxRutDepth: 25 },
  level3: { maxIRI: 3.5, maxBumpIndex: 170, maxRutDepth: 30 },
  level4: { maxIRI: 4.1, maxBumpIndex: 240, maxRutDepth: 40 }
};

// Експертна оцінка (Таблиця 11.2)
export const EXPERT_ASSESSMENT_THRESHOLDS = {
  NO_REPAIR_NEEDED: 8,
  CURRENT_REPAIR_MIN: 5,
  CURRENT_REPAIR_MAX: 7,
  CAPITAL_REPAIR_MAX: 4
};

// ==================== ОСНОВНІ АЛГОРИТМИ ====================

/**
 * ГОЛОВНА ФУНКЦІЯ - комплексна оцінка секції дороги
 * Алгоритм 4.2.1-4.2.7 з методики
 */
export function executeComprehensiveAssessment(
  section: RoadSection,
  hasInstrumentalData: boolean = true
): ComprehensiveRoadAssessment {
  
  console.log(`=== Комплексна оцінка секції ${section.id} ===`);
  
  // 4.2.1 - Формування загального переліку об'єктів
  const assessment: ComprehensiveRoadAssessment = {
    sectionId: section.id,
    currentInspections: true,
    targetedInspections: true,
    seasonalInspections: true,
    specialSurveys: hasInstrumentalData,
    diagnostics: hasInstrumentalData,
    technicalState: {
      intensityCoefficient: 0,
      strengthCoefficient: 0,
      evennessCoefficient: 0,
      rutCoefficient: 0,
      frictionCoefficient: 0
    },
    comparisonResults: {
      intensityCompliant: false,
      strengthCompliant: false,
      evennessCompliant: false,
      rutCompliant: false,
      frictionCompliant: false
    },
    recommendedWorkType: 'no_work_needed',
    estimatedCost: 0,
    priority: 0,
    rankingCriteria: ''
  };
  
  // 4.2.2 - Визначення фактичного транспортно-експлуатаційного стану
  assessment.technicalState = calculateAllTechnicalCoefficients(section);
  
  // 4.2.3 - Порівняння з нормативними значеннями
  assessment.comparisonResults = compareWithNormativeValues(section, assessment.technicalState);
  
  // Визначення виду робіт згідно 4.2.3.1-4.2.3.5
  const workTypeResult = determineWorkTypeDetailed(assessment.comparisonResults, section);
  assessment.recommendedWorkType = workTypeResult.workType;
  assessment.rankingCriteria = workTypeResult.reasoning.join('; ');
  
  // 4.2.4 - Визначення орієнтовної вартості робіт
  if (assessment.recommendedWorkType !== 'no_work_needed') {
    assessment.estimatedCost = calculateDetailedWorkCost(section, assessment.recommendedWorkType);
  }
  
  // 4.2.5 - Проведення аналізу витрат та вигод (для капремонту та реконструкції)
  if (assessment.recommendedWorkType === 'capital_repair' || 
      assessment.recommendedWorkType === 'reconstruction') {
    assessment.costBenefitAnalysis = performDetailedCostBenefitAnalysis(section, assessment.estimatedCost);
  }
  
  // 4.2.6 - Ранжування об'єктів
  const ranking = calculateDetailedPriority(section, assessment);
  assessment.priority = ranking.priority;
  assessment.rankingCriteria += `, пріоритет: ${ranking.criteria}`;
  
  console.log(`Секція ${section.id}: ${assessment.recommendedWorkType}, вартість: ${assessment.estimatedCost.toFixed(0)} тис. грн, пріоритет: ${assessment.priority}`);
  
  return assessment;
}

/**
 * Розрахунок всіх технічних коефіцієнтів згідно 4.2.2.1-4.2.2.5
 */
function calculateAllTechnicalCoefficients(section: RoadSection): any {
  const condition = section.detailedCondition;
  
  // 4.2.2.1 - Коефіцієнт інтенсивності руху
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
  const intensityCoefficient = maxDesignIntensity / Math.max(section.trafficIntensity, 1);
  
  // 4.2.2.2 - Коефіцієнт міцності дорожнього одягу
  let strengthCoefficient: number;
  if (condition.isRigidPavement) {
    strengthCoefficient = calculateRigidPavementStrength(section);
  } else {
    if (condition.actualElasticModulus && condition.requiredElasticModulus) {
      strengthCoefficient = condition.actualElasticModulus / condition.requiredElasticModulus;
    } else {
      strengthCoefficient = condition.strengthCoefficient;
    }
  }
  
  // 4.2.2.3 - Коефіцієнт рівності
  const evennessCoefficient = calculateEvennessCoefficient(section);
  
  // 4.2.2.4 - Коефіцієнт колійності
  const rutCoefficient = condition.maxAllowedRutDepth / Math.max(condition.actualRutDepth, 1);
  
  // 4.2.2.5 - Коефіцієнт зчеплення
  const frictionCoefficient = condition.actualFrictionValue / condition.requiredFrictionValue;
  
  return {
    intensityCoefficient,
    strengthCoefficient,
    evennessCoefficient,
    rutCoefficient,
    frictionCoefficient
  };
}

/**
 * Розрахунок міцності жорсткого дорожнього одягу
 */
function calculateRigidPavementStrength(section: RoadSection): number {
  const trafficCategory = getTrafficCategory(section.trafficIntensity);
  const designLoad = getDesignLoad(trafficCategory);
  const actualStrength = section.detailedCondition.strengthCoefficient;
  const safetyFactor = getSafetyFactorForRigidPavement(section.category);
  
  return actualStrength / (designLoad * safetyFactor);
}

function getTrafficCategory(intensity: number): 'light' | 'medium' | 'heavy' | 'very_heavy' {
  if (intensity < 1000) return 'light';
  if (intensity < 5000) return 'medium';
  if (intensity < 15000) return 'heavy';
  return 'very_heavy';
}

function getDesignLoad(trafficCategory: string): number {
  const loads = {
    light: 0.8,
    medium: 1.0,
    heavy: 1.2,
    very_heavy: 1.5
  };
  return loads[trafficCategory as keyof typeof loads] || 1.0;
}

function getSafetyFactorForRigidPavement(category: number): number {
  const factors = { 1: 1.3, 2: 1.2, 3: 1.1, 4: 1.0, 5: 1.0 };
  return factors[category as keyof typeof factors] || 1.0;
}

/**
 * Розрахунок коефіцієнта рівності з урахуванням рівня вимог
 */
function calculateEvennessCoefficient(section: RoadSection): number {
  const condition = section.detailedCondition;
  const qualityLevel = determineRoadQualityLevel(section);
  
  if (condition.iriIndex !== undefined) {
    return qualityLevel.maxIRI / Math.max(condition.iriIndex, 0.1);
  } else if (condition.bumpIndex !== undefined) {
    return qualityLevel.maxBumpIndex / Math.max(condition.bumpIndex, 1);
  } else {
    return condition.evennessCoefficient;
  }
}

/**
 * Визначення рівня вимог до дороги згідно Таблиці 9.1
 */
function determineRoadQualityLevel(section: RoadSection): typeof ROAD_QUALITY_LEVELS.level1 {
  const intensity = section.trafficIntensity;
  const roadCode = section.name.substring(0, 2).toUpperCase();
  
  if (roadCode.startsWith('М-') || roadCode.startsWith('Н-')) {
    return intensity > 7000 ? ROAD_QUALITY_LEVELS.level1 : ROAD_QUALITY_LEVELS.level2;
  } else if (roadCode.startsWith('Р-') || roadCode.startsWith('Т-')) {
    return intensity > 3000 ? ROAD_QUALITY_LEVELS.level2 : ROAD_QUALITY_LEVELS.level3;
  } else if (roadCode.startsWith('О')) {
    return intensity > 1000 ? ROAD_QUALITY_LEVELS.level3 : ROAD_QUALITY_LEVELS.level4;
  } else {
    return ROAD_QUALITY_LEVELS.level4;
  }
}

/**
 * Порівняння з нормативними значеннями
 */
function compareWithNormativeValues(section: RoadSection, technicalState: any): any {
  const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
  
  return {
    intensityCompliant: technicalState.intensityCoefficient >= 1.0,
    strengthCompliant: technicalState.strengthCoefficient >= minStrength,
    evennessCompliant: technicalState.evennessCoefficient >= 1.0,
    rutCompliant: technicalState.rutCoefficient >= 1.0,
    frictionCompliant: technicalState.frictionCoefficient >= 1.0
  };
}

/**
 * Детальне визначення виду робіт згідно 4.2.3.1-4.2.3.5
 */
function determineWorkTypeDetailed(comparisonResults: any, section: RoadSection): {
  workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  reasoning: string[];
} {
  const reasoning: string[] = [];
  
  // 4.2.3.1 - Реконструкція при недостатній інтенсивності
  if (!comparisonResults.intensityCompliant) {
    reasoning.push('Коефіцієнт інтенсивності руху менше 1.0');
    return { workType: 'reconstruction', reasoning };
  }
  
  // 4.2.3.2 - Капітальний ремонт при недостатній міцності
  if (!comparisonResults.strengthCompliant) {
    const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
    reasoning.push(`Коефіцієнт міцності дорожнього одягу менше ${minStrength}`);
    return { workType: 'capital_repair', reasoning };
  }
  
  // 4.2.3.3-4.2.3.5 - Поточний ремонт
  let needsCurrentRepair = false;
  
  if (!comparisonResults.evennessCompliant) {
    reasoning.push('Коефіцієнт рівності менше 1.0');
    needsCurrentRepair = true;
  }
  
  if (!comparisonResults.rutCompliant) {
    reasoning.push('Коефіцієнт колійності менше 1.0');
    needsCurrentRepair = true;
  }
  
  if (!comparisonResults.frictionCompliant) {
    reasoning.push('Коефіцієнт зчеплення менше 1.0');
    needsCurrentRepair = true;
  }
  
  if (needsCurrentRepair) {
    return { workType: 'current_repair', reasoning };
  }
  
  reasoning.push('Всі показники відповідають нормативним вимогам');
  return { workType: 'no_work_needed', reasoning };
}

/**
 * ЕКСПОРТ - детальний розрахунок вартості робіт згідно 4.2.4
 */
export function calculateDetailedWorkCost(
  section: RoadSection, 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): number {
  const baseCost = BASE_REPAIR_COSTS[workType][section.category];
  let totalCost = baseCost * section.length;
  
  // Коригувальні коефіцієнти
  let corrections = 1.0;
  
  // Корекція для міжнародних доріг та коридорів
  if (section.isInternationalRoad || section.isEuropeanNetwork) {
    corrections *= 1.15;
  }
  
  // Корекція для доріг оборонного значення
  if (section.isDefenseRoad) {
    corrections *= 1.10;
  }
  
  // Корекція залежно від складності
  const complexityFactor = calculateComplexityFactor(section, workType);
  corrections *= complexityFactor;
  
  // Корекція залежно від регіону
  const regionalFactor = getRegionalCostFactor(section.region);
  corrections *= regionalFactor;
  
  totalCost *= corrections;
  
  return Math.round(totalCost);
}

function calculateComplexityFactor(section: RoadSection, workType: string): number {
  let factor = 1.0;
  
  if (workType === 'reconstruction') {
    const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
    if (section.trafficIntensity > maxIntensity) {
      const excessRatio = section.trafficIntensity / maxIntensity;
      factor *= (1.0 + (excessRatio - 1.0) * 0.3);
    }
  }
  
  if (workType === 'capital_repair') {
    const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
    const actualStrength = section.detailedCondition.strengthCoefficient;
    if (actualStrength < minStrength) {
      const deficit = minStrength - actualStrength;
      factor *= (1.0 + deficit * 0.5);
    }
  }
  
  // Додаткові фактори складності
  if (section.hasLighting) factor *= 1.05;
  if (section.nearBorderCrossing) factor *= 1.08;
  if (section.criticalInfrastructureCount && section.criticalInfrastructureCount > 0) {
    factor *= (1.0 + section.criticalInfrastructureCount * 0.02);
  }
  
  return factor;
}

function getRegionalCostFactor(region: string): number {
  const factors: Record<string, number> = {
    'Київська': 1.20,
    'Львівська': 1.10,
    'Дніпропетровська': 1.05,
    'Одеська': 1.08,
    'Харківська': 1.03,
    'Закарпатська': 1.15,
    'Івано-Франківська': 1.12
  };
  
  return factors[region] || 1.0;
}

/**
 * ЕКСПОРТ - детальний аналіз витрат та вигод згідно Додатка 10
 */
export function performDetailedCostBenefitAnalysis(
  section: RoadSection,
  projectCost: number
): ComprehensiveRoadAssessment['costBenefitAnalysis'] {
  const discountRate = 0.05;
  const analysisYears = 15;
  
  const annualTrafficVolume = section.trafficIntensity * 365 * section.length;
  
  // Розрахунок річних вигод
  const vehicleFleetReduction = calculateVehicleFleetReduction(section, annualTrafficVolume);
  const transportCostSavings = calculateTransportCostSavings(section, annualTrafficVolume);
  const accidentReduction = calculateAccidentReduction(section, annualTrafficVolume);
  const environmentalBenefits = calculateEnvironmentalBenefits(section, annualTrafficVolume);
  
  const totalAnnualBenefits = vehicleFleetReduction + transportCostSavings + 
                             accidentReduction + environmentalBenefits;
  
  // Розрахунок NPV
  let totalDiscountedBenefits = 0;
  let totalDiscountedCosts = projectCost;
  
  for (let year = 1; year <= analysisYears; year++) {
    const discountFactor = Math.pow(1 + discountRate, -year);
    totalDiscountedBenefits += totalAnnualBenefits * discountFactor;
    totalDiscountedCosts += (projectCost * 0.03) * discountFactor;
  }
  
  const enpv = totalDiscountedBenefits - totalDiscountedCosts;
  const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;
  const eirr = calculateEIRR(totalAnnualBenefits, projectCost, analysisYears);
  const paybackPeriod = calculatePaybackPeriod(totalAnnualBenefits, projectCost);
  
  return {
    vehicleFleetReduction,
    transportCostSavings,
    accidentReduction,
    environmentalBenefits,
    totalBenefits: totalDiscountedBenefits,
    totalCosts: totalDiscountedCosts,
    enpv,
    eirr,
    bcr,
    discountRate,
    paybackPeriod
  };
}

function calculateVehicleFleetReduction(section: RoadSection, annualVolume: number): number {
  const speedImprovement = estimateSpeedImprovement(section);
  const reductionFactor = speedImprovement * 0.15;
  return annualVolume * reductionFactor * 0.5;
}

function calculateTransportCostSavings(_section: RoadSection, annualVolume: number): number {
  const fuelSavings = annualVolume * 0.3;
  const wearReduction = annualVolume * 0.2;
  return fuelSavings + wearReduction;
}

function calculateAccidentReduction(_section: RoadSection, annualVolume: number): number {
  const currentAccidentRate = 0.8;
  const improvedAccidentRate = 0.5;
  const accidentReduction = (currentAccidentRate - improvedAccidentRate) / 1000000;
  const averageAccidentCost = 750000;
  
  return annualVolume * accidentReduction * averageAccidentCost;
}

function calculateEnvironmentalBenefits(_section: RoadSection, annualVolume: number): number {
  return annualVolume * 0.05;
}

function estimateSpeedImprovement(section: RoadSection): number {
  const condition = section.detailedCondition;
  
  let improvement = 0;
  
  if (condition.evennessCoefficient < 1.0) {
    improvement += (1.0 - condition.evennessCoefficient) * 0.15;
  }
  
  if (condition.rutCoefficient < 1.0) {
    improvement += (1.0 - condition.rutCoefficient) * 0.10;
  }
  
  if (condition.frictionCoefficient < 1.0) {
    improvement += (1.0 - condition.frictionCoefficient) * 0.08;
  }
  
  return Math.min(improvement, 0.25);
}

function calculateEIRR(annualBenefits: number, initialCost: number, years: number): number {
  let rate = 0.05;
  
  for (let iteration = 0; iteration < 50; iteration++) {
    let npv = -initialCost;
    
    for (let year = 1; year <= years; year++) {
      npv += annualBenefits / Math.pow(1 + rate, year);
    }
    
    if (Math.abs(npv) < 1000) {
      return rate;
    }
    
    if (npv > 0) {
      rate += 0.001;
    } else {
      rate -= 0.001;
    }
    
    if (rate < 0) rate = 0.001;
    if (rate > 1) return 1.0;
  }
  
  return rate;
}

function calculatePaybackPeriod(annualBenefits: number, initialCost: number): number {
  if (annualBenefits <= 0) return 999;
  
  const annualMaintenanceCost = initialCost * 0.03;
  const netAnnualBenefits = annualBenefits - annualMaintenanceCost;
  
  if (netAnnualBenefits <= 0) return 999;
  
  return initialCost / netAnnualBenefits;
}

/**
 * Детальне ранжування згідно 4.2.6
 */
function calculateDetailedPriority(section: RoadSection, assessment: ComprehensiveRoadAssessment): {
  priority: number;
  criteria: string;
} {
  let priority = 1;
  let criteria = '';
  
  if (assessment.recommendedWorkType === 'current_repair') {
    priority = rankCurrentRepair(section, assessment);
    criteria = 'найменші коефіцієнти рівності, колійності, зчеплення + висока інтенсивність';
    
  } else if (assessment.recommendedWorkType === 'capital_repair' || 
             assessment.recommendedWorkType === 'reconstruction') {
    if (assessment.costBenefitAnalysis) {
      const enpvPerKm = assessment.costBenefitAnalysis.enpv / section.length;
      priority = Math.max(1, Math.round(1000000 / (enpvPerKm + 1000)));
      criteria = `ENPV на 1 км: ${enpvPerKm.toFixed(0)} тис. грн`;
    }
  }
  
  // Коригування пріоритету для спеціальних доріг
  if (section.isDefenseRoad) {
    priority = Math.max(1, priority - 10);
    criteria += ' (оборонне значення)';
  }
  
  if (section.isInternationalRoad) {
    priority = Math.max(1, priority - 5);
    criteria += ' (міжнародна дорога)';
  }
  
  return { priority, criteria };
}

function rankCurrentRepair(section: RoadSection, _assessment: ComprehensiveRoadAssessment): number {
  const condition = section.detailedCondition;
  
  const evennessDeficit = Math.max(0, 1.0 - condition.evennessCoefficient);
  const rutDeficit = Math.max(0, 1.0 - condition.rutCoefficient);
  const frictionDeficit = Math.max(0, 1.0 - condition.frictionCoefficient);
  
  const intensityFactor = section.trafficIntensity / 10000;
  
  const priorityScore = (evennessDeficit * 3 + rutDeficit * 2 + frictionDeficit * 2) - intensityFactor;
  
  return Math.max(1, Math.min(100, Math.round(priorityScore * 50) + 1));
}

// ==================== АЛГОРИТМИ ДЛЯ МІСЦЕВИХ ДОРІГ ====================

/**
 * ЕКСПОРТ - ранжування місцевих доріг згідно 4.4.6
 */
export function performLocalRoadRanking(
  section: RoadSection,
  assessment: ComprehensiveRoadAssessment,
  expertAssessment?: ExpertAssessment
): { priority: number; criteria: string } {
  
  if (expertAssessment) {
    // 4.4.6.3 - Ранжування за експертною оцінкою
    const jIndex = expertAssessment.operationalStateIndex;
    const intensityBonus = Math.min(5, section.trafficIntensity / 500);
    
    const priority = Math.max(1, (11 - jIndex) * 10 - intensityBonus);
    
    return {
      priority: Math.round(priority),
      criteria: `експертна оцінка J=${jIndex}, інтенсивність ${section.trafficIntensity} авт/добу`
    };
  }
  
  // Стандартне ранжування для місцевих доріг
  if (assessment.recommendedWorkType === 'current_repair') {
    const priority = rankCurrentRepair(section, assessment);
    return {
      priority,
      criteria: 'місцева дорога, поточний ремонт за технічними показниками'
    };
  }
  
  if (assessment.costBenefitAnalysis) {
    const enpvPerKm = assessment.costBenefitAnalysis.enpv / section.length;
    const priority = Math.max(1, Math.round(500000 / (enpvPerKm + 1000)));
    
    return {
      priority,
      criteria: `місцева дорога, ENPV=${enpvPerKm.toFixed(0)} тис.грн/км`
    };
  }
  
  return { priority: 50, criteria: 'місцева дорога, базовий пріоритет' };
}

/**
 * ЕКСПОРТ - експертний метод для місцевих доріг згідно Таблиці 11.2
 */
export function determineWorkTypeByExpertMethod(assessment: ExpertAssessment): 'current_repair' | 'capital_repair' | 'no_work_needed' {
  const j = assessment.operationalStateIndex;
  
  if (j >= EXPERT_ASSESSMENT_THRESHOLDS.NO_REPAIR_NEEDED) {
    return 'no_work_needed';
  } else if (j >= EXPERT_ASSESSMENT_THRESHOLDS.CURRENT_REPAIR_MIN && 
             j <= EXPERT_ASSESSMENT_THRESHOLDS.CURRENT_REPAIR_MAX) {
    return 'current_repair';
  } else if (j <= EXPERT_ASSESSMENT_THRESHOLDS.CAPITAL_REPAIR_MAX) {
    return 'capital_repair';
  }
  
  return 'no_work_needed';
}

/**
 * ЕКСПОРТ - алгоритм для місцевих доріг 4.4.1-4.4.7
 */
export function assessLocalRoadSection(
  section: RoadSection,
  _regionalStrategy?: {
    goals: string[];
    actionPlan: string[];
    period: string;
  },
  hasInstrumentalData: boolean = false,
  expertAssessment?: ExpertAssessment
): ComprehensiveRoadAssessment {
  
  console.log(`=== Оцінка місцевої дороги ${section.id} ===`);
  
  if (hasInstrumentalData) {
    // 4.4.2 - Використання інструментальних даних (як для державних доріг)
    console.log(`Місцева дорога ${section.id}: використання інструментальних даних`);
    return executeComprehensiveAssessment(section, true);
  }
  
  if (expertAssessment) {
    // 4.4.3.1 - Експертний експрес-метод
    console.log(`Місцева дорога ${section.id}: експертний метод, J=${expertAssessment.operationalStateIndex}`);
    const workType = determineWorkTypeByExpertMethod(expertAssessment);
    
    const assessment: ComprehensiveRoadAssessment = {
      sectionId: section.id,
      currentInspections: true,
      targetedInspections: true,
      seasonalInspections: true,
      specialSurveys: false,
      diagnostics: false,
      technicalState: {
        intensityCoefficient: 1.0,
        strengthCoefficient: 1.0,
        evennessCoefficient: expertAssessment.operationalStateIndex / 10,
        rutCoefficient: expertAssessment.operationalStateIndex / 10,
        frictionCoefficient: expertAssessment.operationalStateIndex / 10
      },
      comparisonResults: {
        intensityCompliant: true,
        strengthCompliant: workType !== 'capital_repair',
        evennessCompliant: workType === 'no_work_needed',
        rutCompliant: workType === 'no_work_needed',
        frictionCompliant: workType === 'no_work_needed'
      },
      recommendedWorkType: workType,
      estimatedCost: 0,
      priority: 0,
      rankingCriteria: `експертна оцінка J=${expertAssessment.operationalStateIndex}`
    };
    
    // 4.4.4 - Визначення вартості
    if (workType !== 'no_work_needed') {
      assessment.estimatedCost = calculateDetailedWorkCost(section, workType);
    }
    
    // 4.4.5 - Аналіз витрат та вигод
    if (workType === 'capital_repair') {
      assessment.costBenefitAnalysis = performDetailedCostBenefitAnalysis(section, assessment.estimatedCost);
    }
    
    // 4.4.6 - Ранжування
    const ranking = performLocalRoadRanking(section, assessment, expertAssessment);
    assessment.priority = ranking.priority;
    assessment.rankingCriteria = ranking.criteria;
    
    return assessment;
  }
  
  // Якщо немає ні інструментальних даних, ні експертної оцінки
  console.log(`Місцева дорога ${section.id}: недостатньо даних для оцінки`);
  return {
    sectionId: section.id,
    currentInspections: true,
    targetedInspections: false,
    seasonalInspections: false,
    specialSurveys: false,
    diagnostics: false,
    technicalState: {
      intensityCoefficient: 1.0,
      strengthCoefficient: 1.0,
      evennessCoefficient: 1.0,
      rutCoefficient: 1.0,
      frictionCoefficient: 1.0
    },
    comparisonResults: {
      intensityCompliant: true,
      strengthCompliant: true,
      evennessCompliant: true,
      rutCompliant: true,
      frictionCompliant: true
    },
    recommendedWorkType: 'no_work_needed',
    estimatedCost: 0,
    priority: 999,
    rankingCriteria: 'недостатньо даних для оцінки'
  };
}

// ==================== ФУНКЦІЇ ЗВІТНОСТІ ====================

/**
 * ЕКСПОРТ - детальний звіт по секції
 */
export function generateSectionReport(assessment: ComprehensiveRoadAssessment, section: RoadSection): string {
  let report = `# ДЕТАЛЬНИЙ ЗВІТ ПО СЕКЦІЇ ${section.id}\n\n`;
  
  // Загальна інформація
  report += `## ЗАГАЛЬНА ІНФОРМАЦІЯ\n`;
  report += `- **Назва**: ${section.name}\n`;
  report += `- **Категорія**: ${section.category}\n`;
  report += `- **Довжина**: ${section.length} км\n`;
  report += `- **Значення**: ${section.significance === 'state' ? 'державне' : 'місцеве'}\n`;
  report += `- **Регіон**: ${section.region}\n`;
  report += `- **Інтенсивність руху**: ${section.trafficIntensity} авт./добу\n`;
  
  // Спеціальні характеристики
  const specialFeatures: string[] = [];
  if (section.isDefenseRoad) specialFeatures.push('оборонне значення');
  if (section.isInternationalRoad) specialFeatures.push('міжнародна дорога');
  if (section.isEuropeanNetwork) specialFeatures.push('європейська мережа');
  if (section.isAccessRoad) specialFeatures.push('під\'їзд до населеного пункту');
  
  if (specialFeatures.length > 0) {
    report += `- **Особливості**: ${specialFeatures.join(', ')}\n`;
  }
  report += '\n';
  
  // Технічний стан
  report += `## ТЕХНІЧНИЙ СТАН\n`;
  report += `### Коефіцієнти відповідності нормативам:\n`;
  report += `- **Інтенсивність руху**: ${assessment.technicalState.intensityCoefficient.toFixed(3)} ${assessment.comparisonResults.intensityCompliant ? '✓' : '✗'}\n`;
  report += `- **Міцність дорожнього одягу**: ${assessment.technicalState.strengthCoefficient.toFixed(3)} ${assessment.comparisonResults.strengthCompliant ? '✓' : '✗'}\n`;
  report += `- **Рівність покриву**: ${assessment.technicalState.evennessCoefficient.toFixed(3)} ${assessment.comparisonResults.evennessCompliant ? '✓' : '✗'}\n`;
  report += `- **Колійність**: ${assessment.technicalState.rutCoefficient.toFixed(3)} ${assessment.comparisonResults.rutCompliant ? '✓' : '✗'}\n`;
  report += `- **Зчеплення**: ${assessment.technicalState.frictionCoefficient.toFixed(3)} ${assessment.comparisonResults.frictionCompliant ? '✓' : '✗'}\n\n`;
  
  // Детальні показники
  const condition = section.detailedCondition;
  report += `### Детальні показники:\n`;
  
  if (condition.iriIndex) {
    report += `- **Індекс IRI**: ${condition.iriIndex} м/км (норма ≤ ${condition.maxAllowedEvenness})\n`;
  }
  
  report += `- **Глибина колії**: ${condition.actualRutDepth} мм (норма ≤ ${condition.maxAllowedRutDepth})\n`;
  report += `- **Коефіцієнт зчеплення**: ${condition.actualFrictionValue.toFixed(3)} (норма ≥ ${condition.requiredFrictionValue})\n`;
  
  if (condition.actualElasticModulus && condition.requiredElasticModulus) {
    report += `- **Модуль пружності**: ${condition.actualElasticModulus} МПа (потрібно ${condition.requiredElasticModulus})\n`;
  }
  report += '\n';
  
  // Рекомендації
  report += `## РЕКОМЕНДАЦІЇ\n`;
  const workTypeNames = {
    current_repair: 'Поточний ремонт',
    capital_repair: 'Капітальний ремонт',
    reconstruction: 'Реконструкція',
    no_work_needed: 'Роботи не потрібні'
  };
  
  report += `- **Рекомендований вид робіт**: ${workTypeNames[assessment.recommendedWorkType]}\n`;
  report += `- **Обґрунтування**: ${assessment.rankingCriteria}\n`;
  
  if (assessment.estimatedCost > 0) {
    report += `- **Орієнтовна вартість**: ${assessment.estimatedCost.toLocaleString()} тис. грн\n`;
    report += `- **Вартість за 1 км**: ${(assessment.estimatedCost / section.length).toLocaleString()} тис. грн/км\n`;
  }
  
  report += `- **Пріоритет виконання**: ${assessment.priority}\n\n`;
  
  // Економічна ефективність
  if (assessment.costBenefitAnalysis) {
    const cba = assessment.costBenefitAnalysis;
    report += `## ЕКОНОМІЧНА ЕФЕКТИВНІСТЬ\n`;
    report += `- **ENPV**: ${cba.enpv.toLocaleString()} тис. грн\n`;
    report += `- **EIRR**: ${(cba.eirr * 100).toFixed(1)}%\n`;
    report += `- **BCR**: ${cba.bcr.toFixed(2)}\n`;
    report += `- **Термін окупності**: ${cba.paybackPeriod.toFixed(1)} років\n\n`;
    
    report += `### Структура вигод (тис. грн/рік):\n`;
    report += `- Зменшення автопарку: ${(cba.vehicleFleetReduction / 15).toFixed(0)}\n`;
    report += `- Економія на перевезеннях: ${(cba.transportCostSavings / 15).toFixed(0)}\n`;
    report += `- Зниження аварійності: ${(cba.accidentReduction / 15).toFixed(0)}\n`;
    report += `- Екологічні вигоди: ${(cba.environmentalBenefits / 15).toFixed(0)}\n\n`;
    
    const recommendation = cba.enpv > 0 && cba.bcr > 1.0 ? 
      '**Проект економічно доцільний**' : 
      '**Проект потребує додаткового обґрунтування**';
    report += `**Висновок**: ${recommendation}\n\n`;
  }
  
  // Додаткові рекомендації
  report += `## ДОДАТКОВІ РЕКОМЕНДАЦІЇ\n`;
  
  if (assessment.recommendedWorkType === 'reconstruction') {
    report += `- Розглянути можливість збільшення категорії дороги у зв'язку з високою інтенсивністю руху\n`;
    report += `- Врахувати перспективний ріст транспортних потоків\n`;
  }
  
  if (assessment.recommendedWorkType === 'capital_repair') {
    report += `- Передбачити усилення дорожнього одягу для забезпечення нормативної міцності\n`;
    report += `- Розглянути застосування сучасних матеріалів та технологій\n`;
  }
  
  if (assessment.recommendedWorkType === 'current_repair') {
    report += `- Виконати роботи у найкоротші терміни для запобігання погіршенню стану\n`;
    report += `- Забезпечити якісне виконання робіт для досягнення нормативних показників\n`;
  }
  
  if (section.isDefenseRoad) {
    report += `- **Пріоритетне виконання** у зв'язку з оборонним значенням дороги\n`;
  }
  
  if (section.trafficIntensity > 15000) {
    report += `- Розглянути додаткові заходи з безпеки дорожнього руху\n`;
  }
  
  return report;
}

// ==================== ДОПОМІЖНІ ФУНКЦІЇ СТВОРЕННЯ ТЕСТОВИХ ДАНИХ ====================

/**
 * Створення тестової секції дороги з детальними параметрами
 */
export function createTestRoadSection(
  id: string,
  name: string,
  category: 1 | 2 | 3 | 4 | 5,
  length: number,
  trafficIntensity: number,
  significance: 'state' | 'local' = 'state',
  region: string = 'Київська'
): RoadSection {
  
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[category];
  const intensityCoefficient = maxDesignIntensity / Math.max(trafficIntensity, 1);
  
  // Генеруємо реалістичні параметри
  const detailedCondition: DetailedTechnicalCondition = {
    intensityCoefficient,
    maxDesignIntensity,
    actualIntensity: trafficIntensity,
    
    strengthCoefficient: 0.8 + Math.random() * 0.4, // 0.8-1.2
    isRigidPavement: Math.random() > 0.8, // 20% жорстких покриттів
    
    evennessCoefficient: 0.7 + Math.random() * 0.6, // 0.7-1.3
    iriIndex: 2.5 + Math.random() * 2.0, // 2.5-4.5 м/км
    maxAllowedEvenness: category <= 2 ? 3.1 : 4.1,
    
    rutCoefficient: 0.6 + Math.random() * 0.8, // 0.6-1.4
    actualRutDepth: 15 + Math.random() * 25, // 15-40 мм
    maxAllowedRutDepth: category <= 2 ? 20 : 30,
    
    frictionCoefficient: 0.8 + Math.random() * 0.4, // 0.8-1.2
    actualFrictionValue: 0.25 + Math.random() * 0.2, // 0.25-0.45
    requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
  };
  
  return {
    id,
    name,
    category,
    length,
    significance,
    region,
    detailedCondition,
    trafficIntensity,
    isDefenseRoad: Math.random() > 0.9, // 10% оборонних доріг
    isInternationalRoad: category <= 2 && Math.random() > 0.7, // 30% міжнародних серед 1-2 категорій
    isEuropeanNetwork: category === 1 && Math.random() > 0.8, // 20% європейських серед 1 категорії
    isAccessRoad: significance === 'local' && Math.random() > 0.6, // 40% під'їздів серед місцевих
    hasLighting: trafficIntensity > 5000 && Math.random() > 0.5,
    nearBorderCrossing: Math.random() > 0.95,
    criticalInfrastructureCount: Math.floor(Math.random() * 3)
  };
}

/**
 * Створення тестової експертної оцінки
 */
export function createTestExpertAssessment(
  operationalStateIndex: number,
  trafficIntensity: number,
  description?: string
): ExpertAssessment {
  return {
    operationalStateIndex,
    trafficIntensity,
    detailedDescription: description || `Експертна оцінка: стан дороги оцінено як ${operationalStateIndex} балів з 10`
  };
}

// ==================== ЕКСПОРТ ВСІХ ФУНКЦІЙ ====================

export default {
  // Основні алгоритми
  executeComprehensiveAssessment,
  assessLocalRoadSection,
  performLocalRoadRanking,
  determineWorkTypeByExpertMethod,
  generateSectionReport,
  
  // Допоміжні функції розрахунків
  calculateDetailedWorkCost,
  performDetailedCostBenefitAnalysis,
  
  // Тестові функції
  createTestRoadSection,
  createTestExpertAssessment,
  
  // Константи
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  BASE_REPAIR_COSTS,
  ROAD_QUALITY_LEVELS,
  EXPERT_ASSESSMENT_THRESHOLDS,
  REQUIRED_FRICTION_COEFFICIENT
};