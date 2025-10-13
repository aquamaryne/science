// src/modules/block_three.ts - ОБЪЕДИНЕННЫЙ МОДУЛЬ РАЗДЕЛА IV И V

/**
 * РОЗДІЛ IV - Визначення обсягу та механізм розподілу бюджетних коштів
 * на поточний, капітальний ремонт та реконструкцію
 * 
 * РОЗДІЛ V - Розподіл бюджетних коштів на нове будівництво
 */

// ==================== ІМПОРТИ ====================
import { type BudgetItem } from './block_one';

// ==================== ТИПИ ТА ІНТЕРФЕЙСИ ====================

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

// Секція дороги
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
  enpv?: number;
}

// Експертна оцінка
export interface ExpertAssessment {
  operationalStateIndex: number;
  trafficIntensity: number;
  detailedDescription?: string;
}

// Проект ремонту
export interface RepairProject {
  section: RoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;
  economicNPV?: number;
  reasoning: string;
  allocatedBudgetSource: 'q1' | 'q2';
  assessment?: ComprehensiveRoadAssessment;
}

// НОВОЕ: Проект нового строительства (Раздел V)
export interface NewConstructionProject {
  section: RoadSection;
  projectType: 'new_road' | 'bypass' | 'bridge' | 'access_road';
  priority: number;
  estimatedCost: number;
  reasoning: string;
  socioEconomicEffect: number;
  environmentalImpact: 'low' | 'medium' | 'high';
  transitPotential: number;
  allocatedBudgetSource: 'q1' | 'q2';
  hasApprovedDesign?: boolean;
  completionPercentage?: number;
}

// Данные из блока 1
export interface BlockOneBudgetData {
  q1Value: number;
  q2Value: number;
  totalBudget: number;
  q1Items: BudgetItem[];
  q2Items: BudgetItem[];
  sessionId: string;
  timestamp: Date;
}

// Распределение бюджета
export interface BudgetAllocation {
  currentRepair: number;
  capitalRepair: number;
  reconstruction: number;
  newConstruction: number; // НОВОЕ: добавлено для раздела V
  reserve: number;
}

// Региональная стратегия
export interface RegionalStrategy {
  goals: string[];
  actionPlan: string[];
  period: string;
}

// ==================== КОНСТАНТИ ====================

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

// НОВОЕ: Базові норми вартості нового будівництва (тис. грн/км)
export const BASE_CONSTRUCTION_COSTS: Record<'new_road' | 'bypass' | 'bridge' | 'access_road', Record<1 | 2 | 3 | 4 | 5, number>> = {
  new_road: {
    1: 120000,
    2: 100000,
    3: 70000,
    4: 55000,
    5: 40000
  },
  bypass: {
    1: 150000,
    2: 130000,
    3: 90000,
    4: 70000,
    5: 50000
  },
  bridge: {
    1: 200000,
    2: 180000,
    3: 150000,
    4: 120000,
    5: 100000
  },
  access_road: {
    1: 80000,
    2: 65000,
    3: 45000,
    4: 35000,
    5: 25000
  }
};

// Рівні вимог до якості доріг
export const ROAD_QUALITY_LEVELS = {
  level1: { maxIRI: 2.7, maxBumpIndex: 100, maxRutDepth: 20 },
  level2: { maxIRI: 3.1, maxBumpIndex: 130, maxRutDepth: 25 },
  level3: { maxIRI: 3.5, maxBumpIndex: 170, maxRutDepth: 30 },
  level4: { maxIRI: 4.1, maxBumpIndex: 240, maxRutDepth: 40 }
};

// Експертна оцінка
export const EXPERT_ASSESSMENT_THRESHOLDS = {
  NO_REPAIR_NEEDED: 8,
  CURRENT_REPAIR_MIN: 5,
  CURRENT_REPAIR_MAX: 7,
  CAPITAL_REPAIR_MAX: 4
};

// ==================== ГЛОБАЛЬНЕ СХОВИЩЕ ====================

let blockOneBudgetData: BlockOneBudgetData | null = null;
let budgetAllocation: BudgetAllocation | null = null;

// ==================== ФУНКЦІЇ ІНТЕГРАЦІЇ З БЛОКОМ 1 ====================

