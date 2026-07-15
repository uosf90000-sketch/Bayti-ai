import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "بيتي — Bayti AI | من مخططك إلى بيت جاهز للتنفيذ",
  description:
    "مجلس من وكلاء الذكاء الاصطناعي يحوّل مخطط منزلك إلى تصميم كامل بمنتجات سعودية حقيقية وتكلفة مفصلة.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0F1E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="bg-aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
