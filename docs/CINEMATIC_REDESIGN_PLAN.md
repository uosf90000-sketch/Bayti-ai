# خطة إعادة التصميم السينمائي — Bayti Web

**الحالة:** مرحلة 1 (تحليل + خطة) منجزة. التنفيذ جارٍ عبر مراحل لاحقة على نفس الفرع.

## 1. ما اكتشفناه في المستودع الحالي

`apps/web` تطبيق Next.js 15 / React 19 / TypeScript ناضج فعليًا — ليس هيكلًا فارغًا:

- **نظام تصميم موجود بالفعل** (`packages/ui/src/tokens.ts` + `app/globals.css`): "Bayti Glass" — خلفية ليلية دافئة (`night`/`sand`/`gold`)، طباعة عربية IBM Plex Sans Arabic، أزرار/بطاقات/حركة موحّدة عبر tokens مركزية (`--dur-*`, `--ease-*`)، `prefers-reduced-motion` محترم في كل مكان، RTL أصلي.
- **مبدأ منتج موثّق صراحة في الكود (P8):** *"لا صور، لا أشخاص، لا تصيير مزيّف"* — كل مشاهد الغرف رسوم SVG بنيوية مشتقة من التوأم الرقمي (`components/scene.tsx`)، وعارض ثلاثي الأبعاد حقيقي (`components/scene3d.tsx`) يبني هندسة CAD فعلية من بيانات مستخرجة حقًا، مع رسالة صادقة صريحة عند نقص الدقة بدل ادّعاء دقة غير موجودة (P9 "لا تخمين").
- **معمارية Mock-First بعقود مجمّدة** (`lib/flags.ts`): كل خدمة (تحليل، مجلس، مشاريع، كتالوج) تُستبدل بقلب flag واحد دون تغيير كود الشاشات — التطبيق يعمل اليوم في وضعين معًا: mock كامل (فيلا "حي النرجس" كمرجع) ومسار حقيقي (`source: "vlm"`) يعرض فقط ما اكتُشف فعليًا.
- **خط إنتاج حقيقي فعلي خلف الشاشات:** رفع → تحليل رؤية حقيقي (`lib/vision/analyzeFloorplan.ts`) → توأم رقمي (`lib/twin.ts`) → هندسة CAD (`lib/geometry/*`) → محرك تصميم يستدعي Claude لكل غرفة (`lib/design/designEngine.ts`) → مطابقة كتالوج حقيقي (`lib/catalog/repository.ts`, Supabase) → محرك تكلفة صرف لا اختلاق (`lib/design/costEngine.ts`).
- **الشاشة المستهدفة بالاستبدال الأساسي:** `app/projects/[id]/design/page.tsx` — لوحة تقليدية: بطاقة لكل غرفة، وصندوق ثلاثي أبعاد صغير (300px) قابل للطي بأزرار تحكم نصية. هذا هو "الصندوق التقليدي" الذي طلب المستخدم استبداله بتجربة استكشاف سينمائية.

## 2. قرار تصميم مهم: نلتزم بمبدأ P8 (لا صور مزيّفة)

طلب المستخدم "صورة Render كبيرة" و"خلفية منزل داخلي فاخر" كخلفيات مشاهد. لكن المنتج يملك مبدأً هندسيًا موثّقًا صراحة يمنع أي صورة فوتوغرافية لا تشتق من التوأم الرقمي الفعلي (تجنّب الإيحاء بواقعية غير موجودة — نفس روح "لا منتجات وهمية" التي طلبها المستخدم نفسه).

**القرار:** نحقق الإحساس السينمائي عبر المصدر الحقيقي نفسه — **العارض ثلاثي الأبعاد الحقيقي مكبَّرًا لملء الشاشة مع كاميرا مدارة بالتمرير**، والرسوم البنيوية SVG الحالية مطوَّرة بعمق/Parallax/Zoom — لا صور مخزون. هذا يطابق حرفيًا "الخيار الثاني" الذي وصفه المستخدم بنفسه لحالة ضعف دقة الهندسة (2.5D + Depth + Parallax بدل صندوق رمادي)، ويحافظ على مصداقية المنتج التي بُنيت عمدًا في الكود.

