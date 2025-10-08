import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Создаем типизированные версии хуков
// Используйте их вместо обычных useDispatch и useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Хук для проверки наличия данных в Блоке 1
export const useBlockOneData = () => {
  return useAppSelector(state => ({
    hasStateRoadBudget: state.blockOne.stateRoadBudget.length > 0,
    hasLocalRoadBudget: state.blockOne.localRoadBudget.length > 0,
    hasQ1Result: state.blockOne.q1Result !== null,
    hasQ2Result: state.blockOne.q2Result !== null,
    hasAnyData: 
      state.blockOne.stateRoadBudget.length > 0 ||
      state.blockOne.localRoadBudget.length > 0 ||
      state.blockOne.q1Result !== null ||
      state.blockOne.q2Result !== null,
  }));
};

// Хук для проверки наличия данных в Блоке 2
export const useBlockTwoData = () => {
  return useAppSelector(state => ({
    hasStateRoadRates: state.blockTwo.stateRoadRates.category1 > 0,
    hasLocalRoadRates: state.blockTwo.localRoadRates.category1 > 0,
    hasFundingResults: state.blockTwo.fundingResults !== null,
    hasWorksheets: state.blockTwo.worksheets.length > 0,
    hasAnyData:
      state.blockTwo.stateRoadRates.category1 > 0 ||
      state.blockTwo.localRoadRates.category1 > 0 ||
      state.blockTwo.fundingResults !== null,
  }));
};

// Хук для проверки наличия данных в Блоке 3
export const useBlockThreeData = () => {
  return useAppSelector(state => ({
    sectionsCount: state.blockThree.sections.length,
    hasSections: state.blockThree.sections.length > 0,
    currentPage: state.blockThree.currentPage,
    hasCalculatedSections: state.blockThree.sections.some(s => s.workType !== undefined),
  }));
};

// Общий хук для проверки наличия данных во всех блоках
export const useHasData = () => {
  const blockOne = useBlockOneData();
  const blockTwo = useBlockTwoData();
  const blockThree = useBlockThreeData();
  
  return {
    blockOne: blockOne.hasAnyData,
    blockTwo: blockTwo.hasAnyData,
    blockThree: blockThree.hasSections,
    hasAnyData: blockOne.hasAnyData || blockTwo.hasAnyData || blockThree.hasSections,
    details: {
      blockOne,
      blockTwo,
      blockThree,
    },
  };
};

// Хук для получения всей информации о состоянии приложения
export const useAppStatus = () => {
  const blockOne = useAppSelector(state => state.blockOne);
  const blockTwo = useAppSelector(state => state.blockTwo);
  const blockThree = useAppSelector(state => state.blockThree);
  
  return {
    blockOne: {
      q1Result: blockOne.q1Result,
      q2Result: blockOne.q2Result,
      totalBudget: (blockOne.q1Result || 0) + (blockOne.q2Result || 0),
      sessionId: blockOne.sessionId,
    },
    blockTwo: {
      selectedRegion: blockTwo.selectedRegion,
      totalFunding: blockTwo.fundingResults?.totalFunding || 0,
      stateFunding: blockTwo.fundingResults?.stateFunding || 0,
      localFunding: blockTwo.fundingResults?.localFunding || 0,
    },
    blockThree: {
      sectionsCount: blockThree.sections.length,
      currentPage: blockThree.currentPage,
      needsRepair: blockThree.sections.filter(s => 
        s.workTypeRaw && s.workTypeRaw !== 'no_work_needed'
      ).length,
      totalCost: blockThree.sections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0),
    },
  };
};