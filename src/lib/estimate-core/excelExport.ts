import * as XLSX from "xlsx";
import { formatMoney } from "./money";
import type { ImportedEstimateLine } from "./types";

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

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Результаты аудита");

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
