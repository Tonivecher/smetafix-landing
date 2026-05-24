"use client";

import { motion } from "framer-motion";
import { formatMoney, type EstimateAnalyticsResult, type AbcClass } from "@/lib/estimate-core";
import { ChartBar, Warning, TrendUp, Info, ListNumbers, Percent } from "@phosphor-icons/react";

const abcBadges: Record<AbcClass, { bg: string; text: string; label: string; desc: string }> = {
  A: {
    bg: "bg-red-50 border-red-100",
    text: "text-red-700",
    label: "Класс A",
    desc: "80% всего бюджета сметы. Критическая зона контроля цен.",
  },
  B: {
    bg: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
    label: "Класс B",
    desc: "15% бюджета сметы. Средний приоритет проверки.",
  },
  C: {
    bg: "bg-zinc-50 border-zinc-100",
    text: "text-zinc-600",
    label: "Класс C",
    desc: "Оставшиеся 5% бюджета. Мелкие сопутствующие расходы.",
  },
};

const anomalyIcons = {
  high_concentration: <Warning size={20} className="text-red-500" />,
  anomalous_price: <TrendUp size={20} className="text-amber-500" />,
  price_surge: <TrendUp size={20} className="text-amber-500" />,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 350, damping: 26 },
  },
};

export function AnalyticsPanel({
  analytics,
  linesMap,
}: {
  analytics: EstimateAnalyticsResult;
  linesMap: Record<string, { name: string; unit: string; quantity: number; unitPriceKopecks: number }>;
}) {
  const { totalBudgetKopecks, classACostKopecks, classACount, averageLineCostKopecks } = analytics.metrics;
  const classAPercent = totalBudgetKopecks > 0 ? ((classACostKopecks / totalBudgetKopecks) * 100).toFixed(1) : "0";

  return (
    <motion.section
      layout
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-12 w-full max-w-7xl mx-auto space-y-8"
      id="budget-analytics"
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <ChartBar size={24} className="text-emerald-600 shrink-0" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Аналитика бюджета и оптимизация</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Умная раскладка стоимости по разделам, ABC-анализ цен и автоматические рекомендации по снижению затрат.
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Metric 1: Grand Total */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, scale: 1.01 }}
          className="md:col-span-1 p-6 rounded-3xl border border-zinc-200/60 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Всего по смете</span>
            <ListNumbers size={18} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {formatMoney(totalBudgetKopecks)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">Расчётная стоимость без учета дополнительных наценок.</p>
          </div>
        </motion.div>

        {/* Metric 2: Class A cost */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, scale: 1.01 }}
          className="md:col-span-1 p-6 rounded-3xl border border-zinc-200/60 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Доля класса А</span>
            <Percent size={18} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-red-600 tracking-tight">
              {classAPercent}%
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">
              Сконцентрирована в {classACount} самых дорогих позициях ({formatMoney(classACostKopecks)}).
            </p>
          </div>
        </motion.div>

        {/* Metric 3: Average line cost */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, scale: 1.01 }}
          className="md:col-span-1 p-6 rounded-3xl border border-zinc-200/60 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Средняя строка</span>
            <ListNumbers size={18} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {formatMoney(averageLineCostKopecks)}
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">Усредненная расчетная стоимость одной работы в смете.</p>
          </div>
        </motion.div>

        {/* Metric 4: Recommendations Count */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, scale: 1.01 }}
          className="md:col-span-1 p-6 rounded-3xl border border-zinc-200/60 bg-white shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Точки оптимизации</span>
            <Info size={18} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {analytics.anomalies.length}
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">
              {analytics.anomalies.length > 0
                ? "Выявлены аномалии и возможности для снижения сметы."
                : "Отклонений стоимости и сильных концентраций не обнаружено."}
            </p>
          </div>
        </motion.div>

      </div>

      {/* Main Analysis Block */}
      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Left Column: Sections Breakdown */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-5 p-6 rounded-[2.5rem] border border-zinc-200/60 bg-white shadow-sm flex flex-col"
        >
          <h3 className="text-lg font-bold text-zinc-950 tracking-tight">Распределение затрат по разделам</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Вклад каждого сметного раздела в общий бюджет.</p>

          <div className="mt-6 flex-1 space-y-5">
            {analytics.sectionsBreakdown.map((sec, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-zinc-900 truncate max-w-[240px]">{sec.name}</span>
                  <span className="text-zinc-500">
                    {formatMoney(sec.totalKopecks)} ({sec.percent}%)
                  </span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sec.percent}%` }}
                    transition={{ type: "spring" as const, stiffness: 80, damping: 15, delay: 0.1 * i }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Recommendations & Actionable tips */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-7 p-6 rounded-[2.5rem] border border-zinc-200/60 bg-white shadow-sm flex flex-col"
        >
          <h3 className="text-lg font-bold text-zinc-950 tracking-tight">Автоматические советы по оптимизации сметы</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Интеллектуальные подсказки по проверке аномалий бюджетов.</p>

          <div className="mt-6 flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {analytics.anomalies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                <Info size={40} className="mb-3 text-zinc-300" />
                <p className="text-sm font-semibold">Смета хорошо распределена</p>
                <p className="text-xs mt-1">Все расценки находятся в пределах нормальных средних уровней.</p>
              </div>
            ) : (
              analytics.anomalies.map((anom, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 2 }}
                  className={`flex gap-4 p-4 rounded-2xl border ${
                    anom.severity === "critical"
                      ? "border-red-100 bg-red-50/40 text-red-950"
                      : "border-amber-100 bg-amber-50/40 text-amber-950"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{anomalyIcons[anom.type]}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold truncate max-w-[320px]">{anom.lineName}</h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          anom.severity === "critical"
                            ? "bg-red-100/70 border-red-200 text-red-700"
                            : "bg-amber-100/70 border-amber-200 text-amber-700"
                        }`}
                      >
                        {anom.severity === "critical" ? "Критическая зона" : "Внимание"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      {anom.message}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

      </div>

      {/* ABC Class breakdown details list */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-[2.5rem] border border-zinc-200/60 bg-white shadow-sm"
      >
        <h3 className="text-lg font-bold text-zinc-950 tracking-tight">ABC-анализ сметных строк</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Деление сметы на ценовые классы важности. Фокусируйте аудит цен на строках класса «А».
        </p>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {(["A", "B", "C"] as AbcClass[]).map((cls) => {
            const badge = abcBadges[cls];
            const classLines = Object.entries(analytics.abcClasses).filter(([, c]) => c === cls);
            
            return (
              <div key={cls} className="flex flex-col rounded-3xl border border-zinc-100 bg-zinc-50/30 p-5">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">
                    {classLines.length} позиций
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed">
                  {badge.desc}
                </p>

                <div className="mt-4 flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {classLines.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic p-3 text-center">Нет строк</p>
                  ) : (
                    classLines.map(([lineId]) => {
                      const line = linesMap[lineId];
                      if (!line) return null;
                      return (
                        <div key={lineId} className="flex items-center justify-between gap-3 text-xs bg-white border border-zinc-100 p-2.5 rounded-xl">
                          <span className="truncate text-zinc-900 font-semibold max-w-[180px]">
                            {line.name}
                          </span>
                          <span className="font-mono font-bold text-zinc-950 shrink-0">
                            {formatMoney(line.quantity * line.unitPriceKopecks)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </motion.section>
  );
}
