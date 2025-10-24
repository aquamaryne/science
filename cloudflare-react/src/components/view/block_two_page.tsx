import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useHistory, useCurrentSession } from '../../redux/hooks';
import { saveBlockTwoData } from '../../redux/slices/historySlice';
import { useAppSelector } from '../../redux/hooks';

// Импорт компонентов
import Block2StateRoads from '../../page/block_two/Block2StateRoads';
import Block2LocalRoads from '../../page/block_two/Block2LocalRoads';
import Block2FundingCalculation from '../../page/block_two/Block2FundingCalculation';
import PDFReportBlockTwo from "@/components/PDFReportBlockTwo";
import ErrorBoundary from "@/components/ErrorBoundary";

// Импорт функций расчета
import {
  getRegionCoefficients,
  generateSampleRegionData,
} from '../../modules/block_two';

import type { 
  RegionCoefficients,
  RegionRoads
} from '../../modules/block_two';

const Block2MaintenanceCalculator: React.FC = () => {
  const blockTwoState = useAppSelector(state => state.blockTwo);
  
  // ✅ АКТИВНА ВКЛАДКА
  const [activeTab, setActiveTab] = useState<string>('step1');
  
  // State для государственных дорог (Експлуатаційне утримання - державні дороги)
  const [stateRoadBaseRate, setStateRoadBaseRate] = useState<number>(blockTwoState.stateRoadBaseRate);
  const [stateInflationIndexes, setStateInflationIndexes] = useState<number[]>(blockTwoState.stateInflationIndexes);
  const [stateRoadRate, setStateRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>(blockTwoState.stateRoadRates);

  // State для местных дорог (Експлуатаційне утримання - місцеві дороги)
  const [localRoadBaseRate, setLocalRoadBaseRate] = useState<number>(blockTwoState.localRoadBaseRate);
  const [localInflationIndexes, setLocalInflationIndexes] = useState<number[]>(blockTwoState.localInflationIndexes);
  const [localRoadRate, setLocalRoadRates] = useState<{
    category1: number;
    category2: number;
    category3: number;
    category4: number;
    category5: number;
  }>(blockTwoState.localRoadRates);

  // State для расчета финансирования (Розрахунок фінансування)
  const [regionCoefficients] = useState<RegionCoefficients[]>(getRegionCoefficients());
  const [_regionData] = useState<RegionRoads>(generateSampleRegionData("Оберіть регіон"));
  const [saveStatus, setSaveStatus] = useState<string>("");
  
  // Redux hooks
  const { createSession, dispatch: historyDispatch } = useHistory();
  const { currentSession } = useCurrentSession();

  // ✅ ПЕРЕВІРКА ЗАВЕРШЕННЯ ЕТАПІВ (лише для індикаторів)
  const isStep1Complete = blockTwoState.stateRoadRates.category1 > 0;
  const isStep2Complete = blockTwoState.localRoadRates.category1 > 0;

  // Синхронизация с Redux при загрузке
  useEffect(() => {
    setStateRoadBaseRate(blockTwoState.stateRoadBaseRate);
    setStateInflationIndexes(blockTwoState.stateInflationIndexes);
    setStateRoadRates(blockTwoState.stateRoadRates);
    setLocalRoadBaseRate(blockTwoState.localRoadBaseRate);
    setLocalInflationIndexes(blockTwoState.localInflationIndexes);
    setLocalRoadRates(blockTwoState.localRoadRates);
  }, [blockTwoState]);

  return (
    <div className="mx-auto p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Експлуатаційне утримання доріг</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-4 md:mb-6">
        Визначення загального обсягу бюджетних коштів на фінансове забезпечення заходів з експлуатаційного утримання
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 md:mb-8 w-full">
        <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 h-auto sm:h-10">
          <TabsTrigger value="step1" className="flex items-center justify-center gap-2 text-xs sm:text-sm p-2 sm:p-0">
            {isStep1Complete && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />}
            <span className="truncate">Дороги державного значення</span>
          </TabsTrigger>
          <TabsTrigger 
            value="step2" 
            className="flex items-center justify-center gap-2 text-xs sm:text-sm p-2 sm:p-0"
          >
            {isStep2Complete && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />}
            <span className="truncate">Дороги місцевого значення</span>
          </TabsTrigger>
          <TabsTrigger 
            value="step3" 
            className="flex items-center justify-center gap-2 text-xs sm:text-sm p-2 sm:p-0"
          >
            <span className="truncate">Розрахунок обсягу коштів</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Вкладка 1: Государственные дороги */}
        <TabsContent value="step1">
          <Block2StateRoads />
        </TabsContent>
        
        {/* Вкладка 2: Местные дороги */}
        <TabsContent value="step2">
          <Block2LocalRoads />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <Button
          onClick={async () => {
            setSaveStatus("Збереження...");
                 try {
                   // Создаем сессию, если её нет
                   let sessionId = currentSession?.id;
                   if (!sessionId) {
                     await createSession(
                       `Експлуатаційне утримання доріг - ${new Date().toLocaleString('uk-UA')}`,
                       'Сесія розрахунків аналізу дорожніх секцій'
                     );
                     // После создания сессии, получаем её ID из currentSession
                     sessionId = currentSession?.id;
                   }

                   if (sessionId) {
                     // Создаем фиктивные результаты финансирования для демонстрации
                     const fundingResults = {
                       stateFunding: stateRoadRate.category1 * 1000, // Примерные значения
                       localFunding: localRoadRate.category1 * 1000,
                       totalFunding: (stateRoadRate.category1 + localRoadRate.category1) * 1000
                     };

                     await historyDispatch(saveBlockTwoData({
                       sessionId: sessionId,
                       stateRoadBaseRate,
                       localRoadBaseRate,
                       stateInflationIndexes,
                       localInflationIndexes,
                       selectedRegion: "Оберіть регіон",
                       stateRoadRates: stateRoadRate,
                       localRoadRates: localRoadRate,
                       fundingResults
                     }));

                     setSaveStatus("✅ Збережено в історію!");
                     console.log('Результати експлуатаційного утримання збережено в Redux історію');
                   } else {
                     setSaveStatus("❌ Помилка створення сесії");
                   }
            } catch (error) {
              console.error('Ошибка при сохранении:', error);
              setSaveStatus("Помилка збереження");
            }
            setTimeout(() => setSaveStatus(""), 3000);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-sm md:text-base"
        >
          Зберегти проєкт
        </Button>
        {saveStatus && (
          <span className="text-xs md:text-sm text-green-600">{saveStatus}</span>
        )}
      </div>

      {/* PDF Звіт */}
      <div className="mt-6 md:mt-8">
        <ErrorBoundary>
          <PDFReportBlockTwo />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Block2MaintenanceCalculator;

