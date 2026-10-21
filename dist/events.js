// 실제 방송 콘텐츠입니다. 이벤트 id는 저장·연계에 사용합니다.
export const settings = { cooldownSeconds: 15 };
export const collectibles = [
  { id: 'item-01', name: '[수집품 이름]', description: '[수집품 설명]' },
  { id: 'famous-dessert', name: '명물 디저트', description: '네페로디스 이곳저곳을 돌아다니며 사온 맛있는 디저트.\n뒤에 있던 시트린이 따라와 몰래 두개 가져갔다.', image: { src: 'images/famous-dessert.svg', alt: '음료와 와플, 과자 등 여러 디저트가 담긴 선물 상자', fit: 'contain' } },

];
export const events = [
  {
    "id": "opening",
    "tags": ["오프닝"],
    "type": "observation",
    "title": "오프닝",
    "logDescription": "처음으로 들어본 오프닝. 종말이라는 말과 달리, '팰리스'라는 자는 발랄하다.",
    "image": { "src": "images/opening.svg", "alt": "별과 달이 장식된 무대에서 마이크 앞에 앉아 방송하는 검은 고양이", "fit": "contain" },
    "weight": 100,
    "once": true,
    "mustSeeFirst": true,
    "continueText": "라디오의 오프닝에 귀를 기울인다",
    "text": "라디오가 치직이며 흥겨운 음악이 나온다.\n\n' 𝅘𝅥𝅮아르카디아의 끝까지 가는 방송 𝅘𝅥𝅮\n 𝅘𝅥𝅮팰리스의 종말 라디오 FM 𝅘𝅥𝅮'\n\n\"오늘도 마지막 날까지~ 전해드리는 ｢종말 라디오｣의 진행자 '팰리스'입니다~!\"",
    "onComplete": {
      "result": "오프닝을 들었다."
    }
  },
  {
    "id": "cat-blues",
    "type": "observation",
    "title": "고양이 블루스",
    "image": {
      "src": "images/cat-blues.svg",
      "alt": "별과 달이 빛나는 방송실에서 통기타를 연주하며 노래하는 검은 고양이 팰리스",
      "fit": "contain"
    },
    "weight": 15,
    "once": false,
    "continueText": "고양이의 노랫소리에 편안해진다",
    "text": "시청자가 신청곡을 넣었다.\n\n팰리스는 갑자기 기타를 키더니 감미롭게 노래를\n부르기 시작한다.\n\n감미로운 미성과 흥겨운 통기타 소리가 라디오로부터 흘러나오며 편안한 분위기.\n\n\"오늘의 신청곡 어떠셨습니까? 저는 이런 음악도 좋아하는데...\"\n\n그러자 팰리스는 자신이 직접 음악을 골라 부르기 시작했다.",
    "onComplete": {
      "result": "고양이의 노랫소리에 편안해진다"
    }
  },
  {
    "id": "dessert-talk",
    "type": "choice",
    "title": "요즘 맛있는 이야기",
    "image": {
      "src": "images/dessert-talk.svg",
      "alt": "각종 디저트 사진으로 꾸며진 방송실에서 맛있는 이야기를 전하는 검은 고양이 팰리스",
      "fit": "contain"
    },
    "weight": 10,
    "once": false,
    "text": "\"종말이라지만, 아니 어쩌면 종말이 다가와서 맛있는게 땡기기도 하죠.\"\n\n\"대표적으로 섹터 15의 디저트는 단맛과 신맛의\n조화가 일품이죠. 가격이 좀 비싸지만요.\"\n\"섹터 8은 반면 담백한 맛이...\"\n\n그렇게 팰리스는 온갖 디저트에 관해 이야기했다.\n당신은 입맛이 돌기 시작한다.",
    "choices": [
      {
        "id": "buy-dessert",
        "text": "디저트를 사러 네페로디스로 향한다.",
        "result": "당신은 팰리스의 말에 홀린 듯 디저트를 사러 가버렸다.\n시트린이 어째 문틈으로 바라본다.",
        "observationOnRepeat": true,
        "grantItems": [
          "famous-dessert"
        ]
      },
      {
        "id": "imagine",
        "text": "그냥 입맛만 다신다.",
        "result": "당신은 그냥 상상만 했다."
      }
    ],
    "continueText": "맛있겠다",
    "onComplete": {
      "result": "맛있겠다"
    }
  }
];
