import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Calculator, CheckCircle2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { 
  setLocalRoadBaseRate,
  addLocalInflationIndex,
  removeLocalInflationIndex,
  updateLocalInflationIndex,
  setLocalRoadRates
} from '@/redux/slices/blockTwoSlice';

interface Block2LocalRoadsProps {
  // onCalculated?: () => void; // Убрано - автоматичні переходи відключені
}

const Block2LocalRoads: React.FC<Block2LocalRoadsProps> = () => {
  const dispatch = useAppDispatch();
  const blockTwoState = useAppSelector(state => state.blockTwo);
  
  const localRoadBaseRate = blockTwoState.localRoadBaseRate;
  const localInflationIndexes = blockTwoState.localInflationIndexes;
  const localRoadRate = blockTwoState.localRoadRates;
  const addLocalInflationIndexHandler = () => {
    dispatch(addLocalInflationIndex(0));
  };

  const removeLocalInflationIndexHandler = (index: number) => {
    if (localInflationIndexes.length > 1) {
      dispatch(removeLocalInflationIndex(index));
    }
  };

  const handleLocalInflationChange = (index: number, value: string) => {
    dispatch(updateLocalInflationIndex({ index, value: parseFloat(value) || 0 }));
  };

  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => acc * (1 + curr / 100), 1);
  };

  const calculateLocalRoadRates = () => {
    // Валідація вхідних даних
    if (localRoadBaseRate <= 0) {
      alert('Будь ласка, введіть коректний норматив базової вартості (більше 0)');
      return;
    }
    
    if (localInflationIndexes.length === 0 || localInflationIndexes.some(index => isNaN(index) || index < 0)) {
      alert('Будь ласка, введіть коректні індекси інфляції (не менше 0)');
      return;
    }
    
    // Формула з методики: H_j^м = H^м × K_j^м × K_інф
    const cumulativeInflation = calculateCumulativeInflationIndex(localInflationIndexes);
    
    // Коефіцієнти диференціювання згідно з Додатком 3 методики для місцевих доріг
    const rates = {
      category1: localRoadBaseRate * 1.71 * cumulativeInflation, // I категорія
      category2: localRoadBaseRate * 1.00 * cumulativeInflation, // II категорія (базова)
      category3: localRoadBaseRate * 0.85 * cumulativeInflation, // III категорія
      category4: localRoadBaseRate * 0.64 * cumulativeInflation, // IV категорія
      category5: localRoadBaseRate * 0.40 * cumulativeInflation  // V категорія
    };
    
    dispatch(setLocalRoadRates(rates));
    
    // ✅ Розрахунок завершено, але без автоматичного переходу
    // Користувач сам вирішує, коли переходити до наступного етапу
  };

  return (
    <Card>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="localRoadBaseRate">
                Встановлений норматив річних фінансових витрат на ЕУ 1 км дороги II кат. місцевого значення в цінах 20ХХ року
              </Label>
              <Input
                id="localRoadBaseRate"
                type="number"
                value={localRoadBaseRate}
                onChange={(e) => dispatch(setLocalRoadBaseRate(parseFloat(e.target.value) || 360.544))}
                className="mt-2"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label>Індекси інфляції</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addLocalInflationIndexHandler}
                >
                  <Plus className="h-4 w-4 mr-1" /> Додати індекс
                </Button>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Вводиться вручну, але має бути можливість ввести кількість років і тоді з'являється така ж кількість комірок для внесення відповідних індексів за певні роки, бо їх може бути багато
              </div>
              <div className="grid gap-2 mt-2">
                {localInflationIndexes.map((index, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label className="min-w-[80px] text-sm">{`Рік ${2023 + i + 1}:`}</Label>
                      <Input
                        type="number"
                        value={index}
                        onChange={(e) => handleLocalInflationChange(i, e.target.value)}
                        placeholder="Введіть індекс"
                        className="flex-1 sm:flex-none sm:w-24"
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-gray-500">
                        (коеф.: {(1 + index / 100).toFixed(4)})
                      </span>
                      {localInflationIndexes.length > 1 && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLocalInflationIndexHandler(i)}
                          className="p-1 h-auto text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <strong>Сукупний індекс інфляції: {calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)}</strong>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={calculateLocalRoadRates}
                className="w-full"
                size="lg"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Розрахувати нормативи
              </Button>
            </div>
          </div>
          
          {localRoadRate.category1 > 0 && (
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
              
              <div className="grid grid-cols-5 gap-4 mt-6">
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold">Категорія I</h3>
                  <div className="text-xl font-bold mt-2">
                    {localRoadRate.category1.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 1.71)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold">Категорія II</h3>
                  <div className="text-xl font-bold mt-2">
                    {localRoadRate.category2.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 1.00)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold">Категорія III</h3>
                  <div className="text-xl font-bold mt-2">
                    {localRoadRate.category3.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.85)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold">Категорія IV</h3>
                  <div className="text-xl font-bold mt-2">
                    {localRoadRate.category4.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.64)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4">
                <CardContent className="p-0 text-center">
                  <h3 className="font-bold">Категорія V</h3>
                  <div className="text-xl font-bold mt-2">
                    {localRoadRate.category5.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">тис. грн/км</div>
                  <div className="text-xs text-blue-600 mt-1">
                    (коеф. 0.40)
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

export default Block2LocalRoads;