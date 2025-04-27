import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Stack
} from '@mui/material';
import { DeleteOutline, Info as InfoIcon, Add as AddIcon, BarChart as BarChartIcon } from '@mui/icons-material';
import { 
  LineChart, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Line,
  Bar
} from 'recharts';

// Типы данных
type RoadCategory = 'I' | 'II' | 'III' | 'IV' | 'V';
type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';
type WorkTypeId = 'reconstruction' | 'capitalRepair' | 'currentRepair' | 'maintenance' | 'none';

interface RoadSection {
  id: string;
  name: string;
  length: number; // км
  category: RoadCategory;
  roughnessIndex: number; // см/км
  trafficIntensity: number; // авт/сутки
  strengthCoefficient: number; // коэффициент прочности
  evenessCoefficient: number; // коэффициент ровности
  rutCoefficient: number; // коэффициент колейности
  gripCoefficient: number; // коэффициент сцепления
  repairCost: number; // тыс. грн
  exploitationIndex?: number; // индекс эксплуатационного состояния (1-10)
  enpv?: number; // экономическая чистая приведенная стоимость
  recommendedWorkType?: string; // рекомендуемый вид работ
}

interface WorkType {
  id: WorkTypeId;
  name: string;
  description: string;
}

interface AnalyticsData {
  name: string;
  enpv: number;
  budget: number;
  length: number;
}

const DEFAULT_DISCOUNT_RATE = 0.05; // 5% социальная ставка дисконтирования

// Справочные данные согласно документу

// Таблица 10.1 - Значения средней скорости движения разных типов авто
const averageSpeedByCategory: Record<RoadCategory, {light: number, freight: number, bus: number}> = {
  'I': {light: 85.0, freight: 65.0, bus: 73.4}, // 6 полос
  'II': {light: 76.4, freight: 62.6, bus: 66.0},
  'III': {light: 70.6, freight: 57.8, bus: 61.0},
  'IV': {light: 70.4, freight: 57.1, bus: 61.0},
  'V': {light: 65.0, freight: 52.0, bus: 56.0} // предполагаемые значения
};

// Таблица 11.2 - Определение типа ремонта по индексу эксплуатационного состояния
const getRepairTypeByIndex = (index: number): string => {
  if (index >= 8) return "Ремонт не потрібен";
  if (index >= 5 && index <= 7) return "Необхідний поточний ремонт";
  return "Необхідний капітальний ремонт";
};

// Основные виды работ
const workTypes: WorkType[] = [
  { 
    id: 'reconstruction', 
    name: 'Реконструкція', 
    description: 'Комплекс робіт, спрямованих на підвищення транспортно-експлуатаційних характеристик автомобільних доріг'
  },
  { 
    id: 'capitalRepair', 
    name: 'Капітальний ремонт', 
    description: 'Комплекс робіт із заміни або відновлення конструктивних елементів дороги'
  },
  { 
    id: 'currentRepair', 
    name: 'Поточний ремонт', 
    description: 'Комплекс робіт з поліпшення транспортно-експлуатаційного стану дороги'
  },
  { 
    id: 'maintenance', 
    name: 'Експлуатаційне утримання', 
    description: 'Комплекс робіт з догляду за дорогою, дорожніми спорудами та смугою відведення'
  },
];

// Компонент для формулы
const FormulaDisplay = ({ formula, description }: { formula: string, description: string }) => {
  return (
    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>
      <Typography 
        variant="body1" 
        component="div" 
        sx={{ 
          fontFamily: 'Cambria Math, Georgia, serif', 
          textAlign: 'center',
          fontSize: '1.2rem',
          my: 1
        }}
      >
        {formula}
      </Typography>
    </Box>
  );
};

