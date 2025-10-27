import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Download, Calculator, AlertTriangle, Construction, Upload, Edit } from "lucide-react";
import * as XLSX from 'xlsx';
import { parseNumberInput, handleNativeInputPaste } from '@/utils/numberInput';

// ✅ ІМПОРТ REDUX
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { saveBlockTwoData } from '@/redux/slices/historySlice';
import {
  setRegionalResults as setRegionalResultsAction,
  setRegionalResultsRoadType as setRegionalResultsRoadTypeAction,
  setSelectedRegion as setSelectedRegionAction
} from '@/redux/slices/blockTwoSlice';

// ✅ ІМПОРТИ З МОДУЛЯ
import type { 
  RegionCoefficients,
} from '../../modules/block_two';

import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  calculateTrafficIntensityCoefficient,
  calculateEuropeanRoadCoefficient,
  calculateBorderCrossingCoefficient,
  calculateLightingCoefficient,
  calculateRepairCoefficient,
  calculateCriticalInfrastructureCoefficient,
  type RoadSection,
} from '../../modules/block_two';

// ==================== ТИПИ ДЛЯ ЕТАПІВ 2.4-2.5 / 2.7-2.8 ====================

interface RegionalRoadData {
  name: string;
  lengthByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number };
  totalLength: number;
  lengthByIntensity: {
    medium: number;
    high: number;
    veryHigh: number;
  };
  europeanIndexLength: number; // Протяжність доріг з індексом Е
  borderCrossingLength: number;
  lightingLength: number;
  repairedLength: number;
  criticalInfraCount: number;
  fundingByCategory?: { [key in 1 | 2 | 3 | 4 | 5]: number };
  totalFunding?: number;
  fundingPercentage?: number;
}

interface RegionalCalculationResult {
  regionName: string;
  coefficients: {
    mountainous: number;
    operatingConditions: number;
    trafficIntensity: number;
    europeanRoad?: number;
    borderCrossing?: number;
    lighting?: number;
    repair?: number;
    criticalInfra?: number;
    totalProduct: number;
  };
  fundingByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number };
  totalFunding: number;
}

interface Block2FundingCalculationProps {
  regionCoefficients: RegionCoefficients[];
  stateInflationIndexes: number[];
}

type RoadType = 'state' | 'local';

// ==================== КОМПОНЕНТ ====================

