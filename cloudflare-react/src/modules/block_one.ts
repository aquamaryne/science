export interface StateRoadData {
    Qdz: number;
    Qpp: number;
    Qminzhn: number;
    QIAS: number;
    Qn: number;
    Qlik: number;
    Qvp: number;
    Qupr: number;
    QDPP: number;
    Q1?: number;
}

export interface LocalRoadData {
    Qmz: number;
    Qkred: number;
    Qn2: number;
    QDPP2: number;
    Qkom: number;
    Q2?: number;
}

export interface MaintenanceNorm {
    stateValue: number;
    localValue: number;
    year: number;
    inflationIndices: number[];
}

export interface NormByCategory {
    categoryI: number;
    categoryII: number;
    categoryIII: number;
    categoryIV: number;
    categoryV: number;
}

export const CATEGORY_COEFFIECIENTS_STATE: Record<string, number> = {
    "I": 1.80,
    "II": 1.00,
    "III": 0.89,
    "IV": 0.61,
    "V": 0.39
};

export const CATEGORY_COEFFIECIENTS_LOCAL: Record<string, number> = {
    "I": 1.71,
    "II": 1.00,
    "III": 0.85,
    "IV": 0.64,
    "V": 0.40
}

export const MOUNTAIN_COEFFIECIENTS: Record<string, number> = {
    'АР Крим': 1.15,
    'Івано-Франківська': 1.13,
    'Закарпатська': 1.11,
    'Львівська': 1.04,
    'Чернівецька': 1.04,
    'default': 1.00
};

export const EXPLOITATION_COEFFIECIENTS: Record<string, number> = {
    'АР Крим': 1.15,
    'Івано-Франківська': 1.13,
    'Закарпатська': 1.11,
    'Львівська': 1.04,
    'Чернівецька': 1.04,
    'Київ': 1.15,
    'default': 1.00
};

export const REGIONS: string[] = [
    "Крим", 
    "Вінницька", 
    "Волинська", 
    "Дніпропетровська", 
    "Донецька",
    "Житомирська", 
    "Закарпатська", 
    "Запорізька", 
    "Івано-Франківська",
    "Київська", 
    "Кіровоградська", 
    "Луганська", 
    "Львів", 
    "Миколаїв",
    "Одеса", 
    "Полтава", 
    "Рівне", 
    "Суми", 
    "Тернопіль",
    "Харків", 
    "Херсон", 
    "Хмельницький", 
    "Черкаси", 
    "Чернівці", 
    "Чернігів",
];

export function calculateStateRoadFunding(data: StateRoadData): StateRoadData {
    const { Qdz, Qpp, Qminzhn, QIAS, Qn, Qlik, Qvp, Qupr, QDPP } = data;
    const Q1 = Qdz - Qpp - Qminzhn - QIAS - Qn -Qlik - Qvp - Qupr - QDPP;
    return {
        ...data,
        Q1,
    };
};

export function calculateLocalRoadFunding(data: LocalRoadData): LocalRoadData {
    const { Qmz, Qkred, Qn2, QDPP2, Qkom } = data;
    const Q2 = Qmz - Qkred - Qn2 - QDPP2 - Qkom;
    return {
        ...data,
        Q2,
    };
};

export function calculateStateMaintenanceNorms(norm: MaintenanceNorm): NormByCategory {
    const inflationMultipliers = norm.inflationIndices.reduce((acc, curr) => acc * curr, 1);
    return {
        categoryI: Math.round(norm.stateValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_STATE["I"]),
        categoryII: Math.round(norm.stateValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_STATE["II"]),
        categoryIII: Math.round(norm.stateValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_STATE["III"]),
        categoryIV: Math.round(norm.stateValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_STATE["IV"]),
        categoryV: Math.round(norm.stateValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_STATE["V"]),
    };
};

export function calculateLocalMaintenanceNorms(norm: MaintenanceNorm): NormByCategory {
    const inflationMultipliers = norm.inflationIndices.reduce((acc, curr) => acc * curr, 1);
    return {
        categoryI: Math.round(norm.localValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_LOCAL["I"]),
        categoryII: Math.round(norm.localValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_LOCAL["II"]),
        categoryIII: Math.round(norm.localValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_LOCAL["III"]),
        categoryIV: Math.round(norm.localValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_LOCAL["IV"]),
        categoryV: Math.round(norm.localValue * inflationMultipliers * CATEGORY_COEFFIECIENTS_LOCAL["V"]),
    };
};

export function calculateStateRoadMaintenanceFunding(
    roadLengthByCategory: Record<string, number>,
    maintenanceNorms: NormByCategory,
    region: string,
    roadParameters: {
        europeanRoadLength?: number,
        highIntensityRoadLength?: number,
        borderCheckpointRoadLength?: number,
        lightedRoadLength?: number,
        recentlyRepairedRoadLenght?: number,
        criticalInfrastructureRoadLength?: number
    }
): number {
    const mountainCoefficient = MOUNTAIN_COEFFIECIENTS[region] || MOUNTAIN_COEFFIECIENTS.default;
    const exploitationCoefficient = EXPLOITATION_COEFFIECIENTS[region] || EXPLOITATION_COEFFIECIENTS.default;

    const serviceCoefficient = 1.16;
    let totalFunding = 0;

    for(const category in roadLengthByCategory){
        const categoryIndex = category as keyof NormByCategory;
        const length = roadLengthByCategory[category];
        const normValue = maintenanceNorms[categoryIndex as keyof NormByCategory];
        const fundingForCategory = length & normValue * serviceCoefficient * mountainCoefficient * exploitationCoefficient;
        totalFunding += fundingForCategory;
    }

    return totalFunding;
}

export function calculateLocalRoadMaintenanceFunding (
    roadLengthByCategory: Record<string, number>,
    maintenanceNorms: NormByCategory,
    highIntensityRoadLength?: number,
): number {

    let totalFunding = 0; 

    for (const category in roadLengthByCategory) {
        const categoryIndex = category as keyof NormByCategory;
        const length = roadLengthByCategory[category];
        const normValue = maintenanceNorms[categoryIndex as keyof NormByCategory];
        const fundingForCategory = length * normValue;
        
        totalFunding += fundingForCategory;
    }

    return totalFunding; 
}