"use client";

import React from "react";
import { formatMoney, runEstimateAnalytics } from "@/lib/estimate-core";
import { CheckCircle, Warning, Info, Lightbulb, ArrowsClockwise, FileText, ChartBar } from "@phosphor-icons/react";
import type { CheckReport, ComparisonReport, ImportedEstimateLine } from "@/lib/estimate-core/types";

function formatSignedMoney(value: number) {
  if (value === 0) return formatMoney(0);
  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

// ----------------------------------------------------
// SINGLE AUDIT PDF TEMPLATE
// ----------------------------------------------------
export function SingleAuditPdfTemplate({
  report,
  lines,
  vatRate,
}: {
  report: CheckReport;
  lines: ImportedEstimateLine[];
  vatRate: number;
}) {
  const { summary, findings, recommendations } = report;

  // Calculate stats for the visual error chart
  const totalLines = summary.lineCount;
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const warningCount = findings.filter(f => f.severity === "warning").length;
  const okLinesCount = Math.max(0, totalLines - criticalCount - warningCount);

  const pctCritical = totalLines > 0 ? (criticalCount / totalLines) * 100 : 0;
  const pctWarning = totalLines > 0 ? (warningCount / totalLines) * 100 : 0;
  const pctOk = totalLines > 0 ? (okLinesCount / totalLines) * 100 : 0;

  // Readiness styling
  const readinessTheme = {
    ready: {
      bg: "bg-emerald-500",
      text: "text-emerald-700",
      border: "border-emerald-200",
      pillBg: "bg-emerald-50 text-emerald-800 border-emerald-100",
      title: "Смета готова к согласованию",
      description: "Критичных арифметических ошибок и расхождений сумм не обнаружено.",
      icon: <CheckCircle size={24} weight="fill" className="text-emerald-500" />
    },
    needsReview: {
      bg: "bg-amber-500",
      text: "text-amber-700",
      border: "border-amber-200",
      pillBg: "bg-amber-50 text-amber-800 border-amber-100",
      title: "Смете требуется проверка",
      description: "Выявлены незначительные погрешности округления или расхождения формул.",
      icon: <Warning size={24} weight="fill" className="text-amber-500" />
    },
    blocked: {
      bg: "bg-red-500",
      text: "text-red-700",
      border: "border-red-200",
      pillBg: "bg-red-50 text-red-800 border-red-100",
      title: "Обнаружены критические ошибки",
      description: "Найдены расхождения в итоговых суммах строк, формулах НДС или коэффициентах.",
      icon: <Warning size={24} weight="fill" className="text-red-500" />
    }
  }[summary.readinessStatus || "needsReview"];

  // Filter out critical/material items for the top mismatches list
  const discrepancies = lines.filter(l => l.differenceKopecks !== undefined && Math.abs(l.differenceKopecks) > 100);

  return (
    <div className="w-[794px] bg-white p-10 font-sans text-zinc-950 antialiased shadow-sm border border-zinc-100 flex flex-col gap-6 select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-md">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-mono text-xl font-bold text-white shadow-md">
              S
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400">SmetaFix</span>
              <h2 className="text-sm font-semibold text-zinc-300">Аудит сметной документации</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="block font-mono text-xs text-zinc-400">Дата отчёта</span>
            <span className="text-sm font-medium text-zinc-100">
              {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-800 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">проверяемый файл</span>
          <h1 className="text-lg font-semibold tracking-tight text-white mt-0.5">{summary.fileName}</h1>
        </div>
      </div>

      {/* Audit Verdict */}
      <div className={`rounded-2xl border ${readinessTheme.border} ${readinessTheme.pillBg} p-4 flex gap-4 items-start`}>
        <div className="mt-0.5 shrink-0">{readinessTheme.icon}</div>
        <div>
          <h3 className="font-semibold text-zinc-900 leading-tight">{readinessTheme.title}</h3>
          <p className="mt-1 text-xs text-zinc-600 leading-relaxed">{readinessTheme.description}</p>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего строк", value: summary.lineCount, sub: "позиций сметы" },
          { label: "Замечаний", value: summary.issueCount, sub: `критичных: ${criticalCount}` },
          { label: "Итоговый расчёт", value: formatMoney(summary.grandTotalKopecks), sub: `включая НДС ${vatRate}%` },
          { 
            label: "Разница с файлом", 
            value: formatSignedMoney(summary.totalDifferenceKopecks), 
            sub: summary.totalDifferenceKopecks === 0 ? "расхождений нет" : "требует корректировки",
            valClass: summary.totalDifferenceKopecks !== 0 ? "text-amber-600" : "text-emerald-600"
          },
        ].map((m, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 flex flex-col justify-between h-24">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">{m.label}</span>
            <div>
              <span className={`block font-mono text-base font-bold text-zinc-900 mt-1 ${m.valClass || ""}`}>{m.value}</span>
              <span className="block text-[10px] text-zinc-500 mt-0.5">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Error Distribution visualizer */}
      <div className="rounded-2xl border border-zinc-100 p-5 bg-zinc-50/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Визуальный баланс расхождений</h4>
        <div className="mt-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200">
            {pctOk > 0 && <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pctOk}%` }} />}
            {pctWarning > 0 && <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${pctWarning}%` }} />}
            {pctCritical > 0 && <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${pctCritical}%` }} />}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Корректные строки: {okLinesCount} ({Math.round(pctOk)}%)</span>
            </div>
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Предупреждения: {warningCount} ({Math.round(pctWarning)}%)</span>
              </div>
            )}
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>Ошибки расчёта: {criticalCount} ({Math.round(pctCritical)}%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancies Table (Max 8 rows to fit nicely on page 1) */}
      {discrepancies.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Детали основных расхождений</h4>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50/50">
                <th className="px-4 py-2 w-14">Стр.</th>
                <th className="px-4 py-2">Наименование позиции</th>
                <th className="px-4 py-2 w-24 text-right">В файле</th>
                <th className="px-4 py-2 w-24 text-right">Расчёт</th>
                <th className="px-4 py-2 w-24 text-right">Разница</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {discrepancies.slice(0, 8).map((line, idx) => {
                const isCritical = line.differenceSeverity === "critical";
                const isMaterial = line.differenceSeverity === "material";
                return (
                  <tr key={idx} className="hover:bg-zinc-50/30">
                    <td className="px-4 py-2.5 font-mono text-zinc-500">{line.sourceRowNumber || idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-zinc-800 truncate max-w-[280px]">{line.name}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-500 text-right">
                      {line.declaredTotalKopecks !== undefined ? formatMoney(line.declaredTotalKopecks) : "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-zinc-800 text-right">{formatMoney(line.calculatedTotalKopecks)}</td>
                    <td className={`px-4 py-2.5 font-mono font-semibold text-right ${isCritical ? "text-red-600" : isMaterial ? "text-orange-600" : "text-amber-600"}`}>
                      {formatSignedMoney(line.differenceKopecks || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {discrepancies.length > 8 && (
            <div className="bg-zinc-50/80 px-4 py-2 text-center text-[10px] text-zinc-500 border-t border-zinc-100">
              Показаны 8 из {discrepancies.length} расхождений. Все исправления внесены в экспортированный файл Excel.
            </div>
          )}
        </div>
      )}

      {/* Recommendations & Disclaimer */}
      <div className="grid grid-cols-[3fr_2fr] gap-6 mt-2">
        <div className="rounded-2xl border border-zinc-100 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <Lightbulb size={16} className="text-emerald-500" /> Рекомендации аудита
          </h4>
          <div className="flex flex-col gap-2">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="text-xs leading-relaxed">
                <span className="font-semibold text-zinc-800">{rec.title}: </span>
                <span className="text-zinc-600">{rec.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 p-4 bg-zinc-50/10 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Info size={16} /> Важное уведомление
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Отчёт SmetaFix является результатом автоматизированного математического и структурного анализа сметных данных. 
              Проверка не является государственной экспертизой и носит рекомендательный характер.
            </p>
          </div>
          <div className="text-[9px] text-zinc-400 border-t border-zinc-100 pt-2 mt-4 flex items-center gap-1">
            <FileText size={10} />
            <span>Верифицировано ядром расчётов SmetaFix Core v1.0</span>
          </div>
        </div>
      </div>

      {/* PAGE 2: BUDGET ANALYTICS & OPTIMIZATION */}
      {(() => {
        const analytics = runEstimateAnalytics(lines);
        const classAPercent = summary.grandTotalKopecks > 0 
          ? ((analytics.metrics.classACostKopecks / summary.grandTotalKopecks) * 100).toFixed(1) 
          : "0";

        return (
          <div className="border-t border-dashed border-zinc-200 pt-10 mt-10 flex flex-col gap-6" style={{ minHeight: "1000px" }}>
            {/* Page 2 Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChartBar size={22} className="text-emerald-500" />
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-500">SmetaFix Analytics</span>
                  <h2 className="text-sm font-semibold text-zinc-600">Анализ структуры бюджета и советы по оптимизации</h2>
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-medium">Страница 2</span>
            </div>

            {/* Analytics Summary Banner */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Всего разделов", value: analytics.sectionsBreakdown.length, sub: "группировка по строкам" },
                { label: "Позиций класса А", value: analytics.metrics.classACount, sub: `${classAPercent}% бюджета сметы` },
                { label: "Средняя стоимость работы", value: formatMoney(analytics.metrics.averageLineCostKopecks), sub: "по всем строкам" },
              ].map((m, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 h-20 flex flex-col justify-between">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400">{m.label}</span>
                  <div>
                    <span className="block font-mono text-sm font-bold text-zinc-900 mt-0.5">{m.value}</span>
                    <span className="block text-[9px] text-zinc-500">{m.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sections Breakdown Grid */}
            <div className="rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Сметная стоимость по разделам</h4>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50/50">
                    <th className="px-4 py-2">Сметный раздел</th>
                    <th className="px-4 py-2 w-20 text-center">Строк</th>
                    <th className="px-4 py-2 w-32 text-right">Сумма раздела</th>
                    <th className="px-4 py-2 w-24 text-right">Доля в %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {analytics.sectionsBreakdown.slice(0, 10).map((sec, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/30">
                      <td className="px-4 py-2.5 font-semibold text-zinc-800 truncate max-w-[320px]">{sec.name}</td>
                      <td className="px-4 py-2.5 text-zinc-500 text-center">{sec.itemCount}</td>
                      <td className="px-4 py-2.5 font-mono text-zinc-900 text-right">{formatMoney(sec.totalKopecks)}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-zinc-900 text-right">{sec.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Budget Anomalies and Warnings */}
            <div className="rounded-2xl border border-zinc-100 p-5 bg-zinc-50/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                <Warning size={16} className="text-red-500" /> Выявленные точки оптимизации бюджета
              </h4>
              <div className="flex flex-col gap-3">
                {analytics.anomalies.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Специфических отклонений стоимости и сильных перекосов бюджета не обнаружено.</p>
                ) : (
                  analytics.anomalies.slice(0, 4).map((anom, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex gap-3 ${anom.severity === "critical" ? "border-red-100 bg-red-50/40" : "border-amber-100 bg-amber-50/40"}`}>
                      <div className="mt-0.5 shrink-0">
                        {anom.severity === "critical" ? <Warning size={16} className="text-red-500" /> : <Info size={16} className="text-amber-500" />}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-900">{anom.lineName}</h5>
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{anom.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-[10px] text-zinc-400 mt-auto">
              <span>Анализ сметных концентраций SmetaFix Core Analytics v1.0</span>
              <span>Дата выгрузки: {new Date().toLocaleDateString("ru-RU")}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ----------------------------------------------------
// ESTIMATE COMPARISON PDF TEMPLATE
// ----------------------------------------------------
export function ComparisonPdfTemplate({
  report,
  origFileName,
  revFileName,
}: {
  report: ComparisonReport;
  origFileName: string;
  revFileName: string;
}) {
  const { summary, lines } = report;

  // Calculate totals and percentages for visual change chart
  const total = lines.length;
  const added = summary.addedLinesCount;
  const removed = summary.removedLinesCount;
  const modified = summary.modifiedLinesCount;
  const unchanged = summary.unchangedLinesCount;

  const pctAdded = total > 0 ? (added / total) * 100 : 0;
  const pctRemoved = total > 0 ? (removed / total) * 100 : 0;
  const pctModified = total > 0 ? (modified / total) * 100 : 0;
  const pctUnchanged = total > 0 ? (unchanged / total) * 100 : 0;

  // Significant changes filter
  const changedLines = lines.filter(l => l.changeType !== "unchanged");

  return (
    <div className="w-[794px] bg-white p-10 font-sans text-zinc-950 antialiased shadow-sm border border-zinc-100 flex flex-col gap-6 select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-md">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-mono text-xl font-bold text-white shadow-md">
              C
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-blue-400">SmetaFix Comparison</span>
              <h2 className="text-sm font-semibold text-zinc-300">Сопоставление двух версий сметы</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="block font-mono text-xs text-zinc-400">Дата анализа</span>
            <span className="text-sm font-medium text-zinc-100">
              {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 text-xs">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">исходная версия (А)</span>
            <p className="font-medium text-zinc-200 truncate mt-0.5">{origFileName}</p>
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">новая редакция (Б)</span>
            <p className="font-medium text-zinc-200 truncate mt-0.5">{revFileName}</p>
          </div>
        </div>
      </div>

      {/* Comparison Verdict Alert */}
      <div className={`rounded-2xl border p-4 flex gap-4 items-start ${
        summary.totalDeltaKopecks < 0 
          ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
          : summary.totalDeltaKopecks > 0 
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-zinc-50 border-zinc-200 text-zinc-800"
      }`}>
        <div className="mt-0.5 shrink-0">
          <ArrowsClockwise size={24} weight="bold" className={summary.totalDeltaKopecks < 0 ? "text-emerald-500" : summary.totalDeltaKopecks > 0 ? "text-amber-500" : "text-zinc-500"} />
        </div>
        <div>
          <h3 className="font-semibold leading-tight">
            {summary.totalDeltaKopecks < 0 
              ? `Бюджет сметы снижен на ${formatMoney(Math.abs(summary.totalDeltaKopecks))}`
              : summary.totalDeltaKopecks > 0 
                ? `Бюджет сметы увеличен на ${formatMoney(summary.totalDeltaKopecks)}`
                : "Общая сумма смет осталась без изменений"}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Сопоставлено позиций: {total}. Из них: добавлено {added}, удалено {removed}, скорректировано по ценам/объёмам {modified}.
          </p>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Бюджет оригинала (А)", value: formatMoney(summary.originalTotalKopecks), sub: "первоначальная сумма" },
          { label: "Бюджет новой сметы (Б)", value: formatMoney(summary.revisedTotalKopecks), sub: "сумма после правок" },
          { 
            label: "Разница бюджетов", 
            value: formatSignedMoney(summary.totalDeltaKopecks), 
            sub: summary.totalDeltaKopecks < 0 ? "экономия средств" : summary.totalDeltaKopecks > 0 ? "перерасход средств" : "суммы равны",
            valClass: summary.totalDeltaKopecks < 0 ? "text-emerald-600" : summary.totalDeltaKopecks > 0 ? "text-amber-600" : "text-zinc-600"
          },
        ].map((m, idx) => (
          <div key={idx} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 flex flex-col justify-between h-24">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">{m.label}</span>
            <div>
              <span className={`block font-mono text-base font-bold text-zinc-900 mt-1 ${m.valClass || ""}`}>{m.value}</span>
              <span className="block text-[10px] text-zinc-500 mt-0.5">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Changes Distribution Visualizer */}
      <div className="rounded-2xl border border-zinc-100 p-5 bg-zinc-50/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Характер изменений спецификации</h4>
        <div className="mt-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200">
            {pctUnchanged > 0 && <div className="h-full bg-zinc-400 transition-all duration-300" style={{ width: `${pctUnchanged}%` }} />}
            {pctModified > 0 && <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${pctModified}%` }} />}
            {pctAdded > 0 && <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pctAdded}%` }} />}
            {pctRemoved > 0 && <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${pctRemoved}%` }} />}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              <span>Без изменений: {unchanged} ({Math.round(pctUnchanged)}%)</span>
            </div>
            {modified > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Изменено: {modified} ({Math.round(pctModified)}%)</span>
              </div>
            )}
            {added > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Добавлено: {added} ({Math.round(pctAdded)}%)</span>
              </div>
            )}
            {removed > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>Удалено: {removed} ({Math.round(pctRemoved)}%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Changes Details Table (Max 8 rows) */}
      {changedLines.length > 0 && (
        <div className="rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Перечень основных изменений</h4>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-50/50">
                <th className="px-4 py-2 w-16">Статус</th>
                <th className="px-4 py-2">Наименование позиции</th>
                <th className="px-4 py-2 w-24 text-right">Версия А</th>
                <th className="px-4 py-2 w-24 text-right">Версия Б</th>
                <th className="px-4 py-2 w-24 text-right">Дельта</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {changedLines.slice(0, 8).map((line, idx) => {
                const badgeTheme = {
                  added: { text: "Добавлена", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                  removed: { text: "Удалена", bg: "bg-red-50 text-red-700 border-red-100 line-through" },
                  modified: { text: "Изменена", bg: "bg-amber-50 text-amber-700 border-amber-100" },
                  unchanged: { text: "Без изм.", bg: "bg-zinc-50 text-zinc-500 border-zinc-100" }
                }[line.changeType];

                return (
                  <tr key={idx} className="hover:bg-zinc-50/30">
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${badgeTheme.bg}`}>
                        {badgeTheme.text}
                      </span>
                    </td>
                    <td className={`px-4 py-2 font-medium text-zinc-800 truncate max-w-[260px] ${line.changeType === "removed" ? "line-through text-zinc-400" : ""}`}>
                      {line.name}
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-500 text-right">
                      {line.originalTotalKopecks !== undefined ? formatMoney(line.originalTotalKopecks) : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-800 text-right">
                      {line.revisedTotalKopecks !== undefined ? formatMoney(line.revisedTotalKopecks) : "—"}
                    </td>
                    <td className={`px-4 py-2 font-mono font-semibold text-right ${
                      line.changeType === "added" || (line.totalDeltaKopecks || 0) > 0 
                        ? "text-amber-600" 
                        : line.changeType === "removed" || (line.totalDeltaKopecks || 0) < 0 
                          ? "text-emerald-600" 
                          : "text-zinc-600"
                    }`}>
                      {formatSignedMoney(line.totalDeltaKopecks || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {changedLines.length > 8 && (
            <div className="bg-zinc-50/80 px-4 py-2 text-center text-[10px] text-zinc-500 border-t border-zinc-100">
              Показаны 8 из {changedLines.length} измененных позиций. Полный анализ доступен в веб-интерфейсе.
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-[10px] text-zinc-400">
        <span>Аналитический инструмент сопоставления смет SmetaFix Compare</span>
        <div className="flex items-center gap-1">
          <FileText size={10} />
          <span>Сгенерировано клиентом локально без передачи на сервер</span>
        </div>
      </div>
    </div>
  );
}
