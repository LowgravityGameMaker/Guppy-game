function getCurrentRank() {
  let current = SHOP_RANKS;
  for (const r of SHOP_RANKS) {
    if (state.reputation >= r.minRep) current = r;
  }
  return current;
}

function generateNewOrder() {
  const rank = getCurrentRank();
  const customer = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
  const allowRare = rank.level >= 2 || state.day >= 4;
  const isRareOrder = allowRare && Math.random() < 0.25;

  let targetSpecies;
  let count;
  let baseReward;
  let repReward;
  let daysLeft;

  if (isRareOrder) {
    const rares = GUPPY_SPECIES.filter(s => s.rarity === 'rare');
    targetSpecies = rares[Math.floor(Math.random() * rares.length)];
    count = 1;
    baseReward = 140;
    repReward = 3;
    daysLeft = 4;
  } else {
    const normals = GUPPY_SPECIES.filter(s => s.rarity === 'normal');
    targetSpecies = normals[Math.floor(Math.random() * normals.length)];
    count = Math.floor(Math.random() * 2) + 1;
    baseReward = count * 35 + 15;
    repReward = count;
    daysLeft = 3;
  }

  return {
    id: Date.now() + Math.random(),
    customer,
    speciesId: targetSpecies.id,
    speciesName: targetSpecies.name,
    isRare: isRareOrder,
    count,
    reward: Math.round(baseReward * rank.bonusRate),
    repReward,
    daysLeft
  };
}

function fillInitialOrders() {
  while (state.orders.length < 2) {
    state.orders.push(generateNewOrder());
  }
}

document.getElementById('btn-order').addEventListener('click', () => {
  sound.playPop();
  renderOrderModal();
  document.getElementById('order-modal').classList.remove('hidden');
});

document.getElementById('btn-close-order').addEventListener('click', () => {
  sound.playPop();
  document.getElementById('order-modal').classList.add('hidden');
});

function renderOrderModal() {
  const rank = getCurrentRank();
  document.getElementById('order-rep-title').textContent = `${rank.title} Lv.${rank.level}`;
  const list = document.getElementById('order-list');
  list.innerHTML = '';

  if (state.orders.length === 0) {
    list.innerHTML = '<div class="shop-item">현재 대기 중인 손님 주문이 없습니다.</div>';
    return;
  }

  state.orders.forEach(order => {
    const matchingAdults = state.guppies.filter(
      g => !g.isBaby && g.species.id === order.speciesId
    ).length;

    const canDeliver =
      matchingAdults >= order.count &&
      state.guppies.length - order.count >= 1;

    const row = document.createElement('div');
    row.className = 'shop-item';

    const rareBadge = order.isRare ? '<span style="color:#ffd166;">[VIP]</span> ' : '';
    row.innerHTML = `
      <div>
        <strong>${rareBadge}${order.customer}</strong> <small>(남은 기한: ${order.daysLeft}일)</small><br>
        <span>요청: <strong>${order.speciesName}</strong> 성체 ${order.count}마리 (보유: ${matchingAdults}마리)</span><br>
        <small style="color:#ffd166;">보상: +${order.reward}G / 평판 +${order.repReward}</small>
      </div>
    `;

    const btn = document.createElement('button');
    btn.className = canDeliver ? 'pixel-btn primary' : 'pixel-btn';
    btn.style.width = 'auto';
    btn.textContent = canDeliver ? '납품하기' : '조건부족';
    btn.disabled = !canDeliver;
    btn.onclick = () => fulfillOrder(order.id);

    row.appendChild(btn);
    list.appendChild(row);
  });
}

function fulfillOrder(orderId) {
  const orderIdx = state.orders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) return;
  const order = state.orders[orderIdx];

  const matchingIndices = [];
  state.guppies.forEach((g, idx) => {
    if (!g.isBaby && g.species.id === order.speciesId && matchingIndices.length < order.count) {
      matchingIndices.push(idx);
    }
  });

  if (matchingIndices.length < order.count || state.guppies.length - order.count < 1) {
    return;
  }

  for (let i = matchingIndices.length - 1; i >= 0; i--) {
    state.guppies.splice(matchingIndices[i], 1);
  }

  const prevLevel = getCurrentRank().level;
  state.gold += order.reward;
  state.reputation += order.repReward;
  state.orders.splice(orderIdx, 1);

  const newRank = getCurrentRank();
  sound.playChime();
  if (newRank.level > prevLevel) {
    setLog(`주문 납품 완료! (+${order.reward}G) 축하합니다! [${newRank.title} Lv.${newRank.level}] 승급!`);
  } else {
    setLog(`${order.customer} 주문 납품 완료! (+${order.reward}G, 평판 +${order.repReward})`);
  }

  saveGame();
  updateUI();
  renderOrderModal();
}
