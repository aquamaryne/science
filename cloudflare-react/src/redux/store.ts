import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { createAction } from '@reduxjs/toolkit';

import blockOneReducer from './slices/blockOneSlice';
import blockTwoReducer from './slices/blockTwoSlice';
import blockThreeReducer from './slices/blockThreeSlice';
import historyReducer from './slices/historySlice';
import roadDataReducer from '../store/roadDataSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['blockOne', 'blockTwo', 'blockThree', 'history', 'roadData'], // ← І ЦЕ!
};

// Action для очистки всех данных
export const clearAllAppData = createAction('CLEAR_ALL_APP_DATA');

const rootReducer = combineReducers({
  blockOne: blockOneReducer,
  blockTwo: blockTwoReducer,
  blockThree: blockThreeReducer,
  history: historyReducer,
  roadData: roadDataReducer,
});

// Обработчик для очистки всех данных
const appReducer = (state: any, action: any) => {
  if (action.type === clearAllAppData.type) {
    // Возвращаем начальное состояние для всех slices
    state = undefined;
  }
  return rootReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, appReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;