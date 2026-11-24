const state = {
  day: 1,
  minutes: 7 * 60,
  speed: 1,
  gold: 10,
  guppies: [],
  foodGivenToday: 0,
  foods: [],
  waterLevel: 0,
  mossLevel: 0,
  hasParasite: false,
  cleanedToday: false,
  isCleaning: false,
  cleanTimer: 0,
  unlockedDex: new Set(['red_tail'])
};

const canvas = document.getElementById('tank-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const logBar = document.getElementById('log-bar');
const actionOverlay = document.getElementById('action-overlay');

function setLog(msg) {
  logBar.textContent = msg;
}

// 어항 크기를 휴대폰 비율에 맞춰 도트 해상도(가로 240px 고정, 세로 비율 자동)로 세팅
function resizeTankCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = 240;
    canvas.height = Math.round(240 * (rect.height / rect.width));
  }
}

window.addEventListener('resize', resizeTankCanvas);

document.getElementById('btn-start').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resizeTankCanvas();

  state.guppies = [
    new Guppy('red_tail', false, canvas.width, canvas.height),
    new Guppy('red_tail', false, canvas.width, canvas.height)
  ];
  updateUI();
  requestAnimationFrame(gameLoop);
});

document.getElementById('btn-pause').addEventListener('click', () => {
  state.speed = state.speed === 0 ? 1 : 0;
  document.getElementById('btn-pause').textContent = state.speed === 0 ? '재생' : '정지';
});

document.getElementById('btn-speed').addEventListener('click', () => {
  if (state.speed === 0) state.speed = 1;
  else if (state.speed === 1) state.speed = 3;
  else state.speed = 1;
  document.getElementById('btn-pause').textContent = '정지';
  document.getElementById('btn-speed').textContent = `${state.speed}X`;
});

document.getElementById('btn-feed').addEventListener('click', () => {
  if (state.isCleaning) return;
  if (state.gold < 1) {
    setLog('골드가 부족합니다. (1숟갈 = 1G)');
    return;
  }
  state.gold -= 1;
  state.foodGivenToday += 1;
  for (let i = 0; i < 6; i++) {
    state.foods.push({
      x: 20 + Math.random() * (canvas.width - 40),
      y: 10 + Math.random() * 15
    });
  }
  setLog(`사료 급여 완료 (오늘 ${state.foodGivenToday}숟갈)`);
  updateUI();
});

function startCleaning(durationMin, label, callback) {
  if (state.cleanedToday || state.isCleaning) return;
  state.cleanedToday = true;
  state.isCleaning = true;
  state.cleanTimer = durationMin;
  actionOverlay.textContent = `${label} 중 (${durationMin}분)`;
  actionOverlay.classList.remove('hidden');
  setLog(`${label}을(를) 시작합니다.`);
  state.onCleanFinish = callback;
  updateUI();
}

document.getElementById('btn-water').addEventListener('click', () => {
  startCleaning(30, '물 갈기', () => {
    state.waterLevel = Math.max(0, state.waterLevel - 1);
    setLog('물 갈기 완료: 수질이 한 단계 좋아졌습니다.');
  });
});

document.getElementById('btn-wall').addEventListener('click', () => {
  startCleaning(15, '벽 닦기', () => {
    state.mossLevel = 0;
    setLog('벽 닦기 완료: 이끼가 제거되었습니다.');
  });
});

document.getElementById('btn-clean-all').addEventListener('click', () => {
  startCleaning(120, '전체청소', () => {
    state.waterLevel = 0;
    state.mossLevel = 0;
    state.hasParasite = false;
    setLog('전체청소 완료: 어항이 깨끗해졌습니다.');
  });
});

document.getElementById('btn-dex').addEventListener('click', () => {
  setLog(`도감 진행률: ${state.unlockedDex.size} / 14종`);
});

document.getElementById('btn-shop').addEventListener('click', () => {
  setLog('상점은 2단계에서 추가됩니다.');
});

let lastTick = performance.now();
function gameLoop(now) {
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (state.speed > 0 && state.minutes < 20 * 60) {
    const prevMin = Math.floor(state.minutes);
    state.minutes += dt * state.speed;
    const currMin = Math.floor(state.minutes);

    if (currMin > prevMin) {
      const diff = currMin - prevMin;
      if (state.isCleaning) {
        state.cleanTimer -= diff;
        if (state.cleanTimer <= 0) {
          state.isCleaning = false;
          actionOverlay.classList.add('hidden');
          if (state.onCleanFinish) state.onCleanFinish();
        }
      }
      updateUI();
    }

    if (state.minutes >= 20 * 60) {
      state.minutes = 20 * 60;
      triggerNightPhase();
    }
  }

  renderTank();
  requestAnimationFrame(gameLoop);
}

