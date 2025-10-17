import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import blockOneReducer from './slices/blockOneSlice';
import blockTwoReducer from './slices/blockTwoSlice';
import blockThreeReducer from './slices/blockThreeSlice';
import historyReducer from './slices/historySlice';
import roadDataReducer from '../store/roadDataSlice'; // ← ДОДАЙ ЦЕ!

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['blockOne', 'blockTwo', 'blockThree', 'history', 'roadData'], // ← І ЦЕ!
};

const rootReducer = combineReducers({
  blockOne: blockOneReducer,
  blockTwo: blockTwoReducer,
  blockThree: blockThreeReducer,
  history: historyReducer,
  roadData: roadDataReducer, // ← І ЦЕ!
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

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