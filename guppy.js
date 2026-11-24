class Guppy {
  constructor(speciesId, isBaby = false, canvasWidth = 240, canvasHeight = 260) {
    this.species = GUPPY_SPECIES.find(s => s.id === speciesId) || GUPPY_SPECIES[0];
    this.isBaby = isBaby;
    this.ageDays = isBaby ? 0 : 2;
    this.x = Math.random() * (canvasWidth - 60) + 30;
    this.y = Math.random() * (canvasHeight - 60) + 30;
    this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
    this.vy = (Math.random() - 0.5) * 0.3;
    this.dir = this.vx >= 0 ? 1 : -1;
    this.swimTimer = Math.random() * 100;
    this.eatAnimTimer = 0;
    this.playAnimTimer = 0; // 터치해서 놀아줄 때 하트 연출
  }

  playWith() {
    this.playAnimTimer = 35;
    this.vy = -0.8;
    this.vx = (Math.random() < 0.5 ? -1 : 1) * 0.9;
  }

  update(canvasWidth, canvasHeight, speedMultiplier, foods, hasBabyBox) {
    if (this.playAnimTimer > 0) {
      this.playAnimTimer -= 1;
    }
    if (speedMultiplier === 0) return;

    this.swimTimer += 0.15 * speedMultiplier;
    if (this.eatAnimTimer > 0) this.eatAnimTimer -= speedMultiplier;

    if (this.isBaby && hasBabyBox) {
      const boxX = canvasWidth - 68;
      const boxY = 8;
      const boxW = 60;
      const boxH = 42;
      this.x += this.vx * 0.6 * speedMultiplier;
      this.y += (this.vy + Math.sin(this.swimTimer) * 0.1) * speedMultiplier;

      if (this.x < boxX + 8) { this.x = boxX + 8; this.vx = Math.abs(this.vx); }
      if (this.x > boxX + boxW - 8) { this.x = boxX + boxW - 8; this.vx = -Math.abs(this.vx); }
      if (this.y < boxY + 8) { this.y = boxY + 8; this.vy = Math.abs(this.vy); }
      if (this.y > boxY + boxH - 8) { this.y = boxY + boxH - 8; this.vy = -Math.abs(this.vy); }
      this.dir = this.vx >= 0 ? 1 : -1;
      return;
    }

    let targetFood = null;
    let minDist = Infinity;
    if (foods && foods.length > 0) {
      for (const f of foods) {
        if (f.eaten) continue;
        const dist = Math.hypot(f.x - this.x, f.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          targetFood = f;
        }
      }
    }

    if (targetFood) {
      const angle = Math.atan2(targetFood.y - this.y, targetFood.x - this.x);
      this.vx = Math.cos(angle) * 1.1;
      this.vy = Math.sin(angle) * 1.1;
      this.x += this.vx * speedMultiplier;
      this.y += this.vy * speedMultiplier;
      this.swimTimer += 0.2 * speedMultiplier;

      if (minDist < 10) {
        targetFood.eaten = true;
        this.eatAnimTimer = 12;
      }
    } else {
      this.x += this.vx * speedMultiplier;
      this.y += (this.vy + Math.sin(this.swimTimer) * 0.15) * speedMultiplier;

      if (Math.random() < 0.005 * speedMultiplier) {
        this.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
        this.vy = (Math.random() - 0.5) * 0.3;
      }
    }

    const margin = this.isBaby ? 12 : 18;
    if (this.x < margin) { this.x = margin; this.vx = Math.abs(this.vx); }
    else if (this.x > canvasWidth - margin) { this.x = canvasWidth - margin; this.vx = -Math.abs(this.vx); }

    if (this.y < margin) { this.y = margin; this.vy = Math.abs(this.vy); }
    else if (this.y > canvasHeight - margin - 14) { this.y = canvasHeight - margin - 14; this.vy = -Math.abs(this.vy); }

    if (Math.abs(this.vx) > 0.05) {
      this.dir = this.vx >= 0 ? 1 : -1;
    }
  }

  draw(ctx) {
    drawGuppySprite(
      ctx,
      this.species,
      this.x,
      this.y,
      this.dir,
      this.isBaby ? 0.6 : 1,
      this.swimTimer,
      this.eatAnimTimer > 0,
      false
    );

    // 터치해서 놀아줄 때 머리 위 도트 하트 표시
    if (this.playAnimTimer > 0) {
      const hx = Math.round(this.x) - 4;
      const hy = Math.round(this.y) - 16 - Math.floor((35 - this.playAnimTimer) * 0.2);
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(hx, hy, 2, 2);
      ctx.fillRect(hx + 4, hy, 2, 2);
      ctx.fillRect(hx - 1, hy + 2, 8, 2);
      ctx.fillRect(hx + 1, hy + 4, 4, 2);
      ctx.fillRect(hx + 2, hy + 6, 2, 1);
    }
  }
}

function drawGuppySprite(ctx, species, x, y, dir = 1, scale = 1, swimTimer = 0, isEating = false, isSilhouette = false) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(dir * scale, scale);

  const p = 2;
  const wag = Math.sin(swimTimer * 2) > 0 ? 1 : -1;

  ctx.fillStyle = isSilhouette ? '#0f172a' : species.tailColor;
  ctx.fillRect(-7 * p, (-2 + wag) * p, 3 * p, 4 * p);
  ctx.fillRect(-9 * p, (-3 + wag) * p, 2 * p, 6 * p);

  ctx.fillStyle = isSilhouette ? '#0f172a' : species.bodyColor;
  ctx.fillRect(-4 * p, -2 * p, 7 * p, 4 * p);

  if (isEating) {
    ctx.fillRect(3 * p, -2 * p, 2 * p, 1 * p);
    ctx.fillRect(3 * p, 1 * p, 2 * p, 1 * p);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6 * p, -3 * p, p, p);
  } else {
    ctx.fillRect(3 * p, -1 * p, 2 * p, 2 * p);
  }

  if (!isSilhouette) {
    if (species.pattern === 'spot') {
      ctx.fillStyle = '#3d2b1f';
      ctx.fillRect(-2 * p, -1 * p, p, p);
      ctx.fillRect(0, 0, p, p);
    } else if (species.pattern === 'rainbow') {
      ctx.fillStyle = '#3a86ff';
      ctx.fillRect(-3 * p, -1 * p, 2 * p, 2 * p);
      ctx.fillStyle = '#8338ec';
      ctx.fillRect(-1 * p, -1 * p, 2 * p, 2 * p);
    } else if (species.pattern === 'neon') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3 * p, -1 * p, 4 * p, p);
    } else if (species.pattern === 'heart') {
      ctx.fillStyle = '#ff0a54';
      ctx.fillRect(-2 * p, -1 * p, 2 * p, 2 * p);
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(2 * p, -1 * p, p, p);
  }

  ctx.restore();
}
