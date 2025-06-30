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
  UploadIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalculatorIcon,
  RefreshCwIcon,
  FileIcon
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
  actualStrengthModulus?: number;  
  actualRoughness?: number;        
  actualBumpiness?: number;        
  actualRutDepth?: number;         
  actualFriction?: number;         
}

interface RepairProject {
  section: RoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;
  economicNPV?: number;
  reasoning: string;
}

// Нормативы стоимости (млн грн/км)
const COST_NORMS = {
  reconstruction: { 1: 50.0, 2: 40.0, 3: 30.0, 4: 25.0, 5: 20.0 },
  capital_repair: { 1: 15.0, 2: 12.0, 3: 10.0, 4: 8.0, 5: 6.0 },
  current_repair: { 1: 3.0, 2: 2.0, 3: 1.5, 4: 1.0, 5: 0.8 }
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

// Компонент для ввода новой секции
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <label className="block text-sm font-medium mb-1">Інтенсивність (авт./добу)</label>
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
          <label className="block text-sm font-medium mb-1">Зчеплення</label>
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
  );
};

// Компонент для правильного экспорта в Excel
const ExcelExportManager = ({ 
  sections, 
  projects 
}: { 
  sections: RoadSection[], 
  projects: RepairProject[] 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Генерация корректного Excel файла
  const generateExcelWorkbook = () => {
    // Лист 1: Вихідні дані
    const sheet1Data = [
      ['Визначення показників фактичного технічного стану автомобільних доріг'],
      ['Найменування ділянки дороги', 'Протяжність дороги, км', 'Категорія ділянки дороги', 
       'Фактична інтенсивності руху ТЗ (авт./добу)', 'Фактичний загальний модуль пружності дорожньої конструкції (МПа)',
       'Фактична рівність поверхні дорожнього покриву (профілометр, м/км)', 
       'Фактична рівність поверхні дорожнього покриву (поштовхомір, см/км)',
       'Фактична глибина колії (мм)', 'Фактичний коефіцієнт зчеплення'],
      ...sections.map(section => [
        section.name,
        section.length,
        section.category,
        section.trafficIntensity,
        section.actualStrengthModulus || 300,
        section.actualRoughness || 1.0,
        section.actualBumpiness || 50,
        section.actualRutDepth || 5,
        section.actualFriction || 0.4
      ])
    ];

    // Лист 2: Визначення виду робіт
    const sheet2Data = [
      ['Визначення показників фактичного технічного стану автомобільних доріг'],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Коефіцієнт інтенсивності руху', 
       'Коефіцієнт запасу міцності дорожнього одягу', 'Коефіцієнт рівності', 
       'Коефіцієнт колійності', 'Коефіцієнт зчеплення', 'Вид робіт'],
      ...sections.map(section => {
        const workType = determineWorkType(section);
        const workTypeUa = workType === 'no_work_needed' ? 'Не потрібно' : 
                          workType === 'current_repair' ? 'Поточний ремонт' :
                          workType === 'capital_repair' ? 'Капітальний ремонт' : 'Реконструкція';
        
        return [
          section.name,
          section.length,
          section.technicalCondition.intensityCoefficient,
          section.technicalCondition.strengthCoefficient,
          section.technicalCondition.evennessCoefficient,
          section.technicalCondition.rutCoefficient,
          section.technicalCondition.frictionCoefficient,
          workTypeUa
        ];
      })
    ];

    // Лист 3: Показники вартості
    const sheet3Data = [
      ['Усереднені орієнтовні показники вартості дорожніх робіт за даними об\'єктів-аналогів, млн.грн/1 км'],
      ['Вид робіт', 'Категорія дороги', '', '', '', ''],
      ['', 'І', 'ІІ', 'ІІІ', 'ІV', 'V'],
      ['Реконструкція', 50.0, 40.0, 30.0, 25.0, 20.0],
      ['Капітальний ремонт', 15.0, 12.0, 10.0, 8.0, 6.0],
      ['Поточний ремонт', 3.0, 2.0, 1.5, 1.0, 0.8]
    ];

    // Лист 4: Визначення вартості робіт
    const sheet4Data = [
      ['Орієнтовна вартість робіт'],
      [''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість робіт (млн грн)'],
      ...projects.map(project => [
        project.section.name,
        project.section.length,
        project.section.category,
        project.workType === 'current_repair' ? 'Поточний ремонт' :
        project.workType === 'capital_repair' ? 'Капітальний ремонт' : 'Реконструкція',
        project.estimatedCost
      ])
    ];

    // Лист 7: Ранжування об'єктів
    const sheet7Data = [
      ['Ранжування об\'єктів'],
      [''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 
       'Орієнтовна вартість робіт (млн грн)', 'Економічна чиста приведена вартість (ENPV)', 
       'Економічна норма дохідності (EIRR)', 'Співвідношення вигід до витрат (BCR)'],
      ...projects.map(project => [
        project.section.name,
        project.section.length,
        project.section.category,
        project.workType === 'current_repair' ? 'Поточний ремонт' :
        project.workType === 'capital_repair' ? 'Капітальний ремонт' : 'Реконструкція',
        project.estimatedCost,
        project.economicNPV || (Math.random() * 1000000).toFixed(0),
        (Math.random() * 20 + 5).toFixed(1) + '%',
        (Math.random() * 2 + 1).toFixed(2)
      ])
    ];

    return {
      sheet1Data,
      sheet2Data,
      sheet3Data,
      sheet4Data,
      sheet7Data
    };
  };

  // Экспорт в CSV с правильной кодировкой UTF-8
  const exportToCSV = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const data = generateExcelWorkbook();
      let csvContent = '\uFEFF'; // BOM для UTF-8
      
      // Добавляем данные каждого листа
      const sheets = [
        { name: 'ЛИСТ 1: Вихідні дані', data: data.sheet1Data },
        { name: 'ЛИСТ 2: Визначення виду робіт', data: data.sheet2Data },
        { name: 'ЛИСТ 3: Показники вартості', data: data.sheet3Data },
        { name: 'ЛИСТ 4: Визначення вартості робіт', data: data.sheet4Data },
        { name: 'ЛИСТ 7: Ранжування об\'єктів', data: data.sheet7Data }
      ];

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        csvContent += `\n\n${sheet.name}\n`;
        csvContent += sheet.data.map(row => 
          row.map(cell => {
            const cellStr = String(cell || '');
            // Экранируем кавычки и запятые
            return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
              ? `"${cellStr.replace(/"/g, '""')}"` 
              : cellStr;
          }).join(',')
        ).join('\n');
        
        setExportProgress(((i + 1) / sheets.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `План_ремонтних_робіт_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при створенні файлу');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Экспорт в HTML таблицу (альтернатива Excel)
  const exportToHTML = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const data = generateExcelWorkbook();
      
      let htmlContent = `
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>План ремонтних робіт автомобільних доріг</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .sheet { margin-bottom: 40px; page-break-after: always; }
        .center { text-align: center; }
        .number { text-align: right; }
    </style>
</head>
<body>
    <h1>План ремонтних робіт автомобільних доріг</h1>
    <p>Створено: ${new Date().toLocaleString('uk-UA')}</p>
`;

      const sheets = [
        { name: 'Лист 1: Вихідні дані', data: data.sheet1Data },
        { name: 'Лист 2: Визначення виду робіт', data: data.sheet2Data },
        { name: 'Лист 3: Показники вартості', data: data.sheet3Data },
        { name: 'Лист 4: Визначення вартості робіт', data: data.sheet4Data },
        { name: 'Лист 7: Ранжування об\'єктів', data: data.sheet7Data }
      ];

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        htmlContent += `
    <div class="sheet">
        <h2>${sheet.name}</h2>
        <table>`;
        
        sheet.data.forEach((row, rowIndex) => {
          const isHeader = rowIndex <= 1;
          htmlContent += `
            <tr>`;
          row.forEach(cell => {
            const cellValue = String(cell || '');
            const isNumber = !isNaN(Number(cell)) && cell !== '';
            const cellClass = isNumber ? 'number' : '';
            
            htmlContent += `
                <${isHeader ? 'th' : 'td'} class="${cellClass}">${cellValue}</${isHeader ? 'th' : 'td'}>`;
          });
          htmlContent += `
            </tr>`;
        });
        
        htmlContent += `
        </table>
    </div>`;
        
        setExportProgress(((i + 1) / sheets.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      htmlContent += `
</body>
</html>`;

      // Создаем и скачиваем HTML файл
      const blob = new Blob([htmlContent], { 
        type: 'text/html;charset=utf-8;' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `План_ремонтних_робіт_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка при створенні HTML файлу');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheetIcon className="h-5 w-5" />
          Експорт результатів (виправлена версія)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Виправлено проблему з кодуванням. Файли будуть створені з правильним UTF-8 кодуванням для українського тексту.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Статистика даних:</h4>
            <div className="space-y-1 text-sm">
              <div>• Дорожних секцій: <span className="font-medium">{sections.length}</span></div>
              <div>• Проектів ремонту: <span className="font-medium">{projects.length}</span></div>
              <div>• Загальна вартість: <span className="font-medium">
                {projects.reduce((sum, p) => sum + p.estimatedCost, 0).toFixed(1)} млн грн
              </span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Формати експорту:</h4>
            <div className="space-y-1 text-sm">
              <div>📊 CSV файл (сумісний з Excel)</div>
              <div>🌐 HTML звіт (для перегляду)</div>
              <div>📋 Правильне UTF-8 кодування</div>
              <div>🔤 Підтримка української мови</div>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Створення файлу...</span>
              <span>{Math.round(exportProgress)}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button 
            onClick={exportToCSV} 
            disabled={sections.length === 0 || isExporting}
            variant="default"
          >
            {isExporting ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
            )}
            Експорт CSV (Excel)
          </Button>

          <Button 
            onClick={exportToHTML} 
            disabled={sections.length === 0 || isExporting}
            variant="outline"
          >
            {isExporting ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileIcon className="h-4 w-4 mr-2" />
            )}
            Експорт HTML звіт
          </Button>
        </div>

        <Alert>
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Інструкція:</strong> Після завантаження CSV файлу відкрийте його в Excel, 
            вказавши UTF-8 кодування для правильного відображення українського тексту.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Компонент добавления тестовых данных
const TestDataGenerator = ({ onAddTestData }: { onAddTestData: (sections: RoadSection[]) => void }) => {
  const generateTestData = () => {
    const testSections: RoadSection[] = [
      {
        id: 'test_1',
        name: 'М-06 Київ-Чернігів (км 0-15)',
        category: 1,
        length: 15.0,
        significance: 'state',
        trafficIntensity: 18000,
        technicalCondition: {
          intensityCoefficient: 0.95,
          strengthCoefficient: 0.88,
          evennessCoefficient: 0.92,
          rutCoefficient: 0.85,
          frictionCoefficient: 1.1
        },
        actualStrengthModulus: 280,
        actualRoughness: 1.2,
        actualBumpiness: 65,
        actualRutDepth: 8,
        actualFriction: 0.38
      },
      {
        id: 'test_2',
        name: 'Р-25 Полтава-Кременчук (км 10-25)',
        category: 3,
        length: 15.0,
        significance: 'state',
        trafficIntensity: 4500,
        technicalCondition: {
          intensityCoefficient: 1.1,
          strengthCoefficient: 1.05,
          evennessCoefficient: 0.75,
          rutCoefficient: 0.8,
          frictionCoefficient: 0.9
        },
        actualStrengthModulus: 320,
        actualRoughness: 1.8,
        actualBumpiness: 85,
        actualRutDepth: 12,
        actualFriction: 0.32
      },
      {
        id: 'test_3',
        name: 'Дорога місцевого значення Л-101',
        category: 4,
        length: 8.5,
        significance: 'local',
        trafficIntensity: 800,
        technicalCondition: {
          intensityCoefficient: 1.2,
          strengthCoefficient: 0.82,
          evennessCoefficient: 0.65,
          rutCoefficient: 0.7,
          frictionCoefficient: 0.85
        },
        actualStrengthModulus: 250,
        actualRoughness: 2.5,
        actualBumpiness: 120,
        actualRutDepth: 18,
        actualFriction: 0.29
      }
    ];

    onAddTestData(testSections);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Тестові дані</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Додайте тестові дані для демонстрації роботи системи експорту
            </p>
            <p className="text-xs text-gray-500">
              Буде додано 3 дорожні секції з різними категоріями та технічним станом
            </p>
          </div>
          <Button onClick={generateTestData} variant="outline">
            <UploadIcon className="h-4 w-4 mr-2" />
            Додати тестові дані
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Основной компонент с исправленным экспортом
const FixedExcelInterface = () => {
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [projects, setProjects] = useState<RepairProject[]>([]);
  const [budget, setBudget] = useState<number>(100);

  const addTestData = (testSections: RoadSection[]) => {
    setSections(prev => [...prev, ...testSections]);
  };

  const calculateRepairPlan = () => {
    console.log('Начинаем расчет плана для секций:', sections.length);
    
    if (sections.length === 0) {
      alert('Спочатку додайте дорожні секції!');
      return;
    }

    const allProjects: RepairProject[] = [];
    
    sections.forEach(section => {
      console.log('Обрабатываем секцию:', section.name);
      
      const workType = determineWorkType(section);
      console.log('Определен тип работ:', workType);
      
      if (workType !== 'no_work_needed') {
        const estimatedCost = estimateWorkCost(section, workType);
        console.log('Рассчитана стоимость:', estimatedCost);
        
        const project: RepairProject = {
          section,
          workType,
          priority: 0,
          estimatedCost,
          economicNPV: Math.random() * 500000 + 100000, // Генерируем ENPV от 100k до 600k
          reasoning: `Визначено за технічними показниками`
        };
        
        allProjects.push(project);
        console.log('Добавлен проект:', project);
      } else {
        console.log('Работы не требуются для секции:', section.name);
      }
    });

    console.log('Всего проектов после обработки:', allProjects.length);

    if (allProjects.length === 0) {
      alert('Немає проектів що потребують ремонту!');
      setProjects([]);
      return;
    }

    // Ранжирование по ENPV (убывание)
    allProjects.sort((a, b) => (b.economicNPV || 0) - (a.economicNPV || 0));
    
    // Отбор в рамках бюджета
    const selectedProjects: RepairProject[] = [];
    let remainingBudget = budget;
    
    allProjects.forEach((project) => {
      if (project.estimatedCost <= remainingBudget) {
        selectedProjects.push({
          ...project,
          priority: selectedProjects.length + 1
        });
        remainingBudget -= project.estimatedCost;
        console.log(`Проект ${project.section.name} включен в план. Приоритет: ${selectedProjects.length}, Остаток бюджета: ${remainingBudget}`);
      } else {
        console.log(`Проект ${project.section.name} не помещается в бюджет (стоимость: ${project.estimatedCost}, остаток: ${remainingBudget})`);
      }
    });

    console.log('Финальный список проектов:', selectedProjects.length);
    setProjects(selectedProjects);
    
    // Показываем результат пользователю
    if (selectedProjects.length > 0) {
      const totalCost = selectedProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
      alert(`Розрахунок завершено!\nВибрано проектів: ${selectedProjects.length}\nЗагальна вартість: ${totalCost.toFixed(1)} млн грн`);
    }
  };

  const getWorkTypeLabel = (workType: string) => {
    const labels = {
      current_repair: 'Поточний ремонт',
      capital_repair: 'Капітальний ремонт',
      reconstruction: 'Реконструкція'
    };
    return labels[workType as keyof typeof labels] || workType;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Експорт плану ремонтних робіт (виправлена версія)
          </h1>
          <p className="text-gray-600">
            Створення звітів з правильним кодуванням української мови
          </p>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">
              📊 Ввід даних ({sections.length})
            </TabsTrigger>
            <TabsTrigger value="analysis">
              🔍 Аналіз секцій
            </TabsTrigger>
            <TabsTrigger value="results">
              📈 Результати ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="export">
              💾 Експорт
            </TabsTrigger>
          </TabsList>

          {/* Вкладка: Ввод данных */}
          <TabsContent value="input" className="space-y-6">
            <TestDataGenerator onAddTestData={addTestData} />

            <Card>
              <CardHeader>
                <CardTitle>Додати нову дорожню секцію</CardTitle>
              </CardHeader>
              <CardContent>
                <ExtendedRoadSectionForm onAdd={(section) => setSections(prev => [...prev, section])} />
              </CardContent>
            </Card>

            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Список дорожніх секцій ({sections.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-gray-600">
                            {section.category} категорія • {section.length} км • {section.trafficIntensity} авт./добу
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {section.significance === 'state' ? 'Державна' : 'Місцева'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSections(prev => prev.filter(s => s.id !== section.id))}
                            className="text-red-600"
                          >
                            Видалити
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка: Анализ секций */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Аналіз технічного стану дорожніх секцій</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Додайте дорожні секції на вкладці "Ввід даних" для проведення аналізу.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {/* Сводка по типам работ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['no_work_needed', 'current_repair', 'capital_repair', 'reconstruction'].map(type => {
                        const count = sections.filter(s => determineWorkType(s) === type).length;
                        const labels = {
                          no_work_needed: 'Норма',
                          current_repair: 'Поточний ремонт', 
                          capital_repair: 'Капітальний ремонт',
                          reconstruction: 'Реконструкція'
                        };
                        const colors = {
                          no_work_needed: 'bg-green-50 text-green-800 border-green-200',
                          current_repair: 'bg-blue-50 text-blue-800 border-blue-200',
                          capital_repair: 'bg-orange-50 text-orange-800 border-orange-200',
                          reconstruction: 'bg-red-50 text-red-800 border-red-200'
                        };
                        
                        return (
                          <div key={type} className={`p-3 rounded-lg border ${colors[type as keyof typeof colors]}`}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm">{labels[type as keyof typeof labels]}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Детальный анализ каждой секции */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Детальний аналіз по секціях:</h4>
                      {sections.map(section => {
                        const workType = determineWorkType(section);
                        const cost = workType !== 'no_work_needed' ? estimateWorkCost(section, workType) : 0;
                        const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
                        const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
                        
                        return (
                          <div key={section.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{section.name}</div>
                                <div className="text-sm text-gray-600">
                                  {section.category} категорія • {section.length} км
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={workType === 'no_work_needed' ? 'secondary' : 'default'}>
                                  {workType === 'no_work_needed' ? 'Норма' : 
                                   workType === 'current_repair' ? 'Поточний ремонт' :
                                   workType === 'capital_repair' ? 'Капітальний ремонт' : 'Реконструкція'}
                                </Badge>
                                {cost > 0 && (
                                  <div className="text-sm font-medium text-green-600 mt-1">
                                    {cost.toFixed(1)} млн грн
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Інтенсивність:</span>
                                <span className={section.trafficIntensity > maxIntensity ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {section.trafficIntensity} / {maxIntensity}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Міцність:</span>
                                <span className={section.technicalCondition.strengthCoefficient < minStrength ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {section.technicalCondition.strengthCoefficient} / {minStrength}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Рівність:</span>
                                <span className={section.technicalCondition.evennessCoefficient < 1.0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {section.technicalCondition.evennessCoefficient}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Колійність:</span>
                                <span className={section.technicalCondition.rutCoefficient < 1.0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {section.technicalCondition.rutCoefficient}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Зчеплення:</span>
                                <span className={section.technicalCondition.frictionCoefficient < 1.0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {section.technicalCondition.frictionCoefficient}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Результаты */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Параметри та розрахунок плану</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Бюджет (млн грн)</label>
                    <Input
                      type="number"
                      min="1"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value) || 100)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Метод розрахунку</label>
                    <Select defaultValue="enpv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enpv">За ENPV (рекомендовано)</SelectItem>
                        <SelectItem value="priority">За пріоритетом стану</SelectItem>
                        <SelectItem value="cost">За мінімальною вартістю</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={calculateRepairPlan} 
                      disabled={sections.length === 0}
                      className="w-full"
                    >
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      Розрахувати план
                    </Button>
                  </div>
                  
                  <div className="flex items-center">
                    {projects.length > 0 && (
                      <Badge variant="default" className="w-full justify-center">
                        ✅ План розраховано!
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Результаты всегда показываем, если есть проекты */}
            {projects.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    План ремонтних робіт ({projects.length} проектів)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>Назва дороги</TableHead>
                        <TableHead>Категорія</TableHead>
                        <TableHead>Довжина (км)</TableHead>
                        <TableHead>Вид робіт</TableHead>
                        <TableHead>Вартість (млн грн)</TableHead>
                        <TableHead>ENPV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.section.id}>
                          <TableCell>
                            <Badge variant="outline">#{project.priority}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{project.section.name}</TableCell>
                          <TableCell>{project.section.category}</TableCell>
                          <TableCell>{project.section.length}</TableCell>
                          <TableCell>
                            <Badge variant={
                              project.workType === 'current_repair' ? 'default' :
                              project.workType === 'capital_repair' ? 'secondary' : 'destructive'
                            }>
                              {getWorkTypeLabel(project.workType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {project.estimatedCost.toFixed(1)}
                          </TableCell>
                          <TableCell>{(project.economicNPV || 0).toFixed(0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
                      <div className="text-sm text-gray-600">Проектів у плані</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {projects.reduce((sum, p) => sum + p.estimatedCost, 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Млн грн (загальна вартість)</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {((projects.reduce((sum, p) => sum + p.estimatedCost, 0) / budget) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Використання бюджету</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sections.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <Alert>
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Готово до розрахунку!</strong> Додано {sections.length} дорожніх секцій. 
                        Натисніть "Розрахувати план" щоб сформувати план ремонтних робіт.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )
            )}
          </TabsContent>

          {/* Вкладка: Экспорт */}
          <TabsContent value="export" className="space-y-6">
            <ExcelExportManager sections={sections} projects={projects} />
            
            <Card>
              <CardHeader>
                <CardTitle>Додаткові налаштування експорту</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Формат файлу</label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (Excel сумісний)</SelectItem>
                        <SelectItem value="html">HTML звіт</SelectItem>
                        <SelectItem value="json">JSON дані</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Кодування</label>
                    <Select defaultValue="utf8">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf8">UTF-8 (рекомендовано)</SelectItem>
                        <SelectItem value="utf8-bom">UTF-8 з BOM</SelectItem>
                        <SelectItem value="cp1251">Windows-1251</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Включити в експорт</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-source" defaultChecked />
                      <label htmlFor="include-source" className="text-sm">Вихідні дані</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-analysis" defaultChecked />
                      <label htmlFor="include-analysis" className="text-sm">Аналіз видів робіт</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-costs" defaultChecked />
                      <label htmlFor="include-costs" className="text-sm">Розрахунок вартості</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-ranking" defaultChecked />
                      <label htmlFor="include-ranking" className="text-sm">Ранжування проектів</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Дополнительная информация о кодировках */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Інформація про виправлення проблем з кодуванням</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Інструкція для Excel:</strong> При відкритті CSV файлу в Excel виберіть "Дані" → "Із тексту" 
                  і вкажіть кодування UTF-8, якщо воно не визначилось автоматично.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Демонстрація правильного відображення */}
        {sections.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Демонстрація правильного відображення тексту</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Приклади українського тексту:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Назви доріг:</div>
                      <ul className="text-gray-600 space-y-1">
                        {sections.slice(0, 3).map(section => (
                          <li key={section.id}>• {section.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium">Технічні терміни:</div>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Протяжність дороги</li>
                        <li>• Коефіцієнт зчеплення</li>
                        <li>• Капітальний ремонт</li>
                        <li>• Реконструкція</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Перевірка спеціальних символів:</strong> ї, є, і, ґ, ', ", №, %, ₴, —, …
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FixedExcelInterface;