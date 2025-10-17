import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  History, 
  Download, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  FileText,
  Calculator,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useHistory, useAppSelector } from '../../redux/hooks';
import {
  selectAvailableYears,
  selectAvailableMonths,
  selectAvailableDays
} from '../../redux/slices/historySlice';
import type { CalculationSession } from '../../service/historyService';

const HistoryComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [viewMode, setViewMode] = useState<'list' | 'year' | 'month' | 'day'>('list');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Redux hooks
  const {
    sessions,
    loading,
    error,
    statistics,
    loadSessions,
    loadStatistics,
    deleteSession,
    exportSession,
    clearError
  } = useHistory();
  
  // const { currentSession } = useCurrentSession();
  const [selectedSession, setSelectedSession] = useState<CalculationSession | null>(null);

  // Селекторы для фильтрации по датам
  const availableYears = useAppSelector(selectAvailableYears);
  const availableMonths = useAppSelector(state => selectedYear ? selectAvailableMonths(state, selectedYear) : []);
  const availableDays = useAppSelector(state => selectedYear && selectedMonth !== null ? selectAvailableDays(state, selectedYear, selectedMonth) : []);

  // Отладочная информация (только в development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Доступные годы:', availableYears);
    console.log('Все сессии в Redux:', sessions.length);
    console.log('Сессии:', sessions.map(s => ({ id: s.id, title: s.title, date: s.updatedAt })));
  }

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadData();
  }, []);

  // Отслеживаем изменения selectedSession
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('selectedSession изменился:', selectedSession ? selectedSession.id : 'нет');
    }
  }, [selectedSession]);

  const loadData = async () => {
    try {
      console.log('🟢 История: Загрузка данных...');
      clearError();
      await Promise.all([
        loadSessions(),
        loadStatistics()
      ]);
      console.log('✅ Історія: Дані завантажені');
    } catch (err) {
      console.error('🔴 Помилка завантаження історії:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю сесію?')) return;
    
    try {
      await deleteSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error('Помилка видалення:', err);
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const result = await exportSession(sessionId);
      if (result && typeof result === 'object' && 'jsonData' in result) {
        const blob = new Blob([(result as any).jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Ошибка экспорта:', err);
    }
  };

  const handleSelectSession = (session: CalculationSession) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Выбрана сессия для детального просмотра:', session.id, session.title);
    }
    setSelectedSession(session);
    setActiveTab('details'); // Автоматически переключаем на вкладку деталей
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonthName = (month: number) => {
    const months = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return months[month];
  };

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${formatMonthName(parseInt(month))} ${year}`;
  };

  const getDayName = (dayKey: string) => {
    const [year, month, day] = dayKey.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleYearSelect = (year: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Выбран год:', year);
      console.log('Все сессии:', sessions.map(s => ({ id: s.id, year: new Date(s.updatedAt).getFullYear() })));
    }
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedDay(null);
    setViewMode('year');
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setSelectedDay(null);
    setViewMode('month');
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setViewMode('day');
  };

  const resetFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    setViewMode('list');
  };

  const getDisplaySessions = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('getDisplaySessions вызван:', { viewMode, selectedYear, selectedMonth, selectedDay, sessionsCount: sessions.length });
    }
    
    // Если нет сессий вообще, возвращаем пустой массив
    if (sessions.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Нет сессий в Redux');
      }
      return [];
    }
    
    switch (viewMode) {
      case 'year':
        if (selectedYear) {
          const filtered = sessions.filter(session => {
            const sessionYear = new Date(session.updatedAt).getFullYear();
            return sessionYear === selectedYear;
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('Фильтрация по году:', selectedYear, 'найдено:', filtered.length);
            console.log('Отфильтрованные сессии:', filtered.map(s => ({ id: s.id, year: new Date(s.updatedAt).getFullYear() })));
          }
          return filtered;
        }
        return [];
      case 'month':
        if (selectedYear && selectedMonth !== null) {
          return sessions.filter(session => {
            const sessionDate = new Date(session.updatedAt);
            return sessionDate.getFullYear() === selectedYear && 
                   sessionDate.getMonth() === selectedMonth;
          });
        }
        return [];
      case 'day':
        if (selectedYear && selectedMonth !== null && selectedDay !== null) {
          return sessions.filter(session => {
            const sessionDate = new Date(session.updatedAt);
            return sessionDate.getFullYear() === selectedYear && 
                   sessionDate.getMonth() === selectedMonth &&
                   sessionDate.getDate() === selectedDay;
          });
        }
        return [];
      default:
        return sessions;
    }
  };

  const getStatusBadge = (session: CalculationSession) => {
    if (session.isComplete) {
      return <Badge className="bg-green-100 text-green-800">Завершена</Badge>;
    } else if (session.blockOneData || session.blockTwoData || session.blockThreeData) {
      return <Badge className="bg-yellow-100 text-yellow-800">У процесі</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Нова</Badge>;
    }
  };

  const getProgressInfo = (session: CalculationSession) => {
    const blocks = [session.blockOneData, session.blockTwoData, session.blockThreeData];
    const completed = blocks.filter(Boolean).length;
    return `${completed}/3 розділів`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Завантаження історії розрахунків...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Історія розрахунків
          </h1>
          <p className="text-gray-600 mt-2">
            Перегляд та управління збереженими результатами розрахунків
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Оновити
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Помилка завантаження даних: {error}</AlertDescription>
        </Alert>
      )}

      {/* Статистика */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Всього сесій</p>
                  <p className="text-2xl font-bold">{statistics.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Завершено</p>
                  <p className="text-2xl font-bold">{statistics.completedSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">В процесі</p>
                  <p className="text-2xl font-bold">{statistics.inProgressSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

       {/* Фильтры по датам */}
       {sessions.length === 0 && (
         <Card className="mb-6">
           <CardContent className="p-4">
             <div className="text-center text-gray-600">
               <p>Немає сесій для фільтрації. Спочатку створіть сесії в розділах розрахунків.</p>
             </div>
           </CardContent>
         </Card>
       )}
       
       <Card className="mb-6">
         <CardHeader>
           <CardTitle className="text-lg">Фільтрація за датами</CardTitle>
         </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Режим перегляду:</span>
              <Select value={viewMode} onValueChange={(value: any) => {
                setViewMode(value);
                if (value === 'list') resetFilters();
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">Список</SelectItem>
                  <SelectItem value="year">За роками</SelectItem>
                  <SelectItem value="month">За місяцями</SelectItem>
                  <SelectItem value="day">За днями</SelectItem>
                </SelectContent>
              </Select>
            </div>

             {viewMode === 'year' && (
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium">Рік:</span>
                 <Select value={selectedYear?.toString() || ''} onValueChange={(value) => handleYearSelect(parseInt(value))}>
                   <SelectTrigger className="w-32">
                     <SelectValue placeholder="Оберіть рік" />
                   </SelectTrigger>
                   <SelectContent>
                     {availableYears.length > 0 ? (
                       availableYears.map(year => (
                         <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                       ))
                     ) : (
                       <SelectItem value="no-years" disabled>Немає доступних років</SelectItem>
                     )}
                   </SelectContent>
                 </Select>
               </div>
             )}

            {viewMode === 'month' && selectedYear && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Місяць:</span>
                <Select value={selectedMonth?.toString() || ''} onValueChange={(value) => handleMonthSelect(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Оберіть місяць" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {formatMonthName(month)} {selectedYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {viewMode === 'day' && selectedYear && selectedMonth !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">День:</span>
                <Select value={selectedDay?.toString() || ''} onValueChange={(value) => handleDaySelect(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Оберіть день" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDays.map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}.{selectedMonth + 1}.{selectedYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={resetFilters}>
              Скинути фільтри
            </Button>
          </div>

          {/* Хлебные крошки */}
          {(viewMode !== 'list') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Шлях:</span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Всі сесії
              </Button>
              {selectedYear && (
                <>
                  <span>/</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedMonth(null);
                    setSelectedDay(null);
                    setViewMode('year');
                  }}>
                    {selectedYear}
                  </Button>
                </>
              )}
              {selectedYear && selectedMonth !== null && (
                <>
                  <span>/</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDay(null);
                    setViewMode('month');
                  }}>
                    {formatMonthName(selectedMonth)}
                  </Button>
                </>
              )}
              {selectedYear && selectedMonth !== null && selectedDay !== null && (
                <>
                  <span>/</span>
                  <span className="font-medium">{selectedDay}.{selectedMonth + 1}.{selectedYear}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Сесії розрахунків</TabsTrigger>
          <TabsTrigger value="details">Деталі сесії</TabsTrigger>
        </TabsList>

         <TabsContent value="sessions" className="space-y-4">
           {(() => {
             const displaySessions = getDisplaySessions();
             if (process.env.NODE_ENV === 'development') {
               console.log('Отображаемые сессии:', displaySessions.length);
             }
             
             if (displaySessions.length === 0) {
               return (
                 <Card>
                   <CardContent className="p-8 text-center">
                     <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                     <h3 className="text-lg font-semibold mb-2">
                       {viewMode === 'list' ? 'Історія порожня' : 'Сесії не знайдено'}
                     </h3>
                     <p className="text-gray-600">
                       {viewMode === 'list' 
                         ? 'Почніть розрахунки в будь-якому з розділів, щоб створити першу сесію'
                         : `Для ${viewMode === 'year' ? `року ${selectedYear}` : 
                             viewMode === 'month' ? `місяця ${selectedMonth}` : 
                             `дня ${selectedDay}`} сесії не знайдено`
                       }
                     </p>
                   </CardContent>
                 </Card>
               );
             }
             
             return (
            <div className="space-y-4">
              {viewMode === 'list' ? (
                // Обычный список
                displaySessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(session.updatedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {session.userId}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(session)}
                          <span className="text-sm text-gray-600">
                            {getProgressInfo(session)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {session.description && (
                        <p className="text-gray-600 mb-4">{session.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          <span className="text-sm">
                            Фінансування: {session.blockOneData ? '✓' : '○'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">
                            Утримання: {session.blockTwoData ? '✓' : '○'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="text-sm">
                            Ремонти: {session.blockThreeData ? '✓' : '○'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectSession(session)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Перегляд
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportSession(session.id)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Експорт
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSession(session.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Видалити
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : viewMode === 'year' ? (
                // Группировка по годам
                Object.entries(
                  displaySessions.reduce((acc, session) => {
                    const year = new Date(session.updatedAt).getFullYear().toString();
                    if (!acc[year]) acc[year] = [];
                    acc[year].push(session);
                    return acc;
                  }, {} as { [year: string]: CalculationSession[] })
                ).map(([year, yearSessions]) => (
                  <Card key={year} className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {year} рік ({yearSessions.length} сесій)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {yearSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-gray-600">{formatDate(session.updatedAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectSession(session)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : viewMode === 'month' ? (
                // Группировка по месяцам
                Object.entries(
                  displaySessions.reduce((acc, session) => {
                    const sessionDate = new Date(session.updatedAt);
                    const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth().toString().padStart(2, '0')}`;
                    if (!acc[monthKey]) acc[monthKey] = [];
                    acc[monthKey].push(session);
                    return acc;
                  }, {} as { [monthKey: string]: CalculationSession[] })
                ).map(([monthKey, monthSessions]) => (
                  <Card key={monthKey} className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {getMonthName(monthKey)} ({monthSessions.length} сесій)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {monthSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-gray-600">{formatDate(session.updatedAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectSession(session)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Группировка по дням
                Object.entries(
                  displaySessions.reduce((acc, session) => {
                    const sessionDate = new Date(session.updatedAt);
                    const dayKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth().toString().padStart(2, '0')}-${sessionDate.getDate().toString().padStart(2, '0')}`;
                    if (!acc[dayKey]) acc[dayKey] = [];
                    acc[dayKey].push(session);
                    return acc;
                  }, {} as { [dayKey: string]: CalculationSession[] })
                ).map(([dayKey, daySessions]) => (
                  <Card key={dayKey} className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {getDayName(dayKey)} ({daySessions.length} сесій)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {daySessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-gray-600">{formatDate(session.updatedAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectSession(session)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            );
           })()}
        </TabsContent>

         <TabsContent value="details">
           {selectedSession ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Деталі сесії: {selectedSession.title}</CardTitle>
                  <CardDescription>
                    Створена: {formatDate(selectedSession.createdAt)} | 
                    Оновлена: {formatDate(selectedSession.updatedAt)}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Блок 1 */}
              {selectedSession.blockOneData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Розрахунок бюджетного фінансування доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Q₁ (державні дороги)</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockOneData.q1Result.toLocaleString()} тыс. грн
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Q₂ (місцеві дороги)</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockOneData.q2Result.toLocaleString()} тыс. грн
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Загальний бюджет</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockOneData.totalBudget.toLocaleString()} тыс. грн
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Блок 2 */}
              {selectedSession.blockTwoData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Експлуатаційне утримання доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Регіон</p>
                        <p className="text-lg font-semibold">{selectedSession.blockTwoData.selectedRegion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Державне фінансування</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockTwoData.fundingResults.stateFunding.toLocaleString()} тыс. грн
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Місцеве фінансування</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockTwoData.fundingResults.localFunding.toLocaleString()} тыс. грн
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Блок 3 */}
              {selectedSession.blockThreeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Планування ремонтів автомобільних доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Кількість секцій</p>
                        <p className="text-lg font-semibold">{selectedSession.blockThreeData.sections.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Використання бюджету</p>
                        <p className="text-lg font-semibold">
                          {selectedSession.blockThreeData.planningData.utilizationPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    {selectedSession.blockThreeData.reportText && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Звіт:</p>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">
                            {selectedSession.blockThreeData.reportText}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Оберіть сесію</h3>
                <p className="text-gray-600">
                  Оберіть сесію зі списку, щоб переглянути деталі
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryComponent;
