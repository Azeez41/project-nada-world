import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "./Scene";
import { rig, setWorld, useWorld, getWorld } from "@/lib/world/store";
import { setSound, sfx } from "@/lib/world/audio";

const AREA_LABELS = [
  "SELECTION",
  "DATABASE",
  "MEMORY TUNNEL",
  "NADA AI",
  "OUR UNIVERSE",
  "CHAOS",
  "THE MESSAGE",
];

type MotionEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export default function Experience() {
  const phase = useWorld((s) => s.phase);
  const area = useWorld((s) => s.area);
  const soundOn = useWorld((s) => s.soundOn);
  const toast = useWorld((s) => s.toast);
  const { progress, active } = useProgress();
  const [booted, setBooted] = useState(false);
  const [motionOn, setMotionOn] = useState(false);
  const scrollHost = useRef<HTMLDivElement>(null);

  // quality / device profile
  useEffect(() => {
    const small = window.matchMedia("(max-width: 900px)").matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    setWorld({ quality: small || cores <= 4 ? "low" : "high" });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 2200);
    return () => clearTimeout(id);
  }, []);

  // scroll → normalized world progress + velocity for camera momentum
  useEffect(() => {
    const scrollState = { y: window.scrollY, t: performance.now() };

    const applyScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      rig.scrollTarget = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    };

    const onScroll = () => {
      const now = performance.now();
      const max = document.body.scrollHeight - window.innerHeight;
      const dt = Math.max(0.001, (now - scrollState.t) / 1000);
      const dy = window.scrollY - scrollState.y;
      const normVel = max > 0 ? dy / dt / max : 0;
      rig.scrollVelRaw = THREE.MathUtils.clamp(normVel, -2.5, 2.5);
      scrollState.y = window.scrollY;
      scrollState.t = now;
      applyScroll();
    };

    applyScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", applyScroll);
    };
  }, []);

  // pointer / touch parallax — damped in Rig; reduced sensitivity on small screens
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const gain = mobile ? 0.72 : 1;

    const onMove = (e: PointerEvent) => {
      if (rig.gyroBlend > 0.85) return;
      const blend = 1 - rig.gyroBlend;
      rig.pxTarget = (e.clientX / window.innerWidth - 0.5) * 2 * gain * blend;
      rig.pyTarget = (e.clientY / window.innerHeight - 0.5) * 2 * gain * blend;
    };

    const onLeave = () => {
      if (rig.gyroBlend > 0.85) return;
      rig.pxTarget = 0;
      rig.pyTarget = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // lock scrolling until the simulation is entered
  useEffect(() => {
    document.body.style.overflow = phase === "boot" ? "hidden" : "";
    if (phase === "gift") {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  const toggleSound = () => {
    const next = !getWorld().soundOn;
    setWorld({ soundOn: next });
    setSound(next);
    if (next) sfx("click");
  };

  const enableMotion = async () => {
    const D = DeviceOrientationEvent as MotionEventWithPermission | undefined;
    try {
      if (D?.requestPermission) {
        const res = await D.requestPermission();
        if (res !== "granted") return;
      }
      rig.gyroBlend = 1;
      window.addEventListener("deviceorientation", (e) => {
        if (e.gamma == null || e.beta == null) return;
        rig.pxTarget = THREE.MathUtils.clamp(e.gamma / 35, -1, 1);
        rig.pyTarget = THREE.MathUtils.clamp((e.beta - 45) / 40, -1, 1);
      });
      setMotionOn(true);
      sfx("click");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <div className="fixed inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, typeof window !== "undefined" && window.innerWidth < 900 ? 1.6 : 2]}
          gl={{ antialias: false, powerPreference: "high-performance", alpha: false }}
          camera={{ fov: 50, near: 0.1, far: 400, position: [0, 0.6, 20] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;

          }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* scroll driver */}
      <div ref={scrollHost} className="pointer-events-none relative z-10" style={{ height: "1100vh" }} />

      {/* HUD */}
      <div className="pointer-events-none fixed inset-0 z-20 select-none">
        <div className="flex items-start justify-between p-5 md:p-8">
          <div className="font-display text-[10px] tracking-[0.42em] text-accent-foreground/80 md:text-xs">
            N.A.D.A · SIMULATION v1.0
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={toggleSound}
              className="rounded-full border border-primary/50 bg-background/40 px-3 py-1.5 font-display text-[10px] tracking-[0.24em] text-foreground backdrop-blur transition-colors hover:bg-primary/20 md:text-xs"
            >
              {soundOn ? "SOUND ON" : "SOUND OFF"}
            </button>
            <button
              onClick={enableMotion}
              className="rounded-full border border-secondary/50 bg-background/40 px-3 py-1.5 font-display text-[10px] tracking-[0.24em] text-foreground backdrop-blur transition-colors hover:bg-secondary/20 md:hidden"
            >
              {motionOn ? "TILT ON" : "TILT"}
            </button>
          </div>
        </div>

        {/* area rail */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 md:bottom-8 md:gap-3">
          {AREA_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === area ? "w-8 bg-primary" : "w-2 bg-foreground/25"
                }`}
              />
              {i === area && (
                <span className="font-display text-[9px] tracking-[0.3em] text-foreground/80 md:text-[10px]">
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>

        {phase === "world" && area === 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-pulse font-body text-[10px] tracking-[0.4em] text-foreground/60">
            SCROLL TO TRAVEL
          </div>
        )}

        {toast && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary/40 bg-background/70 px-6 py-3 font-display text-sm tracking-[0.2em] text-foreground shadow-[0_0_60px_rgba(255,61,158,0.35)] backdrop-blur-xl">
            {toast}
          </div>
        )}
      </div>

      {/* boot loader */}
      <div
        className={`fixed inset-0 z-30 flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ${
          booted ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="h-2 w-2 animate-ping rounded-full bg-primary" />
        <div className="mt-8 font-display text-[10px] tracking-[0.5em] text-foreground/70">
          INITIALIZING NADA
        </div>
        <div className="mt-3 h-px w-40 overflow-hidden bg-foreground/15">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${active ? Math.max(8, progress) : 100}%` }} />
        </div>
      </div>
    </div>
  );
}
