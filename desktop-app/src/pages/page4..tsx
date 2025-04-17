import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  StepButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  FormControlLabel,
  RadioGroup,
  Radio,
  SelectChangeEvent
} from '@mui/material';
import {
  AddRoadOutlined as RoadIcon,
  AnalyticsOutlined as AnalyticsIcon,
  AssessmentOutlined as ResultsIcon
} from '@mui/icons-material';

// Types
interface RoadSegment {
  id: string;
  name: string;
  length: number;
  category: string;
  trafficIntensity: number;
  currentCondition: RoadCondition;
  constructionYear?: number;
  lastRepairYear?: number;
}

interface RoadCondition {
  trafficIntensityCoefficient: number;
  pavementStrengthCoefficient: number;
  evenness: number;
  rutting: number;
  adhesion: number;
  actualEvenness?: number; // IRI value (m/km)
  actualRutting?: number;  // in mm
}

interface AssessmentResult {
  segment: RoadSegment;
  recommendedWork: 'reconstruction' | 'capital-repair' | 'current-repair' | 'none';
  priorityScore: number;
  economicENPV: number;
  explanation: string;
}

// Step definition interface
interface StepInfo {
  label: string;
  icon: React.ReactNode;
}

// Constants
const ROAD_CATEGORIES = ['І', 'ІІ', 'ІІІ', 'IV', 'V'];

// Pavement strength minimum coefficients for different categories (from DBN V.2.3-4:2015 Table 8.2)
const MIN_PAVEMENT_STRENGTH_COEFFICIENTS = {
  'І': 1.50,
  'ІІ': 1.30,
  'ІІІ': 1.20,
  'IV': 1.10,
  'V': 1.05
};

const MIN_ADHESION_COEFFICIENT = 0.35;

// Condition thresholds from Table 9.2 and 9.3
const EVENNESS_THRESHOLDS = {
  '1': 2.7, // Level 1 requirements
  '2': 3.1, // Level 2 requirements
  '3': 3.5, // Level 3 requirements
  '4': 4.1  // Level 4 requirements
};

const RUTTING_THRESHOLDS = {
  '1': 20, // Level 1 requirements (mm)
  '2': 25, // Level 2 requirements (mm)
  '3': 30, // Level 3 requirements (mm)
  '4': 40  // Level 4 requirements (mm)
};

// Level requirements based on road significance and traffic volume
const ROAD_REQUIREMENT_LEVELS = {
  'international_high': '1', // International roads with traffic > 7000 vehicles/day
  'international_low': '2',  // International roads with traffic <= 7000 vehicles/day
  'regional_high': '2',      // Regional roads with traffic > 3000 vehicles/day
  'regional_low': '3',       // Regional roads with traffic <= 3000 vehicles/day
  'oblast_high': '3',        // Oblast roads with traffic > 1000 vehicles/day
  'other': '4'               // All other roads
};

// Expert assessment levels from Table 11.1 and 11.2
const EXPERT_ASSESSMENT_LEVELS = [
  { value: 10, label: "Відмінний стан - без пошкоджень і деформацій" },
  { value: 9, label: "Дуже добрий стан - окремі ізольовані тріщини" },
  { value: 8, label: "Добрий стан - деякі тріщини усунуті при ямковому ремонті" },
  { value: 7, label: "Задовільна рівність, деяке зношення та ізольовані деформації" },
  { value: 6, label: "Колійність до 15мм, 1% площі з пошкодженнями" },
  { value: 5, label: "Деяке спотворення профілю, ізольовані осідання, 2% площі пошкоджень" },
  { value: 4, label: "Часті спотворення профілю, часті осідання, 3% площі пошкоджень" },
  { value: 3, label: "Спотворення профілю на значній протяжності, 4% площі пошкоджень" },
  { value: 2, label: "Спотворення профілю на великій протяжності, колійність, мости в поганому стані" },
  { value: 1, label: "Сильно спотворений профіль, деформації, мости в аварійному стані" }
];

const REPAIR_BASED_ON_EXPERT_ASSESSMENT = {
  'high': 'Ремонт не потрібен',
  'medium': 'Потрібен поточний ремонт',
  'low': 'Потрібен капітальний ремонт'
};

