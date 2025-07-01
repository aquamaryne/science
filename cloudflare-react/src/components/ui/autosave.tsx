// // src/components/ui/autosave-notification.tsx
// import React, { useState, useEffect } from 'react';
// import { Alert, AlertDescription } from "./alert";
// import { Button } from "./button";
// import { Badge } from "./badge";
// import { 
//   SaveIcon, 
//   ClockIcon, 
//   TrashIcon, 
//   DownloadIcon,
//   RefreshCwIcon,
//   CheckCircleIcon,
//   XIcon
// } from "lucide-react";
// import { autosaveService } from '../../services/autosaveService';

// interface AutosaveNotificationProps {
//   onRestoreData?: () => void;
//   blockType?: 'blockOne' | 'blockTwo' | 'blockThree';
//   className?: string;
// }

// export const AutosaveNotification: React.FC<AutosaveNotificationProps> = ({
//   onRestoreData,
//   blockType,
//   className = ""
// }) => {
//   const [saveInfo, setSaveInfo] = useState(autosaveService.getLastSaveInfo());
//   const [showDetails, setShowDetails] = useState(false);
//   const [storageSize, setStorageSize] = useState(autosaveService.getStorageSize());

//   // Обновляем информацию о сохранении каждые 30 секунд
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setSaveInfo(autosaveService.getLastSaveInfo());
//       setStorageSize(autosaveService.getStorageSize());
//     }, 30000);

//     return () => clearInterval(interval);
//   }, []);

//   // Функция для форматирования времени
//   const formatTime = (date: Date): string => {
//     const now = new Date();
//     const diffMs = now.getTime() - date.getTime();
//     const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
//     if (diffMinutes < 1) return 'только что';
//     if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
    
//     const diffHours = Math.floor(diffMinutes / 60);
//     if (diffHours < 24) return `${diffHours} ч. назад`;
    
//     return date.toLocaleDateString('uk-UA', { 
//       day: '2-digit', 
//       month: '2-digit', 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     });
//   };

//   // Восстановление данных
//   const handleRestoreData = () => {
//     if (onRestoreData) {
//       onRestoreData();
//     }
    
//     // Обновляем информацию после восстановления
//     setTimeout(() => {
//       setSaveInfo(autosaveService.getLastSaveInfo());
//     }, 100);
//   };

//   // Очистка данных
//   const handleClearData = () => {
//     if (blockType) {
//       autosaveService.clearBlockData(blockType);
//     } else {
//       autosaveService.clearAutosaveData();
//     }
//     setSaveInfo(autosaveService.getLastSaveInfo());
//     setStorageSize(autosaveService.getStorageSize());
//   };

//   // Экспорт данных
//   const handleExportData = () => {
//     const data = autosaveService.exportAutosaveData();
//     if (data) {
//       const blob = new Blob([data], { type: 'application/json' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `autosave_backup_${new Date().toISOString().split('T')[0]}.json`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     }
//   };

//   // Если нет сохраненных данных, не показываем уведомление
//   if (!saveInfo.hasData) {
//     return null;
//   }

//   // Определяем актуальность данных для конкретного блока
//   const blockLastSaved = blockType ? saveInfo.blocks[blockType] : null;
//   const hasBlockData = !!blockLastSaved;

//   return (
//     <div className={`space-y-2 ${className}`}>
//       {/* Основное уведомление */}
//       <Alert className="border-blue-200 bg-blue-50">
//         <SaveIcon className="h-4 w-4 text-blue-600" />
//         <AlertDescription>
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className="text-blue-800 font-medium">
//                 {blockType && hasBlockData 
//                   ? `Знайдено збережені дані для цього блоку`
//                   : `Знайдено автозбережені дані`
//                 }
//               </span>
//               {blockLastSaved && (
//                 <Badge variant="secondary" className="text-xs">
//                   <ClockIcon className="h-3 w-3 mr-1" />
//                   {formatTime(blockLastSaved)}
//                 </Badge>
//               )}
//             </div>
            
//             <div className="flex items-center gap-2">
//               {(blockType && hasBlockData) || (!blockType && saveInfo.hasData) ? (
//                 <Button
//                   onClick={handleRestoreData}
//                   size="sm"
//                   className="bg-blue-600 hover:bg-blue-700 text-white"
//                 >
//                   <RefreshCwIcon className="h-3 w-3 mr-1" />
//                   Відновити
//                 </Button>
//               ) : null}
              
//               <Button
//                 onClick={() => setShowDetails(!showDetails)}
//                 variant="outline"
//                 size="sm"
//               >
//                 {showDetails ? 'Згорнути' : 'Детальніше'}
//               </Button>
//             </div>
//           </div>
//         </AlertDescription>
//       </Alert>

