import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DeviceState {
  id: string | null;         // устойчивый идентификатор устройства
  type: 'mobile' | 'desktop' | 'tablet' | null;
}

const initialState: DeviceState = { id: null, type: null };

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDevice(state, action: PayloadAction<DeviceState>) {
      state.id = action.payload.id;
      state.type = action.payload.type;
    },
    clearDevice(state) {
      state.id = null;
      state.type = null;
    }
  }
});

export const { setDevice, clearDevice } = deviceSlice.actions;
export default deviceSlice.reducer;