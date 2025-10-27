import { createSelector } from 'reselect';
import type { RootState } from '../store';

// Base selector
const selectBlockTwo = (state: RootState) => state.blockTwo;

// Memoized selectors for state roads
export const selectStateRoadBaseRate = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.stateRoadBaseRate
);

export const selectStateInflationIndexes = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.stateInflationIndexes
);

export const selectStateRoadRates = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.stateRoadRates
);

// Memoized selectors for local roads
export const selectLocalRoadBaseRate = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.localRoadBaseRate
);

export const selectLocalInflationIndexes = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.localInflationIndexes
);

export const selectLocalRoadRates = createSelector(
  [selectBlockTwo],
  (blockTwo) => blockTwo.localRoadRates
);

// Computed selectors
// Сукупний індекс інфляції розраховується як добуток коефіцієнтів
// Якщо інфляція 106.1%, то коефіцієнт = 106.1/100 = 1.061
export const selectStateCumulativeInflation = createSelector(
  [selectStateInflationIndexes],
  (indexes) => indexes.reduce((acc, curr) => acc * (curr / 100), 1)
);

export const selectLocalCumulativeInflation = createSelector(
  [selectLocalInflationIndexes],
  (indexes) => indexes.reduce((acc, curr) => acc * (curr / 100), 1)
);
