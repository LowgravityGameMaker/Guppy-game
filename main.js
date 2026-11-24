const SAVE_KEY = 'guppy_tank_save_v1';
const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 17 * 60;

const state = {
  day: 1,
  minutes: DAY_START_MIN,
  speed: 1,
  prevSpeedBeforeShop: 1,
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
    waterLevel: state.waterLevel,
    mossLevel: state.mossLevel,
    hasParasite: state.hasParasite,
    cleanedToday: state.cleanedToday,
    foodGivenToday: state.foodGivenToday,
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
    state.waterLevel = data.waterLevel || 0;
    state.mossLevel = data.mossLevel || 0;
    state.hasParasite = !!data.hasParasite;
    state.cleanedToday = !!data.cleanedToday;
    state.foodGivenToday = data.foodGivenToday || 0;
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

// 모바일 확실한 터치 인식을 위해 click 이벤트 + 넓은 판정 반경(32) 적용
canvas.addEventListener('click', e => {
  if (state.isCleaning || state.minutes >= DAY_END_MIN) return;
  const rect = canvas.getBoundingClientRect();
  const tapX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const tapY = ((e.clientY - rect.top) / rect.height) * canvas.height;

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
        setLog(`${g.species.name}와 놀아주어 +1G 획득!`);
        saveGame();
        updateUI();
      } else {
        setLog(`${g.species.name}가 반가워합니다!`);
      }
      break;
    }
  }
});

document.getElementById('btn-continue').addEventListener('click', () => {
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
  localStorage.removeItem(SAVE_KEY);
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resizeTankCanvas();

  state.guppies = [
    new Guppy('red_tail', false, canvas.width, canvas.height),
    new Guppy('red_tail', false, canvas.width, canvas.height)
  ];
  saveGame();
  updateUI();
  requestAnimationFrame(gameLoop);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
});
document.getElementById('btn-pause').addEventListener('click', () => {
  state.speed = state.speed === 0 ? 1 : 0;
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.textContent = state.speed === 0 ? '재생' : '정지';
});

