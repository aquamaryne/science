// src/modules/block_three.ts - ГЛАВНЫЙ ФАЙЛ с интеграцией алгоритмов

/**
 * РОЗДІЛ IV - Визначення обсягу та механізм розподілу загального обсягу бюджетних коштів,
 * що спрямовується на фінансове забезпечення заходів з поточного ремонту, капітального
 * ремонту та реконструкції автомобільних доріг загального користування
 */

// ==================== ІМПОРТИ ====================
import { type BudgetItem } from './block_one';
import {
  executeComprehensiveAssessment,
  assessLocalRoadSection, 
  performLocalRoadRanking,
  determineWorkTypeByExpertMethod,
  generateSectionReport,
  calculateDetailedWorkCost,
  performDetailedCostBenefitAnalysis,
  type DetailedTechnicalCondition,
  type ComprehensiveRoadAssessment,
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  EXPERT_ASSESSMENT_THRESHOLDS
} from '@/modules/block_three_alghoritm';

// ==================== ОСНОВНІ ТИПИ ====================

// Розширений інтерфейс дороги з детальними умовами
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
  criticalInfrastructureCount?: number
  enpv?: number;
}

// Совместимость со старой версией для простых случаев
export interface SimpleTechnicalCondition {
  intensityCoefficient: number;
  strengthCoefficient: number;
  evennessCoefficient: number;
  rutCoefficient: number;
  frictionCoefficient: number;
}

export interface SimpleRoadSection {
  id: string;
  name: string;
  category: number;
  length: number;
  significance: 'state' | 'local';
  technicalCondition: SimpleTechnicalCondition;
  trafficIntensity: number;
  estimatedCost?: number;
}

// Интерфейсы из оригинального файла
export interface BlockOneBudgetData {
  q1Value: number;
  q2Value: number;
  totalBudget: number;
  q1Items: BudgetItem[];
  q2Items: BudgetItem[];
  sessionId: string;
  timestamp: Date;
}

export interface BudgetAllocation {
  currentRepair: number;
  capitalRepair: number;
  reconstruction: number;
  reserve: number;
}

export interface ExpertAssessment {
  operationalStateIndex: number;
  trafficIntensity: number;
  detailedDescription?: string;
}

export interface RepairProject {
  section: RoadSection | SimpleRoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;
  economicNPV?: number;
  reasoning: string;
  allocatedBudgetSource: 'q1' | 'q2';
  assessment?: ComprehensiveRoadAssessment; // Добавляем связь с детальной оценкой
}

// ==================== ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ДАННЫХ ====================

let blockOneBudgetData: BlockOneBudgetData | null = null;
let budgetAllocation: BudgetAllocation | null = null;

// ==================== ФУНКЦИИ ИНТЕГРАЦИИ С БЛОКОМ 1 ====================

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
    currentRepair: totalBudget * 0.30,
    capitalRepair: totalBudget * 0.45,
    reconstruction: totalBudget * 0.20,
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
                allocation.reconstruction + allocation.reserve;
  
  if (Math.abs(total - blockOneBudgetData.totalBudget) > 0.01) {
    console.error('Budget allocation total does not match available budget');
    return false;
  }
  
  budgetAllocation = { ...allocation };
  console.log('Custom budget allocation set:', budgetAllocation);
  return true;
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ С ИНТЕГРАЦИЕЙ АЛГОРИТМОВ ====================

/**
 * ГЛАВНАЯ ФУНКЦИЯ - планирование ремонтных работ с интеграцией детальных алгоритмов
 */
