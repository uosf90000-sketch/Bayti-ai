import type { RoomObject, RoomPipelineResult, ProjectPipeline } from "./types";
import { runRoomPipeline } from "./client";
import { computeProjectCost } from "./costEngine";
import { flags } from "../flags";

/**
 * AI Council الحقيقي — يعمل على كل غرفة على حدة بشكل مستقل تمامًا (طلب منفصل
 * لكل غرفة، بلا اعتماد بين الطلبات). لا يدمج غرفتين في تصميم واحد، ولا يصمم
 * غرفة غير موجودة في rooms — القائمة المُمرَّرة هنا هي بالضبط الغرف المكتشفة
 * فعليًا في التوأم الرقمي (lib/design/room.ts).
 */

const KEY = "bayti.pipeline.v1";

export const pipelineStore = {
  get(projectId: string): ProjectPipeline | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = localStorage.getItem(`${KEY}:${projectId}`);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },
  /** يحفظ محليًا دائمًا (كاش فوري)، وإلى Supabase الحقيقي أيضًا عند تفعيل الوضع الحقيقي — Design Results + Shopping Matches + Cost Summary + إصدار جديد */
  async save(pipeline: ProjectPipeline): Promise<void> {
    localStorage.setItem(`${KEY}:${pipeline.project_id}`, JSON.stringify(pipeline));
    if (!flags.USE_MOCK_PROJECTS) {
      const { pipelineRepo } = await import("../supabase/repositories/pipeline");
      const cost = computeProjectCost(pipeline);
      await pipelineRepo.savePipeline(pipeline, cost);
      await pipelineRepo.saveVersion(pipeline.project_id, pipeline);
    }
  },
};

export async function runProjectPipeline(
  projectId: string,
  rooms: RoomObject[],
  onRoomDone?: (result: RoomPipelineResult) => void,
): Promise<ProjectPipeline> {
  const results = await Promise.all(
    rooms.map(async (room): Promise<RoomPipelineResult> => {
      const res = await runRoomPipeline(room);
      const result: RoomPipelineResult =
        "error" in res
          ? { room, design: null, shopping: [], error: res.error }
          : { room, design: res.design, shopping: res.shopping, error: null };
      onRoomDone?.(result);
      return result;
    }),
  );
  const pipeline: ProjectPipeline = { project_id: projectId, rooms: results, generated_at: new Date().toISOString() };
  await pipelineStore.save(pipeline);
  return pipeline;
}
