/**
 * Асинхронный сервис для сохранения истории расчетов
 * Поддерживает работу нескольких пользователей одновременно
 */

import type { BudgetItem } from '../redux/slices/blockOneSlice';
import type { RoadSectionUI } from '../components/view/block_three_page';

// ==================== ТИПЫ ДАННЫХ ====================

export interface BlockOneHistoryData {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  stateRoadBudget: BudgetItem[];
  localRoadBudget: BudgetItem[];
  q1Result: number;
  q2Result: number;
  totalBudget: number;
  status: 'completed' | 'in_progress' | 'failed';
}

export interface BlockTwoHistoryData {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  stateRoadBaseRate: number;
  localRoadBaseRate: number;
  stateInflationIndexes: number[];
  localInflationIndexes: number[];
  selectedRegion: string;
  stateRoadRates: {
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  };
  localRoadRates: {
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  };
  fundingResults: {
    stateFunding: number;
    localFunding: number;
    totalFunding: number;
  };
  status: 'completed' | 'in_progress' | 'failed';
}

export interface BlockThreeHistoryData {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  sections: RoadSectionUI[];
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
  enpvResults?: {
    enpv: number;
    eirr: number;
    bcr: number;
    paybackPeriod: number;
  };
  reportText: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export interface CalculationSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  blockOneData?: BlockOneHistoryData;
  blockTwoData?: BlockTwoHistoryData;
  blockThreeData?: BlockThreeHistoryData;
  isComplete: boolean;
  title?: string;
  description?: string;
}

export interface UserSession {
  userId: string;
  userName: string;
  currentSessionId: string | null;
  sessions: string[];
  lastActivity: Date;
}

// ==================== СЕРВИС ИСТОРИИ ====================

class HistoryService {
  private readonly STORAGE_KEY = 'ias_roads_history';
  private readonly USER_SESSIONS_KEY = 'ias_roads_user_sessions';
  private readonly MAX_HISTORY_ITEMS = 1000; // Максимум записей в истории