export function setBlockOneBudgetData(data: {
  q1Value: number;
  q2Value: number;
  q1Items: BudgetItem[];
  q2Items: BudgetItem[];
  sessionId: string;
}): void {
  blockOneBudgetData = {
    q1Value: data.q1Value,
    q2Value: data.q2Value,
    totalBudget: data.q1Value + data.q2Value,
    q1Items: [...data.q1Items],
    q2Items: [...data.q2Items],
    sessionId: data.sessionId,
    timestamp: new Date()
  };
  
  calculateBudgetAllocation();
  console.log('Block One budget data saved to Block Three:', blockOneBudgetData);
}

export function getBlockOneBudgetData(): BlockOneBudgetData | null {
  return blockOneBudgetData;
}

export function hasBlockOneBudgetData(): boolean {
  return blockOneBudgetData !== null && blockOneBudgetData.totalBudget > 0;
}

export function clearBlockOneBudgetData(): void {
  blockOneBudgetData = null;
  budgetAllocation = null;
  console.log('Block One budget data cleared from Block Three');
}

function calculateBudgetAllocation(): void {
  if (!blockOneBudgetData) return;
  
  const totalBudget = blockOneBudgetData.totalBudget;
  
  budgetAllocation = {
    currentRepair: totalBudget * 0.25,
    capitalRepair: totalBudget * 0.35,
    reconstruction: totalBudget * 0.20,
    newConstruction: totalBudget * 0.15, // НОВОЕ: для раздела V
    reserve: totalBudget * 0.05
  };
  
  console.log('Budget allocation calculated:', budgetAllocation);
}

export function getBudgetAllocation(): BudgetAllocation | null {
  return budgetAllocation;
}

export function setBudgetAllocation(allocation: BudgetAllocation): boolean {
  if (!blockOneBudgetData) {
    console.error('No Block One data available for budget allocation');
    return false;
  }
  
  const total = allocation.currentRepair + allocation.capitalRepair + 
                allocation.reconstruction + allocation.newConstruction + allocation.reserve;
  
  if (Math.abs(total - blockOneBudgetData.totalBudget) > 0.01) {
    console.error('Budget allocation total does not match available budget');
    return false;
  }
  
  budgetAllocation = { ...allocation };
  console.log('Custom budget allocation set:', budgetAllocation);
  return true;
}

// ==================== РОЗДІЛ IV: АЛГОРИТМИ РЕМОНТУ ====================

/**
 * 4.2 - ГОЛОВНА ФУНКЦІЯ комплексної оцінки секції дороги
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
  
  // 4.2.5 - Проведення аналізу витрат та вигод
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
 * 4.2.2 - Розрахунок всіх технічних коефіцієнтів згідно 4.2.2.1-4.2.2.5
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
 * 4.2.3 - Порівняння з нормативними значеннями
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
 * 4.2.3 - Детальне визначення виду робіт згідно 4.2.3.1-4.2.3.5
 */
