import React from "react";
import { Button, TextField, Typography, MenuItem, Box} from "@mui/material";
import { calculateKed } from "../modules/ked";
import { calculateKIntesity } from "../modules/intens";
import { calculateKooc } from "../modules/kocc";
import { calculateKrem } from "../modules/krem";
import { calculateKnorm } from "../modules/knorm";
import BudgetCalculates from "./page_three_dot_one";
import WorksTable from "./page_three_dot_two";

type RoadCategory = 'I' | 'II' | 'III' | 'IV' | 'V';

const coefficients = {
    state: { 'I': 1.80, 'II': 1.00, 'III': 0.89, 'IV': 0.61, 'V': 0.39 },
    local: { 'I': 1.71, 'II': 1.00, 'III': 0.85, 'IV': 0.64, 'V': 0.40 },
};

const regions = [
  { name: "Київська область",          kdelta: 1.2, kz: 1.1 },
  { name: "Львівська область",         kdelta: 1.1, kz: 1.0 },
  { name: "Одеська область",           kdelta: 1.3, kz: 1.2 },
  { name: "Харківська область",        kdelta: 1.2, kz: 1.1 },
  { name: "Дніпропетровська область",  kdelta: 1.2, kz: 1.1 },
  { name: "Запорізька область",        kdelta: 1.2, kz: 1.1 },
  { name: "Миколаївська область",      kdelta: 1.3, kz: 1.2 },
  { name: "Херсонська область",        kdelta: 1.3, kz: 1.2 },
  { name: "Вінницька область",         kdelta: 1.1, kz: 1.0 },
  { name: "Черкаська область",         kdelta: 1.1, kz: 1.0 },
  { name: "Полтавська область",        kdelta: 1.1, kz: 1.0 },
  { name: "Кіровоградська область",    kdelta: 1.2, kz: 1.1 },
  { name: "Чернігівська область",      kdelta: 1.1, kz: 1.0 },
  { name: "Сумська область",           kdelta: 1.1, kz: 1.0 },
  { name: "Рівненська область",        kdelta: 1.0, kz: 0.9 },
  { name: "Волинська область",         kdelta: 1.0, kz: 0.9 },
  { name: "Тернопільська область",     kdelta: 1.0, kz: 0.9 },
  { name: "Івано-Франківська область", kdelta: 1.0, kz: 0.9 },
  { name: "Закарпатська область",      kdelta: 1.0, kz: 0.9 },
  { name: "Хмельницька область",       kdelta: 1.1, kz: 1.0 },
  { name: "Житомирська область",       kdelta: 1.1, kz: 1.0 },
  { name: "Чернівецька область",       kdelta: 1.0, kz: 0.9 },
  { name: "Луганська область",         kdelta: 1.3, kz: 1.3 },
  { name: "Донецька область",          kdelta: 1.3, kz: 1.3 },
  { name: "Київ (місто)",              kdelta: 1.4, kz: 1.3 },
  { name: "Севастополь",               kdelta: 1.3, kz: 1.2 },
  { name: "АР Крим",                   kdelta: 1.3, kz: 1.2 },
];

const stateNorm: number  = 604.761;
const localNorm: number = 360.544;

