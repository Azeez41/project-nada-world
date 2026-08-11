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
  /** raw scroll target 0..1 */
  target: 0,
  /** pointer in NDC-ish space, eased */
  px: 0,
  py: 0,
  pxTarget: 0,
  pyTarget: 0,
  /** camera shake impulse */
  shake: 0,
  /** gift box reveal progress 0..1 */
  gift: 0,
  /** planet manual drag */
  spin: 0,
  spinVel: 0,
};

export function kick(amount = 1) {
  rig.shake = Math.min(2, rig.shake + amount);
}
