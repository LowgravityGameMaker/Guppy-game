const SAVE_KEY = 'guppy_tank_save_v1';
const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 17 * 60;

const state = {
  day: 1,
  minutes: DAY_START_MIN,
  speed: 1,
  prevSpeedBeforeShop: 1,
  gold: 10,
  reputation: 0,
  orders: [],
  guppies: [],
  foodGivenToday: 0,
  foods: [],
  bubbles: [],
  hasSpecialTreat: false,
  waterLevel: 0,
  mossLevel: 0,
  hasParasite: false,
  cleanedToday: false,
  isCleaning: false,
  cleanTimer: 0,
  hasBabyBox: false,
  equippedDecors: [],
  equippedSubstrate: null,
  unlockedDex: new Set(['red_tail']),
  dexCompletedRewarded: false,
  lastPlayTime: 0
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

function saveGame() {
  const payload = {
    day: state.day,
    minutes: state.minutes,
    gold: state.gold,
    reputation: state.reputation,
    orders: state.orders,
    waterLevel: state.waterLevel,
    mossLevel: state.mossLevel,
    hasParasite: state.hasParasite,
    cleanedToday: state.cleanedToday,
    foodGivenToday: state.foodGivenToday,
    hasSpecialTreat: state.hasSpecialTreat,
    hasBabyBox: state.hasBabyBox,
    equippedDecors: state.equippedDecors,
    equippedSubstrate: state.equippedSubstrate,
    unlockedDex: Array.from(state.unlockedDex),
    dexCompletedRewarded: state.dexCompletedRewarded,
    guppies: state.guppies.map(g => ({
      speciesId: g.species.id,
      isBaby: g.isBaby,
      ageDays: g.ageDays
    }))
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    state.day = data.day || 1;
    state.minutes = Math.max(DAY_START_MIN, data.minutes || DAY_START_MIN);
    state.gold = data.gold ?? 10;
    state.reputation = data.reputation || 0;
    state.orders = data.orders || [];
    state.waterLevel = data.waterLevel || 0;
    state.mossLevel = data.mossLevel || 0;
    state.hasParasite = !!data.hasParasite;
    state.cleanedToday = !!data.cleanedToday;
    state.foodGivenToday = data.foodGivenToday || 0;
    state.hasSpecialTreat = !!data.hasSpecialTreat;
    state.hasBabyBox = !!data.hasBabyBox;
    state.equippedDecors = data.equippedDecors || [];
    state.equippedSubstrate = data.equippedSubstrate || null;
    state.unlockedDex = new Set(data.unlockedDex || ['red_tail']);
    state.dexCompletedRewarded = !!data.dexCompletedRewarded;
    state.guppies = (data.guppies || []).map(g => {
      const fish = new Guppy(g.speciesId, g.isBaby, canvas.width, canvas.height);
      fish.ageDays = g.ageDays ?? (g.isBaby ? 0 : 2);
      return fish;
    });
    if (state.orders.length === 0) fillInitialOrders();
    return state.guppies.length > 0;
  } catch (e) {
    return false;
  }
}

(function checkSavedData() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.guppies && data.guppies.length > 0) {
        const contBtn = document.getElementById('btn-continue');
        contBtn.textContent = `CONTINUE (${data.day}일차)`;
        contBtn.classList.remove('hidden');
      }
    } catch (e) {}
  }
})();

function resizeTankCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = 240;
    canvas.height = Math.round(240 * (rect.height / rect.width));
  }
}

window.addEventListener('resize', resizeTankCanvas);

document.getElementById('btn-sound').addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  document.getElementById('btn-sound').textContent = isMuted ? '소리:끔' : '소리:켬';
  if (!isMuted) sound.playPop();
});

canvas.addEventListener('click', e => {
  if (state.isCleaning || state.minutes >= DAY_END_MIN) return;
  const rect = canvas.getBoundingClientRect();
  const tapX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const tapY = ((e.clientY - rect.top) / rect.height) * canvas.height;

  for (let i = state.bubbles.length - 1; i >= 0; i--) {
    const b = state.bubbles[i];
    if (Math.hypot(b.x - tapX, b.y - tapY) <= 22) {
      state.bubbles.splice(i, 1);
      state.gold += 1;
      sound.playPop();
      setLog('큰 공기방울을 터뜨렸습니다! (+1G)');
      saveGame();
      updateUI();
      return;
    }
  }

  for (let i = state.guppies.length - 1; i >= 0; i--) {
    const g = state.guppies[i];
    if (Math.hypot(g.x - tapX, g.y - tapY) <= 32) {
      if (typeof g.playWith === 'function') {
        g.playWith();
      }
      const now = Date.now();
      if (now - state.lastPlayTime >= 800 && Math.random() < 0.4) {
        state.lastPlayTime = now;
        state.gold += 1;
        sound.playCoin();
        setLog(`${g.species.name}와 놀아주어 +1G 획득!`);
        saveGame();
        updateUI();
      } else {
        sound.playPop();
        setLog(`${g.species.name}가 반가워합니다!`);
      }
      break;
    }
  }
});
document.getElementById('btn-continue').addEventListener('click', () => {
  sound.playChime();
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resizeTankCanvas();
  if (loadGame()) {
    setLog(`${state.day}일차 어항을 불러왔습니다.`);
    updateUI();
    requestAnimationFrame(gameLoop);
  }
});

