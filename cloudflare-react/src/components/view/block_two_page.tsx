import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, X, CheckCircle, Plus, Download, Calculator } from "lucide-react";

// Import types from calculations.ts
import type { 
  RegionCoefficients,
  RegionRoads,
  PriceIndexes
} from '../../modules/block_two';

// Import calculation functions
import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  getRegionCoefficients,
  generateSampleRegionData,
  calculateTotalFunding,
  calculateTrafficIntensityCoefficient,
  calculateEuropeanRoadCoefficient,
  calculateBorderCrossingCoefficient,
  calculateLightingCoefficient,
  calculateRepairCoefficient,
  calculateCriticalInfrastructureCoefficient,
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
  const [selectedRegion, setSelectedRegion] = useState<string>("Винницкая");
  const [regionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
  const [regionData, setRegionData] = useState<RegionRoads>(generateSampleRegionData("Винницкая"));
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

  // State for detailed coefficient breakdown
  const [detailedCoefficients, setDetailedCoefficients] = useState<{
    state: {
      trafficIntensity: number;
      europeanRoad: number;
      borderCrossing: number;
      lighting: number;
      repair: number;
    };
    local: {
      trafficIntensity: number;
    };
    common: {
      mountainous: number;
      operatingConditions: number;
      criticalInfrastructure: number;
    };
  }>({
    state: {
      trafficIntensity: 1,
      europeanRoad: 1,
      borderCrossing: 1,
      lighting: 1,
      repair: 1,
    },
    local: {
      trafficIntensity: 1,
    },
    common: {
      mountainous: 1,
      operatingConditions: 1,
      criticalInfrastructure: 1,
    }
  });

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Initialize calculations on component mount
  useEffect(() => {
    calculateStateRoadRates();
    calculateLocalRoadRates();
  }, [stateRoadBaseRate, stateInflationIndexes]);

  useEffect(() => {
    calculateLocalRoadRates();
  }, [localRoadBaseRate, localInflationIndexes]);

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

    // Calculate rates for each category using correct base rate
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

    // Calculate rates for each category using correct base rate
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

  // Calculate detailed coefficients
  const calculateDetailedCoefficients = () => {
    const selectedRegionCoeff = regionCoefficients.find(r => r.regionalName === selectedRegion) || regionCoefficients[0];
    
    const stateRoadSections = regionData.roadSections.filter(section => section.stateImportance);
    const localRoadSections = regionData.roadSections.filter(section => !section.stateImportance);
    
    const totalStateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);
    const totalLocalRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);

    const newDetailedCoefficients = {
      state: {
        trafficIntensity: calculateTrafficIntensityCoefficient(stateRoadSections, totalStateRoadLength),
        europeanRoad: calculateEuropeanRoadCoefficient(stateRoadSections, totalStateRoadLength),
        borderCrossing: calculateBorderCrossingCoefficient(stateRoadSections, totalStateRoadLength),
        lighting: calculateLightingCoefficient(stateRoadSections, totalStateRoadLength),
        repair: calculateRepairCoefficient(stateRoadSections, totalStateRoadLength),
      },
      local: {
        trafficIntensity: calculateTrafficIntensityCoefficient(localRoadSections, totalLocalRoadLength),
      },
      common: {
        mountainous: selectedRegionCoeff.mountainous,
        operatingConditions: selectedRegionCoeff.operatingConditions,
        criticalInfrastructure: calculateCriticalInfrastructureCoefficient(regionData.criticalInfrastructureCount),
      }
    };

    setDetailedCoefficients(newDetailedCoefficients);
    return newDetailedCoefficients;
  };

  // Calculate funding
  const calculateFunding = () => {
    const selectedRegionCoeff = regionCoefficients.find(r => r.regionalName === selectedRegion) || regionCoefficients[0];
    
    // Calculate cumulative inflation index for state roads
    const stateTotalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);

    const priceIndexes: PriceIndexes = {
      inflationIndex: stateTotalInflationIndex // Используем индекс государственных дорог для общих расчетов
    };

    // Calculate detailed coefficients first
    calculateDetailedCoefficients();

    // Calculate total funding using the module functions
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
        ['1. БАЗОВІ НОРМАТИВИ'],
        ['Базовий норматив (держ., ціни 2023):', stateRoadBaseRate + ' тис. грн/км'],
        ['Базовий норматив (місц., ціни 2023):', localRoadBaseRate + ' тис. грн/км'],
        ['Індекс інфляції (держ.):', calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)],
        ['Індекс інфляції (місц.):', calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)],
        [],
        ['2. НОРМАТИВИ ДЛЯ ДОРІГ ДЕРЖАВНОГО ЗНАЧЕННЯ'],
        ['Категорія', 'Норматив (тис. грн/км)'],
        ['I категорія', stateRoadRates.category1.toFixed(2)],
        ['II категорія', stateRoadRates.category2.toFixed(2)],
        ['III категорія', stateRoadRates.category3.toFixed(2)],
        ['IV категорія', stateRoadRates.category4.toFixed(2)],
        ['V категорія', stateRoadRates.category5.toFixed(2)],
        [],
        ['3. НОРМАТИВИ ДЛЯ ДОРІГ МІСЦЕВОГО ЗНАЧЕННЯ'],
        ['Категорія', 'Норматив (тис. грн/км)'],
        ['I категорія', localRoadRates.category1.toFixed(2)],
        ['II категорія', localRoadRates.category2.toFixed(2)],
        ['III категорія', localRoadRates.category3.toFixed(2)],
        ['IV категорія', localRoadRates.category4.toFixed(2)],
        ['V категорія', localRoadRates.category5.toFixed(2)],
        [],
        ['4. ДЕТАЛЬНІ КОЕФІЦІЄНТИ РОЗРАХУНКУ'],
        ['Коефіцієнт', 'Держ. дороги', 'Місц. дороги'],
        ['Kг (гірська місцевість)', detailedCoefficients.common.mountainous.toFixed(4), detailedCoefficients.common.mountainous.toFixed(4)],
        ['Kуе (умови експлуатації)', detailedCoefficients.common.operatingConditions.toFixed(4), detailedCoefficients.common.operatingConditions.toFixed(4)],
        ['Kінт (інтенсивність руху)', detailedCoefficients.state.trafficIntensity.toFixed(4), detailedCoefficients.local.trafficIntensity.toFixed(4)],
        ['Kе.д (дороги з індексом Е)', detailedCoefficients.state.europeanRoad.toFixed(4), 'н/д'],
        ['Kмпп.д (пункти пропуску)', detailedCoefficients.state.borderCrossing.toFixed(4), 'н/д'],
        ['Kосв (освітлення)', detailedCoefficients.state.lighting.toFixed(4), 'враховано окремо'],
        ['Kрем (нещодавній ремонт)', detailedCoefficients.state.repair.toFixed(4), 'враховано окремо'],
        ['Kкр.і (критич. інфраструктура)', detailedCoefficients.common.criticalInfrastructure.toFixed(4), 'н/д'],
        ['Kд (обслуговування)', '1.16', 'н/д'],
        [],
        ['5. РЕЗУЛЬТАТИ РОЗРАХУНКУ ФІНАНСУВАННЯ'],
        ['Показник', 'Значення'],
        ['Протяжність доріг державного значення (км)', fundingResults.details.stateRoadLength.toFixed(2)],
        ['Протяжність доріг місцевого значення (км)', fundingResults.details.localRoadLength.toFixed(2)],
        ['Фінансування доріг державного значення (тис. грн)', fundingResults.stateFunding.toFixed(2)],
        ['Фінансування доріг місцевого значення (тис. грн)', fundingResults.localFunding.toFixed(2)],
        ['ЗАГАЛЬНИЙ ОБСЯГ ФІНАНСУВАННЯ (тис. грн)', fundingResults.totalFunding.toFixed(2)],
      ];
      
      // Создаем лист
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Устанавливаем ширину колонок
      ws['!cols'] = [
        { width: 40 }, // Первая колонка шире для названий
        { width: 20 },
        { width: 20 }
      ];
      
      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(workbook, ws, 'Результати розрахунку');
      
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
    try {
      const dataToSave = {
        region: selectedRegion,
        date: new Date().toISOString(),
        stateRoadBaseRate,
        localRoadBaseRate,
        stateInflationIndexes,
        localInflationIndexes,
        stateRoadRates,
        localRoadRates,
        fundingResults,
        detailedCoefficients,
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
                      onChange={(e) => setStateRoadBaseRate(parseFloat(e.target.value) || 604.761)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Індекси інфляції для державних доріг</Label>
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
                          <span className="text-sm text-gray-500">
                            (коеф.: {(1 + index / 100).toFixed(4)})
                          </span>
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
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <strong>Сукупний індекс інфляції: {calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateStateRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Розрахувати нормативи
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category1.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 1.80)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія II</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category2.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 1.00)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія III</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category3.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.89)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category4.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.61)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія V</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category5.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.39)
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-blue-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Формула розрахунку</AlertTitle>
                  <AlertDescription>
                    <div className="font-mono text-center py-2">
                      H<sub>j</sub><sup>д</sup> = H<sup>д</sup> × K<sub>j</sub><sup>д</sup> × K<sub>інф</sub>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      де H<sup>д</sup> = {stateRoadBaseRate} тис. грн/км, K<sub>j</sub><sup>д</sup> - коефіцієнт диференціювання за категорією, K<sub>інф</sub> = {calculateCumulativeInflationIndex(stateInflationIndexes).toFixed(4)}
                    </div>
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
                      onChange={(e) => setLocalRoadBaseRate(parseFloat(e.target.value) || 360.544)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Індекси інфляції для місцевих доріг</Label>
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
                          <span className="text-sm text-gray-500">
                            (коеф.: {(1 + index / 100).toFixed(4)})
                          </span>
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
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <strong>Сукупний індекс інфляції: {calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={calculateLocalRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Розрахувати нормативи
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category1.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 1.71)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія II</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category2.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 1.00)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія III</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category3.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.85)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category4.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.64)
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія V</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category5.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.40)
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-blue-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Формула розрахунку</AlertTitle>
                  <AlertDescription>
                    <div className="font-mono text-center py-2">
                      H<sub>j</sub><sup>м</sup> = H<sup>м</sup> × K<sub>j</sub><sup>м</sup> × K<sub>інф</sub>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      де H<sup>м</sup> = {localRoadBaseRate} тис. грн/км, K<sub>j</sub><sup>м</sup> - коефіцієнт диференціювання за категорією, K<sub>інф</sub> = {calculateCumulativeInflationIndex(localInflationIndexes).toFixed(4)}
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Alert className="mt-4 bg-red-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="text-red-500 font-bold">ВАЖЛИВО!!!</AlertTitle>
                  <AlertDescription>
                    Приведені нормативи необхідні для подальших розрахунків обсягу коштів на експлуатаційне утримання.
                    Коефіцієнти диференціювання для місцевих доріг відрізняються від державних.
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
                      <Calculator className="h-4 w-4 mr-2" />
                      Розрахувати коефіцієнти та обсяг коштів
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Детальний розрахунок коефіцієнтів</h3>
                    
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Загальні коефіцієнти:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Коефіцієнт</TableHead>
                            <TableHead className="text-right">Значення</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>K<sub>г</sub> (гірська місцевість)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.common.mountainous.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>уе</sub> (умови експлуатації)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.common.operatingConditions.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>кр.і</sub> (критич. інфраструктура)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.common.criticalInfrastructure.toFixed(4)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Коефіцієнти для державних доріг:</h4>
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
                            <TableCell className="text-right">1.1600</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>інт.д</sub> (інтенсивність)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.state.trafficIntensity.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>е.д</sub> (дороги з індексом Е)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.state.europeanRoad.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>мпп.д</sub> (пункти пропуску)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.state.borderCrossing.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>осв</sub> (освітлення)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.state.lighting.toFixed(4)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>K<sub>рем</sub> (нещодавній ремонт)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.state.repair.toFixed(4)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Коефіцієнти для місцевих доріг:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Коефіцієнт</TableHead>
                            <TableHead className="text-right">Значення</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>K<sub>інт.м</sub> (інтенсивність)</TableCell>
                            <TableCell className="text-right">{detailedCoefficients.local.trafficIntensity.toFixed(4)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
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
                            <p className="text-sm text-gray-600">Базове фінансування (без коефіцієнтів):</p>
                            <p className="text-sm text-blue-600">
                              Держ.: {(fundingResults.stateFunding / (detailedCoefficients.common.mountainous * detailedCoefficients.common.operatingConditions * detailedCoefficients.state.trafficIntensity * detailedCoefficients.state.europeanRoad * detailedCoefficients.state.borderCrossing * detailedCoefficients.state.lighting * detailedCoefficients.state.repair * detailedCoefficients.common.criticalInfrastructure * 1.16)).toFixed(2)} тис. грн
                            </p>
                            <p className="text-sm text-blue-600">
                              Місц.: {(fundingResults.localFunding / (detailedCoefficients.common.mountainous * detailedCoefficients.common.operatingConditions * detailedCoefficients.local.trafficIntensity)).toFixed(2)} тис. грн
                            </p>
                          </div>
                          
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
                          <TableHead colSpan={3} className="text-center">Протяжність доріг держзначення (км)</TableHead>
                          <TableHead colSpan={3} className="text-center">Протяжність доріг місцевого значення (км)</TableHead>
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

                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4">Формули розрахунку:</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Alert className="bg-blue-50">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Державні дороги (п. 3.5)</AlertTitle>
                      <AlertDescription className="text-sm">
                        <div className="font-mono text-center py-2 bg-white rounded border my-2">
                          Q<sub>i</sub><sup>д</sup> = Σ(H<sub>j</sub><sup>д</sup> × L<sub>ij</sub><sup>д</sup>) × K<sub>д</sub> × K<sub>г</sub> × K<sub>уе</sub> × K<sub>інт.д</sub> × K<sub>е.д</sub> × K<sub>мпп.д</sub> × K<sub>осв</sub> × K<sub>рем</sub> × K<sub>кр.і</sub>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <Alert className="bg-green-50">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Місцеві дороги (п. 3.6)</AlertTitle>
                      <AlertDescription className="text-sm">
                        <div className="font-mono text-center py-2 bg-white rounded border my-2">
                          Q<sub>i</sub><sup>м</sup> = Σ(H<sub>j</sub><sup>м</sup> × L<sub>ij</sub><sup>м</sup>) × K<sub>г</sub> × K<sub>уе</sub> × K<sub>інт.м</sub>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-red-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="text-red-500 font-bold">ВАЖЛИВО!!!</AlertTitle>
                  <AlertDescription>
                    Після завершення розрахунків програма запам'ятовує загальний результат фінансування для подальших розрахунків у Блоці 3.
                    Критична інфраструктура: {regionData.criticalInfrastructureCount} об'єктів у регіоні.
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