// roadFundingCalculator.ts
// Модуль с логикой расчетов по методике финансирования дорог

// Типы данных
export interface BudgetItem {
  id: string;
  name: string;
  value: number | null;
  normativeDocument?: string;
  tooltip: string;
  attachedFiles?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }[];
}

export interface RoadFundingData {
  stateRoadItems: BudgetItem[];
  localRoadItems: BudgetItem[];
  q1Result: number | null;
  q2Result: number | null;
}

// Начальные данные для государственных дорог
export const initialStateRoadItems: BudgetItem[] = [
  {
    id: "Q1",
    name: "Обсяг бюджетного фінансування автомобільних доріг державного значення",
    value: null,
    tooltip: "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення нового будівництва, реконструкції, капітального та поточного ремонтів і утримання автомобільних доріг загального користування державного значення"
  },
  {
    id: "Qпп",
    name: "Обсяг бюджетного фінансування пунктів пропуску через державний кордон",
    value: null,
    tooltip: "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення заходів з розвитку, будівництва, ремонту, облаштування, модернізації та утримання пунктів пропуску через державний кордон для автомобільного сполучення"
  },
  {
    id: "Qміжн",
    name: "Обсяг бюджетного фінансування проведення конкурсів та підготовки договорів за рахунок коштів міжнародних організацій",
    value: null,
    tooltip: "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення проведення конкурсів і підготовку договорів щодо виконання робіт з нового будівництва, реконструкції, ремонту і утримання автомобільних доріг загального користування за рахунок коштів міжнародних фінансових організацій"
  },
  {
    id: "QІАС",
    name: "Обсяг бюджетного фінансування інформаційно-аналітичної системи дорожнього господарства",
    value: null,
    tooltip: "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення заходів зі створення та функціонування інформаційно-аналітичної системи дорожнього господарства"
  },
  {
    id: "Qн",
    name: "Обсяг бюджетних коштів на науково-дослідні роботи у сфері дорожнього господарства",
    value: null,
    tooltip: "Кошти на науково-дослідні роботи"
  },
  {
    id: "Qлік",
    name: "Обсяг бюджетних коштів на утримання медичних закладів для реабілітації ліквідаторів ЧАЕС",
    value: null,
    tooltip: "Кошти на медичні заклади для реабілітації ліквідаторів ЧАЕС"
  },
  {
    id: "Qвп",
    name: "Обсяг бюджетних коштів на розвиток виробничих потужностей дорожніх організацій",
    value: null,
    tooltip: "Кошти на розвиток виробничих потужностей"
  },
  {
    id: "Qупр",
    name: "Обсяг бюджетних коштів на управління дорожнім господарством",
    value: null,
    tooltip: "Кошти на управління дорожнім господарством"
  },
  {
    id: "QДПП",
    name: "Обсяг бюджетного фінансування виплат приватному партнеру/концесіонеру",
    value: null,
    tooltip: "Обсяг бюджетних коштів, що спрямовується на здійснення виплат приватному партнеру/концесіонеру плати за експлуатаційну готовність автомобільної дороги"
  },
];

// Сокращенные названия для местных дорог
export const initialLocalRoadItems: BudgetItem[] = [
  {
    id: "Q2",
    name: "Обсяг бюджетних коштів на дороги місцевого значення",
    value: null,
    tooltip: "Загальний обсяг бюджетних коштів на дороги місцевого значення"
  },
  {
    id: "Qкред",
    name: "Обсяг бюджетного фінансування погашення місцевого боргу за дорожніми запозиченнями",
    value: null,
    tooltip: "Кошти на погашення та обслуговування місцевого боргу"
  },
  {
    id: "Qн2",
    name: "Обсяг бюджетних коштів на науково-дослідні роботи для місцевих доріг",
    value: null,
    tooltip: "Кошти на науково-дослідні роботи для місцевих доріг"
  },
  {
    id: "QДПП2",
    name: "Обсяг бюджетного фінансування виплат приватному партнеру для місцевих доріг",
    value: null,
    tooltip: "Кошти на виплати приватному партнеру/концесіонеру для місцевих доріг"
  },
  {
    id: "Qком",
    name: "Обсяг бюджетних коштів на дороги комунальної власності",
    value: null,
    tooltip: "Кошти на дороги комунальної власності"
  },
];
// Расчет Q1 (для государственных дорог)
export const calculateQ1 = (items: BudgetItem[]): number | null => {
  const qdzValue = items.find(item => item.id === "Q1")?.value;
  
  if (qdzValue === null || qdzValue === undefined) {
    return null;
  }

  // Расчет по формуле: Qдз = Q1 - Qпп - Qміжн - QІАС - Qн - Qлік - Qвп - Qупр - QДПП
  let result = qdzValue;
  
  items.forEach(item => {
    if (item.id !== "Q1" && item.value !== null) {
      result -= item.value;
    }
  });

  return result;
};

