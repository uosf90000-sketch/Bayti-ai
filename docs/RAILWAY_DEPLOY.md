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

## متغيرات البيئة (Railway Variables — لا ملفات .env في الريبو، لا مفتاح يُدفع لـ Git إطلاقًا)

كل شيء mock افتراضيًا؛ لا متغيرات مطلوبة للتشغيل الأساسي بالوضع التجريبي. **لتفعيل التحليل وخط الإنتاج الحقيقيَين** (راجع `docs/FLOORPLAN_ANALYSIS.md` و`docs/DESIGN_PIPELINE.md`) هذه هي المتغيرات المطلوبة فعليًا — تُضبط حصرًا من لوحة Railway → Variables، أبدًا في أي ملف مُتتبَّع بالمستودع:

| المتغير | مطلوب لـ | ملاحظة |
|---|---|---|
| `ANTHROPIC_API_KEY` | تحليل المخططات الحقيقي + Design Engine | **خادم فقط** — لا يُقرأ إلا داخل `lib/vision/analyzeFloorplan.ts`/`lib/design/designEngine.ts` خلف Route Handlers، لا يصل أبدًا للمتصفح. بدونه: خطأ عربي واضح فورًا، لا سقوط لبيانات وهمية. |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | تفعيل التحليل الحقيقي | اضبطه `false` لتشغيل رؤية Claude الفعلية بدل السيناريو المحاكى. يبقى `true` (افتراضي) طالما لم يُضبط. |
| `NEXT_PUBLIC_USE_MOCK_PROJECTS` | تفعيل Supabase الحقيقي (سجل المشاريع + Storage + خط الإنتاج) | اضبطه `false` فقط بعد ضبط متغيرات Supabase أدناه — بدونها `getSupabaseClient()` يرمي خطأً واضحًا فورًا. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase الحقيقي | من لوحة مشروع Supabase → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase الحقيقي | مفتاح anon العام (ليس service role) — آمن للعميل، RLS تحمي البيانات. |
| `NEXT_PUBLIC_ALLOW_TEST_OTP` | تجربة الدخول على بيئة Preview فقط | `true` يُفعّل رمز `1234` — لا تضبطه في بيئة الإنتاج الفعلي. |

جميع متغيرات `NEXT_PUBLIC_USE_MOCK_*` الأخرى (`AUTH`/`COUNCIL`/`RESULTS`/`CATALOG`) تبقى `true` افتراضيًا دون ضبط — لا حاجة لإدخالها الآن.

**ملاحظة أمان:** لم يُتحقق تتبّع أي ملف `.env` في `git status`/`.gitignore` (يستثني `.env` و`.env.*` صراحة، يُبقي `.env.example` فقط) — لا سر مكشوف في المستودع في أي وقت من هذا المشروع.

## فحص الصحة

`GET /api/health` → `{"status":"ok"}` بكود 200 — بدون اعتماديات، استجابة فورية (`apps/web/app/api/health/route.ts`).

## تحقق محلي تم إجراؤه قبل الدفع

- `pnpm install --frozen-lockfile` — القفل متزامن، لا تغييرات.
- `pnpm --filter @bayti/web build` — بناء ناجح، يتضمن `/api/health`.
- `PORT=3100 pnpm --filter @bayti/web start` — استمع على المنفذ من `$PORT` تلقائيًا، الصفحة الرئيسية و`/api/health` استجابا 200.
