/**
 * واجهة الخدمات الموحدة — الشاشات تستدعي هذه الدوال فقط (AC12-3).
 * كل دالة: mock خلف flag اليوم، وخدمة حقيقية بنفس التوقيع غدًا.
 */
import { flags, TEST_OTP_ALLOWED } from "./flags";
import { store, type StoredProject } from "./mock";
import type { UploadIntentInput, UploadIntentOutput, UploadCompleteInput, UploadCompleteOutput } from "./supabase/contract-types";

const notWired = (name: string): never => {
  throw new Error(`${name}: الخدمة الحقيقية غير مربوطة بعد — أبقِ الـ flag على mock`);
};

export const auth = {
  async requestOtp(phone: string): Promise<{ ok: true }> {
    if (!flags.USE_MOCK_AUTH) return notWired("auth.requestOtp");
    await new Promise((r) => setTimeout(r, 700));
    void phone;
    return { ok: true };
  },

  async verifyOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
    if (!flags.USE_MOCK_AUTH) return notWired("auth.verifyOtp");
    await new Promise((r) => setTimeout(r, 600));
    if (!TEST_OTP_ALLOWED) {
      return { ok: false, error: "الدخول التجريبي معطّل في بيئة الإنتاج." };
    }
    if (code !== "1234") {
      return { ok: false, error: "الرمز غير صحيح — في النسخة التجريبية استخدم 1234" };
    }
    store.login(phone);
    return { ok: true };
  },
};

/** حارس بسيط للشاشات المعتمدة على بيانات mock — يفشل بوضوح لو أُطفئ الـ flag قبل ربط البديل */
export function assertMock(flag: keyof typeof flags): void {
  if (!flags[flag]) notWired(flag);
}

/* ————— VS-4: سجل المشاريع + Storage — mock خلف USE_MOCK_PROJECTS، Supabase حقيقي خلفه غدًا ————— */
export const projects = {
  async list(): Promise<StoredProject[]> {
    if (flags.USE_MOCK_PROJECTS) return store.list();
    const [{ projectsRepo }, { currentUserId }] = await Promise.all([
      import("./supabase/repositories/projects"), import("./supabase/client"),
    ]);
    return projectsRepo.list(await currentUserId());
  },

  async create(title: string): Promise<StoredProject> {
    if (flags.USE_MOCK_PROJECTS) return store.create(title);
    const [{ projectsRepo }, { currentUserId }] = await Promise.all([
      import("./supabase/repositories/projects"), import("./supabase/client"),
    ]);
    return projectsRepo.create(await currentUserId(), title);
  },

  async get(id: string): Promise<StoredProject | undefined> {
    if (flags.USE_MOCK_PROJECTS) return store.get(id);
    const { projectsRepo } = await import("./supabase/repositories/projects");
    return projectsRepo.get(id);
  },

  async update(id: string, patch: Partial<StoredProject>): Promise<void> {
    if (flags.USE_MOCK_PROJECTS) { store.update(id, patch); return; }
    const { projectsRepo } = await import("./supabase/repositories/projects");
    await projectsRepo.update(id, patch);
  },
};

export const floorplans = {
  async requestUploadUrl(projectId: string, input: UploadIntentInput): Promise<UploadIntentOutput> {
    if (flags.USE_MOCK_PROJECTS) {
      await new Promise((r) => setTimeout(r, 300));
      return { floorplan_id: `fp_${Date.now().toString(36)}`, upload_url: "mock://upload", expires_at: new Date(Date.now() + 3600_000).toISOString() };
    }
    const [{ floorplansRepo }, { currentUserId }] = await Promise.all([
      import("./supabase/repositories/floorplans"), import("./supabase/client"),
    ]);
    return floorplansRepo.requestUploadUrl(await currentUserId(), projectId, input);
  },

  async completeUpload(input: UploadCompleteInput): Promise<UploadCompleteOutput> {
    if (flags.USE_MOCK_PROJECTS) {
      await new Promise((r) => setTimeout(r, 200));
      return { floorplan_id: input.floorplan_id, status: "analyzing" };
    }
    const { floorplansRepo } = await import("./supabase/repositories/floorplans");
    return floorplansRepo.completeUpload(input);
  },

  /** دالة مستوى-الشاشة الوحيدة المطلوبة من app/projects/new — نفس التوقيع بغض النظر عن الـ flag (AC12-3) */
  async upload(projectId: string, file: File): Promise<UploadCompleteOutput> {
    if (flags.USE_MOCK_PROJECTS) {
      await new Promise((r) => setTimeout(r, 500));
      return { floorplan_id: `fp_${Date.now().toString(36)}`, status: "analyzing" };
    }
    const [{ floorplansRepo }, { currentUserId }, storage] = await Promise.all([
      import("./supabase/repositories/floorplans"), import("./supabase/client"), import("./supabase/storage"),
    ]);
    const contentType = (file.type || "application/pdf") as UploadIntentInput["content_type"];
    const intent = await floorplansRepo.requestUploadUrl(await currentUserId(), projectId, {
      file_name: file.name, content_type: contentType, size_bytes: file.size, level: 0,
    });
    await storage.uploadToSignedUrl(intent.path, intent.token, file);
    return floorplansRepo.completeUpload({ floorplan_id: intent.floorplan_id });
  },
};

/**
 * الكتالوج الحقيقي (Bayti Catalog Builder) — يمر عبر /api/catalog/* (Route Handlers) لا عبر استيراد
 * catalogRepo مباشرة، لأن وضع JSON يستخدم node:fs (خادم فقط) ولا يجوز دخوله حزمة العميل — services.ts
 * تُستورد من شاشات "use client" فتُبنى للمتصفح أيضًا.
 * قرار مؤسس: تُعرض فقط المنتجات التي اجتازت حد الجودة (quality_score>=60) — مطبَّق في catalogRepo نفسها
 * في كل الأوضاع، لا في الشاشة، حتى لا يُخفَّض الحد بالخطأ لاحقًا من شاشة واحدة فقط.
 */
export const catalog = {
  async listProducts(): Promise<import("./catalog/types").CanonicalProduct[]> {
    const res = await fetch("/api/catalog/products");
    if (!res.ok) throw new Error(`catalog.listProducts: HTTP ${res.status}`);
    return (await res.json()).products;
  },
  async listOffers(canonicalProductId: string): Promise<import("./catalog/types").MerchantOffer[]> {
    const res = await fetch(`/api/catalog/offers/${canonicalProductId}`);
    if (!res.ok) throw new Error(`catalog.listOffers: HTTP ${res.status}`);
    return (await res.json()).offers;
  },
  /** منتجات جاهزة للعرض فعليًا في Shopping (جودة كافية + عرض حقيقي واحد على الأقل) */
  async listShoppable(): Promise<Array<import("./catalog/types").CanonicalProduct & { bestOffer: import("./catalog/types").MerchantOffer | null }>> {
    const res = await fetch("/api/catalog/shoppable");
    if (!res.ok) throw new Error(`catalog.listShoppable: HTTP ${res.status}`);
    return (await res.json()).products;
  },
};
