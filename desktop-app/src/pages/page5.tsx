import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Alert,
  AlertTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowRight as ArrowRightIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AddRoadOutlined as RoadIcon,
  AnalyticsOutlined as AnalyticsIcon,
  AssessmentOutlined as AssessmentIcon
} from '@mui/icons-material';

// TypeScript interfaces
interface Vehicle {
  type: string;
  count: number;
  before: number;
  after: number;
}

interface Criterion {
  name: string;
  checked: boolean;
  weight: number;
}

interface Benefit {
  vehicleType: string;
  annualBenefit: number;
}

interface Cost {
  year: number;
  cost: number;
  type: string;
}

interface Results {
  enpv: number;
  eirr: number;
  bcr: number;
  priorityScore: number;
  isViable: boolean;
  priority: number;
  benefits: Benefit[];
  costs: Cost[];
}

const RoadFundingDistribution: React.FC = () => {
  // Active step for navigation
  const [activeStep, setActiveStep] = useState(0);
  
  // Project state
  const [projectName, setProjectName] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('state'); // 'state' or 'local'
  const [projectLength, setProjectLength] = useState<number>(0);
  const [projectCost, setProjectCost] = useState<number>(0);
  const [constructionPeriod, setConstructionPeriod] = useState<number>(2);
  const [socialDiscountRate, setSocialDiscountRate] = useState<number>(5);
  
  // Traffic data
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { type: 'Легкові автомобілі', count: 2000, before: 80, after: 100 },
    { type: 'Вантажні автомобілі', count: 500, before: 60, after: 75 },
    { type: 'Автобуси', count: 200, before: 70, after: 85 }
  ]);
  
  // Criteria
  const [criteria, setCriteria] = useState<Criterion[]>([
    { name: 'Міжнародний транспортний коридор', checked: false, weight: 5 },
    { name: 'Дорога оборонного значення', checked: false, weight: 10 },
    { name: 'Ліквідація місць концентрації ДТП', checked: false, weight: 8 },
    { name: 'Затверджена проектна документація', checked: false, weight: 3 },
    { name: 'Високий ступінь готовності (>70%)', checked: false, weight: 4 },
    { name: 'Обхід великого міста', checked: false, weight: 6 }
  ]);
  
  // Results
  const [results, setResults] = useState<Results>({
    enpv: 0,
    eirr: 0,
    bcr: 0,
    priorityScore: 0,
    isViable: false,
    priority: 0,
    benefits: [],
    costs: []
  });

  const [showResults, setShowResults] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  
  // Steps for the navigation
  interface StepInfo {
    label: string;
    icon: React.ReactNode;
  }
  
  const steps: StepInfo[] = [
    { label: 'Деталі ділянки дороги', icon: <RoadIcon /> },
    { label: 'Оцінка стану', icon: <AnalyticsIcon /> },
    { label: 'Результати', icon: <AssessmentIcon /> }
  ];
  
  // Handle step change
  const handleStepChange = (step: number): void => {
    setActiveStep(step);
  };
  
  // Add vehicle type
  const addVehicleType = (): void => {
    setVehicles([...vehicles, { type: 'Новий тип', count: 0, before: 60, after: 70 }]);
  };
  
  // Remove vehicle type
  const removeVehicleType = (index: number): void => {
    const newVehicles = [...vehicles];
    newVehicles.splice(index, 1);
    setVehicles(newVehicles);
  };
  
  // Update vehicle data
  const updateVehicleData = (index: number, field: keyof Vehicle, value: number | string): void => {
    const newVehicles = [...vehicles];
    newVehicles[index][field] = value as never; // Type assertion to handle both string and number
    setVehicles(newVehicles);
  };
  
  // Update criteria
  const updateCriteria = (index: number, checked: boolean): void => {
    const newCriteria = [...criteria];
    newCriteria[index].checked = checked;
    setCriteria(newCriteria);
  };
  
  // Calculate results
  const calculateResults = () => {
    // Calculate annual benefits from time savings
    const calculateAnnualBenefits = () => {
      // Value of time (грн per hour)
      const valueOfTime = 150;
      
      // Calculate time savings for each vehicle type
      const benefits = vehicles.map(vehicle => {
        // Time before (hours) = length / speed before
        const timeBefore = projectLength / vehicle.before;
        
        // Time after (hours) = length / speed after
        const timeAfter = projectLength / vehicle.after;
        
        // Time savings (hours)
        const timeSavings = timeBefore - timeAfter;
        
        // Annual time savings (hours) = time savings * count * 365
        const annualTimeSavings = timeSavings * vehicle.count * 365;
        
        // Annual benefits (грн) = annual time savings * value of time
        const annualBenefit = annualTimeSavings * valueOfTime;
        
        return {
          vehicleType: vehicle.type,
          annualBenefit
        };
      });
      
      // Add other benefits (accident reduction, environmental benefits, etc.)
      // For simplicity, assume 10% of time savings
      const additionalBenefits = benefits.reduce((sum, b) => sum + b.annualBenefit, 0) * 0.1;
      
      benefits.push({
        vehicleType: 'Додаткові переваги',
        annualBenefit: additionalBenefits
      });
      
      return benefits;
    };
    
    // Calculate annual costs
    const calculateAnnualCosts = () => {
      // Distribute construction costs over the construction period
      const annualConstructionCost = projectCost / constructionPeriod;
      
      // Annual maintenance costs (assumed to be 2% of construction costs)
      const annualMaintenanceCost = projectCost * 0.02;
      
      // Create cost array for the evaluation period (20 years)
      const costs = [];
      
      for (let year = 0; year < 20; year++) {
        if (year < constructionPeriod) {
          costs.push({
            year,
            cost: annualConstructionCost,
            type: 'Будівництво'
          });
        } else {
          costs.push({
            year,
            cost: annualMaintenanceCost,
            type: 'Утримання'
          });
        }
      }
      
      return costs;
    };
    
    // Calculate ENPV, EIRR, BCR
    const calculateEconomicIndicators = (benefits: Benefit[], costs: Cost[]) => {
      // Calculate PV of benefits
      let pvBenefits = 0;
      
      // Annual benefit (sum of all vehicle types)
      const annualBenefit = benefits.reduce((sum, b) => sum + b.annualBenefit, 0);
      
      // Calculate PV of benefits for 20 years
      for (let year = constructionPeriod; year < 20; year++) {
        pvBenefits += annualBenefit / Math.pow(1 + socialDiscountRate/100, year);
      }
      
      // Calculate PV of costs
      let pvCosts = 0;
      
      costs.forEach(c => {
        pvCosts += c.cost / Math.pow(1 + socialDiscountRate/100, c.year);
      });
      
      // Calculate ENPV
      const enpv = pvBenefits - pvCosts;
      
      // Calculate BCR
      const bcr = pvBenefits / pvCosts;
      
      // Calculate EIRR
      // Simple approximation for EIRR (iterative search for discount rate that makes ENPV = 0)
      let eirr = socialDiscountRate;
      let step = 5;
      let test_enpv = enpv;
      
      // 10 iterations maximum to approximate EIRR
      for (let i = 0; i < 10 && Math.abs(test_enpv) > 1000; i++) {
        if (test_enpv > 0) {
          eirr += step;
        } else {
          eirr -= step;
          step /= 2;
        }
        
        let test_pvBenefits = 0;
        for (let year = constructionPeriod; year < 20; year++) {
          test_pvBenefits += annualBenefit / Math.pow(1 + eirr/100, year);
        }
        
        let test_pvCosts = 0;
        costs.forEach(c => {
          test_pvCosts += c.cost / Math.pow(1 + eirr/100, c.year);
        });
        
        test_enpv = test_pvBenefits - test_pvCosts;
      }
      
      return {
        enpv,
        eirr,
        bcr,
        isViable: enpv > 0 && eirr > socialDiscountRate
      };
    };
    
    // Calculate priority score based on criteria
    const calculatePriorityScore = () => {
      return criteria
        .filter(c => c.checked)
        .reduce((score, c) => score + c.weight, 0);
    };
    
    // Get benefits and costs
    const benefits = calculateAnnualBenefits();
    const costs = calculateAnnualCosts();
    
    // Calculate economic indicators
    const indicators = calculateEconomicIndicators(benefits, costs);
    
    // Calculate priority score
    const priorityScore = calculatePriorityScore();
    
    // Determine priority level
    let priority = 0;
    if (indicators.isViable) {
      if (priorityScore >= 15) {
        priority = 1; // Highest priority
      } else if (priorityScore >= 10) {
        priority = 2;
      } else if (priorityScore >= 5) {
        priority = 3;
      } else {
        priority = 4;
      }
    }
    
    // Update results
    setResults({
      ...indicators,
      priorityScore,
      priority,
      benefits,
      costs
    });
    
    setShowResults(true);
    setActiveStep(2); // Move to the results step
  };

  // Render the step content based on activeStep
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Road details step
        return (
          <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Основна інформація про проект
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Назва проекту"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  variant="outlined"
                  placeholder="Введіть назву проекту"
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Тип дороги</InputLabel>
                  <Select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    label="Тип дороги"
                  >
                    <MenuItem value="state">Дорога державного значення</MenuItem>
                    <MenuItem value="local">Дорога місцевого значення</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Протяжність ділянки (км)"
                  type="number"
                  value={projectLength}
                  onChange={(e) => setProjectLength(Number(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 0, step: 0.1 }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Вартість проекту (тис. грн)"
                  type="number"
                  value={projectCost}
                  onChange={(e) => setProjectCost(Number(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 0, step: 1000 }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Період будівництва (років)"
                  type="number"
                  value={constructionPeriod}
                  onChange={(e) => setConstructionPeriod(Number(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 1, max: 5 }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Соціальна ставка дисконтування (%)"
                  type="number"
                  value={socialDiscountRate}
                  onChange={(e) => setSocialDiscountRate(Number(e.target.value))}
                  variant="outlined"
                  inputProps={{ min: 1, max: 15, step: 0.5 }}
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleStepChange(1)}
              >
                Наступний крок
              </Button>
            </Box>
          </Paper>
        );
      
      case 1: // Assessment step
        return (
          <>
            {/* Traffic information */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Інформація про транспортні потоки
              </Typography>
              
              {vehicles.map((vehicle, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }} elevation={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1">{vehicle.type}</Typography>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => removeVehicleType(index)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Кількість (авт./добу)"
                        type="number"
                        value={vehicle.count}
                        onChange={(e) => updateVehicleData(index, 'count', Number(e.target.value))}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Швидкість до (км/год)"
                        type="number"
                        value={vehicle.before}
                        onChange={(e) => updateVehicleData(index, 'before', Number(e.target.value))}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 10, max: 130 }}
                      />
                    </Grid>
                    
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Швидкість після (км/год)"
                        type="number"
                        value={vehicle.after}
                        onChange={(e) => updateVehicleData(index, 'after', Number(e.target.value))}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 10, max: 130 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              
              <Button 
                startIcon={<AddIcon />} 
                onClick={addVehicleType}
                color="primary"
              >
                Додати тип транспорту
              </Button>
            </Paper>
            
            {/* Criteria */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Критерії пріоритетності
              </Typography>
              
              <Grid container>
                {criteria.map((criterion, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={criterion.checked}
                          onChange={(e) => updateCriteria(index, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={`${criterion.name} (вага: ${criterion.weight})`}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box mt={3} display="flex" justifyContent="space-between">
                <Button 
                  variant="outlined" 
                  onClick={() => handleStepChange(0)}
                >
                  Назад
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CalculateIcon />}
                  onClick={calculateResults}
                >
                  Розрахувати показники
                </Button>
              </Box>
            </Paper>
          </>
        );
      
      case 2: // Results step
        return (
          <>
            {showResults ? (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <AlertTitle>Результати оцінки проекту</AlertTitle>
                  Проект: {projectName} ({projectType === 'state' ? 'дорога державного значення' : 'дорога місцевого значення'})
                </Alert>
                
                <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                  <Typography variant="h6" gutterBottom>
                    Економічні показники
                  </Typography>
                  
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>ENPV (тис. грн):</TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight="bold" 
                            color={results.enpv > 0 ? 'success.main' : 'error.main'}
                          >
                            {results.enpv.toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>EIRR (%):</TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight="bold" 
                            color={results.eirr > socialDiscountRate ? 'success.main' : 'error.main'}
                          >
                            {results.eirr.toLocaleString('uk-UA', { maximumFractionDigits: 1 })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>BCR:</TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight="bold" 
                            color={results.bcr > 1 ? 'success.main' : 'error.main'}
                          >
                            {results.bcr.toLocaleString('uk-UA', { maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Бал пріоритетності:</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {results.priorityScore}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>Економічна доцільність:</TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight="bold" 
                            color={results.isViable ? 'success.main' : 'error.main'}
                          >
                            {results.isViable ? 'Так' : 'Ні'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
                
                <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                  <Typography variant="h6" gutterBottom>
                    Оцінка пріоритетності
                  </Typography>
                  
                  {results.isViable ? (
                    <>
                      <Box textAlign="center" mb={2}>
                        <Typography variant="h3" color="primary" fontWeight="bold">
                          {results.priority}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Пріоритет ({results.priority === 1 ? 'найвищий' : results.priority === 2 ? 'високий' : results.priority === 3 ? 'середній' : 'низький'})
                        </Typography>
                      </Box>
                      
                      <Alert severity="info">
                        <AlertTitle>Відповідає критеріям розділу 5.{projectType === 'state' ? '1' : '2'} Методики:</AlertTitle>
                        <List>
                          {criteria
                            .filter(c => c.checked)
                            .map((c, index) => (
                              <ListItem key={index} disableGutters>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <ArrowRightIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={c.name} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))}
                        </List>
                      </Alert>
                    </>
                  ) : (
                    <Alert severity="warning">
                      <AlertTitle>Проект економічно недоцільний</AlertTitle>
                      <Typography variant="body2">
                        Проект не відповідає критеріям економічної ефективності згідно з пунктом 5.3 Методики.
                        Рекомендується переглянути параметри проекту або розглянути альтернативні варіанти.
                      </Typography>
                    </Alert>
                  )}
                </Paper>
                
                <Accordion 
                  expanded={expandedDetails}
                  onChange={() => setExpandedDetails(!expandedDetails)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Детальна інформація про розрахунки
                    </Typography>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Stack spacing={3}>
                      {/* Benefits */}
                      <div>
                        <Typography variant="subtitle2" gutterBottom>
                          Щорічні вигоди
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Тип транспорту</TableCell>
                                <TableCell align="right">Сума (тис. грн/рік)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {results.benefits.map((benefit, index) => (
                                <TableRow key={index}>
                                  <TableCell>{benefit.vehicleType}</TableCell>
                                  <TableCell align="right">
                                    {(benefit.annualBenefit / 1000).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell><Typography fontWeight="bold">Всього</Typography></TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight="bold">
                                    {(results.benefits.reduce((sum, b) => sum + b.annualBenefit, 0) / 1000).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </div>
                      
                      <Divider />
                      
                      {/* Costs */}
                      <div>
                        <Typography variant="subtitle2" gutterBottom>
                          Витрати за роками
                        </Typography>
                        
                        <TableContainer sx={{ maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Рік</TableCell>
                                <TableCell>Тип витрат</TableCell>
                                <TableCell align="right">Сума (тис. грн)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {results.costs.map((cost, index) => (
                                <TableRow key={index}>
                                  <TableCell>{cost.year + 1}</TableCell>
                                  <TableCell>{cost.type}</TableCell>
                                  <TableCell align="right">
                                    {(cost.cost / 1000).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </div>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
                
                <Box mt={3} display="flex" justifyContent="flex-start">
                  <Button 
                    variant="outlined" 
                    onClick={() => handleStepChange(1)}
                  >
                    Назад
                  </Button>
                </Box>
              </>
            ) : (
              <Paper 
                sx={{ 
                  p: 6, 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.50' 
                }}
              >
                <Box textAlign="center">
                  <CalculateIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Результати розрахунку
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Заповніть форму та натисніть кнопку "Розрахувати показники", 
                    щоб побачити результати аналізу проекту.
                  </Typography>
                  <Box mt={3}>
                    <Button 
                      variant="outlined" 
                      onClick={() => handleStepChange(1)}
                    >
                      Назад
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Калькулятор розподілу коштів на будівництво автомобільних доріг загального користування
      </Typography>
      
      {/* Custom stepper navigation */}
      <Paper sx={{ mb: 4, py: 2, px: 3 }} elevation={3}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepButton 
                onClick={() => handleStepChange(index)}
                icon={step.icon}
              >
                <StepLabel>{step.label}</StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      {/* Main content area */}
      <Grid container spacing={4}>
        <Grid item xs={12}>
          {renderStepContent()}
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoadFundingDistribution;