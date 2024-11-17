import React from "react";
import { Box, Button, TextField, Typography, MenuItem, Grid, Paper } from "@mui/material";
import { calculateLocalIntensity } from "../modules/kint";
import exp from "constants";

type RoadCategory = 'I' | 'II' | 'III' | 'IV' | 'V';

const coefficients = {
    local: { 'I': 1.71, 'II': 1.00, 'III': 0.85, 'IV': 0.64, 'V': 0.40 },
};

const localNorm = 360.544;

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

const BudgetCalculates: React.FC = () => {
    const [roadData, setRoadData] = React.useState<
    { category: RoadCategory; length: number }[]
  >(
    Object.keys(coefficients.local).map((category) => ({
      category: category as RoadCategory,
      length: 0,
    }))
  );

  const [localIntensitySegments, setLocalIntensitySegments] = React.useState([
    { length: 0, intesityCoefficient: 2.3 },
  ]);
  const [totalLength, setTotalLength] = React.useState<number>(0);
  const [selectedRegion, setSelectedRegion] = React.useState(regions[0]);
  const [knom, setKnom] = React.useState<number>(1.0);
  const [result, setResult] = React.useState<number | null>(null);

  const handleRoadDataChange = (index: number, value: string) => {
    const updatedRoadData = [...roadData];
    updatedRoadData[index].length = parseFloat(value) || 0;
    setRoadData(updatedRoadData);
  };

  const handleIntensityChange = (
    index: number,
    field: 'length' | 'intesityCoefficient',
    value: string
  ) => {
    const updatedSegments = [...localIntensitySegments];
    updatedSegments[index][field] = parseFloat(value) || 0;
    setLocalIntensitySegments(updatedSegments);
  };

  const handleCalculate = () => {
    const { kz, kdelta } = selectedRegion;

    const sumHL = roadData.reduce((sum, road) => {
      const HbjM =
        localNorm *
        coefficients.local[road.category as keyof typeof coefficients.local];
      return sum + HbjM * road.length;
    }, 0);

    const localIntensity = calculateLocalIntensity({
      roadSegment: localIntensitySegments,
      totalLength,
    });

    const budget = sumHL * kz * kdelta * knom * localIntensity;

    setResult(budget);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} textAlign="center" color="primary">
        Розрахунок бюджету для місцевих доріг
      </Typography>

      {/* Горизонтальные поля */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
        {/* Выбор области */}
        <TextField
          select
          label="Область"
          value={selectedRegion.name}
          onChange={(e) =>
            setSelectedRegion(
              regions.find((region) => region.name === e.target.value) || regions[0]
            )
          }
          sx={{ width: 250, marginTop: 4 }}
          variant="outlined"
        >
          {regions.map((region) => (
            <MenuItem key={region.name} value={region.name}>
              {region.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Протяжність за категоріями */}
        {roadData.map((road, index) => (
          <Box key={road.category} display="flex" flexDirection="column" alignItems="center">
            <Typography fontWeight="bold" mb={1}>
              {road.category} категорія
            </Typography>
            <TextField
              label="Протяжність (км)"
              type="number"
              value={road.length}
              onChange={(e) => handleRoadDataChange(index, e.target.value)}
              sx={{ width: 150 }}
              variant="outlined"
            />
          </Box>
        ))}

        {/* Поле для K_{nom.M}^i */}
        <TextField
          label="Коефіцієнт"
          type="number"
          value={knom}
          onChange={(e) => setKnom(parseFloat(e.target.value) || 1.0)}
          sx={{ width: 200, marginTop: 4 }}
          variant="outlined"
        />
      </Box>

      {/* Интенсивность */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
        {localIntensitySegments.map((segment, index) => (
          <Box key={index} display="flex" flexDirection="column" alignItems="center">
            <TextField
              label="Протяжність ділянки (км)"
              type="number"
              value={segment.length}
              onChange={(e) => handleIntensityChange(index, "length", e.target.value)}
              sx={{ width: 200, mb: 2 }}
              variant="outlined"
            />
            <TextField
              label="Коефіцієнт інтенсивності"
              type="number"
              value={segment.intesityCoefficient}
              onChange={(e) =>
                handleIntensityChange(index, "intesityCoefficient", e.target.value)
              }
              sx={{ width: 200 }}
              variant="outlined"
            />
          </Box>
        ))}

        {/* Загальная длина дорог */}
        <TextField
          label="Загальна протяжність доріг"
          type="number"
          value={totalLength}
          onChange={(e) => setTotalLength(parseFloat(e.target.value) || 0)}
          sx={{ width: 300, marginBottom: 9 }}
          variant="outlined"
        />
      </Box>

      {/* Кнопка для расчета */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleCalculate}
        sx={{ py: 1.5, fontSize: "16px" }}
      >
        Розрахувати
      </Button>

      {/* Результат */}
      {result !== null && (
        <Box mt={4} textAlign="center">
          <Typography variant="h5" color="primary">
            Обсяг бюджету: <strong>{result.toFixed(2)}</strong> грн
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default BudgetCalculates;