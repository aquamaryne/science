import React, { useState, useEffect } from 'react';
import { Calculator, FileDown, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  BASE_REPAIR_COSTS,
  calculateDetailedWorkCost,
  determineWorkTypeByTechnicalCondition,
  hasBlockOneBudgetData,
  getBudgetAllocation,
  type RoadSection,
  type BudgetAllocation
} from '@/modules/block_three';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { 
  selectCalculatedRoads, 
  selectHasCalculatedData, 
  selectLastCalculationTime 
} from '@/store/roadDataSlice';
import { setPage2Complete } from '@/redux/slices/blockThreeSlice';

interface CostIndicators {
  reconstruction: { [key in 1 | 2 | 3 | 4 | 5]: number };
  capitalRepair: { [key in 1 | 2 | 3 | 4 | 5]: number };
  currentRepair: { [key in 1 | 2 | 3 | 4 | 5]: number };
}

interface CostCalculationRow {
  id: string;
  roadName: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  region: string;
  workType: 'reconstruction' | 'capital_repair' | 'current_repair' | '';
  estimatedCost: number;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
}

const WORK_TYPE_NAMES = {
  reconstruction: 'Реконструкція',
  capital_repair: 'Капітальний ремонт',
  current_repair: 'Поточний ремонт',
  '': '-'
};

const WORK_TYPE_COLORS = {
  reconstruction: 'bg-red-100 text-red-800',
  capital_repair: 'bg-yellow-100 text-yellow-800',
  current_repair: 'bg-blue-100 text-blue-800',
  '': 'bg-gray-100 text-gray-800'
};

