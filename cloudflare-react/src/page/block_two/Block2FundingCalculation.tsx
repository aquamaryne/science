import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Download, Calculator, AlertTriangle, Construction, Upload, Edit } from "lucide-react";
import * as XLSX from 'xlsx';

// ✅ ІМПОРТИ З МОДУЛЯ
import type { 
  RegionCoefficients,
} from '../../modules/block_two';

import {
  calculateStateRoadMaintenanceRate,
  calculateTrafficIntensityCoefficient,
  calculateEuropeanRoadCoefficient,
  calculateBorderCrossingCoefficient,
  calculateLightingCoefficient,
  calculateRepairCoefficient,
  calculateCriticalInfrastructureCoefficient,
  type RoadSection,
} from '../../modules/block_two';

// ==================== ТИПИ ДЛЯ ЕТАПІВ 2.4-2.5 ====================

interface RegionalRoadData {
  name: string;
  lengthByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number };
  totalLength: number;
  lengthByIntensity: {
    medium: number;
    high: number;
    veryHigh: number;
  };
  europeanRoadsLength: number;
  borderCrossingLength: number;
  lightingLength: number;
  repairedLength: number;
  criticalInfraCount: number;
  // ✅ Поля, що заповнюються після розрахунку
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
    europeanRoad: number;
    borderCrossing: number;
    lighting: number;
    repair: number;
    criticalInfra: number;
    totalProduct: number;
  };
  fundingByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number };
  totalFunding: number;
}

interface Block2FundingCalculationProps {
  regionCoefficients: RegionCoefficients[];
  stateInflationIndexes: number[];
}

// ==================== КОМПОНЕНТ ====================