// Компонент для отображения справочных данных и формул из методики
const ReferenceSection: React.FC = () => {
  return (
    <Card elevation={3} sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Формули та довідкові дані з методики
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Таблиця 10.1 - Значення середньої швидкості руху різних типів авто
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Категорія дороги</TableCell>
                <TableCell>Кількість смуг</TableCell>
                <TableCell colSpan={3} align="center">Середня швидкість, км/год</TableCell>
              </TableRow>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell>Легкові</TableCell>
                <TableCell>Вантажні</TableCell>
                <TableCell>Автобуси</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>I</TableCell>
                <TableCell>6</TableCell>
                <TableCell>85.0</TableCell>
                <TableCell>65.0</TableCell>
                <TableCell>73.4</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>I</TableCell>
                <TableCell>4</TableCell>
                <TableCell>83.4</TableCell>
                <TableCell>64.7</TableCell>
                <TableCell>68.3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>II</TableCell>
                <TableCell>2</TableCell>
                <TableCell>76.4</TableCell>
                <TableCell>62.6</TableCell>
                <TableCell>66.0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>III</TableCell>
                <TableCell>2</TableCell>
                <TableCell>70.6</TableCell>
                <TableCell>57.8</TableCell>
                <TableCell>61.0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>IV</TableCell>
                <TableCell>2</TableCell>
                <TableCell>70.4</TableCell>
                <TableCell>57.1</TableCell>
                <TableCell>61.0</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="subtitle1" gutterBottom>
          Таблиця 11.2 - Визначення виду робіт за індексом експлуатаційного стану
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Значення індексу J експлуатаційного стану</TableCell>
                <TableCell>Необхідність ремонту виду</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>8 і більше</TableCell>
                <TableCell>Ремонт не потрібен</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>5 ≤ J ≤ 7</TableCell>
                <TableCell>Необхідний поточний ремонт</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>4 і менше</TableCell>
                <TableCell>Необхідний капітальний ремонт</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="subtitle1" gutterBottom>
          Основні формули для розрахунку ENPV (Додаток 10)
        </Typography>
        
        <FormulaDisplay 
          formula="ENPV = Σ(t=1 до n) [(Bt - Ct) / (1 + i)^t]"
          description="Економічна чиста приведена вартість"
        />
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          де:
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          ENPV - економічна чиста приведена вартість;
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          B - загальні вигоди в році t;
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          C - загальні економічні витрати в році t;
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          i - соціальна ставка дисконтування;
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          t - номер періоду;
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          n - загальна кількість періодів.
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Загальні вигоди включають:
        </Typography>
        
        <Typography variant="body2" sx={{ ml: 2 }}>
          - Ефект від зменшення кількості рухомого складу
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          - Ефект від зменшення витрат на перевезення
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          - Ефект від зниження втрат від ДТП
        </Typography>
        <Typography variant="body2" sx={{ ml: 2 }}>
          - Ефект від зменшення негативного впливу на навколишнє середовище
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Алгоритм розподілу бюджету (розділ 4.2)
        </Typography>
        
        <Typography variant="body2" paragraph>
          1. Формування загального переліку об'єктів, що потребують ремонту
        </Typography>
        <Typography variant="body2" paragraph>
          2. Визначення фактичного стану об'єктів
        </Typography>
        <Typography variant="body2" paragraph>
          3. Порівняння показників з нормативними та визначення виду робіт
        </Typography>
        <Typography variant="body2" paragraph>
          4. Визначення орієнтовної вартості робіт
        </Typography>
        <Typography variant="body2" paragraph>
          5. Проведення аналізу витрат і вигод
        </Typography>
        <Typography variant="body2" paragraph>
          6. Ранжування об'єктів за економічною ефективністю (ENPV)
        </Typography>
        <Typography variant="body2" paragraph>
          7. Формування переліку об'єктів у межах виділеного бюджету
        </Typography>
      </CardContent>
    </Card>
  );
};

