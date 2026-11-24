window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tank-canvas');
  const ctx = canvas.getContext('2d');

  const SPECIES_LIST = (typeof GUPPY_SPECIES !== 'undefined') ? GUPPY_SPECIES : [
    { id: 'red_tail', name: '붉은꼬리 구피', rarity: '일반', body: '#d5dbdb', tail: '#e74c3c', spot: null, bonus: 10 }
  ];

  const WATER_LEVELS = ['나쁨', '보통', '좋음'];
  const MOSS_LEVELS = ['없음', '약간', '중간', '많음'];

  const state = {
    gold: 10,
    day: 1,
    minutes: 420,
    paused: false,
    speed: 1,
    waterIdx: 2, // 0:나쁨, 1:보통, 2:좋음
    mossIdx: 0,  // 0:없음, 1:약간, 2:중간, 3:많음
    bug: false,
    cleanedToday: false,
    fedCount: 0,
    guppies: [],
    foods: [],
    dex: ['red_tail'],
    equippedDecos: [],
    substrate: null
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
    const sp = SPECIES_LIST.find(s => s.id === speciesId) || SPECIES_LIST.at(0);
    return {
      species: sp,
      isAdult: true,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 0.6
    };
  }

  setInterval(() => {
    if (state.paused || document.getElementById('game-screen').classList.contains('hidden')) return;
    advanceTime(state.speed);
  }, 1000);

  function advanceTime(mins) {
    state.minutes += mins;
    if (state.minutes >= 1200) {
      state.minutes = 1200;
      triggerNightReport();
    }
    updateUI();
  }

  function triggerNightReport() {
    state.paused = true;
    const pop = state.guppies.length;
    const reqFeed = pop * (state.mossIdx === 1 ? 2 : 3);
    const feedDiff = Math.abs(state.fedCount - reqFeed);

    let score = 100;
    if (feedDiff > 0) score -= Math.min(25, feedDiff * 4);
    if (state.waterIdx === 1) score -= 5;
    if (state.waterIdx === 0) score -= 15;
    if (state.mossIdx === 2) score -= 5;
    if (state.mossIdx === 3) score -= 10;
    if (pop > 30) score -= 10;
    if (state.bug) score -= 15;

    state.equippedDecos.forEach(d => { score += (d.score || 0); });
    score = Math.max(0, Math.min(100, score));

    // 사망 판정
    let deadCount = 0;
    if (state.bug) {
      const kill = Math.min(state.guppies.length, Math.floor(Math.random() * 5) + 1);
      state.guppies.splice(0, kill);
      deadCount += kill;
    }
    if (state.waterIdx === 0 && state.guppies.length > 0 && Math.random() < 0.4) {
      state.guppies.pop();
      deadCount++;
    }

    const earnedGold = score;
    state.gold += earnedGold;

    const reportHtml = `
      [어항이 어두워졌습니다 - ${state.day}일차 밤 정산]<br><br>
      - 오늘 급여량: ${state.fedCount}숟갈 (권장: ${reqFeed}숟갈)<br>
      - 수질: ${WATER_LEVELS.at(state.waterIdx)} / 이끼: ${MOSS_LEVELS.at(state.mossIdx)}<br>
      - 종합 점수: <b>${score}점</b> (+${earnedGold}G 획득)<br>
      - 생존 구피: ${state.guppies.length}마리 / 사망 구피: ${deadCount}마리
    `;

    openModal('밤 정산 보고서', reportHtml, () => {
      if (state.guppies.length === 0) {
        openModal('게임 오버', '모든 구피가 사망했습니다. 새로고침하여 다시 시작하세요.');
        return;
      }
      // 다음 날 환경 변화
      if (Math.random() < 0.5 && state.waterIdx > 0) state.waterIdx--;
      if (Math.random() < 0.6 && state.mossIdx < 3) state.mossIdx++;
      if (!state.bug && state.waterIdx === 0 && Math.random() < 0.3) state.bug = true;

      state.day++;
      state.minutes = 420;
      state.cleanedToday = false;
      state.fedCount = 0;
      state.paused = false;
      updateUI();
    });
  }

  function updateUI() {
    const h = String(Math.floor(state.minutes / 60)).padStart(2, '0');
    const m = String(state.minutes % 60).padStart(2, '0');
    document.getElementById('clock-display').textContent = `${h}:${m}`;
    document.getElementById('stat-water').textContent = `수질:${WATER_LEVELS.at(state.waterIdx)}`;
    document.getElementById('stat-moss').textContent = `이끼:${MOSS_LEVELS.at(state.mossIdx)}`;
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

    ctx.fillStyle = g.species.tail;
    ctx.fillRect(-10, -4, 6, 8);
    ctx.fillRect(-12, -6, 3, 12);

    ctx.fillStyle = g.species.body;
    ctx.fillRect(-4, -3, 10, 6);

    if (g.species.spot) {
      ctx.fillStyle = g.species.spot;
      ctx.fillRect(-2, -1, 2, 2);
      ctx.fillRect(2, 0, 2, 2);
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(3, -2, 2, 2);
    ctx.restore();
  }

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 밤(20:00)에는 어항 어둡게 가림
    if (state.minutes >= 1200) {
      ctx.fillStyle = '#1b2631';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(gameLoop);
      return;
    }

    // 이끼 농도에 따른 물 색깔 변화
    const mossAlpha = [0, 0.1, 0.25, 0.45].at(state.mossIdx);
    if (mossAlpha > 0) {
      ctx.fillStyle = `rgba(39, 174, 96, ${mossAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = state.substrate ? state.substrate.color : '#f5cba7';
    ctx.fillRect(0, 195, canvas.width, 25);

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(30, 165, 6, 30);
    ctx.fillRect(26, 175, 4, 10);
    ctx.fillRect(36, 170, 4, 12);

    ctx.fillStyle = '#784212';
    for (let i = state.foods.length - 1; i >= 0; i--) {
      const f = state.foods.at(i);
      if (!state.paused) f.y += 0.4 * state.speed;
      ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 3, 3);
      if (f.y > 195) state.foods.splice(i, 1);
    }

    state.guppies.forEach(g => {
      if (!state.paused) {
        if (state.foods.length > 0) {
          const target = state.foods.at(0);
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

  document.getElementById('btn-clean-water').onclick = () => {
    if (state.cleanedToday) return;
    state.cleanedToday = true;
    if (state.waterIdx < 2) state.waterIdx++;
    advanceTime(30);
  };

  document.getElementById('btn-clean-wall').onclick = () => {
    if (state.cleanedToday) return;
    state.cleanedToday = true;
    state.mossIdx = 0;
    advanceTime(15);
  };

  document.getElementById('btn-clean-all').onclick = () => {
    if (state.cleanedToday) return;
    state.cleanedToday = true;
    state.waterIdx = 2;
    state.mossIdx = 0;
    state.bug = false;
    advanceTime(120);
  };

  document.getElementById('btn-feed').onclick = () => {
    if (state.gold < 1 || state.cleanedToday) return;
    state.gold -= 1;
    state.fedCount++;
    for (let i = 0; i < 4; i++) {
      state.foods.push({ x: 50 + Math.random() * 160, y: 10 });
    }
    updateUI();
  };

  document.getElementById('btn-dex').onclick = () => {
    const list = SPECIES_LIST.map(s => {
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
});