export function planRepairWorksWithBlockOneData(
  sections: RoadSection[],
  expertAssessments?: Map<string, ExpertAssessment>,
  useDetailedAlgorithms: boolean = true
): {
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
  blockOneBudgetInfo: BlockOneBudgetData | null;
  complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}>;
  detailedAssessments?: Map<string, ComprehensiveRoadAssessment>; // Новое поле
} {
  console.log('=== Початок планування ремонтних робіт з інтегрованими алгоритмами ===');
  
  if (!hasBlockOneBudgetData()) {
    throw new Error('Немає даних з Блоку 1. Спочатку передайте результати розрахунків бюджету.');
  }
  
  const allProjects: RepairProject[] = [];
  const complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}> = [];
  const detailedAssessments = new Map<string, ComprehensiveRoadAssessment>();
  
  // Крок 1: Оценка каждой секции с использованием детальных алгоритмов
  for (const section of sections) {
    let assessment: ComprehensiveRoadAssessment;
    
    if (useDetailedAlgorithms) {
      if (section.significance === 'local' && expertAssessments?.has(section.id)) {
        // Для местных дорог используем специальный алгоритм
        const expertAssessment = expertAssessments.get(section.id)!;
        assessment = assessLocalRoadSection(
          section, 
          undefined, 
          false, 
          expertAssessment
        );
      } else {
        // Для государственных дорог используем комплексную оценку
        assessment = executeComprehensiveAssessment(section, true);
      }
    } else {
      // Fallback к простым алгоритмам
      assessment = createSimpleAssessment(section, expertAssessments?.get(section.id));
    }
    
    // Сохраняем детальную оценку
    detailedAssessments.set(section.id, assessment);
    
    // Проверка соответствия нормативам
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
        assessment // Связываем с детальной оценкой
      };
      
      allProjects.push(project);
    }
  }
  
  console.log(`Загальна кількість проектів: ${allProjects.length}`);
  
  // Крок 2: Ранжирование проектов с учетом детальных алгоритмов
  const currentRepairProjects = rankProjectsByType(allProjects, 'current_repair');
  const capitalRepairProjects = rankProjectsByType(allProjects, 'capital_repair');
  const reconstructionProjects = rankProjectsByType(allProjects, 'reconstruction');
  
  // Крок 3: Отбор проектов в рамках бюджета
  const selectedCurrentRepair = selectProjectsWithinBudget(currentRepairProjects, 'current_repair');
  const selectedCapitalRepair = selectProjectsWithinBudget(capitalRepairProjects, 'capital_repair');
  const selectedReconstruction = selectProjectsWithinBudget(reconstructionProjects, 'reconstruction');
  
  // Расчет использованных средств
  const currentRepairUsed = selectedCurrentRepair.reduce((sum, p) => sum + p.estimatedCost, 0);
  const capitalRepairUsed = selectedCapitalRepair.reduce((sum, p) => sum + p.estimatedCost, 0);
  const reconstructionUsed = selectedReconstruction.reduce((sum, p) => sum + p.estimatedCost, 0);
  
  const totalCost = currentRepairUsed + capitalRepairUsed + reconstructionUsed;
  const budgetUtilization = (totalCost / blockOneBudgetData!.totalBudget) * 100;
  
  const budgetBreakdown = {
    currentRepairUsed,
    capitalRepairUsed,
    reconstructionUsed,
    reserveRemaining: budgetAllocation!.reserve + 
                     (budgetAllocation!.currentRepair - currentRepairUsed) +
                     (budgetAllocation!.capitalRepair - capitalRepairUsed) +
                     (budgetAllocation!.reconstruction - reconstructionUsed)
  };
  
  console.log('=== Результати планування з інтегрованими алгоритмами ===');
  console.log(`Поточний ремонт: ${selectedCurrentRepair.length} проектів (${currentRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Капітальний ремонт: ${selectedCapitalRepair.length} проектів (${capitalRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Реконструкція: ${selectedReconstruction.length} проектів (${reconstructionUsed.toFixed(2)} тис. грн)`);
  console.log(`Загальна вартість: ${totalCost.toFixed(2)} тис. грн`);
  console.log(`Використання бюджету: ${budgetUtilization.toFixed(1)}%`);
  
  return {
    currentRepairProjects: selectedCurrentRepair,
    capitalRepairProjects: selectedCapitalRepair,
    reconstructionProjects: selectedReconstruction,
    totalCost,
    budgetUtilization,
    budgetBreakdown,
    blockOneBudgetInfo: blockOneBudgetData,
    complianceReport,
    detailedAssessments
  };
}

/**
 * Ранжирование проектов по типу работ с использованием детальных алгоритмов
 */
function rankProjectsByType(
  projects: RepairProject[], 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): RepairProject[] {
  return projects
    .filter(p => p.workType === workType)
    .sort((a, b) => {
      // Используем приоритет из детальной оценки, если есть
      if (a.assessment && b.assessment) {
        return a.assessment.priority - b.assessment.priority;
      }
      
      // Fallback к экономическим показателям
      if (workType === 'capital_repair' || workType === 'reconstruction') {
        const enpvPerKmA = (a.economicNPV || 0) / a.section.length;
        const enpvPerKmB = (b.economicNPV || 0) / b.section.length;
        return enpvPerKmB - enpvPerKmA; // MAX показник ENPV на 1 км
      }
      
      // Для текущего ремонта - по приоритету или интенсивности
      return (a.priority || 999) - (b.priority || 999);
    })
    .map((project, index) => ({
      ...project,
      priority: index + 1
    }));
}

/**
 * Создание простой оценки для совместимости
 */
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
    rankingCriteria: 'простая оценка'
  };
}

// ==================== СОВМЕСТИМОСТЬ СО СТАРЫМИ АЛГОРИТМАМИ ====================

/**
 * Преобразование простой секции в детальную
 */
function convertSimpleToDetailedSection(simpleSection: SimpleRoadSection): RoadSection {
  const condition = simpleSection.technicalCondition;
  
  const detailedCondition: DetailedTechnicalCondition = {
    intensityCoefficient: condition.intensityCoefficient,
    maxDesignIntensity: MAX_DESIGN_INTENSITY_BY_CATEGORY[simpleSection.category as 1|2|3|4|5] || 500,
    actualIntensity: simpleSection.trafficIntensity,
    
    strengthCoefficient: condition.strengthCoefficient,
    isRigidPavement: false,
    
    evennessCoefficient: condition.evennessCoefficient,
    maxAllowedEvenness: 4.0,
    
    rutCoefficient: condition.rutCoefficient,
    actualRutDepth: 25, // Примерное значение
    maxAllowedRutDepth: 20,
    
    frictionCoefficient: condition.frictionCoefficient,
    actualFrictionValue: condition.frictionCoefficient * 0.35,
    requiredFrictionValue: 0.35
  };
  
  return {
    id: simpleSection.id,
    name: simpleSection.name,
    category: simpleSection.category as 1|2|3|4|5,
    length: simpleSection.length,
    significance: simpleSection.significance,
    region: 'Невідомо',
    detailedCondition,
    trafficIntensity: simpleSection.trafficIntensity,
    estimatedCost: simpleSection.estimatedCost,
  };
}

/**
 * Определение типа работ по техническому состоянию (простой алгоритм)
 */
export function determineWorkTypeByTechnicalCondition(
  section: RoadSection | SimpleRoadSection
): 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' {
  
  const condition = 'technicalCondition' in section ? 
    section.technicalCondition : 
    section.detailedCondition;
  
  // Проверка интенсивности для реконструкции
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category as 1|2|3|4|5] || 500;
  
  if (section.trafficIntensity > maxDesignIntensity || condition.intensityCoefficient < 1.0) {
    return 'reconstruction';
  }
  
  // Проверка прочности для капитального ремонта
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category as 1|2|3|4|5] || 0.85;
  
  if (condition.strengthCoefficient < minStrengthCoeff) {
    return 'capital_repair';
  }
  
  // Проверка для текущего ремонта
  if (condition.evennessCoefficient < 1.0 || 
      condition.rutCoefficient < 1.0 || 
      condition.frictionCoefficient < 1.0) {
    return 'current_repair';
  }
  
  return 'no_work_needed';
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

export function checkCategoryComplianceByIntensity(section: RoadSection | SimpleRoadSection): {
  isCompliant: boolean;
  recommendedCategory?: number;
  maxAllowedIntensity: number;
} {
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category as 1|2|3|4|5] || 500;
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
  const REQUIRED_FRICTION_COEFFICIENT = 0.35;
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

function selectProjectsWithinBudget(
  rankedProjects: RepairProject[], 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): RepairProject[] {
  if (!budgetAllocation) {
    console.error('No budget allocation available');
    return [];
  }
  
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
      selectedProjects.push({
        ...project,
        allocatedBudgetSource: project.section.significance === 'state' ? 'q1' : 'q2'
      });
      remainingBudget -= project.estimatedCost;
    }
  }
  
  return selectedProjects;
}

// ==================== ФУНКЦИИ ОТЧЕТНОСТИ ====================

