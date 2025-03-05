import { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Container,
  CssBaseline,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';

// Constants from all methodology applications
const CATEGORY_COEFFICIENTS = {
  'I': { state: 1.80, local: 1.71 },
  'II': { state: 1.00, local: 1.00 },
  'III': { state: 0.89, local: 0.85 },
  'IV': { state: 0.61, local: 0.64 },
  'V': { state: 0.39, local: 0.40 }
};

// Add 'Київська' to the region coefficients to match your usage
const MOUNTAIN_COEFFICIENTS = {
  'Автономна Республіка Крим': 1.15,
  'Івано-Франківська': 1.13,
  'Закарпатська': 1.11,
  'Львівська': 1.04,
  'Чернівецька': 1.04,
  'Київська': 1.00, // Added this entry
  'Інші': 1.00
};

// Ensure this constant has the same keys as MOUNTAIN_COEFFICIENTS
const OPERATION_CONDITIONS_COEFF = {
  'Автономна Республіка Крим': 1.15,
  'Київська': 1.15, // This entry already existed
  'Івано-Франківська': 1.13,
  'Закарпатська': 1.11,
  'Львівська': 1.04,
  'Чернівецька': 1.04,
  'Інші': 1.00
};

const INTENSITY_COEFFICIENTS = [
  { min: 15000, max: 20000, value: 2.3 },
  { min: 20001, max: 30000, value: 3.5 },
  { min: 30001, value: 3.9 }
];

const CRITICAL_INFRASTRUCTURE_COEFF = [
  { objects: 1, value: 1.01 },
  { objects: 5, value: 1.03 },
  { objects: 10, value: 1.05 }
];

// Update the type definition to ensure consistency
type Region = keyof typeof MOUNTAIN_COEFFICIENTS;

interface ProjectData {
  category: keyof typeof CATEGORY_COEFFICIENTS;
  length: number;
  region: Region;
  intensity: number;
  criticalObjects: number;
  isInternational: boolean;
  isPresidentialOrder: boolean;
  isDefense: boolean;
}

export default function PageFive() {
  const [project, setProject] = useState<ProjectData>({
    category: 'II',
    length: 0,
    region: 'Київська', // Now this is valid
    intensity: 0,
    criticalObjects: 0,
    isInternational: false,
    isPresidentialOrder: false,
    isDefense: false
  });

  const [result, setResult] = useState<{
    funding: number;
    coefficients: Record<string, number>;
    priority: number;
    errors: string[];
  } | null>(null);

  const calculateFunding = () => {
    const errors = [];
    if (project.length <= 0) errors.push('Некоректна довжина дороги');
    if (project.intensity < 0) errors.push('Некоректна інтенсивність');
    if (errors.length > 0) return setResult({ funding: 0, coefficients: {}, priority: 0, errors });

    // Base calculation based on formula from section III
    const baseRate = 604761; // Standard rate for category II (UAH/km)
    
    const categoryCoeff = CATEGORY_COEFFICIENTS[project.category].state;
    const mountainCoeff = MOUNTAIN_COEFFICIENTS[project.region];
    const operationCoeff = OPERATION_CONDITIONS_COEFF[project.region];
    
    // Intensity adjustment (Appendix 7)
    const intensityCoeff = INTENSITY_COEFFICIENTS.find(c => 
      project.intensity >= c.min && (!c.max || project.intensity <= c.max)
    )?.value || 1;

    // Critical infrastructure adjustment (Appendix 8)
    const infraCoeff = CRITICAL_INFRASTRUCTURE_COEFF.reduce((acc, curr) => 
      project.criticalObjects >= curr.objects ? curr.value : acc, 1);

    // Priorities from section V
    let priorityMultiplier = 1;
    if (project.isPresidentialOrder) priorityMultiplier *= 1.5;
    if (project.isInternational) priorityMultiplier *= 1.3;
    if (project.isDefense) priorityMultiplier *= 1.2;

    const funding = baseRate *
      categoryCoeff *
      mountainCoeff *
      operationCoeff *
      intensityCoeff *
      infraCoeff *
      priorityMultiplier *
      project.length;

    // Priority calculation
    let priority = 0;
    if (project.isPresidentialOrder) priority += 4;
    if (project.isInternational) priority += 3;
    if (project.intensity > 10000) priority += 2;
    if (project.region === 'Київська') priority += 1; // Now this comparison is valid

    setResult({
      funding: Math.round(funding),
      coefficients: {
        categoryCoeff,
        mountainCoeff,
        operationCoeff,
        intensityCoeff,
        infraCoeff,
        priorityMultiplier
      },
      priority: Math.min(10, priority),
      errors: []
    });
  };

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box sx={{ mt: 4, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Розрахунок фінансування доріг
        </Typography>

        {/* Input form */}
        <Box component="form" sx={{ display: 'grid', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Категорія дороги</InputLabel>
            <Select
              value={project.category}
              onChange={e => setProject({...project, category: e.target.value as any})}
            >
              {Object.keys(CATEGORY_COEFFICIENTS).map(cat => (
                <MenuItem key={cat} value={cat}>Категорія {cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Протяжність (км)"
            type="number"
            value={project.length}
            onChange={e => setProject({...project, length: Number(e.target.value)})}
          />

          <FormControl fullWidth>
            <InputLabel>Регіон</InputLabel>
            <Select
              value={project.region}
              onChange={e => setProject({...project, region: e.target.value as Region})}
            >
              {Object.keys(MOUNTAIN_COEFFICIENTS).map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Інтенсивність руху (авт/добу)"
            type="number"
            value={project.intensity}
            onChange={e => setProject({...project, intensity: Number(e.target.value)})}
          />

          <TextField
            label="Кількість критичних об'єктів"
            type="number"
            value={project.criticalObjects}
            onChange={e => setProject({...project, criticalObjects: Number(e.target.value)})}
          />

          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControlLabel
              control={<Checkbox 
                checked={project.isInternational}
                onChange={e => setProject({...project, isInternational: e.target.checked})}
              />}
              label="Міжнародна дорога"
            />
            <FormControlLabel
              control={<Checkbox 
                checked={project.isPresidentialOrder}
                onChange={e => setProject({...project, isPresidentialOrder: e.target.checked})}
              />}
              label="Президентський указ"
            />
            <FormControlLabel
              control={<Checkbox 
                checked={project.isDefense}
                onChange={e => setProject({...project, isDefense: e.target.checked})}
              />}
              label="Оборонне значення"
            />
          </Box>

          <Button 
            variant="contained" 
            size="large" 
            onClick={calculateFunding}
            sx={{ py: 2 }}
          >
            Розрахувати
          </Button>
        </Box>

        {/* Results */}
        {result && (
          <Box sx={{ mt: 4 }}>
            {result.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {result.errors.join(', ')}
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Результати розрахунків:
            </Typography>

            <Table sx={{ mb: 3 }}>
              <TableBody>
                <TableRow>
                  <TableCell>Категорія (коеф.)</TableCell>
                  <TableCell>{project.category} ({result.coefficients.categoryCoeff})</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Гірський коеф.</TableCell>
                  <TableCell>{result.coefficients.mountainCoeff}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Умови експлуатації</TableCell>
                  <TableCell>{result.coefficients.operationCoeff}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Коеф. інтенсивності</TableCell>
                  <TableCell>{result.coefficients.intensityCoeff}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Критична інфраструктура</TableCell>
                  <TableCell>{result.coefficients.infraCoeff}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Пріоритетний множник</TableCell>
                  <TableCell>{result.coefficients.priorityMultiplier}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><b>Загальний обсяг</b></TableCell>
                  <TableCell><b>{result.funding.toLocaleString()} грн</b></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Рівень пріоритетності</TableCell>
                  <TableCell>{result.priority}/10</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </Container>
  );
}