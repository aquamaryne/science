import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { FileSpreadsheetIcon, AlertTriangleIcon,CalculatorIcon,RefreshCwIcon,DownloadIcon,ArrowLeftIcon,ArrowRightIcon,DollarSignIcon,EditIcon,SaveIcon,PlusIcon,TrashIcon,FileUpIcon} from "lucide-react";

// ==================== ІМПОРТИ З МОДУЛЯ BLOCK_THREE ====================
import {
  // Типи
  type RoadSection,
  type RoadTechnicalCondition,
  type RepairProject,
  type ExpertAssessment,
  type BlockOneBudgetData,
  type BudgetAllocation,
  
  // Функції для роботи з бюджетом Блоку 1
  hasBlockOneBudgetData,
  getBlockOneBudgetData,
  getBudgetStatistics,
  getBlockOneBudgetSources,
  getBudgetAllocation,
  setBudgetAllocation,
  
  // Функції визначення робіт
  determineWorkTypeByTechnicalCondition,
  determineWorkTypeByExpertAssessment,
  checkCategoryComplianceByIntensity,
  checkFrictionCompliance,
  
  // Функції планування
  planRepairWorksWithBlockOneData,
  generateDetailedRepairPlanReport,
  estimateWorkCost,
  
  // Константи
} from '@/modules/block_three';
import REQUIRED_FRICTION_COEFFICIENT from '@/modules/block_three';

// ==================== ДОДАТКОВІ ТИПИ ДЛЯ UI ====================
interface RoadSectionUI extends Omit<RoadSection, 'technicalCondition'> {
  // Фактичні показники
  strengthModulus: number;
  roughnessProfile: number;
  roughnessBump: number;
  rutDepth: number;
  frictionCoeff: number;
  
  // Розраховані коефіцієнти
  intensityCoeff?: number;
  strengthCoeff?: number;
  evennessCoeff?: number;
  rutCoeff?: number;
  frictionFactorCoeff?: number;
  
  // Результати
  workType?: string;
  estimatedCost?: number;
  
  // Економічні показники
  enpv?: number;
  eirr?: number;
  bcr?: number;
  
  // Додаткові поля UI
  priority?: number;
  budgetSource?: 'q1' | 'q2';
}

interface CostStandards {
  reconstruction: Record<number, number>;
  capital_repair: Record<number, number>;
  current_repair: Record<number, number>;
}

interface EconomicAnalysisData {
  sectionId: string;
  sectionName: string;
  repairType: string;
  projectCost: number;
  discountRate: number;
  analysisYears: number;
  
  // Вигоди
  travelTimeSavings: number;
  vehicleOperatingCostSavings: number;
  accidentReductionBenefit: number;
  
  // Витрати
  annualMaintenanceCost: number;
  periodicMaintenanceCost: number;
  
  // Результати
  yearlyData?: Array<{
    year: number;
    benefits: number;
    costs: number;
    netBenefit: number;
    discountFactor: number;
    presentValue: number;
  }>;
}

// ==================== КОНСТАНТИ ====================
const CATEGORIES = {
  1: { name: 'I категорія', maxIntensity: 20000, minStrength: 1.0, maxRoughness: 1.0, maxRutDepth: 5 },
  2: { name: 'II категорія', maxIntensity: 12000, minStrength: 1.0, maxRoughness: 1.2, maxRutDepth: 8 },
  3: { name: 'III категорія', maxIntensity: 6000, minStrength: 0.95, maxRoughness: 1.5, maxRutDepth: 12 },
  4: { name: 'IV категорія', maxIntensity: 2000, minStrength: 0.90, maxRoughness: 2.0, maxRutDepth: 15 },
  5: { name: 'V категорія', maxIntensity: 500, minStrength: 0.85, maxRoughness: 2.5, maxRutDepth: 20 }
};

// Початкові значення вартості робіт (млн грн/км)
const DEFAULT_COST_STANDARDS: CostStandards = {
  reconstruction: { 1: 50.0, 2: 40.0, 3: 30.0, 4: 25.0, 5: 20.0 },
  capital_repair: { 1: 15.0, 2: 12.0, 3: 10.0, 4: 8.0, 5: 6.0 },
  current_repair: { 1: 3.0, 2: 2.0, 3: 1.5, 4: 1.0, 5: 0.8 }
};

// ==================== ФУНКЦІЇ КОНВЕРТАЦІЇ ====================
const convertUIToRoadSection = (uiSection: RoadSectionUI): RoadSection => {
  return {
    id: uiSection.id,
    name: uiSection.name,
    category: uiSection.category,
    length: uiSection.length,
    significance: uiSection.significance,
    technicalCondition: {
      intensityCoefficient: uiSection.intensityCoeff || 1.0,
      strengthCoefficient: uiSection.strengthCoeff || 1.0,
      evennessCoefficient: uiSection.evennessCoeff || 1.0,
      rutCoefficient: uiSection.rutCoeff || 1.0,
      frictionCoefficient: uiSection.frictionFactorCoeff || 1.0
    },
    trafficIntensity: uiSection.trafficIntensity,
    estimatedCost: uiSection.estimatedCost
  };
};

