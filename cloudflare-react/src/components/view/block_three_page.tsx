import React, { useState, useEffect } from 'react';
import { ArrowRight, Save, Lock, CheckCircle2 } from "lucide-react";
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { RoadTechnicalAssessment } from '@/page/block_three/page_one_and_two';
import { RoadCostIndicators } from '@/page/block_three/page_three_and_four';
import  ENPVInputTable from '@/page/block_three/page_five_and_six';
import { RoadRankingTable } from '@/page/block_three/page_seven';
import { useHistory, useCurrentSession } from '../../redux/hooks';
import { saveBlockThreeData } from '../../redux/slices/historySlice';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { 
  setCurrentPage as setCurrentPageAction
} from '../../redux/slices/blockThreeSlice';
import PDFReportBlockThree from "@/components/PDFReportBlockThree";
import ErrorBoundary from '../ErrorBoundary';

export interface RoadSectionUI {
  id: string;
  name: string;
  length: number;
  category: 1 | 2 | 3 | 4 | 5;
  trafficIntensity: number;
  strengthModulus: number;
  roughnessProfile: number;
  roughnessBump: number;
  rutDepth: number;
  frictionCoeff: number;
  significance: 'state' | 'local';
  
  // Додаткові поля для розрахунків
  region?: string;
  isDefenseRoad?: boolean;
  isInternationalRoad?: boolean;
  isEuropeanNetwork?: boolean;
  hasLighting?: boolean;
  criticalInfrastructureCount?: number;
  estimatedCost?: number;
  
  // Додано для розрахунків коефіцієнтів та відповідності
  intensityCoeff?: number;
  strengthCoeff?: number;
  evennessCoeff?: number;
  rutCoeff?: number;
  frictionFactorCoeff?: number;
  categoryCompliant?: boolean;
  strengthCompliant?: boolean;
  evennessCompliant?: boolean;
  rutCompliant?: boolean;
  frictionCompliant?: boolean;
  workTypeRaw?: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
  workType?: string;
};