export function generateDetailedRepairPlanReport(): string {
  if (!hasBlockOneBudgetData()) {
    return 'ПОМИЛКА: Немає даних з Блоку 1 для створення звіту';
  }
  
  const budgetData = getBlockOneBudgetData()!;
  const allocation = getBudgetAllocation()!;
  
  let report = '# ДЕТАЛЬНИЙ ЗВІТ ПРО ПЛАНУВАННЯ РЕМОНТНИХ РОБІТ\n\n';
  
  report += '## ДАНІ З БЛОКУ 1\n';
  report += `- Сесія розрахунків: ${budgetData.sessionId}\n`;
  report += `- Дата отримання: ${budgetData.timestamp.toLocaleString('uk-UA')}\n`;
  report += `- Q₁ (державні дороги): ${budgetData.q1Value.toLocaleString()} тис. грн\n`;
  report += `- Q₂ (місцеві дороги): ${budgetData.q2Value.toLocaleString()} тис. грн\n`;
  report += `- Загальний бюджет: ${budgetData.totalBudget.toLocaleString()} тис. грн\n\n`;
  
  report += '## РОЗПОДІЛ БЮДЖЕТУ\n';
  report += `- Поточний ремонт: ${allocation.currentRepair.toLocaleString()} тис. грн (${((allocation.currentRepair/budgetData.totalBudget)*100).toFixed(1)}%)\n`;
  report += `- Капітальний ремонт: ${allocation.capitalRepair.toLocaleString()} тис. грн (${((allocation.capitalRepair/budgetData.totalBudget)*100).toFixed(1)}%)\n`;
  report += `- Реконструкція: ${allocation.reconstruction.toLocaleString()} тис. грн (${((allocation.reconstruction/budgetData.totalBudget)*100).toFixed(1)}%)\n`;
  report += `- Резерв: ${allocation.reserve.toLocaleString()} тис. грн (${((allocation.reserve/budgetData.totalBudget)*100).toFixed(1)}%)\n\n`;
  
  return report;
}

/**
 * Генерация детального отчета по секции с использованием интегрированных алгоритмов
 */
export function generateDetailedSectionReport(
  _sectionId: string, 
  assessment: ComprehensiveRoadAssessment, 
  section: RoadSection
): string {
  return generateSectionReport(assessment, section);
}

// ==================== СОВМЕСТИМОСТЬ СО СТАРЫМ API ====================

/**
 * Старая функция для обратной совместимости
 */
export function planRepairWorks(
  sections: SimpleRoadSection[],
  availableBudget: number,
  expertAssessments?: Map<string, ExpertAssessment>
): {
  currentRepairProjects: RepairProject[];
  capitalRepairProjects: RepairProject[];
  reconstructionProjects: RepairProject[];
  totalCost: number;
  budgetUtilization: number;
  complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}>;
} {
  console.log('=== Использование устаревшей функции planRepairWorks ===');
  console.log('Рекомендуется использовать planRepairWorksWithBlockOneData() для полной интеграции');
  
  // Преобразуем простые секции в детальные
  const detailedSections = sections.map(convertSimpleToDetailedSection);
  
  // Устанавливаем временный бюджет для совместимости
  const tempBudgetData = {
    q1Value: availableBudget * 0.7,
    q2Value: availableBudget * 0.3,
    q1Items: [],
    q2Items: [],
    sessionId: 'legacy-' + Date.now()
  };
  
  setBlockOneBudgetData(tempBudgetData);
  
  try {
    const result = planRepairWorksWithBlockOneData(detailedSections, expertAssessments, false);
    
    return {
      currentRepairProjects: result.currentRepairProjects,
      capitalRepairProjects: result.capitalRepairProjects,
      reconstructionProjects: result.reconstructionProjects,
      totalCost: result.totalCost,
      budgetUtilization: result.budgetUtilization,
      complianceReport: result.complianceReport
    };
  } finally {
    clearBlockOneBudgetData();
  }
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


// ==================== ЭКСПОРТ ====================

export default {
  // Функции интеграции с Блоком 1
  setBlockOneBudgetData,
  getBlockOneBudgetData,
  hasBlockOneBudgetData,
  clearBlockOneBudgetData,
  getBudgetAllocation,
  setBudgetAllocation,
  
  // Основные функции планирования
  planRepairWorksWithBlockOneData,
  planRepairWorks, // Для совместимости
  
  // Функции определения типов работ
  determineWorkTypeByTechnicalCondition,
  
  // Проверочные функции
  checkCategoryComplianceByIntensity,
  checkFrictionCompliance,
  
  // Функции отчетности
  generateDetailedRepairPlanReport,
  generateDetailedSectionReport,
  
  // Интеграция с алгоритмами
  executeComprehensiveAssessment,
  assessLocalRoadSection,
  performLocalRoadRanking,
  determineWorkTypeByExpertMethod,
  calculateDetailedWorkCost,
  performDetailedCostBenefitAnalysis,
  
  // Константы
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  EXPERT_ASSESSMENT_THRESHOLDS
};