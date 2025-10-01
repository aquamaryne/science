import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calculator, 
  FileSpreadsheet, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Play,
  Download,
  Upload,
  Settings,
  Database,
  BarChart3,
  ChevronRight,
  Info
} from 'lucide-react';

const InstructionsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const VideoPlaceholder = ({ title, description }: { title: string; description: string }) => (
    <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 border-2 border-dashed border-blue-300">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-blue-700">{title}</p>
          <p className="text-xs text-blue-600 mt-2">{description}</p>
        </div>
      </div>
      {/* Замість цього div вставте ваше відео/гіфку:
          <video src="/path/to/video.mp4" controls className="w-full rounded-lg" />
          або
          <img src="/path/to/animation.gif" alt={title} className="w-full rounded-lg" />
      */}
      <div className="h-64"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Інструкція користувача</h1>
          </div>
          <p className="text-lg text-gray-600">
            Система планування та розрахунку бюджету утримання автомобільних доріг
          </p>
        </div>

        {/* Швидкий старт */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Швидкий старт</AlertTitle>
          <AlertDescription className="text-blue-800">
            Система складається з трьох основних блоків: Блок 1 (Визначення бюджету), 
            Блок 2 (Експлуатаційне утримання), Блок 3 (Планування ремонтів). 
            Рекомендуємо починати з Блоку 1.
          </AlertDescription>
        </Alert>

        {/* Основні табуляції */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-2 py-3">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Огляд</span>
            </TabsTrigger>
            <TabsTrigger value="block1" className="flex flex-col items-center gap-2 py-3">
              <Calculator className="h-5 w-5" />
              <span className="text-xs">Блок 1</span>
            </TabsTrigger>
            <TabsTrigger value="block2" className="flex flex-col items-center gap-2 py-3">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Блок 2</span>
            </TabsTrigger>
            <TabsTrigger value="block3" className="flex flex-col items-center gap-2 py-3">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Блок 3</span>
            </TabsTrigger>
          </TabsList>

          {/* ОГЛЯД */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Загальний огляд системи
                </CardTitle>
                <CardDescription>
                  Система для комплексного планування бюджету автомобільних доріг
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        Блок 1
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        Визначення загального обсягу бюджетного фінансування для державних та місцевих доріг
                      </p>
                      <div className="mt-4 space-y-2">
                        <Badge variant="outline" className="text-xs">Q₁ - Державні дороги</Badge>
                        <Badge variant="outline" className="text-xs">Q₂ - Місцеві дороги</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-green-600" />
                        Блок 2
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        Розрахунок нормативів експлуатаційного утримання доріг з урахуванням інфляції та коефіцієнтів
                      </p>
                      <div className="mt-4 space-y-2">
                        <Badge variant="outline" className="text-xs">Індекси інфляції</Badge>
                        <Badge variant="outline" className="text-xs">Регіональні коефіцієнти</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        Блок 3
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">
                        Планування ремонтних робіт з економічним аналізом та ранжуванням об'єктів
                      </p>
                      <div className="mt-4 space-y-2">
                        <Badge variant="outline" className="text-xs">ENPV / BCR</Badge>
                        <Badge variant="outline" className="text-xs">Ранжування</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Основний робочий процес</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-2 mt-2">
                      <li>Заповніть вихідні дані в Блоці 1 та розрахуйте загальний бюджет (Q₁ + Q₂)</li>
                      <li>Визначте нормативи утримання в Блоці 2 з урахуванням регіональних особливостей</li>
                      <li>Проаналізуйте стан доріг та сплануйте ремонти в Блоці 3</li>
                      <li>Експортуйте результати та звіти для подальшого використання</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="pt-4">
                  <h3 className="font-semibold text-lg mb-4">Демонстрація інтерфейсу</h3>
                  <VideoPlaceholder 
                    title="Загальний огляд системи"
                    description="Огляд основних розділів та навігації"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* БЛОК 1 */}
          <TabsContent value="block1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  Блок 1: Визначення бюджету фінансування
                </CardTitle>
                <CardDescription>
                  Розрахунок обсягу коштів для розвитку та утримання доріг
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Крок 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Заповнення даних для державних доріг</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Введіть дані про бюджетні кошти для кожної категорії державних доріг:
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>Qдз</strong> - Обсяг бюджетних коштів на фінансове забезпечення нового будівництва, 
                          реконструкції, капітального та поточного ремонтів і утримання автомобільних доріг державного значення
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>Qпп</strong> - Обсяг бюджетних коштів на заходи з розвитку, будівництва, ремонту, 
                          облаштування, модернізації та утримання пунктів пропуску через державний кордон
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>Qміжн</strong> - Обсяг бюджетних коштів на проведення конкурсів і підготовку договорів 
                          щодо дорожніх робіт за рахунок коштів міжнародних організацій
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>QІАС</strong> - Обсяг бюджетних коштів на створення та функціонування 
                          інформаційно-аналітичної системи дорожнього господарства
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>QДПП</strong> - Обсяг бюджетних коштів на виплати приватному партнеру/концесіонеру 
                          за експлуатаційну готовність доріг державного значення
                        </div>
                      </div>
                    </div>

                    <VideoPlaceholder 
                      title="Заповнення даних державних доріг"
                      description="Покрокове введення показників Q₁"
                    />
                  </div>
                </div>

                {/* Крок 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Заповнення даних для місцевих доріг</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Введіть обсяг бюджетних коштів на місцеві дороги:
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <strong>Qмз</strong> - Обсяг бюджетних коштів на фінансове забезпечення нового будівництва, 
                          реконструкції, капітального та поточного ремонтів і утримання автомобільних доріг місцевого значення
                        </div>
                      </div>
                    </div>

                    <VideoPlaceholder 
                      title="Заповнення даних місцевих доріг"
                      description="Введення показника Q₂"
                    />
                  </div>
                </div>

                {/* Крок 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Додавання нормативних документів та файлів</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Для кожного показника можна додати:
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-gray-200">
                        <CardContent className="pt-6">
                          <FileSpreadsheet className="h-8 w-8 text-blue-600 mb-2" />
                          <h4 className="font-semibold mb-2">Нормативний документ</h4>
                          <p className="text-sm text-gray-600">
                            Вкажіть назву постанови, закону або наказу, який підтверджує показник
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-gray-200">
                        <CardContent className="pt-6">
                          <Upload className="h-8 w-8 text-green-600 mb-2" />
                          <h4 className="font-semibold mb-2">Прикріплення файлів</h4>
                          <p className="text-sm text-gray-600">
                            Додайте PDF, DOC, XLS файли з розрахунками або обґрунтуваннями (до 10 МБ)
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <VideoPlaceholder 
                      title="Додавання документів"
                      description="Завантаження файлів та вказівка нормативних документів"
                    />
                  </div>
                </div>

                {/* Крок 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Виконання розрахунку та перегляд результатів</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Після заповнення всіх обов'язкових полів:
                    </p>
                    
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Натисніть кнопку <strong>"Розрахувати"</strong> для кожного розділу (Q₁ та Q₂)</li>
                      <li>Система автоматично виконає розрахунок та відобразить результати</li>
                      <li>Перегляньте загальну суму бюджету в розділі "Сводка результатів"</li>
                      <li>Натисніть <strong>"Передати дані в Блок 3"</strong> для інтеграції з плануванням ремонтів</li>
                    </ol>

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Формула розрахунку</AlertTitle>
                      <AlertDescription className="text-green-800">
                        <div className="font-mono text-sm mt-2">
                          Q₁ = Qдз + Qпп + Qміжн + QІАС + QДПП
                        </div>
                        <div className="font-mono text-sm mt-1">
                          Q₂ = Qмз
                        </div>
                        <div className="font-mono text-sm mt-1 font-bold">
                          Загальний бюджет = Q₁ + Q₂
                        </div>
                      </AlertDescription>
                    </Alert>

                    <VideoPlaceholder 
                      title="Розрахунок та результати"
                      description="Виконання розрахунку та перегляд підсумкових даних"
                    />
                  </div>
                </div>

                {/* Крок 5 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <h3 className="text-lg font-semibold">Інтеграція з Блоком 3</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Після успішного розрахунку передайте дані для планування ремонтів:
                    </p>
                    
                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Дані, що передаються:</span>
                      </div>
                      <ul className="space-y-1 ml-7">
                        <li>• Загальний бюджет (Q₁ + Q₂)</li>
                        <li>• Розподіл по категоріях доріг</li>
                        <li>• Ідентифікатор сесії розрахунків</li>
                        <li>• Деталізація витрат по типах робіт</li>
                      </ul>
                    </div>

                    <VideoPlaceholder 
                      title="Передача даних в Блок 3"
                      description="Інтеграція бюджетних даних для планування"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* БЛОК 2 */}
          <TabsContent value="block2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6 text-green-600" />
                  Блок 2: Експлуатаційне утримання доріг
                </CardTitle>
                <CardDescription>
                  Розрахунок нормативів та планування витрат на утримання
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Крок 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Розрахунок нормативів для державних доріг</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold">Вихідні дані:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Базовий норматив (2023 р.):</strong> 604.761 тис. грн/км для II категорії
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Індекси інфляції:</strong> Додайте індекси для кожного року (наприклад, 10%, 12%, 8%)
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Коефіцієнти категорій:</strong> Автоматично застосовуються (I кат: 1.80, II: 1.00, III: 0.89, IV: 0.61, V: 0.39)
                          </div>
                        </li>
                      </ul>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Сукупний індекс інфляції розраховується як добуток усіх індексів: (1 + і₁/100) × (1 + і₂/100) × ...
                      </AlertDescription>
                    </Alert>

                    <VideoPlaceholder 
                      title="Розрахунок державних доріг"
                      description="Введення індексів інфляції та розрахунок нормативів"
                    />
                  </div>
                </div>

                {/* Крок 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Розрахунок нормативів для місцевих доріг</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold">Вихідні дані:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Базовий норматив (2023 р.):</strong> 360.544 тис. грн/км для II категорії
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Індекси інфляції:</strong> Можуть відрізнятися від державних доріг
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <strong>Коефіцієнти категорій:</strong> I: 1.71, II: 1.00, III: 0.85, IV: 0.64, V: 0.40
                          </div>
                        </li>
                      </ul>
                    </div>

                    <VideoPlaceholder 
                      title="Розрахунок місцевих доріг"
                      description="Налаштування параметрів для місцевих доріг"
                    />
                  </div>
                </div>

                {/* Крок 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Робота з Excel шаблоном (розширений розрахунок)</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Для детального розрахунку з урахуванням регіональних коефіцієнтів:
                    </p>

                    <ol className="list-decimal list-inside space-y-3">
                      <li>
                        <strong>Завантажте Excel шаблон</strong> з даними про дороги регіону
                        <div className="mt-2 ml-6 bg-gray-50 p-3 rounded text-sm">
                          Структура файлу: Категорія (A), Державне значення (B), Довжина (C), 
                          Інтенсивність (D), Європейський статус (E), Прикордонний перехід (F), 
                          Освітлення (G), Нещодавно відремонтований (H)
                        </div>
                      </li>
                      <li><strong>Оберіть аркуш</strong> для аналізу</li>
                      <li><strong>Оберіть регіон</strong> зі списку областей України</li>
                      <li><strong>Встановіть індекс інфляції</strong> (за замовчуванням 1.25)</li>
                      <li><strong>Відредагуйте дані</strong> безпосередньо в таблиці (якщо потрібно)</li>
                      <li><strong>Натисніть "Розрахувати"</strong> для виконання обчислень</li>
                      <li><strong>Експортуйте результати</strong> у новий Excel файл</li>
                    </ol>

                    <VideoPlaceholder 
                      title="Робота з Excel шаблоном"
                      description="Завантаження, редагування та розрахунок з файлом"
                    />

                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-900">Важливо!</AlertTitle>
                      <AlertDescription className="text-yellow-800">
                        Перший рядок Excel (заголовки) не редагується. Клітинки з формулами показуються 
                        жовтим кольором і теж не редагуються для забезпечення цілісності розрахунків.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Крок 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Перегляд детальних коефіцієнтів</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Система автоматично розраховує та застосовує наступні коефіцієнти:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-sm">Державні дороги</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>• <strong>Кі</strong> - Інтенсивність руху</div>
                          <div>• <strong>Ке.д</strong> - Європейська мережа</div>
                          <div>• <strong>Кмпп.д</strong> - Прикордонні переходи</div>
                          <div>• <strong>Косв</strong> - Освітлення</div>
                          <div>• <strong>Крем</strong> - Після ремонту</div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200">
                        <CardHeader>
                          <CardTitle className="text-sm">Місцеві дороги</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>• <strong>Кі</strong> - Інтенсивність руху</div>
                        </CardContent>
                      </Card>

                      <Card className="border-purple-200 md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-sm">Загальні коефіцієнти</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>• <strong>Кг</strong> - Гірська місцевість</div>
                          <div>• <strong>Куе</strong> - Умови експлуатації</div>
                          <div>• <strong>Ккр.і</strong> - Критична інфраструктура</div>
                          <div>• <strong>Кд</strong> - Обслуговування державних доріг (1.16)</div>
                        </CardContent>
                      </Card>
                    </div>

                    <VideoPlaceholder 
                      title="Коефіцієнти розрахунку"
                      description="Огляд застосованих коефіцієнтів та їх вплив на результат"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* БЛОК 3 */}
          <TabsContent value="block3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  Блок 3: Планування ремонтів
                </CardTitle>
                <CardDescription>
                  7-крокова система аналізу та планування ремонтних робіт
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Крок 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <h3 className="text-lg font-semibold">Введення даних про стан доріг</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Створіть базу даних секцій доріг з наступними параметрами:
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>• Найменування ділянки</div>
                        <div>• Протяжність (км)</div>
                        <div>• Категорія дороги (I-V)</div>
                        <div>• Інтенсивність руху (авт/добу)</div>
                        <div>• Модуль пружності (МПа)</div>
                        <div>• Показники рівності (м/км, см/км)</div>
                        <div>• Глибина колії (мм)</div>
                        <div>• Коефіцієнт зчеплення</div>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Підказка:</strong> Використовуйте функцію "Імпорт Excel" для швидкого завантаження 
                        даних або "Тестові дані" для ознайомлення з системою.
                      </AlertDescription>
                    </Alert>

                    <VideoPlaceholder 
                      title="Створення бази даних доріг"
                      description="Ручне введення та імпорт даних з Excel"
                    />
                  </div>
                </div>

                {/* Крок 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-semibold">Розрахунок коефіцієнтів відповідності</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Система автоматично розраховує коефіцієнти відповідності нормативам згідно з методикою:
                    </p>

                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="font-semibold mb-1">Коефіцієнт інтенсивності (п. 4.2.2.1)</div>
                          <div className="text-sm text-gray-600 font-mono">Кі = Nmax / Nфакт</div>
                          <div className="text-xs text-gray-500 mt-1">Норма: ≥ 1.0</div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="font-semibold mb-1">Коефіцієнт міцності (п. 4.2.2.2)</div>
                          <div className="text-sm text-gray-600 font-mono">Км = Eфакт / Eпотр</div>
                          <div className="text-xs text-gray-500 mt-1">Норма: залежить від категорії</div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="pt-4">
                          <div className="font-semibold mb-1">Коефіцієнт рівності (п. 4.2.2.3)</div>
                          <div className="text-sm text-gray-600 font-mono">Кр = IRImax / IRIфакт</div>
                          <div className="text-xs text-gray-500 mt-1">Норма: ≥ 1.0</div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="pt-4">
                          <div className="font-semibold mb-1">Коефіцієнт колійності (п. 4.2.2.4)</div>
                          <div className="text-sm text-gray-600 font-mono">Ккол = hmax / hфакт</div>
                          <div className="text-xs text-gray-500 mt-1">Норма: ≥ 1.0</div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                          <div className="font-semibold mb-1">Коефіцієнт зчеплення (п. 4.2.2.5)</div>
                          <div className="text-sm text-gray-600 font-mono">Кзч = φфакт / φпотр</div>
                          <div className="text-xs text-gray-500 mt-1">Норма: ≥ 1.0 (φпотр = 0.35)</div>
                        </CardContent>
                      </Card>
                    </div>

                    <VideoPlaceholder 
                      title="Розрахунок коефіцієнтів"
                      description="Автоматичний розрахунок показників відповідності"
                    />
                  </div>
                </div>

                {/* Крок 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Визначення виду робіт</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      На основі розрахованих коефіцієнтів система автоматично призначає вид робіт:
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-red-900">Реконструкція</div>
                          <div className="text-sm text-red-700">Коефіцієнт інтенсивності &lt; 1.0</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-orange-900">Капітальний ремонт</div>
                          <div className="text-sm text-orange-700">Коефіцієнт міцності &lt; мінімального для категорії</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-blue-900">Поточний ремонт</div>
                          <div className="text-sm text-blue-700">Коефіцієнти рівності, колійності або зчеплення &lt; 1.0</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-green-900">Не потрібно</div>
                          <div className="text-sm text-green-700">Всі коефіцієнти відповідають нормам</div>
                        </div>
                      </div>
                    </div>

                    <VideoPlaceholder 
                      title="Визначення виду робіт"
                      description="Автоматичне призначення типу ремонту"
                    />
                  </div>
                </div>

                {/* Крок 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Налаштування показників вартості</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Встановіть або перевірте усереднені показники вартості робіт (млн грн/км):
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Вид робіт</th>
                            <th className="border p-2 text-center">I кат.</th>
                            <th className="border p-2 text-center">II кат.</th>
                            <th className="border p-2 text-center">III кат.</th>
                            <th className="border p-2 text-center">IV кат.</th>
                            <th className="border p-2 text-center">V кат.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 font-semibold">Реконструкція</td>
                            <td className="border p-2 text-center">60.0</td>
                            <td className="border p-2 text-center">50.0</td>
                            <td className="border p-2 text-center">35.0</td>
                            <td className="border p-2 text-center">28.0</td>
                            <td className="border p-2 text-center">22.0</td>
                          </tr>
                          <tr>
                            <td className="border p-2 font-semibold">Капітальний ремонт</td>
                            <td className="border p-2 text-center">18.0</td>
                            <td className="border p-2 text-center">15.0</td>
                            <td className="border p-2 text-center">12.0</td>
                            <td className="border p-2 text-center">9.0</td>
                            <td className="border p-2 text-center">7.0</td>
                          </tr>
                          <tr>
                            <td className="border p-2 font-semibold">Поточний ремонт</td>
                            <td className="border p-2 text-center">3.5</td>
                            <td className="border p-2 text-center">2.5</td>
                            <td className="border p-2 text-center">1.8</td>
                            <td className="border p-2 text-center">1.2</td>
                            <td className="border p-2 text-center">0.9</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Показники можна редагувати відповідно до регіональних особливостей та поточних ринкових умов.
                      </AlertDescription>
                    </Alert>

                    <VideoPlaceholder 
                      title="Налаштування вартості"
                      description="Редагування показників вартості робіт"
                    />
                  </div>
                </div>

                {/* Крок 5 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      5
                    </div>
                    <h3 className="text-lg font-semibold">Розрахунок орієнтовної вартості</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Система розраховує вартість з урахуванням:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Базові параметри:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Категорія дороги</li>
                          <li>• Протяжність ділянки</li>
                          <li>• Вид робіт</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Поправочні коефіцієнти:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Міжнародна дорога: +15%</li>
                          <li>• Оборонна дорога: +10%</li>
                          <li>• Освітлення: +5%</li>
                          <li>• Регіональний коефіцієнт</li>
                        </ul>
                      </div>
                    </div>

                    <VideoPlaceholder 
                      title="Розрахунок вартості робіт"
                      description="Обчислення орієнтовної вартості для кожної секції"
                    />
                  </div>
                </div>

                {/* Крок 6 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      6
                    </div>
                    <h3 className="text-lg font-semibold">Економічний аналіз (ENPV, BCR, EIRR)</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Заповніть вихідні дані для розрахунку економічної ефективності проекту:
                    </p>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold">Основні показники (32 поля):</h4>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div>• Початок виконання робіт</div>
                        <div>• Вартість робіт по роках</div>
                        <div>• Інтенсивність руху</div>
                        <div>• Склад транспортного потоку</div>
                        <div>• Витрати на експлуатацію ТЗ</div>
                        <div>• Економія часу пасажирів</div>
                        <div>• Показники безпеки руху</div>
                        <div>• Екологічні параметри</div>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-900">Розраховуються показники:</AlertTitle>
                      <AlertDescription className="text-blue-800">
                        <ul className="mt-2 space-y-1">
                          <li>• <strong>ENPV</strong> - Економічна чиста приведена вартість</li>
                          <li>• <strong>BCR</strong> - Співвідношення вигід до витрат</li>
                          <li>• <strong>EIRR</strong> - Економічна норма дохідності</li>
                          <li>• <strong>Термін окупності</strong> та інші показники</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <VideoPlaceholder 
                      title="Економічний аналіз"
                      description="Заповнення даних та розрахунок показників ефективності"
                    />
                  </div>
                </div>

                {/* Крок 7 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      7
                    </div>
                    <h3 className="text-lg font-semibold">Ранжування та планування з бюджетом</h3>
                  </div>
                  
                  <div className="ml-11 space-y-4">
                    <p className="text-gray-700">
                      Остання сторінка виконує ранжування об'єктів та планування з урахуванням бюджету з Блоку 1:
                    </p>

                    <div className="space-y-3">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4 space-y-2">
                          <h4 className="font-semibold">Ранжування об'єктів</h4>
                          <p className="text-sm text-gray-600">
                            Секції автоматично сортуються за показниками ENPV, BCR, EIRR або пріоритетом.
                            Оберіть критерій сортування зі списку.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4 space-y-2">
                          <h4 className="font-semibold">Інтеграція з Блоком 1</h4>
                          <p className="text-sm text-gray-600">
                            Якщо дані з Блоку 1 передані, система автоматично розподіляє бюджет 
                            (Q₁ + Q₂) між проектами за пріоритетами.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4 space-y-2">
                          <h4 className="font-semibold">Розподіл бюджету</h4>
                          <p className="text-sm text-gray-600">
                            Автоматичний розподіл на: Поточний ремонт, Капітальний ремонт, 
                            Реконструкція з відображенням % використання бюджету.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <VideoPlaceholder 
                      title="Ранжування та планування"
                      description="Сортування об'єктів та розподіл бюджету"
                    />

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Експорт результатів</AlertTitle>
                      <AlertDescription className="text-green-800">
                        Після завершення планування ви можете завантажити детальний звіт у форматі 
                        Excel з усіма розрахунками, ранжуванням та рекомендаціями.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Підсумок Блоку 3 */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                  Підсумок роботи з Блоком 3
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-purple-600">7</div>
                    <div className="text-sm text-gray-600">Кроків</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">5+</div>
                    <div className="text-sm text-gray-600">Коефіцієнтів</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-green-600">3</div>
                    <div className="text-sm text-gray-600">Показники ефективності</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Результати Блоку 3:</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Повна діагностика стану доріг</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Визначення виду необхідних робіт</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Розрахунок орієнтовної вартості</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Економічне обґрунтування проектів</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Ранжування за пріоритетністю</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Оптимальний розподіл бюджету</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Додаткові ресурси */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-6 w-6" />
              Додаткові матеріали
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 justify-start">
                <div className="flex items-start gap-3 w-full">
                  <FileSpreadsheet className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Excel шаблон для Блоку 2</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Шаблон для завантаження даних про дороги регіону
                    </div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start">
                <div className="flex items-start gap-3 w-full">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Excel шаблон для Блоку 3</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Шаблон для масового імпорту секцій доріг
                    </div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start">
                <div className="flex items-start gap-3 w-full">
                  <BookOpen className="h-8 w-8 text-purple-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Методичні рекомендації</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Повний документ з описом методики розрахунків
                    </div>
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start">
                <div className="flex items-start gap-3 w-full">
                  <Play className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Відео-уроки</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Детальні відео-інструкції по кожному блоку
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Часті питання */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6" />
              Часті питання (FAQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => setExpandedSection(expandedSection === 'faq1' ? null : 'faq1')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Як почати роботу з системою?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq1' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq1' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Рекомендуємо почати з Блоку 1 для визначення загального бюджету. 
                    Використовуйте кнопку "Тестові дані" для швидкого ознайомлення з функціоналом. 
                    Після розрахунку Q₁ та Q₂ передайте дані в Блок 3 для комплексного планування.
                  </div>
                )}
              </button>

              <button
                onClick={() => setExpandedSection(expandedSection === 'faq2' ? null : 'faq2')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Які формати файлів підтримуються?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq2' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq2' && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Імпорт:</strong> Excel (.xlsx, .xls)<br />
                    <strong>Експорт:</strong> Excel (.xlsx), CSV (.csv)<br />
                    <strong>Документи:</strong> PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG (до 10 МБ)
                  </div>
                )}
              </button>

              <button
                onClick={() => setExpandedSection(expandedSection === 'faq3' ? null : 'faq3')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Чи зберігаються дані між сеансами?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq3' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq3' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Так, система автоматично зберігає дані в локальному сховищі браузера. 
                    Кожен розрахунок має унікальний ідентифікатор сесії. Для повного збереження 
                    рекомендуємо використовувати функції експорту результатів.
                  </div>
                )}
              </button>

              <button
                onClick={() => setExpandedSection(expandedSection === 'faq4' ? null : 'faq4')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Що робити, якщо розрахунок виконується довго?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq4' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq4' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Для великої кількості секцій доріг (понад 500) система показує прогрес-бар. 
                    Якщо розрахунок зависає, використовуйте кнопку "Зупинити" та перевірте коректність 
                    введених даних. Рекомендуємо обробляти дані пакетами по 100-200 секцій.
                  </div>
                )}
              </button>

              <button
                onClick={() => setExpandedSection(expandedSection === 'faq5' ? null : 'faq5')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Як інтерпретувати показники ENPV, BCR, EIRR?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq5' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq5' && (
                  <div className="mt-3 text-sm text-gray-600 space-y-2">
                    <div><strong>ENPV (Economic NPV)</strong> - чим більше, тим краще. Позитивне значення означає економічну доцільність.</div>
                    <div><strong>BCR (Benefit-Cost Ratio)</strong> - має бути &gt; 1.0. Значення &gt; 1.5 вказує на високу ефективність.</div>
                    <div><strong>EIRR (Economic IRR)</strong> - має перевищувати ставку дисконтування (зазвичай 5%). Чим вище, тим краще.</div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setExpandedSection(expandedSection === 'faq6' ? null : 'faq6')}
                className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Чи можна редагувати коефіцієнти після розрахунку?</span>
                  <ChevronRight className={`h-5 w-5 transition-transform ${expandedSection === 'faq6' ? 'rotate-90' : ''}`} />
                </div>
                {expandedSection === 'faq6' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Так, на кожній сторінці є кнопка "Редагувати". Після внесення змін натисніть 
                    "Зберегти зміни" та "Перерахувати" для оновлення результатів. Система автоматично 
                    перевірить валідність даних перед збереженням.
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Контактна інформація */}
        <Card className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Технічна підтримка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-700">
                Якщо у вас виникли питання або проблеми при роботі з системою:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Документація</h4>
                  <p className="text-sm text-gray-600">
                    Повна методика та додаткові матеріали доступні в розділі "Додаткові матеріали"
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Зворотній зв'язок</h4>
                  <p className="text-sm text-gray-600">
                    Використовуйте кнопку "Повідомити про помилку" для звіту про технічні проблеми
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Фінальне демо-відео */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-6 w-6 text-red-600" />
              Повний робочий цикл системи
            </CardTitle>
            <CardDescription>
              Детальна демонстрація роботи з усіма трьома блоками від початку до кінця
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoPlaceholder 
              title="Комплексна демонстрація системи"
              description="Від введення даних до формування звіту (15-20 хв)"
            />
            
            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">00:00 - 05:00</div>
                <div className="text-blue-700">Блок 1: Бюджет</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">05:00 - 10:00</div>
                <div className="text-green-700">Блок 2: Утримання</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">10:00 - 20:00</div>
                <div className="text-purple-700">Блок 3: Планування</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Останні поради */}
        <Alert className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-300">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-lg">Поради для ефективної роботи</AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <span>Починайте з малої кількості секцій для ознайомлення з системою</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <span>Використовуйте функцію "Тестові дані" для швидкого старту</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <span>Регулярно зберігайте результати та експортуйте звіти</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">4</Badge>
                <span>Перевіряйте валідацію даних перед розрахунками</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">5</Badge>
                <span>Використовуйте інтеграцію між блоками для комплексного планування</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default InstructionsPage;