function determineWorkTypeDetailed(comparisonResults: any, section: RoadSection): {
  workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  reasoning: string[];
} {
  const reasoning: string[] = [];
  
  // 4.2.3.1 - Реконструкція
  if (!comparisonResults.intensityCompliant) {
    reasoning.push('Коефіцієнт інтенсивності руху менше 1.0');
    return { workType: 'reconstruction', reasoning };
  }
  
  // 4.2.3.2 - Капітальний ремонт
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
 * 4.2.4 - Детальний розрахунок вартості робіт
 */
export function calculateDetailedWorkCost(
  section: RoadSection, 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): number {
  const baseCost = BASE_REPAIR_COSTS[workType][section.category];
  let totalCost = baseCost * section.length;
  
  let corrections = 1.0;
  
  if (section.isInternationalRoad || section.isEuropeanNetwork) {
    corrections *= 1.15;
  }
  
  if (section.isDefenseRoad) {
    corrections *= 1.10;
  }
  
  const complexityFactor = calculateComplexityFactor(section, workType);
  corrections *= complexityFactor;
  
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
 * 4.2.5 - Детальний аналіз витрат та вигод (Додаток 11)
 */
export function performDetailedCostBenefitAnalysis(
  section: RoadSection,
  projectCost: number
): ComprehensiveRoadAssessment['costBenefitAnalysis'] {
  const discountRate = 0.05;
  const analysisYears = 15;
  
  const annualTrafficVolume = section.trafficIntensity * 365 * section.length;
  
  const vehicleFleetReduction = calculateVehicleFleetReduction(section, annualTrafficVolume);
  const transportCostSavings = calculateTransportCostSavings(section, annualTrafficVolume);
  const accidentReduction = calculateAccidentReduction(section, annualTrafficVolume);
  const environmentalBenefits = calculateEnvironmentalBenefits(section, annualTrafficVolume);
  
  const totalAnnualBenefits = vehicleFleetReduction + transportCostSavings + 
                             accidentReduction + environmentalBenefits;
  
  let totalDiscountedBenefits = 0;
  const totalDiscountedCosts = projectCost;
  
  for (let year = 1; year <= analysisYears; year++) {
    const discountFactor = Math.pow(1 + discountRate, -year);
    totalDiscountedBenefits += totalAnnualBenefits * discountFactor;
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
 * 4.2.6 - Детальне ранжування
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
      priority = Math.max(1, Math.round(Math.max(0, 100000 - enpvPerKm) / 1000));
      criteria = `ENPV на 1 км: ${enpvPerKm.toFixed(0)} тис. грн`;
    }
  }
  
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

/**
 * 4.4 - Алгоритм для місцевих доріг 4.4.1-4.4.6
 */
export function assessLocalRoadSection(
  section: RoadSection,
  _regionalStrategy?: RegionalStrategy,
  hasInstrumentalData: boolean = false,
  expertAssessment?: ExpertAssessment
): ComprehensiveRoadAssessment {
  
  console.log(`=== Оцінка місцевої дороги ${section.id} ===`);
  
  // 4.4.2 - Використання інструментальних даних
  if (hasInstrumentalData) {
    console.log(`Місцева дорога ${section.id}: використання інструментальних даних`);
    return executeComprehensiveAssessment(section, true);
  }
  
  // 4.4.3.1 - Експертний експрес-метод
  if (expertAssessment) {
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
  
  // Недостатньо даних
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

/**
 * 4.4.6 - Ранжування місцевих доріг
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
 * Експертний метод згідно Таблиці 12.2
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
 * Визначення типу робіт по технічному стану
 */
export function determineWorkTypeByTechnicalCondition(
  section: RoadSection
): 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' {
  
  const condition = section.detailedCondition;
  
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
  
  if (section.trafficIntensity > maxDesignIntensity || condition.intensityCoefficient < 1.0) {
    return 'reconstruction';
  }
  
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
  
  if (condition.strengthCoefficient < minStrengthCoeff) {
    return 'capital_repair';
  }
  
  if (condition.evennessCoefficient < 1.0 || 
      condition.rutCoefficient < 1.0 || 
      condition.frictionCoefficient < 1.0) {
    return 'current_repair';
  }
  
  return 'no_work_needed';
}

// ==================== РОЗДІЛ V: НОВЕ БУДІВНИЦТВО ====================

/**
 * 5.1-5.2 - Планування нового будівництва з урахуванням пріоритетів
 */
export function planNewConstruction(
  sections: RoadSection[],
  regionalStrategy?: RegionalStrategy
): {
  newConstructionProjects: NewConstructionProject[];
  totalCost: number;
  budgetUtilization: number;
} {
  console.log('=== Планування нового будівництва (Розділ V) ===');
  
  if (!hasBlockOneBudgetData() || !budgetAllocation) {
    throw new Error('Немає даних з Блоку 1 для планування нового будівництва');
  }
  
  const availableBudget = budgetAllocation.newConstruction;
  const allProjects: NewConstructionProject[] = [];
  
  // Створення проектів для кожної секції
  for (const section of sections) {
    const project = createNewConstructionProject(section, regionalStrategy);
    if (project) {
      allProjects.push(project);
    }
  }
  
  // Ранжування проектів за пріоритетами
  const rankedProjects = rankNewConstructionProjects(
    allProjects,
    sections[0]?.significance ?? 'state'
  );
  
  // Відбір проектів у межах бюджету
  const selectedProjects: NewConstructionProject[] = [];
  let remainingBudget = availableBudget;
  
  for (const project of rankedProjects) {
    if (project.estimatedCost <= remainingBudget) {
      selectedProjects.push(project);
      remainingBudget -= project.estimatedCost;
    }
  }
  
  const totalCost = selectedProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  const budgetUtilization = (totalCost / availableBudget) * 100;
  
  console.log(`Нове будівництво: ${selectedProjects.length} проектів (${totalCost.toFixed(2)} тис. грн)`);
  console.log(`Використання бюджету: ${budgetUtilization.toFixed(1)}%`);
  
  return {
    newConstructionProjects: selectedProjects,
    totalCost,
    budgetUtilization
  };
}

function createNewConstructionProject(
  section: RoadSection,
  regionalStrategy?: RegionalStrategy
): NewConstructionProject | null {
  
  // Визначення типу проекту
  let projectType: NewConstructionProject['projectType'];
  
  if (section.name.includes('обхід') || section.name.includes('bypass')) {
    projectType = 'bypass';
  } else if (section.name.includes('міст') || section.name.includes('bridge')) {
    projectType = 'bridge';
  } else if (section.isAccessRoad) {
    projectType = 'access_road';
  } else {
    projectType = 'new_road';
  }
  
  // Розрахунок вартості
  const estimatedCost = calculateNewConstructionCost(section, projectType);
  
  // Оцінка соціально-економічного ефекту
  const socioEconomicEffect = calculateSocioEconomicEffect(section);
  
  // Оцінка впливу на навколишнє середовище
  const environmentalImpact = assessEnvironmentalImpact(section);
  
  // Оцінка транзитного потенціалу
  const transitPotential = calculateTransitPotential(section);
  
  // Обґрунтування (згідно з пунктами 5.1 та 5.2)
  const reasoning = buildConstructionReasoning(section, projectType, regionalStrategy);
  
  return {
    section,
    projectType,
    priority: 0, // Буде встановлено при ранжуванні
    estimatedCost,
    reasoning,
    socioEconomicEffect,
    environmentalImpact,
    transitPotential,
    allocatedBudgetSource: section.significance === 'state' ? 'q1' : 'q2',
    hasApprovedDesign: false,
    completionPercentage: 0
  };
}

function calculateNewConstructionCost(
  section: RoadSection,
  projectType: NewConstructionProject['projectType']
): number {
  const baseCost = BASE_CONSTRUCTION_COSTS[projectType][section.category];
  let totalCost = baseCost * section.length;
  
  // Коригувальні коефіцієнти
  let corrections = 1.0;
  
  if (section.isInternationalRoad) corrections *= 1.20;
  if (section.isDefenseRoad) corrections *= 1.15;
  
  const regionalFactor = getRegionalCostFactor(section.region);
  corrections *= regionalFactor;
  
  totalCost *= corrections;
  
  return Math.round(totalCost);
}

function calculateSocioEconomicEffect(section: RoadSection): number {
  let effect = 0;
  
  // Вплив на розвиток регіону
  effect += section.trafficIntensity * 100;
  
  // Покращення доступності
  if (section.isAccessRoad) {
    effect += 500000;
  }
  
  // Розвиток транзитного потенціалу
  if (section.isInternationalRoad) {
    effect += 1000000;
  }
  
  return effect;
}

function assessEnvironmentalImpact(section: RoadSection): 'low' | 'medium' | 'high' {
  // Спрощена оцінка
  if (section.region.includes('Карпат') || section.region.includes('Закарпат')) {
    return 'high';
  }
  
  if (section.length > 50) {
    return 'medium';
  }
  
  return 'low';
}

function calculateTransitPotential(section: RoadSection): number {
  let potential = 0;
  
  if (section.isInternationalRoad) potential += 50;
  if (section.isEuropeanNetwork) potential += 30;
  if (section.nearBorderCrossing) potential += 20;
  
  return potential;
}

function buildConstructionReasoning(
  section: RoadSection,
  projectType: string,
  regionalStrategy?: RegionalStrategy
): string {
  const reasons: string[] = [];
  
  // 5.1 - Пріоритети для державних доріг
  if (section.significance === 'state') {
    if (section.isDefenseRoad) {
      reasons.push('дорога оборонного значення');
    }
    
    if (section.isInternationalRoad) {
      reasons.push('включено до міжнародних транспортних коридорів');
    }
    
    if (projectType === 'bypass') {
      reasons.push('будівництво обходу великого міста');
    }
  }
  
  // 5.2 - Пріоритети для місцевих доріг
  if (section.significance === 'local') {
    if (regionalStrategy) {
      reasons.push('відповідність регіональній стратегії розвитку');
    }
    
    if (section.isAccessRoad) {
      reasons.push('будівництво під\'їзду до населеного пункту');
    }
  }
  
  return reasons.join('; ');
}

/**
 * 5.1-5.2 - Ранжування проектів нового будівництва
 */
function rankNewConstructionProjects(
  projects: NewConstructionProject[],
  significance: 'state' | 'local'
): NewConstructionProject[] {
  
  return projects.sort((a, b) => {
    // Пріоритет для державних доріг (5.1)
    if (significance === 'state') {
      // 1. Найважливіші ділянки та дороги оборонного значення
      if (a.section.isDefenseRoad && !b.section.isDefenseRoad) return -1;
      if (!a.section.isDefenseRoad && b.section.isDefenseRoad) return 1;
      
      // 2. Міжнародні транспортні коридори
      if (a.section.isInternationalRoad && !b.section.isInternationalRoad) return -1;
      if (!a.section.isInternationalRoad && b.section.isInternationalRoad) return 1;
      
      // 3. Наявність проектної документації
      if (a.hasApprovedDesign && !b.hasApprovedDesign) return -1;
      if (!a.hasApprovedDesign && b.hasApprovedDesign) return 1;
      
      // 4. Високий ступінь готовності незавершеного будівництва
      if (a.completionPercentage && b.completionPercentage) {
        if (a.completionPercentage > 70 && b.completionPercentage <= 70) return -1;
        if (a.completionPercentage <= 70 && b.completionPercentage > 70) return 1;
      }
      
      // 5. Обходи великих міст
      if (a.projectType === 'bypass' && b.projectType !== 'bypass') return -1;
      if (a.projectType !== 'bypass' && b.projectType === 'bypass') return 1;
    }
    
    // Пріоритет для місцевих доріг (5.2)
    if (significance === 'local') {
      // 1. Відповідність регіональній стратегії
      // (передбачається що це вже врахована в reasoning)
      
      // 2. Під'їзди до населених пунктів
      if (a.projectType === 'access_road' && b.projectType !== 'access_road') return -1;
      if (a.projectType !== 'access_road' && b.projectType === 'access_road') return 1;
    }
    
    // 5.3-5.4 - Порівняльний аналіз за критеріями
    const scoreA = calculateConstructionProjectScore(a);
    const scoreB = calculateConstructionProjectScore(b);
    
    return scoreB - scoreA;
  }).map((project, index) => ({
    ...project,
    priority: index + 1
  }));
}

/**
 * 5.4 - Розрахунок рейтингу проекту за критеріями
 */
function calculateConstructionProjectScore(project: NewConstructionProject): number {
  let score = 0;
  
  // Соціально-економічна ефективність
  score += project.socioEconomicEffect / 10000;
  
  // Вплив на навколишнє середовище (менший вплив - вищий бал)
  if (project.environmentalImpact === 'low') score += 30;
  if (project.environmentalImpact === 'medium') score += 20;
  if (project.environmentalImpact === 'high') score += 10;
  
  // Транзитний потенціал
  score += project.transitPotential;
  
  return score;
}

// ==================== ГОЛОВНА ФУНКЦІЯ ПЛАНУВАННЯ ====================

/**
 * ГОЛОВНА ФУНКЦІЯ - планування всіх видів робіт (ремонти + нове будівництво)
 */
export function planRepairWorksWithBlockOneData(
  sections: RoadSection[],
  expertAssessments?: Map<string, ExpertAssessment>,
  useDetailedAlgorithms: boolean = true,
  includeNewConstruction: boolean = false,
  regionalStrategy?: RegionalStrategy
): {
  currentRepairProjects: RepairProject[];
  capitalRepairProjects: RepairProject[];
  reconstructionProjects: RepairProject[];
  newConstructionProjects: NewConstructionProject[];
  totalCost: number;
  budgetUtilization: number;
  budgetBreakdown: {
    currentRepairUsed: number;
    capitalRepairUsed: number;
    reconstructionUsed: number;
    newConstructionUsed: number;
    reserveRemaining: number;
  };
  blockOneBudgetInfo: BlockOneBudgetData | null;
  complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}>;
  detailedAssessments?: Map<string, ComprehensiveRoadAssessment>;
} {
  console.log('=== Початок планування всіх видів робіт ===');
  
  if (!hasBlockOneBudgetData()) {
    throw new Error('Немає даних з Блоку 1');
  }
  
  const allProjects: RepairProject[] = [];
  const complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}> = [];
  const detailedAssessments = new Map<string, ComprehensiveRoadAssessment>();
  
  // РОЗДІЛ IV - Оцінка ремонтів
  for (const section of sections) {
    let assessment: ComprehensiveRoadAssessment;
    
    if (useDetailedAlgorithms) {
      if (section.significance === 'local' && expertAssessments?.has(section.id)) {
        const expertAssessment = expertAssessments.get(section.id)!;
        assessment = assessLocalRoadSection(section, regionalStrategy, false, expertAssessment);
      } else {
        assessment = executeComprehensiveAssessment(section, true);
      }
    } else {
      assessment = createSimpleAssessment(section, expertAssessments?.get(section.id));
    }
    
    detailedAssessments.set(section.id, assessment);
    
    const categoryCompliance = checkCategoryComplianceByIntensity(section);
    const frictionCompliance = checkFrictionCompliance(section.detailedCondition.frictionCoefficient);
    
    complianceReport.push({
      sectionId: section.id,
      categoryCompliance: categoryCompliance.isCompliant,
      frictionCompliance: frictionCompliance.isCompliant
    });
    
    if (assessment.recommendedWorkType !== 'no_work_needed') {
      const project: RepairProject = {
        section,
        workType: assessment.recommendedWorkType,
        priority: assessment.priority,
        estimatedCost: assessment.estimatedCost,
        economicNPV: assessment.costBenefitAnalysis?.enpv,
        allocatedBudgetSource: section.significance === 'state' ? 'q1' : 'q2',
        reasoning: assessment.rankingCriteria,
        assessment
      };
      
      allProjects.push(project);
    }
  }
  
  // Ранжування та відбір ремонтів
  const currentRepairProjects = rankAndSelectProjects(allProjects, 'current_repair');
  const capitalRepairProjects = rankAndSelectProjects(allProjects, 'capital_repair');
  const reconstructionProjects = rankAndSelectProjects(allProjects, 'reconstruction');
  
  // РОЗДІЛ V - Нове будівництво
  let newConstructionProjects: NewConstructionProject[] = [];
  if (includeNewConstruction) {
    const constructionResult = planNewConstruction(sections, regionalStrategy);
    newConstructionProjects = constructionResult.newConstructionProjects;
  }
  
  // Розрахунок використаних коштів
  const currentRepairUsed = currentRepairProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  const capitalRepairUsed = capitalRepairProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  const reconstructionUsed = reconstructionProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  const newConstructionUsed = newConstructionProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  
  const totalCost = currentRepairUsed + capitalRepairUsed + reconstructionUsed + newConstructionUsed;
  const budgetUtilization = (totalCost / blockOneBudgetData!.totalBudget) * 100;
  
  const budgetBreakdown = {
    currentRepairUsed,
    capitalRepairUsed,
    reconstructionUsed,
    newConstructionUsed,
    reserveRemaining: budgetAllocation!.reserve + 
                     (budgetAllocation!.currentRepair - currentRepairUsed) +
                     (budgetAllocation!.capitalRepair - capitalRepairUsed) +
                     (budgetAllocation!.reconstruction - reconstructionUsed) +
                     (budgetAllocation!.newConstruction - newConstructionUsed)
  };
  
  console.log('=== Результати планування ===');
  console.log(`Поточний ремонт: ${currentRepairProjects.length} проектів (${currentRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Капітальний ремонт: ${capitalRepairProjects.length} проектів (${capitalRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Реконструкція: ${reconstructionProjects.length} проектів (${reconstructionUsed.toFixed(2)} тис. грн)`);
  console.log(`Нове будівництво: ${newConstructionProjects.length} проектів (${newConstructionUsed.toFixed(2)} тис. грн)`);
  console.log(`Загальна вартість: ${totalCost.toFixed(2)} тис. грн`);
  console.log(`Використання бюджету: ${budgetUtilization.toFixed(1)}%`);
  
  return {
    currentRepairProjects,
    capitalRepairProjects,
    reconstructionProjects,
    newConstructionProjects,
    totalCost,
    budgetUtilization,
    budgetBreakdown,
    blockOneBudgetInfo: blockOneBudgetData,
    complianceReport,
    detailedAssessments
  };
}

function rankAndSelectProjects(
  projects: RepairProject[], 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): RepairProject[] {
  const filtered = projects.filter(p => p.workType === workType);
  
  const ranked = filtered.sort((a, b) => {
    if (a.assessment && b.assessment) {
      return a.assessment.priority - b.assessment.priority;
    }
    
    if (workType === 'capital_repair' || workType === 'reconstruction') {
      const enpvPerKmA = (a.economicNPV || 0) / a.section.length;
      const enpvPerKmB = (b.economicNPV || 0) / b.section.length;
      return enpvPerKmB - enpvPerKmA;
    }
    
    return (a.priority || 999) - (b.priority || 999);
  }).map((project, index) => ({
    ...project,
    priority: index + 1
  }));
  
  return selectProjectsWithinBudget(ranked, workType);
}

function selectProjectsWithinBudget(
  rankedProjects: RepairProject[], 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): RepairProject[] {
  if (!budgetAllocation) return [];
  
  let availableBudget: number;
  switch (workType) {
    case 'current_repair':
      availableBudget = budgetAllocation.currentRepair;
      break;
    case 'capital_repair':
      availableBudget = budgetAllocation.capitalRepair;
      break;
    case 'reconstruction':
      availableBudget = budgetAllocation.reconstruction;
      break;
  }
  
  const selectedProjects: RepairProject[] = [];
  let remainingBudget = availableBudget;
  
  for (const project of rankedProjects) {
    if (project.estimatedCost <= remainingBudget) {
      selectedProjects.push(project);
      remainingBudget -= project.estimatedCost;
    }
  }
  
  return selectedProjects;
}

function createSimpleAssessment(
  section: RoadSection, 
  expertAssessment?: ExpertAssessment
): ComprehensiveRoadAssessment {
  
  let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' = 'no_work_needed';
  
  if (section.significance === 'local' && expertAssessment) {
    workType = determineWorkTypeByExpertMethod(expertAssessment);
  } else {
    workType = determineWorkTypeByTechnicalCondition(section);
  }
  
  const estimatedCost = workType !== 'no_work_needed' ? 
    calculateDetailedWorkCost(section, workType) : 0;
  
  return {
    sectionId: section.id,
    currentInspections: true,
    targetedInspections: true,
    seasonalInspections: true,
    specialSurveys: false,
    diagnostics: false,
    technicalState: {
      intensityCoefficient: section.detailedCondition.intensityCoefficient,
      strengthCoefficient: section.detailedCondition.strengthCoefficient,
      evennessCoefficient: section.detailedCondition.evennessCoefficient,
      rutCoefficient: section.detailedCondition.rutCoefficient,
      frictionCoefficient: section.detailedCondition.frictionCoefficient
    },
    comparisonResults: {
      intensityCompliant: section.detailedCondition.intensityCoefficient >= 1.0,
      strengthCompliant: section.detailedCondition.strengthCoefficient >= 
        (MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85),
      evennessCompliant: section.detailedCondition.evennessCoefficient >= 1.0,
      rutCompliant: section.detailedCondition.rutCoefficient >= 1.0,
      frictionCompliant: section.detailedCondition.frictionCoefficient >= 1.0
    },
    recommendedWorkType: workType,
    estimatedCost,
    priority: 1,
    rankingCriteria: 'проста оцінка'
  };
}

// ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================

export function checkCategoryComplianceByIntensity(section: RoadSection): {
  isCompliant: boolean;
  recommendedCategory?: number;
  maxAllowedIntensity: number;
} {
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
  const isCompliant = section.trafficIntensity <= maxDesignIntensity;
  
  let recommendedCategory: number | undefined;
  
  if (!isCompliant) {
    for (const [category, maxIntensity] of Object.entries(MAX_DESIGN_INTENSITY_BY_CATEGORY)) {
      if (section.trafficIntensity <= maxIntensity) {
        recommendedCategory = parseInt(category);
        break;
      }
    }
  }
  
  return {
    isCompliant,
    recommendedCategory,
    maxAllowedIntensity: maxDesignIntensity
  };
}

export function checkFrictionCompliance(frictionCoefficient: number): {
  isCompliant: boolean;
  actualValue: number;
  requiredValue: number;
  deficit: number;
} {
  const actualValue = frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
  const isCompliant = actualValue >= REQUIRED_FRICTION_COEFFICIENT;
  const deficit = isCompliant ? 0 : REQUIRED_FRICTION_COEFFICIENT - actualValue;
  
  return {
    isCompliant,
    actualValue,
    requiredValue: REQUIRED_FRICTION_COEFFICIENT,
    deficit
  };
}

export function getBudgetStatistics(): {
  totalBudget: number;
  q1Budget: number;
  q2Budget: number;
  allocation: BudgetAllocation | null;
  hasData: boolean;
} {
  const budgetData = getBlockOneBudgetData();
  
  if (!budgetData) {
    return {
      totalBudget: 0,
      q1Budget: 0,
      q2Budget: 0,
      allocation: null,
      hasData: false
    };
  }
  
  return {
    totalBudget: budgetData.totalBudget,
    q1Budget: budgetData.q1Value,
    q2Budget: budgetData.q2Value,
    allocation: getBudgetAllocation(),
    hasData: true
  };
}

export function generateDetailedRepairPlanReport(): string {
  if (!hasBlockOneBudgetData()) {
    return 'ПОМИЛКА: Немає даних з Блоку 1';
  }
  
  const budgetData = getBlockOneBudgetData()!;
  const allocation = getBudgetAllocation()!;
  
  let report = '# ДЕТАЛЬНИЙ ЗВІТ ПРО ПЛАНУВАННЯ РОБІТ (РОЗДІЛИ IV ТА V)\n\n';
  
  report += '## ДАНІ З БЛОКУ 1\n';
  report += `- Сесія: ${budgetData.sessionId}\n`;
  report += `- Дата: ${budgetData.timestamp.toLocaleString('uk-UA')}\n`;
  report += `- Q₁: ${budgetData.q1Value.toLocaleString()} тис. грн\n`;
  report += `- Q₂: ${budgetData.q2Value.toLocaleString()} тис. грн\n`;
  report += `- Загальний бюджет: ${budgetData.totalBudget.toLocaleString()} тис. грн\n\n`;
  
  report += '## РОЗПОДІЛ БЮДЖЕТУ\n';
  report += `- Поточний ремонт: ${allocation.currentRepair.toLocaleString()} тис. грн\n`;
  report += `- Капітальний ремонт: ${allocation.capitalRepair.toLocaleString()} тис. грн\n`;
  report += `- Реконструкція: ${allocation.reconstruction.toLocaleString()} тис. грн\n`;
  report += `- Нове будівництво: ${allocation.newConstruction.toLocaleString()} тис. грн\n`;
  report += `- Резерв: ${allocation.reserve.toLocaleString()} тис. грн\n\n`;
  
  return report;
}

// ==================== ЕКСПОРТ ====================

export default {
  // Інтеграція з Блоком 1
  setBlockOneBudgetData,
  getBlockOneBudgetData,
  hasBlockOneBudgetData,
  clearBlockOneBudgetData,
  getBudgetAllocation,
  setBudgetAllocation,
  getBudgetStatistics,
  
  // Розділ IV - Ремонти
  executeComprehensiveAssessment,
  assessLocalRoadSection,
  performLocalRoadRanking,
  determineWorkTypeByExpertMethod,
  determineWorkTypeByTechnicalCondition,
  calculateDetailedWorkCost,
  performDetailedCostBenefitAnalysis,
  
  // Розділ V - Нове будівництво
  planNewConstruction,
  
  // Головна функція
  planRepairWorksWithBlockOneData,
  
  // Перевірочні функції
  checkCategoryComplianceByIntensity,
  checkFrictionCompliance,
  
  // Звітність
  generateDetailedRepairPlanReport,
  
  // Константи
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  BASE_REPAIR_COSTS,
  BASE_CONSTRUCTION_COSTS,
  ROAD_QUALITY_LEVELS,
  EXPERT_ASSESSMENT_THRESHOLDS,
  REQUIRED_FRICTION_COEFFICIENT
};