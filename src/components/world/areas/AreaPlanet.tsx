import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display } from "../Holo";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK, WHITE } from "@/lib/world/constants";
import { rig } from "@/lib/world/store";
import { sfx } from "@/lib/world/audio";

const Z = AREA_Z[4]!;
const R = 8;

const SPOTS = [
  { phi: 1.1, theta: 0.4, label: "the couch. our entire civilisation." },
  { phi: 1.9, theta: 2.2, label: "where you laughed so hard you stopped breathing" },
  { phi: 0.8, theta: 4.1, label: "the 2 AM drive-through capital" },
  { phi: 2.3, theta: 5.4, label: "argument valley. now a tourist site." },
];

function sphere(phi: number, theta: number, r: number) {
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function Cities() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = 700;
  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const arr: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const p = sphere(phi, theta, R);
      dummy.position.copy(p);
      dummy.lookAt(0, 0, 0);
      const h = 0.05 + Math.random() * 0.55;
      dummy.scale.set(0.05 + Math.random() * 0.08, 0.05 + Math.random() * 0.08, h);
      dummy.position.addScaledVector(p.clone().normalize(), h / 2);
      dummy.updateMatrix();
      arr.push(dummy.matrix.clone());
    }
    return arr;
  }, []);

  useFrame(() => {
    const m = mesh.current;
    if (!m || m.userData['done']) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    m.userData['done'] = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#2a1230"
        emissive={PINK}
        emissiveIntensity={1.3}
        metalness={0.8}
        roughness={0.3}
      />
    </instancedMesh>
  );
}

function Spot({ phi, theta, label }: { phi: number; theta: number; label: string }) {
  const g = useRef<THREE.Group>(null);
  const [vis, setVis] = useState(0);
  const pos = useMemo(() => sphere(phi, theta, R + 0.4), [phi, theta]);
  const world = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const g0 = g.current;
    if (!g0) return;
    g0.getWorldPosition(world);
    const toCam = state.camera.position.clone().sub(world).normalize();
    const normal = world.clone().sub(new THREE.Vector3(0, 0, Z)).normalize();
    const facing = THREE.MathUtils.clamp(normal.dot(toCam), 0, 1);
    const next = THREE.MathUtils.damp(vis, facing > 0.55 ? 1 : 0, 4, dt);
    if (Math.abs(next - vis) > 0.01) setVis(next);
    g0.lookAt(state.camera.position);
  });
  return (
    <group ref={g} position={pos}>
      <mesh>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color={CYAN} />
      </mesh>
      {vis > 0.02 && (
        <Body position={[0, 0.7, 0]} size={0.34} maxWidth={7} opacity={vis} color={WHITE}>
          {label}
        </Body>
      )}
    </group>
  );
}

/** AREA 5 — Our little universe. */
export function AreaPlanet() {
  const planet = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const drag = useRef<{ active: boolean; x: number }>({ active: false, x: 0 });

  useFrame((state, dt) => {
    const e = state.clock.elapsedTime;
    if (planet.current) {
      planet.current.rotation.y = e * 0.06 + rig.spin;
      planet.current.rotation.x = THREE.MathUtils.damp(planet.current.rotation.x, rig.py * 0.25, 2, dt);
    }
    if (clouds.current) clouds.current.rotation.y = -e * 0.03 + rig.spin * 0.4;
  });

  return (
    <group position={[0, 0, Z]}>
      <group
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          drag.current = { active: true, x: e.clientX ?? 0 };
        }}
        onPointerUp={() => {
          drag.current.active = false;
        }}
        onPointerOut={() => {
          drag.current.active = false;
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (!drag.current.active) return;
          const x = e.clientX ?? 0;
          rig.spinVel += (x - drag.current.x) * 0.004;
          drag.current.x = x;
        }}
      >
        <group ref={planet}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[R, 64, 48]} />
            <meshStandardMaterial
              color="#150b1e"
              metalness={0.9}
              roughness={0.35}
              emissive="#3a1140"
              emissiveIntensity={0.35}
            />
          </mesh>
          <Cities />
          {SPOTS.map((s, i) => (
            <Spot key={i} {...s} />
          ))}
        </group>
        <mesh ref={clouds}>
          <sphereGeometry args={[R + 0.9, 48, 32]} />
          <meshPhysicalMaterial
            color={MAGENTA_CLOUD}
            transparent
            opacity={0.12}
            roughness={0.9}
            transmission={0.6}
            thickness={2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0.4]}>
          <torusGeometry args={[R + 3.6, 0.06, 8, 128]} />
          <meshBasicMaterial color={PINK} transparent opacity={0.6} />
        </mesh>
      </group>

      <Display position={[0, R + 4.6, 4]} size={0.9} letterSpacing={0.16}>
        OUR LITTLE UNIVERSE
      </Display>
      <Body position={[0, R + 3.4, 4]} size={0.22} color={CYAN}>
        drag to spin it. it is yours.
      </Body>

      <Dust count={500} radius={44} color="#ffffff" size={0.09} />
      <pointLight position={[16, 12, 14]} intensity={900} color={WHITE} distance={90} castShadow />
      <pointLight position={[-18, -6, -6]} intensity={500} color={PINK} distance={90} />
      <mesh
        position={[R + 5, -R - 1, 6]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          sfx("meow");
          rig.spinVel += 3;
        }}
      >
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

const MAGENTA_CLOUD = "#ff9ad4";
