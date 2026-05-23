"use client";

import { motion } from "framer-motion";
import { formatMoney, type CheckReport } from "@/lib/estimate-core";
import { Printer, CheckCircle, Lightbulb } from "@phosphor-icons/react";

const statusLabels: Record<CheckReport["summary"]["readinessStatus"], string> = {
  ready: "Готово к клиентской версии",
  needsReview: "Нужна проверка",
  blocked: "Есть блокирующие замечания",
};

const statusClasses: Record<CheckReport["summary"]["readinessStatus"], string> = {
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needsReview: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
};

function formatSignedMoney(value: number) {
  if (value === 0) return formatMoney(0);
  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

export function EstimateCheckReport({ report }: { report: CheckReport }) {
  const visibleFindings = report.findings.slice(0, 8);
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.section
      layout
      className="print-report mt-8 rounded-[2rem] border border-slate-200/50 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="flex flex-col gap-5 border-b border-zinc-100 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-tight text-zinc-600">
            итоговый отчёт
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">{report.summary.fileName}</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            Технический отчёт SmetaFix: арифметика, импорт, НДС, профиль формата и готовность к дальнейшей подготовке.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:items-start">
          <span className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusClasses[report.summary.readinessStatus]}`}>
            {statusLabels[report.summary.readinessStatus]}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Printer size={18} />
            Печать / PDF
          </motion.button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Строк", String(report.summary.lineCount)],
          ["Замечаний", String(report.summary.issueCount)],
          ["Итого расчёт", formatMoney(report.summary.grandTotalKopecks)],
          ["Разница с файлом", formatSignedMoney(report.summary.totalDifferenceKopecks)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-tight text-zinc-500">{label}</p>
            <p className="mt-2 font-mono text-xl font-semibold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.5rem] border border-zinc-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-zinc-950">Найденные замечания</h4>
            <span className="text-xs font-medium text-zinc-500">
              ошибок: {report.summary.errorCount}, предупреждений: {report.summary.warningCount}
            </span>
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="mt-5 grid gap-3">
            {visibleFindings.length > 0 ? (
              visibleFindings.map((finding) => (
                <motion.article variants={item} key={finding.id} className="rounded-xl bg-zinc-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-medium text-zinc-950">{finding.title}</p>
                    {finding.amountKopecks !== undefined && (
                      <span className="font-mono text-sm text-zinc-600">{formatSignedMoney(finding.amountKopecks)}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{finding.message}</p>
                </motion.article>
              ))
            ) : (
              <motion.div variants={item} className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100">
                <CheckCircle size={20} weight="fill" />
                Критичных арифметических замечаний не найдено.
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="rounded-[1.5rem] border border-zinc-100 p-5">
          <h4 className="font-semibold text-zinc-950">Рекомендации</h4>
          <motion.div variants={container} initial="hidden" animate="show" className="mt-5 grid gap-3">
            {report.recommendations.map((recommendation) => (
              <motion.article variants={item} key={recommendation.id} className="flex gap-3 rounded-xl bg-zinc-950 p-4 text-sm text-white">
                <Lightbulb size={20} weight="duotone" className="shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-medium text-white">{recommendation.title}</p>
                  <p className="mt-1 leading-relaxed text-zinc-400">{recommendation.message}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
