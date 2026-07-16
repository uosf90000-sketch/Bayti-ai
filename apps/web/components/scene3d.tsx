"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { RoomObject, RoomDesign } from "@/lib/design/types";

/**
 * 3D Engine — مشهد تخطيطي حقيقي (Three.js فعلي، ليس صورة ثابتة) لكل غرفة على
 * حدة، مبني من بيانات التصميم الحقيقية (نوع/مساحة الغرفة + قائمة الأثاث
 * المولّدة). هذا تصور تخطيطي (صناديق ملوّنة بحجم تقريبي حسب الفئة) وليس
 * إعادة بناء دقيقة للجدران/الفتحات — تلك تحتاج مسح CAD غير متاح (نفس حد
 * Digital Twin المبسّط في docs/FLOORPLAN_ANALYSIS.md). لا يُخترع أثاث لا
 * يوجد في design.furniture.
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

export function RoomScene3D({ room, design }: { room: RoomObject; design: RoomDesign | null }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const { width, length } = footprint(room);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3ece0);

    const w = mount.clientWidth || 320;
    const h = mount.clientHeight || 220;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    const camDist = Math.max(width, length) * 1.4 + 2;
    camera.position.set(camDist * 0.7, camDist * 0.65, camDist * 0.7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // الأرضية
    const floorColor = design?.palette?.[0]?.hex ?? "#d9cdb8";
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, length),
      new THREE.MeshStandardMaterial({ color: floorColor }),
    );
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // جداران خلفيان فقط (مقطع تخطيطي — رؤية من الأعلى مفتوحة)
    const wallColor = design?.palette?.[1]?.hex ?? "#efe6d6";
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor });
    const wallHeight = room.dimensions_m?.height ?? 2.6;
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, 0.1), wallMat);
    backWall.position.set(0, wallHeight / 2, -length / 2);
    group.add(backWall);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, length), wallMat);
    sideWall.position.set(-width / 2, wallHeight / 2, 0);
    group.add(sideWall);

    // الأثاث — صناديق تخطيطية بحجم تقريبي حسب الفئة، موزّعة على شبكة داخل حدود الغرفة
    const items = (design?.furniture ?? []).flatMap((f) =>
      Array.from({ length: Math.min(f.qty, 4) }, () => f),
    );
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
      group.add(box);
    });

    // نقاط الإضاءة — كرات صغيرة قرب السقف
    (design?.lighting ?? []).slice(0, 6).forEach((_, i) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xf2c14e, emissiveIntensity: 0.6 }),
      );
      const x = -width / 2 + ((i + 1) * width) / 7;
      sphere.position.set(x, wallHeight - 0.15, 0);
      group.add(sphere);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 8, 4);
    scene.add(dir);

    // دوران بسيط بالسحب (Orbit يدوي خفيف — بلا اعتماد إضافي)
    let dragging = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; };
    const onUp = () => { dragging = false; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      group.rotation.y += dx * 0.01;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);

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
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [room, design]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }} />;
}
