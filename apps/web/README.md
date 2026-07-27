# apps/web — Next.js App Router (RTL أولًا). Scaffold: مهمة S0-8.

## التشغيل

```bash
pnpm install
pnpm --filter @bayti/web dev     # أو من هذا المجلد: pnpm dev
pnpm --filter @bayti/web build   # بناء إنتاجي
pnpm --filter @bayti/web typecheck
```

الخدمات الحقيقية (تحليل المخطط، المجلس، الكتالوج...) خلف أعلام في `lib/flags.ts` —
mock افتراضيًا. تشغيل المسار الحقيقي لتحليل المخطط يتطلب `ANTHROPIC_API_KEY`
(راجع `.env.example`).

## الطبقة السينمائية (`components/cinematic/`)

الواجهة الأمامية Scrollytelling ملء الشاشة — لا صفحات/بطاقات تقليدية في
المسارات الرئيسية. لا مكتبة حركة/عرض جديدة تُضاف دون سبب: **GSAP + ScrollTrigger**
لكل تزامن تمرير↔حركة، و**React Three Fiber** لكل مشهد ثلاثي أبعاد تفاعلي؛
Three.js الخام (`components/scene3d.tsx`) يبقى محرك عارض الغرفة الحقيقي القائم
أصلًا (هندسة CAD حقيقية من `lib/geometry`) — لم يُعَد كتابته إلى R3F لأنه يعمل
بشكل صحيح وإعادة كتابته مخاطرة غير مبرَّرة؛ R3F استُخدم في المشهد **الجديد** فقط.

| الملف | الدور |
|---|---|
| `CinematicJourney.tsx` | مشهد الترحيب (الصفحة الرئيسية): Canvas مثبَّت بالتمرير (`ScrollTrigger` + `pin`) يشغّل قصة "من مخطط إلى بيت" كاملة عبر ~700vh. يحترم `prefers-reduced-motion` بعرض المشهد كاملًا وثابتًا فورًا بلا تثبيت. |
| `HouseScene.tsx` + `houseLayout.ts` | محتوى المشهد (جدران/غرف/إضاءة/أثاث/نقاط منتجات) — بيانات **تجريبية معلنة** لهذا المشهد فقط، لا تُخلط أبدًا ببيانات مشروع حقيقي. كل الحركة تفاعلية عبر `useFrame` تقرأ من `ref` (لا React state لكل إطار). |
| `RoomTour.tsx` + `RoomStage.tsx` | جولة استكشاف الغرف الحقيقية (تحل محل لوحة الغرف القديمة في `/projects/[id]/design`) — غرفة واحدة ملء الشاشة، تنقّل صريح (أزرار/لوحة نقاط/أسهم لوحة مفاتيح)، وضع بسيط/احترافي. |
| `ProductPanel.tsx` | بطاقة منتج حقيقي عند نقر Hotspot أثاث — بيانات `ShoppingMatch` الحقيقية فقط، لا بدائل مُخترعة. |
| `BudgetReveal.tsx` | الميزانية كرقم متحرك + تفكيك بالقسم، من `computeProjectCost` الحقيقي. |
| `EditAssistant.tsx` | مساعد التعديل العائم (`lib/chat.ts` القائم) — طبقة فوق الجولة، لا صفحة منفصلة. |
| `RevealSection.tsx`, `ArchTable.tsx` | مشاهد الصفحة الرئيسية الأخرى الأقدم (Reveal-on-scroll بسيط عبر CSS + `IntersectionObserver`، ومشهد الرفع). |

### تعديل قصة الترحيب

المراحل الروائية والتوقيت في `CinematicJourney.tsx` (`BEATS`، نطاقات `from/to`
على مقياس 0..1 لتقدّم التمرير)، والهندسة/الأثاث/الإضاءة في `houseLayout.ts`.
مسار الكاميرا (`CAM_KEYS` في `HouseScene.tsx`) نقاط تحكّم Keyframe يُدرَج بينها
(`smoothstep`) — أضِف نقطة بإضافة عنصر بنفس الشكل `{ p, pos, look }`.

### أداء

`lib/motion/usePerformanceTier.ts` يصنّف الجهاز تلقائيًا (High/Balanced/Lite)
بناءً على `navigator.hardwareConcurrency`/`deviceMemory` ونوع الجهاز، ويُستخدم
لضبط `dpr`/antialias/fog في الـ Canvas الرئيسي وسقف نسبة البكسل في عارض الغرفة.
لا واجهة إعدادات مخصصة له بعد (لا توجد صفحة إعدادات في هذا التطبيق أصلًا) —
الـ hook يعيد `setTier` جاهزة للربط متى أُضيفت واحدة.

### الاختبار البصري

لا Playwright تلقائي مضاف بعد لهذه المكوّنات (سكربتات مؤقتة استُخدمت يدويًا أثناء
التطوير وحُذفت). عند إضافة اختبارات: `RoomTour`/`RoomStage` تتطلب `bayti.twin.v1:*`
و`bayti.pipeline.v1:*` في `localStorage` بشكل `AnalyzedTwin`/`ProjectPipeline`
(راجع `lib/twin.ts`, `lib/design/types.ts`) لأن الخط الحقيقي يستدعي Claude فعليًا.