export const RoadCostIndicators: React.FC = () => {
  const appDispatch = useAppDispatch();
  const calculatedRoadsFromRedux = useAppSelector(selectCalculatedRoads);
  const hasReduxData = useAppSelector(selectHasCalculatedData);
  const lastCalculationTime = useAppSelector(selectLastCalculationTime);

  // Показники вартості (з модуля)
  const [costIndicators, setCostIndicators] = useState<CostIndicators>({
    reconstruction: { ...BASE_REPAIR_COSTS.reconstruction },
    capitalRepair: { ...BASE_REPAIR_COSTS.capital_repair },
    currentRepair: { ...BASE_REPAIR_COSTS.current_repair }
  });

  // Дані для розрахунку
  const [roadSections, setRoadSections] = useState<RoadSection[]>([]);
  const [costRows, setCostRows] = useState<CostCalculationRow[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string>('');
  const [budgetInfo, setBudgetInfo] = useState<BudgetAllocation | null>(null);

  // Перевірка наявності даних з бюджетного фінансування
  useEffect(() => {
    if (hasBlockOneBudgetData()) {
      const allocation = getBudgetAllocation();
      setBudgetInfo(allocation);
    }
  }, []);

  useEffect(() => {
    if (hasReduxData && calculatedRoadsFromRedux.length > 0) {
      console.log('✅ Автоматичне завантаження з Redux...');
      loadDataFromRedux();
    }
  }, [hasReduxData, calculatedRoadsFromRedux]);

  const updateCostIndicator = (
    workType: keyof CostIndicators,
    category: 1 | 2 | 3 | 4 | 5,
    value: number
  ) => {
    setCostIndicators(prev => ({
      ...prev,
      [workType]: {
        ...prev[workType],
        [category]: value
      }
    }));
  };

  const resetToDefaults = () => {
    setCostIndicators({
      reconstruction: { ...BASE_REPAIR_COSTS.reconstruction },
      capitalRepair: { ...BASE_REPAIR_COSTS.capital_repair },
      currentRepair: { ...BASE_REPAIR_COSTS.current_repair }
    });
  };

  const loadDataFromRedux = () => {
    const sectionsFromRedux: RoadSection[] = calculatedRoadsFromRedux.map(road => ({
      id: road.id,
      name: road.roadName,           // ← НАЙМЕНУВАННЯ з Redux
      length: road.length,
      category: road.category,       // ← КАТЕГОРІЯ з Redux
      region: road.region,
      significance: 'state',
      trafficIntensity: road.actualIntensity,
      isInternationalRoad: road.isInternationalRoad,
      isDefenseRoad: road.isDefenseRoad,
      detailedCondition: road.detailedCondition
    }));

    setRoadSections(sectionsFromRedux);
    setError('');
    
    console.log('✅ Завантажено з Redux:', sectionsFromRedux.length, 'доріг');
  };

  const calculateEstimatedCosts = () => {
    setError('');

    if (roadSections.length === 0) {
      setError('Немає даних про дороги. Завантажте тестові дані або імпортуйте власні.');
      return;
    }

    try {
      // Розрахунок для кожної секції
      const calculatedRows: CostCalculationRow[] = roadSections.map(section => {
        // Визначення виду робіт через модуль
        const workType = determineWorkTypeByTechnicalCondition(section);
        
        let estimatedCost = 0;
        
        if (workType !== 'no_work_needed') {
          // Використовуємо функцію з модуля для розрахунку вартості
          estimatedCost = calculateDetailedWorkCost(section, workType);
        }

        return {
          id: section.id,
          roadName: section.name,
          length: section.length,
          category: section.category,
          region: section.region,
          workType: workType === 'no_work_needed' ? '' : workType,
          estimatedCost,
          isDefenseRoad: section.isDefenseRoad,
          isInternationalRoad: section.isInternationalRoad
        };
      });

      setCostRows(calculatedRows);
      setCalculated(true);
      setShowResults(true);
      
      // ✅ Позначаємо сторінку 2 як завершену
      appDispatch(setPage2Complete(true));
      console.log('✅ Сторінка 2 позначена як завершена');
    } catch (err) {
      setError('Помилка при розрахунку вартості: ' + (err as Error).message);
    }
  };

  const exportToCSV = () => {
    // Експорт показників вартості
    const headers1 = ['Вид робіт', 'I', 'II', 'III', 'IV', 'V'];
    const csvRows1 = [
      'Усереднені орієнтовні показники вартості (тис. грн/км)',
      headers1.join(','),
      ['Реконструкція', ...Object.values(costIndicators.reconstruction)].join(','),
      ['Капітальний ремонт', ...Object.values(costIndicators.capitalRepair)].join(','),
      ['Поточний ремонт', ...Object.values(costIndicators.currentRepair)].join(',')
    ];

    // Експорт розрахунків
    const headers2 = ['Найменування', 'Протяжність (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість (тис. грн)'];
    const csvRows2 = calculated ? [
      '',
      'Орієнтовна вартість робіт',
      headers2.join(','),
      ...costRows.map(row => [
        `"${row.roadName}"`,
        row.length,
        row.category,
        `"${row.region}"`,
        `"${WORK_TYPE_NAMES[row.workType]}"`,
        row.estimatedCost.toFixed(0)
      ].join(','))
    ] : [];

    const csvContent = [...csvRows1, ...csvRows2].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'road_cost_indicators.csv';
    link.click();
  };

  const totalEstimatedCost = costRows.reduce((sum, row) => sum + row.estimatedCost, 0);

  return (
    <div className="w-full space-y-6 p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Показники вартості дорожніх робіт</h1>
        </div>
      </div>

      {hasReduxData && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <h3 className="font-semibold text-blue-900 mb-2">
              ✓ Дані автоматично завантажено з Redux Store
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Кількість доріг:</span>
                <span className="ml-2 font-semibold text-blue-800">
                  {calculatedRoadsFromRedux.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Останній розрахунок:</span>
                <span className="ml-2 font-semibold text-blue-800">
                  {lastCalculationTime ? new Date(lastCalculationTime).toLocaleString('uk-UA') : '-'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              📋 Передані дані: найменування, категорія, протяжність та всі коефіцієнти
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Інформація про бюджет */}
      {budgetInfo && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <h3 className="font-semibold text-blue-900 mb-2">📊 Інформація з бюджетного фінансування</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Поточний ремонт:</span>
                <span className="ml-2 font-semibold">{budgetInfo.currentRepair.toLocaleString()} тис. грн</span>
              </div>
              <div>
                <span className="text-gray-600">Капітальний ремонт:</span>
                <span className="ml-2 font-semibold">{budgetInfo.capitalRepair.toLocaleString()} тис. грн</span>
              </div>
              <div>
                <span className="text-gray-600">Реконструкція:</span>
                <span className="ml-2 font-semibold">{budgetInfo.reconstruction.toLocaleString()} тис. грн</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ВКЛАДКА 3: Показники вартості */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📊 Усереднені орієнтовні показники вартості</CardTitle>
            <div className="flex gap-2">
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Скинути до базових
              </Button>
              <Button 
                onClick={calculateEstimatedCosts} 
                size="sm" 
                className="bg-white border-1 border-green-700 text-black hover:bg-green-400"
                disabled={roadSections.length === 0}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Розрахувати вартість
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-1 border-purple-700">
                  <TableHead className="text-black text-center" colSpan={6}>
                    Усереднені орієнтовні показники вартості дорожніх робіт (тис. грн/км)
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead rowSpan={2} className="text-center align-middle">Вид робіт</TableHead>
                  <TableHead colSpan={5} className="text-center">Категорія дороги</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center">I</TableHead>
                  <TableHead className="text-center">II</TableHead>
                  <TableHead className="text-center">III</TableHead>
                  <TableHead className="text-center">IV</TableHead>
                  <TableHead className="text-center">V</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Реконструкція</TableCell>
                  {([1, 2, 3, 4, 5] as const).map(cat => (
                    <TableCell key={cat}>
                      <Input
                        type="number"
                        value={costIndicators.reconstruction[cat]}
                        onChange={(e) => updateCostIndicator('reconstruction', cat, parseFloat(e.target.value) || 0)}
                        className="h-8 text-center"
                        step="1000"
                      />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Капітальний ремонт</TableCell>
                  {([1, 2, 3, 4, 5] as const).map(cat => (
                    <TableCell key={cat}>
                      <Input
                        type="number"
                        value={costIndicators.capitalRepair[cat]}
                        onChange={(e) => updateCostIndicator('capitalRepair', cat, parseFloat(e.target.value) || 0)}
                        className="h-8 text-center"
                        step="1000"
                      />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Поточний ремонт</TableCell>
                  {([1, 2, 3, 4, 5] as const).map(cat => (
                    <TableCell key={cat}>
                      <Input
                        type="number"
                        value={costIndicators.currentRepair[cat]}
                        onChange={(e) => updateCostIndicator('currentRepair', cat, parseFloat(e.target.value) || 0)}
                        className="h-8 text-center"
                        step="100"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ВКЛАДКА 4: Орієнтовна вартість робіт */}
      {calculated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowResults(!showResults)}
                className="text-lg font-semibold p-0 h-auto hover:bg-transparent"
              >
                💰 Орієнтовна вартість робіт
                {showResults ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </Button>
              <Button onClick={exportToCSV} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <FileDown className="h-4 w-4 mr-2" />
                Експорт CSV
              </Button>
            </div>
          </CardHeader>
          
          {showResults && (
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-600 hover:bg-green-600">
                      <TableHead className="text-white text-center" colSpan={6}>
                        Орієнтовна вартість робіт
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-xs">Найменування ділянки</TableHead>
                      <TableHead className="text-xs text-center">Протяжність (км)</TableHead>
                      <TableHead className="text-xs text-center">Категорія</TableHead>
                      <TableHead className="text-xs text-center">Вид робіт</TableHead>
                      <TableHead className="text-xs text-right">Вартість (тис. грн)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">
                          {row.roadName}
                          {row.isDefenseRoad}
                          {row.isInternationalRoad}
                        </TableCell>
                        <TableCell className="text-sm text-center">{row.length}</TableCell>
                        <TableCell className="text-sm text-center">{row.category}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${WORK_TYPE_COLORS[row.workType]}`}>
                            {WORK_TYPE_NAMES[row.workType]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {row.estimatedCost.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={5} className="text-right">РАЗОМ:</TableCell>
                      <TableCell className="text-right">
                        {totalEstimatedCost.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Статистика */}
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-3">
                  ✓ Розрахунок завершено!
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-800">{costRows.length}</div>
                    <div className="text-xs text-gray-600">Всього об'єктів</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {costRows.filter(r => r.workType === 'current_repair').length}
                    </div>
                    <div className="text-xs text-gray-600">Поточний ремонт</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {costRows.filter(r => r.workType === 'capital_repair').length}
                    </div>
                    <div className="text-xs text-gray-600">Капітальний ремонт</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">
                      {costRows.filter(r => r.workType === 'reconstruction').length}
                    </div>
                    <div className="text-xs text-gray-600">Реконструкція</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-300">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {totalEstimatedCost.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-600">Загальна орієнтовна вартість (тис. грн)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}