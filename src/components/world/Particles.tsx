import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DustProps {
  count?: number;
  radius?: number;
  center?: [number, number, number];
  color?: string;
  size?: number;
  speed?: number;
}

/** Floating glowing dust rendered as a single additive point cloud. */
export function Dust({
  count = 600,
  radius = 40,
  center = [0, 0, 0],
  color = "#ffd9f0",
  size = 0.16,
  speed = 1,
}: DustProps) {
  const points = useRef<THREE.Points>(null);

  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * radius * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, phases };
  }, [count, radius]);

  const base = useMemo(() => positions.slice(), [positions]);

  useFrame((state) => {
    const p = points.current;
    if (!p) return;
    const arr = p.geometry.attributes['position']!.array as Float32Array;
    const t = state.clock.elapsedTime * speed;
    for (let i = 0; i < count; i++) {
      const ph = phases[i]!;
      arr[i * 3 + 1] = base[i * 3 + 1]! + Math.sin(t * 0.35 + ph) * 1.6;
      arr[i * 3] = base[i * 3]! + Math.cos(t * 0.22 + ph) * 1.1;
    }
    p.geometry.attributes['position']!.needsUpdate = true;
    p.rotation.y = t * 0.01;
  });

  return (
    <points ref={points} position={center}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Light streaks that shoot past the camera. */
export function Streaks({
  count = 40,
  center = [0, 0, 0],
  color = "#ff7ac6",
  spread = 14,
  length = 120,
}: {
  count?: number;
  center?: [number, number, number];
  color?: string;
  spread?: number;
  length?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        a: Math.random() * Math.PI * 2,
        r: 2.5 + Math.random() * spread,
        z: (Math.random() - 0.5) * length,
        s: 0.6 + Math.random() * 2.4,
        v: 10 + Math.random() * 40,
      })),
    [count, spread, length],
  );

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    data.forEach((d, i) => {
      d.z += d.v * dt;
      if (d.z > length / 2) d.z = -length / 2;
      dummy.position.set(Math.cos(d.a) * d.r, Math.sin(d.a) * d.r * 0.7, d.z);
      dummy.scale.set(0.03, 0.03, d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} position={center}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}
