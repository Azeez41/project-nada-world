import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display } from "../Holo";
import { Streaks } from "../Particles";
import { CYAN, PINK, WHITE } from "@/lib/world/constants";
import { sfx } from "@/lib/world/audio";
import { flash } from "@/lib/world/store";

const metal = (color: string) => (
  <meshStandardMaterial color={color} metalness={0.85} roughness={0.22} emissive={color} emissiveIntensity={0.25} />
);

function Camera3D() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.45, 0.4]} />
        {metal("#c9c3ff")}
      </mesh>
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.19, 0.22, 20]} />
        {metal("#8f88c9")}
      </mesh>
      <mesh position={[0.2, 0.28, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
        {metal(PINK)}
      </mesh>
    </group>
  );
}

function Flower() {
  return (
    <group>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.7, 6]} />
        {metal("#5fd39a")}
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 6) * 6.28) * 0.17, 0.05, Math.sin((i / 6) * 6.28) * 0.17]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          {metal(i % 2 ? PINK : "#ffd0ea")}
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.09, 12, 10]} />
        {metal("#ffe9a8")}
      </mesh>
    </group>
  );
}

function DinnerTable() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 24]} />
        {metal("#d7cdb8")}
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.07, 0.14, 0.6, 12]} />
        {metal("#8b8272")}
      </mesh>
      <mesh position={[0.18, 0.28, 0.1]}>
        <sphereGeometry args={[0.11, 12, 10]} />
        {metal(PINK)}
      </mesh>
      <mesh position={[-0.2, 0.35, -0.05]}>
        <coneGeometry args={[0.08, 0.24, 10]} />
        {metal(CYAN)}
      </mesh>
    </group>
  );
}

function TinyCar() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.9, 0.22, 0.42]} />
        {metal(PINK)}
      </mesh>
      <mesh position={[-0.05, 0.26, 0]}>
        <boxGeometry args={[0.44, 0.2, 0.36]} />
        {metal("#b9e8ff")}
      </mesh>
      {[
        [-0.3, -0.06, 0.22],
        [0.3, -0.06, 0.22],
        [-0.3, -0.06, -0.22],
        [0.3, -0.06, -0.22],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 12]} />
          {metal("#2a2438")}
        </mesh>
      ))}
    </group>
  );
}

function Polaroid({ tint = PINK }: { tint?: string }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.9, 1.05, 0.04]} />
        <meshStandardMaterial color="#f3eef8" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 0.03]}>
        <planeGeometry args={[0.74, 0.72]} />
        <meshBasicMaterial color={tint} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Ramen() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.34, 0.2, 0.3, 20]} />
        {metal("#ffffff")}
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 20]} />
        {metal("#ffb26b")}
      </mesh>
      <mesh position={[0.1, 0.36, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
        {metal("#e9dcc0")}
      </mesh>
    </group>
  );
}

const MEMORIES: { kind: string; label: string; angle: number; z: number; r: number }[] = [
  { kind: "camera", label: "the photo you deleted 11 times", angle: 0.3, z: -158, r: 3.4 },
  { kind: "flower", label: "flowers that survived 3 days. a record.", angle: 2.4, z: -172, r: 3.8 },
  { kind: "table", label: "the dinner where we argued about the menu", angle: 4.3, z: -188, r: 3.2 },
  { kind: "car", label: "driving nowhere, on purpose", angle: 1.2, z: -204, r: 4.0 },
  { kind: "polaroid", label: "you, mid-laugh, unusable and perfect", angle: 3.6, z: -220, r: 3.3 },
  { kind: "ramen", label: "the food you said you didn't want. then ate.", angle: 5.4, z: -236, r: 3.9 },
  { kind: "polaroid2", label: "3:41 AM. a voice note. pure nonsense.", angle: 0.9, z: -252, r: 3.5 },
  { kind: "flower", label: "and this one is just because", angle: 3.0, z: -268, r: 3.6 },
];

function MemoryObject({
  kind,
  label,
  angle,
  z,
  r,
}: {
  kind: string;
  label: string;
  angle: number;
  z: number;
  r: number;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const [near, setNear] = useState(0);
  const announced = useRef(false);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const e = state.clock.elapsedTime;
    const d = Math.abs(state.camera.position.z - z);
    const target = THREE.MathUtils.clamp(1 - d / 16, 0, 1);
    const n = THREE.MathUtils.damp(near, target, 4, dt);
    if (Math.abs(n - near) > 0.005) setNear(n);
    if (n > 0.6 && !announced.current) {
      announced.current = true;
      sfx("hover");
    } else if (n < 0.3) announced.current = false;
    if (inner.current) {
      inner.current.rotation.y = e * 0.5 + angle;
      inner.current.rotation.x = Math.sin(e * 0.7 + angle) * 0.2;
      inner.current.scale.setScalar(1 + n * 0.9);
    }
    g.position.x = Math.cos(angle) * r + Math.sin(e * 0.4 + angle) * 0.25;
    g.position.y = Math.sin(angle) * r * 0.75 + Math.cos(e * 0.5 + angle) * 0.25;
  });

  return (
    <group ref={group} position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.75, z]}>
      <group ref={inner}>
        {kind === "camera" && <Camera3D />}
        {kind === "flower" && <Flower />}
        {kind === "table" && <DinnerTable />}
        {kind === "car" && <TinyCar />}
        {kind === "polaroid" && <Polaroid />}
        {kind === "polaroid2" && <Polaroid tint={CYAN} />}
        {kind === "ramen" && <Ramen />}
      </group>
      <pointLight intensity={2 + near * 12} color={PINK} distance={7} />
      {near > 0.05 && (
        <Body position={[0, -1.15, 0.6]} size={0.19} opacity={near} maxWidth={5} color={WHITE}>
          {label}
        </Body>
      )}
    </group>
  );
}

function TunnelRings() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 70;
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const e = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const z = -150 - i * 2.2;
      dummy.position.set(Math.sin(i * 0.12) * 0.6, Math.cos(i * 0.1) * 0.5, z);
      dummy.rotation.z = e * 0.15 + i * 0.2;
      const s = 5.4 + Math.sin(e * 0.8 + i * 0.3) * 0.25;
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new THREE.Color(i % 7 === 0 ? CYAN : PINK));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <torusGeometry args={[1, 0.012, 6, 40]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/** AREA 3 — The memory tunnel. */
export function AreaTunnel() {
  const [secret, setSecret] = useState("Abdulaziz was right.");
  return (
    <group>
      <TunnelRings />
      <Streaks count={46} center={[0, 0, -220]} length={150} spread={5} />
      <Display position={[0, 3.2, -146]} size={0.6} letterSpacing={0.2}>
        MEMORY TUNNEL
      </Display>
      {MEMORIES.map((m, i) => (
        <MemoryObject key={i} {...m} />
      ))}
      <group
        position={[2.1, -2.6, -244]}
        rotation={[0, -0.5, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (secret !== "ERROR.") {
            setSecret("ERROR.");
            sfx("warn");
            flash("Records corrected.");
          }
        }}
      >
        <Body size={0.16} color={secret === "ERROR." ? "#ff5252" : "#6b6480"}>
          {secret}
        </Body>
        <mesh>
          <planeGeometry args={[2.4, 0.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
      <pointLight position={[0, 0, -180]} intensity={30} color={PINK} distance={30} />
      <pointLight position={[0, 0, -250]} intensity={30} color={CYAN} distance={30} />
    </group>
  );
}