const convertRoadSectionToUI = (section: RoadSection, additionalData?: Partial<RoadSectionUI>): RoadSectionUI => {
  return {
    id: section.id,
    name: section.name,
    category: section.category,
    length: section.length,
    significance: section.significance,
    trafficIntensity: section.trafficIntensity,
    estimatedCost: section.estimatedCost,
    
    // Значення за замовчуванням для фактичних показників
    strengthModulus: 300,
    roughnessProfile: 1.5,
    roughnessBump: 60,
    rutDepth: 8,
    frictionCoeff: 0.35,
    
    // Коефіцієнти з технічного стану
    intensityCoeff: section.technicalCondition.intensityCoefficient,
    strengthCoeff: section.technicalCondition.strengthCoefficient,
    evennessCoeff: section.technicalCondition.evennessCoefficient,
    rutCoeff: section.technicalCondition.rutCoefficient,
    frictionFactorCoeff: section.technicalCondition.frictionCoefficient,
    
    // Додаткові дані
    ...additionalData
  };
};

// ==================== ФУНКЦІЇ РОЗРАХУНКУ ====================
const calculateCoefficients = (section: RoadSectionUI): RoadSectionUI => {
  const category = CATEGORIES[section.category as keyof typeof CATEGORIES];
  if (!category) return section;
  
  // Коефіцієнт інтенсивності руху
  const intensityCoeff = Number((category.maxIntensity / section.trafficIntensity).toFixed(3));
  
  // Коефіцієнт запасу міцності
  const minStrengthMPa = category.minStrength * 300; // Базове значення 300 МПа
  const strengthCoeff = Number((section.strengthModulus / minStrengthMPa).toFixed(3));
  
  // Коефіцієнт рівності
  const evennessCoeff = Number((category.maxRoughness / section.roughnessProfile).toFixed(3));
  
  // Коефіцієнт колійності
  const rutCoeff = Number((category.maxRutDepth / section.rutDepth).toFixed(3));
  
  // Коефіцієнт зчеплення
  const frictionFactorCoeff = Number((section.frictionCoeff / Number(REQUIRED_FRICTION_COEFFICIENT)).toFixed(3));
  
  return {
    ...section,
    intensityCoeff,
    strengthCoeff,
    evennessCoeff,
    rutCoeff,
    frictionFactorCoeff
  };
};

const determineWorkType = (section: RoadSectionUI): string => {
  const roadSection = convertUIToRoadSection(section);
  const workType = determineWorkTypeByTechnicalCondition(roadSection);
  
  switch (workType) {
    case 'current_repair':
      return 'Поточний ремонт';
    case 'capital_repair':
      return 'Капітальний ремонт';
    case 'reconstruction':
      return 'Реконструкція';
    case 'no_work_needed':
      return 'Не потрібно';
    default:
      return 'Не визначено';
  }
};

const calculateCost = (section: RoadSectionUI, costStandards: CostStandards): number => {
  const workType = section.workType || 'Не потрібно';
  if (workType === 'Не потрібно' || workType === 'Не визначено') return 0;
  
  const roadSection = convertUIToRoadSection(section);
  let workTypeKey: 'current_repair' | 'capital_repair' | 'reconstruction';
  
  if (workType === 'Поточний ремонт') {
    workTypeKey = 'current_repair';
  } else if (workType === 'Капітальний ремонт') {
    workTypeKey = 'capital_repair';
  } else if (workType === 'Реконструкція') {
    workTypeKey = 'reconstruction';
  } else {
    return 0;
  }
  
  // Використовуємо функцію з модуля та конвертуємо з тис. грн в млн грн
  const costInThousands = estimateWorkCost(roadSection, workTypeKey);
  return costInThousands / 1000;
};