// Function to determine repair type based on expert assessment (Table 11.2)
const determineRepairByExpertAssessment = (index: number): string => {
  if (index >= 8) return REPAIR_BASED_ON_EXPERT_ASSESSMENT.high;
  if (index >= 5 && index <= 7) return REPAIR_BASED_ON_EXPERT_ASSESSMENT.medium;
  return REPAIR_BASED_ON_EXPERT_ASSESSMENT.low;
};

// Function to determine the requirement level for a road segment
const determineRequirementLevel = (segment: RoadSegment): string => {
  if (segment.category === 'І' || segment.category === 'ІІ') {
    return segment.trafficIntensity > 7000 ? 
      ROAD_REQUIREMENT_LEVELS.international_high : 
      ROAD_REQUIREMENT_LEVELS.international_low;
  } else if (segment.category === 'ІІІ') {
    return segment.trafficIntensity > 3000 ? 
      ROAD_REQUIREMENT_LEVELS.regional_high : 
      ROAD_REQUIREMENT_LEVELS.regional_low;
  } else if (segment.category === 'IV') {
    return segment.trafficIntensity > 1000 ? 
      ROAD_REQUIREMENT_LEVELS.oblast_high : 
      ROAD_REQUIREMENT_LEVELS.other;
  }
  return ROAD_REQUIREMENT_LEVELS.other;
};

// Function to determine recommended work based on road condition (Section 4.2.3)
const determineRequiredWork = (segment: RoadSegment): 'reconstruction' | 'capital-repair' | 'current-repair' | 'none' => {
  const condition = segment.currentCondition;
  const requirementLevel = determineRequirementLevel(segment);
  
  // 4.2.3.1 - If traffic intensity coefficient is less than 1, reconstruction is needed
  if (condition.trafficIntensityCoefficient < 1) {
    return 'reconstruction';
  }
  
  // 4.2.3.2 - If pavement strength coefficient is less than minimum allowed for this category, capital repair is needed
  const minStrengthCoefficient = MIN_PAVEMENT_STRENGTH_COEFFICIENTS[segment.category as keyof typeof MIN_PAVEMENT_STRENGTH_COEFFICIENTS] || 1.0;
  if (condition.pavementStrengthCoefficient < minStrengthCoefficient) {
    return 'capital-repair';
  }
  
  // 4.2.3.3 - Check evenness
  const evennessThreshold = EVENNESS_THRESHOLDS[requirementLevel as keyof typeof EVENNESS_THRESHOLDS];
  const hasEvennessProblem = condition.actualEvenness ? condition.actualEvenness > evennessThreshold : condition.evenness < 1;
  
  // 4.2.3.4 - Check rutting
  const ruttingThreshold = RUTTING_THRESHOLDS[requirementLevel as keyof typeof RUTTING_THRESHOLDS];
  const hasRuttingProblem = condition.actualRutting ? condition.actualRutting > ruttingThreshold : condition.rutting < 1;
  
  // 4.2.3.5 - Check adhesion
  const hasAdhesionProblem = condition.adhesion < MIN_ADHESION_COEFFICIENT;
  
  // If any problem with road surface, current repair is needed
  if (hasEvennessProblem || hasRuttingProblem || hasAdhesionProblem) {
    return 'current-repair';
  }
  
  return 'none';
};

// Function to calculate ENPV (Economic Net Present Value) from section 10.2
const calculateENPV = (segment: RoadSegment, workType: string): number => {
  // Get base costs for different types of work (simplified)
  const workCosts = {
    'reconstruction': 15000000, // UAH per km
    'capital-repair': 8000000,  // UAH per km
    'current-repair': 3000000,  // UAH per km
    'none': 0
  };
  
  // Base cost of the work
  const totalCost = (workCosts[workType as keyof typeof workCosts] || 0) * segment.length;
  
  // Calculate benefits (simplified calculation based on section 10.1)
  // 1. Benefit from reduced vehicle operating costs
  const trafficBenefit = segment.trafficIntensity * 365 * segment.length * 5; // 5 UAH per vehicle-km saved
  
  // 2. Benefit from reduced travel time
  const timeBenefit = segment.trafficIntensity * 365 * segment.length * 2; // 2 UAH per vehicle-km saved
  
  // 3. Benefit from reduced accidents
  const safetyBenefit = segment.trafficIntensity * 365 * segment.length * 0.5; // 0.5 UAH per vehicle-km saved
  
  // 4. Environmental benefits (marginal)
  const envBenefit = segment.trafficIntensity * 365 * segment.length * 0.1; // 0.1 UAH per vehicle-km saved
  
  // Total annual benefit
  const annualBenefit = trafficBenefit + timeBenefit + safetyBenefit + envBenefit;
  
  // Calculate NPV for 10 years with 5% discount rate
  const discountRate = 0.05;
  const years = 10;
  
  let npv = -totalCost; // Initial investment
  
  for (let t = 1; t <= years; t++) {
    npv += annualBenefit / Math.pow(1 + discountRate, t);
  }
  
  return npv;
};

