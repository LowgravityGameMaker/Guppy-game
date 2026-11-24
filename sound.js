const sound = {
  ctx: null,
  muted: false,

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (!this.muted) this.unlock();
    return this.muted;
  },

  runWithAudio(callback) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => callback());
    } else {
      callback();
    }
  },

  // 1. 뽀글 (공기방울, 구피 터치)
  playPop() {
    this.runWithAudio(() => {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 400 + Math.random() * 140;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.09);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    });
  },

  // 2. 사르르 (밥 주기, 간식 급여)
  playFeed() {
    this.runWithAudio(() => {
      const now = this.ctx.currentTime;
      [0, 0.045, 0.09].forEach((delay, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520 - idx * 55 + Math.random() * 40, now + delay);

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      });
    });
  },

  // 3. 짤랑 (골드 획득, 상점 구매/분양)
  playCoin() {
    this.runWithAudio(() => {
      const now = this.ctx.currentTime;
      const notes = [659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.065;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    });
  },

  // 4. 맑은 종소리 (청소 완료, 신종 탄생)
  playChime() {
    this.runWithAudio(() => {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.085;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    });
  }
};

// 화면 첫 터치 시 모바일 오디오 장치 즉시 잠금 해제
window.addEventListener('pointerdown', () => sound.unlock(), { once: true });
window.addEventListener('touchstart', () => sound.unlock(), { once: true });
