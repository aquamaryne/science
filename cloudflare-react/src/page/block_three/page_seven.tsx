import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, FileDown, AlertCircle, TrendingUp, Award, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { selectCalculatedRoads, selectHasCalculatedData } from '@/store/roadDataSlice';
import { useHistory, useCurrentSession } from '@/redux/hooks';
import { saveBlockThreeData } from '@/redux/slices/historySlice';
import { 
  resetBlockThree,
  setCurrentPage,
  setPage4Complete,
  clearENPVResults 
} from '@/redux/slices/blockThreeSlice';
import { setCalculatedRoads } from '@/store/roadDataSlice';

import { 
  performDetailedCostBenefitAnalysis,
  calculateDetailedWorkCost,
  determineWorkTypeByTechnicalCondition,
  type RoadSection as ModuleRoadSection,
  type DetailedTechnicalCondition
} from '@/modules/block_three';

interface RankingRow {
  id: string;
  roadName: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  workType: string;
  estimatedCost: number;
  enpv: number;
  eirr: number;
  bcr: number;
  rank: number;
}

const WORK_TYPE_NAMES: Record<string, string> = {
  current_repair: 'Поточний ремонт',
  capital_repair: 'Капітальний ремонт',
  reconstruction: 'Реконструкція',
  no_work_needed: 'Не потрібно',
  '': '-'
};

const WORK_TYPE_COLORS: Record<string, string> = {
  current_repair: 'bg-blue-100 text-blue-800',
  capital_repair: 'bg-yellow-100 text-yellow-800',
  reconstruction: 'bg-red-100 text-red-800',
  no_work_needed: 'bg-green-100 text-green-800',
  '': 'bg-gray-100 text-gray-800'
};

