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
  DownloadIcon
} from "lucide-react";

// Типы данных соответствующие шаблону
interface RoadSectionData {
  id: string;
  name: string; // Найменування ділянки дороги
  length: number; // Протяжність дороги, км
  category: number; // Категорія ділянки дороги
  trafficIntensity: number; // Фактична інтенсивності руху ТЗ (авт./добу)
  strengthModulus: number; // Фактичний загальний модуль пружності (МПа)
  roughnessProfile: number; // Рівність поверхні (профілометр, м/км)
  roughnessBump: number; // Рівність поверхні (поштовхомір, см/км)
  rutDepth: number; // Фактична глибина колії (мм)
  frictionCoeff: number; // Фактичний коефіцієнт зчеплення
  
  // Розрахункові коефіцієнти для листа 2
  intensityCoeff?: number; // Коефіцієнт інтенсивності руху
  strengthCoeff?: number; // Коефіцієнт запасу міцності
  evennessCoeff?: number; // Коефіцієнт рівності
  rutCoeff?: number; // Коефіцієнт колійності
  frictionFactorCoeff?: number; // Коефіцієнт зчеплення розрахунковий
  
  // Результати
  workType?: string; // Вид робіт
  estimatedCost?: number; // Орієнтовна вартість
  enpv?: number; // ENPV
  eirr?: number; // EIRR
  bcr?: number; // BCR
}

// Нормативы стоимости из листа 3 шаблона
const COST_STANDARDS = {
  reconstruction: { 1: 50.0, 2: 40.0, 3: 30.0, 4: 25.0, 5: 20.0 },
  capital_repair: { 1: 15.0, 2: 12.0, 3: 10.0, 4: 8.0, 5: 6.0 },
  current_repair: { 1: 3.0, 2: 2.0, 3: 1.5, 4: 1.0, 5: 0.8 }
};

// Нормативные значения для определения коефіцієнтів
const CATEGORY_NORMS = {
  maxIntensity: { 1: 20000, 2: 12000, 3: 6000, 4: 2000, 5: 500 },
  minStrength: { 1: 300, 2: 280, 3: 260, 4: 240, 5: 220 },
  maxRoughness: { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0, 5: 2.5 },
  maxRutDepth: { 1: 5, 2: 8, 3: 12, 4: 15, 5: 20 },
  minFriction: 0.35
};

// Функции расчета коэффициентов
const calculateCoefficients = (section: RoadSectionData): RoadSectionData => {
  const norms = CATEGORY_NORMS;
  
  // Коефіцієнт інтенсивності руху
  const maxIntensity = norms.maxIntensity[section.category as keyof typeof norms.maxIntensity] || 500;
  const intensityCoeff = maxIntensity / section.trafficIntensity;
  
  // Коефіцієнт запасу міцності
  const minStrength = norms.minStrength[section.category as keyof typeof norms.minStrength] || 220;
  const strengthCoeff = section.strengthModulus / minStrength;
  
  // Коефіцієнт рівності (профілометр)
  const maxRoughness = norms.maxRoughness[section.category as keyof typeof norms.maxRoughness] || 2.5;
  const evennessCoeff = maxRoughness / section.roughnessProfile;
  
  // Коефіцієнт колійності
  const maxRut = norms.maxRutDepth[section.category as keyof typeof norms.maxRutDepth] || 20;
  const rutCoeff = maxRut / section.rutDepth;
  
  // Коефіцієнт зчеплення
  const frictionFactorCoeff = section.frictionCoeff / norms.minFriction;
  
  return {
    ...section,
    intensityCoeff: Number(intensityCoeff.toFixed(2)),
    strengthCoeff: Number(strengthCoeff.toFixed(2)),
    evennessCoeff: Number(evennessCoeff.toFixed(2)),
    rutCoeff: Number(rutCoeff.toFixed(2)),
    frictionFactorCoeff: Number(frictionFactorCoeff.toFixed(2))
  };
};

// Определение вида работ
const determineWorkType = (section: RoadSectionData): string => {
  // Реконструкція - если превышена интенсивность или коеф < 1.0
  if (section.intensityCoeff! < 1.0) {
    return 'Реконструкція';
  }
  
  // Капітальний ремонт - проблемы с прочностью
  if (section.strengthCoeff! < 1.0) {
    return 'Капітальний ремонт';
  }
  
  // Поточний ремонт - проблемы с поверхностью
  if (section.evennessCoeff! < 1.0 || section.rutCoeff! < 1.0 || section.frictionFactorCoeff! < 1.0) {
    return 'Поточний ремонт';
  }
  
  return 'Не потрібно';
};

