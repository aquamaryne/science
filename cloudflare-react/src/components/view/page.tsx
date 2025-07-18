
import React, { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, X, FileText, Download, AlertTriangle, Plus, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  getBlockOneBudgetData,
  getBudgetAllocation,
  checkCategoryComplianceByIntensity,
  getBudgetStatistics,
  type RoadSection,
  type BlockOneBudgetData,
  type BudgetAllocation,
  type ExpertAssessment
} from '@/modules/block_three';

import {
  executeComprehensiveAssessment,
  determineWorkTypeByExpertMethod,
  calculateDetailedWorkCost,
  performDetailedCostBenefitAnalysis,
  createTestRoadSection,
  createTestExpertAssessment,
  MAX_DESIGN_INTENSITY_BY_CATEGORY,
  MIN_STRENGTH_COEFFICIENT_BY_CATEGORY,
  type ComprehensiveRoadAssessment
} from '@/modules/block_three_alghoritm';

import { type RoadSectionUI } from './block_three_page';
interface RoadEfficiencyInterfaceProps {
  sections: RoadSectionUI[];
  onSectionsChange: Dispatch<SetStateAction<RoadSectionUI[]>>;
  onNext: () => void;
  onBack: () => void;
}


// Типы данных для полной таблицы эффективности
interface EfficiencyCalculationData {
  // Начальные данные
  workType: 'reconstruction' | 'capital_repair';
  roadCategory: 1 | 2 | 3 | 4 | 5;
  
  // Стоимость работ по годам (строки 2-4)
  reconstructionCost2025: number;
  reconstructionCost2026: number;
  reconstructionCost2027: number;
  reconstructionCost2028: number;
  
  // Срок реконструкции/капитального ремонта (строка 4)
  reconstructionPeriod: number;
  
  // Прирост интенсивности дорожного движения (строки 5-6)
  trafficIntensityGrowth: number;
  currentTrafficIntensity: number;
  
  // Длина дороги (строка 7)
  roadLength: number;
  
  // Состав движения (строка 8)
  lightVehiclesPercent: number;
  mediumVehiclesPercent: number;
  heavyVehiclesPercent: number;
  
  // Средние затраты на эксплуатацию (строки 11-12)
  maintenanceCostLight: number;
  maintenanceCostMedium: number;
  maintenanceCostHeavy: number;
  
  // Поточные капиталовложения (строки 13-14)
  currentInvestmentWithReconstruction: number;
  currentInvestmentWithoutReconstruction: number;
  
  // Средняя газонаполняемость автобуса (строка 15)
  averageBusCapacity: number;
  
  // Коэффициенты (строки 16-18)
  depreciationCoefficientBuses: number;
  depreciationCoefficientLightVehicles: number;
  depreciationCoefficientHeavyVehicles: number;
  
  // Оценка экономии (строки 19-31)
  economyEvaluationData: {
    maxDesignIntensity: number;
    resultingTrafficIntensity: number;
    reductionCoefficient: number;
    toxicReductionCoefficient: number;
    reductionAmount: number;
    expectedRoadCapacity: number;
    actualCapacityBefore: number;
    actualCapacityAfter: number;
  };
}

