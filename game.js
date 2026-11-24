const canvas = document.getElementById('tank-canvas');
const ctx = canvas.getContext('2d');

const state = {
  gold: 10,
  day: 1,
  minutes: 420, // 07:00 (420분)
  paused: false,
  speed: 1,
  water: '좋음',
  moss: '없음',
  bug: false,
  cleanedToday: false,
  fedCount: 0,
  guppies: [],
  foods: [],
  dex: ['red_tail']
};

function initGame() {
  state.guppies = [
    createGuppy('red_tail', 80, 100),
    createGuppy('red_tail', 160, 130)
  ];
  updateUI();
  requestAnimationFrame(gameLoop);
}

function createGuppy(speciesId, x, y) {
  const sp = GUPPY_SPECIES.find(s => s.id === speciesId);
  return {
    species: sp,
    isAdult: true,
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 0.6
  };
}

// 시간 흐름 (현실 1초 = 게임 1분)
setInterval(() => {
  if (state.paused || document.getElementById('game-screen').classList.contains('hidden')) return;
  state.minutes += state.speed;
  if (state.minutes >= 1200) { // 20:00 밤 도달
    state.minutes = 1200;
    state.paused = true;
    openModal('밤이 되었습니다 (20:00)', '어항이 어두워졌습니다. [확인]을 누르면 다음 날 07:00로 넘어갑니다. (2단계에서 밤 정산 점수와 골드 지급이 추가됩니다)', () => {
      state.day++;
      state.minutes = 420;
      state.cleanedToday = false;
      state.fedCount = 0;
      state.paused = false;
      updateUI();
    });
  }
  updateUI();
}, 1000);

function updateUI() {
  const h = String(Math.floor(state.minutes / 60)).padStart(2, '0');
  const m = String(state.minutes % 60).padStart(2, '0');
  document.getElementById('clock-display').textContent = `${h}:${m}`;
  document.getElementById('stat-water').textContent = `수질:${state.water}`;
  document.getElementById('stat-moss').textContent = `이끼:${state.moss}`;
  document.getElementById('stat-gold').textContent = `골드:${state.gold}G`;

  const adults = state.guppies.filter(g => g.isAdult).length;
  const babies = state.guppies.filter(g => !g.isAdult).length;
  document.getElementById('stat-pop').textContent = `성체:${adults} 새끼:${babies}`;

  document.getElementById('stat-over').classList.toggle('hidden', state.guppies.length <= 30);
  document.getElementById('stat-bug').classList.toggle('hidden', !state.bug);

  document.getElementById('btn-clean-water').disabled = state.cleanedToday;
  document.getElementById('btn-clean-wall').disabled = state.cleanedToday;
  document.getElementById('btn-clean-all').disabled = state.cleanedToday;
  document.getElementById('btn-feed').disabled = state.cleanedToday || state.gold < 1;
}

function drawPixelGuppy(g) {
  const dir = g.vx >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(Math.floor(g.x), Math.floor(g.y));
  ctx.scale(dir, 1);

  // 꼬리 (도트 사각형)
  ctx.fillStyle = g.species.tail;
  ctx.fillRect(-10, -4, 6, 8);
  ctx.fillRect(-12, -6, 3, 12);

  // 몸통
  ctx.fillStyle = g.species.body;
  ctx.fillRect(-4, -3, 10, 6);

  // 무늬 점
  if (g.species.spot) {
    ctx.fillStyle = g.species.spot;
    ctx.fillRect(-2, -1, 2, 2);
    ctx.fillRect(2, 0, 2, 2);
  }

  // 눈
  ctx.fillStyle = '#000000';
  ctx.fillRect(3, -2, 2, 2);
  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 바닥 모래
  ctx.fillStyle = '#f5cba7';
  ctx.fillRect(0, 195, canvas.width, 25);

  // 기본 수초 1개
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(30, 165, 6, 30);
  ctx.fillRect(26, 175, 4, 10);
  ctx.fillRect(36, 170, 4, 12);

  // 사료 그리기 및 낙하
  ctx.fillStyle = '#784212';
  for (let i = state.foods.length - 1; i >= 0; i--) {
    const f = state.foods[i];
    if (!state.paused) f.y += 0.4 * state.speed;
    ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 3, 3);
    if (f.y > 195) state.foods.splice(i, 1);
  }

  // 구피 이동 및 그리기
  state.guppies.forEach(g => {
    if (!state.paused) {
      if (state.foods.length > 0) {
        const target = state.foods[0];
        const dx = target.x - g.x;
        const dy = target.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          state.foods.shift();
        } else {
          g.vx = (dx / dist) * 1.3 * state.speed;
          g.vy = (dy / dist) * 1.3 * state.speed;
        }
      } else if (Math.random() < 0.02) {
        g.vx = (Math.random() - 0.5) * 1.2 * state.speed;
        g.vy = (Math.random() - 0.5) * 0.6 * state.speed;
      }

      g.x += g.vx;
      g.y += g.vy;
      if (g.x < 16 || g.x > canvas.width - 16) g.vx *= -1;
      if (g.y < 16 || g.y > 185) g.vy *= -1;
    }
    drawPixelGuppy(g);
  });

  requestAnimationFrame(gameLoop);
}

// 버튼 이벤트
document.getElementById('btn-start').onclick = () => {
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  initGame();
};

document.getElementById('btn-pause').onclick = (e) => {
  state.paused = !state.paused;
  e.target.textContent = state.paused ? '재생' : '정지';
};

document.getElementById('btn-fast').onclick = (e) => {
  state.speed = state.speed === 1 ? 2 : 1;
  e.target.textContent = state.speed === 1 ? '2배속' : '1배속';
};

document.getElementById('btn-feed').onclick = () => {
  if (state.gold < 1) return;
  state.gold -= 1;
  state.fedCount++;
  for (let i = 0; i < 4; i++) {
    state.foods.push({ x: 50 + Math.random() * 160, y: 10 });
  }
  updateUI();
};

document.getElementById('btn-dex').onclick = () => {
  const list = GUPPY_SPECIES.map(s => {
    const found = state.dex.includes(s.id);
    return found ? `[발견] ${s.name} (${s.rarity})` : `[미발견] ???`;
  }).join('<br>');
  openModal('물고기 도감', list);
};

function openModal(title, html, onClose) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('btn-modal-close').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (onClose) onClose();
  };
}
