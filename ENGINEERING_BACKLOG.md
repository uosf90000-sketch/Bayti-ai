# Engineering Backlog — Bayti AI

> أداة عمل حية (ليست وثيقة تصميم). المرجع: PRD المعتمد كاملًا + ENGINEERING_BOOTSTRAP. البوابات G-0…G-5 حاكمة.

## Epics (مربوطة بأقسام الـ PRD المعتمدة)

| Epic | المرجع | البوابة |
|------|--------|---------|
| E1 Foundation & Contracts | Bootstrap Sprint 0 + §1.10 | G-0 |
| E2 Floorplan → Digital Twin | §4 | G-1 |
| E3 Intake & Style | §5 | G-1 |
| E4 Agent Council & Merge | §6 | G-2 |
| E5 Commerce Platform | §7 | G-3 |
| E6 Outputs & Rendering | §8 | G-4 |
| E7 Conversation & Editing | §9 | G-4 |
| E8 Billing & Plans | §10 | G-5 |
| E9 Security & Ops | §11 | G-5 |
| E10 UI/UX (Bayti Glass + الشاشات) | §12 + §3 + WOW | G-4 |
| E-Debt | TD-01 (تحديث وثائق الجيل الأول أثناء التنفيذ) · TD-02 (traceability CSV) · TD-08 (تقسيم PRD لملفات) | مستمر |

## Sprint 0 — "الأساس والقياس" (أسبوعان — جارٍ الآن)

| # | المهمة | الحالة |
|---|--------|--------|
| S0-1 | Monorepo skeleton (pnpm workspaces، tsconfig base، بنية §07) | ✅ هذه الدفعة |
| S0-2 | `packages/design-schema`: العقود المجمدة كـ Zod (Twin، AgentRun، Proposal، DecisionExplanation، StyleVector، IntakeBundle) | ✅ v0 هذه الدفعة — التوسعة تباعًا |
| S0-3 | `packages/contracts`: عقود API لشاشات Sprint 1 (auth/projects/upload/council-events) | ✅ v0 هذه الدفعة |
| S0-4 | `packages/ui`: Bayti Glass tokens (§12.1) | ✅ v0 هذه الدفعة |
| S0-5 | `infra/compose.dev.yml` (postgres+pgvector، redis، minio) | ✅ هذه الدفعة |
| S0-6 | CI: install + typecheck + secret scanning hook | ✅ v0 هذه الدفعة |
| S0-7 | Turborepo pipeline | ⬜ |
| S0-8 | scaffold `apps/web` (Next.js RTL) + `apps/api` (NestJS) | ⬜ التالي مباشرة |
| S0-9 | طبقة LLM الموحدة (`ai/llm`): providers، cost logging، prompt versioning | ⬜ |
| S0-10 | **Spike القياس (بوابة G-0):** تحليل 20 مخططًا حقيقيًا + مجلس مصغر — تقرير دقة/زمن/تكلفة مقابل الميزانيات | ⬜ يحتاج مخططات Golden Set |
| S0-11 | Golden Set: جمع وتوسيم 30+ مخططًا (عمل بيانات — بدأ خلال مرحلة الوثائق) | 🔶 مستمر |
| S0-12 | MSW mock layer + بيانات فيلا النرجس المرجعية (§12.2) | ⬜ |

## Sprint 1 — "أول نسخة تعمل" (أولويات المؤسس — الواجهة أولًا فوق Mocks)

| # | التسليم | المرجع |
|---|---------|--------|
| S1-1 | تسجيل الدخول OTP (S1) — mock ثم مزود SMS | §3-S1 |
| S1-2 | لوحة المشاريع (S2) بحالتها الفارغة ومشروع المثال | §3-S2 |
| S1-3 | إنشاء مشروع + رفع المخطط (S3) بمعاينة وحالات الفشل | §3-S3 |
| S1-4 | شاشة التحليل (S4) بمراحل حية (mock stream) | §3-S4 |
| S1-5 | **واجهة مجلس الذكاء الحية (S8)** — 11 بطاقة وكيل، لحظة W3 | §3-S8 + WOW |
| S1-6 | Bayti Glass: البطاقات الزجاجية المتحركة + motion presets | §12.1 |
| S1-7 | RTL كامل + جوال أولًا (كل الشاشات أعلاه) | §3.2 |
| S1-8 | كل الشاشات فوق MSW بعقود `contracts` الثابتة — **صفر تغيير لاحق عند ربط الخدمات** | §12.2 / AC12-3 |

**Definition of Done لكل مهمة واجهة:** Storybook بحالاتها + RTL + جوال + فشل/فارغ/تحميل + reduced-motion.

## حالة الشرائح (Vertical Slices — تحديث حي)

| الشريحة | الحالة |
|---------|--------|
| VS-1: الرحلة الأساسية (landing→login→dashboard→upload→analysis→council→preview) | ✅ **v0.1-preview** (tag محلي — دفع الـ tags محجوب من الـ proxy بـ403؛ المرجع commit bd7abe3) |
| VS-2: النسخ الثلاث + التسوق (W4 تبديل فوري، W6 عدّاد التوفير، استبدال أرخص/أفخم P4، متاجر معلَّمة "تجريبي") + Feature Flags + تأمين OTP للإنتاج | ✅ هذه الدفعة |
| VS-3: المحادثة (غيّر الكنبة/أفخم/خفّض 10% + معاينة قبل الاعتماد + فرق التكلفة + إصدارات ورجوع) | 🔶 **التالي** — الأساس المنطقي جاهز (`apps/web/lib/chat.ts`: intent parser + versions store، **غير موصول بأي شاشة**)؛ المتبقي: شاشة `/projects/[id]/chat` + الربط |
| VS-4: أول خدمة حقيقية — Supabase (Storage للمخطط + سجل المشروع + حالة التحليل بـ checkpoint) قبل أي AI حقيقي | ⬜ بعد VS-3 |
| النشر على Vercel (رابط تجريبي للجوال) | ⬜ بعد VS-4 |
| جولة UI Polish مخصصة (انظر UI_POLISH_BACKLOG) | ⬜ بعد Vercel — آخر خطوة قبل الإطلاق التجريبي |
| **إعادة بناء 4 شاشات** (Landing/Dashboard/AI Council/Project Results) — Bayti Design System v2 (ثيم مزدوج، Hero SVG متحرك، Marquee للوكلاء، حلقة تقدم المجلس، مشاهد غرف SVG، لمسة W7 ليل/نهار) | ✅ **Functional Approved** — ⬜ **Visual Direction: Needs Further Iteration (ليست Production UI)** — انظر [UI_POLISH_BACKLOG](docs/UI_POLISH_BACKLOG.md) للبنود المؤجلة، تُنفَّذ بعد VS-3/VS-4/Vercel |

## قواعد التنفيذ (من المجمد — تذكير دائم)

لا PR بلا مراجعة + أخضر كامل · كل عتبة في config · كل schema بإصدار · القواعد الهندسية في Rule Engine لا prompts · أي تغيير معماري = ADR جديد بمصادقة المؤسس.
