import test from 'node:test';
import assert from 'node:assert/strict';
import {RadioEngine} from '../dist/engine.js';
const observation=(id,extra={})=>({id,type:'observation',weight:1,title:id,text:'관람 본문',...extra});
const choice=id=>({id,weight:1,title:id,text:'본문',choices:[{id:'ok',text:'행동',result:'결과'}]});
const make=(events,items=[])=>new RadioEngine(events,1,null,0,()=>0,items);
function arrive(g){g.start(0);g.tick(1000);}
test('관람 이벤트는 선택지 없이 표시되고 정확히 10초 뒤 완료',()=>{
 const g=make([observation('a')]);arrive(g);
 assert.equal(g.state.phase,'observation');assert.equal(g.state.deadline,11000);assert.equal(g.remaining(1000),10000);
 assert.equal(g.tick(10999),false);assert.deepEqual(g.state.completedEvents,[]);
 assert.equal(g.tick(11000),true);assert.deepEqual(g.state.completedEvents,['a']);assert.equal(g.state.history[0].choice,'관람 완료');assert.equal(g.state.deadline,12000);
});
test('계속 듣기로 즉시 완료하며 중복 완료나 가상 행동 기록 없음',()=>{
 const g=make([observation('a')]);arrive(g);
 assert.equal(g.choose(0,2000),false);assert.equal(g.completeObservation(2000),true);assert.equal(g.completeObservation(2000),false);
 assert.equal(g.state.history.length,1);assert.deepEqual(g.state.completedChoices,[]);assert.equal(g.state.deadline,3000);
});
test('수집품·천장 시작·연계 해금·재등장 금지를 자동 완료에도 적용',()=>{
 const events=[observation('a',{onComplete:{result:'관람 결과',grantItems:['gift'],startPity:['b'],disableEvent:true}}),{...choice('b'),requires:{events:['a']},pity:{start:'trigger',count:0}}];
 const g=make(events,[{id:'gift',name:'선물',description:'설명'}]);arrive(g);g.tick(11000);
 assert.deepEqual(g.state.inventory,['gift']);assert.equal(g.state.history[0].result,'관람 결과');assert.deepEqual(g.probabilities(11000),[{id:'b',probability:1,forced:true}]);g.tick(12000);assert.equal(g.event.id,'b');
});
test('버튼 완료도 once와 완료 효과를 동일하게 적용',()=>{
 const g=make([observation('a',{once:true,onComplete:{result:'들었다'}})]);arrive(g);g.completeObservation(2000);assert.equal(g.state.phase,'finished');assert.equal(g.state.history[0].result,'들었다');
});
test('설정과 수집품 창의 정지가 겹치면 마지막 창을 닫을 때 재개',()=>{
 const g=make([observation('a')]);arrive(g);g.pause('settings',4000);g.pause('collection',5000);
 assert.equal(g.remaining(999999),7000);assert.equal(g.tick(999999),false);assert.equal(g.completeObservation(999999),false);
 g.resume('settings',1000000);assert.equal(g.state.deadline,null);g.resume('collection',1001000);assert.equal(g.state.deadline,1008000);g.tick(1008000);assert.equal(g.state.history.length,1);
});
test('수동 관람 일시정지를 창을 닫아도 유지',()=>{
 const g=make([observation('a')]);arrive(g);g.togglePause(2000);g.pause('settings',3000);g.resume('settings',100000);
 assert.equal(g.state.deadline,null);assert.equal(g.remaining(),9000);g.togglePause(101000);assert.equal(g.state.deadline,110000);
});
test('배속은 관람 시간에는 영향 없이 다음 쿨타임에 적용',()=>{
 const g=make([observation('a')]);g.setSpeed(8,0);g.start(0);g.tick(125);
 assert.equal(g.state.deadline,10125);g.pause('settings',1125);g.setSpeed(4,1125);assert.equal(g.remaining(),9000);assert.equal(g.state.intervalTotal,10000);
 g.resume('settings',2000);assert.equal(g.state.deadline,11000);g.tick(11000);assert.equal(g.state.deadline,11250);
});
test('관람 중 저장 복원과 오프라인 만료 시 방송 하나만 완료',()=>{
 const events=[observation('a')],g=make(events);arrive(g);
 const partial=new RadioEngine(events,1,g.state,5000,()=>0);assert.equal(partial.remaining(5000),6000);assert.equal(partial.state.history.length,0);
 const late=new RadioEngine(events,1,g.state,999999,()=>0);assert.equal(late.state.history.length,1);assert.equal(late.state.count,1);assert.equal(late.state.phase,'waiting');assert.equal(late.state.deadline,1000999);
});
test('창을 연 상태로 저장해도 남은 관람 시간을 보존',()=>{
 const g=make([observation('a')]);arrive(g);g.pause('collection',4500);
 const restored=new RadioEngine(g.events,1,g.state,99999,()=>0);assert.equal(restored.state.phase,'observation');assert.equal(restored.remaining(),6500);assert.equal(restored.state.history.length,0);
 restored.resume('collection',100000);assert.equal(restored.state.deadline,106500);
});
test('천장 카운트는 등장 때만 감소하며 관람 10초 동안 추가 감소 없음',()=>{
 const g=make([observation('a'),{...choice('b'),pity:{start:'gameStart',count:3}}]);arrive(g);assert.equal(g.state.pity.b.remaining,2);g.tick(6000);g.tick(10000);assert.equal(g.state.pity.b.remaining,2);g.tick(11000);assert.equal(g.state.pity.b.remaining,2);
});
test('관람 이벤트도 시간 제한을 지키고 이미 도착한 방송은 끝까지 관람',()=>{
 const at=h=>new Date(2026,9,17,h).getTime();const events=[observation('a',{availability:{timeRanges:[{start:'09:00',end:'10:00'}]}})];
 const g=new RadioEngine(events,1,null,at(9),()=>0);g.start(at(9));g.tick(at(9)+1000);assert.equal(g.state.phase,'observation');g.completeObservation(at(11));assert.equal(g.state.completedEvents[0],'a');assert.equal(g.state.waitingForSchedule,true);
});
test('관람 설정 오류와 무효 저장 검출',()=>{
 assert.throws(()=>make([observation('a',{choices:[{id:'x',text:'x',result:'x'}]})]));
 assert.throws(()=>make([observation('a',{onComplete:{grantItems:['missing']}})]));
 assert.throws(()=>make([observation('a',{onComplete:{startPity:['missing']}})]));
 assert.throws(()=>make([observation('a',{type:'unknown'})]));
 const g=make([observation('a')]);arrive(g);g.state.deadline=null;
 assert.equal(new RadioEngine(g.events,1,g.state,0,()=>0).state.phase,'idle');
});
