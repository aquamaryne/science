/**
 * Сервис для управления результатами расчетов
 * Сохраняет результаты всех блоков в памяти и предоставляет методы для работы с ними
 */

import type { BudgetItem } from '../modules/block_one';
import type { RoadSectionUI } from '../components/view/block_three_page';

// ==================== ТИПЫ РЕЗУЛЬТАТОВ ====================

export interface BlockOneResults {
  id: 'block_one';
  timestamp: Date;
  stateRoadFunding: {
    items: BudgetItem[];
    q1Result: number;
    formula: string;
  };
  localRoadFunding: {
    items: BudgetItem[];
    q2Result: number;
    formula: string;
  };
  totalBudget: number; // Q1 + Q2
}

export interface BlockTwoResults {
  id: 'block_two';
  timestamp: Date;
  sections: RoadSectionUI[];
  summary: {
    totalSections: number;
    needRepair: number;
    totalCost: number;
    byWorkType: {
      reconstruction: { count: number; cost: number };
      capitalRepair: { count: number; cost: number };
      currentRepair: { count: number; cost: number };
      noWork: { count: number; cost: number };
    };
  };
  ranking: {
    byEnpv: RoadSectionUI[];
    currentRepairPriority: RoadSectionUI[];
  };
}

export interface BlockThreeResults {
  id: 'block_three';
  timestamp: Date;
  planningData: {
    budget: number;
    utilizationPercent: number;
    selectedProjects: {
      currentRepair: number;
      capitalRepair: number;
      reconstruction: number;
    };
  };
  complianceAnalysis: {
    compliantSections: number;
    nonCompliantSections: number;
    categoryIssues: number;
    frictionIssues: number;
  };
  reportText: string;
}

export interface CalculationSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  blockOneResults?: BlockOneResults;
  blockTwoResults?: BlockTwoResults;
  blockThreeResults?: BlockThreeResults;
  isComplete: boolean;
}

// ==================== СЕРВИС УПРАВЛЕНИЯ РЕЗУЛЬТАТАМИ ====================