  /**
   * Генерирует уникальный ID для пользователя
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерирует уникальный ID для сессии
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает или создает пользователя
   */
  private async getUserSession(): Promise<UserSession> {
    try {
    const stored = localStorage.getItem(this.USER_SESSIONS_KEY);
      if (stored) {
        const userSessions: UserSession[] = JSON.parse(stored);
        // Возвращаем последнего активного пользователя или создаем нового
        const lastUser = userSessions[userSessions.length - 1];
        if (lastUser) {
          // Исправляем парсинг даты
          const lastActivity = new Date(lastUser.lastActivity);
          if (Date.now() - lastActivity.getTime() < 24 * 60 * 60 * 1000) {
            // Обновляем время последней активности
            lastUser.lastActivity = new Date();
            await this.saveUserSessions(userSessions);
            return lastUser;
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при получении пользователя:', error);
    }

    // Создаем нового пользователя
    const newUser: UserSession = {
      userId: this.generateUserId(),
      userName: `Пользователь ${new Date().toLocaleString('uk-UA')}`,
      currentSessionId: null,
      sessions: [],
      lastActivity: new Date()
    };

    await this.saveUserSession(newUser);
    return newUser;
  }

  /**
   * Сохраняет пользователя
   */
  private async saveUserSession(user: UserSession): Promise<void> {
    try {
      const stored = localStorage.getItem(this.USER_SESSIONS_KEY);
      const userSessions: UserSession[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = userSessions.findIndex(u => u.userId === user.userId);
      if (existingIndex >= 0) {
        userSessions[existingIndex] = user;
      } else {
        userSessions.push(user);
      }

      await this.saveUserSessions(userSessions);
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error);
    }
  }

  /**
   * Сохраняет всех пользователей
   */
  private async saveUserSessions(userSessions: UserSession[]): Promise<void> {
    try {
      localStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(userSessions));
    } catch (error) {
      console.error('Ошибка при сохранении пользователей:', error);
    }
  }

  /**
   * Создает новую сессию расчетов
   */
  async createSession(title?: string, description?: string): Promise<string> {
    const user = await this.getUserSession();
    const sessionId = this.generateSessionId();
    
    const session: CalculationSession = {
      id: sessionId,
      userId: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false,
      title: title || `Сессия ${new Date().toLocaleString('uk-UA')}`,
      description
    };

    // Сохраняем сессию
    console.log('🔵 HistoryService: Сохраняем сессию:', session);
    await this.saveSession(session);
    console.log('🔵 HistoryService: Сессия сохранена');

    // Обновляем пользователя
    user.currentSessionId = sessionId;
    user.sessions.push(sessionId);
    user.lastActivity = new Date();
    console.log('🔵 HistoryService: Обновляем пользователя:', user);
    await this.saveUserSession(user);
    console.log('🔵 HistoryService: Пользователь обновлен');

    console.log(`Создана новая сессия: ${sessionId} для пользователя: ${user.userId}`);
    return sessionId;
  }

  /**
   * Сохраняет сессию
   */
  private async saveSession(session: CalculationSession): Promise<void> {
    try {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const sessions: CalculationSession[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // Ограничиваем количество сессий
      if (sessions.length > this.MAX_HISTORY_ITEMS) {
        sessions.splice(0, sessions.length - this.MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Ошибка при сохранении сессии:', error);
    }
  }

  /**
   * Сохраняет данные Блока 1
   */
  async saveBlockOneData(
    sessionId: string,
    stateRoadBudget: BudgetItem[],
    localRoadBudget: BudgetItem[],
    q1Result: number,
    q2Result: number
  ): Promise<boolean> {
    try {
      const user = await this.getUserSession();
      const session = await this.getSession(sessionId);
      
      if (!session) {
        console.error('Сессия не найдена:', sessionId);
        return false;
      }

      const blockOneData: BlockOneHistoryData = {
        id: `block_one_${Date.now()}`,
        userId: user.userId,
        sessionId,
        timestamp: new Date(),
        stateRoadBudget: [...stateRoadBudget],
        localRoadBudget: [...localRoadBudget],
        q1Result,
        q2Result,
        totalBudget: q1Result + q2Result,
        status: 'completed'
      };

      session.blockOneData = blockOneData;
      session.updatedAt = new Date();
      session.isComplete = this.checkSessionCompleteness(session);

      await this.saveSession(session);
      console.log('Данные Блока 1 сохранены в историю');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении данных Блока 1:', error);
      return false;
    }
  }

  /**
   * Сохраняет данные Блока 2
   */
  async saveBlockTwoData(
    sessionId: string,
    stateRoadBaseRate: number,
    localRoadBaseRate: number,
    stateInflationIndexes: number[],
    localInflationIndexes: number[],
    selectedRegion: string,
    stateRoadRates: any,
    localRoadRates: any,
    fundingResults: any
  ): Promise<boolean> {
    try {
      const user = await this.getUserSession();
      const session = await this.getSession(sessionId);
      
      if (!session) {
        console.error('Сессия не найдена:', sessionId);
        return false;
      }

      const blockTwoData: BlockTwoHistoryData = {
        id: `block_two_${Date.now()}`,
        userId: user.userId,
        sessionId,
        timestamp: new Date(),
        stateRoadBaseRate,
        localRoadBaseRate,
        stateInflationIndexes: [...stateInflationIndexes],
        localInflationIndexes: [...localInflationIndexes],
        selectedRegion,
        stateRoadRates: { ...stateRoadRates },
        localRoadRates: { ...localRoadRates },
        fundingResults: { ...fundingResults },
        status: 'completed'
      };

      session.blockTwoData = blockTwoData;
      session.updatedAt = new Date();
      session.isComplete = this.checkSessionCompleteness(session);

      await this.saveSession(session);
      console.log('Данные Блока 2 сохранены в историю');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении данных Блока 2:', error);
      return false;
    }
  }

  /**
   * Сохраняет данные Блока 3
   */
  async saveBlockThreeData(
    sessionId: string,
    sections: RoadSectionUI[],
    planningData: any,
    complianceAnalysis: any,
    reportText: string
  ): Promise<boolean> {
    try {
      const user = await this.getUserSession();
      const session = await this.getSession(sessionId);
      
      if (!session) {
        console.error('Сессия не найдена:', sessionId);
        return false;
      }

      const blockThreeData: BlockThreeHistoryData = {
        id: `block_three_${Date.now()}`,
        userId: user.userId,
        sessionId,
        timestamp: new Date(),
        sections: [...sections],
        planningData: { ...planningData },
        complianceAnalysis: { ...complianceAnalysis },
        reportText,
        status: 'completed'
      };

      session.blockThreeData = blockThreeData;
      session.updatedAt = new Date();
      session.isComplete = this.checkSessionCompleteness(session);

      await this.saveSession(session);
      console.log('Данные Блока 3 сохранены в историю');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении данных Блока 3:', error);
      return false;
    }
  }

  /**
   * Получает сессию по ID
   */
  private async getSession(sessionId: string): Promise<CalculationSession | null> {
    try {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const sessions: CalculationSession[] = JSON.parse(stored);
      const session = sessions.find(s => s.id === sessionId) || null;
      
      if (session) {
        // Исправляем парсинг дат
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
      }
      
      return session;
    } catch (error) {
      console.error('Ошибка при получении сессии:', error);
      return null;
    }
  }

  /**
   * Проверяет завершенность сессии
   */
  private checkSessionCompleteness(session: CalculationSession): boolean {
    return !!(session.blockOneData && session.blockTwoData && session.blockThreeData);
  }

  /**
   * Получает все сессии пользователя
   */
  async getUserSessions(): Promise<CalculationSession[]> {
    try {
      const user = await this.getUserSession();
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sessions: CalculationSession[] = JSON.parse(stored);
      
      // Исправляем парсинг дат
      const sessionsWithDates = sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
      
      return sessionsWithDates
        .filter(s => s.userId === user.userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Ошибка при получении сессий пользователя:', error);
      return [];
    }
  }

  /**
   * Получает все сессии (для администратора)
   */
  async getAllSessions(): Promise<CalculationSession[]> {
    try {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return [];
    }
    
    const sessions: CalculationSession[] = JSON.parse(stored);
      
      // Исправляем парсинг дат
      const sessionsWithDates = sessions.map(session => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
      
      const sortedSessions = sessionsWithDates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return sortedSessions;
    } catch (error) {
      console.error('Ошибка при получении всех сессий:', error);
      return [];
    }
  }

  /**
   * Получает текущую сессию пользователя
   */
  async getCurrentSession(): Promise<CalculationSession | null> {
    try {
    const user = await this.getUserSession();
    if (!user.currentSessionId) {
      return null;
    }
    
    const session = await this.getSession(user.currentSessionId);
      return session;
    } catch (error) {
      console.error('Ошибка при получении текущей сессии:', error);
      return null;
    }
  }

  /**
   * Удаляет сессию
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const sessions: CalculationSession[] = JSON.parse(stored);
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
      
      // Обновляем пользователя
      const user = await this.getUserSession();
      user.sessions = user.sessions.filter(id => id !== sessionId);
      if (user.currentSessionId === sessionId) {
        user.currentSessionId = null;
      }
      await this.saveUserSession(user);
      
      console.log(`Сессия ${sessionId} удалена`);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении сессии:', error);
      return false;
    }
  }

  /**
   * Экспортирует сессию в JSON
   */
  async exportSession(sessionId: string): Promise<string | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return null;
      
      return JSON.stringify(session, null, 2);
    } catch (error) {
      console.error('Ошибка при экспорте сессии:', error);
      return null;
    }
  }

  /**
   * Получает статистику
   */
  async getStatistics(): Promise<{
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    totalUsers: number;
    currentUser: string;
  }> {
    try {
      const allSessions = await this.getAllSessions();
      const user = await this.getUserSession();
      
      const completedSessions = allSessions.filter(s => s.isComplete).length;
      const inProgressSessions = allSessions.length - completedSessions;
      
      const storedUsers = localStorage.getItem(this.USER_SESSIONS_KEY);
      const totalUsers = storedUsers ? JSON.parse(storedUsers).length : 0;
      
      return {
        totalSessions: allSessions.length,
        completedSessions,
        inProgressSessions,
        totalUsers,
        currentUser: user.userName
      };
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        totalUsers: 0,
        currentUser: 'Неизвестно'
      };
    }
  }

  /**
   * Очищает старые данные
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 0;
      
      const sessions: CalculationSession[] = JSON.parse(stored);
      const filteredSessions = sessions.filter(s => s.updatedAt > cutoffDate);
      
      const deletedCount = sessions.length - filteredSessions.length;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
      
      console.log(`Очищено ${deletedCount} старых сессий`);
      return deletedCount;
    } catch (error) {
      console.error('Ошибка при очистке старых данных:', error);
      return 0;
    }
  }

  /**
   * Полная очистка всех данных
   */
  async clearAllData(): Promise<void> {
    try {
      console.log('🔴 HistoryService: Начинаем полную очистку всех данных');
      
      // Очищаем localStorage
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('persist:root');
      localStorage.removeItem('persist:history');
      localStorage.removeItem('persist:blockOne');
      localStorage.removeItem('persist:blockTwo');
      localStorage.removeItem('persist:blockThree');
      localStorage.removeItem('persist:roadData');
      
      // Очищаем sessionStorage
      sessionStorage.clear();
      
      // Очищаем IndexedDB если используется
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes('road')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (e) {
          console.warn('Не удалось очистить IndexedDB:', e);
        }
      }
      
      console.log('🔴 HistoryService: Все данные очищены');
    } catch (error) {
      console.error('Ошибка при полной очистке данных:', error);
      throw error;
    }
  }
}

// ==================== ЭКСПОРТ СИНГЛТОНА ====================

export const historyService = new HistoryService();
export default historyService;
