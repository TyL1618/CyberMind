// 音效引擎：用 Web Audio API 合成電子音效，無需外部音檔（可離線）。
// 未來若要換成取樣音檔，可改用已安裝的 Howler.js。

interface BlipOptions {
  freq: number
  type?: OscillatorType
  dur?: number
  gain?: number
  /** 結束頻率（做滑音） */
  slideTo?: number
  /** 延遲開始（秒） */
  delay?: number
}

interface AmbientNodes {
  oscillators: OscillatorNode[]
  gain: GainNode
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private ambient: AmbientNodes | null = null

  sfxEnabled = true
  musicEnabled = true

  /** 必須在使用者手勢後呼叫（解除瀏覽器自動播放限制） */
  ensure(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctx: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.9
    this.master.connect(this.ctx.destination)

    this.sfxBus = this.ctx.createGain()
    this.sfxBus.gain.value = 1
    this.sfxBus.connect(this.master)

    this.musicBus = this.ctx.createGain()
    this.musicBus.gain.value = 0.5
    this.musicBus.connect(this.master)
  }

  setSfxEnabled(v: boolean): void {
    this.sfxEnabled = v
  }

  setMusicEnabled(v: boolean): void {
    this.musicEnabled = v
    if (!v) this.stopAmbient()
  }

  private blip(opts: BlipOptions): void {
    if (!this.sfxEnabled || !this.ctx || !this.sfxBus) return
    const { freq, type = 'square', dur = 0.12, gain = 0.2, slideTo, delay = 0 } = opts
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(this.sfxBus)
    osc.start(t0)
    osc.stop(t0 + dur + 0.03)
  }

  /** 答對：上揚雙音 */
  correct(): void {
    this.ensure()
    this.blip({ freq: 660, type: 'triangle', dur: 0.1, gain: 0.25, slideTo: 990 })
    this.blip({ freq: 990, type: 'triangle', dur: 0.12, gain: 0.22, slideTo: 1320, delay: 0.09 })
  }

  /** 答錯／逾時：低沉下滑 */
  wrong(): void {
    this.ensure()
    this.blip({ freq: 220, type: 'sawtooth', dur: 0.32, gain: 0.25, slideTo: 90 })
  }

  /** 復活：能量充電上掃 */
  revive(): void {
    this.ensure()
    this.blip({ freq: 160, type: 'sawtooth', dur: 0.5, gain: 0.2, slideTo: 880 })
  }

  /** 頭銜升級：上行琶音 */
  titleUp(): void {
    this.ensure()
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) =>
      this.blip({ freq: f, type: 'triangle', dur: 0.2, gain: 0.22, delay: i * 0.1 }),
    )
  }

  /** 記憶階段環境音（低頻 drone + 緩慢濾波擺動） */
  startAmbient(): void {
    this.ensure()
    if (!this.musicEnabled || !this.ctx || !this.musicBus || this.ambient) return
    const ctx = this.ctx
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 420

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.8)
    filter.connect(g)
    g.connect(this.musicBus)

    const make = (freq: number, type: OscillatorType) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = freq
      o.connect(filter)
      o.start()
      return o
    }
    const oscillators = [make(55, 'sine'), make(55.4, 'sine'), make(110, 'triangle')]

    // 緩慢擺動濾波頻率，增加生命感
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 220
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()
    oscillators.push(lfo)

    this.ambient = { oscillators, gain: g }
  }

  stopAmbient(): void {
    if (!this.ambient || !this.ctx) return
    const { oscillators, gain } = this.ambient
    const t = this.ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    oscillators.forEach((o) => o.stop(t + 0.45))
    this.ambient = null
  }
}

export const sfx = new AudioEngine()
