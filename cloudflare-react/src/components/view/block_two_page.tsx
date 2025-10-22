import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Lock } from "lucide-react";
import { useHistory, useCurrentSession } from '../../redux/hooks';
import { saveBlockTwoData } from '../../redux/slices/historySlice';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { 
  setStateRoadRates as setStateRoadRatesAction,
  setLocalRoadRates as setLocalRoadRatesAction
} from '../../redux/slices/blockTwoSlice';

// Импорт компонентов
import Block2StateRoads from '../../page/block_two/Block2StateRoads';
import Block2LocalRoads from '../../page/block_two/Block2LocalRoads';
import Block2FundingCalculation from '../../page/block_two/Block2FundingCalculation';
import PDFReportBlockTwo from "@/components/PDFReportBlockTwo";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const appDispatch = useAppDispatch();
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

  // ✅ ПЕРЕВІРКА ДОСТУПНОСТІ ЕТАПІВ
  const isStep1Complete = blockTwoState.stateRoadRates.category1 > 0;
  const isStep2Complete = blockTwoState.localRoadRates.category1 > 0;
  const isStep2Unlocked = isStep1Complete;
  const isStep3Unlocked = isStep1Complete && isStep2Complete;

  // Синхронизация с Redux при загрузке
  useEffect(() => {
    setStateRoadBaseRate(blockTwoState.stateRoadBaseRate);
    setStateInflationIndexes(blockTwoState.stateInflationIndexes);
    setStateRoadRates(blockTwoState.stateRoadRates);
    setLocalRoadBaseRate(blockTwoState.localRoadBaseRate);
    setLocalInflationIndexes(blockTwoState.localInflationIndexes);
    setLocalRoadRates(blockTwoState.localRoadRates);
  }, [blockTwoState]);

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

    const newRates = {
      category1,
      category2,
      category3,
      category4,
      category5
    };
    
    setStateRoadRates(newRates);
    appDispatch(setStateRoadRatesAction(newRates));
  };

  // Расчет нормативов для местных дорог
  const calculateLocalRoadRates = () => {
    const totalInflationIndex = calculateCumulativeInflationIndex(localInflationIndexes);

    const category1 = calculateLocalRoadMaintenanceRate(1, totalInflationIndex);
    const category2 = calculateLocalRoadMaintenanceRate(2, totalInflationIndex);
    const category3 = calculateLocalRoadMaintenanceRate(3, totalInflationIndex);
    const category4 = calculateLocalRoadMaintenanceRate(4, totalInflationIndex);
    const category5 = calculateLocalRoadMaintenanceRate(5, totalInflationIndex);

    const newRates = {
      category1,
      category2,
      category3,
      category4,
      category5
    };
    
    setLocalRoadRates(newRates);
    appDispatch(setLocalRoadRatesAction(newRates));
  };

  return (
    <div className="mx-auto p-10">
      <h1 className="text-2xl font-bold mb-2">Експлуатаційне утримання доріг</h1>
      <p className="text-gray-600 mb-6">
        Визначення загального обсягу бюджетних коштів на фінансове забезпечення заходів з експлуатаційного утримання
      </p>
      
      {/* ✅ ІНФОРМАЦІЯ ПРО ЕТАПИ */}
      <Alert className="mb-4 bg-blue-50 border-blue-300">
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-semibold text-blue-900">Послідовність розрахунків:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {isStep1Complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                )}
                <span className={isStep1Complete ? "text-green-700 font-medium" : "text-blue-700"}>
                  Етап 1: Розрахунок нормативів для державних доріг
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isStep2Complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isStep2Unlocked ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <span className={isStep2Complete ? "text-green-700 font-medium" : isStep2Unlocked ? "text-blue-700" : "text-gray-500"}>
                  Етап 2: Розрахунок нормативів для місцевих доріг
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isStep3Unlocked ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <span className={isStep3Unlocked ? "text-blue-700" : "text-gray-500"}>
                  Етап 3: Розрахунок обсягу коштів
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8 w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="step1" className="flex items-center gap-2">
            {isStep1Complete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            Дороги державного значення
          </TabsTrigger>
          <TabsTrigger 
            value="step2" 
            disabled={!isStep2Unlocked}
            className="flex items-center gap-2"
          >
            {isStep2Complete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {!isStep2Unlocked && <Lock className="h-4 w-4" />}
            Дороги місцевого значення
          </TabsTrigger>
          <TabsTrigger 
            value="step3" 
            disabled={!isStep3Unlocked}
            className="flex items-center gap-2"
          >
            {!isStep3Unlocked && <Lock className="h-4 w-4" />}
            Розрахунок обсягу коштів
          </TabsTrigger>
        </TabsList>
        
        {/* Вкладка 1: Государственные дороги */}
        <TabsContent value="step1">
          <Block2StateRoads 
            onCalculated={() => {
              // ✅ Автоматично переходимо на наступну вкладку після розрахунку
              setTimeout(() => setActiveTab('step2'), 600);
            }}
          />
        </TabsContent>
        
        {/* Вкладка 2: Местные дороги */}
        <TabsContent value="step2">
          {isStep2Unlocked ? (
            <Block2LocalRoads 
              onCalculated={() => {
                // ✅ Автоматично переходимо на наступну вкладку після розрахунку
                setTimeout(() => setActiveTab('step3'), 600);
              }}
            />
          ) : (
            <Alert className="bg-yellow-50 border-yellow-400">
              <Lock className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Цей етап заблоковано.</strong>
                <div className="text-sm mt-1">
                  Спочатку виконайте розрахунок нормативів для державних доріг на попередньому етапі.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* Вкладка 3: Расчет финансирования */}
        <TabsContent value="step3">
          {isStep3Unlocked ? (
            <Block2FundingCalculation
              regionCoefficients={regionCoefficients}
              stateInflationIndexes={stateInflationIndexes}
            />
          ) : (
            <Alert className="bg-yellow-50 border-yellow-400">
              <Lock className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Цей етап заблоковано.</strong>
                <div className="text-sm mt-1">
                  {!isStep1Complete && "Спочатку виконайте розрахунок нормативів для державних доріг."}
                  {isStep1Complete && !isStep2Complete && "Спочатку виконайте розрахунок нормативів для місцевих доріг."}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Кнопка сохранения проекта */}
      <div className="flex items-center gap-3">
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Зберегти проєкт
        </Button>
        {saveStatus && (
          <span className="text-xs text-green-600">{saveStatus}</span>
        )}
      </div>

      {/* PDF Звіт */}
      <div className="mt-8">
        <ErrorBoundary>
          <PDFReportBlockTwo />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Block2MaintenanceCalculator;

