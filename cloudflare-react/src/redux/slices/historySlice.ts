import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { historyService, type CalculationSession } from '../../service/historyService';

// ==================== ТИПЫ СОСТОЯНИЯ ====================

export interface HistoryState {
  sessions: CalculationSession[];
  currentSession: CalculationSession | null;
  loading: boolean;
  error: string | null;
  statistics: {
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    totalUsers: number;
    currentUser: string;
  } | null;
  lastSaved: string | null;
}

const initialState: HistoryState = {
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
  statistics: null,
  lastSaved: null,
};

// ==================== ASYNC THUNKS ====================

// Создание новой сессии
export const createSession = createAsyncThunk(
  'history/createSession',
  async (params: { title?: string; description?: string }) => {
    console.log('🔵 Redux: createSession вызван с параметрами:', params);
    const sessionId = await historyService.createSession(params.title, params.description);
    console.log('🔵 Redux: createSession вернул sessionId:', sessionId);
    const session = await historyService.getCurrentSession();
    console.log('🔵 Redux: getCurrentSession вернул:', session);
    return session;
  }
);

// Загрузка всех сессий пользователя
export const loadUserSessions = createAsyncThunk(
  'history/loadUserSessions',
  async () => {
    console.log('🔵 Redux: loadUserSessions вызван');
    const sessions = await historyService.getAllSessions();
    console.log('🔵 Redux: loadUserSessions получил сессии:', sessions.length);
    return sessions;
  }
);

// Загрузка всех сессий (для администратора)
export const loadAllSessions = createAsyncThunk(
  'history/loadAllSessions',
  async () => {
    return await historyService.getAllSessions();
  }
);

// Загрузка статистики
export const loadStatistics = createAsyncThunk(
  'history/loadStatistics',
  async () => {
    return await historyService.getStatistics();
  }
);

// Сохранение данных Блока 1
export const saveBlockOneData = createAsyncThunk(
  'history/saveBlockOneData',
  async (params: {
    sessionId: string;
    stateRoadBudget: any[];
    localRoadBudget: any[];
    q1Result: number;
    q2Result: number;
  }) => {
    console.log('🔵 Redux: Сохранение данных Блока 1:', params);
    const success = await historyService.saveBlockOneData(
      params.sessionId,
      params.stateRoadBudget,
      params.localRoadBudget,
      params.q1Result,
      params.q2Result
    );
    console.log('🔵 Redux: Результат сохранения Блока 1:', success);
    if (success) {
      const session = await historyService.getCurrentSession();
      console.log('🔵 Redux: Получена сессия после сохранения:', session);
      return session;
    }
    throw new Error('Failed to save Block One data');
  }
);

// Сохранение данных Блока 2
export const saveBlockTwoData = createAsyncThunk(
  'history/saveBlockTwoData',
  async (params: {
    sessionId: string;
    stateRoadBaseRate: number;
    localRoadBaseRate: number;
    stateInflationIndexes: number[];
    localInflationIndexes: number[];
    selectedRegion: string;
    stateRoadRates: any;
    localRoadRates: any;
    fundingResults: any;
    regionalResults?: any[]; // ✅ ДОДАНО
    regionalData?: any[]; // ✅ ДОДАНО
    roadType?: 'state' | 'local'; // ✅ ДОДАНО
  }) => {
    const success = await historyService.saveBlockTwoData(
      params.sessionId,
      params.stateRoadBaseRate,
      params.localRoadBaseRate,
      params.stateInflationIndexes,
      params.localInflationIndexes,
      params.selectedRegion,
      params.stateRoadRates,
      params.localRoadRates,
      params.fundingResults,
      params.regionalResults, // ✅ ПЕРЕДАЄМО
      params.regionalData, // ✅ ПЕРЕДАЄМО
      params.roadType // ✅ ПЕРЕДАЄМО
    );
    if (success) {
      return await historyService.getCurrentSession();
    }
    throw new Error('Failed to save Block Two data');
  }
);

