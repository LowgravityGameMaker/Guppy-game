// 게임 상태
const state = {
  day: 1,
  minutes: 7 * 60, // 07:00 = 420분
  speed: 1,        // 0: 일시정지, 1: 1배속, 3: 3배속
  gold: 10,
  guppies: [],
  foodGivenToday: 0,
  foods: [],       // 어항 속 떨어지는 사료 입자
  waterLevel: 0,   // 0: 좋음, 1: 보통, 2: 나쁨
  mossLevel: 0,    // 0: 없음, 1: 약간, 2: 중간, 3: 많음
  hasParasite: false,
  cleanedToday: false,
  isCleaning: false,
  cleanTimer: 0,
  unlockedDex: new Set(['red_tail'])
};

const canvas = document.getElementById('tank-canvas');
const ctx = canvas.getContext('2d');

// UI 요소 연결
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const logBar = document.getElementById('log-bar');
const actionOverlay = document.getElementById('action-overlay');

function setLog(msg) {
  logBar.textContent = msg;
}

// 게임 시작
document.getElementById('btn-start').addEventListener('click', () => {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  state.guppies = [
    new Guppy('red_tail', false, canvas.width, canvas.height),
    new Guppy('red_tail', false, canvas.width, canvas.height)
  ];
  updateUI();
  requestAnimationFrame(gameLoop);
});

// 일시정지 / 배속 버튼
document.getElementById('btn-pause').addEventListener('click', () => {
  state.speed = state.speed === 0 ? 1 : 0;
  document.getElementById('btn-pause').textContent = state.speed === 0 ? '▶️' : '⏸️';
});

document.getElementById('btn-speed').addEventListener('click', () => {
  if (state.speed === 0) state.speed = 1;
  else if (state.speed === 1) state.speed = 3;
  else state.speed = 1;
  document.getElementById('btn-pause').textContent = '⏸️';
  document.getElementById('btn-speed').textContent = `${state.speed}x`;
});

// 밥 주기
document.getElementById('btn-feed').addEventListener('click', () => {
  if (state.isCleaning) return;
  if (state.gold < 1) {
    setLog('골드가 부족합니다! (사료 1숟갈 = 1G)');
    return;
  }
  state.gold -= 1;
  state.foodGivenToday += 1;
  for (let i = 0; i < 6; i++) {
    state.foods.push({ x: 40 + Math.random() * 240, y: 10 + Math.random() * 15 });
  }
  setLog(`사료를 주었습니다! (오늘 급여: ${state.foodGivenToday}숟갈)`);
  updateUI();
});

// 청소 실행 공통 함수
function startCleaning(durationMin, label, callback) {
  if (state.cleanedToday || state.isCleaning) return;
  state.cleanedToday = true;
  state.isCleaning = true;
  state.cleanTimer = durationMin;
  actionOverlay.textContent = `${label} 중... (${durationMin}분)`;
  actionOverlay.classList.remove('hidden');
  setLog(`${label}을(를) 시작했습니다.`);
  state.onCleanFinish = callback;
  updateUI();
}

document.getElementById('btn-water').addEventListener('click', () => {
  startCleaning(30, '물 갈기', () => {
    state.waterLevel = Math.max(0, state.waterLevel - 1);
    setLog('물 갈기 완료! 수질이 한 단계 좋아졌습니다.');
  });
});

document.getElementById('btn-wall').addEventListener('click', () => {
  startCleaning(15, '벽 닦기', () => {
    state.mossLevel = 0;
    setLog('벽 닦기 완료! 어항의 이끼가 깨끗해졌습니다.');
  });
});

document.getElementById('btn-clean-all').addEventListener('click', () => {
  startCleaning(120, '전체 청소', () => {
    state.waterLevel = 0;
    state.mossLevel = 0;
    state.hasParasite = false;
    setLog('전체 청소 완료! 수질, 이끼, 기생충이 모두 해결되었습니다.');
  });
});

// 임시 안내 (2~3단계에서 구현 예정)
document.getElementById('btn-dex').addEventListener('click', () => {
  setLog(`도감 해금 현황: ${state.unlockedDex.size} / 14종 (상세 창 2단계 구현 예정)`);
});
document.getElementById('btn-shop').addEventListener('click', () => {
  setLog('상점 기능은 다음 단계에서 추가됩니다!');
});

// 1초마다 게임 내 1분 진행 (배속 반영)
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

    // 밤 8시(20:00 = 1200분) 도달 시 밤 정산
    if (state.minutes >= 20 * 60) {
      state.minutes = 20 * 60;
      triggerNightPhase();
    }
  }

  renderTank();
  requestAnimationFrame(gameLoop);
}

