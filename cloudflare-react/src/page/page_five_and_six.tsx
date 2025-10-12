import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

const ENPVInputTable: React.FC = () => {
  const [roadSections] = useState<RoadSection[]>([
    { id: '1', name: 'М-06 Київ-Чоп (км 0-25)', category: 1, length: 25 },
    { id: '2', name: 'Н-03 Житомир-Чернівці (км 45-78)', category: 2, length: 33 },
    { id: '3', name: 'Р-15 Львів-Тернопіль (км 12-34)', category: 3, length: 22 },
    { id: '4', name: 'Т-23-05 Місцева дорога (км 0-15)', category: 4, length: 15 },
  ]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [savedData, setSavedData] = useState<Map<string, ENPVInputData>>(new Map());
  const [showSuccess, setShowSuccess] = useState(false);

  const getEmptyData = (section: RoadSection): ENPVInputData => ({
    sectionId: section.id,
    sectionName: section.name,
    workStartYear: new Date().getFullYear(),
    roadCategory: section.category.toString(),
    totalReconstructionCost: 0,
    termOfServiceLife: 15,
    capitalRepairPeriod: 8,
    currentRepairPeriod: 3,
    constructionPeriod: 2,
    discountRate: 5,
    averageAnnualCapitalInvestments: 0,
    capitalInvestmentsDuringConstruction: 0,
    capitalInvestmentsInGarage1: 0,
    capitalInvestmentsInGarageAuto: 0,
    averagePassengerCapacityBus: 0,
    passengerUsageCoefficient: 0,
    averageLightVehicleCapacity: 0,
    lightVehicleUsageCoefficient: 0,
    averageTravelTimeReduction: 0,
    trafficFlowIntensityCoefficient: 0,
    postReconstructionIntensityCoefficient: 0,
    postReconstructionIntensityPISDCoefficient: 0,
    trafficVolume1Percent: 1.00,
    trafficVolume13Percent: 1.02,
    toxicityReductionCoefficient: 0,
    averageAccidentsBeforeRepair: 0,
    averageAccidentsAfterRepair: 0,
    calculatedYearCount: 15,
    averageSchoolAge: 0,
    averageDTIAge: 0,
    vehicleCategoryAgeQ1: '',
    maintenanceCostsBefore: 0,
    maintenanceCostsAfter: 0,
  });

  const [currentData, setCurrentData] = useState<ENPVInputData | null>(null);

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = roadSections.find(s => s.id === sectionId);
    if (section) {
      const existingData = savedData.get(sectionId);
      setCurrentData(existingData || getEmptyData(section));
    }
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

  return (
    <div className="min-h-screen bg-slate-50 p-3">
      <div className="w-full space-y-3">
        {/* Заголовок */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-xl">
              Визначення ефективності реконструкції/капітального ремонту автомобільних доріг
            </CardTitle>
            <CardDescription>Вихідні дані</CardDescription>
          </CardHeader>
        </Card>

        {/* Выбор объекта */}
        <Card className="border-2 border-yellow-400 bg-yellow-50">
          <CardContent className="py-3">
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              Комірка де можна зі списку обрати необхідний об'єкт по якому заповнюється вихідна інформація
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

        {/* Таблица */}
        {currentData && (
          <div className="glass-card">
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

                {/* Кнопка сохранения */}
                <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4">
                <Button
                    onClick={handleSave}
                    disabled={!selectedSectionId}
                    className="w-full h-10 text-sm bg-green-600 hover:bg-green-700"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Зберегти
                </Button>
            </div>
          </div>
        )}

        {/* Уведомление об успешном сохранении */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 z-50">
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
              <AlertCircle className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Оберіть об'єкт для заповнення даних
              </h3>
              <p className="text-slate-500">
                Виберіть об'єкт зі списку вище для початку заповнення вихідних даних ENPV
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ENPVInputTable;