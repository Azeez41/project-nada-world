import { useSyncExternalStore } from "react";

export type Phase = "boot" | "world" | "gift";

export interface WorldState {
  phase: Phase;
  soundOn: boolean;
  area: number;
  aiAnswered: boolean;
  catAnger: number;
  toast: string | null;
  quality: "high" | "low";
}

let state: WorldState = {
  phase: "boot",
  soundOn: false,
  area: 0,
  aiAnswered: false,
  catAnger: 0,
  toast: null,
  quality: "high",
};

const listeners = new Set<() => void>();

export const getWorld = () => state;

export function setWorld(patch: Partial<WorldState>) {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof WorldState)[]) {
    if (state[k] !== patch[k]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useWorld<T>(sel: (s: WorldState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
    () => sel(state),
  );
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function flash(message: string, ms = 2600) {
  setWorld({ toast: message });
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setWorld({ toast: null }), ms);
}

/** Non-reactive, per-frame values shared between DOM and WebGL. */
export const rig = {
  /** eased global scroll progress 0..1 */
  t: 0,
  /** scroll position target 0..1 (from DOM scroll) */
  scrollTarget: 0,
  /** normalized scroll velocity (updated from DOM, smoothed in Rig) */
  scrollVel: 0,
  scrollVelRaw: 0,
  /** short-lived lead/lag for scroll momentum */
  momentumLead: 0,
  /** arc-length corrected curve parameter (for atmosphere + sampling) */
  pathT: 0,
  /** pointer in NDC-ish space, eased */
  px: 0,
  py: 0,
  pxTarget: 0,
  pyTarget: 0,
  /** optional gyro blend (0 = pointer only, 1 = gyro only) */
  gyroBlend: 0,
  /** path banking + pointer roll, radians */
  roll: 0,
  /** camera shake impulse */
  shake: 0,
  shakePhase: Math.random() * Math.PI * 2,
  /** gift box reveal progress 0..1 */
  gift: 0,
  /** planet manual drag */
  spin: 0,
  spinVel: 0,
  /** GSAP-driven dialogue camera beats (NADA AI) */
  dialoguePulse: 0,
  dialogueRoll: 0,
  dialogueFov: 0,
  /** smoothed atmosphere (written by CinematicEffects) */
  fov: 50,
  fogDensity: 0.012,
  fogColor: "#07030d",
  focusDistance: 0.012,
  bokehScale: 3.2,
  ambientIntensity: 0.35,
  dirLightIntensity: 1.6,
};

export function kick(amount = 1) {
  rig.shake = Math.min(2, rig.shake + amount);
  rig.shakePhase = Math.random() * Math.PI * 2;
}
