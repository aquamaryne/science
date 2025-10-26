// calculations.ts
// ✅ МОДУЛЬ РОЗРАХУНКІВ ФІНАНСУВАННЯ ЕКСПЛУАТАЦІЙНОГО УТРИМАННЯ АВТОМОБІЛЬНИХ ДОРІГ
// ✅ ЗГІДНО З РОЗДІЛОМ 3 МЕТОДИКИ: "ВИЗНАЧЕННЯ ФІНАНСУВАННЯ НА ЕУ ДОРІГ"
//
// Реалізовані формули з методики:
// - П.3.2: H_j^д = H^д × K_j^д × K_інф (нормативи для державних доріг)
// - П.3.3: H_j^м = H^м × K_j^м × K_інф (нормативи для місцевих доріг)
// - П.3.5: Q_i^д = Σ(H_j^д × L_ij^д) × K_д × K_г × K_уe × K_інт.д × K_e.д × K_мпп.д × K_осв × K_рем × K_кр.і
// - П.3.6: Q_i^м = Σ(H_j^м × L_ij^м) × K_г × K_уe × K_інт.м

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

// ✅ КОНСТАНТИ З МЕТОДИКИ (РОЗДІЛ 3)
// Базові нормативи H^д та H^м для доріг II категорії (цінах 2023 року)
const STATE_ROAD_MAINTENANCE_BASE_COST = 604.761; // тис. грн/км - H^д для державних доріг
const LOCAL_ROAD_MAINTENANCE_BASE_COST = 360.544; // тис. грн/км - H^м для місцевих доріг

// ✅ Додаток 3 - Коефіцієнти диференціювання K_j^д (для державних доріг)
// Згідно з п.3.2 методики для розрахунку H_j^д = H^д × K_j^д × K_інф
const CATEGORY_COEFFICIENTS_STATE: Record<number, number> = {
  1: 1.80, // I категорія
  2: 1.00, // II категорія (базова)
  3: 0.89, // III категорія
  4: 0.61, // IV категорія
  5: 0.39, // V категорія
};

// ✅ Додаток 3 - Коефіцієнти диференціювання K_j^м (для місцевих доріг)
// Згідно з п.3.3 методики для розрахунку H_j^м = H^м × K_j^м × K_інф
const CATEGORY_COEFFICIENTS_LOCAL: Record<number, number> = {
  1: 1.71, // I категорія
  2: 1.00, // II категорія (базова)
  3: 0.85, // III категорія
  4: 0.64, // IV категорія
  5: 0.40, // V категорія
};

// ✅ Додаток 7 - Коефіцієнти інтенсивності руху K_інт (п.3.5 методики)
const TRAFFIC_INTENSITY_COEFFICIENTS: Record<string, number> = {
  "15000-20000": 2.3,
  "20001-30000": 3.5,
  ">30000": 3.9,
};

// ✅ Додаток 8 - Коефіцієнти критичної інфраструктури K_кр.і (п.3.5 методики)
const CRITICAL_INFRASTRUCTURE_COEFFICIENTS: Record<string, number> = {
  "1-5": 1.01,   // від 1 до 5 об'єктів
  "5-10": 1.03,  // від 5 до 10 об'єктів
  ">10": 1.05,   // більше 10 об'єктів
};

/**
 * ✅ П.3.2 МЕТОДИКИ - Розрахунок приведеного нормативу для державних доріг
 * Формула: H_j^д = H^д × K_j^д × K_інф
 * де:
 *   H_j^д - приведений норматив для j-ї категорії державних доріг
 *   H^д - базовий норматив для II категорії державних доріг (604.761 тис. грн/км)
 *   K_j^д - коефіцієнт диференціювання з Додатку 3
 *   K_інф - сукупний індекс інфляції
 */
export function calculateStateRoadMaintenanceRate(
  category: number,
  inflationIndex: number
): number {
  const categoryCoefficient = CATEGORY_COEFFICIENTS_STATE[category] || 1;
  return STATE_ROAD_MAINTENANCE_BASE_COST * categoryCoefficient * inflationIndex;
}

/**
 * ✅ П.3.3 МЕТОДИКИ - Розрахунок приведеного нормативу для місцевих доріг
 * Формула: H_j^м = H^м × K_j^м × K_інф
 * де:
 *   H_j^м - приведений норматив для j-ї категорії місцевих доріг
 *   H^м - базовий норматив для II категорії місцевих доріг (360.544 тис. грн/км)
 *   K_j^м - коефіцієнт диференціювання з Додатку 3
 *   K_інф - сукупний індекс інфляції
 */
