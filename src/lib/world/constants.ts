import * as THREE from "three";

export const FONT_DISPLAY = "https://fonts.gstatic.com/s/orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2";
export const FONT_BODY = "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPb54C-s0.woff2";

export const PINK = "#ff3d9e";
export const MAGENTA = "#ff7ac6";
export const CYAN = "#7fe6ff";
export const WHITE = "#f6f2ff";

/** z anchor of each area of the world */
export const AREA_Z = [0, -100, -220, -340, -450, -560, -680];
export const GIFT_Z = -900;

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const CAM_CURVE = new THREE.CatmullRomCurve3(
  [
    P(0, 0.6, 20),
    P(0.6, 0.4, 8),
    P(2.5, 2.2, -82),
    P(0, 0.2, -150),
    P(0, 0, -238),
    P(3.2, 1.0, -320),
    P(0, 5.5, -418),
    P(-7, 2.2, -472),
    P(0, 0.4, -538),
    P(0, 1.2, -652),
    P(0, 1.2, -668),
  ],
  false,
  "catmullrom",
  0.35,
);

export const LOOK_CURVE = new THREE.CatmullRomCurve3(
  [
    P(0, 0.8, 0),
    P(0, 0.9, -2),
    P(0, 1.2, -100),
    P(0, 0, -205),
    P(0, 0, -300),
    P(0, 0.6, -340),
    P(0, 0, -450),
    P(0, 0, -450),
    P(0, 0, -572),
    P(0, 1.2, -681),
    P(0, 1.2, -682),
  ],
  false,
  "catmullrom",
  0.35,
);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.damp(current, target, lambda, dt);

/** 0 outside [a,b], 1 in the middle, smooth edges */
export function window01(t: number, a: number, b: number, fade = 0.06) {
  const inA = THREE.MathUtils.smoothstep(t, a - fade, a + fade);
  const outB = 1 - THREE.MathUtils.smoothstep(t, b - fade, b + fade);
  return clamp01(Math.min(inA, outB));
}
