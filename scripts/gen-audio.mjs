// Generate WAV audio files for CyberMind using pure Node.js math (no external deps).
// Run: node scripts/gen-audio.mjs
// Output: public/audio/*.wav  — commit these files so the build doesn't need to re-run.
// To replace with real samples: drop .wav/.mp3 files into public/audio/ with the same names.

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../public/audio')

mkdirSync(OUT_DIR, { recursive: true })

const SR = 22050 // sample rate (Hz) — adequate for <11 kHz content, halves file size vs 44100

// ── WAV encoder ──────────────────────────────────────────────────────────────
function makeWav(samples) {
  const n = samples.length
  const dataSize = n * 2 // 16-bit mono
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)          // PCM
  buf.writeUInt16LE(1, 22)          // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)     // byte rate
  buf.writeUInt16LE(2, 32)          // block align
  buf.writeUInt16LE(16, 34)         // bits per sample
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767),
      44 + i * 2,
    )
  }
  return buf
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sin = (t, f) => Math.sin(2 * Math.PI * f * t)
const tri = (t, f) => { const p = (t * f) % 1; return p < 0.5 ? 4 * p - 1 : 3 - 4 * p }

function adsr(t, dur, a, d, s, r) {
  if (t < 0 || t >= dur) return 0
  if (t < a) return t / a
  if (t < a + d) return 1 - (1 - s) * (t - a) / d
  if (t < dur - r) return s
  return s * (1 - (t - (dur - r)) / r)
}

// ── correct: two-note ascending chime ────────────────────────────────────────
{
  const dur = 0.55; const N = Math.ceil(SR * dur)
  const out = new Float32Array(N)
  const notes = [{ f: 660, s: 0, e: 0.32 }, { f: 990, s: 0.12, e: 0.55 }]
  for (let i = 0; i < N; i++) {
    const t = i / SR; let v = 0
    for (const { f, s, e } of notes) {
      const nt = t - s
      if (nt < 0 || t > e) continue
      v += adsr(nt, e - s, 0.008, 0.05, 0.55, 0.12) * tri(t, f) * 0.32
    }
    // sparkle overtone
    if (t > 0.08) v += adsr(t - 0.08, 0.38, 0.015, 0.1, 0.3, 0.1) * sin(t, 1980) * 0.06
    out[i] = v
  }
  writeFileSync(join(OUT_DIR, 'correct.wav'), makeWav(out))
  console.log('✓ correct.wav')
}

// ── wrong: descending sawtooth with phase accumulation ───────────────────────
{
  const dur = 0.62; const N = Math.ceil(SR * dur)
  const out = new Float32Array(N)
  let ph = 0
  for (let i = 0; i < N; i++) {
    const t = i / SR
    const freq = 220 * Math.pow(88 / 220, t / dur)
    ph = (ph + freq / SR) % 1
    out[i] = adsr(t, dur, 0.008, 0.08, 0.5, 0.22) * (2 * ph - 1) * 0.3
  }
  writeFileSync(join(OUT_DIR, 'wrong.wav'), makeWav(out))
  console.log('✓ wrong.wav')
}

// ── revive: rising energy sweep ───────────────────────────────────────────────
{
  const dur = 0.78; const N = Math.ceil(SR * dur)
  const out = new Float32Array(N)
  let ph1 = 0, ph2 = 0
  for (let i = 0; i < N; i++) {
    const t = i / SR
    const prog = t / dur
    const freq = 120 + 820 * prog * prog
    ph1 = (ph1 + freq / SR) % 1
    ph2 = (ph2 + freq * 2 / SR) % 1
    const env = adsr(t, dur, 0.015, 0.1, 0.8, 0.15)
    out[i] = env * ((2 * ph1 - 1) * 0.22 + Math.sin(2 * Math.PI * ph2) * 0.13 * prog)
  }
  writeFileSync(join(OUT_DIR, 'revive.wav'), makeWav(out))
  console.log('✓ revive.wav')
}

// ── titleup: 4-note arpeggio + sub hit + gold shimmer ────────────────────────
{
  const dur = 1.35; const N = Math.ceil(SR * dur)
  const out = new Float32Array(N)
  const notes = [
    { f: 523,  s: 0,    e: 0.46 },
    { f: 659,  s: 0.18, e: 0.62 },
    { f: 784,  s: 0.36, e: 0.78 },
    { f: 1047, s: 0.54, e: 1.15 },
  ]
  for (let i = 0; i < N; i++) {
    const t = i / SR; let v = 0
    for (const { f, s, e } of notes) {
      const nt = t - s
      if (nt < 0 || t > e) continue
      const env = adsr(nt, e - s, 0.008, 0.06, 0.6, 0.2)
      v += env * (tri(t, f) * 0.22 + sin(t, f * 2) * 0.06)
    }
    // sub-bass thump at onset
    if (t < 0.2) v += adsr(t, 0.2, 0.005, 0.04, 0.3, 0.08) * sin(t, 80) * 0.32
    // high sparkle pair (starts 0.62s)
    if (t > 0.62 && t < 1.25) {
      const st = t - 0.62; const env = adsr(st, 0.55, 0.04, 0.1, 0.5, 0.2)
      v += env * (sin(t, 2093) * 0.055 + sin(t, 2637) * 0.038)
    }
    out[i] = Math.max(-1, Math.min(1, v))
  }
  writeFileSync(join(OUT_DIR, 'titleup.wav'), makeWav(out))
  console.log('✓ titleup.wav')
}

// ── ambient: seamless 6-second drone loop ────────────────────────────────────
{
  const dur = 6; const N = Math.ceil(SR * dur)
  const out = new Float32Array(N)
  const fadeLen = Math.ceil(SR * 0.28)
  for (let i = 0; i < N; i++) {
    const t = i / SR
    const lfo = 0.5 + 0.5 * sin(t, 0.08)
    let v = sin(t, 55) * 0.21 + sin(t, 55.4) * 0.17 + tri(t, 110) * 0.09
    v += sin(t, 220) * 0.05 * lfo  // upper shimmer
    // seamless fade at loop points
    let fade = 1
    if (i < fadeLen) fade = i / fadeLen
    else if (i > N - fadeLen) fade = (N - i) / fadeLen
    out[i] = v * fade
  }
  writeFileSync(join(OUT_DIR, 'ambient.wav'), makeWav(out))
  console.log('✓ ambient.wav')
}

console.log(`\nAll audio files written to public/audio/  (SR=${SR} Hz)`)
