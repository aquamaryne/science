/**
 * РОЗДІЛ IV - Визначення обсягу та механізм розподілу загального обсягу бюджетних коштів,
 * що спрямовується на фінансове забезпечення заходів з поточного ремонту, капітального
 * ремонту та реконструкції автомобільних доріг загального користування
 */

// ==================== ТИПИ ТА ІНТЕРФЕЙСИ ====================

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
 * 4.2.6.1 - Ранжування об'єктів поточного ремонту
 */
export function rankCurrentRepairProjects(projects: RepairProject[]): RepairProject[] {
  return projects
    .filter(p => p.workType === 'current_repair')
    .sort((a, b) => {
      const conditionA = a.section.technicalCondition;
      const conditionB = b.section.technicalCondition;
      
      // Додаємо вагу для зчеплення відносно потрібного коефіцієнта
      const frictionDeficitA = Math.max(0, REQUIRED_FRICTION_COEFFICIENT - (conditionA.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT));
      const frictionDeficitB = Math.max(0, REQUIRED_FRICTION_COEFFICIENT - (conditionB.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT));
      
      // Сортування за найменшими коефіцієнтами, дефіцитом зчеплення та найвищою інтенсивністю
      const priorityA = Math.min(conditionA.evennessCoefficient, conditionA.rutCoefficient) + 
                       frictionDeficitA * 10 + // збільшуємо вагу дефіциту зчеплення
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

/**
 * 4.2.6 - Ранжування об'єктів капітального ремонту та реконструкції за ENPV
 */
export function rankCapitalAndReconstructionProjects(projects: RepairProject[]): RepairProject[] {
  return projects
    .filter(p => p.workType === 'capital_repair' || p.workType === 'reconstruction')
    .sort((a, b) => {
      const enpvPerKmA = (a.economicNPV || 0) / a.section.length;
      const enpvPerKmB = (b.economicNPV || 0) / b.section.length;
      
      // Якщо ENPV однакові або відсутні, сортуємо за критичністю стану
      if (Math.abs(enpvPerKmA - enpvPerKmB) < 0.01) {
        // Для реконструкції враховуємо перевищення інтенсивності
        if (a.workType === 'reconstruction' && b.workType === 'reconstruction') {
          const complianceA = checkCategoryComplianceByIntensity(a.section);
          const complianceB = checkCategoryComplianceByIntensity(b.section);
          
          const excessA = complianceA.isCompliant ? 0 : a.section.trafficIntensity - complianceA.maxAllowedIntensity;
          const excessB = complianceB.isCompliant ? 0 : b.section.trafficIntensity - complianceB.maxAllowedIntensity;
          
          return excessB - excessA; // Більше перевищення = вищий пріоритет
        }
        
        // Для капремонту - за дефіцитом міцності
        const strengthDeficitA = (MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[a.section.category] || 0.85) - a.section.technicalCondition.strengthCoefficient;
        const strengthDeficitB = (MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[b.section.category] || 0.85) - b.section.technicalCondition.strengthCoefficient;
        
        return strengthDeficitB - strengthDeficitA; // Більший дефіцит = вищий пріоритет
      }
      
      return enpvPerKmB - enpvPerKmA; // Спадання за ENPV
    })
    .map((project, index) => ({
      ...project,
      priority: index + 1
    }));
}

/**
 * 4.4.6.3 - Ранжування місцевих доріг за експертним методом
 */
export function rankLocalRoadsByExpertMethod(
  projects: RepairProject[], 
  assessments: Map<string, ExpertAssessment>
): RepairProject[] {
  return projects
    .sort((a, b) => {
      const assessmentA = assessments.get(a.section.id);
      const assessmentB = assessments.get(b.section.id);
      
      if (!assessmentA || !assessmentB) return 0;
      
      // Сортування за найменшими індексами та найвищою інтенсивністю
      const priorityA = assessmentA.operationalStateIndex - (assessmentA.trafficIntensity / 10000);
      const priorityB = assessmentB.operationalStateIndex - (assessmentB.trafficIntensity / 10000);
      
      return priorityA - priorityB;
    })
    .map((project, index) => ({
      ...project,
      priority: index + 1
    }));
}

/**
 * 4.2.7 - Формування переліку об'єктів у межах бюджету
 */
export function selectProjectsWithinBudget(
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
 * Комплексний алгоритм планування ремонтів згідно з розділом IV
 */
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
  console.log('=== Початок планування ремонтних робіт ===');
  
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
        reasoning: `Визначено за технічним станом. Категорія: ${categoryCompliance.isCompliant ? 'відповідає' : 'не відповідає'}, Зчеплення: ${frictionCompliance.isCompliant ? 'достатнє' : 'недостатнє'}`
      });
    }
  }
  
  console.log(`Загальна кількість проектів: ${allProjects.length}`);
  
  // Крок 2: Ранжування проектів
  const currentRepairProjects = rankCurrentRepairProjects(allProjects);
  const capitalAndReconstructionProjects = rankCapitalAndReconstructionProjects(allProjects);
  
  // Крок 3: Відбір проектів у межах бюджету
  const selectedCurrentRepair = selectProjectsWithinBudget(currentRepairProjects, availableBudget * 0.3);
  const remainingBudget = availableBudget - selectedCurrentRepair.reduce((sum, p) => sum + p.estimatedCost, 0);
  
  const selectedCapitalAndReconstruction = selectProjectsWithinBudget(capitalAndReconstructionProjects, remainingBudget);
  
  const capitalRepairProjects = selectedCapitalAndReconstruction.filter(p => p.workType === 'capital_repair');
  const reconstructionProjects = selectedCapitalAndReconstruction.filter(p => p.workType === 'reconstruction');
  
  const totalCost = [...selectedCurrentRepair, ...selectedCapitalAndReconstruction]
    .reduce((sum, project) => sum + project.estimatedCost, 0);
  
  const budgetUtilization = (totalCost / availableBudget) * 100;
  
  console.log('=== Результати планування ===');
  console.log(`Поточний ремонт: ${selectedCurrentRepair.length} проектів`);
  console.log(`Капітальний ремонт: ${capitalRepairProjects.length} проектів`);
  console.log(`Реконструкція: ${reconstructionProjects.length} проектів`);
  console.log(`Загальна вартість: ${totalCost.toFixed(2)} тис. грн`);
  console.log(`Використання бюджету: ${budgetUtilization.toFixed(1)}%`);
  
  return {
    currentRepairProjects: selectedCurrentRepair,
    capitalRepairProjects,
    reconstructionProjects,
    totalCost,
    budgetUtilization,
    complianceReport
  };
}

// ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================

/**
 * Генерація звіту про планування ремонтів
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

export default {
  determineWorkTypeByTechnicalCondition,
  determineWorkTypeByExpertAssessment,
  estimateWorkCost,
  rankCurrentRepairProjects,
  rankCapitalAndReconstructionProjects,
  rankLocalRoadsByExpertMethod,
  selectProjectsWithinBudget,
  planRepairWorks,
  generateRepairPlanReport,
  checkCategoryComplianceByIntensity,
  checkFrictionCompliance,
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  REQUIRED_FRICTION_COEFFICIENT
};