## 3. قرار تقني: بلا مكتبات حركة جديدة كبيرة

الاعتماديات الحالية لا تحوي أي مكتبة حركة (لا GSAP، لا Framer Motion، لا R3F) — الحركة كلها CSS transform/opacity + tokens مركزية + rAF يدوي خفيف (`useCountUp`, marquee). لتفادي مضاعفة الاعتماديات لوظيفة موجودة أصلًا (والحفاظ على حزمة خفيفة لأداء الجوال أولًا)، نبني السينما بنفس الأدوات: **CSS Scroll-Driven Animations + IntersectionObserver + rAF**، وTokens جديدة للمشاهد الكاملة الشاشة تُضاف إلى `tokens.ts`/`globals.css` بنفس الانضباط الحالي. Three.js يبقى المحرك الوحيد للثلاثي الأبعاد (موجود فعلًا). لا Lenis/GSAP ما لم يثبت أن CSS scroll-driven غير كافٍ لتأثير معيّن.

## 4. الملفات — ماذا يتغيّر، ماذا يبقى

**يبقى بلا تغيير (منطق/بيانات):** كل `lib/**` (vision, twin, geometry, design, catalog, supabase, chat, shop, services)، `packages/**`، الـ API routes، `lib/flags.ts`. هذا الطلب بصري بحت.

**يتوسّع (design system):** `packages/ui/src/tokens.ts`, `apps/web/app/globals.css` — رموز جديدة لمشاهد ملء الشاشة، درجات أداء، parallax.

**مكوّنات جديدة:**
- `components/cinematic/HeroScene.tsx` — Hero ملء الشاشة
- `components/cinematic/UploadTable.tsx` — "الطاولة المعمارية الرقمية" بديل صندوق الرفع
- `components/cinematic/ProcessingJourney.tsx` — رحلة المراحل بديل شريط التقدم المجرد
- `components/cinematic/RoomTour.tsx` + `RoomStage.tsx` — استكشاف الغرف ملء الشاشة (يستهلك `RoomScene3D`/`RoomScene` الحاليين كطبقة عرض)
- `components/cinematic/Hotspot.tsx` + `ProductPanel.tsx` — نقاط المنتجات واللوحة الجانبية
- `components/cinematic/BudgetStory.tsx`
- `components/cinematic/EditAssistant.tsx` — الدردشة العائمة (تُغلّف `lib/chat.ts` الحالي)
- `lib/motion/useScrollScene.ts`, `lib/motion/usePerformanceTier.ts` — أدوات مشتركة

**صفحات تتعدّل عرضها (لا منطقها):** `app/page.tsx`، `app/projects/new/page.tsx`، `app/projects/[id]/analysis/page.tsx`، `app/projects/[id]/design/page.tsx` (يصبح نقطة الدخول لجولة الاستكشاف)، `app/projects/[id]/preview/page.tsx`، `app/projects/[id]/shopping/page.tsx`، `app/projects/[id]/chat/page.tsx`.

الوضع الاحترافي مقابل البسيط يُبنى فوق ما هو موجود فعلًا في `design/page.tsx` (قياسات/جدران/طبقات/ثقة) بدل اختراعه من الصفر.

## 5. تسلسل التنفيذ

| المرحلة | المحتوى | الحالة |
|---|---|---|
| 1 | تحليل + هذه الخطة + توسعة tokens | ✅ هذا الالتزام |
| 2 | Hero + مشهد الرفع + رحلة المعالجة (`app/page.tsx`, `projects/new`, `analysis`) | التالي |
| 3 | جولة استكشاف الغرف ملء الشاشة (بديل `design/page.tsx`) + وضع بسيط/احترافي | لاحقًا |
| 4 | Hotspots + لوحة المنتج + قصة الميزانية + مساعد التعديل العائم | لاحقًا |
| 5 | أداء (High/Balanced/Lite) + جوال مستقل + a11y + Lighthouse | لاحقًا |

هذا عمل واسع فعليًا (إعادة تصميم واجهة كاملة لتطبيق قائم) — يُنفَّذ بأمانة عبر التزامات (commits) متتالية صغيرة قابلة للمراجعة على نفس الفرع، لا التزام ضخم واحد.