document.getElementById('btn-start').addEventListener('click', () => {
  sound.playChime();
  localStorage.removeItem(SAVE_KEY);
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resizeTankCanvas();

  state.guppies = [
    new Guppy('red_tail', false, canvas.width, canvas.height),
    new Guppy('red_tail', false, canvas.width, canvas.height)
  ];
  state.orders = [];
  fillInitialOrders();
  saveGame();
  updateUI();
  requestAnimationFrame(gameLoop);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
});

document.getElementById('btn-pause').addEventListener('click', () => {
  sound.playPop();
  state.speed = state.speed === 0 ? 1 : 0;
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.textContent = state.speed === 0 ? '재생' : '정지';
});

document.getElementById('btn-speed').addEventListener('click', () => {
  sound.playPop();
  if (state.speed === 0) state.speed = 1;
  else if (state.speed === 1) state.speed = 3;
  else state.speed = 1;

  document.getElementById('btn-pause').textContent = '정지';
  document.getElementById('btn-speed').textContent = `${state.speed}배속`;
});

document.getElementById('btn-feed').addEventListener('click', () => {
  if (state.isCleaning) return;
  if (state.gold < 1) {
    setLog('골드가 부족합니다. (1숟갈 = 1G)');
    return;
  }
  sound.playFeed();
  state.gold -= 1;
  state.foodGivenToday += 1;
  for (let i = 0; i < 6; i++) {
    state.foods.push({
      x: 20 + Math.random() * (canvas.width - 40),
      y: 10 + Math.random() * 15,
      eaten: false,
      isTreat: false
    });
  }
  setLog(`사료 급여 완료 (오늘 ${state.foodGivenToday}숟갈)`);
  updateUI();
});

function startCleaning(durationMin, cost, label, callback) {
  if (state.cleanedToday || state.isCleaning) return;
  if (state.gold < cost) {
    setLog(`골드가 부족합니다! (${label}: ${cost}G 필요)`);
    return;
  }
  sound.playPop();
  state.gold -= cost;
  state.cleanedToday = true;
  state.isCleaning = true;
  state.cleanTimer = durationMin;
  actionOverlay.textContent = `${label} 중 (${durationMin}분)`;
  actionOverlay.classList.remove('hidden');
  setLog(`${label} 시작 (-${cost}G 차감)`);
  state.onCleanFinish = callback;
  saveGame();
  updateUI();
}

document.getElementById('btn-water').addEventListener('click', () => {
  startCleaning(30, 5, '물 갈기', () => {
    sound.playChime();
    state.waterLevel = Math.max(0, state.waterLevel - 1);
    setLog('물 갈기 완료: 수질이 한 단계 좋아졌습니다.');
    saveGame();
  });
});

document.getElementById('btn-wall').addEventListener('click', () => {
  startCleaning(15, 3, '벽 닦기', () => {
    sound.playChime();
    state.mossLevel = 0;
    setLog('벽 닦기 완료: 이끼가 제거되었습니다.');
    saveGame();
  });
});

document.getElementById('btn-clean-all').addEventListener('click', () => {
  startCleaning(120, 15, '전체청소', () => {
    sound.playChime();
    state.waterLevel = 0;
    state.mossLevel = 0;
    state.hasParasite = false;
    setLog('전체청소 완료: 어항이 깨끗해졌습니다.');
    saveGame();
  });
});

