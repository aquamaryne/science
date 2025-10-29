// calculations.ts
// ✅ МОДУЛЬ РОЗРАХУНКІВ ФІНАНСУВАННЯ ЕКСПЛУАТАЦІЙНОГО УТРИМАННЯ АВТОМОБІЛЬНИХ ДОРІГ
// ✅ ЗГІДНО З РОЗДІЛОМ III МЕТОДИКИ: "ВИЗНАЧЕННЯ ФІНАНСУВАННЯ НА ЕУ ДОРІГ"
//
// Реалізовані формули з методики:
// - П.3.2: H_j^о = H^о × K_j^о × K_інф (нормативи для державних доріг)
// - П.3.3: H_j^м = H^м × K_j^м × K_інф (нормативи для місцевих доріг)
// - П.3.5: Q_i^о = Σ(j=1→5)(H_j^о × L_ij^о) × K_д × K_г × K_уe × K_інт.д^i × K_e.д^i × K_мпп.д^i × K_осв^i × K_рем^i × K_кр.і^i
// - П.3.6: Q_i^м = Σ(j=1→5)(H_j^м × L_ij^м) × K_г × K_уe × K_інт.м^i

// Структуры данных для расчетов
export interface RoadCategory {
  category: 1 | 2 | 3 | 4 | 5; // категория дороги (I-V)
  stateImportance: boolean; // дорога государственного значения (true) или местного (false)
}

export interface RegionCoefficients {
  regionalName: string; // название области/региона
  mountainous: number; // коэффициент K_г - учитывает прохождение дорог в горной местности (Додаток 6)
  operatingConditions: number; // коэффициент K_уе - условия эксплуатации сети дорог (Додаток 7)
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
}

export interface RegionRoads {
  regionalName: string; // название области/региона
  roadSections: RoadSection[]; // участки дорог в области
  criticalInfrastructureCount: number; // количество объектов критической инфраструктуры
}

export interface PriceIndexes {
  inflationIndex: number; // индекс инфляции K_інф
}

// ✅ КОНСТАНТИ З МЕТОДИКИ (РОЗДІЛ III)
// Базові нормативи H^о та H^м для доріг II категорії (у цінах 2023 року)
const STATE_ROAD_MAINTENANCE_BASE_COST = 604.761; // тис. грн/км - H^о для державних доріг
const LOCAL_ROAD_MAINTENANCE_BASE_COST = 360.544; // тис. грн/км - H^м для місцевих доріг

// ✅ Додаток 3 - Коефіцієнти диференціювання K_j^о (для державних доріг)
// Згідно з п.3.2 методики для розрахунку H_j^о = H^о × K_j^о × K_інф
const CATEGORY_COEFFICIENTS_STATE: Record<number, number> = {
  1: 1.80, // I категорія
  2: 1.00, // II категорія (базова)
  3: 0.89, // III категорія
  4: 0.61, // IV категорія
  5: 0.39, // V категорія
};

// ✅ Додаток 4 - Коефіцієнти диференціювання K_j^м (для місцевих доріг)
// Згідно з п.3.3 методики для розрахунку H_j^м = H^м × K_j^м × K_інф
const CATEGORY_COEFFICIENTS_LOCAL: Record<number, number> = {
  1: 1.71, // I категорія
  2: 1.00, // II категорія (базова)
  3: 0.85, // III категорія
  4: 0.64, // IV категорія
  5: 0.40, // V категорія
};

// ✅ Додаток 8 (сторінка 30) - Коефіцієнти C_інт для K_інт.д^i та K_інт.м^i (п.3.5, п.3.6 методики)
const TRAFFIC_INTENSITY_COEFFICIENTS: Record<string, number> = {
  "15000-20000": 2.3,
  "20001-30000": 3.5,
  ">30000": 3.9,
};

// ✅ Додаток 9 (сторінка 31) - Коефіцієнти K_кр.і^i (п.3.5 методики)
const CRITICAL_INFRASTRUCTURE_COEFFICIENTS: Record<string, number> = {
  "0": 1.00,     // 0 об'єктів
  "1-4": 1.01,   // від 1 до 4 об'єктів
  "5-9": 1.03,   // від 5 до 9 об'єктів
  ">=10": 1.05,  // 10 і більше об'єктів
};

