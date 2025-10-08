import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface RoadRates {
  category1: number;
  category2: number;
  category3: number;
  category4: number;
  category5: number;
}

interface FundingResults {
  stateFunding: number;
  localFunding: number;
  totalFunding: number;
  details?: any;
}

export interface BlockTwoState {
  stateRoadBaseRate: number;
  stateInflationIndexes: number[];
  stateRoadRates: RoadRates;
  localRoadBaseRate: number;
  localInflationIndexes: number[];
  localRoadRates: RoadRates;
  selectedRegion: string;
  inflationIndex: number;
  fundingResults: FundingResults | null;
  worksheets: any[];
  selectedWorksheet: string;
}

const initialState: BlockTwoState = {
  stateRoadBaseRate: 604.761,
  stateInflationIndexes: [10],
  stateRoadRates: {
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0,
  },
  localRoadBaseRate: 360.544,
  localInflationIndexes: [10],
  localRoadRates: {
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0,
  },
  selectedRegion: 'Вінницька',
  inflationIndex: 1.25,
  fundingResults: null,
  worksheets: [],
  selectedWorksheet: '',
};

const blockTwoSlice = createSlice({
  name: 'blockTwo',
  initialState,
  reducers: {
    setStateRoadBaseRate: (state, action: PayloadAction<number>) => {
      state.stateRoadBaseRate = action.payload;
    },
    setStateInflationIndexes: (state, action: PayloadAction<number[]>) => {
      state.stateInflationIndexes = action.payload;
    },
    addStateInflationIndex: (state, action: PayloadAction<number>) => {
      state.stateInflationIndexes.push(action.payload);
    },
    removeStateInflationIndex: (state, action: PayloadAction<number>) => {
      if (state.stateInflationIndexes.length > 1) {
        state.stateInflationIndexes.splice(action.payload, 1);
      }
    },
    updateStateInflationIndex: (state, action: PayloadAction<{ index: number; value: number }>) => {
      state.stateInflationIndexes[action.payload.index] = action.payload.value;
    },
    setStateRoadRates: (state, action: PayloadAction<RoadRates>) => {
      state.stateRoadRates = action.payload;
    },
    setLocalRoadBaseRate: (state, action: PayloadAction<number>) => {
      state.localRoadBaseRate = action.payload;
    },
    setLocalInflationIndexes: (state, action: PayloadAction<number[]>) => {
      state.localInflationIndexes = action.payload;
    },
    addLocalInflationIndex: (state, action: PayloadAction<number>) => {
      state.localInflationIndexes.push(action.payload);
    },
    removeLocalInflationIndex: (state, action: PayloadAction<number>) => {
      if (state.localInflationIndexes.length > 1) {
        state.localInflationIndexes.splice(action.payload, 1);
      }
    },
    updateLocalInflationIndex: (state, action: PayloadAction<{ index: number; value: number }>) => {
      state.localInflationIndexes[action.payload.index] = action.payload.value;
    },
    setLocalRoadRates: (state, action: PayloadAction<RoadRates>) => {
      state.localRoadRates = action.payload;
    },
    setSelectedRegion: (state, action: PayloadAction<string>) => {
      state.selectedRegion = action.payload;
    },
    setInflationIndex: (state, action: PayloadAction<number>) => {
      state.inflationIndex = action.payload;
    },
    setFundingResults: (state, action: PayloadAction<FundingResults>) => {
      state.fundingResults = action.payload;
    },
    setWorksheets: (state, action: PayloadAction<any[]>) => {
      state.worksheets = action.payload;
    },
    setSelectedWorksheet: (state, action: PayloadAction<string>) => {
      state.selectedWorksheet = action.payload;
    },
    resetBlockTwo: () => initialState,
  },
});

export const {
  setStateRoadBaseRate,
  setStateInflationIndexes,
  addStateInflationIndex,
  removeStateInflationIndex,
  updateStateInflationIndex,
  setStateRoadRates,
  setLocalRoadBaseRate,
  setLocalInflationIndexes,
  addLocalInflationIndex,
  removeLocalInflationIndex,
  updateLocalInflationIndex,
  setLocalRoadRates,
  setSelectedRegion,
  setInflationIndex,
  setFundingResults,
  setWorksheets,
  setSelectedWorksheet,
  resetBlockTwo,
} = blockTwoSlice.actions;

export default blockTwoSlice.reducer;