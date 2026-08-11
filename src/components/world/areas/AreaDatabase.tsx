import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display, HoloButton, Panel } from "../Holo";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK, WHITE } from "@/lib/world/constants";
import { flash, kick, rig } from "@/lib/world/store";

const Z = AREA_Z[1]!;

function useCountUp(target: number, duration = 2.4) {
  const [value, setValue] = useState(0);
  const started = useRef<number | null>(null);
  useFrame((state) => {
    if (started.current === null) started.current = state.clock.elapsedTime;
    const p = Math.min(1, (state.clock.elapsedTime - started.current) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const next = Math.floor(target * eased);
    setValue((v) => (v === next ? v : next));
  });
  return value;
}

function StatPanel({
  label,
  value,
  position,
  depth = 1,
  wide = 4.6,
}: {
  label: string;
  value: string;
  position: [number, number, number];
  depth?: number;
  wide?: number;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!g.current) return;
    const e = state.clock.elapsedTime;
    g.current.position.x = THREE.MathUtils.damp(
      g.current.position.x,
      position[0] + rig.px * 1.6 * depth,
      3,
      dt,
    );
    g.current.position.y = THREE.MathUtils.damp(
      g.current.position.y,
      position[1] - rig.py * 1.1 * depth + Math.sin(e * 0.8 + depth) * 0.12,
      3,
      dt,
    );
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, -rig.px * 0.35, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, rig.py * 0.25, 3, dt);
  });
  return (
    <group ref={g} position={position}>
      <Panel width={wide} height={2} color={PINK} opacity={0.08} />
      <Body position={[-wide / 2 + 0.35, 0.62, 0.05]} size={0.2} anchorX="left" color={CYAN}>
        {label}
      </Body>
      <Display position={[-wide / 2 + 0.35, -0.25, 0.05]} size={0.62} anchorX="left" color={WHITE}>
        {value}
      </Display>
    </group>
  );
}

function ServerStacks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const items = useMemo(
    () =>
      Array.from({ length: 260 }, () => ({
        x: (Math.random() - 0.5) * 90,
        y: (Math.random() - 0.5) * 40,
        z: -20 - Math.random() * 70,
        h: 2 + Math.random() * 14,
        p: Math.random() * 6.28,
      })),
    [],
  );
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const e = state.clock.elapsedTime;
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y + Math.sin(e * 0.3 + it.p) * 0.6, it.z);
      dummy.rotation.y = e * 0.05 + it.p;
      dummy.scale.set(0.5, it.h, 0.5);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 260]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#170d22"
        emissive={PINK}
        emissiveIntensity={0.35}
        metalness={0.9}
        roughness={0.25}
      />
    </instancedMesh>
  );
}

/** AREA 2 — The relationship database. */
export function AreaDatabase() {
  // seconds since the day this whole mess started — tweak freely
  const since = useMemo(() => Date.UTC(2023, 8, 12), []);
  const days = Math.floor((Date.now() - since) / 86400000);
  const together = useCountUp(days);
  const args = useCountUp(147);
  const jokes = useCountUp(3812);

  return (
    <group position={[0, 0, Z]}>
      <ServerStacks />
      <Display position={[0, 5.6, 4]} size={0.95} letterSpacing={0.14}>
        RELATIONSHIP DATABASE
      </Display>
      <Body position={[0, 4.6, 4]} size={0.2} color={CYAN}>
        LIVE FEED · ACCESS LEVEL: GIRLFRIEND
      </Body>

      <StatPanel label="DAYS TOGETHER" value={`${together}`} position={[-3.4, 2.4, 6]} depth={1.2} />
      <StatPanel label="ARGUMENTS SURVIVED" value={`${args}`} position={[3.4, 1.6, 4.4]} depth={0.8} />
      <StatPanel label="STUPID INSIDE JOKES" value={`${jokes}`} position={[-3.9, -0.6, 3]} depth={1.5} />
      <StatPanel
        label="TIMES ABDULAZIZ WAS WRONG"
        value="CLASSIFIED"
        position={[3.1, -1.4, 6.2]}
        depth={1.1}
        wide={5.6}
      />
      <StatPanel
        label="TIMES NADA WAS WRONG"
        value="ERROR 404"
        position={[-0.2, -3.6, 5]}
        depth={0.6}
        wide={5}
      />

      <HoloButton
        label="DO NOT PRESS"
        size={0.12}
        width={1.7}
        color="#ff5252"
        position={[6.4, -3.6, 7]}
        onClick={() => {
          flash("Why would you do that?");
          kick(1.6);
        }}
      />

      <Dust count={420} radius={40} color="#ffb0e0" size={0.12} />
      <pointLight position={[0, 4, 10]} intensity={60} color={PINK} distance={60} />
      <pointLight position={[-8, -4, 2]} intensity={40} color={CYAN} distance={50} />
    </group>
  );
}