// ✅ Константи з методики для коефіцієнтів
const EUROPEAN_ROAD_COEFFICIENT = 1.5;      // C_e (п.3.5)
const BORDER_CROSSING_COEFFICIENT = 1.5;    // C_мпп (п.3.5)
const LIGHTING_COEFFICIENT = 2.0;           // C_осв (п.3.5)
const REPAIR_COEFFICIENT = 0.5;             // C_рем (п.3.5)
const STATE_SERVICE_COEFFICIENT = 1.16;     // K_д (п.3.5) - тільки для державних доріг!

/**
 * ✅ П.3.2 МЕТОДИКИ - Розрахунок приведеного нормативу для державних доріг
 * Формула: H_j^о = H^о × K_j^о × K_інф
 * де:
 *   H_j^о - приведений норматив для j-ї категорії державних доріг, тис. грн/км
 *   H^о - базовий норматив для II категорії державних доріг (604,761 тис. грн/км, ціни 2023)
 *   K_j^о - коефіцієнт диференціювання з Додатку 3
 *   K_інф - індекс інфляції
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
 *   H_j^м - приведений норматив для j-ї категорії місцевих доріг, тис. грн/км
 *   H^м - базовий норматив для II категорії місцевих доріг (360,544 тис. грн/км, ціни 2023)
 *   K_j^м - коефіцієнт диференціювання з Додатку 4
 *   K_інф - індекс інфляції
 */
export function calculateLocalRoadMaintenanceRate(
  category: number,
  inflationIndex: number
): number {
  const categoryCoefficient = CATEGORY_COEFFICIENTS_LOCAL[category] || 1;
  return LOCAL_ROAD_MAINTENANCE_BASE_COST * categoryCoefficient * inflationIndex;
}

/**
 * ✅ П.3.5 МЕТОДИКИ (сторінка 6) - Розрахунок коефіцієнта K_інт.д^i
 * Враховує фактичну інтенсивність руху для державних доріг
 * 
 * Формула: K_інт.д^i = [Σ(a=1→k)(C_інт^a × L_інт.д^a) + (L_i^о - Σ(a=1→k)L_інт.д^a)] / L_i^о
 * 
 * де:
 *   k - кількість ділянок з інтенсивністю > 15000 авт./добу
 *   C_інт^a - коефіцієнт з Додатку 8 залежно від інтенсивності a-ої ділянки
 *   L_інт.д^a - протяжність a-ої ділянки з високою інтенсивністю, км
 *   L_i^о - загальна протяжність державних доріг у регіоні, км
 * 
 * Коефіцієнти C_інт з Додатку 8:
 *   15000-20000 авт./добу: 2,3
 *   20001-30000 авт./добу: 3,5
 *   >30000 авт./добу: 3,9
 * 
 * ⚠️ ПРИМІТКА (стор.9): Якщо до ділянки можна застосувати C_інт, C_e або C_мпп,
 *    обирається ТІЛЬКИ ОДИН коефіцієнт з найбільшим значенням!
 */
export function calculateTrafficIntensityCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  // Якщо немає даних про фактичну інтенсивність руху, K_інт.д^i = 1
  if (!roadSections.length || !totalLength) return 1.0;

  const highIntensitySections = roadSections.filter(
    section => section.trafficIntensity > 15000
  );

  if (highIntensitySections.length === 0) return 1.0;

  let sumProduct = 0;
  let sumLengthHighIntensity = 0;

  for (const section of highIntensitySections) {
    let intensityCoefficient: number;

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

  // ✅ Формула з п.3.5: [Σ(C_інт × L_інт.д) + (L_i^о - Σ L_інт.д)] / L_i^о
  const coefficient = (sumProduct + (totalLength - sumLengthHighIntensity)) / totalLength;
  
  // Коефіцієнт не може бути < 1 за логікою формули
  return Math.max(coefficient, 1.0);
}