document.getElementById('btn-speed').addEventListener('click', () => {
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
  state.gold -= 1;
  state.foodGivenToday += 1;
  for (let i = 0; i < 6; i++) {
    state.foods.push({
      x: 20 + Math.random() * (canvas.width - 40),
      y: 10 + Math.random() * 15,
      eaten: false
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
    state.waterLevel = Math.max(0, state.waterLevel - 1);
    setLog('물 갈기 완료: 수질이 한 단계 좋아졌습니다.');
    saveGame();
  });
});

document.getElementById('btn-wall').addEventListener('click', () => {
  startCleaning(15, 3, '벽 닦기', () => {
    state.mossLevel = 0;
    setLog('벽 닦기 완료: 이끼가 제거되었습니다.');
    saveGame();
  });
});

document.getElementById('btn-clean-all').addEventListener('click', () => {
  startCleaning(120, 15, '전체청소', () => {
    state.waterLevel = 0;
    state.mossLevel = 0;
    state.hasParasite = false;
    setLog('전체청소 완료: 어항이 깨끗해졌습니다.');
    saveGame();
  });
});

document.getElementById('btn-dex').addEventListener('click', () => {
  renderDexModal();
  document.getElementById('dex-modal').classList.remove('hidden');
});

document.getElementById('btn-close-dex').addEventListener('click', () => {
  document.getElementById('dex-modal').classList.add('hidden');
});

function renderDexModal() {
  const prog = document.getElementById('dex-progress');
  prog.textContent = `${state.unlockedDex.size}/14`;
  const grid = document.getElementById('dex-grid');
  grid.innerHTML = '';

  GUPPY_SPECIES.forEach(sp => {
    const unlocked = state.unlockedDex.has(sp.id);
    const card = document.createElement('div');
    const rareClass = sp.rarity === 'rare' ? 'rare' : '';
    card.className = `dex-card ${rareClass}`;

    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 64;
    miniCanvas.height = 36;
    const mCtx = miniCanvas.getContext('2d');
    drawGuppySprite(mCtx, sp, 34, 18, 1, 1.3, 0, false, !unlocked);

    const tag = document.createElement('span');
    tag.className = 'rarity-tag';
    tag.textContent = sp.rarity === 'rare' ? '희귀' : '일반';

    const name = document.createElement('div');
    name.textContent = unlocked ? sp.name : '???';

    card.appendChild(tag);
    card.appendChild(miniCanvas);
    card.appendChild(name);
    grid.appendChild(card);
  });
}

document.getElementById('btn-shop').addEventListener('click', () => {
  state.prevSpeedBeforeShop = state.speed;
  state.speed = 0;
  renderShopModal();
  document.getElementById('shop-modal').classList.remove('hidden');
});

document.getElementById('btn-close-shop').addEventListener('click', () => {
  document.getElementById('shop-modal').classList.add('hidden');
  state.speed = state.prevSpeedBeforeShop || 1;
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.textContent = state.speed === 0 ? '재생' : '정지';
});

function renderShopModal() {
  document.getElementById('shop-gold').textContent = `${state.gold}G`;
  const list = document.getElementById('shop-list');
  list.innerHTML = '';

  const sellHeader = document.createElement('div');
  sellHeader.className = 'shop-cat';
  sellHeader.textContent = `구피 분양하기 (현재 ${state.guppies.length}마리 / 최소 1마리 유지)`;
  list.appendChild(sellHeader);

  const adults = state.guppies.filter(g => !g.isBaby);
  const grouped = {};
  adults.forEach(g => {
    grouped[g.species.id] = (grouped[g.species.id] || 0) + 1;
  });

  Object.keys(grouped).forEach(spId => {
    const sp = GUPPY_SPECIES.find(s => s.id === spId);
    const count = grouped[spId];
    const sellPrice = sp.rarity === 'rare' ? 50 : 15;

    const row = document.createElement('div');
    row.className = 'shop-item';
    row.innerHTML = `<div><strong>${sp.name}</strong> (${count}마리)</div>`;

    const btn = document.createElement('button');
    btn.className = 'pixel-btn dex';
    btn.textContent = `+${sellPrice}G 분양`;
    btn.disabled = state.guppies.length <= 1;
    btn.onclick = () => sellGuppy(spId, sellPrice, sp.name);

    row.appendChild(btn);
    list.appendChild(row);
  });

  const categories = [
    { key: 'supply', title: '필수품 (새끼장 외 일회용)' },
    { key: 'decor', title: `장식품 (${state.equippedDecors.length}/2개)` },
    { key: 'substrate', title: `바닥재 (${state.equippedSubstrate ? 1 : 0}/1개)` }
  ];

  categories.forEach(cat => {
    const header = document.createElement('div');
    header.className = 'shop-cat';
    header.textContent = cat.title;
    list.appendChild(header);

    SHOP_ITEMS.filter(i => i.category === cat.key).forEach(item => {
      const row = document.createElement('div');
      row.className = 'shop-item';

      const isEqDecor = state.equippedDecors.includes(item.id);
      const isEqSub = state.equippedSubstrate === item.id;
      const isBabyBox = item.id === 'baby_box' && state.hasBabyBox;

      let btnLabel = `${item.price}G 구매`;
      let disabled = state.gold < item.price;

      if (isBabyBox) {
        btnLabel = '보유중';
        disabled = true;
      } else if (isEqDecor || isEqSub) {
        btnLabel = '적용중';
        disabled = true;
      }

      const descHtml = item.desc ? `<br><small>${item.desc}</small>` : '';
      row.innerHTML = `<div><strong>${item.name}</strong>${descHtml}</div>`;

      const btn = document.createElement('button');
      btn.className = 'pixel-btn shop';
      btn.textContent = btnLabel;
      btn.disabled = disabled;
      btn.onclick = () => buyItem(item);

      row.appendChild(btn);
      list.appendChild(row);
    });
  });
}

function sellGuppy(speciesId, price, name) {
  if (state.guppies.length <= 1) return;
  const idx = state.guppies.findIndex(g => !g.isBaby && g.species.id === speciesId);
  if (idx !== -1) {
    state.guppies.splice(idx, 1);
    state.gold += price;
    setLog(`${name} 1마리를 분양했습니다. (+${price}G)`);
    saveGame();
    updateUI();
    renderShopModal();
  }
}

function buyItem(item) {
  if (state.gold < item.price) return;

  if (item.category === 'supply') {
    if (item.id === 'baby_box') {
      if (state.hasBabyBox) return;
      state.gold -= item.price;
      state.hasBabyBox = true;
      setLog('새끼장을 구매했습니다! 새끼 구피가 보호됩니다.');
    } else if (item.id === 'anti_parasite') {
      state.gold -= item.price;
      state.hasParasite = false;
      setLog('기생충 제거제를 사용했습니다.');
    } else if (item.id === 'anti_moss') {
      state.gold -= item.price;
      state.mossLevel = 0;
      setLog('이끼 제거제를 사용했습니다.');
    }
  } else if (item.category === 'decor') {
    state.gold -= item.price;
    if (state.equippedDecors.length >= 2) {
      state.equippedDecors.shift();
    }
    state.equippedDecors.push(item.id);
    setLog(`${item.name}을(를) 어항에 배치했습니다.`);
  } else if (item.category === 'substrate') {
    state.gold -= item.price;
    state.equippedSubstrate = item.id;
    setLog(`${item.name}을(를) 바닥에 깔았습니다.`);
  }

  saveGame();
  updateUI();
  renderShopModal();
}
let lastTick = performance.now();
function gameLoop(now) {
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (state.speed > 0 && state.minutes < DAY_END_MIN) {
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

  ctx.fillStyle = '#7f4f24';
  state.foods = state.foods.filter(f => !f.eaten && f.y < canvas.height - 14);
  state.foods.forEach(f => {
    if (state.speed > 0) f.y += 0.25 * state.speed;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), 3, 3);
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
  const totalCount = state.guppies.length;
  const perFish = state.mossLevel === 1 ? 2 : 3;
  const recommendedFood = totalCount * perFish;
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
    if (Math.random() < 0.5) deadCount += 1;
  }
  if (totalCount > 30) score -= 10;
  if (state.hasParasite) {
    score -= 15;
    deadCount += Math.floor(Math.random() * 5) + 1;
  }

  if (!state.hasBabyBox) {
    state.guppies = state.guppies.filter(g => {
      if (!g.isBaby) return true;
      const eatChance = state.mossLevel === 3 ? 0.65 : 0.4;
      if (Math.random() < eatChance) {
        deadCount += 1;
        return false;
      }
      return true;
    });
  }

  score = Math.min(100, Math.max(0, score));
  deadCount = Math.min(state.guppies.length, deadCount);

  for (let i = 0; i < deadCount; i++) {
    state.guppies.pop();
  }

  state.gold += score;
  saveGame();

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
    localStorage.removeItem(SAVE_KEY);
    document.getElementById('gameover-modal').classList.remove('hidden');
    return;
  }

  state.day += 1;
  state.minutes = DAY_START_MIN;
  state.foodGivenToday = 0;
  state.cleanedToday = false;

  state.guppies.forEach(g => {
    g.ageDays += 1;
    if (g.isBaby && g.ageDays >= 2) {
      g.isBaby = false;
    }
  });

  const adults = state.guppies.filter(g => !g.isBaby);
  let birthMsg = '';
  if (adults.length >= 2 && state.guppies.length <= 30) {
    const birthProb = Math.max(0.15, 0.85 - state.guppies.length * 0.025);
    if (Math.random() < birthProb) {
      const newSpecies = pickOffspringSpecies();
      const baby = new Guppy(newSpecies.id, true, canvas.width, canvas.height);
      state.guppies.push(baby);

      if (!state.unlockedDex.has(newSpecies.id)) {
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
        birthMsg = ` 새끼 [${newSpecies.name}]가 태어났습니다!`;
      }
    }
  }

  if (Math.random() < 0.45) state.mossLevel = Math.min(3, state.mossLevel + 1);
  if (Math.random() < 0.35) state.waterLevel = Math.min(2, state.waterLevel + 1);
  if (!state.hasParasite && state.waterLevel === 2 && Math.random() < 0.3) {
    state.hasParasite = true;
  }

  saveGame();
  setLog(`${state.day}일차 아침!${birthMsg}`);
  updateUI();
});

