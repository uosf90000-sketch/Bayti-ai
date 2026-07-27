/**
 * Intake & Style contracts — PRD §5 (Architecture v1.0 Frozen).
 * ADR-013: StyleVector مصدر الحقيقة للذوق · ADR-014: كيانات مُنمَّطة لا blob.
 */
import { z } from "zod";
import { Confidence } from "./twin.ts";

/** §5.5 — الأبعاد العشرة المسماة [0,1] — "الاسم واجهة والمتجه الحقيقة" */
export const StyleDims = z.object({
  modernity: Confidence,
  ornamentation: Confidence,
  warmth: Confidence,
  color_saturation: Confidence,
  material_naturalness: Confidence,
  luxury_level: Confidence,
  minimalism: Confidence,
  formality: Confidence,
  contrast: Confidence,
  maintenance_tolerance: Confidence,
});
export type StyleDims = z.infer<typeof StyleDims>;

export const StyleVector = z.object({
  schema_version: z.literal("1.0"),
  dims: StyleDims,
  confidence_per_dim: StyleDims,
  sources: z.array(
    z.enum(["named_style", "quiz_ab", "quiz_sliders", "reference_images", "user_edit"]),
  ),
  room_overrides: z.array(
    z.object({ room_id: z.string(), dims: StyleDims.partial() }),
  ),
  version: z.number().int().positive(),
});
export type StyleVector = z.infer<typeof StyleVector>;

export const ProjectBrief = z.object({
  schema_version: z.literal("1.0"),
  project_id: z.string(),
  property_type: z.enum([
    "villa", "apartment", "duplex", "floor_in_villa", "annex", "traditional_house", "chalet",
  ]),
  tenure: z.enum(["owned", "rented"]),
  condition: z.enum(["new_empty", "existing_occupied"]),
  stage: z.enum(["plan_only", "structure", "finishing", "occupied"]),
  scope: z.enum(["full_home", "selected_rooms"]),
  rooms_to_design: z.array(z.string()),
  area_m2_confirmed: z.number().positive(),
  floors_count: z.number().int().positive(),
  timeline_target: z.enum(["asap", "1_3_months", "3_6_months", "flexible"]),
  version: z.number().int().positive(),
});
export type ProjectBrief = z.infer<typeof ProjectBrief>;

export const HouseholdProfile = z.object({
  schema_version: z.literal("1.0"),
  occupants_count: z.number().int().positive(),
  adults: z.number().int().nonnegative(),
  children: z.object({ count: z.number().int().nonnegative(), ages: z.array(z.number().int()) }),
  elderly: z.object({ count: z.number().int().nonnegative(), mobility_needs: z.boolean() }),
  accessibility_needs: z.array(z.enum(["wheelchair", "walker", "low_vision", "hearing", "none"])),
  pets: z.array(z.object({ type: z.enum(["cat", "dog", "bird", "other"]), indoor: z.boolean() })),
  hospitality: z.object({
    frequency: z.enum(["weekly", "monthly", "occasions_only"]),
    typical_guest_count: z.enum(["under_5", "5_15", "over_15"]),
    gender_separated_majlis: z.boolean(),
  }),
  staff: z.object({ live_in_maid: z.boolean(), driver: z.boolean() }),
  version: z.number().int().positive(),
});
export type HouseholdProfile = z.infer<typeof HouseholdProfile>;

export const BudgetEnvelope = z.object({
  schema_version: z.literal("1.0"),
  mode: z.enum(["total", "per_room"]),
  total_sar: z.number().positive().nullable(),
  per_room_sar: z.array(z.object({ room_id: z.string(), amount: z.number().positive() })).nullable(),
  includes: z.object({
    furniture: z.boolean(),
    finishing: z.boolean(),
    appliances: z.boolean(),
    lighting_fixtures: z.boolean(),
    hvac: z.boolean(),
  }),
  contingency_pct: z.number().min(0).max(50),
  no_compromise: z.array(
    z.object({ kind: z.enum(["room", "category", "item_type"]), ref: z.string() }),
  ),
  economy_ok: z.array(
    z.object({ kind: z.enum(["room", "category", "item_type"]), ref: z.string() }),
  ),
  currency: z.literal("SAR"),
  version: z.number().int().positive(),
});
export type BudgetEnvelope = z.infer<typeof BudgetEnvelope>;

export const HardConstraints = z.object({
  schema_version: z.literal("1.0"),
  banned_colors: z.array(z.string()),
  banned_materials: z.array(z.string()),
  banned_stores: z.array(z.string()),
  banned_item_types: z.array(z.string()),
  allergy_flags: z.array(z.enum(["dust_fabrics", "feathers", "strong_voc_paint", "other"])),
  cleaning_requirement: z.enum(["standard", "easy_clean_priority"]),
  rental_restrictions: z
    .object({ no_drilling: z.boolean(), no_wall_changes: z.boolean(), no_painting: z.boolean() })
    .nullable(),
  structural: z.object({ wall_demolition_allowed: z.literal(false) }), // خارج النطاق دائمًا v1
  version: z.number().int().positive(),
});
export type HardConstraints = z.infer<typeof HardConstraints>;

export const SoftPreferences = z.object({
  schema_version: z.literal("1.0"),
  preferred_stores: z.array(z.string()),
  preferred_colors: z.array(z.string()),
  preferred_materials: z.array(z.string()),
  notes_freeform_ar: z.string().nullable(),
});
export type SoftPreferences = z.infer<typeof SoftPreferences>;

export const ExistingAsset = z.object({
  id: z.string(),
  name_ar: z.string(),
  category: z.string(),
  dimensions_cm: z.tuple([z.number(), z.number(), z.number()]).nullable(),
  photo_key: z.string().nullable(),
  keep_level: z.enum(["must_keep", "prefer_keep"]),
  current_room_id: z.string().nullable(),
  condition: z.enum(["good", "fair", "needs_refurb"]),
});
export type ExistingAsset = z.infer<typeof ExistingAsset>;

import { UnresolvedQuestion } from "./agents.ts";

/** §5.10 — الحزمة المجمدة المسلَّمة للمجلس */
export const IntakeBundle = z.object({
  project_brief: ProjectBrief,
  household: HouseholdProfile,
  budget: BudgetEnvelope,
  style: StyleVector,
  hard_constraints: HardConstraints,
  soft_preferences: SoftPreferences,
  existing_assets: z.array(ExistingAsset),
  unresolved_questions: z.array(UnresolvedQuestion),
  bundle_version: z.number().int().positive(),
});
export type IntakeBundle = z.infer<typeof IntakeBundle>;
