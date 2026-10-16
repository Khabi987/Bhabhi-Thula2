/**
 * Web Audio API procedural sound engine for Bhabhi Thulla
 * Crisp card sounds, dramatic Thulla impact bass boom, and voice commentary coordination.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private commentaryEnabled: boolean = true;
  private masterVolume: number = 0.8;
  private isInitialized: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isInitialized = true;
  }

  public setSettings(sfx: boolean, commentary: boolean, volume: number) {
    this.sfxEnabled = sfx;
    this.commentaryEnabled = commentary;
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getSettings() {
    return {
      sfx: this.sfxEnabled,
      commentary: this.commentaryEnabled,
      volume: this.masterVolume,
    };
  }

  /**
   * Sound: Quick card deal / draw
   */
  public playCardDeal() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Sound: Card snap on table
   */
  public playCardSnap() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.35 * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Sound: Heavy THULLA impact!
   * Sub-bass thump, high metallic clash, and reverberating drop
   */
  public playThullaImpact() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Heavy Sub-bass Boom
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(180, t);
      bassOsc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

      bassGain.gain.setValueAtTime(0.7 * this.masterVolume, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + 0.52);

      // 2. Crisp slap / crack
      const noiseNode = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      noiseNode.type = 'square';
      noiseNode.frequency.setValueAtTime(750, t);
      noiseNode.frequency.exponentialRampToValueAtTime(100, t + 0.15);

      noiseGain.gain.setValueAtTime(0.4 * this.masterVolume, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      noiseNode.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseNode.start(t);
      noiseNode.stop(t + 0.16);

      // 3. Metallic dissonance
      const metalOsc = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metalOsc.type = 'sawtooth';
      metalOsc.frequency.setValueAtTime(520, t);
      metalOsc.frequency.linearRampToValueAtTime(260, t + 0.3);

      metalGain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      metalGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      metalOsc.connect(metalGain);
      metalGain.connect(this.ctx.destination);
      metalOsc.start(t);
      metalOsc.stop(t + 0.32);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Sound: Player escapes (chime)
   */
  public playEscapeChime() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2 * this.masterVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Sound: Game Over / Bhabhi declared
   */
  public playGameOver() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + idx * 0.18;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Commentary voice playback via browser SpeechSynthesis
   */
  public speakCommentary(text: string) {
    if (!this.commentaryEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.masterVolume;
      utterance.rate = 1.05;
      utterance.pitch = 1.1;

      // Find an Urdu, Hindi, or South Asian voice if available
      const voices = window.speechSynthesis.getVoices();
      const urduVoice = voices.find(
        (v) =>
          v.lang.startsWith('ur') ||
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('urdu') ||
          v.name.toLowerCase().includes('hindi')
      );
      if (urduVoice) {
        utterance.voice = urduVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis may be blocked or unavailable
    }
  }
}

export const soundService = new SoundService();