/**
 * ✅ П.3.5 МЕТОДИКИ (сторінка 7) - Розрахунок коефіцієнта K_e.д^i
 * Враховує дороги європейської мережі (з індексом Е)
 * 
 * Формула: K_e.д^i = [Σ(f=1→x)(C_e × L_e.д^f) + (L_i^о - Σ(f=1→x)L_e.д^f)] / L_i^о
 * 
 * де:
 *   x - кількість ділянок з індексом Е
 *   C_e = 1,5 - коефіцієнт для європейських доріг
 *   L_e.д^f - протяжність f-ої ділянки з індексом Е, км
 *   L_i^о - загальна протяжність державних доріг у регіоні, км
 */
export function calculateEuropeanRoadCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  if (!roadSections.length || !totalLength) return 1.0;

  const europeanSections = roadSections.filter(section => section.hasEuropeanStatus);

  if (europeanSections.length === 0) return 1.0;

  let sumLengthEuropean = 0;
  for (const section of europeanSections) {
    sumLengthEuropean += section.length;
  }

  // ✅ Формула: [C_e × Σ L_e.д + (L_i^о - Σ L_e.д)] / L_i^о
  const coefficient = 
    (EUROPEAN_ROAD_COEFFICIENT * sumLengthEuropean + (totalLength - sumLengthEuropean)) / totalLength;
  
  return Math.max(coefficient, 1.0);
}

/**
 * ✅ П.3.5 МЕТОДИКИ (сторінка 7) - Розрахунок коефіцієнта K_мпп.д^i
 * Враховує дороги біля міжнародних пунктів пропуску через кордон
 * 
 * Формула: K_мпп.д^i = [Σ(c=1→t)(C_мпп × L_мпп.д^c) + (L_i^о - Σ(c=1→t)L_мпп.д^c)] / L_i^о
 * 
 * де:
 *   t - кількість ділянок біля МППК
 *   C_мпп = 1,5 - коефіцієнт для ділянок біля МППК
 *   L_мпп.д^c - протяжність c-ої ділянки біля МППК, км
 *     (від контрольно-пропускного пункту до першого розгалуження, але не більше 20 км)
 *   L_i^о - загальна протяжність державних доріг у регіоні, км
 */
export function calculateBorderCrossingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  if (!roadSections.length || !totalLength) return 1.0;

  const borderSections = roadSections.filter(section => section.isBorderCrossing);

  if (borderSections.length === 0) return 1.0;

  let sumLengthBorder = 0;
  for (const section of borderSections) {
    sumLengthBorder += section.length;
  }

  // ✅ Формула: [C_мпп × Σ L_мпп.д + (L_i^о - Σ L_мпп.д)] / L_i^о
  const coefficient = 
    (BORDER_CROSSING_COEFFICIENT * sumLengthBorder + (totalLength - sumLengthBorder)) / totalLength;
  
  return Math.max(coefficient, 1.0);
}

/**
 * ✅ П.3.5 МЕТОДИКИ (сторінка 8) - Розрахунок коефіцієнта K_осв^i
 * Враховує дороги з освітленням
 * 
 * Формула: K_осв^i = [Σ(d=1→u)(C_осв × L_осв^d) + (L_i^о - Σ(d=1→u)L_осв^d)] / L_i^о
 * 
 * де:
 *   u - кількість ділянок з освітленням
 *   C_осв = 2,0 - коефіцієнт для ділянок з освітленням
 *   L_осв^d - протяжність d-ої ділянки з освітленням, км
 *   L_i^о - загальна протяжність державних доріг у регіоні, км
 */
export function calculateLightingCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  if (!roadSections.length || !totalLength) return 1.0;

  const lightedSections = roadSections.filter(section => section.hasLighting);

  if (lightedSections.length === 0) return 1.0;

  let sumLengthLighted = 0;
  for (const section of lightedSections) {
    sumLengthLighted += section.length;
  }

  // ✅ Формула: [C_осв × Σ L_осв + (L_i^о - Σ L_осв)] / L_i^о
  const coefficient = 
    (LIGHTING_COEFFICIENT * sumLengthLighted + (totalLength - sumLengthLighted)) / totalLength;
  
  return Math.max(coefficient, 1.0);
}

