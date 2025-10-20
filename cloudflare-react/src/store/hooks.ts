import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';
import type { TransferredRoadData } from './roadDataSlice';

// Типізовані hooks для використання в компонентах
// Використовуйте ці hooks замість звичайних useDispatch і useSelector

// Hook для dispatch з правильним типом
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook для selector з правильним типом
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useCalculatedRoads = () => {
    return useAppSelector(state => ({
      roads: state.roadData.calculatedRoads,
      count: state.roadData.calculatedRoads.length,
      hasData: state.roadData.calculatedRoads.length > 0,
      lastCalculated: state.roadData.lastCalculationTime,
    }));
  };
  
  // Хук для отримання конкретної дороги
  export const useRoadById = (roadId: string) => {
    return useAppSelector(state => 
      state.roadData.calculatedRoads.find((road: TransferredRoadData) => road.id === roadId)
    );
  };
  
  // Хук для фільтрації доріг за категорією
  export const useRoadsByCategory = (category: 1 | 2 | 3 | 4 | 5) => {
    return useAppSelector(state =>
      state.roadData.calculatedRoads.filter((road: TransferredRoadData) => road.category === category)
    );
  };
  
  // Хук для фільтрації доріг за видом робіт
  export const useRoadsByWorkType = (workType: string) => {
    return useAppSelector(state =>
      state.roadData.calculatedRoads.filter((road: TransferredRoadData) => road.workType === workType)
    );
  };