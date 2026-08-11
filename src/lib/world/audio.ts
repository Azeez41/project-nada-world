/** Tiny procedural audio engine – no assets, no autoplay. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function startAmbient() {
  const c = ensure();
  if (!c || !master || ambient) return;
  const nodes: { disconnect: () => void }[] = [];
  const stopFns: (() => void)[] = [];

  // Slow evolving pad from detuned saws through a moving lowpass.
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 6;
  filter.connect(master);
  nodes.push(filter);

  [55, 82.5, 110, 164.81].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "sawtooth" : "sine";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 7;
    const g = c.createGain();
    g.gain.value = 0.075 / (i + 1);
    o.connect(g).connect(filter);
    o.start();
    stopFns.push(() => o.stop());
    nodes.push(o, g);
  });

  const lfo = c.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  stopFns.push(() => lfo.stop());
  nodes.push(lfo, lfoGain);

  ambient = {
    stop: () => {
      stopFns.forEach((s) => {
        try {
          s();
        } catch {
          /* noop */
        }
      });
      nodes.forEach((n) => n.disconnect());
      ambient = null;
    },
  };
}

export function setSound(on: boolean) {
  const c = ensure();
  if (!c || !master) return;
  if (on) {
    startAmbient();
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(0.32, c.currentTime, 1.2);
  } else {
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
  }
}

type SfxName = "click" | "hover" | "reveal" | "ai" | "warn" | "meow" | "whoosh";

export function sfx(name: SfxName) {
  const c = ctx;
  if (!c || !master || master.gain.value < 0.01) return;
  const now = c.currentTime;
  const out = c.createGain();
  out.connect(master);

  const beep = (freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(out);
    o.start(now);
    o.stop(now + dur + 0.05);
  };

  switch (name) {
    case "click":
      beep(880, 0.12, "square", 0.18, 1560);
      break;
    case "hover":
      beep(1320, 0.06, "sine", 0.07);
      break;
    case "reveal":
      beep(330, 0.5, "triangle", 0.16, 990);
      beep(660, 0.4, "sine", 0.08, 1320);
      break;
    case "ai":
      beep(520, 0.09, "square", 0.1, 720);
      setTimeout(() => sfxRaw(760, 0.09), 90);
      break;
    case "warn":
      beep(180, 0.35, "sawtooth", 0.2, 90);
      break;
    case "meow":
      beep(700, 0.28, "sawtooth", 0.09, 420);
      break;
    case "whoosh":
      beep(120, 0.7, "sawtooth", 0.14, 40);
      break;
  }
}

function sfxRaw(freq: number, dur: number) {
  const c = ctx;
  if (!c || !master) return;
  const now = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(master);
  o.start(now);
  o.stop(now + dur + 0.05);
}
