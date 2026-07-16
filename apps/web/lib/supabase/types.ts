/**
 * أنواع يدوية مطابقة لـ supabase/migrations/0001_init.sql و0002_catalog.sql — تُستبدل لاحقًا بـ
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

export type CatalogProductRow = {
  id: string;
  canonical_name_ar: string | null;
  canonical_name_en: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  dimensions: Record<string, number | null>;
  style_tags: string[];
  room_tags: string[];
  budget_tier: string | null;
  quality_score: number;
  created_at: string;
  updated_at: string;
};

export type CatalogOfferRow = {
  id: string;
  canonical_product_id: string;
  merchant_name: string;
  merchant_domain: string | null;
  sku: string | null;
  gtin: string | null;
  variant_label: string | null;
  currency: string;
  price: number | null;
  previous_price: number | null;
  availability: string;
  product_url: string | null;
  image_urls: string[];
  source_checked_at: string | null;
  needs_live_recheck: boolean;
  data_source: string;
  quality_score: number;
  issues: string[];
  created_at: string;
  updated_at: string;
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
      catalog_products: {
        Row: CatalogProductRow;
        Insert: Partial<CatalogProductRow> & { id: string; category: string };
        Update: Partial<CatalogProductRow>;
        Relationships: [];
      };
      catalog_offers: {
        Row: CatalogOfferRow;
        Insert: Partial<CatalogOfferRow> & { id: string; canonical_product_id: string; merchant_name: string };
        Update: Partial<CatalogOfferRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
