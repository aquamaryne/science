import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {Table,TableBody,TableCaption,TableCell,TableHead,TableHeader,TableRow,} from "@/components/ui/table";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, X, CheckCircle, Plus, Download } from "lucide-react";

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
  const [regionCoefficients, setRegionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
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

    // Calculate total funding
    const results = calculateTotalFunding(regionData, selectedRegionCoeff, priceIndexes);
    setFundingResults(results);
    
    // Clear any previous save status message
    setSaveStatus("");
  };
  
  // Handle export to Excel
  const handleExport = () => {
    alert("Функция экспорта в Excel будет реализована в полной версии приложения");
  };
  
  // Handle save results
  const handleSaveResults = () => {
    try {
      localStorage.setItem('roadMaintenanceFunding', JSON.stringify(fundingResults));
      setSaveStatus("Результаты успешно сохранены");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      setSaveStatus("Ошибка при сохранении результатов");
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
      <h1 className="text-2xl font-bold mb-2">Блок 2: Эксплуатационное содержание дорог</h1>
      <p className="text-gray-600 mb-6">Определение общего объема бюджетных средств на финансовое обеспечение мероприятий по эксплуатационному содержанию</p>
      
      <Tabs defaultValue="step1" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step1">Этап 2.1: Дороги государственного значения</TabsTrigger>
          <TabsTrigger value="step2">Этап 2.2: Дороги местного значения</TabsTrigger>
          <TabsTrigger value="step3">Этап 2.3-2.8: Расчет объема средств</TabsTrigger>
        </TabsList>
        
        {/* Stage 2.1: State Road Norms */}
        <TabsContent value="step1">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Этап 2.1 Блоку 2</CardTitle>
              <CardDescription>
                Приведенный норматив годовых финансовых затрат на эксплуатационное содержание автомобильных дорог государственного значения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="stateRoadBaseRate">
                      Установленный норматив годовых финансовых затрат на ЭУ 1 км дороги II кат. государственного значения в ценах 2023 года
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
                      <Label>Индексы инфляции</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addStateInflationIndex}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Добавить индекс
                      </Button>
                    </div>
                    <div className="grid gap-2 mt-2">
                      {stateInflationIndexes.map((index, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="min-w-[100px]">{`Индекс ${i+1}:`}</Label>
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
                  Рассчитать
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория I</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category1.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория II</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category2.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория III</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category3.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category4.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория V</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRates.category5.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-blue-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Методика расчета</AlertTitle>
                  <AlertDescription>
                    После того как пользователь ввел вышеуказанные данные, программа считает норматив в соответствии с п.3.2 Методики. 
                    Коэффициенты дифференцирования в зависимости от категории приведены в Додатке 3 Методики.
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
              <CardTitle className="text-red-500">Этап 2.2 Блоку 2</CardTitle>
              <CardDescription>
                Приведенный норматив годовых финансовых затрат на эксплуатационное содержание автомобильных дорог местного значения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="localRoadBaseRate">
                      Установленный норматив годовых финансовых затрат на ЭУ 1 км дороги II кат. местного значения в ценах 2023 года
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
                      <Label>Индексы инфляции</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addLocalInflationIndex}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Добавить индекс
                      </Button>
                    </div>
                    <div className="grid gap-2 mt-2">
                      {localInflationIndexes.map((index, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="min-w-[100px]">{`Индекс ${i+1}:`}</Label>
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
                  Рассчитать
                </Button>
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория I</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category1.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория II</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category2.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория III</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category3.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория IV</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category4.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категория V</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRates.category5.toFixed(2)} тыс. грн.
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-4 bg-red-50">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="text-red-500 font-bold">ВАЖНО!!!</AlertTitle>
                  <AlertDescription>
                    Приведенные нормативы необходимы для дальнейших расчетов объема средств на эксплуатационное содержание.
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
              <CardTitle className="text-red-500">Этап 2.3-2.8 Блоку 2</CardTitle>
              <CardDescription>
                Определение объема средств на эксплуатационное содержание автомобильных дорог государственного и местного значения
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region-select">Выберите область:</Label>
                    <Select 
                      value={selectedRegion}
                      onValueChange={handleRegionChange}
                    >
                      <SelectTrigger id="region-select" className="mt-2">
                        <SelectValue placeholder="Выберите область" />
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
                      Рассчитать коэффициенты и объем средств
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">Коэффициенты расчета</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Коэффициент</TableHead>
                          <TableHead className="text-right">Значение</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>K<sub>д</sub> (обслуживание дорог)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.stateServiceCoefficient.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sub>г</sub> (горная местность)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.mountainous.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sub>уе</sub> (условия эксплуатации)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.operatingConditions.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>інт.д</sub> (интенсивность госзначения)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.trafficIntensityState.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>інт.м</sub> (интенсивность местн.)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.trafficIntensityLocal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>е.д</sub> (дороги с индексом Е)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.europeanRoad.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>мпп.д</sub> (пункты пропуска)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.borderCrossing.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>осв</sub> (освещение)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.lighting.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>рем</sub> (недавний ремонт)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.repair.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>K<sup>i</sup><sub>кр.i</sub> (критич. инфраструктура)</TableCell>
                          <TableCell className="text-right">{fundingResults.details.appliedCoefficients.criticalInfrastructure.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-4">Результаты расчета</h3>
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">Протяженность дорог государственного значения:</p>
                            <p className="text-lg font-bold">{fundingResults.details.stateRoadLength.toFixed(2)} км</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Протяженность дорог местного значения:</p>
                            <p className="text-lg font-bold">{fundingResults.details.localRoadLength.toFixed(2)} км</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-sm text-gray-600">Финансирование дорог государственного значения:</p>
                            <p className="text-xl font-bold text-green-700">{fundingResults.stateFunding.toFixed(2)} тыс. грн.</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Финансирование дорог местного значения:</p>
                            <p className="text-xl font-bold text-green-700">{fundingResults.localFunding.toFixed(2)} тыс. грн.</p>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <p className="text-sm text-gray-600">Общий объем финансирования:</p>
                            <p className="text-2xl font-bold text-green-700">{fundingResults.totalFunding.toFixed(2)} тыс. грн.</p>
                          </div>
                          
                          {saveStatus && (
                            <div className="p-2 bg-green-100 text-green-800 rounded flex items-center mt-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {saveStatus}
                            </div>
                          )}
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
                      <h3 className="text-lg font-bold mb-2">Потребность в финансировании по категориям</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Категория</TableHead>
                            <TableHead className="text-right">Госзначение (тыс. грн.)</TableHead>
                            <TableHead className="text-right">Местного значения (тыс. грн.)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map(category => {
                            const funding = calculateCategoryFunding(category);
                            return (
                              <TableRow key={category}>
                                <TableCell>Категория {category}</TableCell>
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
                  <h3 className="text-lg font-bold mb-4">Данные по дорожной сети региона</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead rowSpan={2}>Категория</TableHead>
                          <TableHead colSpan={3}>Протяженность дорог госзначения (км)</TableHead>
                          <TableHead colSpan={3}>Протяженность дорог местного значения (км)</TableHead>
                        </TableRow>
                        <TableRow>
                          <TableHead>Всего</TableHead>
                          <TableHead>с интенсивностью {'>'} 15000</TableHead>
                          <TableHead>с индексом Е</TableHead>
                          <TableHead>Всего</TableHead>
                          <TableHead>с интенсивностью {'>'} 15000</TableHead>
                          <TableHead>с освещением</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[1, 2, 3, 4, 5].map(category => (
                          <TableRow key={category}>
                            <TableCell>Категория {category}</TableCell>
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
                          <TableCell>Итого</TableCell>
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
                  <AlertTitle className="text-red-500 font-bold">ВАЖНО!!!</AlertTitle>
                  <AlertDescription>
                    После завершения расчетов программа запоминает общий результат финансирования для последующих расчетов в Блоке 3.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end mt-4 space-x-4">
                  <Button 
                    variant="outline"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт результатов в Excel
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveResults}
                  >
                    Сохранить результаты
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

                          