// Application component
const RoadAssessmentApp = (): JSX.Element => {
  // State for the multi-step form
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [segments, setSegments] = React.useState<RoadSegment[]>([]);
  const [currentSegment, setCurrentSegment] = React.useState<RoadSegment>({
    id: '',
    name: '',
    length: 0,
    category: '',
    trafficIntensity: 0,
    constructionYear: new Date().getFullYear() - 10,
    lastRepairYear: new Date().getFullYear() - 3,
    currentCondition: {
      trafficIntensityCoefficient: 1,
      pavementStrengthCoefficient: 1,
      evenness: 1,
      rutting: 1,
      adhesion: 1,
      actualEvenness: 2.5,  // IRI value (m/km)
      actualRutting: 15     // in mm
    }
  });
  const [assessmentResults, setAssessmentResults] = React.useState<AssessmentResult[]>([]);
  const [assessmentMethod, setAssessmentMethod] = React.useState<'instrumental' | 'expert'>('instrumental');
  const [expertAssessmentValue, setExpertAssessmentValue] = React.useState<number>(8);

  // Step definitions with icons for improved stepper
  const steps: StepInfo[] = [
    { label: 'Деталі ділянки дороги', icon: <RoadIcon /> },
    { label: 'Оцінка стану', icon: <AnalyticsIcon /> },
    { label: 'Результати', icon: <ResultsIcon /> }
  ];

  // Handle moving to a specific step directly
  const handleStepChange = (step: number): void => {
    // Only allow moving to assessment step if we have at least one segment
    if (step === 1 && segments.length === 0) return;
    
    // Only allow moving to results step after performing assessment
    if (step === 2 && assessmentResults.length === 0) {
      performAssessment();
    }
    
    setActiveStep(step);
  };

  // Handle moving to the next step
  const handleNext = (): void => {
    if (activeStep === 1 && assessmentResults.length === 0) {
      performAssessment();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle moving to the previous step
  const handleBack = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle input changes for road segment details
  const handleSegmentChange = (field: keyof RoadSegment, value: any): void => {
    setCurrentSegment({
      ...currentSegment,
      [field]: value
    });
  };

  // Handle input changes for road condition details
  const handleConditionChange = (field: keyof RoadCondition, value: number): void => {
    setCurrentSegment({
      ...currentSegment,
      currentCondition: {
        ...currentSegment.currentCondition,
        [field]: value
      }
    });
  };

  // Add a new segment and reset form
  const handleAddSegment = (): void => {
    const newSegment = {
      ...currentSegment,
      id: Date.now().toString() // Simple unique ID generation
    };
    
    setSegments([...segments, newSegment]);
    
    // Reset form for new segment
    setCurrentSegment({
      id: '',
      name: '',
      length: 0,
      category: '',
      trafficIntensity: 0,
      constructionYear: new Date().getFullYear() - 10,
      lastRepairYear: new Date().getFullYear() - 3,
      currentCondition: {
        trafficIntensityCoefficient: 1,
        pavementStrengthCoefficient: 1,
        evenness: 1,
        rutting: 1,
        adhesion: 1,
        actualEvenness: 2.5,
        actualRutting: 15
      }
    });
  };

  // Perform assessment on all segments
  const performAssessment = (): void => {
    const results: AssessmentResult[] = [];
    
    for (const segment of segments) {
      let recommendedWork: 'reconstruction' | 'capital-repair' | 'current-repair' | 'none';
      let explanation = '';
      
      if (assessmentMethod === 'expert') {
        // Using expert assessment method (section 4.4.3.1)
        const repairRecommendation = determineRepairByExpertAssessment(expertAssessmentValue);
        
        if (repairRecommendation === REPAIR_BASED_ON_EXPERT_ASSESSMENT.high) {
          recommendedWork = 'none';
        } else if (repairRecommendation === REPAIR_BASED_ON_EXPERT_ASSESSMENT.medium) {
          recommendedWork = 'current-repair';
        } else {
          recommendedWork = 'capital-repair';
        }
        
        explanation = `На основі експертної оцінки ${expertAssessmentValue}, рекомендований вид робіт: ${recommendedWork}.`;
      } else {
        // Using instrumental assessment method (sections 4.2.2 and 4.2.3)
        recommendedWork = determineRequiredWork(segment);
        
        if (recommendedWork === 'reconstruction') {
          explanation = 'Коефіцієнт інтенсивності руху менше 1, що вказує на невідповідність дороги вимогам пропускної здатності.';
        } else if (recommendedWork === 'capital-repair') {
          const minStrengthCoefficient = MIN_PAVEMENT_STRENGTH_COEFFICIENTS[segment.category as keyof typeof MIN_PAVEMENT_STRENGTH_COEFFICIENTS] || 1.0;
          explanation = `Коефіцієнт міцності дорожнього одягу (${segment.currentCondition.pavementStrengthCoefficient.toFixed(2)}) нижче мінімальних вимог для категорії ${segment.category} (${minStrengthCoefficient}).`;
        } else if (recommendedWork === 'current-repair') {
          explanation = 'Проблеми з рівністю дороги, колійністю або зчепленням вимагають поточного ремонту.';
        } else {
          explanation = 'Усі показники в межах допустимих норм. Негайний ремонт не потрібен.';
        }
      }
      
      // Calculate economic ENPV
      const economicENPV = calculateENPV(segment, recommendedWork);
      
      // Calculate priority score according to section 4.2.6
      let priorityScore = economicENPV / (segment.length * 1000000); // ENPV per million cost per km
      
      results.push({
        segment,
        recommendedWork,
        priorityScore,
        economicENPV,
        explanation
      });
    }
    
    // Sort results by priority score (descending) - section 4.2.6
    results.sort((a, b) => b.priorityScore - a.priorityScore);
    
    setAssessmentResults(results);
  };

  // Form for road segment details
  const renderSegmentDetailsForm = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">Додати ділянку дороги</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            label="Назва/ідентифікатор ділянки"
            fullWidth
            value={currentSegment.name}
            onChange={(e) => handleSegmentChange('name', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            label="Довжина (км)"
            type="number"
            fullWidth
            value={currentSegment.length || ''}
            onChange={(e) => handleSegmentChange('length', Number(e.target.value))}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Категорія дороги</InputLabel>
            <Select
              value={currentSegment.category}
              label="Категорія дороги"
              onChange={(e: SelectChangeEvent) => handleSegmentChange('category', e.target.value)}
            >
              {ROAD_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  Категорія {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            label="Інтенсивність руху (авт./добу)"
            type="number"
            fullWidth
            value={currentSegment.trafficIntensity || ''}
            onChange={(e) => handleSegmentChange('trafficIntensity', Number(e.target.value))}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            label="Рік будівництва"
            type="number"
            fullWidth
            value={currentSegment.constructionYear || ''}
            onChange={(e) => handleSegmentChange('constructionYear', Number(e.target.value))}
            inputProps={{ min: 1950, max: new Date().getFullYear() }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            required
            label="Рік останнього ремонту"
            type="number"
            fullWidth
            value={currentSegment.lastRepairYear || ''}
            onChange={(e) => handleSegmentChange('lastRepairYear', Number(e.target.value))}
            inputProps={{ min: 1950, max: new Date().getFullYear() }}
          />
        </Grid>
      </Grid>
      
      {segments.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6">Додані ділянки</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Назва/ідентифікатор</TableCell>
                  <TableCell>Довжина (км)</TableCell>
                  <TableCell>Категорія</TableCell>
                  <TableCell>Рух (авт./добу)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell>{segment.name}</TableCell>
                    <TableCell>{segment.length}</TableCell>
                    <TableCell>{segment.category}</TableCell>
                    <TableCell>{segment.trafficIntensity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      <Box mt={3} display="flex" justifyContent="space-between">
        <Box></Box> {/* Empty box for alignment */}
        <Box>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleAddSegment}
            disabled={!currentSegment.name || !currentSegment.length || !currentSegment.category || !currentSegment.trafficIntensity}
            sx={{ mr: 1 }}
          >
            Додати ділянку
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={segments.length === 0}
          >
            Далі
          </Button>
        </Box>
      </Box>
    </Box>
  );
  
  // Form for road condition assessment
  const renderConditionAssessmentForm = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={assessmentMethod}
              onChange={(e) => setAssessmentMethod(e.target.value as 'instrumental' | 'expert')}
            >
              <FormControlLabel 
                value="instrumental" 
                control={<Radio />} 
                label="Інструментальна оцінка (Розділ 4.2.2)" 
              />
              <FormControlLabel 
                value="expert" 
                control={<Radio />} 
                label="Експертна оцінка (Розділ 4.4.3.1)" 
              />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        {assessmentMethod === 'instrumental' ? (
          <>
            <Grid item xs={12}>
              <Typography variant="h6">Інструментальна оцінка стану</Typography>
              <Alert severity="info">
                <AlertTitle>Інформація</AlertTitle>
                Введіть коефіцієнти на основі польових вимірювань. Значення менше 1 вказують на стан нижче прийнятних стандартів.
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                label="Коефіцієнт інтенсивності руху"
                type="number"
                fullWidth
                helperText="Менше 1 вказує на недостатню пропускну здатність для поточного трафіку"
                value={currentSegment.currentCondition.trafficIntensityCoefficient}
                onChange={(e) => handleConditionChange('trafficIntensityCoefficient', Number(e.target.value))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                label="Коефіцієнт міцності дорожнього одягу"
                type="number"
                fullWidth
                helperText={`Мінімальний коефіцієнт для категорії ${currentSegment.category || 'не вибрано'}: ${
                  currentSegment.category 
                    ? MIN_PAVEMENT_STRENGTH_COEFFICIENTS[currentSegment.category as keyof typeof MIN_PAVEMENT_STRENGTH_COEFFICIENTS] 
                    : '?'
                }`}
                value={currentSegment.currentCondition.pavementStrengthCoefficient}
                onChange={(e) => handleConditionChange('pavementStrengthCoefficient', Number(e.target.value))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                label="Фактична рівність (IRI, м/км)"
                type="number"
                fullWidth
                helperText={`Граничне значення: ${
                  currentSegment.category 
                    ? EVENNESS_THRESHOLDS[determineRequirementLevel(currentSegment) as keyof typeof EVENNESS_THRESHOLDS] 
                    : '?'
                } м/км`}
                value={currentSegment.currentCondition.actualEvenness || ''}
                onChange={(e) => {
                  const actualEvenness = Number(e.target.value);
                  const requirementLevel = determineRequirementLevel(currentSegment);
                  const evennessThreshold = EVENNESS_THRESHOLDS[requirementLevel as keyof typeof EVENNESS_THRESHOLDS];
                  // Evenness coefficient is 1 when actual evenness is below threshold, otherwise it's below 1
                  const evennessCoefficient = actualEvenness <= evennessThreshold ? 1 : evennessThreshold / actualEvenness;
                  
                  handleConditionChange('actualEvenness', actualEvenness);
                  handleConditionChange('evenness', evennessCoefficient);
                }}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                label="Фактична колійність (мм)"
                type="number"
                fullWidth
                helperText={`Граничне значення: ${
                  currentSegment.category 
                    ? RUTTING_THRESHOLDS[determineRequirementLevel(currentSegment) as keyof typeof RUTTING_THRESHOLDS] 
                    : '?'
                } мм`}
                value={currentSegment.currentCondition.actualRutting || ''}
                onChange={(e) => {
                  const actualRutting = Number(e.target.value);
                  const requirementLevel = determineRequirementLevel(currentSegment);
                  const ruttingThreshold = RUTTING_THRESHOLDS[requirementLevel as keyof typeof RUTTING_THRESHOLDS];
                  // Rutting coefficient is 1 when actual rutting is below threshold, otherwise it's below 1
                  const ruttingCoefficient = actualRutting <= ruttingThreshold ? 1 : ruttingThreshold / actualRutting;
                  
                  handleConditionChange('actualRutting', actualRutting);
                  handleConditionChange('rutting', ruttingCoefficient);
                }}
                inputProps={{ step: 1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                required
                label="Коефіцієнт зчеплення"
                type="number"
                fullWidth
                helperText={`Мінімальний коефіцієнт: ${MIN_ADHESION_COEFFICIENT}`}
                value={currentSegment.currentCondition.adhesion}
                onChange={(e) => handleConditionChange('adhesion', Number(e.target.value))}
                inputProps={{ step: 0.05, min: 0, max: 1 }}
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12}>
              <Typography variant="h6">Експертна оцінка (Таблиця 11.1)</Typography>
              <Alert severity="info">
                <AlertTitle>Інформація</AlertTitle>
                Виберіть рівень стану, який найкраще відповідає поточному стану ділянки дороги.
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Оцінка стану дороги</InputLabel>
                <Select
                  value={expertAssessmentValue}
                  label="Оцінка стану дороги"
                  onChange={(e) => setExpertAssessmentValue(Number(e.target.value))}
                >
                  {EXPERT_ASSESSMENT_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.value}: {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle1">Результат оцінки:</Typography>
                <Typography variant="body1">
                  {determineRepairByExpertAssessment(expertAssessmentValue)}
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
      
      <Box mt={3} display="flex" justifyContent="space-between">
        <Button
          onClick={handleBack}
        >
          Назад
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
        >
          Перейти до результатів
        </Button>
      </Box>
    </Box>
  );

  // Display assessment results
  const renderResults = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Результати оцінки
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Пріоритетний рейтинг</AlertTitle>
        Ділянки ранжуються за пріоритетністю на основі економічної ефективності (ENPV на кілометр).
      </Alert>
      
      {assessmentResults.length === 0 ? (
        <Alert severity="warning">
          Жодна ділянка не була оцінена. Будь ласка, додайте ділянки доріг та завершіть оцінку.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {assessmentResults.map((result, index) => (
            <Grid item xs={12} key={result.segment.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {index + 1}. {result.segment.name}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Деталі дороги:</Typography>
                      <Typography variant="body2">
                        Категорія: {result.segment.category}, Довжина: {result.segment.length} км, 
                        Рух: {result.segment.trafficIntensity} авт./добу
                      </Typography>
                      <Typography variant="body2">
                        Рік будівництва: {result.segment.constructionYear || 'Не вказано'},
                        Останній ремонт: {result.segment.lastRepairYear || 'Не вказано'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Рекомендовані роботи:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 
                        result.recommendedWork === 'none' ? 'green' :
                        result.recommendedWork === 'current-repair' ? 'orange' :
                        result.recommendedWork === 'capital-repair' ? 'orangered' : 'red'
                      }}>
                        {result.recommendedWork === 'none' ? 'Ремонт не потрібен' :
                        result.recommendedWork === 'current-repair' ? 'Поточний ремонт' :
                        result.recommendedWork === 'capital-repair' ? 'Капітальний ремонт' : 'Реконструкція'}
                      </Typography>
                      <Typography variant="body2">
                        {result.explanation}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Економічна ефективність:</Typography>
                      <Typography variant="body2">
                        ENPV: {result.economicENPV.toLocaleString()} грн
                      </Typography>
                      <Typography variant="body2">
                        Пріоритетність: {result.priorityScore.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box mt={3} display="flex" justifyContent="space-between">
        <Button
          onClick={handleBack}
        >
          Назад
        </Button>
        
        <Button
          variant="contained"
          color="success"
          onClick={() => setActiveStep(0)}
        >
          Нова оцінка
        </Button>
      </Box>
    </Box>
  );

  // Render step content based on active step
  const renderStepContent = () => {
    switch(activeStep) {
      case 0:
        return renderSegmentDetailsForm();
      case 1:
        return renderConditionAssessmentForm();
      case 2:
        return renderResults();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Система оцінки стану доріг
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Відповідно до вимог ДБН В.2.3-4:2015 та ДСТУ Б B.2.3-42:2016
        </Typography>
      </Paper>
      
      {/* Improved Stepper with icons */}
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
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mt: 2, mb: 2 }}>
          {renderStepContent()}
        </Box>
      </Paper>
    </Container>
  );
};

export default RoadAssessmentApp;