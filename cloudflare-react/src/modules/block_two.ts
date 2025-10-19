// calculations.ts
// Модуль расчетов финансирования эксплуатационного содержания автомобильных дорог

// Структуры данных для расчетов
export interface RoadCategory {
  category: 1 | 2 | 3 | 4 | 5; // категория дороги (I-V)
  stateImportance: boolean; // дорога государственного значения (true) или местного (false)
}

export interface RegionCoefficients {
  regionalName: string; // название области/региона
  mountainous: number; // коэффициент Кг - учитывает прохождение дорог в горной местности
  operatingConditions: number; // коэффициент Куе - условия эксплуатации сети дорог
  criticalInfrastructure: number; // коэффициент Ккр.і - учитывает объекты критической инфраструктуры
}

export interface RoadSection {
  category: 1 | 2 | 3 | 4 | 5; // категория дороги (I-V)
  stateImportance: boolean; // дорога государственного значения (true) или местного (false)
  length: number; // протяженность участка дороги, км
  trafficIntensity: number; // интенсивность движения, авт./сутки
  hasEuropeanStatus: boolean; // дорога с индексом Е
  isBorderCrossing: boolean; // участок возле пунктов пропуска через границу
  hasLighting: boolean; // наличие освещения
  recentlyRepaired: boolean; // проведен ремонт за последние 5 лет
  europeanIndexLength?: number; // протяженность дорог с индексом Е, км
}

export interface RegionRoads {
  regionalName: string; // название области/региона
  roadSections: RoadSection[]; // участки дорог в области
  criticalInfrastructureCount: number; // количество объектов критической инфраструктуры (1-5, 5-10, >10)
}

export interface PriceIndexes {
  inflationIndex: number; // индекс инфляции
}

// Константы из методики
const STATE_ROAD_MAINTENANCE_BASE_COST = 604.761; // тыс. грн/км (цены 2023 года)
const LOCAL_ROAD_MAINTENANCE_BASE_COST = 360.544; // тыс. грн/км (цены 2023 года)

// Таблица 3 - Коэффициенты дифференцирования стоимости работ по эксплуатационному содержанию
const CATEGORY_COEFFICIENTS_STATE: Record<number, number> = {
  1: 1.80, // I категория
  2: 1.00, // II категория
  3: 0.89, // III категория
  4: 0.61, // IV категория
  5: 0.39, // V категория
};

const CATEGORY_COEFFICIENTS_LOCAL: Record<number, number> = {
  1: 1.71, // I категория
  2: 1.00, // II категория
  3: 0.85, // III категория
  4: 0.64, // IV категория
  5: 0.40, // V категория
};

// Таблица 7 - Коэффициенты зависимости от интенсивности движения
const TRAFFIC_INTENSITY_COEFFICIENTS: Record<string, number> = {
  "15000-20000": 2.3,
  "20001-30000": 3.5,
  ">30000": 3.9,
};

// Таблица 8 - Коэффициенты для критической инфраструктуры
const CRITICAL_INFRASTRUCTURE_COEFFICIENTS: Record<string, number> = {
  "1-5": 1.01,
  "5-10": 1.03,
  ">10": 1.05,
};

/**
 * Расчет приведенного норматива финансовых затрат на содержание 1 км дорог госзначения
 * Формула: H_j^д = H^д × K_j^д × K_инф
 */
export function calculateStateRoadMaintenanceRate(
  category: number,
  inflationIndex: number
): number {
  const categoryCoefficient = CATEGORY_COEFFICIENTS_STATE[category] || 1;
  return STATE_ROAD_MAINTENANCE_BASE_COST * categoryCoefficient * inflationIndex;
}

/**
 * Расчет приведенного норматива финансовых затрат на содержание 1 км дорог местного значения
 * Формула: H_j^м = H^м × K_j^м × K_инф
 */
export function calculateLocalRoadMaintenanceRate(
  category: number,
  inflationIndex: number
): number {
  const categoryCoefficient = CATEGORY_COEFFICIENTS_LOCAL[category] || 1;
  return LOCAL_ROAD_MAINTENANCE_BASE_COST * categoryCoefficient * inflationIndex;
}

/**
 * Расчет коэффициента Kинт.д - учитывает фактическую интенсивность движения
 */
export function calculateTrafficIntensityCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Если нет данных о фактической интенсивности движения, коэффициент равен 1
  if (!roadSections.length || !totalLength) return 1;

  const highIntensitySections = roadSections.filter(section => section.trafficIntensity > 15000);
  
  if (highIntensitySections.length === 0) return 1;
  
  let sumProduct = 0;
  let sumLengthHighIntensity = 0;
  
  for (const section of highIntensitySections) {
    let intensityCoefficient;
    
    if (section.trafficIntensity > 30000) {
      intensityCoefficient = TRAFFIC_INTENSITY_COEFFICIENTS[">30000"];
    } else if (section.trafficIntensity > 20000) {
      intensityCoefficient = TRAFFIC_INTENSITY_COEFFICIENTS["20001-30000"];
    } else {
      intensityCoefficient = TRAFFIC_INTENSITY_COEFFICIENTS["15000-20000"];
    }
    
    sumProduct += intensityCoefficient * section.length;
    sumLengthHighIntensity += section.length;
  }
  
  // Формула: (Σ(C_iнт × L_iнт.д) + (L_i^д - Σ L_iнт.д)) / L_i^д
  return (sumProduct + (totalLength - sumLengthHighIntensity)) / totalLength;
}

/**
 * Расчет коэффициента Kе.д - учитывает дороги, входящие в европейскую сеть (индекс Е)
 */
export function calculateEuropeanRoadCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Если нет данных, коэффициент равен 1
  if (!roadSections.length || !totalLength) return 1;
  
  const europeanSections = roadSections.filter(section => section.hasEuropeanStatus);
  
  if (europeanSections.length === 0) return 1;
  
  const europeanCoefficient = 1.5;
  let sumLengthEuropean = 0;
  
  for (const section of europeanSections) {
    sumLengthEuropean += section.length;
  }
  
  // Формула: (Σ(C_e × L_e.д) + (L_i^д - Σ L_e.д)) / L_i^д
  return (europeanCoefficient * sumLengthEuropean + (totalLength - sumLengthEuropean)) / totalLength;
}

/**
 * Расчет коэффициента Kмпп.д - учитывает дороги возле международных пунктов пропуска
 */
export function calculateBorderCrossingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Если нет данных, коэффициент равен 1
  if (!roadSections.length || !totalLength) return 1;
  
  const borderSections = roadSections.filter(section => section.isBorderCrossing);
  
  if (borderSections.length === 0) return 1;
  
  const borderCoefficient = 1.5;
  let sumLengthBorder = 0;
  
  for (const section of borderSections) {
    sumLengthBorder += section.length;
  }
  
  // Формула: (Σ(C_мпп × L_мпп.д) + (L_i^д - Σ L_мпп.д)) / L_i^д
  return (borderCoefficient * sumLengthBorder + (totalLength - sumLengthBorder)) / totalLength;
}

/**
 * Расчет коэффициента Kосв - учитывает дороги с освещением
 */
export function calculateLightingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Если нет данных, коэффициент равен 1
  if (!roadSections.length || !totalLength) return 1;
  
  const lightedSections = roadSections.filter(section => section.hasLighting);
  
  if (lightedSections.length === 0) return 1;
  
  const lightingCoefficient = 2.0;
  let sumLengthLighted = 0;
  
  for (const section of lightedSections) {
    sumLengthLighted += section.length;
  }
  
  // Формула: (Σ(C_осв × L_осв) + (L_i^д - Σ L_осв)) / L_i^д
  return (lightingCoefficient * sumLengthLighted + (totalLength - sumLengthLighted)) / totalLength;
}

/**
 * Расчет коэффициента Kрем - учитывает дороги после ремонта
 */
export function calculateRepairCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Если нет данных, коэффициент равен 1
  if (!roadSections.length || !totalLength) return 1;
  
  const repairedSections = roadSections.filter(section => section.recentlyRepaired);
  
  if (repairedSections.length === 0) return 1;
  
  const repairCoefficient = 0.5; // Снижение из-за меньшей потребности в ремонте
  let sumLengthRepaired = 0;
  
  for (const section of repairedSections) {
    sumLengthRepaired += section.length;
  }
  
  // Формула: (Σ(C_рем × L_рем) + (L_i^д - Σ L_рем)) / L_i^д
  return (repairCoefficient * sumLengthRepaired + (totalLength - sumLengthRepaired)) / totalLength;
}

/**
 * Расчет коэффициента Kкр.і - учитывает объекты критической инфраструктуры
 */
export function calculateCriticalInfrastructureCoefficient(criticalInfrastructureCount: number): number {
  if (criticalInfrastructureCount <= 0) return 1.0;
  
  if (criticalInfrastructureCount >= 10) {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS[">10"];
  } else if (criticalInfrastructureCount >= 5) {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS["5-10"];
  } else {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS["1-5"];
  }
}

