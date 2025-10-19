import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  AlertCircle, 
  CheckCircle2,
  Calculator,
  TrendingUp,
  Settings,
  Info
} from 'lucide-react';

const UserManual: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <div>
              <CardTitle className="text-3xl">Інструкція з використання системи</CardTitle>
              <CardDescription className="text-lg mt-2">
                Розрахунок дорожнього фінансування та планування ремонтів
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Загальний огляд */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">📋 Загальний огляд системи</AlertTitle>
        <AlertDescription className="text-blue-800">
          Система складається з трьох основних розділів:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Розрахунок бюджетного фінансування доріг - </strong> Визначення загального обсягу бюджетного фінансування</li>
            <li><strong>Експлуатаційне утримання доріг - </strong> Розрахунок нормативів та розподіл коштів по регіонах</li>
            <li><strong>Планування ремонтів автомобільних доріг - </strong> Технічна оцінка доріг та планування ремонтів</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Основні вкладки */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Огляд</TabsTrigger>
          <TabsTrigger value="budget">Розрахунок бюджетного фінансування доріг</TabsTrigger>
          <TabsTrigger value="maintenance">Експлуатаційне утримання доріг</TabsTrigger>
          <TabsTrigger value="repairs">Планування ремонтів автомобільних доріг</TabsTrigger>
        </TabsList>

        {/* ВКЛАДКА: Огляд */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Рекомендована послідовність роботи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                <Badge className="bg-blue-600 text-white text-lg">1</Badge>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Загальний бюджет</h3>
                  <p className="text-gray-700">Визначення обсягу фінансування для державних та місцевих доріг</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                <Badge className="bg-green-600 text-white text-lg">2</Badge>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Розподіл по регіонах</h3>
                  <p className="text-gray-700">Розрахунок нормативів та коефіцієнтів для кожної області України</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg">
                <Badge className="bg-purple-600 text-white text-lg">3</Badge>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Планування ремонтів</h3>
                  <p className="text-gray-700">Технічна оцінка доріг, розрахунок вартості та економічної ефективності</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-900">⚠️ Важливі примітки</AlertTitle>
            <AlertDescription className="text-yellow-800 space-y-2">
              <p>• <strong>Збереження даних:</strong> дані зберігаються в браузері. При закритті браузера можуть втратитися.</p>
              <p>• <strong>Експорт:</strong> регулярно експортуйте результати в Excel для збереження.</p>
              <p>• <strong>Файли:</strong> максимальний розмір завантажуваних файлів - 10 MB.</p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* ВКЛАДКА: Бюджетне фінансування */}
        <TabsContent value="budget" className="space-y-6">
          <Card className="border-2 border-blue-500">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-blue-600" />
                Розрахунок бюджетного фінансування доріг
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Розрахунок для державних доріг (Q₁)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Заповнення вихідних даних:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Відкрийте таблицю "Визначення обсягу бюджетного фінансування розвитку та утримання автомобільних доріг державного значення"</li>
                  <li>Для кожного показника (Qдз, Qпп, Qміжн, QІАС, QДПП) введіть:
                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                      <li><strong>Обсяг</strong> (тис.грн.) у відповідне поле</li>
                      <li><strong>Нормативний документ</strong> - назву документа</li>
                      <li><strong>Файли</strong> - натисніть "Додати файл" для прикріплення документів (PDF, DOC, XLS, до 10MB)</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>💡 Підказка:</strong> Наведіть курсор на іконку ℹ️ поруч з назвою показника, щоб побачити детальний опис
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Розрахунок Q₁:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть кнопку <Badge className="bg-green-600">Розрахувати</Badge></li>
                  <li>Результат відобразиться у зеленій панелі: "Результат для державних доріг: XXX тис. грн"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Розрахунок для місцевих доріг (Q₂)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Заповнення вихідних даних:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Прокрутіть до таблиці "Визначення обсягу бюджетного фінансування розвитку та утримання автомобільних доріг місцевого значення"</li>
                  <li>Введіть значення показника <strong>Qмз</strong> (обов'язково!)</li>
                  <li>За потреби додайте нормативний документ та файли</li>
                </ul>
              </div>

              <Alert className="bg-red-50 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>⚠️ ВАЖЛИВО:</strong> Поле Qмз є обов'язковим для розрахунку Q₂
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Зведення результатів та передача даних</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Перегляд зведених результатів:</h3>
                <p className="text-gray-700 mb-2">Після розрахунку обох показників з'явиться панель "Сводка результатів":</p>
                <div className="grid grid-cols-3 gap-4 my-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">Q₁</div>
                    <div className="text-sm text-gray-600">Державні дороги</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">Q₂</div>
                    <div className="text-sm text-gray-600">Місцеві дороги</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center border-2 border-purple-300">
                    <div className="text-2xl font-bold text-purple-600">Q₁ + Q₂</div>
                    <div className="text-sm text-gray-600">Загальний бюджет</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Збереження результатів:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть <Badge className="bg-green-600">💾 Зберегти результати</Badge></li>
                  <li>З'явиться підтвердження: "✅ Результати успішно збережені"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ВКЛАДКА: Експлуатаційне утримання */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Експлуатаційне утримання доріг
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вибір типу доріг</CardTitle>
              <CardDescription>
                Оберіть тип доріг для розрахунку. Розрахунки та коефіцієнти відрізняються для різних типів доріг.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-5xl">🏛️</div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-blue-900">Державного значення</h3>
                      <p className="text-blue-700 mt-1">Для державних доріг</p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-300">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Для державних доріг використовуються:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>K<sub>д</sub> = 1.16 (коефіцієнт обслуговування держ. доріг)</li>
                      <li>9 коригувальних коефіцієнтів (гірська місцевість, інтенсивність, євромережа, МПП та ін.)</li>
                      <li>Базовий норматив: 604.761 тис. грн/км (для II категорії)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <div className="p-6 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-5xl">🏘️</div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-green-900">Місцевого значення</h3>
                      <p className="text-green-700 mt-1">Для місцевих доріг</p>
                    </div>
                  </div>
                </div>

                <Alert className="bg-green-50 border-green-300">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Для місцевих доріг використовуються:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>3 коригувальних коефіцієнти (гірська місцевість, умови експлуатації, інтенсівність)</li>
                      <li>Базовий норматив: 360.544 тис. грн/км (для II категорії)</li>
                      <li>Спрощена методика розрахунку</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <Alert className="bg-red-50 border-red-300 mt-6">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-900">⚠️ ВАЖЛИВО</AlertTitle>
                <AlertDescription className="text-red-800">
                  Розрахунки та коефіцієнти відрізняються для різних типів доріг! 
                  В інтерфейсі системи використовуйте кнопки вибору для перемикання між типами.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Завантаження даних по областях</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Підготовка Excel файлу:</h3>
                <p className="text-gray-700 mb-2">Шаблон повинен містити стовпці:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Найменування області</li>
                  <li>Протяжність по категоріях (I, II, III, IV, V)</li>
                  <li>Загальна протяжність</li>
                  <li>Протяжність з різною інтенсивністю (15-20, 20-30, 30+ тис авт/добу)</li>
                  <li>Додаткові показники (євродороги, МПП, освітлення, нещодавно відремонтовані, критична інфраструктура)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Завантаження файлу:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть кнопку <Badge className="bg-blue-600">Завантажити таблицю</Badge></li>
                  <li>Оберіть файл Excel (.xlsx або .xls)</li>
                  <li>Дочекайтеся повідомлення: "✓ Успішно завантажено дані для XX областей"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Розрахунок обсягу фінансування</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Запуск розрахунку:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть <Badge className="bg-green-600">Розрахувати обсяг коштів</Badge></li>
                  <li>Дочекайтеся завершення (індикатор "Розраховуємо...")</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Перегляд коефіцієнтів:</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Для державних доріг:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>• K<sub>д</sub> = 1.16 (обслуговування держ. доріг)</div>
                      <div>• K<sub>г</sub> (гірська місцевість)</div>
                      <div>• K<sub>уе</sub> (умови експлуатації)</div>
                      <div>• K<sub>інт.д</sub> (інтенсивність руху)</div>
                      <div>• K<sub>е.д</sub> (європейська мережа)</div>
                      <div>• K<sub>мпп.д</sub> (міжнародні пункти пропуску)</div>
                      <div>• K<sub>осв</sub> (освітлення)</div>
                      <div>• K<sub>рем</sub> (нещодавно відремонтовані)</div>
                      <div>• K<sub>кр.і</sub> (критична інфраструктура)</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Для місцевих доріг:</h4>
                    <div className="text-sm text-green-800">
                      • K<sub>г</sub> (гірська місцевість) <br/>
                      • K<sub>уе</sub> (умови експлуатації) <br/>
                      • K<sub>інт.м</sub> (інтенсивність руху)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">3. Аналіз таблиці фінансування:</h3>
                <p className="text-gray-700 mb-2">Детальна таблиця містить:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Протяжність доріг по категоріях для кожної області</li>
                  <li>Мінімальну потребу в фінансових ресурсах (тис. грн)</li>
                  <li>Загальну суму для кожної області</li>
                  <li>Відсоток від загального бюджету</li>
                  <li>Підсумковий рядок "ВСЬОГО ПО УКРАЇНІ"</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">4. Статистика:</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">XX</div>
                    <div className="text-sm text-gray-600">Областей проаналізовано</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-700">XXXX км</div>
                    <div className="text-sm text-gray-600">Загальна довжина</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-700">XX.XX млрд</div>
                    <div className="text-sm text-gray-600">Загалом (грн)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Експорт результатів</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Завантаження Excel файлу:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть <Badge className="bg-purple-600">Завантажити результати</Badge></li>
                  <li>Файл містить два аркуші:
                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                      <li><strong>Аркуш 1:</strong> "Коефіцієнти"</li>
                      <li><strong>Аркуш 2:</strong> "Фінансування"</li>
                    </ul>
                  </li>
                  <li>Назва файлу автоматично формується з датою</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ВКЛАДКА: Планування ремонтів */}
        <TabsContent value="repairs" className="space-y-6">
          <Card className="border-2 border-purple-500">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-600" />
                Планування ремонтів автомобільних доріг
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle>Визначення показників транспортно-експлуатаційного стану</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Додавання доріг для аналізу</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть <Badge variant="outline">+ Додати рядок</Badge></li>
                  <li>Заповніть основні характеристики:
                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                      <li><strong>Найменування</strong> (наприклад, "М-06")</li>
                      <li><strong>Протяжність</strong> (км)</li>
                      <li><strong>Категорія</strong> (I-V)</li>
                    </ul>
                  </li>
                  <li>Заповніть технічні показники:
                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                      <li><strong>Інтенсивність</strong> (авт./добу)</li>
                      <li><strong>Модуль пружності</strong> (МПа)</li>
                      <li><strong>Рівність</strong> (м/км)</li>
                      <li><strong>Глибина колії</strong> (мм)</li>
                      <li><strong>Коеф. зчеплення</strong> (0-1)</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Виконання розрахунку</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Перевірте, що всі поля заповнені</li>
                  <li>Натисніть <Badge className="bg-green-600">Розрахувати</Badge></li>
                  <li>Дочекайтеся автоматичної передачі даних в Redux Store</li>
                  <li>Побачите повідомлення: "✓ Дані успішно збережені"</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Аналіз результатів</h3>
                <p className="text-gray-700 mb-3">Для кожної дороги розраховуються коефіцієнти:</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div className="font-semibold text-blue-900">Коеф. інтенсивності</div>
                    <div className="text-sm text-blue-700">Співвідношення розрахункової та фактичної інтенсивності</div>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-green-50">
                    <div className="font-semibold text-green-900">Коеф. міцності</div>
                    <div className="text-sm text-green-700">Для нежорсткого та жорсткого покриття</div>
                  </div>
                  <div className="p-3 border-l-4 border-purple-500 bg-purple-50">
                    <div className="font-semibold text-purple-900">Коеф. рівності</div>
                    <div className="text-sm text-purple-700">Стан рівності покриття</div>
                  </div>
                  <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                    <div className="font-semibold text-orange-900">Коеф. колійності</div>
                    <div className="text-sm text-orange-700">Наявність колійності</div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Кольорове кодування:</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-1 mt-2">
                      <div>🟢 <strong>Зелений</strong> (≥ норми) - показник в нормі</div>
                      <div>🟡 <strong>Жовтий</strong> (≥ 80% норми) - наближається до граничного</div>
                      <div>🔴 <strong>Червоний</strong> (&lt; 80% норми) - нижче допустимого</div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Автоматичне визначення виду робіт:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge className="bg-green-100 text-green-800 text-center py-2">🟢 Не потрібно</Badge>
                    <Badge className="bg-blue-100 text-blue-800 text-center py-2">🔵 Поточний ремонт</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 text-center py-2">🟡 Капітальний ремонт</Badge>
                    <Badge className="bg-red-100 text-red-800 text-center py-2">🔴 Реконструкція</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle>Показники вартості дорожніх робіт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Показники вартості по категоріях (тис. грн/км):</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Реконструкція:</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {['30,000', '25,000', '20,000', '15,000', '10,000'].map((val, i) => (
                        <div key={i} className="text-center font-mono text-red-800">{val}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Капітальний ремонт:</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {['15,000', '12,000', '10,000', '7,000', '5,000'].map((val, i) => (
                        <div key={i} className="text-center font-mono text-yellow-800">{val}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Поточний ремонт:</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {['2,000', '1,500', '1,200', '1,000', '800'].map((val, i) => (
                        <div key={i} className="text-center font-mono text-blue-800">{val}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  💡 Ці показники можна редагувати за потреби. Для повернення до базових значень натисніть "Скинути до базових"
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-lg mb-3">Розрахунок орієнтовної вартості:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Натисніть <Badge className="bg-green-600">Розрахувати вартість</Badge></li>
                  <li>Система автоматично:
                    <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                      <li>Визначає вид робіт для кожної дороги</li>
                      <li>Застосовує відповідні показники вартості</li>
                      <li>Ураховує протяжність дороги</li>
                      <li>Розраховує загальну вартість</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle>Визначення ефективності (ENPV)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Заповнення вихідних даних (31 параметр):</h3>
                
                <Alert className="bg-red-50 border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-900">⚠️ ОБОВ'ЯЗКОВО</AlertTitle>
                  <AlertDescription className="text-red-800">
                    Поле №3 "Вартість реконструкції/капітального ремонту" є обов'язковим для розрахунку!
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 mt-4">
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-900">Основні параметри (рядки 1-7):</h4>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• Початок робіт (рік)</li>
                      <li>• Вартість робіт (млн грн) - обов'язково!</li>
                      <li>• Термін служби (років)</li>
                      <li>• Інтенсивність руху - автозаповнюється ✓</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900">Параметри трафіку (рядок 8):</h4>
                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                      <li>• % легкових автомобілів</li>
                      <li>• % вантажних (легких)</li>
                      <li>• % автобусів</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-yellow-900">Витрати на експлуатацію (рядки 11-12):</h4>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• Витрати ДО реконструкції</li>
                      <li>• Витрати ПІСЛЯ реконструкції</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-900">Витрати на утримання (рядки 30-31):</h4>
                    <ul className="text-sm text-orange-800 mt-2 space-y-1">
                      <li>• Витрати ДО робіт (млн грн/рік)</li>
                      <li>• Витрати ПІСЛЯ робіт (млн грн/рік)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Аналіз результатів ENPV:</h3>
                
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300 text-center">
                    <div className="text-2xl font-bold text-green-700">+XX.XX</div>
                    <div className="text-xs text-gray-600 mt-1">ENPV (млн грн)</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300 text-center">
                    <div className="text-2xl font-bold text-yellow-700">XX.X%</div>
                    <div className="text-xs text-gray-600 mt-1">EIRR</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300 text-center">
                    <div className="text-2xl font-bold text-blue-700">X.XX</div>
                    <div className="text-xs text-gray-600 mt-1">BCR</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300 text-center">
                    <div className="text-2xl font-bold text-purple-700">X.X</div>
                    <div className="text-xs text-gray-600 mt-1">Окупність (років)</div>
                  </div>
                </div>

                <Alert className="bg-green-50 border-green-300 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Критерії економічної доцільності:</AlertTitle>
                  <AlertDescription className="text-green-800">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>ENPV &gt; 0 (позитивна чиста вартість)</li>
                      <li>BCR &gt; 1.0 (вигоди перевищують витрати)</li>
                      <li>EIRR &gt; 10% (бажано)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Детальний розрахунок по роках:</h3>
                
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Ключові стовпці таблиці:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>• Рік - календарний період</div>
                    <div>• Інтенсивність - з урахуванням зростання</div>
                    <div>• Капітальні витрати - тільки рік 0</div>
                    <div>• Витрати на утримання - щорічні</div>
                    <div>• Економічний ефект - вигоди мінус витрати</div>
                    <div>• <strong>ENPV</strong> - накопичена (ключовий!)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-indigo-50">
              <CardTitle>Рангування об'єктів дорожніх робіт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">⚡ Автоматичний розрахунок</AlertTitle>
                <AlertDescription className="text-blue-800">
                  При відкритті вкладки система автоматично розраховує рангування для всіх доріг з попередньої вкладки
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold text-lg mb-3">Критерії ранжування:</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <strong className="text-green-900">1. BCR &gt; 1</strong>
                    <p className="text-sm text-green-700">Спочатку економічно доцільні проекти</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <strong className="text-blue-900">2. ENPV (від більшого до меншого)</strong>
                    <p className="text-sm text-blue-700">Потім за економічним ефектом</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Топ-3 проекти відзначаються:</h3>
                <div className="flex gap-4 justify-center my-4">
                  <div className="text-center">
                    <div className="text-4xl">🥇</div>
                    <div className="text-sm font-semibold mt-1">1 місце</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">🥈</div>
                    <div className="text-sm font-semibold mt-1">2 місце</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl">🥉</div>
                    <div className="text-sm font-semibold mt-1">3 місце</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Розподіл за видами робіт:</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-3xl mb-2">🔵</div>
                    <div className="font-semibold text-blue-900">Поточний ремонт</div>
                    <div className="text-2xl font-bold text-blue-700 mt-2">XX</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="text-3xl mb-2">🟡</div>
                    <div className="font-semibold text-yellow-900">Капітальний ремонт</div>
                    <div className="text-2xl font-bold text-yellow-700 mt-2">XX</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-3xl mb-2">🔴</div>
                    <div className="font-semibold text-red-900">Реконструкція</div>
                    <div className="text-2xl font-bold text-red-700 mt-2">XX</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Секція з технічними вимогами */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Технічні вимоги та поради</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Системні вимоги:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Chrome 90+, Firefox 88+, Safari 14+</li>
                <li>• Роздільна здатність: мін. 1366x768</li>
                <li>• Підключення до інтернету</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900">Типові помилки:</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>"Необхідно заповнити поля" - перевірте обов'язкові поля</li>
                <li>"Немає даних" - виконайте розрахунки на попередній вкладці</li>
                <li>"Помилка завантаження" - перевірте формат файлу</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Глосарій */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Глосарій термінів</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { term: 'ENPV', desc: 'Економічна чиста приведена вартість' },
              { term: 'EIRR', desc: 'Економічна внутрішня норма дохідності' },
              { term: 'BCR', desc: 'Співвідношення вигід до витрат' },
              { term: 'Q₁', desc: 'Обсяг фінансування державних доріг' },
              { term: 'Q₂', desc: 'Обсяг фінансування місцевих доріг' },
              { term: 'ЕУ', desc: 'Експлуатаційне утримання' }
            ].map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-gray-900">{item.term}</div>
                <div className="text-sm text-gray-700">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManual;