// src/modules/block_three.ts - Обновленная версия с интеграцией Блока 1

/**
 * РОЗДІЛ IV - Визначення обсягу та механізм розподілу загального обсягу бюджетних коштів,
 * що спрямовується на фінансове забезпечення заходів з поточного ремонту, капітального
 * ремонту та реконструкції автомобільних доріг загального користування
 */

// ==================== ІМПОРТИ З БЛОКУ 1 ====================
import { type BudgetItem } from './block_one';

// ==================== ТИПИ ТА ІНТЕРФЕЙСИ ====================

// Інтерфейс для збереження результатів Блоку 1
export interface BlockOneBudgetData {
  q1Value: number;           // Державні дороги
  q2Value: number;           // Місцеві дороги
  totalBudget: number;       // Загальний бюджет
  q1Items: BudgetItem[];     // Елементи Q1
  q2Items: BudgetItem[];     // Елементи Q2
  sessionId: string;         // ID сесії
  timestamp: Date;           // Час отримання даних
}

// Розподіл бюджету між типами робіт
export interface BudgetAllocation {
  currentRepair: number;     // Поточний ремонт
  capitalRepair: number;     // Капітальний ремонт
  reconstruction: number;    // Реконструкція
  reserve: number;           // Резерв
}

export interface RoadTechnicalCondition {
  intensityCoefficient: number;      // Коефіцієнт інтенсивності руху
  strengthCoefficient: number;       // Коефіцієнт міцності дорожнього одягу
  evennessCoefficient: number;       // Коефіцієнт рівності
  rutCoefficient: number;            // Коефіцієнт колійності
  frictionCoefficient: number;       // Коефіцієнт зчеплення
}

export interface RoadSection {
  id: string;
  name: string;
  category: number;
  length: number;                    // км
  significance: 'state' | 'local';
  technicalCondition: RoadTechnicalCondition;
  trafficIntensity: number;          // авт./добу
  estimatedCost?: number;            // тис. грн
}

export interface ExpertAssessment {
  operationalStateIndex: number;    // Індекс J експлуатаційного стану (1-10)
  trafficIntensity: number;         // авт./добу
}

export interface RepairProject {
  section: RoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;            // тис. грн
  economicNPV?: number;            // ENPV для ранжування
  reasoning: string;
  allocatedBudgetSource: 'q1' | 'q2'; // З якого бюджету фінансується
}

// ==================== ГЛОБАЛЬНЕ СХОВИЩЕ ДАНИХ БЛОКУ 1 ====================

let blockOneBudgetData: BlockOneBudgetData | null = null;
let budgetAllocation: BudgetAllocation | null = null;

/**
 * Встановити дані з Блоку 1
 */
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
    q1Items: [...data.q1Items], // Deep copy
    q2Items: [...data.q2Items], // Deep copy
    sessionId: data.sessionId,
    timestamp: new Date()
  };
  
  // Автоматично розподіляємо бюджет
  calculateBudgetAllocation();
  
  console.log('Block One budget data saved to Block Three:', blockOneBudgetData);
}

/**
 * Отримати дані Блоку 1
 */
export function getBlockOneBudgetData(): BlockOneBudgetData | null {
  return blockOneBudgetData;
}

/**
 * Перевірити чи є дані Блоку 1
 */
export function hasBlockOneBudgetData(): boolean {
  return blockOneBudgetData !== null && blockOneBudgetData.totalBudget > 0;
}

/**
 * Очистити дані Блоку 1
 */
export function clearBlockOneBudgetData(): void {
  blockOneBudgetData = null;
  budgetAllocation = null;
  console.log('Block One budget data cleared from Block Three');
}

/**
 * Розрахувати розподіл бюджету між типами робіт
 */