function renderTank() {
  ctx.fillStyle = state.waterLevel === 0 ? '#48cae4' : state.waterLevel === 1 ? '#64dfdf' : '#8d99ae';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 바닥재
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

  // 사료
  ctx.fillStyle = '#7f4f24';
  state.foods.forEach(f => {
    if (state.speed > 0) f.y += 0.3 * state.speed;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), 3, 3);
  });
  state.foods = state.foods.filter(f => f.y < canvas.height - 14);

  // 구피
  state.guppies.forEach(g => {
    g.update(canvas.width, canvas.height, state.speed);
    g.draw(ctx);
  });

  // 이끼
  if (state.mossLevel > 0) {
    ctx.fillStyle = `rgba(45, 106, 79, ${state.mossLevel * 0.25})`;
    const b = state.mossLevel * 4;
    ctx.fillRect(0, 0, canvas.width, b);
    ctx.fillRect(0, 0, b, canvas.height);
    ctx.fillRect(canvas.width - b, 0, b, canvas.height);
  }
}

function triggerNightPhase() {
  const totalCount = state.guppies.length;
  const recommendedFood = totalCount * (state.mossLevel === 1 ? 2 : 3);
  let score = 100;
  let deadCount = 0;

  if (state.foodGivenToday < recommendedFood) {
    const shortage = recommendedFood - state.foodGivenToday;
    score -= shortage * 10;
    if (state.foodGivenToday === 0) deadCount += 1;
  } else if (state.foodGivenToday > recommendedFood + totalCount) {
    state.waterLevel = Math.min(2, state.waterLevel + 1);
    score -= 10;
  }

  if (state.mossLevel === 2) score -= 5;
  if (state.mossLevel === 3) score -= 10;
  if (state.waterLevel === 1) score -= 5;
  if (state.waterLevel === 2) {
    score -= 15;
    if (Math.random() < 0.5) deadCount += 1;
  }
  if (totalCount > 30) score -= 10;
  if (state.hasParasite) {
    score -= 15;
    deadCount += Math.floor(Math.random() * 5) + 1;
  }

  score = Math.max(0, score);
  deadCount = Math.min(state.guppies.length, deadCount);

  for (let i = 0; i < deadCount; i++) {
    state.guppies.pop();
  }

  state.gold += score;

  const reportEl = document.getElementById('night-report');
  reportEl.innerHTML = `
    <p>- 오늘 급여: ${state.foodGivenToday}숟갈 (권장 ${recommendedFood}숟갈)</p>
    <p>- 종합 점수: <strong>${score}점</strong> (+${score}G)</p>
    <p>- 생존: <strong>${state.guppies.length}마리</strong> / 사망: <strong>${deadCount}마리</strong></p>
  `;
  document.getElementById('night-modal').classList.remove('hidden');
}

document.getElementById('btn-next-day').addEventListener('click', () => {
  document.getElementById('night-modal').classList.add('hidden');

  if (state.guppies.length === 0) {
    document.getElementById('gameover-modal').classList.remove('hidden');
    return;
  }

  state.day += 1;
  state.minutes = 7 * 60;
  state.foodGivenToday = 0;
  state.cleanedToday = false;

  if (Math.random() < 0.45) state.mossLevel = Math.min(3, state.mossLevel + 1);
  if (Math.random() < 0.35) state.waterLevel = Math.min(2, state.waterLevel + 1);
  if (!state.hasParasite && state.waterLevel === 2 && Math.random() < 0.3) {
    state.hasParasite = true;
  }

  setLog(`DAY ${state.day} 아침이 밝았습니다.`);
  updateUI();
});

function updateUI() {
  const h = String(Math.floor(state.minutes / 60)).padStart(2, '0');
  const m = String(Math.floor(state.minutes % 60)).padStart(2, '0');
  document.getElementById('game-day').textContent = `DAY ${state.day}`;
  document.getElementById('game-clock').textContent = `${h}:${m}`;

  const adults = state.guppies.filter(g => !g.isBaby).length;
  const babies = state.guppies.filter(g => g.isBaby).length;
  document.getElementById('stat-count').textContent = `성체:${adults} 새끼:${babies}`;
  document.getElementById('stat-gold').textContent = `${state.gold}G`;
  document.getElementById('stat-water').textContent = `수질:${WATER_LEVELS[state.waterLevel]}`;
  document.getElementById('stat-moss').textContent = `이끼:${MOSS_LEVELS[state.mossLevel]}`;

  document.getElementById('stat-parasite').classList.toggle('hidden', !state.hasParasite);
  document.getElementById('stat-overcrowd').classList.toggle('hidden', state.guppies.length <= 30);

  const disableClean = state.cleanedToday || state.isCleaning;
  document.getElementById('btn-water').disabled = disableClean;
  document.getElementById('btn-wall').disabled = disableClean;
  document.getElementById('btn-clean-all').disabled = disableClean;
  document.getElementById('btn-feed').disabled = state.isCleaning;
}