// Сохранение данных Блока 3
export const saveBlockThreeData = createAsyncThunk(
  'history/saveBlockThreeData',
  async (params: {
    sessionId: string;
    sections: any[];
    planningData: any;
    complianceAnalysis: any;
    reportText: string;
  }) => {
    const success = await historyService.saveBlockThreeData(
      params.sessionId,
      params.sections,
      params.planningData,
      params.complianceAnalysis,
      params.reportText
    );
    if (success) {
      return await historyService.getCurrentSession();
    }
    throw new Error('Failed to save Block Three data');
  }
);

// Удаление сессии
export const deleteSession = createAsyncThunk(
  'history/deleteSession',
  async (sessionId: string) => {
    const success = await historyService.deleteSession(sessionId);
    if (success) {
      return sessionId;
    }
    throw new Error('Failed to delete session');
  }
);

// Экспорт сессии
export const exportSession = createAsyncThunk(
  'history/exportSession',
  async (sessionId: string) => {
    const jsonData = await historyService.exportSession(sessionId);
    if (jsonData) {
      return { sessionId, jsonData };
    }
    throw new Error('Failed to export session');
  }
);

// Очистка старых данных
export const cleanupOldData = createAsyncThunk(
  'history/cleanupOldData',
  async (daysToKeep: number = 30) => {
    return await historyService.cleanupOldData(daysToKeep);
  }
);

