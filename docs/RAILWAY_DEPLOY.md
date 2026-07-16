# النشر على Railway — إعداد المستودع (بدون نشر تلقائي)

> هذا الملف يوثّق الإعداد الذي جهّزناه في المستودع. النشر الفعلي يتم يدويًا من لوحة Railway.

## إعدادات الخدمة في لوحة Railway

| الإعداد | القيمة |
|---|---|
| **Root Directory** | `/` (جذر المستودع — اتركه فارغًا/الافتراضي) |
| **Build Command** | `pnpm install --frozen-lockfile && pnpm --filter @bayti/web build` |
| **Start Command** | `pnpm --filter @bayti/web start` |
| **Health Check Path** | `/api/health` |
| **Port** | تلقائي عبر `$PORT` — Railway يضبطه، Next.js (`next start`) يقرأه تلقائيًا. **لا تضبط PORT يدويًا.** |

هذه القيم موجودة أيضًا في `railway.json` بجذر المستودع — Railway يقرأها تلقائيًا عند الربط بالمستودع، فلا حاجة لإدخالها يدويًا في اللوحة إلا للتأكيد.

## لماذا Root Directory = جذر المستودع لا `apps/web`؟

المشروع Monorepo بـ pnpm workspaces (`@bayti/web` يعتمد على `@bayti/contracts` و`@bayti/ui` عبر `workspace:*`). ضبط Root Directory على `apps/web` يقصر سياق البناء على ذلك المجلد فقط ويكسر ربط حزم الـ workspace. لذلك: يبقى الجذر كما هو، والأوامر تستخدم `pnpm --filter @bayti/web` لتنفيذ install/build/start على التطبيق المستهدف فقط مع إبقاء كل الحزم المشتركة مرئية.

## متغيرات البيئة (Railway Variables — لا ملفات .env في الريبو)

كل شيء mock افتراضيًا؛ لا متغيرات مطلوبة للتشغيل الأساسي. المتغير الوحيد المفيد لتجربة تسجيل الدخول على النسخة المنشورة:

| المتغير | القيمة | الغرض |
|---|---|---|
| `NEXT_PUBLIC_ALLOW_TEST_OTP` | `true` | يُفعّل رمز الدخول التجريبي `1234` (معطّل بنيويًا في الإنتاج بدونه) |

اختياري لاحقًا (VS-4 — Supabase حقيقي، راجع `supabase/README.md`):
`NEXT_PUBLIC_USE_MOCK_PROJECTS=false`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`.

جميع متغيرات `NEXT_PUBLIC_USE_MOCK_*` الأخرى (`AUTH`/`ANALYSIS`/`COUNCIL`/`RESULTS`) تبقى `true` افتراضيًا دون ضبط — لا حاجة لإدخالها.

## فحص الصحة

`GET /api/health` → `{"status":"ok"}` بكود 200 — بدون اعتماديات، استجابة فورية (`apps/web/app/api/health/route.ts`).

## تحقق محلي تم إجراؤه قبل الدفع

- `pnpm install --frozen-lockfile` — القفل متزامن، لا تغييرات.
- `pnpm --filter @bayti/web build` — بناء ناجح، يتضمن `/api/health`.
- `PORT=3100 pnpm --filter @bayti/web start` — استمع على المنفذ من `$PORT` تلقائيًا، الصفحة الرئيسية و`/api/health` استجابا 200.
