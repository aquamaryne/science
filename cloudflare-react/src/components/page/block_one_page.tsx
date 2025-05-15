import React, { useState } from 'react';
import {
  type BudgetItem,
  initialStateRoadItems,
  initialLocalRoadItems,
  calculateQ1,
  calculateQ2
} from '../../modules/block_one';

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";

// Модифицированные данные с переносом на новую строку
const modifyItemsWithLineBreak = (items: BudgetItem[]): BudgetItem[] => {
  return items.map(item => {
    // Делим название на части, учитывая специфические места разделения
    let modifiedName = item.name;

    if (item.id === "Qдз") {
      modifiedName = "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення нового будівництва, реконструкції, капітального та поточного ремонтів\nі утримання автомобільних доріг загального користування державного значення";
    } 
    else if (item.id === "Qпп") {
      modifiedName = "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення заходів з розвитку, будівництва, ремонту, облаштування, модернізації\nта утримання пунктів пропуску через державний кордон для автомобільного сполучення";
    } 
    else if (item.id === "Qміжн") {
      modifiedName = "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення проведення конкурсів і підготовку договорів щодо виконання робіт з нового будівництва, реконструкції, ремонту\nі утримання автомобільних доріг загального користування за рахунок коштів міжнародних фінансових організацій, інших кредиторів та інвесторів, співфінансування зазначених робіт згідно з відповідними договорами, здійснення контролю за їх виконанням і прийняття автомобільних доріг в експлуатацію";
    }
    else if (item.id === "QІАС") {
      modifiedName = "Обсяг бюджетних коштів, що спрямовується на фінансове забезпечення заходів зі створення та функціонування інформаційно-аналітичної системи дорожнього господарства,\nу тому числі утримання відповідних бюджетних установ, що забезпечують її функціонування";
    }
    else if (item.id === "QДПП") {
      modifiedName = "Обсяг бюджетних коштів, що спрямовується на здійснення виплат приватному партнеру/концесіонеру плати за експлуатаційну готовність автомобільної дороги загального користування державного значення\nта інших виплат у порядку та на умовах, передбачених договором, укладеним у рамках державно-приватного партнерства, у тому числі концесійним договором";
    }

    return {
      ...item,
      name: modifiedName
    };
  });
};

