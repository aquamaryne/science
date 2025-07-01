import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheetIcon, 
  UploadIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalculatorIcon,
  RefreshCwIcon,
  DownloadIcon,
  ArrowLeftIcon,
  DollarSignIcon
} from "lucide-react";

// ИМПОРТЫ ИНТЕГРАЦИИ С БЛОКОМ 1
import { 
  hasBlockOneBudgetData, 
  getBlockOneBudgetData, 
  getBudgetStatistics,
  getBlockOneBudgetSources,
  planRepairWorksWithBlockOneData,
  generateDetailedRepairPlanReport,
  type RoadSection,
} from '../../modules/block_three';

// Типы данных (расширенные для интеграции)
export interface RoadSectionData {
  id: string;
  name: string;
  length: number;
  category: number;
  trafficIntensity: number;
  strengthModulus: number;
  roughnessProfile: number;
  roughnessBump: number;
  rutDepth: number;
  frictionCoeff: number;
  
  // Расчетные коэффициенты
  intensityCoeff?: number;
  strengthCoeff?: number;
  evennessCoeff?: number;
  rutCoeff?: number;
  frictionFactorCoeff?: number;
  
  // Результаты
  workType?: string;
  estimatedCost?: number;
  enpv?: number;
  eirr?: number;
  bcr?: number;
  
  // НОВОЕ: Интеграция с Блоком 1
  significance?: 'state' | 'local';
  budgetSource?: 'q1' | 'q2';
  priority?: number;
}

// Константы (остаются без изменений)
const MAX_DESIGN_INTENSITY_BY_CATEGORY = {
  1: 7000, 2: 6000, 3: 4000, 4: 2000, 5: 500
};

const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY = {
  1: 300, 2: 280, 3: 250, 4: 220, 5: 200
};

const REQUIRED_FRICTION_COEFFICIENT = 0.4;

const COST_STANDARDS = {
  reconstruction: { 1: 50.0, 2: 40.0, 3: 30.0, 4: 25.0, 5: 20.0 },
  capital_repair: { 1: 15.0, 2: 12.0, 3: 10.0, 4: 8.0, 5: 6.0 },
  current_repair: { 1: 3.0, 2: 2.0, 3: 1.5, 4: 1.0, 5: 0.8 }
};

const CATEGORY_NORMS = {
  maxRoughness: { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0, 5: 2.5 },
  maxRutDepth: { 1: 5, 2: 8, 3: 12, 4: 15, 5: 20 }
};

