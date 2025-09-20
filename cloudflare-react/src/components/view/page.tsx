
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
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6" style={{ background: 'rgb(var(--c-bg))' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">
            Визначення ефективності реконструкції/капітального ремонту автомобільних доріг
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fillTestData} className="glass-button">
            <Plus className="h-4 w-4 mr-2" />
            Тестові дані
          </Button>
          {results && (
            <Button onClick={generateEfficiencyReport} className="glass-button glass-button--primary">
              <Download className="h-4 w-4 mr-2" />
              Звіт
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="glass-card" style={{ background: 'rgba(var(--c-error), 0.08)' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: 'rgb(var(--c-error))' }} />
          <AlertDescription style={{ color: 'rgb(var(--c-error))' }}>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 glass-base">
          <TabsTrigger value="input" className="data-[state=active]:glass-button--primary">Вхідні дані</TabsTrigger>
          <TabsTrigger value="calculation" className="data-[state=active]:glass-button--primary">Розрахунок</TabsTrigger>
          <TabsTrigger value="results" disabled={!results} className="data-[state=active]:glass-button--primary">
            Результати
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Начальные данные */}
            <Card className="glass-card">
              <CardHeader className="glass-card-header">
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
                      <SelectTrigger className="glass-input">
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
                      <SelectTrigger className="glass-input">
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
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Поточна інтенсивність дорожнього руху (авт./доба)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.currentTrafficIntensity}
                    onChange={(e) => updateEfficiencyData('currentTrafficIntensity', parseInt(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Приріст інтенсивності дорожнього руху (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.trafficIntensityGrowth}
                    onChange={(e) => updateEfficiencyData('trafficIntensityGrowth', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Термін реконструкції/капітального ремонту (роки)</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionPeriod}
                    onChange={(e) => updateEfficiencyData('reconstructionPeriod', parseInt(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Стоимость работ */}
            <Card className="glass-card">
              <CardHeader className="glass-card-header">
                <CardTitle>Вартість робіт по роках (тис. грн)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2025</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2025}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2025', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2026</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2026}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2026', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2027</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2027}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2027', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вартість реконструкції/капітального ремонту 2028</Label>
                  <Input
                    type="number"
                    value={efficiencyData.reconstructionCost2028}
                    onChange={(e) => updateEfficiencyData('reconstructionCost2028', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Загальна вартість:</span>
                    <Badge className="glass-button glass-button--success text-lg px-3 py-1">
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

          {/* Остальные карточки с применением glass-стилей */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Состав движения */}
            <Card className="glass-card">
              <CardHeader className="glass-card-header">
                <CardTitle>Склад руху (%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Поля ввода с glass-input классом */}
                <div className="space-y-2">
                  <Label>Легкові автомобілі</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={efficiencyData.lightVehiclesPercent}
                    onChange={(e) => updateEfficiencyData('lightVehiclesPercent', parseFloat(e.target.value) || 0)}
                    className="glass-input"
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
                    className="glass-input"
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
                    className="glass-input"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Загалом:</span>
                    <Badge className={`glass-button ${
                      (efficiencyData.lightVehiclesPercent + 
                       efficiencyData.mediumVehiclesPercent + 
                       efficiencyData.heavyVehiclesPercent) === 100 ? 'glass-button--success' : 'glass-button--danger'
                    }`}>
                      {(efficiencyData.lightVehiclesPercent + 
                        efficiencyData.mediumVehiclesPercent + 
                        efficiencyData.heavyVehiclesPercent)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Средние затраты на эксплуатацию */}
            <Card className="glass-card">
              <CardHeader className="glass-card-header">
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
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Вантажні автомобілі (легкі)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.maintenanceCostMedium}
                    onChange={(e) => updateEfficiencyData('maintenanceCostMedium', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Автобуси (тяжкі)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={efficiencyData.maintenanceCostHeavy}
                    onChange={(e) => updateEfficiencyData('maintenanceCostHeavy', parseFloat(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Середня газоємність автобуса</Label>
                  <Input
                    type="number"
                    value={efficiencyData.averageBusCapacity}
                    onChange={(e) => updateEfficiencyData('averageBusCapacity', parseInt(e.target.value) || 0)}
                    className="glass-input"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Продолжение остальных карточек с glass-стилями... */}
        </TabsContent>

        <TabsContent value="calculation" className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="glass-card-header">
              <CardTitle>Розрахунок ефективності</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Предварительные расчеты */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="glass-card p-4" style={{ background: 'rgba(var(--c-action), 0.08)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'rgb(var(--c-action))' }}>
                      {(efficiencyData.reconstructionCost2025 + 
                        efficiencyData.reconstructionCost2026 + 
                        efficiencyData.reconstructionCost2027 + 
                        efficiencyData.reconstructionCost2028).toLocaleString()}
                    </div>
                    <div className="text-sm opacity-70">Загальна вартість (тис. грн)</div>
                  </div>
                  
                  <div className="glass-card p-4" style={{ background: 'rgba(var(--c-success), 0.08)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'rgb(var(--c-success))' }}>
                      {(efficiencyData.currentTrafficIntensity * 365 * efficiencyData.roadLength).toLocaleString()}
                    </div>
                    <div className="text-sm opacity-70">Річний транспортний потік</div>
                  </div>
                  
                  <div className="glass-card p-4" style={{ background: 'rgba(var(--c-warning), 0.08)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'rgb(var(--c-warning))' }}>
                      {(efficiencyData.currentInvestmentWithoutReconstruction - 
                        efficiencyData.currentInvestmentWithReconstruction).toLocaleString()}
                    </div>
                    <div className="text-sm opacity-70">Економія капіталовкладень (тис. грн)</div>
                  </div>
                </div>

                {/* Кнопка расчета */}
                <div className="flex justify-center">
                  <Button 
                    onClick={calculateEfficiency} 
                    disabled={isCalculating}
                    className="glass-button glass-button--primary glass-button--xl"
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
              {/* Основные результаты с glass-стилями */}
              <Card className="glass-card">
                <CardHeader className="glass-card-header">
                  <CardTitle>Результати розрахунку ефективності</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: results.npv > 0 ? 'rgb(var(--c-success))' : 'rgb(var(--c-error))' }}>
                        {results.npv.toLocaleString()}
                      </div>
                      <div className="text-sm opacity-70">NPV (тис. грн)</div>
                      <div className="text-xs opacity-60">Чиста приведена вартість</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: results.bcr > 1.0 ? 'rgb(var(--c-success))' : 'rgb(var(--c-error))' }}>
                        {results.bcr.toFixed(2)}
                      </div>
                      <div className="text-sm opacity-70">BCR</div>
                      <div className="text-xs opacity-60">Співвідношення вигод і витрат</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: 'rgb(var(--c-action))' }}>
                        {results.paybackPeriod !== Infinity ? results.paybackPeriod.toFixed(1) : '∞'}
                      </div>
                      <div className="text-sm opacity-70">Років</div>
                      <div className="text-xs opacity-60">Термін окупності</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: 'rgb(var(--c-warning))' }}>
                        {results.annualMaintenanceSavings.toLocaleString()}
                      </div>
                      <div className="text-sm opacity-70">Тис. грн/рік</div>
                      <div className="text-xs opacity-60">Річна економія</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Кнопки действий */}
              <div className="flex justify-center space-x-4">
                <Button onClick={generateEfficiencyReport} className="glass-button">
                  <FileText className="h-4 w-4 mr-2" />
                  Звіт про ефективність
                </Button>
                <Button onClick={() => {
                  setResults(null);
                  setActiveTab('input');
                }} className="glass-button">
                  <X className="h-4 w-4 mr-2" />
                  Новий розрахунок
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <div className="flex justify-between pt-6">
          <Button onClick={handleBack} className="glass-button">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleNext} disabled={!results} className="glass-button glass-button--primary">
            Далі
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default RoadEfficiencyInterface;