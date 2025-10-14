import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Інтерфейс для даних про дорогу
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

// Інтерфейс для стану Redux
interface RoadDataState {
  calculatedRoads: TransferredRoadData[];
  lastCalculationTime: string | null;
}

// Початковий стан
const initialState: RoadDataState = {
  calculatedRoads: [],
  lastCalculationTime: null,
};

// Створення slice
const roadDataSlice = createSlice({
  name: 'roadData',
  initialState,
  reducers: {
    // Зберегти всі розраховані дороги
    setCalculatedRoads: (state, action: PayloadAction<TransferredRoadData[]>) => {
      state.calculatedRoads = action.payload;
      state.lastCalculationTime = new Date().toISOString();
    },
    
    // Очистити всі дані
    clearCalculatedRoads: (state) => {
      state.calculatedRoads = [];
      state.lastCalculationTime = null;
    },
    
    // Оновити окрему дорогу
    updateRoadData: (state, action: PayloadAction<{ id: string; data: Partial<TransferredRoadData> }>) => {
      const index = state.calculatedRoads.findIndex(road => road.id === action.payload.id);
      if (index !== -1) {
        state.calculatedRoads[index] = {
          ...state.calculatedRoads[index],
          ...action.payload.data,
        };
      }
    },
  },
});

// Експорт actions
export const { setCalculatedRoads, clearCalculatedRoads, updateRoadData } = roadDataSlice.actions;

// Експорт reducer
export default roadDataSlice.reducer;

// Selectors
export const selectCalculatedRoads = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads;

export const selectLastCalculationTime = (state: { roadData: RoadDataState }) => 
  state.roadData.lastCalculationTime;

export const selectHasCalculatedData = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads.length > 0;

export const selectRoadsCount = (state: { roadData: RoadDataState }) => 
  state.roadData.calculatedRoads.length;