import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import { combineReducers } from 'redux';

import blockOneReducer from './slices/blockOneSlice';
import blockTwoReducer from './slices/blockTwoSlice';
import blockThreeReducer from './slices/blockThreeSlice';

// Конфигурация persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['blockOne', 'blockTwo', 'blockThree'], // какие редьюсеры сохранять
};

// Комбинируем редьюсеры
const rootReducer = combineReducers({
  blockOne: blockOneReducer,
  blockTwo: blockTwoReducer,
  blockThree: blockThreeReducer,
});

// Создаем persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Создаем store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;