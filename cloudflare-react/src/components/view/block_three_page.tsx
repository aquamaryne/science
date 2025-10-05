import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { FileUpIcon, PlusIcon, EditIcon, SaveIcon, TrashIcon, ArrowRightIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, AlertTriangleIcon, CalculatorIcon, FileSpreadsheet, InfoIcon, DollarSign, TrendingUpIcon, Download, RotateCcwIcon, RefreshCw, DownloadIcon, AlertTriangle, Calculator, TrendingUp, ArrowRight, ArrowLeft, X, XIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from '../ui/progress';
import { type RoadSection } from '@/modules/block_three_alghoritm';
import { planRepairWorksWithBlockOneData, generateDetailedRepairPlanReport, hasBlockOneBudgetData, getBlockOneBudgetData, setBlockOneBudgetData, type RepairProject } from '@/modules/block_three';
import { determineWorkTypeByTechnicalCondition } from '@/modules/block_three';
import { type SimpleRoadSection } from '@/modules/block_three';
import { 
  type RoadSection as AlgorithmRoadSection,
} from '@/modules/block_three_alghoritm';
import RoadEfficiencyInterface from './page';
import { CheckIcon } from '@radix-ui/react-icons';
// Используємо константи локально, оскільки вони не експортуються
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

const DEFAULT_COST_STANDARDS: CostStandards = {
  reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 },
  capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
  current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 }
};

const MARKET_COST_RANGES = {
  reconstruction: { 1: [50, 70], 2: [40, 60], 3: [30, 40], 4: [22, 35], 5: [18, 28] },
  capital_repair: { 1: [15, 22], 2: [12, 18], 3: [9, 15], 4: [7, 12], 5: [5, 9] },
  current_repair: { 1: [2.5, 4.5], 2: [2, 3.5], 3: [1.2, 2.5], 4: [0.8, 1.8], 5: [0.6, 1.2] }
};

interface RankingResult {
  rank: number;
  sectionId: string;
  sectionName: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  workType: string;
  estimatedCost: number;
  enpv: number;
  eirr: number;
  bcr: number;
  priority: number;
  isSelected: boolean;
}

interface BudgetPlanningResult {
  currentRepairProjects: RepairProject[];
  capitalRepairProjects: RepairProject[];
  reconstructionProjects: RepairProject[];
  totalCost: number;
  budgetUtilization: number;
  budgetBreakdown: {
    currentRepairUsed: number;
    capitalRepairUsed: number;
    reconstructionUsed: number;
    reserveRemaining: number;
  };
  blockOneBudgetInfo: any;
  complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}>;
}

function calculateDetailedEconomicAnalysis(
  section: AlgorithmRoadSection,
  assessment: any,
  discountRate: number = 0.05,
  analysisYears: number = 20
): EconomicAnalysisResult {
  const projectCost = assessment.estimatedCost; // тыс. грн
  const yearlyData: YearlyData[] = [];
  
  // Расчет годовых выгод на основе CBA из модуля
  const cba = assessment.costBenefitAnalysis;
  let annualBenefits: number;
  
  if (cba && cba.totalBenefits > 0) {
    annualBenefits = cba.totalBenefits / analysisYears;
  } else {
    // Упрощенный расчет выгод если нет CBA
    const annualTrafficVolume = section.trafficIntensity * 365 * section.length;
    const benefitRate = assessment.recommendedWorkType === 'reconstruction' ? 0.002 : 0.0015; // 0.2% или 0.15%
    annualBenefits = annualTrafficVolume * benefitRate * 100; // примерная ставка выгод
  }
  
  let cumulativeENPV = 0;
  let totalDiscountedBenefits = 0;
  let totalDiscountedCosts = 0;
  
  for (let year = 1; year <= analysisYears; year++) {
    const actualYear = 2024 + year;
    const discountFactor = Math.pow(1 + discountRate, -year);
    
    // Капитальные затраты только в первый год
    const capitalCost = year === 1 ? projectCost : 0;
    
    // Операционные затраты начиная со второго года
    const operationalCost = year >= 2 ? (projectCost * 0.03) : 0; // 3% от капитальных затрат
    
    const totalCosts = capitalCost + operationalCost;
    
    // Экономический эффект начинается со второго года
    const economicEffect = year >= 2 ? annualBenefits : 0;
    
    // Чистый денежный поток
    const netCashFlow = economicEffect - totalCosts;
    
    // Дисконтированные значения
    const discountedCashFlow = netCashFlow * discountFactor;
    const discountedBenefits = economicEffect * discountFactor;
    const discountedCosts = totalCosts * discountFactor;
    
    // Накопительный ENPV
    cumulativeENPV += discountedCashFlow;
    totalDiscountedBenefits += discountedBenefits;
    totalDiscountedCosts += discountedCosts;
    
    yearlyData.push({
      year: actualYear,
      capitalCost,
      operationalCost,
      totalCosts,
      economicEffect,
      netCashFlow,
      discountFactor,
      discountedCashFlow,
      enpv: cumulativeENPV,
      discountedBenefits,
      discountedCosts
    });
  }
  
  
  // Расчет итоговых показателей
  const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;
  
  // Упрощенный расчет EIRR
  let eirr = discountRate;
  for (let rate = 0.01; rate <= 1.0; rate += 0.001) {
    let npv = 0;
    for (let year = 1; year <= analysisYears; year++) {
      const yearData = yearlyData[year - 1];
      npv += yearData.netCashFlow / Math.pow(1 + rate, year);
    }
    if (Math.abs(npv) < 1000) {
      eirr = rate;
      break;
    }
  }
  
  // Дисконтированный период окупности
  let dpp = analysisYears;
  let cumulativeDiscountedCashFlow = 0;
  for (let i = 0; i < yearlyData.length; i++) {
    cumulativeDiscountedCashFlow += yearlyData[i].discountedCashFlow;
    if (cumulativeDiscountedCashFlow >= 0) {
      dpp = i + 1;
      break;
    }
  }
  
  // Средняя ставка доходности
  const arr = totalDiscountedCosts > 0 ? (totalDiscountedBenefits - totalDiscountedCosts) / totalDiscountedCosts : 0;
  
  return {
    sectionId: section.id,
    sectionName: section.name,
    totalENPV: cumulativeENPV,
    bcr,
    eirr,
    yearlyData,
    summary: {
      totalDiscountedBenefits,
      totalDiscountedCosts,
      npv: cumulativeENPV,
      dpp,
      arr
    }
  };
}

const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};
// ==================== ТИПИ ДЛЯ UI ====================
export interface RoadSectionUI {
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
  
  // Додаткові поля для розрахунків
  region?: string;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  hasLighting?: boolean;
  criticalInfrastructureCount?: number;
  estimatedCost?: number; // Додано поле для вартості

  // Додано для розрахунків коефіцієнтів та відповідності
  intensityCoeff?: number;
  strengthCoeff?: number;
  evennessCoeff?: number;
  rutCoeff?: number;
  frictionFactorCoeff?: number;
  categoryCompliant?: boolean;
  strengthCompliant?: boolean;
  evennessCompliant?: boolean;
  rutCompliant?: boolean;
  frictionCompliant?: boolean;
  workTypeRaw?: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  workType?: string;
};

interface CostStandards {
  reconstruction: Record<number, number>;
  capital_repair: Record<number, number>;
  current_repair: Record<number, number>;
}

interface CostAnalytics {
  averageCostByCategory: Record<number, number>;
  averageCostByWorkType: Record<string, number>;
  totalRange: { min: number; max: number };
  recommendations: string[];
}

// ==================== КОНСТАНТИ ====================
const CATEGORIES = {
  1: { name: 'I категорія', maxIntensity: 20000, minStrength: 1.0, description: 'Автомагістралі' },
  2: { name: 'II категорія', maxIntensity: 12000, minStrength: 1.0, description: 'Швидкісні дороги' },
  3: { name: 'III категорія', maxIntensity: 6000, minStrength: 0.95, description: 'Основні дороги' },
  4: { name: 'IV категорія', maxIntensity: 2000, minStrength: 0.90, description: 'Регіональні дороги' },
  5: { name: 'V категорія', maxIntensity: 500, minStrength: 0.85, description: 'Місцеві дороги' }
};

// ==================== ФУНКЦІЇ КОНВЕРТАЦІЇ ====================
interface Props {
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
  onBack: () => void;
}
// Простий розрахунок вартості
const calculateEstimatedCost = (
  section: RoadSectionUI, 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed'
): number => {
  if (workType === 'no_work_needed') return 0;
  
  // Базові ставки вартості (млн грн/км)
  const costRates = {
    current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 },
    capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
    reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 }
  };
  
  const baseRate = costRates[workType][section.category] || 0;
  let totalCost = baseRate * section.length;
  
  // Поправочні коефіцієнти
  if (section.isInternationalRoad) totalCost *= 1.15;
  if (section.isDefenseRoad) totalCost *= 1.10;
  if (section.hasLighting) totalCost *= 1.05;
  
  return totalCost; // в млн грн
};

// Конвертація у SimpleRoadSection для роботи з модулем
const convertToSimpleRoadSection = (section: RoadSectionUI): SimpleRoadSection => {
  const technicalCondition = {
    intensityCoefficient: MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] / Math.max(section.trafficIntensity, 1),
    strengthCoefficient: section.strengthModulus / (300 + section.category * 50),
    evennessCoefficient: (2.7 + section.category * 0.4) / Math.max(section.roughnessProfile, 0.1),
    rutCoefficient: (15 + section.category * 5) / Math.max(section.rutDepth, 1),
    frictionCoefficient: section.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT
  };

  return {
    id: section.id,
    name: section.name,
    category: section.category,
    length: section.length,
    significance: section.significance,
    technicalCondition,
    trafficIntensity: section.trafficIntensity,
    estimatedCost: section.estimatedCost
  };
};

// Розрахунок всіх коефіцієнтів згідно методики 4.2.2.1-4.2.2.5
const calculateCoefficients = (section: RoadSectionUI): RoadSectionUI => {
  const category = CATEGORIES[section.category];
  if (!category) return section;
  
  // 4.2.2.1 - Коефіцієнт інтенсивності руху
  const intensityCoeff = Number((category.maxIntensity / Math.max(section.trafficIntensity, 1)).toFixed(3));
  
  // 4.2.2.2 - Коефіцієнт запасу міцності дорожнього одягу
  const requiredStrengthModulus = 300 + section.category * 50; // Спрощена формула
  const strengthCoeff = Number((section.strengthModulus / requiredStrengthModulus).toFixed(3));
  
  // 4.2.2.3 - Коефіцієнт рівності
  const maxAllowedRoughness = 2.7 + section.category * 0.4; // Згідно з таблицею 9.1-9.3
  const evennessCoeff = Number((maxAllowedRoughness / Math.max(section.roughnessProfile, 0.1)).toFixed(3));
  
  // 4.2.2.4 - Коефіцієнт колійності
  const maxAllowedRutDepth = 15 + section.category * 5; // мм
  const rutCoeff = Number((maxAllowedRutDepth / Math.max(section.rutDepth, 1)).toFixed(3));
  
  // 4.2.2.5 - Коефіцієнт зчеплення
  const frictionFactorCoeff = Number((section.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT).toFixed(3));
  
  // Перевірки відповідності нормативам
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

// Визначення виду робіт згідно методики 4.2.3.1-4.2.3.5
const determineWorkType = (section: RoadSectionUI): RoadSectionUI => {
  const simpleSection = convertToSimpleRoadSection(section);
  const workTypeRaw = determineWorkTypeByTechnicalCondition(simpleSection);
  
  const workTypeDisplayMap = {
    'current_repair': 'Поточний ремонт',
    'capital_repair': 'Капітальний ремонт',
    'reconstruction': 'Реконструкція', 
    'no_work_needed': 'Не потрібно'
  };
  
  return {
    ...section,
    workTypeRaw,
    workType: workTypeDisplayMap[workTypeRaw]
  };
};

const calculateCostAnalytics = (costStandards: CostStandards): CostAnalytics => {
  const allCosts: any = [];
  
  // Збираємо всі значення для аналізу
  Object.values(costStandards).forEach(categoryData => {
    Object.values(categoryData).forEach(cost => allCosts.push(cost));
  });
  
  const averageCostByCategory: Record<number, number> = {};
  [1, 2, 3, 4, 5].forEach(cat => {
    const costs = [
      costStandards.reconstruction[cat],
      costStandards.capital_repair[cat],
      costStandards.current_repair[cat]
    ];
    averageCostByCategory[cat] = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  });
  
  const averageCostByWorkType = {
    'Реконструкція': Object.values(costStandards.reconstruction).reduce((sum, cost) => sum + cost, 0) / 5,
    'Капітальний ремонт': Object.values(costStandards.capital_repair).reduce((sum, cost) => sum + cost, 0) / 5,
    'Поточний ремонт': Object.values(costStandards.current_repair).reduce((sum, cost) => sum + cost, 0) / 5
  };
  
  const recommendations = [];
  
  // Аналіз і рекомендації
  if (averageCostByWorkType['Реконструкція'] / averageCostByWorkType['Капітальний ремонт'] < 2.5) {
    recommendations.push('Співвідношення вартості реконструкції до капремонту занадто мале');
  }
  
  if (costStandards.current_repair[1] / costStandards.current_repair[5] < 3) {
    recommendations.push('Різниця в вартості поточного ремонту між категоріями може бути збільшена');
  }
  
  return {
    averageCostByCategory,
    averageCostByWorkType,
    totalRange: { min: Math.min(...allCosts), max: Math.max(...allCosts) },
    recommendations
  };
};

// Перевірка відповідності ринковим діапазонам
// Діапазони ринкових вартостей (млн грн/км) для кожного виду робіт та категорії

const isWithinMarketRange = (workType: keyof CostStandards, category: number, value: number): boolean => {
  const range = MARKET_COST_RANGES[workType][category as keyof typeof MARKET_COST_RANGES[typeof workType]];
  return value >= range[0] && value <= range[1];
};

function calculateAllTechnicalCoefficients(section: RoadSectionData) {
  const condition = section.detailedCondition;
  
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
  const intensityCoefficient = maxDesignIntensity / Math.max(section.trafficIntensity, 1);
  
  const strengthCoefficient = condition.strengthCoefficient;
  const evennessCoefficient = condition.evennessCoefficient;
  const rutCoefficient = condition.maxAllowedRutDepth / Math.max(condition.actualRutDepth, 1);
  const frictionCoefficient = condition.actualFrictionValue / condition.requiredFrictionValue;
  
  return {
    intensityCoefficient,
    strengthCoefficient,
    evennessCoefficient,
    rutCoefficient,
    frictionCoefficient
  };
}

function compareWithNormativeValues(section: RoadSectionData, technicalState: any) {
  const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category];
  
  return {
    intensityCompliant: technicalState.intensityCoefficient >= 1.0,
    strengthCompliant: technicalState.strengthCoefficient >= minStrength,
    evennessCompliant: technicalState.evennessCoefficient >= 1.0,
    rutCompliant: technicalState.rutCoefficient >= 1.0,
    frictionCompliant: technicalState.frictionCoefficient >= 1.0
  };
}