/**
 * ✅ П.3.5 МЕТОДИКИ (сторінка 8) - Розрахунок коефіцієнта K_рем^i
 * Враховує дороги з нещодавнім ремонтом (останні 5 років)
 * 
 * Формула: K_рем^i = [Σ(e=1→v)(C_рем × L_рем^e) + (L_i^о - Σ(e=1→v)L_рем^e)] / L_i^о
 * 
 * де:
 *   v - кількість ділянок після ремонту
 *   C_рем = 0,5 - коефіцієнт зниження витрат (менша потреба в утриманні)
 *   L_рем^e - протяжність e-ої ділянки після ремонту, км
 *   L_i^о - загальна протяжність державних доріг у регіоні, км
 */
export function calculateRepairCoefficient(
  roadSections: RoadSection[],
  totalLength: number
): number {
  if (!roadSections.length || !totalLength) return 1.0;

  const repairedSections = roadSections.filter(section => section.recentlyRepaired);

  if (repairedSections.length === 0) return 1.0;

  let sumLengthRepaired = 0;
  for (const section of repairedSections) {
    sumLengthRepaired += section.length;
  }

  // ✅ Формула: [C_рем × Σ L_рем + (L_i^о - Σ L_рем)] / L_i^о
  const coefficient = 
    (REPAIR_COEFFICIENT * sumLengthRepaired + (totalLength - sumLengthRepaired)) / totalLength;
  
  return Math.max(coefficient, 0.5); // Не менше 0,5 (найкращий випадок - всі дороги після ремонту)
}

/**
 * ✅ П.3.5 МЕТОДИКИ + ДОДАТОК 9 (сторінка 31) - Розрахунок коефіцієнта K_кр.і^i
 * Враховує об'єкти критичної інфраструктури
 *
 * Значення з Додатку 9:
 *   0 об'єктів: 1,00
 *   1-4 об'єктів: 1,01
 *   5-9 об'єктів: 1,03
 *   10+ об'єктів: 1,05
 */
export function calculateCriticalInfrastructureCoefficient(
  criticalInfrastructureCount: number
): number {
  if (criticalInfrastructureCount === 0) {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS["0"];
  } else if (criticalInfrastructureCount >= 10) {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS[">=10"];
  } else if (criticalInfrastructureCount >= 5) {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS["5-9"];
  } else {
    return CRITICAL_INFRASTRUCTURE_COEFFICIENTS["1-4"];
  }
}

/**
 * ⚠️ КРИТИЧНО ВАЖЛИВЕ ПРАВИЛО (сторінка 9 методики):
 * "Якщо до окремих ділянок автомобільних доріг можна застосувати одночасно
 *  коефіцієнти C_інт^a, C_e або C_мпп, то для розрахунку обирається лише один
 *  з найбільшим значенням."
 * 
 * Ця функція визначає, який коефіцієнт застосовувати для кожної ділянки.
 */
function getMaxApplicableCoefficient(section: RoadSection): {
  type: 'traffic' | 'european' | 'border' | 'none';
  value: number;
} {
  const coefficients: Array<{ type: 'traffic' | 'european' | 'border', value: number }> = [];

  // Перевіряємо інтенсивність руху
  if (section.trafficIntensity > 30000) {
    coefficients.push({ type: 'traffic', value: TRAFFIC_INTENSITY_COEFFICIENTS[">30000"] });
  } else if (section.trafficIntensity > 20000) {
    coefficients.push({ type: 'traffic', value: TRAFFIC_INTENSITY_COEFFICIENTS["20001-30000"] });
  } else if (section.trafficIntensity > 15000) {
    coefficients.push({ type: 'traffic', value: TRAFFIC_INTENSITY_COEFFICIENTS["15000-20000"] });
  }

  // Перевіряємо європейський статус
  if (section.hasEuropeanStatus) {
    coefficients.push({ type: 'european', value: EUROPEAN_ROAD_COEFFICIENT });
  }

  // Перевіряємо прикордонний статус
  if (section.isBorderCrossing) {
    coefficients.push({ type: 'border', value: BORDER_CROSSING_COEFFICIENT });
  }

  // Обираємо максимальний коефіцієнт
  if (coefficients.length === 0) {
    return { type: 'none', value: 1.0 };
  }

  coefficients.sort((a, b) => b.value - a.value);
  return coefficients[0];
}

/**
 * ✅ ВИПРАВЛЕНА ВЕРСІЯ - Розрахунок коефіцієнтів з урахуванням правила вибору максимального
 */
