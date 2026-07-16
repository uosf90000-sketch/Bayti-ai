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

export type FloorplanAnalysisRow = {
  id: string;
  project_id: string;
  source: "vlm" | "mock";
  overall_confidence: number;
  analyzed_at: string;
  created_at: string;
};

export type RoomObjectRow = {
  id: string;
  project_id: string;
  floorplan_analysis_id: string;
  room_type: string;
  name_ar: string;
  area_m2: number | null;
  dimensions: { width: number | null; length: number | null; height: number | null } | null;
  confidence: number;
  created_at: string;
};

export type RoomDesignRow = {
  id: string;
  room_id: string;
  project_id: string;
  style_ar: string;
  summary_ar: string;
  palette: unknown;
  materials: unknown;
  furniture: unknown;
  lighting: unknown;
  confidence: number;
  created_at: string;
};

export type ShoppingMatchRow = {
  id: string;
  room_design_id: string;
  project_id: string;
  item: unknown;
  matched: boolean;
  product_id: string | null;
  product_name: string | null;
  price: number | null;
  product_url: string | null;
  merchant_name: string | null;
  created_at: string;
};

export type CostSummaryRow = {
  id: string;
  project_id: string;
  total: number;
  by_room: unknown;
  by_category: unknown;
  unpriced_item_count: number;
  computed_at: string;
};

export type ProjectVersionRow = {
  id: string;
  project_id: string;
  version_number: number;
  label: string | null;
  snapshot: unknown;
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
      floorplan_analyses: {
        Row: FloorplanAnalysisRow;
        Insert: Partial<FloorplanAnalysisRow> & { project_id: string; source: "vlm" | "mock"; overall_confidence: number };
        Update: Partial<FloorplanAnalysisRow>;
        Relationships: [];
      };
      room_objects: {
        Row: RoomObjectRow;
        Insert: Partial<RoomObjectRow> & { id: string; project_id: string; floorplan_analysis_id: string; room_type: string; name_ar: string; confidence: number };
        Update: Partial<RoomObjectRow>;
        Relationships: [];
      };
      room_designs: {
        Row: RoomDesignRow;
        Insert: Partial<RoomDesignRow> & { room_id: string; project_id: string; style_ar: string; summary_ar: string; palette: unknown; materials: unknown; furniture: unknown; lighting: unknown; confidence: number };
        Update: Partial<RoomDesignRow>;
        Relationships: [];
      };
      shopping_matches: {
        Row: ShoppingMatchRow;
        Insert: Partial<ShoppingMatchRow> & { room_design_id: string; project_id: string; item: unknown; matched: boolean };
        Update: Partial<ShoppingMatchRow>;
        Relationships: [];
      };
      cost_summaries: {
        Row: CostSummaryRow;
        Insert: Partial<CostSummaryRow> & { project_id: string; total: number; by_room: unknown; by_category: unknown };
        Update: Partial<CostSummaryRow>;
        Relationships: [];
      };
      project_versions: {
        Row: ProjectVersionRow;
        Insert: Partial<ProjectVersionRow> & { project_id: string; version_number: number; snapshot: unknown };
        Update: Partial<ProjectVersionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
