/**
 * أنواع يدوية مطابقة لـ supabase/migrations/0001_init.sql — تُستبدل لاحقًا بـ
 * `supabase gen types typescript` بعد ربط مشروع حقيقي (نفس البنية، توليد آلي فقط).
 */
export type ProjectStatusRow =
  | "uploaded" | "analyzing" | "needs_review" | "intake" | "generating"
  | "matching" | "rendering" | "ready" | "editing" | "failed";

export type ProjectRow = {
  id: string;
  user_id: string | null;
  title: string;
  status: ProjectStatusRow;
  file_name: string | null;
  thumbnail_url: string | null;
  current_version: number | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type FloorplanRow = {
  id: string;
  project_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  level: number;
  reject_reason: string | null;
  uploaded_at: string | null;
  created_at: string;
};

export type AnalysisCheckpointRow = {
  id: string;
  project_id: string;
  stage: string;
  progress_pct: number;
  payload: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Partial<ProjectRow> & { title: string };
        Update: Partial<ProjectRow>;
        Relationships: [];
      };
      floorplans: {
        Row: FloorplanRow;
        Insert: Partial<FloorplanRow> & { project_id: string; file_name: string; content_type: string; size_bytes: number; storage_path: string };
        Update: Partial<FloorplanRow>;
        Relationships: [];
      };
      analysis_checkpoints: {
        Row: AnalysisCheckpointRow;
        Insert: Partial<AnalysisCheckpointRow> & { project_id: string; stage: string };
        Update: Partial<AnalysisCheckpointRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
