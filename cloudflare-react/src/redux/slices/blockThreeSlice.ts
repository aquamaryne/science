import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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
  region?: string;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  hasLighting?: boolean;
  criticalInfrastructureCount?: number;
  estimatedCost?: number;
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
}

interface CostStandards {
  reconstruction: Record<number, number>;
  capital_repair: Record<number, number>;
  current_repair: Record<number, number>;
}

export interface BlockThreeState {
  sections: RoadSectionUI[];
  costStandards: CostStandards;
  currentPage: number;
  // ✅ Статус завершення кожної сторінки
  page1Complete: boolean;
  page2Complete: boolean;
  page3Complete: boolean;
  page4Complete: boolean;
}

const initialState: BlockThreeState = {
  sections: [],
  costStandards: {
    reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 },
    capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
    current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 }
  },
  currentPage: 1,
  page1Complete: false,
  page2Complete: false,
  page3Complete: false,
  page4Complete: false,
};

const blockThreeSlice = createSlice({
  name: 'blockThree',
  initialState,
  reducers: {
    setSections: (state, action: PayloadAction<RoadSectionUI[]>) => {
      state.sections = action.payload;
    },
    addSection: (state, action: PayloadAction<RoadSectionUI>) => {
      state.sections.push(action.payload);
    },
    updateSection: (state, action: PayloadAction<{ id: string; data: Partial<RoadSectionUI> }>) => {
      const index = state.sections.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sections[index] = { ...state.sections[index], ...action.payload.data };
      }
    },
    deleteSection: (state, action: PayloadAction<string>) => {
      state.sections = state.sections.filter(s => s.id !== action.payload);
    },
    setCostStandards: (state, action: PayloadAction<CostStandards>) => {
      state.costStandards = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    nextPage: (state) => {
      if (state.currentPage < 7) state.currentPage += 1;
    },
    previousPage: (state) => {
      if (state.currentPage > 1) state.currentPage -= 1;
    },
    // ✅ Нові actions для відстеження завершення сторінок
    setPage1Complete: (state, action: PayloadAction<boolean>) => {
      state.page1Complete = action.payload;
    },
    setPage2Complete: (state, action: PayloadAction<boolean>) => {
      state.page2Complete = action.payload;
    },
    setPage3Complete: (state, action: PayloadAction<boolean>) => {
      state.page3Complete = action.payload;
    },
    setPage4Complete: (state, action: PayloadAction<boolean>) => {
      state.page4Complete = action.payload;
    },
    resetBlockThree: () => initialState,
  },
});

export const {
  setSections,
  addSection,
  updateSection,
  deleteSection,
  setCostStandards,
  setCurrentPage,
  nextPage,
  setPage1Complete,
  setPage2Complete,
  setPage3Complete,
  setPage4Complete,
  previousPage,
  resetBlockThree,
} = blockThreeSlice.actions;

export default blockThreeSlice.reducer;