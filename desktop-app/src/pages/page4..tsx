import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api';
import { PDFDownloadLink, Document, Page, Text, View } from '@react-pdf/renderer';

// Types and interfaces
interface RoadSection {
  id: string;
  name: string;
  category: keyof typeof CATEGORY_COEFFICIENTS;
  length: number;
  intensity: number;
  strengthCoeff: number;
  evenness: number;
  rutDepth: number;
  adhesion: number;
  criticalObjects: number;
  isInternational: boolean;
  lat: number;
  lng: number;
}

interface CalculationResult {
  id: string;
  name: string;
  repairTypes: string[];
  cost: number;
  enpv: number;
  priority: number;
}

// Constants and coefficients
const CATEGORY_COEFFICIENTS = {
  'I': 1.8,
  'II': 1.0,
  'III': 0.89
};

const BASE_COST_II_CATEGORY = 604761;
const DISCOUNT_RATE = 0.05;

// PDF Document component
const PDFDocument = ({ results }: { results: CalculationResult[] }) => (
  <Document>
    <Page size="A4" style={{ padding: 30 }}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Звіт про фінансування</Text>
      </View>
      {results.map(result => (
        <View key={result.id} style={{ marginBottom: 10 }}>
          <Text>
            {result.name}: {result.cost.toLocaleString()} грн (Пріоритет: {result.priority.toFixed(1)})
          </Text>
          <Text style={{ fontSize: 12, color: '#666666', marginTop: 5 }}>
            Види робіт: {result.repairTypes.join(', ')}
          </Text>
        </View>
      ))}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 14 }}>
          Загальна вартість: {results.reduce((sum, r) => sum + r.cost, 0).toLocaleString()} грн
        </Text>
      </View>
    </Page>
  </Document>
);