// 어항 렌더링
function renderTank() {
  // 수질에 따른 물 색깔
  const waterColors = ['#48cae4', '#52b69a', '#7678ed'];
  ctx.fillStyle = state.waterLevel === 0 ? '#48cae4' : state.waterLevel === 1 ? '#64dfdf' : '#8d99ae';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 기본 모래 바닥
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

  // 사료 입자 그리기
  ctx.fillStyle = '#7f4f24';
  state.foods.forEach(f => {
    if (state.speed > 0) f.y += 0.3 * state.speed;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), 3, 3);
  });
  state.foods = state.foods.filter(f => f.y < canvas.height - 14);

  // 구피 업데이트 및 그리기
  state.guppies.forEach(g => {
    g.update(canvas.width, canvas.height, state.speed);
    g.draw(ctx);
  });

  // 이끼 표현 (어항 테두리 녹색 도트)
  if (state.mossLevel > 0) {
    ctx.fillStyle = `rgba(45, 106, 79, ${state.mossLevel * 0.25})`;
    ctx.fillRect(0, 0, canvas.width, state.mossLevel * 5);
    ctx.fillRect(0, 0, state.mossLevel * 5, canvas.height);
    ctx.fillRect(canvas.width - state.mossLevel * 5, 0, state.mossLevel * 5, canvas.height);
  }
}

// 밤 정산 로직
function triggerNightPhase() {
  const totalCount = state.guppies.length;
  const recommendedFood = totalCount * (state.mossLevel === 1 ? 2 : 3);
  let score = 100;
  let deadCount = 0;

  // 1. 밥 체크
  if (state.foodGivenToday < recommendedFood) {
    const shortage = recommendedFood - state.foodGivenToday;
    score -= shortage * 10;
    if (state.foodGivenToday === 0) deadCount += 1;
  } else if (state.foodGivenToday > recommendedFood + totalCount) {
    // 과잉 급여 시 수질 악화
    state.waterLevel = Math.min(2, state.waterLevel + 1);
    score -= 10;
  }

  // 2. 이끼/수질/기생충/과포화 점수 차감
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

  // 구피 사망 처리
  for (let i = 0; i < deadCount; i++) {
    state.guppies.pop();
  }

  state.gold += score;

  const reportEl = document.getElementById('night-report');
  reportEl.innerHTML = `
    <p>• 오늘 급여량: ${state.foodGivenToday}숟갈 (권장: ${recommendedFood}숟갈)</p>
    <p>• 종합 점수: <strong>${score}점</strong> (+${score}G 획득)</p>
    <p>• 생존 구피: <strong>${state.guppies.length}마리</strong> / 사망: <strong>${deadCount}마리</strong></p>
  `;
  document.getElementById('night-modal').classList.remove('hidden');
}

// 다음 날 아침으로
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

  // 자연 상태 변화 (이끼/수질/기생충)
  if (Math.random() < 0.45) state.mossLevel = Math.min(3, state.mossLevel + 1);
  if (Math.random() < 0.35) state.waterLevel = Math.min(2, state.waterLevel + 1);
  if (!state.hasParasite && state.waterLevel === 2 && Math.random() < 0.3) {
    state.hasParasite = true;
  }

  setLog(`Day ${state.day} 아침이 밝았습니다!`);
  updateUI();
});

// UI 텍스트 및 버튼 활성화 동기화
function updateUI() {
  const h = String(Math.floor(state.minutes / 60)).padStart(2, '0');
  const m = String(Math.floor(state.minutes % 60)).padStart(2, '0');
  document.getElementById('game-day').textContent = `Day ${state.day}`;
  document.getElementById('game-clock').textContent = `${h}:${m}`;

  const adults = state.guppies.filter(g => !g.isBaby).length;
  const babies = state.guppies.filter(g => g.isBaby).length;
  document.getElementById('stat-count').textContent = `🐟성체:${adults} / 🐣새끼:${babies}`;
  document.getElementById('stat-gold').textContent = `💰${state.gold}G`;
  document.getElementById('stat-water').textContent = `💧수질:${WATER_LEVELS[state.waterLevel]}`;
  document.getElementById('stat-moss').textContent = `🌿이끼:${MOSS_LEVELS[state.mossLevel]}`;

  document.getElementById('stat-parasite').classList.toggle('hidden', !state.hasParasite);
  document.getElementById('stat-overcrowd').classList.toggle('hidden', state.guppies.length <= 30);

  // 청소 중이거나 오늘 이미 청소했으면 버튼 비활성화
  const disableClean = state.cleanedToday || state.isCleaning;
  document.getElementById('btn-water').disabled = disableClean;
  document.getElementById('btn-wall').disabled = disableClean;
  document.getElementById('btn-clean-all').disabled = disableClean;
  document.getElementById('btn-feed').disabled = state.isCleaning;
}