// Компонент информации о методике
const MethodologyInfo: React.FC = () => {
  return (
    <Card elevation={3} sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Про методику визначення обсягу фінансування дорожніх робіт
        </Typography>
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>
          Розділ IV. Визначення обсягу та механізм розподілу бюджетних коштів
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          Дана методика встановлює механізм розподілу фінансових ресурсів на потреби дорожнього господарства, визначені Законом України "Про джерела фінансування дорожнього господарства України".
        </Typography>
        
        <Typography variant="body1" paragraph>
          Методика описує послідовність визначення видів ремонтних робіт для дорожніх ділянок на основі їх фактичного транспортно-експлуатаційного стану, а також механізм ранжування об'єктів та розподілу бюджетних коштів.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Алгоритм визначення виду робіт (пункт 4.2.3):
        </Typography>
        
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.3.1.</strong> Якщо коефіцієнт інтенсивності руху &lt; 1, то призначається <strong>реконструкція</strong>.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.3.2.</strong> Якщо коефіцієнт міцності дорожнього одягу &lt; нормативного значення, то призначається <strong>капітальний ремонт</strong>.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.3.3-5.</strong> Якщо коефіцієнти рівності, колійності або зчеплення &lt; 1, то призначається <strong>поточний ремонт</strong>.
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Ранжування об'єктів та розподіл бюджету:
        </Typography>
        
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.6.</strong> Ранжування об'єктів реконструкції і капітального ремонту здійснюється за показником економічної чистої приведеної вартості (ENPV).
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.6.1.</strong> Ранжування об'єктів поточного ремонту здійснюється за найменшими значеннями коефіцієнтів рівності, колійності та зчеплення, а також найвищою інтенсивністю руху.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>4.2.7.</strong> Формування переліку об'єктів здійснюється в межах обсягу річних фінансових ресурсів.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Компонент приложения
const RoadFinanceCalculator: React.FC = () => {
  // Состояния
  const [roadSections, setRoadSections] = useState<RoadSection[]>([]);
  const [newSection, setNewSection] = useState<Partial<RoadSection>>({
    id: '',
    name: '',
    length: 0,
    category: 'II' as RoadCategory,
    roughnessIndex: 0,
    trafficIntensity: 0,
    strengthCoefficient: 0,
    evenessCoefficient: 0,
    rutCoefficient: 0,
    gripCoefficient: 0,
    repairCost: 0,
    exploitationIndex: 5
  });
  const [discountRate, setDiscountRate] = useState<number>(DEFAULT_DISCOUNT_RATE);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [distributedBudget, setDistributedBudget] = useState<Record<string, number>>({});
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>('info');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Функция для добавления новой дороги
  const addRoadSection = () => {
    if (
      !newSection.name ||
      !newSection.length ||
      !newSection.category
    ) {
      setSnackbarMessage('Будь ласка, заповніть усі обов\'язкові поля');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const sectionId = `road-${Date.now()}`;
    const sectionWithId: RoadSection = {
      ...newSection as RoadSection,
      id: sectionId,
    };

    // Определяем рекомендуемый вид работ согласно методике (раздел 4.2.3)
    const recommendedWorkType = determineWorkType(sectionWithId);
    
    // Рассчитываем ENPV
    const enpvValue = calculateENPV(sectionWithId);
    
    const updatedSection = {
      ...sectionWithId,
      recommendedWorkType,
      enpv: enpvValue
    };

    setRoadSections([...roadSections, updatedSection]);
    
    // Сбрасываем форму
    setNewSection({
      id: '',
      name: '',
      length: 0,
      category: 'II' as RoadCategory,
      roughnessIndex: 0,
      trafficIntensity: 0,
      strengthCoefficient: 0,
      evenessCoefficient: 0,
      rutCoefficient: 0,
      gripCoefficient: 0,
      repairCost: 0,
      exploitationIndex: 5
    });

    setSnackbarMessage('Ділянку дороги успішно додано');
    setSnackbarSeverity('success');
    setOpenSnackbar(true);
  };

  // Определение типа работ на основе показателей (раздел 4.2.3)
  const determineWorkType = (section: RoadSection): string => {
    // Если есть индекс эксплуатационного состояния, используем его (согласно 4.4.3.1)
    if (section.exploitationIndex !== undefined) {
      return getRepairTypeByIndex(section.exploitationIndex);
    }
    
    // 4.2.3.1 - Коэффициент интенсивности движения
    if (section.trafficIntensity < 1) {
      return "Необхідна реконструкція";
    }
    
    // 4.2.3.2 - Коэффициент прочности дорожного одежды
    if (section.strengthCoefficient < getMinimumAllowableStrength(section.category)) {
      return "Необхідний капітальний ремонт";
    }
    
    // 4.2.3.3-4.2.3.5 - Показатели ровности, колейности и сцепления
    if (section.evenessCoefficient < 1 || section.rutCoefficient < 1 || section.gripCoefficient < 1) {
      return "Необхідний поточний ремонт";
    }
    
    return "Ремонт не потрібен";
  };
  
  // Определение цвета для вида работ
  const getWorkTypeColor = (workType: string): "success" | "warning" | "error" | "secondary" => {
    if (workType.includes("капітальний")) return "error";
    if (workType.includes("поточний")) return "warning";
    if (workType.includes("реконструкція")) return "secondary";
    return "success";
  };

  // Минимально допустимое значение коэффициента прочности (условно)
  const getMinimumAllowableStrength = (category: RoadCategory): number => {
    const strengthValues: Record<RoadCategory, number> = {
      'I': 0.95,
      'II': 0.90,
      'III': 0.85,
      'IV': 0.80,
      'V': 0.75
    };
    return strengthValues[category];
  };

  // Расчет экономической чистой приведенной стоимости (ENPV) согласно Приложению 10
  const calculateENPV = (section: RoadSection): number => {
    // Период анализа: 10 лет
    const years = 10;
    
    // Параметры для расчета выгод согласно методике из Приложения 10
    const trafficIntensity = section.trafficIntensity; // авт/сутки
    const roadLength = section.length; // км
    const roughnessIndex = section.roughnessIndex; // показатель ровности, см/км
    
    // Определяем скорости движения в зависимости от категории дороги
    const speeds = averageSpeedByCategory[section.category];
    
    // Для упрощения рассчитываем среднюю скорость всех типов транспорта
    const avgSpeedBefore = (speeds.light + speeds.freight + speeds.bus) / 3;
    
    // Предполагаем, что после ремонта скорость увеличится на 10-30% в зависимости от текущего индекса ровности
    const improvementFactor = Math.min(1.3, Math.max(1.1, 1 + roughnessIndex / 300));
    const avgSpeedAfter = avgSpeedBefore * improvementFactor;
    
    // Состав транспортного потока (условные значения для демонстрации)
    const lightVehicleShare = 0.7; // доля легковых автомобилей
    const freightVehicleShare = 0.2; // доля грузовых автомобилей
    const busShare = 0.1; // доля автобусов
    
    // 10.1.1 Эффект от уменьшения количества подвижного состава
    const vehicleReductionEffect = (trafficIntensity * freightVehicleShare * 0.2 + trafficIntensity * busShare * 0.1) * 500; // тыс. грн
    
    // 10.1.2 Эффект от уменьшения затрат на перевозки
    // Рассчитываем по упрощенной формуле из Приложения 10
    const transportCostEffect = trafficIntensity * 365 * roadLength * (
      lightVehicleShare * 0.8 * (1/avgSpeedBefore - 1/avgSpeedAfter) +
      freightVehicleShare * 1.2 * (1/avgSpeedBefore - 1/avgSpeedAfter) +
      busShare * 1.0 * (1/avgSpeedBefore - 1/avgSpeedAfter)
    ) * 1000; // тыс. грн в год
    
    // 10.1.3 Эффект от снижения потерь от ДТП
    // Предполагаем, что количество ДТП снижается обратно пропорционально улучшению дорожного покрытия
    // Используем упрощенную формулу, в реальности нужно использовать данные о ДТП
    const accidentRateReduction = Math.min(0.5, Math.max(0.1, roughnessIndex / 300));
    const accidentCostEffect = trafficIntensity * roadLength * 365 * accidentRateReduction * 0.05; // тыс. грн в год
    
    // 10.1.4 Эффект от уменьшения негативного влияния на окружающую среду
    // Предполагаем, что улучшение дороги снижает выбросы на 5-15%
    const environmentalEffect = trafficIntensity * roadLength * 365 * 0.01; // тыс. грн в год
    
    // Суммарный ежегодный эффект
    const totalAnnualBenefit = transportCostEffect + accidentCostEffect + environmentalEffect;
    
    // Рассчитываем ENPV по формуле из Приложения 10
    let enpv = -section.repairCost + vehicleReductionEffect; // Первоначальные инвестиции и эффект от уменьшения количества подвижного состава
    
    for (let t = 1; t <= years; t++) {
      enpv += totalAnnualBenefit / Math.pow(1 + discountRate, t);
    }
    
    // Рассчитываем относительный показатель ENPV на 1 км дороги
    const enpvPerKm = enpv / roadLength;
    
    return Math.round(enpv * 100) / 100;
  };

  // Распределение бюджета по объектам согласно методике (раздел 4.2.7)
  const distributeBudget = () => {
    if (totalBudget <= 0) {
      setOpenSnackbar(true);
      setSnackbarMessage("Будь ласка, вкажіть загальний бюджет");
      setSnackbarSeverity("error");
      return;
    }

    if (roadSections.length === 0) {
      setOpenSnackbar(true);
      setSnackbarMessage("Додайте хоча б одну ділянку дороги");
      setSnackbarSeverity("warning");
      return;
    }

    setCalculating(true);

    // Имитация длительного расчета для демонстрации загрузки
    setTimeout(() => {
      // Сортируем объекты по ENPV для приоритизации (раздел 4.2.6)
      const sortedSections = [...roadSections].sort((a, b) => (b.enpv || 0) - (a.enpv || 0));
      
      let remainingBudget = totalBudget;
      const newDistribution: Record<string, number> = {};

      for (const section of sortedSections) {
        if (remainingBudget <= 0) break;
        
        // Определяем стоимость работ для данной секции
        const requiredBudget = section.repairCost;
        
        if (requiredBudget <= remainingBudget) {
          newDistribution[section.id] = requiredBudget;
          remainingBudget -= requiredBudget;
        } else {
          newDistribution[section.id] = remainingBudget;
          remainingBudget = 0;
        }
      }

      setDistributedBudget(newDistribution);
      
      // Обновляем данные для графика
      const newAnalyticsData = roadSections.map(section => ({
        name: section.name,
        enpv: section.enpv || 0,
        budget: newDistribution[section.id] || 0,
        length: section.length
      }));
      
      setAnalyticsData(newAnalyticsData);
      setCalculating(false);
      
      setOpenSnackbar(true);
      setSnackbarMessage(`Бюджет успішно розподілено. Залишок: ${formatNumber(remainingBudget)} тис. грн`);
      setSnackbarSeverity("success");
    }, 1500);
  };

  // Функция для удаления дороги
  const removeRoadSection = (id: string) => {
    setRoadSections(roadSections.filter(section => section.id !== id));
    
    // Если дорога была в распределении бюджета, удаляем её оттуда
    if (distributedBudget[id]) {
      const newDistribution = { ...distributedBudget };
      delete newDistribution[id];
      setDistributedBudget(newDistribution);
    }
  };

  // Эффект для обновления данных аналитики при изменении дорог
  useEffect(() => {
    const newAnalyticsData = roadSections.map(section => ({
      name: section.name,
      enpv: section.enpv || 0,
      budget: distributedBudget[section.id] || 0,
      length: section.length
    }));
    
    setAnalyticsData(newAnalyticsData);
  }, [roadSections, distributedBudget]);

  // Расчет общей ENPV для всех выбранных объектов
  const totalENPV = roadSections.reduce((sum, section) => sum + (section.enpv || 0), 0);

  // Обработчик изменения вкладки
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Обработчик закрытия уведомления
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Форматирование числа для отображения
  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Получение суммы распределенного бюджета
  const getDistributedTotal = (): number => {
    return Object.values(distributedBudget).reduce((sum, value) => sum + value, 0);
  };
  
  // Получение суммы требуемого бюджета для всех дорог
  const getTotalRequiredBudget = (): number => {
    return roadSections.reduce((sum, section) => sum + section.repairCost, 0);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 2 }}>
          Калькулятор фінансування дорожніх робіт
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Реалізація методики розділу IV - Визначення обсягу та механізм розподілу бюджетних коштів
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Калькулятор" />
            <Tab label="Формули та довідкові дані" />
            <Tab label="Про методику" />
          </Tabs>
        </Box>
        
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Форма добавления участка дороги */}
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Додати ділянку дороги
                  </Typography>
                  
                  <Box component="form" sx={{ mt: 2 }}>
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs>
                        <TextField
                          label="Назва ділянки"
                          fullWidth
                          margin="normal"
                          value={newSection.name || ''}
                          onChange={(e) => setNewSection({...newSection, name: e.target.value})}
                        />
                      </Grid>
                      <Grid item>
                        <Tooltip title="Вкажіть назву ділянки дороги, наприклад: 'Ділянка Київ-Чернігів, км 10-15'">
                          <InfoIcon fontSize="small" style={{ color: "#777" }} />
                        </Tooltip>
                      </Grid>
                    </Grid>
                    
                    <TextField
                      label="Довжина (км)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={newSection.length || ''}
                      onChange={(e) => setNewSection({...newSection, length: parseFloat(e.target.value)})}
                    />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Категорія дороги</InputLabel>
                      <Select
                        value={newSection.category || 'II'}
                        label="Категорія дороги"
                        onChange={(e) => setNewSection({...newSection, category: e.target.value as RoadCategory})}
                      >
                        <MenuItem value="I">I</MenuItem>
                        <MenuItem value="II">II</MenuItem>
                        <MenuItem value="III">III</MenuItem>
                        <MenuItem value="IV">IV</MenuItem>
                        <MenuItem value="V">V</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="Індекс рівності (см/км)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={newSection.roughnessIndex || ''}
                      onChange={(e) => setNewSection({...newSection, roughnessIndex: parseFloat(e.target.value)})}
                    />
                    
                    <TextField
                      label="Інтенсивність руху (авт/добу)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={newSection.trafficIntensity || ''}
                      onChange={(e) => setNewSection({...newSection, trafficIntensity: parseFloat(e.target.value)})}
                    />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Коефіцієнт міцності"
                          type="number"
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 0, max: 2, step: 0.01 } }}
                          value={newSection.strengthCoefficient || ''}
                          onChange={(e) => setNewSection({...newSection, strengthCoefficient: parseFloat(e.target.value)})}
                          helperText={`Мін. допустимий: ${getMinimumAllowableStrength(newSection.category as RoadCategory || 'II')}`}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Коефіцієнт рівності"
                          type="number"
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 0, max: 2, step: 0.01 } }}
                          value={newSection.evenessCoefficient || ''}
                          onChange={(e) => setNewSection({...newSection, evenessCoefficient: parseFloat(e.target.value)})}
                          helperText="Має бути ≥ 1"
                        />
                      </Grid>
                    </Grid>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Коефіцієнт колійності"
                          type="number"
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 0, max: 2, step: 0.01 } }}
                          value={newSection.rutCoefficient || ''}
                          onChange={(e) => setNewSection({...newSection, rutCoefficient: parseFloat(e.target.value)})}
                          helperText="Має бути ≥ 1"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Коефіцієнт зчеплення"
                          type="number"
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 0, max: 2, step: 0.01 } }}
                          value={newSection.gripCoefficient || ''}
                          onChange={(e) => setNewSection({...newSection, gripCoefficient: parseFloat(e.target.value)})}
                          helperText="Має бути ≥ 1"
                        />
                      </Grid>
                    </Grid>
                    
                    <TextField
                      label="Вартість ремонту (тис. грн)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 0 } }}
                      value={newSection.repairCost || ''}
                      onChange={(e) => setNewSection({...newSection, repairCost: parseFloat(e.target.value)})}
                    />
                    
                    <TextField
                      label="Індекс експлуатаційного стану (1-10)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 1, max: 10, step: 0.1 } }}
                      value={newSection.exploitationIndex || ''}
                      onChange={(e) => setNewSection({...newSection, exploitationIndex: parseFloat(e.target.value)})}
                      helperText="Опціонально: якщо вказано, визначає вид ремонту (див. Додаток 11)"
                    />
                    
                    <TextField
                      label="Соціальна ставка дисконтування (0-1)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                      value={discountRate}
                      onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                      helperText="Використовується для розрахунку ENPV (рекомендовано: 0.05)"
                    />
                    
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={addRoadSection}
                      endIcon={<AddIcon />}
                    >
                      Додати дорогу
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Список добавленных дорог */}
            <Grid item xs={12} md={8}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Додані ділянки доріг ({roadSections.length})
                  </Typography>
                  
                  {roadSections.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Додайте ділянки доріг за допомогою форми зліва
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Назва</TableCell>
                            <TableCell>Категорія</TableCell>
                            <TableCell>Довжина (км)</TableCell>
                            <TableCell>Рекомендований вид робіт</TableCell>
                            <TableCell>Вартість (тис. грн)</TableCell>
                            <TableCell>ENPV</TableCell>
                            <TableCell>Дії</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roadSections.map((section) => (
                            <TableRow key={section.id}>
                              <TableCell>{section.name}</TableCell>
                              <TableCell>{section.category}</TableCell>
                              <TableCell>{section.length.toFixed(2)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={section.recommendedWorkType || determineWorkType(section)}
                                  color={getWorkTypeColor(section.recommendedWorkType || determineWorkType(section))}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{formatNumber(section.repairCost)}</TableCell>
                              <TableCell>{formatNumber(section.enpv || 0)}</TableCell>
                              <TableCell>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => removeRoadSection(section.id)}
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {roadSections.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Розподіл бюджету
                      </Typography>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Загальний бюджет (тис. грн)"
                            type="number"
                            fullWidth
                            margin="normal"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={totalBudget || ''}
                            onChange={(e) => setTotalBudget(parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={distributeBudget}
                            disabled={calculating || totalBudget <= 0}
                            startIcon={calculating ? <CircularProgress size={20} /> : <BarChartIcon />}
                            fullWidth
                            sx={{ mt: 2 }}
                          >
                            {calculating ? 'Розподіл...' : 'Розподілити бюджет'}
                          </Button>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Загальна потреба: <strong>{formatNumber(getTotalRequiredBudget())} тис. грн</strong>
                        </Typography>
                        <Typography variant="body2">
                          Розподілено: <strong>{formatNumber(getDistributedTotal())} тис. грн</strong>
                        </Typography>
                        <Typography variant="body2">
                          Загальний ENPV: <strong>{formatNumber(totalENPV)}</strong>
                        </Typography>
                      </Box>
                      
                      {Object.keys(distributedBudget).length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Результати розподілу бюджету
                          </Typography>
                          
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Пріоритет</TableCell>
                                  <TableCell>Назва</TableCell>
                                  <TableCell>Вид робіт</TableCell>
                                  <TableCell>ENPV</TableCell>
                                  <TableCell>Потрібний бюджет</TableCell>
                                  <TableCell>Виділений бюджет</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {roadSections
                                  .sort((a, b) => (b.enpv || 0) - (a.enpv || 0))
                                  .map((section, index) => (
                                    <TableRow 
                                      key={section.id}
                                      sx={{ 
                                        bgcolor: distributedBudget[section.id] 
                                          ? 'rgba(76, 175, 80, 0.08)' 
                                          : 'inherit'
                                      }}
                                    >
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell>{section.name}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={section.recommendedWorkType || determineWorkType(section)}
                                          color={getWorkTypeColor(section.recommendedWorkType || determineWorkType(section))}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>{formatNumber(section.enpv || 0)}</TableCell>
                                      <TableCell>{formatNumber(section.repairCost)}</TableCell>
                                      <TableCell>
                                        {distributedBudget[section.id] 
                                          ? formatNumber(distributedBudget[section.id])
                                          : '0.00'}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                }
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                      
                      {analyticsData.length > 0 && (
                        <Box sx={{ mt: 4, height: 300 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Аналіз бюджету та ENPV за ділянками
                          </Typography>
                          
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={analyticsData}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                              <RechartsTooltip />
                              <Legend />
                              <Bar yAxisId="left" dataKey="enpv" name="ENPV" fill="#8884d8" />
                              <Bar yAxisId="right" dataKey="budget" name="Бюджет (тис. грн)" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && <ReferenceSection />}
        
        {activeTab === 2 && <MethodologyInfo />}
        
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

