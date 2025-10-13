import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, Calculator, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ИМПОРТ РЕАЛЬНЫХ ФУНКЦИЙ ИЗ МОДУЛЯ
import { 
  performDetailedCostBenefitAnalysis,
  type DetailedTechnicalCondition,
  type RoadSection as ModuleRoadSection
} from '@/modules/block_three';

// Типы данных
interface RoadSection {
  id: string;
  name: string;
  category: 1 | 2 | 3 | 4 | 5;
  length: number;
}

interface ENPVInputData {
  sectionId: string;
  sectionName: string;
  workStartYear: number;
  roadCategory: string;
  totalReconstructionCost: number;
  termOfServiceLife: number;
  capitalRepairPeriod: number;
  currentRepairPeriod: number;
  constructionPeriod: number;
  discountRate: number;
  averageAnnualCapitalInvestments: number;
  capitalInvestmentsDuringConstruction: number;
  capitalInvestmentsInGarage1: number;
  capitalInvestmentsInGarageAuto: number;
  averagePassengerCapacityBus: number;
  passengerUsageCoefficient: number;
  averageLightVehicleCapacity: number;
  lightVehicleUsageCoefficient: number;
  averageTravelTimeReduction: number;
  trafficFlowIntensityCoefficient: number;
  postReconstructionIntensityCoefficient: number;
  postReconstructionIntensityPISDCoefficient: number;
  trafficVolume1Percent: number;
  trafficVolume13Percent: number;
  toxicityReductionCoefficient: number;
  averageAccidentsBeforeRepair: number;
  averageAccidentsAfterRepair: number;
  calculatedYearCount: number;
  averageSchoolAge: number;
  averageDTIAge: number;
  vehicleCategoryAgeQ1: string;
  maintenanceCostsBefore: number;
  maintenanceCostsAfter: number;
  // Дополнительные поля для детального расчета
  region: string;
  isDefenseRoad: boolean;
  isInternationalRoad: boolean;
  isEuropeanNetwork: boolean;
}

interface YearCalculation {
  year: number;
  trafficIntensity: number;
  capitalCosts: number;
  maintenanceCosts: number;
  economicEffect: number;
  netValue: number;
  discountFactor: number;
  discountedValue: number;
  enpvCumulative: number;
  discountedBenefits: number;
  discountedCosts: number;
}

interface DetailedResults {
  yearlyData: YearCalculation[];
  summary: {
    enpv: number;
    eirr: number;
    bcr: number;
    totalBenefits: number;
    totalCosts: number;
    vehicleFleetReduction: number;
    transportCostSavings: number;
    accidentReduction: number;
    environmentalBenefits: number;
    paybackPeriod: number;
  };
  moduleAnalysis: any; // Полные данные из модуля
}

