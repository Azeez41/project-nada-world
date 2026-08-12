import * as THREE from "three";

export const FONT_DISPLAY =
  "https://fonts.gstatic.com/s/orbitron/v35/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nymymxpQ.woff";
export const FONT_BODY =
  "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUUsg.woff";

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

/** Subtle ease at journey start/end — keeps mid-scroll linear for control. */
export function cinematicScrollEase(s: number) {
  const t = clamp01(s);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const softStart = THREE.MathUtils.smoothstep(t, 0, 0.06);
  const softEnd = 1 - THREE.MathUtils.smoothstep(t, 0.94, 1);
  const edge = softStart * softEnd;
  return t * (0.92 + 0.08 * edge);
}

/** Arc-length table so equal scroll progress ≈ equal distance traveled. */
const ARC_SAMPLES = 256;
const arcUs: number[] = [];
const arcLens: number[] = [];
let arcTotal = 0;

(() => {
  let prev = CAM_CURVE.getPointAt(0);
  arcUs.push(0);
  arcLens.push(0);
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const u = i / ARC_SAMPLES;
    const p = CAM_CURVE.getPointAt(u);
    arcTotal += p.distanceTo(prev);
    arcUs.push(u);
    arcLens.push(arcTotal);
    prev = p;
  }
})();

function tClosestToZ(z: number) {
  let bestT = 0;
  let best = Infinity;
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const u = i / ARC_SAMPLES;
    const d = Math.abs(CAM_CURVE.getPointAt(u).z - z);
    if (d < best) {
      best = d;
      bestT = u;
    }
  }
  return bestT;
}

/** Approximate curve-t anchor for each narrative area (used for atmosphere blending). */
export const AREA_T = AREA_Z.map((z) => tClosestToZ(z));

/** Per-area scroll speed multipliers (>1 = faster fly-through for same scroll distance). */
export const AREA_SPEED = [0.72, 1.0, 1.6, 0.82, 1.05, 1.7, 0.65] as const;

/** Scroll breakpoints (0..1) and matching path anchors for piecewise speed warping. */
const scrollBreaks: number[] = [0];
/** Full path coverage: intro starts at 0, finale ends at 1 (not AREA_T[0]..1). */
const pathAnchors: number[] = [0, ...AREA_T.slice(1), 1];

