// // src/services/autosaveService.ts
// /**
//  * Сервис автосохранения данных в localStorage
//  * Сохраняет состояние форм и восстанавливает их при загрузке
//  */

// import type { BudgetItem } from '../modules/block_one';
// import type { RoadSectionData } from '../components/view/block_three_page';

// // ==================== ТИПЫ ДАННЫХ ====================

// export interface AutosaveBlockOneData {
//   stateRoadBudget: BudgetItem[];
//   localRoadBudget: BudgetItem[];
//   q1Result: number | null;
//   q2Result: number | null;
//   lastSaved: string;
// }

// export interface AutosaveBlockTwoData {
//   stateRoadBaseRate: number;
//   localRoadBaseRate: number;
//   stateInflationIndexes: number[];
//   localInflationIndexes: number[];
//   selectedRegion: string;
//   stateRoadRates: {
//     category1: number;
//     category2: number;
//     category3: number;
//     category4: number;
//     category5: number;
//   };
//   localRoadRates: {
//     category1: number;
//     category2: number;
//     category3: number;
//     category4: number;
//     category5: number;
//   };
//   fundingResults: any;
//   lastSaved: string;
// }

// export interface AutosaveBlockThreeData {
//   sections: RoadSectionData[];
//   lastSaved: string;
// }

// export interface AutosaveData {
//   blockOne?: AutosaveBlockOneData;
//   blockTwo?: AutosaveBlockTwoData;
//   blockThree?: AutosaveBlockThreeData;
//   sessionId?: string;
//   lastActivity: string;
// }


// class AutosaveService {
//   private readonly STORAGE_KEY = 'ias_roads_autosave';
//   private readonly SAVE_INTERVAL = 30000; // Автосохранение каждые 30 секунд
//   private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();

//   /**
//    * Получить все сохраненные данные
//    */
//   getAutosaveData(): AutosaveData | null {
//     try {
//       const data = localStorage.getItem(this.STORAGE_KEY);
//       if (!data) return null;
      
//       const parsed = JSON.parse(data);
//       console.log('Загружены автосохраненные данные:', parsed);
//       return parsed;
//     } catch (error) {
//       console.error('Ошибка при загрузке автосохраненных данных:', error);
//       return null;
//     }
//   }

//   /**
//    * Сохранить данные блока 1
//    */
//   saveBlockOneData(data: Omit<AutosaveBlockOneData, 'lastSaved'>): void {
//     this.debouncedSave('blockOne', () => {
//       const autosaveData = this.getAutosaveData() || { lastActivity: new Date().toISOString() };
//       autosaveData.blockOne = {
//         ...data,
//         lastSaved: new Date().toISOString()
//       };
//       autosaveData.lastActivity = new Date().toISOString();
//       this.saveToStorage(autosaveData);
//       console.log('Автосохранение Блока 1 выполнено');
//     });
//   }

//   /**
//    * Сохранить данные блока 2
//    */
//   saveBlockTwoData(data: Omit<AutosaveBlockTwoData, 'lastSaved'>): void {
//     this.debouncedSave('blockTwo', () => {
//       const autosaveData = this.getAutosaveData() || { lastActivity: new Date().toISOString() };
//       autosaveData.blockTwo = {
//         ...data,
//         lastSaved: new Date().toISOString()
//       };
//       autosaveData.lastActivity = new Date().toISOString();
//       this.saveToStorage(autosaveData);
//       console.log('Автосохранение Блока 2 выполнено');
//     });
//   }

//   /**
//    * Сохранить данные блока 3
//    */
//   saveBlockThreeData(data: Omit<AutosaveBlockThreeData, 'lastSaved'>): void {
//     this.debouncedSave('blockThree', () => {
//       const autosaveData = this.getAutosaveData() || { lastActivity: new Date().toISOString() };
//       autosaveData.blockThree = {
//         ...data,
//         lastSaved: new Date().toISOString()
//       };
//       autosaveData.lastActivity = new Date().toISOString();
//       this.saveToStorage(autosaveData);
//       console.log('Автосохранение Блока 3 выполнено');
//     });
//   }

//   /**
//    * Получить данные конкретного блока
//    */
//   getBlockData<T extends 'blockOne' | 'blockTwo' | 'blockThree'>(
//     blockId: T
//   ): T extends 'blockOne' ? AutosaveBlockOneData | null :
//      T extends 'blockTwo' ? AutosaveBlockTwoData | null :
//      T extends 'blockThree' ? AutosaveBlockThreeData | null :
//      null {
//     const autosaveData = this.getAutosaveData();
//     if (!autosaveData) return null as any;

//     return (autosaveData[blockId] as any) || null;
//   }

//   /**
//    * Проверить, есть ли сохраненные данные
//    */
//   hasSavedData(): boolean {
//     const data = this.getAutosaveData();
//     return !!(data && (data.blockOne || data.blockTwo || data.blockThree));
//   }

