import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ✅ ОДИН ГОЛОВНИЙ ІНТЕРФЕЙС (об'єднаний)
export interface TransferredRoadData {
  id: string;
  roadName: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  region: string;
  actualIntensity: number;
  actualElasticModulus: number;
  actualSurfaceEvenness: number;
  actualRutDepth: number;
  actualFrictionValue: number;
  workType: string;
  isInternationalRoad?: boolean;
  isDefenseRoad?: boolean;
  isEuropeanNetwork?: boolean; // додав для повноти
  detailedCondition: {
    intensityCoefficient: number;
    strengthCoefficient: number;
    evennessCoefficient: number;
    rutCoefficient: number;
    frictionCoefficient: number;
    isRigidPavement: boolean;
    maxDesignIntensity: number;
    actualIntensity: number;
    actualElasticModulus: number;
    requiredElasticModulus: number;
    maxAllowedEvenness: number;
    actualSurfaceEvenness: number;
    maxAllowedRutDepth: number;
    actualRutDepth: number;
    actualFrictionValue: number;
    requiredFrictionValue: number;
  };
}

// Експорт alias для зручності (щоб не ламати існуючий код)
export type CalculatedRoad = TransferredRoadData;

// Інтерфейс стану Redux
export interface RoadDataState {
  calculatedRoads: TransferredRoadData[];
  lastCalculationTime: string | null;
}

// Початковий стан
const initialState: RoadDataState = {
  calculatedRoads: [],
  lastCalculationTime: null,
};

// ✅ ОБ'ЄДНАНИЙ SLICE
const roadDataSlice = createSlice({
  name: 'roadData',
  initialState,
  reducers: {
    // Зберегти всі розраховані дороги
    setCalculatedRoads: (state, action: PayloadAction<TransferredRoadData[]>) => {
      state.calculatedRoads = action.payload;
      state.lastCalculationTime = new Date().toISOString();
    },
    
    // Додати одну дорогу до списку
    addCalculatedRoad: (state, action: PayloadAction<TransferredRoadData>) => {
      const existingIndex = state.calculatedRoads.findIndex(
        road => road.id === action.payload.id
      );
      
      if (existingIndex !== -1) {
        // Якщо вже є - оновлюємо
        state.calculatedRoads[existingIndex] = action.payload;
      } else {
        // Якщо немає - додаємо
        state.calculatedRoads.push(action.payload);
      }
      state.lastCalculationTime = new Date().toISOString();
    },
    
    // Оновити окрему дорогу (частково)
    updateRoadData: (state, action: PayloadAction<{ id: string; data: Partial<TransferredRoadData> }>) => {
      const index = state.calculatedRoads.findIndex(
        road => road.id === action.payload.id
      );
      
      if (index !== -1) {
        state.calculatedRoads[index] = {
          ...state.calculatedRoads[index],
          ...action.payload.data,
        };
        state.lastCalculationTime = new Date().toISOString();
      }
    },
    
    // Видалити одну дорогу
    deleteCalculatedRoad: (state, action: PayloadAction<string>) => {
      state.calculatedRoads = state.calculatedRoads.filter(
        road => road.id !== action.payload
      );
      state.lastCalculationTime = new Date().toISOString();
    },
    
    // Очистити всі дані
    clearCalculatedRoads: (state) => {
      state.calculatedRoads = [];
      state.lastCalculationTime = null;
    },
    
    // Повний скид до початкового стану
    resetRoadData: () => initialState,
  },
});

// ✅ ЕКСПОРТ ACTIONS
export const {
  setCalculatedRoads,
  addCalculatedRoad,
  updateRoadData,
  deleteCalculatedRoad,
  clearCalculatedRoads,
  resetRoadData,
} = roadDataSlice.actions;

// ✅ ЕКСПОРТ REDUCER
export default roadDataSlice.reducer;

// ✅ SELECTORS (для зручного доступу до даних)
export const selectCalculatedRoads = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads;

export const selectLastCalculationTime = (state: { roadData: RoadDataState }) => 
  state.roadData.lastCalculationTime;

export const selectHasCalculatedData = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads.length > 0;

export const selectRoadsCount = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads.length;

export const selectRoadById = (roadId: string) => (state: { roadData: RoadDataState }) =>
  state.roadData.calculatedRoads.find(road => road.id === roadId);

export const selectRoadsByCategory = (category: 1 | 2 | 3 | 4 | 5) => (state: { roadData: RoadDataState }) =>
  state.roadData.calculatedRoads.filter(road => road.category === category);

export const selectRoadsByWorkType = (workType: string) => (state: { roadData: RoadDataState }) =>
  state.roadData.calculatedRoads.filter(road => road.workType === workType);