// ==================== КОМПОНЕНТ ВІДОБРАЖЕННЯ БЮДЖЕТУ З БЛОКУ 1 ====================
const BlockOneBudgetDisplay: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [budgetData, setBudgetData] = useState<BlockOneBudgetData | null>(null);
  const [budgetStats, setBudgetStats] = useState<any>(null);
  const [budgetAllocation, setBudgetAllocationState] = useState<BudgetAllocation | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkData = () => {
      const hasData = hasBlockOneBudgetData();
      setIsReady(hasData);
      
      if (hasData) {
        const data = getBlockOneBudgetData();
        const stats = getBudgetStatistics();
        const allocation = getBudgetAllocation();
        setBudgetData(data);
        setBudgetStats(stats);
        setBudgetAllocationState(allocation);
      }
    };

    checkData();
    const interval = setInterval(checkData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isReady) {
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-50">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription className="text-yellow-700">
          ⚠️ Немає даних з Блоку 1. Спочатку виконайте розрахунки бюджету в Блоці 1 та передайте дані.
          {onBack && (
            <Button onClick={onBack} variant="link" className="ml-2 p-0 h-auto text-yellow-700 underline">
              Повернутися до Блоку 1
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const budgetSources = getBlockOneBudgetSources();

  return (
    <Card className="mb-6 w-full border-green-500 shadow-sm">
      <CardHeader className="bg-green-50 border-b border-green-500">
        <CardTitle className="text-xl font-bold text-green-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Бюджет з Блоку 1 (Сесія: {budgetData?.sessionId})
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm" className="border-green-300">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              До Блоку 1
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white border rounded">
            <div className="text-2xl font-bold text-gray-800">
              {((budgetStats?.q1Budget || 0) / 1000).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Q₁ (млн грн)</div>
            <div className="text-xs text-gray-500">Державні дороги</div>
          </div>
          
          <div className="text-center p-4 bg-white border rounded">
            <div className="text-2xl font-bold text-gray-800">
              {((budgetStats?.q2Budget || 0) / 1000).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Q₂ (млн грн)</div>
            <div className="text-xs text-gray-500">Місцеві дороги</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded">
            <div className="text-2xl font-bold text-green-800">
              {((budgetStats?.totalBudget || 0) / 1000).toFixed(1)}
            </div>
            <div className="text-sm text-green-600">Загальний бюджет (млн грн)</div>
            <div className="text-xs text-green-500">Для ремонтів</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-lg font-bold text-blue-800">
              {budgetData?.timestamp ? new Date(budgetData.timestamp).toLocaleDateString('uk-UA') : '—'}
            </div>
            <div className="text-sm text-blue-600">Дата розрахунку</div>
            <div className="text-xs text-blue-500">Блок 1</div>
          </div>
        </div>

        {/* Розподіл бюджету */}
        {budgetAllocation && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">Автоматичний розподіл бюджету:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-lg font-bold text-yellow-800">
                  {(budgetAllocation.currentRepair / 1000).toFixed(1)}
                </div>
                <div className="text-xs text-yellow-600">Поточний ремонт (30%)</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="text-lg font-bold text-orange-800">
                  {(budgetAllocation.capitalRepair / 1000).toFixed(1)}
                </div>
                <div className="text-xs text-orange-600">Капітальний ремонт (45%)</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-lg font-bold text-red-800">
                  {(budgetAllocation.reconstruction / 1000).toFixed(1)}
                </div>
                <div className="text-xs text-red-600">Реконструкція (20%)</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-lg font-bold text-gray-800">
                  {(budgetAllocation.reserve / 1000).toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Резерв (5%)</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== КОМПОНЕНТИ СТОРІНОК ====================

// Сторінка 1: Фактичний стан доріг
const Page1_RoadConditions: React.FC<{
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
}> = ({ sections, onSectionsChange, onNext }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoadSectionUI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const newSection: RoadSectionUI = {
      id: `section_${Date.now()}`,
      name: 'Нова ділянка',
      length: 1.0,
      category: 3,
      trafficIntensity: 1000,
      strengthModulus: 300,
      roughnessProfile: 1.5,
      roughnessBump: 60,
      rutDepth: 8,
      frictionCoeff: 0.35,
      significance: 'local'
    };
    onSectionsChange([...sections, newSection]);
    setEditingId(newSection.id);
    setFormData(newSection);
  };

  const handleEdit = (section: RoadSectionUI) => {
    setEditingId(section.id);
    setFormData({ ...section });
  };

  const handleSave = () => {
    if (!formData) return;
    
    const updatedSections = sections.map(s => 
      s.id === formData.id ? formData : s
    );
    onSectionsChange(updatedSections);
    setEditingId(null);
    setFormData(null);
  };

  const handleDelete = (id: string) => {
    onSectionsChange(sections.filter(s => s.id !== id));
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Парсинг даних з Excel (пропускаємо заголовки)
        const importedSections: RoadSectionUI[] = [];
        for (let i = 9; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row[0]) {
            importedSections.push({
              id: `imported_${Date.now()}_${i}`,
              name: row[0] || '',
              length: parseFloat(row[1]) || 1,
              category: parseInt(row[2]) || 3,
              trafficIntensity: parseInt(row[3]) || 1000,
              strengthModulus: parseInt(row[4]) || 300,
              roughnessProfile: parseFloat(row[5]) || 1.5,
              roughnessBump: parseInt(row[6]) || 60,
              rutDepth: parseInt(row[7]) || 8,
              frictionCoeff: parseFloat(row[8]) || 0.35,
              significance: 'local'
            });
          }
        }
        
        onSectionsChange([...sections, ...importedSections]);
        alert(`Імпортовано ${importedSections.length} дорожніх секцій`);
      } catch (error) {
        alert('Помилка при імпорті файлу. Перевірте формат даних.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Визначення показників фактичного транспортно-експлуатаційного стану доріг</span>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUpIcon className="h-4 w-4 mr-2" />
                Імпорт Excel
              </Button>
              <Button onClick={handleAdd} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Додати секцію
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2}>Найменування ділянки дороги</TableHead>
                  <TableHead rowSpan={2}>Протяжність дороги, км</TableHead>
                  <TableHead rowSpan={2}>Категорія ділянки дороги</TableHead>
                  <TableHead colSpan={6} className="text-center">Фактичні показники</TableHead>
                  <TableHead rowSpan={2}>Дії</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>Інтенсивність руху (авт./добу)</TableHead>
                  <TableHead>Модуль пружності (МПа)</TableHead>
                  <TableHead>Рівність (профілометр, м/км)</TableHead>
                  <TableHead>Рівність (поштовхомір, см/км)</TableHead>
                  <TableHead>Глибина колії (мм)</TableHead>
                  <TableHead>Коеф. зчеплення</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    {editingId === section.id && formData ? (
                      <>
                        <TableCell>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-48"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.length}
                            onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 1 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={formData.category.toString()} 
                            onValueChange={(value) => setFormData({ ...formData, category: parseInt(value) })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIES).map(([key, cat]) => (
                                <SelectItem key={key} value={key}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.trafficIntensity}
                            onChange={(e) => setFormData({ ...formData, trafficIntensity: parseInt(e.target.value) || 1000 })}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.strengthModulus}
                            onChange={(e) => setFormData({ ...formData, strengthModulus: parseInt(e.target.value) || 300 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.roughnessProfile}
                            onChange={(e) => setFormData({ ...formData, roughnessProfile: parseFloat(e.target.value) || 1.5 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.roughnessBump}
                            onChange={(e) => setFormData({ ...formData, roughnessBump: parseInt(e.target.value) || 60 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.rutDepth}
                            onChange={(e) => setFormData({ ...formData, rutDepth: parseInt(e.target.value) || 8 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.frictionCoeff}
                            onChange={(e) => setFormData({ ...formData, frictionCoeff: parseFloat(e.target.value) || 0.35 })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={handleSave}>
                              <SaveIcon className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              ✕
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{section.name}</TableCell>
                        <TableCell>{section.length}</TableCell>
                        <TableCell>{CATEGORIES[section.category as keyof typeof CATEGORIES]?.name}</TableCell>
                        <TableCell>{section.trafficIntensity}</TableCell>
                        <TableCell>{section.strengthModulus}</TableCell>
                        <TableCell>{section.roughnessProfile}</TableCell>
                        <TableCell>{section.roughnessBump}</TableCell>
                        <TableCell>{section.rutDepth}</TableCell>
                        <TableCell>{section.frictionCoeff}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
                              <EditIcon className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(section.id)}>
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 flex justify-between">
            <div className="text-sm text-gray-600">
              Всього секцій: {sections.length}
            </div>
            <Button onClick={onNext} disabled={sections.length === 0}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Сторінка 2: Показники та коефіцієнти
const Page2_Coefficients: React.FC<{
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ sections, onSectionsChange, onNext, onBack }) => {
  const [calculatedSections, setCalculatedSections] = useState<RoadSectionUI[]>([]);

  useEffect(() => {
    // Автоматичний розрахунок при завантаженні сторінки
    handleCalculate();
  }, [sections]);

  const handleCalculate = () => {
    const updated = sections.map(section => {
      const withCoeffs = calculateCoefficients(section);
      withCoeffs.workType = determineWorkType(withCoeffs);
      return withCoeffs;
    });
    setCalculatedSections(updated);
    onSectionsChange(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Визначення показників фактичного транспортно-експлуатаційного стану доріг</span>
            <Button onClick={handleCalculate} variant="outline">
              <CalculatorIcon className="h-4 w-4 mr-2" />
              Перерахувати
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2}>Найменування ділянки дороги</TableHead>
                  <TableHead rowSpan={2}>Протяжність дороги (км)</TableHead>
                  <TableHead colSpan={5} className="text-center">Коефіцієнти</TableHead>
                  <TableHead rowSpan={2}>Вид робіт</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>Коефіцієнт інтенсивності руху</TableHead>
                  <TableHead>Коефіцієнт запасу міцності</TableHead>
                  <TableHead>Коефіцієнт рівності</TableHead>
                  <TableHead>Коефіцієнт колійності</TableHead>
                  <TableHead>Коефіцієнт зчеплення</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedSections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>{section.length}</TableCell>
                    <TableCell>
                      <Badge variant={section.intensityCoeff! < 1.0 ? "destructive" : "secondary"}>
                        {section.intensityCoeff}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.strengthCoeff! < 1.0 ? "destructive" : "secondary"}>
                        {section.strengthCoeff}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.evennessCoeff! < 1.0 ? "destructive" : "secondary"}>
                        {section.evennessCoeff}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.rutCoeff! < 1.0 ? "destructive" : "secondary"}>
                        {section.rutCoeff}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={section.frictionFactorCoeff! < 1.0 ? "destructive" : "secondary"}>
                        {section.frictionFactorCoeff}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        section.workType === 'Не потрібно' ? 'secondary' :
                        section.workType === 'Поточний ремонт' ? 'default' :
                        section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                      }>
                        {section.workType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Легенда */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Правила визначення виду робіт (згідно з модулем block_three):</h4>
            <ul className="text-sm space-y-1">
              <li>• <span className="text-red-600 font-semibold">Реконструкція</span> - якщо коефіцієнт інтенсивності &lt; 1.0 або інтенсивність перевищує максимальну для категорії</li>
              <li>• <span className="text-orange-600 font-semibold">Капітальний ремонт</span> - якщо коефіцієнт міцності &lt; мінімального для категорії</li>
              <li>• <span className="text-blue-600 font-semibold">Поточний ремонт</span> - якщо коефіцієнт рівності, колійності або зчеплення &lt; 1.0</li>
              <li>• <span className="text-green-600 font-semibold">Не потрібно</span> - якщо всі коефіцієнти в нормі</li>
            </ul>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Сторінка 3: Показники вартості
const Page3_CostIndicators: React.FC<{
  costStandards: CostStandards;
  onCostStandardsChange: (standards: CostStandards) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ costStandards, onCostStandardsChange, onNext, onBack }) => {
  const [editMode, setEditMode] = useState(false);
  const [tempStandards, setTempStandards] = useState<CostStandards>(costStandards);

  const handleSave = () => {
    onCostStandardsChange(tempStandards);
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempStandards(costStandards);
    setEditMode(false);
  };

  const updateValue = (workType: keyof CostStandards, category: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempStandards({
      ...tempStandards,
      [workType]: {
        ...tempStandards[workType],
        [category]: numValue
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Усереднені орієнтовні показники вартості дорожніх робіт</span>
            {!editMode ? (
              <Button onClick={() => setEditMode(true)} variant="outline">
                <EditIcon className="h-4 w-4 mr-2" />
                Редагувати
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Зберегти
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Скасувати
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            за даними об'єктів-аналогів, млн.грн/1 км
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Вид робіт</TableHead>
                <TableHead className="text-center">I категорія</TableHead>
                <TableHead className="text-center">II категорія</TableHead>
                <TableHead className="text-center">III категорія</TableHead>
                <TableHead className="text-center">IV категорія</TableHead>
                <TableHead className="text-center">V категорія</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Реконструкція</TableCell>
                {[1, 2, 3, 4, 5].map(cat => (
                  <TableCell key={cat} className="text-center">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={tempStandards.reconstruction[cat]}
                        onChange={(e) => updateValue('reconstruction', cat, e.target.value)}
                        className="w-20 text-center"
                      />
                    ) : (
                      <span className="font-medium text-green-600">{tempStandards.reconstruction[cat]}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Капітальний ремонт</TableCell>
                {[1, 2, 3, 4, 5].map(cat => (
                  <TableCell key={cat} className="text-center">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={tempStandards.capital_repair[cat]}
                        onChange={(e) => updateValue('capital_repair', cat, e.target.value)}
                        className="w-20 text-center"
                      />
                    ) : (
                      <span className="font-medium text-orange-600">{tempStandards.capital_repair[cat]}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Поточний ремонт</TableCell>
                {[1, 2, 3, 4, 5].map(cat => (
                  <TableCell key={cat} className="text-center">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={tempStandards.current_repair[cat]}
                        onChange={(e) => updateValue('current_repair', cat, e.target.value)}
                        className="w-20 text-center"
                      />
                    ) : (
                      <span className="font-medium text-blue-600">{tempStandards.current_repair[cat]}</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Сторінка 4: Орієнтовна вартість робіт
const Page4_EstimatedCosts: React.FC<{
  sections: RoadSectionUI[];
  costStandards: CostStandards;
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ sections, costStandards, onSectionsChange, onNext, onBack }) => {
  const [calculatedSections, setCalculatedSections] = useState<RoadSectionUI[]>([]);

  useEffect(() => {
    handleCalculateCosts();
  }, [sections, costStandards]);

  const handleCalculateCosts = () => {
    const updated = sections.map(section => ({
      ...section,
      estimatedCost: calculateCost(section, costStandards)
    }));
    setCalculatedSections(updated);
    onSectionsChange(updated);
  };

  const totalCost = calculatedSections
    .filter(s => s.workType !== 'Не потрібно' && s.workType !== 'Не визначено')
    .reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Орієнтовна вартість робіт</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Найменування ділянки дороги</TableHead>
                <TableHead>Протяжність дороги (км)</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead>Вид робіт</TableHead>
                <TableHead>Орієнтовна вартість робіт (млн грн)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedSections
                .filter(s => s.workType !== 'Не потрібно' && s.workType !== 'Не визначено')
                .map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>{section.length}</TableCell>
                    <TableCell>{CATEGORIES[section.category as keyof typeof CATEGORIES]?.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        section.workType === 'Поточний ремонт' ? 'default' :
                        section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                      }>
                        {section.workType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {section.estimatedCost?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 p-4 bg-green-50 rounded flex justify-between items-center">
            <span className="font-semibold">Загальна вартість робіт:</span>
            <span className="text-2xl font-bold text-green-700">{totalCost.toFixed(2)} млн грн</span>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Page5_EconomicAnalysis: React.FC<{
  sections: RoadSectionUI[];
  onSectionsChange: (sections: RoadSectionUI[]) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ sections, onSectionsChange, onNext, onBack }) => {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [economicData, setEconomicData] = useState<EconomicAnalysisData | null>(null);
  const [analysisParams, setAnalysisParams] = useState({
    discountRate: 0.05,
    analysisYears: 20,
    travelTimeSavingsPercent: 15,
    vehOperCostSavingsPercent: 10,
    accidentReductionPercent: 20,
    annualMaintenancePercent: 2.5
  });

  const eligibleSections = sections.filter(s => 
    s.workType === 'Реконструкція' || s.workType === 'Капітальний ремонт'
  );

  const calculateEconomicIndicators = () => {
    if (!selectedSection) return;
    
    const section = sections.find(s => s.id === selectedSection);
    if (!section) return;

    const projectCost = section.estimatedCost || 0;
    
    // Розрахунок вигод на основі параметрів
    const annualTrafficVolume = section.trafficIntensity * 365;
    const avgTripLength = section.length;
    
    // Вигоди від економії часу (млн грн/рік)
    const travelTimeSavings = (annualTrafficVolume * avgTripLength * 0.5 * analysisParams.travelTimeSavingsPercent / 100) / 1000000;
    
    // Вигоди від зниження експлуатаційних витрат (млн грн/рік)
    const vehOperCostSavings = (annualTrafficVolume * avgTripLength * 0.3 * analysisParams.vehOperCostSavingsPercent / 100) / 1000000;
    
    // Вигоди від зниження аварійності (млн грн/рік)
    const accidentReductionBenefit = (projectCost * 0.02 * analysisParams.accidentReductionPercent / 100);
    
    // Витрати на утримання
    const annualMaintenanceCost = projectCost * analysisParams.annualMaintenancePercent / 100;
    
    // Розрахунок по роках
    const yearlyData = [];
    let totalNPV = 0;
    let totalDiscountedBenefits = 0;
    let totalDiscountedCosts = 0;
    
    for (let year = 1; year <= analysisParams.analysisYears; year++) {
      const discountFactor = 1 / Math.pow(1 + analysisParams.discountRate, year);
      
      // Капітальні витрати тільки в перший рік
      const capitalCost = year === 1 ? projectCost : 0;
      
      // Вигоди починаються з другого року
      const benefits = year >= 2 ? (travelTimeSavings + vehOperCostSavings + accidentReductionBenefit) : 0;
      
      // Витрати на утримання з другого року
      const maintenanceCost = year >= 2 ? annualMaintenanceCost : 0;
      
      const totalCosts = capitalCost + maintenanceCost;
      const netBenefit = benefits - totalCosts;
      const presentValue = netBenefit * discountFactor;
      
      totalNPV += presentValue;
      totalDiscountedBenefits += benefits * discountFactor;
      totalDiscountedCosts += totalCosts * discountFactor;
      
      yearlyData.push({
        year: 2024 + year,
        benefits,
        costs: totalCosts,
        netBenefit,
        discountFactor: Number(discountFactor.toFixed(4)),
        presentValue: Number(presentValue.toFixed(2))
      });
    }
    
    // Розрахунок BCR та EIRR
    const bcr = totalDiscountedCosts > 0 ? totalDiscountedBenefits / totalDiscountedCosts : 0;
    
    // Спрощений розрахунок EIRR
    const eirr = totalNPV > 0 ? analysisParams.discountRate + (totalNPV / projectCost) * 0.1 : 0;
    
    // Оновлення даних секції
    const updatedSections = sections.map(s => {
      if (s.id === selectedSection) {
        return {
          ...s,
          enpv: totalNPV * 1000000, // конвертація в грн
          bcr: Number(bcr.toFixed(2)),
          eirr: Number((eirr * 100).toFixed(1))
        };
      }
      return s;
    });
    
    onSectionsChange(updatedSections);
    
    setEconomicData({
      sectionId: section.id,
      sectionName: section.name,
      repairType: section.workType || '',
      projectCost,
      discountRate: analysisParams.discountRate,
      analysisYears: analysisParams.analysisYears,
      travelTimeSavings,
      vehicleOperatingCostSavings: vehOperCostSavings,
      accidentReductionBenefit,
      annualMaintenanceCost,
      periodicMaintenanceCost: 0,
      yearlyData
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Визначення ефективності реконструкції/капітального ремонту автомобільної дороги</CardTitle>
        </CardHeader>
        <CardContent>
          {eligibleSections.length === 0 ? (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                Немає секцій, що потребують реконструкції або капітального ремонту для економічного аналізу.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Вибір секції та параметри */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Виберіть об'єкт для аналізу</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть дорожню секцію" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleSections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name} ({section.workType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Ставка дисконтування</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={analysisParams.discountRate}
                      onChange={(e) => setAnalysisParams({...analysisParams, discountRate: parseFloat(e.target.value) || 0.05})}
                    />
                  </div>
                  <div>
                    <Label>Період аналізу (років)</Label>
                    <Input
                      type="number"
                      value={analysisParams.analysisYears}
                      onChange={(e) => setAnalysisParams({...analysisParams, analysisYears: parseInt(e.target.value) || 20})}
                    />
                  </div>
                </div>
              </div>
              
              {/* Параметри вигод */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Параметри економічних вигод (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Економія часу (%)</Label>
                      <Input
                        type="number"
                        value={analysisParams.travelTimeSavingsPercent}
                        onChange={(e) => setAnalysisParams({...analysisParams, travelTimeSavingsPercent: parseFloat(e.target.value) || 15})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Зниження експл. витрат (%)</Label>
                      <Input
                        type="number"
                        value={analysisParams.vehOperCostSavingsPercent}
                        onChange={(e) => setAnalysisParams({...analysisParams, vehOperCostSavingsPercent: parseFloat(e.target.value) || 10})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Зниження аварійності (%)</Label>
                      <Input
                        type="number"
                        value={analysisParams.accidentReductionPercent}
                        onChange={(e) => setAnalysisParams({...analysisParams, accidentReductionPercent: parseFloat(e.target.value) || 20})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Витрати на утримання (%)</Label>
                      <Input
                        type="number"
                        value={analysisParams.annualMaintenancePercent}
                        onChange={(e) => setAnalysisParams({...analysisParams, annualMaintenancePercent: parseFloat(e.target.value) || 2.5})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button onClick={calculateEconomicIndicators} disabled={!selectedSection} className="w-full">
                <CalculatorIcon className="h-4 w-4 mr-2" />
                Розрахувати економічні показники
              </Button>
              
              {/* Результати аналізу */}
              {economicData && economicData.yearlyData && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Результати економічного аналізу</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-700">
                            {economicData.yearlyData.reduce((sum, y) => sum + y.presentValue, 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">ENPV (млн грн)</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-700">
                            {sections.find(s => s.id === selectedSection)?.eirr || 0}%
                          </div>
                          <div className="text-sm text-gray-600">EIRR</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-700">
                            {sections.find(s => s.id === selectedSection)?.bcr || 0}
                          </div>
                          <div className="text-sm text-gray-600">BCR</div>
                        </div>
                      </div>
                      
                      {/* Таблиця по роках */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Рік</TableHead>
                              <TableHead>Вигоди (млн грн)</TableHead>
                              <TableHead>Витрати (млн грн)</TableHead>
                              <TableHead>Чистий ефект</TableHead>
                              <TableHead>Коеф. дисконтування</TableHead>
                              <TableHead>Приведена вартість</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {economicData.yearlyData.slice(0, 10).map((year) => (
                              <TableRow key={year.year}>
                                <TableCell>{year.year}</TableCell>
                                <TableCell>{year.benefits.toFixed(2)}</TableCell>
                                <TableCell>{year.costs.toFixed(2)}</TableCell>
                                <TableCell className={year.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {year.netBenefit.toFixed(2)}
                                </TableCell>
                                <TableCell>{year.discountFactor}</TableCell>
                                <TableCell className="font-medium">{year.presentValue.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={onNext}>
              Далі
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Сторінка 6: Ранжування об'єктів
const Page6_Ranking: React.FC<{
  sections: RoadSectionUI[];
  onBack: () => void;
}> = ({ sections, onBack }) => {
  const [sortBy, setSortBy] = useState<'enpv' | 'bcr' | 'eirr'>('enpv');
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResults, setPlanResults] = useState<any>(null);
  
  const rankedSections = [...sections]
    .filter(s => s.workType !== 'Не потрібно' && s.workType !== 'Не визначено')
    .sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return bValue - aValue;
    });

  // Функція планування з використанням даних Блоку 1
  const runBudgetPlanning = async () => {
    if (!hasBlockOneBudgetData()) {
      alert('Немає даних з Блоку 1! Спочатку виконайте розрахунки бюджету.');
      return;
    }

    setIsPlanning(true);

    try {
      // Конвертуємо секції для модуля
      const roadSections = sections.map(s => convertUIToRoadSection(s));
      
      // Викликаємо функцію планування з модуля
      const results = planRepairWorksWithBlockOneData(roadSections);
      setPlanResults(results);
      
      console.log('Результати планування з бюджетом Блоку 1:', results);
    } catch (error) {
      console.error('Помилка планування:', error);
      alert('Помилка при плануванні: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPlanning(false);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Всі 6 листів з даними
    const ws1_data = [
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг'],
      [''],
      ['Найменування ділянки дороги', 'Протяжність дороги, км', 'Категорія', 'Інтенсивність руху', 'Модуль пружності', 'Рівність (профілометр)', 'Рівність (поштовхомір)', 'Глибина колії', 'Коеф. зчеплення'],
      ...sections.map(s => [s.name, s.length, s.category, s.trafficIntensity, s.strengthModulus, s.roughnessProfile, s.roughnessBump, s.rutDepth, s.frictionCoeff])
    ];
    
    const ws2_data = [
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг'],
      [''],
      ['Найменування ділянки дороги', 'Протяжність', 'Коеф. інтенсивності', 'Коеф. міцності', 'Коеф. рівності', 'Коеф. колійності', 'Коеф. зчеплення', 'Вид робіт'],
      ...sections.map(s => [s.name, s.length, s.intensityCoeff, s.strengthCoeff, s.evennessCoeff, s.rutCoeff, s.frictionFactorCoeff, s.workType])
    ];
    
    const ws6_data = [
      ['Ранжування об\'єктів'],
      [''],
      ['Найменування ділянки дороги', 'Протяжність (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість робіт', 'ENPV', 'EIRR', 'BCR'],
      ...rankedSections.map(s => [
        s.name, 
        s.length, 
        s.category, 
        s.workType, 
        s.estimatedCost?.toFixed(2),
        Math.round(s.enpv || 0),
        `${s.eirr || 0}%`,
        s.bcr || 0
      ])
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(ws1_data);
    const ws2 = XLSX.utils.aoa_to_sheet(ws2_data);
    const ws6 = XLSX.utils.aoa_to_sheet(ws6_data);
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Фактичний стан');
    XLSX.utils.book_append_sheet(wb, ws2, 'Коефіцієнти');
    XLSX.utils.book_append_sheet(wb, ws6, 'Ранжування');
    
    XLSX.writeFile(wb, `road_repair_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadReport = () => {
    const report = generateDetailedRepairPlanReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detailed_repair_plan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Кнопка планування з використанням бюджету */}
      {hasBlockOneBudgetData() && (
        <Card>
          <CardHeader>
            <CardTitle>Планування з урахуванням бюджету Блоку 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={runBudgetPlanning}
                disabled={isPlanning || sections.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPlanning ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                )}
                Розподілити бюджет
              </Button>
              
              <Button 
                onClick={downloadReport}
                variant="outline"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Завантажити звіт
              </Button>
            </div>

            {planResults && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-lg font-bold text-yellow-800">
                      {planResults.currentRepairProjects.length}
                    </div>
                    <div className="text-sm text-yellow-600">Поточний ремонт</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.currentRepairUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-lg font-bold text-orange-800">
                      {planResults.capitalRepairProjects.length}
                    </div>
                    <div className="text-sm text-orange-600">Капітальний ремонт</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.capitalRepairUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <div className="text-lg font-bold text-red-800">
                      {planResults.reconstructionProjects.length}
                    </div>
                    <div className="text-sm text-red-600">Реконструкція</div>
                    <div className="text-xs text-gray-500">
                      {(planResults.budgetBreakdown.reconstructionUsed / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="text-lg font-bold text-green-800">
                      {planResults.budgetUtilization.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-600">Використання бюджету</div>
                    <div className="text-xs text-gray-500">
                      Резерв: {(planResults.budgetBreakdown.reserveRemaining / 1000).toFixed(1)} млн грн
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ранжування об'єктів</span>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: 'enpv' | 'bcr' | 'eirr') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enpv">За ENPV</SelectItem>
                  <SelectItem value="bcr">За BCR</SelectItem>
                  <SelectItem value="eirr">За EIRR</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} variant="outline">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Експорт Excel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пріоритет</TableHead>
                <TableHead>Найменування ділянки дороги</TableHead>
                <TableHead>Протяжність (км)</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead>Вид робіт</TableHead>
                <TableHead>Орієнтовна вартість робіт (млн грн)</TableHead>
                <TableHead>ENPV</TableHead>
                <TableHead>EIRR</TableHead>
                <TableHead>BCR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedSections.map((section, index) => (
                <TableRow key={section.id}>
                  <TableCell>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>{section.length}</TableCell>
                  <TableCell>{CATEGORIES[section.category as keyof typeof CATEGORIES]?.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      section.workType === 'Поточний ремонт' ? 'default' :
                      section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                    }>
                      {section.workType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {section.estimatedCost?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-blue-600">
                    {Math.round(section.enpv || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{section.eirr || 0}%</TableCell>
                  <TableCell>{section.bcr || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Підсумкова статистика */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{rankedSections.length}</div>
                <div className="text-sm text-gray-600">Всього проектів</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {rankedSections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Загальна вартість (млн грн)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {rankedSections.filter(s => s.workType === 'Реконструкція').length}
                </div>
                <div className="text-sm text-gray-600">Реконструкцій</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {rankedSections.filter(s => s.workType === 'Капітальний ремонт').length}
                </div>
                <div className="text-sm text-gray-600">Капітальних ремонтів</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button onClick={onBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== ГОЛОВНИЙ КОМПОНЕНТ ====================
const Block3MultiPageApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sections, setSections] = useState<RoadSectionUI[]>([]);
  const [costStandards, setCostStandards] = useState<CostStandards>(DEFAULT_COST_STANDARDS);

  const pages = [
    'Фактичний стан доріг',
    'Показники та коефіцієнти',
    'Показники вартості',
    'Орієнтовна вартість',
    'Економічна ефективність',
    'Ранжування об\'єктів'
  ];

  const handleNext = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Відображення бюджету з Блоку 1 */}
        <BlockOneBudgetDisplay />

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Блок 3: Планування ремонтів автомобільних доріг
          </h1>
          <p className="text-gray-600">
            Визначення обсягу та механізм розподілу бюджетних коштів на ремонти згідно з ДБН В.2.3-4:2015
          </p>
        </div>

        {/* Навігація по сторінках */}
        <div className="mb-6">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-2">
              {pages.map((page, index) => {
                const pageNum = index + 1;
                const isActive = currentPage === pageNum;
                const isCompleted = currentPage > pageNum;
                
                return (
                  <li key={pageNum} className="flex items-center">
                    <button
                      onClick={() => handlePageSelect(pageNum)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : isCompleted 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300'
                      }`}>
                        {isCompleted ? '✓' : pageNum}
                      </span>
                      <span className="hidden md:inline">{page}</span>
                    </button>
                    {index < pages.length - 1 && (
                      <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Прогрес */}
        <div className="mb-6">
          <Progress value={(currentPage / pages.length) * 100} className="h-2" />
        </div>

        {/* Контент сторінок */}
        <div className="bg-white rounded-lg shadow-sm">
          {currentPage === 1 && (
            <Page1_RoadConditions 
              sections={sections}
              onSectionsChange={setSections}
              onNext={handleNext}
            />
          )}
          
          {currentPage === 2 && (
            <Page2_Coefficients
              sections={sections}
              onSectionsChange={setSections}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentPage === 3 && (
            <Page3_CostIndicators
              costStandards={costStandards}
              onCostStandardsChange={setCostStandards}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentPage === 4 && (
            <Page4_EstimatedCosts
              sections={sections}
              costStandards={costStandards}
              onSectionsChange={setSections}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentPage === 5 && (
            <Page5_EconomicAnalysis
              sections={sections}
              onSectionsChange={setSections}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentPage === 6 && (
            <Page6_Ranking
              sections={sections}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Інформаційна панель */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheetIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold">Дорожніх секцій</div>
                  <div className="text-2xl font-bold">{sections.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-semibold">Потребують ремонту</div>
                  <div className="text-2xl font-bold">
                    {sections.filter(s => s.workType && s.workType !== 'Не потрібно' && s.workType !== 'Не визначено').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSignIcon className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="font-semibold">Загальна вартість</div>
                  <div className="text-2xl font-bold">
                    {sections
                      .filter(s => s.workType && s.workType !== 'Не потрібно' && s.workType !== 'Не визначено')
                      .reduce((sum, s) => sum + (s.estimatedCost || 0), 0)
                      .toFixed(1)} млн
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Block3MultiPageApp;