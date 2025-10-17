import React, { useState } from 'react';
import { ArrowRight } from "lucide-react";
import { Progress } from '../ui/progress';
import { RoadTechnicalAssessment } from '@/page/block_three/page_one_and_two';
import { RoadCostIndicators } from '@/page/block_three/page_three_and_four';
import  ENPVInputTable from '@/page/block_three/page_five_and_six';
import { RoadRankingTable } from '@/page/block_three/page_seven';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [sections, _setSections] = useState<RoadSectionUI[]>([]);

  React.useEffect(() => {
    console.log('Главное состояние sections обновлено:', sections.length, 'секций');
    console.log('Секции с рассчитанными данными:', sections.filter(s => s.workType).length);
  }, [sections]);

  const pages = [
    'Показники та коефіцієнти',
    'Фактичний стан доріг та показники вартості',
    'Вихідні дані та розрахунок ENPV',
    'Ранжування об\'єктів'
  ];

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Планування ремонтів автомобільних доріг
        </h1>
      </div>

      {/* Навігація по сторінках */}
      <div className="mb-6">
        <nav className="flex justify-center">
          <ol className="flex items-center space-x-2">
            {pages.map((page, index) => {
              const pageNum = index + 1;
              const isActive = currentPage === pageNum;
              const isCompleted = currentPage > pageNum;
              
              return (
                <li key={pageNum} className="flex items-center">
                  <button
                    onClick={() => handlePageSelect(pageNum)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300'
                    }`}>
                      {isCompleted ? '✓' : pageNum}
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

      {/* Контент сторінок - БЕЗ ЗАЙВИХ ОБГОРТОК */}
      {currentPage === 1 && <RoadTechnicalAssessment />}
      {currentPage === 2 && <RoadCostIndicators />}
      {currentPage === 3 && <ENPVInputTable />}
      {currentPage === 4 && <RoadRankingTable />}
    </div>
  );
};