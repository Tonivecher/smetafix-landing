/* eslint-disable @typescript-eslint/no-require-imports */
const XLSX = require("xlsx");
const path = require("path");

function generateDemo() {
  const wb = XLSX.utils.book_new();

  // 1. Title Sheet (Should be ignored by parser)
  const titleData = [
    ["КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ НА СТРОИТЕЛЬНЫЕ РАБОТЫ"],
    ["Объект:", "Капитальный ремонт офисного помещения"],
    ["Заказчик:", "ООО 'Бизнес-Центр'"],
    ["Подрядчик:", "ООО 'Ремонт-Строй'"],
    ["Дата:", new Date().toLocaleDateString("ru-RU")],
    [],
    ["ВНИМАНИЕ:"],
    ["Сметный расчет находится на вкладке 'Смета'!"],
    ["Вкладка 'Расчеты' содержит формулы замера объемов."]
  ];
  const wsTitle = XLSX.utils.aoa_to_sheet(titleData);
  XLSX.utils.book_append_sheet(wb, wsTitle, "Инфо");

  // 2. Estimate Sheet (Should be auto-selected)
  // Has some intentional arithmetic errors!
  // Row 15 starts the estimate table (index 14)
  const estimateData = [
    ["ЛОКАЛЬНЫЙ СМЕТНЫЙ РАСЧЁТ"],
    ["на ремонтные работы"],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [
      "№ строки",
      "Наименование позиций",
      "Ед. изм.",
      "Количество",
      "Цена за ед. (₽)",
      "Сумма в файле (₽)"
    ],
    [1, "Демонтажные работы (стены, пол)", "м2", 42, 350, 14700], // OK: 42 * 350 = 14700
    [2, "Грунтовка поверхностей стен в 2 слоя", "м2", 86, 120, 10320], // OK: 86 * 120 = 10320
    [3, "Выравнивание стен штукатуркой по маякам", "м2", 64, 850, 52000], // ERROR! 64 * 850 = 54400 (declared 52000, diff -2400)
    [4, "Укладка керамогранитной плитки (пол)", "м2", 18, 1900, 34200], // OK: 18 * 1900 = 34200
    [5, "Установка розеток, выключателей и коробок", "шт", 32, 650, 20000] // ERROR! 32 * 650 = 20800 (declared 20000, diff -800)
  ];
  const wsEstimate = XLSX.utils.aoa_to_sheet(estimateData);
  XLSX.utils.book_append_sheet(wb, wsEstimate, "Смета");

  // 3. Helper calculations Sheet (Should be ignored)
  const helperData = [
    ["Калькулятор объемов плитки и стен"],
    [],
    ["Комната 1:", "Ширина", "Длина", "Высота", "Периметр", "Площадь стен"],
    ["Кабинет директора", 4, 6, 3, 20, 60],
    ["Приемная", 5, 4, 3, 18, 54]
  ];
  const wsHelper = XLSX.utils.aoa_to_sheet(helperData);
  XLSX.utils.book_append_sheet(wb, wsHelper, "Расчеты");

  // Write file
  const destPath = path.join(__dirname, "../public/examples/smetafix-demo.xlsx");
  XLSX.writeFile(wb, destPath);
  console.log("Multi-sheet demo XLSX generated successfully at:", destPath);
}

generateDemo();
