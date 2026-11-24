class Guppy {
  constructor(speciesId, isBaby = false, canvasWidth = 240, canvasHeight = 320) {
    this.species = GUPPY_SPECIES.find(s => s.id === speciesId) || GUPPY_SPECIES;
    this.isBaby = isBaby;
    this.ageDays = isBaby ? 0 : 3;
    this.x = Math.random() * (canvasWidth - 60) + 30;
    this.y = Math.random() * (canvasHeight - 60) + 30;
    this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
    this.vy = (Math.random() - 0.5) * 0.3;
    this.dir = this.vx >= 0 ? 1 : -1;
    this.swimTimer = Math.random() * 100;
    this.eatAnimTimer = 0; // 먹기 모션 타이머
  }

  update(canvasWidth, canvasHeight, speedMultiplier, foods) {
    if (speedMultiplier === 0) return;

    this.swimTimer += 0.15 * speedMultiplier;
    if (this.eatAnimTimer > 0) {
      this.eatAnimTimer -= speedMultiplier;
    }

    // 가장 가까운 사료 찾기
    let targetFood = null;
    let minDist = Infinity;
    if (foods && foods.length > 0) {
      for (const f of foods) {
        if (f.eaten) continue;
        const dx = f.x - this.x;
        const dy = f.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          targetFood = f;
        }
      }
    }

    if (targetFood) {
      // 사료를 향해 헤엄치기
      const dx = targetFood.x - this.x;
      const dy = targetFood.y - this.y;
      const angle = Math.atan2(dy, dx);
      const chaseSpeed = 1.1;

      this.vx = Math.cos(angle) * chaseSpeed;
      this.vy = Math.sin(angle) * chaseSpeed;
      this.x += this.vx * speedMultiplier;
      this.y += this.vy * speedMultiplier;
      this.swimTimer += 0.2 * speedMultiplier; // 꼬리 더 빠르게 흔듦

      // 사료에 닿으면 먹기!
      if (minDist < 10) {
        targetFood.eaten = true;
        this.eatAnimTimer = 12; // 입 벌리는 모션 지속
      }
    } else {
      // 평상시 자유 유영
      this.x += this.vx * speedMultiplier;
      this.y += (this.vy + Math.sin(this.swimTimer) * 0.15) * speedMultiplier;

      if (Math.random() < 0.005 * speedMultiplier) {
        this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
        this.vy = (Math.random() - 0.5) * 0.3;
      }
    }

    // 벽 반사 및 경계 제한
    const margin = this.isBaby ? 12 : 18;
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

    if (Math.abs(this.vx) > 0.05) {
      this.dir = this.vx >= 0 ? 1 : -1;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.dir * (this.isBaby ? 0.6 : 1), this.isBaby ? 0.6 : 1);

    const p = 2;
    const wag = Math.sin(this.swimTimer * 2) > 0 ? 1 : -1;

    // 꼬리 지느러미
    ctx.fillStyle = this.species.tailColor;
    ctx.fillRect(-7 * p, (-2 + wag) * p, 3 * p, 4 * p);
    ctx.fillRect(-9 * p, (-3 + wag) * p, 2 * p, 6 * p);

    // 몸통
    ctx.fillStyle = this.species.bodyColor;
    ctx.fillRect(-4 * p, -2 * p, 7 * p, 4 * p);

    // 먹기 모션(입 벌림) vs 평상시 주둥이
    if (this.eatAnimTimer > 0) {
      ctx.fillRect(3 * p, -2 * p, 2 * p, 1 * p);
      ctx.fillRect(3 * p, 1 * p, 2 * p, 1 * p);
      // 작은 물방울 도트 표시
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6 * p, -3 * p, p, p);
    } else {
      ctx.fillRect(3 * p, -1 * p, 2 * p, 2 * p);
    }

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