/**
 * Расчет объема финансирования для содержания дорог государственного значения
 * Формула из п. 3.5:
 * Q_i^д = Σ(H_j^д × L_ij^д) × K_д × K_г × K_уe × K_инт.д × K_e.д × K_мпп.д × K_осв × K_рем × K_кр.і
 */
export function calculateStateRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const stateRoadSections = region.roadSections.filter(section => section.stateImportance);
  
  if (stateRoadSections.length === 0) return 0;
  
  // Расчет общей протяженности дорог государственного значения
  const totalStateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);
  
  // Расчет базовой суммы по категориям дорог
  let baseFunding = 0;
  for (const section of stateRoadSections) {
    const rate = calculateStateRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }
  
  // Расчет коэффициентов
  const trafficIntensityCoefficient = calculateTrafficIntensityCoefficient(stateRoadSections, totalStateRoadLength);
  const europeanRoadCoefficient = calculateEuropeanRoadCoefficient(stateRoadSections, totalStateRoadLength);
  const borderCrossingCoefficient = calculateBorderCrossingCoefficient(stateRoadSections, totalStateRoadLength);
  const lightingCoefficient = calculateLightingCoefficient(stateRoadSections, totalStateRoadLength);
  const repairCoefficient = calculateRepairCoefficient(stateRoadSections, totalStateRoadLength);
  const criticalInfrastructureCoefficient = calculateCriticalInfrastructureCoefficient(region.criticalInfrastructureCount);
  
  // Коэффициент обслуживания дорог государственного значения
  const serviceCoefficient = 1.16;
  
  // Общая формула из п. 3.5
  return baseFunding * 
    serviceCoefficient * 
    regionCoefficients.mountainous * 
    regionCoefficients.operatingConditions * 
    trafficIntensityCoefficient * 
    europeanRoadCoefficient * 
    borderCrossingCoefficient * 
    lightingCoefficient * 
    repairCoefficient * 
    criticalInfrastructureCoefficient;
}

/**
 * Расчет объема финансирования для содержания дорог местного значения
 * Формула из п. 3.6:
 * Q_i^м = Σ(H_j^м × L_ij^м) × K_г × K_уe × K_инт.м
 */
export function calculateLocalRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const localRoadSections = region.roadSections.filter(section => !section.stateImportance);
  
  if (localRoadSections.length === 0) return 0;
  
  // Расчет общей протяженности дорог местного значения
  const totalLocalRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);
  
  // Расчет базовой суммы по категориям дорог
  let baseFunding = 0;
  for (const section of localRoadSections) {
    const rate = calculateLocalRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }
  
  // Расчет коэффициента интенсивности для местных дорог
  const trafficIntensityCoefficient = calculateTrafficIntensityCoefficient(localRoadSections, totalLocalRoadLength);
  
  // Общая формула из п. 3.6
  return baseFunding * 
    regionCoefficients.mountainous * 
    regionCoefficients.operatingConditions * 
    trafficIntensityCoefficient;
}

/**
 * Общий расчет финансирования на эксплуатационное содержание для региона
 */
export function calculateTotalFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  priceIndexes: PriceIndexes
): { 
  stateFunding: number; 
  localFunding: number; 
  totalFunding: number;
  details: {
    stateRoadLength: number;
    localRoadLength: number;
    stateRoadBaseRate: number;
    localRoadBaseRate: number;
    appliedCoefficients: Record<string, number>;
  }
} {
  const stateFunding = calculateStateRoadMaintenanceFunding(
    region, 
    regionCoefficients,
    priceIndexes.inflationIndex
  );
  
  const localFunding = calculateLocalRoadMaintenanceFunding(
    region,
    regionCoefficients,
    priceIndexes.inflationIndex
  );
  
  const stateRoadSections = region.roadSections.filter(section => section.stateImportance);
  const localRoadSections = region.roadSections.filter(section => !section.stateImportance);
  
  const totalStateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);
  const totalLocalRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);
  
  // Детали расчета для отображения пользователю
  const details = {
    stateRoadLength: totalStateRoadLength,
    localRoadLength: totalLocalRoadLength,
    stateRoadBaseRate: STATE_ROAD_MAINTENANCE_BASE_COST * priceIndexes.inflationIndex,
    localRoadBaseRate: LOCAL_ROAD_MAINTENANCE_BASE_COST * priceIndexes.inflationIndex,
    appliedCoefficients: {
      mountainous: regionCoefficients.mountainous,
      operatingConditions: regionCoefficients.operatingConditions,
      stateServiceCoefficient: 1.16,
      trafficIntensityState: calculateTrafficIntensityCoefficient(stateRoadSections, totalStateRoadLength),
      trafficIntensityLocal: calculateTrafficIntensityCoefficient(localRoadSections, totalLocalRoadLength),
      europeanRoad: calculateEuropeanRoadCoefficient(stateRoadSections, totalStateRoadLength),
      borderCrossing: calculateBorderCrossingCoefficient(stateRoadSections, totalStateRoadLength),
      lighting: calculateLightingCoefficient(stateRoadSections, totalStateRoadLength),
      repair: calculateRepairCoefficient(stateRoadSections, totalStateRoadLength),
      criticalInfrastructure: calculateCriticalInfrastructureCoefficient(region.criticalInfrastructureCount)
    }
  };
  
  return {
    stateFunding,
    localFunding,
    totalFunding: stateFunding + localFunding,
    details
  };
}

