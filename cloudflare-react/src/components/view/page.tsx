import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { AlertTriangle, Calculator, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { type RoadSectionUI } from './block_three_page';
import { Alert, AlertDescription } from '../ui/alert';

interface RoadEfficiencyInterfaceProps {
  sections: RoadSectionUI[];
  onSectionsChange: Dispatch<SetStateAction<RoadSectionUI[]>>;
  onNext: () => void;
  onBack: () => void;
}

// Типы данных для полной таблицы эффективности
interface TableEfficiencyData {
  startYear: number;
  roadCategory: number;
  totalCost: number;
  cost2025: number;
  cost2026: number;
  cost2027: number;
  cost2028: number;
  reconstructionPeriod: number;
  trafficGrowthRate: number;
  trafficIntensity: number;
  roadLength: number;
  lightVehiclesPercent: number;
  trucksPercent: number;
  busesPercent: number;
  lightCostAfter: number;
  truckCostAfter: number;
  busCostAfter: number;
  lightCostBefore: number;
  truckCostBefore: number;
  busCostBefore: number;
  truckCapital: number;
  busCapital: number;
  busCapacity: number;
  busLoadFactor: number;
  truckCapacity: number;
  carCapacity: number;
  truckLoadFactor: number;
  timeSavings: number;
  coefficientBefore: number;
  coefficientAfter: number;
  slopeCoefficient: number;
  toxicCoefficient: number;
  accidentsBefore: number;
  accidentsAfter: number;
  calculationPeriod: number;
  toxicDamage: number;
  deathLoss: number;
  emissions: number;
  maintenanceBefore: number;
  maintenanceAfter: number;
}

interface EconomicIndicators {
  totalInvestmentCost: number;
  annualSavings: number;
  npv: number;
  bcr: number;
  paybackPeriod: number;
  totalDiscountedBenefits: number;
}

interface SocialEffects {
  timeSavingsValue: number;
  accidentSavings: number;
  environmentalSavings: number;
  maintenanceSavings: number;
  totalSocialBenefits: number;
}

interface TotalEfficiency {
  totalNPV: number;
  totalBCR: number;
  efficiencyPerKm: number;
  isEconomicallyViable: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface EfficiencyResults {
  economicIndicators: EconomicIndicators;
  socialEffects: SocialEffects;
  totalEfficiency: TotalEfficiency;
  recommendation: string;
}

function calculateNPV(initialCost: number, annualBenefits: number, years: number, discountRate: number = 0.05): number {
  let npv = -initialCost;
  
  for (let year = 1; year <= years; year++) {
    const discountFactor = Math.pow(1 + discountRate, -year);
    npv += annualBenefits * discountFactor;
  }
  
  return npv;
}

function calculateDiscountedBenefits(annualBenefits: number, years: number, discountRate: number = 0.05): number {
  let totalBenefits = 0;
  
  for (let year = 1; year <= years; year++) {
    const discountFactor = Math.pow(1 + discountRate, -year);
    totalBenefits += annualBenefits * discountFactor;
  }
  
  return totalBenefits;
}

function calculateEmissionReduction(data: TableEfficiencyData, annualVehicleKm: number): number {
  const baseEmissions = annualVehicleKm * data.emissions;
  const improvementFactor = (data.coefficientBefore - data.coefficientAfter) / data.coefficientBefore * 0.15;
  const technologyReduction = baseEmissions * data.toxicCoefficient;
  const totalReduction = baseEmissions * improvementFactor + technologyReduction;
  
  return totalReduction;
}

function calculatePassengerTimeSavings(data: TableEfficiencyData, annualVehicleKm: number): number {
  const speedImprovement = (data.coefficientBefore - data.coefficientAfter) / data.coefficientBefore;
  
  const lightPassengerKm = annualVehicleKm * (data.lightVehiclesPercent / 100) * data.carCapacity;
  const truckPassengerKm = annualVehicleKm * (data.trucksPercent / 100) * data.truckCapacity * data.truckLoadFactor;
  const busPassengerKm = annualVehicleKm * (data.busesPercent / 100) * data.busCapacity * data.busLoadFactor;
  
  const totalPassengerKm = lightPassengerKm + truckPassengerKm + busPassengerKm;
  const timeReductionHours = (totalPassengerKm / 60) * speedImprovement;
  
  return timeReductionHours;
}

function calculateSocialEffects(data: TableEfficiencyData): SocialEffects {
  const annualVehicleKm = data.trafficIntensity * 365 * data.roadLength;
  
  const passengerHoursSaved = calculatePassengerTimeSavings(data, annualVehicleKm);
  const timeSavingsValue = passengerHoursSaved * data.timeSavings;
  
  const accidentReduction = (data.accidentsBefore - data.accidentsAfter) * data.roadLength;
  const accidentSavings = accidentReduction * data.deathLoss * 1000;
  
  const emissionReduction = calculateEmissionReduction(data, annualVehicleKm);
  const environmentalSavings = emissionReduction * data.toxicDamage;
  
  const maintenanceSavings = (data.maintenanceBefore - data.maintenanceAfter) * 1000000;
  
  return {
    timeSavingsValue,
    accidentSavings,
    environmentalSavings,
    maintenanceSavings,
    totalSocialBenefits: timeSavingsValue + accidentSavings + environmentalSavings + maintenanceSavings
  };
}

function calculateEconomicIndicators(data: TableEfficiencyData): EconomicIndicators {
  const totalInvestmentCost = data.cost2025 + data.cost2026 + data.cost2027 + data.cost2028;
  
  const annualVehicleKm = data.trafficIntensity * 365 * data.roadLength;
  
  const lightVehicleKm = annualVehicleKm * (data.lightVehiclesPercent / 100);
  const truckVehicleKm = annualVehicleKm * (data.trucksPercent / 100);
  const busVehicleKm = annualVehicleKm * (data.busesPercent / 100);
  
  const annualSavings = 
    lightVehicleKm * (data.lightCostBefore - data.lightCostAfter) +
    truckVehicleKm * (data.truckCostBefore - data.truckCostAfter) +
    busVehicleKm * (data.busCostBefore - data.busCostAfter);
  
  const npv = calculateNPV(totalInvestmentCost, annualSavings, data.calculationPeriod);
  const totalDiscountedBenefits = calculateDiscountedBenefits(annualSavings, data.calculationPeriod);
  const bcr = totalDiscountedBenefits / totalInvestmentCost;
  const paybackPeriod = totalInvestmentCost / annualSavings;
  
  return {
    totalInvestmentCost,
    annualSavings,
    npv,
    bcr,
    paybackPeriod,
    totalDiscountedBenefits
  };
}

function calculateTotalEfficiency(
  economic: EconomicIndicators, 
  social: SocialEffects, 
  data: TableEfficiencyData
): TotalEfficiency {
  const trafficGrowthFactor = Math.pow(1 + data.trafficGrowthRate / 100, data.calculationPeriod);
  const adjustedBenefits = (economic.annualSavings + social.totalSocialBenefits) * trafficGrowthFactor;
  
  const totalNPV = calculateNPV(economic.totalInvestmentCost, adjustedBenefits, data.calculationPeriod);
  const totalBCR = (economic.totalDiscountedBenefits + social.totalSocialBenefits * data.calculationPeriod) / economic.totalInvestmentCost;
  const efficiencyPerKm = totalNPV / data.roadLength;
  
  return {
    totalNPV,
    totalBCR,
    efficiencyPerKm,
    isEconomicallyViable: totalNPV > 0 && totalBCR > 1.0,
    riskLevel: totalNPV < 0 ? 'high' : totalBCR < 1.2 ? 'medium' : 'low'
  };
}

function generateRecommendation(efficiency: TotalEfficiency): string {
  if (efficiency.isEconomicallyViable) {
    if (efficiency.totalBCR > 2.0) {
      return 'Проект высокоэффективен и рекомендуется к первоочередной реализации';
    } else if (efficiency.totalBCR > 1.5) {
      return 'Проект экономически целесообразен и рекомендуется к реализации';
    } else {
      return 'Проект умеренно эффективен, рекомендуется при наличии бюджета';
    }
  } else {
    return 'Проект требует дополнительного обоснования или пересмотра параметров';
  }
}

function calculateRoadEfficiency(data: TableEfficiencyData): EfficiencyResults {
  const economicIndicators = calculateEconomicIndicators(data);
  const socialEffects = calculateSocialEffects(data);
  const totalEfficiency = calculateTotalEfficiency(economicIndicators, socialEffects, data);
  
  return {
    economicIndicators,
    socialEffects,
    totalEfficiency,
    recommendation: generateRecommendation(totalEfficiency)
  };
}

const RoadEfficiencyInterface: React.FC<RoadEfficiencyInterfaceProps> = ({
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState('input');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EfficiencyResults | null>(null);
  
  const [tableValues, setTableValues] = useState({
    startYear: '',
    roadCategory: '',
    totalCost: '',
    cost2025: '',
    cost2026: '',
    cost2027: '',
    cost2028: '',
    duration: '',
    trafficGrowth: '',
    trafficIntensity: '',
    roadLength: '',
    lightCars: '',
    trucks: '',
    buses: '',
    lightCostAfter: '',
    truckCostAfter: '',
    busCostAfter: '',
    lightCostBefore: '',
    truckCostBefore: '',
    busCostBefore: '',
    truckCapital: '',
    busCapital: '',
    busCapacity: '',
    busLoadFactor: '',
    truckCapacity: '',
    carCapacity: '',
    truckLoadFactor: '',
    timeSavings: '',
    coefficientBefore: '',
    coefficientAfter: '',
    slopeCoefficient: '',
    toxicCoefficient: '',
    accidentsBefore: '',
    accidentsAfter: '',
    calculationPeriod: '',
    toxicDamage: '',
    deathLoss: '',
    emissions: '',
    maintenanceBefore: '',
    maintenanceAfter: ''
  });

  const calculateEfficiency = () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Проверяем основные поля
      const requiredFields = ['Без заповнених полів немає сенсу виконувати розрахунок'];
      const missingFields = requiredFields.filter(field => !tableValues[field as keyof typeof tableValues]);
      
      if (missingFields.length > 0) {
        setError(`Заповніть обов'язкові поля: ${missingFields.join(', ')}`);
        setIsCalculating(false);
        return;
      }
      
      const data: TableEfficiencyData = {
        startYear: parseInt(tableValues.startYear) || 2025,
        roadCategory: parseInt(tableValues.roadCategory) || 0,
        totalCost: parseFloat(tableValues.totalCost) || 0,
        cost2025: parseFloat(tableValues.cost2025) || 0,
        cost2026: parseFloat(tableValues.cost2026) || 0,
        cost2027: parseFloat(tableValues.cost2027) || 0,
        cost2028: parseFloat(tableValues.cost2028) || 0,
        reconstructionPeriod: parseFloat(tableValues.duration) || 4,
        trafficGrowthRate: parseFloat(tableValues.trafficGrowth) || 3,
        trafficIntensity: parseFloat(tableValues.trafficIntensity) || 0,
        roadLength: parseFloat(tableValues.roadLength) || 0,
        lightVehiclesPercent: parseFloat(tableValues.lightCars) || 70,
        trucksPercent: parseFloat(tableValues.trucks) || 20,
        busesPercent: parseFloat(tableValues.buses) || 10,
        lightCostAfter: parseFloat(tableValues.lightCostAfter) || 0,
        truckCostAfter: parseFloat(tableValues.truckCostAfter) || 0,
        busCostAfter: parseFloat(tableValues.busCostAfter) || 0,
        lightCostBefore: parseFloat(tableValues.lightCostBefore) || 0,
        truckCostBefore: parseFloat(tableValues.truckCostBefore) || 0,
        busCostBefore: parseFloat(tableValues.busCostBefore) || 0,
        truckCapital: parseFloat(tableValues.truckCapital) || 0,
        busCapital: parseFloat(tableValues.busCapital) || 0,
        busCapacity: parseFloat(tableValues.busCapacity) || 45,
        busLoadFactor: parseFloat(tableValues.busLoadFactor) || 0.6,
        truckCapacity: parseFloat(tableValues.truckCapacity) || 12,
        carCapacity: parseFloat(tableValues.carCapacity) || 3,
        truckLoadFactor: parseFloat(tableValues.truckLoadFactor) || 0.7,
        timeSavings: parseFloat(tableValues.timeSavings) || 15,
        coefficientBefore: parseFloat(tableValues.coefficientBefore) || 1.2,
        coefficientAfter: parseFloat(tableValues.coefficientAfter) || 1.0,
        slopeCoefficient: parseFloat(tableValues.slopeCoefficient) || 1.04,
        toxicCoefficient: parseFloat(tableValues.toxicCoefficient) || 0.17,
        accidentsBefore: parseFloat(tableValues.accidentsBefore) || 2,
        accidentsAfter: parseFloat(tableValues.accidentsAfter) || 1,
        calculationPeriod: parseFloat(tableValues.calculationPeriod) || 20,
        toxicDamage: parseFloat(tableValues.toxicDamage) || 50,
        deathLoss: parseFloat(tableValues.deathLoss) || 2500,
        emissions: parseFloat(tableValues.emissions) || 0.12,
        maintenanceBefore: parseFloat(tableValues.maintenanceBefore) || 1.2,
        maintenanceAfter: parseFloat(tableValues.maintenanceAfter) || 0.8
      };
    
      const result = calculateRoadEfficiency(data);
      setResults(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка розрахунку');
    } finally {
      setIsCalculating(false);
    }
  };    

  const handleInputChange = (field: string, value: string) => {
    setTableValues(prev => ({ ...prev, [field]: value }));
  };

  const EfficiencyResultsView = ({ results }: { results: EfficiencyResults }) => (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Економічні показники</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">NPV</p>
              <p className="text-2xl font-bold">{results.totalEfficiency.totalNPV.toLocaleString()} тис. грн</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">BCR</p>
              <p className="text-2xl font-bold">{results.totalEfficiency.totalBCR.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Термін окупності</p>
              <p className="text-xl font-bold">{results.economicIndicators.paybackPeriod.toFixed(1)} років</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Рівень ризику</p>
              <p className={`text-xl font-bold ${
                results.totalEfficiency.riskLevel === 'low' ? 'text-green-600' :
                results.totalEfficiency.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {results.totalEfficiency.riskLevel === 'low' ? 'Низький' :
                 results.totalEfficiency.riskLevel === 'medium' ? 'Середній' : 'Високий'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg">{results.recommendation}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Соціальні ефекти</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Економія часу</p>
              <p className="text-lg font-semibold">{results.socialEffects.timeSavingsValue.toLocaleString()} грн</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Зниження аварійності</p>
              <p className="text-lg font-semibold">{results.socialEffects.accidentSavings.toLocaleString()} грн</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Екологічні вигоди</p>
              <p className="text-lg font-semibold">{results.socialEffects.environmentalSavings.toLocaleString()} грн</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Економія на утриманні</p>
              <p className="text-lg font-semibold">{results.socialEffects.maintenanceSavings.toLocaleString()} грн</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <div className="p-6 space-y-6" style={{ background: 'rgb(var(--c-bg))' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold">Визначення ефективності</h1>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Вихідні дані</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>Результати розрахунку</TabsTrigger>
          </TabsList>
          <TabsContent value="input">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="border-2 border-gray-400 overflow-hidden">
                  <div className="overflow-auto max-h-[800px]">
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
                              value={tableValues.startYear}
                              onChange={(e) => handleInputChange('startYear', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
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
                              value={tableValues.roadCategory}
                              onChange={(e) => handleInputChange('roadCategory', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent" 
                            />
                          </td>
                        </tr>

                        {/* Строка 3 */}
                        <tr>
                          <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">3</td>
                          <td className="border border-gray-400 p-2 text-xs">
                            Вартість реконструкції/капітального ремонту загальна<br />
                            Вартість реконструкції/капітального ремонту 2025<br />
                            Вартість реконструкції/капітального ремонту 2026<br />
                            Вартість реконструкції/капітального ремонту 2027<br />
                            Вартість реконструкції/капітального ремонту 2028
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              млн.грн<br />
                              млн.грн<br />
                              млн.грн<br />
                              млн.грн<br />
                              млн.грн
                            </div>
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              Кзаг<br />
                              Ка<br />
                              Ка<br />
                              Ка<br />
                              Ка
                            </div>
                          </td>
                          <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                              <Input 
                                value={tableValues.totalCost}
                                onChange={(e) => handleInputChange('totalCost', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none" 
                              />
                              <Input 
                                value={tableValues.cost2025}
                                onChange={(e) => handleInputChange('cost2025', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none" 
                              />
                              <Input 
                                value={tableValues.cost2026}
                                onChange={(e) => handleInputChange('cost2026', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none" 
                              />
                              <Input 
                                value={tableValues.cost2027}
                                onChange={(e) => handleInputChange('cost2027', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none" 
                              />
                              <Input 
                                value={tableValues.cost2028}
                                onChange={(e) => handleInputChange('cost2028', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none" 
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Строка 4 */}
                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">4</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Термін реконструкції/капітального ремонту
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">роки</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">t</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input 
                              value={tableValues.duration}
                              onChange={(e) => handleInputChange('duration', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent" 
                            />
                          </td>
                        </tr>

                        {/* Строка 5 */}
                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">5</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Приріст інтенсивності дорожнього руху
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">%</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">t</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input 
                              value={tableValues.trafficGrowth}
                              onChange={(e) => handleInputChange('trafficGrowth', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent" 
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
                              value={tableValues.trafficIntensity}
                              onChange={(e) => handleInputChange('trafficIntensity', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent" 
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
                          <td className="h-8 border border-gray-400 text-center text-xs">l</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input 
                              value={tableValues.roadLength}
                              onChange={(e) => handleInputChange('roadLength', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent" 
                            />
                          </td>
                        </tr>

                        {/* Строка 8 */}
                        <tr>
                          <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">8</td>
                          <td className="border border-gray-400 p-2 text-xs">
                            Склад руху:<br />
                            легкові автомобілі<br />
                            вантажні автомобілі (легкі)<br />
                            автобуси (важкі)
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              %<br />
                              %<br />
                              %
                            </div>
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              dл<br />
                              dв<br />
                              dт
                            </div>
                          </td>
                          <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                              <div className="h-5"></div>
                              <Input
                                value={tableValues.lightCars}
                                onChange={(e) => handleInputChange('lightCars', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                              />
                              <Input
                                value={tableValues.trucks}
                                onChange={(e) => handleInputChange('trucks', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                              />                        
                              <Input
                                value={tableValues.buses}
                                onChange={(e) => handleInputChange('buses', e.target.value)}
                                className="w-full border-0 text-xs text-center h-5 rounded-none"
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Строки 9-10 пустые */}
                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">9</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs"></td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">10</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs"></td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                        </tr>

                        {/* Строка 11 */}
                        <tr>
                          <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">11</td>
                          <td className="border border-gray-400 p-2 text-xs">
                            Середні витрати на експлуатацію транспортних засобів після<br />
                            легкові автомобілі<br />
                            вантажні автомобілі (легкі)<br />
                            автобуси (важкі)
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              грн.<br />
                              грн.<br />
                              грн.
                            </div>
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              S1л<br />
                              S1в<br />
                              S1т
                            </div>
                          </td>
                          <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                              <div className="h-5"></div>
                                <Input
                                  value={tableValues.lightCostAfter}
                                  onChange={(e) => handleInputChange('lightCostAfter', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />
                                <Input
                                  value={tableValues.truckCostAfter}
                                  onChange={(e) => handleInputChange('truckCostAfter', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />
                                <Input
                                  value={tableValues.busCostAfter}
                                  onChange={(e) => handleInputChange('busCostAfter', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />
                            </div>
                          </td>
                        </tr>

                        {/* Строка 12 */}
                        <tr>
                          <td className="bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10 align-top p-1">12</td>
                          <td className="border border-gray-400 p-2 text-xs">
                            Середні витрати на експлуатацію транспортних засобів до<br />
                            легкові автомобілі<br />
                            вантажні автомобілі (легкі)<br />
                            автобуси (важкі)
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              грн.<br />
                              грн.<br />
                              грн.
                            </div>
                          </td>
                          <td className="border border-gray-400 text-center text-xs align-top p-1">
                            <div className="leading-5">
                              -<br />
                              S0л<br />
                              S0в<br />
                              S0т
                            </div>
                          </td>
                          <td className="border border-gray-400 p-0 align-top">
                            <div className="flex flex-col">
                              <div className="h-5"></div>
                                <Input
                                  value={tableValues.lightCostBefore}
                                  onChange={(e) => handleInputChange('lightCostBefore', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />
                                <Input
                                  value={tableValues.truckCostBefore}
                                  onChange={(e) => handleInputChange('truckCostBefore', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />
                                <Input
                                  value={tableValues.busCostBefore}
                                  onChange={(e) => handleInputChange('busCostBefore', e.target.value)}
                                  className="w-full border-0 text-xs text-center h-5 rounded-none"
                                />                      
                              </div>
                          </td>
                        </tr>

                        {/* Остальные строки с правильными значениями */}
                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">13</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Питомі капіталовкладення вантажний автомобіль
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Кв</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.truckCapital}
                              onChange={(e) => handleInputChange('truckCapital', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">14</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Питомі капіталовкладення автобус
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Кт</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.busCapital}
                              onChange={(e) => handleInputChange('busCapital', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">15</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня пасажиромісткість автобуса
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">осіб</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Gт</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.busCapacity}
                              onChange={(e) => handleInputChange('busCapacity', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">16</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт використання пасажиромісткості автобуса
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">βт</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.busLoadFactor}
                              onChange={(e) => handleInputChange('busLoadFactor', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">17</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня вантажопідйомність вантажного автомобіля
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">т</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Gв</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.truckCapacity}
                              onChange={(e) => handleInputChange('truckCapacity', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">18</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Середня пасажиромісткість легкового автомобіля
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">осіб</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Gл</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.carCapacity}
                              onChange={(e) => handleInputChange('carCapacity', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">19</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт використання вантажопідйомності
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">βв</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.truckLoadFactor}
                              onChange={(e) => handleInputChange('truckLoadFactor', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">20</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Оцінка економії часу пасажирів
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Ст</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.timeSavings}
                              onChange={(e) => handleInputChange('timeSavings', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">21</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт ДО реконструкції
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">К1ст</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.coefficientBefore}
                              onChange={(e) => handleInputChange('coefficientBefore', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">22</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт ПІСЛЯ реконструкції
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">К1сн</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.coefficientAfter}
                              onChange={(e) => handleInputChange('coefficientAfter', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">23</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт поздовжнього похилу
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">К2</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.slopeCoefficient}
                              onChange={(e) => handleInputChange('slopeCoefficient', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">24</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Коефіцієнт токсичності
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">К3</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.toxicCoefficient}
                              onChange={(e) => handleInputChange('toxicCoefficient', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">25</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Кількість ДТП ДО реконструкції
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">dт</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.accidentsBefore}
                              onChange={(e) => handleInputChange('accidentsBefore', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">26</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Кількість ДТП ПІСЛЯ реконструкції
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">dн</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.accidentsAfter}
                              onChange={(e) => handleInputChange('accidentsAfter', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">27</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Розрахунковий період
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">роки</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">п</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.calculationPeriod}
                              onChange={(e) => handleInputChange('calculationPeriod', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">28</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Вартість шкоди від токсичних речовин
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">δт</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.toxicDamage}
                              onChange={(e) => handleInputChange('toxicDamage', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">29</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Втрати від смертельного ДТП
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">тис.грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">Пвтр</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.deathLoss}
                              onChange={(e) => handleInputChange('deathLoss', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">30</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Об'єм викидів автомобілями
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">кг/км</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">qі</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.emissions}
                              onChange={(e) => handleInputChange('emissions', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">31</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Витрати на утримання ДО
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">млн.грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.maintenanceBefore}
                              onChange={(e) => handleInputChange('maintenanceBefore', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="h-8 bg-gray-200 border border-gray-400 text-center text-xs font-bold sticky left-0 z-10">32</td>
                          <td className="h-8 border border-gray-400 p-2 text-xs">
                            Витрати на утримання ПІСЛЯ
                          </td>
                          <td className="h-8 border border-gray-400 text-center text-xs">млн.грн</td>
                          <td className="h-8 border border-gray-400 text-center text-xs">-</td>
                          <td className="h-8 border border-gray-400 p-0">
                            <Input
                              value={tableValues.maintenanceAfter}
                              onChange={(e) => handleInputChange('maintenanceAfter', e.target.value)}
                              className="w-full h-full border-0 text-xs text-center bg-transparent"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Информация о таблице */}
                <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2 p-4">
                  <div className="flex flex-wrap gap-4">
                    <span>Загалом полів: <strong>32</strong></span>
                    <span>Заповнено: <strong>{Object.values(tableValues).filter(v => v !== '').length}</strong></span>
                    <span>Потребує уваги: <strong>{32 - Object.values(tableValues).filter(v => v !== '').length}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="glass-card">
              <CardContent>
                {results && <EfficiencyResultsView results={results} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <Button 
        onClick={calculateEfficiency} 
        disabled={isCalculating}
        className="glass-button glass-button--primary text-black"
      >
        {isCalculating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin text-black" />
            Розраховується...
          </>
        ) : (
          <>
            <Calculator className="h-4 w-4 mr-2 text-black" />
            Розрахувати
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-4">
        <span>Загалом полів: <strong>32</strong></span>
        <span>Заповнено: <strong>{Object.values(tableValues).filter(v => v !== '').length}</strong></span>
        <span>Потребує уваги: <strong>{32 - Object.values(tableValues).filter(v => v !== '').length}</strong></span>
        {results && <span className="text-green-600">Розрахунок виконано ✓</span>}
      </div>

      <div className="flex justify-between pt-6">
        <Button className="glass-button text-black">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!results}
          className="glass-button glass-button--primary text-black"
        >
          Далі
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default RoadEfficiencyInterface;