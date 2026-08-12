import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  AREA_Z,
  AREA_SPEED,
  CAM_CURVE,
  LOOK_CURVE,
  GIFT_Z,
  camTFromScroll,
  clamp01,
  sampleAtmosphere,
} from "@/lib/world/constants";
import { getWorld, rig, setWorld } from "@/lib/world/store";

const tmp = new THREE.Vector3();
const look = new THREE.Vector3();
const lookSmooth = new THREE.Vector3();
const tangent = new THREE.Vector3();
const nextTangent = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const right = new THREE.Vector3();
const giftCam = new THREE.Vector3(0, 6, GIFT_Z + 96);
const giftLook = new THREE.Vector3(0, 2, GIFT_Z);
const turnDelta = new THREE.Vector3();

/** Drives the cinematic camera from scroll, pointer, gift mode and shake. */
export function Rig() {
  const { camera } = useThree();
  const areaRef = useRef(-1);
  const acc = useRef(0);
  const posSmooth = useRef(new THREE.Vector3().copy(camera.position));
  const lookInit = useRef(false);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const world = getWorld();

    // scroll velocity + cinematic momentum (lead when scrolling fast, settle when stopped)
    rig.scrollVel = THREE.MathUtils.damp(rig.scrollVel, rig.scrollVelRaw, 7.5, dt);
    const zoneSpeed = AREA_SPEED[world.area] ?? 1;
    const leadTarget = THREE.MathUtils.clamp(
      rig.scrollVel * (0.11 + zoneSpeed * 0.035),
      -0.055,
      0.055,
    );
    rig.momentumLead = THREE.MathUtils.damp(rig.momentumLead, leadTarget, 4.5, dt);
    const scrollGoal = clamp01(rig.scrollTarget + rig.momentumLead);
    const scrollLambda = 1.55 + zoneSpeed * 0.32;
    rig.t = THREE.MathUtils.damp(rig.t, scrollGoal, scrollLambda, dt);

    // pointer / gyro parallax with separate axis smoothing
    rig.px = THREE.MathUtils.damp(rig.px, rig.pxTarget, 3.6, dt);
    rig.py = THREE.MathUtils.damp(rig.py, rig.pyTarget, 3.6, dt);
    rig.spinVel *= 1 - Math.min(1, dt * 1.6);
    rig.spin += rig.spinVel * dt;

    const pathT = camTFromScroll(rig.t);
    rig.pathT = pathT;

    CAM_CURVE.getPointAt(pathT, tmp);
    LOOK_CURVE.getPointAt(pathT, look);
    if (!lookInit.current) {
      lookSmooth.copy(look);
      posSmooth.current.copy(tmp);
      lookInit.current = true;
    }

    // gift finale: pull back into the box scene
    const giftTarget = world.phase === "gift" ? 1 : 0;
    rig.gift = THREE.MathUtils.damp(rig.gift, giftTarget, 0.9, dt);
    if (rig.gift > 0.001) {
      const g = THREE.MathUtils.smoothstep(rig.gift, 0, 1);
      tmp.lerp(giftCam, g);
      look.lerp(giftLook, g);
    }

    // path banking — roll into turns for a physically traveling feel
    CAM_CURVE.getTangentAt(pathT, tangent);
    CAM_CURVE.getTangentAt(clamp01(pathT + 0.012), nextTangent);
    right.crossVectors(up, tangent).normalize();
    turnDelta.subVectors(nextTangent, tangent);
    const turn = right.dot(turnDelta);
    const pathRoll = THREE.MathUtils.clamp(turn * 14, -0.14, 0.14);
    const pointerRoll = rig.px * 0.028;
    const targetRoll = pathRoll + pointerRoll;
    rig.roll = THREE.MathUtils.damp(rig.roll, targetRoll, 3.8, dt);

    // breathing drift + parallax offset (stronger in open areas, softer in tunnel)
    const e = state.clock.elapsedTime;
    const open =
      THREE.MathUtils.smoothstep(pathT, 0.08, 0.22) *
      (1 - THREE.MathUtils.smoothstep(pathT, 0.55, 0.72));
    const parallax = 1.15 + open * 0.55;
    tmp.x += Math.sin(e * 0.21) * 0.32 + rig.px * 2.0 * parallax;
    tmp.y += Math.cos(e * 0.17) * 0.2 + rig.py * 1.15 * parallax;
    tmp.z += rig.px * 0.35 * parallax;

    // GSAP dialogue beats — subtle dolly / tilt while NADA AI speaks
    if (rig.dialoguePulse > 0.001) {
      tmp.z += rig.dialoguePulse * 1.8;
      tmp.y += rig.dialoguePulse * 0.15;
      look.z -= rig.dialoguePulse * 0.35;
    }

    // coherent shake — only when kicked (dramatic moments), not random every frame
    if (rig.shake > 0.001) {
      rig.shake = Math.max(0, rig.shake - dt * 2.4);
      const s = rig.shake * rig.shake;
      const freq = 26;
      tmp.x += Math.sin(e * freq + rig.shakePhase) * s * 0.75;
      tmp.y += Math.cos(e * freq * 1.17 + rig.shakePhase * 1.3) * s * 0.65;
      tmp.z += Math.sin(e * freq * 0.8 + rig.shakePhase) * s * 0.25;
    }

    // double-stage smoothing: heavy mass on position, softer on look target
    posSmooth.current.lerp(tmp, 1 - Math.exp(-5.2 * dt));
    lookSmooth.lerp(look, 1 - Math.exp(-6.5 * dt));

    const lookX = lookSmooth.x + rig.px * 0.85;
    const lookY = lookSmooth.y - rig.py * 0.55;
    const lookZ = lookSmooth.z + rig.py * 0.12;

    camera.position.copy(posSmooth.current);
    camera.lookAt(lookX, lookY, lookZ);
    camera.rotation.z = rig.roll + rig.dialogueRoll + Math.sin(e * 0.13) * 0.004;

    // publish atmosphere targets for CinematicEffects (smoothed there)
    const atm = sampleAtmosphere(pathT);
    rig.fov = atm.fov + rig.dialogueFov * 2.5;
    rig.fogDensity = atm.fogDensity;
    rig.fogColor = atm.fogColor;
    rig.focusDistance = atm.focusDistance;
    rig.bokehScale = atm.bokehScale;
    rig.ambientIntensity = atm.ambientIntensity;
    rig.dirLightIntensity = atm.dirLightIntensity;

    // publish the active area (throttled) so heavy zones can unmount
    acc.current += dt;
    if (acc.current > 0.15) {
      acc.current = 0;
      let area = 0;
      let best = Infinity;
      AREA_Z.forEach((z, i) => {
        const d = Math.abs(camera.position.z - z);
        if (d < best) {
          best = d;
          area = i;
        }
      });
      if (area !== areaRef.current) {
        areaRef.current = area;
        setWorld({ area });
      }
    }
  });

  return null;
}
