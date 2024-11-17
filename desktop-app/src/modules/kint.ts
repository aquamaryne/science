export interface LocalIntensitySegmaent {
    length: number; // Протяженность участка дороги (L_{інт,m}^2)
    intesityCoefficient: number; // Коэффициент интенсивности движения (C_{інт}^\alpha)
} 

export interface LocalIntensityParams {
    roadSegment: LocalIntensitySegmaent[]; // Массив участков дорог
    totalLength: number;// Общая длина дорог в области (L_i^M)
}

export function calculateLocalIntensity(params: LocalIntensityParams): number {
    const { roadSegment, totalLength } = params;
    // Если данных нет, коэффициент принимается равным 1
    if(roadSegment.length === 0 || totalLength === 0) {
        return 1;
    }
    // Сумма (C_{інт}^\alpha × L_{інт,m}^2)
    const sumCoefficientsLength = roadSegment.reduce((sum, segment) => {
        return sum + segment.intesityCoefficient * segment.length;
    }, 0);
    // Сумма длин участков L_{інт,m}^2
    const sumSegmentsLength = roadSegment.reduce((sum, segment) => sum + segment.length, 0);
    // Формула K_{інт,m}^i
    const localIntesity = (sumCoefficientsLength + (totalLength - sumSegmentsLength)) / totalLength;

    return localIntesity;
}