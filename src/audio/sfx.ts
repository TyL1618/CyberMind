// 音效引擎：Howler.js 載入預先生成的 WAV 檔（scripts/gen-audio.mjs）。
// 要換成真實取樣音效：直接把同名 .wav/.mp3 放進 public/audio/ 覆蓋即可。
import { Howl } from 'howler'

class AudioEngine {
  private howls: Record<string, Howl> = {}
  private ambientId: number | null = null
  private ambientVol = 0

  sfxEnabled = true
  musicEnabled = true

  private get(key: string, src: string, loop = false): Howl {
    if (!this.howls[key]) {
      this.howls[key] = new Howl({
        src: [src],
        loop,
        preload: true,
        onloaderror: (_id, err) => console.warn(`[sfx] load failed: ${src}`, err),
      })
    }
    return this.howls[key]
  }

  /** 在使用者手勢後呼叫，確保 AudioContext 解鎖（Howler 內部自動處理） */
  ensure(): void {
    // Howler 在首次 play() 後自動解鎖 iOS/Android AudioContext，無需手動操作。
  }

  setSfxEnabled(v: boolean): void { this.sfxEnabled = v }

  setMusicEnabled(v: boolean): void {
    this.musicEnabled = v
    if (!v) this.stopAmbient()
  }

  correct(): void {
    if (this.sfxEnabled) this.get('correct', '/audio/correct.wav').play()
  }

  wrong(): void {
    if (this.sfxEnabled) this.get('wrong', '/audio/wrong.wav').play()
  }

  revive(): void {
    if (this.sfxEnabled) this.get('revive', '/audio/revive.wav').play()
  }

  titleUp(): void {
    if (this.sfxEnabled) this.get('titleup', '/audio/titleup.wav').play()
  }

  startAmbient(): void {
    if (!this.musicEnabled || this.ambientId !== null) return
    const h = this.get('ambient', '/audio/ambient.wav', true)
    const id = h.play()
    this.ambientId = id
    this.ambientVol = 0.38
    h.volume(0, id)
    h.fade(0, this.ambientVol, 900, id)
  }

  stopAmbient(): void {
    if (this.ambientId === null) return
    const h = this.howls['ambient']
    if (!h) { this.ambientId = null; return }
    const id = this.ambientId
    this.ambientId = null
    h.fade(this.ambientVol, 0, 420, id)
    setTimeout(() => h.stop(id), 450)
  }
}

export const sfx = new AudioEngine()
