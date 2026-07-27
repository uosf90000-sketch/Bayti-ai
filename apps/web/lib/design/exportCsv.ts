import type { ProjectPipeline } from "./types";

/**
 * Export — قوائم حقيقية من مخرجات خط الإنتاج فقط (لا بيانات مُخترعة). CSV
 * بدل PDF عبر مكتبة خطوط لاتينية: pdf-lib لا يدعم تشكيل/اتجاه العربية بشكل
 * صحيح؛ تصدير PDF الفعلي هنا عبر صفحة طباعة HTML (window.print) التي يرسم
 * فيها متصفح المستخدم نفسه العربية بصورة صحيحة — راجع app/projects/[id]/design/print.
 */

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** قائمة التسوق — فقط العناصر المطابقة فعليًا بمنتج حقيقي وسعره */
export function exportShoppingListCsv(pipeline: ProjectPipeline) {
  const rows: string[][] = [["الغرفة", "العنصر", "الفئة", "الكمية", "المنتج المطابق", "السعر (ريال)", "المتجر", "الرابط"]];
  for (const r of pipeline.rooms) {
    for (const m of r.shopping) {
      if (!m.matched) continue;
      const qty = "qty" in m.item ? m.item.qty : 1;
      const category = "category" in m.item ? m.item.category : m.item.category_ar;
      rows.push([
        r.room.name_ar, m.item.name_ar, category, String(qty),
        m.productName, m.price != null ? String(m.price) : "غير مؤكد", m.merchantName, m.productUrl ?? "",
      ]);
    }
  }
  downloadCsv(`bayti-shopping-list-${pipeline.project_id}.csv`, rows);
}

/** جدول الكميات الكامل — كل عنصر تصميم بغض النظر عن وجود مطابقة تسوق له */
export function exportBillOfMaterialsCsv(pipeline: ProjectPipeline) {
  const rows: string[][] = [["الغرفة", "العنصر", "الفئة", "الكمية", "الحالة", "المنتج/الوصف", "السعر (ريال)"]];
  for (const r of pipeline.rooms) {
    for (const m of r.shopping) {
      const qty = "qty" in m.item ? m.item.qty : 1;
      const category = "category" in m.item ? m.item.category : m.item.category_ar;
      if (m.matched) {
        rows.push([r.room.name_ar, m.item.name_ar, category, String(qty), "مطابق بمنتج حقيقي", m.productName, m.price != null ? String(m.price) : "غير مؤكد"]);
      } else {
        const desc = "spec_ar" in m.item ? m.item.spec_ar : m.item.description_ar;
        rows.push([r.room.name_ar, m.item.name_ar, category, String(qty), "لا يوجد منتج مطابق", desc, ""]);
      }
    }
  }
  downloadCsv(`bayti-bom-${pipeline.project_id}.csv`, rows);
}
