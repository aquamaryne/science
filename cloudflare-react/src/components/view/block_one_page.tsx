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
import { UploadIcon, FileIcon, XIcon, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [validationError, setValidationError] = useState<string>('');

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
    setValidationError('');
    
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
      setValidationError(`Необхідно заповнити наступні поля: ${missingFields.join(', ')}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Помилка валідації</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
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
          <Alert className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-500">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 text-lg font-bold">РЕЗУЛЬТАТ!</AlertTitle>
            <AlertDescription>
              <div className="text-green-800 text-lg font-semibold mt-1">
                Q₁ (Державні дороги): {q1Result.toLocaleString()} тис. грн
              </div>
              <div className="text-green-700 text-sm mt-2">
                💡 Розрахунок успішно виконано! Тепер можете перейти до розрахунків для місцевих доріг.
              </div>
            </AlertDescription>
          </Alert>
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
  const [validationError, setValidationError] = useState<string>('');

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
    setValidationError('');
    
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
      setValidationError("Необхідно заповнити значення Q2!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Помилка валідації</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
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
          <Alert className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 text-lg font-bold">РЕЗУЛЬТАТ!</AlertTitle>
            <AlertDescription>
              <div className="text-blue-800 text-lg font-semibold mt-1">
                Q₂ (Місцеві дороги): {q2Result.toLocaleString()} тис. грн
              </div>
              <div className="text-blue-700 text-sm mt-2">
                💡 Розрахунок успішно виконано! Дані доступні для використання в інших розділах.
              </div>
            </AlertDescription>
          </Alert>
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
  const [saveError, setSaveError] = useState<string>('');
  const [generalWarning, setGeneralWarning] = useState<string>('');

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
    setSaveError('');
    setShowSaveSuccess(false);
    
    if (!q1Results || !q2Results) {
      setGeneralWarning("Спочатку виконайте розрахунки Q₁ та Q₂!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setSaveError("Помилка створення сесії. Спробуйте ще раз.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (!sessionId) {
      setSaveError("Немає активної сесії для збереження. Спробуйте перезавантажити сторінку.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          setSaveError('Помилка збереження в історію. Перевірте підключення.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (error) {
      console.error('🔴 Ошибка при сохранении результатов:', error);
      setSaveError('Помилка при збереженні результатів. Спробуйте ще раз.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-5 lg:p-6 w-full" style={{ background: 'rgb(var(--c-bg))' }}>
      <div className="w-full mx-auto">
        <Card className="glass-card mb-4 md:mb-6 w-full shadow-lg">
          <CardHeader className="glass-card-header bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 p-4 md:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Визначення загального обсягу бюджетного фінансування розвитку та утримання автомобільних доріг державного та місцевого значення            
            </CardTitle>
            {sessionId && (
              <div className="text-xs sm:text-sm text-blue-700 mt-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="break-all">Сесія розрахунків: <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs">{sessionId}</span></span>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Предупреждения и сообщения */}
        {generalWarning && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-500">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Увага</AlertTitle>
            <AlertDescription className="text-yellow-700">
              {generalWarning}
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Помилка збереження</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {showSaveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Успішно!</AlertTitle>
            <AlertDescription className="text-green-700">
              ✅ Результати бюджетного фінансування успішно збережені в сесії розрахунків!
            </AlertDescription>
          </Alert>
        )}

        {/* Дороги государственного значения */}
        <StateRoadFundingBlock onResultsChange={handleQ1Results} />

        {/* Дороги местного значения */}
        <LocalRoadFundingBlock onResultsChange={handleQ2Results} />

        {/* Інформаційна підказка */}
        {!q1Results && !q2Results && (
          <Alert className="mb-6 bg-blue-50 border-blue-300">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Інструкція</AlertTitle>
            <AlertDescription className="text-blue-800">
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Заповніть всі поля для <strong>державних доріг</strong> і натисніть "Розрахувати"</li>
                <li>Заповніть всі поля для <strong>місцевих доріг</strong> і натисніть "Розрахувати"</li>
                <li>Після отримання обох результатів з'явиться кнопка <strong>"Зберегти результати"</strong></li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Сводка и сохранение результатов */}
        {q1Results && q2Results && (
          <Card className="mt-6 md:mt-8 w-full border-green-500 shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-500 p-4 md:p-6">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-green-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                Сводка результатів
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="text-center bg-gradient-to-br from-green-100 to-green-50 p-4 md:p-6 rounded-lg border-2 border-green-300">
                  <div className="text-xs sm:text-sm font-semibold text-green-900 mb-2">Q₁ - Державні дороги</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                    {q1Results.value.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-green-600 mt-1">тис. грн</div>
                </div>
                <div className="text-center bg-gradient-to-br from-blue-100 to-blue-50 p-4 md:p-6 rounded-lg border-2 border-blue-300">
                  <div className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Q₂ - Місцеві дороги</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">
                    {q2Results.value.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 mt-1">тис. грн</div>
                </div>
                <div className="text-center bg-gradient-to-br from-purple-100 to-purple-50 p-4 md:p-6 rounded-lg border-2 border-purple-400 sm:col-span-2 lg:col-span-1">
                  <div className="text-xs sm:text-sm font-semibold text-purple-900 mb-2">Q - Загальний бюджет</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-700">
                    {(q1Results.value + q2Results.value).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600 mt-1">тис. грн</div>
                </div>
              </div>
              
              <Alert className="mb-4 bg-purple-50 border-purple-300">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>📊 Розрахунки завершені!</strong> Збережіть результати для використання в наступних розділах (Експлуатаційне утримання, Планування ремонтів).
                </AlertDescription>
              </Alert>

              <Button 
                onClick={saveResults}
                className="w-full h-12 sm:h-14 text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                💾 Зберегти результати в сесію розрахунків
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PDF Звіт */}
        <div className="mt-6 md:mt-8">
          <PDFReportBlockOne />
        </div>
      </div>
    </div>
  );
};

export default RoadFundingApp;