let lastTick = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastTick) / 1000, 0.1);
  lastTick = now;

  if (state.speed > 0 && state.minutes < DAY_END_MIN) {
    const prevMin = Math.floor(state.minutes);
    state.minutes += dt * state.speed;
    const currMin = Math.floor(state.minutes);

    if (!state.isCleaning) {
      if (state.bubbles.length < 3 && Math.random() < 0.012 * state.speed) {
        state.bubbles.push({
          x: 20 + Math.random() * (canvas.width - 40),
          y: canvas.height - 18,
          wobble: Math.random() * 10
        });
      }
    }

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

    if (state.minutes >= DAY_END_MIN) {
      state.minutes = DAY_END_MIN;
      triggerNightPhase();
    }
  }

  renderTank();
  requestAnimationFrame(gameLoop);
}
function renderTank() {
  if (state.waterLevel === 0) ctx.fillStyle = '#48cae4';
  else if (state.waterLevel === 1) ctx.fillStyle = '#64dfdf';
  else ctx.fillStyle = '#8d99ae';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const subItem = SHOP_ITEMS.find(i => i.id === state.equippedSubstrate);
  ctx.fillStyle = subItem ? subItem.color : '#e9c46a';
  ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

  state.equippedDecors.forEach((decorId, idx) => {
    const baseX = idx === 0 ? 36 : canvas.width - 64;
    const baseY = canvas.height - 14;
    drawDecorSprite(ctx, decorId, baseX, baseY);
  });

  if (state.hasBabyBox) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - 68, 8, 60, 42);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(canvas.width - 68, 8, 60, 42);
  }

  state.guppies.forEach(g => {
    g.update(
      canvas.width,
      canvas.height,
      state.speed,
      state.foods,
      state.hasBabyBox
    );
    g.draw(ctx);
  });

  state.bubbles = state.bubbles.filter(b => b.y > 10);
  state.bubbles.forEach(b => {
    if (state.speed > 0) {
      b.y -= 0.35 * state.speed;
      b.wobble += 0.1 * state.speed;
      b.x += Math.sin(b.wobble) * 0.25;
    }
    const bx = Math.round(b.x);
    const by = Math.round(b.y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 5, by - 5, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 3, by - 3, 2, 2);
  });

  state.foods = state.foods.filter(f => !f.eaten && f.y < canvas.height - 14);
  state.foods.forEach(f => {
    if (state.speed > 0) f.y += 0.25 * state.speed;
    ctx.fillStyle = f.isTreat ? '#ff4d6d' : '#7f4f24';
    const size = f.isTreat ? 4 : 3;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), size, size);
  });

  if (state.mossLevel > 0) {
    ctx.fillStyle = `rgba(45, 106, 79, ${state.mossLevel * 0.25})`;
    const b = state.mossLevel * 4;
    ctx.fillRect(0, 0, canvas.width, b);
    ctx.fillRect(0, 0, b, canvas.height);
    ctx.fillRect(canvas.width - b, 0, b, canvas.height);
  }
}

function drawDecorSprite(ctx, id, x, y) {
  ctx.save();
  if (id.includes('plant')) {
    ctx.fillStyle = id.includes('fake') ? '#40916c' : '#2d6a4f';
    ctx.fillRect(x, y - 28, 4, 28);
    ctx.fillRect(x - 4, y - 22, 4, 8);
    ctx.fillRect(x + 4, y - 16, 4, 8);
  } else if (id === 'fake_coral') {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(x, y - 20, 14, 20);
    ctx.fillRect(x - 4, y - 16, 4, 10);
    ctx.fillRect(x + 14, y - 18, 4, 12);
  } else if (id === 'sunken_ship') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(x - 6, y - 16, 30, 16);
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x + 6, y - 30, 3, 14);
  } else if (id === 'shell') {
    ctx.fillStyle = '#ffccd5';
    ctx.fillRect(x, y - 10, 14, 10);
  } else if (id === 'starfish') {
    ctx.fillStyle = '#f77f00';
    ctx.fillRect(x + 4, y - 12, 4, 12);
    ctx.fillRect(x, y - 8, 12, 4);
  } else {
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(x, y - 14, 20, 14);
  }
  ctx.restore();
}

function triggerNightPhase() {
  state.bubbles = [];

  if (state.isCleaning) {
    state.isCleaning = false;
    state.cleanTimer = 0;
    actionOverlay.classList.add('hidden');
    if (state.onCleanFinish) {
      state.onCleanFinish();
      state.onCleanFinish = null;
    }
  }

  const totalCount = state.guppies.length;
  const perFish = state.mossLevel === 1 ? 2 : 3;
  const recommendedFood = totalCount * perFish;
  let score = 100;
  let envDeadCount = 0;
  let eatenCount = 0;

  if (state.foodGivenToday < recommendedFood) {
    const shortage = recommendedFood - state.foodGivenToday;
    score -= shortage * 10;
    if (state.foodGivenToday === 0) envDeadCount += 1;
  } else if (state.foodGivenToday > recommendedFood + totalCount) {
    state.waterLevel = Math.min(2, state.waterLevel + 1);
    score -= 10;
  }

  state.equippedDecors.forEach(id => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (item) score += item.score;
  });

  if (state.equippedSubstrate) {
    const sub = SHOP_ITEMS.find(i => i.id === state.equippedSubstrate);
    if (sub) score += sub.score;
  }

  if (state.mossLevel === 2) score -= 5;
  if (state.mossLevel === 3) score -= 10;
  if (state.waterLevel === 1) score -= 5;
  if (state.waterLevel === 2) {
    score -= 15;
    if (Math.random() < 0.5) envDeadCount += 1;
  }
  if (totalCount > 30) score -= 10;
  if (state.hasParasite) {
    score -= 15;
    envDeadCount += Math.floor(Math.random() * 5) + 1;
  }

  if (!state.hasBabyBox) {
    state.guppies = state.guppies.filter(g => {
      if (!g.isBaby) return true;
      const eatChance = state.mossLevel === 3 ? 0.65 : 0.4;
      if (Math.random() < eatChance) {
        eatenCount += 1;
        return false;
      }
      return true;
    });
  }

  score = Math.min(100, Math.max(0, score));
  envDeadCount = Math.min(state.guppies.length, envDeadCount);

  for (let i = 0; i < envDeadCount; i++) {
    state.guppies.pop();
  }

  const totalDead = eatenCount + envDeadCount;
  state.gold += score;
  saveGame();

  const reportEl = document.getElementById('night-report');
  reportEl.innerHTML = `
    <p>- 오늘 급여: ${state.foodGivenToday}숟갈 (권장 ${recommendedFood}숟갈)</p>
    <p>- 종합 점수: <strong>${score}점</strong> (+${score}G)</p>
    <p>- 생존: <strong>${state.guppies.length}마리</strong> / 사망: <strong>${totalDead}마리</strong></p>
  `;
  document.getElementById('night-modal').classList.remove('hidden');
}