function calculateBudgetAllocation(): void {
  if (!blockOneBudgetData) return;
  
  const totalBudget = blockOneBudgetData.totalBudget;
  
  // Рекомендований розподіл згідно з методикою
  budgetAllocation = {
    currentRepair: totalBudget * 0.30,    // 30% на поточний ремонт
    capitalRepair: totalBudget * 0.45,    // 45% на капітальний ремонт
    reconstruction: totalBudget * 0.20,   // 20% на реконструкцію
    reserve: totalBudget * 0.05           // 5% резерв
  };
  
  console.log('Budget allocation calculated:', budgetAllocation);
}

/**
 * Отримати розподіл бюджету
 */
export function getBudgetAllocation(): BudgetAllocation | null {
  return budgetAllocation;
}

/**
 * Встановити користувацький розподіл бюджету
 */
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

// ==================== КОНСТАНТИ ====================

// Гранично допустимі значення згідно з ДБН В.2.3-4:2015 (таблиця 8.2)
const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 0.95,
  4: 0.90,
  5: 0.85
};

// Максимальна розрахункова добова інтенсивність згідно з ДБН В.2.3-4:2015
const MAX_DESIGN_INTENSITY_BY_CATEGORY: Record<number, number> = {
  1: 20000,
  2: 12000,
  3: 6000,
  4: 2000,
  5: 500
};

const REQUIRED_FRICTION_COEFFICIENT = 0.35;

// ==================== ОСНОВНІ ФУНКЦІЇ РОЗДІЛУ IV ====================

/**
 * 4.2.1-4.2.3 - Визначення виду робіт за показниками технічного стану
 */
export function determineWorkTypeByTechnicalCondition(
  section: RoadSection
): 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' {
  const condition = section.technicalCondition;
  
  // 4.2.3.1 - Перевірка інтенсивності руху для реконструкції
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
  
  // Перевіряємо чи перевищує фактична інтенсивність максимальну розрахункову для категорії
  if (section.trafficIntensity > maxDesignIntensity) {
    console.log(`Секція ${section.id}: потребує реконструкції (інтенсивність ${section.trafficIntensity} > ${maxDesignIntensity})`);
    return 'reconstruction';
  }
  
  // Додаткова перевірка коефіцієнта інтенсивності
  if (condition.intensityCoefficient < 1.0) {
    console.log(`Секція ${section.id}: потребує реконструкції (коефіцієнт інтенсивності ${condition.intensityCoefficient})`);
    return 'reconstruction';
  }
  
  // 4.2.3.2 - Перевірка міцності для капітального ремонту
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
  
  if (condition.strengthCoefficient < minStrengthCoeff) {
    console.log(`Секція ${section.id}: потребує капітального ремонту (коефіцієнт міцності ${condition.strengthCoefficient} < ${minStrengthCoeff})`);
    return 'capital_repair';
  }
  
  // 4.2.3.3-4.2.3.5 - Перевірка рівності, колійності та зчеплення для поточного ремонту
  if (condition.evennessCoefficient < 1.0 || 
      condition.rutCoefficient < 1.0) {
    console.log(`Секція ${section.id}: потребує поточного ремонту (рівність або колійність)`);
    return 'current_repair';
  }
  
  // Перевірка коефіцієнта зчеплення відносно потрібного значення
  const actualFrictionValue = condition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
  if (actualFrictionValue < REQUIRED_FRICTION_COEFFICIENT) {
    console.log(`Секція ${section.id}: потребує поточного ремонту (зчеплення ${actualFrictionValue.toFixed(3)} < ${REQUIRED_FRICTION_COEFFICIENT})`);
    return 'current_repair';
  }
  
  console.log(`Секція ${section.id}: роботи не потребуються`);
  return 'no_work_needed';
}

/**
 * 4.4.3.1 - Експертний експрес-метод для місцевих доріг
 */
export function determineWorkTypeByExpertAssessment(
  assessment: ExpertAssessment
): 'current_repair' | 'capital_repair' | 'no_work_needed' {
  const j = assessment.operationalStateIndex;
  
  if (j >= 8) {
    return 'no_work_needed';
  } else if (j >= 5 && j <= 7) {
    return 'current_repair';
  } else if (j <= 4) {
    return 'capital_repair';
  }
  
  return 'no_work_needed';
}

