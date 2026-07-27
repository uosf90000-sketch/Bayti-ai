"use client";
import type { ReactNode } from "react";

/**
 * الطاولة المعمارية الرقمية — بديل بصري لصندوق الرفع التقليدي.
 * تحافظ على نفس سلوك onClick/onDrag* التي يمررها الاستدعاء — لا منطق جديد هنا.
 */
export function ArchTable({
  drag, onClick, onDragOver, onDragLeave, onDrop, onKeyDown, children,
}: {
  drag: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  children: ReactNode;
}) {
  return (
    <div
      className="arch-table dropzone"
      data-drag={drag}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label="رفع المخطط"
      onKeyDown={onKeyDown}
    >
      <div className="arch-grid" />
      <div style={{ padding: "40px 22px", textAlign: "center" }}>{children}</div>
    </div>
  );
}