// Main application component
export default function RoadFinanceCalculator() {
  const [activeStep, setActiveStep] = useState(0);
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [currentSection, setCurrentSection] = useState<RoadSection>({
    id: '',
    name: '',
    category: 'II',
    length: 0,
    intensity: 0,
    strengthCoeff: 1.0,
    evenness: 0,
    rutDepth: 0,
    adhesion: 0.35,
    criticalObjects: 0,
    isInternational: false,
    lat: 49.0,
    lng: 31.0
  });

  // Calculation of results
  const results = useMemo<CalculationResult[]>(() => {
    return sections.map(section => {
      const cost = calculateCost(section);
      const enpv = calculateENPV(section);
      return {
        id: section.id,
        name: section.name,
        repairTypes: determineRepairTypes(section),
        cost,
        enpv,
        priority: calculatePriority(section, enpv)
      };
    });
  }, [sections]);

  // Calculation logic
  const calculateCost = (section: RoadSection): number => {
    return (
      BASE_COST_II_CATEGORY *
      CATEGORY_COEFFICIENTS[section.category] *
      section.length *
      (1 + section.criticalObjects * 0.01)
    );
  };

  const calculateENPV = (section: RoadSection): number => {
    const benefits = section.intensity * 0.15 * section.length * 365;
    const cost = calculateCost(section);
    return benefits - cost;
  };

  const determineRepairTypes = (section: RoadSection): string[] => {
    const repairs = [];
    if (section.intensity < 1) repairs.push('Реконструкція');
    if (section.strengthCoeff < 0.9) repairs.push('Капітальний ремонт');
    if (section.evenness < 1 || section.rutDepth < 1 || section.adhesion < 1) {
      repairs.push('Поточний ремонт');
    }
    return repairs.length > 0 ? repairs : ['Експлуатаційне утримання'];
  };

  const calculatePriority = (section: RoadSection, enpv: number): number => {
    let priority = enpv * 0.7;
    if (section.isInternational) priority += 30;
    if (section.criticalObjects > 5) priority += 20;
    return priority;
  };

  // Event handlers
  const handleAddSection = () => {
    // Use a more reliable way to generate IDs if crypto.randomUUID is not available
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    
    setSections([...sections, { ...currentSection, id: newId }]);
    setCurrentSection({
      ...currentSection,
      id: '',
      name: '',
      length: 0,
      intensity: 0
    });
  };

  const handleNextStep = () => {
    setActiveStep(prevStep => Math.min(prevStep + 1, 2));
  };

  const handlePrevStep = () => {
    setActiveStep(prevStep => Math.max(prevStep - 1, 0));
  };

  // Render appropriate step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Назва ділянки"
                value={currentSection.name}
                onChange={e => setCurrentSection({...currentSection, name: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Категорія</InputLabel>
                <Select
                  value={currentSection.category}
                  onChange={e => setCurrentSection({
                    ...currentSection, 
                    category: e.target.value as keyof typeof CATEGORY_COEFFICIENTS
                  })}
                >
                  <MenuItem value="I">I</MenuItem>
                  <MenuItem value="II">II</MenuItem>
                  <MenuItem value="III">III</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Довжина (км)"
                type="number"
                value={currentSection.length || ''}
                onChange={e => setCurrentSection({...currentSection, length: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Інтенсивність руху (авт/добу)"
                type="number"
                value={currentSection.intensity || ''}
                onChange={e => setCurrentSection({...currentSection, intensity: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Міжнародна дорога</InputLabel>
                <Select
                  value={currentSection.isInternational ? 'yes' : 'no'}
                  onChange={e => setCurrentSection({
                    ...currentSection, 
                    isInternational: e.target.value === 'yes'
                  })}
                >
                  <MenuItem value="yes">Так</MenuItem>
                  <MenuItem value="no">Ні</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Коефіцієнт міцності"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 2 }}
                value={currentSection.strengthCoeff}
                onChange={e => setCurrentSection({...currentSection, strengthCoeff: Number(e.target.value)})}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Коефіцієнт рівності"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={currentSection.evenness}
                onChange={e => setCurrentSection({...currentSection, evenness: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Глибина колії (мм)"
                type="number"
                value={currentSection.rutDepth}
                onChange={e => setCurrentSection({...currentSection, rutDepth: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Коефіцієнт зчеплення"
                type="number"
                inputProps={{ step: 0.05, min: 0, max: 1 }}
                value={currentSection.adhesion}
                onChange={e => setCurrentSection({...currentSection, adhesion: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Кількість об'єктів критичної інфраструктури"
                type="number"
                value={currentSection.criticalObjects}
                onChange={e => setCurrentSection({...currentSection, criticalObjects: Number(e.target.value)})}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Широта"
                type="number"
                inputProps={{ step: 0.000001 }}
                value={currentSection.lat}
                onChange={e => setCurrentSection({...currentSection, lat: Number(e.target.value)})}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Довгота"
                type="number"
                inputProps={{ step: 0.000001 }}
                value={currentSection.lng}
                onChange={e => setCurrentSection({...currentSection, lng: Number(e.target.value)})}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ height: 200, width: '100%', mt: 2 }}>
                <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={{ lat: currentSection.lat, lng: currentSection.lng }}
                    zoom={8}
                  >
                    <Marker
                      position={{ lat: currentSection.lat, lng: currentSection.lng }}
                      draggable={true}
                      onDragEnd={(e) => {
                        if (e.latLng) {
                          setCurrentSection({
                            ...currentSection,
                            lat: e.latLng.lat(),
                            lng: e.latLng.lng()
                          });
                        }
                      }}
                    />
                  </GoogleMap>
                </LoadScript>
              </Box>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Input form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step><StepLabel>Основні параметри</StepLabel></Step>
          <Step><StepLabel>Технічні показники</StepLabel></Step>
          <Step><StepLabel>Розташування</StepLabel></Step>
        </Stepper>

        {renderStepContent()}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={handlePrevStep}
            disabled={activeStep === 0}
          >
            Назад
          </Button>
          
          <Box>
            {activeStep === 2 ? (
              <Button 
                variant="contained" 
                onClick={handleAddSection}
                disabled={!currentSection.name || !currentSection.length}
                sx={{ ml: 1 }}
              >
                Додати ділянку
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNextStep}
              >
                Далі
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Calculation results */}
      {sections.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Результати розрахунків</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ділянка</TableCell>
                  <TableCell>Вид робіт</TableCell>
                  <TableCell>Вартість</TableCell>
                  <TableCell>ENPV</TableCell>
                  <TableCell>Пріоритет</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map(result => (
                  <TableRow key={result.id}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.repairTypes.join(', ')}</TableCell>
                    <TableCell>{result.cost.toLocaleString()} грн</TableCell>
                    <TableCell>{result.enpv.toLocaleString()}</TableCell>
                    <TableCell>{result.priority.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} align="right"><strong>Загалом:</strong></TableCell>
                  <TableCell><strong>{results.reduce((sum, r) => sum + r.cost, 0).toLocaleString()} грн</strong></TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Map */}
      {sections.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, height: 400 }}>
          <Typography variant="h6" gutterBottom>Карта ділянок</Typography>
          <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
            <GoogleMap
              mapContainerStyle={{ height: '90%', width: '100%' }}
              center={{ lat: 49.0, lng: 31.0 }}
              zoom={6}
            >
              {sections.map(section => (
                <Marker
                  key={section.id}
                  position={{ lat: section.lat, lng: section.lng }}
                  label={section.name.substring(0, 2)}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </Paper>
      )}

      {/* Export to PDF */}
      {sections.length > 0 && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PDFDownloadLink
            document={<PDFDocument results={results} />}
            fileName="road_report.pdf"
            style={{
              textDecoration: 'none'
            }}
          >
            {({ loading }) => (
              <Button variant="contained" color="secondary" disabled={loading}>
                {loading ? 'Генерація звіту...' : 'Завантажити PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </Box>
      )}
    </Container>
  );
}