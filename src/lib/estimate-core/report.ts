import type {
  CheckReport,
  EstimateInput,
  EstimateIssue,
  EstimateResult,
  ImportResult,
  ImportedEstimateLine,
  ReportFinding,
  ReportReadinessStatus,
  ReportRecommendation,
} from "./types";

type BuildCheckReportInput = {
  fileName?: string;
  importResult?: ImportResult | null;
  estimateInput: EstimateInput;
  estimateResult: EstimateResult;
};

function issueToFinding(issue: EstimateIssue): ReportFinding {
  const type = issue.code.startsWith("strict-rf")
    ? "readiness"
    : issue.code.startsWith("normative")
      ? "limitation"
      : "calculation";

  return {
    id: issue.code,
    type,
    severity: issue.severity,
    title: issue.severity === "error" ? "Блокирующее замечание" : "Замечание проверки",
    message: issue.message,
  };
}

function importedLineFinding(line: ImportedEstimateLine): ReportFinding | null {
  if (line.differenceKopecks === undefined || Math.abs(line.differenceKopecks) <= 100) {
    return null;
  }

  const severity = line.differenceSeverity === "critical" ? "critical" : "warning";

  return {
    id: `line-difference-${line.sourceRowNumber}`,
    type: "lineDifference",
    severity,
    title: `Строка ${line.sourceRowNumber}: расходится итог`,
    message: `${line.name}: рассчитанная сумма не совпадает с суммой в файле.`,
    sourceRowNumber: line.sourceRowNumber,
    amountKopecks: line.differenceKopecks,
  };
}

function getReadinessStatus(findings: ReportFinding[]): ReportReadinessStatus {
  if (findings.some((finding) => finding.severity === "error" || finding.severity === "critical")) {
    return "blocked";
  }

  if (findings.some((finding) => finding.severity === "warning")) {
    return "needsReview";
  }

  return "ready";
}

function buildRecommendations(
  input: BuildCheckReportInput,
  findings: ReportFinding[],
  readinessStatus: ReportReadinessStatus,
): ReportRecommendation[] {
  const recommendations: ReportRecommendation[] = [];
  const hasLineDifferences = findings.some((finding) => finding.type === "lineDifference");
  const hasStrictRfIssues = findings.some((finding) => finding.type === "readiness");
  const hasNormativeLimitations = findings.some((finding) => finding.type === "limitation");

  if (hasLineDifferences) {
    recommendations.push({
      id: "fix-line-differences",
      tone: "warning",
      title: "Сверьте строки с расхождениями",
      message: "Исправьте количество, цену или итог в исходной таблице, затем повторите проверку перед отправкой клиенту.",
    });
  }

  if (hasStrictRfIssues || input.estimateInput.officialFormat === "strictRf") {
    recommendations.push({
      id: "fill-strict-rf-metadata",
      tone: hasStrictRfIssues ? "warning" : "info",
      title: "Подготовьте реквизиты строгого формата РФ",
      message: "Для локальной, объектной сметы, КС-2 или КС-3 потребуются регион, уровень цен, методика и тип объекта.",
    });
  }

  if (hasNormativeLimitations || input.estimateInput.mode === "russianNormative") {
    recommendations.push({
      id: "normative-base-review",
      tone: "info",
      title: "Проверьте нормативную базу отдельно",
      message: "Этот MVP считает профиль РФ технически, но не заменяет сверку с актуальными ФСНБ, ФЕР, ТЕР и индексами пересчёта.",
    });
  }

  if (readinessStatus === "ready") {
    recommendations.push({
      id: "ready-for-client-version",
      tone: "primary",
      title: "Можно готовить клиентскую версию",
      message: "Критичных арифметических расхождений не найдено. Перед официальной подачей проверьте реквизиты и нормативные ссылки.",
    });
  }

  return recommendations;
}

export function buildCheckReport(input: BuildCheckReportInput): CheckReport {
  const importedLines = input.importResult?.lines ?? [];
  const importedFindings = (input.importResult?.issues ?? [])
    .filter((issue) => !issue.code.startsWith("import-total-mismatch"))
    .map((issue) => ({
      ...issueToFinding(issue),
      type: "import" as const,
    }));
  const estimateFindings = input.estimateResult.issues.map(issueToFinding);
  const lineFindings = importedLines
    .map(importedLineFinding)
    .filter((finding): finding is ReportFinding => finding !== null);
  const findings = [...importedFindings, ...lineFindings, ...estimateFindings];
  const readinessStatus = getReadinessStatus(findings);
  const declaredTotalKopecks = importedLines.reduce(
    (total, line) => total + (line.declaredTotalKopecks ?? 0),
    0,
  );
  const hasDeclaredTotals = importedLines.some((line) => line.declaredTotalKopecks !== undefined);
  const calculatedTotalKopecks = importedLines.length
    ? importedLines.reduce((total, line) => total + line.calculatedTotalKopecks, 0)
    : input.estimateResult.subtotalKopecks;
  const errorCount = findings.filter((finding) => finding.severity === "error" || finding.severity === "critical").length;
  const warningCount = findings.filter((finding) => finding.severity === "warning").length;
  const infoCount = findings.filter((finding) => finding.severity === "info").length;

  return {
    summary: {
      fileName: input.fileName ?? "Ручной расчёт",
      lineCount: input.estimateInput.lines.length,
      issueCount: findings.length,
      errorCount,
      warningCount,
      infoCount,
      subtotalKopecks: input.estimateResult.subtotalKopecks,
      grandTotalKopecks: input.estimateResult.grandTotalKopecks,
      declaredTotalKopecks,
      calculatedTotalKopecks,
      totalDifferenceKopecks: hasDeclaredTotals ? calculatedTotalKopecks - declaredTotalKopecks : 0,
      readinessStatus,
      officialFormat: input.estimateInput.officialFormat,
    },
    findings,
    recommendations: buildRecommendations(input, findings, readinessStatus),
  };
}