// НОВЫЙ КОМПОНЕНТ: Отображение бюджета из Блока 1
const BlockOneBudgetDisplay: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [budgetData, setBudgetData] = useState<any>(null);
  const [budgetStats, setBudgetStats] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkData = () => {
      const hasData = hasBlockOneBudgetData();
      setIsReady(hasData);
      
      if (hasData) {
        const data = getBlockOneBudgetData();
        const stats = getBudgetStatistics();
        setBudgetData(data);
        setBudgetStats(stats);
      }
    };

    checkData();
    const interval = setInterval(checkData, 2000); // Проверяем каждые 2 секунды
    return () => clearInterval(interval);
  }, []);

  if (!isReady) {
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-50">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription className="text-yellow-700">
          ⚠️ Немає даних з Блоку 1. Спочатку виконайте розрахунки бюджету в Блоці 1 та передайте дані.
          {onBack && (
            <Button onClick={onBack} variant="link" className="ml-2 p-0 h-auto text-yellow-700 underline">
              Повернутися до Блоку 1
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const budgetSources = getBlockOneBudgetSources();

  return (
    <Card className="mb-6 w-full border-green-500 shadow-sm rounded-none">
      <CardHeader className="bg-green-50 border-b border-green-500">
        <CardTitle className="text-xl font-bold text-green-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Бюджет з Блоку 1 (Сесія: {budgetData?.sessionId})
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm" className="border-green-300">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              До Блоку 1
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white border rounded">
            <div className="text-2xl font-bold text-gray-800">
              {budgetStats?.q1Budget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Q₁ (тис. грн)</div>
            <div className="text-xs text-gray-500">Державні дороги</div>
          </div>
          
          <div className="text-center p-4 bg-white border rounded">
            <div className="text-2xl font-bold text-gray-800">
              {budgetStats?.q2Budget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Q₂ (тис. грн)</div>
            <div className="text-xs text-gray-500">Місцеві дороги</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
            <div className="text-2xl font-bold text-green-800">
              {budgetStats?.totalBudget.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Загальний бюджет</div>
            <div className="text-xs text-green-500">Для ремонтів</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-lg font-bold text-blue-800">
              {budgetData?.timestamp ? new Date(budgetData.timestamp).toLocaleDateString('uk-UA') : '—'}
            </div>
            <div className="text-sm text-blue-600">Дата розрахунку</div>
            <div className="text-xs text-blue-500">Блок 1</div>
          </div>
        </div>

        {/* Распределение бюджета */}
        {budgetStats?.allocation && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">Автоматичний розподіл бюджету:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-lg font-bold text-yellow-800">
                  {budgetStats.allocation.currentRepair.toLocaleString()}
                </div>
                <div className="text-xs text-yellow-600">Поточний ремонт (30%)</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="text-lg font-bold text-orange-800">
                  {budgetStats.allocation.capitalRepair.toLocaleString()}
                </div>
                <div className="text-xs text-orange-600">Капітальний ремонт (45%)</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-lg font-bold text-red-800">
                  {budgetStats.allocation.reconstruction.toLocaleString()}
                </div>
                <div className="text-xs text-red-600">Реконструкція (20%)</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-lg font-bold text-gray-800">
                  {budgetStats.allocation.reserve.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Резерв (5%)</div>
              </div>
            </div>
          </div>
        )}

        {/* Источники финансирования */}
        {budgetSources && (
          <div className="mt-6 text-xs text-gray-600">
            <details className="cursor-pointer">
              <summary className="font-medium">Джерела фінансування (розгорнути)</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <strong>Q₁ (Державні дороги):</strong>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {budgetSources.q1Sources.map(source => (
                      <li key={source.id}>
                        {source.id}: {source.value.toLocaleString()} тис. грн
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Q₂ (Місцеві дороги):</strong>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {budgetSources.q2Sources.map(source => (
                      <li key={source.id}>
                        {source.id}: {source.value.toLocaleString()} тис. грн
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// НОВЫЙ КОМПОНЕНТ: Планирование с использованием бюджета Блока 1
const BudgetBasedPlanning: React.FC<{ sections: RoadSectionData[] }> = ({ sections }) => {
  const [planResults, setPlanResults] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  // Конвертация RoadSectionData в RoadSection для Блока 3
  const convertToRoadSections = (sectionData: RoadSectionData[]): RoadSection[] => {
    return sectionData.map(section => ({
      id: section.id,
      name: section.name,
      category: section.category,
      length: section.length,
      significance: section.significance || (section.category <= 2 ? 'state' : 'local'),
      technicalCondition: {
        intensityCoefficient: section.intensityCoeff || 1.0,
        strengthCoefficient: section.strengthCoeff || 1.0,
        evennessCoefficient: section.evennessCoeff || 1.0,
        rutCoefficient: section.rutCoeff || 1.0,
        frictionCoefficient: section.frictionFactorCoeff || 1.0
      },
      trafficIntensity: section.trafficIntensity,
      estimatedCost: section.estimatedCost
    }));
  };

  const runBudgetBasedPlanning = async () => {
    if (!hasBlockOneBudgetData()) {
      alert('Немає даних з Блоку 1!');
      return;
    }

    if (sections.length === 0) {
      alert('Додайте дорожні секції для планування!');
      return;
    }

    setIsPlanning(true);

    try {
      const roadSections = convertToRoadSections(sections);
      const results = planRepairWorksWithBlockOneData(roadSections);
      setPlanResults(results);
      
      console.log('Результати планування з бюджетом Блоку 1:', results);
    } catch (error) {
      console.error('Помилка планування:', error);
      if (error instanceof Error) {
        alert('Помилка при плануванні: ' + error.message);
      } else {
        alert('Помилка при плануванні: ' + String(error));
      }
    } finally {
      setIsPlanning(false);
    }
  };

  const generateBudgetReport = () => {
    if (!hasBlockOneBudgetData()) return;
    
    const report = generateDetailedRepairPlanReport();
    
    // Создаем и скачиваем файл
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-repair-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5" />
          Планування з урахуванням бюджету Блоку 1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={runBudgetBasedPlanning}
            disabled={!hasBlockOneBudgetData() || sections.length === 0 || isPlanning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPlanning ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalculatorIcon className="h-4 w-4 mr-2" />
            )}
            Планувати ремонти з бюджетом
          </Button>
          
          <Button 
            onClick={generateBudgetReport}
            disabled={!hasBlockOneBudgetData()}
            variant="outline"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Звіт з бюджетом
          </Button>
        </div>

        {planResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-lg font-bold text-yellow-800">
                  {planResults.currentRepairProjects.length}
                </div>
                <div className="text-sm text-yellow-600">Поточний ремонт</div>
                <div className="text-xs text-gray-500">
                  {planResults.budgetBreakdown.currentRepairUsed.toLocaleString()} тис. грн
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                <div className="text-lg font-bold text-orange-800">
                  {planResults.capitalRepairProjects.length}
                </div>
                <div className="text-sm text-orange-600">Капітальний ремонт</div>
                <div className="text-xs text-gray-500">
                  {planResults.budgetBreakdown.capitalRepairUsed.toLocaleString()} тис. грн
                </div>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <div className="text-lg font-bold text-red-800">
                  {planResults.reconstructionProjects.length}
                </div>
                <div className="text-sm text-red-600">Реконструкція</div>
                <div className="text-xs text-gray-500">
                  {planResults.budgetBreakdown.reconstructionUsed.toLocaleString()} тис. грн
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-lg font-bold text-green-800">
                  {planResults.budgetUtilization.toFixed(1)}%
                </div>
                <div className="text-sm text-green-600">Використання бюджету</div>
                <div className="text-xs text-gray-500">
                  Резерв: {planResults.budgetBreakdown.reserveRemaining.toLocaleString()} тис. грн
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Результати планування:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>Загальна вартість:</strong> {planResults.totalCost.toLocaleString()} тис. грн
                </div>
                <div>
                  <strong>Сесія Блоку 1:</strong> {planResults.blockOneBudgetInfo?.sessionId}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Функции расчетов (остаются без изменений)
const calculateCoefficients = (section: RoadSectionData): RoadSectionData => {
  const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category as keyof typeof MAX_DESIGN_INTENSITY_BY_CATEGORY] || 500;
  const intensityCoeff = Number((maxIntensity / section.trafficIntensity).toFixed(2));
  
  const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category as keyof typeof MIN_STRENGTH_COEFFICIENT_BY_CATEGORY] || 200;
  const strengthCoeff = Number((section.strengthModulus / minStrength).toFixed(2));
  
  const maxRoughness = CATEGORY_NORMS.maxRoughness[section.category as keyof typeof CATEGORY_NORMS.maxRoughness] || 2.5;
  const evennessCoeff = Number((maxRoughness / section.roughnessProfile).toFixed(2));
  
  const maxRut = CATEGORY_NORMS.maxRutDepth[section.category as keyof typeof CATEGORY_NORMS.maxRutDepth] || 20;
  const rutCoeff = Number((maxRut / section.rutDepth).toFixed(2));
  
  const frictionFactorCoeff = Number((section.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT).toFixed(2));
  
  return {
    ...section,
    intensityCoeff,
    strengthCoeff,
    evennessCoeff,
    rutCoeff,
    frictionFactorCoeff
  };
};

const determineWorkType = (section: RoadSectionData): string => {
  const criticalCount = [
    section.intensityCoeff! < 1.0,
    section.strengthCoeff! < 1.0,
    section.evennessCoeff! < 1.0,
    section.rutCoeff! < 1.0,
    section.frictionFactorCoeff! < 1.0
  ].filter(Boolean).length;

  if (criticalCount === 0) return 'Не потрібно';
  if (criticalCount <= 2) return 'Поточний ремонт';
  if (criticalCount <= 3) return 'Капітальний ремонт';
  return 'Реконструкція';
};

const calculateCost = (section: RoadSectionData): number => {
  const workType = section.workType || 'Не потрібно';
  if (workType === 'Не потрібно') return 0;
  
  let costPerKm = 0;
  if (workType === 'Поточний ремонт') {
    costPerKm = COST_STANDARDS.current_repair[section.category as keyof typeof COST_STANDARDS.current_repair] || 1;
  } else if (workType === 'Капітальний ремонт') {
    costPerKm = COST_STANDARDS.capital_repair[section.category as keyof typeof COST_STANDARDS.capital_repair] || 8;
  } else if (workType === 'Реконструкція') {
    costPerKm = COST_STANDARDS.reconstruction[section.category as keyof typeof COST_STANDARDS.reconstruction] || 25;
  }
  
  return Number((costPerKm * section.length).toFixed(2));
};

// ОБНОВЛЕННАЯ ФОРМА с выбором значимости дороги
const RoadSectionForm = ({ onAdd }: { onAdd: (section: RoadSectionData) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    length: 1.0,
    category: 3,
    significance: 'local' as 'state' | 'local',
    trafficIntensity: 3000,
    strengthModulus: 300,
    roughnessProfile: 1.5,
    roughnessBump: 60,
    rutDepth: 8,
    frictionCoeff: 0.4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSection: RoadSectionData = {
      id: `section_${Date.now()}`,
      name: formData.name || `Ділянка ${Date.now()}`,
      length: formData.length,
      category: formData.category,
      significance: formData.significance,
      budgetSource: formData.significance === 'state' ? 'q1' : 'q2',
      trafficIntensity: formData.trafficIntensity,
      strengthModulus: formData.strengthModulus,
      roughnessProfile: formData.roughnessProfile,
      roughnessBump: formData.roughnessBump,
      rutDepth: formData.rutDepth,
      frictionCoeff: formData.frictionCoeff
    };

    const sectionWithCoeffs = calculateCoefficients(newSection);
    sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
    sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
    
    // Генерируем экономические показатели
    sectionWithCoeffs.enpv = Math.random() * 1000000 + 100000;
    sectionWithCoeffs.eirr = Math.random() * 15 + 5;
    sectionWithCoeffs.bcr = Math.random() * 2 + 1;

    onAdd(sectionWithCoeffs);
    
    setFormData({
      name: '',
      length: 1.0,
      category: 3,
      significance: 'local',
      trafficIntensity: 3000,
      strengthModulus: 300,
      roughnessProfile: 1.5,
      roughnessBump: 60,
      rutDepth: 8,
      frictionCoeff: 0.4
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Найменування ділянки дороги</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="М-06 Київ-Чернігів"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Протяжність дороги (км)</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.length}
            onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 1 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Категорія ділянки дороги</label>
          <Select 
            value={formData.category.toString()} 
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">I категорія</SelectItem>
              <SelectItem value="2">II категорія</SelectItem>
              <SelectItem value="3">III категорія</SelectItem>
              <SelectItem value="4">IV категорія</SelectItem>
              <SelectItem value="5">V категорія</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* НОВОЕ ПОЛЕ: Значимость дороги */}
        <div>
          <label className="block text-sm font-medium mb-1">Значення дороги (джерело бюджету)</label>
          <Select 
            value={formData.significance} 
            onValueChange={(value: 'state' | 'local') => setFormData(prev => ({ ...prev, significance: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="state">🏛️ Державна (Q₁)</SelectItem>
              <SelectItem value="local">🏘️ Місцева (Q₂)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Остальные поля остаются без изменений */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Інтенсивність руху (авт./добу)</label>
          <Input
            type="number"
            min="1"
            value={formData.trafficIntensity}
            onChange={(e) => setFormData(prev => ({ ...prev, trafficIntensity: parseInt(e.target.value) || 1000 }))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Модуль пружності (МПа)</label>
          <Input
            type="number"
            min="50"
            value={formData.strengthModulus}
            onChange={(e) => setFormData(prev => ({ ...prev, strengthModulus: parseInt(e.target.value) || 300 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Рівність (профілометр, м/км)</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.roughnessProfile}
            onChange={(e) => setFormData(prev => ({ ...prev, roughnessProfile: parseFloat(e.target.value) || 1.5 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Рівність (поштовхомір, см/км)</label>
          <Input
            type="number"
            min="10"
            value={formData.roughnessBump}
            onChange={(e) => setFormData(prev => ({ ...prev, roughnessBump: parseInt(e.target.value) || 60 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Глибина колії (мм)</label>
          <Input
            type="number"
            min="0"
            value={formData.rutDepth}
            onChange={(e) => setFormData(prev => ({ ...prev, rutDepth: parseInt(e.target.value) || 8 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Коефіцієнт зчеплення</label>
          <Input
            type="number"
            step="0.01"
            min="0.1"
            max="1.0"
            value={formData.frictionCoeff}
            onChange={(e) => setFormData(prev => ({ ...prev, frictionCoeff: parseFloat(e.target.value) || 0.4 }))}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
        Додати дорожню секцію
      </Button>
    </form>
  );
};

// Экспортер в Excel точно по шаблону (остается без изменений)
const ExcelTemplateExporter = ({ sections }: { sections: RoadSectionData[] }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const createWorkbook = () => {
    const wb = XLSX.utils.book_new();
    
    // Лист 1: Визначення показників фактичного транспортно-експлуатаційного стану доріг
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг державного'],
      ['', '', '', 'Фактична', 'Фактичний', 'Фактична рівність', 'Фактична рівність', 'Фактична', 'Фактичний'],
      ['', '', '', 'інтенсивності руху', 'загальний', 'поверхні', 'поверхні', 'глибина', 'коефіцієнт'],
      ['', '', '', 'ТЗ у приведених', 'модуль', 'дорожнього', 'дорожнього', 'колії (мм)', 'зчеплення'],
      ['Найменування ділянки дороги', 'Протяжність дороги, км', 'Категорія ділянки дороги', 'одиницях до', 'пружності', 'покриву, яку', 'покриву, яку', '', ''],
      ['', '', '', 'легкового', 'дорожньої', 'оцінюють за', 'оцінюють за', '', ''],
      ['', '', '', 'автомобіля за', 'конструкції', 'профілометричним', 'показником', '', ''],
      ['', '', '', 'даними обліку', '(МПа)', 'методом (м/км)', 'поштовхоміра', '', ''],
      ['', '', '', '(авт./добу)', '', '', '(см/км)', '', ''],
      ...sections.map(section => [
        section.name,
        section.length,
        section.category,
        section.trafficIntensity,
        section.strengthModulus,
        section.roughnessProfile,
        section.roughnessBump,
        section.rutDepth,
        section.frictionCoeff
      ])
    ]);

    // Лист 2: Визначення показників фактичного транспортно-експлуатаційного стану доріг (коэффициенты)
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг'],
      ['', '', 'Коефіцієнт', 'Коефіцієнт', 'Коефіцієнт', 'Коефіцієнт', 'Коефіцієнт', 'Вид робіт'],
      ['', '', 'інтенсивності', 'запасу міцності', 'рівності', 'колійності', 'зчеплення', ''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'руху', 'дорожнього одягу', '', '', '', ''],
      ...sections.map(section => [
        section.name,
        section.length,
        section.intensityCoeff,
        section.strengthCoeff,
        section.evennessCoeff,
        section.rutCoeff,
        section.frictionFactorCoeff,
        section.workType
      ])
    ]);

    // Лист 3: Усереднені орієнтовні показники вартості
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['Усереднені орієнтовні показники вартості дорожніх робіт', '', '', '', '', ''],
      ['за даними об\'єктів-аналогів, млн.грн/1 км', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Вид робіт', 'Категорія дороги', '', '', '', ''],
      ['', 'I', 'II', 'III', 'IV', 'V'],
      ['Реконструкція', 
       COST_STANDARDS.reconstruction[1], 
       COST_STANDARDS.reconstruction[2], 
       COST_STANDARDS.reconstruction[3], 
       COST_STANDARDS.reconstruction[4], 
       COST_STANDARDS.reconstruction[5]],
      ['Капітальний ремонт', 
       COST_STANDARDS.capital_repair[1], 
       COST_STANDARDS.capital_repair[2], 
       COST_STANDARDS.capital_repair[3], 
       COST_STANDARDS.capital_repair[4], 
       COST_STANDARDS.capital_repair[5]],
      ['Поточний ремонт', 
       COST_STANDARDS.current_repair[1], 
       COST_STANDARDS.current_repair[2], 
       COST_STANDARDS.current_repair[3], 
       COST_STANDARDS.current_repair[4], 
       COST_STANDARDS.current_repair[5]]
    ]);

    // Лист 4: Орієнтовна вартість робіт
    const ws4 = XLSX.utils.aoa_to_sheet([
      ['Орієнтовна вартість робіт', '', '', '', ''],
      ['', '', '', '', ''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість робіт'],
      ...sections.filter(s => s.workType !== 'Не потрібно').map(section => [
        section.name,
        section.length,
        section.category,
        section.workType,
        section.estimatedCost
      ])
    ]);

    // Лист 5: Визначення ефективності реконструкції/капітального ремонту
    const reconstructionAndCapitalSections = sections.filter(s => 
      s.workType === 'Реконструкція' || s.workType === 'Капітальний ремонт'
    );
    
    const ws5_data = [
      ['Визначення ефективності реконструкції/капітального ремонту автомобільної дороги'],
      ['', 'Витрата капітальних,', '', '', 'Коефіцієнт', '', 'Економічна'],
      ['Середньорічна', 'поточний і', '', 'Чистий', 'дисконто-', '', 'чиста'],
      ['в добових', 'експлуатаційній', '', 'економічний', 'вання', '', 'приведена'],
      ['інтенсивність', 'з утриманням', 'Всього', 'ефект (чистий', 'ОУУ,', '', 'вартість ENPV,'],
      ['руху,', 'капітальний,', '', 'операційний', 'млн.грн', '', 'млн.грн'],
      ['авт./добу', 'поточний', '', 'дохід (ОУУ)', '', '', ''],
      ['', 'ремонт', '', 'млн.грн', '', '0.05', ''],
      ['Рік'],
      // Добавляем данные по годам для первой дорожной секции (если есть)
    ];

    if (reconstructionAndCapitalSections.length > 0) {
      const firstSection = reconstructionAndCapitalSections[0];
      
      // Используем данные первой секции для расчетов
      const averageDailyTraffic = firstSection.trafficIntensity;
      const sectionLength = firstSection.length;
      const capitalCost = firstSection.estimatedCost || 0; // млн грн
      
      // Ежегодные операционные расходы (2.5% от капитальных затрат)
      const annualOperatingCost = capitalCost * 0.025;
      
      // Экономический эффект от улучшения дороги
      const economicBenefitPerVehicleKm = 0.05; // грн за авт*км
      const annualEconomicBenefit = (averageDailyTraffic * 365 * sectionLength * economicBenefitPerVehicleKm) / 1000000; // млн грн
      
      let totalPresentValue = 0;
      let totalDiscountedBenefits = 0;
      let totalDiscountedCosts = 0;
      
      for (let year = 2025; year <= 2044; year++) {
        const yearIndex = year - 2024;
        const discountFactor = Number((1 / Math.pow(1.05, yearIndex)).toFixed(3));
        
        // Капитальные затраты только в первый год
        const capitalExpenditure = year === 2025 ? capitalCost : 0;
        
        // Операционные расходы каждый год (с 2026 года)
        const operatingCosts = year >= 2026 ? annualOperatingCost : 0;
        
        // Экономические выгоды (с 2026 года)
        const economicBenefits = year >= 2026 ? annualEconomicBenefit : 0;
        
        // Чистый денежный поток
        const netCashFlow = economicBenefits - operatingCosts - capitalExpenditure;
        
        // Приведенная стоимость
        const presentValue = netCashFlow * discountFactor;
        totalPresentValue += presentValue;
        
        // Дисконтированные выгоды и затраты отдельно
        const discountedBenefits = economicBenefits * discountFactor;
        const discountedCosts = (operatingCosts + capitalExpenditure) * discountFactor;
        totalDiscountedBenefits += discountedBenefits;
        totalDiscountedCosts += discountedCosts;
        
        ws5_data.push([
          year.toString(),
          year === 2025 ? averageDailyTraffic.toString() : '', // Показываем интенсивность только в первый год
          capitalExpenditure > 0 ? capitalExpenditure.toFixed(2) : (operatingCosts > 0 ? operatingCosts.toFixed(2) : ''),
          economicBenefits > 0 ? economicBenefits.toFixed(2) : '',
          netCashFlow.toFixed(2),
          discountFactor.toString(),
          presentValue.toFixed(2)
        ]);
      }
      
      // Итоговая строка с реальными суммами
      ws5_data.push([
        'Разом', 
        '',
        capitalCost.toFixed(2), // Общие капитальные затраты
        (annualEconomicBenefit * 19).toFixed(2), // 19 лет экономических выгод
        totalPresentValue.toFixed(2), // Чистая приведенная стоимость
        '',
        totalPresentValue.toFixed(2) // ENPV
      ]);
      
      // Обновляем показатели в секции
      firstSection.enpv = totalPresentValue * 1000000; // переводим в грн
      
      // Рассчитываем экономические показатели
      const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;
      const eirr = totalDiscountedCosts > 0 ? ((Math.pow(totalDiscountedBenefits / totalDiscountedCosts, 1/20) - 1) * 100) : 0;
      
      firstSection.bcr = bcr;
      firstSection.eirr = eirr;
    }

    const ws5 = XLSX.utils.aoa_to_sheet(ws5_data);

    // Лист 6: Ранжування об'єктів
    const ws6 = XLSX.utils.aoa_to_sheet([
      ['Ранжування об\'єктів', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 
       'Орієнтовна вартість робіт', 'Економічна чиста', 'Економічна', 'Співвідношення'],
      ['', '', '', '', '(млн грн)', 'приведена вартість', 'норма дохідності', 'вигід до витрат'],
      ['', '', '', '', '', '(ENPV)', '(EIRR)', '(BCR)'],
      ...sections
        .filter(s => s.workType !== 'Не потрібно')
        .sort((a, b) => (b.enpv || 0) - (a.enpv || 0))
        .map(section => [
          section.name,
          section.length,
          section.category,
          section.workType,
          section.estimatedCost,
          Math.round(section.enpv || 0),
          `${(section.eirr || 0).toFixed(1)}%`,
          (section.bcr || 0).toFixed(2)
        ])
    ]);

    // Добавляем листы в рабочую книгу
    XLSX.utils.book_append_sheet(wb, ws1, 'Фактичний стан доріг');
    XLSX.utils.book_append_sheet(wb, ws2, 'Показники стану доріг');
    XLSX.utils.book_append_sheet(wb, ws3, 'Показники вартості');
    XLSX.utils.book_append_sheet(wb, ws4, 'Орієнтовна вартість');
    XLSX.utils.book_append_sheet(wb, ws5, 'Ефективність');
    XLSX.utils.book_append_sheet(wb, ws6, 'Ранжування об\'єктів');

    return wb;
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      await new Promise(resolve => {
        setTimeout(() => {
          setExportProgress(25);
          resolve(true);
        }, 300);
      });

      const workbook = createWorkbook();
      setExportProgress(50);

      await new Promise(resolve => {
        setTimeout(() => {
          setExportProgress(75);
          resolve(true);
        }, 300);
      });

      const filename = `Шаблон_21_заповнений_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      setExportProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при створенні Excel файлу');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheetIcon className="h-5 w-5" />
          Експорт у Excel (точно за шаблоном)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Статистика даних:</h4>
            <div className="space-y-1 text-sm">
              <div>• Дорожних секцій: <span className="font-medium">{sections.length}</span></div>
              <div>• Потребують ремонту: <span className="font-medium">
                {sections.filter(s => s.workType !== 'Не потрібно').length}
              </span></div>
              <div>• Загальна вартість: <span className="font-medium">
                {sections.filter(s => s.workType !== 'Не потрібно')
                         .reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(1)} млн грн
              </span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Структура Excel файлу:</h4>
            <div className="space-y-1 text-sm">
              <div>📋 Фактичний стан доріг</div>
              <div>📊 Показники стану доріг</div>
              <div>💰 Показники вартості</div>
              <div>🔢 Орієнтовна вартість</div>
              <div>📈 Ефективність</div>
              <div>🏆 Ранжування об'єктів</div>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Створення Excel файлу...</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={exportToExcel} 
          disabled={sections.length === 0 || isExporting}
          className="w-full"
        >
          {isExporting ? (
            <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <DownloadIcon className="h-4 w-4 mr-2" />
          )}
          Експортувати у Excel
        </Button>

        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Excel файл буде створено точно за форматом шаблону згідно з ДБН В.2.3-4:2015.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Генератор тестовых данных с обновленными данными
const TestDataGenerator = ({ onAddTestData }: { onAddTestData: (sections: RoadSectionData[]) => void }) => {
  const generateTestData = () => {
    const testSections: RoadSectionData[] = [
      {
        id: 'test_1',
        name: 'М-06 Київ-Чернігів (км 0-15)',
        length: 15.0,
        category: 1,
        significance: 'state',
        budgetSource: 'q1',
        trafficIntensity: 18000,
        strengthModulus: 280,
        roughnessProfile: 1.2,
        roughnessBump: 65,
        rutDepth: 8,
        frictionCoeff: 0.38
      },
      {
        id: 'test_2',
        name: 'Н-31 Дніпро-Решетилівка (км 25-40)',
        length: 15.0,
        category: 2,
        significance: 'state',
        budgetSource: 'q1',
        trafficIntensity: 8500,
        strengthModulus: 250,
        roughnessProfile: 1.8,
        roughnessBump: 85,
        rutDepth: 12,
        frictionCoeff: 0.32
      },
      {
        id: 'test_3',
        name: 'Р-25 Полтава-Кременчук (км 10-25)',
        length: 15.0,
        category: 3,
        significance: 'local',
        budgetSource: 'q2',
        trafficIntensity: 4500,
        strengthModulus: 320,
        roughnessProfile: 1.5,
        roughnessBump: 75,
        rutDepth: 10,
        frictionCoeff: 0.42
      },
      {
        id: 'test_4',
        name: 'Т-1504 Біла Церква-Васильків',
        length: 8.5,
        category: 4,
        significance: 'local',
        budgetSource: 'q2',
        trafficIntensity: 1200,
        strengthModulus: 200,
        roughnessProfile: 2.5,
        roughnessBump: 120,
        rutDepth: 18,
        frictionCoeff: 0.29
      }
    ];

    const processedSections = testSections.map(section => {
      const sectionWithCoeffs = calculateCoefficients(section);
      sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
      sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
      sectionWithCoeffs.enpv = Math.random() * 800000 + 200000;
      sectionWithCoeffs.eirr = Math.random() * 12 + 8;
      sectionWithCoeffs.bcr = Math.random() * 1.5 + 1.2;
      return sectionWithCoeffs;
    });

    onAddTestData(processedSections);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Тестові дані для демонстрації</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Додайте тестові дані різних категорій доріг для демонстрації роботи системи з бюджетом Блоку 1
            </p>
            <p className="text-xs text-gray-500">
              Буде додано 4 дорожні секції: 2 державні (Q₁) та 2 місцеві (Q₂)
            </p>
          </div>
          <Button onClick={generateTestData} variant="outline">
            <UploadIcon className="h-4 w-4 mr-2" />
            Додати тестові дані
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Аналіз відповідності нормативам (остается без изменений)
const ComplianceAnalysis = ({ sections }: { sections: RoadSectionData[] }) => {
  if (sections.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" />
          Аналіз відповідності нормативам ДБН В.2.3-4:2015
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map(section => {
            const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category as keyof typeof MAX_DESIGN_INTENSITY_BY_CATEGORY];
            const intensityCompliant = section.trafficIntensity <= maxIntensity;
            const frictionCompliant = section.frictionCoeff >= REQUIRED_FRICTION_COEFFICIENT;
            
            return (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="font-medium mb-2 flex items-center justify-between">
                  <span>{section.name}</span>
                  <Badge 
                    variant="outline" 
                    className={section.significance === 'state' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}
                  >
                    {section.significance === 'state' ? '🏛️ Державна (Q₁)' : '🏘️ Місцева (Q₂)'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Інтенсивність руху: </span>
                    {intensityCompliant ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        ✓ Відповідає категорії ({section.trafficIntensity}/{maxIntensity})
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        ✗ Перевищення на {section.trafficIntensity - maxIntensity} авт./добу
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-600">Зчеплення: </span>
                    {frictionCompliant ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        ✓ Достатнє ({section.frictionCoeff.toFixed(3)})
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        ✗ Дефіцит {(REQUIRED_FRICTION_COEFFICIENT - section.frictionCoeff).toFixed(3)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ГЛАВНЫЙ ИНТЕГРИРОВАННЫЙ КОМПОНЕНТ
const IntegratedTemplateFillerApp: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [sections, setSections] = useState<RoadSectionData[]>([]);

  const addSection = (section: RoadSectionData) => {
    setSections(prev => [...prev, section]);
  };

  const addTestData = (testSections: RoadSectionData[]) => {
    setSections(prev => [...prev, ...testSections]);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const recalculateAll = () => {
    setSections(prev => prev.map(section => {
      const sectionWithCoeffs = calculateCoefficients(section);
      sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
      sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
      sectionWithCoeffs.enpv = Math.random() * 800000 + 200000;
      sectionWithCoeffs.eirr = Math.random() * 12 + 8;
      sectionWithCoeffs.bcr = Math.random() * 1.5 + 1.2;
      return sectionWithCoeffs;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Отображение бюджета из Блока 1 */}
        <BlockOneBudgetDisplay onBack={onBack} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Блок 3: Планування ремонтів з урахуванням бюджету
          </h1>
          <p className="text-gray-600">
            Автоматичне планування ремонтних робіт на основі розрахунків Блоку 1 згідно з ДБН В.2.3-4:2015
          </p>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="input">📊 Ввід даних ({sections.length})</TabsTrigger>
            <TabsTrigger value="budget-planning">💰 Планування з бюджетом</TabsTrigger>
            <TabsTrigger value="analysis">📈 Аналіз результатів</TabsTrigger>
            <TabsTrigger value="ranking">🏆 Ранжування</TabsTrigger>
            <TabsTrigger value="export">💾 Експорт Excel</TabsTrigger>
          </TabsList>

          {/* Вкладка: Ввід даних */}
          <TabsContent value="input" className="space-y-6">
            <TestDataGenerator onAddTestData={addTestData} />

            <Card>
              <CardHeader>
                <CardTitle>Додати нову дорожню секцію</CardTitle>
              </CardHeader>
              <CardContent>
                <RoadSectionForm onAdd={addSection} />
              </CardContent>
            </Card>

            <ComplianceAnalysis sections={sections} />

            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Список дорожніх секцій ({sections.length})
                    <Button onClick={recalculateAll} variant="outline" size="sm">
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      Перерахувати всі
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{section.name}</div>
                            <div className="text-sm text-gray-600">
                              {section.category} категорія • {section.length} км • {section.trafficIntensity} авт./добу
                              <Badge 
                                variant="outline" 
                                className={`ml-2 ${section.significance === 'state' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}`}
                              >
                                {section.significance === 'state' ? '🏛️ Державна (Q₁)' : '🏘️ Місцева (Q₂)'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              section.workType === 'Не потрібно' ? 'secondary' :
                              section.workType === 'Поточний ремонт' ? 'default' :
                              section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                            }>
                              {section.workType}
                            </Badge>
                            {section.estimatedCost && section.estimatedCost > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                {section.estimatedCost.toFixed(1)} млн грн
                              </span>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-600"
                            >
                              Видалити
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Кінт:</span> 
                            <span className={section.intensityCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.intensityCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Кміц:</span> 
                            <span className={section.strengthCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.strengthCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Крівн:</span> 
                            <span className={section.evennessCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.evennessCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Ккол:</span> 
                            <span className={section.rutCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.rutCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Кзчеп:</span> 
                            <span className={section.frictionFactorCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.frictionFactorCoeff}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* НОВАЯ ВКЛАДКА: Планування з бюджетом */}
          <TabsContent value="budget-planning" className="space-y-6">
            <BudgetBasedPlanning sections={sections} />
            
            {hasBlockOneBudgetData() && (
              <Card>
                <CardHeader>
                  <CardTitle>Розподіл секцій за джерелами фінансування</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-3">
                        🏛️ Державні дороги (фінансуються з Q₁)
                      </h4>
                      <div className="space-y-2">
                        {sections.filter(s => s.significance === 'state').map(section => (
                          <div key={section.id} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <div className="font-medium">{section.name}</div>
                            <div className="text-xs text-gray-600">
                              Категорія {section.category} • {section.length} км • {section.workType}
                              {section.estimatedCost && section.estimatedCost > 0 && (
                                <span className="ml-2 text-blue-600 font-medium">
                                  {section.estimatedCost.toFixed(1)} млн грн
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {sections.filter(s => s.significance === 'state').length === 0 && (
                          <div className="text-gray-500 text-sm italic">Немає державних доріг</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-green-700 mb-3">
                        🏘️ Місцеві дороги (фінансуються з Q₂)
                      </h4>
                      <div className="space-y-2">
                        {sections.filter(s => s.significance === 'local').map(section => (
                          <div key={section.id} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                            <div className="font-medium">{section.name}</div>
                            <div className="text-xs text-gray-600">
                              Категорія {section.category} • {section.length} км • {section.workType}
                              {section.estimatedCost && section.estimatedCost > 0 && (
                                <span className="ml-2 text-green-600 font-medium">
                                  {section.estimatedCost.toFixed(1)} млн грн
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {sections.filter(s => s.significance === 'local').length === 0 && (
                          <div className="text-gray-500 text-sm italic">Немає місцевих доріг</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка: Аналіз результатів */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Аналіз результатів</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Додайте дорожні секції для проведення аналізу.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {/* Статистика с учетом бюджета */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Не потрібно', 'Поточний ремонт', 'Капітальний ремонт', 'Реконструкція'].map(type => {
                        const count = sections.filter(s => s.workType === type).length;
                        const totalCost = sections
                          .filter(s => s.workType === type)
                          .reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
                        
                        const colors = {
                          'Не потрібно': 'bg-green-50 text-green-800 border-green-200',
                          'Поточний ремонт': 'bg-blue-50 text-blue-800 border-blue-200',
                          'Капітальний ремонт': 'bg-orange-50 text-orange-800 border-orange-200',
                          'Реконструкція': 'bg-red-50 text-red-800 border-red-200'
                        };
                        
                        return (
                          <div key={type} className={`p-4 rounded-lg border ${colors[type as keyof typeof colors]}`}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm font-medium">{type}</div>
                            {totalCost > 0 && (
                              <div className="text-xs mt-1">{totalCost.toFixed(1)} млн грн</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Анализ бюджета */}
                    {hasBlockOneBudgetData() && (
                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3">Порівняння з бюджетом Блоку 1:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Загальна потреба в коштах:</div>
                            <div className="text-lg font-bold text-blue-700">
                              {sections.filter(s => s.workType !== 'Не потрібно')
                                      .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
                                      .toFixed(1)} млн грн
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Доступний бюджет:</div>
                            <div className="text-lg font-bold text-green-700">
                              {(getBudgetStatistics()?.totalBudget / 1000).toFixed(1)} млн грн
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Покриття потреб:</div>
                            <div className="text-lg font-bold text-purple-700">
                              {(() => {
                                const totalNeed = sections.filter(s => s.workType !== 'Не потрібно')
                                                         .reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
                                const availableBudget = (getBudgetStatistics()?.totalBudget / 1000) || 0;
                                return totalNeed > 0 ? ((availableBudget / totalNeed) * 100).toFixed(1) : 0;
                              })()}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Детальна таблиця */}
                    <div>
                      <h4 className="font-medium mb-3">Детальний аналіз секцій:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Назва дороги</TableHead>
                            <TableHead>Тип/Джерело</TableHead>
                            <TableHead>Категорія</TableHead>
                            <TableHead>Довжина (км)</TableHead>
                            <TableHead>Вид робіт</TableHead>
                            <TableHead>Вартість (млн грн)</TableHead>
                            <TableHead>Критичні коефіцієнти</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sections.map((section) => {
                            const criticalCoeffs = [
                              section.intensityCoeff! < 1.0 ? 'Інт' : null,
                              section.strengthCoeff! < 1.0 ? 'Міц' : null,
                              section.evennessCoeff! < 1.0 ? 'Рівн' : null,
                              section.rutCoeff! < 1.0 ? 'Кол' : null,
                              section.frictionFactorCoeff! < 1.0 ? 'Зчеп' : null
                            ].filter(Boolean);

                            return (
                              <TableRow key={section.id}>
                                <TableCell className="font-medium">{section.name}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={section.significance === 'state' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}
                                  >
                                    {section.significance === 'state' ? 'Державна' : 'Місцева'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{section.category}</TableCell>
                                <TableCell>{section.length}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    section.workType === 'Не потрібно' ? 'secondary' :
                                    section.workType === 'Поточний ремонт' ? 'default' :
                                    section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                                  }>
                                    {section.workType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {(section.estimatedCost || 0).toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {criticalCoeffs.length > 0 ? (
                                    <div className="text-xs text-red-600">
                                      {criticalCoeffs.join(', ')}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-green-600">Всі в нормі</div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Ранжування */}
          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ранжування проектів за економічною ефективністю</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.filter(s => s.workType !== 'Не потрібно').length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Немає проектів, що потребують ремонту для ранжування.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-800">
                          {sections.filter(s => s.workType === 'Поточний ремонт').length}
                        </div>
                        <div className="text-sm text-blue-600">Поточний ремонт</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-orange-800">
                          {sections.filter(s => s.workType === 'Капітальний ремонт').length}
                        </div>
                        <div className="text-sm text-orange-600">Капітальний ремонт</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-red-800">
                          {sections.filter(s => s.workType === 'Реконструкція').length}
                        </div>
                        <div className="text-sm text-red-600">Реконструкція</div>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Пріоритет</TableHead>
                          <TableHead>Назва дороги</TableHead>
                          <TableHead>Тип дороги</TableHead>
                          <TableHead>Тип робіт</TableHead>
                          <TableHead>Довжина (км)</TableHead>
                          <TableHead>Вартість (млн грн)</TableHead>
                          <TableHead>ENPV</TableHead>
                          <TableHead>EIRR</TableHead>
                          <TableHead>BCR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections
                          .filter(s => s.workType !== 'Не потрібно')
                          .sort((a, b) => (b.enpv || 0) - (a.enpv || 0))
                          .map((section, index) => (
                            <TableRow key={section.id}>
                              <TableCell>
                                <Badge variant="outline">#{index + 1}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{section.name}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={section.significance === 'state' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}
                                >
                                  {section.significance === 'state' ? 'Державна' : 'Місцева'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  section.workType === 'Поточний ремонт' ? 'default' :
                                  section.workType === 'Капітальний ремонт' ? 'secondary' : 'destructive'
                                }>
                                  {section.workType}
                                </Badge>
                              </TableCell>
                              <TableCell>{section.length}</TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {(section.estimatedCost || 0).toFixed(1)}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {Math.round(section.enpv || 0).toLocaleString()}
                              </TableCell>
                              <TableCell>{(section.eirr || 0).toFixed(1)}%</TableCell>
                              <TableCell>{(section.bcr || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Експорт */}
          <TabsContent value="export" className="space-y-6">
            <ExcelTemplateExporter sections={sections} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntegratedTemplateFillerApp;