export const worksData = [
    {
      category: "Земляне полотно та водовідвід",
      works: [
        { name: "Ліквідація розмивів, вимоїн, деформацій і руйнувань", allowable: "до 1.9 м³", normative: "до 10 м³", structure: 0.04, costPerUnit: 100 },
        { name: "Очищення/відновлення профілю водовідвідних канав вручну", allowable: "до 40 м / 1 м³", normative: "до 200 м / 3 м³", structure: 0.14, costPerUnit: 50 },
        { name: "Розчищення обвалів, зсувів та осипів", allowable: "до 0.11 м³", normative: "до 0.2 м³", structure: 0.07, costPerUnit: 80 },
        { name: "Ліквідація зім’ятого дорожнього одягу", allowable: "до 2 м", normative: "до 2 м", structure: 0.07, costPerUnit: 120 },
        { name: "Очищення смуг відводу, узбіч і розділових смуг", allowable: "до 16 000 м²", normative: "до 48 000 м²", structure: 5.00, costPerUnit: 30 },
        { name: "Планування узбіч вручну", allowable: "-", normative: "до 310 м²", structure: 0.07, costPerUnit: 40 },
        { name: "Підсипання та планування узбіч механізовано", allowable: "до 0.2 км", normative: "до 0.4 км", structure: 0.03, costPerUnit: 80 },
      ],
    },
    {
      category: "Дорожній одяг та покриття",
      works: [
        { name: "Засипання кам’яними матеріалами", allowable: "до 10 м²", normative: "до 10 м²", structure: 0.06, costPerUnit: 200 },
        { name: "Ліквідація вибоїн, тріщин", allowable: "до 150 м²", normative: "до 200 м²", structure: 37.73, costPerUnit: 50 },
        { name: "Очищення покриття проїзної частини від пилу", allowable: "до 7 500 м²", normative: "до 15 000 м²", structure: 0.15, costPerUnit: 20 },
        { name: "Прибирання бруду з колісобійного брусу вручну", allowable: "-", normative: "до 310 м²", structure: 0.09, costPerUnit: 30 },
        { name: "Ліквідація колійності методом фрезерування", allowable: "-", normative: "до 10 м²", structure: 0.41, costPerUnit: 100 },
        { name: "Очищення покриття від снігу вручну", allowable: "до 40 м² / 0.4 км", normative: "до 80 м²", structure: 0.09, costPerUnit: 15 },
        { name: "Ремонт покриття зупинок", allowable: "до 11 м²", normative: "до 37 м²", structure: 2.77, costPerUnit: 100 },
      ],
    },
    {
      category: "Організація та безпека дорожнього руху",
      works: [
        { name: "Заміна дорожніх знаків", allowable: "до 0.5 шт", normative: "до 2 шт", structure: 0.12, costPerUnit: 150 },
        { name: "Фарбування стовпчиків дорожніх знаків", allowable: "до 2 шт", normative: "до 12 шт", structure: 0.04, costPerUnit: 50 },
        { name: "Заміна сигнальних стовпчиків", allowable: "до 1 шт", normative: "до 3 шт", structure: 0.12, costPerUnit: 60 },
        { name: "Відновлення розмітки", allowable: "до 2 300 м", normative: "до 3 000 м", structure: 3.82, costPerUnit: 10 },
        { name: "Очищення дорожніх знаків від бруду", allowable: "до 2 шт", normative: "до 36 шт", structure: 0.01, costPerUnit: 10 },
      ],
    },
    {
      category: "Штучні споруди",
      works: [
        { name: "Очищення мостів від бруду вручну", allowable: "до 10 м²", normative: "до 50 м²", structure: 0.54, costPerUnit: 80 },
        { name: "Очищення водовідвідного обладнання від снігу", allowable: "до 18 м³", normative: "до 18 м³", structure: 0.31, costPerUnit: 70 },
        { name: "Фарбування перил мостів", allowable: "до 2 м", normative: "до 10 м", structure: 0.63, costPerUnit: 90 },
        { name: "Виправлення металевих бар’єрів", allowable: "до 1 секції", normative: "до 1 секції", structure: 5.63, costPerUnit: 300 },
        { name: "Фарбування металевих бар’єрів", allowable: "до 10 м.п.", normative: "до 15 м.п.", structure: 0.04, costPerUnit: 120 },
      ],
    },
    {
      category: "Зимове утримання",
      works: [
        { name: "Приготування протиожеледних матеріалів", allowable: "до 30 м³", normative: "до 60 м³", structure: 19.42, costPerUnit: 200 },
        { name: "Розподілення протиожеледних матеріалів", allowable: "до 17 000 м²", normative: "до 23 000 м²", structure: 0.53, costPerUnit: 30 },
        { name: "Прибирання доріг від снігу механізовано", allowable: "до 71 км", normative: "до 80 км", structure: 1.31, costPerUnit: 100 },
        { name: "Чергування техніки взимку", allowable: "до 6 год", normative: "до 7 год", structure: 0.01, costPerUnit: 100 },
      ],
    },
    {
      category: "Озеленення",
      works: [
        { name: "Періодичне скошування трави", allowable: "до 10 км", normative: "до 20 км", structure: 0.67, costPerUnit: 50 },
        { name: "Видалення порослі кущів", allowable: "до 12 м²", normative: "до 60 м²", structure: 0.02, costPerUnit: 30 },
      ],
    },
    {
      category: "Лінійні будівлі",
      works: [
        { name: "Фарбування автопавільйонів", allowable: "-", normative: "до 1050 м²", structure: 0.01, costPerUnit: 500 },
        { name: "Прибирання автобусних зупинок", allowable: "до 1 шт", normative: "до 3 шт", structure: 0.03, costPerUnit: 150 },
      ],
    },
  ];
  
  