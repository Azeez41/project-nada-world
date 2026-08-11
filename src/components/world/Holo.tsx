import { useRef, useState, type ReactNode } from "react";
import { Text } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { CYAN, FONT_BODY, FONT_DISPLAY, PINK, WHITE } from "@/lib/world/constants";
import { sfx } from "@/lib/world/audio";

export function Display(props: {
  children: ReactNode;
  position?: [number, number, number];
  size?: number;
  color?: string;
  opacity?: number;
  maxWidth?: number;
  anchorX?: "center" | "left" | "right";
  letterSpacing?: number;
}) {
  const {
    children,
    position = [0, 0, 0],
    size = 1,
    color = WHITE,
    opacity = 1,
    maxWidth = 22,
    anchorX = "center",
    letterSpacing = 0.02,
  } = props;
  return (
    <Text
      font={FONT_DISPLAY}
      position={position}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY="middle"
      maxWidth={maxWidth}
      letterSpacing={letterSpacing}
      textAlign={anchorX === "left" ? "left" : "center"}
      fillOpacity={opacity}
      outlineWidth={size * 0.012}
      outlineColor={PINK}
      outlineOpacity={opacity * 0.5}
    >
      {children}
    </Text>
  );
}

export function Body(props: {
  children: ReactNode;
  position?: [number, number, number];
  size?: number;
  color?: string;
  opacity?: number;
  maxWidth?: number;
  anchorX?: "center" | "left" | "right";
}) {
  const {
    children,
    position = [0, 0, 0],
    size = 0.32,
    color = "#cfc7e6",
    opacity = 1,
    maxWidth = 16,
    anchorX = "center",
  } = props;
  return (
    <Text
      font={FONT_BODY}
      position={position}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY="middle"
      maxWidth={maxWidth}
      lineHeight={1.45}
      textAlign={anchorX === "left" ? "left" : "center"}
      fillOpacity={opacity}
    >
      {children}
    </Text>
  );
}

/** A glassy holographic panel. */
export function Panel({
  width = 4,
  height = 2.4,
  color = PINK,
  opacity = 0.12,
}: {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#120a1c"
          transparent
          opacity={0.55}
          roughness={0.08}
          metalness={0.2}
          transmission={0.55}
          thickness={0.6}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <lineSegments position={[0, 0, 0.02]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={color} transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
}

/** A 3D button you can actually click in world space. */
export function HoloButton({
  label,
  position = [0, 0, 0],
  onClick,
  width,
  size = 0.3,
  color = PINK,
  rotation = [0, 0, 0],
}: {
  label: string;
  position?: [number, number, number];
  onClick: () => void;
  width?: number;
  size?: number;
  color?: string;
  rotation?: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(0);
  const w = width ?? Math.max(2.4, label.length * size * 0.85 + 1.2);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const target = (hovered ? 1.07 : 1) * (1 - pressed * 0.08);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 8, dt));
    g.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.4) * 0.05;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        sfx("hover");
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setPressed(1);
        setTimeout(() => setPressed(0), 140);
        sfx("click");
        onClick();
      }}
    >
      <mesh>
        <planeGeometry args={[w, size * 2.6]} />
        <meshBasicMaterial
          color={hovered ? color : "#1a0f24"}
          transparent
          opacity={hovered ? 0.35 : 0.5}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(w, size * 2.6)]} />
        <lineBasicMaterial color={hovered ? WHITE : color} />
      </lineSegments>
      <Text
        font={FONT_DISPLAY}
        fontSize={size}
        position={[0, 0, 0.02]}
        color={hovered ? WHITE : CYAN}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.16}
      >
        {label}
      </Text>
    </group>
  );
}