export function calculateCorrectCoefficients(
  roadSections: RoadSection[],
  totalLength: number
): {
  trafficIntensity: number;
  europeanRoad: number;
  borderCrossing: number;
} {
  if (!roadSections.length || !totalLength) {
    return { trafficIntensity: 1.0, europeanRoad: 1.0, borderCrossing: 1.0 };
  }

  let trafficSum = 0;
  let europeanSum = 0;
  let borderSum = 0;
  let trafficLength = 0;
  let europeanLength = 0;
  let borderLength = 0;

  for (const section of roadSections) {
    const maxCoeff = getMaxApplicableCoefficient(section);

    switch (maxCoeff.type) {
      case 'traffic':
        trafficSum += maxCoeff.value * section.length;
        trafficLength += section.length;
        break;
      case 'european':
        europeanSum += maxCoeff.value * section.length;
        europeanLength += section.length;
        break;
      case 'border':
        borderSum += maxCoeff.value * section.length;
        borderLength += section.length;
        break;
    }
  }

  const trafficIntensity = 
    (trafficSum + (totalLength - trafficLength)) / totalLength;
  const europeanRoad = 
    (europeanSum + (totalLength - europeanLength)) / totalLength;
  const borderCrossing = 
    (borderSum + (totalLength - borderLength)) / totalLength;

  return {
    trafficIntensity: Math.max(trafficIntensity, 1.0),
    europeanRoad: Math.max(europeanRoad, 1.0),
    borderCrossing: Math.max(borderCrossing, 1.0),
  };
}

/**
 * ✅ П.3.5 МЕТОДИКИ - Розрахунок обсягу фінансування для державних доріг
 * 
 * Формула: Q_i^о = Σ(j=1→5)(H_j^о × L_ij^о) × K_д × K_г × K_уe × K_інт.д^i × K_e.д^i × K_мпп.д^i × K_осв^i × K_рем^i × K_кр.і^i
 * 
 * де:
 *   Q_i^о - обсяг фінансування для i-го регіону (державні дороги), тис. грн
 *   Σ(j=1→5)(H_j^о × L_ij^о) - сума добутків нормативів на протяжність по 5 категоріях
 *   K_д = 1,16 - коефіцієнт обслуговування державних доріг (п.3.5)
 *   K_г - коефіцієнт гірської місцевості (Додаток 6)
 *   K_уe - коефіцієнт умов експлуатації (Додаток 7)
 *   K_інт.д^i - коефіцієнт інтенсивності руху (Додаток 8)
 *   K_e.д^i - коефіцієнт європейських доріг
 *   K_мпп.д^i - коефіцієнт міжнародних пунктів пропуску
 *   K_осв^i - коефіцієнт освітлення
 *   K_рем^i - коефіцієнт ремонту
 *   K_кр.і^i - коефіцієнт критичної інфраструктури (Додаток 9)
 */
export function calculateStateRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const stateRoadSections = region.roadSections.filter(section => section.stateImportance);

  if (stateRoadSections.length === 0) return 0;

  // Розрахунок загальної протяжності L_i^о
  const totalStateRoadLength = stateRoadSections.reduce((sum, section) => sum + section.length, 0);

  // ✅ Розрахунок базової суми Σ(j=1→5)(H_j^о × L_ij^о)
  let baseFunding = 0;
  for (const section of stateRoadSections) {
    const rate = calculateStateRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }

  // ✅ Розрахунок коефіцієнтів з урахуванням правила максимального вибору
  const correctCoefficients = calculateCorrectCoefficients(
    stateRoadSections,
    totalStateRoadLength
  );

  // Інші коефіцієнти (освітлення, ремонт) застосовуються незалежно
  const lightingCoefficient = calculateLightingCoefficient(stateRoadSections, totalStateRoadLength);
  const repairCoefficient = calculateRepairCoefficient(stateRoadSections, totalStateRoadLength);
  const criticalInfrastructureCoefficient = calculateCriticalInfrastructureCoefficient(
    region.criticalInfrastructureCount
  );

  // ✅ ПОВНА ФОРМУЛА З П.3.5 МЕТОДИКИ
  return (
    baseFunding *
    STATE_SERVICE_COEFFICIENT * // K_д = 1,16
    regionCoefficients.mountainous * // K_г
    regionCoefficients.operatingConditions * // K_уe
    correctCoefficients.trafficIntensity * // K_інт.д^i
    correctCoefficients.europeanRoad * // K_e.д^i
    correctCoefficients.borderCrossing * // K_мпп.д^i
    lightingCoefficient * // K_осв^i
    repairCoefficient * // K_рем^i
    criticalInfrastructureCoefficient // K_кр.і^i
  );
}