class CalculationResultsService {
  private sessions: Map<string, CalculationSession> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Создает новую сессию расчетов
   */
  createSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: CalculationSession = {
      id: sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false
    };
    
    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    console.log(`Создана новая сессия расчетов: ${sessionId}`);
    return sessionId;
  }

  /**
   * Устанавливает текущую сессию
   */
  setCurrentSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * Получает текущую сессию
   */
  getCurrentSession(): CalculationSession | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }

  /**
   * Сохраняет результаты Блока 1
   */
  saveBlockOneResults(
    stateRoadItems: BudgetItem[],
    q1Result: number,
    localRoadItems: BudgetItem[],
    q2Result: number
  ): boolean {
    const session = this.getCurrentSession();
    if (!session) {
      console.error('Нет активной сессии для сохранения результатов Блока 1');
      return false;
    }

    const blockOneResults: BlockOneResults = {
      id: 'block_one',
      timestamp: new Date(),
      stateRoadFunding: {
        items: stateRoadItems.map(item => ({ ...item })), // глубокая копия
        q1Result,
        formula: 'Q₁ = Qдз - Qпп - Qміжн - QІАС - Qн - Qлік - Qвп - Qупр - QДПП'
      },
      localRoadFunding: {
        items: localRoadItems.map(item => ({ ...item })), // глубокая копия
        q2Result,
        formula: 'Q₂ = Qмз - Qкред - Qн2 - QДПП2 - Qком'
      },
      totalBudget: q1Result + q2Result
    };

    session.blockOneResults = blockOneResults;
    session.updatedAt = new Date();
    this.updateSessionCompleteness(session);

    console.log('Результаты Блока 1 сохранены:', {
      q1: q1Result,
      q2: q2Result,
      total: q1Result + q2Result
    });

    return true;
  }

  /**
   * Сохраняет результаты Блока 2
   */
  saveBlockTwoResults(sections: RoadSectionUI[]): boolean {
    const session = this.getCurrentSession();
    if (!session) {
      console.error('Нет активной сессии для сохранения результатов Блока 2');
      return false;
    }

    // Подсчет статистики
    const needRepair = sections.filter(s => s.workType !== 'Не потрібно');
    const totalCost = needRepair.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

    const byWorkType = {
      reconstruction: {
        count: sections.filter(s => s.workType === 'Реконструкція').length,
        cost: sections.filter(s => s.workType === 'Реконструкція')
                    .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
      },
      capitalRepair: {
        count: sections.filter(s => s.workType === 'Капітальний ремонт').length,
        cost: sections.filter(s => s.workType === 'Капітальний ремонт')
                    .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
      },
      currentRepair: {
        count: sections.filter(s => s.workType === 'Поточний ремонт').length,
        cost: sections.filter(s => s.workType === 'Поточний ремонт')
                    .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
      },
      noWork: {
        count: sections.filter(s => s.workType === 'Не потрібно').length,
        cost: 0
      }
    };

    const blockTwoResults: BlockTwoResults = {
      id: 'block_two',
      timestamp: new Date(),
      sections: sections.map(section => ({ ...section })), // глубокая копия
      summary: {
        totalSections: sections.length,
        needRepair: needRepair.length,
        totalCost,
        byWorkType
      },
      ranking: {
        byEnpv: [...sections].filter(s => s.workType !== 'Не потрібно')
                           .sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0)),
        currentRepairPriority: [...sections].filter(s => s.workType === 'Поточний ремонт')
      }
    };

    session.blockTwoResults = blockTwoResults;
    session.updatedAt = new Date();
    this.updateSessionCompleteness(session);

    console.log('Результаты Блока 2 сохранены:', {
      totalSections: sections.length,
      needRepair: needRepair.length,
      totalCost: totalCost.toFixed(1)
    });

    return true;
  }

  /**
   * Сохраняет результаты Блока 3
   */
  saveBlockThreeResults(
    budget: number,
    utilizationPercent: number,
    selectedProjects: { currentRepair: number; capitalRepair: number; reconstruction: number },
    complianceData: { compliant: number; nonCompliant: number; categoryIssues: number; frictionIssues: number },
    reportText: string
  ): boolean {
    const session = this.getCurrentSession();
    if (!session) {
      console.error('Нет активной сессии для сохранения результатов Блока 3');
      return false;
    }

    const blockThreeResults: BlockThreeResults = {
      id: 'block_three',
      timestamp: new Date(),
      planningData: {
        budget,
        utilizationPercent,
        selectedProjects
      },
      complianceAnalysis: {
        compliantSections: complianceData.compliant,
        nonCompliantSections: complianceData.nonCompliant,
        categoryIssues: complianceData.categoryIssues,
        frictionIssues: complianceData.frictionIssues
      },
      reportText
    };

    session.blockThreeResults = blockThreeResults;
    session.updatedAt = new Date();
    this.updateSessionCompleteness(session);

    console.log('Результаты Блока 3 сохранены:', {
      budget,
      utilizationPercent: utilizationPercent.toFixed(1) + '%',
      projects: selectedProjects
    });

    return true;
  }

  /**
   * Получает результаты конкретного блока
   */
  getBlockResults<T extends 'block_one' | 'block_two' | 'block_three'>(
    blockId: T
  ): T extends 'block_one' ? BlockOneResults | null :
     T extends 'block_two' ? BlockTwoResults | null :
     T extends 'block_three' ? BlockThreeResults | null :
     never {
    const session = this.getCurrentSession();
    if (!session) return null as any;

    switch (blockId) {
      case 'block_one':
        return session.blockOneResults as any;
      case 'block_two':
        return session.blockTwoResults as any;
      case 'block_three':
        return session.blockThreeResults as any;
      default:
        return null as any;
    }
  }

  /**
   * Получает сводку по всем результатам
   */
  getAllResults(): {
    session: CalculationSession | null;
    blockOne: BlockOneResults | null;
    blockTwo: BlockTwoResults | null;
    blockThree: BlockThreeResults | null;
    isComplete: boolean;
  } {
    const session = this.getCurrentSession();
    
    return {
      session,
      blockOne: session?.blockOneResults || null,
      blockTwo: session?.blockTwoResults || null,
      blockThree: session?.blockThreeResults || null,
      isComplete: session?.isComplete || false
    };
  }

  /**
   * Генерирует сводный отчет по всем блокам
   */
  generateSummaryReport(): string | null {
    const results = this.getAllResults();
    if (!results.session) return null;

    let report = `# СВОДНЫЙ ОТЧЕТ ПО РАСЧЕТАМ\n\n`;
    report += `Сессия: ${results.session.id}\n`;
    report += `Создана: ${results.session.createdAt.toLocaleString('uk-UA')}\n`;
    report += `Обновлена: ${results.session.updatedAt.toLocaleString('uk-UA')}\n`;
    report += `Статус: ${results.isComplete ? 'Завершена' : 'В процессе'}\n\n`;

    if (results.blockOne) {
      report += `## БЛОК 1: ОПРЕДЕЛЕНИЕ ОБЪЕМА БЮДЖЕТНЫХ СРЕДСТВ\n`;
      report += `Q₁ (государственные дороги): ${results.blockOne.stateRoadFunding.q1Result.toLocaleString()} тыс. грн\n`;
      report += `Q₂ (местные дороги): ${results.blockOne.localRoadFunding.q2Result.toLocaleString()} тыс. грн\n`;
      report += `Общий бюджет: ${results.blockOne.totalBudget.toLocaleString()} тыс. грн\n\n`;
    }

    if (results.blockTwo) {
      report += `## БЛОК 2: АНАЛИЗ ДОРОЖНЫХ СЕКЦИЙ\n`;
      report += `Всего секций: ${results.blockTwo.summary.totalSections}\n`;
      report += `Требуют ремонта: ${results.blockTwo.summary.needRepair}\n`;
      report += `Общая стоимость работ: ${results.blockTwo.summary.totalCost.toFixed(1)} млн грн\n`;
      report += `\nРаспределение по типам работ:\n`;
      report += `- Реконструкция: ${results.blockTwo.summary.byWorkType.reconstruction.count} объектов (${results.blockTwo.summary.byWorkType.reconstruction.cost.toFixed(1)} млн грн)\n`;
      report += `- Капитальный ремонт: ${results.blockTwo.summary.byWorkType.capitalRepair.count} объектов (${results.blockTwo.summary.byWorkType.capitalRepair.cost.toFixed(1)} млн грн)\n`;
      report += `- Текущий ремонт: ${results.blockTwo.summary.byWorkType.currentRepair.count} объектов (${results.blockTwo.summary.byWorkType.currentRepair.cost.toFixed(1)} млн грн)\n\n`;
    }

    if (results.blockThree) {
      report += `## БЛОК 3: ПЛАНИРОВАНИЕ РЕМОНТНЫХ РАБОТ\n`;
      report += `Доступный бюджет: ${results.blockThree.planningData.budget.toLocaleString()} тыс. грн\n`;
      report += `Использование бюджета: ${results.blockThree.planningData.utilizationPercent.toFixed(1)}%\n`;
      report += `Выбранные проекты:\n`;
      report += `- Текущий ремонт: ${results.blockThree.planningData.selectedProjects.currentRepair}\n`;
      report += `- Капитальный ремонт: ${results.blockThree.planningData.selectedProjects.capitalRepair}\n`;
      report += `- Реконструкция: ${results.blockThree.planningData.selectedProjects.reconstruction}\n\n`;
      
      report += `## АНАЛИЗ СООТВЕТСТВИЯ НОРМАТИВАМ\n`;
      report += `Соответствуют нормативам: ${results.blockThree.complianceAnalysis.compliantSections}\n`;
      report += `Не соответствуют: ${results.blockThree.complianceAnalysis.nonCompliantSections}\n`;
      report += `Проблемы с категорией: ${results.blockThree.complianceAnalysis.categoryIssues}\n`;
      report += `Проблемы со сцеплением: ${results.blockThree.complianceAnalysis.frictionIssues}\n\n`;
    }

    report += `\n---\nОтчет сгенерирован: ${new Date().toLocaleString('uk-UA')}`;
    
    return report;
  }

  /**
   * Экспорт результатов в JSON
   */
  exportToJSON(): string | null {
    const results = this.getAllResults();
    if (!results.session) return null;

    return JSON.stringify(results, null, 2);
  }

  /**
   * Получает список всех сессий
   */
  getAllSessions(): CalculationSession[] {
    return Array.from(this.sessions.values())
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Удаляет сессию
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted && this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    return deleted;
  }

  /**
   * Очищает все данные
   */
  clearAll(): void {
    this.sessions.clear();
    this.currentSessionId = null;
    console.log('Все данные расчетов очищены');
  }

  /**
   * Проверяет и обновляет статус завершенности сессии
   */
  private updateSessionCompleteness(session: CalculationSession): void {
    const hasBlockOne = !!session.blockOneResults;
    const hasBlockTwo = !!session.blockTwoResults;
    const hasBlockThree = !!session.blockThreeResults;
    
    session.isComplete = hasBlockOne && hasBlockTwo && hasBlockThree;
  }

  /**
   * Получает статистику по всем сессиям
   */
  getStatistics() {
    const sessions = this.getAllSessions();
    const completed = sessions.filter(s => s.isComplete).length;
    const inProgress = sessions.length - completed;
    
    return {
      totalSessions: sessions.length,
      completedSessions: completed,
      inProgressSessions: inProgress,
      hasCurrentSession: !!this.currentSessionId,
      currentSessionId: this.currentSessionId
    };
  }
}

// ==================== ЭКСПОРТ СИНГЛТОНА ====================

// Создаем единственный экземпляр сервиса
export const calculationResultsService = new CalculationResultsService();

// Типы уже экспортированы выше вместе с их определениями

// Экспортируем класс для возможности создания дополнительных экземпляров (если нужно)
export { CalculationResultsService };

export default calculationResultsService;