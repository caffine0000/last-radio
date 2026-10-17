// 문구는 임시 예시입니다. id는 저장·연계에 사용하므로 고유하게 유지하세요.
export const settings = { cooldownSeconds: 15 };
export const collectibles = [
  { id: 'item-01', name: '[수집품 이름]', description: '[수집품 설명]' },
];
export const events = [
  {
    // availability: { dates: ['2026-12-25'], timeRanges: [{ start: '18:00', end: '23:00' }] },
    id: 'broadcast-01', weight: 10, // 기본 조우 가중치. 반복 등장 가능.
    // image: { src: 'images/event-01.webp', alt: '방송 장면 설명', fit: 'contain', caption: '이미지 설명' },
    frequency: '89.1', title: '일반 방송', text: '[방송 내용 입력]',
    choices: [
      { id: 'accept', text: '[수집 및 연계를 시작하는 행동]', result: '[선택 결과 입력]',
        grantItems: ['item-01'], startPity: ['broadcast-03'] },
      // 특정 행동에 disableEvent: true를 추가하면 선택 이후 이 이벤트는 다시 등장하지 않습니다.
      { id: 'leave', text: '[다른 행동 입력]', result: '[선택 결과 입력]' },
    ],
  },
  {
    id: 'broadcast-02', weight: 3, once: true,
    // 이 이벤트 완료 전에는 후속 방송의 유효 가중치가 0입니다.
    requires: { events: ['broadcast-01'] },
    pity: { start: 'gameStart', count: 4 },
    frequency: '104.7', title: '선행 방송 완료 후 등장', text: '[연계 방송 내용 입력]',
    choices: [
      { id: 'accept', text: '[선택지 1 입력]', result: '[선택 결과 1 입력]' },
      { id: 'leave', text: '[선택지 2 입력]', result: '[선택 결과 2 입력]' },
    ],
  },
  {
    id: 'broadcast-03', weight: 1, once: true,
    // 특정 행동을 완료해야 해금됩니다. 트리거 선택 후 천장 2회가 시작됩니다.
    requires: { choices: ['broadcast-01:accept'] },
    pity: { start: 'trigger', count: 2 },
    frequency: '93.5', title: '특정 행동에서 이어지는 방송', text: '[연계 방송 내용 입력]',
    choices: [
      { id: 'accept', text: '[선택지 1 입력]', result: '[선택 결과 1 입력]' },
      { id: 'leave', text: '[선택지 2 입력]', result: '[선택 결과 2 입력]' },
    ],
  },
];
