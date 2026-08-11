import { Suspense } from "react";
import { Environment, Lightformer, AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Rig } from "./Rig";
import { CinematicEffects } from "./CinematicEffects";
import { AreaIntro } from "./areas/AreaIntro";
import { AreaDatabase } from "./areas/AreaDatabase";
import { AreaTunnel } from "./areas/AreaTunnel";
import { AreaNadaAI } from "./areas/AreaNadaAI";
import { AreaPlanet } from "./areas/AreaPlanet";
import { AreaChaos } from "./areas/AreaChaos";
import { AreaFinale } from "./areas/AreaFinale";
import { GiftScene } from "./GiftScene";
import { CYAN, PINK } from "@/lib/world/constants";
import { useWorld } from "@/lib/world/store";

/** Areas mount only when the camera is nearby. */
function Areas() {
  const area = useWorld((s) => s.area);
  const near = (i: number) => Math.abs(area - i) <= 1;
  return (
    <>
      {near(0) && <AreaIntro />}
      {near(1) && <AreaDatabase />}
      {(near(2) || area === 2) && <AreaTunnel />}
      {near(3) && <AreaNadaAI />}
      {near(4) && <AreaPlanet />}
      {near(5) && <AreaChaos />}
      {near(6) && <AreaFinale />}
    </>
  );
}

export function Scene() {
  const quality = useWorld((s) => s.quality);
  const high = quality === "high";

  return (
    <>
      <color attach="background" args={["#05030a"]} />
      <fogExp2 attach="fog" args={["#07030d", 0.012]} />

      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2.4} color={PINK} position={[0, 6, -8]} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} color={CYAN} position={[-8, -2, 4]} scale={[8, 8, 1]} />
        <Lightformer form="circle" intensity={2} color="#ffffff" position={[6, 8, 6]} scale={[6, 6, 1]} />
      </Environment>

      <Rig />
      <Suspense fallback={null}>
        <Areas />
        <GiftScene />
        <Preload all />
      </Suspense>

      <CinematicEffects high={high} />

      <AdaptiveDpr pixelated={false} />
    </>
  );
}

export const TONE = THREE.ACESFilmicToneMapping;
