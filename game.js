window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tank-canvas');
  const ctx = canvas.getContext('2d');

  const SPECIES_LIST = (typeof GUPPY_SPECIES !== 'undefined') ? GUPPY_SPECIES : [];
  const ITEMS_LIST = (typeof SHOP_ITEMS !== 'undefined') ? SHOP_ITEMS : [];

  const WATER_LEVELS = ['나쁨', '보통', '좋음'];
  const MOSS_LEVELS = ['없음', '약간', '중간', '많음'];

  const state = {
    gold: 10,
    day: 1,
    minutes: 420,
    paused: false,
    speed: 1,
    waterIdx: 2,
    mossIdx: 0,
    bug: false,
    cleanedToday: false,
    fedCount: 0,
    hasNursery: false,
    dexCompleted: false,
    guppies: [],
    foods: [],
    dex: ['red_tail'],
    equippedDecos: [],
    substrate: null
  };

  function initGame() {
    state.guppies = [
      createGuppy('red_tail', 80, 100, true),
      createGuppy('red_tail', 160, 130, true)
    ];
    updateUI();
    requestAnimationFrame(gameLoop);
  }

  function createGuppy(speciesId, x, y, isAdult) {
    const sp = SPECIES_LIST.find(s => s.id === speciesId) || SPECIES_LIST.at(0);
    return {
      species: sp,
      isAdult: isAdult,
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

    let deadCount = 0;

    // 기생충 확정 사망 (1~5마리)
    if (state.bug) {
      const kill = Math.min(state.guppies.length, Math.floor(Math.random() * 5) + 1);
      state.guppies.splice(0, kill);
      deadCount += kill;
    }

    // 수질 나쁨 사망 확률
    if (state.waterIdx === 0 && state.guppies.length > 0 && Math.random() < 0.4) {
      state.guppies.pop();
      deadCount++;
    }

    // 밤사이 새끼 포식 및 이끼 많음 사망 판정
    for (let i = state.guppies.length - 1; i >= 0; i--) {
      const g = state.guppies.at(i);
      if (!g.isAdult) {
        const eatenChance = state.hasNursery ? 0 : 0.5;
        const mossKillChance = state.mossIdx === 3 ? 0.35 : 0;
        if (Math.random() < eatenChance || Math.random() < mossKillChance) {
          state.guppies.splice(i, 1);
          deadCount++;
        }
      }
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
        openModal('게임 오버', '모든 구피가 사망했습니다. 브라우저를 새로고침하여 다시 시작하세요.');
        return;
      }
      startNextMorning();
    });
  }

  function startNextMorning() {
    let morningNews = [];

    // 1. 기존 새끼 구피 성체로 성장 및 도감 체크
    state.guppies.forEach(g => {
      if (!g.isAdult) {
        g.isAdult = true;
        if (!state.dex.includes(g.species.id)) {
          state.dex.push(g.species.id);
          state.gold += g.species.bonus;
          morningNews.push(`[신품종 발견] ${g.species.name} (${g.species.rarity}) 등록! +${g.species.bonus}G`);
        }
      }
    });

    // 2. 도감 14종 완성 체크
    if (!state.dexCompleted && state.dex.length >= SPECIES_LIST.length) {
      state.dexCompleted = true;
      state.gold += 1000;
      morningNews.push('<b>[축하합니다!] 물고기 도감 14종을 모두 완성했습니다! 보너스 +1000G 지급!</b>');
    }

    // 3. 아침 새끼 탄생 확률 (구피 수 적을수록 높음, 30마리 초과 시 중단)
    const pop = state.guppies.length;
    if (pop >= 2 && pop <= 30) {
      const birthChance = Math.max(0.15, 0.85 - (pop * 0.025));
      if (Math.random() < birthChance) {
        const babyCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < babyCount; i++) {
          const isRare = Math.random() < 0.15;
          const pool = SPECIES_LIST.filter(s => isRare ? s.rarity === '희귀' : s.rarity === '일반');
          const picked = pool.at(Math.floor(Math.random() * pool.length));
          const bx = state.hasNursery ? 200 + Math.random() * 40 : 60 + Math.random() * 140;
          const by = state.hasNursery ? 25 + Math.random() * 20 : 120 + Math.random() * 50;
          state.guppies.push(createGuppy(picked.id, bx, by, false));
        }
        morningNews.push(`아침이 되어 새끼 구피 ${babyCount}마리가 태어났습니다!`);
      }
    }

    // 4. 환경 자연 변화
    if (Math.random() < 0.5 && state.waterIdx > 0) state.waterIdx--;
    if (Math.random() < 0.6 && state.mossIdx < 3) state.mossIdx++;
    if (!state.bug && state.waterIdx === 0 && Math.random() < 0.3) state.bug = true;

    state.day++;
    state.minutes = 420;
    state.cleanedToday = false;
    state.fedCount = 0;

    if (morningNews.length > 0) {
      openModal(`${state.day}일차 아침 소식`, morningNews.join('<br><br>'), () => {
        state.paused = false;
        updateUI();
      });
    } else {
      state.paused = false;
      updateUI();
    }
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
    const scale = g.isAdult ? 1 : 0.6;
    ctx.save();
    ctx.translate(Math.floor(g.x), Math.floor(g.y));
    ctx.scale(dir * scale, scale);

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

  function drawDecorations() {
    state.equippedDecos.forEach((deco, idx) => {
      const dx = idx === 0 ? 75 : 175;
      ctx.fillStyle = deco.id.includes('ship') ? '#873600' :
                      deco.id.includes('coral') || deco.id.includes('star') ? '#ec7063' :
                      deco.id.includes('shell') ? '#f7dc6f' :
                      deco.id.includes('rock') ? '#7f8c8d' : '#229954';
      ctx.fillRect(dx, 172, 22, 23);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx + 4, 176, 4, 4);
    });

    if (state.hasNursery) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(190, 14, 60, 42);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(190, 14, 60, 42);
    }
  }

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.minutes >= 1200) {
      ctx.fillStyle = '#1b2631';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(gameLoop);
      return;
    }

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

    drawDecorations();

    ctx.fillStyle = '#784212';
    for (let i = state.foods.length - 1; i >= 0; i--) {
      const f = state.foods.at(i);
      if (!state.paused) f.y += 0.4 * Math.min(state.speed, 3);
      ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 3, 3);
      if (f.y > 195) state.foods.splice(i, 1);
    }

    state.guppies.forEach(g => {
      if (!state.paused) {
        const moveSpd = Math.min(state.speed, 3);
        if (!g.isAdult && state.hasNursery) {
          g.x += g.vx * 0.5;
          g.y += g.vy * 0.5;
          if (g.x < 196 || g.x > 244) g.vx *= -1;
          if (g.y < 20 || g.y > 50) g.vy *= -1;
        } else {
          if (state.foods.length > 0) {
            const target = state.foods.at(0);
            const dx = target.x - g.x;
            const dy = target.y - g.y;
            const dist = Math.hypot(dx, dy);
