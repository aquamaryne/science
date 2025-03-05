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

// Constants (hidden from UI)
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

const RoadFundingCalculator: React.FC = () => {
  const [hDz, setHDz] = useState<number>(604.761);
  const [hMz, setHMz] = useState<number>(360.544);
  const [kI, setKI] = useState<number>(1);

  const kD = [1.8, 1, 0.89, 0.61, 0.39];
  const kM = [1.71, 1, 0.85, 0.64, 0.4];
  const kk2 = [1.15, 1.15, 1.11, 1.04, 1];
  const kk3 = [1.15, 1.15, 1.11, 1.04, 1];
  const k4 = [2.3, 3.5, 3.9];
  const k5 = [1.01, 1.03, 1.05];

  const [selectedRegion, setSelectedRegion] = useState<number>(1);
  const [roadCategories, setRoadCategories] = useState<RoadCategory[]>([
    { id: 1, length: 28000 },
    { id: 2, length: 15300 },
    { id: 3, length: 9800 },
    { id: 4, length: 22000 },
    { id: 5, length: 12000 }
  ]);

  // Calculated values
  const [totalLength, setTotalLength] = useState<number>(0);
  const [sectionCount, setSectionCount] = useState<number>(4);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [sectionCounts, setSectionCounts] = useState<number[][]>([
    [0, 0, 5000],
    [0, 2100, 0],
    [1100, 0, 0],
    [0, 1000, 0]
  ]);
  const [trafficIntensity, setTrafficIntensity] = useState<number[][]>([
    [17000, 0, 0],
    [0, 19500, 0],
    [16000, 15500, 0],
    [16000, 30001, 0]
  ]);
  
  const [euNetworkCount, setEuNetworkCount] = useState<number>(5);
  const [euNetworkLengths, setEuNetworkLengths] = useState<number[]>([350, 1500, 220, 1500, 800]);
  const [euCoefficient, setEuCoefficient] = useState<number>(1.5);
  
  const [borderCrossingCount, setBorderCrossingCount] = useState<number>(2);
  const [borderCrossingLengths, setBorderCrossingLengths] = useState<number[]>([18, 11]);
  const [borderCoefficient, setBorderCoefficient] = useState<number>(1.5);
  
  const [lightingCount, setLightingCount] = useState<number>(2);
  const [lightingLengths, setLightingLengths] = useState<number[]>([26, 21]);
  const [lightingCoefficient, setLightingCoefficient] = useState<number>(2);
  
  const [repairedCount, setRepairedCount] = useState<number>(5);
  const [repairedLengths, setRepairedLengths] = useState<number[]>([24, 19, 7, 32, 15]);
  const [repairCoefficient, setRepairCoefficient] = useState<number>(0.5);
  
  const [kidResult, setKidResult] = useState<number | null>(null);
  const [kdeResult, setKdeResult] = useState<number | null>(null);
  const [kdmResult, setKdmResult] = useState<number | null>(null);
  const [kdoResult, setKdoResult] = useState<number | null>(null);
  const [kdrResult, setKdrResult] = useState<number | null>(null);
  
  const [calculating, setCalculating] = useState<boolean>(false);
  const [resultsAvailable, setResultsAvailable] = useState<boolean>(false);

  useEffect(() => {
    const sum = roadCategories.reduce((acc, category) => acc + category.length, 0);
    setTotalLength(sum);
  }, [roadCategories]);

  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(Number(event.target.value));
  };

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
      
      // Resize arrays if needed
      if (value > sectionCounts.length) {
        const newSections = [...sectionCounts];
        const newTraffic = [...trafficIntensity];
        
        for (let i = sectionCounts.length; i < value; i++) {
          newSections.push([0, 0, 0]);
          newTraffic.push([0, 0, 0]);
        }
        
        setSectionCounts(newSections);
        setTrafficIntensity(newTraffic);
      } else {
        setSectionCounts(sectionCounts.slice(0, value));
        setTrafficIntensity(trafficIntensity.slice(0, value));
      }
    }
  };

  // Update section count value
  const handleSectionValueChange = (row: number, col: number, value: number) => {
    const newSections = [...sectionCounts];
    if (newSections[row]) {
      newSections[row][col] = value;
      setSectionCounts(newSections);
    }
  };

  // Update traffic intensity value
  const handleTrafficValueChange = (row: number, col: number, value: number) => {
    const newTraffic = [...trafficIntensity];
    if (newTraffic[row]) {
      newTraffic[row][col] = value;
      setTrafficIntensity(newTraffic);
    }
  };

  // Handle EU network road count change
  const handleEuNetworkCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setEuNetworkCount(value);
      
      // Resize array if needed
      if (value > euNetworkLengths.length) {
        const newLengths = [...euNetworkLengths];
        for (let i = euNetworkLengths.length; i < value; i++) {
          newLengths.push(0);
        }
        setEuNetworkLengths(newLengths);
      } else {
        setEuNetworkLengths(euNetworkLengths.slice(0, value));
      }
    }
  };

  // Update EU network length
  const handleEuNetworkLengthChange = (index: number, value: number) => {
    const newLengths = [...euNetworkLengths];
    newLengths[index] = value;
    setEuNetworkLengths(newLengths);
  };

  // Handle border crossing count change
  const handleBorderCrossingCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setBorderCrossingCount(value);
      
      // Resize array if needed
      if (value > borderCrossingLengths.length) {
        const newLengths = [...borderCrossingLengths];
        for (let i = borderCrossingLengths.length; i < value; i++) {
          newLengths.push(0);
        }
        setBorderCrossingLengths(newLengths);
      } else {
        setBorderCrossingLengths(borderCrossingLengths.slice(0, value));
      }
    }
  };

  // Update border crossing length
  const handleBorderCrossingLengthChange = (index: number, value: number) => {
    const newLengths = [...borderCrossingLengths];
    newLengths[index] = value;
    setBorderCrossingLengths(newLengths);
  };

  // Handle lighting count change
  const handleLightingCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setLightingCount(value);
      
      // Resize array if needed
      if (value > lightingLengths.length) {
        const newLengths = [...lightingLengths];
        for (let i = lightingLengths.length; i < value; i++) {
          newLengths.push(0);
        }
        setLightingLengths(newLengths);
      } else {
        setLightingLengths(lightingLengths.slice(0, value));
      }
    }
  };

  // Update lighting length
  const handleLightingLengthChange = (index: number, value: number) => {
    const newLengths = [...lightingLengths];
    newLengths[index] = value;
    setLightingLengths(newLengths);
  };

  // Handle repaired count change
  const handleRepairedCountChange = (value: number) => {
    if (value > 0 && value <= 10) {
      setRepairedCount(value);
      
      // Resize array if needed
      if (value > repairedLengths.length) {
        const newLengths = [...repairedLengths];
        for (let i = repairedLengths.length; i < value; i++) {
          newLengths.push(0);
        }
        setRepairedLengths(newLengths);
      } else {
        setRepairedLengths(repairedLengths.slice(0, value));
      }
    }
  };

  // Update repaired length
  const handleRepairedLengthChange = (index: number, value: number) => {
    const newLengths = [...repairedLengths];
    newLengths[index] = value;
    setRepairedLengths(newLengths);
  };

  // Calculate all coefficients and results
  const calculateCoefficients = () => {
    setCalculating(true);
    
    setTimeout(() => {
      // Calculate Kid
      const totalSections = sectionCounts.flat().reduce((acc, val) => acc + val, 0);
      const weightedSum = sectionCounts.flat().reduce((acc, val) => acc + val, 0);
      const kidValue = (weightedSum + (totalLength - totalSections)) / totalLength;
      setKidResult(Number(kidValue.toFixed(3)));
  
      // Calculate Kde
      const totalEuLength = euNetworkLengths.reduce((acc, val) => acc + val, 0);
      const kdeValue = (totalEuLength * euCoefficient + (totalLength - totalEuLength)) / totalLength;
      setKdeResult(Number(kdeValue.toFixed(6)));
  
      // Calculate Kdm
      const totalBorderLength = borderCrossingLengths.reduce((acc, val) => acc + val, 0);
      const kdmValue = (totalBorderLength * borderCoefficient + (totalLength - totalBorderLength)) / totalLength;
      setKdmResult(Number(kdmValue.toFixed(6)));
  
      // Calculate Kdo
      const totalLightingLength = lightingLengths.reduce((acc, val) => acc + val, 0);
      const kdoValue = (totalLightingLength * lightingCoefficient + (totalLength - totalLightingLength)) / totalLength;
      setKdoResult(Number(kdoValue.toFixed(6)));
  
      // Calculate Kdr
      const totalRepairedLength = repairedLengths.reduce((acc, val) => acc + val, 0);
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

        {/* Traffic sections */}
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {repairedLengths.map((length, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={length}
                          onChange={(e) => handleRepairedLengthChange(index, Number(e.target.value))}
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
                Загальна довжина: {repairedLengths.reduce((acc, val) => acc + val, 0)} км
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
                      const baseNorm = index === 0 ? hDz : hMz;
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
                        {roadCategories.reduce((sum, category, index) => {
                          const baseNorm = index === 0 ? hDz : hMz;
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