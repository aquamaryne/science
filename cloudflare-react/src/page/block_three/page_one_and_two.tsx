import React, { useState } from 'react';
import { Calculator, FileDown, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  determineWorkTypeByTechnicalCondition,
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  REQUIRED_FRICTION_COEFFICIENT,
  type RoadSection,
  type DetailedTechnicalCondition
} from '@/modules/block_three';

import { useAppDispatch } from '@/redux/hooks';
import { setCalculatedRoads } from '@/store/roadDataSlice';

interface InputRow {
  id: string;
  roadName: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  actualIntensity: number;
  actualElasticModulus: number;
  actualSurfaceEvenness: number;
  actualRutDepth: number;
  actualFrictionValue: number;
}

interface ResultRow {
  id: string;
  roadName: string;
  length: number;
  intensityCoefficient: number;
  strengthFlexibleCoefficient: number;
  strengthRigidCoefficient: number;
  evennessCoefficient: number;
  rutCoefficient: number;
  frictionCoefficient: number;
  workType: string;
}

const WORK_TYPE_NAMES: Record<string, string> = {
  current_repair: 'Поточний ремонт',
  capital_repair: 'Капітальний ремонт',
  reconstruction: 'Реконструкція',
  no_work_needed: 'Не потрібно',
  '': '-'
};

