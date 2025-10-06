import React, { useState, useRef } from 'react';
import {
  type BudgetItem,
  initialStateRoadItems,
  initialLocalRoadItems,
  calculateQ1,
  calculateQ2
} from '../../modules/block_one';
import { calculationResultsService } from '../../service/resultLocalStorage';
// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UploadIcon, FileIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { setBlockOneBudgetData, getBudgetStatistics } from '../../modules/block_three';
// Расширенный интерфейс для BudgetItem с файлами
interface ExtendedBudgetItem extends BudgetItem {
  attachedFiles?: File[];
}

const BlockThreeIntegration: React.FC<{
  q1Results: { value: number; items: ExtendedBudgetItem[] } | null;
  q2Results: { value: number; items: ExtendedBudgetItem[] } | null;
  sessionId: string | null;
}> = ({ q1Results, q2Results, sessionId }) => {
  const [isDataSent, setIsDataSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Функция передачи данных в Блок 3
  const sendDataToBlockThree = () => {
    if (!q1Results || !q2Results || !sessionId) {
      alert("Спочатку виконайте всі розрахунки!");
      return;
    }

    // Конвертируем ExtendedBudgetItem обратно в BudgetItem
    const convertToBasicItems = (items: ExtendedBudgetItem[]): BudgetItem[] => {
      return items.map(({ attachedFiles, ...item }) => item);
    };

    try {
      // Передаем данные в модуль block_three
      setBlockOneBudgetData({
        q1Value: q1Results.value,
        q2Value: q2Results.value,
        q1Items: convertToBasicItems(q1Results.items),
        q2Items: convertToBasicItems(q2Results.items),
        sessionId: sessionId
      });

      setIsDataSent(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      console.log('Дані успішно передані в Блок 3');
    } catch (error) {
      console.error('Помилка при передачі даних в Блок 3:', error);
      alert('Помилка при передачі даних в Блок 3');
    }
  };

  // Проверяем статус данных в Блоке 3
  const budgetStats = getBudgetStatistics();

  return (
    <Card className="glass-card mt-8 w-full">
      <CardHeader className="glass-card-header">
        <CardTitle className="text-xl font-bold">
          <div>Інтеграція з Блоком 3: Планування ремонтів</div>
          <div className="text-sm font-normal">
            {budgetStats.hasData ? (
              <span className="text-green-600">🟢 Дані передані</span>
            ) : (
              <span className="text-orange-600">🟡 Очікує передачі</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {showSuccess && (
          <Alert className="glass-card mb-4">
            <AlertDescription className="text-green-600 font-medium">
              ✅ Дані успішно передані в Блок 3 для планування ремонтів!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>Дані для передачі в Блок 3:</strong>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-card p-3">
              <div className="text-lg font-bold">
                {q1Results?.value.toLocaleString() || '—'} тис. грн
              </div>
              <div className="text-xs opacity-70">Q₁ (Державні дороги)</div>
            </div>
            
            <div className="glass-card p-3">
              <div className="text-lg font-bold">
                {q2Results?.value.toLocaleString() || '—'} тис. грн
              </div>
              <div className="text-xs opacity-70">Q₂ (Місцеві дороги)</div>
            </div>
            
            <div className="glass-card p-3" style={{ background: 'rgba(var(--c-action), 0.08)' }}>
              <div className="text-lg font-bold" style={{ color: 'rgb(var(--c-action))' }}>
                {(q1Results && q2Results) ? 
                  (q1Results.value + q2Results.value).toLocaleString() : '—'} тис. грн
              </div>
            <div className="text-xs opacity-70">Загальний бюджет</div>
          </div>
        </div>

          {budgetStats.hasData && (
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm text-green-700">
                <strong>Статус в Блоці 3:</strong>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                <div>
                  <div>Загальний бюджет: <strong>{budgetStats.totalBudget.toLocaleString()}</strong> тис. грн</div>
                  <div>Державні дороги: <strong>{budgetStats.q1Budget.toLocaleString()}</strong> тис. грн</div>
                  <div>Місцеві дороги: <strong>{budgetStats.q2Budget.toLocaleString()}</strong> тис. грн</div>
                </div>
                {budgetStats.allocation && (
                  <div>
                    <div>Поточний ремонт: <strong>{budgetStats.allocation.currentRepair.toLocaleString()}</strong> тис. грн</div>
                    <div>Капітальний ремонт: <strong>{budgetStats.allocation.capitalRepair.toLocaleString()}</strong> тис. грн</div>
                    <div>Реконструкція: <strong>{budgetStats.allocation.reconstruction.toLocaleString()}</strong> тис. грн</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Сесія: {sessionId} | 
            Стан: {isDataSent ? 'Передано' : 'Готово до передачі'}
          </div>
          
          <Button 
            onClick={sendDataToBlockThree}
            disabled={!q1Results || !q2Results || !sessionId}
            className={`glass-button glass-button--xl w-full ${
              isDataSent 
                ? 'glass-button--success' 
                : 'glass-button--primary'
            }`}
          >
            {isDataSent ? (
              <>✅ Дані передані - Перерахувати і передати знову</>
            ) : (
              <>📤 Передати дані в Блок 3 для планування ремонтів</>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            💡 Після передачі даних ви зможете використовувати їх для планування ремонтних робіт у Блоці 3
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Модифицированные данные с переносом на новую строку
const modifyItemsWithLineBreak = (items: BudgetItem[]): ExtendedBudgetItem[] => {
  return items.map(item => {
    // Делим название на части, учитывая специфические места разделения
    let modifiedName = item.name;

    if (item.id === "Qдз") {
      modifiedName = "Обсяг бюджетних коштів на фінансове забезпечення нового будівництва, реконструкції,\nкапітального та поточного ремонтів і утримання автомобільних доріг державного значення";
    } 
    else if (item.id === "Qпп") {
      modifiedName = "Обсяг бюджетних коштів на заходи з розвитку, будівництва, ремонту,\nоблаштування, модернізації та утримання пунктів пропуску через державний кордон";
    } 
    else if (item.id === "Qміжн") {
      modifiedName = "Обсяг бюджетних коштів на проведення конкурсів і підготовку договорів щодо дорожніх робіт\nза рахунок коштів міжнародних організацій, співфінансування та контроль виконання";
    }
    else if (item.id === "QІАС") {
      modifiedName = "Обсяг бюджетних коштів на створення та функціонування інформаційно-аналітичної\nсистеми дорожнього господарства, включаючи утримання відповідних установ";
    }
    else if (item.id === "QДПП") {
      modifiedName = "Обсяг бюджетних коштів на виплати приватному партнеру/концесіонеру за експлуатаційну\nготовність доріг державного значення та інші виплати за договорами ДПП";
    }

    return {
      ...item,
      name: modifiedName,
      attachedFiles: []
    };
  });
};

// Компонент для загрузки файлов
const FileUploadComponent = ({ 
  itemId, 
  files = [], 
  onFilesChange 
}: { 
  itemId: string; 
  files: File[]; 
  onFilesChange: (itemId: string, files: File[]) => void; 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    const selectedFiles = Array.from(e.target.files || []);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Файл ${file.name} перевищує максимальний розмір 10MB`);
        return false;
      }
      return true;
    });
    
    const updatedFiles = [...files, ...validFiles];
    onFilesChange(itemId, updatedFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(itemId, updatedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* Кнопка загрузки */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
          className="hidden"
          id={`file-upload-${itemId}`}
        />
        <label
          htmlFor={`file-upload-${itemId}`}
          className="cursor-pointer inline-flex items-center px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          <UploadIcon className="h-3 w-3 mr-1" />
          Додати файл
        </label>
        {files.length > 0 && (
          <span className="text-xs text-gray-500">
            {files.length} файл{files.length > 1 ? 'ів' : ''}
          </span>
        )}
      </div>

      {/* Список загруженных файлов */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileIcon className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <div className="truncate flex-1">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-gray-500">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <Button
                onClick={() => removeFile(index)}
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-red-500 hover:text-red-700"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент для блока 1: Расчет объема финансирования дорог государственного значения
const StateRoadFundingBlock = ({ 
  onResultsChange 
}: { 
  onResultsChange?: (q1: number, items: ExtendedBudgetItem[]) => void 
}) => {
  const [stateRoadBudget, setStateRoadBudget] = useState<ExtendedBudgetItem[]>(
    modifyItemsWithLineBreak(initialStateRoadItems)
  );
  const [q1Result, setQ1Result] = useState<number | null>(null);

  // Обработчик изменения значений полей ввода
  const handleInputChange = (id: string, value: string) => {
    const newValue = value === "" ? null : parseFloat(value);
    setStateRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, value: newValue } : item
      )
    );
  };

  // Обработчик изменения нормативного документа
  const handleDocumentChange = (id: string, document: string) => {
    setStateRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, normativeDocument: document } : item
      )
    );
  };

  // Обработчик изменения файлов
  const handleFilesChange = (id: string, files: File[]) => {
    setStateRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, attachedFiles: files } : item
      )
    );
  };

  // Функция расчета
  const handleCalculate = () => {
    const originalStateRoadItems = initialStateRoadItems.map((original, index) => {
      return {
        ...original,
        value: stateRoadBudget[index].value,
        normativeDocument: stateRoadBudget[index].normativeDocument
      };
    });

    // Проверка всех обязательных полей
    const missingFields = originalStateRoadItems
      .filter(item => item.value === null || item.value === undefined)
      .map(item => item.id);
    
    if (missingFields.length > 0) {
      alert(`Необхідно заповнити наступні поля: ${missingFields.join(', ')}`);
      return;
    }

    const result = calculateQ1(originalStateRoadItems);
    setQ1Result(result);
    
    if (onResultsChange) {
      onResultsChange(result as number, stateRoadBudget);
    }
  };

  return (
    <Card className="glass-card mb-6 w-full">
      <CardHeader className="glass-card-header p-6">
        <CardTitle className="text-xl font-bold text-gray-800">
          Визначення обсягу бюджетного фінансування розвитку та утримання автомобільних доріг державного значення        
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="glass-base" style={{ background: 'rgba(var(--c-glass), 0.03)' }}>
                <TableHead className="font-semibold"></TableHead>
                <TableHead className="font-semibold">Показник</TableHead>
                <TableHead className="font-semibold">Обсяг, тис.грн.</TableHead>
                <TableHead className="font-semibold">Нормативний документ / Файли</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stateRoadBudget.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-start">
                            <div style={{ whiteSpace: 'pre-line' }}>{item.name}</div>
                            <InfoCircledIcon className="ml-2 h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md bg-black text-white">
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center font-medium py-3">{item.id}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.value === null ? "" : item.value.toString()}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      placeholder="0"
                      className="glass-input"
                    />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Input 
                      value={item.normativeDocument || ""}
                      onChange={(e) => handleDocumentChange(item.id, e.target.value)}
                      placeholder="Назва документа"
                      className="glass-input"
                    />
                    <FileUploadComponent
                      itemId={item.id}
                      files={item.attachedFiles || []}
                      onFilesChange={handleFilesChange}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="glass-button glass-button--primary glass-button--large mt-2 w-36 text-white"
        >
          Розрахувати
        </Button>

        {q1Result !== null && (
          <div className="glass-card mt-4 p-6 w-full" style={{ background: 'rgba(var(--c-success), 0.08)' }}>
            <div className="font-bold text-xl text-center">РЕЗУЛЬТАТ!</div>
            <div className="text-lg mt-2 text-center">
              Результат для державних доріг: {q1Result.toLocaleString()} тис. грн
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент для блока 2: Расчет объема финансирования дорог местного значения
const LocalRoadFundingBlock = ({ 
  onResultsChange 
}: { 
  onResultsChange?: (q2: number, items: ExtendedBudgetItem[]) => void 
}) => {
  const [localRoadBudget, setLocalRoadBudget] = useState<ExtendedBudgetItem[]>(
    modifyItemsWithLineBreak(initialLocalRoadItems)
  );
  const [q2Result, setQ2Result] = useState<number | null>(null);

  const handleInputChange = (id: string, value: string) => {
    const newValue = value === "" ? null : parseFloat(value);
    setLocalRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, value: newValue } : item
      )
    );
  };

  const handleDocumentChange = (id: string, document: string) => {
    setLocalRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, normativeDocument: document } : item
      )
    );
  };

  const handleFilesChange = (id: string, files: File[]) => {
    setLocalRoadBudget(prev => 
      prev.map(item => 
        item.id === id ? { ...item, attachedFiles: files } : item
      )
    );
  };

  const handleCalculate = () => {
    // Передаем исходные данные без переноса строк для расчета
    const originalLocalRoadItems = initialLocalRoadItems.map((original, index) => {
      return {
        ...original,
        value: localRoadBudget[index].value,
        normativeDocument: localRoadBudget[index].normativeDocument
      };
    });

    const qmzValue = originalLocalRoadItems.find(item => item.id === "Qмз")?.value;
    
    if (qmzValue === null || qmzValue === undefined) {
      alert("Необхідно заповнити значення Qмз!");
      return;
    }

    const result = calculateQ2(originalLocalRoadItems);
    setQ2Result(result);
    
    // Уведомляем родительский компонент о результатах
    if (onResultsChange) {
      onResultsChange(result as number, localRoadBudget);
    }
  };

  return (
    <Card className="glass-card mb-6 w-full">
      <CardHeader className="glass-card-header p-6">
        <CardTitle className="text-xl font-bold text-gray-900">
          Визначення обсягу бюджетного фінансування розвитку та утримання автомобільних доріг місцевого значення       
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5 bg-white"></TableHead>
                <TableHead className="w-16 text-center bg-white">Показник</TableHead>
                <TableHead className="w-32 bg-white">Обсяг, тис.грн.</TableHead>
                <TableHead className="w-1/4 bg-white">Нормативний документ / Файли</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localRoadBudget.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-start">
                            <div style={{ whiteSpace: 'pre-line' }}>{item.name}</div>
                            <InfoCircledIcon className="ml-2 h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md bg-black text-white">
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center font-medium py-3">{item.id}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.value === null ? "" : item.value.toString()}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      placeholder="0"
                      className="glass-input"
                    />
                  </TableCell>
                  <TableCell className="space-y-2">
                    <Input 
                      value={item.normativeDocument || ""}
                      onChange={(e) => handleDocumentChange(item.id, e.target.value)}
                      placeholder="Назва документа"
                      className="glass-input"
                    />
                    <FileUploadComponent
                      itemId={item.id}
                      files={item.attachedFiles || []}
                      onFilesChange={handleFilesChange}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="glass-button glass-button--primary glass-button--large mt-2 w-36 text-white"
        >
          Розрахувати
        </Button>

        {q2Result !== null && (
          <div className="glass-card mt-4 p-6 w-full" style={{ background: 'rgba(var(--c-success), 0.08)' }}>
            <div className="font-bold text-xl text-center">РЕЗУЛЬТАТ!</div>
            <div className="text-lg mt-2 text-center">
              Результат для місцевих доріг: {q2Result.toLocaleString()} тис. грн
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Главный компонент приложения
const RoadFundingApp: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [q1Results, setQ1Results] = useState<{ value: number; items: ExtendedBudgetItem[] } | null>(null);
  const [q2Results, setQ2Results] = useState<{ value: number; items: ExtendedBudgetItem[] } | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Создаем сессию при первом рендере
  React.useEffect(() => {
    const newSessionId = calculationResultsService.createSession();
    setSessionId(newSessionId);
  }, []);

  const handleQ1Results = (q1: number, items: ExtendedBudgetItem[]) => {
    setQ1Results({ value: q1, items });
  };

  const handleQ2Results = (q2: number, items: ExtendedBudgetItem[]) => {
    setQ2Results({ value: q2, items });
  };

  // Сохранение результатов в сервис
  const saveResults = () => {
    if (!q1Results || !q2Results) {
      alert("Спочатку виконайте розрахунки Q₁ та Q₂!");
      return;
    }

    // Конвертируем ExtendedBudgetItem обратно в BudgetItem для сервиса
    const convertToBasicItems = (items: ExtendedBudgetItem[]): BudgetItem[] => {
      return items.map(({ attachedFiles, ...item }) => item);
    };

    const success = calculationResultsService.saveBlockOneResults(
      convertToBasicItems(q1Results.items),
      q1Results.value,
      convertToBasicItems(q2Results.items),
      q2Results.value
    );

    if (success) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen p-6 w-full" style={{ background: 'rgb(var(--c-bg))' }}>
      <div className="w-full mx-auto">
        <Card className="glass-card mb-8 w-full">
          <CardHeader className="glass-card-header">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Визначення загального обсягу бюджетного фінансування розвитку та утримання автомобільних доріг державного та місцевого значення            
            </CardTitle>
            {sessionId && (
              <div className="text-sm opacity-60 mt-2">
                Сесія розрахунків: {sessionId}
              </div>
            )}
          </CardHeader>
        </Card>

        {showSaveSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-700">
              ✅ Результати Блоку 1 успішно збережені в сесії розрахунків!
            </AlertDescription>
          </Alert>
        )}

        {/* Блок 1.1: Дороги государственного значения */}
        <StateRoadFundingBlock onResultsChange={handleQ1Results} />

        {/* Блок 1.2: Дороги местного значения */}
        <LocalRoadFundingBlock onResultsChange={handleQ2Results} />

        {/* Сводка и сохранение результатов */}
        {q1Results && q2Results && (
          <Card className="mt-8 w-full border-green-500 shadow-sm rounded-none">
            <CardHeader className="bg-green-50 border-b border-green-500">
              <CardTitle className="text-xl font-bold text-green-800">
                Сводка результатів
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">
                    {q1Results.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">(тис. грн)</div>
                  <div className="text-xs text-gray-500">Державні дороги</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">
                    {q2Results.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">(тис. грн)</div>
                  <div className="text-xs text-gray-500">Місцеві дороги</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">
                    {(q1Results.value + q2Results.value).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Загальний бюджет (тис. грн)</div>
                </div>
              </div>
              
              <BlockThreeIntegration 
                q1Results={q1Results}
                q2Results={q2Results}
                sessionId={sessionId}
              />

              <Button 
                onClick={saveResults}
                className="glass-button glass-button--success glass-button--xl w-full mt-6 text-blue-600 text-blue"
              >
                💾 Зберегти результати в сесію розрахунків
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoadFundingApp;