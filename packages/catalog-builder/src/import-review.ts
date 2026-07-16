#!/usr/bin/env node
/**
 * مسار التوسيع الرسمي 1/3: استيراد يدوي عبر CSV.
 * يقرأ review-queue.csv بعد تعبئة أعمدة *_TO_FILL يدويًا من الصفحات الرسمية، ويكتب القيم الحقيقية
 * فقط (لا قيمة مُختلَقة — عمود فارغ يبقى فارغًا) مرة أخرى في ملف الدفعة الأصلي بـ packages/catalog-data/input.
 * بعدها: أعد تشغيل بناء الأداة لإعادة حساب الجودة — أي منتج يتجاوز الحد يظهر تلقائيًا في Shopping.
 *
 * الاستخدام:
 *   pnpm --filter @bayti/catalog-builder import-review -- --file ./review-filled.csv --input ../catalog-data/input
 */
import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parse } from "csv-parse/sync";

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};

const num = (v: string | undefined): number | undefined => {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

async function main() {
  const file = arg("file");
  const inputDir = arg("input", "./input")!;
  if (!file) {
    console.error("الاستخدام: --file <review-filled.csv> --input <packages/catalog-data/input>");
    process.exit(1);
  }

  const raw = await fs.readFile(file, "utf8");
  const rows: Record<string, string>[] = parse(raw, { columns: true, skip_empty_lines: true, bom: true, trim: true });

  const inputFiles = await fg(["**/*.json"], { cwd: inputDir, absolute: true });
  let patched = 0, skippedFreeTextDims = 0, notFound = 0, noNewData = 0;

  for (const row of rows) {
    const priceSar = num(row.price_sar_TO_FILL);
    const widthCm = num(row.width_cm_TO_FILL);
    const depthCm = num(row.depth_cm_TO_FILL);
    const heightCm = num(row.height_cm_TO_FILL);
    const availability = row.availability_TO_FILL?.trim() || undefined;

    if (priceSar === undefined && widthCm === undefined && depthCm === undefined && heightCm === undefined && !availability) {
      noNewData++;
      continue;
    }

    let matched = false;
    for (const f of inputFiles) {
      const data = JSON.parse(await fs.readFile(f, "utf8"));
      if (!Array.isArray(data)) continue;
      let changed = false;

      for (const rec of data) {
        const recSku = String(rec.sku ?? rec.article_number ?? "");
        const recMerchant = String(rec.store ?? rec.merchant ?? rec.retailer ?? "");
        const sameSku = row.sku && recSku && recSku === row.sku;
        const sameUrl = row.product_url && (rec.product_url === row.product_url || rec.official_url === row.product_url);
        if (!(sameSku && recMerchant === row.merchant) && !sameUrl) continue;

        matched = true;
        if (priceSar !== undefined) {
          if ("price_sar" in rec) rec.price_sar = priceSar; else rec.price = priceSar;
          changed = true;
        }
        if (availability !== undefined) { rec.availability = availability; changed = true; }
        if (widthCm !== undefined || depthCm !== undefined || heightCm !== undefined) {
          if ("width_cm" in rec || (!("dimensions" in rec))) {
            if (widthCm !== undefined) rec.width_cm = widthCm;
            if (depthCm !== undefined) rec.depth_cm = depthCm;
            if (heightCm !== undefined) rec.height_cm = heightCm;
            changed = true;
          } else {
            console.warn(`⚠ ${row.sku ?? row.product_url}: هذا السجل يستخدم dimensions كنص حر — لم تُكتب المقاسات تلقائيًا، عدّل الملف يدويًا: ${f}`);
            skippedFreeTextDims++;
          }
        }
        rec.needs_live_recheck = false;
        rec.verified_on = rec.source_checked_at = new Date().toISOString().slice(0, 10);
      }

      if (changed) {
        await fs.writeFile(f, JSON.stringify(data, null, 2) + "\n");
        patched++;
      }
    }
    if (!matched) notFound++;
  }

  console.log(`تم تحديث ${patched} سجلًا. تخطّي (مقاسات نصية حرة، تحتاج تعديل يدوي): ${skippedFreeTextDims}. غير موجود: ${notFound}. بلا بيانات جديدة: ${noNewData}.`);
  console.log(`التالي: أعد تشغيل البناء لإعادة حساب الجودة — pnpm --filter @bayti/catalog-builder dev -- build --input ${inputDir} --output ../catalog-data/generated`);
}

main().catch((e) => { console.error(e); process.exit(1); });
