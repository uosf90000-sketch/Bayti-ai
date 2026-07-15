/** S2/S3/S4 — لوحة المشاريع، إنشاء مشروع، رفع المخطط (PRD §3) */
import { z } from "zod";

export const ProjectStatus = z.enum([
  "uploaded", "analyzing", "needs_review", "intake", "generating",
  "matching", "rendering", "ready", "editing", "failed",
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const ProjectCard = z.object({
  id: z.string(),
  title: z.string(),
  status: ProjectStatus,
  thumbnail_url: z.string().nullable(),
  current_version: z.number().int().nullable(),
  updated_at: z.string(),
});
export type ProjectCard = z.infer<typeof ProjectCard>;

export const ListProjectsOutput = z.object({
  projects: z.array(ProjectCard),
  quota: z.object({ used: z.number().int(), limit: z.number().int().nullable() }),
});

export const CreateProjectInput = z.object({ title: z.string().min(1).max(120) });
export const CreateProjectOutput = z.object({ id: z.string(), status: ProjectStatus });

/** الرفع عبر presigned — العميل لا يرسل الملف للـ API مباشرة */
export const UploadIntentInput = z.object({
  file_name: z.string(),
  content_type: z.enum([
    "application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic",
    "application/acad", "image/vnd.dwg", "application/dxf",
  ]),
  size_bytes: z.number().int().positive().max(50 * 1024 * 1024),
  level: z.number().int().min(0).max(5),
});
export const UploadIntentOutput = z.object({
  floorplan_id: z.string(),
  upload_url: z.string(),
  expires_at: z.string(),
});

export const UploadCompleteInput = z.object({ floorplan_id: z.string() });
export const UploadCompleteOutput = z.object({
  floorplan_id: z.string(),
  status: z.literal("analyzing"),
});

/** S4 — رفض بوابة الجودة برموز أسباب موجهة بالفعل (§4.1) */
export const QualityRejectReason = z.enum([
  "low_resolution", "not_a_floorplan", "severe_skew", "password_protected",
  "corrupt_file", "unsupported_format",
]);
