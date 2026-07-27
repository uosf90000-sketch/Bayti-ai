"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROOMS, WALLS, FURNITURE, LIGHTS, HOTSPOTS, WALL_HEIGHT, WALL_THICKNESS } from "./houseLayout";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
/** يحوّل تقدّم التمرير الكلي (0..1) إلى تقدّم محلي (0..1) داخل نطاق مرحلة معيّنة */
const stage = (p: number, from: number, to: number) => smooth(clamp01((p - from) / (to - from)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) =>
  out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));

/** مسار كاميرا سينمائي: نظرة علوية على "المخطط" ← سحب/إمالة أثناء بناء الجدران ← منظور جولة داخلية */
const CAM_KEYS: { p: number; pos: [number, number, number]; look: [number, number, number] }[] = [
  { p: 0.0, pos: [0, 20, 0.01], look: [0, 0, 0] },
  { p: 0.28, pos: [12, 13, 13], look: [0, 0.5, 0] },
  { p: 0.55, pos: [8.5, 6, 9], look: [0, 1, 0] },
  { p: 0.82, pos: [5.5, 3.4, 6.5], look: [0.5, 1, 0.5] },
  { p: 1.0, pos: [4.5, 2.8, 5.5], look: [0.5, 1, 0.5] },
];

function cameraAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1]!.p) i++;
  const a = CAM_KEYS[i]!;
  const b = CAM_KEYS[i + 1]!;
  const t = smooth(clamp01((p - a.p) / (b.p - a.p || 1)));
  lerpV(new THREE.Vector3(...a.pos), new THREE.Vector3(...b.pos), t, pos);
  lerpV(new THREE.Vector3(...a.look), new THREE.Vector3(...b.look), t, look);
}

export function HouseScene({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const wallRefs = useRef<(THREE.Mesh | null)[]>([]);
  const floorRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const furnitureRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hotspotRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const camPos = useRef(new THREE.Vector3(0, 20, 0.01));

  useFrame((state) => {
    const p = progressRef.current;

    // الجدران: تنبثق من المخطط المسطح (blueprint) إلى ارتفاعها الكامل
    const wallRise = stage(p, 0.1, 0.32);
    wallRefs.current.forEach((m) => {
      if (!m) return;
      m.scale.y = Math.max(0.02, wallRise);
      m.position.y = (m.scale.y * WALL_HEIGHT) / 2;
    });

    // الغرف: تُشرَّب بلون هويتها تباعًا
    ROOMS.forEach((room, i) => {
      const t = stage(p, 0.34 + i * 0.03, 0.48 + i * 0.03);
      const mesh = floorRefs.current[i];
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).opacity = t;
    });

    // الإضاءة: تضيء غرفة تلو الأخرى
    LIGHTS.forEach((_, i) => {
      const t = stage(p, 0.5 + i * 0.035, 0.62 + i * 0.035);
      const light = lightRefs.current[i];
      if (light) light.intensity = t * 3.2;
    });

    // الأثاث: يدخل بتتابع خفيف لكل قطعة
    FURNITURE.forEach((_, i) => {
      const t = stage(p, 0.63 + i * 0.02, 0.78 + i * 0.02);
      const mesh = furnitureRefs.current[i];
      if (mesh) mesh.scale.setScalar(Math.max(0.001, t));
    });

    // نقاط المنتجات: تنبض وتظهر في المرحلة الأخيرة
    HOTSPOTS.forEach((_, i) => {
      const t = stage(p, 0.86, 0.96);
      const mesh = hotspotRefs.current[i];
      if (mesh) {
        mesh.scale.setScalar(Math.max(0.001, t) * (1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.08));
        (mesh.material as THREE.MeshStandardMaterial).opacity = t;
      }
    });

    // الكاميرا: مسار سينمائي كامل مربوط بتقدّم التمرير
    cameraAt(p, camPos.current, lookTarget.current);
    state.camera.position.lerp(camPos.current, 0.12);
    state.camera.lookAt(lookTarget.current);
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#e8dfc8" />
      <directionalLight position={[8, 14, 6]} intensity={0.5} color="#f5ecd8" />

      {/* أرضية المخطط الأساسية */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[10.4, 8.4]} />
        <meshStandardMaterial color="#141c31" roughness={0.9} />
      </mesh>

      {/* أرضيات الغرف الملوّنة (تظهر تدريجيًا) */}
      {ROOMS.map((r, i) => (
        <mesh key={r.id} ref={(el) => { floorRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} position={[r.x, 0, r.z]}>
          <planeGeometry args={[r.w - 0.15, r.d - 0.15]} />
          <meshStandardMaterial color={r.color} roughness={0.7} transparent opacity={0} />
        </mesh>
      ))}

      {/* الجدران */}
      {WALLS.map((w, i) => {
        const length = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
        const angle = Math.atan2(w.z2 - w.z1, w.x2 - w.x1);
        return (
          <mesh
            key={i}
            ref={(el) => { wallRefs.current[i] = el; }}
            position={[(w.x1 + w.x2) / 2, 0.02, (w.z1 + w.z2) / 2]}
            rotation={[0, -angle, 0]}
            scale={[1, 0.02, 1]}
          >
            <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial color="#efe6d6" roughness={0.85} />
          </mesh>
        );
      })}

      {/* نقاط الإضاءة */}
      {LIGHTS.map((l, i) => (
        <pointLight key={l.room} ref={(el) => { lightRefs.current[i] = el; }} position={[l.x, 2.3, l.z]} intensity={0} color="#f2c14e" distance={4.5} />
      ))}

      {/* الأثاث */}
      {FURNITURE.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => { furnitureRefs.current[i] = el; }}
          position={[f.x, (f.y ?? f.h / 2), f.z]}
          scale={[0.001, 0.001, 0.001]}
        >
          {f.shape === "cylinder" ? <cylinderGeometry args={[f.w / 2, f.w / 2, f.h, 16]} /> : <boxGeometry args={[f.w, f.h, f.d]} />}
          <meshStandardMaterial color={f.color} roughness={0.6} />
        </mesh>
      ))}

      {/* نقاط المنتجات المتوهجة */}
      {HOTSPOTS.map((h, i) => (
        <mesh key={i} ref={(el) => { hotspotRefs.current[i] = el; }} position={[h.x, h.y, h.z]} scale={[0.001, 0.001, 0.001]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#d9c08a" emissive="#d9c08a" emissiveIntensity={1.4} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}
