"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { RoomObject, RoomDesign } from "@/lib/design/types";
import type { FloorGeometry, RoomGeometry, Vec2 } from "@/lib/geometry/types";
import { roomHasUsableGeometry } from "@/lib/geometry/types";
import { metersPerUnitForRoom } from "@/lib/geometry/scale";
import { wallsForRoom, openingsForWalls, splitWallByOpenings, placeFurniture, polygonBBox } from "@/lib/geometry/placement";

/**
 * محرك CAD/BIM حقيقي: عند توفر هندسة حقيقية للغرفة (جدران/فتحات/مضلّع
 * مستخرجة من التحليل البصري بثقة كافية) يُبنى المشهد من هذه الهندسة نفسها —
 * جدران حقيقية بفجوات فعلية عند كل باب/نافذة، أرضية بشكل المضلّع الفعلي،
 * وأثاث مُوضَّع وفق قواعد تصميم مع منع التداخل مع الجدران/الفتحات/بعضه.
 *
 * إن لم تتوفر هندسة كافية لهذه الغرفة بعينها (P9 — لا اختلاق)، يُعرض بديل
 * تخطيطي صريح (صندوق تقريبي بحجم المساحة المكتشفة) مع رسالة واضحة أن
 * العرض تقريبي — لا يُدَّعى أنه CAD دقيق.
 */

const CATEGORY_STYLE: Record<string, { color: number; w: number; d: number; h: number }> = {
  sofas: { color: 0x8a6d4b, w: 2.0, d: 0.9, h: 0.8 },
  armchairs: { color: 0x8a6d4b, w: 0.8, d: 0.8, h: 0.8 },
  "outdoor-seating": { color: 0x6b8a4b, w: 0.8, d: 0.8, h: 0.8 },
  "coffee-tables": { color: 0x5b4636, w: 1.0, d: 0.5, h: 0.4 },
  lighting: { color: 0xf2c14e, w: 0.3, d: 0.3, h: 0.3 },
  curtains: { color: 0xd8cfc0, w: 1.5, d: 0.1, h: 2.2 },
  bedroom: { color: 0x6f6259, w: 1.6, d: 2.0, h: 0.6 },
  storage: { color: 0x4a4038, w: 1.0, d: 0.6, h: 2.0 },
  mattresses: { color: 0xe5e0d8, w: 1.6, d: 2.0, h: 0.3 },
  "tv-media": { color: 0x2b2b2b, w: 1.6, d: 0.4, h: 0.5 },
  dining: { color: 0x5b4636, w: 1.6, d: 0.9, h: 0.75 },
  mirrors: { color: 0xbfd7e8, w: 0.6, d: 0.05, h: 1.4 },
  "home office": { color: 0x3d4a5c, w: 1.2, d: 0.6, h: 0.75 },
  "home decor": { color: 0xb08968, w: 0.4, d: 0.4, h: 0.4 },
  "soft furnishings": { color: 0xd8cfc0, w: 0.6, d: 0.6, h: 0.2 },
  other: { color: 0x9a9a9a, w: 0.6, d: 0.6, h: 0.6 },
};

function footprint(room: RoomObject): { width: number; length: number } {
  const d = room.dimensions_m;
  if (d?.width && d?.length) return { width: d.width, length: d.length };
  if (room.area_m2) {
    const side = Math.sqrt(room.area_m2);
    return { width: Math.max(2, side * 1.15), length: Math.max(2, side * 0.87) };
  }
  return { width: 4, length: 4 }; // بلا أي بيانات مساحة — قيمة تخطيطية عامة فقط
}

export type CameraMode = "perspective" | "top";
export type LayerVisibility = { walls: boolean; furniture: boolean; lighting: boolean };
export const DEFAULT_LAYERS: LayerVisibility = { walls: true, furniture: true, lighting: true };

type Props = {
  room: RoomObject;
  design: RoomDesign | null;
  geometry?: FloorGeometry;
  cameraMode?: CameraMode;
  layers?: LayerVisibility;
  /** الوضع الاحترافي فقط: يظهر زر بيانات الهندسة الخام — مخفي عن المستخدم العادي (Progressive Disclosure) */
  proMode?: boolean;
};

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
}

type DebugInfo = {
  hasGeometry: boolean;
  geometryOverallConfidence: number | null;
  scaleStatus: string | null;
  totalWallsInProject: number;
  totalRoomsWithPolygon: number;
  hasRoomGeom: boolean;
  roomPolygonPoints: number;
  roomGeometryConfidence: number | null;
  wallsMatchedToRoom: number;
  roomAreaM2: number | null;
  roomDimensionsM: { width: number | null; length: number | null; height: number | null } | null;
  usable: boolean;
  metersPerUnit: number | null;
};

