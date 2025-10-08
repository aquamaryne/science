// src/store/slices/blockOneSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface BudgetItem {
  id: string;
  name: string;
  value: number | null;
  normativeDocument?: string;
  tooltip?: string;
}

export interface BlockOneState {
  stateRoadBudget: BudgetItem[];
  localRoadBudget: BudgetItem[];
  q1Result: number | null;
  q2Result: number | null;
  sessionId: string | null;
  isSaved: boolean;
  lastModified: string | null;
}

const initialState: BlockOneState = {
  stateRoadBudget: [],
  localRoadBudget: [],
  q1Result: null,
  q2Result: null,
  sessionId: null,
  isSaved: false,
  lastModified: null,
};

const blockOneSlice = createSlice({
  name: 'blockOne',
  initialState,
  reducers: {
    // Установка всех элементов бюджета государственных дорог
    setStateRoadBudget: (state, action: PayloadAction<BudgetItem[]>) => {
      state.stateRoadBudget = action.payload;
      state.lastModified = new Date().toISOString();
    },
    
    // Установка всех элементов бюджета местных дорог
    setLocalRoadBudget: (state, action: PayloadAction<BudgetItem[]>) => {
      state.localRoadBudget = action.payload;
      state.lastModified = new Date().toISOString();
    },
    
    // Обновление одного элемента государственных дорог
    updateStateRoadItem: (state, action: PayloadAction<{ id: string; value: number | null }>) => {
      const item = state.stateRoadBudget.find(i => i.id === action.payload.id);
      if (item) {
        item.value = action.payload.value;
        state.lastModified = new Date().toISOString();  // добавить эту строку
      }
    },
    
    // Обновление нормативного документа государственных дорог
    updateStateRoadDocument: (state, action: PayloadAction<{ id: string; document: string }>) => {
      const item = state.stateRoadBudget.find(i => i.id === action.payload.id);
      if (item) {
        item.normativeDocument = action.payload.document;
        state.lastModified = new Date().toISOString();
      }
    },
    
    // Обновление одного элемента местных дорог
    updateLocalRoadItem: (state, action: PayloadAction<{ id: string; value: number | null }>) => {
      const item = state.localRoadBudget.find(i => i.id === action.payload.id);
      if (item) {
        item.value = action.payload.value;
        state.lastModified = new Date().toISOString();
      }
    },
    
    // Обновление нормативного документа местных дорог
    updateLocalRoadDocument: (state, action: PayloadAction<{ id: string; document: string }>) => {
      const item = state.localRoadBudget.find(i => i.id === action.payload.id);
      if (item) {
        item.normativeDocument = action.payload.document;
        state.lastModified = new Date().toISOString();
      }
    },
    
    // Установка результата Q1
    setQ1Result: (state, action: PayloadAction<number>) => {
      state.q1Result = action.payload;
      state.lastModified = new Date().toISOString();
    },
    
    // Установка результата Q2
    setQ2Result: (state, action: PayloadAction<number>) => {
      state.q2Result = action.payload;
      state.lastModified = new Date().toISOString();
    },
    
    // Установка ID сессии
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    
    // Сохранение результатов
    saveResults: (state) => {
      state.isSaved = true;
      state.lastModified = new Date().toISOString();
    },
    
    // Сброс флага сохранения
    resetSaveFlag: (state) => {
      state.isSaved = false;
    },

    saveBlockOne: (state) => {
        state.isSaved = true;
        state.lastModified = new Date().toISOString();
    },
  
    
    // Полный сброс блока 1
    resetBlockOne: () => initialState,
  },
});

export const {
  setStateRoadBudget,
  setLocalRoadBudget,
  updateStateRoadItem,
  updateStateRoadDocument,
  updateLocalRoadItem,
  updateLocalRoadDocument,
  setQ1Result,
  setQ2Result,
  setSessionId,
  saveResults,
  resetSaveFlag,
  resetBlockOne,
} = blockOneSlice.actions;

export default blockOneSlice.reducer;