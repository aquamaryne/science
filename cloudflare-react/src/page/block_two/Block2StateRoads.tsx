import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Calculator, CheckCircle2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { 
  setStateRoadBaseRate,
  addStateInflationIndex,
  removeStateInflationIndex,
  updateStateInflationIndex,
  setStateRoadRates
} from '@/redux/slices/blockTwoSlice';

interface Block2StateRoadsProps {
  // onCalculated?: () => void; // Убрано - автоматичні переходи відключені
}

const Block2StateRoads: React.FC<Block2StateRoadsProps> = () => {
  const dispatch = useAppDispatch();
  const blockTwoState = useAppSelector(state => state.blockTwo);
  
  const stateRoadBaseRate = blockTwoState.stateRoadBaseRate;
  const stateInflationIndexes = blockTwoState.stateInflationIndexes;
  const stateRoadRate = blockTwoState.stateRoadRates;
  const addStateInflationIndexHandler = () => {
    dispatch(addStateInflationIndex(0));
  };

  const removeStateInflationIndexHandler = (index: number) => {
    if (stateInflationIndexes.length > 1) {
      dispatch(removeStateInflationIndex(index));
    }
  };

  const handleStateInflationChange = (index: number, value: string) => {
    dispatch(updateStateInflationIndex({ index, value: parseFloat(value) || 0 }));
  };

  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => acc * (1 + curr / 100), 1);
  };

  const calculateStateRoadRates = () => {
    // Валідація вхідних даних
    if (stateRoadBaseRate <= 0) {
      alert('Будь ласка, введіть коректний норматив базової вартості (більше 0)');
      return;
    }
    
    if (stateInflationIndexes.length === 0 || stateInflationIndexes.some(index => isNaN(index) || index < 0)) {
      alert('Будь ласка, введіть коректні індекси інфляції (не менше 0)');
      return;
    }
    
    // Формула з методики: H_j^д = H^д × K_j^д × K_інф
    const cumulativeInflation = calculateCumulativeInflationIndex(stateInflationIndexes);
    
    // Коефіцієнти диференціювання згідно з Додатком 3 методики
    const rates = {
      category1: stateRoadBaseRate * 1.80 * cumulativeInflation, // I категорія
      category2: stateRoadBaseRate * 1.00 * cumulativeInflation, // II категорія (базова)
      category3: stateRoadBaseRate * 0.89 * cumulativeInflation, // III категорія
      category4: stateRoadBaseRate * 0.61 * cumulativeInflation, // IV категорія
      category5: stateRoadBaseRate * 0.39 * cumulativeInflation  // V категорія
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
                onChange={(e) => dispatch(setStateRoadBaseRate(parseFloat(e.target.value) || 604.761))}
                className="mt-2"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label>Індекси інфляції</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addStateInflationIndexHandler}
                >
                  <Plus className="h-4 w-4 mr-1" /> Додати індекс
                </Button>
              </div>
              <div className="grid gap-2 mt-2">
                {stateInflationIndexes.map((index, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label className="min-w-[80px] text-sm">{`Рік ${2023 + i + 1}:`}</Label>
                      <Input
                        type="number"
                        value={index}
                        onChange={(e) => handleStateInflationChange(i, e.target.value)}
                        placeholder="Введіть індекс"
                        className="flex-1 sm:flex-none sm:w-24"
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-gray-500">
                        (коеф.: {(1 + index / 100).toFixed(4)})
                      </span>
                      {stateInflationIndexes.length > 1 && (
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStateInflationIndexHandler(i)}
                          className="p-1 h-auto text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <strong>Сукупний індекс інфляції: {calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)}</strong>
                </div>
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

export default Block2StateRoads;