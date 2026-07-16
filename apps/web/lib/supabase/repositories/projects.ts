import { getSupabaseClient } from "../client";
import type { ProjectRow } from "../types";
import type { StoredProject } from "@/lib/mock";

function toStoredProject(row: ProjectRow): StoredProject {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    fileName: row.file_name,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const projectsRepo = {
  async list(userId: string): Promise<StoredProject[]> {
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .select("*")
      .or(`user_id.eq.${userId},is_demo.eq.true`)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`projects.list: ${error.message}`);
    return (data ?? []).map(toStoredProject);
  },

  async create(userId: string, title: string): Promise<StoredProject> {
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .insert({ user_id: userId, title, status: "uploaded", is_demo: false })
      .select("*")
      .single();
    if (error || !data) throw new Error(`projects.create: ${error?.message ?? "insert failed"}`);
    return toStoredProject(data);
  },

  async get(id: string): Promise<StoredProject | undefined> {
    const { data, error } = await getSupabaseClient().from("projects").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`projects.get: ${error.message}`);
    return data ? toStoredProject(data) : undefined;
  },

  async update(id: string, patch: Partial<StoredProject>): Promise<void> {
    const row: Partial<ProjectRow> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.fileName !== undefined) row.file_name = patch.fileName;
    const { error } = await getSupabaseClient().from("projects").update(row).eq("id", id);
    if (error) throw new Error(`projects.update: ${error.message}`);
  },
};
