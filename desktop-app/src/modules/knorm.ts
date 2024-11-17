export interface RoadSegment {
    length: number; // Протяженность участка L_{norm}^r
}

export interface KnormCalculation {
    roadSegments: RoadSegment[]; // Массив участков дорог до КПП
    totalLength: number; // Общая длина дорог в области L_i^r
    coefficient: number; // Коэффициент C_{norm}, обычно равен 1.5
}

export function calculateKnorm(params: KnormCalculation): number {
    const { roadSegments, totalLength, coefficient } = params;

    if(roadSegments.length === 0 || totalLength === 0){
        // Если данных нет, коэффициент принимается равным 1
        return 1;
    }
    // Вычисляем сумму (C_{norm} × L_{norm}^r)
    const sumCnormLnorm = roadSegments.reduce((sum, segment) => sum + coefficient * segment.length, 0);
    // Вычисляем сумму L_{norm}^r
    const sumLnorm = roadSegments.reduce((sum, segment) => sum + segment.length, 0);
    // Формула K_{norm}^r
    const knorm = (sumCnormLnorm + (totalLength - sumLnorm)) / totalLength;
    return knorm;
}