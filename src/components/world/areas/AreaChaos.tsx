import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display, HoloButton } from "../Holo";
import { Cat } from "../Cat";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK } from "@/lib/world/constants";
import { flash, kick } from "@/lib/world/store";

const Z = AREA_Z[5]!;
const BOX = { x: 9, y: 5.5, z: 12 };

interface Body3D {
  p: THREE.Vector3;
  v: THREE.Vector3;
  r: THREE.Euler;
  rv: THREE.Vector3;
  s: number;
  kind: number;
}

/** Bouncy junk with cheap but believable physics. */
function ChaosJunk({ count = 26 }: { count?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const bodies = useMemo<Body3D[]>(
    () =>
      Array.from({ length: count }, () => ({
        p: new THREE.Vector3(
          (Math.random() - 0.5) * BOX.x * 1.6,
          (Math.random() - 0.5) * BOX.y * 1.6,
          -Math.random() * BOX.z,
        ),
        v: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 6,
        ),
        r: new THREE.Euler(Math.random() * 3, Math.random() * 3, 0),
        rv: new THREE.Vector3(Math.random() * 2, Math.random() * 2, Math.random() * 2),
        s: 0.3 + Math.random() * 0.7,
        kind: Math.floor(Math.random() * 4),
      })),
    [count],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    bodies.forEach((b, i) => {
      b.v.y -= 5.5 * dt;
      b.p.addScaledVector(b.v, dt);
      const lim = { x: BOX.x, y: BOX.y, z: BOX.z };
      (["x", "y", "z"] as const).forEach((ax) => {
        const min = ax === "z" ? -lim.z : -lim[ax];
        const max = ax === "z" ? 2 : lim[ax];
        if (b.p[ax] < min) {
          b.p[ax] = min;
          b.v[ax] = Math.abs(b.v[ax]) * 0.82;
        } else if (b.p[ax] > max) {
          b.p[ax] = max;
          b.v[ax] = -Math.abs(b.v[ax]) * 0.82;
        }
      });
      if (b.p.y <= -BOX.y + 0.01 && Math.abs(b.v.y) < 2.2) b.v.y = 3 + Math.random() * 4;
      const m = refs.current[i];
      if (m) {
        m.position.copy(b.p);
        m.rotation.x += b.rv.x * dt;
        m.rotation.y += b.rv.y * dt;
        m.rotation.z += b.rv.z * dt;
      }
    });
  });

  return (
    <>
      {bodies.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          scale={b.s}
          castShadow
        >
          {b.kind === 0 && <boxGeometry args={[1, 1, 1]} />}
          {b.kind === 1 && <icosahedronGeometry args={[0.7, 0]} />}
          {b.kind === 2 && <torusKnotGeometry args={[0.4, 0.14, 64, 8]} />}
          {b.kind === 3 && <coneGeometry args={[0.5, 1, 6]} />}
          <meshStandardMaterial
            color={i % 3 === 0 ? CYAN : PINK}
            emissive={i % 3 === 0 ? CYAN : PINK}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.18}
          />
        </mesh>
      ))}
    </>
  );
}

function FallingCat() {
  const g = useRef<THREE.Group>(null);
  const state = useRef({ y: 2, v: 0, wait: 0 });
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const s = state.current;
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) {
        s.y = 2.6;
        s.v = 0;
      }
    } else {
      s.v -= 9 * dt;
      s.y += s.v * dt;
      if (s.y < -5) s.wait = 2.5;
    }
    if (g.current) {
      g.current.position.y = s.y;
      g.current.rotation.z += dt * (s.wait > 0 ? 0 : 3);
    }
  });
  return (
    <group ref={g} position={[3.2, 2, -4]}>
      <Cat scale={0.9} color={"#ffd0ea"} wobble={0} />
    </group>
  );
}

/** AREA 6 — The chaos room. */
export function AreaChaos() {
  const warn = useRef<THREE.Group>(null);
  useFrame((state) => {
    const e = state.clock.elapsedTime;
    if (warn.current) {
      const pulse = 0.5 + Math.abs(Math.sin(e * 3)) * 0.5;
      warn.current.scale.setScalar(1 + pulse * 0.03);
    }
  });

  return (
    <group position={[0, 0, Z]}>
      {/* room shell */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[BOX.x * 2 + 1, BOX.y * 2 + 1, BOX.z + 8]} />
        <meshStandardMaterial
          color="#100818"
          side={THREE.BackSide}
          metalness={0.8}
          roughness={0.35}
          emissive="#26102f"
          emissiveIntensity={0.4}
        />
      </mesh>

      <ChaosJunk />
      <FallingCat />
      <group position={[-3.4, -4.6, -3]}>
        <Cat scale={1.1} watcher clickable />
      </group>
      <group position={[4.6, -4.8, -8]}>
        <Cat scale={0.8} color={CYAN} clickable />
      </group>
      <group position={[-5.6, 1.4, -9]}>
        <Cat scale={0.7} color="#ffd0ea" clickable />
      </group>

      <group ref={warn} position={[0, 2.4, -9]}>
        <Display size={1.5} color="#ff5252" letterSpacing={0.3}>
          WARNING
        </Display>
        <Body position={[0, -1.2, 0]} size={0.34} color="#ffb0c8">
          TOO MUCH CHAOS DETECTED
        </Body>
        <Body position={[0, -1.9, 0]} size={0.24} color={CYAN}>
          LIKELY CAUSE: NADA + ABDULAZIZ
        </Body>
      </group>

      <HoloButton
        label="CALL NADA"
        size={0.18}
        width={2.6}
        color="#ff5252"
        position={[-5.4, -2.4, -1]}
        rotation={[0, 0.5, 0]}
        onClick={() => flash("She already knows.")}
      />
      <HoloButton
        label="STABILIZE"
        size={0.18}
        width={2.6}
        color={CYAN}
        position={[5.4, -2.4, -1]}
        rotation={[0, -0.5, 0]}
        onClick={() => {
          kick(1.4);
          flash("Stabilization failed. As expected.");
        }}
      />

      <Dust count={220} radius={16} color="#ffd9f0" size={0.09} />
      <pointLight position={[0, 3, 2]} intensity={70} color={PINK} distance={40} castShadow />
      <pointLight position={[-6, -3, -10]} intensity={40} color={CYAN} distance={40} />
    </group>
  );
}
