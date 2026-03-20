/**
 * SoundService.ts
 * Procedural sound synthesis using Web Audio API
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createGain(start: number, end: number, duration: number) {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(start, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(end, this.ctx!.currentTime + duration);
    return gain;
  }

  playHit() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(1, 0.01, 0.1);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  playMiss() {
    this.init();
    const bufferSize = this.ctx!.sampleRate * 0.1;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx!.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx!.currentTime + 0.1);
    
    const gain = this.createGain(0.3, 0.01, 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx!.destination);
    
    noise.start();
  }

  playPoint() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.3, 0.01, 0.3);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx!.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, this.ctx!.currentTime + 0.1); // E6
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  playStart() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.2, 0.01, 0.5);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx!.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.5);
  }

  playGameOver() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.createGain(0.3, 0.01, 1);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(55, this.ctx!.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.start();
    osc.stop(this.ctx!.currentTime + 1);
  }
}

export const soundService = new SoundService();
