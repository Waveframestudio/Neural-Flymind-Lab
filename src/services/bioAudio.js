// Web Audio API Synthesizer for Bio-Technical Laboratory Effects
class BioAudioEngine {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.wingGain = null;
    this.wingOsc = null;
    this.humGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    // Sub-hum ambient lab drone
    const humOsc = this.ctx.createOscillator();
    this.humGain = this.ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz ambient hum
    this.humGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    humOsc.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);
    humOsc.start();

    // Wing buzz sound setup
    this.wingOsc = this.ctx.createOscillator();
    this.wingGain = this.ctx.createGain();
    this.wingOsc.type = 'sawtooth';
    this.wingOsc.frequency.setValueAtTime(180, this.ctx.currentTime); // 180Hz Drosophila wing flap frequency
    this.wingGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Lowpass filter to soften wing buzz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.wingOsc.connect(filter);
    filter.connect(this.wingGain);
    this.wingGain.connect(this.ctx.destination);
    this.wingOsc.start();
  }

  toggleAudio() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled && this.wingGain) {
      this.wingGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isEnabled;
  }

  // Play bio-electric neural spike click (Geiger-Müller / EEG style)
  playNeuralClick() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp bio-electric pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.015);

      gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {}
  }

  // Play suction feeding sound
  playFeedingSuction() {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    } catch (e) {}
  }

  // Update wing buzz sound according to fly flight state / speed
  updateWingBuzz(isFlying, speed) {
    if (!this.isEnabled || !this.ctx || !this.wingGain) return;
    try {
      const now = this.ctx.currentTime;
      if (isFlying || speed > 3.0) {
        const targetFreq = 160 + Math.min(60, speed * 15);
        this.wingOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        this.wingGain.gain.setTargetAtTime(0.035, now, 0.05);
      } else {
        this.wingGain.gain.setTargetAtTime(0, now, 0.08);
      }
    } catch (e) {}
  }
}

export const bioAudio = new BioAudioEngine();