export const RoadRankingTable: React.FC = () => {
  const appDispatch = useAppDispatch();
  const calculatedRoadsFromRedux = useAppSelector(selectCalculatedRoads);
  const hasReduxData = useAppSelector(selectHasCalculatedData);
  
  // ✅ ЧИТАЄМО РЕЗУЛЬТАТИ ENPV З REDUX
  const enpvResultsFromRedux = useAppSelector(state => state.blockThree.enpvResults || []);
  const hasENPVResults = enpvResultsFromRedux.length > 0;
  
  const { createSession, dispatch: historyDispatch } = useHistory();
  const { currentSession } = useCurrentSession();

  const [rankingData, setRankingData] = useState<RankingRow[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Автоматичний розрахунок при наявності даних ENPV
  useEffect(() => {
    if (hasENPVResults && !calculated) {
      console.log('✅ Автоматичний розрахунок рангування з Redux даних...');
      calculateRankingFromRedux();
    }
  }, [hasENPVResults, enpvResultsFromRedux, calculated]);

  // ✅ НОВА ФУНКЦІЯ: розрахунок рангування з Redux даних
  const calculateRankingFromRedux = () => {
    if (!hasENPVResults || enpvResultsFromRedux.length === 0) {
      setError('Немає результатів ENPV. Спочатку виконайте розрахунки на Сторінці 3.');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      console.log('=== Формування рангування з Redux даних ===');
      console.log(`Знайдено ${enpvResultsFromRedux.length} результатів ENPV`);

      const rankingResults: RankingRow[] = enpvResultsFromRedux
        .filter(result => result.workType !== 'no_work_needed') // Пропускаємо об'єкти без робіт
        .map(result => ({
          id: result.sectionId,
          roadName: result.sectionName,
          length: result.length,
          category: parseInt(result.roadCategory) as 1 | 2 | 3 | 4 | 5,
          workType: result.workType,
          estimatedCost: result.estimatedCost, // вже в млн грн
          enpv: result.enpv, // вже в млн грн
          eirr: result.eirr, // вже в десятковому форматі
          bcr: result.bcr,
          rank: 0 // Буде встановлено при сортуванні
        }));

      // Ранжування за ENPV (від найбільшого до найменшого)
      const sortedResults = rankingResults
        .sort((a, b) => {
          // Спочатку сортуємо за BCR > 1 (економічно доцільні)
          const aViable = a.bcr > 1;
          const bViable = b.bcr > 1;
          
          if (aViable && !bViable) return -1;
          if (!aViable && bViable) return 1;
          
          // Потім за ENPV
          return b.enpv - a.enpv;
        })
        .map((row, index) => ({
          ...row,
          rank: index + 1
        }));

      setRankingData(sortedResults);
      setCalculated(true);
      
      // ✅ Позначаємо сторінку 4 як завершену
      appDispatch(setPage4Complete(true));

      console.log('=== Рангування завершено (з Redux) ===');
      console.log(`Всього об'єктів: ${sortedResults.length}`);
      console.log(`Економічно доцільних (BCR > 1): ${sortedResults.filter(r => r.bcr > 1).length}`);

    } catch (err) {
      console.error('Помилка при формуванні рангування:', err);
      setError(`Помилка: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // ✅ СТАРА ФУНКЦІЯ: розрахунок через модуль (залишаємо як fallback)
  const calculateRanking = async () => {
    if (!hasReduxData || calculatedRoadsFromRedux.length === 0) {
      setError('Немає даних для розрахунку. Спочатку розрахуйте дороги на Вкладці 1-2.');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      const rankingResults: RankingRow[] = [];

      // Розрахунок для кожної дороги
      for (const road of calculatedRoadsFromRedux) {
        console.log(`Розрахунок для: ${road.roadName}`);

        // Створюємо ModuleRoadSection для передачі в функції
        const moduleRoadSection: ModuleRoadSection = {
          id: road.id,
          name: road.roadName,
          category: road.category,
          length: road.length,
          significance: 'state',
          region: road.region,
          trafficIntensity: road.actualIntensity,
          detailedCondition: road.detailedCondition as DetailedTechnicalCondition,
          isDefenseRoad: road.isDefenseRoad,
          isInternationalRoad: road.isInternationalRoad
        };

        // Визначаємо вид робіт
        const workType = determineWorkTypeByTechnicalCondition(moduleRoadSection);

        // Пропускаємо якщо не потрібно робіт
        if (workType === 'no_work_needed') {
          console.log(`${road.roadName}: не потребує робіт, пропускаємо`);
          continue;
        }

        // Розраховуємо вартість робіт
        const estimatedCost = calculateDetailedWorkCost(moduleRoadSection, workType);

        // Виконуємо детальний аналіз витрат та вигод
        const costBenefitAnalysis = performDetailedCostBenefitAnalysis(
          moduleRoadSection,
          estimatedCost
        );

        if (!costBenefitAnalysis) {
          console.error(`Не вдалося розрахувати ENPV для ${road.roadName}`);
          continue;
        }

        // Зберігаємо результати
        rankingResults.push({
          id: road.id,
          roadName: road.roadName,
          length: road.length,
          category: road.category,
          workType: workType,
          estimatedCost: estimatedCost / 1000, // тис. грн -> млн грн
          enpv: costBenefitAnalysis.enpv / 1000, // тис. грн -> млн грн
          eirr: costBenefitAnalysis.eirr,
          bcr: costBenefitAnalysis.bcr,
          rank: 0 // Буде встановлено при сортуванні
        });

        console.log(`✓ ${road.roadName}: ENPV=${costBenefitAnalysis.enpv.toFixed(0)} тис.грн, BCR=${costBenefitAnalysis.bcr.toFixed(2)}`);
      }

      // Ранжування за ENPV (від найбільшого до найменшого)
      const sortedResults = rankingResults
        .sort((a, b) => {
          // Спочатку сортуємо за BCR > 1 (економічно доцільні)
          const aViable = a.bcr > 1;
          const bViable = b.bcr > 1;
          
          if (aViable && !bViable) return -1;
          if (!aViable && bViable) return 1;
          
          // Потім за ENPV
          return b.enpv - a.enpv;
        })
        .map((row, index) => ({
          ...row,
          rank: index + 1
        }));

      setRankingData(sortedResults);
      setCalculated(true);
      
      // ✅ Позначаємо сторінку 4 як завершену
      appDispatch(setPage4Complete(true));

      console.log('=== Рангування завершено ===');
      console.log(`Всього об'єктів: ${sortedResults.length}`);
      console.log(`Економічно доцільних (BCR > 1): ${sortedResults.filter(r => r.bcr > 1).length}`);

    } catch (err) {
      console.error('Помилка при розрахунку рангування:', err);
      setError(`Помилка розрахунку: ${err instanceof Error ? err.message : 'Невідома помилка'}`);
    } finally {
      setIsCalculating(false);
    }
  };

  // ✅ ФУНКЦІЯ ЗБЕРЕЖЕННЯ ТА ОЧИЩЕННЯ
  const handleSaveAndClear = async () => {
    if (!calculated || rankingData.length === 0) {
      alert('Немає даних для збереження. Спочатку виконайте розрахунок рангування.');
      return;
    }

    // ✅ ПІДТВЕРДЖЕННЯ ПЕРЕД ОЧИЩЕННЯМ
    const confirmSave = window.confirm(
      '📋 Зберегти результати в історію?\n\n' +
      '✅ Результати будуть збережені в історію\n' +
      '🧹 Всі введені дані на сторінках будуть очищені\n\n' +
      'Продовжити?'
    );

    if (!confirmSave) {
      return;
    }

    setSaveStatus('Збереження...');

    try {
      // Створюємо сесію, якщо її немає
      let sessionId = currentSession?.id;
      if (!sessionId) {
        await createSession(
          `Планування ремонтів - ${new Date().toLocaleString('uk-UA')}`,
          'Сесія розрахунків планування ремонтних робіт'
        );
        sessionId = currentSession?.id;
      }

      if (!sessionId) {
        setSaveStatus('Помилка створення сесії');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      // Підготовка даних для збереження
      const sectionsWithResults = calculatedRoadsFromRedux.map((road) => {
        const ranking = rankingData.find(r => r.id === road.id);
        return {
          id: road.id,
          name: road.roadName,
          length: road.length,
          category: road.category,
          trafficIntensity: road.actualIntensity,
          strengthModulus: road.actualElasticModulus,
          roughnessProfile: road.actualSurfaceEvenness,
          roughnessBump: 0,
          rutDepth: road.actualRutDepth,
          frictionCoeff: road.actualFrictionValue,
          significance: 'state' as const,
          estimatedCost: ranking?.estimatedCost ? ranking.estimatedCost * 1000 : 0,
          workType: ranking ? WORK_TYPE_NAMES[ranking.workType] : '-',
          workTypeRaw: ranking?.workType as any,
          intensityCoeff: road.detailedCondition.intensityCoefficient,
          strengthCoeff: road.detailedCondition.strengthCoefficient,
          evennessCoeff: road.detailedCondition.evennessCoefficient,
          rutCoeff: road.detailedCondition.rutCoefficient,
          frictionFactorCoeff: road.detailedCondition.frictionCoefficient,
          enpv: ranking?.enpv ? ranking.enpv * 1000 : 0,
          eirr: ranking?.eirr || 0,
          bcr: ranking?.bcr || 0,
          rank: ranking?.rank || 0
        };
      });

      const planningData = {
        totalProjects: statistics?.totalProjects || 0,
        totalCost: statistics?.totalCost || 0,
        viableProjects: statistics?.viableProjects || 0,
        avgENPV: statistics?.avgENPV || 0,
        avgBCR: statistics?.avgBCR || 0,
        avgEIRR: statistics?.avgEIRR || 0,
        byWorkType: statistics?.byWorkType || {
          current_repair: 0,
          capital_repair: 0,
          reconstruction: 0
        }
      };

      const complianceAnalysis = {
        compliantSections: calculatedRoadsFromRedux.length,
        nonCompliantSections: 0,
        categoryIssues: 0,
        frictionIssues: 0
      };

      const reportText = `Звіт з планування ремонтних робіт\n\n` +
        `Оброблено секцій: ${sectionsWithResults.length}\n` +
        `Потребують ремонту: ${rankingData.length}\n` +
        `Економічно доцільних: ${statistics?.viableProjects || 0}\n` +
        `Загальна вартість: ${(statistics?.totalCost || 0).toFixed(1)} млн грн\n` +
        `Середній BCR: ${(statistics?.avgBCR || 0).toFixed(2)}`;

      // Зберігаємо в історію
      await historyDispatch(saveBlockThreeData({
        sessionId,
        sections: sectionsWithResults,
        planningData,
        complianceAnalysis,
        reportText
      }));

      setSaveStatus('✅ Збережено!');
      
      // Очищення через 1.5 секунди
      setTimeout(() => {
        console.log('🧹 Початок очищення даних блоку 3...');
        
        // ✅ ПОВНЕ ОЧИЩЕННЯ ВСІХ ДАНИХ
        console.log('  → Очищення Redux state блоку 3...');
        appDispatch(resetBlockThree()); // Очищає sections, costStandards, статуси сторінок
        
        console.log('  → Очищення результатів ENPV...');
        appDispatch(clearENPVResults()); // Очищає всі ENPV результати
        
        console.log('  → Очищення розрахованих доріг...');
        appDispatch(setCalculatedRoads([])); // Очищає дані зі сторінки 1-2
        
        console.log('  → Повернення на сторінку 1...');
        appDispatch(setCurrentPage(1)); // Повертаємось на першу сторінку
        
        // Очищаємо локальний state компонента
        console.log('  → Очищення локального state...');
        setRankingData([]);
        setCalculated(false);
        setError('');
        setSaveStatus('');
        
        console.log('✅ ОЧИЩЕННЯ ЗАВЕРШЕНО!');
        console.log('📊 Статус:');
        console.log('  - Результати збережено в історію ✓');
        console.log('  - Всі введені дані очищено ✓');
        console.log('  - Готово до нових розрахунків ✓');
        
        alert(
          '✅ УСПІШНО ЗБЕРЕЖЕНО!\n\n' +
          '📋 Результати збережено в історію\n' +
          '🧹 Всі введені дані очищено\n' +
          '🔄 Система готова до нових розрахунків\n\n' +
          'Ви можете почати новий розрахунок з Сторінки 1.'
        );
      }, 1500);

    } catch (error) {
      console.error('Помилка при збереженні:', error);
      setSaveStatus('❌ Помилка збереження');
      alert('Помилка при збереженні результатів: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Ранг',
      'Найменування',
      'Протяжність (км)',
      'Категорія',
      'Вид робіт',
      'Вартість (млн грн)',
      'ENPV (млн грн)',
      'EIRR (%)',
      'BCR'
    ];

    const csvRows = [
      'Рангування об\'єктів дорожніх робіт',
      '',
      headers.join(','),
      ...rankingData.map(row => [
        row.rank,
        `"${row.roadName}"`,
        row.length.toFixed(1),
        row.category,
        `"${WORK_TYPE_NAMES[row.workType]}"`,
        row.estimatedCost.toFixed(2),
        row.enpv.toFixed(2),
        (row.eirr * 100).toFixed(2),
        row.bcr.toFixed(2)
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `road_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Статистика
  const statistics = useMemo(() => {
    if (rankingData.length === 0) return null;

    return {
      totalProjects: rankingData.length,
      totalCost: rankingData.reduce((sum, r) => sum + r.estimatedCost, 0),
      viableProjects: rankingData.filter(r => r.bcr > 1).length,
      avgENPV: rankingData.reduce((sum, r) => sum + r.enpv, 0) / rankingData.length,
      avgBCR: rankingData.reduce((sum, r) => sum + r.bcr, 0) / rankingData.length,
      avgEIRR: rankingData.reduce((sum, r) => sum + r.eirr, 0) / rankingData.length,
      byWorkType: {
        current_repair: rankingData.filter(r => r.workType === 'current_repair').length,
        capital_repair: rankingData.filter(r => r.workType === 'capital_repair').length,
        reconstruction: rankingData.filter(r => r.workType === 'reconstruction').length
      }
    };
  }, [rankingData]);

  return (
    <div className="w-full space-y-6 p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Рангування об'єктів дорожніх робіт</h1>
          <p className="text-sm text-gray-600 mt-1">
            Економічна оцінка та пріоритезація проектів за критеріями ENPV, EIRR, BCR
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={hasENPVResults ? calculateRankingFromRedux : calculateRanking} 
            disabled={(!hasReduxData && !hasENPVResults) || isCalculating}
            className="bg-white border-1 border-green-700 text-black hover:bg-green-400"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Розрахунок...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Розрахувати рангування
              </>
            )}
          </Button>
          {calculated && (
            <>
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Експорт CSV
              </Button>
              <Button 
                onClick={handleSaveAndClear}
                disabled={saveStatus === 'Збереження...'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                title="Зберегти результати в історію та очистити всі введені дані"
              >
                {saveStatus === 'Збереження...' ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Збереження...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    💾 Зберегти в історію та очистити
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Статус збереження */}
      {saveStatus && saveStatus.includes('✅') && (
        <Alert className="bg-green-50 border-green-400">
          <Save className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{saveStatus}</strong>
            <div className="text-sm mt-1">
              Результати збережено в історію. Підготовка до очищення всіх введених даних...
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Інформація про збереження */}
      {calculated && !saveStatus && (
        <Alert className="bg-purple-50 border-purple-300">
          <Save className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>💾 Готово до збереження!</strong>
            <div className="text-sm mt-2">
              <p className="mb-1">Натисніть кнопку <strong>"Зберегти в історію та очистити"</strong> для:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>✅ Збереження результатів у розділ "Історія"</li>
                <li>🧹 Очищення всіх введених даних на сторінках 1-4</li>
                <li>🔄 Підготовки до нових розрахунків</li>
              </ul>
              <p className="mt-2 text-xs text-purple-700">
                ⚠️ Після очищення ви зможете переглянути збережені результати в розділі "Історія"
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Попередження */}
      {!hasENPVResults && !hasReduxData && (
        <Alert className="bg-yellow-50 border-yellow-400">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Немає даних для рангування!</strong>
            <div className="text-sm mt-1">
              Спочатку перейдіть на Сторінку 3 "Вихідні дані та розрахунок ENPV" 
              та виконайте розрахунок ENPV для кожного об'єкту.
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Інформація про доступні результати ENPV */}
      {hasENPVResults && !calculated && (
        <Alert className="bg-blue-50 border-blue-400">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>✓ Знайдено {enpvResultsFromRedux.length} розрахованих результатів ENPV</strong>
            <div className="text-sm mt-1">
              Натисніть "Розрахувати рангування" для формування таблиці.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Помилка */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Статистика */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Всього проектів</p>
                  <p className="text-2xl font-bold text-blue-700">{statistics.totalProjects}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-400 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Економічно доцільних</p>
                  <p className="text-2xl font-bold text-green-700">
                    {statistics.viableProjects}
                    <span className="text-sm text-gray-600 ml-1">(BCR {'>'} 1)</span>
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-400 bg-purple-50">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Загальна вартість</p>
                <p className="text-xl font-bold text-purple-700">
                  {statistics.totalCost.toFixed(1)} млн грн
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-400 bg-orange-50">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Середній BCR</p>
                <p className="text-xl font-bold text-orange-700">
                  {statistics.avgBCR.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Таблиця рангування */}
      {calculated && rankingData.length > 0 && (
        <Card>
          <CardHeader className="border-b border-blue-600">
            <CardTitle className="text-black text-lg">
              📊 Рангування об'єктів
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-center font-bold">Ранг</TableHead>
                    <TableHead className="font-bold">Найменування ділянки дороги</TableHead>
                    <TableHead className="text-center font-bold">Протяжність<br/>(км)</TableHead>
                    <TableHead className="text-center font-bold">Категорія</TableHead>
                    <TableHead className="text-center font-bold">Вид робіт</TableHead>
                    <TableHead className="text-right font-bold">Орієнтовна<br/>вартість робіт<br/>(млн грн)</TableHead>
                    <TableHead className="text-right font-bold">Економічна чиста<br/>приведена вартість<br/>(ENPV, млн грн)</TableHead>
                    <TableHead className="text-right font-bold">Економічна<br/>норма дохідності<br/>(EIRR, %)</TableHead>
                    <TableHead className="text-right font-bold">Співвідношення<br/>вигід до витрат<br/>(BCR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingData.map((row, index) => (
                    <TableRow 
                      key={row.id}
                      className={`
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        ${row.rank <= 3 ? 'border-l-4 border-l-green-500' : ''}
                        ${row.bcr < 1 ? 'opacity-60' : ''}
                      `}
                    >
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {row.rank <= 3 && (
                            <Award className={`h-5 w-5 mr-1 ${
                              row.rank === 1 ? 'text-yellow-500' :
                              row.rank === 2 ? 'text-gray-400' :
                              'text-orange-600'
                            }`} />
                          )}
                          <span className={`font-bold ${row.rank <= 3 ? 'text-lg' : ''}`}>
                            {row.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{row.roadName}</TableCell>
                      <TableCell className="text-center">{row.length.toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                          {row.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${WORK_TYPE_COLORS[row.workType]}`}>
                          {WORK_TYPE_NAMES[row.workType]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.estimatedCost.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        row.enpv > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                      }`}>
                        {row.enpv.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(row.eirr * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        row.bcr > 1 ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'
                      }`}>
                        {row.bcr.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Розподіл за видами робіт */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Розподіл проектів за видами робіт</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Поточний ремонт</div>
                <div className="text-2xl font-bold text-blue-700">
                  {statistics.byWorkType.current_repair}
                  <span className="text-sm text-gray-600 ml-2">проектів</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">Капітальний ремонт</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {statistics.byWorkType.capital_repair}
                  <span className="text-sm text-gray-600 ml-2">проектів</span>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-gray-600 mb-1">Реконструкція</div>
                <div className="text-2xl font-bold text-red-700">
                  {statistics.byWorkType.reconstruction}
                  <span className="text-sm text-gray-600 ml-2">проектів</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Пусте повідомлення */}
      {!calculated && (hasReduxData || hasENPVResults) && !isCalculating && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Готово до розрахунку
            </h3>
            <p className="text-gray-500 mb-4">
              {hasENPVResults 
                ? `Знайдено ${enpvResultsFromRedux.length} результатів ENPV. Натисніть "Розрахувати рангування" для створення таблиці.`
                : 'Натисніть "Розрахувати рангування" для створення таблиці з економічними показниками'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};