// ==================== SLICE ====================

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    // Синхронные действия
    setCurrentSession: (state, action: PayloadAction<CalculationSession | null>) => {
      state.currentSession = action.payload;
    },
    
    setSelectedSession: (state, action: PayloadAction<CalculationSession | null>) => {
      // Для выбранной сессии в UI
      state.currentSession = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setLastSaved: (state, action: PayloadAction<string>) => {
      state.lastSaved = action.payload;
    },
    
    // Обновление сессии локально (для оптимистичных обновлений)
    updateSessionLocally: (state, action: PayloadAction<CalculationSession>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index >= 0) {
        state.sessions[index] = action.payload;
      }
      if (state.currentSession?.id === action.payload.id) {
        state.currentSession = action.payload;
      }
    },
    
    // Добавление новой сессии локально
    addSessionLocally: (state, action: PayloadAction<CalculationSession>) => {
      state.sessions.unshift(action.payload);
      state.currentSession = action.payload;
    },
    
    // Удаление сессии локально
    removeSessionLocally: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.currentSession?.id === action.payload) {
        state.currentSession = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          console.log('🔵 Redux: Создана новая сессия:', action.payload);
          state.currentSession = action.payload;
          // Добавляем в список сессий, если её там нет
          const exists = state.sessions.some(s => s.id === action.payload!.id);
          if (!exists) {
            state.sessions.unshift(action.payload);
            console.log('🔵 Redux: Сессия добавлена в список. Всего сессий:', state.sessions.length);
          } else {
            console.log('🔵 Redux: Сессия уже существует в списке');
          }
        } else {
          console.log('🔵 Redux: createSession.fulfilled получил null payload');
        }
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create session';
      })
      
      // Load User Sessions
      .addCase(loadUserSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('🔵 Redux: loadUserSessions.pending');
      })
      .addCase(loadUserSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
        console.log('🔵 Redux: Загружены сессии:', action.payload.length);
        console.log('🔵 Redux: Сессии:', action.payload.map(s => ({ id: s.id, title: s.title })));
      })
      .addCase(loadUserSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load sessions';
        console.log('🔵 Redux: loadUserSessions.rejected:', action.error.message);
      })
      
      // Load All Sessions
      .addCase(loadAllSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
        console.log('🔵 Redux: loadAllSessions.fulfilled:', action.payload.length);
      })
      .addCase(loadAllSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load all sessions';
        console.log('🔵 Redux: loadAllSessions.rejected:', action.error.message);
      })
      
      // Load Statistics
      .addCase(loadStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(loadStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load statistics';
      })
      
      // Save Block One Data
      .addCase(saveBlockOneData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBlockOneData.fulfilled, (state, action) => {
        state.loading = false;
        console.log('🔵 Redux: saveBlockOneData.fulfilled:', action.payload);
        if (action.payload) {
          state.currentSession = action.payload;
          // Обновляем сессию в списке
          const index = state.sessions.findIndex(s => s.id === action.payload!.id);
          if (index >= 0) {
            state.sessions[index] = action.payload;
            console.log('🔵 Redux: Обновлена существующая сессия в списке');
          } else {
            state.sessions.unshift(action.payload);
            console.log('🔵 Redux: Добавлена новая сессия в список');
          }
          state.lastSaved = new Date().toISOString();
          console.log('🔵 Redux: Всего сессий в Redux:', state.sessions.length);
        }
      })
      .addCase(saveBlockOneData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save Block One data';
      })
      
      // Save Block Two Data
      .addCase(saveBlockTwoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBlockTwoData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentSession = action.payload;
          // Обновляем сессию в списке
          const index = state.sessions.findIndex(s => s.id === action.payload!.id);
          if (index >= 0) {
            state.sessions[index] = action.payload;
          }
          state.lastSaved = new Date().toISOString();
        }
      })
      .addCase(saveBlockTwoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save Block Two data';
      })
      
      // Save Block Three Data
      .addCase(saveBlockThreeData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBlockThreeData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentSession = action.payload;
          // Обновляем сессию в списке
          const index = state.sessions.findIndex(s => s.id === action.payload!.id);
          if (index >= 0) {
            state.sessions[index] = action.payload;
          }
          state.lastSaved = new Date().toISOString();
        }
      })
      .addCase(saveBlockThreeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save Block Three data';
      })
      
      // Delete Session
      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        if (state.currentSession?.id === action.payload) {
          state.currentSession = null;
        }
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete session';
      })
      
      // Export Session
      .addCase(exportSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportSession.fulfilled, (state) => {
        state.loading = false;
        // Экспорт не изменяет состояние, только загружает файл
      })
      .addCase(exportSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to export session';
      })
      
      // Cleanup Old Data
      .addCase(cleanupOldData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cleanupOldData.fulfilled, (state) => {
        state.loading = false;
        // После очистки перезагружаем сессии
      })
      .addCase(cleanupOldData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to cleanup old data';
      })
      // Clear All Data
      .addCase(clearAllData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearAllData.fulfilled, (state) => {
        state.loading = false;
        // Полная очистка состояния
        state.sessions = [];
        state.currentSession = null;
        state.statistics = null;
        state.lastSaved = null;
        console.log('🔴 Redux: Все данные очищены');
      })
      .addCase(clearAllData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clear all data';
      });
  },
});

// ==================== ЭКСПОРТ ====================

export const {
  setCurrentSession,
  setSelectedSession,
  clearError,
  setLastSaved,
  updateSessionLocally,
  addSessionLocally,
  removeSessionLocally,
} = historySlice.actions;

export default historySlice.reducer;

// ==================== СЕЛЕКТОРЫ ====================

export const selectHistoryState = (state: { history: HistoryState }) => state.history;
export const selectSessions = (state: { history: HistoryState }) => state.history.sessions;
export const selectCurrentSession = (state: { history: HistoryState }) => state.history.currentSession;
export const selectHistoryLoading = (state: { history: HistoryState }) => state.history.loading;
export const selectHistoryError = (state: { history: HistoryState }) => state.history.error;
export const selectHistoryStatistics = (state: { history: HistoryState }) => state.history.statistics;
export const selectLastSaved = (state: { history: HistoryState }) => state.history.lastSaved;

// Селекторы для фильтрации сессий
export const selectCompletedSessions = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => s.isComplete);

export const selectInProgressSessions = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => !s.isComplete && (s.blockOneData || s.blockTwoData || s.blockThreeData));

