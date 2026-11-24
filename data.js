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

// 상태 단계 정의
const WATER_LEVELS = ['좋음', '보통', '나쁨']; // 0: 좋음, 1: 보통, 2: 나쁨
const MOSS_LEVELS = ['없음', '약간', '중간', '많음']; // 0: 없음, 1: 약간, 2: 중간, 3: 많음
