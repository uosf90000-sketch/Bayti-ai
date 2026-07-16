# Bayti Catalog Builder — تقرير الدمج والجودة

> دمج `Bayti Catalog Builder v1` داخل مستودع Bayti AI، وفق `INTEGRATION_PROMPT_FOR_CLAUDE.txt` المرفق بالحزمة الأصلية.

## ماذا تم

| # | الخطوة | الحالة |
|---|--------|--------|
| 1 | نقل الأداة إلى `packages/catalog-builder` | ✅ |
| 2 | `pnpm install` + `build` + `typecheck` | ✅ — أصلحت خطأ syntax حقيقي في `src/normalize.ts` (خلط `??`/`\|\|` بلا أقواس، لا يمرّ TS الصارم) |
| 3 | إضافة migration | ✅ `supabase/migrations/0002_catalog.sql` (نسخة مطابقة لـ `packages/catalog-builder/database/001_catalog.sql`) |
| 4 | تجميع كل ملفات المكتبات في `packages/catalog-data/input` | ✅ 15 ملفًا (Batch 01–14 + `library-v1`) |
| 5 | تشغيل الأداة على كل المدخلات | ✅ — انظر نتائج الجودة أدناه |
| 6 | ربط Shopping عبر `CatalogRepository` واحد (JSON/Supabase) | 🔶 **جزئي — قرار مقصود، انظر القسم الخاص أدناه** |
| 7 | لا عرض demo كمنتج حقيقي | ✅ |
| 8 | لا اختلاق أسعار/مقاسات | ✅ |
| 9 | Railway فقط | ✅ (لم يُستخدم Vercel) |
| 10 | Commit + Push + تقرير جودة | ✅ هذا الملف |

## مصادر البيانات المدمجة

اكتشفت أن الجلسة **لم تكن تملك أي دفعات سابقًا فعليًا** رغم الافتراض الأول أنها موجودة — كل دفعة وصلت عبر الرفع المباشر:

- **Batch 01–03** (`Bayti_Product_Library_Batch_0X`): 15 + 21 + 30 = 66 منتجًا، IKEA السعودية، معرّفات `ikea-sa-*`.
- **Batch 04–14**: 11 دفعة × 30 = 330 منتجًا، معرّفات متسلسلة `BAYTI-0067` → `BAYTI-0396` بلا فجوات.
- **`Bayti_Product_Library_v1`**: 6 كنبات IKEA — تبيّن أنها نسخة أولى تجريبية سابقة لـ Batch 01 (تكرار متوقع، عالجه الدمج تلقائيًا — انظر أدناه).

**الإجمالي الخام: 402 سجلًا** عبر 15 ملف دخل في `packages/catalog-data/input/`.

## نتائج خط الأنابيب (`packages/catalog-data/generated/quality-report.json`)

```json
{
  "totalInputRecords": 402,
  "canonicalProducts": 388,
  "merchantOffers": 394,
  "rejectedRecords": 0,
  "duplicatesRemoved": 8,
  "averageQualityScore": 59
}
```

- **صفر رفض** — بعد إضافة أسماء حقول بديلة ناقصة في `aliases.ts` (`official_url`, `retailer`, `article_number`, `verified_on`) لتطابق مخطط Batch 04–14؛ بدونها كانت كل الدفعات ستُرفض (`missing_product_url`/`missing_name`) لأن الأداة الأصلية لم تكن تعرف هذه الأسماء.
- **8 تكرارات أُزيلت تلقائيًا** — من بينها تداخل `Bayti_Product_Library_v1` مع Batch 01 (نفس أريكة KIVIK بصيغتَي SKU مختلفتين قليلًا `894.431.84` مقابل `S894.431.84`) — تحقّقت يدويًا أن الأداة اختارت السجل الأعلى جودة ودمجت العرضين في منتج واحد بنجاح.

## ⚠ أهم ملاحظة: اكتمال البيانات

هذا هو الجزء الذي يحتاج انتباهك مباشرة قبل أي استخدام تجاري فعلي:

| النطاق | العدد | النسبة |
|---|---|---|
| عروض بجودة ≥70 (لا تحتاج مراجعة) | 31 | 8% |
| عروض بجودة 60–69 (ظاهرة لكن بحاجة مراجعة) | 32 | 8% |
| **عروض بجودة <60 (محجوبة بسياسة RLS — لن تظهر للمستخدم)** | **331** | **84%** |

