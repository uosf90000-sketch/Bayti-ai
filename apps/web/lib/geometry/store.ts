import type { FloorGeometry } from "./types";
import { flags } from "../flags";

const KEY = "bayti.geometry.v1";

export const geometryStore = {
  /** قراءة محلية فورية — نفس نمط twinStore/pipelineStore */
  get(projectId: string): FloorGeometry | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = localStorage.getItem(`${KEY}:${projectId}`);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },
  /** يحفظ محليًا دائمًا، وإلى Supabase الحقيقي أيضًا عند تفعيل الوضع الحقيقي — يفشل بوضوح إن لم يكن Supabase مهيّأً فعليًا */
  async save(geometry: FloorGeometry): Promise<void> {
    localStorage.setItem(`${KEY}:${geometry.project_id}`, JSON.stringify(geometry));
    if (!flags.USE_MOCK_PROJECTS) {
      const { geometryRepo } = await import("../supabase/repositories/geometry");
      await geometryRepo.save(geometry);
    }
  },
};