document.getElementById('btn-next-day').addEventListener('click', () => {
  document.getElementById('night-modal').classList.add('hidden');

  if (state.guppies.length === 0) {
    localStorage.removeItem(SAVE_KEY);
    document.getElementById('gameover-modal').classList.remove('hidden');
    return;
  }

  state.day += 1;
  state.minutes = DAY_START_MIN;
  state.foodGivenToday = 0;
  state.cleanedToday = false;

  state.orders.forEach(o => { o.daysLeft -= 1; });
  const expiredCount = state.orders.filter(o => o.daysLeft <= 0).length;
  state.orders = state.orders.filter(o => o.daysLeft > 0);
  while (state.orders.length < 3) {
    state.orders.push(generateNewOrder());
  }

  state.guppies.forEach(g => {
    g.ageDays += 1;
    if (g.isBaby && g.ageDays >= 2) {
      g.isBaby = false;
    }
  });

  const adults = state.guppies.filter(g => !g.isBaby);
  let birthMsg = '';
  if (adults.length >= 2 && state.guppies.length <= 30) {
    const baseProb = Math.max(0.25, 0.85 - state.guppies.length * 0.02);
    const birthProb = state.hasSpecialTreat ? Math.min(0.95, baseProb + 0.15) : baseProb;

    if (Math.random() < birthProb) {
      const newSpecies = pickOffspringSpecies(adults, state.hasSpecialTreat);
      const baby = new Guppy(newSpecies.id, true, canvas.width, canvas.height);
      state.guppies.push(baby);

      if (!state.unlockedDex.has(newSpecies.id)) {
        sound.playChime();
        state.unlockedDex.add(newSpecies.id);
        const bonus = newSpecies.rarity === 'rare' ? 150 : 40;
        state.gold += bonus;
        birthMsg = ` 신종 [${newSpecies.name}] 탄생! (+${bonus}G)`;

        if (state.unlockedDex.size === 14 && !state.dexCompletedRewarded) {
          state.dexCompletedRewarded = true;
          state.gold += 1000;
          alert('축하합니다! 14종 구피 도감을 모두 완성했습니다! (+1000G)');
        }
      } else {
        sound.playPop();
        birthMsg = ` 새끼 [${newSpecies.name}]가 태어났습니다!`;
      }
    }
  }

  state.hasSpecialTreat = false;

  if (Math.random() < 0.45) state.mossLevel = Math.min(3, state.mossLevel + 1);
  if (Math.random() < 0.35) state.waterLevel = Math.min(2, state.waterLevel + 1);
  if (!state.hasParasite && state.waterLevel === 2 && Math.random() < 0.3) {
    state.hasParasite = true;
  }

  const orderMsg = expiredCount > 0 ? ` (만료 주문 ${expiredCount}건 교체)` : '';
  saveGame();
  setLog(`${state.day}일차 아침!${birthMsg}${orderMsg}`);
  updateUI();
});

function pickOffspringSpecies(adults, boostRare = false) {
  const rareChance = boostRare ? 0.55 : 0.2;
  if (Math.random() < rareChance) {
    const rarePool = GUPPY_SPECIES.filter(s => s.rarity === 'rare');
    return rarePool[Math.floor(Math.random() * rarePool.length)];
  }

  if (adults && adults.length > 0 && Math.random() < 0.65) {
    const parent = adults[Math.floor(Math.random() * adults.length)];
    return parent.species;
  }

  const normalPool = GUPPY_SPECIES.filter(s => s.rarity === 'normal');
  return normalPool[Math.floor(Math.random() * normalPool.length)];
}
