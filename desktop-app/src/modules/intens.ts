export interface RoadSegment {
    length: number; // Протяженность участка дороги (L_{інт}^α)
    trafficIntensity: number; // Интенсивность движения на участке
}

export interface IntensityParams {
    roadSegments: RoadSegment[]; // Массив участков дорог
    totalLength: number; // Общая длина дорог в области (L_i^\delta)
}

export function calculateKIntesity(params: IntensityParams): number {
    const { roadSegments, totalLength } = params;

    if(roadSegments.length === 0 || totalLength === 0){
        // Если данных нет, коэффициент принимается равным 1
        return 1;
    }

    // Определяем коэффициент C_{інт}^\alpha для каждого участка
    const getTrafficCoefficient = (trafficIntensity: number): number => {
        if(trafficIntensity >= 15000 && trafficIntensity <= 20000) return 2.3;
        if(trafficIntensity >= 20001 && trafficIntensity < 30000) return 3.5;
        if(trafficIntensity >= 30000) return 3.9;
        return 1;
    }

    // Сумма (C_{інт}^\alpha × L_{інт,\delta}^\alpha)
    const sumCoefficientsLength = roadSegments.reduce((sum, segment) => {
        const coefficient = getTrafficCoefficient(segment.trafficIntensity);
        return sum + coefficient * segment.length;
    }, 0);

    // Сумма длин участков L_{інт,\delta}^\alpha
    const sumSegmentLength = roadSegments.reduce((sum, segment) => sum + segment.length, 0);

    const kIntensivity = (sumCoefficientsLength + (totalLength - sumSegmentLength)) / totalLength;
    return kIntensivity;
}