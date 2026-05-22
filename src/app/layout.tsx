import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://smetafix.ru"),
  title: {
    default: "SmetaFix — проверка и оформление смет",
    template: "%s | SmetaFix",
  },
  description:
    "SmetaFix проверяет Excel-сметы, формулы, итоги, НДС и готовит аккуратный PDF для заказчика.",
  openGraph: {
    title: "SmetaFix — проверка и оформление смет",
    description:
      "Загрузите смету в Excel, найдите ошибки и скачайте исправленный файл или клиентский PDF.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