/**
 * ✅ П.3.6 МЕТОДИКИ - Розрахунок обсягу фінансування для місцевих доріг
 * 
 * Формула: Q_i^м = Σ(j=1→5)(H_j^м × L_ij^м) × K_г × K_уe × K_інт.м^i
 * 
 * де:
 *   Q_i^м - обсяг фінансування для i-го регіону (місцеві дороги), тис. грн
 *   Σ(j=1→5)(H_j^м × L_ij^м) - сума добутків нормативів на протяжність по 5 категоріях
 *   K_г - коефіцієнт гірської місцевості (Додаток 6)
 *   K_уe - коефіцієнт умов експлуатації (Додаток 7)
 *   K_інт.м^i - коефіцієнт інтенсивності руху для місцевих доріг
 * 
 * ⚠️ УВАГА: Для місцевих доріг НЕ використовується K_д = 1,16!
 * ⚠️ Також не використовуються K_e.д, K_мпп.д, K_осв, K_рем, K_кр.і
 */
export function calculateLocalRoadMaintenanceFunding(
  region: RegionRoads,
  regionCoefficients: RegionCoefficients,
  inflationIndex: number
): number {
  const localRoadSections = region.roadSections.filter(section => !section.stateImportance);

  if (localRoadSections.length === 0) return 0;

  // Розрахунок загальної протяжності L_i^м
  const totalLocalRoadLength = localRoadSections.reduce((sum, section) => sum + section.length, 0);

  // ✅ Розрахунок базової суми Σ(j=1→5)(H_j^м × L_ij^м)
  let baseFunding = 0;
  for (const section of localRoadSections) {
    const rate = calculateLocalRoadMaintenanceRate(section.category, inflationIndex);
    baseFunding += rate * section.length;
  }

  // ✅ Розрахунок K_інт.м^i (тільки інтенсивність руху)
  const trafficIntensityCoefficient = calculateTrafficIntensityCoefficient(
    localRoadSections,
    totalLocalRoadLength
  );

  // ✅ ПОВНА ФОРМУЛА З П.3.6 МЕТОДИКИ (СПРОЩЕНА)
  return (
    baseFunding *
    regionCoefficients.mountainous * // K_г
    regionCoefficients.operatingConditions * // K_уe
    trafficIntensityCoefficient // K_інт.м^i
  );
}