export const Block3MultiPageApp: React.FC = () => {
  const appDispatch = useAppDispatch();
  const blockThreeState = useAppSelector(state => state.blockThree);
  
  const [currentPage, setCurrentPage] = useState(blockThreeState.currentPage);
  const [sections, setSections] = useState<RoadSectionUI[]>(blockThreeState.sections);
  const [saveStatus, setSaveStatus] = useState<string>("");

  // ✅ ПЕРЕВІРКА ДОСТУПНОСТІ СТОРІНОК
  const isPage1Complete = blockThreeState.page1Complete;
  const isPage2Complete = blockThreeState.page2Complete;
  const isPage3Complete = blockThreeState.page3Complete;
  const isPage4Complete = blockThreeState.page4Complete;
  
  const isPage2Unlocked = isPage1Complete;
  const isPage3Unlocked = isPage1Complete && isPage2Complete;
  const isPage4Unlocked = isPage1Complete && isPage2Complete && isPage3Complete;

  // Redux hooks
  const { createSession, dispatch } = useHistory();
  const { currentSession } = useCurrentSession();

  // Синхронизация с Redux при загрузке
  useEffect(() => {
    setCurrentPage(blockThreeState.currentPage);
    setSections(blockThreeState.sections);
  }, [blockThreeState]);

  React.useEffect(() => {
    console.log('Головний стан sections оновлено:', sections.length, 'секцій');
    console.log('Секції з розрахованими даними:', sections.filter(s => s.workType).length);
  }, [sections]);

  const pages = [
    'Показники та коефіцієнти',
    'Фактичний стан доріг та показники вартості',
    'Вихідні дані та розрахунок ENPV',
    'Ранжування об\'єктів'
  ];

  const handlePageSelect = (page: number) => {
    // ✅ Перевіряємо чи дозволений перехід на сторінку
    if (page === 1) {
      setCurrentPage(page);
      appDispatch(setCurrentPageAction(page));
    } else if (page === 2 && isPage2Unlocked) {
      setCurrentPage(page);
      appDispatch(setCurrentPageAction(page));
    } else if (page === 3 && isPage3Unlocked) {
      setCurrentPage(page);
      appDispatch(setCurrentPageAction(page));
    } else if (page === 4 && isPage4Unlocked) {
      setCurrentPage(page);
      appDispatch(setCurrentPageAction(page));
    }
  };

  const handleSave = async () => {
    // Создаем фиктивные данные для демонстрации
    const mockSections: RoadSectionUI[] = [
      {
        id: '1',
        name: 'Ділянка 1',
        length: 5.2,
        category: 1,
        trafficIntensity: 1500,
        strengthModulus: 120,
        roughnessProfile: 2.1,
        roughnessBump: 1.8,
        rutDepth: 8.5,
        frictionCoeff: 0.45,
        significance: 'state',
        estimatedCost: 2500000,
        workType: 'Поточний ремонт',
        categoryCompliant: true,
        strengthCompliant: false,
        evennessCompliant: true,
        rutCompliant: false,
        frictionCompliant: true
      },
      {
        id: '2',
        name: 'Ділянка 2',
        length: 3.8,
        category: 2,
        trafficIntensity: 800,
        strengthModulus: 95,
        roughnessProfile: 3.2,
        roughnessBump: 2.5,
        rutDepth: 12.1,
        frictionCoeff: 0.38,
        significance: 'local',
        estimatedCost: 1800000,
        workType: 'Капітальний ремонт',
        categoryCompliant: false,
        strengthCompliant: false,
        evennessCompliant: false,
        rutCompliant: false,
        frictionCompliant: false
      }
    ];

    setSections(mockSections);

    try {
      setSaveStatus("Збереження...");
      
      // Створюємо сесію, якщо її немає
      let sessionId = currentSession?.id;
      if (!sessionId) {
        await createSession(
          `Планування ремонтів - ${new Date().toLocaleString('uk-UA')}`,
          'Сесія розрахунків планування ремонтних робіт'
        );
        // После создания сессии, получаем её ID из currentSession
        sessionId = currentSession?.id;
      }

      if (!sessionId) {
        setSaveStatus("Помилка створення сесії");
        setTimeout(() => setSaveStatus(""), 3000);
        return;
      }

      // Створюємо фіктивні дані для демонстрації
      const planningData = {
        budget: 1000000, // Прикладний бюджет
        utilizationPercent: 85.5,
        selectedProjects: {
          currentRepair: mockSections.filter(s => s.workType === 'Поточний ремонт').length,
          capitalRepair: mockSections.filter(s => s.workType === 'Капітальний ремонт').length,
          reconstruction: mockSections.filter(s => s.workType === 'Реконструкція').length
        }
      };

      const complianceAnalysis = {
        compliantSections: mockSections.filter(s => s.categoryCompliant).length,
        nonCompliantSections: mockSections.filter(s => !s.categoryCompliant).length,
        categoryIssues: mockSections.filter(s => !s.categoryCompliant).length,
        frictionIssues: mockSections.filter(s => !s.frictionCompliant).length
      };

      const reportText = `Звіт з планування ремонтних робіт\n\n` +
        `Оброблено секцій: ${mockSections.length}\n` +
        `Потребують ремонту: ${mockSections.filter(s => s.workType && s.workType !== 'Не потрібно').length}\n` +
        `Загальна вартість: ${mockSections.reduce((sum, s) => sum + (s.estimatedCost || 0), 0).toFixed(1)} млн грн\n` +
        `Використання бюджету: ${planningData.utilizationPercent}%`;

      await dispatch(saveBlockThreeData({
        sessionId,
        sections: mockSections,
        planningData,
        complianceAnalysis,
        reportText
      }));

      setSaveStatus("✅ Збережено в історію!");
      console.log('Результати планування ремонтів збережено в Redux історію');
    } catch (error) {
      console.error('Помилка при збереженні результатів:', error);
      setSaveStatus("❌ Помилка збереження");
    }
    
    setTimeout(() => setSaveStatus(""), 3000);
  };

  return (
    <ErrorBoundary>
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Планування ремонтів автомобільних доріг
        </h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            disabled={false}
          >
            <Save className="h-4 w-4" />
            Зберегти
          </Button>
          {saveStatus && (
            <span className="text-sm text-green-600">{saveStatus}</span>
          )}
        </div>
      </div>

      {/* ✅ ІНФОРМАЦІЯ ПРО ЕТАПИ */}
      <Alert className="mb-4 bg-blue-50 border-blue-300">
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-semibold text-blue-900">Послідовність розрахунків:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {isPage1Complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                )}
                <span className={isPage1Complete ? "text-green-700 font-medium" : "text-blue-700"}>
                  Сторінка 1: Показники та коефіцієнти
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPage2Complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isPage2Unlocked ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <span className={isPage2Complete ? "text-green-700 font-medium" : isPage2Unlocked ? "text-blue-700" : "text-gray-500"}>
                  Сторінка 2: Фактичний стан доріг та показники вартості
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPage3Complete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isPage3Unlocked ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <span className={isPage3Complete ? "text-green-700 font-medium" : isPage3Unlocked ? "text-blue-700" : "text-gray-500"}>
                  Сторінка 3: Вихідні дані та розрахунок ENPV
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPage4Unlocked ? (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
                <span className={isPage4Unlocked ? "text-blue-700" : "text-gray-500"}>
                  Сторінка 4: Ранжування об'єктів
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Навігація по сторінках */}
      <div className="mb-6">
        <nav className="flex justify-center">
          <ol className="flex items-center space-x-2">
            {pages.map((page, index) => {
              const pageNum = index + 1;
              const isActive = currentPage === pageNum;
              
              // ✅ Визначаємо чи завершена сторінка
              const isCompleted = 
                (pageNum === 1 && isPage1Complete) ||
                (pageNum === 2 && isPage2Complete) ||
                (pageNum === 3 && isPage3Complete) ||
                (pageNum === 4 && isPage4Complete);
              
              // ✅ Визначаємо чи заблокована сторінка
              const isLocked = 
                (pageNum === 2 && !isPage2Unlocked) ||
                (pageNum === 3 && !isPage3Unlocked) ||
                (pageNum === 4 && !isPage4Unlocked);
              
              return (
                <li key={pageNum} className="flex items-center">
                  <button
                    onClick={() => handlePageSelect(pageNum)}
                    disabled={isLocked}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : isLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isActive 
                        ? 'bg-white text-blue-600' 
                        : isCompleted 
                        ? 'bg-green-600 text-white' 
                        : isLocked
                        ? 'bg-gray-300'
                        : 'bg-gray-300'
                    }`}>
                      {isCompleted ? '✓' : isLocked ? <Lock className="h-3 w-3" /> : pageNum}
                    </span>
                    <span className="hidden md:inline">{page}</span>
                  </button>
                  {index < pages.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Прогрес */}
      <div className="mb-6">
        <Progress value={(currentPage / pages.length) * 100} className="h-2" />
      </div>

      {/* Контент сторінок */}
      {currentPage === 1 && (
        <RoadTechnicalAssessment 
          onCompleted={() => {
            // ✅ Автоматично переходимо на наступну сторінку після розрахунку
            setTimeout(() => setCurrentPage(2), 700);
            setTimeout(() => appDispatch(setCurrentPageAction(2)), 700);
          }}
        />
      )}
      
      {currentPage === 2 && (
        isPage2Unlocked ? (
          <RoadCostIndicators />
        ) : (
          <Alert className="bg-yellow-50 border-yellow-400">
            <Lock className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Ця сторінка заблокована.</strong>
              <div className="text-sm mt-1">
                Спочатку виконайте розрахунки на Сторінці 1: Показники та коефіцієнти.
              </div>
            </AlertDescription>
          </Alert>
        )
      )}
      
      {currentPage === 3 && (
        isPage3Unlocked ? (
          <ENPVInputTable />
        ) : (
          <Alert className="bg-yellow-50 border-yellow-400">
            <Lock className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Ця сторінка заблокована.</strong>
              <div className="text-sm mt-1">
                {!isPage1Complete && "Спочатку виконайте розрахунки на Сторінці 1: Показники та коефіцієнти."}
                {isPage1Complete && !isPage2Complete && "Спочатку виконайте розрахунки на Сторінці 2: Фактичний стан доріг та показники вартості."}
              </div>
            </AlertDescription>
          </Alert>
        )
      )}
      
      {currentPage === 4 && (
        isPage4Unlocked ? (
          <RoadRankingTable />
        ) : (
          <Alert className="bg-yellow-50 border-yellow-400">
            <Lock className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Ця сторінка заблокована.</strong>
              <div className="text-sm mt-1">
                {!isPage1Complete && "Спочатку виконайте розрахунки на Сторінці 1: Показники та коефіцієнти."}
                {isPage1Complete && !isPage2Complete && "Спочатку виконайте розрахунки на Сторінці 2: Фактичний стан доріг та показники вартості."}
                {isPage1Complete && isPage2Complete && !isPage3Complete && "Спочатку виконайте розрахунки на Сторінці 3: Вихідні дані та розрахунок ENPV."}
              </div>
            </AlertDescription>
          </Alert>
        )
      )}

      {/* PDF Звіт */}
      <div className="mt-8">
        <PDFReportBlockThree />
      </div>
    </div>
    </ErrorBoundary>
  );
};