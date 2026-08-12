import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { damp } from "@/lib/world/constants";
import { rig } from "@/lib/world/store";

const fogColor = new THREE.Color("#07030d");

interface CinematicEffectsProps {
  high: boolean;
}

/** Applies smoothed FOV, fog, lighting, and DOF transitions along the journey. */
export function CinematicEffects({ high }: CinematicEffectsProps) {
  const { camera, scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const dofRef = useRef<{ focusDistance: number; bokehScale: number } | null>(null);

  const smooth = useRef({
    fov: 50,
    fogDensity: 0.012,
    focusDistance: 0.012,
    bokehScale: 3.2,
    ambientIntensity: 0.35,
    dirLightIntensity: 1.6,
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const s = smooth.current;

    s.fov = damp(s.fov, rig.fov, 3.8, dt);
    s.fogDensity = damp(s.fogDensity, rig.fogDensity, 3.8, dt);
    s.focusDistance = damp(s.focusDistance, rig.focusDistance, 4.2, dt);
    s.bokehScale = damp(s.bokehScale, rig.bokehScale, 4.2, dt);
    s.ambientIntensity = damp(s.ambientIntensity, rig.ambientIntensity, 3.5, dt);
    s.dirLightIntensity = damp(s.dirLightIntensity, rig.dirLightIntensity, 3.5, dt);

    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - s.fov) > 0.01) {
      camera.fov = s.fov;
      camera.updateProjectionMatrix();
    }

    if (scene.fog instanceof THREE.FogExp2) {
      fogColor.set(rig.fogColor);
      scene.fog.color.lerp(fogColor, 1 - Math.exp(-4.5 * dt));
      scene.fog.density = s.fogDensity;
    }

    if (ambientRef.current) ambientRef.current.intensity = s.ambientIntensity;
    if (dirRef.current) dirRef.current.intensity = s.dirLightIntensity;

    if (high && dofRef.current) {
      dofRef.current.focusDistance = s.focusDistance;
      dofRef.current.bokehScale = s.bokehScale;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.35} color="#8f7fd8" />
      <directionalLight
        ref={dirRef}
        position={[10, 16, 8]}
        intensity={1.6}
        color="#fff4fb"
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
      />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          intensity={high ? 1.15 : 0.7}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.75}
        />
        {high ? (
          <DepthOfField
            ref={dofRef}
            focusDistance={0.012}
            focalLength={0.06}
            bokehScale={3.2}
          />
        ) : (
          <></>
        )}
        <Noise opacity={0.035} premultiply blendFunction={24 as never} />
        <Vignette eskil={false} offset={0.16} darkness={0.95} />
      </EffectComposer>
    </>
  );
}