(() => {
  const weights = AREA_T.map((_, i) => {
    const p0 = AREA_T[i]!;
    const p1 = i < AREA_T.length - 1 ? AREA_T[i + 1]! : 1;
    return (p1 - p0) / AREA_SPEED[i]!;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (const w of weights) {
    acc += w / sum;
    scrollBreaks.push(acc);
  }
  scrollBreaks[scrollBreaks.length - 1] = 1;
})();

/** Map scroll progress to path progress with area-specific pacing. */
export function pathProgressFromScroll(s: number) {
  const t = cinematicScrollEase(clamp01(s));
  let i = 0;
  while (i < scrollBreaks.length - 2 && t >= scrollBreaks[i + 1]!) i++;

  const s0 = scrollBreaks[i]!;
  const s1 = scrollBreaks[i + 1]!;
  const p0 = pathAnchors[i]!;
  const p1 = pathAnchors[i + 1] ?? 1;
  const local = s1 > s0 ? (t - s0) / (s1 - s0) : 0;
  const eased = local * local * (3 - 2 * local);
  return p0 + (p1 - p0) * eased;
}

/** Map normalized scroll progress (0..1) to curve parameter t with near-constant speed. */
export function camTFromScroll(s: number) {
  // Speed warp outputs curve-t directly; arc-length remap was double-distorting travel.
  return clamp01(pathProgressFromScroll(s));
}

export interface AtmosphereProfile {
  fogColor: string;
  fogDensity: number;
  fov: number;
  focusDistance: number;
  bokehScale: number;
  ambientIntensity: number;
  dirLightIntensity: number;
}

/** Per-area mood: fog, FOV, DOF, and light — blended continuously along the path. */
export const AREA_ATMOSPHERE: AtmosphereProfile[] = [
  {
    fogColor: "#07030d",
    fogDensity: 0.011,
    fov: 52,
    focusDistance: 0.011,
    bokehScale: 2.6,
    ambientIntensity: 0.35,
    dirLightIntensity: 1.55,
  },
  {
    fogColor: "#0a0514",
    fogDensity: 0.013,
    fov: 50,
    focusDistance: 0.012,
    bokehScale: 2.8,
    ambientIntensity: 0.32,
    dirLightIntensity: 1.5,
  },
  {
    fogColor: "#08041a",
    fogDensity: 0.016,
    fov: 56,
    focusDistance: 0.014,
    bokehScale: 3.0,
    ambientIntensity: 0.28,
    dirLightIntensity: 1.45,
  },
  {
    fogColor: "#0c0618",
    fogDensity: 0.014,
    fov: 48,
    focusDistance: 0.013,
    bokehScale: 3.1,
    ambientIntensity: 0.34,
    dirLightIntensity: 1.5,
  },
  {
    fogColor: "#050312",
    fogDensity: 0.009,
    fov: 54,
    focusDistance: 0.01,
    bokehScale: 2.4,
    ambientIntensity: 0.38,
    dirLightIntensity: 1.65,
  },
  {
    fogColor: "#140818",
    fogDensity: 0.019,
    fov: 58,
    focusDistance: 0.016,
    bokehScale: 3.6,
    ambientIntensity: 0.3,
    dirLightIntensity: 1.7,
  },
  {
    fogColor: "#04020a",
    fogDensity: 0.007,
    fov: 44,
    focusDistance: 0.009,
    bokehScale: 3.4,
    ambientIntensity: 0.4,
    dirLightIntensity: 1.4,
  },
];

const atmScratch = {
  fogColor: new THREE.Color(),
  fogDensity: 0.012,
  fov: 50,
  focusDistance: 0.012,
  bokehScale: 3.2,
  ambientIntensity: 0.35,
  dirLightIntensity: 1.6,
};

function lerpNum(a: number, b: number, w: number) {
  return a + (b - a) * w;
}

/** Blend atmosphere profiles along the camera path for seamless area transitions. */
export function sampleAtmosphere(pathT: number): AtmosphereProfile {
  const t = clamp01(pathT);
  let lower = 0;
  for (let i = 1; i < AREA_T.length; i++) {
    if (t >= (AREA_T[i - 1]! + AREA_T[i]!) * 0.5) lower = i;
  }
  const upper = Math.min(lower + 1, AREA_ATMOSPHERE.length - 1);
  const t0 = AREA_T[lower] ?? 0;
  const t1 = AREA_T[upper] ?? 1;
  const span = Math.max(0.001, t1 - t0);
  const w = THREE.MathUtils.smoothstep(t, t0, t0 + span);
  const a = AREA_ATMOSPHERE[lower]!;
  const b = AREA_ATMOSPHERE[upper]!;

  atmScratch.fogColor.set(a.fogColor).lerp(new THREE.Color(b.fogColor), w);
  atmScratch.fogDensity = lerpNum(a.fogDensity, b.fogDensity, w);
  atmScratch.fov = lerpNum(a.fov, b.fov, w);
  atmScratch.focusDistance = lerpNum(a.focusDistance, b.focusDistance, w);
  atmScratch.bokehScale = lerpNum(a.bokehScale, b.bokehScale, w);
  atmScratch.ambientIntensity = lerpNum(a.ambientIntensity, b.ambientIntensity, w);
  atmScratch.dirLightIntensity = lerpNum(a.dirLightIntensity, b.dirLightIntensity, w);

  return {
    fogColor: `#${atmScratch.fogColor.getHexString()}`,
    fogDensity: atmScratch.fogDensity,
    fov: atmScratch.fov,
    focusDistance: atmScratch.focusDistance,
    bokehScale: atmScratch.bokehScale,
    ambientIntensity: atmScratch.ambientIntensity,
    dirLightIntensity: atmScratch.dirLightIntensity,
  };
}
