import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Типізовані hooks для використання в компонентах
// Використовуйте ці hooks замість звичайних useDispatch і useSelector

// Hook для dispatch з правильним типом
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook для selector з правильним типом
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;