/**
 * Функція для перевірки відповідності дороги своїй категорії за інтенсивністю
 */
export function checkCategoryComplianceByIntensity(section: RoadSection): {
  isCompliant: boolean;
  recommendedCategory?: number;
  maxAllowedIntensity: number;
} {
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
  const isCompliant = section.trafficIntensity <= maxDesignIntensity;
  
  let recommendedCategory: number | undefined;
  
  if (!isCompliant) {
    // Знаходимо мінімальну категорію, яка відповідає фактичній інтенсивності
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

/**
 * Функція для перевірки відповідності фактичного зчеплення потрібному
 */
export function checkFrictionCompliance(
  actualFrictionCoefficient: number
): {
  isCompliant: boolean;
  actualValue: number;
  requiredValue: number;
  deficit: number;
} {
  const actualValue = actualFrictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
  const isCompliant = actualValue >= REQUIRED_FRICTION_COEFFICIENT;
  const deficit = isCompliant ? 0 : REQUIRED_FRICTION_COEFFICIENT - actualValue;
  
  return {
    isCompliant,
    actualValue,
    requiredValue: REQUIRED_FRICTION_COEFFICIENT,
    deficit
  };
}

/**
 * 4.2.4 - Визначення орієнтовної вартості робіт
 */
export function estimateWorkCost(
  section: RoadSection, 
  workType: 'current_repair' | 'capital_repair' | 'reconstruction'
): number {
  // Базові норми вартості на 1 км (у цінах 2023 року, тис. грн/км)
  const baseCosts = {
    current_repair: {
      1: 3000,    // I категорія
      2: 2000,    // II категорія  
      3: 1500,    // III категорія
      4: 1000,    // IV категорія
      5: 800      // V категорія
    },
    capital_repair: {
      1: 15000,
      2: 12000,
      3: 10000,
      4: 8000,
      5: 6000
    },
    reconstruction: {
      1: 50000,
      2: 40000,
      3: 30000,
      4: 25000,
      5: 20000
    }
  };
  
  const category = section.category as 1 | 2 | 3 | 4 | 5;
  const categoryBaseCost = baseCosts[workType][category] || baseCosts[workType][5];
  
  // Корекція вартості залежно від перевищення інтенсивності
  let intensityCorrection = 1.0;
  const complianceCheck = checkCategoryComplianceByIntensity(section);
  
  if (!complianceCheck.isCompliant && workType === 'reconstruction') {
    // Збільшуємо вартість реконструкції при перевищенні інтенсивності
    const excessRatio = section.trafficIntensity / complianceCheck.maxAllowedIntensity;
    intensityCorrection = 1.0 + (excessRatio - 1.0) * 0.3; // +30% за кожну одиницю перевищення
  }
  
  const estimatedCost = categoryBaseCost * section.length * intensityCorrection;
  
  console.log(`Вартість ${workType} для секції ${section.id}: ${estimatedCost.toFixed(2)} тис. грн (корекція: ${intensityCorrection.toFixed(2)})`);
  return estimatedCost;
}

/**
 * 4.2.7 - Формування переліку об'єктів у межах бюджету з урахуванням даних Блоку 1
 */
export function selectProjectsWithinBudget(
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
  
  const filteredProjects = rankedProjects.filter(p => p.workType === workType);
  
  for (const project of filteredProjects) {
    if (project.estimatedCost <= remainingBudget) {
      selectedProjects.push({
        ...project,
        allocatedBudgetSource: project.section.significance === 'state' ? 'q1' : 'q2'
      });
      remainingBudget -= project.estimatedCost;
      console.log(`Проект ${project.section.id} включено до плану ${workType}. Залишок бюджету: ${remainingBudget.toFixed(2)} тис. грн`);
    } else {
      console.log(`Проект ${project.section.id} не поміщається в бюджет ${workType}`);
    }
  }
  
  return selectedProjects;
}

/**
 * Комплексний алгоритм планування ремонтів з використанням даних Блоку 1
 */
export function planRepairWorksWithBlockOneData(
  sections: RoadSection[],
  expertAssessments?: Map<string, ExpertAssessment>
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
} {
  console.log('=== Початок планування ремонтних робіт з даними Блоку 1 ===');
  
  if (!hasBlockOneBudgetData()) {
    throw new Error('Немає даних з Блоку 1. Спочатку передайте результати розрахунків бюджету.');
  }
  
  const allProjects: RepairProject[] = [];
  const complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}> = [];
  
  // Крок 1: Визначення виду робіт для кожної секції
  for (const section of sections) {
    // Перевіряємо відповідність нормативам
    const categoryCompliance = checkCategoryComplianceByIntensity(section);
    const frictionCompliance = checkFrictionCompliance(section.technicalCondition.frictionCoefficient);
    
    complianceReport.push({
      sectionId: section.id,
      categoryCompliance: categoryCompliance.isCompliant,
      frictionCompliance: frictionCompliance.isCompliant
    });
    
    let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
    
    if (section.significance === 'local' && expertAssessments?.has(section.id)) {
      // Для місцевих доріг можна використовувати експертний метод
      const assessment = expertAssessments.get(section.id)!;
      const expertWorkType = determineWorkTypeByExpertAssessment(assessment);
      workType = expertWorkType === 'no_work_needed' ? 'no_work_needed' : expertWorkType;
    } else {
      // Використання технічних показників
      workType = determineWorkTypeByTechnicalCondition(section);
    }
    
    if (workType !== 'no_work_needed') {
      const estimatedCost = estimateWorkCost(section, workType);
      
      allProjects.push({
        section,
        workType,
        priority: 0,
        estimatedCost,
        allocatedBudgetSource: section.significance === 'state' ? 'q1' : 'q2',
        reasoning: `Визначено за технічним станом. Категорія: ${categoryCompliance.isCompliant ? 'відповідає' : 'не відповідає'}, Зчеплення: ${frictionCompliance.isCompliant ? 'достатнє' : 'недостатнє'}`
      });
    }
  }
  
  console.log(`Загальна кількість проектів: ${allProjects.length}`);
  
  // Крок 2: Ранжування проектів
  const currentRepairProjects = rankCurrentRepairProjects(allProjects);
  const capitalAndReconstructionProjects = rankCapitalAndReconstructionProjects(allProjects);
  
  // Крок 3: Відбір проектів у межах розподіленого бюджету
  const selectedCurrentRepair = selectProjectsWithinBudget(currentRepairProjects, 'current_repair');
  const selectedCapitalRepair = selectProjectsWithinBudget(capitalAndReconstructionProjects, 'capital_repair');
  const selectedReconstruction = selectProjectsWithinBudget(capitalAndReconstructionProjects, 'reconstruction');
  
  // Розрахунок використаних коштів
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
  
  console.log('=== Результати планування з даними Блоку 1 ===');
  console.log(`Поточний ремонт: ${selectedCurrentRepair.length} проектів (${currentRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Капітальний ремонт: ${selectedCapitalRepair.length} проектів (${capitalRepairUsed.toFixed(2)} тис. грн)`);
  console.log(`Реконструкція: ${selectedReconstruction.length} проектів (${reconstructionUsed.toFixed(2)} тис. грн)`);
  console.log(`Загальна вартість: ${totalCost.toFixed(2)} тис. грн`);
  console.log(`Використання бюджету: ${budgetUtilization.toFixed(1)}%`);
  console.log(`Резерв: ${budgetBreakdown.reserveRemaining.toFixed(2)} тис. грн`);
  
  return {
    currentRepairProjects: selectedCurrentRepair,
    capitalRepairProjects: selectedCapitalRepair,
    reconstructionProjects: selectedReconstruction,
    totalCost,
    budgetUtilization,
    budgetBreakdown,
    blockOneBudgetInfo: blockOneBudgetData,
    complianceReport
  };
}

// ==================== ФУНКЦІЇ РАНЖУВАННЯ (БЕЗ ЗМІН) ====================

export function rankCurrentRepairProjects(projects: RepairProject[]): RepairProject[] {
  return projects
    .filter(p => p.workType === 'current_repair')
    .sort((a, b) => {
      const conditionA = a.section.technicalCondition;
      const conditionB = b.section.technicalCondition;
      
      const frictionDeficitA = Math.max(0, REQUIRED_FRICTION_COEFFICIENT - (conditionA.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT));
      const frictionDeficitB = Math.max(0, REQUIRED_FRICTION_COEFFICIENT - (conditionB.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT));
      
      const priorityA = Math.min(conditionA.evennessCoefficient, conditionA.rutCoefficient) + 
                       frictionDeficitA * 10 + 
                       (1 / (a.section.trafficIntensity + 1));
      const priorityB = Math.min(conditionB.evennessCoefficient, conditionB.rutCoefficient) + 
                       frictionDeficitB * 10 +
                       (1 / (b.section.trafficIntensity + 1));
      
      return priorityA - priorityB;
    })
    .map((project, index) => ({
      ...project,
      priority: index + 1
    }));
}

export function rankCapitalAndReconstructionProjects(projects: RepairProject[]): RepairProject[] {
  return projects
    .filter(p => p.workType === 'capital_repair' || p.workType === 'reconstruction')
    .sort((a, b) => {
      const enpvPerKmA = (a.economicNPV || 0) / a.section.length;
      const enpvPerKmB = (b.economicNPV || 0) / b.section.length;
      
      if (Math.abs(enpvPerKmA - enpvPerKmB) < 0.01) {
        if (a.workType === 'reconstruction' && b.workType === 'reconstruction') {
          const complianceA = checkCategoryComplianceByIntensity(a.section);
          const complianceB = checkCategoryComplianceByIntensity(b.section);
          
          const excessA = complianceA.isCompliant ? 0 : a.section.trafficIntensity - complianceA.maxAllowedIntensity;
          const excessB = complianceB.isCompliant ? 0 : b.section.trafficIntensity - complianceB.maxAllowedIntensity;
          
          return excessB - excessA;
        }
        
        const strengthDeficitA = (MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[a.section.category] || 0.85) - a.section.technicalCondition.strengthCoefficient;
        const strengthDeficitB = (MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[b.section.category] || 0.85) - b.section.technicalCondition.strengthCoefficient;
        
        return strengthDeficitB - strengthDeficitA;
      }
      
      return enpvPerKmB - enpvPerKmA;
    })
    .map((project, index) => ({
      ...project,
      priority: index + 1
    }));
}

/**
 * Генерація детального звіту з даними Блоку 1
 */
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

// ==================== ЕКСПОРТ ФУНКЦІЙ ДЛЯ СУМІСНОСТІ ====================

// Оригінальна функція для зворотної сумісності
export function planRepairWorks(
  sections: RoadSection[],
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
  console.log('=== Використання старої функції planRepairWorks ===');
  console.log('Рекомендується використовувати planRepairWorksWithBlockOneData() для інтеграції з Блоком 1');
  
  const allProjects: RepairProject[] = [];
  const complianceReport: Array<{sectionId: string, categoryCompliance: boolean, frictionCompliance: boolean}> = [];
  
  // Крок 1: Визначення виду робіт для кожної секції
  for (const section of sections) {
    const categoryCompliance = checkCategoryComplianceByIntensity(section);
    const frictionCompliance = checkFrictionCompliance(section.technicalCondition.frictionCoefficient);
    
    complianceReport.push({
      sectionId: section.id,
      categoryCompliance: categoryCompliance.isCompliant,
      frictionCompliance: frictionCompliance.isCompliant
    });
    
    let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
    
    if (section.significance === 'local' && expertAssessments?.has(section.id)) {
      const assessment = expertAssessments.get(section.id)!;
      const expertWorkType = determineWorkTypeByExpertAssessment(assessment);
      workType = expertWorkType === 'no_work_needed' ? 'no_work_needed' : expertWorkType;
    } else {
      workType = determineWorkTypeByTechnicalCondition(section);
    }
    
    if (workType !== 'no_work_needed') {
      const estimatedCost = estimateWorkCost(section, workType);
      
      allProjects.push({
        section,
        workType,
        priority: 0,
        estimatedCost,
        allocatedBudgetSource: section.significance === 'state' ? 'q1' : 'q2',
        reasoning: `Визначено за технічним станом. Категорія: ${categoryCompliance.isCompliant ? 'відповідає' : 'не відповідає'}, Зчеплення: ${frictionCompliance.isCompliant ? 'достатнє' : 'недостатнє'}`
      });
    }
  }
  
  // Крок 2: Ранжування проектів
  const currentRepairProjects = rankCurrentRepairProjects(allProjects);
  const capitalAndReconstructionProjects = rankCapitalAndReconstructionProjects(allProjects);
  
  // Крок 3: Відбір проектів у межах бюджету (стара логіка)
  const selectedCurrentRepair = selectProjectsWithinBudgetLegacy(currentRepairProjects, availableBudget * 0.3);
  const remainingBudget = availableBudget - selectedCurrentRepair.reduce((sum, p) => sum + p.estimatedCost, 0);
  
  const selectedCapitalAndReconstruction = selectProjectsWithinBudgetLegacy(capitalAndReconstructionProjects, remainingBudget);
  
  const capitalRepairProjects = selectedCapitalAndReconstruction.filter(p => p.workType === 'capital_repair');
  const reconstructionProjects = selectedCapitalAndReconstruction.filter(p => p.workType === 'reconstruction');
  
  const totalCost = [...selectedCurrentRepair, ...selectedCapitalAndReconstruction]
    .reduce((sum, project) => sum + project.estimatedCost, 0);
  
  const budgetUtilization = (totalCost / availableBudget) * 100;
  
  return {
    currentRepairProjects: selectedCurrentRepair,
    capitalRepairProjects,
    reconstructionProjects,
    totalCost,
    budgetUtilization,
    complianceReport
  };
}

// Допоміжна функція для старої логіки розподілу бюджету
function selectProjectsWithinBudgetLegacy(
  rankedProjects: RepairProject[], 
  availableBudget: number
): RepairProject[] {
  const selectedProjects: RepairProject[] = [];
  let remainingBudget = availableBudget;
  
  for (const project of rankedProjects) {
    if (project.estimatedCost <= remainingBudget) {
      selectedProjects.push(project);
      remainingBudget -= project.estimatedCost;
      console.log(`Проект ${project.section.id} включено до плану. Залишок бюджету: ${remainingBudget.toFixed(2)} тис. грн`);
    } else {
      console.log(`Проект ${project.section.id} не поміщається в бюджет`);
    }
  }
  
  return selectedProjects;
}

/**
 * Генерація звіту про планування ремонтів (стара версія)
 */
export function generateRepairPlanReport(
  planResult: ReturnType<typeof planRepairWorks>
): string {
  const { currentRepairProjects, capitalRepairProjects, reconstructionProjects, totalCost, budgetUtilization, complianceReport } = planResult;
  
  let report = '# ЗВІТ ПРО ПЛАНУВАННЯ РЕМОНТНИХ РОБІТ\n\n';
  
  // Додаємо звіт про відповідність нормативам
  report += '## АНАЛІЗ ВІДПОВІДНОСТІ НОРМАТИВАМ\n';
  const nonCompliantSections = complianceReport.filter(r => !r.categoryCompliance || !r.frictionCompliance);
  if (nonCompliantSections.length > 0) {
    report += 'Секції, що не відповідають нормативам:\n';
    nonCompliantSections.forEach(section => {
      const issues = [];
      if (!section.categoryCompliance) issues.push('перевищення інтенсивності для категорії');
      if (!section.frictionCompliance) issues.push('недостатнє зчеплення');
      report += `- ${section.sectionId}: ${issues.join(', ')}\n`;
    });
  } else {
    report += 'Всі секції відповідають нормативним вимогам.\n';
  }
  
  report += '\n## ПОТОЧНИЙ РЕМОНТ\n';
  currentRepairProjects.forEach((project, index) => {
    const frictionCheck = checkFrictionCompliance(project.section.technicalCondition.frictionCoefficient);
    const frictionStatus = frictionCheck.isCompliant ? '✓' : `✗ (дефіцит: ${frictionCheck.deficit.toFixed(3)})`;
    report += `${index + 1}. ${project.section.name} (${project.section.length} км) - ${project.estimatedCost.toFixed(0)} тис. грн [Зчеплення: ${frictionStatus}]\n`;
  });
  
  report += '\n## КАПІТАЛЬНИЙ РЕМОНТ\n';
  capitalRepairProjects.forEach((project, index) => {
    const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[project.section.category] || 0.85;
    const strengthDeficit = Math.max(0, minStrength - project.section.technicalCondition.strengthCoefficient);
    report += `${index + 1}. ${project.section.name} (${project.section.length} км) - ${project.estimatedCost.toFixed(0)} тис. грн [Дефіцит міцності: ${strengthDeficit.toFixed(3)}]\n`;
  });
  
  report += '\n## РЕКОНСТРУКЦІЯ\n';
  reconstructionProjects.forEach((project, index) => {
    const complianceCheck = checkCategoryComplianceByIntensity(project.section);
    const intensityStatus = complianceCheck.isCompliant ? 
      '✓' : 
      `✗ (перевищення: ${project.section.trafficIntensity - complianceCheck.maxAllowedIntensity} авт./добу)`;
    report += `${index + 1}. ${project.section.name} (${project.section.length} км) - ${project.estimatedCost.toFixed(0)} тис. грн [Інтенсивність: ${intensityStatus}]\n`;
  });
  
  report += `\n## ПІДСУМОК\n`;
  report += `Загальна вартість: ${totalCost.toFixed(0)} тис. грн\n`;
  report += `Використання бюджету: ${budgetUtilization.toFixed(1)}%\n`;
  report += `Потрібний коефіцієнт зчеплення: ${REQUIRED_FRICTION_COEFFICIENT}\n`;
  
  return report;
}

// ==================== УТИЛІТАРНІ ФУНКЦІЇ ====================

/**
 * Отримати статистику по бюджету
 */
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

/**
 * Отримати інформацію про джерела бюджету з Блоку 1
 */
export function getBlockOneBudgetSources(): {
  q1Sources: Array<{id: string, name: string, value: number}>;
  q2Sources: Array<{id: string, name: string, value: number}>;
} | null {
  const budgetData = getBlockOneBudgetData();
  
  if (!budgetData) return null;
  
  const q1Sources = budgetData.q1Items
    .filter(item => item.value !== null && item.value > 0)
    .map(item => ({
      id: item.id,
      name: item.name,
      value: item.value!
    }));
    
  const q2Sources = budgetData.q2Items
    .filter(item => item.value !== null && item.value > 0)
    .map(item => ({
      id: item.id,
      name: item.name,
      value: item.value!
    }));
  
  return { q1Sources, q2Sources };
}

export default {
  // Функції інтеграції з Блоком 1
  setBlockOneBudgetData,
  getBlockOneBudgetData,
  hasBlockOneBudgetData,
  clearBlockOneBudgetData,
  getBudgetAllocation,
  setBudgetAllocation,
  planRepairWorksWithBlockOneData,
  generateDetailedRepairPlanReport,
  getBudgetStatistics,
  getBlockOneBudgetSources,
  
  // Оригінальні функції
  determineWorkTypeByTechnicalCondition,
  determineWorkTypeByExpertAssessment,
  estimateWorkCost,
  rankCurrentRepairProjects,
  rankCapitalAndReconstructionProjects,
  selectProjectsWithinBudget,
  planRepairWorks,
  generateRepairPlanReport,
  checkCategoryComplianceByIntensity,
  checkFrictionCompliance,
  
  // Константи
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  REQUIRED_FRICTION_COEFFICIENT
};