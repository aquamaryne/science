// Імпорт основних React бібліотек та хуків
import React, { useState, useEffect } from 'react';

// Імпорт компонентів Material UI для створення інтерфейсу
import { 
  Container, // Контейнер для центрування вмісту
  Typography, // Компонент для відображення тексту
  Box, // Гнучкий контейнер для управління розміщенням
  TextField, // Поле введення
  Grid, // Сітка для організації компонентів
  Paper, // Картка для відображення контенту
  FormControl, // Контейнер для форм
  InputLabel, // Мітка для полів форми
  Select, // Компонент випадаючого списку
  MenuItem, // Елемент списку
  Button, // Кнопка
  Table, // Таблиця
  TableBody, // Тіло таблиці
  TableCell, // Клітинка таблиці
  TableContainer, // Контейнер таблиці
  TableHead, // Заголовок таблиці
  TableRow, // Рядок таблиці
  Divider, // Розділювач
  Accordion, // Акордеон (розкривний блок)
  AccordionSummary, // Заголовок акордеона
  AccordionDetails, // Вміст акордеона
  CircularProgress // Індикатор завантаження
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select'; // Тип для події зміни Select
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Іконка для акордеона

// Масив регіонів України для вибору користувачем
const REGIONS = [
  "1-Крим", "2-Вінницька", "3-Волинська", "4-Дніпропетровська", 
  "5-Донецька", "6-Житомирська", "7-Закарпатська", "8-Запорізька", 
  "9-Івано-Франківська", "10-Київська", "11-Кіровоградська", "12-Луганська", 
  "13-Львівська", "14-Миколаївська", "15-Одеська", "16-Полтавська", 
  "17-Рівненська", "18-Сумська", "19-Тернопільська", "20-Харківська", 
  "21-Херсонська", "22-Хмельницька", "23-Черкаська", "24-Чернігівська", 
  "25-Чернівецька"
];

// Інтерфейс для категорій доріг
interface RoadCategory {
  id: number;      // Категорія дороги (1-5)
  length: number;  // Довжина дороги в км
}

// Інтерфейс для секцій доріг
interface Section {
  id: number;      // Ідентифікатор секції
  length: number;  // Довжина секції в км
  value: number;   // Додаткове значення (інтенсивність руху, коефіцієнт тощо)
}

// Головний компонент калькулятора
const RoadFundingCalculator: React.FC = () => {
  // Стани для базових вхідних параметрів
  const [hDz, setHDz] = useState<number>(604.761); // Норматив для доріг державного значення
  const [hMz, setHMz] = useState<number>(360.544); // Норматив для доріг місцевого значення
  const [kI, setKI] = useState<number>(1); // Коефіцієнт інфляції

  // Коефіцієнти диференціювання для різних категорій доріг (додаток 3)
  const kD = [1.8, 1, 0.89, 0.61, 0.39]; // Для доріг державного значення
  const kM = [1.71, 1, 0.85, 0.64, 0.4]; // Для доріг місцевого значення
  
  // Інші коефіцієнти для розрахунків
  const kk2 = [1.15, 1.15, 1.11, 1.04, 1]; // Коригувальні коефіцієнти проходження у гірській місцевості
  const kk3 = [1.15, 1.15, 1.11, 1.04, 1]; // Коефіцієнти умов експлуатації
  const k4 = [2.3, 3.5, 3.9]; // Коефіцієнти інтенсивності руху
  const k5 = [1.01, 1.03, 1.05]; // Коефіцієнти для критичної інфраструктури

  // Стан для вибраного регіону
  const [selectedRegion, setSelectedRegion] = useState<number>(1);

  // Стан для категорій доріг та їх довжин
  const [roadCategories, setRoadCategories] = useState<RoadCategory[]>([
    { id: 1, length: 28000 }, // Категорія 1
    { id: 2, length: 15300 }, // Категорія 2
    { id: 3, length: 9800 },  // Категорія 3
    { id: 4, length: 22000 }, // Категорія 4
    { id: 5, length: 12000 }  // Категорія 5
  ]);
  const [totalLength, setTotalLength] = useState<number>(0); // Загальна довжина доріг

  // Стани для секцій з різною інтенсивністю руху
  const [sectionCount, setSectionCount] = useState<number>(4); // Кількість секцій
  const [categoryId, setCategoryId] = useState<number>(1); // Категорія дороги для секцій
  const [traffics, setTraffics] = useState<Section[]>([
    { id: 1, length: 5000, value: 17000 }, // Секція 1: довжина 5000 км, інтенсивність 17000 авто/добу
    { id: 2, length: 2100, value: 19500 }, // Секція 2: довжина 2100 км, інтенсивність 19500 авто/добу
    { id: 3, length: 1100, value: 16000 }, // Секція 3: довжина 1100 км, інтенсивність 16000 авто/добу
    { id: 4, length: 1000, value: 30000 }  // Секція 4: довжина 1000 км, інтенсивність 30000 авто/добу
  ]);
  
  // Стани для доріг європейської мережі
  const [euNetworkCount, setEuNetworkCount] = useState<number>(5); // Кількість секцій європейської мережі
  const [euNetworks, setEuNetworks] = useState<Section[]>([
    { id: 1, length: 350, value: 0 },
    { id: 2, length: 1500, value: 0 },
    { id: 3, length: 220, value: 0 },
    { id: 4, length: 1500, value: 0 },
    { id: 5, length: 800, value: 0 }
  ]);
  const [euCoefficient, setEuCoefficient] = useState<number>(1.5); // Коефіцієнт для доріг європейської мережі
  
  // Стани для прикордонних пунктів пропуску
  const [borderCrossingCount, setBorderCrossingCount] = useState<number>(2); // Кількість пунктів пропуску
  const [borderCrossings, setBorderCrossings] = useState<Section[]>([
    { id: 1, length: 18, value: 0 },
    { id: 2, length: 11, value: 0 }
  ]);
  const [borderCoefficient, setBorderCoefficient] = useState<number>(1.5); // Коефіцієнт для пунктів пропуску
  
  // Стани для доріг з освітленням
  const [lightingCount, setLightingCount] = useState<number>(2); // Кількість освітлених ділянок
  const [lightings, setLightings] = useState<Section[]>([
    { id: 1, length: 26, value: 0 },
    { id: 2, length: 21, value: 0 }
  ]);
  const [lightingCoefficient, setLightingCoefficient] = useState<number>(2); // Коефіцієнт для освітлених ділянок
  
  // Стани для відремонтованих доріг
  const [repairedCount, setRepairedCount] = useState<number>(5); // Кількість відремонтованих ділянок
  const [repaired, setRepaired] = useState<Section[]>([
    { id: 1, length: 24, value: 0 },
    { id: 2, length: 19, value: 0 },
    { id: 3, length: 7, value: 0 },
    { id: 4, length: 32, value: 0 },
    { id: 5, length: 15, value: 0 }
  ]);
  const [repairCoefficient, setRepairCoefficient] = useState<number>(0.5); // Коефіцієнт для відремонтованих ділянок
  
  // Стани для результатів розрахунків
  const [kidResult, setKidResult] = useState<number | null>(null); // Коефіцієнт інтенсивності руху
  const [kdeResult, setKdeResult] = useState<number | null>(null); // Коефіцієнт європейської мережі
  const [kdmResult, setKdmResult] = useState<number | null>(null); // Коефіцієнт пунктів пропуску
  const [kdoResult, setKdoResult] = useState<number | null>(null); // Коефіцієнт освітлення
  const [kdrResult, setKdrResult] = useState<number | null>(null); // Коефіцієнт ремонту
  
  // Стани для управління інтерфейсом
  const [calculating, setCalculating] = useState<boolean>(false); // Прапорець розрахунків
  const [resultsAvailable, setResultsAvailable] = useState<boolean>(false); // Наявність результатів

  // Ефект для розрахунку загальної довжини доріг при зміні категорій
  useEffect(() => {
    const sum = roadCategories.reduce((acc, category) => acc + category.length, 0);
    setTotalLength(sum);
  }, [roadCategories]);

  // Обробник зміни регіону
  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(Number(event.target.value));
  };

  // Обробник зміни довжини доріг за категоріями
  const handleRoadCategoryChange = (id: number, value: number) => {
    setRoadCategories(prevCategories => 
      prevCategories.map(category => 
        category.id === id ? { ...category, length: value } : category
      )
    );
  };

  // Обробник зміни кількості секцій з інтенсивністю руху
  const handleSectionCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setSectionCount(value);
      
      // Додавання або видалення секцій відповідно до нової кількості
      if (value > traffics.length) {
        const newSections = [...traffics];
        for (let i = traffics.length; i < value; i++) {
          newSections.push({ id: i + 1, length: 0, value: 0 });
        }
        setTraffics(newSections);
      } else {
        setTraffics(traffics.slice(0, value));
      }
    }
  };

  // Універсальний обробник зміни параметрів секцій
  const handleSectionChange = (
    sections: Section[], 
    setSections: React.Dispatch<React.SetStateAction<Section[]>>, 
    id: number, 
    field: 'length' | 'value', 
    value: number
  ) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  // Універсальний обробник зміни кількості секцій
  const handleGenericCountChange = (
    count: number,
    setCount: React.Dispatch<React.SetStateAction<number>>,
    sections: Section[],
    setSections: React.Dispatch<React.SetStateAction<Section[]>>
  ) => {
    if (count > 0 && count <= 10) {
      setCount(count);
      
      // Додавання або видалення секцій відповідно до нової кількості
      if (count > sections.length) {
        const newSections = [...sections];
        for (let i = sections.length; i < count; i++) {
          newSections.push({ id: i + 1, length: 0, value: 0 });
        }
        setSections(newSections);
      } else {
        setSections(sections.slice(0, count));
      }
    }
  };

  // Основна функція розрахунку коефіцієнтів фінансування
  const calculateCoefficients = () => {
    setCalculating(true); // Встановлення прапорця розрахунків
    
    // Імітація затримки для демонстрації процесу розрахунків
    setTimeout(() => {
      // Розрахунок коефіцієнта інтенсивності руху (Kid)
      let weightedSectionLength = 0;
      let totalTrafficLength = 0;
      
      // Обробка кожної секції з інтенсивністю руху
      traffics.forEach(traffic => {
        if (traffic.length > 0) {
          // Визначення коефіцієнта інтенсивності для секції
          let intensityCoef = 1;
          if (traffic.value > 25000) {
            intensityCoef = k4[2]; // Високий рівень інтенсивності
          } else if (traffic.value > 15000) {
            intensityCoef = k4[1]; // Середній рівень інтенсивності
          } else if (traffic.value > 5000) {
            intensityCoef = k4[0]; // Низький рівень інтенсивності
          }
          
          // Вибір коефіцієнта категорії дороги
          const categoryIndex = Math.min(categoryId - 1, 4);
          const categoryCoef = categoryId <= 2 ? kD[categoryIndex] : kM[categoryIndex];
          
          // Розрахунок зваженої довжини секції
          weightedSectionLength += traffic.length * intensityCoef * categoryCoef;
          totalTrafficLength += traffic.length;
        }
      });
      
      // Вибір коефіцієнтів для обраного регіону
      const climateCoef = k5[selectedRegion % 3]; // Коефіцієнт клімату
      const structureCoef = kk2[Math.min(categoryId - 1, 4)]; // Структурний коефіцієнт
      const regionCoef = kk3[Math.min(selectedRegion % 5, 4)]; // Регіональний коефіцієнт
      
      // Розрахунок довжини доріг без урахування секцій з інтенсивністю
      const remainingLength = totalLength - totalTrafficLength;
      const baseCoef = categoryId <= 2 ? kD[0] : kM[0]; // Базовий коефіцієнт
      
      // Фінальний розрахунок коефіцієнта Kid
      const kidValue = ((weightedSectionLength + (remainingLength * baseCoef)) / totalLength) * 
                      climateCoef * structureCoef * regionCoef * kI;
                      
      setKidResult(Number(kidValue.toFixed(3))); // Збереження результату з округленням
  
      // Розрахунок коефіцієнта для доріг європейської мережі (Kde)
      const totalEuLength = euNetworks.reduce((acc, section) => acc + section.length, 0);
      const kdeValue = (totalEuLength * euCoefficient + (totalLength - totalEuLength)) / totalLength;
      setKdeResult(Number(kdeValue.toFixed(6)));
  
      // Розрахунок коефіцієнта для прикордонних пунктів пропуску (Kdm)
      const totalBorderLength = borderCrossings.reduce((acc, section) => acc + section.length, 0);
      const kdmValue = (totalBorderLength * borderCoefficient + (totalLength - totalBorderLength)) / totalLength;
      setKdmResult(Number(kdmValue.toFixed(6)));
  
      // Розрахунок коефіцієнта для освітлених ділянок (Kdo)
      const totalLightingLength = lightings.reduce((acc, section) => acc + section.length, 0);
      const kdoValue = (totalLightingLength * lightingCoefficient + (totalLength - totalLightingLength)) / totalLength;
      setKdoResult(Number(kdoValue.toFixed(6)));
  
      // Розрахунок коефіцієнта для відремонтованих ділянок (Kdr)
      const totalRepairedLength = repaired.reduce((acc, section) => acc + section.length, 0);
      const kdrValue = (totalRepairedLength * repairCoefficient + (totalLength - totalRepairedLength)) / totalLength;
      setKdrResult(Number(kdrValue.toFixed(5)));
      
      // Завершення розрахунків
      setResultsAvailable(true);
      setCalculating(false);
      
      // Прокрутка до розділу з результатами
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 500); 
  };

  // Розмітка інтерфейсу компонента
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Заголовок */}
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Визначення обсягу фінансування автомобільних доріг
        </Typography>
        
        {/* Підзаголовок */}
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
          Розрахунок фінансування будівництва, поточного ремонту та експлуатаційного утримання
        </Typography>

        {/* Акордеон з вихідними даними */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Вихідні дані
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Поле для нормативу доріг державного значення */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="hDz - Нормативні витрати на дороги державного значення"
                  type="number"
                  value={hDz}
                  onChange={(e) => setHDz(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              {/* Поле для нормативу доріг місцевого значення */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="hMz - Нормативні витрати на дороги місцевого значення"
                  type="number"
                  value={hMz}
                  onChange={(e) => setHMz(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              {/* Поле для коефіцієнта інфляції */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="kI - Коефіцієнт інфляції"
                  type="number"
                  value={kI}
                  onChange={(e) => setKI(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Акордеон для вибору області */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Вибір області
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <InputLabel id="region-select-label">Область</InputLabel>
              <Select
                labelId="region-select-label"
                id="region-select"
                value={selectedRegion.toString()}
                label="Область"
                onChange={handleRegionChange}
              >
                {REGIONS.map((region, index) => (
                  <MenuItem key={index} value={index + 1}>
                    {region}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Акордеон з довжинами доріг за категоріями */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Довжина автомобільних доріг за категоріями
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Поля для введення довжин доріг різних категорій */}
              {roadCategories.map((category) => (
                <Grid item xs={12} md={4} key={category.id}>
                  <TextField
                    label={`Категорія ${category.id} (км)`}
                    type="number"
                    value={category.length}
                    onChange={(e) => handleRoadCategoryChange(category.id, Number(e.target.value))}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              ))}
              {/* Відображення загальної довжини доріг */}
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Загальна протяжність: {totalLength} км
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Акордеон з даними про інтенсивність руху */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Ділянки автомобільних доріг за інтенсивністю руху
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Поле для кількості ділянок */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Кількість ділянок"
                  type="number"
                  value={sectionCount}
                  onChange={(e) => handleSectionCountChange(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              {/* Поле для категорії дороги */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Категорія дороги"
                  type="number"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Таблиця з даними про інтенсивність руху */}
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ділянка</TableCell>
                    <TableCell>Довжина (км)</TableCell>
                    <TableCell>Інтенсивність руху (авто/добу)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Рядки таблиці для кожної ділянки */}
                  {traffics.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.id}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={section.length}
                          onChange={(e) => handleSectionChange(
                            traffics, 
                            setTraffics, 
                            section.id, 
                            'length', 
                            Number(e.target.value)
                          )}
                          fullWidth
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={section.value}
                          onChange={(e) => handleSectionChange(
                            traffics, 
                            setTraffics, 
                            section.id, 
                            'value', 
                            Number(e.target.value)
                          )}
                          fullWidth
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Інформація про загальну довжину відремонтованих доріг */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Загальна довжина відремонтованих доріг: {repaired.reduce((acc, section) => acc + section.length, 0)} км
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Кнопка для запуску розрахунків */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={calculateCoefficients}
            disabled={calculating}
            startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {calculating ? 'Розрахунок...' : 'Розрахувати коефіцієнти'}
          </Button>
        </Box>

        {/* Блок для відображення результатів розрахунків */}
        {resultsAvailable && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="results-section">
            <Typography variant="h5" gutterBottom align="center">
              Результати розрахунків
            </Typography>
            <Grid container spacing={3}>
              {/* Загальна інформація */}
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Загальна довжина автомобільних доріг: {totalLength} км
                </Typography>
              </Grid>
              {/* Заголовок розділу коефіцієнтів */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Коефіцієнти:</Typography>
                <Divider sx={{ my: 2 }} />
              </Grid>
              {/* Виведення розрахованих коефіцієнтів */}
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Kid:</strong> {kidResult}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Kde:</strong> {kdeResult}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Kdm:</strong> {kdmResult}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Kdo:</strong> {kdoResult}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Kdr:</strong> {kdrResult}
                </Typography>
              </Grid>
              {/* Загальний коефіцієнт */}
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Загальний коефіцієнт:</strong> {(kidResult! * kdeResult! * kdmResult! * kdoResult! * kdrResult!).toFixed(6)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
            </Grid>

            {/* Таблиця з підсумковим розрахунком фінансування */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Підсумковий розрахунок фінансування
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Категорія дороги</TableCell>
                      <TableCell>Нормативні фінансові витрати (тис. грн/км)</TableCell>
                      <TableCell>Довжина (км)</TableCell>
                      <TableCell>Коефіцієнти корегування</TableCell>
                      <TableCell>Сума (тис. грн)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Рядки таблиці з розрахунком фінансування для кожної категорії доріг */}
                    {roadCategories.map((category, index) => {
                      // Вибір базового нормативу залежно від категорії дороги (державного чи місцевого значення)
                      const baseNorm = category.id <= 2 ? hDz : hMz;
                      // Розрахунок загального коригувального коефіцієнта
                      const totalCoeff = kidResult! * kdeResult! * kdmResult! * kdoResult! * kdrResult!;
                      // Розрахунок суми фінансування для даної категорії доріг
                      const funding = baseNorm * category.length * totalCoeff;
                      
                      return (
                        <TableRow key={category.id}>
                          <TableCell>{category.id}</TableCell>
                          <TableCell>{baseNorm.toFixed(3)}</TableCell>
                          <TableCell>{category.length}</TableCell>
                          <TableCell>{totalCoeff.toFixed(6)}</TableCell>
                          <TableCell>{funding.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableHead>
                    {/* Підсумковий рядок із загальною сумою фінансування */}
                    <TableRow>
                      <TableCell colSpan={4} align="right"><strong>Загальна сума фінансування:</strong></TableCell>
                      <TableCell>
                        {/* Розрахунок загальної суми фінансування для всіх категорій доріг */}
                        {roadCategories.reduce((sum, category) => {
                          const baseNorm = category.id <= 2 ? hDz : hMz;
                          const totalCoeff = kidResult! * kdeResult! * kdmResult! * kdoResult! * kdrResult!;
                          return sum + (baseNorm * category.length * totalCoeff);
                        }, 0).toFixed(2)} тис. грн
                      </TableCell>
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>
            </Box>

            {/* Кнопка для друку результатів */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                onClick={() => window.print()}
              >
                Роздрукувати результати
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

// Експорт компонента для використання в інших частинах додатку
export default RoadFundingCalculator;