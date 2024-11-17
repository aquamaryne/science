export interface EuropeanRoad {
    length: number; // Протяженность f-ой части дороги (L_{e.d}^f)
}

export interface KedCalculation {
    roadSegments: EuropeanRoad[], // Массив участков дорог
    totalLength: number,    // Общая протяженность дорог в области (L_i^f)
    coefficient: number, // Коэффициент C_e, обычно равен 1.5
}

export function calculateKed(params: KedCalculation): number {
    const { roadSegments, totalLength, coefficient } = params;

    if(roadSegments.length === 0 || totalLength === 0){
        // Если данных нет, коэффициент принимается равным 1
        return 1;
    }
    // Вычисляем сумму (C_e × L_{e.d}^f)
    const sumCel = roadSegments.reduce((sum, segment) => sum + coefficient * segment.length, 0);
    // Вычисляем сумму L_{e.d}^f
    const sumL = roadSegments.reduce((sum, segment) => sum + segment.length, 0);
    // Формула K_{e.d}^i
    const ked = (sumCel + (totalLength - sumL)) / totalLength;

    return ked;
}