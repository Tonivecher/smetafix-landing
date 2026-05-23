"use client";

import { formatMoney, type CheckReport } from "@/lib/estimate-core";

const statusLabels: Record<CheckReport["summary"]["readinessStatus"], string> = {
  ready: "Готово к клиентской версии",
  needsReview: "Нужна проверка",
  blocked: "Есть блокирующие замечания",
};

const statusClasses: Record<CheckReport["summary"]["readinessStatus"], string> = {
  ready: "bg-emerald-50 text-emerald-900 border-emerald-200",
  needsReview: "bg-[#fff7e6] text-[#5a4127] border-[#b98142]/30",
  blocked: "bg-red-50 text-red-800 border-red-200",
};

function formatSignedMoney(value: number) {
  if (value === 0) {
    return formatMoney(0);
  }

  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

export function EstimateCheckReport({ report }: { report: CheckReport }) {
  const visibleFindings = report.findings.slice(0, 8);

  return (
    <section className="print-report rounded-[1.5rem] border border-[#27231d]/10 bg-white p-5 text-[#27231d]">
      <div className="flex flex-col gap-4 border-b border-[#27231d]/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-[#8f8068]">проверочный отчёт</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-normal">{report.summary.fileName}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#776d5f]">
            Технический отчёт SmetaFix: арифметика, импорт, НДС, профиль формата и готовность к дальнейшей подготовке.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:items-start">
          <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusClasses[report.summary.readinessStatus]}`}>
            {statusLabels[report.summary.readinessStatus]}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print min-h-10 rounded-full bg-[#27231d] px-4 py-2 text-sm font-semibold text-[#fbf7ec] transition hover:bg-[#3a342b] focus:outline-none focus:ring-2 focus:ring-[#b98142]"
          >
            Печать / PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Строк", String(report.summary.lineCount)],
          ["Замечаний", String(report.summary.issueCount)],
          ["Итого расчёт", formatMoney(report.summary.grandTotalKopecks)],
          ["Разница с файлом", formatSignedMoney(report.summary.totalDifferenceKopecks)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#27231d]/10 bg-[#fbf7ec] p-4">
            <p className="text-xs uppercase tracking-normal text-[#8f8068]">{label}</p>
            <p className="mt-2 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#27231d]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Найденные замечания</h4>
            <span className="text-xs text-[#776d5f]">
              ошибок: {report.summary.errorCount}, предупреждений: {report.summary.warningCount}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {visibleFindings.length > 0 ? (
              visibleFindings.map((finding) => (
                <article key={finding.id} className="rounded-2xl bg-[#f8f1e4] p-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-semibold">{finding.title}</p>
                    {finding.amountKopecks !== undefined && (
                      <span className="font-mono text-xs text-[#5a4127]">{formatSignedMoney(finding.amountKopecks)}</span>
                    )}
                  </div>
                  <p className="mt-2 leading-6 text-[#776d5f]">{finding.message}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-[#f8f1e4] p-3 text-sm text-[#776d5f]">
                Критичных арифметических замечаний не найдено.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#27231d]/10 p-4">
          <h4 className="font-semibold">Рекомендации</h4>
          <div className="mt-4 grid gap-3">
            {report.recommendations.map((recommendation) => (
              <article key={recommendation.id} className="rounded-2xl bg-[#27231d] p-3 text-sm text-[#f7eddc]">
                <p className="font-semibold text-[#b98142]">{recommendation.title}</p>
                <p className="mt-2 leading-6 text-[#d8c9b0]">{recommendation.message}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
