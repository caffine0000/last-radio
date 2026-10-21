import test from 'node:test';
import assert from 'node:assert/strict';
import {RadioEngine,validateEvents} from '../dist/engine.js';
import {events,collectibles} from '../dist/events.js';
const ordinary={id:'ordinary',weight:1000000,title:'ordinary',text:'본문',choices:[{id:'ok',text:'행동',result:'결과'}]};
const openingEvents=[events[0]];
const make=(data=openingEvents)=>new RadioEngine(data,1,null,0,()=>.999999,collectibles);
test('견본 이벤트 제거 및 오프닝 콘텐츠 설정',()=>{
 assert.deepEqual(events.map(event=>event.id),['opening','cat-blues','dessert-talk']);
 const opening=events[0];
 assert.equal(opening.id,'opening');assert.equal(opening.title,'오프닝');assert.equal(opening.type,'observation');
 assert.equal(opening.weight,100);assert.equal(opening.once,true);assert.equal(opening.mustSeeFirst,true);
 assert.equal(opening.continueText,'라디오의 오프닝에 귀를 기울인다');
 assert.equal(opening.text,"라디오가 치직이며 흥겨운 음악이 나온다.\n\n' 𝅘𝅥𝅮아르카디아의 끝까지 가는 방송 𝅘𝅥𝅮\n 𝅘𝅥𝅮팰리스의 종말 라디오 FM 𝅘𝅥𝅮'\n\n\"오늘도 마지막 날까지~ 전해드리는 ｢종말 라디오｣의 진행자 '팰리스'입니다~!\"");
 assert.equal(opening.choices,undefined);
});
test('미완료 오프닝은 큰 가중치와 이미 도달한 천장보다 우선',()=>{
 const due={...ordinary,id:'due',pity:{start:'gameStart',count:0}};
 const g=make([...openingEvents,ordinary,due]);g.start(0);g.tick(1000);
 assert.equal(g.event.id,'opening');assert.equal(g.state.phase,'observation');assert.equal(g.state.pity.due.remaining,0);assert.equal(g.state.pity.due.fired,false);
 g.completeObservation(2000);g.tick(3000);assert.equal(g.event.id,'due');
});
test('버튼으로 완료하면 재등장하지 않고 저장 후에도 완료 유지',()=>{
 const g=make();g.start(0);g.tick(1000);assert.equal(g.completeObservation(2000),true);
 assert.equal(g.state.phase,'finished');assert.deepEqual(g.probabilities(2000),[]);
 const restored=new RadioEngine(events,1,g.state,5000,()=>0,collectibles);
 assert.deepEqual(restored.state.completedEvents,['opening']);assert.equal(restored.state.phase,'finished');
});
test('10초 자동 관람 완료도 오프닝을 한 번만 처리',()=>{
 const g=make();g.start(0);g.tick(1000);g.tick(10999);assert.equal(g.state.phase,'observation');g.tick(11000);
 assert.equal(g.state.phase,'finished');assert.equal(g.state.history.length,1);assert.equal(g.state.count,1);assert.equal(g.completeObservation(11000),false);
});
test('진행 리셋 후에는 다시 오프닝부터 시작',()=>{
 const g=make([...openingEvents,ordinary]);g.start(0);g.tick(1000);g.completeObservation(2000);
 assert.deepEqual(g.probabilities(2000).map(p=>p.id),['ordinary']);
 const reset=make([...openingEvents,ordinary]);reset.start(0);reset.tick(1000);assert.equal(reset.event.id,'opening');
});
test('우선순위와 버튼 문구 옵션의 형식 검사',()=>{
 assert.throws(()=>validateEvents([{...events[0],mustSeeFirst:'true'}],collectibles));
 assert.throws(()=>validateEvents([{...events[0],continueText:'  '}],collectibles));
 assert.throws(()=>validateEvents([{...ordinary,continueText:'계속'}],collectibles));
});


test('실제 방송 목록은 오프닝 후 고양이 블루스로 이어지고 자동·버튼 감상 후 반복 가능',()=>{
 const data=events.filter(event=>event.id !== 'dessert-talk');
 const g=make(data);g.start(0);g.tick(1000);assert.equal(g.event.id,'opening');
 g.completeObservation(1100);assert.equal(g.state.phase,'waiting');g.tick(2100);
 assert.equal(g.event.id,'cat-blues');assert.equal(g.event.type,'observation');assert.equal(g.event.weight,15);
 assert.equal(g.event.continueText,'고양이의 노랫소리에 편안해진다');assert.equal(g.event.image.src,'images/cat-blues.svg');
 assert.equal(g.event.once,false);assert.equal(g.choose(0,2200),false);
 g.tick(12100);assert.equal(g.state.history[0].title,'고양이 블루스');g.tick(13100);assert.equal(g.event.id,'cat-blues');
 g.completeObservation(13200);assert.deepEqual(g.probabilities(13200),[{id:'cat-blues',probability:1,forced:false}]);
 const restored=new RadioEngine(data,1,g.state,13300,()=>0,collectibles);restored.tick(14200);assert.equal(restored.event.id,'cat-blues');
});


test('요즘 맛있는 이야기: 상상 선택은 선택형 유지, 구매 시에만 수집품·다음 등장 비선택 전환',()=>{
 const dessert=events.find(event=>event.id==='dessert-talk');
 const g=make([dessert]);g.start(0);g.tick(1000);assert.equal(g.state.phase,'choice');
 assert.equal(g.event.weight,10);assert.equal(g.event.once,false);assert.equal(g.event.image.src,'images/dessert-talk.svg');
 g.choose(1,1100);assert.equal(g.state.history[0].description,'당신은 그냥 상상만 했다.');assert.deepEqual(g.state.inventory,[]);
 g.tick(2100);assert.equal(g.state.phase,'choice');g.choose(0,2200);
 assert.equal(g.state.history[0].description,'당신은 팰리스의 말에 홀린 듯 디저트를 사러 가버렸다.\n시트린이 어째 문틈으로 바라본다.');
 assert.deepEqual(g.state.inventory,['famous-dessert']);
 const item=collectibles.find(item=>item.id==='famous-dessert');assert.equal(item.name,'명물 디저트');assert.equal(item.image,undefined);
 g.tick(3200);assert.equal(g.state.phase,'observation');assert.equal(g.event.continueText,'맛있겠다');
 const restored=new RadioEngine([dessert],1,g.state,4200,()=>0,collectibles);
 assert.equal(restored.state.phase,'observation');restored.tick(13200);assert.equal(restored.state.phase,'waiting');
 restored.tick(14200);assert.equal(restored.state.phase,'observation');restored.completeObservation(14300);
 assert.deepEqual(restored.state.inventory,['famous-dessert']);assert.deepEqual(restored.state.completedChoices,['dessert-talk:imagine','dessert-talk:buy-dessert']);
});
