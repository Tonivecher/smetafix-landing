import { calculateLineTotal } from "./calculators";
import { parseMoneyToKopecks } from "./money";
import type { EstimateIssue, EstimateLineInput, ImportResult } from "./types";

type ColumnMap = {
  name: number;
  unit: number;
  quantity: number;
  price: number;
  total?: number;
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
  return headers.findIndex((header) => hints.some((hint) => header.includes(hint)));
}

function detectColumnMap(rows: unknown[][]): { map: ColumnMap; startIndex: number } | null {
  for (let index = 0; index < Math.min(rows.length, 12); index += 1) {
    const headers = rows[index].map(normalizeHeader);
    const name = findColumn(headers, NAME_HINTS);
    const unit = findColumn(headers, UNIT_HINTS);
    const quantity = findColumn(headers, QUANTITY_HINTS);
    const price = findColumn(headers, PRICE_HINTS);
    const total = findColumn(headers, TOTAL_HINTS);

    if (name >= 0 && quantity >= 0 && price >= 0) {
      return {
        map: {
          name,
          unit: unit >= 0 ? unit : name + 1,
          quantity,
          price,
          total: total >= 0 ? total : undefined,
        },
        startIndex: index + 1,
      };
    }
  }

  return null;
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
      price: 3,
      total: 4,
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

  const lines: EstimateLineInput[] = [];

  rows.slice(detected.startIndex).forEach((row, rowIndex) => {
    const name = normalizeCell(row[detected.map.name]);
    const quantity = parseNumber(row[detected.map.quantity]);
    const unitPriceKopecks = parseMoneyToKopecks(normalizeCell(row[detected.map.price]));
    const declaredTotalKopecks =
      detected.map.total === undefined
        ? undefined
        : parseMoneyToKopecks(normalizeCell(row[detected.map.total]));

    if (!name && quantity === 0 && unitPriceKopecks === 0) {
      return;
    }

    const line: EstimateLineInput = {
      id: `import-${lines.length + 1}`,
      name: name || `Позиция ${lines.length + 1}`,
      unit: normalizeCell(row[detected.map.unit]) || "ед.",
      quantity,
      unitPriceKopecks,
      declaredTotalKopecks,
    };

    lines.push(line);

    if (declaredTotalKopecks !== undefined && declaredTotalKopecks > 0) {
      const expected = calculateLineTotal(quantity, unitPriceKopecks);
      const difference = Math.abs(expected - declaredTotalKopecks);

      if (difference > 100) {
        issues.push({
          code: `import-total-mismatch-${rowIndex + 1}`,
          severity: "warning",
          message: `${line.name}: сумма в файле отличается от количества × цены.`,
        });
      }
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
