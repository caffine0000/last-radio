import test from 'node:test';
import assert from 'node:assert/strict';
import {RadioEngine,validateEvents} from '../dist/engine.js';
import {events,collectibles} from '../dist/events.js';
const ordinary={id:'ordinary',weight:1000000,title:'ordinary',text:'본문',choices:[{id:'ok',text:'행동',result:'결과'}]};
const make=(data=events)=>new RadioEngine(data,1,null,0,()=>.999999,collectibles);
test('견본 이벤트 제거 및 오프닝 콘텐츠 설정',()=>{
 assert.equal(events.length,1);
 const opening=events[0];
 assert.equal(opening.id,'opening');assert.equal(opening.title,'오프닝');assert.equal(opening.type,'observation');
 assert.equal(opening.weight,100);assert.equal(opening.once,true);assert.equal(opening.mustSeeFirst,true);
 assert.equal(opening.continueText,'라디오의 오프닝에 귀를 기울인다');
 assert.equal(opening.text,"라디오가 치직이며 흥겨운 음악이 나온다.\n\n' 𝅘𝅥𝅮아르카디아의 끝까지 가는 방송 𝅘𝅥𝅮\n 𝅘𝅥𝅮팰리스의 종말 라디오 FM 𝅘𝅥𝅮'\n\n\"오늘도 마지막 날까지~ 전해드리는 ｢종말 라디오｣의 진행자 '팰리스'입니다~!\"");
 assert.equal(opening.choices,undefined);
});
test('미완료 오프닝은 큰 가중치와 이미 도달한 천장보다 우선',()=>{
 const due={...ordinary,id:'due',pity:{start:'gameStart',count:0}};
 const g=make([...events,ordinary,due]);g.start(0);g.tick(1000);
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
 const g=make([...events,ordinary]);g.start(0);g.tick(1000);g.completeObservation(2000);
 assert.deepEqual(g.probabilities(2000).map(p=>p.id),['ordinary']);
 const reset=make([...events,ordinary]);reset.start(0);reset.tick(1000);assert.equal(reset.event.id,'opening');
});
test('우선순위와 버튼 문구 옵션의 형식 검사',()=>{
 assert.throws(()=>validateEvents([{...events[0],mustSeeFirst:'true'}],collectibles));
 assert.throws(()=>validateEvents([{...events[0],continueText:'  '}],collectibles));
 assert.throws(()=>validateEvents([{...ordinary,continueText:'계속'}],collectibles));
});
