export interface RepairSegmetn {
    length: number; // Протяженность ремонтного участка L_{рем}
    coefficient: number; // Коэффициент C_{рем}
}

export interface KremCalculation {
    repairSegments: RepairSegmetn[]; // Массив ремонтных участков
    totalLength: number; // Общая длина дорог в области L_i^{o}
}

export function calculateKrem(params: KremCalculation): number {
    const { repairSegments, totalLength} = params;

    if(repairSegments.length === 0 || totalLength === 0){
        // Если данных нет, коэффициент принимается равным 1
        return 1;
    }

    // Вычисляем сумму (C_{рем} × L_{рем})
    const sumCremLrem = repairSegments.reduce((sum, segment) => sum + segment.coefficient * segment.length, 0);
    // Вычисляем сумму L_{рем}
    const sumLrem = repairSegments.reduce((sum, segment) => sum + segment.length, 0);
    // Формула K_{рем}
    const krem = (sumCremLrem + (totalLength - sumLrem)) / totalLength;
    return krem;
}