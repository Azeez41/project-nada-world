import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display } from "./Holo";
import { Cat } from "./Cat";
import { CYAN, GIFT_Z, PINK, WHITE } from "@/lib/world/constants";
import { rig, useWorld } from "@/lib/world/store";

/** The reveal: the whole world was sitting inside a gift box. */
export function GiftScene() {
  const phase = useWorld((s) => s.phase);
  const lid = useRef<THREE.Group>(null);
  const burst = useRef<THREE.Points>(null);
  const text = useRef<THREE.Group>(null);

  const { positions, vels } = useMemo(() => {
    const n = 900;
    const positions = new Float32Array(n * 3);
    const vels = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const a = Math.random() * Math.PI * 2;
      const s = 3 + Math.random() * 14;
      vels[i * 3] = Math.cos(a) * s * 0.5;
      vels[i * 3 + 1] = 6 + Math.random() * 16;
      vels[i * 3 + 2] = Math.sin(a) * s * 0.5;
    }
    return { positions, vels };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const open = THREE.MathUtils.smoothstep(rig.gift, 0.35, 1);
    if (lid.current) {
      lid.current.position.y = 11 + open * 16;
      lid.current.rotation.z = open * 0.5;
      lid.current.rotation.x = open * 0.22;
    }
    if (burst.current) {
      const arr = burst.current.geometry.attributes['position']!.array as Float32Array;
      if (open > 0.05) {
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3] = arr[i * 3]! + vels[i * 3]! * dt * 0.4;
          arr[i * 3 + 1] = arr[i * 3 + 1]! + (vels[i * 3 + 1]! - 6) * dt * 0.4;
          arr[i * 3 + 2] = arr[i * 3 + 2]! + vels[i * 3 + 2]! * dt * 0.4;
          if (arr[i * 3 + 1]! > 40) arr[i * 3 + 1] = 0;
        }
        burst.current.geometry.attributes['position']!.needsUpdate = true;
      }
      (burst.current.material as THREE.PointsMaterial).opacity = open;
    }
    if (text.current) {
      text.current.position.y = 26 + Math.sin(state.clock.elapsedTime * 0.8) * 0.4;
      text.current.scale.setScalar(THREE.MathUtils.damp(text.current.scale.x, open > 0.6 ? 1 : 0.001, 3, dt));
    }
  });

  if (phase !== "gift" && rig.gift < 0.001) return null;

  return (
    <group position={[0, -12, GIFT_Z]}>
      {/* box base */}
      <mesh position={[0, 5, 0]} receiveShadow castShadow>
        <boxGeometry args={[22, 11, 22]} />
        <meshPhysicalMaterial
          color="#1b0f26"
          metalness={0.9}
          roughness={0.12}
          clearcoat={1}
          emissive={PINK}
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* ribbon */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[3.2, 11.2, 22.2]} />
        <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.7} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* the little world inside */}
      <group position={[0, 8, 0]}>
        <mesh>
          <icosahedronGeometry args={[4.2, 1]} />
          <meshStandardMaterial
            color="#2a1030"
            emissive={CYAN}
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.25}
            wireframe
          />
        </mesh>
        <pointLight intensity={220} color={PINK} distance={60} />
      </group>

      <group ref={lid} position={[0, 11, 0]}>
        <mesh castShadow>
          <boxGeometry args={[23.4, 2.6, 23.4]} />
          <meshPhysicalMaterial color="#26122f" metalness={0.9} roughness={0.1} clearcoat={1} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <torusKnotGeometry args={[1.5, 0.4, 80, 12]} />
          <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      <points ref={burst} position={[0, 11, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.28}
          color="#ffd9f0"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* escaping cats */}
      {[
        [-6, 13, 4],
        [5, 15, -3],
        [0, 18, 6],
        [8, 12, 2],
      ].map((p, i) => (
        <FlyingCat key={i} position={p as [number, number, number]} delay={i * 0.4} />
      ))}

      <group ref={text} position={[0, 26, 6]} scale={0.001}>
        <Display size={2.1} color={WHITE} letterSpacing={0.08}>
          YOU’RE STUCK WITH ME.
        </Display>
        <Body position={[0, -1.9, 0]} size={0.5} color={CYAN}>
          Sorry. No refunds.
        </Body>
      </group>

      <pointLight position={[16, 24, 18]} intensity={1400} color={WHITE} distance={140} />
      <pointLight position={[-20, 10, -10]} intensity={900} color={PINK} distance={140} />
    </group>
  );
}

function FlyingCat({ position, delay }: { position: [number, number, number]; delay: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = Math.max(0, (state.clock.elapsedTime - delay) % 6);
    const open = THREE.MathUtils.smoothstep(rig.gift, 0.4, 1);
    if (!g.current) return;
    g.current.position.y = position[1] + t * 2.4 * open;
    g.current.rotation.z = t * 1.2;
    g.current.visible = open > 0.1;
  });
  return (
    <group ref={g} position={position}>
      <Cat scale={1.6} color={CYAN} wobble={0} />
    </group>
  );
}