//   /**
//    * Получить информацию о последнем сохранении
//    */
//   getLastSaveInfo(): {
//     hasData: boolean;
//     lastActivity?: Date;
//     blocks: {
//       blockOne?: Date;
//       blockTwo?: Date;
//       blockThree?: Date;
//     };
//   } {
//     const data = this.getAutosaveData();
    
//     if (!data) {
//       return { hasData: false, blocks: {} };
//     }

//     return {
//       hasData: true,
//       lastActivity: data.lastActivity ? new Date(data.lastActivity) : undefined,
//       blocks: {
//         blockOne: data.blockOne?.lastSaved ? new Date(data.blockOne.lastSaved) : undefined,
//         blockTwo: data.blockTwo?.lastSaved ? new Date(data.blockTwo.lastSaved) : undefined,
//         blockThree: data.blockThree?.lastSaved ? new Date(data.blockThree.lastSaved) : undefined,
//       }
//     };
//   }

//   /**
//    * Очистить автосохраненные данные
//    */
//   clearAutosaveData(): void {
//     try {
//       localStorage.removeItem(this.STORAGE_KEY);
//       // Очищаем все таймауты
//       this.saveTimeouts.forEach(timeout => clearTimeout(timeout));
//       this.saveTimeouts.clear();
//       console.log('Автосохраненные данные очищены');
//     } catch (error) {
//       console.error('Ошибка при очистке автосохраненных данных:', error);
//     }
//   }

//   /**
//    * Очистить данные конкретного блока
//    */
//   clearBlockData(blockId: 'blockOne' | 'blockTwo' | 'blockThree'): void {
//     try {
//       const autosaveData = this.getAutosaveData();
//       if (autosaveData) {
//         delete autosaveData[blockId];
//         autosaveData.lastActivity = new Date().toISOString();
//         this.saveToStorage(autosaveData);
//         console.log(`Данные ${blockId} очищены`);
//       }
//     } catch (error) {
//       console.error(`Ошибка при очистке данных ${blockId}:`, error);
//     }
//   }

//   /**
//    * Экспорт автосохраненных данных
//    */
//   exportAutosaveData(): string | null {
//     const data = this.getAutosaveData();
//     if (!data) return null;

//     return JSON.stringify(data, null, 2);
//   }

//   /**
//    * Импорт автосохраненных данных
//    */
//   importAutosaveData(jsonData: string): boolean {
//     try {
//       const data = JSON.parse(jsonData);
//       // Валидация структуры данных
//       if (typeof data === 'object' && data !== null) {
//         this.saveToStorage(data);
//         console.log('Автосохраненные данные импортированы');
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Ошибка при импорте автосохраненных данных:', error);
//       return false;
//     }
//   }

//   /**
//    * Получить размер сохраненных данных
//    */
//   getStorageSize(): { bytes: number; readable: string } {
//     try {
//       const data = localStorage.getItem(this.STORAGE_KEY);
//       const bytes = data ? new Blob([data]).size : 0;
      
//       let readable: string;
//       if (bytes < 1024) {
//         readable = `${bytes} байт`;
//       } else if (bytes < 1024 * 1024) {
//         readable = `${(bytes / 1024).toFixed(1)} КБ`;
//       } else {
//         readable = `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
//       }

//       return { bytes, readable };
//     } catch (error) {
//       console.error('Ошибка при получении размера хранилища:', error);
//       return { bytes: 0, readable: '0 байт' };
//     }
//   }

//   // ==================== ПРИВАТНЫЕ МЕТОДЫ ====================

//   /**
//    * Сохранение с задержкой (debounce)
//    */
//   private debouncedSave(key: string, saveFunction: () => void): void {
//     // Очищаем предыдущий таймаут
//     const existingTimeout = this.saveTimeouts.get(key);
//     if (existingTimeout) {
//       clearTimeout(existingTimeout);
//     }

//     // Устанавливаем новый таймаут
//     const newTimeout = setTimeout(() => {
//       saveFunction();
//       this.saveTimeouts.delete(key);
//     }, 1000); // Задержка 1 секунда

//     this.saveTimeouts.set(key, newTimeout);
//   }

//   /**
//    * Сохранить данные в localStorage
//    */
//   private saveToStorage(data: AutosaveData): void {
//     try {
//       const jsonString = JSON.stringify(data);
//       localStorage.setItem(this.STORAGE_KEY, jsonString);
//     } catch (error) {
//       console.error('Ошибка при сохранении в localStorage:', error);
      
//       // Если ошибка связана с переполнением хранилища, пытаемся очистить старые данные
//       if (error instanceof DOMException && error.code === 22) {
//         console.warn('Хранилище переполнено. Пытаемся очистить старые данные...');
//         this.clearAutosaveData();
        
//         // Пытаемся сохранить еще раз
//         try {
//           localStorage.setItem(this.STORAGE_KEY, toString());
//           console.log('Данные сохранены после очистки');
//         } catch (secondError) {
//           console.error('Не удалось сохранить данные даже после очистки:', secondError);
//         }
//       }
//     }
//   }
// }


// export const autosaveService = new AutosaveService();
// export default autosaveService;