export const RoadTechnicalAssessment: React.FC = () => {
  const dispatch = useAppDispatch();
  const [inputRows, setInputRows] = useState<InputRow[]>([
    { 
      id: '1', 
      roadName: '', 
      length: 0, 
      category: 3,
      actualIntensity: 0,
      actualElasticModulus: 0,
      actualSurfaceEvenness: 0,
      actualRutDepth: 0,
      actualFrictionValue: 0
    }
  ]);
  
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [dataTransferred, setDataTransferred] = useState(false);

  const addInputRow = () => {
    const newRow: InputRow = {
      id: Date.now().toString(),
      roadName: '',
      length: 0,
      category: 3,
      actualIntensity: 0,
      actualElasticModulus: 0,
      actualSurfaceEvenness: 0,
      actualRutDepth: 0,
      actualFrictionValue: 0
    };
    setInputRows([...inputRows, newRow]);
  };

  const deleteInputRow = (id: string) => {
    setInputRows(inputRows.filter(row => row.id !== id));
    setCalculated(false);
    setResultRows([]);
    setDataTransferred(false); // ← ДОДАНО
  };

  const updateInputRow = (id: string, field: keyof InputRow, value: any) => {
    setInputRows(inputRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
    setCalculated(false);
    setDataTransferred(false);
  };

  const calculateCoefficients = () => {
    setError('');
    
    const invalidRows = inputRows.filter(row => !row.roadName || row.length <= 0);
    if (invalidRows.length > 0) {
      setError('ПОМИЛКА: Заповніть назву дороги та протяжність для всіх рядків');
      return;
    }

    try {
      const results: ResultRow[] = inputRows.map(input => {
        // Коефіцієнт інтенсивності (4.2.2.1)
        const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[input.category];
        const intensityCoefficient = input.actualIntensity > 0 
          ? maxDesignIntensity / input.actualIntensity 
          : 0;
        
        // Коефіцієнт міцності для нежорсткого покриття (4.2.2.2)
        const requiredElasticModulus = 200;
        const strengthFlexibleCoefficient = input.actualElasticModulus > 0
          ? input.actualElasticModulus / requiredElasticModulus
          : 0;
        
        // Коефіцієнт міцності для жорсткого покриття
        const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[input.category];
        const strengthRigidCoefficient = strengthFlexibleCoefficient * 1.2 * minStrengthCoeff;
        
        // Коефіцієнт рівності (4.2.2.3)
        const maxAllowedEvenness = input.category <= 2 ? 3.1 : 4.0;
        const evennessCoefficient = input.actualSurfaceEvenness > 0
          ? maxAllowedEvenness / input.actualSurfaceEvenness
          : 0;
        
        // Коефіцієнт колійності (4.2.2.4)
        const maxAllowedRutDepth = input.category <= 2 ? 20 : 30;
        const rutCoefficient = input.actualRutDepth > 0
          ? maxAllowedRutDepth / input.actualRutDepth
          : 0;
        
        // Коефіцієнт зчеплення (4.2.2.5)
        const frictionCoefficient = input.actualFrictionValue > 0
          ? input.actualFrictionValue / REQUIRED_FRICTION_COEFFICIENT
          : 0;

        // Формування детального технічного стану
        const detailedCondition: DetailedTechnicalCondition = {
          intensityCoefficient,
          maxDesignIntensity,
          actualIntensity: input.actualIntensity,
          strengthCoefficient: strengthFlexibleCoefficient,
          isRigidPavement: false,
          actualElasticModulus: input.actualElasticModulus,
          requiredElasticModulus,
          evennessCoefficient,
          maxAllowedEvenness,
          rutCoefficient,
          actualRutDepth: input.actualRutDepth,
          maxAllowedRutDepth,
          frictionCoefficient,
          actualFrictionValue: input.actualFrictionValue,
          requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
        };

        // Створення об'єкта секції дороги
        const section: RoadSection = {
          id: input.id,
          name: input.roadName,
          category: input.category,
          length: input.length,
          significance: 'state',
          region: 'Київська',
          detailedCondition,
          trafficIntensity: input.actualIntensity
        };

        // Визначення виду робіт через модуль (4.2.3)
        const workType = determineWorkTypeByTechnicalCondition(section);

        return {
          id: input.id,
          roadName: input.roadName,
          length: input.length,
          intensityCoefficient,
          strengthFlexibleCoefficient,
          strengthRigidCoefficient,
          evennessCoefficient,
          rutCoefficient,
          frictionCoefficient,
          workType
        };
      });

      setResultRows(results);
      setCalculated(true);
      setShowResults(true);
      transferDataToRedux(results);

    } catch (err) {
      setError(`ПОМИЛКА розрахунку: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
      console.error('Calculation error:', err);
    }
  };

  const transferDataToRedux = (results: ResultRow[]) => {
    const dataToTransfer = results.map((result, index) => {
      const input = inputRows[index];
      const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[input.category];
      const requiredElasticModulus = 200;
      const maxAllowedEvenness = input.category <= 2 ? 3.1 : 4.0;
      const maxAllowedRutDepth = input.category <= 2 ? 20 : 30;
      
      return {
        id: result.id,
        roadName: result.roadName,         // ← НАЙМЕНУВАННЯ
        category: input.category,          // ← КАТЕГОРІЯ
        length: result.length,
        region: 'Київська',
        actualIntensity: input.actualIntensity,
        actualElasticModulus: input.actualElasticModulus,
        actualSurfaceEvenness: input.actualSurfaceEvenness,
        actualRutDepth: input.actualRutDepth,
        actualFrictionValue: input.actualFrictionValue,
        workType: result.workType,
        detailedCondition: {
          intensityCoefficient: result.intensityCoefficient,
          strengthCoefficient: result.strengthFlexibleCoefficient,
          evennessCoefficient: result.evennessCoefficient,
          rutCoefficient: result.rutCoefficient,
          frictionCoefficient: result.frictionCoefficient,
          isRigidPavement: false,
          maxDesignIntensity,
          actualIntensity: input.actualIntensity,
          actualElasticModulus: input.actualElasticModulus,
          requiredElasticModulus,
          maxAllowedEvenness,
          actualSurfaceEvenness: input.actualSurfaceEvenness,
          maxAllowedRutDepth,
          actualRutDepth: input.actualRutDepth,
          actualFrictionValue: input.actualFrictionValue,
          requiredFrictionValue: REQUIRED_FRICTION_COEFFICIENT
        }
      };
    });

    // ВІДПРАВКА В REDUX STORE
    dispatch(setCalculatedRoads(dataToTransfer));
    setDataTransferred(true);
    
    console.log('✅ Дані передані в Redux:', dataToTransfer);
  };

  const exportToCSV = () => {
    const headers = [
      'Найменування', 'Протяжність', 'Категорія', 'Інтенсивність (авт/д)',
      'Модуль (МПа)', 'Рівність (м/км)', 'Колія (мм)', 'Зчеплення',
      'Коеф.інтенс.', 'Коеф.міцн.(неж)', 'Коеф.міцн.(ж)',
      'Коеф.рівн.', 'Коеф.колії', 'Коеф.зчепл.', 'Вид робіт'
    ];
    
    const csvRows = [
      headers.join(','),
      ...inputRows.map((input, index) => {
        const result = resultRows[index];
        return [
          `"${input.roadName}"`, input.length, input.category,
          input.actualIntensity, input.actualElasticModulus,
          input.actualSurfaceEvenness, input.actualRutDepth,
          input.actualFrictionValue,
          result ? result.intensityCoefficient.toFixed(3) : '',
          result ? result.strengthFlexibleCoefficient.toFixed(3) : '',
          result ? result.strengthRigidCoefficient.toFixed(3) : '',
          result ? result.evennessCoefficient.toFixed(3) : '',
          result ? result.rutCoefficient.toFixed(3) : '',
          result ? result.frictionCoefficient.toFixed(3) : '',
          result ? `"${WORK_TYPE_NAMES[result.workType]}"` : ''
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'road_technical_assessment.csv';
    link.click();
  };

  const getCoefficientColor = (value: number, threshold: number = 1.0): string => {
    if (value === 0) return '';
    if (value >= threshold) return 'bg-green-100 text-green-800';
    if (value >= threshold * 0.8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Визначення показників транспортно-експлуатаційного стану доріг</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {error.includes('Eo is not a function') && (
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Очистити пошкоджені дані та перезавантажити сторінку?')) {
                      localStorage.removeItem('persist:root');
                      window.location.reload();
                    }
                  }}
                  className="border-red-300 text-red-700"
                >
                  Очистити дані
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

 {/* ========== ПОВІДОМЛЕННЯ ПРО ПЕРЕДАЧУ ========== */}
      {dataTransferred && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            <strong>✓ Дані успішно збережені</strong>
            <div className="text-xs mt-1">
              Передано {resultRows.length} доріг з повною інформацією (найменування, категорія, коефіцієнти).
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* ТАБЛИЦЯ 1: ВИХІДНІ ДАНІ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📝 Вихідні дані (заповнюємо)</CardTitle>
            <div className="flex gap-2">
              <Button onClick={addInputRow} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Додати рядок
              </Button>
              <Button onClick={calculateCoefficients} size="sm" className="bg-white border-1 border-green-700 text-black hover:bg-green-400">
                <Calculator className="h-4 w-4 mr-2" />
                Розрахувати
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-1 border-blue-600">
                  <TableHead className="text-black text-center" colSpan={10}>
                    Визначення показників фактичного транспортно–експлуатаційного стану доріг державного значення
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-xs">Найменування ділянки дороги</TableHead>
                  <TableHead className="text-xs">Протяжність (км)</TableHead>
                  <TableHead className="text-xs">Категорія</TableHead>
                  <TableHead className="text-xs">Інтенсивність (авт./добу)</TableHead>
                  <TableHead className="text-xs">Модуль пружності (МПа)</TableHead>
                  <TableHead className="text-xs">Рівність (м/км)</TableHead>
                  <TableHead className="text-xs">Рівність (см/км)</TableHead>
                  <TableHead className="text-xs">Глибина колії (мм)</TableHead>
                  <TableHead className="text-xs">Коеф. зчеплення</TableHead>
                  <TableHead className="text-xs">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Input
                        value={row.roadName}
                        onChange={(e) => updateInputRow(row.id, 'roadName', e.target.value)}
                        placeholder="М-06"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.length || ''}
                        onChange={(e) => updateInputRow(row.id, 'length', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="0.1"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.category.toString()}
                        onValueChange={(value) => updateInputRow(row.id, 'category', parseInt(value))}
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">I</SelectItem>
                          <SelectItem value="2">II</SelectItem>
                          <SelectItem value="3">III</SelectItem>
                          <SelectItem value="4">IV</SelectItem>
                          <SelectItem value="5">V</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.actualIntensity || ''}
                        onChange={(e) => updateInputRow(row.id, 'actualIntensity', parseFloat(e.target.value) || 0)}
                        placeholder="5000"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.actualElasticModulus || ''}
                        onChange={(e) => updateInputRow(row.id, 'actualElasticModulus', parseFloat(e.target.value) || 0)}
                        placeholder="180"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.actualSurfaceEvenness || ''}
                        onChange={(e) => updateInputRow(row.id, 'actualSurfaceEvenness', parseFloat(e.target.value) || 0)}
                        placeholder="3.5"
                        step="0.1"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground bg-muted">
                      {row.actualSurfaceEvenness ? (row.actualSurfaceEvenness * 100).toFixed(0) : '-'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.actualRutDepth || ''}
                        onChange={(e) => updateInputRow(row.id, 'actualRutDepth', parseFloat(e.target.value) || 0)}
                        placeholder="25"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row.actualFrictionValue || ''}
                        onChange={(e) => updateInputRow(row.id, 'actualFrictionValue', parseFloat(e.target.value) || 0)}
                        placeholder="0.35"
                        step="0.01"
                        min="0"
                        max="1"
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInputRow(row.id)}
                        className="h-8 w-8 p-0"
                        disabled={inputRows.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ТАБЛИЦЯ 2: РЕЗУЛЬТАТИ */}
      {calculated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowResults(!showResults)}
                className="text-lg font-semibold p-0 h-auto hover:bg-transparent"
              >
                📊 Визначення виду робіт (результати розрахунку)
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
                      <TableHead className="text-white text-center" colSpan={9}>
                        Визначення показників фактичного транспортно–експлуатаційного стану доріг
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-xs">Найменування</TableHead>
                      <TableHead className="text-xs">Протяжність</TableHead>
                      <TableHead className="text-xs">Коеф. інтенсивності</TableHead>
                      <TableHead className="text-xs">Коеф. міцності (неж)</TableHead>
                      <TableHead className="text-xs">Коеф. міцності (ж)</TableHead>
                      <TableHead className="text-xs">Коеф. рівності</TableHead>
                      <TableHead className="text-xs">Коеф. колійності</TableHead>
                      <TableHead className="text-xs">Коеф. зчеплення</TableHead>
                      <TableHead className="text-xs">Вид робіт</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm">{row.roadName}</TableCell>
                        <TableCell className="text-sm text-center">{row.length}</TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.intensityCoefficient, 1.0)}`}>
                          {row.intensityCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.strengthFlexibleCoefficient, 0.85)}`}>
                          {row.strengthFlexibleCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.strengthRigidCoefficient, 0.85)}`}>
                          {row.strengthRigidCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.evennessCoefficient, 1.0)}`}>
                          {row.evennessCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.rutCoefficient, 1.0)}`}>
                          {row.rutCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className={`text-sm text-center font-medium ${getCoefficientColor(row.frictionCoefficient, 1.0)}`}>
                          {row.frictionCoefficient.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            row.workType === 'no_work_needed' ? 'bg-green-100 text-green-800' :
                            row.workType === 'current_repair' ? 'bg-blue-100 text-blue-800' :
                            row.workType === 'capital_repair' ? 'bg-yellow-100 text-yellow-800' :
                            row.workType === 'reconstruction' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {WORK_TYPE_NAMES[row.workType]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-3">
                  ✓ Розрахунок завершено!
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-800">{resultRows.length}</div>
                    <div className="text-xs text-gray-600">Всього оброблено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {resultRows.filter(r => r.workType === 'current_repair').length}
                    </div>
                    <div className="text-xs text-gray-600">Поточний ремонт</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">
                      {resultRows.filter(r => r.workType === 'capital_repair').length}
                    </div>
                    <div className="text-xs text-gray-600">Капітальний ремонт</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">
                      {resultRows.filter(r => r.workType === 'reconstruction').length}
                    </div>
                    <div className="text-xs text-gray-600">Реконструкція</div>
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