// Вспомогательные функции для предопределенных данных
export function getRegionCoefficients(): RegionCoefficients[] {
  return [
    { regionalName: "АР Крим", mountainous: 1.15, operatingConditions: 1.15, criticalInfrastructure: 1.0 },
    { regionalName: "Івано-Франківська", mountainous: 1.13, operatingConditions: 1.13, criticalInfrastructure: 1.0 },
    { regionalName: "Вінницька", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Волинська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Дніпропетровська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Донецька", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.05 },
    { regionalName: "Житомирська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Закарпатська", mountainous: 1.11, operatingConditions: 1.11, criticalInfrastructure: 1.03 },
    { regionalName: "Запорізька", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Київська", mountainous: 1.0, operatingConditions: 1.15, criticalInfrastructure: 1.05 },
    { regionalName: "Кіровоградська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Луганська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.01 },
    { regionalName: "Львівська", mountainous: 1.04, operatingConditions: 1.04, criticalInfrastructure: 1.03 },
    { regionalName: "Миколаївська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Одеська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.01 },
    { regionalName: "Полтавська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Рівненська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Сумська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.01 },
    { regionalName: "Тернопільська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Харківська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.03 },
    { regionalName: "Херсонська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Хмельницька", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Черкаська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Чернігівська", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 },
    { regionalName: "Чернівецька", mountainous: 1.04, operatingConditions: 1.04, criticalInfrastructure: 1.0 },
    { regionalName: "м. Київ", mountainous: 1.0, operatingConditions: 1.15, criticalInfrastructure: 1.05 },
    { regionalName: "м. Севастополь", mountainous: 1.0, operatingConditions: 1.0, criticalInfrastructure: 1.0 }
  ]
}

// Генератор простих демонстраційних даних для регіону
export function generateSampleRegionData(regionalName: string): RegionRoads {
  const demoSections: RoadSection[] = [
    { category: 2, stateImportance: true, length: 120, trafficIntensity: 16000, hasEuropeanStatus: true, isBorderCrossing: false, hasLighting: true, recentlyRepaired: false },
    { category: 3, stateImportance: true, length: 80, trafficIntensity: 18000, hasEuropeanStatus: false, isBorderCrossing: true, hasLighting: false, recentlyRepaired: true },
    { category: 4, stateImportance: false, length: 250, trafficIntensity: 3000, hasEuropeanStatus: false, isBorderCrossing: false, hasLighting: false, recentlyRepaired: false },
    { category: 5, stateImportance: false, length: 400, trafficIntensity: 800, hasEuropeanStatus: false, isBorderCrossing: false, hasLighting: false, recentlyRepaired: false }
  ];
  return {
    regionalName,
    roadSections: demoSections,
    criticalInfrastructureCount: 5
  };
}

export const MAINTENANCE_CONSTANTS = {
  STATE_ROAD_BASE_COST: STATE_ROAD_MAINTENANCE_BASE_COST,
  LOCAL_ROAD_BASE_COST: LOCAL_ROAD_MAINTENANCE_BASE_COST,
  CATEGORY_COEFFICIENTS_STATE,
  CATEGORY_COEFFICIENTS_LOCAL,
  TRAFFIC_INTENSITY_COEFFICIENTS,
  CRITICAL_INFRASTRUCTURE_COEFFICIENTS,
  STATE_SERVICE_COEFFICIENT: 1.16
};