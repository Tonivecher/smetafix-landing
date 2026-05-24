export type EstimateMode = "commercial" | "russianNormative";

export type OfficialFormat = "none" | "business" | "strictRf";

export type StrictRfForm =
  | "localEstimate"
  | "objectEstimate"
  | "consolidatedEstimate"
  | "ks2"
  | "ks3";

export type VatMode = "none" | "excluded" | "included";

export type IssueSeverity = "error" | "warning" | "info";

export type NormativeMethod = "baseIndex" | "resourceIndex" | "resource";

export type DifferenceSeverity = "minor" | "material" | "critical";

export type ReportReadinessStatus = "ready" | "needsReview" | "blocked";

export type ReportFindingType =
  | "import"
  | "calculation"
  | "lineDifference"
  | "readiness"
  | "limitation";

export type ReportRecommendationTone = "primary" | "warning" | "info";

export type EstimateIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
};

export type EstimateLineInput = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceKopecks: number;
  declaredTotalKopecks?: number;
  section?: string;
};

export type ImportedEstimateLine = EstimateLineInput & {
  sourceRowNumber: number;
  calculatedTotalKopecks: number;
  differenceKopecks?: number;
  differenceSeverity?: DifferenceSeverity;
};

export type AbcClass = "A" | "B" | "C";

export type SectionCostBreakdown = {
  name: string;
  totalKopecks: number;
  percent: number;
  itemCount: number;
};

export type BudgetAnomaly = {
  lineId: string;
  lineName: string;
  type: "high_concentration" | "anomalous_price" | "price_surge";
  severity: "critical" | "warning" | "info";
  message: string;
  impactPercent: number;
};

export type EstimateAnalyticsResult = {
  abcClasses: Record<string, AbcClass>;
  sectionsBreakdown: SectionCostBreakdown[];
  anomalies: BudgetAnomaly[];
  metrics: {
    totalBudgetKopecks: number;
    classACostKopecks: number;
    classACount: number;
    averageLineCostKopecks: number;
  };
};

export type EstimateMetadata = {
  region?: string;
  priceLevel?: string;
  method?: NormativeMethod;
  objectType?: string;
};

export type EstimateInput = {
  mode: EstimateMode;
  officialFormat: OfficialFormat;
  strictRfForm?: StrictRfForm;
  vatMode: VatMode;
  vatRate: number;
  discountPercent: number;
  markupPercent: number;
  coefficient: number;
  overheadPercent: number;
  estimatedProfitPercent: number;
  indexationCoefficient: number;
  metadata: EstimateMetadata;
  lines: EstimateLineInput[];
};

export type EstimateLineResult = EstimateLineInput & {
  totalKopecks: number;
};

export type VatResult = {
  netKopecks: number;
  vatKopecks: number;
  totalKopecks: number;
};

export type NormativeResult = {
  directCostKopecks: number;
  overheadKopecks: number;
  estimatedProfitKopecks: number;
  beforeIndexKopecks: number;
  beforeVatKopecks: number;
};

export type EstimateResult = {
  lines: EstimateLineResult[];
  subtotalKopecks: number;
  discountKopecks: number;
  markupKopecks: number;
  coefficientKopecks: number;
  beforeVatKopecks: number;
  vat: VatResult;
  grandTotalKopecks: number;
  normative?: NormativeResult;
  issues: EstimateIssue[];
};

export type ReportFinding = {
  id: string;
  type: ReportFindingType;
  severity: IssueSeverity | "critical";
  title: string;
  message: string;
  sourceRowNumber?: number;
  amountKopecks?: number;
};

export type ReportRecommendation = {
  id: string;
  tone: ReportRecommendationTone;
  title: string;
  message: string;
};

export type ReportSummary = {
  fileName: string;
  lineCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  subtotalKopecks: number;
  grandTotalKopecks: number;
  declaredTotalKopecks: number;
  calculatedTotalKopecks: number;
  totalDifferenceKopecks: number;
  readinessStatus: ReportReadinessStatus;
  officialFormat: OfficialFormat;
};

export type CheckReport = {
  summary: ReportSummary;
  findings: ReportFinding[];
  recommendations: ReportRecommendation[];
};

export type SelfCheckResult = {
  ok: boolean;
  checks: Array<{
    name: string;
    ok: boolean;
    expected: string;
    actual: string;
  }>;
};

export type ImportResult = {
  lines: ImportedEstimateLine[];
  issues: EstimateIssue[];
};

export type LineChangeType = "added" | "removed" | "modified" | "unchanged";

export type ComparisonLineResult = {
  id: string;
  changeType: LineChangeType;
  name: string;
  unit: string;
  originalQuantity?: number;
  originalUnitPriceKopecks?: number;
  originalTotalKopecks?: number;
  revisedQuantity?: number;
  revisedUnitPriceKopecks?: number;
  revisedTotalKopecks?: number;
  quantityDelta?: number;
  unitPriceDeltaKopecks?: number;
  totalDeltaKopecks?: number;
  sourceRowNumber?: number;
};

export type ComparisonSummary = {
  originalTotalKopecks: number;
  revisedTotalKopecks: number;
  totalDeltaKopecks: number;
  addedLinesCount: number;
  removedLinesCount: number;
  modifiedLinesCount: number;
  unchangedLinesCount: number;
};

export type ComparisonReport = {
  summary: ComparisonSummary;
  lines: ComparisonLineResult[];
};