export function calculateLocalRoadMaintenanceRate(
  category: number,
  inflationIndex: number
): number {
  const categoryCoefficient = CATEGORY_COEFFICIENTS_LOCAL[category] || 1;
  return LOCAL_ROAD_MAINTENANCE_BASE_COST * categoryCoefficient * inflationIndex;
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок коефіцієнта K_інт.д
 * Враховує фактичну інтенсивність руху для державних доріг
 * Формула: K_інт.д = (Σ(C_інт × L_інт.д) + (L_i^д - Σ L_інт.д)) / L_i^д
 * Коефіцієнти C_інт з Додатку 7:
 *   15000-20000 авт./добу: 2.3
 *   20001-30000 авт./добу: 3.5
 *   >30000 авт./добу: 3.9
 */
export function calculateTrafficIntensityCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних про фактичну інтенсивність руху, коефіцієнт = 1
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

  // ✅ Формула з п.3.5: (Σ(C_інт × L_інт.д) + (L_i^д - Σ L_інт.д)) / L_i^д
  return (sumProduct + (totalLength - sumLengthHighIntensity)) / totalLength;
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок коефіцієнта K_e.д
 * Враховує дороги, що входять до європейської мережі (індекс Е)
 * Формула: K_e.д = (Σ(C_e × L_e.д) + (L_i^д - Σ L_e.д)) / L_i^д
 * де C_e = 1.5
 */
export function calculateEuropeanRoadCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних, коефіцієнт = 1
  if (!roadSections.length || !totalLength) return 1;

  const europeanSections = roadSections.filter(section => section.hasEuropeanStatus);

  if (europeanSections.length === 0) return 1;

  const europeanCoefficient = 1.5;
  let sumLengthEuropean = 0;

  for (const section of europeanSections) {
    sumLengthEuropean += section.length;
  }

  // ✅ Формула з п.3.5: (Σ(C_e × L_e.д) + (L_i^д - Σ L_e.д)) / L_i^д
  return (europeanCoefficient * sumLengthEuropean + (totalLength - sumLengthEuropean)) / totalLength;
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок коефіцієнта K_мпп.д
 * Враховує дороги біля міжнародних пунктів пропуску через кордон
 * Формула: K_мпп.д = (Σ(C_мпп × L_мпп.д) + (L_i^д - Σ L_мпп.д)) / L_i^д
 * де C_мпп = 1.5
 */
export function calculateBorderCrossingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних, коефіцієнт = 1
  if (!roadSections.length || !totalLength) return 1;

  const borderSections = roadSections.filter(section => section.isBorderCrossing);

  if (borderSections.length === 0) return 1;

  const borderCoefficient = 1.5;
  let sumLengthBorder = 0;

  for (const section of borderSections) {
    sumLengthBorder += section.length;
  }

  // ✅ Формула з п.3.5: (Σ(C_мпп × L_мпп.д) + (L_i^д - Σ L_мпп.д)) / L_i^д
  return (borderCoefficient * sumLengthBorder + (totalLength - sumLengthBorder)) / totalLength;
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок коефіцієнта K_осв
 * Враховує дороги з освітленням
 * Формула: K_осв = (Σ(C_осв × L_осв) + (L_i^д - Σ L_осв)) / L_i^д
 * де C_осв = 2.0
 */
export function calculateLightingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних, коефіцієнт = 1
  if (!roadSections.length || !totalLength) return 1;

  const lightedSections = roadSections.filter(section => section.hasLighting);

  if (lightedSections.length === 0) return 1;

  const lightingCoefficient = 2.0;
  let sumLengthLighted = 0;

  for (const section of lightedSections) {
    sumLengthLighted += section.length;
  }

  // ✅ Формула з п.3.5: (Σ(C_осв × L_осв) + (L_i^д - Σ L_осв)) / L_i^д
  return (lightingCoefficient * sumLengthLighted + (totalLength - sumLengthLighted)) / totalLength;
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок коефіцієнта K_рем
 * Враховує дороги, на яких проведено ремонт за останні 5 років
 * Формула: K_рем = (Σ(C_рем × L_рем) + (L_i^д - Σ L_рем)) / L_i^д
 * де C_рем = 0.5 (зниження через меншу потребу в утриманні)
 */
export function calculateRepairCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних, коефіцієнт = 1
  if (!roadSections.length || !totalLength) return 1;

  const repairedSections = roadSections.filter(section => section.recentlyRepaired);

  if (repairedSections.length === 0) return 1;

  const repairCoefficient = 0.5; // Зниження через меншу потребу в утриманні
  let sumLengthRepaired = 0;

  for (const section of repairedSections) {
    sumLengthRepaired += section.length;
  }

  // ✅ Формула з п.3.5: (Σ(C_рем × L_рем) + (L_i^д - Σ L_рем)) / L_i^д
  return (repairCoefficient * sumLengthRepaired + (totalLength - sumLengthRepaired)) / totalLength;
}

