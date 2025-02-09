import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

// Типы данных
type RoadCategory = 'I' | 'II' | 'III' | 'IV' | 'V';
type Region = 'Київська' | 'Івано-Франківська' | 'Закарпатська' | 'Львівська' | 'Інші';

// Коэффициенты из приложений методики
const MOUNTAIN_COEFFICIENTS: Record<Region, number> = {
  'Київська': 1.15,
  'Івано-Франківська': 1.13,
  'Закарпатська': 1.11,
  'Львівська': 1.04,
  'Інші': 1.00
};

const CATEGORY_COEFFICIENTS = {
  state: { I: 1.8, II: 1.0, III: 0.89, IV: 0.61, V: 0.39 },
  local: { I: 1.71, II: 1.0, III: 0.85, IV: 0.64, V: 0.40 }
};

const INTENSITY_COEFFICIENTS = [
  { min: 15000, max: 20000, value: 2.3 },
  { min: 20001, max: 30000, value: 3.5 },
  { min: 30001, max: Infinity, value: 3.9 }
];

const CRITICAL_INFRASTRUCTURE_COEFFICIENTS = [
  { min: 1, max: 5, value: 1.01 },
  { min: 5, max: 10, value: 1.03 },
  { min: 10, max: Infinity, value: 1.05 }
];

export default function PageThree() {
  const [region, setRegion] = useState<Region>('Київська');
  const [roadType, setRoadType] = useState<'state' | 'local'>('state');
  const [category, setCategory] = useState<RoadCategory>('II');
  const [length, setLength] = useState<string>('');
  const [intensity, setIntensity] = useState<string>('');
  const [hasLighting, setHasLighting] = useState<boolean>(false);
  const [criticalObjects, setCriticalObjects] = useState<string>('');
  const [recentRepairs, setRecentRepairs] = useState<boolean>(false);
  const [nearBorderCheckpoint, setNearBorderCheckpoint] = useState<boolean>(false);
  const [results, setResults] = useState<number[]>([]);

  // Расчет норматива
  const calculateNormative = () => {
    const baseNormative = roadType === 'state' ? 604.761 : 360.544;
    const categoryCoeff = roadType === 'state' 
      ? CATEGORY_COEFFICIENTS.state[category]
      : CATEGORY_COEFFICIENTS.local[category];
    
    return baseNormative * categoryCoeff;
  };

  // Расчет коэффициента интенсивности
  const calculateIntensityCoeff = () => {
    const traffic = parseInt(intensity) || 0;
    const intensityCoeff = INTENSITY_COEFFICIENTS.find(
      range => traffic >= range.min && traffic <= range.max
    )?.value || 1.0;
    return intensityCoeff;
  };

  // Расчет коэффициента критической инфраструктуры
  const calculateCriticalInfrastructureCoeff = () => {
    const criticalCount = parseInt(criticalObjects) || 0;
    const criticalCoeff = CRITICAL_INFRASTRUCTURE_COEFFICIENTS.find(
      range => criticalCount >= range.min && criticalCount <= range.max
    )?.value || 1.0;
    return criticalCoeff;
  };

  // Расчет коэффициента освещения
  const calculateLightingCoeff = () => {
    return hasLighting ? 2.0 : 1.0;
  };

  // Расчет коэффициента ремонта
  const calculateRepairCoeff = () => {
    return recentRepairs ? 0.5 : 1.0;
  };

  // Расчет коэффициента пунктов пропуска
  const calculateBorderCheckpointCoeff = () => {
    return nearBorderCheckpoint ? 1.5 : 1.0;
  };

  const handleCalculate = () => {
    const normative = calculateNormative();
    const intensityCoeff = calculateIntensityCoeff();
    const criticalCoeff = calculateCriticalInfrastructureCoeff();
    const lightingCoeff = calculateLightingCoeff();
    const repairCoeff = calculateRepairCoeff();
    const borderCheckpointCoeff = calculateBorderCheckpointCoeff();
    const mountainCoeff = MOUNTAIN_COEFFICIENTS[region];

    const total = normative * (parseFloat(length) || 0) * intensityCoeff * criticalCoeff * 
      lightingCoeff * repairCoeff * borderCheckpointCoeff * mountainCoeff;
    
    setResults([...results, total]);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Розрахунок експлуатаційного утримання доріг
        </Typography>

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Тип дороги</InputLabel>
            <Select
              value={roadType}
              onChange={(e) => setRoadType(e.target.value as 'state' | 'local')}
            >
              <MenuItem value="state">Державного значення</MenuItem>
              <MenuItem value="local">Місцевого значення</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Область</InputLabel>
            <Select
              value={region}
              onChange={(e: SelectChangeEvent<Region>) => setRegion(e.target.value as Region)}
            >
              {Object.keys(MOUNTAIN_COEFFICIENTS).map((reg) => (
                <MenuItem key={reg} value={reg}>{reg}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Категорія дороги</InputLabel>
            <Select
              value={category}
              onChange={(e: SelectChangeEvent<RoadCategory>) => 
                setCategory(e.target.value as RoadCategory)}
            >
              {['I', 'II', 'III', 'IV', 'V'].map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Протяжність дороги (км)"
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />

          <TextField
            label="Інтенсивність руху (авт/добу)"
            type="number"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
          />

          <TextField
            label="Кількість критичних об'єктів"
            type="number"
            value={criticalObjects}
            onChange={(e) => setCriticalObjects(e.target.value)}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={hasLighting}
                onChange={(e) => setHasLighting(e.target.checked)}
              />
            }
            label="Наявність освітлення"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={recentRepairs}
                onChange={(e) => setRecentRepairs(e.target.checked)}
              />
            }
            label="Ремонт у останні 5 років"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={nearBorderCheckpoint}
                onChange={(e) => setNearBorderCheckpoint(e.target.checked)}
              />
            }
            label="Ділянка біля пункту пропуску"
          />

          <Button 
            variant="contained" 
            onClick={handleCalculate}
            sx={{ mt: 2 }}
          >
            Розрахувати
          </Button>
        </Box>

        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>№</TableCell>
                  <TableCell>Сума (тис. грн)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{(result * 1000).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}