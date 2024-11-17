export interface LightingSegment {
    length: number; // Протяженность участка с освещением L_{occ}^d
}

export interface KoocCalculation {
    lightingSegments: LightingSegment[]; // Массив участков с освещением
    totlaLength: number; // Общая длина дорог в области L_i^o
    coefficient: number; // Коэффициент C_{occ}, обычно равен 2.0
}

export function calculateKooc(params: KoocCalculation): number {
    const { lightingSegments, totlaLength, coefficient } = params;

    if(lightingSegments.length === 0 || totlaLength === 0){
        // Если данных нет, коэффициент принимается равным 1
        return 1;
    }

    // Вычисляем сумму (C_{occ} × L_{occ}^d)
    const sumCoccLocc = lightingSegments.reduce((sum, segment) => sum + coefficient * segment.length, 0);
    // Вычисляем сумму L_{occ}^d
    const sumLocc = lightingSegments.reduce((sum, segment) => sum + segment.length, 0);
    // Формула K_{occ}^i
    const kocc = (sumCoccLocc + (totlaLength - sumLocc)) / totlaLength;

    return kocc;
}