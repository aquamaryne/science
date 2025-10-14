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
        // Ігноруємо перевірку серіалізації для дат
        ignoredActions: ['roadData/setCalculatedRoads'],
      },
    }),
});

// Експортуємо типи для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;