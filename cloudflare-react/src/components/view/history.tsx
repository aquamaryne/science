import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <div className="p-6">
      <Card className="mb-6 shadow-lg border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-300">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-900">
                <History className="h-8 w-8 text-indigo-600" />
                Історія розрахунків
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Перегляд та управління збереженими результатами розрахунків у вигляді детальних таблиць
              </CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2 border-indigo-300 hover:bg-indigo-50">
              <RefreshCw className="h-4 w-4" />
              Оновити
            </Button>
          </div>
        </CardHeader>
      </Card>

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

              {/* Бюджетне фінансування */}
              {selectedSession.blockOneData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Розрахунок бюджетного фінансування доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Сводка результатов */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg border-2 border-green-300">
                        <div className="text-sm font-semibold text-green-900 mb-1">Q₁ - Державні дороги</div>
                        <div className="text-3xl font-bold text-green-700">
                          {selectedSession.blockOneData.q1Result.toLocaleString()}
                      </div>
                        <div className="text-xs text-green-600 mt-1">тис. грн</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border-2 border-blue-300">
                        <div className="text-sm font-semibold text-blue-900 mb-1">Q₂ - Місцеві дороги</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {selectedSession.blockOneData.q2Result.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">тис. грн</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-lg border-2 border-purple-400">
                        <div className="text-sm font-semibold text-purple-900 mb-1">Q - Загальний бюджет</div>
                        <div className="text-3xl font-bold text-purple-700">
                          {selectedSession.blockOneData.totalBudget.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">тис. грн</div>
                      </div>
                    </div>

                    {/* Таблица с детальными данными государственных дорог */}
                    {selectedSession.blockOneData.stateRoadBudget && selectedSession.blockOneData.stateRoadBudget.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Державні дороги - детальні показники</h4>
                        <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-green-100 hover:bg-green-100">
                                <TableHead className="font-bold text-green-900">Показник (ID)</TableHead>
                                <TableHead className="font-bold text-green-900">Обсяг (тис. грн)</TableHead>
                                <TableHead className="font-bold text-green-900">Нормативний документ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSession.blockOneData.stateRoadBudget.map((item: any, index: number) => (
                                <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">{item.id}</Badge>
                                      <span className="text-sm">{item.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {item.value !== null && item.value !== undefined 
                                      ? item.value.toLocaleString() 
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    {item.normativeDocument || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Таблица с детальными данными местных дорог */}
                    {selectedSession.blockOneData.localRoadBudget && selectedSession.blockOneData.localRoadBudget.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Місцеві дороги - детальні показники</h4>
                        <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-blue-100 hover:bg-blue-100">
                                <TableHead className="font-bold text-blue-900">Показник (ID)</TableHead>
                                <TableHead className="font-bold text-blue-900">Обсяг (тис. грн)</TableHead>
                                <TableHead className="font-bold text-blue-900">Нормативний документ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSession.blockOneData.localRoadBudget.map((item: any, index: number) => (
                                <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">{item.id}</Badge>
                                      <span className="text-sm">{item.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {item.value !== null && item.value !== undefined 
                                      ? item.value.toLocaleString() 
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    {item.normativeDocument || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              )}

              {/* Експлуатаційне утримання */}
              {selectedSession.blockTwoData && (() => {
                console.log('📊 History Block 2 Debug:', {
                  hasBlockTwoData: !!selectedSession.blockTwoData,
                  hasRegionalResults: !!selectedSession.blockTwoData.regionalResults,
                  regionalResultsLength: selectedSession.blockTwoData.regionalResults?.length || 0,
                  roadType: selectedSession.blockTwoData.roadType,
                  selectedRegion: selectedSession.blockTwoData.selectedRegion
                });
                return true;
              })() && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Експлуатаційне утримання доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Сводка результатов */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center bg-gradient-to-br from-orange-100 to-orange-50 p-4 rounded-lg border-2 border-orange-300">
                        <div className="text-sm font-semibold text-orange-900 mb-1">Регіон</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {selectedSession.blockTwoData.selectedRegion}
                      </div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg border-2 border-green-300">
                        <div className="text-sm font-semibold text-green-900 mb-1">Державні дороги</div>
                        <div className="text-3xl font-bold text-green-700">
                          {selectedSession.blockTwoData.fundingResults.stateFunding.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 mt-1">тис. грн</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border-2 border-blue-300">
                        <div className="text-sm font-semibold text-blue-900 mb-1">Місцеві дороги</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {selectedSession.blockTwoData.fundingResults.localFunding.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">тис. грн</div>
                      </div>
                    </div>

                    {/* Таблица нормативов государственных дорог */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-3">📊 Нормативи для державних доріг</h4>
                      <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-green-100 hover:bg-green-100">
                              <TableHead className="font-bold text-green-900">Показник</TableHead>
                              <TableHead className="font-bold text-green-900 text-right">Значення</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Базовий норматив</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadBaseRate.toFixed(3)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-green-50">
                              <TableCell className="font-medium">Індекси інфляції</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateInflationIndexes.join('%, ')}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії I</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadRates.category1.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-green-50">
                              <TableCell className="font-medium">Норматив категорії II</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadRates.category2.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії III</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadRates.category3.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-green-50">
                              <TableCell className="font-medium">Норматив категорії IV</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadRates.category4.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії V</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.stateRoadRates.category5.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Таблица нормативов местных дорог */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-3">📊 Нормативи для місцевих доріг</h4>
                      <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-100 hover:bg-blue-100">
                              <TableHead className="font-bold text-blue-900">Показник</TableHead>
                              <TableHead className="font-bold text-blue-900 text-right">Значення</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Базовий норматив</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadBaseRate.toFixed(3)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-blue-50">
                              <TableCell className="font-medium">Індекси інфляції</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localInflationIndexes.join('%, ')}%
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії I</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadRates.category1.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-blue-50">
                              <TableCell className="font-medium">Норматив категорії II</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadRates.category2.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії III</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadRates.category3.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-blue-50">
                              <TableCell className="font-medium">Норматив категорії IV</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadRates.category4.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium">Норматив категорії V</TableCell>
                              <TableCell className="text-right font-semibold">
                                {selectedSession.blockTwoData.localRoadRates.category5.toFixed(2)} тис. грн/км
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* РЕГІОНАЛЬНІ РЕЗУЛЬТАТИ */}
                    {selectedSession.blockTwoData && selectedSession.blockTwoData.regionalResults && selectedSession.blockTwoData.regionalResults.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">
                          📊 Регіональні результати по областях 
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({selectedSession.blockTwoData.roadType === 'state' ? 'державні дороги' : 'місцеві дороги'})
                          </span>
                        </h4>
                        <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto max-h-[500px]">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-purple-100 hover:bg-purple-100">
                                  <TableHead className="font-bold text-purple-900 sticky left-0 z-10 bg-purple-100">Область</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-center">Кат. I</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-center">Кат. II</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-center">Кат. III</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-center">Кат. IV</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-center">Кат. V</TableHead>
                                  <TableHead className="font-bold text-purple-900 text-right bg-yellow-100">Разом (тис. грн)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedSession.blockTwoData.regionalResults.map((result: any, index: number) => (
                                  <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                                    <TableCell className="font-medium sticky left-0 z-10 bg-inherit">
                                      {result.regionName}
                                    </TableCell>
                                    {[1, 2, 3, 4, 5].map((cat) => (
                                      <TableCell key={cat} className="text-right text-sm">
                                        {Math.round(result.fundingByCategory[cat]).toLocaleString()}
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-right font-bold text-base bg-yellow-50">
                                      {Math.round(result.totalFunding).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {/* Підсумковий рядок */}
                                <TableRow className="bg-green-100 border-t-2 border-green-400">
                                  <TableCell className="font-bold sticky left-0 z-10 bg-green-100">
                                    ВСЬОГО ПО УКРАЇНІ
                                  </TableCell>
                                  {[1, 2, 3, 4, 5].map((cat) => (
                                    <TableCell key={cat} className="text-right font-bold">
                                      {Math.round(
                                        selectedSession.blockTwoData!.regionalResults!.reduce(
                                          (sum: number, r: any) => sum + r.fundingByCategory[cat], 
                                          0
                                        )
                                      ).toLocaleString()}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-bold text-lg text-green-700 bg-green-200">
                                    {Math.round(
                                      selectedSession.blockTwoData!.regionalResults!.reduce(
                                        (sum: number, r: any) => sum + r.totalFunding, 
                                        0
                                      )
                                    ).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ТАБЛИЦЯ КОЕФІЦІЄНТІВ */}
                    {selectedSession.blockTwoData && selectedSession.blockTwoData.regionalResults && selectedSession.blockTwoData.regionalResults.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Середньозважені коригувальні коефіцієнти</h4>
                        <div className="border-2 border-cyan-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-cyan-100 hover:bg-cyan-100">
                                  <TableHead className="font-bold text-cyan-900">Область</TableHead>
                                  {selectedSession.blockTwoData!.roadType === 'state' && (
                                    <TableHead className="font-bold text-cyan-900 text-center">K<sub>д</sub></TableHead>
                                  )}
                                  <TableHead className="font-bold text-cyan-900 text-center">K<sub>г</sub></TableHead>
                                  <TableHead className="font-bold text-cyan-900 text-center">K<sub>уе</sub></TableHead>
                                  <TableHead className="font-bold text-cyan-900 text-center">K<sub>інт</sub></TableHead>
                                  {selectedSession.blockTwoData!.roadType === 'state' && (
                                    <>
                                      <TableHead className="font-bold text-cyan-900 text-center">K<sub>е.д</sub></TableHead>
                                      <TableHead className="font-bold text-cyan-900 text-center">K<sub>мпп</sub></TableHead>
                                      <TableHead className="font-bold text-cyan-900 text-center">K<sub>осв</sub></TableHead>
                                      <TableHead className="font-bold text-cyan-900 text-center">K<sub>рем</sub></TableHead>
                                      <TableHead className="font-bold text-cyan-900 text-center">K<sub>кр.і</sub></TableHead>
                                    </>
                                  )}
                                  <TableHead className="font-bold text-cyan-900 text-right bg-yellow-100">Добуток</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedSession.blockTwoData!.regionalResults!.map((result: any, index: number) => (
                                  <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-cyan-50'}>
                                    <TableCell className="font-medium">{result.regionName}</TableCell>
                                    {selectedSession.blockTwoData!.roadType === 'state' && (
                                      <TableCell className="text-center bg-gray-100">1.1600</TableCell>
                                    )}
                                    <TableCell className="text-center">{result.coefficients.mountainous.toFixed(4)}</TableCell>
                                    <TableCell className="text-center">{result.coefficients.operatingConditions.toFixed(4)}</TableCell>
                                    <TableCell className="text-center">{result.coefficients.trafficIntensity.toFixed(4)}</TableCell>
                                    {selectedSession.blockTwoData!.roadType === 'state' && (
                                      <>
                                        <TableCell className="text-center">{(result.coefficients.europeanRoad || 1).toFixed(4)}</TableCell>
                                        <TableCell className="text-center">{(result.coefficients.borderCrossing || 1).toFixed(4)}</TableCell>
                                        <TableCell className="text-center">{(result.coefficients.lighting || 1).toFixed(4)}</TableCell>
                                        <TableCell className="text-center">{(result.coefficients.repair || 1).toFixed(4)}</TableCell>
                                        <TableCell className="text-center">{(result.coefficients.criticalInfra || 1).toFixed(4)}</TableCell>
                                      </>
                                    )}
                                    <TableCell className="text-right font-bold bg-yellow-50">
                                      {result.coefficients.totalProduct.toFixed(4)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Планування ремонтів */}
              {selectedSession.blockThreeData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Планування ремонтів автомобільних доріг
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Сводка */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center bg-gradient-to-br from-indigo-100 to-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
                        <div className="text-sm font-semibold text-indigo-900 mb-1">Кількість секцій</div>
                        <div className="text-3xl font-bold text-indigo-700">
                          {selectedSession.blockThreeData.sections.length}
                      </div>
                        <div className="text-xs text-indigo-600 mt-1">доріг</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-lg border-2 border-purple-300">
                        <div className="text-sm font-semibold text-purple-900 mb-1">Використання бюджету</div>
                        <div className="text-3xl font-bold text-purple-700">
                          {selectedSession.blockThreeData.planningData.utilizationPercent.toFixed(1)}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">%</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-pink-100 to-pink-50 p-4 rounded-lg border-2 border-pink-300">
                        <div className="text-sm font-semibold text-pink-900 mb-1">Бюджет</div>
                        <div className="text-3xl font-bold text-pink-700">
                          {selectedSession.blockThreeData.planningData.budget.toLocaleString()}
                        </div>
                        <div className="text-xs text-pink-600 mt-1">тис. грн</div>
                      </div>
                    </div>

                    {/* Таблица с секциями дорог */}
                    {selectedSession.blockThreeData.sections && selectedSession.blockThreeData.sections.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Детальна інформація по секціях доріг</h4>
                        <div className="border-2 border-indigo-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-indigo-100 hover:bg-indigo-100">
                                <TableHead className="font-bold text-indigo-900">Назва</TableHead>
                                <TableHead className="font-bold text-indigo-900 text-center">Категорія</TableHead>
                                <TableHead className="font-bold text-indigo-900 text-right">Протяжність (км)</TableHead>
                                <TableHead className="font-bold text-indigo-900 text-center">Вид робіт</TableHead>
                                <TableHead className="font-bold text-indigo-900 text-right">Вартість (тис. грн)</TableHead>
                                <TableHead className="font-bold text-indigo-900 text-center">Статус</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSession.blockThreeData.sections.map((section: any, index: number) => (
                                <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                                  <TableCell className="font-medium">{section.name}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline">{section.category}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{section.length.toFixed(2)}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={
                                      section.workType === 'Поточний ремонт' ? 'bg-blue-100 text-blue-800' :
                                      section.workType === 'Капітальний ремонт' ? 'bg-yellow-100 text-yellow-800' :
                                      section.workType === 'Реконструкція' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }>
                                      {section.workType || '-'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {section.estimatedCost ? section.estimatedCost.toLocaleString() : '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {section.categoryCompliant ? (
                                      <Badge className="bg-green-100 text-green-800">✓ Відповідає</Badge>
                                    ) : (
                                      <Badge className="bg-orange-100 text-orange-800">⚠ Потребує уваги</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Таблица статистики по видам робіт */}
                    {selectedSession.blockThreeData.planningData.selectedProjects && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Розподіл проектів за видами робіт</h4>
                        <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-purple-100 hover:bg-purple-100">
                                <TableHead className="font-bold text-purple-900">Вид робіт</TableHead>
                                <TableHead className="font-bold text-purple-900 text-right">Кількість проектів</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="bg-white">
                                <TableCell className="font-medium">Поточний ремонт</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {selectedSession.blockThreeData.planningData.selectedProjects.currentRepair}
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-purple-50">
                                <TableCell className="font-medium">Капітальний ремонт</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {selectedSession.blockThreeData.planningData.selectedProjects.capitalRepair}
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-white">
                                <TableCell className="font-medium">Реконструкція</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {selectedSession.blockThreeData.planningData.selectedProjects.reconstruction}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Таблица аналізу відповідності */}
                    {selectedSession.blockThreeData.complianceAnalysis && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📊 Аналіз відповідності нормативам</h4>
                        <div className="border-2 border-orange-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-100 hover:bg-orange-100">
                                <TableHead className="font-bold text-orange-900">Критерій</TableHead>
                                <TableHead className="font-bold text-orange-900 text-right">Кількість секцій</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="bg-green-50">
                                <TableCell className="font-medium text-green-800">✓ Відповідають нормам</TableCell>
                                <TableCell className="text-right font-semibold text-green-700">
                                  {selectedSession.blockThreeData.complianceAnalysis.compliantSections}
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-orange-50">
                                <TableCell className="font-medium text-orange-800">⚠ Не відповідають нормам</TableCell>
                                <TableCell className="text-right font-semibold text-orange-700">
                                  {selectedSession.blockThreeData.complianceAnalysis.nonCompliantSections}
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-white">
                                <TableCell className="font-medium">Проблеми з категорією</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {selectedSession.blockThreeData.complianceAnalysis.categoryIssues}
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-orange-50">
                                <TableCell className="font-medium">Проблеми зі зчепленням</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {selectedSession.blockThreeData.complianceAnalysis.frictionIssues}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {selectedSession.blockThreeData.reportText && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">📄 Текстовий звіт</h4>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
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
