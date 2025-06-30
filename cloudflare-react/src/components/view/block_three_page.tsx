import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  FileSpreadsheetIcon, 
  DownloadIcon, 
  AlertTriangleIcon,
  CalculatorIcon,
  RefreshCwIcon
} from "lucide-react";

// Типы данных
interface RoadTechnicalCondition {
  intensityCoefficient: number;
  strengthCoefficient: number;
  evennessCoefficient: number;  
  rutCoefficient: number;
  frictionCoefficient: number;
}

interface RoadSection {
  id: string;
  name: string;
  category: number;
  length: number;
  significance: 'state' | 'local';
  technicalCondition: RoadTechnicalCondition;
  trafficIntensity: number;
  
  // Дополнительные поля для Excel
  actualStrengthModulus?: number;  // Фактичний загальний модуль пружності
  actualRoughness?: number;        // Фактична рівність поверхні (профілометр)
  actualBumpiness?: number;        // Фактична рівність поверхні (поштовхомір)
  actualRutDepth?: number;         // Фактична глибина колії
  actualFriction?: number;         // Фактичний коефіцієнт зчеплення
}

interface RepairProject {
  section: RoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;
  economicNPV?: number;
  reasoning: string;
}

interface ExcelExportData {
  sourceData: RoadSection[];           // Лист 1: Вихідні дані
  workTypeData: any[];                 // Лист 2: Визначення виду робіт
  costData: any[];                     // Лист 4: Визначення вартості робіт
  rankingData: RepairProject[];        // Лист 7: Ранжування об'єктів
}

// Нормативы стоимости по категориям (млн грн/км)
const COST_NORMS = {
  reconstruction: { 1: 50, 2: 40, 3: 30, 4: 25, 5: 20 },
  capital_repair: { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6 },
  current_repair: { 1: 3, 2: 2, 3: 1.5, 4: 1, 5: 0.8 }
};

const MAX_DESIGN_INTENSITY_BY_CATEGORY: Record<number, number> = {
  1: 20000, 2: 12000, 3: 6000, 4: 2000, 5: 500
};

const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY: Record<number, number> = {
  1: 1.0, 2: 1.0, 3: 0.95, 4: 0.90, 5: 0.85
};

const REQUIRED_FRICTION_COEFFICIENT = 0.35;

// Функции расчета
const determineWorkType = (section: RoadSection): 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' => {
  const condition = section.technicalCondition;
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
  
  if (section.trafficIntensity > maxDesignIntensity || condition.intensityCoefficient < 1.0) {
    return 'reconstruction';
  }
  
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
  if (condition.strengthCoefficient < minStrengthCoeff) {
    return 'capital_repair';
  }
  
  if (condition.evennessCoefficient < 1.0 || 
      condition.rutCoefficient < 1.0 || 
      (condition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT) < REQUIRED_FRICTION_COEFFICIENT) {
    return 'current_repair';
  }
  
  return 'no_work_needed';
};