السبب: **كل منتجات Batch 04–14 (330 منتجًا) بلا استثناء تفتقد السعر والمقاسات وحالة التوفر** (`price`/`dimensions`/`availability` كلها `null` في الملفات الأصلية — موثّق صراحة في كل `README.md` لكل دفعة: "Missing or non-stable values are represented as null"). فقط منتجات IKEA (Batch 01–03 + library-v1، 66+6 منتجًا) تملك أسعارًا ومقاسات حقيقية.

**عمليًا:** الكتالوج الآن يحتوي 388 منتجًا كنسيًا، لكن ما يصلح للعرض التجاري الفعلي (سعر + توفر + رابط شراء حقيقي بجودة كافية) هو ~61 منتجًا فقط من IKEA. الـ 330 منتج من Batch 04–14 هي أسماء وفئات وروابط رسمية صحيحة (بدون اختلاق) لكنها تحتاج جولة تحقق أسعار/مقاسات حية قبل أن تصبح قابلة للعرض كخيار شراء — هذا **مقصود وصحيح** بحسب فلسفة النظام (P9: لا تخمين)، وليس خطأ في الأداة.

## القرار المقصود بشأن خطوة 6 (ربط Shopping)

بنيت `CatalogRepository` كاملة وتعمل فعليًا (JSON الآن، Supabase جاهز عند ربط الاعتمادات):

- `apps/web/lib/catalog/repository.ts` — تطبّق يدويًا نفس فلترة سياسات RLS (`quality_score>=60`, `data_source='real'`, `product_url is not null`) حتى يتطابق سلوك وضعَي JSON/Supabase تمامًا.
- `apps/web/app/api/catalog/products` و `/api/catalog/offers/[productId]` — Route Handlers (الكتالوج يقرأ `node:fs` في وضع JSON، لا يجوز دخوله حزمة العميل مباشرة؛ هذا الحد الفاصل ضروري تقنيًا، اكتشفته أثناء البناء عندما فشل webpack على `node:fs` داخل `services.ts` المستوردة من شاشات client).
- `services.catalog.listProducts()` / `services.catalog.listOffers(id)` — الواجهة الموحدة للشاشات، تتصل بالـ Route Handlers.
- Flag جديد: `NEXT_PUBLIC_USE_MOCK_CATALOG` (افتراضي `true` = JSON).

**لم أربط شاشة `/projects/[id]/shopping` الحالية بهذا الكتالوج الحقيقي** — قرار مقصود لا سهو: تلك الشاشة معتمدة وظيفيًا من قبلك (VS-2) ومبنية على بيانات فيلا النرجس التجريبية (`lib/shop.ts`، عناصر محددة بأسماء/تدرّجات أسعار اقتصادي-متوازن-فاخر لكل غرفة). استبدالها بكتالوج عام من 388 منتج (بلا ربط بغرف فيلا النرجس ولا نظام النسخ الثلاث) يغيّر تجربة معتمدة فعليًا دون مراجعتك. البنية التحتية جاهزة الآن للربط الفعلي — يحتاج قرار منتج منك: هل تُستبدل شاشة Shopping بالكامل، أم يضاف الكتالوج الحقيقي كمصدر منتجات إضافي بجانب فيلا النرجس؟

## كيفية إعادة التشغيل عند إضافة دفعات جديدة

```bash
# 1) ضع products.json الدفعة الجديدة في packages/catalog-data/input/batch-NN.json
# 2) من جذر المستودع:
pnpm --filter @bayti/catalog-builder dev -- build --input ../catalog-data/input --output ../catalog-data/generated
```

(لاحظ: المسارات نسبية لمجلد `packages/catalog-builder` لأن `pnpm --filter` يُنفّذ من داخله — وليست نسبية لجذر المستودع كما في الأمر الأصلي المقترح.)

## الأرشيف الخام

كل ملفات الدفعات الأصلية (بما فيها `official_product_links.txt` و`products.csv` وREADME الخاص بكل دفعة) محفوظة كاملة في `services/catalog-ingestion/batches/batch-NN/` للتتبع — منفصلة عن `packages/catalog-data/input/` الذي يحتوي فقط JSON نظيف جاهز لخط الأنابيب.