// Компонент для блока 1: Расчет объема финансирования дорог государственного значения
const StateRoadFundingBlock = () => {
  const [stateRoadBudget, setStateRoadBudget] = useState<BudgetItem[]>(modifyItemsWithLineBreak(initialStateRoadItems));
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

  // Функция расчета
  const handleCalculate = () => {
    // Передаем исходные данные без переноса строк для расчета
    const originalStateRoadItems = initialStateRoadItems.map((original, index) => {
      return {
        ...original,
        value: stateRoadBudget[index].value,
        normativeDocument: stateRoadBudget[index].normativeDocument
      };
    });

    const qdzValue = originalStateRoadItems.find(item => item.id === "Qдз")?.value;
    
    if (qdzValue === null || qdzValue === undefined) {
      alert("Необхідно заповнити значення Qдз!");
      return;
    }

    const result = calculateQ1(originalStateRoadItems);
    setQ1Result(result);
  };

  return (
    <Card className="mb-8 w-full border-gray-300 shadow-sm">
      <CardHeader className="bg-gray-100 border-b border-gray-200">
        <CardTitle className="text-xl font-bold text-gray-800">
          Етап 1.1 Блоку 1 Визначення загального обсягу бюджетних коштів Q<sub>1</sub>, що спрямовується на фінансове забезпечення заходів з розвитку та утримання автомобільних доріг загального користування державного значення (п.2.1.1 Методики)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-3/5 bg-gray-100">*Назва показника нехай підсвічується при наведені на сам показник</TableHead>
                <TableHead className="w-16 bg-gray-100">Показник</TableHead>
                <TableHead className="w-32 bg-gray-100">Обсяг, тис.грн.</TableHead>
                <TableHead className="bg-gray-100">Нормативний документ, з якого взяті дані</TableHead>
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
                        <TooltipContent className="max-w-md bg-gray-800 text-white">
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
                      className="w-full border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.normativeDocument || ""}
                      onChange={(e) => handleDocumentChange(item.id, e.target.value)}
                      placeholder="Документ"
                      className="w-full border-gray-300"
                    />
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-2 w-full">
          <div className="text-lg font-semibold text-gray-100">
            Розрахунок Q<sub>1</sub> = Q<sub>дз</sub> - Q<sub>пп</sub> - Q<sub>міжн</sub> - Q<sub>ІАС</sub> - Q<sub>н</sub> - Q<sub>лік</sub> - Q<sub>вп</sub> - Q<sub>упр</sub> - Q<sub>ДПП</sub>
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="mt-2 w-36 bg-gray-800 hover:bg-gray-700 text-white py-3 text-xl h-auto"
        >
          Розрахувати
        </Button>

        {q1Result !== null && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md w-full border border-gray-300">
            <div className="font-bold text-xl text-center text-gray-800">РЕЗУЛЬТАТ!</div>
            <div className="text-lg mt-2 text-center text-gray-800">Q<sub>1</sub> = {q1Result.toLocaleString()} тис. грн</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент для блока 2: Расчет объема финансирования дорог местного значения
const LocalRoadFundingBlock = () => {
  const [localRoadBudget, setLocalRoadBudget] = useState<BudgetItem[]>(modifyItemsWithLineBreak(initialLocalRoadItems));
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
  };

  return (
    <Card className="w-full border-gray-300 shadow-sm">
      <CardHeader className="bg-gray-100 border-b border-gray-200">
        <CardTitle className="text-xl font-bold text-gray-800">
          Етап 1.2 Блоку 1 Визначення загального обсягу бюджетних коштів Q<sub>2</sub>, що спрямовується на фінансове забезпечення заходів з розвитку та утримання автомобільних доріг загального користування місцевого значення (п.2.1.2 Методики)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-3/5 bg-gray-100">*Назва показника нехай підсвічується при наведені на сам показник</TableHead>
                <TableHead className="w-16 bg-gray-100">Показник</TableHead>
                <TableHead className="w-32 bg-gray-100">Обсяг, тис.грн.</TableHead>
                <TableHead className="bg-gray-100">Нормативний документ, з якого взяті дані</TableHead>
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
                        <TooltipContent className="max-w-md bg-gray-800 text-white">
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
                      className="w-full border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.normativeDocument || ""}
                      onChange={(e) => handleDocumentChange(item.id, e.target.value)}
                      placeholder="Документ"
                      className="w-full border-gray-300"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 w-full">
          <div className="text-lg font-semibold text-gray-700">
            Розрахунок Q<sub>2</sub> = Q<sub>мз</sub> - Q<sub>кред</sub> - Q<sub>н2</sub> - Q<sub>ДПП2</sub> - Q<sub>ком</sub>
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="mt-4 w-36 bg-gray-800 hover:bg-gray-700 text-white py-3 text-xl h-auto"
        >
          Розрахувати
        </Button>

        {q2Result !== null && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md w-full border border-gray-300">
            <div className="font-bold text-xl text-center text-gray-800">РЕЗУЛЬТАТ!</div>
            <div className="text-lg mt-2 text-center text-gray-800">Q<sub>2</sub> = {q2Result.toLocaleString()} тис. грн</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Главный компонент приложения
const RoadFundingApp = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="w-full mx-auto">
        <Card className="mb-8 w-full border-gray-300 shadow-sm">
          <CardHeader className="bg-gray-100">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Блок 1: Визначення загального обсягу бюджетних коштів, що спрямовується на фінансове забезпечення заходів з розвитку та утримання автомобільних доріг загального користування державного та місцевого значення
            </CardTitle>
            <div className="text-lg text-gray-600 mt-2">
              (Розділ ІІ Методики)
            </div>
          </CardHeader>
        </Card>

        {/* Блок 1.1: Дороги государственного значения */}
        <StateRoadFundingBlock />

        {/* Блок 1.2: Дороги местного значения */}
        <LocalRoadFundingBlock />

        {/* Здесь могут быть добавлены другие блоки расчета */}
      </div>
    </div>
  );
};

export default RoadFundingApp;