class Guppy {
  constructor(speciesId, isBaby = false, canvasWidth = 320, canvasHeight = 220) {
    this.species = GUPPY_SPECIES.find(s => s.id === speciesId) || GUPPY_SPECIES[0];
    this.isBaby = isBaby;
    this.ageDays = isBaby ? 0 : 3; // 3일 이상이면 성체
    this.x = Math.random() * (canvasWidth - 60) + 30;
    this.y = Math.random() * (canvasHeight - 60) + 30;
    this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
    this.vy = (Math.random() - 0.5) * 0.3;
    this.dir = this.vx >= 0 ? 1 : -1;
    this.swimTimer = Math.random() * 100;
  }

  update(canvasWidth, canvasHeight, speedMultiplier) {
    if (speedMultiplier === 0) return;

    this.swimTimer += 0.15 * speedMultiplier;
    this.x += this.vx * speedMultiplier;
    this.y += (this.vy + Math.sin(this.swimTimer) * 0.15) * speedMultiplier;

    // 벽 반사
    const margin = this.isBaby ? 12 : 20;
    if (this.x < margin) {
      this.x = margin;
      this.vx = Math.abs(this.vx);
    } else if (this.x > canvasWidth - margin) {
      this.x = canvasWidth - margin;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y < margin) {
      this.y = margin;
      this.vy = Math.abs(this.vy);
    } else if (this.y > canvasHeight - margin - 14) {
      this.y = canvasHeight - margin - 14;
      this.vy = -Math.abs(this.vy);
    }

    // 가끔 방향 전환
    if (Math.random() < 0.005 * speedMultiplier) {
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
      this.vy = (Math.random() - 0.5) * 0.3;
    }
    this.dir = this.vx >= 0 ? 1 : -1;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.dir * (this.isBaby ? 0.6 : 1), this.isBaby ? 0.6 : 1);

    const p = 2; // 도트 픽셀 크기
    const wag = Math.sin(this.swimTimer * 2) > 0 ? 1 : -1;

    // 꼬리 지느러미 (도트)
    ctx.fillStyle = this.species.tailColor;
    ctx.fillRect(-7 * p, (-2 + wag) * p, 3 * p, 4 * p);
    ctx.fillRect(-9 * p, (-3 + wag) * p, 2 * p, 6 * p);

    // 몸통 (도트)
    ctx.fillStyle = this.species.bodyColor;
    ctx.fillRect(-4 * p, -2 * p, 7 * p, 4 * p);
    ctx.fillRect(3 * p, -1 * p, 2 * p, 2 * p);

    // 무늬 표현
    if (this.species.pattern === 'spot') {
      ctx.fillStyle = '#3d2b1f';
      ctx.fillRect(-2 * p, -1 * p, p, p);
      ctx.fillRect(0, 0, p, p);
    } else if (this.species.pattern === 'rainbow') {
      ctx.fillStyle = '#3a86ff';
      ctx.fillRect(-3 * p, -1 * p, 2 * p, 2 * p);
      ctx.fillStyle = '#8338ec';
      ctx.fillRect(-1 * p, -1 * p, 2 * p, 2 * p);
    } else if (this.species.pattern === 'heart') {
      ctx.fillStyle = '#ff0a54';
      ctx.fillRect(-2 * p, -1 * p, 2 * p, 2 * p);
    }

    // 눈
    ctx.fillStyle = '#000000';
    ctx.fillRect(2 * p, -1 * p, p, p);

    ctx.restore();
  }
}
