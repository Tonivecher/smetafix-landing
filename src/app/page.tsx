import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[#f7eddc] px-4 py-8 text-[#27231d]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl flex-col justify-center">
        <p className="font-mono text-sm uppercase tracking-[0.22em] text-[#8a6945]">
          SmetaFix
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
          Выберите вариант лендинга
        </h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href="/awwwards"
            className="rounded-[1.5rem] border border-[#27231d]/12 bg-[#27231d] p-6 text-[#fbf7ec] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#b98142]"
          >
            <span className="text-sm font-semibold">Awwwards Creative</span>
            <span className="mt-8 block text-sm leading-6 text-[#d8c9b0]">
              Editorial-подача, тёмная атмосфера и выразительный продуктовый
              макет.
            </span>
          </Link>
          <Link
            href="/minimal"
            className="rounded-[1.5rem] border border-[#27231d]/12 bg-white p-6 transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#b98142]"
          >
            <span className="text-sm font-semibold">Minimal Workspace</span>
            <span className="mt-8 block text-sm leading-6 text-[#776d5f]">
              Спокойный рабочий интерфейс для подрядчиков, сметчиков и малого
              бизнеса.
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