const Block2FundingCalculation: React.FC<Block2FundingCalculationProps> = ({
  regionCoefficients,
  stateInflationIndexes
}) => {
  const [regionalData, setRegionalData] = React.useState<RegionalRoadData[]>([]);
  const [regionalResults, setRegionalResults] = React.useState<RegionalCalculationResult[]>([]);
  const [isCalculatingRegional, setIsCalculatingRegional] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // ==================== ДОПОМІЖНІ ФУНКЦІЇ ====================
  
  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => acc * (1 + curr / 100), 1);
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
          stateImportance: true, // Державні дороги
          length,
          trafficIntensity: avgIntensity,
          hasEuropeanStatus: region.europeanRoadsLength > 0,
          isBorderCrossing: region.borderCrossingLength > 0,
          hasLighting: region.lightingLength > 0,
          recentlyRepaired: region.repairedLength > 0
        });
      }
    });
    
    return roadSections;
  };

  // ==================== ЗАВАНТАЖЕННЯ EXCEL ====================
  
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
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
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
            lengthByIntensity: {
              medium: Number(row[7]) || 0,
              high: Number(row[8]) || 0,
              veryHigh: Number(row[9]) || 0,
            },
            europeanRoadsLength: Number(row[10]) || 0,
            borderCrossingLength: Number(row[11]) || 0,
            lightingLength: Number(row[12]) || 0,
            repairedLength: Number(row[13]) || 0,
            criticalInfraCount: Number(row[14]) || 0,
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
            console.warn(`Коефіцієнти для області ${region.name} не знайдено`);
            return;
          }
          
          // ✅ КОНВЕРТУЄМО ДАНІ В RoadSection[]
          const roadSections = convertToRoadSections(region);
          const totalLength = region.totalLength;
          
          // ✅ ВИКОРИСТОВУЄМО ФУНКЦІЇ З МОДУЛЯ
          const kIntensity = calculateTrafficIntensityCoefficient(roadSections, totalLength);
          const kEuropean = calculateEuropeanRoadCoefficient(roadSections, totalLength);
          const kBorder = calculateBorderCrossingCoefficient(roadSections, totalLength);
          const kLighting = calculateLightingCoefficient(roadSections, totalLength);
          const kRepair = calculateRepairCoefficient(roadSections, totalLength);
          const kCriticalInfra = calculateCriticalInfrastructureCoefficient(region.criticalInfraCount);
          
          console.log(`📊 Коефіцієнти для ${region.name}:`, {
            kIntensity,
            kEuropean,
            kBorder,
            kLighting,
            kRepair,
            kCriticalInfra
          });
          
          // ✅ Добуток всіх коефіцієнтів (формула п.3.5 Методики)
          const totalProduct = 
            1.16 * // K_д - коефіцієнт обслуговування держ. доріг (сталий)
            regionCoeff.mountainous * 
            regionCoeff.operatingConditions * 
            kIntensity * 
            kEuropean * 
            kBorder * 
            kLighting * 
            kRepair * 
            kCriticalInfra;
          
          // ✅ Розрахунок фінансування по категоріях
          const stateTotalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);
          
          const fundingByCategory: { [key in 1 | 2 | 3 | 4 | 5]: number } = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          };
          
          ([1, 2, 3, 4, 5] as const).forEach(category => {
            const rate = calculateStateRoadMaintenanceRate(category, stateTotalInflationIndex);
            const length = region.lengthByCategory[category];
            fundingByCategory[category] = rate * length * totalProduct;
          });
          
          const totalFunding = Object.values(fundingByCategory).reduce((sum, val) => sum + val, 0);
          
          results.push({
            regionName: region.name,
            coefficients: {
              mountainous: regionCoeff.mountainous,
              operatingConditions: regionCoeff.operatingConditions,
              trafficIntensity: kIntensity,
              europeanRoad: kEuropean,
              borderCrossing: kBorder,
              lighting: kLighting,
              repair: kRepair,
              criticalInfra: kCriticalInfra,
              totalProduct
            },
            fundingByCategory,
            totalFunding
          });
        });
        
        console.log('✅ Розрахунок завершено:', results);
        setRegionalResults(results);
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
      
      // Аркуш 1: Коефіцієнти (Етап 2.4)
      const coeffData: any[][] = [
        ['ЕТАП 2.4: СЕРЕДНЬОЗВАЖЕНІ КОРИГУВАЛЬНІ КОЕФІЦІЄНТИ'],
        ['Розраховано з використанням функцій модуля block_two'],
        [],
        ['Область', 'K_д', 'K_г', 'K_уе', 'K_інт.д', 'K_е.д', 'K_мпп.д', 'K_осв', 'K_рем', 'K_кр.і', 'Добуток коеф.']
      ];
      
      regionalResults.forEach(result => {
        coeffData.push([
          result.regionName,
          1.16,
          result.coefficients.mountainous,
          result.coefficients.operatingConditions,
          result.coefficients.trafficIntensity,
          result.coefficients.europeanRoad,
          result.coefficients.borderCrossing,
          result.coefficients.lighting,
          result.coefficients.repair,
          result.coefficients.criticalInfra,
          result.coefficients.totalProduct
        ]);
      });
      
      const wsCoeff = XLSX.utils.aoa_to_sheet(coeffData);
      XLSX.utils.book_append_sheet(wb, wsCoeff, 'Етап 2.4 - Коефіцієнти');
      
      // Аркуш 2: Обсяг фінансування (Етап 2.5)
      const fundingData: any[][] = [
        ['ЕТАП 2.5: ОБСЯГ КОШТІВ НА ЕКСПЛУАТАЦІЙНЕ УТРИМАННЯ (тис. грн)'],
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
      XLSX.utils.book_append_sheet(wb, wsFunding, 'Етап 2.5 - Фінансування');
      
      const fileName = `Етапи_2.4-2.5_Розрахунок_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при експорті результатів');
    }
  };

  // ==================== RENDER ====================
  // (Решта коду залишається БЕЗ ЗМІН - весь JSX код з попередньої версії)

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5" />
          Розрахунок обсягу коштів на ЕУ доріг державного значення
        </CardTitle>
        <CardDescription>
          Завантажте Excel шаблон з даними про дороги по областях.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Завантаження файлу */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Крок 1:</strong> Завантажте Excel шаблон з вихідними даними про дороги по областях
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4" />
                Завантажити таблицю
              </Button>
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
              {/* 1. ЗАВАНТАЖЕНІ ДАНІ ПО ОБЛАСТЯХ - З РЕДАГУВАННЯМ */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Завантажені дані по областях України</CardTitle>
                      {isEditing && (
                        <p className="text-xs text-blue-600 mt-1">✏️ Режим редагування активний</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {isEditing ? 'Завершити редагування' : 'Редагувати дані'}
                      </Button>
                      <Button
                        onClick={calculateRegionalFinancing}
                        disabled={isCalculatingRegional}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {isCalculatingRegional ? 'Розраховуємо...' : 'Розрахувати обсяг коштів'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[400px] border-2 border-gray-300 rounded">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr>
                          <th className="border border-gray-400 p-2 text-left" rowSpan={2}>Найменування області</th>
                          <th className="border border-gray-400 p-2 text-center" colSpan={6}>
                            Протяжність доріг державного значення (км)
                          </th>
                          <th className="border border-gray-400 p-2 text-center" colSpan={3}>
                            Протяжність доріг з інтенсивністю
                          </th>
                          <th className="border border-gray-400 p-2 text-center" colSpan={5}>
                            Інші показники
                          </th>
                        </tr>
                        <tr>
                          <th className="border border-gray-400 p-1 text-center">I</th>
                          <th className="border border-gray-400 p-1 text-center">II</th>
                          <th className="border border-gray-400 p-1 text-center">III</th>
                          <th className="border border-gray-400 p-1 text-center">IV</th>
                          <th className="border border-gray-400 p-1 text-center">V</th>
                          <th className="border border-gray-400 p-1 text-center bg-yellow-50">Разом</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">15-20 тис</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">20-30 тис</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">30+ тис</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">Євро</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">МПП</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">Освітл.</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">Ремонт</th>
                          <th className="border border-gray-400 p-1 text-center text-[10px]">Кр.інф.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionalData.map((region, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 p-2">{region.name}</td>
                            
                            {/* Протяжність по категоріях - РЕДАГОВАНІ */}
                            {([1, 2, 3, 4, 5] as const).map(cat => (
                              <td key={`cat-${cat}`} className="border border-gray-300 p-1">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={region.lengthByCategory[cat]}
                                    onChange={(e) => {
                                      const newData = [...regionalData];
                                      newData[idx].lengthByCategory[cat] = parseFloat(e.target.value) || 0;
                                      newData[idx].totalLength = Object.values(newData[idx].lengthByCategory).reduce((sum, val) => sum + val, 0);
                                      setRegionalData(newData);
                                    }}
                                    className="w-full text-right p-1 border-0 bg-blue-50 focus:bg-blue-100 rounded"
                                    style={{ fontSize: '11px' }}
                                  />
                                ) : (
                                  <div className="text-right">{region.lengthByCategory[cat]}</div>
                                )}
                              </td>
                            ))}
                            
                            <td className="border border-gray-300 p-2 text-right font-bold bg-yellow-50">{region.totalLength.toFixed(0)}</td>
                            
                            {/* Інтенсивність - РЕДАГОВАНІ */}
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.medium}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].lengthByIntensity.medium = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.lengthByIntensity.medium}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.high}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].lengthByIntensity.high = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.lengthByIntensity.high}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lengthByIntensity.veryHigh}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].lengthByIntensity.veryHigh = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-yellow-50 focus:bg-yellow-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.lengthByIntensity.veryHigh}</div>
                              )}
                            </td>
                            
                            {/* Інші показники - РЕДАГОВАНІ */}
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.europeanRoadsLength}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].europeanRoadsLength = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.europeanRoadsLength}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.borderCrossingLength}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].borderCrossingLength = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.borderCrossingLength}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.lightingLength}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].lightingLength = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.lightingLength}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.repairedLength}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].repairedLength = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.repairedLength}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 p-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={region.criticalInfraCount}
                                  onChange={(e) => {
                                    const newData = [...regionalData];
                                    newData[idx].criticalInfraCount = parseFloat(e.target.value) || 0;
                                    setRegionalData(newData);
                                  }}
                                  className="w-full text-right p-1 border-0 bg-green-50 focus:bg-green-100 rounded"
                                  style={{ fontSize: '11px' }}
                                />
                              ) : (
                                <div className="text-right">{region.criticalInfraCount}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {regionalResults.length > 0 && (
                <>
                  {/* 2. ЕТАП 2.4: КОЕФІЦІЄНТИ - З РЕДАГУВАННЯМ */}
                  <Card className="bg-blue-50 border-2 border-blue-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-blue-800 text-base">
                          📊 Етап 2.4: Середньозважені коригувальні коефіцієнти
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
                      <div className="overflow-auto border border-blue-300 rounded">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-blue-200">
                            <tr>
                              <th className="border border-blue-300 p-2">Область</th>
                              <th className="border border-blue-300 p-2">K<sub>д</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>г</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>уе</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>інт.д</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>е.д</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>мпп.д</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>осв</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>рем</sub></th>
                              <th className="border border-blue-300 p-2">K<sub>кр.і</sub></th>
                              <th className="border border-blue-300 p-2 bg-yellow-100">Добуток</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regionalResults.map((result, idx) => {
                              const currentProduct = 
                                1.16 * 
                                result.coefficients.mountainous * 
                                result.coefficients.operatingConditions * 
                                result.coefficients.trafficIntensity * 
                                result.coefficients.europeanRoad * 
                                result.coefficients.borderCrossing * 
                                result.coefficients.lighting * 
                                result.coefficients.repair * 
                                result.coefficients.criticalInfra;

                              return (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                  <td className="border border-blue-300 p-2">{result.regionName}</td>
                                  <td className="border border-blue-300 p-2 text-center bg-gray-100">1.1600</td>
                                  
                                  {/* Редаговані коефіцієнти */}
                                  {['mountainous', 'operatingConditions', 'trafficIntensity', 'europeanRoad', 'borderCrossing', 'lighting', 'repair', 'criticalInfra'].map((key) => (
                                    <td key={key} className="border border-blue-300 p-1">
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          step="0.0001"
                                          value={result.coefficients[key as keyof typeof result.coefficients]}
                                          onChange={(e) => {
                                            const newResults = [...regionalResults];
                                            (newResults[idx].coefficients as any)[key] = parseFloat(e.target.value) || 1;
                                            setRegionalResults(newResults);
                                          }}
                                          className="w-full text-center p-1 border-0 bg-blue-50 focus:bg-blue-100 rounded"
                                          style={{ fontSize: '11px' }}
                                        />
                                      ) : (
                                        <div className="text-center">
                                          {(result.coefficients[key as keyof typeof result.coefficients] as number).toFixed(4)}
                                        </div>
                                      )}
                                    </td>
                                  ))}
                                  
                                  <td className="border border-blue-300 p-2 text-center bg-yellow-50 font-bold">
                                    {isEditing ? currentProduct.toFixed(4) : result.coefficients.totalProduct.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Пояснення */}
                      <Alert className="mt-4 bg-white border-blue-300">
                        <AlertDescription className="text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div><strong>K<sub>д</sub></strong> - обслуговування держ. доріг (1.16)</div>
                            <div><strong>K<sub>г</sub></strong> - гірська місцевість</div>
                            <div><strong>K<sub>уе</sub></strong> - умови експлуатації</div>
                            <div><strong>K<sub>інт.д</sub></strong> - інтенсівність руху</div>
                            <div><strong>K<sub>е.д</sub></strong> - європейська мережа</div>
                            <div><strong>K<sub>мпп.д</sub></strong> - міжнародні пункти пропуску</div>
                            <div><strong>K<sub>осв</sub></strong> - освітлення доріг</div>
                            <div><strong>K<sub>рем</sub></strong> - нещодавно відремонтовані</div>
                            <div><strong>K<sub>кр.і</sub></strong> - критична інфраструктура</div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* 3. ЕТАП 2.5: ТАБЛИЦЯ РЕЗУЛЬТАТІВ */}
                  <Card className="bg-green-50 border-2 border-green-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-green-800">
                          💰 Етап 2.5: Обсяг коштів на експлуатаційне утримання
                        </CardTitle>
                        <Button
                          onClick={exportRegionalResults}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Завантажити результати
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* ТАБЛИЦЯ РЕЗУЛЬТАТІВ */}
                      <div className="bg-white border-2 border-gray-400 rounded-lg overflow-hidden">
                        <div className="overflow-auto max-h-[600px]">
                          <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-20 bg-gray-200">
                              <tr>
                                <th className="border-2 border-gray-400 p-3 text-center font-bold" colSpan={14}>
                                  Розподіл витрат на експлуатаційне утримання (ЕУ) доріг державного значення
                                </th>
                              </tr>
                              <tr>
                                <th className="border border-gray-400 p-2 font-bold" rowSpan={2}>
                                  Найменування<br/>області
                                </th>
                                <th className="border border-gray-400 p-2 bg-blue-100 font-bold text-center" colSpan={6}>
                                  Протяжність доріг державного значення (км)
                                </th>
                                <th className="border border-gray-400 p-2 bg-green-100 font-bold text-center" colSpan={7}>
                                  Мінімальна потреба в фінансових ресурсах на 20ХХ рік, тис.грн
                                </th>
                              </tr>
                              <tr>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50">I</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50">II</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50">III</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50">IV</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-50">V</th>
                                <th className="border border-gray-400 p-1 text-center bg-blue-100 font-bold">Разом</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50">I</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50">II</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50">III</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50">IV</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-50">V</th>
                                <th className="border border-gray-400 p-1 text-center bg-green-100 font-bold">Разом<br/>потреб</th>
                                <th className="border border-gray-400 p-1 text-center bg-yellow-100 font-bold">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {regionalData.map((region, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border border-gray-400 p-2 font-medium sticky left-0 bg-inherit z-10">
                                    {region.name}
                                  </td>
                                  {([1, 2, 3, 4, 5] as const).map(cat => (
                                    <td key={`length-${cat}`} className="border border-gray-400 p-2 text-right">
                                      {region.lengthByCategory[cat] || '-'}
                                    </td>
                                  ))}
                                  <td className="border border-gray-400 p-2 text-right font-bold bg-blue-50">
                                    {region.totalLength.toFixed(0)}
                                  </td>
                                  {([1, 2, 3, 4, 5] as const).map(cat => (
                                    <td key={`funding-${cat}`} className="border border-gray-400 p-2 text-right">
                                      {region.fundingByCategory?.[cat] 
                                        ? region.fundingByCategory[cat].toLocaleString('uk-UA', {maximumFractionDigits: 0})
                                        : '-'
                                      }
                                    </td>
                                  ))}
                                  <td className="border border-gray-400 p-2 text-right font-bold bg-green-50">
                                    {region.totalFunding 
                                      ? region.totalFunding.toLocaleString('uk-UA', {maximumFractionDigits: 0})
                                      : '-'
                                    }
                                  </td>
                                  <td className="border border-gray-400 p-2 text-right font-bold bg-yellow-50">
                                    {region.fundingPercentage ? region.fundingPercentage.toFixed(2) : '-'}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-300 font-bold">
                                <td className="border-2 border-gray-400 p-3">ВСЬОГО ПО УКРАЇНІ</td>
                                {([1, 2, 3, 4, 5] as const).map(cat => (
                                  <td key={`total-length-${cat}`} className="border-2 border-gray-400 p-2 text-right">
                                    {regionalData.reduce((sum, r) => sum + r.lengthByCategory[cat], 0).toFixed(0)}
                                  </td>
                                ))}
                                <td className="border-2 border-gray-400 p-2 text-right bg-blue-100 text-base">
                                  {regionalData.reduce((sum, r) => sum + r.totalLength, 0).toFixed(0)}
                                </td>
                                {([1, 2, 3, 4, 5] as const).map(cat => (
                                  <td key={`total-funding-${cat}`} className="border-2 border-gray-400 p-2 text-right">
                                    {regionalData.reduce((sum, r) => sum + (r.fundingByCategory?.[cat] || 0), 0)
                                      .toLocaleString('uk-UA', {maximumFractionDigits: 0})}
                                  </td>
                                ))}
                                <td className="border-2 border-gray-400 p-2 text-right bg-green-100 text-lg">
                                  {regionalData.reduce((sum, r) => sum + (r.totalFunding || 0), 0)
                                    .toLocaleString('uk-UA', {maximumFractionDigits: 0})}
                                </td>
                                <td className="border-2 border-gray-400 p-2 text-right bg-yellow-100 text-base">
                                  100.00
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* СТАТИСТИКА */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <div className="text-3xl font-bold text-green-700">
                            {regionalResults.length}
                          </div>
                          <div className="text-sm text-gray-600">Областей проаналізовано</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <div className="text-3xl font-bold text-blue-700">
                            {regionalData.reduce((sum, r) => sum + r.totalLength, 0).toFixed(0)}
                          </div>
                          <div className="text-sm text-gray-600">Загальна довжина (км)</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg shadow">
                          <div className="text-3xl font-bold text-purple-700">
                            {(regionalResults.reduce((sum, r) => sum + r.totalFunding, 0) / 1000000).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Млрд. грн (загалом)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 4. ALERT ПРО УСПІШНЕ ЗАВЕРШЕННЯ */}
                  <Alert className="bg-green-100 border-green-400">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                    <AlertTitle className="text-green-800 font-bold">✅ Розрахунок завершено успішно!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      <div className="space-y-1">
                        <div>Розраховано обсяг фінансування для <strong>{regionalResults.length} областей</strong> України.</div>
                        <div>Загальна сума: <strong className="text-lg">{(regionalResults.reduce((sum, r) => sum + r.totalFunding, 0) / 1000000).toFixed(2)} млрд. грн</strong></div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}
        {/* Інструкція - БЕЗ ЗМІН */}
        {regionalData.length === 0 && (
          <Alert className="bg-gray-50">
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold">Як користуватися цією вкладкою:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Підготуйте Excel файл з даними про дороги по областях України</li>
                  <li>Структура файлу має містити колонки згідно з шаблоном</li>
                  <li>Натисніть кнопку "Завантажити таблицю" та оберіть файл</li>
                  <li>Натисніть "Розрахувати обсяг коштів"</li>
                  <li>Завантажте результати у форматі Excel</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default Block2FundingCalculation;