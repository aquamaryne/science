import React, { useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Calculator, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from '@/redux/hooks';
import { useSelector } from 'react-redux';
import {
  setStateRoadBaseRate,
  addStateInflationIndex,
  removeStateInflationIndex,
  updateStateInflationIndex,
  setStateRoadRates,
  setStateInflationIndexes
} from '@/redux/slices/blockTwoSlice';
import {
  selectStateRoadBaseRate,
  selectStateInflationIndexes,
  selectStateRoadRates,
  selectStateCumulativeInflation
} from '@/redux/selectors/blockTwoSelectors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { handleNumberPaste, parseNumberInput } from '@/utils/numberInput';

interface Block2StateRoadsProps {
  // onCalculated?: () => void; // Убрано - автоматичні переходи відключені
}

// ✅ ОПТИМІЗАЦІЯ: Мемоізований компонент для кожного поля інфляції
const InflationIndexField = React.memo(({
  index,
  yearNumber,
  value,
  canRemove,
  onChange,
  onRemove
}: {
  index: number;
  yearNumber: number;
  value: number;
  canRemove: boolean;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = e.target.value.replace(',', '.');
    onChange(index, normalized);
  }, [index, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    handleNumberPaste(e, (normalized) => {
      onChange(index, normalized);
    });
  }, [index, onChange]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Label className="min-w-[80px] text-sm">{`Рік ${yearNumber}:`}</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="1000"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="наприклад: 5.0"
          className="flex-1 sm:flex-none sm:w-28"
        />
        <span className="text-sm font-medium">%</span>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-xs text-gray-500">
          коеф.: {(value / 100).toFixed(4)}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="p-1 h-auto text-red-600 hover:text-red-800"
            title="Видалити цей рік"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ ОПТИМІЗАЦІЯ: Кастомна функція порівняння для запобігання зайвим ре-рендерам
  return (
    prevProps.index === nextProps.index &&
    prevProps.yearNumber === nextProps.yearNumber &&
    prevProps.value === nextProps.value &&
    prevProps.canRemove === nextProps.canRemove &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onRemove === nextProps.onRemove
  );
});

InflationIndexField.displayName = 'InflationIndexField';

const Block2StateRoads: React.FC<Block2StateRoadsProps> = () => {
  const dispatch = useAppDispatch();

  // ✅ ОПТИМІЗАЦІЯ: Використовуємо мемоізовані селектори
  const stateRoadBaseRate = useSelector(selectStateRoadBaseRate);
  const stateInflationIndexes = useSelector(selectStateInflationIndexes);
  const stateRoadRate = useSelector(selectStateRoadRates);
  const cumulativeInflationMemoized = useSelector(selectStateCumulativeInflation);

  const [isYearSelectorOpen, setIsYearSelectorOpen] = React.useState(false);
  const [selectedStartYear, setSelectedStartYear] = React.useState<number>(2020);
  const [selectedEndYear, setSelectedEndYear] = React.useState<number>(new Date().getFullYear() - 1);
  const [appliedStartYear, setAppliedStartYear] = React.useState<number>(2024); // Зберігаємо застосований початковий рік

  // ✅ ОПТИМІЗАЦІЯ: useCallback для запобігання ре-рендерам
  const addStateInflationIndexHandler = useCallback(() => {
    dispatch(addStateInflationIndex(0));
  }, [dispatch]);

  const removeStateInflationIndexHandler = useCallback((index: number) => {
    if (stateInflationIndexes.length > 1) {
      dispatch(removeStateInflationIndex(index));
    }
  }, [dispatch, stateInflationIndexes.length]);

  const handleStateInflationChange = useCallback((index: number, value: string) => {
    dispatch(updateStateInflationIndex({ index, value: parseNumberInput(value, 0) }));
  }, [dispatch]);

  const handleBaseRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = e.target.value.replace(',', '.');
    dispatch(setStateRoadBaseRate(parseNumberInput(normalized, 604.761)));
  }, [dispatch]);

  const handleBaseRatePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    handleNumberPaste(e, (normalized) => {
      dispatch(setStateRoadBaseRate(parseNumberInput(normalized, 604.761)));
    });
  }, [dispatch]);

  const applyYearRange = useCallback(() => {
    if (selectedStartYear > selectedEndYear) {
      toast.error('Помилка', {
        description: 'Початковий рік не може бути більшим за кінцевий',
      });
      return;
    }

    const yearsToAdd = selectedEndYear - selectedStartYear + 1;

    // ✅ ОПТИМІЗАЦІЯ: Один dispatch замість багатьох
    const emptyYears = new Array(yearsToAdd).fill(0);
    dispatch(setStateInflationIndexes(emptyYears));

    // ✅ Зберігаємо вибраний початковий рік для правильного відображення
    setAppliedStartYear(selectedStartYear);

    setIsYearSelectorOpen(false);
    toast.success('Роки додано', {
      description: `Додано ${yearsToAdd} років (${selectedStartYear}-${selectedEndYear}). Введіть індекси інфляції вручну.`,
    });
  }, [selectedStartYear, selectedEndYear, dispatch]);

  // ✅ ОПТИМІЗАЦІЯ: useMemo - генерувати список років тільки один раз
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }, []); // Порожній масив - обчислюється тільки один раз при монтуванні

  // ✅ ОПТИМІЗАЦІЯ: Використовуємо вже мемоізований результат із селектора
  const cumulativeInflation = cumulativeInflationMemoized;

  const calculateStateRoadRates = () => {
    // ✅ Валідація вхідних даних
    if (stateRoadBaseRate <= 0) {
      toast.error('Помилка валідації', {
        description: 'Норматив базової вартості має бути більше 0',
      });
      return;
    }

    if (stateInflationIndexes.length === 0) {
      toast.error('Помилка валідації', {
        description: 'Додайте хоча б один індекс інфляції',
      });
      return;
    }

    if (stateInflationIndexes.some(index => isNaN(index) || index < 0)) {
      toast.error('Помилка валідації', {
        description: 'Індекси інфляції мають бути невід\'ємними числами (0 або більше)',
      });
      return;
    }

    if (stateInflationIndexes.some(index => index > 1000)) {
      toast.warning('Попередження', {
        description: 'Один або декілька індексів інфляції перевищують 1000%. Переконайтеся, що дані введені правильно.',
      });
    }

    // ✅ ЗГІДНО З П.3.2 МЕТОДИКИ (РОЗДІЛ 3 - ВИЗНАЧЕННЯ ФІНАНСУВАННЯ НА ЕУ ДОРІГ)
    // Формула: H_j^д = H^д × K_j^д × K_інф
    // де:
    //   H_j^д - норматив для j-ї категорії державних доріг
    //   H^д - базовий норматив для II категорії державних доріг (stateRoadBaseRate)
    //   K_j^д - коефіцієнт диференціювання для j-ї категорії (з Додатку 3 методики)
    //   K_інф - сукупний індекс інфляції (добуток всіх річних індексів)
    // ✅ ОПТИМІЗАЦІЯ: використовуємо мемоізований результат

    // ✅ Коефіцієнти диференціювання K_j^д згідно з Додатком 3 методики
    // для ДЕРЖАВНИХ доріг (стор. 33 Додаток 3 PDF):
    const rates = {
      category1: stateRoadBaseRate * 1.80 * cumulativeInflation, // I категорія (K_1^д = 1.80)
      category2: stateRoadBaseRate * 1.00 * cumulativeInflation, // II категорія базова (K_2^д = 1.00)
      category3: stateRoadBaseRate * 0.89 * cumulativeInflation, // III категорія (K_3^д = 0.89)
      category4: stateRoadBaseRate * 0.61 * cumulativeInflation, // IV категорія (K_4^д = 0.61)
      category5: stateRoadBaseRate * 0.39 * cumulativeInflation  // V категорія (K_5^д = 0.39)
    };

    dispatch(setStateRoadRates(rates));

    // ✅ Розрахунок завершено, але без автоматичного переходу
    // Користувач сам вирішує, коли переходити до наступного етапу
  };

  return (
    <Card className="w-full">
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="stateRoadBaseRate">
                Встановлений норматив річних фінансових витрат на ЕУ 1 км дороги II кат. державного значення в цінах 20ХХ року
              </Label>
              <Input
                id="stateRoadBaseRate"
                type="number"
                value={stateRoadBaseRate}
                onChange={handleBaseRateChange}
                onPaste={handleBaseRatePaste}
                className="mt-2"
              />
            </div>
            
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <Label>Індекси інфляції: </Label>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isYearSelectorOpen} onOpenChange={setIsYearSelectorOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        title="Вибрати діапазон років для заповнення"
                      >
                        <Calendar className="h-4 w-4 mr-1" /> Вибрати роки
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Вибір діапазону років</DialogTitle>
                        <DialogDescription>
                          Оберіть початковий та кінцевий рік для індексів інфляції
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startYear">Початковий рік</Label>
                            <select
                              id="startYear"
                              value={selectedStartYear}
                              onChange={(e) => setSelectedStartYear(parseInt(e.target.value))}
                              className="w-full mt-1 p-2 border rounded"
                            >
                              {yearOptions.map((year: number) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="endYear">Кінцевий рік</Label>
                            <select
                              id="endYear"
                              value={selectedEndYear}
                              onChange={(e) => setSelectedEndYear(parseInt(e.target.value))}
                              className="w-full mt-1 p-2 border rounded"
                            >
                              {yearOptions.map((year: number) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded text-sm">
                          <strong>Буде додано років:</strong> {selectedEndYear - selectedStartYear + 1}
                          <br />
                          <strong>Діапазон:</strong> {selectedStartYear} - {selectedEndYear}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsYearSelectorOpen(false)}
                        >
                          Скасувати
                        </Button>
                        <Button onClick={applyYearRange}>
                          Застосувати
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addStateInflationIndexHandler}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Додати рік
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 mt-2">
                {stateInflationIndexes.map((inflationValue, i) => (
                  <InflationIndexField
                    key={i}
                    index={i}
                    yearNumber={appliedStartYear + i}
                    value={inflationValue}
                    canRemove={stateInflationIndexes.length > 1}
                    onChange={handleStateInflationChange}
                    onRemove={removeStateInflationIndexHandler}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={calculateStateRoadRates}
                className="w-full"
                size="lg"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Розрахувати нормативи
              </Button>
            </div>
          </div>
          
          {stateRoadRate.category1 > 0 && (
            <>
              <Alert className="bg-green-50 border-green-400">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ РЕЗУЛЬТАТ нормативи для I, II, III, IV, V категорій!</strong>
                  <div className="text-sm mt-1">
                    Має бути пораховано норматив для кожної категорії. Тепер ви можете перейти до наступного етапу.
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mt-6">
              <Card className="p-3 md:p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold text-sm md:text-base">Категорія I</h3>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2">
                    {stateRoadRate.category1.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 1.80)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-3 md:p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold text-sm md:text-base">Категорія II</h3>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2">
                    {stateRoadRate.category2.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 1.00)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-3 md:p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold text-sm md:text-base">Категорія III</h3>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2">
                    {stateRoadRate.category3.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.89)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-3 md:p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold text-sm md:text-base">Категорія IV</h3>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2">
                    {stateRoadRate.category4.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.61)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-3 md:p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold text-sm md:text-base">Категорія V</h3>
                  <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2">
                    {stateRoadRate.category5.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.39)
                  </div>
                </CardContent>
              </Card>
            </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ ОПТИМІЗАЦІЯ: React.memo для запобігання зайвим ре-рендерам
export default React.memo(Block2StateRoads);