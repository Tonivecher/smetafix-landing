import { normativeLimitations, strictRfRequiredMetadata } from "./standards";
import type { EstimateInput, EstimateIssue } from "./types";

function isMissing(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

export function validateEstimateInput(input: EstimateInput): EstimateIssue[] {
  const issues: EstimateIssue[] = [];

  if (input.lines.length === 0) {
    issues.push({
      code: "empty-lines",
      severity: "error",
      message: "Добавьте хотя бы одну позицию сметы.",
    });
  }

  input.lines.forEach((line, index) => {
    if (isMissing(line.name)) {
      issues.push({
        code: `line-${index + 1}-name`,
        severity: "warning",
        message: `Позиция ${index + 1}: укажите наименование работы или материала.`,
      });
    }

    if (line.quantity <= 0 || !Number.isFinite(line.quantity)) {
      issues.push({
        code: `line-${index + 1}-quantity`,
        severity: "error",
        message: `Позиция ${index + 1}: количество должно быть больше нуля.`,
      });
    }

    if (line.unitPriceKopecks < 0 || !Number.isFinite(line.unitPriceKopecks)) {
      issues.push({
        code: `line-${index + 1}-price`,
        severity: "error",
        message: `Позиция ${index + 1}: цена не может быть отрицательной.`,
      });
    }
  });

  [
    ["discount", input.discountPercent],
    ["markup", input.markupPercent],
    ["vat", input.vatRate],
    ["overhead", input.overheadPercent],
    ["estimated-profit", input.estimatedProfitPercent],
  ].forEach(([key, value]) => {
    if (typeof value !== "number" || value < 0 || value > 100) {
      issues.push({
        code: `${key}-range`,
        severity: "error",
        message: "Проценты должны быть в диапазоне от 0 до 100.",
      });
    }
  });

  if (input.coefficient <= 0 || !Number.isFinite(input.coefficient)) {
    issues.push({
      code: "coefficient-range",
      severity: "error",
      message: "Коэффициент должен быть положительным числом.",
    });
  }

  if (input.indexationCoefficient <= 0 || !Number.isFinite(input.indexationCoefficient)) {
    issues.push({
      code: "indexation-range",
      severity: "error",
      message: "Индекс пересчёта должен быть положительным числом.",
    });
  }

  if (input.officialFormat === "strictRf" && !input.strictRfForm) {
    issues.push({
      code: "strict-rf-form",
      severity: "error",
      message: "Для строгого профиля РФ выберите форму документа.",
    });
  }

  if (input.officialFormat === "strictRf") {
    strictRfRequiredMetadata.forEach((field) => {
      if (isMissing(input.metadata[field])) {
        issues.push({
          code: `strict-rf-${field}`,
          severity: "warning",
          message: `Для строгого профиля РФ заполните поле: ${field}.`,
        });
      }
    });
  }

  if (input.mode === "russianNormative" || input.officialFormat === "strictRf") {
    normativeLimitations.forEach((message, index) => {
      issues.push({
        code: `normative-limitation-${index + 1}`,
        severity: "info",
        message,
      });
    });
  }

  return issues;
}
