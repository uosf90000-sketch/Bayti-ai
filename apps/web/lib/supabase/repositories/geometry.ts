import { getSupabaseClient } from "../client";
import type { FloorGeometry } from "@/lib/geometry/types";

export const geometryRepo = {
  async save(geometry: FloorGeometry): Promise<void> {
    const { error } = await getSupabaseClient().from("floor_geometries").insert({
      project_id: geometry.project_id,
      scale: geometry.scale,
      walls: geometry.walls,
      openings: geometry.openings,
      rooms: geometry.rooms,
      overall_confidence: geometry.overall_confidence,
      analyzed_at: geometry.analyzed_at,
    });
    if (error) throw new Error(`geometry.save: ${error.message}`);
  },

  async getLatest(projectId: string): Promise<FloorGeometry | undefined> {
    const { data, error } = await getSupabaseClient()
      .from("floor_geometries")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`geometry.getLatest: ${error.message}`);
    if (!data) return undefined;
    return {
      project_id: projectId,
      scale: data.scale as FloorGeometry["scale"],
      walls: data.walls as FloorGeometry["walls"],
      openings: data.openings as FloorGeometry["openings"],
      rooms: data.rooms as FloorGeometry["rooms"],
      overall_confidence: data.overall_confidence,
      analyzed_at: data.analyzed_at,
    };
  },
};