function pickOffspringSpecies() {
  const isRare = Math.random() < 0.2;
  const targetRarity = isRare ? 'rare' : 'normal';
  const pool = GUPPY_SPECIES.filter(s => s.rarity === targetRarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateUI() {
  const h = Math.floor(state.minutes / 60);
  const m = String(Math.floor(state.minutes % 60)).padStart(2, '0');
  document.getElementById('game-day').textContent = `${state.day}일차`;
  document.getElementById('game-clock').textContent = `${h}시 ${m}분`;

  const adults = state.guppies.filter(g => !g.isBaby).length;
  const babies = state.guppies.filter(g => g.isBaby).length;
  document.getElementById('stat-count').textContent = `성체:${adults} 새끼:${babies}`;
  document.getElementById('stat-gold').textContent = `${state.gold}G`;
  document.getElementById('stat-water').textContent = `수질:${WATER_LEVELS[state.waterLevel]}`;
  document.getElementById('stat-moss').textContent = `이끼:${MOSS_LEVELS[state.mossLevel]}`;

  const dexBtn = document.getElementById('btn-dex');
  dexBtn.innerHTML = `도감 <small>(${state.unlockedDex.size}/14)</small>`;

  document.getElementById('stat-babybox').classList.toggle('hidden', !state.hasBabyBox);
  document.getElementById('stat-parasite').classList.toggle('hidden', !state.hasParasite);
  document.getElementById('stat-overcrowd').classList.toggle('hidden', state.guppies.length <= 30);

  const disableClean = state.cleanedToday || state.isCleaning;
  document.getElementById('btn-water').disabled = disableClean;
  document.getElementById('btn-wall').disabled = disableClean;
  document.getElementById('btn-clean-all').disabled = disableClean;
  document.getElementById('btn-feed').disabled = state.isCleaning;
}
