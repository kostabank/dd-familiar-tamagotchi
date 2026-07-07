'use client';

/**
 * Sound manager — synthesizes all SFX + ambient drone in-browser via the Web
 * Audio API. No external audio files needed. Respects a persisted mute toggle.
 * All sounds are short, pleasant, dark-fantasy flavored tones.
 */

export type AmbientTrack = 'default' | 'forest' | 'cave' | 'tavern';

type SfxName =
  | 'feed'
  | 'play'
  | 'pet'
  | 'sleep'
  | 'wake'
  | 'evolve'
  | 'quest'
  | 'achievement'
  | 'error'
  | 'click';

const STORAGE_KEY = 'ddt_muted';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private ambientPlaying = false;
  muted = false;
  volume = 70;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem(STORAGE_KEY) === '1';
      this.volume = Number(localStorage.getItem('ddt_volume')) || 70;
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : (this.volume / 100) * 0.5;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    // Resume on demand (browsers suspend until user gesture).
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : (this.volume / 100) * 0.5, this.ctx.currentTime, 0.05);
    }
    if (muted) {
      this.stopAmbient();
    } else {
      // Resume the saved track or default.
      const saved = this.getSavedTrack();
      this.startTrack(saved);
    }
  }

  /** Persist the selected track to localStorage. */
  setSavedTrack(track: AmbientTrack): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ddt_track', track);
    }
  }

  getSavedTrack(): AmbientTrack {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem('ddt_track') as AmbientTrack) || 'default';
  }

  /** Set master volume (0-100). Persists to localStorage. */
  setVolume(vol: number): void {
    const v = Math.max(0, Math.min(100, vol));
    this.volume = v;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ddt_volume', String(v));
    }
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(v / 100 * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  getVolume(): number {
    if (typeof window === 'undefined') return 70;
    return Number(localStorage.getItem('ddt_volume')) || 70;
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Play a short synthesized SFX. Each sound has a unique envelope + freq curve. */
  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const presets: Record<SfxName, { freqs: number[]; type: OscillatorType; dur: number; vol: number; glide?: boolean }> = {
      feed:    { freqs: [440, 660, 880], type: 'sine', dur: 0.25, vol: 0.25, glide: true },
      play:    { freqs: [523, 659, 784, 1047], type: 'triangle', dur: 0.35, vol: 0.2 },
      pet:     { freqs: [880, 1320], type: 'sine', dur: 0.2, vol: 0.18, glide: true },
      sleep:   { freqs: [392, 330, 262], type: 'sine', dur: 0.5, vol: 0.22, glide: true },
      wake:    { freqs: [262, 392, 523], type: 'triangle', dur: 0.35, vol: 0.22, glide: true },
      evolve:  { freqs: [262, 392, 523, 784, 1047, 1568], type: 'sawtooth', dur: 1.2, vol: 0.18, glide: true },
      quest:   { freqs: [659, 880, 1047, 1319], type: 'triangle', dur: 0.6, vol: 0.25 },
      achievement: { freqs: [523, 659, 784, 1047, 1319], type: 'triangle', dur: 0.8, vol: 0.25 },
      error:   { freqs: [220, 180, 140], type: 'sawtooth', dur: 0.3, vol: 0.2, glide: true },
      click:   { freqs: [800], type: 'square', dur: 0.05, vol: 0.1 },
    };
    const p = presets[name];

    // Schedule a note for each frequency in the chord/arpeggio.
    p.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq, now + i * (p.dur / p.freqs.length));
      if (p.glide && i < p.freqs.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(p.freqs[i + 1], now + (i + 1) * (p.dur / p.freqs.length));
      }
      const start = now + i * (p.dur / p.freqs.length);
      const end = start + p.dur / p.freqs.length + 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(p.vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(end + 0.05);
    });
  }

  /** Start a low ambient drone (two detuned oscillators + slow LFO). */
  startAmbient(): void {
    this.startTrack('default');
  }

  /** Switch to a named ambient track. Stops the current one first. */
  startTrack(track: AmbientTrack): void {
    if (this.muted) return;
    // If already playing this track, do nothing.
    if (this.ambientPlaying && this.currentTrack === track) return;
    // Stop current.
    this.stopAmbient();
    this.currentTrack = track;
    this._startTrackNodes(track);
  }

  private currentTrack: AmbientTrack | null = null;

  private _startTrackNodes(track: AmbientTrack): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    this.ambientPlaying = true;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.gain.setTargetAtTime(0.08, ctx.currentTime, 2);
    this.ambientGain.connect(this.masterGain);

    // Track-specific oscillator configs.
    const TRACKS: Record<AmbientTrack, { freqs: number[]; types: OscillatorType[]; lfoFreq: number; lfoDepth: number }> = {
      default: { freqs: [55, 82.5, 110], types: ['sine', 'triangle', 'triangle'], lfoFreq: 0.08, lfoDepth: 0.03 },
      forest: { freqs: [65.4, 98, 130.8], types: ['sine', 'triangle', 'sine'], lfoFreq: 0.12, lfoDepth: 0.04 },
      cave: { freqs: [49, 73.4, 98], types: ['sine', 'sine', 'triangle'], lfoFreq: 0.05, lfoDepth: 0.05 },
      tavern: { freqs: [73.4, 110, 146.8], types: ['triangle', 'sine', 'triangle'], lfoFreq: 0.15, lfoDepth: 0.035 },
    };
    const cfg = TRACKS[track] || TRACKS.default;

    cfg.freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = cfg.types[i] || 'sine';
      osc.frequency.value = f;
      osc.detune.value = (i - 1) * 5;
      gain.gain.value = i === 0 ? 0.6 : 0.3;
      osc.connect(gain);
      gain.connect(this.ambientGain!);
      osc.start();
      this.ambientNodes.push({ osc, gain });
    });

    // Slow LFO on the master ambient gain for a breathing effect.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = cfg.lfoFreq;
    lfoGain.gain.value = cfg.lfoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientGain.gain);
    lfo.start();
    this.ambientNodes.push({ osc: lfo, gain: lfoGain });
  }

  /** Returns the currently playing track (or null). */
  getCurrentTrack(): AmbientTrack | null {
    return this.currentTrack;
  }

  stopAmbient(): void {
    if (!this.ambientPlaying) return;
    this.ambientPlaying = false;
    this.currentTrack = null;
    const ctx = this.ctx;
    if (ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    }
    setTimeout(() => {
      for (const n of this.ambientNodes) {
        try { n.osc.stop(); } catch { /* already stopped */ }
        try { n.osc.disconnect(); n.gain.disconnect(); } catch { /* noop */ }
      }
      this.ambientNodes = [];
      this.ambientGain = null;
    }, 800);
  }

  /** Play a short gift-received chime (ascending sparkle). */
  playGiftChime(): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const notes = [659, 784, 988, 1319, 1568]; // E5 G5 B5 E6 G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }
}

// Singleton.
export const sound = typeof window !== 'undefined' ? new SoundManager() : (null as unknown as SoundManager);
