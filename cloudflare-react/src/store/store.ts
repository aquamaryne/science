import { configureStore } from '@reduxjs/toolkit';
import roadDataReducer from './roadDataSlice';

// Створюємо Redux store
export const store = configureStore({
  reducer: {
    roadData: roadDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['roadData/setCalculatedRoads'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;