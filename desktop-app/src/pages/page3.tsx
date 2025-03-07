import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Constants
const REGIONS = [
  "1-Крим", "2-Вінницька", "3-Волинська", "4-Дніпропетровська", 
  "5-Донецька", "6-Житомирська", "7-Закарпатська", "8-Запорізька", 
  "9-Івано-Франківська", "10-Київська", "11-Кіровоградська", "12-Луганська", 
  "13-Львівська", "14-Миколаївська", "15-Одеська", "16-Полтавська", 
  "17-Рівненська", "18-Сумська", "19-Тернопільська", "20-Харківська", 
  "21-Херсонська", "22-Хмельницька", "23-Черкаська", "24-Чернігівська", 
  "25-Чернівецька"
];

// Road category interface
interface RoadCategory {
  id: number;
  length: number;
}

// Section interface to simplify data structure
interface Section {
  id: number;
  length: number;
  value: number;
}

const RoadFundingCalculator: React.FC = () => {
  // Basic inputs
  const [hDz, setHDz] = useState<number>(604.761);
  const [hMz, setHMz] = useState<number>(360.544);
  const [kI, setKI] = useState<number>(1);

  // Coefficient arrays - now used in calculations
  const kD = [1.8, 1, 0.89, 0.61, 0.39];
  const kM = [1.71, 1, 0.85, 0.64, 0.4];
  const kk2 = [1.15, 1.15, 1.11, 1.04, 1];
  const kk3 = [1.15, 1.15, 1.11, 1.04, 1];
  const k4 = [2.3, 3.5, 3.9];
  const k5 = [1.01, 1.03, 1.05];

  // Region selection
  const [selectedRegion, setSelectedRegion] = useState<number>(1);

  // Road categories
  const [roadCategories, setRoadCategories] = useState<RoadCategory[]>([
    { id: 1, length: 28000 },
    { id: 2, length: 15300 },
    { id: 3, length: 9800 },
    { id: 4, length: 22000 },
    { id: 5, length: 12000 }
  ]);
  const [totalLength, setTotalLength] = useState<number>(0);

  // Traffic sections - simplified structure
  const [sectionCount, setSectionCount] = useState<number>(4);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [traffics, setTraffics] = useState<Section[]>([
    { id: 1, length: 5000, value: 17000 },
    { id: 2, length: 2100, value: 19500 },
    { id: 3, length: 1100, value: 16000 },
    { id: 4, length: 1000, value: 30000 }
  ]);
  
  // EU Network roads
  const [euNetworkCount, setEuNetworkCount] = useState<number>(5);
  const [euNetworks, setEuNetworks] = useState<Section[]>([
    { id: 1, length: 350, value: 0 },
    { id: 2, length: 1500, value: 0 },
    { id: 3, length: 220, value: 0 },
    { id: 4, length: 1500, value: 0 },
    { id: 5, length: 800, value: 0 }
  ]);
  const [euCoefficient, setEuCoefficient] = useState<number>(1.5);
  
  // Border crossing roads
  const [borderCrossingCount, setBorderCrossingCount] = useState<number>(2);
  const [borderCrossings, setBorderCrossings] = useState<Section[]>([
    { id: 1, length: 18, value: 0 },
    { id: 2, length: 11, value: 0 }
  ]);
  const [borderCoefficient, setBorderCoefficient] = useState<number>(1.5);
  
  // Roads with lighting
  const [lightingCount, setLightingCount] = useState<number>(2);
  const [lightings, setLightings] = useState<Section[]>([
    { id: 1, length: 26, value: 0 },
    { id: 2, length: 21, value: 0 }
  ]);
  const [lightingCoefficient, setLightingCoefficient] = useState<number>(2);
  
  // Repaired roads
  const [repairedCount, setRepairedCount] = useState<number>(5);
  const [repaired, setRepaired] = useState<Section[]>([
    { id: 1, length: 24, value: 0 },
    { id: 2, length: 19, value: 0 },
    { id: 3, length: 7, value: 0 },
    { id: 4, length: 32, value: 0 },
    { id: 5, length: 15, value: 0 }
  ]);
  const [repairCoefficient, setRepairCoefficient] = useState<number>(0.5);
  
  // Results
  const [kidResult, setKidResult] = useState<number | null>(null);
  const [kdeResult, setKdeResult] = useState<number | null>(null);
  const [kdmResult, setKdmResult] = useState<number | null>(null);
  const [kdoResult, setKdoResult] = useState<number | null>(null);
  const [kdrResult, setKdrResult] = useState<number | null>(null);
  
  const [calculating, setCalculating] = useState<boolean>(false);
  const [resultsAvailable, setResultsAvailable] = useState<boolean>(false);

  // Calculate total road length
  useEffect(() => {
    const sum = roadCategories.reduce((acc, category) => acc + category.length, 0);
    setTotalLength(sum);
  }, [roadCategories]);

  // Region selection handler
  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(Number(event.target.value));
  };

  // Road category change handler
  const handleRoadCategoryChange = (id: number, value: number) => {
    setRoadCategories(prevCategories => 
      prevCategories.map(category => 
        category.id === id ? { ...category, length: value } : category
      )
    );
  };

  // Update traffic section count
  const handleSectionCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setSectionCount(value);
      
      // Resize array if needed
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

  // Generic section handler for all section types
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

  // Handle section count changes for all section types
  const handleGenericCountChange = (
    count: number,
    setCount: React.Dispatch<React.SetStateAction<number>>,
    sections: Section[],
    setSections: React.Dispatch<React.SetStateAction<Section[]>>
  ) => {
    if (count > 0 && count <= 10) {
      setCount(count);
      
      // Resize array if needed
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

  // Calculate all coefficients and results
  const calculateCoefficients = () => {
    setCalculating(true);
    
    setTimeout(() => {
      // Calculate Kid - now using the coefficient arrays
      let weightedSectionLength = 0;
      let totalTrafficLength = 0;
      
      // Apply traffic intensity and road category coefficients
      traffics.forEach(traffic => {
        if (traffic.length > 0) {
          // Get intensity coefficient based on traffic value
          let intensityCoef = 1;
          if (traffic.value > 25000) {
            intensityCoef = k4[2]; // High intensity
          } else if (traffic.value > 15000) {
            intensityCoef = k4[1]; // Medium intensity
          } else if (traffic.value > 5000) {
            intensityCoef = k4[0]; // Low intensity
          }
          
          // Apply category coefficient based on road type
          const categoryIndex = Math.min(categoryId - 1, 4);
          const categoryCoef = categoryId <= 2 ? kD[categoryIndex] : kM[categoryIndex];
          
          weightedSectionLength += traffic.length * intensityCoef * categoryCoef;
          totalTrafficLength += traffic.length;
        }
      });
      
      // Apply region climate coefficient
      const climateCoef = k5[selectedRegion % 3];
      
      // Apply structure coefficient based on road category
      const structureCoef = kk2[Math.min(categoryId - 1, 4)];
      
      // Apply region-specific coefficient
      const regionCoef = kk3[Math.min(selectedRegion % 5, 4)];
      
      // For the remaining length, apply base coefficients
      const remainingLength = totalLength - totalTrafficLength;
      const baseCoef = categoryId <= 2 ? kD[0] : kM[0];
      
      const kidValue = ((weightedSectionLength + (remainingLength * baseCoef)) / totalLength) * 
                      climateCoef * structureCoef * regionCoef * kI;
                      
      setKidResult(Number(kidValue.toFixed(3)));
  
      // Calculate Kde - EU network coefficient
      const totalEuLength = euNetworks.reduce((acc, section) => acc + section.length, 0);
      const kdeValue = (totalEuLength * euCoefficient + (totalLength - totalEuLength)) / totalLength;
      setKdeResult(Number(kdeValue.toFixed(6)));
  
      // Calculate Kdm - Border crossing coefficient
      const totalBorderLength = borderCrossings.reduce((acc, section) => acc + section.length, 0);
      const kdmValue = (totalBorderLength * borderCoefficient + (totalLength - totalBorderLength)) / totalLength;
      setKdmResult(Number(kdmValue.toFixed(6)));
  
      // Calculate Kdo - Lighting coefficient
      const totalLightingLength = lightings.reduce((acc, section) => acc + section.length, 0);
      const kdoValue = (totalLightingLength * lightingCoefficient + (totalLength - totalLightingLength)) / totalLength;
      setKdoResult(Number(kdoValue.toFixed(6)));
  
      // Calculate Kdr - Repair coefficient
      const totalRepairedLength = repaired.reduce((acc, section) => acc + section.length, 0);
      const kdrValue = (totalRepairedLength * repairCoefficient + (totalLength - totalRepairedLength)) / totalLength;
      setKdrResult(Number(kdrValue.toFixed(5)));
      
      setResultsAvailable(true);
      setCalculating(false);
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 500); // Simulate calculation time
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Визначення обсягу фінансування автомобільних доріг
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4 }}>
          Розрахунок фінансування будівництва, поточного ремонту та експлуатаційного утримання
        </Typography>

        {/* Initial data entry */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Вихідні дані
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
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

        {/* Region selection */}
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

        {/* Road categories */}
        <Accordion defaultExpanded sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Довжина автомобільних доріг за категоріями
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
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
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                  Загальна протяжність: {totalLength} км
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Traffic sections - now with proper handlers */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Ділянки автомобільних доріг за інтенсивністю руху
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
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
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Загальна довжина відремонтованих доріг: {repaired.reduce((acc, section) => acc + section.length, 0)} км
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Calculate button */}
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

        {/* Results section - only shown after calculation */}
        {resultsAvailable && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="results-section">
            <Typography variant="h5" gutterBottom align="center">
              Результати розрахунків
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Загальна довжина автомобільних доріг: {totalLength} км
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Коефіцієнти:</Typography>
                <Divider sx={{ my: 2 }} />
              </Grid>
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
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  <strong>Загальний коефіцієнт:</strong> {(kidResult! * kdeResult! * kdmResult! * kdoResult! * kdrResult!).toFixed(6)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
              </Grid>
            </Grid>

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
                    {roadCategories.map((category, index) => {
                      const baseNorm = category.id <= 2 ? hDz : hMz;
                      const totalCoeff = kidResult! * kdeResult! * kdmResult! * kdoResult! * kdrResult!;
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
                    <TableRow>
                      <TableCell colSpan={4} align="right"><strong>Загальна сума фінансування:</strong></TableCell>
                      <TableCell>
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

export default RoadFundingCalculator;