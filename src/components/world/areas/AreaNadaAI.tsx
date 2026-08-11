import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display, HoloButton, Panel } from "../Holo";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK, WHITE } from "@/lib/world/constants";
import { rig, setWorld, useWorld } from "@/lib/world/store";
import { sfx } from "@/lib/world/audio";

const Z = AREA_Z[3]!;

const SCRIPT = [
  "Hello. I have analyzed Abdulaziz.",
  "...",
  "I have concerns.",
  "PROCESSING…",
  "99.9% CHAOTIC  ·  0.1% NORMAL",
  "Would you like to continue?",
];

/** A tiny holographic girl-shaped AI made of glowing geometry. */
function Hologram({ excited }: { excited: number }) {
  const g = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    const e = state.clock.elapsedTime;
    if (g.current) {
      g.current.position.y = 0.2 + Math.sin(e * 1.3) * 0.12 + excited * 0.25;
      g.current.rotation.y = THREE.MathUtils.damp(
        g.current.rotation.y,
        rig.px * 0.5 + Math.sin(e * 0.4) * 0.2 + excited * 6,
        3,
        dt,
      );
    }
    if (head.current) head.current.rotation.z = Math.sin(e * 2.2) * 0.06 * (1 + excited * 4);
  });
  const holo = (
    <meshPhysicalMaterial
      color={CYAN}
      emissive={CYAN}
      emissiveIntensity={1.4}
      transparent
      opacity={0.55}
      metalness={0.4}
      roughness={0.1}
      transmission={0.4}
      thickness={0.4}
    />
  );
  return (
    <group ref={g}>
      <mesh ref={head} position={[0, 1.05, 0]}>
        <icosahedronGeometry args={[0.32, 1]} />
        {holo}
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.42, 0.95, 6]} />
        {holo}
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 32]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1, 0.6]} intensity={12} color={CYAN} distance={12} />
    </group>
  );
}

/** AREA 4 — NADA AI. */
export function AreaNadaAI() {
  const area = useWorld((s) => s.area);
  const answered = useWorld((s) => s.aiAnswered);
  const [line, setLine] = useState(0);
  const [excited, setExcited] = useState(0);

  useEffect(() => {
    if (area !== 3) return;
    setLine(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= SCRIPT.length) {
        clearInterval(id);
        return;
      }
      setLine(i);
      sfx("ai");
    }, 1900);
    return () => clearInterval(id);
  }, [area]);

  useFrame((_, dt) => {
    if (excited > 0) setExcited(Math.max(0, excited - dt * 0.8));
  });

  const answer = () => {
    setWorld({ aiAnswered: true });
    setExcited(1);
    sfx("reveal");
  };

  return (
    <group position={[0, 0, Z]}>
      <group position={[0, -0.9, 0]}>
        <Hologram excited={excited} />
      </group>

      <group position={[0, 2.4, -0.4]}>
        <Panel width={7.2} height={2.2} color={CYAN} opacity={0.06} />
        <Display position={[0, 0.62, 0.05]} size={0.36} color={PINK} letterSpacing={0.24}>
          NADA AI
        </Display>
        <Body position={[0, -0.25, 0.05]} size={0.26} maxWidth={6.4} color={WHITE}>
          {answered ? "Correct answer." : SCRIPT[line]}
        </Body>
      </group>

      {!answered && line >= SCRIPT.length - 1 && (
        <>
          <HoloButton label="YES" size={0.24} width={2} position={[-1.5, -2.6, 1]} onClick={answer} />
          <HoloButton
            label="OBVIOUSLY"
            size={0.24}
            width={3}
            color={CYAN}
            position={[1.7, -2.6, 1]}
            onClick={answer}
          />
        </>
      )}

      {/* projector pedestal */}
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 32]} />
        <meshStandardMaterial color="#191020" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, -1.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.4, 48]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      <Dust count={260} radius={22} color="#bff3ff" size={0.1} />
      <pointLight position={[2, 2, 3]} intensity={25} color={PINK} distance={26} />
    </group>
  );
}
