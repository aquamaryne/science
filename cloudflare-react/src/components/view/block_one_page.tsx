import React, { useState, useRef, useEffect } from 'react';
import {
  type BudgetItem,
  initialStateRoadItems,
  initialLocalRoadItems,
  calculateQ1,
  calculateQ2
} from '../../modules/block_one';
import { calculationResultsService } from '../../service/resultLocalStorage';
import { useHistory, useCurrentSession } from '../../redux/hooks';
import { saveBlockOneData } from '../../redux/slices/historySlice';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { 
  setStateRoadBudget,
  setLocalRoadBudget,
  setQ1Result,
  setQ2Result,
  updateStateRoadItem,
  updateLocalRoadItem
} from '../../redux/slices/blockOneSlice';
// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { UploadIcon, FileIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PDFReportBlockOne from "@/components/PDFReportBlockOne";

// Расширенный интерфейс для BudgetItem с файлами
interface ExtendedBudgetItem extends BudgetItem {
  attachedFiles?: File[];
}


// Модифицированные данные с переносом на новую строку
const modifyItemsWithLineBreak = (items: BudgetItem[]): ExtendedBudgetItem[] => {
  return items.map(item => {
    // Делим название на части, учитывая специфические места разделения
    let modifiedName = item.name;

    if (item.id === "Q2") {
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
  const appDispatch = useAppDispatch();
  const blockOneState = useAppSelector(state => state.blockOne);
  
  const [stateRoadBudget, setStateRoadBudget] = useState<ExtendedBudgetItem[]>(
    blockOneState.stateRoadBudget.length > 0 
      ? modifyItemsWithLineBreak(blockOneState.stateRoadBudget as BudgetItem[])
      : modifyItemsWithLineBreak(initialStateRoadItems)
  );
  const [q1Result, setQ1Result] = useState<number | null>(blockOneState.q1Result);

  // Синхронизируем с Redux при загрузке
  useEffect(() => {
    if (blockOneState.stateRoadBudget.length > 0) {
      setStateRoadBudget(modifyItemsWithLineBreak(blockOneState.stateRoadBudget as BudgetItem[]));
    }
    if (blockOneState.q1Result !== null) {
      setQ1Result(blockOneState.q1Result);
    }
  }, [blockOneState.stateRoadBudget, blockOneState.q1Result]);


  // Обработчик изменения значений полей ввода
  const handleInputChange = (id: string, value: string) => {
    const newValue = value === "" ? null : parseFloat(value);
    const updatedItems = stateRoadBudget.map(item => 
      item.id === id ? { ...item, value: newValue } : item
    );
    setStateRoadBudget(updatedItems);
    
    // Сохраняем в Redux
    appDispatch(updateStateRoadItem({ id, value: newValue }));
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
  const appDispatch = useAppDispatch();
  const blockOneState = useAppSelector(state => state.blockOne);
  
  const [localRoadBudget, setLocalRoadBudget] = useState<ExtendedBudgetItem[]>(
    blockOneState.localRoadBudget.length > 0 
      ? modifyItemsWithLineBreak(blockOneState.localRoadBudget as BudgetItem[])
      : modifyItemsWithLineBreak(initialLocalRoadItems)
  );
  const [q2Result, setQ2Result] = useState<number | null>(blockOneState.q2Result);

  // Синхронизируем с Redux при загрузке
  useEffect(() => {
    if (blockOneState.localRoadBudget.length > 0) {
      setLocalRoadBudget(modifyItemsWithLineBreak(blockOneState.localRoadBudget as BudgetItem[]));
    }
    if (blockOneState.q2Result !== null) {
      setQ2Result(blockOneState.q2Result);
    }
  }, [blockOneState.localRoadBudget, blockOneState.q2Result]);

  const handleInputChange = (id: string, value: string) => {
    const newValue = value === "" ? null : parseFloat(value);
    const updatedItems = localRoadBudget.map(item => 
      item.id === id ? { ...item, value: newValue } : item
    );
    setLocalRoadBudget(updatedItems);
    
    // Сохраняем в Redux
    appDispatch(updateLocalRoadItem({ id, value: newValue }));
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

    const qmzValue = originalLocalRoadItems.find(item => item.id === "Q2")?.value;
    
    if (qmzValue === null || qmzValue === undefined) {
      alert("Необхідно заповнити значення Q2!");
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
              <TableRow className="glass-base" style={{ background: 'rgba(var(--c-glass), 0.03)' }}>
                <TableHead className="font-semibold"></TableHead>
                <TableHead className="font-semibold">Показник</TableHead>
                <TableHead className="font-semibold">Обсяг, тис.грн.</TableHead>
                <TableHead className="font-semibold">Нормативний документ / Файли</TableHead>
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
  const appDispatch = useAppDispatch();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [q1Results, setQ1Results] = useState<{ value: number; items: ExtendedBudgetItem[] } | null>(null);
  const [q2Results, setQ2Results] = useState<{ value: number; items: ExtendedBudgetItem[] } | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Redux hooks
  const { createSession, dispatch } = useHistory();
  const { currentSession } = useCurrentSession();
  const blockOneState = useAppSelector(state => state.blockOne);

  // Инициализируем данные в Redux при первой загрузке
  useEffect(() => {
    if (blockOneState.stateRoadBudget.length === 0) {
      appDispatch(setStateRoadBudget(initialStateRoadItems.map(item => ({
        ...item,
        attachedFiles: []
      }))));
    }
    if (blockOneState.localRoadBudget.length === 0) {
      appDispatch(setLocalRoadBudget(initialLocalRoadItems.map(item => ({
        ...item,
        attachedFiles: []
      }))));
    }
  }, [appDispatch, blockOneState.stateRoadBudget.length, blockOneState.localRoadBudget.length]);

  // Инициализируем старый сервис при первом рендере
  React.useEffect(() => {
    const newSessionId = calculationResultsService.createSession();
    setSessionId(newSessionId);
  }, []);

  const handleQ1Results = (q1: number, items: ExtendedBudgetItem[]) => {
    setQ1Results({ value: q1, items });
    // Сохраняем в Redux
    appDispatch(setQ1Result(q1));
    appDispatch(setStateRoadBudget(items.map(({ attachedFiles, ...item }) => ({
      ...item,
      attachedFiles: attachedFiles?.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
    }))));
  };

  const handleQ2Results = (q2: number, items: ExtendedBudgetItem[]) => {
    setQ2Results({ value: q2, items });
    // Сохраняем в Redux
    appDispatch(setQ2Result(q2));
    appDispatch(setLocalRoadBudget(items.map(({ attachedFiles, ...item }) => ({
      ...item,
      attachedFiles: attachedFiles?.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
    }))));
  };

  // Сохранение результатов в сервис
  const saveResults = async () => {
    if (!q1Results || !q2Results) {
      alert("Спочатку виконайте розрахунки Q₁ та Q₂!");
      return;
    }

    // Создаем сессию, если её нет
    let sessionId = currentSession?.id;
    if (!sessionId) {
      try {
        await createSession(
          `Розрахунок бюджетного фінансування - ${new Date().toLocaleString('uk-UA')}`,
          'Сесія розрахунків визначення обсягу бюджетного фінансування'
        );
        // После создания сессии, получаем её ID из currentSession
        sessionId = currentSession?.id;
      } catch (error) {
        console.error('Помилка створення сесії:', error);
        alert("Помилка створення сесії");
        return;
      }
    }

    if (!sessionId) {
      alert("Немає активної сесії для збереження");
      return;
    }

    // Конвертируем ExtendedBudgetItem обратно в BudgetItem для сервиса
    const convertToBasicItems = (items: ExtendedBudgetItem[]): BudgetItem[] => {
      return items.map(({ attachedFiles, ...item }) => ({
        ...item,
        attachedFiles: attachedFiles?.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }))
      }));
    };

    try {
      console.log('🟢 Бюджетне фінансування: Начинаем сохранение...', {
        sessionId: sessionId,
        q1Result: q1Results.value,
        q2Result: q2Results.value
      });

      // Сохраняем в старый сервис
      const success = calculationResultsService.saveBlockOneResults(
        convertToBasicItems(q1Results.items),
        q1Results.value,
        convertToBasicItems(q2Results.items),
        q2Results.value
      );

      if (success) {
        // Сохраняем в Redux
        const result = await dispatch(saveBlockOneData({
          sessionId: sessionId!,
          stateRoadBudget: convertToBasicItems(q1Results.items),
          localRoadBudget: convertToBasicItems(q2Results.items),
          q1Result: q1Results.value,
          q2Result: q2Results.value
        }));

        if (result.type.endsWith('/fulfilled')) {
          setShowSaveSuccess(true);
          setTimeout(() => setShowSaveSuccess(false), 3000);
          console.log('✅ Результати розрахунку бюджетного фінансування збережено в Redux історію');
        } else {
          console.error('❌ Помилка збереження в Redux:', result);
          alert('Помилка збереження в історію');
        }
      }
    } catch (error) {
      console.error('🔴 Ошибка при сохранении результатов:', error);
      alert('Помилка при збереженні результатів');
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
              ✅ Результати бюджетного фінансування успішно збережені в сесії розрахунків!
            </AlertDescription>
          </Alert>
        )}

        {/* Дороги государственного значения */}
        <StateRoadFundingBlock onResultsChange={handleQ1Results} />

        {/* Дороги местного значения */}
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
              

              <Button 
                onClick={saveResults}
                className="glass-button glass-button--success glass-button--xl w-full mt-6 text-white"
              >
                💾 Зберегти результати в сесію розрахунків
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PDF Звіт */}
        <div className="mt-8">
          <PDFReportBlockOne />
        </div>
      </div>
    </div>
  );
};

export default RoadFundingApp;