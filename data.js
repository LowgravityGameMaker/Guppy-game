const GUPPY_SPECIES = [
  { id: 'red_tail', name: '붉은꼬리 구피', rarity: '일반', body: '#d5dbdb', tail: '#e74c3c', spot: null, bonus: 10 },
  { id: 'yellow_tail', name: '노란꼬리 구피', rarity: '일반', body: '#d5dbdb', tail: '#f1c40f', spot: null, bonus: 15 },
  { id: 'black_tail', name: '검은꼬리 구피', rarity: '일반', body: '#aeb6bf', tail: '#2c3e50', spot: null, bonus: 15 },
  { id: 'brown_spot', name: '갈색 점박이 구피', rarity: '일반', body: '#edbb99', tail: '#a04000', spot: '#6e2c00', bonus: 20 },
  { id: 'red_spot', name: '붉은 점박이 구피', rarity: '일반', body: '#fadbd8', tail: '#e74c3c', spot: '#922b21', bonus: 20 },
  { id: 'plain', name: '민무늬 구피', rarity: '일반', body: '#f2f4f4', tail: '#d0d3d4', spot: null, bonus: 15 },
  { id: 'red', name: '붉은 구피', rarity: '일반', body: '#e74c3c', tail: '#c0392b', spot: null, bonus: 25 },
  { id: 'blue', name: '푸른 구피', rarity: '일반', body: '#3498db', tail: '#2980b9', spot: null, bonus: 25 },
  { id: 'green', name: '초록 구피', rarity: '일반', body: '#2ecc71', tail: '#27ae60', spot: null, bonus: 25 },
  { id: 'purple', name: '보라 구피', rarity: '일반', body: '#9b59b6', tail: '#8e44ad', spot: null, bonus: 25 },
  { id: 'rainbow', name: '무지개 구피', rarity: '희귀', body: '#f1c40f', tail: '#e74c3c', spot: '#3498db', bonus: 80 },
  { id: 'neon_blue', name: '네온 블루 구피', rarity: '희귀', body: '#00f2fe', tail: '#4facfe', spot: '#ffffff', bonus: 90 },
  { id: 'neon_green', name: '네온 그린 구피', rarity: '희귀', body: '#00ff87', tail: '#60efff', spot: '#ffffff', bonus: 90 },
  { id: 'heart', name: '하트 구피', rarity: '희귀', body: '#ff9a9e', tail: '#ff0844', spot: '#ffffff', bonus: 120 }
];

const SHOP_ITEMS = [
  { id: 'nursery', name: '새끼장', type: 'essential', price: 100, desc: '새끼 구피가 어른에게 잡아먹히지 않게 보호' },
  { id: 'anti_bug', name: '기생충 제거제', type: 'consumable', price: 70, desc: '어항의 기생충 즉시 제거 (1회용)' },
  { id: 'anti_moss', name: '이끼 제거제', type: 'consumable', price: 50, desc: '어항의 이끼 즉시 제거 (1회용)' },
  { id: 'deco_plant1', name: '인공수초', type: 'deco', price: 50, score: 3, desc: '어항 장식 (점수 +3)' },
  { id: 'deco_plant2', name: '인공수초2', type: 'deco', price: 50, score: 3, desc: '어항 장식 (점수 +3)' },
  { id: 'deco_coral', name: '인공산호', type: 'deco', price: 70, score: 5, desc: '어항 장식 (점수 +5)' },
  { id: 'deco_ship', name: '침몰한 배 장식', type: 'deco', price: 150, score: 10, desc: '어항 장식 (점수 +10)' },
  { id: 'deco_shell', name: '조개 장식', type: 'deco', price: 50, score: 3, desc: '어항 장식 (점수 +3)' },
  { id: 'deco_star', name: '불가사리 장식', type: 'deco', price: 70, score: 5, desc: '어항 장식 (점수 +5)' },
  { id: 'deco_real1', name: '수초', type: 'deco', price: 200, score: 12, desc: '생수초 장식 (점수 +12)' },
  { id: 'deco_real2', name: '수초2', type: 'deco', price: 200, score: 12, desc: '생수초 장식 (점수 +12)' },
  { id: 'deco_rock', name: '돌 장식', type: 'deco', price: 100, score: 7, desc: '어항 장식 (점수 +7)' },
  { id: 'sub_dark', name: '어두운 색 바닥재', type: 'substrate', price: 100, color: '#34495e', desc: '어항 바닥재 변경' },
  { id: 'sub_light', name: '밝은 색 바닥재', type: 'substrate', price: 100, color: '#f9e79f', desc: '어항 바닥재 변경' },
  { id: 'sub_pebble', name: '투명 조약돌 바닥재', type: 'substrate', price: 200, color: '#d6eaf8', desc: '고급 바닥재 변경' }
];
