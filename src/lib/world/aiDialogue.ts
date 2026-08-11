import gsap from "gsap";
import { kick, rig } from "./store";
import { sfx } from "./audio";

export const AI_SCRIPT = [
  "Hello. I have analyzed Abdulaziz.",
  "...",
  "I have concerns.",
  "PROCESSING…",
  "99.9% CHAOTIC  ·  0.1% NORMAL",
  "Would you like to continue?",
] as const;

function resetDialogueRig() {
  rig.dialoguePulse = 0;
  rig.dialogueRoll = 0;
  rig.dialogueFov = 0;
}

export function stopAiDialogue() {
  gsap.killTweensOf(rig);
  resetDialogueRig();
}

/** GSAP timeline for NADA AI dialogue pacing and camera beats. */
export function playAiDialogue(onLine: (index: number) => void) {
  resetDialogueRig();

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: resetDialogueRig,
  });

  tl.call(() => {
    onLine(0);
    sfx("ai");
  })
    .to(rig, { dialoguePulse: 0.12, duration: 0.55, ease: "power2.out" })
    .to(rig, { dialoguePulse: 0, duration: 0.7 })
    .to({}, { duration: 0.45 })

    .call(() => {
      onLine(1);
      sfx("ai");
    })
    .to({}, { duration: 1.35 })

    .call(() => {
      onLine(2);
      sfx("ai");
      kick(0.32);
    })
    .to(
      rig,
      { dialoguePulse: 0.42, dialogueRoll: 0.035, duration: 0.22, ease: "power4.out" },
      "<0.05",
    )
    .to(rig, { dialogueFov: 0.35, duration: 0.28, ease: "power2.out" }, "<")
    .to(rig, { dialoguePulse: 0.06, dialogueRoll: 0, dialogueFov: 0, duration: 1.05 })

    .call(() => {
      onLine(3);
      sfx("ai");
    })
    .to(rig, { dialoguePulse: 0.55, duration: 0.18, ease: "power3.out" })
    .to(rig, { dialoguePulse: 0.1, duration: 0.35 })
    .to({}, { duration: 0.25 })

    .call(() => {
      onLine(4);
      sfx("ai");
    })
    .to(rig, { dialoguePulse: 0.28, dialogueFov: 0.22, duration: 0.35, ease: "sine.inOut" })
    .to(rig, { dialoguePulse: 0.05, dialogueFov: 0, duration: 0.65 })
    .to({}, { duration: 0.35 })

    .call(() => {
      onLine(5);
      sfx("ai");
    })
    .to(rig, { dialoguePulse: 0.18, duration: 0.4, ease: "power2.out" })
    .to(rig, { dialoguePulse: 0, duration: 0.8 });

  return tl;
}

/** Quick camera flourish when the player answers correctly. */
export function playAiAnswerBeat() {
  gsap.killTweensOf(rig);
  resetDialogueRig();

  return gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .to(rig, { dialoguePulse: 0.65, dialogueFov: 0.45, duration: 0.2 })
    .to(rig, { dialogueRoll: -0.05, duration: 0.18 }, "<")
    .to(rig, {
      dialoguePulse: 0,
      dialogueFov: 0,
      dialogueRoll: 0,
      duration: 0.9,
      ease: "power2.inOut",
    });
}