const ENPVCalculationTool: React.FC = () => {
  const [roadSections] = useState<RoadSection[]>([
    { id: '1', name: 'М-06 Київ-Чоп (км 0-25)', category: 1, length: 25 },
    { id: '2', name: 'Н-03 Житомир-Чернівці (км 45-78)', category: 2, length: 33 },
    { id: '3', name: 'Р-15 Львів-Тернопіль (км 12-34)', category: 3, length: 22 },
    { id: '4', name: 'Т-23-05 Місцева дорога (км 0-15)', category: 4, length: 15 },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [savedData, setSavedData] = useState<Map<string, ENPVInputData>>(new Map());
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('input');
  const [detailedResults, setDetailedResults] = useState<DetailedResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const getEmptyData = (section: RoadSection): ENPVInputData => ({
    sectionId: section.id,
    sectionName: section.name,
    workStartYear: new Date().getFullYear(),
    roadCategory: section.category.toString(),
    totalReconstructionCost: 0,
    termOfServiceLife: 15,
    capitalRepairPeriod: 3, // % росту інтенсивності
    currentRepairPeriod: 5000, // інтенсивність руху
    constructionPeriod: section.length, // довжина дороги
    discountRate: 5,
    averageAnnualCapitalInvestments: 0,
    capitalInvestmentsDuringConstruction: 0,
    capitalInvestmentsInGarage1: 0,
    capitalInvestmentsInGarageAuto: 0,
    averagePassengerCapacityBus: 40,
    passengerUsageCoefficient: 0.7,
    averageLightVehicleCapacity: 4,
    lightVehicleUsageCoefficient: 0.6,
    averageTravelTimeReduction: 42.21,
    trafficFlowIntensityCoefficient: 1.0,
    postReconstructionIntensityCoefficient: 0.8,
    postReconstructionIntensityPISDCoefficient: 0.7,
    trafficVolume1Percent: 1.00,
    trafficVolume13Percent: 1.02,
    toxicityReductionCoefficient: 0.17,
    averageAccidentsBeforeRepair: 0.8,
    averageAccidentsAfterRepair: 0.5,
    calculatedYearCount: 15,
    averageSchoolAge: 50,
    averageDTIAge: 750,
    vehicleCategoryAgeQ1: '',
    maintenanceCostsBefore: 0,
    maintenanceCostsAfter: 0,
    region: 'Київська',
    isDefenseRoad: false,
    isInternationalRoad: false,
    isEuropeanNetwork: false,
  });

  const [currentData, setCurrentData] = useState<ENPVInputData | null>(null);

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = roadSections.find(s => s.id === sectionId);
    if (section) {
      const existingData = savedData.get(sectionId);
      setCurrentData(existingData || getEmptyData(section));
    }
    // Сбрасываем результаты при выборе новой секции
    setDetailedResults(null);
    setCalculationError(null);
  };

  const handleFieldChange = (field: keyof ENPVInputData, value: any) => {
    if (currentData) {
      setCurrentData({ ...currentData, [field]: value });
    }
  };

  const handleSave = () => {
    if (currentData && selectedSectionId) {
      const newSavedData = new Map(savedData);
      newSavedData.set(selectedSectionId, currentData);
      setSavedData(newSavedData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  /**
   * ГЛАВНАЯ ФУНКЦИЯ РАСЧЕТА - использует реальные алгоритмы из модуля
   */
  const calculateResults = async () => {
    if (!currentData) return;

    setIsCalculating(true);
    setCalculationError(null);

    try {
      console.log('=== Початок розрахунку ENPV ===');
      console.log('Вихідні дані:', currentData);

      // 1. Создаем правильный объект RoadSection для модуля
      const detailedCondition: DetailedTechnicalCondition = {
        // Коефіцієнт інтенсивності
        intensityCoefficient: currentData.trafficFlowIntensityCoefficient,
        maxDesignIntensity: getMaxDesignIntensityByCategory(parseInt(currentData.roadCategory) as 1|2|3|4|5),
        actualIntensity: currentData.currentRepairPeriod,
        
        // Коефіцієнт міцності (приймаємо що після ремонту буде нормально)
        strengthCoefficient: 1.0,
        isRigidPavement: false,
        actualElasticModulus: 300,
        requiredElasticModulus: 280,
        
        // Коефіцієнт рівності (покращення після ремонту)
        evennessCoefficient: currentData.postReconstructionIntensityCoefficient,
        iriIndex: 2.5,
        maxAllowedEvenness: 3.5,
        
        // Коефіцієнт колійності
        rutCoefficient: currentData.postReconstructionIntensityPISDCoefficient,
        actualRutDepth: 15,
        maxAllowedRutDepth: 20,
        
        // Коефіцієнт зчеплення
        frictionCoefficient: 1.0,
        actualFrictionValue: 0.38,
        requiredFrictionValue: 0.35
      };

      const moduleRoadSection: ModuleRoadSection = {
        id: currentData.sectionId,
        name: currentData.sectionName,
        category: parseInt(currentData.roadCategory) as 1 | 2 | 3 | 4 | 5,
        length: currentData.constructionPeriod, // довжина дороги в км
        significance: 'state',
        region: currentData.region,
        trafficIntensity: currentData.currentRepairPeriod,
        detailedCondition,
        isDefenseRoad: currentData.isDefenseRoad,
        isInternationalRoad: currentData.isInternationalRoad,
        isEuropeanNetwork: currentData.isEuropeanNetwork
      };

      // 2. ИСПОЛЬЗУЕМ РЕАЛЬНУЮ ФУНКЦИЮ ИЗ МОДУЛЯ
      const projectCostThousands = currentData.totalReconstructionCost * 1000; // млн -> тис грн
      
      console.log('Викликаємо performDetailedCostBenefitAnalysis...');
      const costBenefitAnalysis = performDetailedCostBenefitAnalysis(
        moduleRoadSection,
        projectCostThousands
      );

      console.log('Результат аналізу витрат та вигод:', costBenefitAnalysis);

      if (!costBenefitAnalysis) {
        throw new Error('Не вдалося виконати аналіз витрат та вигод');
      }

      // 3. Рассчитываем данные по годам с использованием результатов модуля
      const yearlyData: YearCalculation[] = [];
      const discountRate = costBenefitAnalysis.discountRate; // Используем ставку из модуля
      const startYear = currentData.workStartYear;
      const years = currentData.calculatedYearCount;
      
      // Годовые выгоды из модуля (распределяем на весь период)
      const totalBenefitsFromModule = 
        costBenefitAnalysis.vehicleFleetReduction +
        costBenefitAnalysis.transportCostSavings +
        costBenefitAnalysis.accidentReduction +
        costBenefitAnalysis.environmentalBenefits;

      // Средние годовые выгоды
      const averageAnnualBenefits = totalBenefitsFromModule / years;

      console.log(`Загальні вигоди з модуля: ${totalBenefitsFromModule.toFixed(2)} тис. грн`);
      console.log(`Середні річні вигоди: ${averageAnnualBenefits.toFixed(2)} тис. грн`);

      let cumulativeENPV = -currentData.totalReconstructionCost; // Начальная инвестиция
      let totalDiscountedBenefits = 0;
      let totalDiscountedCosts = projectCostThousands / 1000; // в млн грн

      // Рост интенсивности движения
      const trafficGrowthRate = currentData.capitalRepairPeriod / 100;

      for (let i = 0; i <= years; i++) {
        const year = startYear + i;
        const discountFactor = Math.pow(1 + discountRate, -i);
        
        // Капитальные затраты только в нулевом году
        const capitalCosts = i === 0 ? currentData.totalReconstructionCost : 0;
        
        // Затраты на содержание
        const maintenanceCosts = i > 0 
          ? currentData.maintenanceCostsAfter 
          : currentData.maintenanceCostsBefore;
        
        // Выгоды начинаются с первого года после реконструкции
        const yearlyBenefits = i > 0 ? averageAnnualBenefits / 1000 : 0; // в млн грн
        
        // Экономический эффект = Выгоды - Эксплуатационные затраты - Капитальные затраты
        const economicEffect = i === 0 
          ? -capitalCosts 
          : (yearlyBenefits - maintenanceCosts);
        
        const netValue = economicEffect;
        const discountedValue = netValue * discountFactor;
        
        cumulativeENPV += discountedValue;
        
        // Дисконтированные выгоды и затраты
        const discountedBenefits = yearlyBenefits * discountFactor;
        const discountedCosts = i === 0 
          ? capitalCosts * discountFactor 
          : maintenanceCosts * discountFactor;
        
        totalDiscountedBenefits += discountedBenefits;
        totalDiscountedCosts += discountedCosts;
        
        // Рост интенсивности движения
        const adjustedTraffic = currentData.currentRepairPeriod * Math.pow(1 + trafficGrowthRate, i);

        yearlyData.push({
          year,
          trafficIntensity: adjustedTraffic,
          capitalCosts: capitalCosts,
          maintenanceCosts: i > 0 ? maintenanceCosts : 0,
          economicEffect,
          netValue,
          discountFactor,
          discountedValue,
          enpvCumulative: cumulativeENPV,
          discountedBenefits,
          discountedCosts
        });
      }

      console.log('Розраховані дані по роках:', yearlyData);

      // 4. Формируем итоговые результаты
      const results: DetailedResults = {
        yearlyData,
        summary: {
          enpv: costBenefitAnalysis.enpv / 1000, // тыс грн -> млн грн
          eirr: costBenefitAnalysis.eirr,
          bcr: costBenefitAnalysis.bcr,
          totalBenefits: totalDiscountedBenefits,
          totalCosts: totalDiscountedCosts,
          vehicleFleetReduction: costBenefitAnalysis.vehicleFleetReduction / 1000,
          transportCostSavings: costBenefitAnalysis.transportCostSavings / 1000,
          accidentReduction: costBenefitAnalysis.accidentReduction / 1000,
          environmentalBenefits: costBenefitAnalysis.environmentalBenefits / 1000,
          paybackPeriod: costBenefitAnalysis.paybackPeriod
        },
        moduleAnalysis: costBenefitAnalysis
      };

      console.log('=== Фінальні результати ===');
      console.log('ENPV:', results.summary.enpv.toFixed(2), 'млн грн');
      console.log('EIRR:', (results.summary.eirr * 100).toFixed(2), '%');
      console.log('BCR:', results.summary.bcr.toFixed(2));
      console.log('Термін окупності:', results.summary.paybackPeriod.toFixed(1), 'років');

      setDetailedResults(results);
      setCurrentTab('results');

    } catch (error) {
      console.error('Помилка при розрахунку:', error);
      setCalculationError(error instanceof Error ? error.message : 'Невідома помилка розрахунку');
    } finally {
      setIsCalculating(false);
    }
  };

  // Вспомогательная функция для получения максимальной проектной интенсивности
  const getMaxDesignIntensityByCategory = (category: 1 | 2 | 3 | 4 | 5): number => {
    const intensities = { 1: 20000, 2: 12000, 3: 6000, 4: 2000, 5: 500 };
    return intensities[category];
  };

  // Функция для экспорта отчета
  const exportReport = () => {
    if (!detailedResults || !currentData) return;

    let report = '# ЗВІТ ПРО ЕКОНОМІЧНУ ЕФЕКТИВНІСТЬ РЕКОНСТРУКЦІЇ/КАПІТАЛЬНОГО РЕМОНТУ\n\n';
    report += `## Об'єкт: ${currentData.sectionName}\n\n`;
    report += `### Вихідні дані:\n`;
    report += `- Категорія дороги: ${currentData.roadCategory}\n`;
    report += `- Довжина ділянки: ${currentData.constructionPeriod} км\n`;
    report += `- Інтенсивність руху: ${currentData.currentRepairPeriod} авт/добу\n`;
    report += `- Вартість робіт: ${currentData.totalReconstructionCost.toFixed(2)} млн грн\n`;
    report += `- Розрахунковий період: ${currentData.calculatedYearCount} років\n\n`;
    
    report += `### Результати економічного аналізу:\n`;
    report += `- **ENPV**: ${detailedResults.summary.enpv.toFixed(2)} млн грн\n`;
    report += `- **EIRR**: ${(detailedResults.summary.eirr * 100).toFixed(2)}%\n`;
    report += `- **BCR**: ${detailedResults.summary.bcr.toFixed(2)}\n`;
    report += `- **Термін окупності**: ${detailedResults.summary.paybackPeriod.toFixed(1)} років\n\n`;
    
    report += `### Структура вигод (млн грн):\n`;
    report += `- Зменшення автопарку: ${detailedResults.summary.vehicleFleetReduction.toFixed(2)}\n`;
    report += `- Економія на перевезеннях: ${detailedResults.summary.transportCostSavings.toFixed(2)}\n`;
    report += `- Зниження аварійності: ${detailedResults.summary.accidentReduction.toFixed(2)}\n`;
    report += `- Екологічні вигоди: ${detailedResults.summary.environmentalBenefits.toFixed(2)}\n\n`;
    
    const conclusion = detailedResults.summary.enpv > 0 && detailedResults.summary.bcr > 1.0
      ? '**Висновок**: Проект економічно доцільний і рекомендується до реалізації.'
      : '**Висновок**: Проект потребує додаткового обґрунтування або перегляду параметрів.';
    
    report += `${conclusion}\n`;

    // Создаем Blob и скачиваем
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ENPV_Report_${currentData.sectionName}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-3">
      {/* Заголовок */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-xl">
            Визначення ефективності реконструкції/капітального ремонту автомобільних доріг
          </CardTitle>
          <CardDescription>
            Розрахунок з використанням детальних алгоритмів Методики (Додаток 11)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Выбор объекта */}
      <Card className="border-2 border-yellow-400 bg-yellow-50">
        <CardContent className="py-3">
          <Label className="text-sm font-semibold text-gray-900 mb-2 block">
            Оберіть об'єкт для розрахунку ENPV
          </Label>
          <Select value={selectedSectionId} onValueChange={handleSectionSelect}>
            <SelectTrigger className="w-full h-10 bg-white">
              <SelectValue placeholder="-- Оберіть об'єкт --" />
            </SelectTrigger>
            <SelectContent>
              {roadSections.map(section => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name} (Категорія {section.category}, довжина {section.length} км)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Индикатор сохраненных данных */}
      {savedData.size > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 font-medium">
            Збережено дані для {savedData.size} об'єкт(ів)
          </AlertDescription>
        </Alert>
      )}

      {/* Ошибки расчета */}
      {calculationError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            Помилка розрахунку: {calculationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      {currentData && (
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Вихідні дані</TabsTrigger>
            <TabsTrigger value="results" disabled={!detailedResults}>
              Результати розрахунку
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Ввод данных - ОСТАВЛЯЕМ КАК БЫЛО */}
          <TabsContent value="input">
            <div className="glass-card">
              <CardContent className="p-0">
                <div className="border-2 border-gray-400 overflow-hidden">
                  <div className="overflow-auto max-h-[800px]">
                    {/* ВСЯ ТАБЛИЦА ВВОДА ДАННЫХ ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ */}
                    <table className="border-collapse w-full min-w-full">
                    <thead className="sticky top-0 z-20">
                        <tr>
                        <th className="w-12 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-30">
                            №п/п
                        </th>
                        <th className="w-80 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold px-2">
                            Вихідні дані
                        </th>
                        <th className="w-24 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold px-1">
                            Одиниця виміру
                        </th>
                        <th className="w-32 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold px-1">
                            Позначення
                        </th>
                        <th className="w-32 h-10 bg-gray-200 border border-gray-400 text-center text-xs font-bold px-1">
                            Величина
                        </th>
                        </tr>
                    </thead>
                    
                    <tbody>
                        {/* Строка 1 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">1</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Початок виконання робіт
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">рік</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.workStartYear}
                            onChange={(e) => handleFieldChange('workStartYear', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 2 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">2</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Категорія дороги
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input 
                            type="text"
                            value={currentData.roadCategory}
                            onChange={(e) => handleFieldChange('roadCategory', e.target.value)}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 3 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">3</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Вартість реконструкції/капітального ремонту загальна
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">млн грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">2Квз<br/>Квз</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.totalReconstructionCost}
                            onChange={(e) => handleFieldChange('totalReconstructionCost', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 4 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">4</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Термін реконструкції/капітального ремонту
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">років</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">b</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.termOfServiceLife}
                            onChange={(e) => handleFieldChange('termOfServiceLife', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>
                        
                        {/* Строка 5 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">5</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Періодичність інтенсивності дорожнього руху
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">%</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">b</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.capitalRepairPeriod}
                            onChange={(e) => handleFieldChange('capitalRepairPeriod', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 6 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">6</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Розрахункова інтенсивність дорожнього руху
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">авт/добу</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">N</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.currentRepairPeriod}
                            onChange={(e) => handleFieldChange('currentRepairPeriod', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 7 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">7</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Довжина ділянки дороги
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">км</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">т</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.constructionPeriod}
                            onChange={(e) => handleFieldChange('constructionPeriod', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 8 */}
                        <tr>
                        <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">8</td>
                        <td className="border border-gray-400 p-2 text-xs">
                            легкові автомобілі<br/>
                            вантажні автомобілі (легкі)<br/>
                            автобуси (маломісткі)
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            -<br/>
                            %<br/>
                            %
                            </div>
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            -<br/>
                            σл<br/>
                            σв
                            </div>
                        </td>
                        <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                            <div className="h-5"></div>
                            <Input
                                type="number"
                                step="0.01"
                                value={currentData.discountRate}
                                onChange={(e) => handleFieldChange('discountRate', parseFloat(e.target.value))}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            </div>
                        </td>
                        </tr>

                        {/* Строка 11 */}
                        <tr>
                        <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">11</td>
                        <td className="border border-gray-400 p-2 text-xs">
                            Середні витрати на експлуатацію транспортних засобів після легкові автомобілі<br/>
                            вантажні автомобілі (легкі)<br/>
                            автобуси (маломісткі)
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            -<br/>
                            грн.<br/>
                            грн.<br/>
                            грн.
                            </div>
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            -<br/>
                            S1л<br/>
                            S1в<br/>
                            S1а
                            </div>
                        </td>
                        <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                            <div className="h-5"></div>
                            <Input
                                type="number"
                                step="0.01"
                                value={currentData.averageAnnualCapitalInvestments}
                                onChange={(e) => handleFieldChange('averageAnnualCapitalInvestments', parseFloat(e.target.value))}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                value={currentData.capitalInvestmentsDuringConstruction}
                                onChange={(e) => handleFieldChange('capitalInvestmentsDuringConstruction', parseFloat(e.target.value))}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            </div>
                        </td>
                        </tr>

                        {/* Строка 12 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">12</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середні витрати на експлуатацію транспортних засобів до реконструкції/капітального легкові автомобілі
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">грн.</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">S0</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 13 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">13</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Питомі капіталовкладення в гаражне будівництво в розрахунку на 1 автомобіль з на придбання одного автобуса
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Га</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.capitalInvestmentsInGarage1}
                            onChange={(e) => handleFieldChange('capitalInvestmentsInGarage1', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 14 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">14</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Питомі капіталовкладення в гаражне будівництво в розрахунку на 1 автобусі на придбання одного автобуса
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Ка</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.capitalInvestmentsInGarageAuto}
                            onChange={(e) => handleFieldChange('capitalInvestmentsInGarageAuto', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 15 */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">15</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня пасажиромісткість автобуса
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">осіб</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Ва</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.averagePassengerCapacityBus}
                            onChange={(e) => handleFieldChange('averagePassengerCapacityBus', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        {/* Строка 16-31 - остальные строки по тому же шаблону */}
                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">16</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт використання пасажиромісткості автобусів
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">осіб</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Кза</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.passengerUsageCoefficient}
                            onChange={(e) => handleFieldChange('passengerUsageCoefficient', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">17</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня людиномісткість легкового автомобіля
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">осіб</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Вл</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.averageLightVehicleCapacity}
                            onChange={(e) => handleFieldChange('averageLightVehicleCapacity', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">18</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт використання людиномісткості легкового автомобіля
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Кзл</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.lightVehicleUsageCoefficient}
                            onChange={(e) => handleFieldChange('lightVehicleUsageCoefficient', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">19</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Оцінка вартості точного виміру скорочення часу пасажирів у результаті зниження часу транспортного обслуговування для поїздок
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Св</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.averageTravelTimeReduction}
                            onChange={(e) => handleFieldChange('averageTravelTimeReduction', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">20</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт, який враховується впливу складу транспортного потоку і його середньої швидкості ДО реконструкції
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">К1ро</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.trafficFlowIntensityCoefficient}
                            onChange={(e) => handleFieldChange('trafficFlowIntensityCoefficient', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">21</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт, який враховується впливу складу транспортного потоку і його середньої швидкості ПІСЛ ДД реконструкції
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">К1після</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.postReconstructionIntensityCoefficient}
                            onChange={(e) => handleFieldChange('postReconstructionIntensityCoefficient', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">22</td>
                        <td className="border border-gray-400 p-2 text-xs">
                            Коефіцієнт, який враховує вплив подовженого зимового дороги<br/>
                            (якщо менше 1% К₂ = 1,00)<br/>
                            (якщо і = 1-3% К₂ = 1,02)
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            -<br/>
                            -<br/>
                            -
                            </div>
                        </td>
                        <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                            К2<br/>
                            <br/>
                            </div>
                        </td>
                        <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                            <div className="h-5"></div>
                            <Input
                                type="number"
                                step="0.01"
                                value={currentData.trafficVolume1Percent}
                                onChange={(e) => handleFieldChange('trafficVolume1Percent', parseFloat(e.target.value))}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                value={currentData.trafficVolume13Percent}
                                onChange={(e) => handleFieldChange('trafficVolume13Percent', parseFloat(e.target.value))}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                            />
                            </div>
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">23</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт, який враховується очікуване зниження токсичності автомобільних викидів завдяки здосконаленню конструкції двигунів і методів їх експлуатації (на 2000 р. К3 = 0,17)
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">К3</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.toxicityReductionCoefficient}
                            onChange={(e) => handleFieldChange('toxicityReductionCoefficient', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">24</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня фактична або розрахункова (очікувана) кількість ДТП на ділянці дороги ДО реконструкції/капітального ремонту
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">а₀</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.averageAccidentsBeforeRepair}
                            onChange={(e) => handleFieldChange('averageAccidentsBeforeRepair', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">25</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня фактична або розрахункова (очікувана) кількість ДТП на ділянці ДО опису капітального ремонту
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">θ1</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.averageAccidentsAfterRepair}
                            onChange={(e) => handleFieldChange('averageAccidentsAfterRepair', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">26</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Розрахунковий період років
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">років</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">п</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            value={currentData.calculatedYearCount}
                            onChange={(e) => handleFieldChange('calculatedYearCount', parseInt(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">27</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня вартість школи, який завдає суспільству 1 кг токсичних речовин
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">П</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.averageSchoolAge}
                            onChange={(e) => handleFieldChange('averageSchoolAge', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">28</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середні втрати від одного ДТП
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Пдтп</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.averageDTIAge}
                            onChange={(e) => handleFieldChange('averageDTIAge', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">29</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Об'єм випливів автомобілів на 1 км категорії
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">кув</td>
                        <td className="h-8 border border-gray-400 text-center text-xs">Q1</td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="text"
                            value={currentData.vehicleCategoryAgeQ1}
                            onChange={(e) => handleFieldChange('vehicleCategoryAgeQ1', e.target.value)}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">30</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Витрати на експлуатаційне утримання до проведення робіт з реконструкції/капітального ремонту
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">млн.грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs"></td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.maintenanceCostsBefore}
                            onChange={(e) => handleFieldChange('maintenanceCostsBefore', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>

                        <tr>
                        <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">31</td>
                        <td className="h-8 border border-gray-400 p-2 text-xs">
                            Витрати на експлуатаційне утримання після проведення робіт з реконструкції/капітального ремонту
                        </td>
                        <td className="h-8 border border-gray-400 text-center text-xs">млн.грн</td>
                        <td className="h-8 border border-gray-400 text-center text-xs"></td>
                        <td className="h-8 border border-gray-400 p-0">
                            <Input
                            type="number"
                            step="0.01"
                            value={currentData.maintenanceCostsAfter}
                            onChange={(e) => handleFieldChange('maintenanceCostsAfter', parseFloat(e.target.value))}
                            className="w-full h-full border-0 text-xs text-center bg-transparent rounded-none"
                            />
                        </td>
                        </tr>
                        </tbody>
                    </table>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4 flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={!selectedSectionId}
                    className="flex-1 h-10 text-sm bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Зберегти дані
                  </Button>
                  <Button
                    onClick={calculateResults}
                    disabled={!selectedSectionId || isCalculating}
                    className="flex-1 h-10 text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Розрахунок...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Розрахувати ENPV
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          </TabsContent>

          {/* TAB 2: Результаты - ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ МОДУЛЯ */}
          <TabsContent value="results">
            {detailedResults ? (
              <>
                {/* Заголовок с информацией */}
                <Card className="border-2 border-blue-400 bg-blue-50">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Розрахунок для об'єкту: {currentData.sectionName}
                        </CardTitle>
                        <CardDescription>
                          Аналіз витрат та вигод на період {currentData.calculatedYearCount} років 
                          (ставка дисконтування {(detailedResults.moduleAnalysis.discountRate * 100).toFixed(1)}%)
                        </CardDescription>
                      </div>
                      <Button
                        onClick={exportReport}
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Експорт звіту
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Ключевые показатели */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Card className={`border-2 ${detailedResults.summary.enpv > 0 ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-600 mb-1">ENPV (млн грн)</div>
                      <div className={`text-2xl font-bold ${detailedResults.summary.enpv > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {detailedResults.summary.enpv.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-yellow-400 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-600 mb-1">EIRR (%)</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(detailedResults.summary.eirr * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${detailedResults.summary.bcr > 1 ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'}`}>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-600 mb-1">BCR (Вигоди/Витрати)</div>
                      <div className={`text-2xl font-bold ${detailedResults.summary.bcr > 1 ? 'text-green-700' : 'text-orange-700'}`}>
                        {detailedResults.summary.bcr.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-400 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-600 mb-1">Термін окупності (років)</div>
                      <div className="text-2xl font-bold text-purple-700">
                        {detailedResults.summary.paybackPeriod.toFixed(1)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Структура вигод */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Структура економічних вигод (млн грн)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Зменшення автопарку</div>
                        <div className="text-lg font-bold text-blue-700">
                          {detailedResults.summary.vehicleFleetReduction.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Економія на перевезеннях</div>
                        <div className="text-lg font-bold text-green-700">
                          {detailedResults.summary.transportCostSavings.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Зниження аварійності</div>
                        <div className="text-lg font-bold text-orange-700">
                          {detailedResults.summary.accidentReduction.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Екологічні вигоди</div>
                        <div className="text-lg font-bold text-emerald-700">
                          {detailedResults.summary.environmentalBenefits.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ТАБЛИЦА РЕЗУЛЬТАТОВ ПО ГОДАМ */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Детальний розрахунок по роках</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-2 border-gray-400 overflow-hidden">
                      <div className="overflow-auto max-h-[600px]">
                        <table className="border-collapse w-full min-w-full text-xs">
                          <thead className="sticky top-0 z-20">
                            <tr>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>Рік</th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Інтенсивність<br/>(авт/добу)
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" colSpan={2}>
                                Витрати (млн грн)
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Економічний<br/>ефект
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Чистий<br/>NV
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Коеф.<br/>диск.
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Диск.<br/>дохід
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                <strong>ENPV</strong>
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Диск.<br/>вигоди
                              </th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-2" rowSpan={2}>
                                Диск.<br/>витрати
                              </th>
                            </tr>
                            <tr>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-1">Капітальні</th>
                              <th className="bg-gray-200 border border-gray-400 text-center font-bold p-1">Утримання</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailedResults.yearlyData.map((row, index) => (
                              <tr key={row.year} className={index === 0 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="border border-gray-400 text-center p-2 font-bold">
                                  {row.year}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {Math.round(row.trafficIntensity).toLocaleString()}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.capitalCosts > 0 ? row.capitalCosts.toFixed(2) : '-'}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.maintenanceCosts > 0 ? row.maintenanceCosts.toFixed(2) : '-'}
                                </td>
                                <td className={`border border-gray-400 text-right p-2 ${row.economicEffect >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {row.economicEffect.toFixed(2)}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.netValue.toFixed(2)}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.discountFactor.toFixed(4)}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.discountedValue.toFixed(2)}
                                </td>
                                <td className={`border border-gray-400 text-right p-2 font-bold bg-yellow-50 ${row.enpvCumulative >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                  {row.enpvCumulative.toFixed(2)}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.discountedBenefits.toFixed(2)}
                                </td>
                                <td className="border border-gray-400 text-right p-2">
                                  {row.discountedCosts.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                            {/* Итоговая строка */}
                            <tr className="bg-gray-200 font-bold">
                              <td className="border border-gray-400 text-center p-2" colSpan={8}>
                                <strong>РАЗОМ</strong>
                              </td>
                              <td className={`border border-gray-400 text-right p-2 text-lg bg-yellow-200 ${detailedResults.summary.enpv >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {detailedResults.summary.enpv.toFixed(2)}
                              </td>
                              <td className="border border-gray-400 text-right p-2 bg-green-100 text-green-700">
                                {detailedResults.summary.totalBenefits.toFixed(2)}
                              </td>
                              <td className="border border-gray-400 text-right p-2 bg-red-100 text-red-700">
                                {detailedResults.summary.totalCosts.toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Висновок */}
                <Card className={detailedResults.summary.enpv > 0 && detailedResults.summary.bcr > 1 
                  ? 'border-2 border-green-400 bg-green-50' 
                  : 'border-2 border-orange-400 bg-orange-50'
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">
                        {detailedResults.summary.enpv > 0 && detailedResults.summary.bcr > 1 ? '✅' : '⚠️'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">Висновок</h3>
                        {detailedResults.summary.enpv > 0 && detailedResults.summary.bcr > 1 ? (
                          <p className="text-green-800">
                            <strong>Проект економічно доцільний</strong> і рекомендується до реалізації.
                            ENPV є позитивною ({detailedResults.summary.enpv.toFixed(2)} млн грн), 
                            співвідношення вигід до витрат перевищує 1 (BCR = {detailedResults.summary.bcr.toFixed(2)}),
                            а економічна норма дохідності становить {(detailedResults.summary.eirr * 100).toFixed(1)}%.
                          </p>
                        ) : (
                          <p className="text-orange-800">
                            <strong>Проект потребує додаткового обґрунтування</strong> або перегляду параметрів.
                            {detailedResults.summary.enpv <= 0 && ' ENPV є від\'ємною.'}
                            {detailedResults.summary.bcr <= 1 && ' BCR менше 1 (витрати перевищують вигоди).'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Технічна інформація з модуля */}
                <Card className="border border-gray-300">
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs text-gray-600">
                      Технічна інформація (з модуля block_three.ts)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Ставка дисконтування:</span>{' '}
                        <strong>{(detailedResults.moduleAnalysis.discountRate * 100).toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Річний обсяг руху:</span>{' '}
                        <strong>{((currentData.currentRepairPeriod * 365 * currentData.constructionPeriod) / 1000).toFixed(0)} тис. авт-км</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Загальні дисконт. вигоди:</span>{' '}
                        <strong>{(detailedResults.moduleAnalysis.totalBenefits / 1000).toFixed(2)} млн грн</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Загальні дисконт. витрати:</span>{' '}
                        <strong>{(detailedResults.moduleAnalysis.totalCosts / 1000).toFixed(2)} млн грн</strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Немає результатів</h3>
                  <p className="text-gray-500 mb-4">
                    Перейдіть на вкладку "Вихідні дані" та натисніть "Розрахувати ENPV"
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Уведомление об успешном сохранении */}
      {showSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom">
          <Alert className="bg-green-500 text-white border-green-600 shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <AlertDescription className="font-medium">
              Дані успішно збережено!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Пустое состояние */}
      {!selectedSectionId && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Оберіть об'єкт для початку роботи
            </h3>
            <p className="text-gray-500">
              Виберіть секцію дороги зі списку вище для заповнення вихідних даних та розрахунку ENPV
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ENPVCalculationTool;