const RoadEfficiencyInterface: React.FC<RoadEfficiencyInterfaceProps> = ({
  sections,
  onSectionsChange,
  onNext,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('input');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  
  // Интеграция с существующими модулями
  const [budgetData, setBudgetData] = useState<BlockOneBudgetData | null>(null);
  const [_budgetAllocation, setBudgetAllocationState] = useState<BudgetAllocation | null>(null);

  // Загрузка данных при монтировании
  useEffect(() => {
    const existingBudgetData = getBlockOneBudgetData();
    if (existingBudgetData) {
      setBudgetData(existingBudgetData);
    }
    
    const existingBudgetAllocation = getBudgetAllocation();
    if (existingBudgetAllocation) {
      setBudgetAllocationState(existingBudgetAllocation);
    }
  }, []);
  
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyCalculationData>({
    workType: 'reconstruction',
    roadCategory: 3,
    reconstructionCost2025: 0,
    reconstructionCost2026: 0,
    reconstructionCost2027: 0,
    reconstructionCost2028: 0,
    reconstructionPeriod: 4,
    trafficIntensityGrowth: 3,
    currentTrafficIntensity: 10000,
    roadLength: 10,
    lightVehiclesPercent: 70,
    mediumVehiclesPercent: 20,
    heavyVehiclesPercent: 10,
    maintenanceCostLight: 2.5,
    maintenanceCostMedium: 4.8,
    maintenanceCostHeavy: 8.2,
    currentInvestmentWithReconstruction: 15000,
    currentInvestmentWithoutReconstruction: 25000,
    averageBusCapacity: 35,
    depreciationCoefficientBuses: 0.15,
    depreciationCoefficientLightVehicles: 0.12,
    depreciationCoefficientHeavyVehicles: 0.18,
    economyEvaluationData: {
      maxDesignIntensity: 12000,
      resultingTrafficIntensity: 15000,
      reductionCoefficient: 1.0,
      toxicReductionCoefficient: 0.17,
      reductionAmount: 2000,
      expectedRoadCapacity: 18000,
      actualCapacityBefore: 10000,
      actualCapacityAfter: 15000
    }
  });

  // Обновление данных эффективности
  const updateEfficiencyData = useCallback((field: keyof EfficiencyCalculationData, value: any) => {
    setEfficiencyData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Обновление данных экономии
  const updateEconomyData = useCallback((field: keyof EfficiencyCalculationData['economyEvaluationData'], value: number) => {
    setEfficiencyData(prev => ({
      ...prev,
      economyEvaluationData: {
        ...prev.economyEvaluationData,
        [field]: value
      }
    }));
  }, []);

  // Функция для обработки кнопки "Далее"
  const handleNext = useCallback(() => {
    // Сохраняем данные эффективности в sections если необходимо
    const updatedSections = sections.map(section => ({
      ...section,
      efficiencyData: efficiencyData,
      efficiencyResults: results
    }));
    
    onSectionsChange(updatedSections);
    onNext();
  }, [sections, onSectionsChange, onNext, efficiencyData, results]);

  // Функция для обработки кнопки "Назад"
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  // Расчет эффективности с использованием реальных модулей
  const calculateEfficiency = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Создаем секцию дороги на основе данных эффективности
      const roadSection: RoadSection = createTestRoadSection(
        'efficiency_calc',
        `Расчет эффективности - категория ${efficiencyData.roadCategory}`,
        efficiencyData.roadCategory,
        efficiencyData.roadLength,
        efficiencyData.currentTrafficIntensity,
        'state',
        'Расчетная'
      );

      // Проверяем соответствие категории по интенсивности
      const categoryCompliance = checkCategoryComplianceByIntensity(roadSection);

      // Выполняем комплексную оценку
      const assessment: ComprehensiveRoadAssessment = executeComprehensiveAssessment(roadSection, true);
      
      // Определяем тип работ экспертным методом
      const expertAssessment: ExpertAssessment = createTestExpertAssessment(
        75, // коэффициент прочности (operationalStateIndex)
        efficiencyData.currentTrafficIntensity, // интенсивность движения
        'Требуется плановое обслуживание'
      );
      
      const workType = determineWorkTypeByExpertMethod(expertAssessment);
      
      // Расчет детальной стоимости с использованием реального модуля
      const detailedCost = calculateDetailedWorkCost(
        roadSection, 
        efficiencyData.workType
      );

      // Анализ затрат и выгод
      const costBenefitAnalysis = performDetailedCostBenefitAnalysis(
        roadSection,
        detailedCost
      );

      // Получаем статистику бюджета если доступны данные
      let budgetStats = null;
      if (budgetData) {
        budgetStats = getBudgetStatistics();
      }

      // Расчет показателей эффективности
      const totalReconstructionCost = 
        efficiencyData.reconstructionCost2025 +
        efficiencyData.reconstructionCost2026 +
        efficiencyData.reconstructionCost2027 +
        efficiencyData.reconstructionCost2028;

      // Расчет экономии от снижения эксплуатационных затрат
      const annualTrafficVolume = efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength;
      const lightVehicleVolume = annualTrafficVolume * (efficiencyData.lightVehiclesPercent / 100);
      const mediumVehicleVolume = annualTrafficVolume * (efficiencyData.mediumVehiclesPercent / 100);
      const heavyVehicleVolume = annualTrafficVolume * (efficiencyData.heavyVehiclesPercent / 100);

      // Используем базовые расходы из модуля
      const maintenanceReduction = 0.15; // 15% экономия после реконструкции
      const annualMaintenanceSavings = 
        lightVehicleVolume * efficiencyData.maintenanceCostLight * maintenanceReduction +
        mediumVehicleVolume * efficiencyData.maintenanceCostMedium * maintenanceReduction +
        heavyVehicleVolume * efficiencyData.maintenanceCostHeavy * maintenanceReduction;

      // Расчет экономии от снижения капиталовложений
      const capitalSavings = 
        efficiencyData.currentInvestmentWithoutReconstruction - 
        efficiencyData.currentInvestmentWithReconstruction;

      // Расчет приведенных затрат и выгод с учетом результатов модуля
      const discountRate = 0.05;
      const analysisYears = 20;
      let totalDiscountedBenefits = 0;
      let totalDiscountedCosts = totalReconstructionCost;

      for (let year = 1; year <= analysisYears; year++) {
        const discountFactor = Math.pow(1 + discountRate, -year);
        
        // Учитываем рост интенсивности движения
        const trafficGrowthFactor = Math.pow(1 + efficiencyData.trafficIntensityGrowth / 100, year);
        const adjustedSavings = (annualMaintenanceSavings * trafficGrowthFactor) + (capitalSavings / analysisYears);
        
        totalDiscountedBenefits += adjustedSavings * discountFactor;
      }

      const npv = totalDiscountedBenefits - totalDiscountedCosts;
      const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;

      // Расчет срока окупаемости
      const annualNetBenefit = annualMaintenanceSavings + (capitalSavings / analysisYears);
      const paybackPeriod = annualNetBenefit > 0 ? totalDiscountedCosts / annualNetBenefit : Infinity;

      // Проверка соответствия минимальным требованиям по категории
      const minStrengthRequired = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[efficiencyData.roadCategory] || 0.6;
      const maxIntensityAllowed = MAX_DESIGN_INTENSITY_BY_CATEGORY[efficiencyData.roadCategory] || 10000;

      const calculationResults = {
        assessment,
        costBenefitAnalysis,
        categoryCompliance,
        workType,
        detailedCost,
        budgetStats,
        totalReconstructionCost,
        annualMaintenanceSavings,
        capitalSavings,
        totalDiscountedBenefits,
        totalDiscountedCosts,
        npv,
        bcr,
        paybackPeriod,
        technicalCompliance: {
          strengthRequirement: minStrengthRequired,
          intensityLimit: maxIntensityAllowed,
          currentIntensity: efficiencyData.currentTrafficIntensity,
          meetsRequirements: efficiencyData.currentTrafficIntensity <= maxIntensityAllowed
        },
        economicEfficiency: {
          isEconomicallyFeasible: npv > 0 && bcr > 1.0,
          recommendation: npv > 0 && bcr > 1.0 ? 
            'Проект экономически целесообразен' : 
            'Проект требует дополнительного обоснования',
          riskLevel: npv < 0 ? 'high' : bcr < 1.2 ? 'medium' : 'low'
        }
      };

      setResults(calculationResults);
      setActiveTab('results');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка расчета эффективности');
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [efficiencyData, budgetData]);

  // Генерация отчета с интеграцией модулей
  const generateEfficiencyReport = useCallback(() => {
    if (!results) return;

    // Создаем детализированный отчет с использованием реальных модулей
    // const roadSection: RoadSection = createTestRoadSection(
    //   'efficiency_calc',
    //   `Расчет эффективности - категория ${efficiencyData.roadCategory}`,
    //   efficiencyData.roadCategory,
    //   efficiencyData.roadLength,
    //   efficiencyData.currentTrafficIntensity,
    //   'state',
    //   'Расчетная'
    // );

    // Генерируем детализированный отчет по секции

    const report = `
# ОТЧЕТ ОБ ЭФФЕКТИВНОСТИ ${efficiencyData.workType === 'reconstruction' ? 'РЕКОНСТРУКЦИИ' : 'КАПИТАЛЬНОГО РЕМОНТА'}

## ИСХОДНЫЕ ДАННЫЕ
- Категория дороги: ${efficiencyData.roadCategory}
- Длина участка: ${efficiencyData.roadLength} км
- Текущая интенсивность движения: ${efficiencyData.currentTrafficIntensity} авт./сут.
- Прирост интенсивности: ${efficiencyData.trafficIntensityGrowth}% в год
- Максимально допустимая интенсивность для категории: ${results.technicalCompliance?.intensityLimit || 'не определено'} авт./сут.

## ТЕХНИЧЕСКОЕ СООТВЕТСТВИЕ
- Соответствие категории по интенсивности: ${results.technicalCompliance?.meetsRequirements ? 'СООТВЕТСТВУЕТ' : 'НЕ СООТВЕТСТВУЕТ'}
- Минимальный коэффициент прочности: ${results.technicalCompliance?.strengthRequirement || 'не определено'}
- Рекомендуемый тип работ: ${results.workType || efficiencyData.workType}

## СТОИМОСТЬ РАБОТ
- 2025 год: ${efficiencyData.reconstructionCost2025.toLocaleString()} тыс. грн
- 2026 год: ${efficiencyData.reconstructionCost2026.toLocaleString()} тыс. грн
- 2027 год: ${efficiencyData.reconstructionCost2027.toLocaleString()} тыс. грн
- 2028 год: ${efficiencyData.reconstructionCost2028.toLocaleString()} тыс. грн
- ОБЩАЯ СТОИМОСТЬ: ${results.totalReconstructionCost.toLocaleString()} тыс. грн

## СОСТАВ ДВИЖЕНИЯ
- Легковые автомобили: ${efficiencyData.lightVehiclesPercent}%
- Грузовые автомобили (легкие): ${efficiencyData.mediumVehiclesPercent}%
- Автобусы (тяжелые): ${efficiencyData.heavyVehiclesPercent}%

## ЭКОНОМИЧЕСКАЯ ЭФФЕКТИВНОСТЬ
- Чистая приведенная стоимость (NPV): ${results.npv.toLocaleString()} тыс. грн
- Соотношение выгод и затрат (BCR): ${results.bcr.toFixed(2)}
- Срок окупаемости: ${results.paybackPeriod !== Infinity ? results.paybackPeriod.toFixed(1) + ' лет' : 'не окупается'}
- Годовая экономия на эксплуатационных затратах: ${results.annualMaintenanceSavings.toLocaleString()} тыс. грн
- Экономия капиталовложений: ${results.capitalSavings.toLocaleString()} тыс. грн
- Уровень риска: ${results.economicEfficiency.riskLevel === 'low' ? 'Низкий' : results.economicEfficiency.riskLevel === 'medium' ? 'Средний' : 'Высокий'}

## ТЕХНИЧЕСКАЯ ОЦЕНКА
${results.assessment ? 
  `- Общее состояние: ${results.assessment.overallCondition}
- Состояние покрытия: ${results.assessment.technicalCondition?.pavement || 'не оценено'}
- Состояние дренажа: ${results.assessment.technicalCondition?.drainage || 'не оценено'}
- Геометрические параметры: ${results.assessment.technicalCondition?.geometry || 'не оценено'}` : 
  '- Техническая оценка не проводилась'}

## ДЕТАЛИЗИРОВАННАЯ СТОИМОСТЬ
${results.detailedCost ? 
  `- Общая стоимость по расчету модуля: ${results.detailedCost.totalCost?.toLocaleString() || 'не рассчитано'} тыс. грн
- Материалы: ${results.detailedCost.breakdown?.materials?.toLocaleString() || 'не указано'} тыс. грн  
- Работы: ${results.detailedCost.breakdown?.labor?.toLocaleString() || 'не указано'} тыс. грн
- Оборудование: ${results.detailedCost.breakdown?.equipment?.toLocaleString() || 'не указано'} тыс. грн` :
  '- Детализированная стоимость не рассчитана'}

## АНАЛИЗ ЗАТРАТ И ВЫГОД (МОДУЛЬ)
${results.costBenefitAnalysis ?
  `- NPV по модулю: ${results.costBenefitAnalysis.netPresentValue?.toLocaleString() || 'не рассчитано'} тыс. грн
- BCR по модулю: ${results.costBenefitAnalysis.benefitCostRatio?.toFixed(2) || 'не рассчитано'}
- Общие выгоды: ${results.costBenefitAnalysis.totalBenefits?.toLocaleString() || 'не рассчитано'} тыс. грн
- Общие затраты: ${results.costBenefitAnalysis.totalCosts?.toLocaleString() || 'не рассчитано'} тыс. грн` :
  '- Анализ затрат и выгод модулем не проводился'}

## БЮДЖЕТНАЯ СТАТИСТИКА
${results.budgetStats ?
  `- Доступно в бюджете: ${results.budgetStats.totalAvailable?.toLocaleString() || 'не указано'} тыс. грн
- Уже распределено: ${results.budgetStats.totalAllocated?.toLocaleString() || 'не указано'} тыс. грн
- Остаток средств: ${results.budgetStats.remainingFunds?.toLocaleString() || 'не указано'} тыс. грн` :
  '- Бюджетные данные недоступны'}

## ЗАКЛЮЧЕНИЕ
${results.economicEfficiency.recommendation}

${results.categoryCompliance ? 
  `\n## СООТВЕТСТВИЕ КАТЕГОРИИ
${results.categoryCompliance.complies ? 'Проект соответствует требованиям категории дороги' : 'ВНИМАНИЕ: Проект не соответствует требованиям категории дороги'}
Рекомендации: ${results.categoryCompliance.recommendations?.join('; ') || 'Нет специальных рекомендаций'}` : ''}

---
Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}
Использованы модули: block_three, block_three_algorithm
    `;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `efficiency_report_${efficiencyData.workType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results, efficiencyData]);

  // Функция для заполнения тестовыми данными
  const fillTestData = useCallback(() => {
    setEfficiencyData({
      workType: 'reconstruction',
      roadCategory: 2,
      reconstructionCost2025: 25000,
      reconstructionCost2026: 35000,
      reconstructionCost2027: 40000,
      reconstructionCost2028: 30000,
      reconstructionPeriod: 4,
      trafficIntensityGrowth: 3,
      currentTrafficIntensity: 8500,
      roadLength: 15.5,
      lightVehiclesPercent: 65,
      mediumVehiclesPercent: 25,
      heavyVehiclesPercent: 10,
      maintenanceCostLight: 2.8,
      maintenanceCostMedium: 5.2,
      maintenanceCostHeavy: 9.1,
      currentInvestmentWithReconstruction: 18000,
      currentInvestmentWithoutReconstruction: 28000,
      averageBusCapacity: 42,
      depreciationCoefficientBuses: 0.15,
      depreciationCoefficientLightVehicles: 0.12,
      depreciationCoefficientHeavyVehicles: 0.18,
      economyEvaluationData: {
        maxDesignIntensity: 12000,
        resultingTrafficIntensity: 15000,
        reductionCoefficient: 1.0,
        toxicReductionCoefficient: 0.17,
        reductionAmount: 2500,
        expectedRoadCapacity: 18000,
        actualCapacityBefore: 8500,
        actualCapacityAfter: 15000
      }
    });
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Визначення ефективності реконструкції/капітального ремонту автомобільних доріг
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fillTestData} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Тестові дані
          </Button>
          {results && (
            <Button onClick={generateEfficiencyReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Звіт
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Вхідні дані</TabsTrigger>
          <TabsTrigger value="calculation">Розрахунок</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Результати
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Начальные данные */}
            <Card>
              <CardHeader>
                <CardTitle>Початкові дані</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Вид робіт</Label>
                    <Select 
                      value={efficiencyData.workType} 
                      onValueChange={(value: 'reconstruction' | 'capital_repair') => updateEfficiencyData('workType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reconstruction">Реконструкція</SelectItem>
                        <SelectItem value="capital_repair">Капітальний ремонт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Категорія дороги</Label>
                    <Select 
                      value={efficiencyData.roadCategory.toString()} 
                      onValueChange={(value) => updateEfficiencyData('roadCategory', parseInt(value) as 1|2|3|4|5)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 категорія</SelectItem>
                        <SelectItem value="2">2 категорія</SelectItem>
                        <SelectItem value="3">3 категорія</SelectItem>
                        <SelectItem value="4">4 категорія</SelectItem>
                        <SelectItem value="5">5 категорія</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Довжина дороги (км)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.roadLength}
                    onChange={(e) => updateEfficiencyData('roadLength', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Поточна інтенсивність дорожнього руху (авт./доба)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.currentTrafficIntensity}
                    onChange={(e) => updateEfficiencyData('currentTrafficIntensity', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Приріст інтенсивності дорожнього руху (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.trafficIntensityGrowth}
                    onChange={(e) => updateEfficiencyData('trafficIntensityGrowth', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Термін реконструкції/капітального ремонту (роки)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionPeriod}
                    onChange={(e) => updateEfficiencyData('reconstructionPeriod', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Стоимость работ */}
            <Card>
              <CardHeader>
                <CardTitle>Вартість робіт по роках (тис. грн)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2025</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2025}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2025', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2026</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2026}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2026', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2027</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2027}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2027', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2028</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2028}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2028', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Загальна вартість:</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {(efficiencyData.reconstructionCost2025 + 
                        efficiencyData.reconstructionCost2026 + 
                        efficiencyData.reconstructionCost2027 + 
                        efficiencyData.reconstructionCost2028).toLocaleString()} тис. грн
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Состав движения */}
            <Card>
              <CardHeader>
                <CardTitle>Склад руху (%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Легкові автомобілі</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={efficiencyData.lightVehiclesPercent}
                    onChange={(e) => updateEfficiencyData('lightVehiclesPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вантажні автомобілі (легкі)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={efficiencyData.mediumVehiclesPercent}
                    onChange={(e) => updateEfficiencyData('mediumVehiclesPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Автобуси (тяжкі)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={efficiencyData.heavyVehiclesPercent}
                    onChange={(e) => updateEfficiencyData('heavyVehiclesPercent', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Загалом:</span>
                    <Badge variant={
                      (efficiencyData.lightVehiclesPercent + 
                       efficiencyData.mediumVehiclesPercent + 
                       efficiencyData.heavyVehiclesPercent) === 100 ? 'default' : 'destructive'
                    }>
                      {(efficiencyData.lightVehiclesPercent + 
                        efficiencyData.mediumVehiclesPercent + 
                        efficiencyData.heavyVehiclesPercent)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Средние затраты на эксплуатацию */}
            <Card>
              <CardHeader>
                <CardTitle>Середні витрати на експлуатацію транспортних засобів (грн)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Легкові автомобілі</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.maintenanceCostLight}
                    onChange={(e) => updateEfficiencyData('maintenanceCostLight', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вантажні автомобілі (легкі)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.maintenanceCostMedium}
                    onChange={(e) => updateEfficiencyData('maintenanceCostMedium', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Автобуси (тяжкі)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.maintenanceCostHeavy}
                    onChange={(e) => updateEfficiencyData('maintenanceCostHeavy', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Середня газоємність автобуса</Label>
                  <Input
                    type="number"
                    value={efficiencyData.averageBusCapacity}
                    onChange={(e) => updateEfficiencyData('averageBusCapacity', parseInt(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Коэффициенты */}
            <Card>
              <CardHeader>
                <CardTitle>Коефіцієнти амортизації</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Коефіцієнт амортизації по експлуатаційності автобусів</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={efficiencyData.depreciationCoefficientBuses}
                    onChange={(e) => updateEfficiencyData('depreciationCoefficientBuses', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Коефіцієнт амортизації легкових автомобілів</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={efficiencyData.depreciationCoefficientLightVehicles}
                    onChange={(e) => updateEfficiencyData('depreciationCoefficientLightVehicles', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Коефіцієнт амортизації важких автомобілів</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={efficiencyData.depreciationCoefficientHeavyVehicles}
                    onChange={(e) => updateEfficiencyData('depreciationCoefficientHeavyVehicles', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Поточні капиталовкладення */}
            <Card>
              <CardHeader>
                <CardTitle>Поточні капіталовкладення (тис. грн)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Поточні капіталовкладення в гарантії будівництва з розрахунком на 1 автомобіль з приводом одного рантового автомобіля</Label>
                  <Input
                    type="number"
                    value={efficiencyData.currentInvestmentWithReconstruction}
                    onChange={(e) => updateEfficiencyData('currentInvestmentWithReconstruction', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Поточні капіталовкладення в гарантії будівництва з розрахунком на 1 автобус з приводом одного рантового автобуса</Label>
                  <Input
                    type="number"
                    value={efficiencyData.currentInvestmentWithoutReconstruction}
                    onChange={(e) => updateEfficiencyData('currentInvestmentWithoutReconstruction', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Економія капіталовкладень:</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {(efficiencyData.currentInvestmentWithoutReconstruction - 
                        efficiencyData.currentInvestmentWithReconstruction).toLocaleString()} тис. грн
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Оцінка економії</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Максимальна розрахункова інтенсивність</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.maxDesignIntensity}
                    onChange={(e) => updateEconomyData('maxDesignIntensity', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Результуюча інтенсивність транспортного потоку</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.resultingTrafficIntensity}
                    onChange={(e) => updateEconomyData('resultingTrafficIntensity', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Коефіцієнт зниження</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={efficiencyData.economyEvaluationData.reductionCoefficient}
                    onChange={(e) => updateEconomyData('reductionCoefficient', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Коефіцієнт зниження токсичності</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={efficiencyData.economyEvaluationData.toxicReductionCoefficient}
                    onChange={(e) => updateEconomyData('toxicReductionCoefficient', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Величина зниження</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.reductionAmount}
                    onChange={(e) => updateEconomyData('reductionAmount', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Очікувана пропускна спроможність дороги</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.expectedRoadCapacity}
                    onChange={(e) => updateEconomyData('expectedRoadCapacity', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Фактична пропускна спроможність (до)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.actualCapacityBefore}
                    onChange={(e) => updateEconomyData('actualCapacityBefore', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Фактична пропускна спроможність (після)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.economyEvaluationData.actualCapacityAfter}
                    onChange={(e) => updateEconomyData('actualCapacityAfter', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Розрахунок ефективності</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Предварительные расчеты */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(efficiencyData.reconstructionCost2025 + 
                        efficiencyData.reconstructionCost2026 + 
                        efficiencyData.reconstructionCost2027 + 
                        efficiencyData.reconstructionCost2028).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-800">Загальна вартість (тис. грн)</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-800">Річний транспортний потік</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {(efficiencyData.currentInvestmentWithoutReconstruction - 
                        efficiencyData.currentInvestmentWithReconstruction).toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-800">Економія капіталовкладень (тис. грн)</div>
                  </div>
                </div>

                {/* Детальний розрахунок економії */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Деталізовані розрахунки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Легкові автомобілі</div>
                          <div className="text-lg font-semibold">
                            {((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                              (efficiencyData.lightVehiclesPercent / 100)).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">авт./рік</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">Вантажні автомобілі</div>
                          <div className="text-lg font-semibold">
                            {((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                              (efficiencyData.mediumVehiclesPercent / 100)).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">авт./рік</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">Автобуси</div>
                          <div className="text-lg font-semibold">
                            {((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                              (efficiencyData.heavyVehiclesPercent / 100)).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">авт./рік</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="text-sm text-gray-600">Розрахункова річна економія на експлуатаційних витратах:</div>
                        <div className="text-xl font-bold text-green-600">
                          {(
                            ((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                             (efficiencyData.lightVehiclesPercent / 100) * efficiencyData.maintenanceCostLight * 0.15) +
                            ((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                             (efficiencyData.mediumVehiclesPercent / 100) * efficiencyData.maintenanceCostMedium * 0.15) +
                            ((efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength) * 
                             (efficiencyData.heavyVehiclesPercent / 100) * efficiencyData.maintenanceCostHeavy * 0.15)
                          ).toLocaleString()} тис. грн
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Кнопка расчета */}
                <div className="flex justify-center">
                  <Button 
                    onClick={calculateEfficiency} 
                    disabled={isCalculating}
                    size="lg"
                    className="px-8"
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    {isCalculating ? 'Розрахунок...' : 'Виконати розрахунок ефективності'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              {/* Основные результаты */}
              <Card>
                <CardHeader>
                  <CardTitle>Результати розрахунку ефективності</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.npv.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">NPV (тис. грн)</div>
                      <div className="text-xs text-gray-500">Чиста приведена вартість</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.bcr > 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.bcr.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">BCR</div>
                      <div className="text-xs text-gray-500">Співвідношення вигод і витрат</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.paybackPeriod !== Infinity ? results.paybackPeriod.toFixed(1) : '∞'}
                      </div>
                      <div className="text-sm text-gray-600">Років</div>
                      <div className="text-xs text-gray-500">Термін окупності</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.annualMaintenanceSavings.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Тис. грн/рік</div>
                      <div className="text-xs text-gray-500">Річна економія</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Технічна відповідність */}
              {results.technicalCompliance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Технічна відповідність</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg ${results.technicalCompliance.meetsRequirements ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${results.technicalCompliance.meetsRequirements ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-semibold">Відповідність категорії</span>
                        </div>
                        <div className="mt-2 text-sm">
                          Поточна інтенсивність: {results.technicalCompliance.currentIntensity.toLocaleString()} авт./доба<br/>
                          Максимально допустима: {results.technicalCompliance.intensityLimit.toLocaleString()} авт./доба
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-semibold">Технічні вимоги</span>
                        </div>
                        <div className="mt-2 text-sm">
                          Мін. коефіцієнт міцності: {results.technicalCompliance.strengthRequirement}<br/>
                          Рекомендований тип робіт: {results.workType || efficiencyData.workType}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Детальний аналіз */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Структура витрат</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Загальна вартість проекту:</span>
                        <span className="font-semibold">{results.totalReconstructionCost.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>2025 рік:</span>
                        <span>{efficiencyData.reconstructionCost2025.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>2026 рік:</span>
                        <span>{efficiencyData.reconstructionCost2026.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>2027 рік:</span>
                        <span>{efficiencyData.reconstructionCost2027.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>2028 рік:</span>
                        <span>{efficiencyData.reconstructionCost2028.toLocaleString()} тис. грн</span>
                      </div>
                      {results.detailedCost && (
                        <>
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium text-gray-600 mb-2">Детальна калькуляція (модуль):</div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Матеріали:</span>
                              <span>{results.detailedCost.breakdown?.materials?.toLocaleString() || 'н/д'} тис. грн</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Роботи:</span>
                              <span>{results.detailedCost.breakdown?.labor?.toLocaleString() || 'н/д'} тис. грн</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Обладнання:</span>
                              <span>{results.detailedCost.breakdown?.equipment?.toLocaleString() || 'н/д'} тис. грн</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Структура вигод</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Загальні дисконтовані вигоди:</span>
                        <span className="font-semibold">{results.totalDiscountedBenefits.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Річна економія на експлуатації:</span>
                        <span>{results.annualMaintenanceSavings.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Економія капіталовкладень:</span>
                        <span>{results.capitalSavings.toLocaleString()} тис. грн</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Економія капіталовкладень на рік:</span>
                        <span>{(results.capitalSavings / 20).toLocaleString()} тис. грн</span>
                      </div>
                      {results.costBenefitAnalysis && (
                        <>
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium text-gray-600 mb-2">Аналіз модуля:</div>
                            <div className="flex justify-between items-center text-sm">
                              <span>NPV (модуль):</span>
                              <span>{results.costBenefitAnalysis.netPresentValue?.toLocaleString() || 'н/д'} тис. грн</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>BCR (модуль):</span>
                              <span>{results.costBenefitAnalysis.benefitCostRatio?.toFixed(2) || 'н/д'}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Технічна оцінка */}
              {results.assessment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Технічна оцінка (модуль оцінювання)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {results.assessment.overallCondition || 'Не оцінено'}
                        </div>
                        <div className="text-sm text-gray-600">Загальний стан</div>
                      </div>
                      
                      {results.assessment.technicalCondition && (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {results.assessment.technicalCondition.pavement || 'Не оцінено'}
                            </div>
                            <div className="text-sm text-gray-600">Покриття</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">
                              {results.assessment.technicalCondition.drainage || 'Не оцінено'}
                            </div>
                            <div className="text-sm text-gray-600">Дренаж</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {results.assessment.technicalCondition.geometry || 'Не оцінено'}
                            </div>
                            <div className="text-sm text-gray-600">Геометрія</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {results.assessment.recommendations && results.assessment.recommendations.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800 mb-2">Рекомендації:</div>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {results.assessment.recommendations.map((rec: number, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Бюджетна статистика */}
              {results.budgetStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Бюджетна статистика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {results.budgetStats.totalAvailable?.toLocaleString() || 'н/д'}
                        </div>
                        <div className="text-sm text-gray-600">Доступно в бюджеті (тис. грн)</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {results.budgetStats.totalAllocated?.toLocaleString() || 'н/д'}
                        </div>
                        <div className="text-sm text-gray-600">Уже розподілено (тис. грн)</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {results.budgetStats.remainingFunds?.toLocaleString() || 'н/д'}
                        </div>
                        <div className="text-sm text-gray-600">Залишок коштів (тис. грн)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Рівень ризику */}
              <Card>
                <CardHeader>
                  <CardTitle>Оцінка ризиків проекту</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        results.economicEfficiency.riskLevel === 'low' ? 'bg-green-500' :
                        results.economicEfficiency.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-semibold">
                        Рівень ризику: {
                          results.economicEfficiency.riskLevel === 'low' ? 'Низький' :
                          results.economicEfficiency.riskLevel === 'medium' ? 'Середній' : 'Високий'
                        }
                      </span>
                    </div>
                    <Badge variant={
                      results.economicEfficiency.riskLevel === 'low' ? 'default' :
                      results.economicEfficiency.riskLevel === 'medium' ? 'secondary' : 'destructive'
                    }>
                      {results.economicEfficiency.riskLevel === 'low' ? 'Рекомендовано' :
                       results.economicEfficiency.riskLevel === 'medium' ? 'Потребує уваги' : 'Не рекомендовано'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Кнопки действий */}
              <div className="flex justify-center space-x-4">
                <Button onClick={generateEfficiencyReport} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Звіт про ефективність
                </Button>
                <Button onClick={() => {
                  setResults(null);
                  setActiveTab('input');
                }} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Новий розрахунок
                </Button>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Button 
                onClick={calculateEfficiency} 
                disabled={isCalculating}
                size="lg"
                className="px-8"
              >
                <Calculator className="h-5 w-5 mr-2" />
                {isCalculating ? 'Розрахунок...' : 'Виконати розрахунок ефективності'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  Результаты расчета эффективности
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <div className="flex justify-between pt-6">
          <Button onClick={handleBack} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleNext} disabled={!results}>
            Далі
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default RoadEfficiencyInterface;