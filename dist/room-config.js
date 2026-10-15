// 수집품에 따른 창가 변화. dist/events.js의 수집품 id와 연결하세요.
// 여러 requiresItems는 모두 보유해야 합니다. 해금된 변화는 함께 표시됩니다.
// show: desk-lamp, books, photo-frame, glass-vase 중 선택.
export const roomRules = [
  {
    id: 'first-keepsake',
    requiresItems: ['item-01'],
    show: ['desk-lamp'],
    accent: '#94b8b3', // 선택 사항. 여러 규칙이 활성화되면 마지막 색을 사용합니다.
  },
  // { id: 'book-reward', requiresItems: ['book-item'], show: ['books'] },
  // { id: 'two-keepsakes', requiresItems: ['item-a', 'item-b'], show: ['photo-frame', 'glass-vase'] },
];
