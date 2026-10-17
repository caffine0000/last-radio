// 실제 방송 콘텐츠입니다. 이벤트 id는 저장·연계에 사용합니다.
export const settings = { cooldownSeconds: 15 };
export const collectibles = [
  { id: 'item-01', name: '[수집품 이름]', description: '[수집품 설명]' },
];
export const events = [
  {
    "id": "opening",
    "type": "observation",
    "title": "오프닝",
    "image": { "src": "images/opening.svg", "alt": "별과 달이 장식된 무대에서 마이크 앞에 앉아 방송하는 검은 고양이", "fit": "contain" },
    "weight": 100,
    "once": true,
    "mustSeeFirst": true,
    "continueText": "라디오의 오프닝에 귀를 기울인다",
    "text": "라디오가 치직이며 흥겨운 음악이 나온다.\n\n' 𝅘𝅥𝅮아르카디아의 끝까지 가는 방송 𝅘𝅥𝅮\n 𝅘𝅥𝅮팰리스의 종말 라디오 FM 𝅘𝅥𝅮'\n\n\"오늘도 마지막 날까지~ 전해드리는 ｢종말 라디오｣의 진행자 '팰리스'입니다~!\"",
    "onComplete": {
      "result": "오프닝을 들었다."
    }
  }
];
