"use client";

/**
 * Tiny synthesized sound effects — no audio files needed.
 * Everything is triggered from user gestures, so the AudioContext
 * is allowed to start.
 */

const MUTE_KEY = "dear-memory.muted";

let audio: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audio) audio = new AC();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.07,
  startIn = 0
) {
  const ac = ctx();
  if (!ac || isMuted()) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t0 = ac.currentTime + startIn;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sfx = {
  /** countdown tick */
  tick() {
    tone(740, 0.09, "sine", 0.06);
  },
  /** the final, higher "go!" tick */
  go() {
    tone(1180, 0.18, "sine", 0.07);
  },
  /** camera shutter — a short filtered noise burst */
  shutter() {
    const ac = ctx();
    if (!ac || isMuted()) return;
    const len = Math.floor(ac.sampleRate * 0.07);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.value = 0.12;
    src.connect(gain).connect(ac.destination);
    src.start();
  },
  /** sticker pop */
  pop() {
    tone(520, 0.06, "triangle", 0.06);
    tone(820, 0.07, "triangle", 0.05, 0.04);
  },
  /** saved! — a soft little arpeggio */
  chime() {
    tone(523.25, 0.22, "sine", 0.06, 0);
    tone(659.25, 0.22, "sine", 0.06, 0.09);
    tone(783.99, 0.3, "sine", 0.06, 0.18);
    tone(1046.5, 0.4, "sine", 0.05, 0.27);
  }
};
