import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Download, Calculator, AlertTriangle, MapPin, Construction, Upload } from "lucide-react";
import * as XLSX from 'xlsx';

import type { 
  RegionCoefficients,
  RegionRoads,
  PriceIndexes
} from '../../modules/block_two';

import {
  calculateTotalFunding,
  generateSampleRegionData,
  type RoadSection,
} from '../../modules/block_two';

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

interface Block2FundingCalculationProps {
  regionCoefficients: RegionCoefficients[];
  selectedRegion: string;
  setSelectedRegion: (value: string) => void;
}

const Block2FundingCalculation: React.FC<Block2FundingCalculationProps> = ({
  regionCoefficients,
  selectedRegion,
  setSelectedRegion
}) => {
  const [worksheets, setWorksheets] = React.useState<ExcelWorksheet[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = React.useState<string>('');
  const [inflationIndex, setInflationIndex] = React.useState<number>(1.25);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [results, setResults] = React.useState<RoadCalculationResult | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          
          const cells: ExcelCell[] = [];
          
          for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              const cell = worksheet[cellAddress];
              
              if (cell || row <= 30) {
                const cellData: ExcelCell = {
                  address: cellAddress,
                  value: cell?.v || '',
                  formula: cell?.f || undefined,
                  type: cell?.f ? 'formula' : 
                        typeof cell?.v === 'number' ? 'number' : 
                        cell?.v ? 'string' : 'empty',
                  editable: !cell?.f
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

  const parseRoadDataFromExcel = (worksheet: ExcelWorksheet): RegionRoads | null => {
    try {
      const roadSections: RoadSection[] = [];
      
      const dataRows = worksheet.cells.filter(cell => {
        const decoded = XLSX.utils.decode_cell(cell.address);
        return decoded.r > 0;
      });

      const rowGroups: Record<number, ExcelCell[]> = {};
      dataRows.forEach(cell => {
        const decoded = XLSX.utils.decode_cell(cell.address);
        if (!rowGroups[decoded.r]) rowGroups[decoded.r] = [];
        rowGroups[decoded.r].push(cell);
      });

      Object.values(rowGroups).forEach(rowCells => {
        rowCells.sort((a, b) => {
          const aCol = XLSX.utils.decode_cell(a.address).c;
          const bCol = XLSX.utils.decode_cell(b.address).c;
          return aCol - bCol;
        });

        if (rowCells.length >= 8) {
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
        criticalInfrastructureCount: 5
      };

    } catch (error) {
      console.error('Ошибка парсинга данных дорог:', error);
      return null;
    }
  };

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

        let regionData = parseRoadDataFromExcel(worksheet);
        if (!regionData || regionData.roadSections.length === 0) {
          regionData = generateSampleRegionData(selectedRegion);
        }

        const regionCoeff = regionCoefficients.find(r => r.regionalName === selectedRegion);
        if (!regionCoeff) {
          throw new Error('Коефіцієнти регіону не знайдено');
        }

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

  const handleExportResults = () => {
    if (!results || !selectedWorksheet) return;

    try {
      const worksheet = worksheets.find(ws => ws.name === selectedWorksheet);
      if (!worksheet) return;

      const exportData: any[][] = [];
      
      exportData.push(['ЗАГАЛЬНІ РЕЗУЛЬТАТИ РОЗРАХУНКІВ']);
      exportData.push([]);
      exportData.push(['Адреса клітинки', 'Значення', 'Тип', 'Формула']);
      
      worksheet.cells.slice(0, 20).forEach(cell => {
        exportData.push([
          cell.address,
          cell.value,
          cell.type,
          cell.formula || ''
        ]);
      });

      exportData.push([]);
      exportData.push(['ПІДСУМКОВІ РЕЗУЛЬТАТИ EXCEL']);
      exportData.push(['Загальна сума:', results.calculatedValues.TOTAL_SUM]);
      exportData.push(['Середнє значення:', results.calculatedValues.AVERAGE]);
      exportData.push(['Кількість чисел:', results.calculatedValues.COUNT_NUMBERS]);
      exportData.push(['Кількість заповнених клітинок:', results.calculatedValues.COUNT_FILLED]);

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

        exportData.push([]);
        exportData.push(['ЗАСТОСОВАНІ КОЕФІЦІЄНТИ']);
        Object.entries(results.roadFinancing.details.appliedCoefficients).forEach(([key, value]) => {
          exportData.push([key, Number(value).toFixed(3)]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Результати');

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

  const currentWorksheet = worksheets.find(ws => ws.name === selectedWorksheet);

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
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5" />
          Калькулятор фінансування доріг на основі Excel шаблону
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-auto max-h-[500px]">
                <table className="border-collapse w-full min-w-full">
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className="w-12 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-30"></th>
                      {tableData.columns.map((col) => (
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
                      .slice(0, Math.min(100, Object.keys(tableData.rows).length))
                      .map(([rowNum, rowCells]) => {
                        const rowIndex = parseInt(rowNum);
                        const isHeaderRow = rowIndex === 0;
                        
                        return (
                          <tr key={rowNum}>
                            <td className="w-12 h-8 bg-gray-200 border-2 border-gray-400 text-center text-xs font-bold sticky left-0 z-10">
                              {rowIndex + 1}
                            </td>
                            
                            {tableData.columns.map(col => {
                              const cell = rowCells[col];
                              
                              return (
                                <td 
                                  key={`${rowNum}-${col}`} 
                                  className="w-32 h-8 border border-gray-300 p-0 relative"
                                >
                                  {cell ? (
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
                                    <div className="w-full h-full bg-white"></div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-600 gap-2">
              <div className="flex flex-wrap gap-4">
                <span>Загалом клітинок: <strong>{currentWorksheet.cells.length}</strong></span>
                <span>Редагованих: <strong>{currentWorksheet.cells.filter(c => c.editable).length}</strong></span>
              </div>
            </div>
          </div>
        )}

        {results && (
          <>
            <Separator />
            
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

            {results.roadFinancing && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Розрахунок фінансування доріг для регіону: {selectedRegion}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  );
};

export default Block2FundingCalculation;