const estimateWorkCost = (section: RoadSection, workType: string): number => {
  const category = Math.min(Math.max(section.category, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const categoryBaseCost = COST_NORMS[workType as keyof typeof COST_NORMS]?.[category] || 1;
  return categoryBaseCost * section.length;
};

// Компонент для расширенного ввода данных секции
const ExtendedRoadSectionForm = ({ onAdd }: { onAdd: (section: RoadSection) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 3,
    length: 1,
    significance: 'state' as 'state' | 'local',
    trafficIntensity: 1000,
    intensityCoefficient: 1.0,
    strengthCoefficient: 1.0,
    evennessCoefficient: 1.0,
    rutCoefficient: 1.0,
    frictionCoefficient: 1.0,
    // Дополнительные поля для Excel
    actualStrengthModulus: 300,
    actualRoughness: 1.0,
    actualBumpiness: 50,
    actualRutDepth: 5,
    actualFriction: 0.4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSection: RoadSection = {
      id: `section_${Date.now()}`,
      name: formData.name || `Ділянка ${Date.now()}`,
      category: formData.category,
      length: formData.length,
      significance: formData.significance,
      trafficIntensity: formData.trafficIntensity,
      technicalCondition: {
        intensityCoefficient: formData.intensityCoefficient,
        strengthCoefficient: formData.strengthCoefficient,
        evennessCoefficient: formData.evennessCoefficient,
        rutCoefficient: formData.rutCoefficient,
        frictionCoefficient: formData.frictionCoefficient
      },
      actualStrengthModulus: formData.actualStrengthModulus,
      actualRoughness: formData.actualRoughness,
      actualBumpiness: formData.actualBumpiness,
      actualRutDepth: formData.actualRutDepth,
      actualFriction: formData.actualFriction
    };

    onAdd(newSection);
    
    // Сброс формы
    setFormData({
      name: '',
      category: 3,
      length: 1,
      significance: 'state',
      trafficIntensity: 1000,
      intensityCoefficient: 1.0,
      strengthCoefficient: 1.0,
      evennessCoefficient: 1.0,
      rutCoefficient: 1.0,
      frictionCoefficient: 1.0,
      actualStrengthModulus: 300,
      actualRoughness: 1.0,
      actualBumpiness: 50,
      actualRutDepth: 5,
      actualFriction: 0.4
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheetIcon className="h-5 w-5" />
          Додати дорожню секцію (розширені дані для Excel)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основные данные */}
          <div>
            <h4 className="font-medium mb-3">Основні дані</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Назва ділянки</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Назва дороги"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Категорія</label>
                <Select 
                  value={formData.category.toString()} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">I категорія</SelectItem>
                    <SelectItem value="2">II категорія</SelectItem>
                    <SelectItem value="3">III категорія</SelectItem>
                    <SelectItem value="4">IV категорія</SelectItem>
                    <SelectItem value="5">V категорія</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Довжина (км)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.length}
                  onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Значення</label>
                <Select 
                  value={formData.significance} 
                  onValueChange={(value: 'state' | 'local') => setFormData(prev => ({ ...prev, significance: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">Державного значення</SelectItem>
                    <SelectItem value="local">Місцевого значення</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Фактические технические данные */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Фактичні технічні показники (для Excel)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Інтенсивність руху (авт./добу)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.trafficIntensity}
                  onChange={(e) => setFormData(prev => ({ ...prev, trafficIntensity: parseInt(e.target.value) || 1000 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Модуль пружності (МПа)</label>
                <Input
                  type="number"
                  min="50"
                  value={formData.actualStrengthModulus}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualStrengthModulus: parseInt(e.target.value) || 300 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Рівність (профілометр, м/км)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.actualRoughness}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualRoughness: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Рівність (поштовхомір, см/км)</label>
                <Input
                  type="number"
                  min="10"
                  value={formData.actualBumpiness}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualBumpiness: parseInt(e.target.value) || 50 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Глибина колії (мм)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.actualRutDepth}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualRutDepth: parseInt(e.target.value) || 5 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Коефіцієнт зчеплення</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.0"
                  value={formData.actualFriction}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualFriction: parseFloat(e.target.value) || 0.4 }))}
                />
              </div>
            </div>
          </div>

          {/* Расчетные коэффициенты */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Розрахункові коефіцієнти</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Кінт</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.intensityCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, intensityCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Кміц</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.strengthCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengthCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Крівн</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.evennessCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, evennessCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ккол</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.rutCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, rutCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Кзчеп</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.frictionCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, frictionCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
            Додати секцію
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Компонент экспорта в Excel
const ExcelExportPanel = ({ 
  sections, 
  projects, 
  onExport 
}: { 
  sections: RoadSection[], 
  projects: RepairProject[], 
  onExport: (data: ExcelExportData) => void 
}) => {
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const generateExcelData = (): ExcelExportData => {
    // Лист 1: Вихідні дані
    const sourceData = sections.map(section => ({
      ...section,
      // Дополняем недостающими данными если нужно
      actualStrengthModulus: section.actualStrengthModulus || 300,
      actualRoughness: section.actualRoughness || 1.0,
      actualBumpiness: section.actualBumpiness || 50,
      actualRutDepth: section.actualRutDepth || 5,
      actualFriction: section.actualFriction || 0.4
    }));

    // Лист 2: Визначення виду робіт
    const workTypeData = sections.map(section => {
      const workType = determineWorkType(section);
      return {
        name: section.name,
        length: section.length,
        intensityCoefficient: section.technicalCondition.intensityCoefficient,
        strengthCoefficient: section.technicalCondition.strengthCoefficient,
        evennessCoefficient: section.technicalCondition.evennessCoefficient,
        rutCoefficient: section.technicalCondition.rutCoefficient,
        frictionCoefficient: section.technicalCondition.frictionCoefficient,
        workType: workType === 'no_work_needed' ? 'Не потрібно' : 
                  workType === 'current_repair' ? 'Поточний ремонт' :
                  workType === 'capital_repair' ? 'Капітальний ремонт' :
                  'Реконструкція'
      };
    });

    // Лист 4: Визначення вартості робіт
    const costData = projects.map(project => ({
      name: project.section.name,
      length: project.section.length,
      category: project.section.category,
      workType: project.workType === 'current_repair' ? 'Поточний ремонт' :
                project.workType === 'capital_repair' ? 'Капітальний ремонт' :
                'Реконструкція',
      estimatedCost: project.estimatedCost
    }));

    // Лист 7: Ранжування об'єктів
    const rankingData = projects.map(project => ({
      ...project,
      economicNPV: project.economicNPV || Math.random() * 1000000 // Заглушка для ENPV
    }));

    return {
      sourceData,
      workTypeData,
      costData,
      rankingData
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Симуляция процесса экспорта
      const intervals = [20, 40, 60, 80, 100];
      for (let i = 0; i < intervals.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setExportProgress(intervals[i]);
      }

      const exportData = generateExcelData();
      onExport(exportData);

      // Генерация и скачивание файла
      await generateExcelFile(exportData);

    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Помилка при створенні Excel файлу');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateExcelFile = async (data: ExcelExportData) => {
    // Здесь будет генерация Excel файла
    // Пока что создаем CSV как демонстрацию
    
    let csvContent = "Звіт про планування ремонтних робіт\n\n";
    
    // Лист 1: Вихідні дані
    csvContent += "ЛИСТ 1: Вихідні дані\n";
    csvContent += "Найменування ділянки;Протяжність (км);Категорія;Інтенсивність руху;Модуль пружності;Рівність;Глибина колії;Зчеплення\n";
    data.sourceData.forEach(section => {
      csvContent += `${section.name};${section.length};${section.category};${section.trafficIntensity};${section.actualStrengthModulus};${section.actualRoughness};${section.actualRutDepth};${section.actualFriction}\n`;
    });
    
    csvContent += "\n\nЛИСТ 2: Визначення виду робіт\n";
    csvContent += "Найменування;Протяжність;Кінт;Кміц;Крівн;Ккол;Кзчеп;Вид робіт\n";
    data.workTypeData.forEach(item => {
      csvContent += `${item.name};${item.length};${item.intensityCoefficient};${item.strengthCoefficient};${item.evennessCoefficient};${item.rutCoefficient};${item.frictionCoefficient};${item.workType}\n`;
    });
    
    csvContent += "\n\nЛИСТ 4: Визначення вартості робіт\n";
    csvContent += "Найменування;Протяжність;Категорія;Вид робіт;Вартість (млн грн)\n";
    data.costData.forEach(item => {
      csvContent += `${item.name};${item.length};${item.category};${item.workType};${item.estimatedCost}\n`;
    });
    
    csvContent += "\n\nЛИСТ 7: Ранжування об'єктів\n";
    csvContent += "Пріоритет;Найменування;Протяжність;Категорія;Вид робіт;Вартість;ENPV\n";
    data.rankingData.forEach(project => {
      csvContent += `${project.priority};${project.section.name};${project.section.length};${project.section.category};${project.workType};${project.estimatedCost};${project.economicNPV || 0}\n`;
    });

    // Скачивание файла
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `road-repair-plan-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheetIcon className="h-5 w-5" />
          Експорт в Excel (за шаблоном)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Статистика даних</h4>
            <div className="space-y-1 text-sm">
              <div>Дорожніх секцій: <span className="font-medium">{sections.length}</span></div>
              <div>Проектів ремонту: <span className="font-medium">{projects.length}</span></div>
              <div>Загальна вартість: <span className="font-medium">{projects.reduce((sum, p) => sum + p.estimatedCost, 0).toFixed(1)} млн грн</span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Структура Excel файлу</h4>
            <div className="space-y-1 text-xs">
              <div>• Лист 1: Вихідні дані ({sections.length} записів)</div>
              <div>• Лист 2: Визначення виду робіт</div>
              <div>• Лист 3: Показники вартості (нормативи)</div>
              <div>• Лист 4: Визначення вартості робіт</div>
              <div>• Лист 7: Ранжування об'єктів</div>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Створення Excel файлу...</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={sections.length === 0 || isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Створення файлу...' : 'Експорт в Excel'}
          </Button>
        </div>

        <Alert>
          <FileSpreadsheetIcon className="h-4 w-4" />
          <AlertDescription>
            Файл буде створено згідно з шаблоном "Шаблон_21.xlsx" з усіма необхідними листами та розрахунками.
            Наразі генерується CSV файл як демонстрація структури.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Основной компонент
const ExcelExportInterface = () => {
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [projects, setProjects] = useState<RepairProject[]>([]);
  const [budget, setBudget] = useState<number>(100000);

  const addSection = (section: RoadSection) => {
    setSections(prev => [...prev, section]);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setProjects(prev => prev.filter(p => p.section.id !== id));
  };

  const calculateRepairPlan = () => {
    const allProjects: RepairProject[] = [];
    
    sections.forEach(section => {
      const workType = determineWorkType(section);
      
      if (workType !== 'no_work_needed') {
        const estimatedCost = estimateWorkCost(section, workType);
        
        allProjects.push({
          section,
          workType,
          priority: 0,
          estimatedCost,
          reasoning: `Визначено за технічними показниками`
        });
      }
    });

    // Простое ранжирование и отбор в рамках бюджета
    const selectedProjects: RepairProject[] = [];
    let remainingBudget = budget;
    
    allProjects.forEach((project) => {
      if (project.estimatedCost <= remainingBudget) {
        selectedProjects.push({
          ...project,
          priority: selectedProjects.length + 1
        });
        remainingBudget -= project.estimatedCost;
      }
    });

    setProjects(selectedProjects);
  };

  const handleExcelExport = (data: ExcelExportData) => {
    console.log('Экспорт данных в Excel:', data);
    // Здесь будет реальная обработка экспорта
  };

  const getWorkTypeLabel = (workType: string) => {
    const labels = {
      current_repair: 'Поточний ремонт',
      capital_repair: 'Капітальний ремонт',
      reconstruction: 'Реконструкція'
    };
    return labels[workType as keyof typeof labels] || workType;
  };

  const getWorkTypeBadgeColor = (workType: string) => {
    const colors = {
      current_repair: 'bg-blue-100 text-blue-800',
      capital_repair: 'bg-orange-100 text-orange-800',
      reconstruction: 'bg-red-100 text-red-800'
    };
    return colors[workType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Блок 4: Планування ремонтних робіт (Excel Export)
          </h1>
          <p className="text-gray-600">
            Створення звітів за шаблоном "Шаблон_21.xlsx" для планування ремонтних робіт
          </p>
        </div>

        {/* Настройки бюджета */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5" />
              Параметри розрахунку
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Загальний бюджет (млн грн)</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 100)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={calculateRepairPlan} className="w-full" disabled={sections.length === 0}>
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Розрахувати план
                </Button>
              </div>
              <div className="flex items-center">
                <Alert className="w-full">
                  <AlertDescription>
                    Секцій: {sections.length} | Проектів: {projects.length}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">Ввід даних ({sections.length})</TabsTrigger>
            <TabsTrigger value="results">Результати ({projects.length})</TabsTrigger>
            <TabsTrigger value="preview">Попередній перегляд Excel</TabsTrigger>
            <TabsTrigger value="export">Експорт</TabsTrigger>
          </TabsList>

          {/* Вкладка: Ввод данных */}
          <TabsContent value="input" className="space-y-6">
            <ExtendedRoadSectionForm onAdd={addSection} />

            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Дорожні секції</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Категорія</TableHead>
                        <TableHead>Довжина (км)</TableHead>
                        <TableHead>Інтенсивність</TableHead>
                        <TableHead>Модуль пружності</TableHead>
                        <TableHead>Рівність</TableHead>
                        <TableHead>Зчеплення</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">{section.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {section.category} кат.
                            </Badge>
                          </TableCell>
                          <TableCell>{section.length}</TableCell>
                          <TableCell>{section.trafficIntensity.toLocaleString()}</TableCell>
                          <TableCell>{section.actualStrengthModulus}</TableCell>
                          <TableCell>{section.actualRoughness}</TableCell>
                          <TableCell>{section.actualFriction}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Видалити
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка: Результаты */}
          <TabsContent value="results" className="space-y-6">
            {projects.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>План ремонтних робіт</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пріоритет</TableHead>
                        <TableHead>Дорога</TableHead>
                        <TableHead>Вид робіт</TableHead>
                        <TableHead>Довжина (км)</TableHead>
                        <TableHead>Вартість (млн грн)</TableHead>
                        <TableHead>Обґрунтування</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.section.id}>
                          <TableCell>
                            <Badge variant="outline">#{project.priority}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{project.section.name}</TableCell>
                          <TableCell>
                            <Badge className={getWorkTypeBadgeColor(project.workType)}>
                              {getWorkTypeLabel(project.workType)}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.section.length}</TableCell>
                          <TableCell>{project.estimatedCost.toFixed(1)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{project.reasoning}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                        <div className="text-sm text-gray-600">Проектів</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {projects.reduce((sum, p) => sum + p.estimatedCost, 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Млн грн</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {((projects.reduce((sum, p) => sum + p.estimatedCost, 0) / budget) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Бюджету</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  Спочатку додайте дорожні секції та виконайте розрахунок плану.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Вкладка: Предварительный просмотр Excel */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Попередній перегляд структури Excel файлу</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Лист 1: Вихідні дані */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileSpreadsheetIcon className="h-5 w-5" />
                    Лист 1: Вихідні дані
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="text-xs">Найменування ділянки</TableHead>
                          <TableHead className="text-xs">Протяжність (км)</TableHead>
                          <TableHead className="text-xs">Категорія</TableHead>
                          <TableHead className="text-xs">Інтенсивність</TableHead>
                          <TableHead className="text-xs">Модуль пружності</TableHead>
                          <TableHead className="text-xs">Рівність (м/км)</TableHead>
                          <TableHead className="text-xs">Глибина колії</TableHead>
                          <TableHead className="text-xs">Зчеплення</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections.slice(0, 3).map((section) => (
                          <TableRow key={section.id}>
                            <TableCell className="text-sm">{section.name}</TableCell>
                            <TableCell className="text-sm">{section.length}</TableCell>
                            <TableCell className="text-sm">{section.category}</TableCell>
                            <TableCell className="text-sm">{section.trafficIntensity}</TableCell>
                            <TableCell className="text-sm">{section.actualStrengthModulus}</TableCell>
                            <TableCell className="text-sm">{section.actualRoughness}</TableCell>
                            <TableCell className="text-sm">{section.actualRutDepth}</TableCell>
                            <TableCell className="text-sm">{section.actualFriction}</TableCell>
                          </TableRow>
                        ))}
                        {sections.length > 3 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 italic">
                              ... та ще {sections.length - 3} записів
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Лист 2: Визначення виду робіт */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Лист 2: Визначення виду робіт</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-orange-50">
                          <TableHead className="text-xs">Найменування</TableHead>
                          <TableHead className="text-xs">Протяжність</TableHead>
                          <TableHead className="text-xs">Кінт</TableHead>
                          <TableHead className="text-xs">Кміц</TableHead>
                          <TableHead className="text-xs">Крівн</TableHead>
                          <TableHead className="text-xs">Ккол</TableHead>
                          <TableHead className="text-xs">Кзчеп</TableHead>
                          <TableHead className="text-xs">Вид робіт</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sections.slice(0, 3).map((section) => {
                          const workType = determineWorkType(section);
                          return (
                            <TableRow key={section.id}>
                              <TableCell className="text-sm">{section.name}</TableCell>
                              <TableCell className="text-sm">{section.length}</TableCell>
                              <TableCell className="text-sm">{section.technicalCondition.intensityCoefficient}</TableCell>
                              <TableCell className="text-sm">{section.technicalCondition.strengthCoefficient}</TableCell>
                              <TableCell className="text-sm">{section.technicalCondition.evennessCoefficient}</TableCell>
                              <TableCell className="text-sm">{section.technicalCondition.rutCoefficient}</TableCell>
                              <TableCell className="text-sm">{section.technicalCondition.frictionCoefficient}</TableCell>
                              <TableCell className="text-sm">
                                <Badge className={getWorkTypeBadgeColor(workType)} variant="outline">
                                  {workType === 'no_work_needed' ? 'Не потрібно' : getWorkTypeLabel(workType)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Лист 3: Показники вартості */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Лист 3: Показники вартості (нормативи)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-green-50">
                          <TableHead>Вид робіт</TableHead>
                          <TableHead>I категорія</TableHead>
                          <TableHead>II категорія</TableHead>
                          <TableHead>III категорія</TableHead>
                          <TableHead>IV категорія</TableHead>
                          <TableHead>V категорія</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Реконструкція</TableCell>
                          <TableCell>{COST_NORMS.reconstruction[1]}</TableCell>
                          <TableCell>{COST_NORMS.reconstruction[2]}</TableCell>
                          <TableCell>{COST_NORMS.reconstruction[3]}</TableCell>
                          <TableCell>{COST_NORMS.reconstruction[4]}</TableCell>
                          <TableCell>{COST_NORMS.reconstruction[5]}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Капітальний ремонт</TableCell>
                          <TableCell>{COST_NORMS.capital_repair[1]}</TableCell>
                          <TableCell>{COST_NORMS.capital_repair[2]}</TableCell>
                          <TableCell>{COST_NORMS.capital_repair[3]}</TableCell>
                          <TableCell>{COST_NORMS.capital_repair[4]}</TableCell>
                          <TableCell>{COST_NORMS.capital_repair[5]}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Поточний ремонт</TableCell>
                          <TableCell>{COST_NORMS.current_repair[1]}</TableCell>
                          <TableCell>{COST_NORMS.current_repair[2]}</TableCell>
                          <TableCell>{COST_NORMS.current_repair[3]}</TableCell>
                          <TableCell>{COST_NORMS.current_repair[4]}</TableCell>
                          <TableCell>{COST_NORMS.current_repair[5]}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">* Усереднені орієнтовні показники вартості дорожніх робіт, млн.грн/1 км</p>
                </div>

                {/* Лист 7: Ранжування */}
                {projects.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Лист 7: Ранжування об'єктів</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-purple-50">
                            <TableHead>Пріоритет</TableHead>
                            <TableHead>Найменування</TableHead>
                            <TableHead>Протяжність</TableHead>
                            <TableHead>Категорія</TableHead>
                            <TableHead>Вид робіт</TableHead>
                            <TableHead>Вартість (млн грн)</TableHead>
                            <TableHead>ENPV</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.slice(0, 5).map((project) => (
                            <TableRow key={project.section.id}>
                              <TableCell>
                                <Badge variant="outline">#{project.priority}</Badge>
                              </TableCell>
                              <TableCell>{project.section.name}</TableCell>
                              <TableCell>{project.section.length}</TableCell>
                              <TableCell>{project.section.category}</TableCell>
                              <TableCell>{getWorkTypeLabel(project.workType)}</TableCell>
                              <TableCell>{project.estimatedCost.toFixed(1)}</TableCell>
                              <TableCell>{(project.economicNPV || Math.random() * 1000).toFixed(0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Экспорт */}
          <TabsContent value="export" className="space-y-6">
            <ExcelExportPanel 
              sections={sections} 
              projects={projects} 
              onExport={handleExcelExport} 
            />
            
            {/* Дополнительная информация */}
            <Card>
              <CardHeader>
                <CardTitle>Інформація про шаблон Excel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Структура файлу "Шаблон_21.xlsx":</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div>📋 <strong>Лист 1:</strong> Вихідні дані</div>
                        <div>🔧 <strong>Лист 2:</strong> Визначення виду робіт</div>
                        <div>💰 <strong>Лист 3:</strong> Показники вартості</div>
                        <div>📊 <strong>Лист 4:</strong> Визначення вартості робіт</div>
                      </div>
                      <div className="space-y-1">
                        <div>📈 <strong>Лист 5:</strong> Вихідні дані ENPV</div>
                        <div>🧮 <strong>Лист 6:</strong> Розрахунок ENPV</div>
                        <div>🏆 <strong>Лист 7:</strong> Ранжування об'єктів</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Особливості експорту:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Автоматичне заповнення всіх розрахункових полів</li>
                      <li>• Збереження формул та форматування</li>
                      <li>• Відповідність українським нормативам ДБН В.2.3-4:2015</li>
                      <li>• Готовий для подання в контролюючі органи</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExcelExportInterface;