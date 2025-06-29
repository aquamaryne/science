import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  InfoIcon, 
  PlusIcon, 
  TrashIcon, 
  CalculatorIcon, 
  FileTextIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";

// Типы данных (базовые интерфейсы)
interface RoadTechnicalCondition {
  intensityCoefficient: number;
  strengthCoefficient: number;
  evennessCoefficient: number;
  rutCoefficient: number;
  frictionCoefficient: number;
}

interface RoadSection {
  id: string;
  name: string;
  category: number;
  length: number;
  significance: 'state' | 'local';
  technicalCondition: RoadTechnicalCondition;
  trafficIntensity: number;
  estimatedCost?: number;
}

interface RepairProject {
  section: RoadSection;
  workType: 'current_repair' | 'capital_repair' | 'reconstruction';
  priority: number;
  estimatedCost: number;
  economicNPV?: number;
  reasoning: string;
}

interface ExpertAssessment {
  operationalStateIndex: number;
  trafficIntensity: number;
}

// Константы (имитация импорта из модуля)
const MAX_DESIGN_INTENSITY_BY_CATEGORY: Record<number, number> = {
  1: 20000, 2: 12000, 3: 6000, 4: 2000, 5: 500
};

const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY: Record<number, number> = {
  1: 1.0, 2: 1.0, 3: 0.95, 4: 0.90, 5: 0.85
};

const REQUIRED_FRICTION_COEFFICIENT = 0.35;

// Функции расчета (упрощенные версии)
const determineWorkType = (section: RoadSection): 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed' => {
  const condition = section.technicalCondition;
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
  
  if (section.trafficIntensity > maxDesignIntensity || condition.intensityCoefficient < 1.0) {
    return 'reconstruction';
  }
  
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
  if (condition.strengthCoefficient < minStrengthCoeff) {
    return 'capital_repair';
  }
  
  if (condition.evennessCoefficient < 1.0 || 
      condition.rutCoefficient < 1.0 || 
      (condition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT) < REQUIRED_FRICTION_COEFFICIENT) {
    return 'current_repair';
  }
  
  return 'no_work_needed';
};

const estimateWorkCost = (section: RoadSection, workType: string): number => {
  const baseCosts = {
    current_repair: { 1: 3000, 2: 2000, 3: 1500, 4: 1000, 5: 800 },
    capital_repair: { 1: 15000, 2: 12000, 3: 10000, 4: 8000, 5: 6000 },
    reconstruction: { 1: 50000, 2: 40000, 3: 30000, 4: 25000, 5: 20000 }
  };
  
  const category = Math.min(Math.max(section.category, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const categoryBaseCost = baseCosts[workType as keyof typeof baseCosts]?.[category] || 1000;
  return categoryBaseCost * section.length;
};

// Компонент добавления дорожной секции
const RoadSectionForm = ({ onAdd }: { onAdd: (section: RoadSection) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 3,
    length: 1,
    significance: 'state' as 'state' | 'local',
    trafficIntensity: 1000,
    intensityCoefficient: 1.0,
    strengthCoefficient: 1.0,
    evennessCoefficient: 1.0,
    rutCoefficient: 1.0,
    frictionCoefficient: 1.0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSection: RoadSection = {
      id: `section_${Date.now()}`,
      name: formData.name || `Секція ${Date.now()}`,
      category: formData.category,
      length: formData.length,
      significance: formData.significance,
      trafficIntensity: formData.trafficIntensity,
      technicalCondition: {
        intensityCoefficient: formData.intensityCoefficient,
        strengthCoefficient: formData.strengthCoefficient,
        evennessCoefficient: formData.evennessCoefficient,
        rutCoefficient: formData.rutCoefficient,
        frictionCoefficient: formData.frictionCoefficient
      }
    };

    onAdd(newSection);
    
    // Сброс формы
    setFormData({
      name: '',
      category: 3,
      length: 1,
      significance: 'state',
      trafficIntensity: 1000,
      intensityCoefficient: 1.0,
      strengthCoefficient: 1.0,
      evennessCoefficient: 1.0,
      rutCoefficient: 1.0,
      frictionCoefficient: 1.0
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Додати дорожню секцію
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва секції</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Назва дороги"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Категорія</label>
              <Select 
                value={formData.category.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">I категорія</SelectItem>
                  <SelectItem value="2">II категорія</SelectItem>
                  <SelectItem value="3">III категорія</SelectItem>
                  <SelectItem value="4">IV категорія</SelectItem>
                  <SelectItem value="5">V категорія</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Значення</label>
              <Select 
                value={formData.significance} 
                onValueChange={(value: 'state' | 'local') => setFormData(prev => ({ ...prev, significance: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">Державного значення</SelectItem>
                  <SelectItem value="local">Місцевого значення</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Довжина (км)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 1 }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Інтенсивність руху (авт./добу)</label>
              <Input
                type="number"
                min="1"
                value={formData.trafficIntensity}
                onChange={(e) => setFormData(prev => ({ ...prev, trafficIntensity: parseInt(e.target.value) || 1000 }))}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Технічний стан (коефіцієнти)</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Інтенсивність <InfoIcon className="inline h-3 w-3" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Коефіцієнт інтенсивності руху</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.intensityCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, intensityCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Міцність <InfoIcon className="inline h-3 w-3" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Коефіцієнт міцності дорожнього одягу</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.strengthCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengthCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Рівність <InfoIcon className="inline h-3 w-3" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Коефіцієнт рівності покриття</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.evennessCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, evennessCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Колійність <InfoIcon className="inline h-3 w-3" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Коефіцієнт колійності</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.rutCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, rutCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">Зчеплення <InfoIcon className="inline h-3 w-3" /></span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Коефіцієнт зчеплення (≥{REQUIRED_FRICTION_COEFFICIENT})</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.frictionCoefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, frictionCoefficient: parseFloat(e.target.value) || 1.0 }))}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <PlusIcon className="h-4 w-4 mr-2" />
            Додати секцію
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Компонент для отображения статуса соответствия нормативам
const ComplianceStatus = ({ section }: { section: RoadSection }) => {
  const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
  const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
  const actualFriction = section.technicalCondition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
  
  const intensityCompliant = section.trafficIntensity <= maxDesignIntensity;
  const strengthCompliant = section.technicalCondition.strengthCoefficient >= minStrengthCoeff;
  const frictionCompliant = actualFriction >= REQUIRED_FRICTION_COEFFICIENT;
  
  const getStatusIcon = (compliant: boolean) => 
    compliant ? <CheckCircleIcon className="h-4 w-4 text-green-600" /> : <XCircleIcon className="h-4 w-4 text-red-600" />;
  
  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {getStatusIcon(intensityCompliant)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Інтенсивність: {section.trafficIntensity}/{maxDesignIntensity}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {getStatusIcon(strengthCompliant)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Міцність: {section.technicalCondition.strengthCoefficient.toFixed(2)}/{minStrengthCoeff}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {getStatusIcon(frictionCompliant)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Зчеплення: {actualFriction.toFixed(3)}/{REQUIRED_FRICTION_COEFFICIENT}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// Компонент экспертной оценки для местных дорог
const ExpertAssessmentForm = ({ 
  section, 
  assessment, 
  onUpdate 
}: { 
  section: RoadSection;
  assessment?: ExpertAssessment;
  onUpdate: (sectionId: string, assessment: ExpertAssessment) => void;
}) => {
  const [operationalStateIndex, setOperationalStateIndex] = useState(assessment?.operationalStateIndex || 5);
  const [trafficIntensity, setTrafficIntensity] = useState(assessment?.trafficIntensity || section.trafficIntensity);

  const handleUpdate = () => {
    onUpdate(section.id, {
      operationalStateIndex,
      trafficIntensity
    });
  };

  const getIndexDescription = (index: number) => {
    if (index >= 8) return "Відмінний стан";
    if (index >= 5) return "Потребує поточного ремонту";
    if (index <= 4) return "Потребує капітального ремонту";
    return "Невизначено";
  };

  const getIndexColor = (index: number) => {
    if (index >= 8) return "text-green-600";
    if (index >= 5) return "text-orange-600";
    if (index <= 4) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Експертна оцінка: {section.name}</h4>
        <Badge variant="outline">Місцева дорога</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Індекс експлуатаційного стану (J)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="inline h-3 w-3 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p>1-4: Капітальний ремонт</p>
                    <p>5-7: Поточний ремонт</p>
                    <p>8-10: Роботи не потрібні</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="space-y-2">
            <Input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={operationalStateIndex}
              onChange={(e) => setOperationalStateIndex(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (критичний)</span>
              <span className={`font-medium ${getIndexColor(operationalStateIndex)}`}>
                {operationalStateIndex.toFixed(1)} - {getIndexDescription(operationalStateIndex)}
              </span>
              <span>10 (відмінний)</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Інтенсивність руху (авт./добу)
          </label>
          <Input
            type="number"
            min="1"
            value={trafficIntensity}
            onChange={(e) => setTrafficIntensity(parseInt(e.target.value) || section.trafficIntensity)}
          />
        </div>
      </div>

      <Button onClick={handleUpdate} size="sm" className="mt-3 w-full">
        Оновити експертну оцінку
      </Button>
    </div>
  );
};

// Функция экспертного определения типа работ
const determineWorkTypeByExpertAssessment = (assessment: ExpertAssessment): 'current_repair' | 'capital_repair' | 'no_work_needed' => {
  const j = assessment.operationalStateIndex;
  
  if (j >= 8) {
    return 'no_work_needed';
  } else if (j >= 5 && j <= 7) {
    return 'current_repair';
  } else if (j <= 4) {
    return 'capital_repair';
  }
  
  return 'no_work_needed';
};

// Основной компонент
const BlockFourInterface = () => {
  const [sections, setSections] = useState<RoadSection[]>([]);
  const [projects, setProjects] = useState<RepairProject[]>([]);
  const [budget, setBudget] = useState<number>(100000);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [expertAssessments, setExpertAssessments] = useState<Map<string, ExpertAssessment>>(new Map());
  const [useExpertMethod, setUseExpertMethod] = useState<boolean>(false);

  // Обновление экспертной оценки
  const updateExpertAssessment = (sectionId: string, assessment: ExpertAssessment) => {
    setExpertAssessments(prev => new Map(prev.set(sectionId, assessment)));
  };

  // Добавление секции
  const addSection = (section: RoadSection) => {
    setSections(prev => [...prev, section]);
    
    // Если это местная дорога, добавляем базовую экспертную оценку
    if (section.significance === 'local') {
      setExpertAssessments(prev => new Map(prev.set(section.id, {
        operationalStateIndex: 5,
        trafficIntensity: section.trafficIntensity
      })));
    }
  };

  // Удаление секции
  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setProjects(prev => prev.filter(p => p.section.id !== id));
    setExpertAssessments(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Расчет планирования ремонтов
  const calculateRepairPlan = () => {
    const allProjects: RepairProject[] = [];
    
    sections.forEach(section => {
      let workType: 'current_repair' | 'capital_repair' | 'reconstruction' | 'no_work_needed';
      let reasoning = '';
      
      // Для местных дорог используем экспертный метод, если включен
      if (section.significance === 'local' && useExpertMethod && expertAssessments.has(section.id)) {
        const assessment = expertAssessments.get(section.id)!;
        const expertWorkType = determineWorkTypeByExpertAssessment(assessment);
        workType = expertWorkType;
        reasoning = `Експертна оцінка: індекс ${assessment.operationalStateIndex.toFixed(1)}`;
      } else {
        // Использование технических показателей
        workType = determineWorkType(section);
        reasoning = 'Технічні показники стану дороги';
      }
      
      if (workType !== 'no_work_needed') {
        const estimatedCost = estimateWorkCost(section, workType);
        
        allProjects.push({
          section,
          workType,
          priority: 0,
          estimatedCost,
          reasoning
        });
      }
    });

    // Простое ранжирование с учетом экспертных оценок
    const currentRepair = allProjects.filter(p => p.workType === 'current_repair');
    const capitalRepair = allProjects.filter(p => p.workType === 'capital_repair');
    const reconstruction = allProjects.filter(p => p.workType === 'reconstruction');
    
    // Ранжирование местных дорог по экспертному методу
    if (useExpertMethod) {
      currentRepair.sort((a, b) => {
        if (a.section.significance === 'local' && b.section.significance === 'local') {
          const assessmentA = expertAssessments.get(a.section.id);
          const assessmentB = expertAssessments.get(b.section.id);
          
          if (assessmentA && assessmentB) {
            // Сортировка по наименьшему индексу и наибольшей интенсивности
            const priorityA = assessmentA.operationalStateIndex - (assessmentA.trafficIntensity / 10000);
            const priorityB = assessmentB.operationalStateIndex - (assessmentB.trafficIntensity / 10000);
            return priorityA - priorityB;
          }
        }
        return 0;
      });
      
      capitalRepair.sort((a, b) => {
        if (a.section.significance === 'local' && b.section.significance === 'local') {
          const assessmentA = expertAssessments.get(a.section.id);
          const assessmentB = expertAssessments.get(b.section.id);
          
          if (assessmentA && assessmentB) {
            const priorityA = assessmentA.operationalStateIndex - (assessmentA.trafficIntensity / 10000);
            const priorityB = assessmentB.operationalStateIndex - (assessmentB.trafficIntensity / 10000);
            return priorityA - priorityB;
          }
        }
        return 0;
      });
    }
    
    // Отбор в пределах бюджета
    const selectedProjects: RepairProject[] = [];
    let remainingBudget = budget;
    
    [...currentRepair, ...capitalRepair, ...reconstruction].forEach(project => {
      if (project.estimatedCost <= remainingBudget) {
        selectedProjects.push({
          ...project,
          priority: selectedProjects.length + 1
        });
        remainingBudget -= project.estimatedCost;
      }
    });

    const totalCost = selectedProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
    const budgetUtilization = (totalCost / budget) * 100;

    setProjects(selectedProjects);
    setCalculationResults({
      totalProjects: allProjects.length,
      selectedProjects: selectedProjects.length,
      totalCost,
      budgetUtilization,
      remainingBudget,
      expertMethodUsed: useExpertMethod,
      localRoadsCount: sections.filter(s => s.significance === 'local').length,
      expertAssessmentsCount: expertAssessments.size
    });
  };

  const getWorkTypeLabel = (workType: string) => {
    const labels = {
      current_repair: 'Поточний ремонт',
      capital_repair: 'Капітальний ремонт',
      reconstruction: 'Реконструкція'
    };
    return labels[workType as keyof typeof labels] || workType;
  };

  const getWorkTypeBadgeColor = (workType: string) => {
    const colors = {
      current_repair: 'bg-blue-100 text-blue-800',
      capital_repair: 'bg-orange-100 text-orange-800',
      reconstruction: 'bg-red-100 text-red-800'
    };
    return colors[workType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Блок 4: Планування ремонтних робіт
          </h1>
          <p className="text-gray-600">
            Визначення обсягу та механізм розподілу бюджетних коштів на ремонт автомобільних доріг
          </p>
        </div>

        {/* Настройки бюджета */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5" />
              Бюджетні параметри та методи оцінки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Загальний бюджет (тис. грн)</label>
                <Input
                  type="number"
                  min="1000"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 100000)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Метод оцінки місцевих доріг</label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="expertMethod"
                    checked={useExpertMethod}
                    onChange={(e) => setUseExpertMethod(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="expertMethod" className="text-sm">
                    Експертний метод
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="inline h-3 w-3 ml-1 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Використовувати експертну оцінку для місцевих доріг замість технічних показників</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                </div>
              </div>
              
              <div className="flex items-end">
                <Button onClick={calculateRepairPlan} className="w-full" disabled={sections.length === 0}>
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Розрахувати план
                </Button>
              </div>
              
              {calculationResults && (
                <div className="flex items-end">
                  <Alert className="w-full">
                    <AlertDescription>
                      Використання бюджету: {calculationResults.budgetUtilization.toFixed(1)}%
                      {calculationResults.expertMethodUsed && (
                        <div className="text-xs mt-1">
                          Експертна оцінка: {calculationResults.expertAssessmentsCount}/{calculationResults.localRoadsCount} місцевих доріг
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sections">Дорожні секції ({sections.length})</TabsTrigger>
            <TabsTrigger value="expert">
              Експертна оцінка ({sections.filter(s => s.significance === 'local').length})
            </TabsTrigger>
            <TabsTrigger value="results">Результати планування ({projects.length})</TabsTrigger>
            <TabsTrigger value="report">Звіт</TabsTrigger>
          </TabsList>

          {/* Вкладка: Дорожные секции */}
          <TabsContent value="sections" className="space-y-6">
            <RoadSectionForm onAdd={addSection} />

            {sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Дорожні секції</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Категорія</TableHead>
                        <TableHead>Довжина (км)</TableHead>
                        <TableHead>Інтенсивність</TableHead>
                        <TableHead>Відповідність нормам</TableHead>
                        <TableHead>Потрібні роботи</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section) => {
                        const workType = determineWorkType(section);
                        return (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {section.category} кат. ({section.significance === 'state' ? 'держ.' : 'місц.'})
                              </Badge>
                            </TableCell>
                            <TableCell>{section.length}</TableCell>
                            <TableCell>{section.trafficIntensity.toLocaleString()}</TableCell>
                            <TableCell>
                              <ComplianceStatus section={section} />
                            </TableCell>
                            <TableCell>
                              {workType === 'no_work_needed' ? (
                                <Badge className="bg-green-100 text-green-800">Не потребує</Badge>
                              ) : (
                                <Badge className={getWorkTypeBadgeColor(workType)}>
                                  {getWorkTypeLabel(workType)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSection(section.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка: Экспертная оценка */}
          <TabsContent value="expert" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <InfoIcon className="h-5 w-5" />
                  Експертна оцінка місцевих доріг
                  <Badge variant="outline" className="ml-2">
                    4.4.3.1 Методики
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Експертний експрес-метод використовується для оцінки технічного стану місцевих доріг 
                    на основі індексу експлуатаційного стану (J) від 1 до 10.
                  </AlertDescription>
                </Alert>

                {sections.filter(s => s.significance === 'local').length === 0 ? (
                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Немає доріг місцевого значення для експертної оцінки. 
                      Додайте дороги місцевого значення на вкладці "Дорожні секції".
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {sections
                      .filter(s => s.significance === 'local')
                      .map(section => (
                        <ExpertAssessmentForm
                          key={section.id}
                          section={section}
                          assessment={expertAssessments.get(section.id)}
                          onUpdate={updateExpertAssessment}
                        />
                      ))
                    }
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Методика експертної оцінки:</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>J ≥ 8:</span>
                          <span className="text-green-600 font-medium">Роботи не потрібні</span>
                        </div>
                        <div className="flex justify-between">
                          <span>5 ≤ J ≤ 7:</span>
                          <span className="text-orange-600 font-medium">Поточний ремонт</span>
                        </div>
                        <div className="flex justify-between">
                          <span>J ≤ 4:</span>
                          <span className="text-red-600 font-medium">Капітальний ремонт</span>
                        </div>
                      </div>
                    </div>

                    {useExpertMethod && (
                      <Alert>
                        <CheckCircleIcon className="h-4 w-4" />
                        <AlertDescription>
                          Експертний метод увімкнено. При розрахунку плану для місцевих доріг 
                          використовуватимуться експертні оцінки замість технічних показників.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка: Результаты планирования */}
          <TabsContent value="results" className="space-y-6">
            {calculationResults && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{calculationResults.selectedProjects}</div>
                    <p className="text-sm text-gray-600">Вибрано проектів</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {calculationResults.totalCost.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Загальна вартість (тис. грн)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {calculationResults.budgetUtilization.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">Використання бюджету</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {calculationResults.remainingBudget.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600">Залишок (тис. грн)</p>
                    {calculationResults.expertMethodUsed && (
                      <div className="text-xs text-blue-600 mt-1">
                        Експертна оцінка застосована
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {projects.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>План ремонтних робіт</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пріоритет</TableHead>
                        <TableHead>Дорога</TableHead>
                        <TableHead>Вид робіт</TableHead>
                        <TableHead>Довжина (км)</TableHead>
                        <TableHead>Вартість (тис. грн)</TableHead>
                        <TableHead>Обґрунтування</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.section.id}>
                          <TableCell>
                            <Badge variant="outline">#{project.priority}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{project.section.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getWorkTypeBadgeColor(project.workType)}>
                                {getWorkTypeLabel(project.workType)}
                              </Badge>
                              {project.section.significance === 'local' && calculationResults.expertMethodUsed && (
                                <Badge variant="outline" className="text-xs">
                                  Експертна
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{project.section.length}</TableCell>
                          <TableCell>{project.estimatedCost.toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {project.reasoning}
                            {project.section.significance === 'local' && expertAssessments.has(project.section.id) && (
                              <div className="text-xs text-blue-600">
                                J = {expertAssessments.get(project.section.id)!.operationalStateIndex.toFixed(1)}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  Спочатку додайте дорожні секції та виконайте розрахунок плану ремонтних робіт.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Вкладка: Звіт */}
          <TabsContent value="report" className="space-y-6">
            {calculationResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" />
                    Звіт про планування ремонтних робіт
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Загальна статистика */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Загальні показники</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Загальний бюджет:</span>
                          <span className="font-medium">{budget.toLocaleString()} тис. грн</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Використано:</span>
                          <span className="font-medium">{calculationResults.totalCost.toLocaleString()} тис. грн</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Залишок:</span>
                          <span className="font-medium">{calculationResults.remainingBudget.toLocaleString()} тис. грн</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Використання бюджету:</span>
                          <span className="font-medium">{calculationResults.budgetUtilization.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Всього секцій:</span>
                          <span className="font-medium">{sections.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Потребують ремонту:</span>
                          <span className="font-medium">{calculationResults.totalProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Включено в план:</span>
                          <span className="font-medium">{calculationResults.selectedProjects}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Покриття потреб:</span>
                          <span className="font-medium">
                            {calculationResults.totalProjects > 0 
                              ? ((calculationResults.selectedProjects / calculationResults.totalProjects) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Розподіл за видами робіт */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Розподіл за видами робіт</h3>
                    <div className="space-y-3">
                      {['current_repair', 'capital_repair', 'reconstruction'].map(workType => {
                        const typeProjects = projects.filter(p => p.workType === workType);
                        const typeCost = typeProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
                        const typePercentage = calculationResults.totalCost > 0 ? (typeCost / calculationResults.totalCost) * 100 : 0;
                        
                        return typeProjects.length > 0 ? (
                          <div key={workType} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getWorkTypeBadgeColor(workType)}>
                                  {getWorkTypeLabel(workType)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {typeProjects.length} проектів
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{typeCost.toLocaleString()} тис. грн</div>
                                <div className="text-sm text-gray-600">{typePercentage.toFixed(1)}% бюджету</div>
                              </div>
                            </div>
                            <Progress value={typePercentage} className="h-2" />
                            <div className="mt-2 space-y-1">
                              {typeProjects.map(project => (
                                <div key={project.section.id} className="text-sm flex justify-between">
                                  <span>{project.section.name} ({project.section.length} км)</span>
                                  <span>{project.estimatedCost.toLocaleString()} тис. грн</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Аналіз відповідності нормативам */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Аналіз відповідності нормативним вимогам</h3>
                    <div className="space-y-2">
                      {sections.map(section => {
                        const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
                        const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
                        const actualFriction = section.technicalCondition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
                        
                        const intensityCompliant = section.trafficIntensity <= maxDesignIntensity;
                        const strengthCompliant = section.technicalCondition.strengthCoefficient >= minStrengthCoeff;
                        const frictionCompliant = actualFriction >= REQUIRED_FRICTION_COEFFICIENT;
                        
                        const hasIssues = !intensityCompliant || !strengthCompliant || !frictionCompliant;
                        
                        return hasIssues ? (
                          <div key={section.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                            <div className="font-medium text-red-800 mb-1">{section.name}</div>
                            <div className="text-sm space-y-1">
                              {!intensityCompliant && (
                                <div className="text-red-600">
                                  ⚠️ Перевищення інтенсивності: {section.trafficIntensity.toLocaleString()} {'>'} {maxDesignIntensity.toLocaleString()} авт./добу
                                </div>
                              )}
                              {!strengthCompliant && (
                                <div className="text-red-600">
                                  ⚠️ Недостатня міцність: {section.technicalCondition.strengthCoefficient.toFixed(2)} {'<'} {minStrengthCoeff}
                                </div>
                              )}
                              {!frictionCompliant && (
                                <div className="text-red-600">
                                  ⚠️ Недостатнє зчеплення: {actualFriction.toFixed(3)} {'<'} {REQUIRED_FRICTION_COEFFICIENT}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })}
                      
                      {sections.every(section => {
                        const maxDesignIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[section.category] || 500;
                        const minStrengthCoeff = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[section.category] || 0.85;
                        const actualFriction = section.technicalCondition.frictionCoefficient * REQUIRED_FRICTION_COEFFICIENT;
                        
                        return section.trafficIntensity <= maxDesignIntensity && 
                               section.technicalCondition.strengthCoefficient >= minStrengthCoeff &&
                               actualFriction >= REQUIRED_FRICTION_COEFFICIENT;
                      }) && (
                        <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                          <div className="text-green-800 font-medium">
                            ✅ Всі дорожні секції відповідають нормативним вимогам
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Рекомендації */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Рекомендації</h3>
                    <div className="space-y-2 text-sm">
                      {calculationResults.budgetUtilization < 90 && (
                        <Alert>
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription>
                            Бюджет використано неповністю ({calculationResults.budgetUtilization.toFixed(1)}%). 
                            Розгляньте можливість включення додаткових проектів або збільшення обсягів робіт.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {calculationResults.selectedProjects < calculationResults.totalProjects && (
                        <Alert>
                          <AlertTriangleIcon className="h-4 w-4" />
                          <AlertDescription>
                            Не всі проекти, що потребують ремонту, включено до плану 
                            ({calculationResults.totalProjects - calculationResults.selectedProjects} проектів залишилось). 
                            Потрібно розглянути збільшення бюджету або перегляд пріоритетів.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="border rounded-lg p-3 bg-blue-50">
                        <div className="font-medium text-blue-800 mb-2">Нормативні вимоги та методи оцінки:</div>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Мінімальний коефіцієнт зчеплення: {REQUIRED_FRICTION_COEFFICIENT}</li>
                          <li>• Максимальна інтенсивність за категоріями:</li>
                          <ul className="ml-4 space-y-0.5">
                            {Object.entries(MAX_DESIGN_INTENSITY_BY_CATEGORY).map(([category, intensity]) => (
                              <li key={category}>- {category} категорія: {intensity.toLocaleString()} авт./добу</li>
                            ))}
                          </ul>
                          {calculationResults.expertMethodUsed && (
                            <>
                              <li className="pt-2 border-t border-blue-200">• Експертна оцінка місцевих доріг:</li>
                              <ul className="ml-4 space-y-0.5">
                                <li>- J ≥ 8: роботи не потрібні</li>
                                <li>- 5 ≤ J ≤ 7: поточний ремонт</li>
                                <li>- J ≤ 4: капітальний ремонт</li>
                              </ul>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка експорту звіту */}
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => {
                        const reportContent = `
ЗВІТ ПРО ПЛАНУВАННЯ РЕМОНТНИХ РОБІТ
Дата: ${new Date().toLocaleDateString('uk-UA')}

ЗАГАЛЬНІ ПОКАЗНИКИ:
- Загальний бюджет: ${budget.toLocaleString()} тис. грн
- Використано: ${calculationResults.totalCost.toLocaleString()} тис. грн (${calculationResults.budgetUtilization.toFixed(1)}%)
- Залишок: ${calculationResults.remainingBudget.toLocaleString()} тис. грн

ПЛАН РЕМОНТНИХ РОБІТ:
${projects.map((p, i) => {
  const isExpert = p.section.significance === 'local' && 
                   calculationResults.expertMethodUsed && 
                   expertAssessments.has(p.section.id);
  const assessment = isExpert ? expertAssessments.get(p.section.id) : null;
  const assessmentText = assessment ? ` [J=${assessment.operationalStateIndex.toFixed(1)}]` : '';
  const methodText = isExpert ? ' (експертна оцінка)' : ' (технічні показники)';
  
  return `${i+1}. ${p.section.name} - ${getWorkTypeLabel(p.workType)} (${p.section.length} км) - ${p.estimatedCost.toLocaleString()} тис. грн${assessmentText}${methodText}`;
}).join('\n')}

РОЗПОДІЛ ЗА ВИДАМИ РОБІТ:
${['current_repair', 'capital_repair', 'reconstruction'].map(workType => {
  const typeProjects = projects.filter(p => p.workType === workType);
  const typeCost = typeProjects.reduce((sum, p) => sum + p.estimatedCost, 0);
  const expertCount = typeProjects.filter(p => 
    p.section.significance === 'local' && 
    calculationResults.expertMethodUsed && 
    expertAssessments.has(p.section.id)
  ).length;
  const expertText = expertCount > 0 ? ` (${expertCount} експертних оцінок)` : '';
  
  return typeProjects.length > 0 ? 
    `- ${getWorkTypeLabel(workType)}: ${typeProjects.length} проектів, ${typeCost.toLocaleString()} тис. грн${expertText}` : '';
}).filter(Boolean).join('\n')}

${calculationResults.expertMethodUsed ? `
ЕКСПЕРТНІ ОЦІНКИ:
${Array.from(expertAssessments.entries()).map(([sectionId, assessment]) => {
  const section = sections.find(s => s.id === sectionId);
  if (!section) return '';
  const workType = determineWorkTypeByExpertAssessment(assessment);
  const workTypeText = workType === 'no_work_needed' ? 'роботи не потрібні' : getWorkTypeLabel(workType);
  return `- ${section.name}: J=${assessment.operationalStateIndex.toFixed(1)} → ${workTypeText}`;
}).filter(Boolean).join('\n')}
` : ''}
                        `.trim();
                        
                        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `repair-plan-report-${new Date().toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full"
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Експортувати звіт
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  Спочатку виконайте розрахунок плану ремонтних робіт для генерації звіту.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlockFourInterface;