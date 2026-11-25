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

function getCurrentRank() {
  let current = SHOP_RANKS[0];
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
    count = Math.floor(Math.random() * 2) + 1; // 1~2마리
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