const Block2FundingCalculation: React.FC<Block2FundingCalculationProps> = ({
  regionCoefficients,
  stateInflationIndexes
}) => {
  // ✅ REDUX HOOKS
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(state => state.history.currentSession);
  const q1Value = currentSession?.blockOneData?.q1Result || null;
  const q2Value = currentSession?.blockOneData?.q2Result || null;
  const hasBlockOneData = currentSession?.blockOneData !== undefined;

  const [roadType, setRoadType] = React.useState<RoadType>('state');
  const [regionalData, setRegionalData] = React.useState<RegionalRoadData[]>([]);
  const [regionalResults, setRegionalResults] = React.useState<RegionalCalculationResult[]>([]);
  const [isCalculatingRegional, setIsCalculatingRegional] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedRegion, setSelectedRegion] = React.useState<string>('all');

  // ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================

  // Розрахунок сукупного індексу інфляції
  // Якщо інфляція 106.1%, то коефіцієнт = 106.1/100 = 1.061
  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => acc * (curr / 100), 1);
  };

  // ✅ КОНВЕРТУЄМО RegionalRoadData В RoadSection[] ДЛЯ ВИКОРИСТАННЯ ФУНКЦІЙ МОДУЛЯ
  const convertToRoadSections = (region: RegionalRoadData): RoadSection[] => {
    const roadSections: RoadSection[] = [];
    
    // Створюємо секції для кожної категорії
    ([1, 2, 3, 4, 5] as const).forEach(category => {
      const length = region.lengthByCategory[category];
      if (length > 0) {
        // Розраховуємо середню інтенсивність для категорії
        const avgIntensity = region.totalLength > 0 
          ? (region.lengthByIntensity.medium + region.lengthByIntensity.high + region.lengthByIntensity.veryHigh) / region.totalLength * 10000
          : 5000;
        
        roadSections.push({
          category,
          stateImportance: roadType === 'state', // Залежить від обраного типу доріг
          length,
          trafficIntensity: avgIntensity,
          hasEuropeanStatus: region.europeanIndexLength > 0,
          isBorderCrossing: region.borderCrossingLength > 0,
          hasLighting: region.lightingLength > 0,
          recentlyRepaired: region.repairedLength > 0,
          europeanIndexLength: region.europeanIndexLength // Протяжність доріг з індексом Е
        });
      }
    });
    
    return roadSections;
  };

  // ==================== ЗАВАНТАЖЕННЯ EXCEL ====================
  /**
   * Структура Excel шаблону (колонки):
   * 0: Область
   * 1-5: Категорії I-V
   * 6: Разом
   * 7: Протяжність доріг з індексом Е
   * 8-10: Інтенсивність (15000-20000, 20001-30000, 30001+)
   * 11: МПП (міжнародні пункти пропуску)
   * 12: Освітлення
   * 13: Ремонт
   * 14: Критична інфраструктура
   */

  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    setUploadStatus('Завантажуємо шаблон...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
        
        const parsedData: RegionalRoadData[] = [];
        
        for (let i = 2; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[0]) continue;
          
          const regionData: RegionalRoadData = {
            name: String(row[0]),
            lengthByCategory: {
              1: Number(row[1]) || 0,
              2: Number(row[2]) || 0,
              3: Number(row[3]) || 0,
              4: Number(row[4]) || 0,
              5: Number(row[5]) || 0,
            },
            totalLength: Number(row[6]) || 0,
            europeanIndexLength: Number(row[7]) || 0, // Протяжність доріг з індексом Е (після "Разом")
            lengthByIntensity: {
              medium: Number(row[8]) || 0,  // 15000-20000
              high: Number(row[9]) || 0,    // 20001-30000
              veryHigh: Number(row[10]) || 0, // 30001 і більше
            },
            borderCrossingLength: Number(row[11]) || 0, // МПП
            lightingLength: Number(row[12]) || 0, // Освітлення
            repairedLength: Number(row[13]) || 0, // Ремонт
            criticalInfraCount: Number(row[14]) || 0, // Критична інфраструктура
          };
          
          parsedData.push(regionData);
        }
        
        setRegionalData(parsedData);
        setUploadStatus(`✓ Успішно завантажено дані для ${parsedData.length} областей`);
        setTimeout(() => setUploadStatus(''), 3000);
        
      } catch (error) {
        console.error('Помилка парсингу Excel:', error);
        setUploadStatus('❌ Помилка при завантаженні файлу. Перевірте формат.');
        setTimeout(() => setUploadStatus(''), 5000);
      }
    };
    
    reader.readAsBinaryString(file);
  };

  // ==================== РОЗРАХУНОК З ВИКОРИСТАННЯМ ФУНКЦІЙ МОДУЛЯ ====================
  
  const calculateRegionalFinancing = () => {
    setIsCalculatingRegional(true);
    
    setTimeout(() => {
      try {
        const results: RegionalCalculationResult[] = [];
        
        regionalData.forEach(region => {
          const regionCoeff = regionCoefficients.find(r => r.regionalName === region.name);
          if (!regionCoeff) {
            // Коефіцієнти для області не знайдено
            return;
          }
          
          // ✅ ПЕРЕВІРЯЄМО ЧИ Є ВЖЕ РОЗРАХОВАНІ КОЕФІЦІЄНТИ (ВІДРЕДАГОВАНІ)
          const existingResult = regionalResults.find(r => r.regionName === region.name);
          
          // ✅ КОНВЕРТУЄМО ДАНІ В RoadSection[]
          const roadSections = convertToRoadSections(region);
          const totalLength = region.totalLength;
          
          // ✅ ВИКОРИСТОВУЄМО ФУНКЦІЇ З МОДУЛЯ block_two.ts
          // ✅ ЗГІДНО З П.3.5 МЕТОДИКИ (ФОРМУЛА ДЛЯ ДЕРЖАВНИХ ДОРІГ):
          // Qiд = Σ(Hjд × Lijд) × Kд × Kг × Kуе × Kінт.д × Kе.д × Kмпп.д × Kосв × Kрем × Kкр.і
          //
          // ✅ ЗГІДНО З П.3.6 МЕТОДИКИ (ФОРМУЛА ДЛЯ МІСЦЕВИХ ДОРІГ):
          // Qiм = Σ(Hjм × Lijм) × Kг × Kуе × Kінт.м

          const kIntensity = calculateTrafficIntensityCoefficient(roadSections, totalLength);

          let totalProduct: number;
          let coefficients: any;

          if (roadType === 'state') {
            // ✅ ДЛЯ ДЕРЖАВНИХ ДОРІГ - ВСІ КОЕФІЦІЄНТИ З П.3.5 МЕТОДИКИ
            const kEuropean = calculateEuropeanRoadCoefficient(roadSections, totalLength);
            const kBorder = calculateBorderCrossingCoefficient(roadSections, totalLength);
            const kLighting = calculateLightingCoefficient(roadSections, totalLength);
            const kRepair = calculateRepairCoefficient(roadSections, totalLength);
            const kCriticalInfra = calculateCriticalInfrastructureCoefficient(region.criticalInfraCount);
            
            // ✅ ВИКОРИСТОВУЄМО ВІДРЕДАГОВАНІ КОЕФІЦІЄНТИ ЯКЩО Є, ІНАКШЕ БАЗОВІ
            coefficients = {
              mountainous: existingResult?.coefficients.mountainous || regionCoeff.mountainous,
              operatingConditions: existingResult?.coefficients.operatingConditions || regionCoeff.operatingConditions,
              trafficIntensity: existingResult?.coefficients.trafficIntensity || kIntensity,
              europeanRoad: existingResult?.coefficients.europeanRoad || kEuropean,
              borderCrossing: existingResult?.coefficients.borderCrossing || kBorder,
              lighting: existingResult?.coefficients.lighting || kLighting,
              repair: existingResult?.coefficients.repair || kRepair,
              criticalInfra: existingResult?.coefficients.criticalInfra || kCriticalInfra,
              totalProduct: 0
            };
            
            // ✅ Добуток всіх коефіцієнтів для державних доріг (формула п.3.5 Методики)
            totalProduct = 
              1.16 * // K_д - коефіцієнт обслуговування держ. доріг (сталий)
              coefficients.mountainous * 
              coefficients.operatingConditions * 
              coefficients.trafficIntensity * 
              coefficients.europeanRoad * 
              coefficients.borderCrossing * 
              coefficients.lighting * 
              coefficients.repair * 
              coefficients.criticalInfra;
          } else {
            // ДЛЯ МІСЦЕВИХ ДОРІГ - тільки K_г × K_уе × K_інт.м (формула п.3.6)
            coefficients = {
              mountainous: existingResult?.coefficients.mountainous || regionCoeff.mountainous,
              operatingConditions: existingResult?.coefficients.operatingConditions || regionCoeff.operatingConditions,
              trafficIntensity: existingResult?.coefficients.trafficIntensity || kIntensity,
              totalProduct: 0
            };
            
            totalProduct = 
              coefficients.mountainous * 
              coefficients.operatingConditions * 
              coefficients.trafficIntensity;
          }
          
          coefficients.totalProduct = totalProduct;

          // ✅ Розрахунок фінансування по категоріях
          const stateTotalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);
          
          const fundingByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number } = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          };
          
          ([1, 2, 3, 4, 5] as const).forEach(category => {
            const rate = roadType === 'state' 
              ? calculateStateRoadMaintenanceRate(category, stateTotalInflationIndex)
              : calculateLocalRoadMaintenanceRate(category, stateTotalInflationIndex);
            const length = region.lengthByCategory[category];
            fundingByCategory[category] = rate * length * totalProduct;
          });
          
          const totalFunding = Object.values(fundingByCategory).reduce((sum, val) => sum + val, 0);
          
          results.push({
            regionName: region.name,
            coefficients,
            fundingByCategory,
            totalFunding
          });
        });
        
        console.log('✅ Розрахунок завершено:', results);
        setRegionalResults(results);
        
        // ✅ ЗБЕРІГАЄМО В REDUX ДЛЯ PDF ЗВІТУ
        dispatch(setRegionalResultsAction(results));
        dispatch(setRegionalResultsRoadTypeAction(roadType));
        dispatch(setSelectedRegionAction(selectedRegion)); // ✅ ЗБЕРІГАЄМО ВИБРАНИЙ РЕГІОН
        console.log('✅ Дані збережено в Redux для PDF');
        
        setIsCalculatingRegional(false);
        
      } catch (error) {
        console.error('Помилка розрахунку:', error);
        alert('Помилка при виконанні розрахунків');
        setIsCalculatingRegional(false);
      }
    }, 1000);
  };

  // ==================== ЕКСПОРТ РЕЗУЛЬТАТІВ ====================
  
  const exportRegionalResults = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const roadTypeLabel = roadType === 'state' ? 'ДЕРЖАВНИХ' : 'МІСЦЕВИХ';
      const stageNumber = roadType === 'state' ? '2.4' : '2.7';
      const fundingStage = roadType === 'state' ? '2.5' : '2.8';
      
      // Аркуш 1: Коефіцієнти
      const coeffData: any[][] = [
        [`ЕТАП ${stageNumber}: СЕРЕДНЬОЗВАЖЕНІ КОРИГУВАЛЬНІ КОЕФІЦІЄНТИ (${roadTypeLabel} ДОРОГИ)`],
        ['Розраховано з використанням функцій модуля block_two'],
        [],
      ];
      
      if (roadType === 'state') {
        coeffData.push(['Область', 'K_д', 'K_г', 'K_уе', 'K_інт.д', 'K_е.д', 'K_мпп.д', 'K_осв', 'K_рем', 'K_кр.і', 'Добуток коеф.']);
      } else {
        coeffData.push(['Область', 'K_г', 'K_уе', 'K_інт.м', 'Добуток коеф.']);
      }
      
      regionalResults.forEach(result => {
        if (roadType === 'state') {
          coeffData.push([
            result.regionName,
            1.16,
            result.coefficients.mountainous,
            result.coefficients.operatingConditions,
            result.coefficients.trafficIntensity,
            result.coefficients.europeanRoad || 1,
            result.coefficients.borderCrossing || 1,
            result.coefficients.lighting || 1,
            result.coefficients.repair || 1,
            result.coefficients.criticalInfra || 1,
            result.coefficients.totalProduct
          ]);
        } else {
          coeffData.push([
            result.regionName,
            result.coefficients.mountainous,
            result.coefficients.operatingConditions,
            result.coefficients.trafficIntensity,
            result.coefficients.totalProduct
          ]);
        }
      });
      
      const wsCoeff = XLSX.utils.aoa_to_sheet(coeffData);
      XLSX.utils.book_append_sheet(wb, wsCoeff, `Етап ${stageNumber} - Коефіцієнти`);
      
      // Аркуш 2: Обсяг фінансування
      const fundingData: any[][] = [
        [`ЕТАП ${fundingStage}: ОБСЯГ КОШТІВ НА ЕКСПЛУАТАЦІЙНЕ УТРИМАННЯ ${roadTypeLabel} ДОРІГ (тис. грн)`],
        [],
        ['Область', 'Категорія I', 'Категорія II', 'Категорія III', 'Категорія IV', 'Категорія V', 'РАЗОМ (тис. грн)', 'РАЗОМ (млн. грн)']
      ];
      
      regionalResults.forEach(result => {
        fundingData.push([
          result.regionName,
          Math.round(result.fundingByCategory[1]),
          Math.round(result.fundingByCategory[2]),
          Math.round(result.fundingByCategory[3]),
          Math.round(result.fundingByCategory[4]),
          Math.round(result.fundingByCategory[5]),
          Math.round(result.totalFunding),
          (result.totalFunding / 1000).toFixed(2)
        ]);
      });
      
      const totals = [
        'ВСЬОГО ПО УКРАЇНІ',
        Math.round(regionalResults.reduce((sum, r) => sum + r.fundingByCategory[1], 0)),
        Math.round(regionalResults.reduce((sum, r) => sum + r.fundingByCategory[2], 0)),
        Math.round(regionalResults.reduce((sum, r) => sum + r.fundingByCategory[3], 0)),
        Math.round(regionalResults.reduce((sum, r) => sum + r.fundingByCategory[4], 0)),
        Math.round(regionalResults.reduce((sum, r) => sum + r.fundingByCategory[5], 0)),
        Math.round(regionalResults.reduce((sum, r) => sum + r.totalFunding, 0)),
        (regionalResults.reduce((sum, r) => sum + r.totalFunding, 0) / 1000).toFixed(2)
      ];
      fundingData.push(totals);
      
      const wsFunding = XLSX.utils.aoa_to_sheet(fundingData);
      XLSX.utils.book_append_sheet(wb, wsFunding, `Етап ${fundingStage} - Фінансування`);
      
      const fileName = `Дороги_${roadTypeLabel}_Етапи_${stageNumber}-${fundingStage}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при експорті результатів');
    }
  };

  // ✅ ФУНКЦІЯ ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТІВ БЛОКУ 2
  const saveBlockTwoResults = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!currentSession?.id || regionalResults.length === 0) {
      alert("Немає результатів для збереження!");
      return;
    }

    try {
      const totalFunding = regionalResults.reduce((sum, r) => sum + r.totalFunding, 0);
      const stateFunding = roadType === 'state' ? totalFunding : 0;
      const localFunding = roadType === 'local' ? totalFunding : 0;

      // Рассчитываем нормативы по категориям
      const stateTotalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);
      const stateRates = {
        category1: calculateStateRoadMaintenanceRate(1, stateTotalInflationIndex),
        category2: calculateStateRoadMaintenanceRate(2, stateTotalInflationIndex),
        category3: calculateStateRoadMaintenanceRate(3, stateTotalInflationIndex),
        category4: calculateStateRoadMaintenanceRate(4, stateTotalInflationIndex),
        category5: calculateStateRoadMaintenanceRate(5, stateTotalInflationIndex)
      };
      const localRates = {
        category1: calculateLocalRoadMaintenanceRate(1, stateTotalInflationIndex),
        category2: calculateLocalRoadMaintenanceRate(2, stateTotalInflationIndex),
        category3: calculateLocalRoadMaintenanceRate(3, stateTotalInflationIndex),
        category4: calculateLocalRoadMaintenanceRate(4, stateTotalInflationIndex),
        category5: calculateLocalRoadMaintenanceRate(5, stateTotalInflationIndex)
      };

      const dataToSave = {
        sessionId: currentSession.id,
        stateRoadBaseRate: 8.25, // Базовий норматив для державних доріг
        localRoadBaseRate: 5.25, // Базовий норматив для місцевих доріг
        stateInflationIndexes,
        localInflationIndexes: stateInflationIndexes,
        selectedRegion: selectedRegion === 'all' ? 'Україна' : selectedRegion,
        stateRoadRates: stateRates,
        localRoadRates: localRates,
        fundingResults: {
          stateFunding,
          localFunding,
          totalFunding
        },
        regionalResults: regionalResults, // ✅ ДОДАЄМО РЕГІОНАЛЬНІ РЕЗУЛЬТАТИ
        regionalData: regionalData, // ✅ ДОДАЄМО ВИХІДНІ ДАНІ
        roadType: roadType // ✅ ДОДАЄМО ТИП ДОРІГ
      };
      
      console.log('💾 Збереження Block 2 даних:', {
        sessionId: dataToSave.sessionId,
        regionalResultsLength: regionalResults.length,
        regionalDataLength: regionalData.length,
        roadType: roadType,
        selectedRegion: dataToSave.selectedRegion
      });
      
      const result = await dispatch(saveBlockTwoData(dataToSave));

      if (result.type.endsWith('/fulfilled')) {
        const message = `✅ Успішно збережено!\n\n` +
          `📊 Регіональні результати: ${regionalResults.length} областей\n` +
          `💰 Загальне фінансування: ${totalFunding.toLocaleString()} тис. грн\n` +
          `🛣️ Тип доріг: ${roadType === 'state' ? 'Державні' : 'Місцеві'}\n\n` +
          `Перегляньте детальні таблиці в розділі "Історія"`;
        alert(message);
      } else {
        console.error('Помилка збереження:', result);
        alert('Помилка при збереженні результатів');
      }
    } catch (error: any) {
      console.error('Помилка збереження:', error);
      
      // Перевіряємо чи це помилка Redux Persist
      if (error?.message?.includes('Eo is not a function') || error?.message?.includes('reconciler')) {
        const shouldClear = confirm(
          '⚠️ Виявлено проблему з кешем додатку.\n\n' +
          'Натисніть "OK" щоб очистити дані та перезавантажити сторінку.\n' +
          'Натисніть "Скасувати" щоб продовжити без очищення.'
        );
        
        if (shouldClear) {
          localStorage.removeItem('persist:root');
          window.location.reload();
        }
      } else {
        alert('Помилка при збереженні результатів: ' + (error?.message || 'Невідома помилка'));
      }
    }
  };

  // Очищаємо результати при зміні типу доріг
  React.useEffect(() => {
    setRegionalResults([]);
    // ✅ ТАКОЖ ОЧИЩАЄМО В REDUX
    dispatch(setRegionalResultsAction([]));
    dispatch(setRegionalResultsRoadTypeAction(roadType));
  }, [roadType, dispatch]);

  // ==================== RENDER ====================

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5" />
          Розрахунок обсягу коштів на ЕУ доріг
        </CardTitle>
        <CardDescription>
          Оберіть тип доріг та завантажте Excel шаблон з даними про дороги по областях.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* ✅ ПОКАЗУЄМО Q1 ТА Q2 З БЛОКУ 1 */}
        {hasBlockOneData && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold text-blue-900">Дані з Розрахунок бюджетного фінансування доріг</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-blue-700">
                      {q1Value ? q1Value.toLocaleString() : '—'} тис. грн
                    </div>
                    <div className="text-xs text-gray-600">Q₁ (Державні дороги)</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-lg font-bold text-green-700">
                      {q2Value ? q2Value.toLocaleString() : '—'} тис. грн
                    </div>
                    <div className="text-xs text-gray-600">Q₂ (Місцеві дороги)</div>
                  </div>
                </div>
                <div className="text-xs text-blue-700">
                  💡 Ці значення будуть використані для розрахунку залишку коштів на ремонти
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ ПОПЕРЕДЖЕННЯ ЯКЩО НЕМАЄ ДАНИХ З БЛОКУ 1 */}
        {!hasBlockOneData && (
          <Alert className="bg-yellow-50 border-yellow-400">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Немає даних з "Розрахунків бюджетного фінансування доріг"</strong>
              <div className="text-sm mt-1">
                Спочатку перейдіть на вкладку "Визначення обсягу бюджетного фінансування" 
                та виконайте розрахунки Q₁ та Q₂.
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* ВИБІР ТИПУ ДОРІГ */}
        <Alert className="bg-purple-50 border-purple-300">
          <AlertDescription>
            <div className="space-y-3">
              <div className="font-semibold text-purple-900 text-sm md:text-base">Оберіть тип доріг для розрахунку:</div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={() => setRoadType('state')}
                  variant={roadType === 'state' ? 'default' : 'outline'}
                  className={`${roadType === 'state' ? 'bg-blue-600 hover:bg-blue-700' : ''} text-sm md:text-base flex-1 sm:flex-initial`}
                >
                  🏛️ Державного значення
                </Button>
                <Button
                  onClick={() => setRoadType('local')}
                  variant={roadType === 'local' ? 'default' : 'outline'}
                  className={`${roadType === 'local' ? 'bg-green-600 hover:bg-green-700' : ''} text-sm md:text-base flex-1 sm:flex-initial`}
                >
                  🏘️ Місцевого значення
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Завантаження файлу */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="space-y-4">
              <div className="text-sm md:text-base">
                Завантажте Excel шаблон з вихідними даними про дороги по областях
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm md:text-base w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  Завантажити таблицю
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/templates/шаблон_державні.xlsx';
                    link.download = 'шаблон_державні.xlsx';
                    link.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-sm md:text-base w-full justify-center"
                >
                  <Download className="h-4 w-4" />
                  Шаблон державні
                </Button>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/templates/шаблон_місцеві.xlsx';
                    link.download = 'шаблон_місцеві.xlsx';
                    link.click();
                  }}
                  variant="outline"
                  className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 text-sm md:text-base w-full justify-center sm:col-span-2 lg:col-span-1"
                >
                  <Download className="h-4 w-4" />
                  Шаблон місцеві
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleTemplateUpload}
          className="hidden"
        />

        {uploadStatus && (
          <Alert className={uploadStatus.includes('✓') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <AlertDescription className="flex items-center gap-2">
              {uploadStatus.includes('✓') ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertTriangle className="h-4 w-4 text-red-600" />
              }
              {uploadStatus}
            </AlertDescription>
          </Alert>
        )}

        {/* Таблиця завантажених даних */}
        {regionalData.length > 0 && (
            <>
              {/* ФІЛЬТР ПО ОБЛАСТЯХ */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Фільтр по області:
                      </label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => {
                          setSelectedRegion(e.target.value);
                          dispatch(setSelectedRegionAction(e.target.value)); // ✅ ЗБЕРІГАЄМО В REDUX
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Всі області ({regionalData.length})</option>
                        {regionalData.map((region, idx) => (
                          <option key={idx} value={region.name}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedRegion !== 'all' && (
                      <Button
                        onClick={() => {
                          setSelectedRegion('all');
                          dispatch(setSelectedRegionAction('all')); // ✅ ЗБЕРІГАЄМО В REDUX
                        }}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        Показати всі
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 1. ЗАВАНТАЖЕНІ ДАНІ ПО ОБЛАСТЯХ - З РЕДАГУВАННЯМ */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">
                          Завантажені дані по областях України
                          <span className={roadType === 'state' ? 'text-blue-600' : 'text-green-600'}>
                            ({roadType === 'state' ? 'державні дороги' : 'місцеві дороги'})
                          </span>
                        </CardTitle>
                        {isEditing && (
                          <p className="text-xs text-blue-600 mt-1">✏️ Режим редагування активний</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        className="flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">{isEditing ? 'Завершити редагування' : 'Редагувати дані'}</span>
                        <span className="sm:hidden">{isEditing ? 'Завершити' : 'Редагувати'}</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={calculateRegionalFinancing}
                        disabled={isCalculatingRegional}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto justify-center"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{isCalculatingRegional ? 'Розраховуємо...' : 'Розрахувати обсяг коштів'}</span>
                        <span className="sm:hidden">{isCalculatingRegional ? 'Розраховуємо...' : 'Розрахувати'}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto border-2 border-gray-300 rounded">
                    <div className="overflow-y-auto max-h-[400px]" style={{minWidth: '100%'}}>
                      <table className="w-full text-xs border-collapse" style={{minWidth: '1200px'}}>
                      <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr>
                          <th className="border border-gray-400 p-2 text-left whitespace-nowrap min-w-[150px]" rowSpan={2}>Найменування області</th>
                          <th className="border border-gray-400 p-2 text-center whitespace-normal" colSpan={6}>
                            Протяжність доріг {roadType === 'state' ? 'державного' : 'місцевого'} значення (км)
                          </th>
                          {roadType === 'state' && (
                            <th className="border border-gray-400 p-2 text-center whitespace-normal min-w-[80px]">
                              Протяжність доріг з індексом Е
                            </th>
                          )}
                          <th className="border border-gray-400 p-2 text-center whitespace-normal" colSpan={3}>
                            Протяжність доріг з середньодобовою інтенсивністю
                          </th>
                          {roadType === 'state' && (
                            <th className="border border-gray-400 p-2 text-center whitespace-nowrap" colSpan={5}>
                              Інші показники
                            </th>
                          )}
                        </tr>
                        <tr>
                          <th className="border border-gray-400 p-1 text-center min-w-[60px]">I</th>
                          <th className="border border-gray-400 p-1 text-center min-w-[60px]">II</th>
                          <th className="border border-gray-400 p-1 text-center min-w-[60px]">III</th>
                          <th className="border border-gray-400 p-1 text-center min-w-[60px]">IV</th>
                          <th className="border border-gray-400 p-1 text-center min-w-[60px]">V</th>
                          <th className="border border-gray-400 p-1 text-center bg-yellow-50 min-w-[80px]">Разом</th>
                          {roadType === 'state' && (
                            <th className="border border-gray-400 p-1 text-center min-w-[80px]"></th>
                          )}
                          <th className="border border-gray-400 p-1 text-center text-[10px] whitespace-nowrap min-w-[80px]">15000-20000</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px] whitespace-nowrap min-w-[80px]">20001-30000</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px] whitespace-nowrap min-w-[90px]">30001 і більше</th>
                          {roadType === 'state' && (
                            <>
                              <th className="border border-gray-400 p-1 text-center text-[10px] min-w-[60px]">МПП</th>
                              <th className="border border-gray-400 p-1 text-center text-[10px] min-w-[60px]">Освітл.</th>
                              <th className="border border-gray-400 p-1 text-center text-[10px] min-w-[70px]">Ремонт</th>
                              <th className="border border-gray-400 p-1 text-center text-[10px] min-w-[70px]">Кр.інф.</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {regionalData
                          .filter(region => selectedRegion === 'all' || region.name === selectedRegion)
                          .map((region, filteredIdx) => {
                            // Находим реальный индекс в исходном массиве
                            const realIdx = regionalData.findIndex(r => r.name === region.name);
                            return (
                          <tr key={realIdx} className={filteredIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 p-2 whitespace-nowrap sticky left-0 bg-inherit">{region.name}</td>

                            {([1, 2, 3, 4, 5] as const).map(cat => (
                              <td key={`cat-${cat}`} className="border border-gray-300 p-1 min-w-[60px]">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={region.lengthByCategory[cat]}
                                    onChange={(e) => {
                                      const newData = [...regionalData];
                                      newData[realIdx].lengthByCategory[cat] = parseNumberInput(e.target.value, 0);
                                      newData[realIdx].totalLength = Object.values(newData[realIdx].lengthByCategory).reduce((sum, val) => sum + val, 0);
                                      setRegionalData(newData);
                                    }}
                                    onPaste={handleNativeInputPaste}
                                    className="w-full text-right p-1 border-0 bg-blue-50 focus:bg-blue-100 rounded min-w-[50px]"
                                    style={{ fontSize: '11px' }}
                                  />
                                ) : (
                                  <div className="text-right whitespace-nowrap">{region.lengthByCategory[cat]}</div>
                                )}
                              </td>
                            ))}

                            <td className="border border-gray-300 p-2 text-right font-bold bg-yellow-50 whitespace-nowrap min-w-[80px]">{region.totalLength.toFixed(0)}</td>
                            
                            {roadType === 'state' && (
                              <td className="border border-gray-300 p-1 min-w-[80px]">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={region.europeanIndexLength}
                                    onChange={(e) => {
                                      const newData = [...regionalData];
                                      newData[realIdx].europeanIndexLength = parseNumberInput(e.target.value, 0);
                                      setRegionalData(newData);
                                    }}
                                    onPaste={handleNativeInputPaste}
                                    className="w-full text-right p-1 border-0 bg-orange-50 focus:bg-orange-100 rounded min-w-[50px]"
                                    style={{ fontSize: '11px' }}
                                  />
                                ) : (
                                  <div className="text-right whitespace-nowrap">{region.europeanIndexLength}</div>
                                )}
                              </td>
                            )}

                            <td className="border border-gray-300 p-1 min-w-[80px]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.medium}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[realIdx].lengthByIntensity.medium = parseNumberInput(e.target.value, 0);
                                    setRegionalData(newData);
                                  }}
                                  onPaste={handleNativeInputPaste}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded min-w-[50px]"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right whitespace-nowrap">{region.lengthByIntensity.medium}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1 min-w-[80px]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.high}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[realIdx].lengthByIntensity.high = parseNumberInput(e.target.value, 0);
                                    setRegionalData(newData);
                                  }}
                                  onPaste={handleNativeInputPaste}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded min-w-[50px]"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right whitespace-nowrap">{region.lengthByIntensity.high}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1 min-w-[90px]">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.veryHigh}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[realIdx].lengthByIntensity.veryHigh = parseNumberInput(e.target.value, 0);
                                    setRegionalData(newData);
                                  }}
                                  onPaste={handleNativeInputPaste}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded min-w-[50px]"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right whitespace-nowrap">{region.lengthByIntensity.veryHigh}</div>
                              )}
                            </td>
                            
                            {roadType === 'state' && (
                              <>
                                <td className="border border-gray-300 p-1 min-w-[60px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={region.borderCrossingLength}
                                      onChange={(e) => {
                                        const newData = [...regionalData];
                                        newData[realIdx].borderCrossingLength = parseNumberInput(e.target.value, 0);
                                        setRegionalData(newData);
                                      }}
                                      onPaste={handleNativeInputPaste}
                                      className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded min-w-[50px]"
                                      style={{ fontSize: '11px' }}
                                    />
                                  ) : (
                                    <div className="text-right whitespace-nowrap">{region.borderCrossingLength}</div>
                                  )}
                                </td>
                                <td className="border border-gray-300 p-1 min-w-[60px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={region.lightingLength}
                                      onChange={(e) => {
                                        const newData = [...regionalData];
                                        newData[realIdx].lightingLength = parseNumberInput(e.target.value, 0);
                                        setRegionalData(newData);
                                      }}
                                      onPaste={handleNativeInputPaste}
                                      className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded min-w-[50px]"
                                      style={{ fontSize: '11px' }}
                                    />
                                  ) : (
                                    <div className="text-right whitespace-nowrap">{region.lightingLength}</div>
                                  )}
                                </td>
                                <td className="border border-gray-300 p-1 min-w-[70px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={region.repairedLength}
                                      onChange={(e) => {
                                        const newData = [...regionalData];
                                        newData[realIdx].repairedLength = parseNumberInput(e.target.value, 0);
                                        setRegionalData(newData);
                                      }}
                                      onPaste={handleNativeInputPaste}
                                      className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded min-w-[50px]"
                                      style={{ fontSize: '11px' }}
                                    />
                                  ) : (
                                    <div className="text-right whitespace-nowrap">{region.repairedLength}</div>
                                  )}
                                </td>
                                <td className="border border-gray-300 p-1 min-w-[70px]">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={region.criticalInfraCount}
                                      onChange={(e) => {
                                        const newData = [...regionalData];
                                        newData[realIdx].criticalInfraCount = parseNumberInput(e.target.value, 0);
                                        setRegionalData(newData);
                                      }}
                                      onPaste={handleNativeInputPaste}
                                      className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded min-w-[50px]"
                                      style={{ fontSize: '11px' }}
                                    />
                                  ) : (
                                    <div className="text-right whitespace-nowrap">{region.criticalInfraCount}</div>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {regionalResults.length > 0 && (
                <>
                  {/* 2. КОЕФІЦІЄНТИ */}
                  <Card className={roadType === 'state' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-green-50 border-2 border-green-300'}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className={roadType === 'state' ? 'text-blue-800 text-base' : 'text-green-800 text-base'}>
                          📊 Середньозважені коригувальні коефіцієнти
                        </CardTitle>
                        {isEditing && (
                          <Button
                            onClick={calculateRegionalFinancing}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            Перерахувати з новими коефіцієнтами
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`overflow-x-auto border rounded ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>
                        <div className="overflow-y-auto max-h-[500px]" style={{minWidth: '100%'}}>
                          <table className="w-full text-xs border-collapse" style={{minWidth: roadType === 'state' ? '1000px' : '600px'}}>
                          <thead className={`sticky top-0 z-10 ${roadType === 'state' ? 'bg-blue-200' : 'bg-green-200'}`}>
                            <tr>
                              <th className={`border p-2 whitespace-nowrap min-w-[150px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>Область</th>
                              {roadType === 'state' && <th className="border border-blue-300 p-2 min-w-[70px]">K<sub>д</sub></th>}
                              <th className={`border p-2 min-w-[70px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>K<sub>г</sub></th>
                              <th className={`border p-2 min-w-[70px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>K<sub>уе</sub></th>
                              <th className={`border p-2 whitespace-nowrap min-w-[80px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>
                                K<sub>інт.{roadType === 'state' ? 'д' : 'м'}</sub>
                              </th>
                              {roadType === 'state' && (
                                <>
                                  <th className="border border-blue-300 p-2 whitespace-nowrap min-w-[70px]">K<sub>е.д</sub></th>
                                  <th className="border border-blue-300 p-2 whitespace-nowrap min-w-[80px]">K<sub>мпп.д</sub></th>
                                  <th className="border border-blue-300 p-2 min-w-[70px]">K<sub>осв</sub></th>
                                  <th className="border border-blue-300 p-2 min-w-[70px]">K<sub>рем</sub></th>
                                  <th className="border border-blue-300 p-2 whitespace-nowrap min-w-[70px]">K<sub>кр.і</sub></th>
                                </>
                              )}
                              <th className={`border p-2 bg-yellow-100 whitespace-nowrap min-w-[100px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>Добуток</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regionalResults
                              .filter(result => selectedRegion === 'all' || result.regionName === selectedRegion)
                              .map((result, filteredIdx) => {
                                // Находим реальный индекс в исходном массиве
                                const realIdx = regionalResults.findIndex(r => r.regionName === result.regionName);
                              let currentProduct;
                              if (roadType === 'state') {
                                currentProduct = 
                                  1.16 * 
                                  result.coefficients.mountainous * 
                                  result.coefficients.operatingConditions * 
                                  result.coefficients.trafficIntensity * 
                                  (result.coefficients.europeanRoad || 1) * 
                                  (result.coefficients.borderCrossing || 1) * 
                                  (result.coefficients.lighting || 1) * 
                                  (result.coefficients.repair || 1) * 
                                  (result.coefficients.criticalInfra || 1);
                              } else {
                                currentProduct = 
                                  result.coefficients.mountainous * 
                                  result.coefficients.operatingConditions * 
                                  result.coefficients.trafficIntensity;
                              }

                              return (
                                <tr key={realIdx} className={filteredIdx % 2 === 0 ? 'bg-white' : roadType === 'state' ? 'bg-blue-50' : 'bg-green-50'}>
                                  <td className={`border p-2 whitespace-nowrap min-w-[150px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>{result.regionName}</td>
                                  {roadType === 'state' && (
                                    <td className="border border-blue-300 p-2 text-center bg-gray-100 whitespace-nowrap min-w-[70px]">1.1600</td>
                                  )}
                                  
                                  {/* Редаговані коефіцієнти */}
                                  {['mountainous', 'operatingConditions', 'trafficIntensity'].map((key) => {
                                    const regionCoeff = regionCoefficients.find(r => r.regionalName === result.regionName);
                                    const originalValue = (regionCoeff?.[key as keyof typeof regionCoeff] as number) || 1;
                                    const currentValue = result.coefficients[key as keyof typeof result.coefficients] as number;
                                    const isEdited = Math.abs(currentValue - originalValue) > 0.0001;
                                    
                                    return (
                                      <td key={key} className={`border p-1 whitespace-nowrap min-w-[70px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'} ${isEdited ? 'bg-yellow-50' : ''}`}>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={currentValue}
                                            onChange={(e) => {
                                              const newResults = [...regionalResults];
                                              const keyTyped = key as keyof typeof newResults[number]['coefficients'];
                                              const parsedValue = parseNumberInput(e.target.value, 1);
                                              (newResults[realIdx].coefficients[keyTyped] as number) = parsedValue;
                                              setRegionalResults(newResults);
                                            }}
                                            onPaste={handleNativeInputPaste}
                                            className={`w-full text-center p-1 border-0 rounded min-w-[60px] ${roadType === 'state' ? 'bg-blue-50 focus:bg-blue-100' : 'bg-green-50 focus:bg-green-100'} ${isEdited ? 'border-yellow-300' : ''}`}
                                            style={{ fontSize: '11px' }}
                                          />
                                        ) : (
                                          <div className={`text-center ${isEdited ? 'font-bold text-yellow-700' : ''}`}>
                                            {currentValue.toFixed(4)}
                                            {isEdited && <div className="text-xs text-yellow-600">*</div>}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                  
                                  {roadType === 'state' && ['europeanRoad', 'borderCrossing', 'lighting', 'repair', 'criticalInfra'].map((key) => {
                                    const currentValue = (result.coefficients[key as keyof typeof result.coefficients] as number) || 1;
                                    const isEdited = Math.abs(currentValue - 1) > 0.0001; // Для этих коэффициентов базовое значение 1

                                    return (
                                      <td key={key} className={`border border-blue-300 p-1 whitespace-nowrap min-w-[70px] ${isEdited ? 'bg-yellow-50' : ''}`}>
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={currentValue}
                                            onChange={(e) => {
                                              const newResults = [...regionalResults];
                                              const keyTyped = key as keyof typeof newResults[number]['coefficients'];
                                              const parsedValue = parseNumberInput(e.target.value, 1);
                                              (newResults[realIdx].coefficients[keyTyped] as number) = parsedValue;
                                              setRegionalResults(newResults);
                                            }}
                                            onPaste={handleNativeInputPaste}
                                            className={`w-full text-center p-1 border-0 bg-blue-50 focus:bg-blue-100 rounded min-w-[60px] ${isEdited ? 'border-yellow-300' : ''}`}
                                            style={{ fontSize: '11px' }}
                                          />
                                        ) : (
                                          <div className={`text-center ${isEdited ? 'font-bold text-yellow-700' : ''}`}>
                                            {currentValue.toFixed(4)}
                                            {isEdited && <div className="text-xs text-yellow-600">*</div>}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}

                                  <td className={`border p-2 text-center bg-yellow-50 font-bold whitespace-nowrap min-w-[100px] ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>
                                    {isEditing ? currentProduct.toFixed(4) : result.coefficients.totalProduct.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </div>
                      
                      {/* Пояснення */}
                      <Alert className={`mt-4 bg-white ${roadType === 'state' ? 'border-blue-300' : 'border-green-300'}`}>
                        <AlertDescription className="text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            {roadType === 'state' && <div><strong>K<sub>д</sub></strong> - обслуговування держ. доріг (1.16)</div>}
                            <div><strong>K<sub>г</sub></strong> - гірська місцевість</div>
                            <div><strong>K<sub>уе</sub></strong> - умови експлуатації</div>
                            <div><strong>K<sub>інт.{roadType === 'state' ? 'д' : 'м'}</sub></strong> - інтенсівність руху</div>
                            {roadType === 'state' && (
                              <>
                                <div><strong>K<sub>е.д</sub></strong> - європейська мережа</div>
                                <div><strong>K<sub>мпп.д</sub></strong> - міжнародні пункти пропуску</div>
                                <div><strong>K<sub>осв</sub></strong> - освітлення доріг</div>
                                <div><strong>K<sub>рем</sub></strong> - нещодавно відремонтовані</div>
                                <div><strong>K<sub>кр.і</sub></strong> - критична інфраструктура</div>
                              </>
                            )}
                          </div>
                          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <div className="text-yellow-800 font-semibold">💡 Пояснення:</div>
                            <div className="text-yellow-700">
                              • <strong>Жовтий фон</strong> - відредаговані коефіцієнти<br/>
                              • <strong>Зірочка (*)</strong> - показує, що значення змінено вручну<br/>
                              • При перерахунку використовуються відредаговані значення
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* 3. ТАБЛИЦЯ РЕЗУЛЬТАТІВ */}
                  <Card className={roadType === 'state' ? 'bg-green-50 border-2 border-green-300' : 'bg-blue-50 border-2 border-blue-300'}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className={roadType === 'state' ? 'text-green-800' : 'text-blue-800'}>
                          💰 Обсяг коштів на експлуатаційне утримання
                        </CardTitle>
                        <Button
                          onClick={exportRegionalResults}
                          className={roadType === 'state' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Завантажити результати
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white border-2 border-gray-400 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <div className="overflow-y-auto max-h-[600px]" style={{minWidth: '100%'}}>
                            <table className="w-full text-xs border-collapse" style={{minWidth: '1400px'}}>
                            <thead className="sticky top-0 z-20 bg-gray-200">
                              <tr>
                                <th className="border-2 border-gray-400 p-3 text-center font-bold" colSpan={14}>
                                  Розподіл витрат на експлуатаційне утримання (ЕУ) доріг {roadType === 'state' ? 'державного' : 'місцевого'} значення
                                </th>
                              </tr>
                              <tr>
                                <th className="border border-gray-400 p-2 font-bold whitespace-nowrap min-w-[150px]" rowSpan={2}>
                                  Найменування<br/>області
                                </th>
                                <th className="border border-gray-400 p-2 bg-blue-100 font-bold text-center whitespace-normal" colSpan={6}>
                                  Протяжність доріг {roadType === 'state' ? 'державного' : 'місцевого'} значення (км)
                                </th>
                                <th className="border border-gray-400 p-2 bg-green-100 font-bold text-center whitespace-normal" colSpan={7}>
                                  Мінімальна потреба в фінансових ресурсах на 20ХХ рік, тис.грн
                                </th>
                              </tr>
                              <tr>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50 min-w-[70px]">I</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50 min-w-[70px]">II</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50 min-w-[70px]">III</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50 min-w-[70px]">IV</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50 min-w-[70px]">V</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-100 font-bold min-w-[100px]">Разом</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50 min-w-[100px]">I</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50 min-w-[100px]">II</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50 min-w-[100px]">III</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50 min-w-[100px]">IV</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50 min-w-[100px]">V</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-100 font-bold whitespace-nowrap min-w-[120px]">Разом<br/>потреб</th>
                                <th className="border border-gray-400 p-1 text-center bg-yellow-100 font-bold min-w-[80px]">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {regionalData
                                .filter(region => selectedRegion === 'all' || region.name === selectedRegion)
                                .map((region, filteredIdx) => {
                                  // Находим реальный индекс в исходном массиве
                                  const realIdx = regionalData.findIndex(r => r.name === region.name);
                                const totalFunding = regionalResults.reduce((sum, r) => sum + r.totalFunding, 0);
                                const regionResult = regionalResults.find(r => r.regionName === region.name);
                                const percentage = regionResult ? (regionResult.totalFunding / totalFunding * 100) : 0;
                                
                                return (
                                  <tr key={realIdx} className={filteredIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-400 p-2 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap min-w-[150px]">
                                      {region.name}
                                    </td>
                                    {([1, 2, 3, 4, 5] as const).map(cat => (
                                      <td key={`length-${cat}`} className="border border-gray-400 p-2 text-right whitespace-nowrap min-w-[70px]">
                                        {region.lengthByCategory[cat] || '-'}
                                      </td>
                                    ))}
                                    <td className="border border-gray-400 p-2 text-right font-bold bg-blue-50 whitespace-nowrap min-w-[100px]">
                                      {region.totalLength.toFixed(0)}
                                    </td>
                                    {([1, 2, 3, 4, 5] as const).map(cat => (
                                      <td key={`funding-${cat}`} className="border border-gray-400 p-2 text-right whitespace-nowrap min-w-[100px]">
                                        {regionResult?.fundingByCategory?.[cat]
                                          ? regionResult.fundingByCategory[cat].toLocaleString('uk-UA', {maximumFractionDigits: 0})
                                          : '-'
                                        }
                                      </td>
                                    ))}
                                    <td className="border border-gray-400 p-2 text-right font-bold bg-green-50 whitespace-nowrap min-w-[120px]">
                                      {regionResult?.totalFunding
                                        ? regionResult.totalFunding.toLocaleString('uk-UA', {maximumFractionDigits: 0})
                                        : '-'
                                      }
                                    </td>
                                    <td className="border border-gray-400 p-2 text-right font-bold bg-yellow-50 whitespace-nowrap min-w-[80px]">
                                      {percentage.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-gray-300 font-bold">
                                <td className="border-2 border-gray-400 p-3 whitespace-nowrap min-w-[150px]">
                                  {selectedRegion === 'all' ? 'ВСЬОГО ПО УКРАЇНІ' : `ВСЬОГО ПО ${selectedRegion.toUpperCase()}`}
                                </td>
                                {([1, 2, 3, 4, 5] as const).map(cat => (
                                  <td key={`total-length-${cat}`} className="border-2 border-gray-400 p-2 text-right whitespace-nowrap min-w-[70px]">
                                    {regionalData
                                      .filter(region => selectedRegion === 'all' || region.name === selectedRegion)
                                      .reduce((sum, r) => sum + r.lengthByCategory[cat], 0).toFixed(0)}
                                  </td>
                                ))}
                                <td className="border-2 border-gray-400 p-2 text-right bg-blue-100 text-base whitespace-nowrap min-w-[100px]">
                                  {regionalData
                                    .filter(region => selectedRegion === 'all' || region.name === selectedRegion)
                                    .reduce((sum, r) => sum + r.totalLength, 0).toFixed(0)}
                                </td>
                                {([1, 2, 3, 4, 5] as const).map(cat => (
                                  <td key={`total-funding-${cat}`} className="border-2 border-gray-400 p-2 text-right whitespace-nowrap min-w-[100px]">
                                    {regionalResults
                                      .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                      .reduce((sum, r) => sum + (r.fundingByCategory?.[cat] || 0), 0)
                                      .toLocaleString('uk-UA', {maximumFractionDigits: 0})}
                                  </td>
                                ))}
                                <td className="border-2 border-gray-400 p-2 text-right bg-green-100 text-lg whitespace-nowrap min-w-[120px]">
                                  {regionalResults
                                    .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                    .reduce((sum, r) => sum + r.totalFunding, 0)
                                    .toLocaleString('uk-UA', {maximumFractionDigits: 0})}
                                </td>
                                <td className="border-2 border-gray-400 p-2 text-right bg-yellow-100 text-base whitespace-nowrap min-w-[80px]">
                                  {selectedRegion === 'all' ? '100.00' : '100.00'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          </div>
                        </div>
                      </div>

                      {/* СТАТИСТИКА */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">
                            {selectedRegion === 'all' 
                              ? regionalResults.length 
                              : regionalResults.filter(r => r.regionName === selectedRegion).length
                            }
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {selectedRegion === 'all' ? 'Областей проаналізовано' : 'Областей показано'}
                          </div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">
                            {regionalData
                              .filter(region => selectedRegion === 'all' || region.name === selectedRegion)
                              .reduce((sum, r) => sum + r.totalLength, 0).toFixed(0)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {selectedRegion === 'all' ? 'Загальна довжина (км)' : 'Довжина (км)'}
                          </div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow sm:col-span-2 lg:col-span-1">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-700">
                            {(regionalResults
                              .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                              .reduce((sum, r) => sum + r.totalFunding, 0) / 1000000).toFixed(2)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {selectedRegion === 'all' ? 'Млрд. грн (загалом)' : 'Млрд. грн'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. РОЗРАХУНОК ЗАЛИШКУ КОШТІВ */}
                  {hasBlockOneData && (
                    <Card className="bg-orange-50 border-2 border-orange-300">
                      <CardHeader>
                        <CardTitle className="text-orange-800 text-base">
                          🧮 Розрахунок залишку коштів на ремонти
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            <div className="text-center p-3 sm:p-4 bg-white rounded border">
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">
                                {roadType === 'state' ? 'Q₁ (Державні дороги)' : 'Q₂ (Місцеві дороги)'}
                              </div>
                              <div className="text-base sm:text-lg md:text-2xl font-bold text-blue-700 break-all">
                                {roadType === 'state' ? 
                                  (q1Value ? q1Value.toLocaleString() : '—') : 
                                  (q2Value ? q2Value.toLocaleString() : '—')
                                } тис. грн
                              </div>
                            </div>
                            
                            <div className="text-center p-3 sm:p-4 bg-white rounded border">
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">
                                {selectedRegion === 'all' ? 'Витрати на ЕУ' : 'Витрати на ЕУ (фільтр)'}
                              </div>
                              <div className="text-base sm:text-lg md:text-2xl font-bold text-red-700 break-all">
                                {regionalResults
                                  .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                  .reduce((sum, r) => sum + r.totalFunding, 0).toLocaleString()} тис. грн
                              </div>
                            </div>
                            
                            <div className="text-center p-3 sm:p-4 bg-white rounded border sm:col-span-2 lg:col-span-1">
                              <div className="text-xs sm:text-sm text-gray-600 mb-1">Залишок на ремонти</div>
                              <div className={`text-base sm:text-lg md:text-2xl font-bold break-all ${
                                (() => {
                                  const totalEU = regionalResults
                                    .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                    .reduce((sum, r) => sum + r.totalFunding, 0);
                                  const available = roadType === 'state' ? (q1Value || 0) : (q2Value || 0);
                                  const remainder = available - totalEU;
                                  return remainder >= 0 ? 'text-green-700' : 'text-red-700';
                                })()
                              }`}>
                                {(() => {
                                  const totalEU = regionalResults
                                    .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                    .reduce((sum, r) => sum + r.totalFunding, 0);
                                  const available = roadType === 'state' ? (q1Value || 0) : (q2Value || 0);
                                  const remainder = available - totalEU;
                                  return remainder.toLocaleString();
                                })()} тис. грн
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 5. КНОПКА ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТІВ */}
                  <Card className="bg-blue-50 border-2 border-blue-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-900">Зберегти результати Експлуатаційне утримання доріг</div>
                          <div className="text-sm text-blue-700">
                            Результати будуть доступні в розрахунку ENPV
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={saveBlockTwoResults}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          💾 Зберегти результати
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 6. ALERT ПРО УСПІШНЕ ЗАВЕРШЕННЯ */}
                  <Alert className="bg-green-100 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                    <AlertTitle className="text-green-800 font-bold">✅ Розрахунок завершено успішно!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      <div className="space-y-1">
                        <div>
                          Розраховано обсяг фінансування для <strong>
                            {selectedRegion === 'all' 
                              ? `${regionalResults.length} областей` 
                              : `області ${selectedRegion}`
                            }
                          </strong> України.
                        </div>
                        <div>Тип доріг: <strong>{roadType === 'state' ? 'Державного значення' : 'Місцевого значення'}</strong></div>
                        <div>
                          {selectedRegion === 'all' ? 'Загальна сума' : 'Сума (фільтр)'}: <strong className="text-lg">
                            {(regionalResults
                              .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                              .reduce((sum, r) => sum + r.totalFunding, 0) / 1000000).toFixed(2)} млрд. грн
                          </strong>
                        </div>
                        {hasBlockOneData && (
                          <div className="text-sm">
                            Залишок на ремонти: <strong className="text-lg">
                              {(() => {
                                const totalEU = regionalResults
                                  .filter(r => selectedRegion === 'all' || r.regionName === selectedRegion)
                                  .reduce((sum, r) => sum + r.totalFunding, 0);
                                const available = roadType === 'state' ? (q1Value || 0) : (q2Value || 0);
                                const remainder = available - totalEU;
                                return remainder.toLocaleString();
                              })()} тис. грн
                            </strong>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}
      </CardContent>
    </Card>
  );
};

export default Block2FundingCalculation;