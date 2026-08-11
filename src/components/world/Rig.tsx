import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAM_CURVE, LOOK_CURVE, GIFT_Z, clamp01 } from "@/lib/world/constants";
import { getWorld, rig, setWorld } from "@/lib/world/store";

const tmp = new THREE.Vector3();
const look = new THREE.Vector3();
const giftCam = new THREE.Vector3(0, 6, GIFT_Z + 96);
const giftLook = new THREE.Vector3(0, 2, GIFT_Z);

/** Drives the cinematic camera from scroll, pointer, gift mode and shake. */
export function Rig() {
  const { camera } = useThree();
  const areaRef = useRef(-1);
  const acc = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const world = getWorld();

    // eased scroll + pointer
    rig.t = THREE.MathUtils.damp(rig.t, rig.target, 2.6, dt);
    rig.px = THREE.MathUtils.damp(rig.px, rig.pxTarget, 3.2, dt);
    rig.py = THREE.MathUtils.damp(rig.py, rig.pyTarget, 3.2, dt);
    rig.spinVel *= 1 - Math.min(1, dt * 1.6);
    rig.spin += rig.spinVel * dt;

    const t = clamp01(rig.t);
    CAM_CURVE.getPointAt(t, tmp);
    LOOK_CURVE.getPointAt(t, look);

    // gift finale: pull back into the box scene
    const giftTarget = world.phase === "gift" ? 1 : 0;
    rig.gift = THREE.MathUtils.damp(rig.gift, giftTarget, 0.9, dt);
    if (rig.gift > 0.001) {
      const g = THREE.MathUtils.smoothstep(rig.gift, 0, 1);
      tmp.lerp(giftCam, g);
      look.lerp(giftLook, g);
    }

    // breathing drift so the camera always has a reason to move
    const e = state.clock.elapsedTime;
    tmp.x += Math.sin(e * 0.21) * 0.35 + rig.px * 2.2;
    tmp.y += Math.cos(e * 0.17) * 0.22 + rig.py * 1.3;

    // shake impulses
    if (rig.shake > 0.001) {
      rig.shake = Math.max(0, rig.shake - dt * 2.2);
      const s = rig.shake * rig.shake;
      tmp.x += (Math.random() - 0.5) * s * 1.6;
      tmp.y += (Math.random() - 0.5) * s * 1.6;
    }

    camera.position.lerp(tmp, 1 - Math.exp(-6 * dt));
    look.x += rig.px * 0.9;
    look.y -= rig.py * 0.5;
    camera.lookAt(look);
    camera.rotation.z += Math.sin(e * 0.13) * 0.006;

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
