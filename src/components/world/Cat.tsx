import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { PINK } from "@/lib/world/constants";
import { sfx } from "@/lib/world/audio";
import { flash } from "@/lib/world/store";

interface CatProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  /** looks at the camera instead of wandering */
  watcher?: boolean;
  clickable?: boolean;
  wobble?: number;
}

/** A tiny low-poly holographic cat, built from primitives. */
export function Cat({
  position = [0, 0, 0],
  scale = 1,
  color = PINK,
  watcher = false,
  clickable = false,
  wobble = 1,
}: CatProps) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const clicks = useRef(0);
  const angry = useRef(0);
  const seed = useRef(Math.random() * 10);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime + seed.current;
    const g = group.current;
    if (!g) return;
    g.position.y = position[1] + Math.sin(t * 1.6) * 0.08 * wobble;
    if (angry.current > 0) {
      angry.current -= dt;
      g.position.x += dt * 6;
      g.position.y += dt * 1.4;
      g.rotation.z = Math.sin(t * 40) * 0.2;
      g.scale.setScalar(scale * Math.max(0, angry.current / 1.2));
    } else if (watcher && head.current) {
      head.current.lookAt(state.camera.position);
    } else {
      g.rotation.y = Math.sin(t * 0.5) * 0.6;
    }
    if (tail.current) tail.current.rotation.z = Math.sin(t * 4) * 0.5 + 0.6;
  });

  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.9}
      metalness={0.6}
      roughness={0.25}
    />
  );

  return (
    <group
      ref={group}
      position={position}
      scale={scale}
      {...(clickable
        ? {
            onClick: (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              clicks.current += 1;
              sfx("meow");
              if (clicks.current >= 3) {
                angry.current = 1.2;
                flash("The cat is offended. It has left.");
              }
            },
          }
        : {})}
    >
      {/* body */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <capsuleGeometry args={[0.22, 0.34, 4, 12]} />
        {mat}
      </mesh>
      <group ref={head} position={[0, 0.72, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 20, 16]} />
          {mat}
        </mesh>
        <mesh position={[-0.14, 0.2, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.09, 0.2, 4]} />
          {mat}
        </mesh>
        <mesh position={[0.14, 0.2, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.09, 0.2, 4]} />
          {mat}
        </mesh>
        <mesh position={[-0.09, 0.03, 0.21]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.09, 0.03, 0.21]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh ref={tail} position={[0, 0.3, -0.24]}>
        <capsuleGeometry args={[0.045, 0.42, 3, 8]} />
        {mat}
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
