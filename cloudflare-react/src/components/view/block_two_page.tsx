import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader,TableRow,} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger,SelectValue,} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, X, CheckCircle, Plus, Download } from "lucide-react";

// Import types from calculations.ts
import type { 
  RegionCoefficients,
  RegionRoads,
  PriceIndexes
} from '../../modules/block_two';

// Import calculation functions - тільки ті, які дійсно використовуються
import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  getRegionCoefficients,
  generateSampleRegionData,
  calculateTotalFunding,
} from '../../modules/block_two';

// Импортируем SheetJS
import * as XLSX from 'xlsx';

const Block2MaintenanceCalculator: React.FC = () => {
  // State for state road calculation (Block 2.1)
  const [stateRoadBaseRate, setStateRoadBaseRate] = useState<number>(604.761);
  const [stateInflationIndexes, setStateInflationIndexes] = useState<number[]>([10]);
  const [stateRoadRates, setStateRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>({
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0
  });

  // State for local road calculation (Block 2.2)
  const [localRoadBaseRate, setLocalRoadBaseRate] = useState<number>(360.544);
  const [localInflationIndexes, setLocalInflationIndexes] = useState<number[]>([10]);
  const [localRoadRates, setLocalRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>({
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0
  });

  // State for funding calculation (Block 2.3-2.8)
  const [selectedRegion, setSelectedRegion] = useState<string>("Вінницька");
  const [regionCoefficients, setRegionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
  const [regionData, setRegionData] = useState<RegionRoads>(generateSampleRegionData("Вінницька"));
  const [fundingResults, setFundingResults] = useState<{
    stateFunding: number;
    localFunding: number;
    totalFunding: number;
    details: {
      stateRoadLength: number;
      localRoadLength: number;
      stateRoadBaseRate: number;
      localRoadBaseRate: number;
      appliedCoefficients: Record<string, number>;
    };
  }>({
    stateFunding: 0,
    localFunding: 0,
    totalFunding: 0,
    details: {
      stateRoadLength: 0,
      localRoadLength: 0,
      stateRoadBaseRate: 0,
      localRoadBaseRate: 0,
      appliedCoefficients: {
        mountainous: 0,
        operatingConditions: 0,
        stateServiceCoefficient: 1.16,
        trafficIntensityState: 0,
        trafficIntensityLocal: 0,
        europeanRoad: 0,
        borderCrossing: 0,
        lighting: 0,
        repair: 0,
        criticalInfrastructure: 0
      }
    }
  });

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Initialize calculations on component mount
  useEffect(() => {
    calculateStateRoadRates();
    calculateLocalRoadRates();
  }, []);

  // Add inflation index for state roads
  const addStateInflationIndex = () => {
    setStateInflationIndexes([...stateInflationIndexes, 0]);
  };

  // Remove inflation index for state roads
  const removeStateInflationIndex = (index: number) => {
    if (stateInflationIndexes.length > 1) {
      const newIndexes = [...stateInflationIndexes];
      newIndexes.splice(index, 1);
      setStateInflationIndexes(newIndexes);
    }
  };

  // Add inflation index for local roads
  const addLocalInflationIndex = () => {
    setLocalInflationIndexes([...localInflationIndexes, 0]);
  };

  // Remove inflation index for local roads
  const removeLocalInflationIndex = (index: number) => {
    if (localInflationIndexes.length > 1) {
      const newIndexes = [...localInflationIndexes];
      newIndexes.splice(index, 1);
      setLocalInflationIndexes(newIndexes);
    }
  };

  // Handle state inflation index change
  const handleStateInflationChange = (index: number, value: string) => {
    const newIndexes = [...stateInflationIndexes];
    newIndexes[index] = parseFloat(value) || 0;
    setStateInflationIndexes(newIndexes);
  };

  // Handle local inflation index change
  const handleLocalInflationChange = (index: number, value: string) => {
    const newIndexes = [...localInflationIndexes];
    newIndexes[index] = parseFloat(value) || 0;
    setLocalInflationIndexes(newIndexes);
  };

  // Calculate cumulative inflation index
  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => {
      return acc * (1 + curr / 100);
    }, 1);
  };

  // Calculate state road rates
  const calculateStateRoadRates = () => {
    // Calculate cumulative inflation index
    const totalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);

    // Calculate rates for each category
    const category1 = calculateStateRoadMaintenanceRate(1, totalInflationIndex);
    const category2 = calculateStateRoadMaintenanceRate(2, totalInflationIndex);
    const category3 = calculateStateRoadMaintenanceRate(3, totalInflationIndex);
    const category4 = calculateStateRoadMaintenanceRate(4, totalInflationIndex);
    const category5 = calculateStateRoadMaintenanceRate(5, totalInflationIndex);

    setStateRoadRates({
      category1,
      category2,
      category3,
      category4,
      category5
    });
  };

  // Calculate local road rates
  const calculateLocalRoadRates = () => {
    // Calculate cumulative inflation index
    const totalInflationIndex = calculateCumulativeInflationIndex(localInflationIndexes);

    // Calculate rates for each category
    const category1 = calculateLocalRoadMaintenanceRate(1, totalInflationIndex);
    const category2 = calculateLocalRoadMaintenanceRate(2, totalInflationIndex);
    const category3 = calculateLocalRoadMaintenanceRate(3, totalInflationIndex);
    const category4 = calculateLocalRoadMaintenanceRate(4, totalInflationIndex);
    const category5 = calculateLocalRoadMaintenanceRate(5, totalInflationIndex);

    setLocalRoadRates({
      category1,
      category2,
      category3,
      category4,
      category5
    });
  };

  // Handle region selection change
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    const newRegionData = generateSampleRegionData(value);
    setRegionData(newRegionData);
  };

  // Calculate funding
  const calculateFunding = () => {
    const selectedRegionCoeff = regionCoefficients.find(r => r.regionalName === selectedRegion) || regionCoefficients[0];
    
    // Calculate cumulative inflation index for state roads (using the same for both for simplicity)
    const totalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);

    const priceIndexes: PriceIndexes = {
      inflationIndex: totalInflationIndex
    };

    // Calculate total funding - тут всі коефіцієнти розраховуються всередині функції
    const results = calculateTotalFunding(regionData, selectedRegionCoeff, priceIndexes);
    setFundingResults(results);
    
    // Clear any previous save status message
    setSaveStatus("");
  };
  
  // Handle export to Excel
  const handleExport = () => {
    try {
      // Создаем новую рабочую книгу
      const workbook = XLSX.utils.book_new();
      
      // Создаем лист с результатами расчетов
      const wsData = [
        ['Результати розрахунку експлуатаційного утримання доріг'],
        ['Область:', selectedRegion],
        ['Дата розрахунку:', new Date().toLocaleDateString('uk-UA')],
        [],
        ['1. НОРМАТИВИ ДЛЯ ДОРІГ ДЕРЖАВНОГО ЗНАЧЕННЯ'],
        ['Категорія', 'Норматив (тис. грн/км)'],
        ['I категорія', stateRoadRates.category1.toFixed(2)],
        ['II категорія', stateRoadRates.category2.toFixed(2)],
        ['III категорія', stateRoadRates.category3.toFixed(2)],
        ['IV категорія', stateRoadRates.category4.toFixed(2)],
        ['V категорія', stateRoadRates.category5.toFixed(2)],
        [],
        ['2. НОРМАТИВИ ДЛЯ ДОРІГ МІСЦЕВОГО ЗНАЧЕННЯ'],
        ['Категорія', 'Норматив (тис. грн/км)'],
        ['I категорія', localRoadRates.category1.toFixed(2)],
        ['II категорія', localRoadRates.category2.toFixed(2)],
        ['III категорія', localRoadRates.category3.toFixed(2)],
        ['IV категорія', localRoadRates.category4.toFixed(2)],
        ['V категорія', localRoadRates.category5.toFixed(2)],
        [],
        ['3. КОЕФІЦІЄНТИ РОЗРАХУНКУ'],
        ['Коефіцієнт', 'Значення'],
        ['Kд (обслуговування доріг)', fundingResults.details.appliedCoefficients.stateServiceCoefficient.toFixed(2)],
        ['Kг (гірська місцевість)', fundingResults.details.appliedCoefficients.mountainous.toFixed(2)],
        ['Kуе (умови експлуатації)', fundingResults.details.appliedCoefficients.operatingConditions.toFixed(2)],
        ['Kінт.д (інтенсивність держзначення)', fundingResults.details.appliedCoefficients.trafficIntensityState.toFixed(2)],
        ['Kінт.м (інтенсивність місц.)', fundingResults.details.appliedCoefficients.trafficIntensityLocal.toFixed(2)],
        ['Kе.д (дороги з індексом Е)', fundingResults.details.appliedCoefficients.europeanRoad.toFixed(2)],
        ['Kмпп.д (пункти пропуску)', fundingResults.details.appliedCoefficients.borderCrossing.toFixed(2)],
        ['Kосв (освітлення)', fundingResults.details.appliedCoefficients.lighting.toFixed(2)],
        ['Kрем (нещодавній ремонт)', fundingResults.details.appliedCoefficients.repair.toFixed(2)],
        ['Kкр.і (критич. інфраструктура)', fundingResults.details.appliedCoefficients.criticalInfrastructure.toFixed(2)],
        [],
        ['4. РЕЗУЛЬТАТИ РОЗРАХУНКУ ФІНАНСУВАННЯ'],
        ['Показник', 'Значення'],
        ['Протяжність доріг державного значення (км)', fundingResults.details.stateRoadLength.toFixed(2)],
        ['Протяжність доріг місцевого значення (км)', fundingResults.details.localRoadLength.toFixed(2)],
        ['Фінансування доріг державного значення (тис. грн)', fundingResults.stateFunding.toFixed(2)],
        ['Фінансування доріг місцевого значення (тис. грн)', fundingResults.localFunding.toFixed(2)],
        ['ЗАГАЛЬНИЙ ОБСЯГ ФІНАНСУВАННЯ (тис. грн)', fundingResults.totalFunding.toFixed(2)],
        [],
        ['5. ПОТРЕБА У ФІНАНСУВАННІ ЗА КАТЕГОРІЯМИ'],
        ['Категорія', 'Держзначення (тис. грн)', 'Місцевого значення (тис. грн)']
      ];
      
      // Добавляем данные по категориям
      for (let category = 1; category <= 5; category++) {
        const funding = calculateCategoryFunding(category);
        wsData.push([
          `Категорія ${category}`,
          funding.stateFunding.toFixed(2),
          funding.localFunding.toFixed(2)
        ]);
      }
      
      wsData.push(
        [],
        ['6. ДАНІ ПО ДОРОЖНІЙ МЕРЕЖІ РЕГІОНУ'],
        ['Категорія', 'Держзначення всього (км)', 'Держзначення інтенс.>15000', 'Держзначення з індексом Е', 'Місцевого всього (км)', 'Місцевого інтенс.>15000', 'Місцевого з освітленням']
      );
      
      // Добавляем данные по дорожной сети
      for (let category = 1; category <= 5; category++) {
        wsData.push([
          `Категорія ${category}`,
          regionData.roadSections
            .filter(s => s.stateImportance && s.category === category)
            .reduce((sum, s) => sum + s.length, 0).toString(),
          regionData.roadSections
            .filter(s => s.stateImportance && s.category === category && s.trafficIntensity > 15000)
            .reduce((sum, s) => sum + s.length, 0).toString(),
          regionData.roadSections
            .filter(s => s.stateImportance && s.category === category && s.hasEuropeanStatus)
            .reduce((sum, s) => sum + s.length, 0).toString(),
          regionData.roadSections
            .filter(s => !s.stateImportance && s.category === category)
            .reduce((sum, s) => sum + s.length, 0).toString(),
          regionData.roadSections
            .filter(s => !s.stateImportance && s.category === category && s.trafficIntensity > 15000)
            .reduce((sum, s) => sum + s.length, 0).toString(),
          regionData.roadSections
            .filter(s => !s.stateImportance && s.category === category && s.hasLighting)
            .reduce((sum, s) => sum + s.length, 0).toString(),
        ]);
      }
      
      // Создаем лист
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Устанавливаем ширину колонок
      ws['!cols'] = [
        { width: 40 }, // Первая колонка шире для названий
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 20 }
      ];
      
      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(workbook, ws, 'Результати розрахунку');
      
      // Создаем отдельный лист с детальными данными по индексам инфляции
      const inflationData = [
        ['ІНДЕКСИ ІНФЛЯЦІЇ'],
        [],
        ['Індекси інфляції для доріг державного значення:'],
        ['№', 'Індекс (%)', 'Коефіцієнт']
      ];
      
      stateInflationIndexes.forEach((index, i) => {
        inflationData.push([(i + 1).toString(), index.toString(), (1 + index / 100).toFixed(4)]);
      });
      
      inflationData.push(
        [],
        ['Сукупний індекс інфляції (держ.):', calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)],
        [],
        ['Індекси інфляції для доріг місцевого значення:'],
        ['№', 'Індекс (%)', 'Коефіцієнт']
      );
      
      localInflationIndexes.forEach((index, i) => {
        inflationData.push([(i + 1).toString(), index.toString(), (1 + index / 100).toFixed(4)]);
      });
      
      inflationData.push(
        [],
        ['Сукупний індекс інфляції (місц.):', calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)]
      );
      
      const wsInflation = XLSX.utils.aoa_to_sheet(inflationData);
      wsInflation['!cols'] = [{ width: 15 }, { width: 15 }, { width: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsInflation, 'Індекси інфляції');
      
      // Создаем лист с базовыми данными (как в оригинальном шаблоне)
      const baseData = [
        ['Розподіл витрат на експлуатаційне утримання (ЕУ)'],
        ['Область: ' + selectedRegion],
        [],
        ['Базові нормативи (ціни 2023 року):'],
        ['Державні дороги, II категорія:', stateRoadBaseRate + ' тис. грн/км'],
        ['Місцеві дороги, II категорія:', localRoadBaseRate + ' тис. грн/км'],
        [],
        ['Індекси інфляції (державні дороги):'],
        ...stateInflationIndexes.map((index, i) => [`Індекс ${i+1}:`, index + '%']),
        ['Сукупний індекс:', calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)],
        [],
        ['Індекси інфляції (місцеві дороги):'],
        ...localInflationIndexes.map((index, i) => [`Індекс ${i+1}:`, index + '%']),
        ['Сукупний індекс:', calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)]
      ];
      
      const wsBase = XLSX.utils.aoa_to_sheet(baseData);
      wsBase['!cols'] = [{ width: 30 }, { width: 20 }];
      XLSX.utils.book_append_sheet(workbook, wsBase, 'Базові дані');
      
      // Генерируем файл и скачиваем
      const fileName = `Розрахунок_ЕУ_${selectedRegion}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setSaveStatus("Excel файл успішно згенеровано та завантажено");
      setTimeout(() => setSaveStatus(""), 3000);
      
    } catch (error) {
      console.error('Помилка при експорті:', error);
      setSaveStatus("Помилка при експорті в Excel");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };
  
  // Handle save results
  const handleSaveResults = () => {
    // Вместо localStorage используем JSON экспорт
    try {
      const dataToSave = {
        region: selectedRegion,
        date: new Date().toISOString(),
        stateRoadRates,
        localRoadRates,
        fundingResults,
        stateInflationIndexes,
        localInflationIndexes,
        regionData
      };
      
      const dataStr = JSON.stringify(dataToSave, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Дані_розрахунку_${selectedRegion}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSaveStatus("Дані успішно збережено у JSON файл");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      setSaveStatus("Помилка при збереженні даних");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  // Calculate category-specific funding
  const calculateCategoryFunding = (category: number) => {
    const stateRoadSections = regionData.roadSections.filter(s => s.stateImportance && s.category === category);
    const localRoadSections = regionData.roadSections.filter(s => !s.stateImportance && s.category === category);
    
    const stateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);
    const localRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);
    
    const stateFunding = stateRoadRates[`category${category}` as keyof typeof stateRoadRates] * stateRoadLength;
    const localFunding = localRoadRates[`category${category}` as keyof typeof localRoadRates] * localRoadLength;
    
    return { stateFunding, localFunding };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Блок 2: Експлуатаційне утримання доріг</h1>
      <p className="text-gray-600 mb-6">Визначення загального обсягу бюджетних коштів на фінансове забезпечення заходів з експлуатаційного утримання</p>
      
      <Tabs defaultValue="step1" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step1">Етап 2.1: Дороги державного значення</TabsTrigger>
          <TabsTrigger value="step2">Етап 2.2: Дороги місцевого значення</TabsTrigger>
          <TabsTrigger value="step3">Етап 2.3-2.8: Розрахунок обсягу коштів</TabsTrigger>
        </TabsList>
        
        {/* Stage 2.1: State Road Norms */}
        <TabsContent value="step1">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Етап 2.1 Блоку 2</CardTitle>
              <CardDescription>
                Приведений норматив річних фінансових витрат на експлуатаційне утримання автомобільних доріг державного значення
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="stateRoadBaseRate">
                      Встановлений норматив річних фінансових витрат на ЕУ 1 км дороги II кат. державного значення в цінах 2023 року
                    </Label>
                    <Input
                      id="stateRoadBaseRate"
                      type="number"
                      value={stateRoadBaseRate}
                      onChange={(e) => setStateRoadBaseRate(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Індекси інфляції</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addStateInflationIndex}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Додати індекс
                      </Button>
                    </div>
                    <div className="grid gap-2 mt-2">
                      {stateInflationIndexes.map((index, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="min-w-[100px]">{`Індекс ${i+1}:`}</Label>
                          <Input
                            type="number"
                            value={index}
                            onChange={(e) => handleStateInflationChange(i, e.target.value)}
                          />
                          <span>%</span>
                          {stateInflationIndexes.length > 1 && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStateInflationIndex(i)}
                              className="ml-2 p-1 h-auto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateStateRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  Розрахувати
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category1.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія II</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category2.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія III</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category3.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category4.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія V</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category5.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-blue-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Методика розрахунку</AlertTitle>
                  <AlertDescription>
                    Після того як користувач ввів вищезазначені дані, програма рахує норматив відповідно до п.3.2 Методики. 
                    Коефіцієнти диференціювання залежно від категорії наведені в Додатку 3 Методики.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stage 2.2: Local Road Norms */}
        <TabsContent value="step2">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Етап 2.2 Блоку 2</CardTitle>
              <CardDescription>
                Приведений норматив річних фінансових витрат на експлуатаційне утримання автомобільних доріг місцевого значення
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="localRoadBaseRate">
                      Встановлений норматив річних фінансових витрат на ЕУ 1 км дороги II кат. місцевого значення в цінах 2023 року
                    </Label>
                    <Input
                      id="localRoadBaseRate"
                      type="number"
                      value={localRoadBaseRate}
                      onChange={(e) => setLocalRoadBaseRate(parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Індекси інфляції</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addLocalInflationIndex}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Додати індекс
                      </Button>
                    </div>
                    <div className="grid gap-2 mt-2">
                      {localInflationIndexes.map((index, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="min-w-[100px]">{`Індекс ${i+1}:`}</Label>
                          <Input
                            type="number"
                            value={index}
                            onChange={(e) => handleLocalInflationChange(i, e.target.value)}
                          />
                          <span>%</span>
                          {localInflationIndexes.length > 1 && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLocalInflationIndex(i)}
                              className="ml-2 p-1 h-auto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateLocalRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  Розрахувати
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category1.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія II</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category2.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія III</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category3.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category4.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія V</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category5.toFixed(2)} тис. грн.
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-red-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="text-red-500 font-bold">ВАЖЛИВО!!!</AlertTitle>
                  <AlertDescription>
                    Приведені нормативи необхідні для подальших розрахунків обсягу коштів на експлуатаційне утримання.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stage 2.3-2.8: Funding Calculation */}
        <TabsContent value="step3">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Етап 2.3-2.8 Блоку 2</CardTitle>
              <CardDescription>
                Визначення обсягу коштів на експлуатаційне утримання автомобільних доріг державного та місцевого значення
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region-select">Оберіть область:</Label>
                    <Select 
                      value={selectedRegion}
                      onValueChange={handleRegionChange}
                    >
                      <SelectTrigger id="region-select" className="mt-2">
                        <SelectValue placeholder="Оберіть область" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionCoefficients.map((region) => (
                          <SelectItem key={region.regionalName} value={region.regionalName}>
                            {region.regionalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="self-end">
                    <Button 
                      onClick={calculateFunding}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Розрахувати коефіцієнти та обсяг коштів
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Коефіцієнти розрахунку</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Коефіцієнт</TableHead>
                          <TableHead className="text-right">Значення</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>K<sub>д</sub> (обслуговування доріг)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.stateServiceCoefficient.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sub>г</sub> (гірська місцевість)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.mountainous.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sub>уе</sub> (умови експлуатації)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.operatingConditions.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>інт.д</sub> (інтенсивність держзначення)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.trafficIntensityState.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>інт.м</sub> (інтенсивність місц.)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.trafficIntensityLocal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>е.д</sub> (дороги з індексом Е)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.europeanRoad.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>мпп.д</sub> (пункти пропуску)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.borderCrossing.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>осв</sub> (освітлення)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.lighting.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>рем</sub> (нещодавній ремонт)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.repair.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>кр.i</sub> (критич. інфраструктура)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.criticalInfrastructure.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-4">Результати розрахунку</h3>
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Протяжність доріг державного значення:</p>
                            <p className="text-lg font-bold">{fundingResults.details.stateRoadLength.toFixed(2)} км</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Протяжність доріг місцевого значення:</p>
                            <p className="text-lg font-bold">{fundingResults.details.localRoadLength.toFixed(2)} км</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-sm text-gray-600">Фінансування доріг державного значення:</p>
                            <p className="text-xl font-bold text-green-700">{fundingResults.stateFunding.toFixed(2)} тис. грн.</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Фінансування доріг місцевого значення:</p>
                            <p className="text-xl font-bold text-green-700">{fundingResults.localFunding.toFixed(2)} тис. грн.</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-sm text-gray-600">Загальний обсяг фінансування:</p>
                            <p className="text-2xl font-bold text-green-700">{fundingResults.totalFunding.toFixed(2)} тис. грн.</p>
                          </div>
                          
                          {saveStatus && (
                            <div className="p-2 bg-green-100 text-green-800 rounded flex items-center mt-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {saveStatus}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="mt-6">
                      <h3 className="text-lg font-bold mb-2">Потреба у фінансуванні за категоріями</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Категорія</TableHead>
                            <TableHead className="text-right">Держзначення (тис. грн.)</TableHead>
                            <TableHead className="text-right">Місцевого значення (тис. грн.)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map(category => {
                            const funding = calculateCategoryFunding(category);
                            return (
                              <TableRow key={category}>
                                <TableCell>Категорія {category}</TableCell>
                                <TableCell className="text-right">{funding.stateFunding.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{funding.localFunding.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Дані по дорожній мережі регіону</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2}>Категорія</TableHead>
                          <TableHead colSpan={3}>Протяжність доріг держзначення (км)</TableHead>
                          <TableHead colSpan={3}>Протяжність доріг місцевого значення (км)</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead>Усього</TableHead>
                          <TableHead>з інтенсивністю {'>'} 15000</TableHead>
                          <TableHead>з індексом Е</TableHead>
                          <TableHead>Усього</TableHead>
                          <TableHead>з інтенсивністю {'>'} 15000</TableHead>
                          <TableHead>з освітленням</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[1, 2, 3, 4, 5].map(category => (
                          <TableRow key={category}>
                            <TableCell>Категорія {category}</TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => s.stateImportance && s.category === category)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => s.stateImportance && s.category === category && s.trafficIntensity > 15000)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => s.stateImportance && s.category === category && s.hasEuropeanStatus)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => !s.stateImportance && s.category === category)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => !s.stateImportance && s.category === category && s.trafficIntensity > 15000)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                            <TableCell>
                              {regionData.roadSections
                                .filter(s => !s.stateImportance && s.category === category && s.hasLighting)
                                .reduce((sum, s) => sum + s.length, 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell>Підсумок</TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => s.stateImportance)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => s.stateImportance && s.trafficIntensity > 15000)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => s.stateImportance && s.hasEuropeanStatus)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => !s.stateImportance)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => !s.stateImportance && s.trafficIntensity > 15000)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                          <TableCell>
                            {regionData.roadSections
                              .filter(s => !s.stateImportance && s.hasLighting)
                              .reduce((sum, s) => sum + s.length, 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-red-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="text-red-500 font-bold">ВАЖЛИВО!!!</AlertTitle>
                  <AlertDescription>
                    Після завершення розрахунків програма запам'ятовує загальний результат фінансування для подальших розрахунків у Блоці 3.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end mt-4 space-x-4">
                  <Button 
                    variant="outline"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Експорт результатів в Excel
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveResults}
                  >
                    Зберегти результати
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Block2MaintenanceCalculator;