/**
 * ✅ П.3.5 МЕТОДИКИ + ДОДАТОК 8 - Розрахунок коефіцієнта K_кр.і
 * Враховує об'єкти критичної інфраструктури
 * Значення з Додатку 8:
 *   1-5 об'єктів: 1.01
 *   5-10 об'єктів: 1.03
 *   >10 об'єктів: 1.05
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
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок обсягу фінансування для державних доріг
 * Формула: Q_i^д = Σ(H_j^д × L_ij^д) × K_д × K_г × K_уe × K_інт.д × K_e.д × K_мпп.д × K_осв × K_рем × K_кр.і
 * де:
 *   Q_i^д - обсяг фінансування для i-го регіону (державні дороги)
 *   Σ(H_j^д × L_ij^д) - сума добутків нормативів на протяжність по категоріях
 *   K_д = 1.16 - коефіцієнт обслуговування державних доріг
 *   K_г - коефіцієнт гірської місцевості (з регіональних коефіцієнтів)
 *   K_уe - коефіцієнт умов експлуатації (з регіональних коефіцієнтів)
 *   K_інт.д - коефіцієнт інтенсивності руху (Додаток 7)
 *   K_e.д - коефіцієнт європейських доріг (індекс Е)
 *   K_мпп.д - коефіцієнт міжнародних пунктів пропуску
 *   K_осв - коефіцієнт освітлення
 *   K_рем - коефіцієнт ремонту
 *   K_кр.і - коефіцієнт критичної інфраструктури (Додаток 8)
 */
export function calculateStateRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const stateRoadSections = region.roadSections.filter(section => section.stateImportance);

  if (stateRoadSections.length === 0) return 0;

  // Розрахунок загальної протяжності державних доріг
  const totalStateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);

  // ✅ Розрахунок базової суми Σ(H_j^д × L_ij^д) по категоріях доріг
  let baseFunding = 0;
  for (const section of stateRoadSections) {
    const rate = calculateStateRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }

  // ✅ Розрахунок всіх коефіцієнтів з п.3.5
  const trafficIntensityCoefficient = calculateTrafficIntensityCoefficient(stateRoadSections, totalStateRoadLength);
  const europeanRoadCoefficient = calculateEuropeanRoadCoefficient(stateRoadSections, totalStateRoadLength);
  const borderCrossingCoefficient = calculateBorderCrossingCoefficient(stateRoadSections, totalStateRoadLength);
  const lightingCoefficient = calculateLightingCoefficient(stateRoadSections, totalStateRoadLength);
  const repairCoefficient = calculateRepairCoefficient(stateRoadSections, totalStateRoadLength);
  const criticalInfrastructureCoefficient = calculateCriticalInfrastructureCoefficient(region.criticalInfrastructureCount);

  // ✅ K_д = 1.16 - коефіцієнт обслуговування державних доріг (тільки для державних!)
  const serviceCoefficient = 1.16;

  // ✅ ПОВНА ФОРМУЛА З П.3.5 МЕТОДИКИ
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
 * ✅ П.3.6 МЕТОДИКИ - Розрахунок обсягу фінансування для місцевих доріг
 * Формула: Q_i^м = Σ(H_j^м × L_ij^м) × K_г × K_уe × K_інт.м
 * де:
 *   Q_i^м - обсяг фінансування для i-го регіону (місцеві дороги)
 *   Σ(H_j^м × L_ij^м) - сума добутків нормативів на протяжність по категоріях
 *   K_г - коефіцієнт гірської місцевості (з регіональних коефіцієнтів)
 *   K_уe - коефіцієнт умов експлуатації (з регіональних коефіцієнтів)
 *   K_інт.м - коефіцієнт інтенсивності руху для місцевих доріг
 *
 * ⚠️ УВАГА: Для місцевих доріг НЕ використовується K_д = 1.16!
 * ⚠️ Також не використовуються K_e.д, K_мпп.д, K_осв, K_рем, K_кр.і
 */
export function calculateLocalRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const localRoadSections = region.roadSections.filter(section => !section.stateImportance);

  if (localRoadSections.length === 0) return 0;

  // Розрахунок загальної протяжності місцевих доріг
  const totalLocalRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);

  // ✅ Розрахунок базової суми Σ(H_j^м × L_ij^м) по категоріях доріг
  let baseFunding = 0;
  for (const section of localRoadSections) {
    const rate = calculateLocalRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }

  // ✅ Розрахунок коефіцієнта інтенсивності для місцевих доріг
  const trafficIntensityCoefficient = calculateTrafficIntensityCoefficient(localRoadSections, totalLocalRoadLength);

  // ✅ ПОВНА ФОРМУЛА З П.3.6 МЕТОДИКИ (СПРОЩЕНА ВІДНОСНО П.3.5)
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