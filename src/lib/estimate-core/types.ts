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
  lines: EstimateLineInput[];
  issues: EstimateIssue[];
};
