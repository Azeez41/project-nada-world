import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display, HoloButton } from "../Holo";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK, WHITE } from "@/lib/world/constants";
import { getWorld, setWorld, useWorld } from "@/lib/world/store";
import { sfx } from "@/lib/world/audio";

const Z = AREA_Z[6]!;

const LINES = [
  "Nada,",
  "I know this website is ridiculously unnecessary.",
  "But that’s kind of the point.",
  "I wanted to make you something that feels like us.",
  "Beautiful, chaotic, slightly stupid…",
  "…but somehow still my favorite thing.",
  "Thank you for being you.",
];

function Line({ text, index, shown }: { text: string; index: number; shown: number }) {
  const [o, setO] = useState(0);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const target = index < shown ? 1 : 0;
    const next = THREE.MathUtils.damp(o, target, 2.5, dt);
    if (Math.abs(next - o) > 0.004) setO(next);
    if (g.current) g.current.position.z = (1 - next) * -1.4;
  });
  if (o < 0.01) return null;
  return (
    <group ref={g} position={[0, 2.4 - index * 0.72, 0]}>
      <Body size={index === 0 ? 0.46 : 0.32} opacity={o} maxWidth={11} color={index === 0 ? PINK : WHITE}>
        {text}
      </Body>
    </group>
  );
}

/** AREA 7 — The actual message. */
export function AreaFinale() {
  const area = useWorld((s) => s.area);
  const [shown, setShown] = useState(0);
  const stars = useRef<THREE.Points>(null);

  useEffect(() => {
    if (area !== 6) return;
    let i = 0;
    setShown(1);
    const id = setInterval(() => {
      i += 1;
      if (i > LINES.length) {
        clearInterval(id);
        return;
      }
      setShown(i + 1);
      sfx("hover");
    }, 2200);
    return () => clearInterval(id);
  }, [area]);

  useFrame((state) => {
    if (stars.current) stars.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <group position={[0, 0, Z]}>
      {LINES.map((l, i) => (
        <Line key={i} text={l} index={i} shown={shown} />
      ))}

      {shown > LINES.length && (
        <HoloButton
          label="ONE LAST THING"
          size={0.26}
          position={[0, -3.6, 1]}
          onClick={() => {
            if (getWorld().phase !== "gift") {
              setWorld({ phase: "gift" });
              sfx("whoosh");
            }
          }}
        />
      )}

      {/* glass platform */}
      <mesh position={[0, -2.6, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.4, 0.28, 64]} />
        <meshPhysicalMaterial
          color="#0e0a18"
          metalness={0.2}
          roughness={0.03}
          transmission={0.85}
          thickness={2.4}
          transparent
          opacity={0.85}
          iridescence={1}
        />
      </mesh>
      <mesh position={[0, -2.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.4, 6, 64]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      <Display position={[0, -5.4, 0]} size={0.18} color="#4b4360" letterSpacing={0.5}>
        SIMULATION STABLE
      </Display>

      <Dust count={700} radius={60} color="#ffffff" size={0.075} speed={0.4} />
      <pointLight position={[0, 4, 6]} intensity={45} color={WHITE} distance={40} />
      <pointLight position={[-6, -2, 4]} intensity={30} color={CYAN} distance={40} />
    </group>
  );
}
