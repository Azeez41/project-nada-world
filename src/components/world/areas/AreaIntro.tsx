import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Body, Display, HoloButton } from "../Holo";
import { Cat } from "../Cat";
import { Dust } from "../Particles";
import { AREA_Z, CYAN, PINK } from "@/lib/world/constants";
import { getWorld, kick, rig, setWorld } from "@/lib/world/store";
import { sfx } from "@/lib/world/audio";

/** AREA 1 — Welcome to the problem. */
export function AreaIntro() {
  const title = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    const e = state.clock.elapsedTime;
    if (title.current) {
      title.current.rotation.y = THREE.MathUtils.damp(
        title.current.rotation.y,
        rig.px * 0.25,
        3,
        dt,
      );
      title.current.position.y = 1.9 + Math.sin(e * 0.7) * 0.08;
    }
    if (ring.current) {
      ring.current.rotation.z = e * 0.4;
      ring.current.rotation.x = Math.PI / 2 + Math.sin(e * 0.5) * 0.25;
    }
  });

  return (
    <group position={[0, 0, AREA_Z[0]!]}>
      <group ref={title} position={[0, 1.9, 0]}>
        <Display size={2.6} letterSpacing={0.06}>
          NADA.
        </Display>
        <Body position={[0, -1.5, 0]} size={0.34} color={CYAN}>
          Unfortunately, you have been selected.
        </Body>
      </group>

      {/* the tiny object that greets you */}
      <mesh ref={ring} position={[0, 0.2, 2]}>
        <torusGeometry args={[0.9, 0.03, 12, 64]} />
        <meshBasicMaterial color={PINK} />
      </mesh>

      <group position={[0.1, -1.6, 2.4]}>
        <Cat scale={1.5} watcher clickable color={CYAN} />
      </group>

      <Body position={[0, -2.9, 2.4]} size={0.26}>
        “Don’t worry. This is completely normal.”
      </Body>

      <HoloButton
        label="ENTER THE SIMULATION"
        size={0.26}
        position={[0, -4.1, 2.4]}
        onClick={() => {
          if (getWorld().phase === "boot") {
            setWorld({ phase: "world" });
            sfx("reveal");
            kick(0.7);
          }
        }}
      />

      {/* reflective ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.2, 0]} receiveShadow>
        <circleGeometry args={[70, 64]} />
        <meshStandardMaterial color="#0a0610" metalness={0.95} roughness={0.22} />
      </mesh>
      <gridHelper args={[140, 70, PINK, "#2a1236"]} position={[0, -5.18, 0]} />

      <Dust count={340} radius={34} center={[0, 0, 0]} />
      <pointLight position={[3, 3, 6]} intensity={40} color={PINK} distance={40} />
      <pointLight position={[-5, 2, -4]} intensity={30} color={CYAN} distance={40} />
    </group>
  );
}