export function RoomScene3D({ room, design, geometry, cameraMode = "perspective", layers = DEFAULT_LAYERS, proMode = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [approximateNote, setApproximateNote] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3ece0);

    const w = mount.clientWidth || 320;
    const h = mount.clientHeight || 220;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const wallsGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    const lightingGroup = new THREE.Group();
    group.add(wallsGroup, furnitureGroup, lightingGroup);
    wallsGroup.visible = layers.walls;
    furnitureGroup.visible = layers.furniture;
    lightingGroup.visible = layers.lighting;

    const floorColor = design?.palette?.[0]?.hex ?? "#d9cdb8";
    const wallColor = design?.palette?.[1]?.hex ?? "#efe6d6";

    let radius: number; // نصف قطر تقريبي للمشهد — يحدّد مسافة الكاميرا
    let note: string | null = null;

    const roomGeom: RoomGeometry | undefined = geometry?.rooms.find((r) => r.room_id === room.id);
    const usable = roomHasUsableGeometry(geometry, room.id);
    const metersPerUnit = usable && geometry && roomGeom ? metersPerUnitForRoom(geometry, roomGeom, room.area_m2, room.dimensions_m) : undefined;
    const roomWallsAll = geometry && roomGeom ? wallsForRoom(geometry.walls, roomGeom) : [];

    // تشخيص مؤقت — يوضّح أين ينقطع خط البيانات بين التحليل وCAD بلا حاجة لوصول سجلات الخادم
    setDebugInfo({
      hasGeometry: !!geometry,
      geometryOverallConfidence: geometry?.overall_confidence ?? null,
      scaleStatus: geometry?.scale.status ?? null,
      totalWallsInProject: geometry?.walls.length ?? 0,
      totalRoomsWithPolygon: geometry?.rooms.length ?? 0,
      hasRoomGeom: !!roomGeom,
      roomPolygonPoints: roomGeom?.polygon.length ?? 0,
      roomGeometryConfidence: roomGeom?.confidence ?? null,
      wallsMatchedToRoom: roomWallsAll.length,
      roomAreaM2: room.area_m2,
      roomDimensionsM: room.dimensions_m,
      usable,
      metersPerUnit: metersPerUnit ?? null,
    });

    if (usable && geometry && roomGeom && metersPerUnit != null && metersPerUnit > 0) {
      // ── مشهد CAD حقيقي من الهندسة المستخرجة فعليًا ──
      const bbox = polygonBBox(roomGeom.polygon);
      const centerU = (bbox.minX + bbox.maxX) / 2;
      const centerV = (bbox.minY + bbox.maxY) / 2;
      const toLocal = ([u, v]: Vec2): [number, number] => [(u - centerU) * metersPerUnit, (v - centerV) * metersPerUnit];

      const roomWalls = roomWallsAll;
      const roomOpenings = openingsForWalls(geometry.openings, roomWalls);

      // الأرضية — شكل المضلّع الفعلي، لا مستطيل تقريبي
      const shapePts = roomGeom.polygon.map(([u, v]) => {
        const [lx, lz] = toLocal([u, v]);
        return new THREE.Vector2(lx, lz);
      });
      const floorShape = new THREE.Shape(shapePts);
      const floorGeo = new THREE.ShapeGeometry(floorShape);
      floorGeo.rotateX(-Math.PI / 2);
      const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: floorColor, side: THREE.DoubleSide }));
      group.add(floor);

      const wallHeightDefault = 2.6;
      const wallThicknessDefault = 0.12;
      const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

      for (const wall of roomWalls) {
        const wallOpenings = roomOpenings.filter((o) => o.wall_id === wall.id);
        const spans = splitWallByOpenings(wall, wallOpenings);
        const wallHeight = wall.height_m ?? wallHeightDefault;
        const thickness = wall.thickness_m ?? wallThicknessDefault;
        for (const span of spans) {
          const [sx, sz] = toLocal(lerp(wall.from, wall.to, span.startT));
          const [ex, ez] = toLocal(lerp(wall.from, wall.to, span.endT));
          const length = Math.hypot(ex - sx, ez - sz);
          if (length < 0.05) continue;
          const angle = Math.atan2(ez - sz, ex - sx);
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(length, wallHeight, thickness),
            new THREE.MeshStandardMaterial({ color: wallColor }),
          );
          box.position.set((sx + ex) / 2, wallHeight / 2, (sz + ez) / 2);
          box.rotation.y = -angle;
          wallsGroup.add(box);
        }
        // زجاج تقريبي عند كل نافذة (طبقة الجدران) — لا يُرسم للأبواب
        for (const o of wallOpenings) {
          if (o.type !== "window") continue;
          const [wx, wz] = toLocal(o.position);
          const wallAngle = Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);
          const glassWidth = o.width_m ?? 1.0;
          const glass = new THREE.Mesh(
            new THREE.BoxGeometry(glassWidth * 0.9, wallHeight * 0.5, 0.03),
            new THREE.MeshStandardMaterial({ color: 0xbfe0f2, transparent: true, opacity: 0.45 }),
          );
          glass.position.set(wx, wallHeight * 0.5, wz);
          glass.rotation.y = -wallAngle;
          wallsGroup.add(glass);
        }
      }

      // الأثاث — يوضع وفق قواعد تصميم (CATEGORY_STYLE) مع منع التداخل مع الجدران/الفتحات
      const candidates = (design?.furniture ?? []).flatMap((f) => {
        const style = CATEGORY_STYLE[f.category] ?? CATEGORY_STYLE.other!;
        return Array.from({ length: Math.min(f.qty, 4) }, () => ({ width: style.w, depth: style.d, height: style.h, category: f.category }));
      });
      const placedItems = placeFurniture(roomGeom, roomWalls, roomOpenings, candidates, metersPerUnit);
      placedItems.forEach((p, i) => {
        const style = CATEGORY_STYLE[candidates[i]?.category ?? "other"] ?? CATEGORY_STYLE.other!;
        const [lx, lz] = toLocal(p.center);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(p.width, style.h, p.depth),
          new THREE.MeshStandardMaterial({ color: style.color }),
        );
        box.position.set(lx, style.h / 2, lz);
        box.rotation.y = -(p.rotationDeg * Math.PI) / 180;
        furnitureGroup.add(box);
      });

      // نقاط الإضاءة
      (design?.lighting ?? []).slice(0, 6).forEach((_, i) => {
        const [minX, maxX] = [(bbox.minX - centerU) * metersPerUnit, (bbox.maxX - centerU) * metersPerUnit];
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xf2c14e, emissiveIntensity: 0.6 }),
        );
        const x = minX + ((i + 1) * (maxX - minX)) / 7;
        sphere.position.set(x, wallHeightDefault - 0.15, 0);
        lightingGroup.add(sphere);
      });

      const spanX = (bbox.maxX - bbox.minX) * metersPerUnit;
      const spanZ = (bbox.maxY - bbox.minY) * metersPerUnit;
      radius = Math.max(spanX, spanZ, 2);

      if (geometry.scale.status !== "confirmed") {
        note = "📐 المقاس محسوب تقريبيًا من المساحة المكتشفة — لا يوجد مقياس رسم مؤكَّد على المخطط";
      }
    } else {
      // ── بديل تخطيطي صريح — لا تتوفر هندسة CAD كافية لهذه الغرفة ──
      const { width, length } = footprint(room);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(width, length),
        new THREE.MeshStandardMaterial({ color: floorColor }),
      );
      floor.rotation.x = -Math.PI / 2;
      group.add(floor);

      const wallHeight = room.dimensions_m?.height ?? 2.6;
      const wallMat = new THREE.MeshStandardMaterial({ color: wallColor });
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, 0.1), wallMat);
      backWall.position.set(0, wallHeight / 2, -length / 2);
      wallsGroup.add(backWall);
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, length), wallMat);
      sideWall.position.set(-width / 2, wallHeight / 2, 0);
      wallsGroup.add(sideWall);

      const items = (design?.furniture ?? []).flatMap((f) => Array.from({ length: Math.min(f.qty, 4) }, () => f));
      const margin = 0.4;
      const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)));
      const cellW = (width - margin * 2) / cols;
      const cellD = (length - margin * 2) / Math.max(1, Math.ceil(items.length / cols));
      items.forEach((item, i) => {
        const style = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.other!;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = -width / 2 + margin + cellW * (col + 0.5);
        const z = -length / 2 + margin + cellD * (row + 0.5);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(style.w, cellW * 0.9), style.h, Math.min(style.d, cellD * 0.9)),
          new THREE.MeshStandardMaterial({ color: style.color }),
        );
        box.position.set(x, style.h / 2, z);
        furnitureGroup.add(box);
      });

      (design?.lighting ?? []).slice(0, 6).forEach((_, i) => {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xf2c14e, emissiveIntensity: 0.6 }),
        );
        const x = -width / 2 + ((i + 1) * width) / 7;
        sphere.position.set(x, wallHeight - 0.15, 0);
        lightingGroup.add(sphere);
      });

      radius = Math.max(width, length, 2);
      note = geometry
        ? "⚠ دقة المخطط لا تكفي لإعادة بناء هندسة دقيقة لهذه الغرفة — المعاينة تخطيطية تقريبية بحجم المساحة المكتشفة فقط"
        : "⚠ لا توجد بيانات هندسة مستخرجة لهذا المشروع — المعاينة تخطيطية تقريبية";
    }

    setApproximateNote(note);

    const camDist = radius * 1.5 + 2;
    let zoom = 1; // 0.4 (أقرب) .. 2.5 (أبعد) — عجلة الفأرة على سطح المكتب، Pinch على اللمس
    const positionCamera = () => {
      const d = camDist * zoom;
      if (cameraMode === "top") camera.position.set(0, d * 1.3, 0.001);
      else camera.position.set(d * 0.7, d * 0.65, d * 0.7);
      camera.lookAt(0, 0, 0);
    };
    positionCamera();

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 8, 4);
    scene.add(dir);

    // دوران بالسحب (فأرة أو إصبع واحد — Pointer Events توحّد الاثنين) — معطّل في المنظور العلوي
    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" && activeTouches.size >= 2) return; // إصبعان = تقريب لا دوران
      dragging = true; lastX = e.clientX;
    };
    const onUp = () => { dragging = false; };
    const onMove = (e: PointerEvent) => {
      if (!dragging || cameraMode === "top" || activeTouches.size >= 2) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      group.rotation.y += dx * 0.01;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

    // التقريب — عجلة الفأرة (سطح المكتب) و Pinch بإصبعين (لمس)
    const applyZoom = (factor: number) => {
      zoom = Math.min(2.5, Math.max(0.4, zoom * factor));
      positionCamera();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(e.deltaY > 0 ? 1.08 : 0.93);
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const activeTouches = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    const touchDist = () => {
      const pts = [...activeTouches.values()];
      return pts.length === 2 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0;
    };
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouches.size === 2) pinchStartDist = touchDist();
    };
    const onTouchMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !activeTouches.has(e.pointerId)) return;
      activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activeTouches.size === 2) {
        const d = touchDist();
        if (pinchStartDist > 0 && d > 0) applyZoom(pinchStartDist / d);
        pinchStartDist = d;
      }
    };
    const onTouchUp = (e: PointerEvent) => { activeTouches.delete(e.pointerId); pinchStartDist = 0; };
    renderer.domElement.addEventListener("pointerdown", onTouchDown);
    window.addEventListener("pointermove", onTouchMove);
    window.addEventListener("pointerup", onTouchUp);
    window.addEventListener("pointercancel", onTouchUp);

    let raf = 0;
    const animate = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const nw = mount.clientWidth || w;
      const nh = mount.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerdown", onTouchDown);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onTouchMove);
      window.removeEventListener("pointerup", onTouchUp);
      window.removeEventListener("pointercancel", onTouchUp);
      disposeObject(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [room, design, geometry, cameraMode, layers.walls, layers.furniture, layers.lighting]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }} />
      {approximateNote && (
        <div
          style={{
            position: "absolute", bottom: 6, insetInline: 6, fontSize: 11.5, lineHeight: 1.4,
            background: "rgba(20,16,10,0.72)", color: "#f3ece0", padding: "6px 10px", borderRadius: 8,
            pointerEvents: "none",
          }}
        >
          {approximateNote}
        </div>
      )}
      {proMode && debugInfo && (
        <div style={{ position: "absolute", top: 6, insetInlineStart: 6, maxWidth: "calc(100% - 12px)" }}>
          <button
            type="button" onClick={() => setDebugOpen((v) => !v)}
            style={{
              fontSize: 10.5, background: "rgba(20,16,10,0.72)", color: "#f3ece0", border: "none",
              borderRadius: 6, padding: "3px 8px", cursor: "pointer",
            }}
          >
            🔧 {debugOpen ? "إخفاء" : "بيانات الهندسة الخام"}
          </button>
          {debugOpen && (
            <pre
              dir="ltr"
              style={{
                marginTop: 4, fontSize: 10, lineHeight: 1.5, background: "rgba(20,16,10,0.85)", color: "#e8dfce",
                padding: "8px 10px", borderRadius: 8, whiteSpace: "pre-wrap", maxHeight: 220, overflow: "auto",
              }}
            >
{`hasGeometry: ${debugInfo.hasGeometry}
geometry.overall_confidence: ${debugInfo.geometryOverallConfidence ?? "—"}
scale.status: ${debugInfo.scaleStatus ?? "—"}
totalWalls (project): ${debugInfo.totalWallsInProject}
totalRoomsWithPolygon (project): ${debugInfo.totalRoomsWithPolygon}
hasRoomGeom (this room): ${debugInfo.hasRoomGeom}
room.polygon.length: ${debugInfo.roomPolygonPoints}
room.geometry_confidence: ${debugInfo.roomGeometryConfidence ?? "—"}
wallsMatchedToRoom: ${debugInfo.wallsMatchedToRoom}
room.area_m2: ${debugInfo.roomAreaM2 ?? "—"}
room.dimensions_m: ${debugInfo.roomDimensionsM ? JSON.stringify(debugInfo.roomDimensionsM) : "—"}
roomHasUsableGeometry: ${debugInfo.usable}
metersPerUnit: ${debugInfo.metersPerUnit ?? "—"}`}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
