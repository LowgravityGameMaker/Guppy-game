document.getElementById('btn-dex').addEventListener('click', () => {
  sound.playPop();
  renderDexModal();
  document.getElementById('dex-modal').classList.remove('hidden');
});

document.getElementById('btn-close-dex').addEventListener('click', () => {
  sound.playPop();
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
  sound.playPop();
  state.prevSpeedBeforeShop = state.speed;
  state.speed = 0;
  renderShopModal();
  document.getElementById('shop-modal').classList.remove('hidden');
});

document.getElementById('btn-close-shop').addEventListener('click', () => {
  sound.playPop();
  document.getElementById('shop-modal').classList.add('hidden');
  state.speed = state.prevSpeedBeforeShop ?? 1;
  const pauseBtn = document.getElementById('btn-pause');
  pauseBtn.textContent = state.speed === 0 ? '재생' : '정지';
});

function renderShopModal() {
  document.getElementById('shop-gold').textContent = `${state.gold}G`;
  const list = document.getElementById('shop-list');
  list.innerHTML = '';

  const sellHeader = document.createElement('div');
  sellHeader.className = 'shop-cat';
  sellHeader.textContent = `구피 일반 분양하기 (현재 ${state.guppies.length}마리 / 최소 1마리 유지)`;
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
      const isTreatUsed = item.id === 'special_treat' && state.hasSpecialTreat;
      const isUnneededMeds =
        (item.id === 'anti_parasite' && !state.hasParasite) ||
        (item.id === 'anti_moss' && state.mossLevel === 0);

      let btnLabel = `${item.price}G 구매`;
      let disabled = state.gold < item.price;

      if (isBabyBox) {
        btnLabel = '보유중';
        disabled = true;
      } else if (isTreatUsed || isEqDecor || isEqSub) {
        btnLabel = '적용중';
        disabled = true;
      } else if (isUnneededMeds) {
        btnLabel = '필요없음';
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
    sound.playCoin();
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
    if (item.id === 'special_treat') {
      if (state.hasSpecialTreat) return;
      sound.playFeed();
      state.gold -= item.price;
      state.hasSpecialTreat = true;
      for (let i = 0; i < 12; i++) {
        state.foods.push({
          x: 20 + Math.random() * (canvas.width - 40),
          y: 10 + Math.random() * 20,
          eaten: false,
          isTreat: true
        });
      }
      setLog('특별 간식을 급여했습니다! 내일 희귀종 확률이 크게 오릅니다!');
    } else if (item.id === 'baby_box') {
      if (state.hasBabyBox) return;
      sound.playCoin();
      state.gold -= item.price;
      state.hasBabyBox = true;
      setLog('새끼장을 구매했습니다! 새끼 구피가 보호됩니다.');
    } else if (item.id === 'anti_parasite') {
      sound.playCoin();
      state.gold -= item.price;
      state.hasParasite = false;
      setLog('기생충 제거제를 사용했습니다.');
    } else if (item.id === 'anti_moss') {
      sound.playCoin();
      state.gold -= item.price;
      state.mossLevel = 0;
      setLog('이끼 제거제를 사용했습니다.');
    }
  } else if (item.category === 'decor') {
    sound.playCoin();
    state.gold -= item.price;
    if (state.equippedDecors.length >= 2) {
      state.equippedDecors.shift();
    }
    state.equippedDecors.push(item.id);
    setLog(`${item.name}을(를) 어항에 배치했습니다.`);
  } else if (item.category === 'substrate') {
    sound.playCoin();
    state.gold -= item.price;
    state.equippedSubstrate = item.id;
    setLog(`${item.name}을(를) 바닥에 깔았습니다.`);
  }

  saveGame();
  updateUI();
  renderShopModal();
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

  const perFish = state.mossLevel === 1 ? 2 : 3;
  const recommendedFood = state.guppies.length * perFish;
  const foodBadge = document.getElementById('stat-food');
  if (foodBadge) {
    foodBadge.textContent = `사료:${state.foodGivenToday}/${recommendedFood}`;
    foodBadge.classList.toggle('warn', state.foodGivenToday > recommendedFood + state.guppies.length);
    foodBadge.classList.toggle('gold', state.foodGivenToday >= recommendedFood && state.foodGivenToday <= recommendedFood + state.guppies.length);
  }

  const rank = getCurrentRank();
  const repBadge = document.getElementById('stat-rep');
  if (repBadge) {
    repBadge.textContent = `★Lv.${rank.level} (${state.reputation})`;
  }

  const orderBtn = document.getElementById('btn-order');
  if (orderBtn) {
    orderBtn.innerHTML = `주문서 <small>(${state.orders.length}/3)</small>`;
  }

  const dexBtn = document.getElementById('btn-dex');
  dexBtn.innerHTML = `도감 <small>(${state.unlockedDex.size}/14)</small>`;

  document.getElementById('stat-babybox').classList.toggle('hidden', !state.hasBabyBox);
  document.getElementById('stat-treat').classList.toggle('hidden', !state.hasSpecialTreat);
  document.getElementById('stat-parasite').classList.toggle('hidden', !state.hasParasite);
  document.getElementById('stat-overcrowd').classList.toggle('hidden', state.guppies.length <= 30);

  const disableClean = state.cleanedToday || state.isCleaning;
  document.getElementById('btn-water').disabled = disableClean;
  document.getElementById('btn-wall').disabled = disableClean;
  document.getElementById('btn-clean-all').disabled = disableClean;
  document.getElementById('btn-feed').disabled = state.isCleaning;
}
