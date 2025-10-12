import React, { useState } from 'react';
import { Calculator, FileDown, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BASE_REPAIR_COSTS,
} from '@/modules/block_three_alghoritm';

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
  workType: 'reconstruction' | 'capital_repair' | 'current_repair' | '';
  estimatedCost: number;
}

const WORK_TYPE_NAMES = {
  reconstruction: 'Реконструкція',
  capital_repair: 'Капітальний ремонт',
  current_repair: 'Поточний ремонт',
  '': '-'
};

export const RoadCostIndicators: React.FC = () => {
  // Вкладка 3: Показники вартості (завантажуємо з модуля)
  const [costIndicators, setCostIndicators] = useState<CostIndicators>({
    reconstruction: { ...BASE_REPAIR_COSTS.reconstruction },
    capitalRepair: { ...BASE_REPAIR_COSTS.capital_repair },
    currentRepair: { ...BASE_REPAIR_COSTS.current_repair }
  });

  // Вкладка 4: Розрахунок вартості
  const [costRows, setCostRows] = useState<CostCalculationRow[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string>('');

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

  const calculateEstimatedCosts = () => {
    setError('');

    // TODO: Тут має бути логіка отримання даних з попередніх вкладок
    // Для демонстрації створимо тестові дані
    const testData: CostCalculationRow[] = [
      {
        id: '1',
        roadName: 'М-06 Київ-Чоп',
        length: 25.5,
        category: 2,
        workType: 'capital_repair',
        estimatedCost: 0
      },
      {
        id: '2',
        roadName: 'Н-03 Житомир-Чернівці',
        length: 15.3,
        category: 3,
        workType: 'current_repair',
        estimatedCost: 0
      },
      {
        id: '3',
        roadName: 'Р-15 Львів-Тернопіль',
        length: 42.8,
        category: 4,
        workType: 'reconstruction',
        estimatedCost: 0
      }
    ];

    // Розраховуємо вартість для кожної дороги
    const calculatedRows = testData.map(row => {
      if (!row.workType) return row;

      let costPerKm = 0;
      if (row.workType === 'reconstruction') {
        costPerKm = costIndicators.reconstruction[row.category];
      } else if (row.workType === 'capital_repair') {
        costPerKm = costIndicators.capitalRepair[row.category];
      } else if (row.workType === 'current_repair') {
        costPerKm = costIndicators.currentRepair[row.category];
      }

      const estimatedCost = costPerKm * row.length;

      return {
        ...row,
        estimatedCost
      };
    });

    setCostRows(calculatedRows);
    setCalculated(true);
    setShowResults(true);
  };

  const exportToCSV = () => {
    // Експорт показників вартості
    const headers1 = ['Вид робіт', 'I', 'II', 'III', 'IV', 'V'];
    const csvRows1 = [
      headers1.join(','),
      ['Реконструкція', ...Object.values(costIndicators.reconstruction)].join(','),
      ['Капітальний ремонт', ...Object.values(costIndicators.capitalRepair)].join(','),
      ['Поточний ремонт', ...Object.values(costIndicators.currentRepair)].join(',')
    ];

    // Експорт розрахунків вартості
    const headers2 = ['Найменування', 'Протяжність', 'Категорія', 'Вид робіт', 'Орієнтовна вартість'];
    const csvRows2 = calculated ? [
      '\n\nОрієнтовна вартість робіт',
      headers2.join(','),
      ...costRows.map(row => [
        `"${row.roadName}"`,
        row.length,
        row.category,
        `"${WORK_TYPE_NAMES[row.workType]}"`,
        row.estimatedCost.toFixed(2)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Показники вартості дорожніх робіт</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ВКЛАДКА 3: УСЕРЕДНЕНІ ПОКАЗНИКИ ВАРТОСТІ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📊 Усереднені орієнтовні показники вартості дорожніх робіт</CardTitle>
            <div className="flex gap-2">
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Скинути до базових
              </Button>
              <Button onClick={calculateEstimatedCosts} size="sm" className="bg-green-600 hover:bg-green-700">
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
                <TableRow className="bg-white border-purple-600 border-1">
                  <TableHead className="text-black text-center" colSpan={6}>
                    Усереднені орієнтовні показники вартості дорожніх робіт за даними об'єктів-аналогів, млн.грн/1 км
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
                        step="100"
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
                        step="100"
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
                        step="10"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ВКЛАДКА 4: ОРІЄНТОВНА ВАРТІСТЬ РОБІТ */}
      {calculated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowResults(!showResults)}
                className="text-lg font-semibold p-0 h-auto hover:bg-transparent"
              >
                💰 Вкладка 4: Орієнтовна вартість робіт
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
                      <TableHead className="text-white text-center" colSpan={5}>
                        Орієнтовна вартість робіт
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-xs">Найменування ділянки дороги</TableHead>
                      <TableHead className="text-xs text-center">Протяжність дороги (км)</TableHead>
                      <TableHead className="text-xs text-center">Категорія</TableHead>
                      <TableHead className="text-xs text-center">Вид робіт</TableHead>
                      <TableHead className="text-xs text-center">Орієнтовна вартість робіт (тис. грн)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">{row.roadName}</TableCell>
                        <TableCell className="text-sm text-center">{row.length}</TableCell>
                        <TableCell className="text-sm text-center">{row.category}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            row.workType === 'current_repair' ? 'bg-blue-100 text-blue-800' :
                            row.workType === 'capital_repair' ? 'bg-yellow-100 text-yellow-800' :
                            row.workType === 'reconstruction' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {WORK_TYPE_NAMES[row.workType]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {row.estimatedCost.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={4} className="text-right">РАЗОМ:</TableCell>
                      <TableCell className="text-right">
                        {totalEstimatedCost.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-3">
                  ✓ Розрахунок завершено! Орієнтовна вартість обчислена на основі показників з Вкладки 3
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