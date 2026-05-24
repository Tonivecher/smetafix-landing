import { calculateLineTotal } from "./calculators";
import { parseMoneyToKopecks } from "./money";
import type { DifferenceSeverity, EstimateIssue, ImportResult, ImportedEstimateLine } from "./types";

type ColumnMap = {
  name: number;
  unit: number;
  quantity: number;
  priceColumns: number[];
  totalColumns?: number[];
};

const NAME_HINTS = ["работ", "наимен", "пози", "материал", "услуг"];
const UNIT_HINTS = ["ед", "изм"];
const QUANTITY_HINTS = ["кол", "объем", "объём", "qty"];
const PRICE_HINTS = ["цен", "расцен"];
const TOTAL_HINTS = ["сум", "итог", "стоим"];

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeHeader(value: unknown): string {
  return normalizeCell(value).toLowerCase().replace(/ё/g, "е");
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = normalizeCell(value)
    .replace(/[^\d,.\-]/g, "")
    .replace(",", ".");

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitTextRows(text: string): string[][] {
  const delimiter = text.includes(";") ? ";" : text.includes("\t") ? "\t" : ",";

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

function findColumn(headers: string[], hints: string[]) {
  return headers.findIndex((header) => header && hints.some((hint) => header.includes(hint)));
}

function detectColumnMap(rows: unknown[][]): { map: ColumnMap; startIndex: number } | null {
  for (let index = 0; index < Math.min(rows.length, 35); index += 1) {
    const row = rows[index] || [];
    const headers = row.map(normalizeHeader);
    const name = findColumn(headers, NAME_HINTS);
    const unit = findColumn(headers, UNIT_HINTS);
    const quantity = findColumn(headers, QUANTITY_HINTS);
    const price = findColumn(headers, PRICE_HINTS);
    const total = findColumn(headers, TOTAL_HINTS);

    if (name >= 0 && quantity >= 0 && price >= 0) {
      // Find non-empty header indexes in this row
      const nonEmptyIndexes: number[] = [];
      headers.forEach((h, i) => {
        if (h !== "") {
          nonEmptyIndexes.push(i);
        }
      });

      // Helper function to find all column indexes in the header's span
      const getSpan = (colIndex: number): number[] => {
        const start = colIndex;
        const nextHeaderIdx = nonEmptyIndexes.find(idx => idx > colIndex);
        const end = nextHeaderIdx !== undefined ? nextHeaderIdx - 1 : headers.length - 1;
        const cols: number[] = [];
        for (let c = start; c <= end; c++) {
          cols.push(c);
        }
        return cols;
      };

      const priceColumns = getSpan(price);
      const totalColumns = total >= 0 ? getSpan(total) : undefined;

      // If there are other headers matching total hints, merge their columns (e.g. 'Стоимость' + 'Итого')
      if (total >= 0) {
        headers.forEach((h, i) => {
          if (i !== total && h !== "" && TOTAL_HINTS.some(hint => h.includes(hint))) {
            const extraSpan = getSpan(i);
            extraSpan.forEach(c => {
              if (totalColumns && !totalColumns.includes(c)) {
                totalColumns.push(c);
              }
            });
          }
        });
      }

      return {
        map: {
          name,
          unit: unit >= 0 ? unit : name + 1,
          quantity,
          priceColumns,
          totalColumns,
        },
        startIndex: index + 1,
      };
    }
  }

  return null;
}

function getDifferenceSeverity(differenceKopecks: number): DifferenceSeverity {
  const absoluteDifference = Math.abs(differenceKopecks);

  if (absoluteDifference > 100_000) {
    return "critical";
  }

  if (absoluteDifference > 10_000) {
    return "material";
  }

  return "minor";
}

function fallbackColumnMap(rows: unknown[][]): { map: ColumnMap; startIndex: number } | null {
  const firstDataRow = rows.findIndex((row) => row.some((cell) => parseNumber(cell) > 0));

  if (firstDataRow < 0) {
    return null;
  }

  return {
    map: {
      name: 0,
      unit: 1,
      quantity: 2,
      priceColumns: [3],
      totalColumns: [4],
    },
    startIndex: firstDataRow,
  };
}

export function parseEstimateRows(rows: unknown[][]): ImportResult {
  const issues: EstimateIssue[] = [];
  const detected = detectColumnMap(rows) ?? fallbackColumnMap(rows);

  if (!detected) {
    return {
      lines: [],
      issues: [
        {
          code: "import-no-table",
          severity: "error",
          message: "Не удалось найти таблицу с позициями, количеством и ценой.",
        },
      ],
    };
  }

  const lines: ImportedEstimateLine[] = [];
  let currentSection: string | undefined = undefined;

  rows.slice(detected.startIndex).forEach((row, rowIndex) => {
    const safeRow = row || [];
    const sourceRowNumber = detected.startIndex + rowIndex + 1;
    const name = normalizeCell(safeRow[detected.map.name]);
    const quantity = parseNumber(safeRow[detected.map.quantity]);
    let unitPriceKopecks = 0;
    detected.map.priceColumns.forEach((col) => {
      const valStr = normalizeCell(safeRow[col]);
      if (valStr) {
        const val = parseMoneyToKopecks(valStr);
        if (val > 0) {
          unitPriceKopecks += val;
        }
      }
    });

    let declaredTotalKopecks: number | undefined = undefined;
    if (detected.map.totalColumns && detected.map.totalColumns.length > 0) {
      let sumTotal = 0;
      let hasValue = false;
      detected.map.totalColumns.forEach((col) => {
        const valStr = normalizeCell(safeRow[col]);
        if (valStr) {
          const val = parseMoneyToKopecks(valStr);
          if (val > 0) {
            sumTotal += val;
            hasValue = true;
          }
        }
      });
      if (hasValue) {
        declaredTotalKopecks = sumTotal;
      }
    }

    if (quantity === 0 && unitPriceKopecks === 0) {
      if (name) {
        currentSection = name;
      }
      return;
    }

    const calculatedTotalKopecks = calculateLineTotal(quantity, unitPriceKopecks);
    const differenceKopecks =
      declaredTotalKopecks !== undefined && declaredTotalKopecks > 0
        ? calculatedTotalKopecks - declaredTotalKopecks
        : undefined;
    const differenceSeverity =
      differenceKopecks !== undefined && Math.abs(differenceKopecks) > 100
        ? getDifferenceSeverity(differenceKopecks)
        : undefined;

    const line: ImportedEstimateLine = {
      id: `import-${lines.length + 1}`,
      name: name || `Позиция ${lines.length + 1}`,
      unit: normalizeCell(row[detected.map.unit]) || "ед.",
      quantity,
      unitPriceKopecks,
      declaredTotalKopecks,
      sourceRowNumber,
      calculatedTotalKopecks,
      differenceKopecks,
      differenceSeverity,
      section: currentSection,
    };

    lines.push(line);

    if (differenceKopecks !== undefined && Math.abs(differenceKopecks) > 100) {
      issues.push({
        code: `import-total-mismatch-${sourceRowNumber}`,
        severity: "warning",
        message: `${line.name}: сумма в файле отличается от количества × цены.`,
      });
    }
  });

  if (lines.length === 0) {
    issues.push({
      code: "import-empty",
      severity: "error",
      message: "Файл прочитан, но подходящих строк сметы не найдено.",
    });
  }

  return { lines, issues };
}

export function parseEstimateText(text: string): ImportResult {
  return parseEstimateRows(splitTextRows(text));
}