/**
 * ✅ П.3.7 МЕТОДИКИ - Загальний обсяг фінансування для регіону
 * 
 * Формула: Q = Σ(i=1→26)(Q_i^о + Q_i^м)
 * 
 * де:
 *   Q - загальний обсяг по країні
 *   26 - кількість адміністративно-територіальних одиниць
 *   Q_i^о - фінансування державних доріг i-го регіону
 *   Q_i^м - фінансування місцевих доріг i-го регіону
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
  };
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

  // Розрахунок коефіцієнтів для деталей
  const stateCorrectCoefficients = calculateCorrectCoefficients(
    stateRoadSections,
    totalStateRoadLength
  );

  const details = {
    stateRoadLength: totalStateRoadLength,
    localRoadLength: totalLocalRoadLength,
    stateRoadBaseRate: STATE_ROAD_MAINTENANCE_BASE_COST * priceIndexes.inflationIndex,
    localRoadBaseRate: LOCAL_ROAD_MAINTENANCE_BASE_COST * priceIndexes.inflationIndex,
    appliedCoefficients: {
      mountainous: regionCoefficients.mountainous,
      operatingConditions: regionCoefficients.operatingConditions,
      stateServiceCoefficient: STATE_SERVICE_COEFFICIENT,
      trafficIntensityState: stateCorrectCoefficients.trafficIntensity,
      trafficIntensityLocal: calculateTrafficIntensityCoefficient(localRoadSections, totalLocalRoadLength),
      europeanRoad: stateCorrectCoefficients.europeanRoad,
      borderCrossing: stateCorrectCoefficients.borderCrossing,
      lighting: calculateLightingCoefficient(stateRoadSections, totalStateRoadLength),
      repair: calculateRepairCoefficient(stateRoadSections, totalStateRoadLength),
      criticalInfrastructure: calculateCriticalInfrastructureCoefficient(region.criticalInfrastructureCount),
    },
  };

  return {
    stateFunding,
    localFunding,
    totalFunding: stateFunding + localFunding,
    details,
  };
}

// ✅ ДОДАТОК 6 (сторінка 28) + ДОДАТОК 7 (сторінка 29) - Регіональні коефіцієнти
export function getRegionCoefficients(): RegionCoefficients[] {
  return [
    { regionalName: "АР Крим", mountainous: 1.15, operatingConditions: 1.15 },
    { regionalName: "м. Севастополь", mountainous: 1.15, operatingConditions: 1.15 },
    { regionalName: "Київська", mountainous: 1.15, operatingConditions: 1.15 },
    { regionalName: "м. Київ", mountainous: 1.15, operatingConditions: 1.15 },
    { regionalName: "Івано-Франківська", mountainous: 1.13, operatingConditions: 1.13 },
    { regionalName: "Закарпатська", mountainous: 1.11, operatingConditions: 1.11 },
    { regionalName: "Львівська", mountainous: 1.04, operatingConditions: 1.04 },
    { regionalName: "Чернівецька", mountainous: 1.04, operatingConditions: 1.04 },
    { regionalName: "Вінницька", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Волинська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Дніпропетровська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Донецька", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Житомирська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Запорізька", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Кіровоградська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Луганська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Миколаївська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Одеська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Полтавська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Рівненська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Сумська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Тернопільська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Харківська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Херсонська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Хмельницька", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Черкаська", mountainous: 1.00, operatingConditions: 1.00 },
    { regionalName: "Чернігівська", mountainous: 1.00, operatingConditions: 1.00 },
  ];
}

// Генератор демонстраційних даних
export function generateSampleRegionData(regionalName: string): RegionRoads {
  const demoSections: RoadSection[] = [
    {
      category: 2,
      stateImportance: true,
      length: 120,
      trafficIntensity: 16000,
      hasEuropeanStatus: true,
      isBorderCrossing: false,
      hasLighting: true,
      recentlyRepaired: false,
    },
    {
      category: 3,
      stateImportance: true,
      length: 80,
      trafficIntensity: 25000,
      hasEuropeanStatus: false,
      isBorderCrossing: true,
      hasLighting: false,
      recentlyRepaired: true,
    },
    {
      category: 4,
      stateImportance: false,
      length: 250,
      trafficIntensity: 3000,
      hasEuropeanStatus: false,
      isBorderCrossing: false,
      hasLighting: false,
      recentlyRepaired: false,
    },
    {
      category: 5,
      stateImportance: false,
      length: 400,
      trafficIntensity: 800,
      hasEuropeanStatus: false,
      isBorderCrossing: false,
      hasLighting: false,
      recentlyRepaired: false,
    },
  ];

  return {
    regionalName,
    roadSections: demoSections,
    criticalInfrastructureCount: 6,
  };
}

export const MAINTENANCE_CONSTANTS = {
  STATE_ROAD_BASE_COST: STATE_ROAD_MAINTENANCE_BASE_COST,
  LOCAL_ROAD_BASE_COST: LOCAL_ROAD_MAINTENANCE_BASE_COST,
  CATEGORY_COEFFICIENTS_STATE,
  CATEGORY_COEFFICIENTS_LOCAL,
  TRAFFIC_INTENSITY_COEFFICIENTS,
  CRITICAL_INFRASTRUCTURE_COEFFICIENTS,
  STATE_SERVICE_COEFFICIENT,
  EUROPEAN_ROAD_COEFFICIENT,
  BORDER_CROSSING_COEFFICIENT,
  LIGHTING_COEFFICIENT,
  REPAIR_COEFFICIENT,
};