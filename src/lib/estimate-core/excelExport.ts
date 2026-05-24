import * as XLSX from "xlsx";
import { formatMoney } from "./money";
import type { ImportedEstimateLine } from "./types";
import { runEstimateAnalytics } from "./analytics";

export function exportCorrectedEstimate(
  fileName: string,
  lines: ImportedEstimateLine[],
  subtotalKopecks: number,
  grandTotalKopecks: number,
  vatKopecks: number,
  vatRate: number,
) {
  const cleanFileName = fileName || "estimate.xlsx";
  const exportedFileName = cleanFileName.startsWith("corrected_")
    ? cleanFileName
    : `corrected_${cleanFileName}`;

  // Prepare header rows
  const rows: (string | number | null)[][] = [
    ["ОТЧЁТ ОБ АУДИТЕ И ИСПРАВЛЕНИИ СМЕТЫ (SmetaFix)"],
    ["Исходный файл:", cleanFileName],
    ["Дата проверки:", new Date().toLocaleDateString("ru-RU")],
    [],
    [
      "№ строки",
      "Наименование позиций / работ",
      "Ед. изм.",
      "Количество",
      "Цена за ед. (₽)",
      "Сумма в файле (₽)",
      "Сумма расчётная (₽)",
      "Разница (₽)",
      "Статус проверки / Замечания"
    ]
  ];

  // Process rows
  lines.forEach((line) => {
    const qty = line.quantity;
    const priceRub = line.unitPriceKopecks / 100;
    const declaredRub = line.declaredTotalKopecks !== undefined ? line.declaredTotalKopecks / 100 : null;
    const calculatedRub = line.calculatedTotalKopecks / 100;
    const diffRub = line.differenceKopecks !== undefined ? line.differenceKopecks / 100 : 0;

    let status = "ОК (Сумма совпадает)";
    if (line.differenceKopecks !== undefined && Math.abs(line.differenceKopecks) > 100) {
      if (line.differenceSeverity === "critical") {
        status = `⚠️ КРИТИЧЕСКАЯ ОШИБКА: Расхождение ${formatMoney(Math.abs(line.differenceKopecks))}`;
      } else if (line.differenceSeverity === "material") {
        status = `❌ ОШИБКА: Расхождение ${formatMoney(Math.abs(line.differenceKopecks))}`;
      } else {
        status = `💡 ПРЕДУПРЕЖДЕНИЕ: Расхождение ${formatMoney(Math.abs(line.differenceKopecks))}`;
      }
    } else if (declaredRub === null) {
      status = "Проверено (исходная сумма не была указана)";
    }

    rows.push([
      line.sourceRowNumber || lines.indexOf(line) + 1,
      line.name,
      line.unit,
      qty,
      priceRub,
      declaredRub,
      calculatedRub,
      diffRub,
      status
    ]);
  });

  // Append summary row
  rows.push([]);
  rows.push(["", "ИТОГОВЫЙ СВОДНЫЙ РАСЧЁТ"]);
  rows.push(["", "Подытог (без НДС):", "", "", "", "", subtotalKopecks / 100]);
  rows.push(["", `НДС (${vatRate}%):`, "", "", "", "", vatKopecks / 100]);
  rows.push(["", "ИТОГО С УЧЁТОМ НДС:", "", "", "", "", grandTotalKopecks / 100]);

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const cols = [
    { wch: 10 }, // № строки
    { wch: 40 }, // Наименование
    { wch: 10 }, // Ед. изм.
    { wch: 12 }, // Количество
    { wch: 15 }, // Цена за ед.
    { wch: 18 }, // Сумма в файле
    { wch: 18 }, // Сумма расчётная
    { wch: 12 }, // Разница
    { wch: 50 }  // Статус
  ];
  ws["!cols"] = cols;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Результаты аудита");

  // --- ANALYTICS SHEET GENERATION ---
  const analytics = runEstimateAnalytics(lines);
  const classAPercent = grandTotalKopecks > 0 
    ? ((analytics.metrics.classACostKopecks / grandTotalKopecks) * 100).toFixed(1) 
    : "0";

  const analyticsRows: (string | number | null)[][] = [
    ["АНАЛИТИКА БЮДЖЕТА И РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ (SmetaFix)"],
    ["Исходный файл:", cleanFileName],
    ["Дата проверки:", new Date().toLocaleDateString("ru-RU")],
    [],
    ["ОСНОВНЫЕ ПОКАЗАТЕЛИ БЮДЖЕТА"],
    ["Общий расчетный бюджет сметы (без наценок):", analytics.metrics.totalBudgetKopecks / 100, "₽"],
    ["Стоимость позиций класса А (высокий приоритет):", analytics.metrics.classACostKopecks / 100, "₽", `(${classAPercent}% бюджета)`],
    ["Количество позиций класса А:", analytics.metrics.classACount, "шт"],
    ["Средняя расчетная стоимость строки:", analytics.metrics.averageLineCostKopecks / 100, "₽"],
    [],
    ["СТОИМОСТЬ ПО РАЗДЕЛАМ СМЕТЫ"],
    ["Раздел сметы", "Количество позиций", "Сумма раздела (₽)", "Доля (%)"]
  ];

  // Populate sections
  analytics.sectionsBreakdown.forEach((sec) => {
    analyticsRows.push([
      sec.name,
      sec.itemCount,
      sec.totalKopecks / 100,
      sec.percent / 100 // SheetJS will format it beautifully
    ]);
  });

  analyticsRows.push([]);
  analyticsRows.push(["ВЫЯВЛЕННЫЕ ТОЧКИ ОПТИМИЗАЦИИ И СОВЕТЫ"]);
  analyticsRows.push(["Позиция сметы", "Тип аномалии", "Уровень важности", "Рекомендация по оптимизации"]);

  // Populate anomalies
  if (analytics.anomalies.length === 0) {
    analyticsRows.push(["Отклонений и сильных перекосов стоимости не обнаружено", "", "", "Все цены находятся в пределах нормальных средних уровней."]);
  } else {
    analytics.anomalies.forEach((anom) => {
      analyticsRows.push([
        anom.lineName,
        anom.type === "high_concentration" ? "Концентрация затрат" : "Аномальная цена",
        anom.severity === "critical" ? "Критическая зона" : "Внимание",
        anom.message
      ]);
    });
  }

  const wsAnalytics = XLSX.utils.aoa_to_sheet(analyticsRows);

  // Set column widths for analytics sheet
  const analyticsCols = [
    { wch: 45 }, // Показатель / Раздел / Позиция
    { wch: 22 }, // Значение / Кол-во / Тип аномалии
    { wch: 18 }, // Валюта / Сумма / Уровень важности
    { wch: 65 }  // Доля / Рекомендация
  ];
  wsAnalytics["!cols"] = analyticsCols;

  XLSX.utils.book_append_sheet(wb, wsAnalytics, "Аналитика бюджета");

  // Write file
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

  function s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
  }

  // Download blob
  const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportedFileName;
  a.click();
  URL.revokeObjectURL(url);
}
