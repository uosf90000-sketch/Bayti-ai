/**
 * Digital Twin core schemas — PRD §4.7 / §4.16–4.18 (Architecture v1.0 Frozen).
 * التوأم الرقمي هو مصدر الحقيقة الوحيد (P8 / ADR-008) — هذه العقود منقولة كما جُمِّدت.
 */
import { z } from "zod";

export const Vec2 = z.tuple([z.number(), z.number()]);
export type Vec2 = z.infer<typeof Vec2>;

export const Confidence = z.number().min(0).max(1);

export const Provenance = z.object({
  path: z.enum(["cad", "vector_pdf", "raster"]),
  corrected_by_user: z.boolean(),
});

/** §4.16 — ADR-4.5/012: المتر float64 داخليًا، لا عنصر بلا نظام إحداثيات مؤكد */
export const CoordinateSystem = z.object({
  unit: z.literal("m"),
  original_unit: z.enum(["mm", "cm", "m", "ft_in", "px", "unknown"]),
  original_to_m_factor: z.number().nullable(),
  origin: z.literal("floor_bbox_bottom_left"),
  axes: z.literal("right_handed_xy_z_up"),
  rotation_north_deg: z.number().nullable(),
  scale_source: z.enum(["cad_units", "written_dims", "scale_text", "user_reference", "missing"]),
  scale_confidence: Confidence,
  status: z.enum(["confirmed", "unconfirmed"]),
});
export type CoordinateSystem = z.infer<typeof CoordinateSystem>;

/** أنواع الغرف بالسياق الخليجي — القاموس الرسمي */
export const RoomType = z.enum([
  "majlis_men", "majlis_women", "muqallat", "dining", "living",
  "bedroom_master", "bedroom", "kids_room", "maid_room", "driver_room",
  "kitchen", "kitchen_dirty", "bathroom", "wc_guest", "laundry",
  "storage", "garage", "garden", "pool", "roof", "prayer_room",
  "corridor", "entry", "balcony", "external_annex", "office", "unknown",
]);
export type RoomType = z.infer<typeof RoomType>;

/** §4.17 — الجدار بجسمه الحقيقي: سماكة وارتفاع، لا خط أوسط مجرد */
export const Wall = z.object({
  id: z.string(),
  centerline: z.object({ from: Vec2, to: Vec2 }),
  thickness_m: z.number().positive(),
  height_m: z.number().positive().nullable(), // null = بانتظار تأكيد المستخدم (لا تخمين — P9)
  kind: z.enum(["exterior", "interior", "partition", "parapet"]),
  load_bearing: z.boolean().nullable(),
  opening_ids: z.array(z.string()),
  confidence: Confidence,
  provenance: Provenance,
});
export type Wall = z.infer<typeof Wall>;

export const Ceiling = z.object({
  room_id: z.string(),
  height_m: z.number().positive(),
  kind: z.enum(["flat", "double_height", "dropped_gypsum", "sloped"]),
  height_source: z.enum(["plan", "user_confirmed", "default_confirmed"]),
});
export type Ceiling = z.infer<typeof Ceiling>;

/** §4.18 — كل فتحة بجدارها وclearance محسوب */
const OpeningBase = z.object({
  id: z.string(),
  wall_id: z.string(),
  offset_m: z.number().nonnegative(),
  width_m: z.number().positive(),
  height_m: z.number().positive().nullable(),
  confidence: Confidence,
  provenance: Provenance,
});

export const Door = OpeningBase.extend({
  kind: z.literal("door"),
  door_type: z.enum(["hinged", "double", "sliding", "pocket", "folding"]),
  swing: z
    .object({ direction: z.enum(["inward", "outward"]), hinge: z.enum(["left", "right"]) })
    .nullable(), // null للمنزلق — والفحوص تفترض أسوأ حالة حتى التأكيد
  clearance_polygon_m: z.array(Vec2),
  connects: z.tuple([z.string(), z.union([z.string(), z.literal("exterior")])]),
});
export type Door = z.infer<typeof Door>;

export const Window = OpeningBase.extend({
  kind: z.literal("window"),
  sill_height_m: z.number().nonnegative(),
  window_type: z.enum(["fixed", "sliding", "casement", "awning"]),
  clearance_polygon_m: z.array(Vec2),
});
export type Window = z.infer<typeof Window>;

export const Opening = z.discriminatedUnion("kind", [
  Door,
  Window,
  OpeningBase.extend({ kind: z.literal("arch") }),
  OpeningBase.extend({ kind: z.literal("pass_through") }),
]);
export type Opening = z.infer<typeof Opening>;

export const Room = z.object({
  id: z.string(),
  type: RoomType,
  name_ar: z.string(),
  name_source: z.enum(["ocr", "inferred", "user"]),
  polygon_m: z.array(Vec2).min(3),
  area_m2: z.number().positive(),
  confidence: Confidence,
  provenance: Provenance,
});
export type Room = z.infer<typeof Room>;

export const FloorLevel = z.object({
  level: z.number().int(),
  elevation_m: z.number(),
  default_ceiling_height_m: z.number().positive(),
  coordinate_system: CoordinateSystem,
  rooms: z.array(Room),
  walls: z.array(Wall),
  openings: z.array(Opening),
  ceilings: z.array(Ceiling),
});
export type FloorLevel = z.infer<typeof FloorLevel>;

export const DigitalTwin = z.object({
  twin_version: z.literal("1.0"),
  project_id: z.string(),
  revision: z.number().int().positive(), // P7 — immutable revisions
  scale: z.object({ source: CoordinateSystem.shape.scale_source, confidence: Confidence }),
  floors: z.array(FloorLevel).min(1),
  graph: z.object({
    adjacency: z.array(z.tuple([z.string(), z.string()])),
    connectivity: z.array(z.tuple([z.string(), z.string(), z.string()])),
  }),
  audit: z.array(
    z.object({ at: z.string(), actor: z.string(), action: z.string(), why: z.string() }),
  ),
});
export type DigitalTwin = z.infer<typeof DigitalTwin>;