// Расчет Q2 (для местных дорог)
export const calculateQ2 = (items: BudgetItem[]): number | null => {
  const qmzValue = items.find(item => item.id === "Q2")?.value;
  
  if (qmzValue === null || qmzValue === undefined) {
    return null;
  }

  // Расчет по формуле: Qмз = Q2 - Qкред - Qн2 - QДПП2 - Qком
  let result = qmzValue;
  
  items.forEach(item => {
    if (item.id !== "Q2" && item.value !== null) {
      result -= item.value;
    }
  });

  return result;
};

// Расчет приведенного норматива для дорог государственного значения
export interface RoadCategory {
  category: 'I' | 'II' | 'III' | 'IV' | 'V';
  coefficient: number;
}

export const stateRoadCategories: RoadCategory[] = [
  { category: 'I', coefficient: 1.80 },
  { category: 'II', coefficient: 1.00 },
  { category: 'III', coefficient: 0.89 },
  { category: 'IV', coefficient: 0.61 },
  { category: 'V', coefficient: 0.39 },
];

export const localRoadCategories: RoadCategory[] = [
  { category: 'I', coefficient: 1.71 },
  { category: 'II', coefficient: 1.00 },
  { category: 'III', coefficient: 0.85 },
  { category: 'IV', coefficient: 0.64 },
  { category: 'V', coefficient: 0.40 },
];

// Расчет приведенного норматива
export const calculateNormative = (
  baseNormative: number,
  category: 'I' | 'II' | 'III' | 'IV' | 'V',
  isState: boolean,
  inflationIndices: number[]
): number => {
  // Коэффициент в зависимости от категории дороги
  const categoryCoefficient = isState 
    ? stateRoadCategories.find(c => c.category === category)?.coefficient || 1
    : localRoadCategories.find(c => c.category === category)?.coefficient || 1;
  
  // Учет инфляции
  const inflationMultiplier = inflationIndices.reduce((acc, index) => acc * (1 + index/100), 1);
  
  // Расчет по формуле: H = baseNormative × categoryCoefficient × inflationMultiplier
  return baseNormative * categoryCoefficient * inflationMultiplier;
};

// Экспорт функции для расчета объема средств на эксплуатационное содержание дорог
export interface RoadMaintenance {
  category: 'I' | 'II' | 'III' | 'IV' | 'V';
  length: number;  // в километрах
  normative: number; // приведенный норматив
}

// Коэффициенты для расчета
export interface MountainousAreaCoefficients {
  [region: string]: number;
}

export const mountainousAreaCoefficients: MountainousAreaCoefficients = {
  'Автономна Республіка Крим': 1.15,
  'Івано-Франківська': 1.13,
  'Закарпатська': 1.11,
  'Львівська': 1.04,
  'Чернівецька': 1.04,
  'default': 1.00
};

// Расчет средств на эксплуатационное содержание дорог в одной области
export const calculateMaintenanceFunds = (
  roadData: RoadMaintenance[],
  region: string,
  additionalCoefficients: {
    highTrafficRoads?: number; // Протяженность дорог с высокой интенсивностью
    europeanRoutes?: number;   // Протяженность европейских маршрутов
    borderCrossings?: number;  // Протяженность дорог к пунктам пропуска
    illuminatedRoads?: number; // Протяженность дорог с освещением
    repairedRoads?: number;    // Протяженность отремонтированных дорог
    criticalInfrastructure?: number; // Количество объектов критической инфраструктуры
  }
): number => {
  // Базовый коэффициент для государственных дорог
  const baseCoefficient = 1.16;
  
  // Коэффициент гористой местности
  const mountainousCoefficient = mountainousAreaCoefficients[region] || mountainousAreaCoefficients['default'];
  
  // Остальные коэффициенты требуют более сложных расчетов, их мы упростим для примера
  const highTrafficCoefficient = additionalCoefficients.highTrafficRoads ? 1.1 : 1.0;
  const europeanRoutesCoefficient = additionalCoefficients.europeanRoutes ? 1.05 : 1.0;
  const borderCrossingCoefficient = additionalCoefficients.borderCrossings ? 1.05 : 1.0;
  const illuminatedRoadsCoefficient = additionalCoefficients.illuminatedRoads ? 1.1 : 1.0;
  const repairedRoadsCoefficient = additionalCoefficients.repairedRoads ? 0.95 : 1.0;
  const criticalInfrastructureCoefficient = additionalCoefficients.criticalInfrastructure && additionalCoefficients.criticalInfrastructure > 0
    ? (additionalCoefficients.criticalInfrastructure < 5 ? 1.01 :
       additionalCoefficients.criticalInfrastructure < 10 ? 1.03 : 1.05)
    : 1.0;
  
  // Сумма средств для всех категорий дорог
  let totalFunds = 0;
  
  // Расчет для каждой категории дорог
  roadData.forEach(road => {
    // Формула из методики: Qi = Sum(j=1 to 5)(Hj × Lij) × Kд × Kг × Kуе × ...
    const categoryFunds = road.normative * road.length * baseCoefficient * 
                          mountainousCoefficient * highTrafficCoefficient * 
                          europeanRoutesCoefficient * borderCrossingCoefficient * 
                          illuminatedRoadsCoefficient * repairedRoadsCoefficient *
                          criticalInfrastructureCoefficient;
    
    totalFunds += categoryFunds;
  });
  
  return totalFunds;
};