import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Импорт компонентов
import Block2StateRoads from '../../page/block_two/Block2StateRoads';
import Block2LocalRoads from '../../page/block_two/Block2LocalRoads';
import Block2FundingCalculation from '../../page/block_two/Block2FundingCalculation';

// Импорт функций расчета
import {
  calculateStateRoadMaintenanceRate,
  calculateLocalRoadMaintenanceRate,
  getRegionCoefficients,
  generateSampleRegionData,
} from '../../modules/block_two';

import type { 
  RegionCoefficients,
  RegionRoads
} from '../../modules/block_two';

const Block2MaintenanceCalculator: React.FC = () => {
  // State для государственных дорог (Блок 2.1)
  const [stateRoadBaseRate, setStateRoadBaseRate] = useState<number>(604.761);
  const [stateInflationIndexes, setStateInflationIndexes] = useState<number[]>([10]);
  const [stateRoadRate, setStateRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>({
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0
  });

  // State для местных дорог (Блок 2.2)
  const [localRoadBaseRate, setLocalRoadBaseRate] = useState<number>(360.544);
  const [localInflationIndexes, setLocalInflationIndexes] = useState<number[]>([10]);
  const [localRoadRate, setLocalRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>({
    category1: 0,
    category2: 0,
    category3: 0,
    category4: 0,
    category5: 0
  });

  // State для расчета финансирования (Блок 2.3-2.8)
  const [regionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
  const [_regionData] = useState<RegionRoads>(generateSampleRegionData("Оберіть регіон"));
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Инициализация расчетов при монтировании компонента
  useEffect(() => {
    calculateStateRoadRates();
    calculateLocalRoadRates();
  }, [stateRoadBaseRate, stateInflationIndexes]);

  useEffect(() => {
    calculateLocalRoadRates();
  }, [localRoadBaseRate, localInflationIndexes]);

  // Расчет кумулятивного индекса инфляции
  const calculateCumulativeInflationIndex = (indexes: number[]): number => {
    return indexes.reduce((acc, curr) => {
      return acc * (1 + curr / 100);
    }, 1);
  };

  // Расчет нормативов для государственных дорог
  const calculateStateRoadRates = () => {
    const totalInflationIndex = calculateCumulativeInflationIndex(stateInflationIndexes);

    const category1 = calculateStateRoadMaintenanceRate(1, totalInflationIndex);
    const category2 = calculateStateRoadMaintenanceRate(2, totalInflationIndex);
    const category3 = calculateStateRoadMaintenanceRate(3, totalInflationIndex);
    const category4 = calculateStateRoadMaintenanceRate(4, totalInflationIndex);
    const category5 = calculateStateRoadMaintenanceRate(5, totalInflationIndex);

    setStateRoadRates({
      category1,
      category2,
      category3,
      category4,
      category5
    });
  };

  // Расчет нормативов для местных дорог
  const calculateLocalRoadRates = () => {
    const totalInflationIndex = calculateCumulativeInflationIndex(localInflationIndexes);

    const category1 = calculateLocalRoadMaintenanceRate(1, totalInflationIndex);
    const category2 = calculateLocalRoadMaintenanceRate(2, totalInflationIndex);
    const category3 = calculateLocalRoadMaintenanceRate(3, totalInflationIndex);
    const category4 = calculateLocalRoadMaintenanceRate(4, totalInflationIndex);
    const category5 = calculateLocalRoadMaintenanceRate(5, totalInflationIndex);

    setLocalRoadRates({
      category1,
      category2,
      category3,
      category4,
      category5
    });
  };

  return (
    <div className="mx-auto p-10">
      <h1 className="text-2xl font-bold mb-2">Експлуатаційне утримання доріг</h1>
      <p className="text-gray-600 mb-6">
        Визначення загального обсягу бюджетних коштів на фінансове забезпечення заходів з експлуатаційного утримання
      </p>
      
      <Tabs defaultValue="step1" className="mb-8 w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="step1">Дороги державного значення</TabsTrigger>
          <TabsTrigger value="step2">Дороги місцевого значення</TabsTrigger>
          <TabsTrigger value="step3">Розрахунок обсягу коштів</TabsTrigger>
        </TabsList>
        
        {/* Вкладка 1: Государственные дороги */}
        <TabsContent value="step1">
          <Block2StateRoads
            stateRoadBaseRate={stateRoadBaseRate}
            setStateRoadBaseRate={setStateRoadBaseRate}
            stateInflationIndexes={stateInflationIndexes}
            setStateInflationIndexes={setStateInflationIndexes}
            stateRoadRate={stateRoadRate}
            calculateCumulativeInflationIndex={calculateCumulativeInflationIndex}
          />
        </TabsContent>
        
        {/* Вкладка 2: Местные дороги */}
        <TabsContent value="step2">
          <Block2LocalRoads
            localRoadBaseRate={localRoadBaseRate}
            setLocalRoadBaseRate={setLocalRoadBaseRate}
            localInflationIndexes={localInflationIndexes}
            setLocalInflationIndexes={setLocalInflationIndexes}
            localRoadRate={localRoadRate}
            calculateCumulativeInflationIndex={calculateCumulativeInflationIndex}
          />
        </TabsContent>
        
        {/* Вкладка 3: Расчет финансирования */}
        <TabsContent value="step3">
          <Block2FundingCalculation
            regionCoefficients={regionCoefficients}
            stateInflationIndexes={stateInflationIndexes}
          />
        </TabsContent>
      </Tabs>

      {/* Кнопка сохранения проекта */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            setSaveStatus("Збереження...");
            setTimeout(() => setSaveStatus("Збережено!"), 1000);
            setTimeout(() => setSaveStatus(""), 3000);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Зберегти проєкт
        </Button>
        {saveStatus && (
          <span className="text-xs text-green-600">{saveStatus}</span>
        )}
      </div>
    </div>
  );
};

export default Block2MaintenanceCalculator;

