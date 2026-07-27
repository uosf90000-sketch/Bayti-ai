import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const plexAr = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بيتي — Bayti AI | من مخططك إلى بيت جاهز للتنفيذ",
  description:
    "مجلس من وكلاء الذكاء الاصطناعي يحوّل مخطط منزلك إلى تصميم كامل بمنتجات سعودية حقيقية وتكلفة مفصلة.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
    { media: "(prefers-color-scheme: light)", color: "#f7f2e9" },
  ],
};

/** يُنفَّذ قبل أول رسم لمنع وميض الثيم (FOUC) — يقرأ التفضيل المحفوظ ثم النظام */
const THEME_INIT = `
try {
  var t = localStorage.getItem("bayti.theme.v1");
  if (!t) t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  if (t === "light") document.documentElement.setAttribute("data-theme", "light");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plexAr.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <div className="bg-aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