//       {/* Детальная информация */}
//       {showDetails && (
//         <Alert className="border-gray-200 bg-gray-50">
//           <CheckCircleIcon className="h-4 w-4 text-gray-600" />
//           <AlertDescription>
//             <div className="space-y-3">
//               <div>
//                 <h4 className="font-medium text-gray-800 mb-2">Стан автозбереження:</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                   <div className="space-y-1">
//                     <div className="font-medium">Блок 1:</div>
//                     {saveInfo.blocks.blockOne ? (
//                       <Badge variant="default" className="text-xs">
//                         <CheckCircleIcon className="h-3 w-3 mr-1" />
//                         {formatTime(saveInfo.blocks.blockOne)}
//                       </Badge>
//                     ) : (
//                       <Badge variant="outline" className="text-xs text-gray-500">
//                         Немає даних
//                       </Badge>
//                     )}
//                   </div>
                  
//                   <div className="space-y-1">
//                     <div className="font-medium">Блок 2:</div>
//                     {saveInfo.blocks.blockTwo ? (
//                       <Badge variant="default" className="text-xs">
//                         <CheckCircleIcon className="h-3 w-3 mr-1" />
//                         {formatTime(saveInfo.blocks.blockTwo)}
//                       </Badge>
//                     ) : (
//                       <Badge variant="outline" className="text-xs text-gray-500">
//                         Немає даних
//                       </Badge>
//                     )}
//                   </div>
                  
//                   <div className="space-y-1">
//                     <div className="font-medium">Блок 3:</div>
//                     {saveInfo.blocks.blockThree ? (
//                       <Badge variant="default" className="text-xs">
//                         <CheckCircleIcon className="h-3 w-3 mr-1" />
//                         {formatTime(saveInfo.blocks.blockThree)}
//                       </Badge>
//                     ) : (
//                       <Badge variant="outline" className="text-xs text-gray-500">
//                         Немає даних
//                       </Badge>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between pt-2 border-t border-gray-200">
//                 <div className="text-xs text-gray-500">
//                   Розмір збережених даних: {storageSize.readable}
//                 </div>
                
//                 <div className="flex items-center gap-2">
//                   <Button
//                     onClick={handleExportData}
//                     variant="outline"
//                     size="sm"
//                     className="text-xs"
//                   >
//                     <DownloadIcon className="h-3 w-3 mr-1" />
//                     Експорт
//                   </Button>
                  
//                   <Button
//                     onClick={handleClearData}
//                     variant="outline"
//                     size="sm"
//                     className="text-xs text-red-600 hover:text-red-700"
//                   >
//                     <TrashIcon className="h-3 w-3 mr-1" />
//                     {blockType ? 'Очистити блок' : 'Очистити все'}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </AlertDescription>
//         </Alert>
//       )}
//     </div>
//   );
// };

// // Компонент индикатора автосохранения
// export const AutosaveIndicator: React.FC<{ 
//   isActive?: boolean; 
//   lastSaved?: Date;
//   className?: string;
// }> = ({ isActive = false, lastSaved, className = "" }) => {
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     if (isActive) {
//       setVisible(true);
//       const timer = setTimeout(() => setVisible(false), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [isActive]);

//   if (!visible && !lastSaved) return null;

//   return (
//     <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
//       {isActive && (
//         <>
//           <RefreshCwIcon className="h-3 w-3 animate-spin" />
//           <span>Збереження...</span>
//         </>
//       )}
//       {!isActive && lastSaved && (
//         <>
//           <CheckCircleIcon className="h-3 w-3 text-green-500" />
//           <span>Збережено {formatTime(lastSaved)}</span>
//         </>
//       )}
//     </div>
//   );
// };

// // Хук для использования автосохранения
// export const useAutosave = (blockType: 'blockOne' | 'blockTwo' | 'blockThree') => {
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);
//   const [isSaving, setIsSaving] = useState(false);

//   const triggerSave = () => {
//     setIsSaving(true);
//     setTimeout(() => {
//       setIsSaving(false);
//       setLastSaved(new Date());
//     }, 500);
//   };

//   const getSavedData = () => {
//     return autosaveService.getBlockData(blockType);
//   };

//   const clearSavedData = () => {
//     autosaveService.clearBlockData(blockType);
//     setLastSaved(null);
//   };

//   return {
//     lastSaved,
//     isSaving,
//     triggerSave,
//     getSavedData,
//     clearSavedData
//   };
// };

// // Вспомогательная функция для форматирования времени
// const formatTime = (date: Date): string => {
//   const now = new Date();
//   const diffMs = now.getTime() - date.getTime();
//   const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
//   if (diffMinutes < 1) return 'щойно';
//   if (diffMinutes < 60) return `${diffMinutes} хв. тому`;
  
//   const diffHours = Math.floor(diffMinutes / 60);
//   if (diffHours < 24) return `${diffHours} год. тому`;
  
//   return date.toLocaleDateString('uk-UA', { 
//     day: '2-digit', 
//     month: '2-digit', 
//     hour: '2-digit', 
//     minute: '2-digit' 
//   });
// };