const BASE_REPAIR_COSTS: Record<'current_repair' | 'capital_repair' | 'reconstruction', Record<1 | 2 | 3 | 4 | 5, number>> = {
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

const convertUIToAlgorithmRoadSection = (uiSection: RoadSectionUI): AlgorithmRoadSection => {
  const detailedCondition: DetailedTechnicalCondition = {
    intensityCoefficient: MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category] / Math.max(uiSection.trafficIntensity, 1),
    maxDesignIntensity: MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category],
    actualIntensity: uiSection.trafficIntensity,
    
    strengthCoefficient: uiSection.strengthModulus / (300 + uiSection.category * 50),
    isRigidPavement: false,
    actualElasticModulus: uiSection.strengthModulus,
    requiredElasticModulus: 300 + uiSection.category * 50,
    
    evennessCoefficient: (2.7 + uiSection.category * 0.4) / Math.max(uiSection.roughnessProfile, 0.1),
    iriIndex: uiSection.roughnessProfile,
    bumpIndex: uiSection.roughnessBump,
    maxAllowedEvenness: 2.7 + uiSection.category * 0.4,
    
    rutCoefficient: (15 + uiSection.category * 5) / Math.max(uiSection.rutDepth, 1),
    actualRutDepth: uiSection.rutDepth,
    maxAllowedRutDepth: 15 + uiSection.category * 5,
    
    frictionCoefficient: uiSection.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT,
    actualFrictionValue: uiSection.frictionCoeff,
    requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
  };

  return {
    id: uiSection.id,
    name: uiSection.name,
    category: uiSection.category,
    length: uiSection.length,
    significance: uiSection.significance,
    region: uiSection.region || 'Київська',
    detailedCondition,
    trafficIntensity: uiSection.trafficIntensity,
    estimatedCost: uiSection.estimatedCost,
    isDefenseRoad: uiSection.isDefenseRoad,
    isInternationalRoad: uiSection.isInternationalRoad,
    isEuropeanNetwork: uiSection.isEuropeanNetwork,
    hasLighting: uiSection.hasLighting,
    criticalInfrastructureCount: uiSection.criticalInfrastructureCount,
    enpv: 0
  };
};

function calculateDetailedWorkCost(section: RoadSectionData, workType: 'current_repair' | 'capital_repair' | 'reconstruction'): number {
  const baseCost = BASE_REPAIR_COSTS[workType][section.category];
  let totalCost = baseCost * section.length;
  
  let corrections = 1.0;
  
  if (section.isInternationalRoad || section.isEuropeanNetwork) {
    corrections *= 1.15;
  }
  
  if (section.isDefenseRoad) {
    corrections *= 1.10;
  }
  
  if (section.hasLighting) corrections *= 1.05;
  if (section.nearBorderCrossing) corrections *= 1.08;
  if (section.criticalInfrastructureCount && section.criticalInfrastructureCount > 0) {
    corrections *= (1.0 + section.criticalInfrastructureCount * 0.02);
  }
  
  const regionalFactor = getRegionalCostFactor(section.region);
  corrections *= regionalFactor;
  
  totalCost *= corrections;
  
  return Math.round(totalCost);
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

function performCostBenefitAnalysis(section: RoadSectionData, projectCost: number): CostBenefitAnalysis {
  const discountRate = 0.05;
  const analysisYears = 15;
  const annualTrafficVolume = section.trafficIntensity * 365 * section.length;
  
  const vehicleFleetReduction = annualTrafficVolume * 0.15 * 0.5;
  const transportCostSavings = annualTrafficVolume * 0.5;
  const accidentReduction = annualTrafficVolume * 0.8 / 1000000 * 750000;
  const environmentalBenefits = annualTrafficVolume * 0.05;
  
  const totalAnnualBenefits = vehicleFleetReduction + transportCostSavings + accidentReduction + environmentalBenefits;
  
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
  const paybackPeriod = totalAnnualBenefits > 0 ? projectCost / totalAnnualBenefits : 999;
  
  return {
    enpv,
    eirr,
    bcr,
    paybackPeriod,
    totalBenefits: totalDiscountedBenefits,
    totalCosts: totalDiscountedCosts,
    vehicleFleetReduction,
    transportCostSavings,
    accidentReduction,
    environmentalBenefits
  };
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

function executeComprehensiveAssessment(section: RoadSectionData): ComprehensiveAssessment {
  const technicalState = calculateAllTechnicalCoefficients(section);
  const comparisonResults = compareWithNormativeValues(section, technicalState);
  // Map RoadSectionData to RoadSectionUI before calling determineWorkType
  const sectionUI: RoadSectionUI = {
    id: section.id,
    name: section.name,
    length: section.length,
    category: section.category,
    trafficIntensity: section.trafficIntensity,
    strengthModulus: section.detailedCondition?.actualElasticModulus ?? section.detailedCondition?.strengthCoefficient ?? 300,
    roughnessProfile: section.detailedCondition?.iriIndex ?? 3.5,
    roughnessBump: section.detailedCondition?.bumpIndex ?? 150,
    rutDepth: section.detailedCondition?.actualRutDepth ?? 25,
    frictionCoeff: section.detailedCondition?.actualFrictionValue ?? 0.35,
    significance: section.significance,
    region: section.region,
    isDefenseRoad: section.isDefenseRoad,
    isInternationalRoad: section.isInternationalRoad,
    isEuropeanNetwork: section.isEuropeanNetwork,
    hasLighting: section.hasLighting,
    criticalInfrastructureCount: section.criticalInfrastructureCount,
    estimatedCost: section.estimatedCost
  };
  const workTypeSection = determineWorkType(sectionUI);
  const workTypeRaw = workTypeSection.workTypeRaw;
  
  let estimatedCost = 0;
  let costBenefitAnalysis: CostBenefitAnalysis | undefined;
  
  if (workTypeRaw !== 'no_work_needed') {
    estimatedCost = calculateDetailedWorkCost(section, workTypeRaw as 'current_repair' | 'capital_repair' | 'reconstruction');
    
    if (workTypeRaw === 'capital_repair' || workTypeRaw === 'reconstruction') {
      costBenefitAnalysis = performCostBenefitAnalysis(section, estimatedCost);
    }
  }
  
  const priority = Math.floor(Math.random() * 100) + 1; // Simplified priority calculation
  
  return {
    sectionId: section.id,
    recommendedWorkType: workTypeRaw ?? 'no_work_needed',
    estimatedCost,
    priority,
    rankingCriteria: `Технічний стан: ${Object.values(comparisonResults).filter(Boolean).length}/5 показників`,
    costBenefitAnalysis,
    technicalState,
    comparisonResults
  };
}

// ==================== ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ ====================

function createTestRoadSection(id: string, name: string, category: 1 | 2 | 3 | 4 | 5, length: number, trafficIntensity: number, region: string = 'Київська'): RoadSectionData {
  const detailedCondition: DetailedTechnicalCondition = {
    intensityCoefficient: MAX_DESIGN_INTENSITY_BY_CATEGORY[category] / Math.max(trafficIntensity, 1),
    maxDesignIntensity: MAX_DESIGN_INTENSITY_BY_CATEGORY[category],
    actualIntensity: trafficIntensity,
    strengthCoefficient: 0.8 + Math.random() * 0.4,
    isRigidPavement: Math.random() > 0.8,
    evennessCoefficient: 0.7 + Math.random() * 0.6,
    iriIndex: 2.5 + Math.random() * 2.0,
    maxAllowedEvenness: category <= 2 ? 3.1 : 4.1,
    rutCoefficient: 0.6 + Math.random() * 0.8,
    actualRutDepth: 15 + Math.random() * 25,
    maxAllowedRutDepth: category <= 2 ? 20 : 30,
    frictionCoefficient: 0.8 + Math.random() * 0.4,
    actualFrictionValue: 0.25 + Math.random() * 0.2,
    requiredFrictionValue: 0.35,
    
  };
  
  return {
    id,
    name,
    category,
    length,
    significance: category <= 3 ? 'state' : 'local',
    region,
    detailedCondition,
    trafficIntensity,
    isDefenseRoad: Math.random() > 0.9,
    isInternationalRoad: category <= 2 && Math.random() > 0.7,
    isEuropeanNetwork: category === 1 && Math.random() > 0.8,
    hasLighting: trafficIntensity > 5000 && Math.random() > 0.5,
    nearBorderCrossing: Math.random() > 0.95,
    criticalInfrastructureCount: Math.floor(Math.random() * 3),
  };
}

interface DetailedTechnicalCondition {
  intensityCoefficient: number;
  maxDesignIntensity: number;
  actualIntensity: number;
  strengthCoefficient: number;
  isRigidPavement: boolean;
  actualElasticModulus?: number;
  requiredElasticModulus?: number;
  evennessCoefficient: number;
  iriIndex?: number;
  bumpIndex?: number;
  maxAllowedEvenness: number;
  rutCoefficient: number;
  actualRutDepth: number;
  maxAllowedRutDepth: number;
  frictionCoefficient: number;
  actualFrictionValue: number;
  requiredFrictionValue: number;
}

export interface RoadSectionData {
  id: string;
  name: string;
  category: 1 | 2 | 3 | 4 | 5;
  length: number;
  significance: 'state' | 'local';
  region: string;
  detailedCondition: DetailedTechnicalCondition;
  trafficIntensity: number;
  estimatedCost?: number;
  workType?: string;
  priority?: number;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  hasLighting?: boolean;
  nearBorderCrossing?: boolean;
  criticalInfrastructureCount?: number;
  enpv?: number;
}

interface CostBenefitAnalysis {
  enpv: number;
  eirr: number;
  bcr: number;
  paybackPeriod: number;
  totalBenefits: number;
  totalCosts: number;
  vehicleFleetReduction: number;
  transportCostSavings: number;
  accidentReduction: number;
  environmentalBenefits: number;
}

interface ComprehensiveAssessment {
  sectionId: string;
  recommendedWorkType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  estimatedCost: number;
  priority: number;
  rankingCriteria: string;
  costBenefitAnalysis?: CostBenefitAnalysis;
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
}


interface YearlyData {
  year: number;
  capitalCost: number; // Витратна капітальний, поточний ремонт і утримання
  operationalCost: number; // експлуатаційне утримання
  totalCosts: number; // Всього
  economicEffect: number; // Економічний ефект (чистий)
  netCashFlow: number; // Чистий сальдований дохід (NCF)
  discountFactor: number; // Коефіцієнт дисконтування
  discountedCashFlow: number; // Дисконтований сальдований дохід
  enpv: number; // Економічна чиста приведена вартість ENPV
  discountedBenefits: number; // Диск вигоди
  discountedCosts: number; // Диск витрати
}

interface EconomicAnalysisResult {
  sectionId: string;
  sectionName: string;
  totalENPV: number;
  bcr: number;
  eirr: number;
  yearlyData: YearlyData[];
  summary: {
    totalDiscountedBenefits: number;
    totalDiscountedCosts: number;
    npv: number;
    dpp: number; // Дисконтований період окупності
    arr: number; // Середня ставка доходу
  };
}

//Page2
const Page1_Coefficients: React.FC<Props> = ({ 
  sections, 
  onSectionsChange, 
  onNext, 
  onBack 
}) => {
  const [calculatedSections, setCalculatedSections] = useState<RoadSectionUI[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempSections, setTempSections] = useState<RoadSectionUI[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [calculationSummary, setCalculationSummary] = useState<{
    total: number;
    needsRepair: number;
    currentRepair: number;
    capitalRepair: number;
    reconstruction: number;
    compliant: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);

  console.log('Page1_Coefficients rendered with sections:', sections.length);

  // Мемоизация проверки готовности данных
  const hasCalculatedData = React.useMemo(() => {
    return sections.length > 0 && sections.every(section => 
      section.intensityCoeff !== undefined &&
      section.strengthCoeff !== undefined &&
      section.evennessCoeff !== undefined &&
      section.rutCoeff !== undefined &&
      section.frictionFactorCoeff !== undefined &&
      section.workType !== undefined &&
      section.estimatedCost !== undefined
    );
  }, [sections]);

  // Мемоизация сводной статистики
  const calculateSummary = React.useCallback((sectionsData: RoadSectionUI[]) => {
    const summary = {
      total: sectionsData.length,
      needsRepair: 0,
      currentRepair: 0,
      capitalRepair: 0,
      reconstruction: 0,
      compliant: 0
    };

    // Одним проходом считаем все метрики
    sectionsData.forEach(s => {
      const workType = s.workTypeRaw;
      if (workType === 'current_repair') summary.currentRepair++;
      else if (workType === 'capital_repair') summary.capitalRepair++;
      else if (workType === 'reconstruction') summary.reconstruction++;
      else if (workType === 'no_work_needed') summary.compliant++;
      
      if (workType !== 'no_work_needed') summary.needsRepair++;
    });

    setCalculationSummary(summary);
  }, []);

  // Оптимизированная валидация с ранним выходом
  const validateSections = React.useCallback((sectionsToValidate: RoadSectionUI[]): string[] => {
    const errors: string[] = [];
    const maxErrors = 10; // Ограничиваем количество ошибок
    
    for (let i = 0; i < sectionsToValidate.length && errors.length < maxErrors; i++) {
      const section = sectionsToValidate[i];
      
      if (!section.name?.trim()) {
        errors.push(`Секція ${i + 1}: відсутнє найменування`);
      }
      
      if (!section.length || section.length <= 0) {
        errors.push(`Секція ${i + 1}: некоректна протяжність`);
      }
      
      // Проверяем коэффициенты только если они определены
      const coeffs = [
        { val: section.intensityCoeff, name: 'інтенсивності' },
        { val: section.strengthCoeff, name: 'міцності' },
        { val: section.evennessCoeff, name: 'рівності' },
        { val: section.rutCoeff, name: 'колійності' },
        { val: section.frictionFactorCoeff, name: 'зчеплення' },
        { val: section.estimatedCost, name: 'вартості' }
      ];
      
      for (const coeff of coeffs) {
        if (coeff.val !== undefined && (isNaN(coeff.val) || coeff.val < 0)) {
          errors.push(`Секція ${i + 1}: некоректний коефіцієнт ${coeff.name}`);
          break; // Не проверяем остальные коэффициенты для этой секции
        }
      }
    }
    
    if (errors.length >= maxErrors) {
      errors.push('... та інші помилки');
    }
    
    return errors;
  }, []);

  // Оптимизированная обработка одной секции
  const processSingleSection = React.useCallback((section: RoadSectionUI): RoadSectionUI => {
    try {
      // Шаг 1: Расчет коэффициентов (оптимизированный)
      const withCoeffs = calculateCoefficients(section);
      
      // Шаг 2: Определение типа работ
      const withWorkType = determineWorkType(withCoeffs);
      
      // Шаг 3: Расчет стоимости
      const estimatedCost = calculateEstimatedCost(withWorkType, withWorkType.workTypeRaw || 'no_work_needed');
      
      return {
        ...withWorkType,
        estimatedCost: estimatedCost
      };
    } catch (error) {
      console.error('Error processing section:', section.name, error);
      // Возвращаем секцию с базовыми значениями
      return {
        ...section,
        intensityCoeff: 1.0,
        strengthCoeff: 1.0,
        evennessCoeff: 1.0,
        rutCoeff: 1.0,
        frictionFactorCoeff: 1.0,
        workType: 'Не потрібно',
        workTypeRaw: 'no_work_needed' as const,
        estimatedCost: 0
      };
    }
  }, []);

  // Батчевая обработка с прогрессом
  const processBatch = React.useCallback(async (
    sectionsToProcess: RoadSectionUI[], 
    batchSize: number = 50
  ): Promise<RoadSectionUI[]> => {
    const results: RoadSectionUI[] = [];
    const totalBatches = Math.ceil(sectionsToProcess.length / batchSize);
    
    for (let i = 0; i < sectionsToProcess.length; i += batchSize) {
      const batch = sectionsToProcess.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      // Обрабатываем батч
      const batchResults = batch.map(processSingleSection);
      results.push(...batchResults);
      
      // Обновляем прогресс
      const progressPercent = Math.round((currentBatch / totalBatches) * 100);
      setProgress(progressPercent);
      
      // Даем браузеру передышку для больших батчей
      if (batch.length >= batchSize && currentBatch < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }, [processSingleSection]);

  // Оптимизированная основная функция расчета
  const handleCalculate = React.useCallback(async () => {
    if (sections.length === 0) return;
    
    setIsCalculating(true);
    setValidationErrors([]);
    setProgress(0);
    
    try {
      console.log(`Starting calculation for ${sections.length} sections`);
      const startTime = performance.now();
      
      // Определяем размер батча в зависимости от количества секций
      const batchSize = sections.length > 1000 ? 100 : sections.length > 500 ? 50 : 25;
      
      const updated = await processBatch(sections, batchSize);
      
      const endTime = performance.now();
      console.log(`Calculation completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      setCalculatedSections(updated);
      
      // Валидация и сохранение
      const errors = validateSections(updated);
      if (errors.length === 0) {
        onSectionsChange(updated);
        console.log('Sections automatically saved after calculation');
      } else {
        console.warn('Validation errors after calculation:', errors);
        setValidationErrors(errors);
      }
      
      calculateSummary(updated);
      
    } catch (error) {
      console.error('Calculation error:', error);
      setValidationErrors(['Помилка при розрахунку коефіцієнтів']);
    } finally {
      setIsCalculating(false);
      setProgress(0);
    }
  }, [sections, processBatch, validateSections, calculateSummary, onSectionsChange]);

  // Инициализация при получении новых данных
  React.useEffect(() => {
    if (sections.length > 0) {
      console.log('Received sections, checking if calculation needed...');
      
      if (hasCalculatedData) {
        console.log('Data already calculated, using existing');
        setCalculatedSections(sections);
        calculateSummary(sections);
      } else {
        console.log('Data needs calculation');
        handleCalculate();
      }
    } else {
      setCalculatedSections([]);
      setCalculationSummary(null);
    }
  }, [sections, hasCalculatedData, handleCalculate, calculateSummary]);

  // Функция сохранения с валидацией
  const handleSave = React.useCallback(() => {
    const sectionsToSave = tempSections.length > 0 ? tempSections : calculatedSections;
    const errors = validateSections(sectionsToSave);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      console.log('Saving sections:', sectionsToSave.length);
      onSectionsChange(sectionsToSave);
      setEditMode(false);
      setTempSections([]);
      
      // Уведомление об успешном сохранении
      const event = new CustomEvent('showNotification', { 
        detail: { message: 'Дані успішно збережено!', type: 'success' } 
      });
      window.dispatchEvent(event);
    } else {
      console.error('Validation errors:', errors);
    }
  }, [tempSections, calculatedSections, validateSections, onSectionsChange]);

  // Отмена изменений
  const handleCancel = React.useCallback(() => {
    setTempSections([]);
    setEditMode(false);
    setValidationErrors([]);
  }, []);

  // Вход в режим редактирования
  const handleEdit = React.useCallback(() => {
    setTempSections([...calculatedSections]);
    setEditMode(true);
    setValidationErrors([]);
  }, [calculatedSections]);

  // Мемоизированные функции для badge
  const getComplianceBadge = React.useMemo(() => 
    (value: number, threshold: number, isInverse: boolean = false) => {
      const isCompliant = isInverse ? value <= threshold : value >= threshold;
      return (
        <Badge variant={isCompliant ? "secondary" : "destructive"} className="gap-1">
          {value.toFixed(2)}
          {isCompliant ? (
            <CheckCircleIcon className="h-3 w-3" />
          ) : (
            <XCircleIcon className="h-3 w-3" />
          )}
        </Badge>
      );
    }, []
  );

  const getWorkTypeBadge = React.useMemo(() => 
    (workType: string) => {
      const variants = {
        'Не потрібно': { variant: 'secondary' as const, color: 'text-green-700' },
        'Поточний ремонт': { variant: 'default' as const, color: 'text-blue-700' },
        'Капітальний ремонт': { variant: 'destructive' as const, color: 'text-white' },
        'Реконструкція': { variant: 'outline' as const, color: 'text-white' }
      };
      
      const config = variants[workType as keyof typeof variants] || variants['Не потрібно'];
      return (
        <Badge variant={config.variant} className={`${config.color} font-medium`}>
          {workType}
        </Badge>
      );
    }, []
  );

  // Если нет данных для расчета
  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Немає даних для розрахунку</h3>
              <p className="text-gray-600 mb-4">Спочатку додайте секції доріг на попередній сторінці</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Повернутися до вводу даних
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displaySections = calculatedSections.length > 0 ? calculatedSections : sections;

  return (
    <div className='grid grid-cols-1 w-full px-6'>
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Визначення показників фактичного транспортно-експлуатаційного стану доріг</span>
            <div className="flex gap-2">
              <Button 
                onClick={handleCalculate} 
                variant="outline" 
                disabled={isCalculating || editMode}
                className="gap-2"
              >
                <CalculatorIcon className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
                {isCalculating ? `Розраховуємо... ${progress}%` : 'Перерахувати'}
              </Button>
              
              {!editMode ? (
                <>
                  <Button 
                    onClick={handleEdit} 
                    variant="outline"
                    disabled={isCalculating || displaySections.length === 0}
                    className="gap-2"
                  >
                    <EditIcon className="h-4 w-4" />
                    Редагувати
                  </Button>
                  
                  <Button 
                    onClick={handleSave} 
                    variant="default"
                    disabled={isCalculating || displaySections.length === 0}
                    className="gap-2"
                  >
                    <SaveIcon className="h-4 w-4" />
                    Зберегти
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleSave} 
                    variant="default"
                    disabled={isCalculating}
                    className="gap-2"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Зберегти зміни
                  </Button>
                  
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    disabled={isCalculating}
                    className="gap-2"
                  >
                    <XIcon className="h-4 w-4" />
                    Скасувати
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Прогресс бар для больших вычислений */}
          {isCalculating && sections.length > 100 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Обробка секцій...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Отображение ошибок валидации */}
          {validationErrors.length > 0 && (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Помилки валідації</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Сводная статистика */}
          {calculationSummary && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">{calculationSummary.total}</div>
                <div className="text-sm text-blue-600">Всього секцій</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-700">{calculationSummary.needsRepair}</div>
                <div className="text-sm text-red-600">Потребують ремонту</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-700">{calculationSummary.currentRepair}</div>
                <div className="text-sm text-yellow-600">Поточний ремонт</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-700">{calculationSummary.capitalRepair}</div>
                <div className="text-sm text-orange-600">Капітальний ремонт</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">{calculationSummary.compliant}</div>
                <div className="text-sm text-green-600">Не потрібно</div>
              </div>
            </div>
          )}

          {/* Виртуализированная таблица для больших данных */}
          {displaySections.length > 500 ? (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Велика кількість секцій ({displaySections.length}). Для кращої продуктивності показані перші 500 записів.
              </p>
            </div>
          ) : null}

          {/* Таблица с результатами */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="w-48">Найменування ділянки дороги</TableHead>
                  <TableHead rowSpan={2} className="w-24">Протяжність дороги (км)</TableHead>
                  <TableHead colSpan={5} className="text-center border-b">Коефіцієнти відповідності нормативам</TableHead>
                  <TableHead rowSpan={2} className="w-32">Вид робіт</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-28">Коефіцієнт інтенсивності руху</TableHead>
                  <TableHead className="w-28">Коефіцієнт запасу міцності нежорсткого дорожнього одягу</TableHead>
                  <TableHead className="w-28">Коефіцієнт рівності</TableHead>
                  <TableHead className="w-24">Коефіцієнт колійності</TableHead>
                  <TableHead className="w-24">Коефіцієнт зчеплення</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displaySections.slice(0, 500).map((section) => (
                  <TableRow key={section.id} className={isCalculating ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{section.name}</div>
                        <div className="text-xs text-gray-500">
                          {CATEGORIES[section.category]?.name} • {section.significance === 'state' ? 'Державна' : 'Місцева'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{section.length}</TableCell>
                    <TableCell className="text-center">
                      {section.intensityCoeff !== undefined ? (
                        <div className="space-y-1">
                          {getComplianceBadge(section.intensityCoeff, 1.0)}
                          <div className="text-xs text-gray-500">Норма: ≥ 1.0</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {section.strengthCoeff !== undefined ? (
                        <div className="space-y-1">
                          {getComplianceBadge(section.strengthCoeff, MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 1.0)}
                          <div className="text-xs text-gray-500">
                            Норма: ≥ {MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 1.0}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {section.evennessCoeff !== undefined ? (
                        <div className="space-y-1">
                          {getComplianceBadge(section.evennessCoeff, 1.0)}
                          <div className="text-xs text-gray-500">Норма: ≥ 1.0</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {section.rutCoeff !== undefined ? (
                        <div className="space-y-1">
                          {getComplianceBadge(section.rutCoeff, 1.0)}
                          <div className="text-xs text-gray-500">Норма: ≥ 1.0</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {section.frictionFactorCoeff !== undefined ? (
                        <div className="space-y-1">
                          {getComplianceBadge(section.frictionFactorCoeff, 1.0)}
                          <div className="text-xs text-gray-500">Норма: ≥ 1.0</div>
                        </div>
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {section.workType ? (
                        getWorkTypeBadge(section.workType)
                      ) : (
                        <div className="text-gray-400">—</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Информационная панель */}
          <Alert className="mt-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Коефіцієнти розраховуються за формулами:</div>
                    <ul className="space-y-1">
                      <li>• <strong>Інтенсивності:</strong> Nmax / Nфакт (п. 4.2.2.1)</li>
                      <li>• <strong>Міцності:</strong> Eфакт / Eпотр (п. 4.2.2.2)</li>
                      <li>• <strong>Рівності:</strong> IRImax / IRIфакт (п. 4.2.2.3)</li>
                      <li>• <strong>Колійності:</strong> hmax / hфакт (п. 4.2.2.4)</li>
                      <li>• <strong>Зчеплення:</strong> φфакт / φпотр (п. 4.2.2.5)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Правила призначення робіт:</div>
                    <ul className="space-y-1">
                      <li>• <span className="text-red-600 font-semibold">Реконструкція</span> - коеф. інтенсивності &lt; 1.0</li>
                      <li>• <span className="text-orange-600 font-semibold">Капітальний ремонт</span> - коеф. міцності &lt; мін. для категорії</li>
                      <li>• <span className="text-blue-600 font-semibold">Поточний ремонт</span> - коеф. рівності, колійності або зчеплення &lt; 1.0</li>
                      <li>• <span className="text-green-600 font-semibold">Не потрібно</span> - всі коефіцієнти відповідають нормам</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Навигационные кнопки */}
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext} disabled={displaySections.length === 0}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


//Page1 
const Page2_Component: React.FC<{
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
}> = ({ sections, onSectionsChange, onNext }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoadSectionUI | null>(null);
  const [calculatedResults, setCalculatedResults] = useState<Map<string, any>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedCalculateAllSections = React.useCallback(
    debounce(async () => {
      if (sections.length === 0) return;
      
      setIsCalculating(true);
      
      try {
        const results = new Map();
        
        // ИСПРАВЛЕНИЕ 2: Обрабатываем секции пакетами для предотвращения блокировки UI
        const batchSize = 5;
        for (let i = 0; i < sections.length; i += batchSize) {
          const batch = sections.slice(i, i + batchSize);
          
          // Обрабатываем пакет секций
          const batchPromises = batch.map(async (section) => {
            try {
              const metrics = await calculateSectionMetricsSafe(section);
              return { id: section.id, metrics };
            } catch (error) {
              console.warn(`Ошибка расчета для секции ${section.id}:`, error);
              return { 
                id: section.id, 
                metrics: getDefaultMetrics() 
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          // Добавляем результаты в Map
          batchResults.forEach(({ id, metrics }) => {
            results.set(id, metrics);
          });
          
          // ИСПРАВЛЕНИЕ 3: Добавляем небольшую задержку между пакетами
          if (i + batchSize < sections.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        setCalculatedResults(results);
        
      } catch (error) {
        console.error('Критическая ошибка при расчете:', error);
        alert('Ошибка при выполнении расчетов. Проверьте данные.');
      } finally {
        setIsCalculating(false);
      }
    }, 500), // Debounce на 500ms
    [sections]
  );
  
  // Генерація тестових даних
  const generateTestData = () => {
    const testSections: RoadSectionUI[] = [
      {
        id: 'test_1',
        name: 'М-01 Київ-Чернігів (км 15-45)',
        length: 30.0,
        category: 1 as 1,
        trafficIntensity: 18500,
        strengthModulus: 380,
        roughnessProfile: 2.9,
        roughnessBump: 95,
        rutDepth: 12,
        frictionCoeff: 0.42,
        significance: 'state',
        region: 'Київська',
        isDefenseRoad: true,
        isInternationalRoad: true
      },
      {
        id: 'test_2',
        name: 'Н-26 Бориспіль-Переяслав',
        length: 25.5,
        category: 2 as 2,
        trafficIntensity: 8200,
        strengthModulus: 320,
        roughnessProfile: 3.8,
        roughnessBump: 140,
        rutDepth: 28,
        frictionCoeff: 0.31,
        significance: 'state',
        region: 'Київська'
      },
      {
        id: 'test_3',
        name: 'Р-01 Львів-Стрий',
        length: 45.2,
        category: 3 as 3,
        trafficIntensity: 4200,
        strengthModulus: 280,
        roughnessProfile: 4.1,
        roughnessBump: 180,
        rutDepth: 35,
        frictionCoeff: 0.28,
        significance: 'local',
        region: 'Львівська'
      }
    ];
    
    onSectionsChange([...sections, ...testSections]);
  };

  const calculateSectionMetricsSafe = async (section: RoadSectionUI): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Таймаут на 5 секунд для каждой секции
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout при расчете секции ${section.id}`));
      }, 5000);

      try {
        // Выносим тяжелые вычисления в отдельную функцию
        const metrics = calculateSectionMetricsOptimized(section);
        clearTimeout(timeout);
        resolve(metrics);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  // Розрахунок показників для секції
  const calculateSectionMetricsOptimized = (section: RoadSectionUI) => {
    try {
      const category = CATEGORIES[section.category];
      if (!category) {
        throw new Error(`Неизвестная категория дороги: ${section.category}`);
      }
      
      // Защита от деления на ноль и некорректных значений
      const safeTrafficIntensity = Math.max(section.trafficIntensity || 1, 1);
      const safeRoughnessProfile = Math.max(section.roughnessProfile || 0.1, 0.1);
      const safeRutDepth = Math.max(section.rutDepth || 1, 1);
      const safeFrictionCoeff = Math.max(section.frictionCoeff || 0.01, 0.01);
      const safeStrengthModulus = Math.max(section.strengthModulus || 100, 100);
      
      // Коефіцієнти с защитой от некорректных значений
      const intensityCoeff = Number((category.maxIntensity / safeTrafficIntensity).toFixed(3));
      const strengthCoeff = Number((safeStrengthModulus / (300 + section.category * 50)).toFixed(3));
      const evennessCoeff = Number(((2.7 + section.category * 0.4) / safeRoughnessProfile).toFixed(3));
      const rutCoeff = Number(((15 + section.category * 5) / safeRutDepth).toFixed(3));
      const frictionCoeff = Number((safeFrictionCoeff / REQUIRED_FRICTION_COEFFICIENT).toFixed(3));
      
      // Быстрая проверка соответствия
      const categoryCompliance = intensityCoeff >= 1.0;
      const frictionCompliance = frictionCoeff >= 1.0;
      
      // Упрощенное определение типа работ
      let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
      
      if (intensityCoeff < 1.0) {
        workType = 'reconstruction';
      } else if (strengthCoeff < MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category]) {
        workType = 'capital_repair';
      } else if (evennessCoeff < 1.0 || rutCoeff < 1.0 || frictionCoeff < 1.0) {
        workType = 'current_repair';
      } else {
        workType = 'no_work_needed';
      }
      
      // Быстрый расчет стоимости
      const estimatedCost = calculateEstimatedCostFast(section, workType);
      
      return {
        intensityCoeff,
        strengthCoeff,
        evennessCoeff,
        rutCoeff,
        frictionCoeff,
        categoryCompliance,
        frictionCompliance,
        workType,
        estimatedCost
      };
      
    } catch (error) {
      console.error(`Ошибка в расчете метрик для секции ${section.id}:`, error);
      return getDefaultMetrics();
    }
  };

  const getDefaultMetrics = () => ({
    intensityCoeff: 1.0,
    strengthCoeff: 1.0,
    evennessCoeff: 1.0,
    rutCoeff: 1.0,
    frictionCoeff: 1.0,
    categoryCompliance: true,
    frictionCompliance: true,
    workType: 'no_work_needed',
    estimatedCost: 0
  });

  // ИСПРАВЛЕНИЕ 7: Упрощенный быстрый расчет стоимости
  const calculateEstimatedCostFast = (
    section: RoadSectionUI, 
    workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed'
  ): number => {
    if (workType === 'no_work_needed') return 0;
    
    // Упрощенные базовые ставки
    const costRates = {
      current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 },
      capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
      reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 }
    };
    
    const baseRate = costRates[workType][section.category] || 1.0;
    let totalCost = baseRate * (section.length || 1);
    
    // Простые поправочные коефіцієнти
    if (section.isInternationalRoad) totalCost *= 1.15;
    if (section.isDefenseRoad) totalCost *= 1.10;
    if (section.hasLighting) totalCost *= 1.05;
    
    return Number(totalCost.toFixed(2));
  };

  // ИСПРАВЛЕНИЕ 8: Оптимизированная функция debounce
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeout: NodeJS.Timeout;
    const debouncedFn = (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    
    debouncedFn.cancel = () => {
      clearTimeout(timeout);
    };
    
    return debouncedFn;
  }

  // Масовий розрахунок
  const calculateAllSections = () => {
    const results = new Map();
    sections.forEach(section => {
      const metrics = calculateSectionMetricsSafe(section);
      results.set(section.id, metrics);
    });
    setCalculatedResults(results);
  };

  const handleAdd = () => {
    const newSection: RoadSectionUI = {
      id: `section_${Date.now()}`,
      name: 'Нова ділянка',
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
    onSectionsChange([...sections, newSection]);
    setEditingId(newSection.id);
    setFormData(newSection);
  };

  const handleEdit = (section: RoadSectionUI) => {
    setEditingId(section.id);
    setFormData({ ...section });
  };

  const handleSave = () => {
    if (!formData) return;
    
    const updatedSections = sections.map(s => 
      s.id === formData.id ? formData : s
    );
    onSectionsChange(updatedSections);
    setEditingId(null);
    setFormData(null);
    
    // Перерахунок після збереження
    setTimeout(calculateAllSections, 100);
  };

  const handleDelete = (id: string) => {
    onSectionsChange(sections.filter(s => s.id !== id));
    calculatedResults.delete(id);
    setCalculatedResults(new Map(calculatedResults));
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Парсинг даних з Excel (пропускаємо заголовки)
        const importedSections: RoadSectionUI[] = [];
        for (let i = 2; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row[0]) {
            importedSections.push({
              id: `imported_${Date.now()}_${i}`,
              name: row[0] || '',
              length: parseFloat(row[1]) || 1,
              category: (parseInt(row[2]) as 1 | 2 | 3 | 4 | 5) || 3,
              trafficIntensity: parseInt(row[3]) || 1000,
              strengthModulus: parseInt(row[4]) || 300,
              roughnessProfile: parseFloat(row[5]) || 3.5,
              roughnessBump: parseInt(row[6]) || 150,
              rutDepth: parseInt(row[7]) || 25,
              frictionCoeff: parseFloat(row[8]) || 0.35,
              significance: 'local',
              region: 'Київська',
              estimatedCost: 0
            });
          }
        }
        
        onSectionsChange([...sections, ...importedSections]);
        alert(`Імпортовано ${importedSections.length} дорожніх секцій`);
      } catch (error) {
        alert('Помилка при імпорті файлу. Перевірте формат даних.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };


  React.useEffect(() => {
    if (sections.length > 0) {
      debouncedCalculateAllSections();
    }
    
    // Cleanup функция для отмены debounced вызовов
    return () => {
      debouncedCalculateAllSections.cancel?.();
    };
  }, [sections, debouncedCalculateAllSections]);

  // Функція для отримання кольору badge
  const getComplianceBadge = (value: number, threshold: number, isReverse: boolean = false) => {
    const isCompliant = isReverse ? value <= threshold : value >= threshold;
    return (
      <Badge variant={isCompliant ? "secondary" : "destructive"}>
        {value}
        {isCompliant ? (
          <CheckCircleIcon className="h-3 w-3 ml-1" />
        ) : (
          <XCircleIcon className="h-3 w-3 ml-1" />
        )}
      </Badge>
    );
  };

  const getWorkTypeBadge = (workType: string) => {
    const variants = {
      'current_repair': { label: 'Поточний', variant: 'default' as const },
      'capital_repair': { label: 'Капітальний', variant: 'destructive' as const },
      'reconstruction': { label: 'Реконструкція', variant: 'outline' as const },
      'no_work_needed': { label: 'Не потрібно', variant: 'secondary' as const }
    };
    
    const config = variants[workType as keyof typeof variants] || variants['no_work_needed'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const ProgressIndicator = () => {
    if (!isCalculating) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <div className="font-semibold">Виконання розрахунків...</div>
              <div className="text-sm text-gray-600">
                Обробка {sections.length} секцій дороги
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((calculatedResults.size / sections.length) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calculatedResults.size} з {sections.length} секцій оброблено
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stopCalculations = () => {
    setIsCalculating(false);
    debouncedCalculateAllSections.cancel?.();
  };

  return (
    <div className='grid grid-cols-1 w-full px-6'>
      <ProgressIndicator />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Визначення показників фактичного транспортно-експлуатаційного стану доріг</span>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCalculating}
              >
                <FileUpIcon className="h-4 w-4 mr-2" />
                Імпорт Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateTestData}
                disabled={isCalculating}
              >
                Тестові дані
              </Button>
              <Button 
                onClick={handleAdd} 
                size="sm"
                disabled={isCalculating}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Додати секцію
              </Button>
              
              {/* НОВАЯ КНОПКА: Принудительная остановка */}
              {isCalculating && (
                <Button 
                  onClick={stopCalculations}
                  variant="destructive"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Зупинити
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 min-w-48">Найменування ділянки дороги</TableHead>
                  <TableHead className="w-20 min-w-20">Протяжність, км</TableHead>
                  <TableHead className="w-24 min-w-24">Категорія</TableHead>
                  <TableHead className="w-24 min-w-24">Інтенсивність авт/добу</TableHead>
                  <TableHead className="w-24 min-w-24">Модуль пружності МПа</TableHead>
                  <TableHead className="w-24 min-w-24">Рівність м/км</TableHead>
                  <TableHead className="w-24 min-w-24">Рівність см/км</TableHead>
                  <TableHead className="w-20 min-w-20">Колія мм</TableHead>
                  <TableHead className="w-20 min-w-20">Зчеплення</TableHead>
                  <TableHead className="w-20 min-w-20">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => {
                  const metrics = calculatedResults.get(section.id);
                  return (
                    <TableRow key={section.id}>
                      {editingId === section.id && formData ? (
                        <>
                          <TableCell>
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full min-w-40"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.length}
                              onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 1 })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={formData.category.toString()} 
                              onValueChange={(value) => setFormData({ ...formData, category: parseInt(value) as 1|2|3|4|5 })}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CATEGORIES).map(([key, cat]) => (
                                  <SelectItem key={key} value={key}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={formData.trafficIntensity}
                              onChange={(e) => setFormData({ ...formData, trafficIntensity: parseInt(e.target.value) || 1000 })}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={formData.strengthModulus}
                              onChange={(e) => setFormData({ ...formData, strengthModulus: parseInt(e.target.value) || 300 })}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={formData.roughnessProfile}
                              onChange={(e) => setFormData({ ...formData, roughnessProfile: parseFloat(e.target.value) || 3.5 })}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={formData.roughnessBump}
                              onChange={(e) => setFormData({ ...formData, roughnessBump: parseInt(e.target.value) || 150 })}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={formData.rutDepth}
                              onChange={(e) => setFormData({ ...formData, rutDepth: parseInt(e.target.value) || 25 })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.frictionCoeff}
                              onChange={(e) => setFormData({ ...formData, frictionCoeff: parseFloat(e.target.value) || 0.35 })}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSave}>
                                <SaveIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                ✕
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">
                            <div className="max-w-44">
                              <div className="truncate" title={section.name}>{section.name}</div>
                              <div className="flex gap-1 mt-1">
                                {section.significance === 'state' && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">Держ</Badge>
                                )}
                                {section.isInternationalRoad && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Міжн</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{section.length}</TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.category}</div>
                              <div className="text-[10px] text-gray-500">
                                {CATEGORIES[section.category]?.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.trafficIntensity}</div>
                              {metrics && (
                                <div className="text-[10px]">
                                  {getComplianceBadge(metrics.intensityCoeff, 1.0)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.strengthModulus}</div>
                              {metrics && (
                                <div className="text-[10px]">
                                  {getComplianceBadge(metrics.strengthCoeff, MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category])}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.roughnessProfile}</div>
                              {metrics && (
                                <div className="text-[10px]">
                                  {getComplianceBadge(metrics.evennessCoeff, 1.0)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.roughnessBump}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.rutDepth}</div>
                              {metrics && (
                                <div className="text-[10px]">
                                  {getComplianceBadge(metrics.rutCoeff, 1.0)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium text-sm">{section.frictionCoeff}</div>
                              {metrics && (
                                <div className="text-[10px]">
                                  {getComplianceBadge(metrics.frictionCoeff, 1.0)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(section.id)}>
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Результати розрахунків */}
          {calculatedResults.size > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Результати розрахунків та рекомендації:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map(section => {
                  const metrics = calculatedResults.get(section.id);
                  if (!metrics) return null;
                  
                  return (
                    <Card key={section.id} className="p-4">
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate" title={section.name}>{section.name}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Рекомендація:</span>
                          {getWorkTypeBadge(metrics.workType)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Вартість:</span>
                          <span className="font-medium text-green-600">
                            {metrics.estimatedCost.toFixed(2)} млн грн
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>• Інтенсивність: {metrics.categoryCompliance ? '✓' : '✗'}</div>
                          <div>• Зчеплення: {metrics.frictionCompliance ? '✓' : '✗'}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Підсумкова інформація */}
          <div className="mt-6 flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Всього секцій: <span className="font-medium">{sections.length}</span>
              </div>
              {calculatedResults.size > 0 && (
                <>
                  <div className="text-sm text-gray-600">
                    Потребують ремонту: <span className="font-medium text-orange-600">
                      {Array.from(calculatedResults.values()).filter(m => m.workType !== 'no_work_needed').length}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Загальна вартість: <span className="font-medium text-green-600">
                      {Array.from(calculatedResults.values())
                        .reduce((sum, m) => sum + (m.workType !== 'no_work_needed' ? m.estimatedCost : 0), 0)
                        .toFixed(2)} млн грн
                    </span>
                  </div>
                </>
              )}
            </div>
            <Button onClick={onNext} disabled={sections.length === 0}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Легенда */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold mb-2">Пояснення до розрахунків:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h6 className="font-medium mb-1">Коефіцієнти відповідності:</h6>
                <ul className="space-y-1 text-xs">
                  <li>• <span className="text-green-600">✓</span> - коефіцієнт ≥ 1.0 (відповідає нормі)</li>
                  <li>• <span className="text-red-600">✗</span> - коефіцієнт &lt; 1.0 (не відповідає нормі)</li>
                </ul>
              </div>
              <div>
                <h6 className="font-medium mb-1">Визначення видів робіт:</h6>
                <ul className="space-y-1 text-xs">
                  <li>• <span className="text-red-600">Реконструкція</span> - при перевищенні інтенсивності</li>
                  <li>• <span className="text-orange-600">Капітальний ремонт</span> - при недостатній міцності</li>
                  <li>• <span className="text-blue-600">Поточний ремонт</span> - при проблемах з рівністю/колійністю/зчепленням</li>
                  <li>• <span className="text-green-600">Не потрібно</span> - всі показники в нормі</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Експорт результатів */}
          {calculatedResults.size > 0 && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const data = sections.map(section => {
                    const metrics = calculatedResults.get(section.id);
                    return {
                      'Найменування': section.name,
                      'Протяжність (км)': section.length,
                      'Категорія': section.category,
                      'Інтенсивність (авт/добу)': section.trafficIntensity,
                      'Модуль пружності (МПа)': section.strengthModulus,
                      'Рівність профіл. (м/км)': section.roughnessProfile,
                      'Глибина колії (мм)': section.rutDepth,
                      'Коеф. зчеплення': section.frictionCoeff,
                      'Коеф. інтенсивності': metrics?.intensityCoeff || 0,
                      'Коеф. міцності': metrics?.strengthCoeff || 0,
                      'Коеф. рівності': metrics?.evennessCoeff || 0,
                      'Коеф. колійності': metrics?.rutCoeff || 0,
                      'Коеф. зчеплення розрах.': metrics?.frictionCoeff || 0,
                      'Вид робіт': metrics?.workType || '',
                      'Вартість (млн грн)': metrics?.estimatedCost || 0
                    };
                  });
                  
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Розрахунки');
                  XLSX.writeFile(wb, `road_calculations_${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
              >
                Експорт розрахунків
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Page3_CostIndicators: React.FC<{
  costStandards: CostStandards;
  onCostStandardsChange: (standards: CostStandards) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ costStandards, onCostStandardsChange, onNext, onBack }) => {
  const [editMode, setEditMode] = useState(false);
  const [tempStandards, setTempStandards] = useState<CostStandards>(costStandards);
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  React.useEffect(() => {
    const newAnalytics = calculateCostAnalytics(costStandards);
    setAnalytics(newAnalytics);
  }, [costStandards]);

  const validateStandards = (standards: CostStandards): string[] => {
    const errors: any = [];
    
    [1, 2, 3, 4, 5].forEach(cat => {
      const reconstruction = standards.reconstruction[cat];
      const capitalRepair = standards.capital_repair[cat];
      const currentRepair = standards.current_repair[cat];
      
      if (reconstruction <= capitalRepair) {
        errors.push(`Категорія ${cat}: вартість реконструкції має бути більшою за капремонт`);
      }
      
      if (capitalRepair <= currentRepair) {
        errors.push(`Категорія ${cat}: вартість капремонту має бути більшою за поточний ремонт`);
      }
      
      if (currentRepair <= 0) {
        errors.push(`Категорія ${cat}: вартість поточного ремонту має бути більше 0`);
      }
    });
    
    return errors;
  };

  const handleSave = () => {
    const errors = validateStandards(tempStandards);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      onCostStandardsChange(tempStandards);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setTempStandards(costStandards);
    setEditMode(false);
    setValidationErrors([]);
  };

  const handleReset = () => {
    setTempStandards(DEFAULT_COST_STANDARDS);
  };

  const updateValue = (workType: keyof CostStandards, category: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempStandards({
      ...tempStandards,
      [workType]: {
        ...tempStandards[workType],
        [category]: numValue
      }
    });
  };

  const getCostBadgeVariant = (workType: keyof CostStandards, category: number, value: number) => {
    const isValid = isWithinMarketRange(workType, category, value);
    return isValid ? 'secondary' : 'outline';
  };

  const exportToExcel = () => {
    // Простий експорт даних
    const data = [
      ['Вид робіт', 'I категорія', 'II категорія', 'III категорія', 'IV категорія', 'V категорія'],
      ['Реконструкція', ...Object.values(tempStandards.reconstruction)],
      ['Капітальний ремонт', ...Object.values(tempStandards.capital_repair)],
      ['Поточний ремонт', ...Object.values(tempStandards.current_repair)]
    ];
    
    console.log('Експорт показників вартості:', data);
    // Тут буде логіка експорту в Excel
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Усереднені орієнтовні показники вартості дорожніх робіт</h3>
              <p className="text-sm text-gray-600 mt-1">за даними об'єктів-аналогів, млн.грн/1 км</p>
            </div>
            <div className="flex gap-2">
              {!editMode ? (
                <>
                  <Button 
                    onClick={() => setShowAnalytics(!showAnalytics)} 
                    variant="outline" 
                    size="sm"
                  >
                    <TrendingUpIcon className="h-4 w-4 mr-2" />
                    Аналітика
                  </Button>
                  <Button onClick={exportToExcel} variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Експорт
                  </Button>
                  <Button onClick={() => setEditMode(true)} variant="outline">
                    <EditIcon className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcwIcon className="h-4 w-4 mr-2" />
                    Скинути
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Скасувати
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Зберегти
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Помилки валідації */}
          {validationErrors.length > 0 && (
            <Alert className="mb-4 border-red-500 bg-red-50">
              <AlertDescription>
                <div className="font-semibold text-red-700 mb-2">Виявлено помилки:</div>
                <ul className="list-disc list-inside space-y-1 text-red-600">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Аналітична панель */}
          {showAnalytics && analytics && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <TrendingUpIcon className="h-4 w-4 mr-2" />
                  Аналіз показників вартості
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Середня вартість по категоріях:</div>
                    {Object.entries(analytics.averageCostByCategory).map(([cat, avg]) => (
                      <div key={cat} className="text-xs flex justify-between">
                        <span>{CATEGORIES[Number(cat) as keyof typeof CATEGORIES]?.name}:</span>
                        <span className="font-medium">{avg.toFixed(1)} млн/км</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Середня вартість по видах робіт:</div>
                    {Object.entries(analytics.averageCostByWorkType).map(([type, avg]) => (
                      <div key={type} className="text-xs flex justify-between">
                        <span>{type}:</span>
                        <span className="font-medium">{avg.toFixed(1)} млн/км</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Рекомендації:</div>
                    {analytics.recommendations.length > 0 ? (
                      analytics.recommendations.map((rec, index) => (
                        <div key={index} className="text-xs text-amber-700 mb-1">• {rec}</div>
                      ))
                    ) : (
                      <div className="text-xs text-green-700">Показники збалансовані</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Основна таблиця */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="w-48">Вид робіт</TableHead>
                  <TableHead colSpan={5} className="text-center border-b">Категорія дороги</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center w-24">I</TableHead>
                  <TableHead className="text-center w-24">II</TableHead>
                  <TableHead className="text-center w-24">III</TableHead>
                  <TableHead className="text-center w-24">IV</TableHead>
                  <TableHead className="text-center w-24">V</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-red-700">Реконструкція</TableCell>
                  {[1, 2, 3, 4, 5].map(cat => (
                    <TableCell key={cat} className="text-center">
                      {editMode ? (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempStandards.reconstruction[cat]}
                            onChange={(e) => updateValue('reconstruction', cat, e.target.value)}
                            className="w-20 text-center"
                          />
                          <div className="text-xs text-gray-500">
                            {MARKET_COST_RANGES.reconstruction[cat as keyof typeof MARKET_COST_RANGES.reconstruction][0]}-
                            {MARKET_COST_RANGES.reconstruction[cat as keyof typeof MARKET_COST_RANGES.reconstruction][1]}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge 
                            variant={getCostBadgeVariant('reconstruction', cat, tempStandards.reconstruction[cat])}
                            className="font-medium"
                          >
                            {tempStandards.reconstruction[cat]}
                          </Badge>
                          <div className="text-xs text-gray-500">млн/км</div>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-orange-700">Капітальний ремонт</TableCell>
                  {[1, 2, 3, 4, 5].map(cat => (
                    <TableCell key={cat} className="text-center">
                      {editMode ? (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempStandards.capital_repair[cat]}
                            onChange={(e) => updateValue('capital_repair', cat, e.target.value)}
                            className="w-20 text-center"
                          />
                          <div className="text-xs text-gray-500">
                            {MARKET_COST_RANGES.capital_repair[cat as keyof typeof MARKET_COST_RANGES.capital_repair][0]}-
                            {MARKET_COST_RANGES.capital_repair[cat as keyof typeof MARKET_COST_RANGES.capital_repair][1]}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge 
                            variant={getCostBadgeVariant('capital_repair', cat, tempStandards.capital_repair[cat])}
                            className="font-medium"
                          >
                            {tempStandards.capital_repair[cat]}
                          </Badge>
                          <div className="text-xs text-gray-500">млн/км</div>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-blue-700">Поточний ремонт</TableCell>
                  {[1, 2, 3, 4, 5].map(cat => (
                    <TableCell key={cat} className="text-center">
                      {editMode ? (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={tempStandards.current_repair[cat]}
                            onChange={(e) => updateValue('current_repair', cat, e.target.value)}
                            className="w-20 text-center"
                          />
                          <div className="text-xs text-gray-500">
                            {MARKET_COST_RANGES.current_repair[cat as keyof typeof MARKET_COST_RANGES.current_repair][0]}-
                            {MARKET_COST_RANGES.current_repair[cat as keyof typeof MARKET_COST_RANGES.current_repair][1]}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge 
                            variant={getCostBadgeVariant('current_repair', cat, tempStandards.current_repair[cat])}
                            className="font-medium"
                          >
                            {tempStandards.current_repair[cat]}
                          </Badge>
                          <div className="text-xs text-gray-500">млн/км</div>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>      
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext} disabled={validationErrors.length > 0}>
              Далі: Розрахунок вартості
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface Page4EstimatedCostsProps {
  sections: RoadSectionUI[];
  costStandards: CostStandards;
  onSectionsChange: React.Dispatch<React.SetStateAction<RoadSectionUI[]>>;
  onNext: () => void;
  onBack: () => void;
}

interface Page4EstimatedCostsProps {
  sections: RoadSectionUI[];
  costStandards: CostStandards;
  onSectionsChange: React.Dispatch<React.SetStateAction<RoadSectionUI[]>>;
  onNext: () => void;
  onBack: () => void;
}

// Изменить строку объявления компонента
const Page4_EstimatedCosts: React.FC<Page4EstimatedCostsProps> = ({ 
  sections: propSections, 
}) => {
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [assessments, setAssessments] = useState<ComprehensiveAssessment[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Инициализация - ИЗМЕНИТЬ этот useEffect
  React.useEffect(() => {
    let sectionsToUse: RoadSection[] = [];
    
    if (propSections && propSections.length > 0) {
      sectionsToUse = propSections.map(uiSection => {
      const convertedSection = convertUIToRoadSection(uiSection);
      
        // Если уже есть рассчитанная стоимость, используем её
        if (uiSection.estimatedCost) {
          convertedSection.estimatedCost = uiSection.estimatedCost * 1000; // конвертируем в тыс грн
        }
      
        return convertedSection;
      });
    } else {
      // Тестовые данные если propSections пустые
      sectionsToUse = [
        createTestRoadSection('M-01', 'М-01 Київ - Чернігів', 1, 125, 18500, 'Київська'),
        createTestRoadSection('N-02', 'Н-02 Житомир - Львів', 2, 89, 8200, 'Житомирська'),
        createTestRoadSection('P-03', 'Р-03 Вінниця - Тернопіль', 3, 67, 4100, 'Вінницька'),
        createTestRoadSection('T-04', 'Т-04 Луцьк - Ковель', 4, 45, 1800, 'Волинська'),
        createTestRoadSection('O-05', 'О-05 Місцева дорога', 5, 23, 450, 'Львівська'),
        createTestRoadSection('M-06', 'М-06 Київ - Одеса', 1, 156, 22000, 'Київська'),
        createTestRoadSection('N-07', 'Н-07 Харків - Полтава', 2, 78, 6500, 'Харківська'),
        createTestRoadSection('P-08', 'Р-08 Чернівці - Івано-Франківськ', 3, 92, 3200, 'Чернівецька')
      ];
    }
    
    setSections(sectionsToUse);
  }, [propSections]);

  const convertUIToRoadSection = (uiSection: RoadSectionUI): RoadSection => {
    const detailedCondition: DetailedTechnicalCondition = {
      intensityCoefficient: MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category] / Math.max(uiSection.trafficIntensity, 1),
      maxDesignIntensity: MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category],
      actualIntensity: uiSection.trafficIntensity,
      
      strengthCoefficient: uiSection.strengthModulus / (300 + uiSection.category * 50),
      isRigidPavement: false,
      actualElasticModulus: uiSection.strengthModulus,
      requiredElasticModulus: 300 + uiSection.category * 50,
      
      evennessCoefficient: (2.7 + uiSection.category * 0.4) / Math.max(uiSection.roughnessProfile, 0.1),
      iriIndex: uiSection.roughnessProfile,
      bumpIndex: uiSection.roughnessBump,
      maxAllowedEvenness: 2.7 + uiSection.category * 0.4,
      
      rutCoefficient: (15 + uiSection.category * 5) / Math.max(uiSection.rutDepth, 1),
      actualRutDepth: uiSection.rutDepth,
      maxAllowedRutDepth: 15 + uiSection.category * 5,
      
      frictionCoefficient: uiSection.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT,
      actualFrictionValue: uiSection.frictionCoeff,
      requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
    };

    return {
      id: uiSection.id,
      name: uiSection.name,
      category: uiSection.category,
      length: uiSection.length,
      significance: uiSection.significance,
      region: uiSection.region || 'Київська',
      detailedCondition,
      trafficIntensity: uiSection.trafficIntensity,
      estimatedCost: uiSection.estimatedCost,
      isDefenseRoad: uiSection.isDefenseRoad,
      isInternationalRoad: uiSection.isInternationalRoad,
      isEuropeanNetwork: uiSection.isEuropeanNetwork,
      hasLighting: uiSection.hasLighting,
      criticalInfrastructureCount: uiSection.criticalInfrastructureCount,
      enpv: 0 // Будет вычислено в assessment
    };
  };

  // Выполнение расчетов с использованием модулей
  const handleCalculateCosts = async () => {
    if (sections.length === 0) {
      console.log('Нет секций для расчета');
      return;
    }

    setIsCalculating(true);
    
    try {
      console.log('Начинаем расчет для секций:', sections.length);
      
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Используем executeComprehensiveAssessment из block_three_algorithm.ts
      const newAssessments = sections.map((section, index) => {
        console.log(`Расчет ${index + 1}/${sections.length} для секции: ${section.id} - ${section.name}`);
        
        try {
          const assessment = executeComprehensiveAssessment(section);
          console.log(`Результат для ${section.id}:`, {
            workType: assessment.recommendedWorkType,
            cost: assessment.estimatedCost,
            enpv: assessment.costBenefitAnalysis?.enpv
          });
          return assessment;
        } catch (error) {
          console.error(`Ошибка расчета для секции ${section.id}:`, error);
          // Возвращаем базовую оценку в случае ошибки
          return {
            sectionId: section.id,
            currentInspections: true,
            targetedInspections: true,
            seasonalInspections: true,
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
            recommendedWorkType: 'no_work_needed' as const,
            estimatedCost: 0,
            priority: 999,
            rankingCriteria: 'ошибка расчета'
          };
        }
      });
      
      setAssessments(newAssessments);
      console.log('Все расчеты завершены. Результаты:', newAssessments);
      
    } catch (error) {
      console.error('Критическая ошибка при расчете:', error);
      alert('Ошибка при выполнении расчетов: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCalculating(false);
    }
  };

  // Запуск расчетов при загрузке
  React.useEffect(() => {
    if (sections.length > 0 && assessments.length === 0) {
      console.log('Автоматический запуск расчетов для', sections.length, 'секций');
      handleCalculateCosts();
    }
  }, [sections]);

  const getWorkTypeInUkrainian = (workType: string) => {
    switch (workType) {
      case 'current_repair': return 'Поточний ремонт';
      case 'capital_repair': return 'Капітальний ремонт';
      case 'reconstruction': return 'Реконструкція';
      case 'no_work_needed': return 'Не потрібно';
      default: return 'Не визначено';
    }
  };

  const getWorkTypeBadgeVariant = (workType: string) => {
    switch (workType) {
      case 'current_repair': return 'default';
      case 'capital_repair': return 'destructive';
      case 'reconstruction': return 'outline';
      default: return 'secondary';
    }
  };

  // Фильтруем только секции, которые требуют работ
  const workingAssessments = assessments.filter(a => a.recommendedWorkType !== 'no_work_needed');
  const totalCost = workingAssessments.reduce((sum, a) => sum + a.estimatedCost, 0);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Орієнтовна вартість робіт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Button 
              onClick={handleCalculateCosts} 
              disabled={isCalculating}
              className="flex items-center gap-2"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Виконання комплексної оцінки...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  Розрахувати
                </>
              )}
            </Button>
            
            {assessments.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Проаналізовано секцій: {sections.length}</div>
                <div className="text-sm text-gray-600">Потребують робіт: {workingAssessments.length}</div>
              </div>
            )}
          </div>

          {isCalculating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Виконання комплексної оцінки секцій дороги...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Найменування ділянки дороги
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Протяжність дороги (км)
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Категорія
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Вид робіт
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                        Орієнтовна вартість робіт (тис. грн)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingAssessments.map((assessment) => {
                      const section = sections.find(s => s.id === assessment.sectionId)!;
                      return (
                        <tr key={assessment.sectionId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium">
                            <div className="flex flex-col">
                              <span>{section.name}</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {section.isDefenseRoad && (
                                  <Badge variant="destructive" className="text-xs">Оборонна</Badge>
                                )}
                                {section.isInternationalRoad && (
                                  <Badge variant="outline" className="text-xs">Міжнародна</Badge>
                                )}
                                {section.isEuropeanNetwork && (
                                  <Badge variant="secondary" className="text-xs">Європейська</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {section.length}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {CATEGORIES[section.category]?.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <Badge variant={getWorkTypeBadgeVariant(assessment.recommendedWorkType) as any}>
                              {getWorkTypeInUkrainian(assessment.recommendedWorkType)}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-medium text-green-600">
                            {assessment.estimatedCost.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Загальна вартість робіт:</span>
                  <span className="text-2xl font-bold text-green-700">
                    {(totalCost / 1000).toLocaleString()} млн грн
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Поточний ремонт:</span>
                    <span>
                      {(assessments
                        .filter(a => a.recommendedWorkType === 'current_repair')
                        .reduce((sum, a) => sum + a.estimatedCost, 0) / 1000
                      ).toLocaleString()} млн грн
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Капітальний ремонт:</span>
                    <span>
                      {(assessments
                        .filter(a => a.recommendedWorkType === 'capital_repair')
                        .reduce((sum, a) => sum + a.estimatedCost, 0) / 1000
                      ).toLocaleString()} млн грн
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Реконструкція:</span>
                    <span>
                      {(assessments
                        .filter(a => a.recommendedWorkType === 'reconstruction')
                        .reduce((sum, a) => sum + a.estimatedCost, 0) / 1000
                      ).toLocaleString()} млн грн
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
                <Button className="flex items-center gap-2">
                  Далі
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Дополнительная статистика с данными из модулей */}
      {!isCalculating && workingAssessments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Розподіл робіт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Поточний ремонт:</span>
                  <span className="font-medium">
                    {assessments.filter(a => a.recommendedWorkType === 'current_repair').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Капітальний ремонт:</span>
                  <span className="font-medium">
                    {assessments.filter(a => a.recommendedWorkType === 'capital_repair').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Реконструкція:</span>
                  <span className="font-medium">
                    {assessments.filter(a => a.recommendedWorkType === 'reconstruction').length}
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Не потрібно:</span>
                  <span className="font-medium">
                    {assessments.filter(a => a.recommendedWorkType === 'no_work_needed').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Середні коефіцієнти</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Інтенсивність:</span>
                  <span className="font-medium">
                    {assessments.length > 0 
                      ? (assessments.reduce((s, a) => s + a.technicalState.intensityCoefficient, 0) / assessments.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Прочність:</span>
                  <span className="font-medium">
                    {assessments.length > 0 
                      ? (assessments.reduce((s, a) => s + a.technicalState.strengthCoefficient, 0) / assessments.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Рівність:</span>
                  <span className="font-medium">
                    {assessments.length > 0 
                      ? (assessments.reduce((s, a) => s + a.technicalState.evennessCoefficient, 0) / assessments.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Колійність:</span>
                  <span className="font-medium">
                    {assessments.length > 0 
                      ? (assessments.reduce((s, a) => s + a.technicalState.rutCoefficient, 0) / assessments.length).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Економічні показники</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(() => {
                  const econAssessments = assessments.filter(a => a.costBenefitAnalysis);
                  if (econAssessments.length === 0) {
                    return <div className="text-gray-500">Немає даних</div>;
                  }
                  
                  const avgENPV = econAssessments.reduce((s, a) => s + a.costBenefitAnalysis!.enpv, 0) / econAssessments.length;
                  const avgBCR = econAssessments.reduce((s, a) => s + a.costBenefitAnalysis!.bcr, 0) / econAssessments.length;
                  const positiveENPV = econAssessments.filter(a => a.costBenefitAnalysis!.enpv > 0).length;
                  const profitableBCR = econAssessments.filter(a => a.costBenefitAnalysis!.bcr > 1).length;
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Середній ENPV:</span>
                        <span className={`font-medium ${avgENPV > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(avgENPV / 1000).toFixed(0)} тыс.
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Середній BCR:</span>
                        <span className={`font-medium ${avgBCR > 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {avgBCR.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ENPV {'>'} 0:</span>
                        <span className="font-medium">{positiveENPV}/{econAssessments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>BCR {'>'} 1:</span>
                        <span className="font-medium">{profitableBCR}/{econAssessments.length}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Пояснения по методике */}
      <Card>
        <CardContent className="text-sm text-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ul className="space-y-1">
                <li><strong>Реконструкція:</strong> при коефіцієнті інтенсивності &lt; 1.0</li>
                <li><strong>Капремонт:</strong> при коефіцієнті міцності нижче нормативу</li>
                <li><strong>Поточний ремонт:</strong> при порушенні рівності, колійності або зчеплення</li>
                <li><strong>Не потрібно:</strong> при відповідності всім нормативам</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-1">
                <li><strong>Міжнародні дороги:</strong> +15%</li>
                <li><strong>Оборонні дороги:</strong> +10%</li>
                <li><strong>Освітлення:</strong> +5%</li>
                <li><strong>Прикордонні переходи:</strong> +8%</li>
                <li><strong>Регіональні:</strong> від 5% до +20%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


const executeComprehensiveAssessmentFallback = (section: AlgorithmRoadSection) => {
  // Простая логика определения типа работ
  let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' = 'no_work_needed';
  
  if (section.trafficIntensity > section.detailedCondition.maxDesignIntensity) {
    workType = 'reconstruction';
  } else if (section.detailedCondition.strengthCoefficient < 0.9) {
    workType = 'capital_repair';
  } else if (section.detailedCondition.evennessCoefficient < 1.0 || 
             section.detailedCondition.rutCoefficient < 1.0 || 
             section.detailedCondition.frictionCoefficient < 1.0) {
    workType = 'current_repair';
  }
  
  return {
    recommendedWorkType: workType,
    estimatedCost: 0, // будет рассчитано позже
    costBenefitAnalysis: null
  };
};

const calculateEstimatedCostForSection = (section: RoadSectionUI): number => {
  // Простой алгоритм определения типа работ
  let workType: 'current_repair' | 'capital_repair' | 'reconstruction' = 'current_repair';
  
  // Проверяем интенсивность для реконструкции
  const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category];
  if (section.trafficIntensity > maxIntensity) {
    workType = 'reconstruction';
  } else {
    // Проверяем коефіцієнти для определения типа работ
    const strengthCoeff = section.strengthModulus / (300 + section.category * 50);
    const minStrengthCoeff = {1: 1.0, 2: 1.0, 3: 0.95, 4: 0.90, 5: 0.85}[section.category] || 0.85;
    
    if (strengthCoeff < minStrengthCoeff) {
      workType = 'capital_repair';
    }
  }
  
  // Базовые ставки (млн грн/км)
  const baseCosts = {
    current_repair: {1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9},
    capital_repair: {1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0},
    reconstruction: {1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0}
  };
  
  const baseRate = baseCosts[workType][section.category] || 1.0;
  let totalCost = baseRate * section.length * section.category * 1000; // конвертируем в тыс. грн
  
  // Поправочные коэффициенты
  if (section.isInternationalRoad) totalCost *= 1.15;
  if (section.isDefenseRoad) totalCost *= 1.10;
  if (section.hasLighting) totalCost *= 1.05;
  
  return Math.round(totalCost);
};

interface Page5EconomicAnalysisProps {
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const Page5_EconomicAnalysis: React.FC<Page5EconomicAnalysisProps> = ({ 
  sections, 
  onSectionsChange,
  onBack 
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<EconomicAnalysisResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [analysisParams, _setAnalysisParams] = useState({
    discountRate: 0.05,
    analysisYears: 20
  });

  // Фільтруємо секції, що потребують капітального ремонту або реконструкції
  const eligibleSections = sections.filter(section => 
    section.workTypeRaw === 'capital_repair' || 
    section.workTypeRaw === 'reconstruction'
  );

  // Автоматично вибираємо першу підходящу секцію
  React.useEffect(() => {
    if (eligibleSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(eligibleSections[0].id);
    }
  }, [eligibleSections, selectedSectionId]);

  // ИСПРАВЛЕННАЯ функция handleCalculateEconomics
  const handleCalculateEconomics = () => {
    if (!selectedSectionId) return;
    
    setIsCalculating(true);
    
    try {
      const section = sections.find(s => s.id === selectedSectionId);
      if (!section) {
        console.error('Секція не знайдена');
        alert('Помилка: секція не знайдена');
        setAnalysisResult(null);
        return;
      }

      console.log('Начинаем расчет экономического анализа для:', section.name);
      console.log('Текущая стоимость секции:', section.estimatedCost);
      
      // Конвертируем UI секцию в формат алгоритма
      const convertedSection = convertUIToAlgorithmRoadSection(section);
      console.log('Секция сконвертирована:', convertedSection);
      
      // Получаем комплексную оценку из модуля алгоритмов
      let assessment;
      try {
        assessment = executeComprehensiveAssessment(convertedSection);
      } catch (error) {
        console.warn('Используем fallback assessment:', error);
        assessment = executeComprehensiveAssessmentFallback(convertedSection);
      }
      console.log('Получена оценка:', assessment);
      
      // Проверяем, есть ли стоимость в оценке или в исходной секции
      let projectCost = assessment.estimatedCost || safeNumber(section.estimatedCost, 0) * 1000; // конвертируем в тыс грн
      
      // Если стоимости нет, рассчитываем её
      if (projectCost <= 0) {
        if (assessment.recommendedWorkType !== 'no_work_needed') {
          console.log('Рассчитываем стоимость через модуль алгоритмов...');
          try {
            projectCost = calculateDetailedWorkCost(convertedSection, assessment.recommendedWorkType);
          } catch (error) {
            console.warn('Ошибка в calculateDetailedWorkCost, используем простой расчет:', error);
            projectCost = calculateEstimatedCostForSection(section);
          }
        } else {
          console.log('Рассчитываем стоимость простым методом...');
          projectCost = calculateEstimatedCostForSection(section);
        }
        
        console.log('Рассчитанная стоимость:', projectCost);
        
        // Обновляем assessment с новой стоимостью
        assessment.estimatedCost = projectCost;
        
        // Обновляем секцию со стоимостью для будущих расчетов
        const updatedSections = sections.map(s => 
          s.id === selectedSectionId ? {...s, estimatedCost: projectCost / 1000} : s // конвертируем обратно в млн
        );
        onSectionsChange(updatedSections);
      }
      
      if (projectCost <= 0) {
        console.error('Не удается определить стоимость проекта');
        alert('Помилка: не вдається визначити вартість проекту. Можливо, секція не потребує ремонту.');
        setAnalysisResult(null);
        return;
      }
      
      console.log('Финальная стоимость для анализа:', projectCost);
      
      // Рассчитываем детальный экономический анализ
      const result = calculateDetailedEconomicAnalysis(
        convertedSection,
        assessment,
        analysisParams.discountRate,
        analysisParams.analysisYears
      );
      console.log('Результат экономического анализа:', result);
      
      setAnalysisResult(result);
      
    } catch (error) {
      console.error('Помилка розрахунку економічного аналізу:', error);
      alert('Помилка при розрахунку: ' + (error instanceof Error ? error.message : String(error)));
      setAnalysisResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Автоматичний розрахунок при зміні секції або параметрів
  React.useEffect(() => {
    if (selectedSectionId && !isCalculating) {
      handleCalculateEconomics();
    }
  }, [selectedSectionId, analysisParams]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  if (sections.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Немає даних для аналізу</h3>
              <p className="text-gray-600 mb-4">Спочатку додайте секції доріг на попередніх сторінках</p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Повернутися назад
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" style={{ background: 'rgb(var(--c-bg))' }}>
      <Card className="glass-card overflow-hidden">
        <CardHeader className="glass-card-header p-4">
          <h3 className="text-center font-bold text-lg">
            Визначення ефективності {selectedSection?.workTypeRaw === 'capital_repair' ? 'капітального ремонту' : 'реконструкції'} автомобільної дороги
          </h3>
          <p className="text-center text-sm text-gray-600 mt-1">
            Вихідні дані
          </p>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm m-4">
            <div className="overflow-auto max-h-[600px]">
              <table className="border-collapse w-full min-w-[1400px]">
                {/* Заголовок таблицы */}
                <thead className="sticky top-0 z-20">
                  <tr>
                    {/* Угловая ячейка */}
                    <th className="w-16 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-30">
                      №
                    </th>
                    {/* Заголовки колонок */}
                    <th className="w-20 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">A</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">B</th>
                    <th className="w-28 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">C</th>
                    <th className="w-28 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">D</th>
                    <th className="w-28 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">E</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">F</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">G</th>
                    <th className="w-28 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">H</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">I</th>
                    <th className="w-36 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">J</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">K</th>
                    <th className="w-32 h-10 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1">L</th>
                  </tr>
                  <tr>
                    {/* Пустая угловая ячейка */}
                    <th className="h-auto bg-blue-100 border-2 border-gray-400 sticky left-0 z-30"></th>
                    {/* Заголовки колонок - описание */}
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Рік
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Середньорічна інтенсивність руху, авт/добу
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      капітальний ремонт
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      експлуатаційне утримання
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Всього
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Економічний ефект (чистий), млн.грн
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Чистий грошовий потік (NCF), млн.грн
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Коефіцієнт дисконтування
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Дисконтований грошовий потік, млн.грн
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Економічна чиста приведена вартість ENPV, млн.грн
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Дисконтовані вигоди, млн.грн
                    </th>
                    <th className="h-auto p-2 bg-blue-100 border-2 border-gray-400 text-xs font-semibold text-center align-middle">
                      Дисконтовані витрати, млн.грн
                    </th>
                  </tr>
                  <tr>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600 sticky left-0 z-30"></th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">1</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">2</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">3</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">4</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">5</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">6</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">7</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">8</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">9</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">10</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">11</th>
                    <th className="h-8 bg-gray-100 border-2 border-gray-400 text-xs text-gray-600">12</th>
                  </tr>
                </thead>
                
                <tbody>
                  {analysisResult?.yearlyData.map((year, index) => (
                    <tr key={year.year}>
                      {/* Номер строки */}
                      <td className="w-16 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-10">
                        {index + 1}
                      </td>
                      
                      {/* Ячейки данных */}
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {year.year}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {safeNumber(selectedSection?.trafficIntensity, 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-yellow-50 text-yellow-800 hover:bg-yellow-100 transition-colors">
                          {(safeNumber(year.capitalCost, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-yellow-50 text-yellow-800 hover:bg-yellow-100 transition-colors">
                          {(safeNumber(year.operationalCost, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-blue-50 text-blue-800 font-semibold hover:bg-blue-100 transition-colors">
                          {(safeNumber(year.totalCosts, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-green-50 text-green-800 hover:bg-green-100 transition-colors">
                          {(safeNumber(year.economicEffect, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {(safeNumber(year.netCashFlow, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                          {safeNumber(year.discountFactor, 0).toFixed(3)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {(safeNumber(year.discountedCashFlow, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-purple-50 text-purple-800 font-semibold hover:bg-purple-100 transition-colors">
                          {(safeNumber(year.enpv, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {(safeNumber(year.discountedBenefits, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                      <td className="h-8 border border-gray-300 p-0">
                        <div className="w-full h-full px-1 text-xs flex items-center justify-center bg-white hover:bg-blue-50 transition-colors">
                          {(safeNumber(year.discountedCosts, 0) / 1000).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Итоговая строка */}
                  <tr className="font-bold bg-yellow-100">
                    <td className="h-10 bg-yellow-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-10">
                      Σ
                    </td>
                    <td className="h-10 border-2 border-gray-400 text-center text-xs font-bold bg-yellow-100">
                      Разом
                    </td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 text-center text-xs font-bold bg-yellow-100">
                      {(safeNumber(analysisResult?.summary.totalDiscountedCosts, 0) / 1000).toFixed(2)}
                    </td>
                    <td className="h-10 border-2 border-gray-400 text-center text-xs font-bold bg-yellow-100">
                      {(safeNumber(analysisResult?.summary.totalDiscountedBenefits, 0) / 1000).toFixed(2)}
                    </td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 text-center text-sm font-bold bg-yellow-200">
                      {(safeNumber(analysisResult?.totalENPV, 0) / 1000).toFixed(2)}
                    </td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                    <td className="h-10 border-2 border-gray-400 bg-yellow-100"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Информация о таблице */}
          <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2 px-4 pb-4">
            <div className="flex flex-wrap gap-4">
              <span>Період аналізу: <strong>{analysisParams.analysisYears} років</strong></span>
              <span>Ставка дисконтування: <strong>{(analysisParams.discountRate * 100).toFixed(1)}%</strong></span>
              <span>Протяжність: <strong>{selectedSection?.length} км</strong></span>
            </div>
            <Button 
              onClick={() => window.print()}
              className="glass-button glass-button--small"
            >
              Зберегти (коли дані для розрахунку по об'єкту внесені)
            </Button>
          </div>

          {/* Подсказка по структуре */}
          <Card className="bg-yellow-50 border-yellow-200 mx-4 mb-4">
            <CardContent className="p-4">
              <div className="text-sm">
                <div className="font-semibold text-yellow-800 mb-2">Структура колонок таблиці:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div><strong>A (1):</strong> Рік проекту</div>
                  <div><strong>B (2):</strong> Інтенсивність руху транспорту</div>
                  <div><strong>C (3):</strong> Витрати на капітальний ремонт</div>
                  <div><strong>D (4):</strong> Витрати на експлуатаційне утримання</div>
                  <div><strong>E (5):</strong> Всього витрат</div>
                  <div><strong>F (6):</strong> Економічний ефект</div>
                  <div><strong>G (7):</strong> Чистий грошовий потік</div>
                  <div><strong>H (8):</strong> Коефіцієнт дисконтування</div>
                  <div><strong>I (9):</strong> Дисконтований грошовий потік</div>
                  <div><strong>J (10):</strong> ENPV</div>
                  <div><strong>K (11):</strong> Дисконтовані вигоди</div>
                  <div><strong>L (12):</strong> Дисконтовані витрати</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
interface Page6RankingProps {
  sections: RoadSectionUI[];
  onBack: () => void;
}

const Page6_Ranking: React.FC<Page6RankingProps> = ({ sections: propSections }) => {
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [_assessments, setAssessments] = useState<ComprehensiveAssessment[]>([]);
  const [rankingResults, setRankingResults] = useState<RankingResult[]>([]);
  const [sortBy, setSortBy] = useState<'enpv' | 'bcr' | 'eirr' | 'priority'>('enpv');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResults, setPlanResults] = useState<BudgetPlanningResult | null>(null);

  // Инициализация тестовых данных
  React.useEffect(() => {
    let sectionsToUse: RoadSection[] = [];
    
    // Используем только данные из предыдущих страниц
    if (propSections && propSections.length > 0) {
      console.log('Используем данные из предыдущих страниц:', propSections.length, 'секций');
      
      // Конвертируем RoadSectionUI в RoadSection с сохранением рассчитанных данных
      sectionsToUse = propSections.map(uiSection => {
        const detailedCondition: DetailedTechnicalCondition = {
          intensityCoefficient: uiSection.intensityCoeff || MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category] / Math.max(uiSection.trafficIntensity, 1),
          maxDesignIntensity: MAX_DESIGN_INTENSITY_BY_CATEGORY[uiSection.category],
          actualIntensity: uiSection.trafficIntensity,
          
          strengthCoefficient: uiSection.strengthCoeff || uiSection.strengthModulus / (300 + uiSection.category * 50),
          isRigidPavement: false,
          actualElasticModulus: uiSection.strengthModulus,
          requiredElasticModulus: 300 + uiSection.category * 50,
          
          evennessCoefficient: uiSection.evennessCoeff || (2.7 + uiSection.category * 0.4) / Math.max(uiSection.roughnessProfile, 0.1),
          iriIndex: uiSection.roughnessProfile,
          bumpIndex: uiSection.roughnessBump,
          maxAllowedEvenness: 2.7 + uiSection.category * 0.4,
          
          rutCoefficient: uiSection.rutCoeff || (15 + uiSection.category * 5) / Math.max(uiSection.rutDepth, 1),
          actualRutDepth: uiSection.rutDepth,
          maxAllowedRutDepth: 15 + uiSection.category * 5,
          
          frictionCoefficient: uiSection.frictionFactorCoeff || uiSection.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT,
          actualFrictionValue: uiSection.frictionCoeff,
          requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
        };

        return {
          id: uiSection.id,
          name: uiSection.name,
          category: uiSection.category,
          length: uiSection.length,
          significance: uiSection.significance,
          region: uiSection.region || 'Київська',
          detailedCondition,
          trafficIntensity: uiSection.trafficIntensity,
          estimatedCost: uiSection.estimatedCost ? uiSection.estimatedCost * 1000 : 0, // конвертируем в тыс грн
          workType: uiSection.workType,
          priority: Math.floor(Math.random() * 100) + 1, // временный приоритет
          isDefenseRoad: uiSection.isDefenseRoad,
          isInternationalRoad: uiSection.isInternationalRoad,
          isEuropeanNetwork: uiSection.isEuropeanNetwork,
          hasLighting: uiSection.hasLighting,
          criticalInfrastructureCount: uiSection.criticalInfrastructureCount,
          enpv: 0 // будет рассчитано в assessment
        };
      });
      
      console.log('Сконвертированные секции для ранжирования:', sectionsToUse);
      setSections(sectionsToUse);
      
      // Запускаем расчет ранжирования только если есть данные
      setTimeout(() => {
        calculateInitialRanking();
      }, 100);
    } else {
      console.log('Нет данных из предыдущих страниц');
      setSections([]);
      setRankingResults([]);
    }
    
    // Симуляция данных из Блока 1 (только если их нет)
    if (!hasBlockOneBudgetData()) {
      console.log('Устанавливаем тестовые данные бюджета из Блока 1');
      setBlockOneBudgetData({
        q1Value: 2500000, // 2.5 billion UAH for state roads
        q2Value: 750000,  // 750 million UAH for local roads
        q1Items: [],
        q2Items: [],
        sessionId: 'test-session-' + Date.now(),
      });
    }
  }, [propSections]);
  
  // Начальный расчет ранжирования
  const calculateInitialRanking = async () => {
    if (sections.length === 0) {
      console.log('Нет секций для ранжирования');
      setRankingResults([]);
      return;
    }

    setIsCalculating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      console.log('Начинаем расчет ранжирования для', sections.length, 'секций');
      
      // Выполняем комплексную оценку
      const newAssessments = sections.map(section => {
        try {
          return executeComprehensiveAssessment(section);
        } catch (error) {
          console.error(`Ошибка оценки для секции ${section.id}:`, error);
          // Возвращаем базовую оценку в случае ошибки
          return {
            sectionId: section.id,
            recommendedWorkType: 'current_repair' as const,
            estimatedCost: section.estimatedCost || 1000,
            priority: 999,
            rankingCriteria: 'ошибка расчета',
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
            }
          };
        }
      });
      
      setAssessments(newAssessments);
      
      // Создаем результаты ранжирования
      const ranking: RankingResult[] = newAssessments
        .filter(assessment => assessment.recommendedWorkType !== 'no_work_needed')
        .map((assessment, index) => {
          const section = sections.find(s => s.id === assessment.sectionId)!;
          return {
            rank: index + 1,
            sectionId: assessment.sectionId,
            sectionName: section.name,
            length: section.length,
            category: section.category,
            workType: getWorkTypeInUkrainian(assessment.recommendedWorkType),
            estimatedCost: (assessment.estimatedCost || section.estimatedCost || 0) / 1000, // конвертируем в млн грн
            enpv: assessment.costBenefitAnalysis?.enpv || Math.random() * 50000 - 25000, // временное значение если нет CBA
            eirr: (assessment.costBenefitAnalysis?.eirr || (0.05 + Math.random() * 0.15)) * 100,
            bcr: assessment.costBenefitAnalysis?.bcr || (0.5 + Math.random() * 2),
            priority: assessment.priority,
            isSelected: false
          };
        });
      
      // Сортируем по ENPV по умолчанию
      ranking.sort((a, b) => b.enpv - a.enpv);
      ranking.forEach((item, index) => item.rank = index + 1);
      
      console.log('Результаты ранжирования:', ranking);
      setRankingResults(ranking);
      
    } catch (error) {
      console.error('Критическая ошибка при расчете ранжирования:', error);
      alert('Ошибка при расчете ранжирования: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCalculating(false);
    }
  };

  // Планирование с использованием бюджета из Блока 1
  const runBudgetPlanning = async () => {
    if (!hasBlockOneBudgetData()) {
      alert('Немає даних з Блоку 1! Спочатку виконайте розрахунки бюджету.');
      return;
    }

    setIsPlanning(true);

    try {
      // Используем функцию планирования из модуля
      const results = planRepairWorksWithBlockOneData(sections);
      setPlanResults(results);
      
      console.log('Результати планування з бюджетом Блоку 1:', results);
    } catch (error) {
      console.error('Помилка планування:', error);
      alert('Помилка при плануванні: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPlanning(false);
    }
  };

  // Функции утилиты
  const getWorkTypeInUkrainian = (workType: string) => {
    switch (workType) {
      case 'current_repair': return 'Поточний ремонт';
      case 'capital_repair': return 'Капітальний ремонт';
      case 'reconstruction': return 'Реконструкція';
      case 'no_work_needed': return 'Не потрібно';
      default: return 'Не визначено';
    }
  };

  const getWorkTypeBadgeVariant = (workType: string) => {
    switch (workType) {
      case 'Поточний ремонт': return 'default';
      case 'Капітальний ремонт': return 'destructive';
      case 'Реконструкція': return 'outline';
      default: return 'secondary';
    }
  };

  // Сортировка результатов
  const sortedResults = [...rankingResults].sort((a, b) => {
    switch (sortBy) {
      case 'enpv': return b.enpv - a.enpv;
      case 'bcr': return b.bcr - a.bcr;
      case 'eirr': return b.eirr - a.eirr;
      case 'priority': return a.priority - b.priority;
      default: return b.enpv - a.enpv;
    }
  }).map((item, index) => ({ ...item, rank: index + 1 }));

  // Экспорт в Excel
  const exportToExcel = () => {
    // Простая реализация для демонстрации
    const csvContent = [
      ['Пріоритет', 'Найменування ділянки дороги', 'Протяжність (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість робіт (млн грн)', 'ENPV', 'EIRR (%)', 'BCR'],
      ...sortedResults.map(r => [
        r.rank,
        r.sectionName,
        r.length,
        CATEGORIES[r.category]?.name,
        r.workType,
        r.estimatedCost.toFixed(2),
        (r.enpv / 1000).toFixed(0),
        r.eirr.toFixed(1),
        r.bcr.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `road_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Скачивание отчета
  const downloadReport = () => {
    const report = generateDetailedRepairPlanReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed_repair_plan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const budgetData = getBlockOneBudgetData();
  
  if (sections.length === 0 && !isCalculating) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Немає даних для ранжування</h3>
              <p className="text-gray-600 mb-4">
                Спочатку додайте секції доріг та виконайте розрахунки на попередніх сторінках
              </p>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Повернутися до попередніх сторінок
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      {/* Планирование с использованием бюджета */}
      {hasBlockOneBudgetData() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Планування з урахуванням бюджету Блоку 1
            </CardTitle>
            {budgetData && (
              <p className="text-sm text-gray-600">
                Загальний бюджет: {(budgetData.totalBudget / 1000).toLocaleString()} млн грн 
                (Q₁: {(budgetData.q1Value / 1000).toLocaleString()} млн, Q₂: {(budgetData.q2Value / 1000).toLocaleString()} млн)
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button 
                onClick={runBudgetPlanning}
                disabled={isPlanning || sections.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPlanning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Розподілити бюджет
              </Button>
              
              <Button onClick={downloadReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Завантажити звіт
              </Button>
            </div>

            {planResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-lg font-bold text-yellow-800">
                      {planResults.currentRepairProjects.length}
                    </div>
                    <div className="text-sm text-yellow-600">Поточний ремонт</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.currentRepairUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-lg font-bold text-orange-800">
                      {planResults.capitalRepairProjects.length}
                    </div>
                    <div className="text-sm text-orange-600">Капітальний ремонт</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.capitalRepairUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <div className="text-lg font-bold text-red-800">
                      {planResults.reconstructionProjects.length}
                    </div>
                    <div className="text-sm text-red-600">Реконструкція</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.reconstructionUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="text-lg font-bold text-green-800">
                      {planResults.budgetUtilization.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-600">Використання бюджету</div>
                    <div className="text-xs text-gray-500">
                      Резерв: {(planResults.budgetBreakdown.reserveRemaining / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Успішно розподілено {planResults.currentRepairProjects.length + planResults.capitalRepairProjects.length + planResults.reconstructionProjects.length} проектів 
                    на загальну суму {(planResults.totalCost / 1000).toFixed(1)} млн грн
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Основная таблица ранжирования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ранжування об'єктів</span>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="enpv">За ENPV</option>
                <option value="bcr">За BCR</option>
                <option value="eirr">За EIRR</option>
                <option value="priority">За пріоритетом</option>
              </select>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Експорт
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCalculating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Розрахунок ранжування об'єктів...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Найменування ділянки дороги
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Протяжність дороги (км)
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Категорія
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Вид робіт
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Орієнтовна вартість робіт (млн грн)
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Економічна чиста приведена вартість (ENPV)
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Економічна норма дохідності (EIRR)
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                        Співвідношення вигід до витрат (BCR)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((result) => (
                      <tr key={result.sectionId} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{result.rank}</Badge>
                            {result.sectionName}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {result.length}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {CATEGORIES[result.category]?.name}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <Badge variant={getWorkTypeBadgeVariant(result.workType) as any}>
                            {result.workType}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium text-green-600">
                          {result.estimatedCost.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">
                          {(result.enpv / 1000).toFixed(0)} тис.
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {result.eirr.toFixed(1)}%
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {result.bcr.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Итоговая статистика */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{sortedResults.length}</div>
                    <div className="text-sm text-gray-600">Всього проектів</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sortedResults.reduce((sum, r) => sum + r.estimatedCost, 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Загальна вартість (млн грн)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sortedResults.filter(r => r.workType === 'Реконструкція').length}
                    </div>
                    <div className="text-sm text-gray-600">Реконструкцій</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {sortedResults.filter(r => r.workType === 'Капітальний ремонт').length}
                    </div>
                    <div className="text-sm text-gray-600">Капітальних ремонтів</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <Button 
              onClick={calculateInitialRanking}
              disabled={isCalculating}
              className="flex items-center gap-2"
            >
              {isCalculating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Перерахувати ранжування
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
// ==================== РОЗШИРЕНИЙ КОМПОНЕНТ ====================

export const Block3MultiPageApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sections, setSections] = useState<RoadSectionUI[]>([]);
  const [costStandards, setCostStandards] = useState<CostStandards>(DEFAULT_COST_STANDARDS);

  React.useEffect(() => {
    console.log('Главное состояние sections обновлено:', sections.length, 'секций');
    console.log('Секции с рассчитанными данными:', sections.filter(s => s.workType).length);
  }, [sections]);

  const pages = [
    'Фактичний стан доріг',
    'Показники та коефіцієнти',
    'Показники вартості',
    'Орієнтовна вартість',
    'Вихідні дані ENPV',
    'Економічна ефективність',
    'Ранжування об\'єктів'
  ];

  const handleNext = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className='mx-auto'>
          {/* Відображення бюджету з Блоку 1 */}
          {/* Заголовок */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Планування ремонтів автомобільних доріг
            </h1>
          </div>

          {/* Навігація по сторінках */}
          <div className="mb-6">
            <nav className="flex justify-center">
              <ol className="flex items-center space-x-2">
                {pages.map((page, index) => {
                  const pageNum = index + 1;
                  const isActive = currentPage === pageNum;
                  const isCompleted = currentPage > pageNum;
                  
                  return (
                    <li key={pageNum} className="flex items-center">
                      <button
                        onClick={() => handlePageSelect(pageNum)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300'
                        }`}>
                          {isCompleted ? '✓' : pageNum}
                        </span>
                        <span className="hidden md:inline">{page}</span>
                      </button>
                      {index < pages.length - 1 && (
                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          {/* Прогрес */}
          <div className="mb-6">
            <Progress value={(currentPage / pages.length) * 100} className="h-2" />
          </div>

          {/* Контент сторінок */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {currentPage === 1 && ( // Фактичний стан доріг
              <Page2_Component  
                sections={sections}
                onSectionsChange={setSections}
                onNext={handleNext}
              />
            )}
            
            {currentPage === 2 && ( // Коефіцієнти та показники
              <Page1_Coefficients 
                sections={sections}
                onSectionsChange={setSections}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentPage === 3 && (
              <Page3_CostIndicators
                costStandards={costStandards}
                onCostStandardsChange={setCostStandards}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentPage === 4 && (
              <Page4_EstimatedCosts
                sections={sections}
                costStandards={costStandards}
                onSectionsChange={setSections}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentPage === 5 && (
              <RoadEfficiencyInterface
                sections={sections}
                onSectionsChange={setSections}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentPage === 6 && (
              <Page5_EconomicAnalysis
                sections={sections}
                onSectionsChange={setSections}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentPage === 7 && (
              <Page6_Ranking
                sections={sections}
                onBack={handleBack}
              />
            )}
          </div>

          {/* Інформаційна панель */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">Дорожніх секцій</div>
                    <div className="text-2xl font-bold">{sections.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calculator className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-semibold">Потребують ремонту</div>
                    <div className="text-2xl font-bold">
                      {sections.filter(s => s.workType && s.workType !== 'Не потрібно' && s.workType !== 'Не визначено').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="font-semibold">Загальна вартість</div>
                    <div className="text-2xl font-bold">
                      {sections
                        .filter(s => s.workType && s.workType !== 'Не потрібно' && s.workType !== 'Не визначено')
                        .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
                        .toFixed(1)} млн
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


