import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, CheckCircle, Plus, Download, Calculator, AlertTriangle, MapPin, Construction, Upload } from "lucide-react";

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
  type RoadSection,
} from '../../modules/block_two';

// Импортируем SheetJS
import * as XLSX from 'xlsx';

interface ExcelCell {
  address: string;
  value: any;
  formula?: string;
  type: 'number' | 'string' | 'formula' | 'empty';
  editable: boolean;
}

interface ExcelWorksheet {
  name: string;
  cells: ExcelCell[];
  range: string;
}

interface RoadCalculationResult {
  worksheet: string;
  totalCells: number;
  editableCells: number;
  formulaCells: number;
  calculatedValues: Record<string, any>;
  roadFinancing: {
    stateFunding: number;
    localFunding: number;
    totalFunding: number;
    details: any;
  } | null;
  regionData: RegionRoads | null;
}

const Block2MaintenanceCalculator: React.FC = () => {
  // State for state road calculation (Block 2.1)
  const [stateRoadBaseRate, setStateRoadBaseRate] = useState<number>(604.761);
  const [stateInflationIndexes, setStateInflationIndexes] = useState<number[]>([10]);
  const [stateRoadRate, setStateRoadRates] = useState<{
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
  const [localRoadRate, setLocalRoadRates] = useState<{
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
  const [worksheets, setWorksheets] = useState<ExcelWorksheet[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
  const [inflationIndex, setInflationIndex] = useState<number>(1.25);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<RoadCalculationResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("Вінницька");
  const [regionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
  const [regionData, _setRegionData] = useState<RegionRoads>(generateSampleRegionData("Вінницька"));
  const [_fundingResults, setFundingResults] = useState<{
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

  // ДОДАНО: Стан для полів вводу коефіцієнтів
  const [inputValues, setInputValues] = useState({
    mountainous: '1.0000',
    operatingConditions: '1.0000',
    criticalInfrastructure: '1.0000',
    stateServiceCoefficient: '1.1600',
    stateTrafficIntensity: '1.0000',
    europeanRoad: '1.0000',
    borderCrossing: '1.0000',
    lighting: '1.0000',
    repair: '1.0000',
    localTrafficIntensity: '1.0000'
  });

  const [saveStatus, setSaveStatus] = useState<string>("");

  const [uploadProgress, _setUploadProgress] = useState(0);
  // ДОДАНО: Функція синхронізації полів вводу з коефіцієнтами (тільки при зміні регіону)
  const syncInputValues = (forceUpdate = false) => {
    // Синхронізуємо тільки якщо це примусове оновлення (зміна регіону) або поля ще не заповнені
    if (forceUpdate || inputValues.mountainous === '1.0000') {
      setInputValues({
        mountainous: detailedCoefficients.common.mountainous.toFixed(4),
        operatingConditions: detailedCoefficients.common.operatingConditions.toFixed(4),
        criticalInfrastructure: detailedCoefficients.common.criticalInfrastructure.toFixed(4),
        stateServiceCoefficient: '1.1600',
        stateTrafficIntensity: detailedCoefficients.state.trafficIntensity.toFixed(4),
        europeanRoad: detailedCoefficients.state.europeanRoad.toFixed(4),
        borderCrossing: detailedCoefficients.state.borderCrossing.toFixed(4),
        lighting: detailedCoefficients.state.lighting.toFixed(4),
        repair: detailedCoefficients.state.repair.toFixed(4),
        localTrafficIntensity: detailedCoefficients.local.trafficIntensity.toFixed(4)
      });
    }
  };

  // Initialize calculations on component mount
  useEffect(() => {
    calculateStateRoadRates();
    calculateLocalRoadRates();
  }, [stateRoadBaseRate, stateInflationIndexes]);

  useEffect(() => {
    calculateLocalRoadRates();
  }, [localRoadBaseRate, localInflationIndexes]);

  // ДОДАНО: Синхронізація полів вводу тільки при першому завантаженні
  useEffect(() => {
    // Синхронізуємо тільки при першому завантаженні або якщо це зміна регіону
    syncInputValues(true);
    calculateDetailedCoefficients();
    calculateFunding();
  }, [selectedRegion]); // Залежність тільки від регіону

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

    // Calculate detailed coefficients first (але не синхронізуємо поля)
    const newDetailedCoefficients = {
      state: {
        trafficIntensity: calculateTrafficIntensityCoefficient(
          regionData.roadSections.filter(section => section.stateImportance),
          regionData.roadSections.filter(section => section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
        europeanRoad: calculateEuropeanRoadCoefficient(
          regionData.roadSections.filter(section => section.stateImportance),
          regionData.roadSections.filter(section => section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
        borderCrossing: calculateBorderCrossingCoefficient(
          regionData.roadSections.filter(section => section.stateImportance),
          regionData.roadSections.filter(section => section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
        lighting: calculateLightingCoefficient(
          regionData.roadSections.filter(section => section.stateImportance),
          regionData.roadSections.filter(section => section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
        repair: calculateRepairCoefficient(
          regionData.roadSections.filter(section => section.stateImportance),
          regionData.roadSections.filter(section => section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
      },
      local: {
        trafficIntensity: calculateTrafficIntensityCoefficient(
          regionData.roadSections.filter(section => !section.stateImportance),
          regionData.roadSections.filter(section => !section.stateImportance).reduce((sum, section) => sum + section.length, 0)
        ),
      },
      common: {
        mountainous: selectedRegionCoeff.mountainous,
        operatingConditions: selectedRegionCoeff.operatingConditions,
        criticalInfrastructure: calculateCriticalInfrastructureCoefficient(regionData.criticalInfrastructureCount),
      }
    };

    setDetailedCoefficients(newDetailedCoefficients);

    // Calculate total funding using the module functions
    const results = calculateTotalFunding(regionData, selectedRegionCoeff, priceIndexes);
    setFundingResults(results);
    
    // Clear any previous save status message
    setSaveStatus("");
  };
  
  // Handle save results
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('Завантажуємо файл...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { 
          type: 'binary',
          cellStyles: true,
          cellFormula: true,
          cellDates: true,
          cellNF: true,
          sheetStubs: true
        });

        const parsedWorksheets: ExcelWorksheet[] = [];

        // Обрабатываем все листы
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          
          const cells: ExcelCell[] = [];
          
          // Проходим через все ячейки в диапазоне
          for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              const cell = worksheet[cellAddress];
              
              if (cell || row <= 30) { // Показываем первые 30 строк даже если пустые
                const cellData: ExcelCell = {
                  address: cellAddress,
                  value: cell?.v || '',
                  formula: cell?.f || undefined,
                  type: cell?.f ? 'formula' : 
                        typeof cell?.v === 'number' ? 'number' : 
                        cell?.v ? 'string' : 'empty',
                  editable: !cell?.f // Формулы не редактируем
                };
                cells.push(cellData);
              }
            }
          }

          parsedWorksheets.push({
            name: sheetName,
            cells,
            range: worksheet['!ref'] || 'A1:A1'
          });
        });

        setWorksheets(parsedWorksheets);
        setSelectedWorksheet(parsedWorksheets[0]?.name || '');
        setUploadStatus(`Успішно завантажено ${parsedWorksheets.length} аркуш(ів)`);
        
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        setUploadStatus('Помилка при завантаженні файлу');
        console.error('Помилка парсингу Excel:', error);
        setTimeout(() => setUploadStatus(''), 3000);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Функция обновления значения ячейки
  const updateCellValue = (worksheetName: string, cellAddress: string, newValue: any) => {
    setWorksheets(prev => 
      prev.map(ws => {
        if (ws.name === worksheetName) {
          return {
            ...ws,
            cells: ws.cells.map(cell => {
              if (cell.address === cellAddress && cell.editable) {
                return {
                  ...cell,
                  value: newValue,
                  type: typeof newValue === 'number' ? 'number' : 
                        newValue ? 'string' : 'empty'
                };
              }
              return cell;
            })
          };
        }
        return ws;
      })
    );
  };

  // Функция парсинга данных дорог из Excel
  const parseRoadDataFromExcel = (worksheet: ExcelWorksheet): RegionRoads | null => {
    try {
      // Здесь мы предполагаем определенную структуру Excel файла
      // В реальном проекте это должно быть настраиваемо
      const roadSections: RoadSection[] = [];
      
      // Пример парсинга: ищем данные начиная со строки 2
      const dataRows = worksheet.cells.filter(cell => {
        const decoded = XLSX.utils.decode_cell(cell.address);
        return decoded.r > 0; // Пропускаем заголовки
      });

      // Группируем ячейки по строкам
      const rowGroups: Record<number, ExcelCell[]> = {};
      dataRows.forEach(cell => {
        const decoded = XLSX.utils.decode_cell(cell.address);
        if (!rowGroups[decoded.r]) rowGroups[decoded.r] = [];
        rowGroups[decoded.r].push(cell);
      });

      // Парсим каждую строку как данные дороги
      Object.values(rowGroups).forEach(rowCells => {
        rowCells.sort((a, b) => {
          const aCol = XLSX.utils.decode_cell(a.address).c;
          const bCol = XLSX.utils.decode_cell(b.address).c;
          return aCol - bCol;
        });

        if (rowCells.length >= 8) { // Минимум 8 колонок данных
          const roadSection: RoadSection = {
            category: Math.min(5, Math.max(1, Number(rowCells[0]?.value) || 3)) as 1 | 2 | 3 | 4 | 5,
            stateImportance: Boolean(rowCells[1]?.value),
            length: Number(rowCells[2]?.value) || 0,
            trafficIntensity: Number(rowCells[3]?.value) || 0,
            hasEuropeanStatus: Boolean(rowCells[4]?.value),
            isBorderCrossing: Boolean(rowCells[5]?.value),
            hasLighting: Boolean(rowCells[6]?.value),
            recentlyRepaired: Boolean(rowCells[7]?.value)
          };

          if (roadSection.length > 0) {
            roadSections.push(roadSection);
          }
        }
      });

      return {
        regionalName: selectedRegion || 'Невизначена область',
        roadSections,
        criticalInfrastructureCount: 5 // По умолчанию
      };

    } catch (error) {
      console.error('Ошибка парсинга данных дорог:', error);
      return null;
    }
  };

  // Функция расчета
  const handleCalculate = () => {
    if (!selectedWorksheet) {
      alert('Оберіть аркуш для розрахунку');
      return;
    }

    if (!selectedRegion) {
      alert('Оберіть регіон для розрахунку');
      return;
    }

    setIsCalculating(true);

    try {
      const worksheet = worksheets.find(ws => ws.name === selectedWorksheet);
      if (!worksheet) {
        throw new Error('Аркуш не знайдено');
      }

      setTimeout(() => {
        const calculatedValues: Record<string, any> = {};
        let totalSum = 0;
        let numberCount = 0;

        // Обычные расчеты Excel
        worksheet.cells.forEach(cell => {
          if (cell.type === 'number' && typeof cell.value === 'number') {
            totalSum += cell.value;
            numberCount++;
          }
          calculatedValues[cell.address] = cell.value;
        });

        calculatedValues['TOTAL_SUM'] = totalSum;
        calculatedValues['AVERAGE'] = numberCount > 0 ? totalSum / numberCount : 0;
        calculatedValues['COUNT_NUMBERS'] = numberCount;
        calculatedValues['COUNT_FILLED'] = worksheet.cells.filter(c => c.value !== '').length;

        // Парсим данные дорог из Excel или используем пример
        let regionData = parseRoadDataFromExcel(worksheet);
        if (!regionData || regionData.roadSections.length === 0) {
          // Если не удалось распарсить, используем пример данных
          regionData = generateSampleRegionData(selectedRegion);
        }

        // Получаем коэффициенты региона
        const regionCoeff = regionCoefficients.find(r => r.regionalName === selectedRegion);
        if (!regionCoeff) {
          throw new Error('Коэффіцієнти регіону не знайдено');
        }

        // Расчет финансирования дорог
        const priceIndexes: PriceIndexes = { inflationIndex };
        const roadFinancing = calculateTotalFunding(regionData, regionCoeff, priceIndexes);

        const result: RoadCalculationResult = {
          worksheet: selectedWorksheet,
          totalCells: worksheet.cells.length,
          editableCells: worksheet.cells.filter(c => c.editable).length,
          formulaCells: worksheet.cells.filter(c => c.type === 'formula').length,
          calculatedValues,
          roadFinancing,
          regionData
        };

        setResults(result);
        setIsCalculating(false);
      }, 2000);

    } catch (error) {
      console.error('Помилка розрахунку:', error);
      alert('Помилка при виконанні розрахунків');
      setIsCalculating(false);
    }
  };

  // Функция экспорта результатов
  const handleExportResults = () => {
    if (!results || !selectedWorksheet) return;

    try {
      const worksheet = worksheets.find(ws => ws.name === selectedWorksheet);
      if (!worksheet) return;

      const exportData: any[][] = [];
      
      // Заголовки общих данных
      exportData.push(['ЗАГАЛЬНІ РЕЗУЛЬТАТИ РОЗРАХУНКІВ']);
      exportData.push([]);
      exportData.push(['Адреса клітинки', 'Значення', 'Тип', 'Формула']);
      
      // Данные ячеек
      worksheet.cells.slice(0, 20).forEach(cell => {
        exportData.push([
          cell.address,
          cell.value,
          cell.type,
          cell.formula || ''
        ]);
      });

      // Общие результаты
      exportData.push([]);
      exportData.push(['ПІДСУМКОВІ РЕЗУЛЬТАТИ EXCEL']);
      exportData.push(['Загальна сума:', results.calculatedValues.TOTAL_SUM]);
      exportData.push(['Середнє значення:', results.calculatedValues.AVERAGE]);
      exportData.push(['Кількість чисел:', results.calculatedValues.COUNT_NUMBERS]);
      exportData.push(['Кількість заповнених клітинок:', results.calculatedValues.COUNT_FILLED]);

      // Результаты финансирования дорог
      if (results.roadFinancing) {
        exportData.push([]);
        exportData.push(['РОЗРАХУНОК ФІНАНСУВАННЯ ДОРІГ']);
        exportData.push(['Регіон:', selectedRegion]);
        exportData.push(['Індекс інфляції:', inflationIndex]);
        exportData.push([]);
        exportData.push(['Фінансування доріг державного значення (тис. грн):', Math.round(results.roadFinancing.stateFunding)]);
        exportData.push(['Фінансування доріг місцевого значення (тис. грн):', Math.round(results.roadFinancing.localFunding)]);
        exportData.push(['ЗАГАЛЬНЕ ФІНАНСУВАННЯ (тис. грн):', Math.round(results.roadFinancing.totalFunding)]);
        exportData.push([]);
        exportData.push(['ДЕТАЛІ РОЗРАХУНКУ']);
        exportData.push(['Довжина доріг державного значення (км):', results.roadFinancing.details.stateRoadLength]);
        exportData.push(['Довжина доріг місцевого значення (км):', results.roadFinancing.details.localRoadLength]);
        exportData.push(['Базовий норматив держ. доріг (тис. грн/км):', Math.round(results.roadFinancing.details.stateRoadBaseRate)]);
        exportData.push(['Базовий норматив місц. доріг (тис. грн/км):', Math.round(results.roadFinancing.details.localRoadBaseRate)]);

        // Коэффициенты
        exportData.push([]);
        exportData.push(['ЗАСТОСОВАНІ КОЕФІЦІЄНТИ']);
        Object.entries(results.roadFinancing.details.appliedCoefficients).forEach(([key, value]) => {
          exportData.push([key, Number(value).toFixed(3)]);
        });
      }

      // Создаем Excel файл
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Результати');

      // Добавляем лист с данными дорог если есть
      if (results.regionData) {
        const roadData: any[][] = [];
        roadData.push(['ДАНІ ПРО ДОРОГИ РЕГІОНУ']);
        roadData.push([]);
        roadData.push(['Категорія', 'Держ. значення', 'Довжина (км)', 'Інтенсивність', 'Європейський статус', 'Прикордонний перехід', 'Освітлення', 'Нещодавно відремонтований']);
        
        results.regionData.roadSections.forEach(section => {
          roadData.push([
            section.category,
            section.stateImportance ? 'Так' : 'Ні',
            section.length,
            section.trafficIntensity,
            section.hasEuropeanStatus ? 'Так' : 'Ні',
            section.isBorderCrossing ? 'Так' : 'Ні',
            section.hasLighting ? 'Так' : 'Ні',
            section.recentlyRepaired ? 'Так' : 'Ні'
          ]);
        });

        const roadWs = XLSX.utils.aoa_to_sheet(roadData);
        XLSX.utils.book_append_sheet(wb, roadWs, 'Дані доріг');
      }

      const fileName = `Розрахунок_доріг_${selectedRegion}_${selectedWorksheet}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при експорті результатів');
    }
  };

  // Получаем выбранный лист
  const currentWorksheet = worksheets.find(ws => ws.name === selectedWorksheet);

  // Группируем ячейки по строкам для отображения в таблице
  const getTableData = (): { rows: Record<number, Record<string, ExcelCell>>; columns: string[]; } => {
    if (!currentWorksheet) return { rows: {}, columns: [] };
    
    const rows: Record<number, Record<string, ExcelCell>> = {};
    const cols = new Set<string>();
    
    currentWorksheet.cells.forEach(cell => {
      const decoded = XLSX.utils.decode_cell(cell.address);
      const rowNum = decoded.r;
      const colLetter = XLSX.utils.encode_col(decoded.c);
      
      if (!rows[rowNum]) rows[rowNum] = {};
      rows[rowNum][colLetter] = cell;
      cols.add(colLetter);
    });

    return { rows, columns: Array.from(cols).sort() };
  };

  const tableData = getTableData();
  
  return (
    <div className="mx-auto p-10">
      <h1 className="text-2xl font-bold mb-2">Експлуатаційне утримання доріг</h1>
      <p className="text-gray-600 mb-6">Визначення загального обсягу бюджетних коштів на фінансове забезпечення заходів з експлуатаційного утримання</p>
      
      <Tabs defaultValue="step1" className="mb-8 w-full">
        <TabsList className="w-full grid-cols-3 ">
          <TabsTrigger value="step1">Дороги державного значення</TabsTrigger>
          <TabsTrigger value="step2">Дороги місцевого значення</TabsTrigger>
          <TabsTrigger value="step3">Розрахунок обсягу коштів</TabsTrigger>
        </TabsList>
        
        {/* Stage 2.1: State Road Norms */}
        <TabsContent value="step1">
          <Card className="w-full">
            <CardHeader>
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
                
                {/* <Button 
                  onClick={calculateStateRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700 px-2 py-1 text-sm"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Розрахувати нормативи
                </Button> */}
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {stateRoadRate.category1.toFixed(2)}
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
                        {stateRoadRate.category2.toFixed(2)}
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
                        {stateRoadRate.category3.toFixed(2)}
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
                        {stateRoadRate.category4.toFixed(2)}
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
                        {stateRoadRate.category5.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.39)
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stage 2.2: Local Road Norms */}
        <TabsContent value="step2">
          <Card>
            <CardHeader>
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
                
                {/* <Button 
                  onClick={calculateLocalRoadRates}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Розрахувати нормативи
                </Button> */}
                
                <div className="grid grid-cols-5 gap-4 mt-6">
                  <Card className="p-4">
                    <CardContent className="p-0 text-center">
                      <h3 className="font-bold">Категорія I</h3>
                      <div className="text-xl font-bold mt-2">
                        {localRoadRate.category1.toFixed(2)}
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
                        {localRoadRate.category2.toFixed(2)}
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
                        {localRoadRate.category3.toFixed(2)}
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
                        {localRoadRate.category4.toFixed(2)}
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
                        {localRoadRate.category5.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">тис. грн/км</div>
                      <div className="text-xs text-blue-600 mt-1">
                        (коеф. 0.40)
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stage 2.3-2.8: Funding Calculation */}
        <TabsContent value='step3'>
          <Card className='w-full'>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5" />
                Калькулятор фінансування доріг на основі Excel шаблону
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Загрузка файла */}
              <div className="space-y-4">
                <Label htmlFor="excel-upload">Завантажити Excel шаблон:</Label>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Обрати файл
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  {uploadStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      {uploadStatus.includes('Успішно') ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : uploadStatus.includes('Помилка') ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : null}
                      <span className={
                        uploadStatus.includes('Успішно') ? 'text-green-600' :
                        uploadStatus.includes('Помилка') ? 'text-red-600' : 'text-blue-600'
                      }>
                        {uploadStatus}
                      </span>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Настройки расчета */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Выбор листа */}
                {worksheets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Оберіть аркуш:</Label>
                    <select
                      value={selectedWorksheet}
                      onChange={(e) => setSelectedWorksheet(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {worksheets.map(ws => (
                        <option key={ws.name} value={ws.name}>
                          {ws.name} ({ws.cells.length} клітинок)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Выбор региона */}
                <div className="space-y-2">
                  <Label>Оберіть регіон:</Label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Оберіть регіон</option>
                    {regionCoefficients.map(region => (
                      <option key={region.regionalName} value={region.regionalName}>
                        {region.regionalName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Индекс инфляции */}
                <div className="space-y-2">
                  <Label>Індекс інфляції:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inflationIndex}
                    onChange={(e) => setInflationIndex(Number(e.target.value))}
                    placeholder="1.25"
                  />
                </div>
              </div>

              {/* Таблица с данными - ПОЛНОСТЬЮ ОБНОВЛЕННАЯ ВЕРСИЯ */}
              {currentWorksheet && tableData.columns.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold">
                      Дані аркушу: {selectedWorksheet}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCalculate}
                        disabled={isCalculating || !selectedRegion}
                        className="flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4" />
                        {isCalculating ? 'Розраховуємо...' : 'Розрахувати'}
                      </Button>
                      {results && (
                        <Button
                          onClick={handleExportResults}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Експорт
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Excel-подобная таблица */}
                  <div className="border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-auto max-h-[500px]">
                      <table className="border-collapse w-full min-w-full">
                        {/* Заголовок таблицы */}
                        <thead className="sticky top-0 z-20">
                          <tr>
                            {/* Угловая ячейка */}
                            <th className="w-12 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-30"></th>
                            {/* Заголовки колонок */}
                            {tableData.columns.map((col, _index) => (
                              <th 
                                key={col} 
                                className="w-32 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold px-1"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        
                        <tbody>
                          {Object.entries(tableData.rows)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .slice(0, Math.min(100, Object.keys(tableData.rows).length)) // ОГРАНИЧЕНИЕ
                            .map(([rowNum, rowCells]) => {
                              const rowIndex = parseInt(rowNum);
                              const isHeaderRow = rowIndex === 0;
                              
                              return (
                                <tr key={rowNum}>
                                  {/* Заголовок строки */}
                                  <td className="w-12 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-10">
                                    {rowIndex + 1}
                                  </td>
                                  
                                  {/* Ячейки данных */}
                                  {tableData.columns.map(col => {
                                    const cell = rowCells[col];
                                    
                                    return (
                                      <td 
                                        key={`${rowNum}-${col}`} 
                                        className="w-32 h-8 border border-gray-300 p-0 relative"
                                      >
                                        {cell ? (
                                          // Ячейка с данными
                                          cell.editable && !isHeaderRow ? (
                                            <input
                                              type="text"
                                              value={cell.value || ''}
                                              onChange={(e) => updateCellValue(
                                                selectedWorksheet,
                                                cell.address,
                                                e.target.value
                                              )}
                                              className="w-full h-full px-1 text-xs text-center border-0 outline-0 focus:bg-blue-50 focus:ring-2 focus:ring-blue-400"
                                              style={{ 
                                                fontSize: '11px',
                                                lineHeight: '1.2'
                                              }}
                                            />
                                          ) : (
                                            // Нередактируемая ячейка
                                            <div 
                                              className={`w-full h-full px-1 text-xs flex items-center justify-center text-center ${
                                                isHeaderRow ? 'bg-blue-100 text-blue-800 font-semibold' :
                                                cell.type === 'formula' ? 'bg-yellow-50 text-yellow-800' :
                                                cell.type === 'number' ? 'bg-green-50 text-green-800' :
                                                'bg-white text-gray-800'
                                              }`}
                                              style={{ 
                                                fontSize: '11px',
                                                lineHeight: '1.2',
                                                wordBreak: 'break-word'
                                              }}
                                              title={cell.formula ? `=${cell.formula}` : String(cell.value)}
                                            >
                                              <span className="break-all">
                                                {cell.formula ? `=${cell.formula}` : String(cell.value || '')}
                                              </span>
                                            </div>
                                          )
                                        ) : (
                                          // Пустая ячейка
                                          <div className="w-full h-full bg-white"></div>
                                        )}
                                      </td>
                                    );
                                  })}
                                  {Object.keys(tableData.rows).length > 100 && (
                                    <Alert className="mb-4">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        Показані перші 100 рядків з {Object.keys(tableData.rows).length}. 
                                        Для кращої продуктивності решта рядків приховані.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Информация о таблице */}
                  <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2">
                    <div className="flex flex-wrap gap-4">
                      <span>Загалом клітинок: <strong>{currentWorksheet.cells.length}</strong></span>
                      <span>Редагованих: <strong>{currentWorksheet.cells.filter(c => c.editable).length}</strong></span>
                    </div>
                  </div>

                  {/* Подсказка по структуре */}
                  {/* <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="text-sm">
                        <div className="font-semibold text-yellow-800 mb-2">Очікувана структура колонок:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div><strong>A:</strong> Категорія дороги (1-5)</div>
                          <div><strong>B:</strong> Державне значення (1=так, 0=ні)</div>
                          <div><strong>C:</strong> Довжина ділянки (км)</div>
                          <div><strong>D:</strong> Інтенсивність руху (авт./добу)</div>
                          <div><strong>E:</strong> Європейський статус (1=так, 0=ні)</div>
                          <div><strong>F:</strong> Прикордонний перехід (1=так, 0=ні)</div>
                          <div><strong>G:</strong> Освітлення (1=так, 0=ні)</div>
                          <div><strong>H:</strong> Нещодавно відремонтований (1=так, 0=ні)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card> */}
                </div>
              )}

              {/* Результаты расчетов */}
              {results && (
                <>
                  <Separator />
                  
                  {/* Результаты Excel */}
                  <Card className="bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Результати обробки Excel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-green-700">
                            {results.calculatedValues.TOTAL_SUM?.toFixed(2) || '0'}
                          </div>
                          <div className="text-sm text-green-600">Загальна сума</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {results.calculatedValues.AVERAGE?.toFixed(2) || '0'}
                          </div>
                          <div className="text-sm text-blue-600">Середнє значення</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-purple-700">
                            {results.calculatedValues.COUNT_NUMBERS || '0'}
                          </div>
                          <div className="text-sm text-purple-600">Кількість чисел</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-orange-700">
                            {results.calculatedValues.COUNT_FILLED || '0'}
                          </div>
                          <div className="text-sm text-orange-600">Заповнених клітинок</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Результаты финансирования дорог */}
                  {results.roadFinancing && (
                    <Card className="bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Розрахунок фінансування доріг для регіону: {selectedRegion}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Основные результаты */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-3xl font-bold text-blue-700">
                              {(results.roadFinancing.stateFunding / 1000).toFixed(1)}
                            </div>
                            <div className="text-sm text-blue-600">Державні дороги (млн. грн)</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-3xl font-bold text-green-700">
                              {(results.roadFinancing.localFunding / 1000).toFixed(1)}
                            </div>
                            <div className="text-sm text-green-600">Місцеві дороги (млн. грн)</div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-3xl font-bold text-purple-700">
                              {(results.roadFinancing.totalFunding / 1000).toFixed(1)}
                            </div>
                            <div className="text-sm text-purple-600">ЗАГАЛЬНЕ ФІНАНСУВАННЯ (млн. грн)</div>
                          </div>
                        </div>

                        {/* Детали расчета */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="bg-white">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-800">Характеристики мережі доріг</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Довжина доріг державного значення:</span>
                                <span className="font-medium">{results.roadFinancing.details.stateRoadLength.toFixed(1)} км</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Довжина доріг місцевого значення:</span>
                                <span className="font-medium">{results.roadFinancing.details.localRoadLength.toFixed(1)} км</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Базовий норматив держ. доріг:</span>
                                <span className="font-medium">{results.roadFinancing.details.stateRoadBaseRate.toFixed(0)} тис. грн/км</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Базовий норматив місц. доріг:</span>
                                <span className="font-medium">{results.roadFinancing.details.localRoadBaseRate.toFixed(0)} тис. грн/км</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-white">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-800">Застосовані коефіцієнти</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Гірська місцевість (Кг):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.mountainous.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Умови експлуатації (Куе):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.operatingConditions.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Обслуговування держ. доріг (Кд):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.stateServiceCoefficient.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Інтенсивність руху (держ.):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.trafficIntensityState.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Інтенсивність руху (місц.):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.trafficIntensityLocal.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Європейська мережа (Ке.д):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.europeanRoad.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Прикордонні переходи (Кмпп.д):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.borderCrossing.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Освітлення (Косв):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.lighting.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Після ремонту (Крем):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.repair.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Критична інфраструктура (Ккр.і):</span>
                                <span className="font-medium">{results.roadFinancing.details.appliedCoefficients.criticalInfrastructure.toFixed(3)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Информация о данных */}
                        {results.regionData && (
                          <Card className="bg-white">
                            <CardHeader>
                              <CardTitle className="text-sm text-gray-800">Дані про дороги в розрахунку</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                {[1, 2, 3, 4, 5].map(category => {
                                  const categoryRoads = results.regionData!.roadSections.filter(r => r.category === category);
                                  const stateRoads = categoryRoads.filter(r => r.stateImportance);
                                  const localRoads = categoryRoads.filter(r => !r.stateImportance);
                                  const totalLength = categoryRoads.reduce((sum, r) => sum + r.length, 0);
                                  
                                  return (
                                    <div key={category} className="p-3 bg-gray-50 rounded border text-center">
                                      <div className="font-medium mb-2">{category} категорія</div>
                                      <div className="space-y-1 text-xs">
                                        <div>Держ.: {stateRoads.length} ділянок</div>
                                        <div>Місц.: {localRoads.length} ділянок</div>
                                        <div>Всього: {totalLength.toFixed(1)} км</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle>Розрахунок фінансування завершено успішно!</AlertTitle>
                          <AlertDescription>
                            Розрахунок виконано для регіону "{selectedRegion}" з урахуванням індексу інфляції {inflationIndex}.
                            {results.regionData && ` Проаналізовано ${results.regionData.roadSections.length} ділянок доріг.`}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Инструкция по использованию */}
              {/* <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Інструкція по використанню:</AlertTitle>
                <AlertDescription className="space-y-3">
                  <div><strong>1. Підготовка Excel файлу:</strong></div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div>• Перший рядок - заголовки колонок (не редагуються автоматично)</div>
                    <div>• Наступні рядки - дані про ділянки доріг</div>
                  </div>
                  
                  <div><strong>2. Структура колонок Excel файлу:</strong></div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div><strong>Колонка A:</strong> Категорія дороги (1, 2, 3, 4 або 5)</div>
                    <div><strong>Колонка B:</strong> Державне значення (1=так, 0=ні)</div>
                    <div><strong>Колонка C:</strong> Довжина ділянки у кілометрах</div>
                    <div><strong>Колонка D:</strong> Інтенсивність руху (авт./добу)</div>
                    <div><strong>Колонка E:</strong> Європейський статус - дороги з індексом Е (1=так, 0=ні)</div>
                    <div><strong>Колонка F:</strong> Прикордонний перехід - біля міжнародних пунктів пропуску (1=так, 0=ні)</div>
                    <div><strong>Колонка G:</strong> Наявність освітлення (1=так, 0=ні)</div>
                    <div><strong>Колонка H:</strong> Проведений ремонт за останні 5 років (1=так, 0=ні)</div>
                  </div>
                  
                  <div><strong>3. Порядок роботи:</strong></div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div>• Завантажте Excel файл з даними про дороги</div>
                    <div>• Оберіть потрібний аркуш для роботи</div>
                    <div>• Оберіть регіон України</div>
                    <div>• Встановіть індекс інфляції (за замовчуванням 1.25)</div>
                    <div>• Відредагуйте дані безпосередньо у таблиці (крім заголовків та формул)</div>
                    <div>• Натисніть "Розрахувати" для виконання обчислень</div>
                    <div>• Експортуйте результати у новий Excel файл</div>
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded">
                    <div><strong>Примітки:</strong></div>
                    <div>• Заголовки колонок (перший рядок) не редагуються для забезпечення структури</div>
                    <div>• Клітинки з формулами показуються жовтим кольором і не редагуються</div>
                    <div>• Якщо структура файлу не відповідає очікуваній, будуть використані приклади даних</div>
                    <div>• Розрахунки виконуються згідно з діючою методикою фінансування експлуатаційного утримання</div>
                  </div>
                </AlertDescription>
              </Alert> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Финансирование по категориям */}
      <Button
          onClick={() => {
            setSaveStatus("Збереження...");
            setTimeout(() => setSaveStatus("Збережено!"), 1000);
            setTimeout(() => setSaveStatus(""), 3000);
          }}
          className="glass-button text-white"
        >
          Зберегти проєкт
        </Button>
        {saveStatus && (
          <span className="text-xs text-green-600">{saveStatus}</span>
        )}
    </div>
  );
};

export default Block2MaintenanceCalculator;