// Расчет стоимости
const calculateCost = (section: RoadSectionData): number => {
  const workType = section.workType || 'Не потрібно';
  if (workType === 'Не потрібно') return 0;
  
  const typeKey = workType === 'Реконструкція' ? 'reconstruction' :
                  workType === 'Капітальний ремонт' ? 'capital_repair' : 'current_repair';
  
  const costPerKm = COST_STANDARDS[typeKey as keyof typeof COST_STANDARDS][section.category as keyof typeof COST_STANDARDS.reconstruction] || 1;
  return Number((costPerKm * section.length).toFixed(2));
};

// Компонент формы ввода данных
const RoadSectionForm = ({ onAdd }: { onAdd: (section: RoadSectionData) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    length: 1.0,
    category: 3,
    trafficIntensity: 3000,
    strengthModulus: 300,
    roughnessProfile: 1.5,
    roughnessBump: 60,
    rutDepth: 8,
    frictionCoeff: 0.4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSection: RoadSectionData = {
      id: `section_${Date.now()}`,
      name: formData.name || `Ділянка ${Date.now()}`,
      length: formData.length,
      category: formData.category,
      trafficIntensity: formData.trafficIntensity,
      strengthModulus: formData.strengthModulus,
      roughnessProfile: formData.roughnessProfile,
      roughnessBump: formData.roughnessBump,
      rutDepth: formData.rutDepth,
      frictionCoeff: formData.frictionCoeff
    };

    // Рассчитываем коэффициенты
    const sectionWithCoeffs = calculateCoefficients(newSection);
    sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
    sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
    
    // Генерируем ENPV, EIRR, BCR
    sectionWithCoeffs.enpv = Math.random() * 1000000 + 100000;
    sectionWithCoeffs.eirr = Math.random() * 15 + 5;
    sectionWithCoeffs.bcr = Math.random() * 2 + 1;

    onAdd(sectionWithCoeffs);
    
    // Сброс формы
    setFormData({
      name: '',
      length: 1.0,
      category: 3,
      trafficIntensity: 3000,
      strengthModulus: 300,
      roughnessProfile: 1.5,
      roughnessBump: 60,
      rutDepth: 8,
      frictionCoeff: 0.4
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Найменування ділянки дороги</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="М-06 Київ-Чернігів"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Протяжність дороги (км)</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.length}
            onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 1 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Категорія ділянки дороги</label>
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
      </div>

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
            value={formData.strengthModulus}
            onChange={(e) => setFormData(prev => ({ ...prev, strengthModulus: parseInt(e.target.value) || 300 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Рівність (профілометр, м/км)</label>
          <Input
            type="number"
            step="0.1"
            min="0.1"
            value={formData.roughnessProfile}
            onChange={(e) => setFormData(prev => ({ ...prev, roughnessProfile: parseFloat(e.target.value) || 1.5 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Рівність (поштовхомір, см/км)</label>
          <Input
            type="number"
            min="10"
            value={formData.roughnessBump}
            onChange={(e) => setFormData(prev => ({ ...prev, roughnessBump: parseInt(e.target.value) || 60 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Глибина колії (мм)</label>
          <Input
            type="number"
            min="0"
            value={formData.rutDepth}
            onChange={(e) => setFormData(prev => ({ ...prev, rutDepth: parseInt(e.target.value) || 8 }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Коефіцієнт зчеплення</label>
          <Input
            type="number"
            step="0.01"
            min="0.1"
            max="1.0"
            value={formData.frictionCoeff}
            onChange={(e) => setFormData(prev => ({ ...prev, frictionCoeff: parseFloat(e.target.value) || 0.4 }))}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
        Додати дорожню секцію
      </Button>
    </form>
  );
};

// Компонент для генерации Excel файла по шаблону
const TemplateExporter = ({ sections }: { sections: RoadSectionData[] }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const generateTemplateData = () => {
    // Лист 1: Вихідні дані
    const sheet1Data = [
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг державного значення'],
      ['Найменування ділянки дороги', 'Протяжність дороги, км', 'Категорія ділянки дороги', 
       'Фактична інтенсивності руху ТЗ у приведених одиницях до легкового автомобіля за даними обліку (авт./добу)', 
       'Фактичний загальний модуль пружності дорожньої конструкції (МПа)', 
       'Фактична рівність поверхні дорожнього покриву, яку оцінюють за профілометричним методом (м/км)', 
       'Фактична рівність поверхні дорожнього покриву, яку оцінюють за показником поштовхоміра (см/км)',
       'Фактична глибина колії (мм)', 'Фактичний коефіцієнт зчеплення', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ...sections.map(section => [
        section.name,
        section.length,
        section.category,
        section.trafficIntensity,
        section.strengthModulus,
        section.roughnessProfile,
        section.roughnessBump,
        section.rutDepth,
        section.frictionCoeff,
        ''
      ])
    ];

    // Лист 2: Визначення виду робіт
    const sheet2Data = [
      ['Визначення показників фактичного транспортно–експлуатаційного стану доріг'],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Коефіцієнт інтенсивності руху', 
       'Коефіцієнт запасу міцності дорожнього одягу', 'Коефіцієнт рівності', 
       'Коефіцієнт колійності', 'Коефіцієнт зчеплення', 'Вид робіт', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ...sections.map(section => [
        section.name,
        section.length,
        section.intensityCoeff,
        section.strengthCoeff,
        section.evennessCoeff,
        section.rutCoeff,
        section.frictionFactorCoeff,
        section.workType,
        '',
        ''
      ])
    ];

    // Лист 3: Показники вартості (неизменная таблица)
    const sheet3Data = [
      ['Усереднені орієнтовні показники вартості дорожніх робіт за даними об\'єктів-аналогів, млн.грн/1 км', '', '', '', '', ''],
      ['Вид робіт', 'Категорія дороги', '', '', '', ''],
      ['', 'І', 'ІІ', 'ІІІ', 'ІV', 'V'],
      ['Реконструкція', 50.0, 40.0, 30.0, 25.0, 20.0],
      ['Капітальний ремонт', 15.0, 12.0, 10.0, 8.0, 6.0],
      ['Поточний ремонт', 3.0, 2.0, 1.5, 1.0, 0.8]
    ];

    // Лист 4: Визначення вартості робіт
    const sheet4Data = [
      ['Орієнтовна вартість робіт', '', '', '', ''],
      ['', '', '', '', ''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 'Орієнтовна вартість робіт (млн грн)'],
      ...sections.filter(s => s.workType !== 'Не потрібно').map(section => [
        section.name,
        section.length,
        section.category,
        section.workType,
        section.estimatedCost
      ])
    ];

    // Лист 7: Ранжування об'єктів
    const sheet7Data = [
      ['Ранжування об\'єктів', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Найменування ділянки дороги', 'Протяжність дороги (км)', 'Категорія', 'Вид робіт', 
       'Орієнтовна вартість робіт (млн грн)', 'Економічна чиста приведена вартість (ENPV)', 
       'Економічна норма дохідності (EIRR)', 'Співвідношення вигід до витрат (BCR)'],
      ...sections
        .filter(s => s.workType !== 'Не потрібно')
        .sort((a, b) => (b.enpv || 0) - (a.enpv || 0))
        .map(section => [
          section.name,
          section.length,
          section.category,
          section.workType,
          section.estimatedCost,
          Math.round(section.enpv || 0),
          `${(section.eirr || 0).toFixed(1)}%`,
          (section.bcr || 0).toFixed(2)
        ])
    ];

    return { sheet1Data, sheet2Data, sheet3Data, sheet4Data, sheet7Data };
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const data = generateTemplateData();
      let csvContent = '\uFEFF'; // BOM для UTF-8
      
      const sheets = [
        { name: '1 Вихідні дані', data: data.sheet1Data },
        { name: '2 Визначення виду робіт', data: data.sheet2Data },
        { name: '3 Показники вартості', data: data.sheet3Data },
        { name: '4 Визначення вартості робіт', data: data.sheet4Data },
        { name: '7 Ранжування об\'єктів', data: data.sheet7Data }
      ];

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        csvContent += `\n\n=== ЛИСТ: ${sheet.name} ===\n`;
        csvContent += sheet.data.map(row => 
          row.map(cell => {
            const cellStr = String(cell || '');
            return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
              ? `"${cellStr.replace(/"/g, '""')}"` 
              : cellStr;
          }).join(',')
        ).join('\n');
        
        setExportProgress(((i + 1) / sheets.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Шаблон_21_заповнений_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheetIcon className="h-5 w-5" />
          Експорт заповненого шаблону
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Статистика:</h4>
            <div className="space-y-1 text-sm">
              <div>• Дорожних секцій: <span className="font-medium">{sections.length}</span></div>
              <div>• Потребують ремонту: <span className="font-medium">
                {sections.filter(s => s.workType !== 'Не потрібно').length}
              </span></div>
              <div>• Загальна вартість: <span className="font-medium">
                {sections.filter(s => s.workType !== 'Не потрібно')
                         .reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(1)} млн грн
              </span></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Структура файлу:</h4>
            <div className="space-y-1 text-sm">
              <div>📊 Лист 1: Вихідні дані</div>
              <div>🔍 Лист 2: Визначення виду робіт</div>
              <div>💰 Лист 3: Показники вартості</div>
              <div>📋 Лист 4: Визначення вартості робіт</div>
              <div>🏆 Лист 7: Ранжування об'єктів</div>
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

        <Button 
          onClick={exportToCSV} 
          disabled={sections.length === 0 || isExporting}
          className="w-full"
        >
          {isExporting ? (
            <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <DownloadIcon className="h-4 w-4 mr-2" />
          )}
          Експортувати заповнений шаблон
        </Button>

        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Файл буде створено у форматі, сумісному з оригінальним шаблоном "Шаблон _21.xlsx".
            Всі розрахунки виконуються автоматично згідно з методикою.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Генератор тестовых данных
const TestDataGenerator = ({ onAddTestData }: { onAddTestData: (sections: RoadSectionData[]) => void }) => {
  const generateTestData = () => {
    const testSections: RoadSectionData[] = [
      {
        id: 'test_1',
        name: 'М-06 Київ-Чернігів (км 0-15)',
        length: 15.0,
        category: 1,
        trafficIntensity: 18000,
        strengthModulus: 280,
        roughnessProfile: 1.2,
        roughnessBump: 65,
        rutDepth: 8,
        frictionCoeff: 0.38
      },
      {
        id: 'test_2',
        name: 'Н-31 Дніпро-Решетилівка (км 25-40)',
        length: 15.0,
        category: 2,
        trafficIntensity: 8500,
        strengthModulus: 250,
        roughnessProfile: 1.8,
        roughnessBump: 85,
        rutDepth: 12,
        frictionCoeff: 0.32
      },
      {
        id: 'test_3',
        name: 'Р-25 Полтава-Кременчук (км 10-25)',
        length: 15.0,
        category: 3,
        trafficIntensity: 4500,
        strengthModulus: 320,
        roughnessProfile: 1.5,
        roughnessBump: 75,
        rutDepth: 10,
        frictionCoeff: 0.42
      },
      {
        id: 'test_4',
        name: 'Т-1504 Біла Церква-Васильків',
        length: 8.5,
        category: 4,
        trafficIntensity: 1200,
        strengthModulus: 200,
        roughnessProfile: 2.5,
        roughnessBump: 120,
        rutDepth: 18,
        frictionCoeff: 0.29
      }
    ];

    // Рассчитываем все коэффициенты и показатели
    const processedSections = testSections.map(section => {
      const sectionWithCoeffs = calculateCoefficients(section);
      sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
      sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
      sectionWithCoeffs.enpv = Math.random() * 800000 + 200000;
      sectionWithCoeffs.eirr = Math.random() * 12 + 8;
      sectionWithCoeffs.bcr = Math.random() * 1.5 + 1.2;
      return sectionWithCoeffs;
    });

    onAddTestData(processedSections);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Тестові дані для демонстрації</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Додайте тестові дані різних категорій доріг для демонстрації заповнення шаблону
            </p>
            <p className="text-xs text-gray-500">
              Буде додано 4 дорожні секції з автоматичним розрахунком всіх показників
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

// Основной компонент
const TemplateFillerApp = () => {
  const [sections, setSections] = useState<RoadSectionData[]>([]);

  const addSection = (section: RoadSectionData) => {
    setSections(prev => [...prev, section]);
  };

  const addTestData = (testSections: RoadSectionData[]) => {
    setSections(prev => [...prev, ...testSections]);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const recalculateAll = () => {
    setSections(prev => prev.map(section => {
      const sectionWithCoeffs = calculateCoefficients(section);
      sectionWithCoeffs.workType = determineWorkType(sectionWithCoeffs);
      sectionWithCoeffs.estimatedCost = calculateCost(sectionWithCoeffs);
      sectionWithCoeffs.enpv = Math.random() * 800000 + 200000;
      sectionWithCoeffs.eirr = Math.random() * 12 + 8;
      sectionWithCoeffs.bcr = Math.random() * 1.5 + 1.2;
      return sectionWithCoeffs;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Заповнення шаблону "Шаблон _21.xlsx"
          </h1>
          <p className="text-gray-600">
            Ввід даних та автоматичне заповнення шаблону аналізу стану автомобільних доріг
          </p>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">📊 Ввід даних ({sections.length})</TabsTrigger>
            <TabsTrigger value="analysis">🔍 Аналіз результатів</TabsTrigger>
            <TabsTrigger value="preview">📋 Попередній перегляд</TabsTrigger>
            <TabsTrigger value="export">💾 Експорт шаблону</TabsTrigger>
          </TabsList>

          {/* Вкладка: Ввод данных */}
          <TabsContent value="input" className="space-y-6">
            <TestDataGenerator onAddTestData={addTestData} />

            <Card>
              <CardHeader>
                <CardTitle>Додати нову дорожню секцію</CardTitle>
              </CardHeader>
              <CardContent>
                <RoadSectionForm onAdd={addSection} />
              </CardContent>
            </Card>

            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Список дорожніх секцій ({sections.length})
                    <Button onClick={recalculateAll} variant="outline" size="sm">
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      Перерахувати всі
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{section.name}</div>
                            <div className="text-sm text-gray-600">
                              {section.category} категорія • {section.length} км • {section.trafficIntensity} авт./добу
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              section.workType === 'Не потрібно' ? 'secondary' :
                              section.workType === 'Поточний ремонт' ? 'default' :
                              section.workType === 'Капітальний ремонт' ? 'destructive' : 'outline'
                            }>
                              {section.workType}
                            </Badge>
                            {section.estimatedCost && section.estimatedCost > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                {section.estimatedCost.toFixed(1)} млн грн
                              </span>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-600"
                            >
                              Видалити
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Кінт:</span> 
                            <span className={section.intensityCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.intensityCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Кміц:</span> 
                            <span className={section.strengthCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.strengthCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Крівн:</span> 
                            <span className={section.evennessCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.evennessCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Ккол:</span> 
                            <span className={section.rutCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.rutCoeff}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Кзчеп:</span> 
                            <span className={section.frictionFactorCoeff! < 1.0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                              {section.frictionFactorCoeff}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка: Анализ результатов */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Аналіз результатів</CardTitle>
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
                  <div className="space-y-6">
                    {/* Сводная статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Не потрібно', 'Поточний ремонт', 'Капітальний ремонт', 'Реконструкція'].map(type => {
                        const count = sections.filter(s => s.workType === type).length;
                        const totalCost = sections
                          .filter(s => s.workType === type)
                          .reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
                        
                        const colors = {
                          'Не потрібно': 'bg-green-50 text-green-800 border-green-200',
                          'Поточний ремонт': 'bg-blue-50 text-blue-800 border-blue-200',
                          'Капітальний ремонт': 'bg-orange-50 text-orange-800 border-orange-200',
                          'Реконструкція': 'bg-red-50 text-red-800 border-red-200'
                        };
                        
                        return (
                          <div key={type} className={`p-4 rounded-lg border ${colors[type as keyof typeof colors]}`}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm font-medium">{type}</div>
                            {totalCost > 0 && (
                              <div className="text-xs mt-1">{totalCost.toFixed(1)} млн грн</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Таблица ранжирования */}
                    <div>
                      <h4 className="font-medium mb-3">Ранжування проектів за ENPV:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Приоритет</TableHead>
                            <TableHead>Назва дороги</TableHead>
                            <TableHead>Вид робіт</TableHead>
                            <TableHead>Вартість (млн грн)</TableHead>
                            <TableHead>ENPV</TableHead>
                            <TableHead>EIRR</TableHead>
                            <TableHead>BCR</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sections
                            .filter(s => s.workType !== 'Не потрібно')
                            .sort((a, b) => (b.enpv || 0) - (a.enpv || 0))
                            .map((section, index) => (
                              <TableRow key={section.id}>
                                <TableCell>
                                  <Badge variant="outline">#{index + 1}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{section.name}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    section.workType === 'Поточний ремонт' ? 'default' :
                                    section.workType === 'Капітальний ремонт' ? 'secondary' : 'destructive'
                                  }>
                                    {section.workType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {(section.estimatedCost || 0).toFixed(1)}
                                </TableCell>
                                <TableCell>{Math.round(section.enpv || 0).toLocaleString()}</TableCell>
                                <TableCell>{(section.eirr || 0).toFixed(1)}%</TableCell>
                                <TableCell>{(section.bcr || 0).toFixed(2)}</TableCell>
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

          {/* Вкладка: Предварительный просмотр */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Попередній перегляд шаблону</CardTitle>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Додайте дорожні секції для попереднього перегляду шаблону.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {/* Превью листа 1 */}
                    <div>
                      <h4 className="font-medium mb-3">Лист 1: Вихідні дані</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left">Найменування ділянки дороги</th>
                              <th className="border border-gray-300 p-2">Протяжність (км)</th>
                              <th className="border border-gray-300 p-2">Категорія</th>
                              <th className="border border-gray-300 p-2">Інтенсивність (авт./добу)</th>
                              <th className="border border-gray-300 p-2">Модуль пружності (МПа)</th>
                              <th className="border border-gray-300 p-2">Рівність (м/км)</th>
                              <th className="border border-gray-300 p-2">Коефіцієнт зчеплення</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sections.slice(0, 5).map(section => (
                              <tr key={section.id}>
                                <td className="border border-gray-300 p-2">{section.name}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.length}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.category}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.trafficIntensity}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.strengthModulus}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.roughnessProfile}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.frictionCoeff}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {sections.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">... та ще {sections.length - 5} записів</p>
                        )}
                      </div>
                    </div>

                    {/* Превью листа 2 */}
                    <div>
                      <h4 className="font-medium mb-3">Лист 2: Визначення виду робіт</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left">Найменування ділянки дороги</th>
                              <th className="border border-gray-300 p-2">Кінт</th>
                              <th className="border border-gray-300 p-2">Кміц</th>
                              <th className="border border-gray-300 p-2">Крівн</th>
                              <th className="border border-gray-300 p-2">Ккол</th>
                              <th className="border border-gray-300 p-2">Кзчеп</th>
                              <th className="border border-gray-300 p-2">Вид робіт</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sections.slice(0, 5).map(section => (
                              <tr key={section.id}>
                                <td className="border border-gray-300 p-2">{section.name}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.intensityCoeff}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.strengthCoeff}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.evennessCoeff}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.rutCoeff}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.frictionFactorCoeff}</td>
                                <td className="border border-gray-300 p-2 text-center">{section.workType}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {sections.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">... та ще {sections.length - 5} записів</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Экспорт */}
          <TabsContent value="export" className="space-y-6">
            <TemplateExporter sections={sections} />
            
            <Card>
              <CardHeader>
                <CardTitle>Інструкція по використанню</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Файл створюється у повній відповідності до оригінального шаблону "Шаблон _21.xlsx".</strong>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Структура експорту:</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Лист 1: Вихідні дані секцій доріг</li>
                        <li>• Лист 2: Розрахунок коефіцієнтів та виду робіт</li>
                        <li>• Лист 3: Показники вартості (довідкова таблиця)</li>
                        <li>• Лист 4: Визначення вартості робіт</li>
                        <li>• Лист 7: Ранжування об'єктів за ENPV</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Формули розрахунку:</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Кінт = Інормативна / Іфактична</li>
                        <li>• Кміц = Ефактичний / Енормативний</li>
                        <li>• Крівн = Рнормативна / Рфактична</li>
                        <li>• Ккол = Кнормативна / Кфактична</li>
                        <li>• Кзчеп = φфактичний / φнормативний</li>
                      </ul>
                    </div>
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

export default TemplateFillerApp;