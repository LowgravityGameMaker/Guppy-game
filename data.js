const GUPPY_SPECIES = [
  // 일반 10종
  { id: 'red_tail', name: '붉은꼬리 구피', rarity: 'normal', bodyColor: '#d9c3b0', tailColor: '#e63946', pattern: 'none' },
  { id: 'yellow_tail', name: '노란꼬리 구피', rarity: 'normal', bodyColor: '#e9d8a6', tailColor: '#ffb703', pattern: 'none' },
  { id: 'black_tail', name: '검은꼬리 구피', rarity: 'normal', bodyColor: '#ced4da', tailColor: '#212529', pattern: 'none' },
  { id: 'brown_spot', name: '갈색 점박이 구피', rarity: 'normal', bodyColor: '#ddb892', tailColor: '#7f5539', pattern: 'spot' },
  { id: 'red_spot', name: '붉은 점박이 구피', rarity: 'normal', bodyColor: '#f4a261', tailColor: '#e63946', pattern: 'spot' },
  { id: 'plain', name: '민무늬 구피', rarity: 'normal', bodyColor: '#e5e5e5', tailColor: '#adb5bd', pattern: 'none' },
  { id: 'red', name: '붉은 구피', rarity: 'normal', bodyColor: '#e63946', tailColor: '#d62828', pattern: 'none' },
  { id: 'blue', name: '푸른 구피', rarity: 'normal', bodyColor: '#457b9d', tailColor: '#1d3557', pattern: 'none' },
  { id: 'green', name: '초록 구피', rarity: 'normal', bodyColor: '#52b788', tailColor: '#2d6a4f', pattern: 'none' },
  { id: 'purple', name: '보라 구피', rarity: 'normal', bodyColor: '#9d4edd', tailColor: '#5a189a', pattern: 'none' },
  // 희귀 4종
  { id: 'rainbow', name: '무지개 구피', rarity: 'rare', bodyColor: '#ffbe0b', tailColor: '#ff006e', pattern: 'rainbow' },
  { id: 'neon_blue', name: '네온 블루 구피', rarity: 'rare', bodyColor: '#00f5d4', tailColor: '#00bbf9', pattern: 'neon' },
  { id: 'neon_green', name: '네온 그린 구피', rarity: 'rare', bodyColor: '#ccff33', tailColor: '#38b000', pattern: 'neon' },
  { id: 'heart', name: '하트 구피', rarity: 'rare', bodyColor: '#ffccd5', tailColor: '#ff4d6d', pattern: 'heart' }
];

const SHOP_ITEMS = [
  // 필수품
  { id: 'special_treat', name: '특별 간식', price: 30, category: 'supply', desc: '희귀종 탄생 확률 대폭 상승(1일)' },
  { id: 'baby_box', name: '새끼장', price: 100, category: 'supply', desc: '새끼 구피 보호(영구)' },
  { id: 'anti_parasite', name: '기생충 제거제', price: 70, category: 'supply', desc: '기생충 즉시 제거' },
  { id: 'anti_moss', name: '이끼 제거제', price: 50, category: 'supply', desc: '이끼 즉시 제거' },
  // 장식품 (최대 2개 적용)
  { id: 'fake_plant1', name: '인공수초', price: 50, category: 'decor', score: 3 },
  { id: 'fake_plant2', name: '인공수초2', price: 50, category: 'decor', score: 3 },
  { id: 'fake_coral', name: '인공산호', price: 70, category: 'decor', score: 4 },
  { id: 'shell', name: '조개 장식', price: 50, category: 'decor', score: 3 },
  { id: 'starfish', name: '불가사리 장식', price: 70, category: 'decor', score: 4 },
  { id: 'rock', name: '돌 장식', price: 100, category: 'decor', score: 6 },
  { id: 'sunken_ship', name: '침몰한 배 장식', price: 150, category: 'decor', score: 10 },
  { id: 'real_plant1', name: '수초', price: 200, category: 'decor', score: 12 },
  { id: 'real_plant2', name: '수초2', price: 200, category: 'decor', score: 12 },
  // 바닥재 (최대 1개 적용)
  { id: 'sand_dark', name: '어두운 색 바닥재', price: 100, category: 'substrate', color: '#4a4e69', score: 5 },
  { id: 'sand_light', name: '밝은 색 바닥재', price: 100, category: 'substrate', color: '#f4e285', score: 5 },
  { id: 'pebble_clear', name: '투명 조약돌 바닥재', price: 200, category: 'substrate', color: '#a8dadc', score: 10 }
];

const WATER_LEVELS = ['좋음', '보통', '나쁨'];
const MOSS_LEVELS = ['없음', '약간', '중간', '많음'];
