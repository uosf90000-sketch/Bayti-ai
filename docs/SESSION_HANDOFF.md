# SESSION HANDOFF — حالة المشروع للاستئناف الفوري

> آخر تحديث: 2026-07-15 · الفرع: `claude/bayti-ai-platform-kf18m3` · **اقرأ هذا الملف أولًا عند فتح جلسة جديدة**، ثم [PROJECT_CONSTITUTION](PROJECT_CONSTITUTION.md) و[ENGINEERING_BACKLOG](../ENGINEERING_BACKLOG.md).

## 1. ما تم إنجازه (مكتمل ومعتمد من المؤسس)

| المرحلة | الحالة |
|---------|--------|
| PRD كامل (الأقسام 1–12) + 15 مبدأ + دستور المجلس | ✅ معتمد — `docs/02-prd.md` هو المرجع عند أي تعارض |
| Architecture v1.0 (Frozen) + 36 ADR + قاموس ملزم | ✅ — أي تغيير معماري يتطلب ADR جديدًا بمصادقة المؤسس |
| وثائق الحوكمة (Freeze, Release Notes, Bootstrap, WOW, Constitution) | ✅ |
| Sprint 0: monorepo + العقود المجمدة كـ Zod (`packages/design-schema`, `contracts`) + tokens (`packages/ui`) + compose.dev + CI | ✅ |
| **VS-1** — الرحلة الأساسية تعمل: landing → OTP → dashboard → إنشاء+رفع → تحليل مرحلي → **مجلس حي (W3)** → أول preview | ✅ `v0.1-preview` (tag محلي فقط — انظر §8) |
| **VS-2** — النسخ الثلاث (W4) + التسوق + عدّاد التوفير (W6) + استبدال أرخص/أفخم + Feature Flags + تأمين OTP للإنتاج + لقطات README | ✅ |

## 2. ما بقي (بالترتيب الملزم — قرار مؤسس)

1. **VS-3 المحادثة:** الأساس المنطقي جاهز وغير موصول: `apps/web/lib/chat.ts` (intent parser mock للأوامر الثلاثة + `versionsStore` بمبدأ P7). **المتبقي:** شاشة `/projects/[id]/chat` (معاينة التعديل → فرق التكلفة → اعتماد = إصدار جديد → خط زمني للإصدارات + رجوع) + رابط دخول من الـ preview.
2. **VS-4 أول خدمة حقيقية — Supabase:** رفع المخطط إلى Storage + سجل المشروع + حفظ حالة التحليل. **قاعدة مؤسس: لا AI حقيقي قبل اكتمال الحفظ والاستئناف من checkpoint.** يحتاج من المؤسس: مشروع Supabase (URL + anon key).
3. **النشر على Vercel** بعد VS-3 — رابط تجريبي للجوال (اضبط `NEXT_PUBLIC_ALLOW_TEST_OTP=true` في بيئة الـ Preview فقط).
4. **⚠ جولة صقل الواجهات:** المؤسس صرّح أن لديه **تعقيبات كثيرة والواجهات الحالية لا ترضيه** — عند استلام ملاحظاته (شاشة بشاشة) تُعطى أولوية عالية قبل التوسع في شرائح جديدة.

## 3. Feature Flags الحالية (`apps/web/lib/flags.ts`)

`NEXT_PUBLIC_USE_MOCK_AUTH / _ANALYSIS / _COUNCIL / _RESULTS` — كلها **mock افتراضيًا** (تُطفأ بـ `=false` عند ربط الخدمة الحقيقية؛ الخدمة غير المربوطة تفشل بوضوح). **OTP التجريبي `1234`:** development فقط؛ في production معطّل بنيويًا إلا بـ `NEXT_PUBLIC_ALLOW_TEST_OTP=true` (لبيئات المعاينة حصريًا).

## 4. ما هو Mock وما هو حقيقي

- **حقيقي:** الواجهة كلها (RTL/جوال/Bayti Glass)، العقود المجمدة ككود، الحسابات على الشاشة (نسخ/توفير/إجماليات)، بنية الأحداث بعقد `CouncilSseEvent`.
- **Mock:** الدخول، التحليل (سيناريو §4.12)، المجلس (سيناريو فيلا النرجس §6.19)، النتائج والمنتجات (**المتاجر معلَّمة "متجر تجريبي / رابط تجريبي" بوضوح — قرار مؤسس: لا روابط تدّعي أنها حقيقية**)، والتخزين localStorage (يُستبدل بـ Supabase في VS-4).

## 5. أوامر التشغيل

```bash
pnpm install && cd apps/web && pnpm dev     # http://localhost:3000 — دخول: 05XXXXXXXX ثم 1234
pnpm build                                   # يجب أن يبقى أخضر (آخر بناء: 9 مسارات، 113KB)
pnpm typecheck                               # من الجذر لكل الحزم
```

## 6. قرارات وملاحظات مهمة للجلسة القادمة

- **Vertical Slices إلزامي** (UI→API→Logic→DB→Tests) — لا backend منفصل عن الواجهة، لا توسيع نطاق.
- الشاشات تستدعي `lib/services.ts` فقط — استبدال أي mock يقلب flag **بصفر تغيير في كود الشاشات** (AC12-3).
- بيانات فيلا النرجس (§6.19) هي بيانات الـ mock المرجعية في كل الشاشات.
- المؤسس يريد رؤية النسخ على رابط تجريبي (Vercel) بدل localhost — بعد VS-3.
- Golden Set: ما زلنا بانتظار مخططات حقيقية من المؤسس (يلزم Spike بوابة G-0).

## 7. المشاكل المؤجلة

| المشكلة | التفصيل | الحل المقترح عند الاستئناف |
|---------|----------|------------------------------|
| **CI — تعارض pnpm** | `pnpm/action-setup@v4` مع `version: 10` يتعارض مع حقل `packageManager: pnpm@10.33.0` في package.json (خطأ "Multiple versions of pnpm specified") فيفشل workflow | حذف سطر `version: 10` من `.github/workflows/ci.yml` والاعتماد على `packageManager` وحده — تعديل سطر واحد |
| دفع Git tags | بوابة git بهذه البيئة ترفض دفع الـ tags (403) — `v0.1-preview` محلي فقط | ادفع الـ tag من جهاز المؤسس، أو أنشئه من واجهة GitHub على commit `bd7abe3` |
| شاشة مراجعة المخطط (S5) | الرحلة الحالية تقفز من التحليل للمجلس مباشرة (موثق داخل الشاشة) | تُبنى ضمن شريحة لاحقة بعد VS-4 |
| صفحة `next-env.d.ts` وملفات build | مولّدة تلقائيًا — لا تحرر يدويًا | — |

## 8. مرجع سريع

- **الفرع:** `claude/bayti-ai-platform-kf18m3` (هو default في الريبو) · **الريبو:** `uosf90000-sketch/Bayti-ai`
- الوثائق المرجعية: `docs/02-prd.md` (المرجع الأعلى) · `docs/ADR.md` (36 قرارًا) · `docs/WOW_MOMENTS.md` (هوية التجربة) · `ENGINEERING_BACKLOG.md` (لوحة العمل الحية)
