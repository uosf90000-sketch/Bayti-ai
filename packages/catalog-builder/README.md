# Bayti Catalog Builder v1

أداة TypeScript لبناء واستيراد وتنظيف مكتبة منتجات Bayti AI.

## المزايا
- استيراد JSON وCSV.
- توحيد الحقول العربية والإنجليزية.
- التحقق من الروابط والأسعار والمقاسات.
- منع اختلاق البيانات الناقصة.
- إزالة التكرار.
- فصل Canonical Products عن Merchant Offers.
- إخراج JSON وCSV وتقارير جودة.
- مزامنة اختيارية مع Supabase.

## التثبيت
انسخ المجلد إلى `packages/catalog-builder` ثم:

```bash
pnpm install
pnpm --filter @bayti/catalog-builder build
```

## الاستخدام
```bash
pnpm --filter @bayti/catalog-builder dev -- build --input ./input --output ./output
```

## المخرجات
- canonical-products.json
- merchant-offers.json
- review-queue.json
- rejected-records.json
- quality-report.json

أي قيمة غير متوفرة تبقى null.
