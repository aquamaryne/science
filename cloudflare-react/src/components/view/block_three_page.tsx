import React, { useState, useEffect } from 'react';
import { ArrowRight, Save } from "lucide-react";
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
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
  const [saveStatus, setSaveStatus] = useState<string>("");

  // ✅ ПЕРЕВІРКА ЗАВЕРШЕННЯ СТОРІНОК (лише для індикаторів)
  const isPage1Complete = blockThreeState.page1Complete;
  const isPage2Complete = blockThreeState.page2Complete;
  const isPage3Complete = blockThreeState.page3Complete;
  const isPage4Complete = blockThreeState.page4Complete;

  // Redux hooks
  const { createSession, dispatch } = useHistory();
  const { currentSession } = useCurrentSession();

  // Синхронизация з Redux при загрузке
  useEffect(() => {
    setCurrentPage(blockThreeState.currentPage);
  }, [blockThreeState.currentPage]);

  const pages = [
    'Показники та коефіцієнти',
    'Фактичний стан доріг та показники вартості',
    'Вихідні дані та розрахунок ENPV',
    'Ранжування об\'єктів'
  ];

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
    appDispatch(setCurrentPageAction(page));
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

    // mockSections вже в Redux через blockThreeState.sections

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
    } catch (error) {
      console.error('Помилка при збереженні результатів:', error);
      setSaveStatus("❌ Помилка збереження");
    }
    
    setTimeout(() => setSaveStatus(""), 3000);
  };

  return (
    <ErrorBoundary>
    <div className="bg-gray-50">
      {/* Заголовок */}
      <div className="mb-4 md:mb-6 xl:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900">
          Планування ремонтів автомобільних доріг
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 flex-1 sm:flex-initial text-xs md:text-sm xl:text-base"
            disabled={false}
          >
            <Save className="h-3 w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
            Зберегти
          </Button>
          {saveStatus && (
            <span className="text-xs md:text-sm xl:text-base text-green-600">{saveStatus}</span>
          )}
        </div>
      </div>

      {/* Навігація по сторінках */}
      <div className="mb-3 md:mb-4 xl:mb-6">
        <nav className="flex justify-center overflow-x-auto pb-2">
          <ol className="flex items-center space-x-1 md:space-x-2 xl:space-x-3 min-w-max px-2">
            {pages.map((page, index) => {
              const pageNum = index + 1;
              const isActive = currentPage === pageNum;
              
              // ✅ Визначаємо чи завершена сторінка
              const isCompleted = 
                (pageNum === 1 && isPage1Complete) ||
                (pageNum === 2 && isPage2Complete) ||
                (pageNum === 3 && isPage3Complete) ||
                (pageNum === 4 && isPage4Complete);
              
              return (
                <li key={pageNum} className="flex items-center">
                  <button
                    onClick={() => handlePageSelect(pageNum)}
                    className={`flex items-center px-2 md:px-2.5 xl:px-3 py-1 md:py-1.5 xl:py-2 text-[10px] md:text-xs xl:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`mr-1 md:mr-1.5 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs flex-shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300'
                    }`}>
                      {isCompleted ? '✓' : pageNum}
                    </span>
                    <span className="hidden md:inline">{page}</span>
                  </button>
                  {index < pages.length - 1 && (
                    <ArrowRight className="h-3 w-3 md:h-3 md:w-3 xl:h-4 xl:w-4 mx-0.5 md:mx-1 xl:mx-1.5 text-gray-400 flex-shrink-0" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Прогрес */}
      <div className="mb-3 md:mb-4 xl:mb-6">
        <Progress value={(currentPage / pages.length) * 100} className="h-1.5 md:h-2 xl:h-2.5" />
      </div>

      {/* Контент сторінок */}
      {currentPage === 1 && (
        <RoadTechnicalAssessment 
          onCompleted={() => {
            // ✅ Розрахунок завершено, залишаємось на поточній сторінці
            // Користувач сам перейде на наступну сторінку, коли буде готовий
          }}
        />
      )}
      
      {currentPage === 2 && <RoadCostIndicators />}
      
      {currentPage === 3 && <ENPVInputTable />}
      
      {currentPage === 4 && <RoadRankingTable />}

      {/* PDF Звіт */}
      <div className="mt-4 md:mt-6 xl:mt-8">
        <PDFReportBlockThree />
      </div>
    </div>
    </ErrorBoundary>
  );
};