const PageThree: React.FC = () => {
  const [roadCategory, setRoadCategory] = React.useState<RoadCategory | "">("");
  const [inflationIndex, setInflationIndex] = React.useState<number | "">("");
  const [isStateRoad, setIsStateRoad] = React.useState<boolean>(true);
  const [selectedRegion, setSelectedRegion] = React.useState(regions[0]);
  const [result, setResult] = React.useState<number | null>(null);

  // Временные данные для участков дорог
  const roadSegments = [
    { length: 10, trafficIntensity: 25000 },
    { length: 20, trafficIntensity: 17000 },
  ]; // пример данных для K_intensity
  const europeanRoadSegments = [
    { length: 15 },
    { length: 5 },
  ]; // пример данных для K_ed
  const lightingSegments = [{ length: 10 }]; // пример данных для K_occ
  const repairSegments = [
    { length: 5, coefficient: 1.2 },
    { length: 10, coefficient: 1.3 },
  ]; // пример данных для K_rem

  const totalLength = 50; // пример общей длины дороги

  const handleCalculate = () => {
    if (roadCategory && inflationIndex) {
      // Шаг 1: Расчет H_j^δ
      const Kdj = isStateRoad
        ? coefficients.state[roadCategory]
        : coefficients.local[roadCategory];
      const norm = isStateRoad ? stateNorm : localNorm;
      const Hbj = norm * Kdj * (inflationIndex as number);

      // Шаг 2: Расчет дополнительных коэффициентов
      const K_intensity = calculateKIntesity({
        roadSegments,
        totalLength,
      });
      const K_ed = calculateKed({
        roadSegments: europeanRoadSegments,
        totalLength,
        coefficient: 1.5,
      });
      const K_norm = calculateKnorm({
        roadSegments: roadSegments.map((seg) => ({
          length: seg.length,
        })),
        totalLength,
        coefficient: 1.5,
      });
      const K_occ = calculateKooc({
        lightingSegments,
        totlaLength: totalLength,
        coefficient: 2.0,
      });
      const K_rem = calculateKrem({
        repairSegments,
        totalLength,
      });

      // Шаг 3: Итоговый расчет
      const Q_delta =
        Hbj *
        selectedRegion.kdelta *
        selectedRegion.kz *
        K_intensity *
        K_ed *
        K_norm *
        K_occ *
        K_rem;

      setResult(Q_delta);
    }
  };

  return (
    <div>

      <Box p={3}>
        <Typography variant="h4" mb={3} textAlign="center" color="primary">
          Розрахунок Наведеного нормативу витрат
        </Typography>

        {/* Поля для выбора типа дороги, категории, индекса инфляции и области */}
        <Box display="flex" gap={2} mb={2}>
          {/* Поле выбора типа дороги */}
          <TextField
            select
            label="Тип доріг"
            value={isStateRoad ? "Державна" : "Міська"}
            onChange={(e) => setIsStateRoad(e.target.value === "Державна")}
            sx={{
              width: 200,
            }}
          >
            <MenuItem value="Державна">Державна</MenuItem>
            <MenuItem value="Міська">Міська</MenuItem>
          </TextField>

          {/* Поле выбора категории дороги */}
          <TextField
            select
            label="Категорія доріг"
            value={roadCategory}
            onChange={(e) => setRoadCategory(e.target.value as RoadCategory)}
            sx={{
              width: 200,
            }}
          >
            {Object.keys(coefficients.state).map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          {/* Поле ввода индекса инфляции */}
          <TextField
            label="Індекс інфляції"
            type="number"
            value={inflationIndex}
            onChange={(e) => setInflationIndex(Number(e.target.value))}
            sx={{
              width: 200,
            }}
          />

          {/* Поле выбора области */}
          <TextField
            select
            label="Область"
            value={selectedRegion.name}
            onChange={(e) =>
              setSelectedRegion(
                regions.find((region) => region.name === e.target.value) || regions[0]
              )
            }
            sx={{
              width: 200,
            }}
          >
            {regions.map((region) => (
              <MenuItem key={region.name} value={region.name}>
                {region.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Кнопка для расчета */}
        <Box mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCalculate}
            disabled={!roadCategory || !inflationIndex}
          >
            Розрахувати
          </Button>
        </Box>

        {/* Отображение результата */}
        {result !== null && (
          <Box mt={2} display="flex" justifyContent="center">
            <Box
              p={2}
              border="1px solid #1976d2"
              borderRadius="8px"
              bgcolor="#e3f2fd"
              display="inline-block"
              boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
            >
              <Typography variant="h6" color="#1976d2">
                Результат: <strong>{result.toFixed(2)} тис. грн/км </strong>
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      <BudgetCalculates />
      <WorksTable />
    </div>
  );
};

export default PageThree;