export const selectNewSessions = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => !s.blockOneData && !s.blockTwoData && !s.blockThreeData);

// Селекторы для конкретных блоков
export const selectSessionsWithBlockOne = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => s.blockOneData);

export const selectSessionsWithBlockTwo = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => s.blockTwoData);

export const selectSessionsWithBlockThree = (state: { history: HistoryState }) => 
  state.history.sessions.filter(s => s.blockThreeData);

// Селекторы для фильтрации по датам
export const selectSessionsByDateRange = (state: { history: HistoryState }, startDate: Date, endDate: Date) => 
  state.history.sessions.filter(s => {
    const sessionDate = new Date(s.updatedAt);
    return sessionDate >= startDate && sessionDate <= endDate;
  });

export const selectSessionsByYear = (state: { history: HistoryState }, year: number) => 
  state.history.sessions.filter(s => new Date(s.updatedAt).getFullYear() === year);

export const selectSessionsByMonth = (state: { history: HistoryState }, year: number, month: number) => 
  state.history.sessions.filter(s => {
    const sessionDate = new Date(s.updatedAt);
    return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
  });

export const selectSessionsByDay = (state: { history: HistoryState }, year: number, month: number, day: number) => 
  state.history.sessions.filter(s => {
    const sessionDate = new Date(s.updatedAt);
    return sessionDate.getFullYear() === year && 
           sessionDate.getMonth() === month && 
           sessionDate.getDate() === day;
  });

// Селекторы для группировки по датам
export const selectSessionsGroupedByYear = (state: { history: HistoryState }) => {
  const grouped: { [year: string]: CalculationSession[] } = {};
  state.history.sessions.forEach(session => {
    const year = new Date(session.updatedAt).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(session);
  });
  return grouped;
};

export const selectSessionsGroupedByMonth = (state: { history: HistoryState }, year: number) => {
  const grouped: { [month: string]: CalculationSession[] } = {};
  const yearSessions = selectSessionsByYear(state, year);
  yearSessions.forEach(session => {
    const month = new Date(session.updatedAt).getMonth();
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(session);
  });
  return grouped;
};

export const selectSessionsGroupedByDay = (state: { history: HistoryState }, year: number, month: number) => {
  const grouped: { [day: string]: CalculationSession[] } = {};
  const monthSessions = selectSessionsByMonth(state, year, month);
  monthSessions.forEach(session => {
    const day = new Date(session.updatedAt).getDate();
    const dayKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push(session);
  });
  return grouped;
};

// Селектор для получения уникальных годов
export const selectAvailableYears = (state: { history: HistoryState }) => {
  const years = new Set<number>();
  state.history.sessions.forEach(session => {
    years.add(new Date(session.updatedAt).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a); // Сортировка по убыванию
};

// Селектор для получения уникальных месяцев в году
export const selectAvailableMonths = (state: { history: HistoryState }, year: number) => {
  const months = new Set<number>();
  const yearSessions = selectSessionsByYear(state, year);
  yearSessions.forEach(session => {
    months.add(new Date(session.updatedAt).getMonth());
  });
  return Array.from(months).sort((a, b) => b - a); // Сортировка по убыванию
};

// Селектор для получения уникальных дней в месяце
export const selectAvailableDays = (state: { history: HistoryState }, year: number, month: number) => {
  const days = new Set<number>();
  const monthSessions = selectSessionsByMonth(state, year, month);
  monthSessions.forEach(session => {
    days.add(new Date(session.updatedAt).getDate());
  });
  return Array.from(days).sort((a, b) => b - a); // Сортировка по убыванию
};

// ==================== CLEAR ALL DATA ====================

// Очистка всех данных
export const clearAllData = createAsyncThunk(
  'history/clearAllData',
  async () => {
    console.log('🔴 Redux: clearAllData вызван - очистка всех данных');
    await historyService.clearAllData();
    console.log('🔴 Redux: clearAllData завершен');
    return true;
  }
);