# SmetaFix Calculators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local frontend-first estimate calculator with Russian normative readiness checks, official-format selection, and deterministic self-checks.

**Architecture:** Keep all business logic in pure TypeScript under `src/lib/estimate-core/`. The React UI only owns form state, calls the core, and renders totals, warnings, and self-check status. Verification uses a small Node-compatible TypeScript script instead of adding a heavy test framework.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Node test runner through `tsx`.

---

## File Structure

- Create `src/lib/estimate-core/types.ts`: shared input, result, issue, mode, and profile types.
- Create `src/lib/estimate-core/money.ts`: kopeck-based money parsing, formatting, rounding, and percentage helpers.
- Create `src/lib/estimate-core/calculators.ts`: commercial and simplified Russian normative calculations.
- Create `src/lib/estimate-core/standards.ts`: static mode and official-format metadata, labels, and field requirements.
- Create `src/lib/estimate-core/validators.ts`: arithmetic, range, VAT, and normative readiness validators.
- Create `src/lib/estimate-core/selfCheck.ts`: deterministic examples used by tests and UI runtime status.
- Create `src/lib/estimate-core/index.ts`: stable export surface for UI and scripts.
- Create `scripts/estimate-core-self-check.ts`: Node script that fails on broken core behavior.
- Modify `package.json`: add `check:estimate-core`.
- Modify `src/components/SmetaLanding.tsx`: add calculator panel to the Awwwards page.

## Tasks

### Task 1: Core Types And Money Helpers

**Files:**
- Create: `src/lib/estimate-core/types.ts`
- Create: `src/lib/estimate-core/money.ts`
- Create: `src/lib/estimate-core/index.ts`
- Create: `scripts/estimate-core-self-check.ts`
- Modify: `package.json`

- [ ] Add estimate types with `EstimateMode`, `OfficialFormat`, `StrictRfForm`, `EstimateLineInput`, `EstimateInput`, `EstimateResult`, and `EstimateIssue`.
- [ ] Add kopeck helpers: `parseMoneyToKopecks`, `formatMoney`, `multiplyMoney`, `applyPercent`, `calculateVatExcluded`, `calculateVatIncluded`.
- [ ] Add a self-check script with money/VAT assertions that exits non-zero on failure.
- [ ] Add `tsx` as a dev dependency and `npm run check:estimate-core`.
- [ ] Run `npm run check:estimate-core` and commit the working core base.

### Task 2: Calculators And Validators

**Files:**
- Modify: `src/lib/estimate-core/types.ts`
- Modify: `src/lib/estimate-core/calculators.ts`
- Modify: `src/lib/estimate-core/standards.ts`
- Modify: `src/lib/estimate-core/validators.ts`
- Modify: `src/lib/estimate-core/selfCheck.ts`
- Modify: `scripts/estimate-core-self-check.ts`

- [ ] Implement line totals, subtotal, discount, markup, coefficient, VAT, and grand total calculation.
- [ ] Implement simplified normative calculation: direct cost, overhead, estimated profit, indexation, VAT.
- [ ] Implement standards metadata for commercial, Russian normative, no official format, business format, strict RF forms.
- [ ] Implement validators for negative values, invalid percentages, empty line names, missing strict RF fields, and normative-data limitations.
- [ ] Expand self-checks for line totals, discounts, coefficients, and normative totals.
- [ ] Run `npm run check:estimate-core` and commit the completed core.

### Task 3: Awwwards Calculator UI

**Files:**
- Modify: `src/components/SmetaLanding.tsx`

- [ ] Import the estimate core from `@/lib/estimate-core`.
- [ ] Add an `EstimateCalculatorPanel` client component inside `SmetaLanding.tsx`.
- [ ] Add segmented controls for estimate mode and official format.
- [ ] Add strict RF form selector when strict RF is selected.
- [ ] Add numeric inputs for line item, discount, markup, VAT, coefficient, overhead, estimated profit, and indexation.
- [ ] Render live totals, self-check status, and actionable issue messages.
- [ ] Insert the panel into `SmetaAwwwards` after the hero so it is visible as real product functionality.
- [ ] Run `npm run lint`, `npm run check:estimate-core`, and `npm run build`.

### Task 4: Final Verification

**Files:**
- Review: changed source and docs

- [ ] Run `git status --short`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run check:estimate-core`.
- [ ] Run `npm run build`.
- [ ] Start the local dev server if needed for browser verification.
- [ ] Review the local Awwwards page for layout regressions.
- [ ] Commit final implementation changes.

## Self-Review

Spec coverage:

- Commercial estimates: Task 2 and Task 3.
- Russian normative guided profile: Task 2 and Task 3.
- Official format question with strict RF choice: Task 2 and Task 3.
- Pure calculation core outside UI: Task 1 and Task 2.
- Runtime self-check: Task 2 and Task 3.
- Tests/script verification: Task 1, Task 2, and Task 4.
- No backend or file parsing: preserved by file structure and scope.

No placeholders are intentionally left in the implementation tasks. Type names are consistent across tasks.
