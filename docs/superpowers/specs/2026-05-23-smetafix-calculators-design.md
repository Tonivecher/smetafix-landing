# SmetaFix Calculators Design

## Goal

Build a local frontend-first MVP for SmetaFix that adds real estimating calculators and self-checking logic to the Awwwards variant of the site.

The MVP must support two user paths:

- Commercial estimates for private repair and contractor work.
- Russian normative estimate checks as a guided profile.

The service must also ask whether the user needs an official-looking output:

- No official format.
- Business client format.
- Strict Russian form profile.

The product must be honest about scope. It can validate arithmetic, structure, required fields, rounding, totals, VAT, markups, coefficients, overheads, estimated profit, indexation inputs, and form readiness. It must not claim to replace official expertise or to apply live FGIS CS/FRSN indexes without a future data source.

## Project Context

The target project is `smetafix-landing`, a Next.js 16 app with React 19 and Tailwind CSS.

Current relevant files:

- `src/components/SmetaLanding.tsx` contains both landing variants and the existing upload mock.
- `src/lib/content.ts` contains landing copy and mock estimate data.
- `src/app/awwwards/page.tsx` renders the Awwwards variant.
- `src/app/globals.css` contains global visual utilities.

The implementation should keep business logic out of UI components by adding a small calculation core under `src/lib/estimate-core/`.

## Functional Scope

### Estimate Modes

The calculator wizard will support:

- `commercial`: practical contractor/client estimate checks.
- `russianNormative`: checks modeled around Russian estimate workflows and terminology.

Commercial mode includes:

- Line item totals.
- Section totals.
- Discounts.
- Markups.
- VAT included or excluded.
- Grand total validation.
- Client-facing business summary.

Russian normative mode includes:

- Direct cost inputs.
- Overhead rate.
- Estimated profit rate.
- Coefficients.
- Indexation coefficient.
- VAT mode.
- Validation of required normative metadata, such as region, price level, method, object type, and form type.

### Official Format Question

The UI must ask: "Нужен официальный формат?"

Options:

- `none`: only calculation and warnings.
- `business`: clean client-facing PDF/Excel-style structure, not a strict statutory form.
- `strictRf`: strict Russian form profile readiness check.

If `strictRf` is selected, the user chooses a form profile:

- Local estimate / local estimate calculation.
- Object estimate.
- Consolidated estimate calculation.
- KS-2.
- KS-3.

The MVP does not generate legally binding documents. It checks whether enough data exists for the selected profile and shows missing fields and warnings.

## Calculation Core

Create `src/lib/estimate-core/` with small pure modules:

- `money.ts`: decimal-safe money helpers, rounding, percentage calculations.
- `types.ts`: shared estimate, line item, section, mode, issue, and result types.
- `calculators.ts`: line totals, section totals, VAT, discounts, markups, coefficients, overheads, estimated profit, indexation, grand totals.
- `validators.ts`: arithmetic checks, required field checks, range checks, rounding checks, normative profile checks.
- `standards.ts`: static profile metadata and limitations for commercial, business format, and strict Russian form checks.
- `selfCheck.ts`: deterministic control examples that run the core against known expected results.

Use integer kopecks internally for currency to avoid floating point drift. Percent calculations should round only at defined boundaries.

## Self-Checking

Self-checking must exist in two layers:

- Unit tests for core functions.
- Runtime self-check status shown in the UI, based on deterministic examples from `selfCheck.ts`.

The UI should never silently hide a failed self-check. If a self-check fails, the calculator panel must show a warning that the calculation core needs verification.

Initial self-check examples:

- VAT excluded: subtotal 100,000.00 RUB with VAT 20% gives VAT 20,000.00 and total 120,000.00.
- VAT included: total 120,000.00 RUB with VAT 20% gives net 100,000.00 and VAT 20,000.00.
- Line item: quantity 12.5 and unit price 800.00 gives 10,000.00.
- Discount: 10% from 50,000.00 gives 45,000.00.
- Coefficient: 1.15 applied to 80,000.00 gives 92,000.00.
- Normative simplified total: direct cost + overhead + estimated profit, then index and VAT.

## UI Design

Add an interactive calculator section to the Awwwards route.

The section should feel like a product tool, not a decorative landing block:

- Compact wizard controls.
- Clear numeric inputs.
- A live result summary.
- A list of errors and warnings.
- A normative readiness panel when Russian normative mode or strict RF format is selected.

The section should reuse the existing visual language of `SmetaAwwwards`: dark background, warm paper surface, restrained amber accent, and compact professional cards.

Avoid external UI dependencies for this MVP.

## Data Flow

1. User selects estimate mode.
2. User selects official format need.
3. User enters estimate inputs.
4. UI builds a typed estimate input object.
5. Pure core functions calculate totals.
6. Validators return issues with severity: `error`, `warning`, or `info`.
7. UI renders totals, issues, and self-check status.

No backend, file parsing, persistence, or external normative API is included in this MVP.

## Error Handling

The calculator must handle:

- Empty input.
- Negative quantities or prices.
- Invalid percentages.
- Missing required fields for strict RF profile.
- Conflicting VAT modes.
- Rounding differences.
- Failed self-check.

Errors must be shown as actionable messages, not thrown into the UI.

## Testing

Add focused tests for:

- Money parsing and formatting.
- VAT included and excluded.
- Line and section totals.
- Discounts, markups, coefficients.
- Simplified Russian normative calculation.
- Validator warnings for missing strict RF fields.
- Self-check success.

Use the existing project tooling where possible. If the project has no test runner, add the smallest practical test setup or create a TypeScript self-check script wired to `npm run` without changing the app runtime.

## Non-Goals

This MVP will not:

- Parse Excel, CSV, or PDF files.
- Generate official documents.
- Pull live indexes, rates, or collections from FGIS CS, FRSN, or other official sources.
- Replace professional review, state expertise, or legally required estimate documentation.
- Implement authentication, billing, file storage, or backend APIs.

## Source Notes

The normative framing is based on the Russian estimate context around Ministry of Construction methodology, including Methodology No. 421/pr, FGIS CS/FRSN as the live normative data source, and SPDS documentation standards such as GOST R 21.101-2020. The MVP must phrase this as a guided profile and readiness check unless live normative data is later integrated.
