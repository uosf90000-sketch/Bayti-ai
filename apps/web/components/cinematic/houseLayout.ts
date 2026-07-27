/**
 * تخطيط بيت تجريبي مبسّط (Demo — لا يمثّل مخطط مستخدم حقيقي) يُستخدم فقط لسرد
 * قصة "من مخطط إلى بيت" في مشهد الترحيب. عند وجود مشروع حقيقي للمستخدم، تُستخدم
 * بياناته الفعلية (twin/geometry) في الجولة الحقيقية بعد الرفع — لا خلط بين الاثنين.
 */
export type RoomBlock = { id: string; name_ar: string; x: number; z: number; w: number; d: number; color: string };
export type WallSeg = { x1: number; z1: number; x2: number; z2: number };
export type FurniturePiece = { room: string; x: number; z: number; w: number; h: number; d: number; y?: number; color: string; shape?: "box" | "cylinder" };
export type Hotspot = { room: string; x: number; y: number; z: number; label_ar: string };

const HALF_W = 5;
const HALF_D = 4;

export const ROOMS: RoomBlock[] = [
  { id: "majlis", name_ar: "مجلس الضيافة", x: -2.5, z: -2, w: 5, d: 4, color: "#8a6d3c" },
  { id: "living", name_ar: "المعيشة العائلية", x: 2.5, z: -2, w: 5, d: 4, color: "#3c5a6d" },
  { id: "kitchen", name_ar: "المطبخ", x: -2.5, z: 2, w: 5, d: 4, color: "#4a6d3c" },
  { id: "master", name_ar: "غرفة النوم الرئيسية", x: 2.5, z: 2, w: 5, d: 4, color: "#5a3c6d" },
];

export const WALLS: WallSeg[] = [
  // محيط خارجي
  { x1: -HALF_W, z1: -HALF_D, x2: HALF_W, z2: -HALF_D },
  { x1: HALF_W, z1: -HALF_D, x2: HALF_W, z2: HALF_D },
  { x1: HALF_W, z1: HALF_D, x2: -HALF_W, z2: HALF_D },
  { x1: -HALF_W, z1: HALF_D, x2: -HALF_W, z2: -HALF_D },
  // قواطع داخلية (+)
  { x1: 0, z1: -HALF_D, x2: 0, z2: HALF_D },
  { x1: -HALF_W, z1: 0, x2: HALF_W, z2: 0 },
];

export const FURNITURE: FurniturePiece[] = [
  { room: "majlis", x: -3.6, z: -1, w: 2.6, h: 0.75, d: 1, color: "#caa15a", shape: "box" },
  { room: "majlis", x: -1.6, z: -3, w: 0.9, h: 0.5, d: 0.9, color: "#8a6d3c", shape: "box" },
  { room: "living", x: 3.6, z: -1, w: 2.2, h: 0.7, d: 1, color: "#9fb3c2", shape: "box" },
  { room: "living", x: 1.4, z: -3.2, w: 1.4, h: 0.35, d: 0.7, color: "#2b2b2b", shape: "box" },
  { room: "kitchen", x: -3.6, z: 3.2, w: 2.4, h: 0.9, d: 0.7, color: "#d9cdb8", shape: "box" },
  { room: "kitchen", x: -1.4, z: 1, w: 1.2, h: 0.75, d: 1.2, color: "#4a6d3c", shape: "box" },
  { room: "master", x: 3, z: 3, w: 2, h: 0.5, d: 2, color: "#c9bfa8", shape: "box" },
  { room: "master", x: 1.5, z: 1.2, w: 0.6, h: 0.6, d: 0.6, color: "#5a3c6d", shape: "cylinder" },
];

export const LIGHTS: { room: string; x: number; z: number }[] = ROOMS.map((r) => ({ room: r.id, x: r.x, z: r.z }));

export const HOTSPOTS: Hotspot[] = [
  { room: "majlis", x: -3.6, y: 1.1, z: -1, label_ar: "طقم كنب المجلس" },
  { room: "living", x: 3.6, y: 1, z: -1, label_ar: "ركن التلفاز" },
  { room: "kitchen", x: -3.6, y: 1.2, z: 3.2, label_ar: "حزمة الأجهزة" },
  { room: "master", x: 3, z: 3, y: 0.7, label_ar: "سرير رئيسي" },
];

export const WALL_HEIGHT = 2.6;
export const WALL_THICKNESS = 0.12;
