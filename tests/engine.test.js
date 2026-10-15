import test from 'node:test';
import assert from 'node:assert/strict';
import { RadioEngine } from '../dist/engine.js';
import { events, collectibles } from '../dist/events.js';
const choice = {id:'ok',text:'행동',result:'결과'};
const event = (id,extra={}) => ({id,title:id,text:'본문',weight:1,choices:[choice],...extra});
const game = (es, random=()=>0, items=[]) => new RadioEngine(es,1,null,0,random,items);
function next(g) { if (g.state.phase === 'idle') g.start(0); g.tick(g.state.deadline); return g.event?.id; }
function finish(g,index=0) { g.choose(index,g.state.deadline || 10000); }

test('가중치 비율과 추첨 구간, 잠금 이벤트 제외', () => {
  const es=[event('a',{weight:3}),event('b',{weight:1}),event('locked',{weight:999,requires:{events:['b']}}),event('zero',{weight:0})];
  const g=game(es,()=>0.7499);
  assert.deepEqual(g.probabilities().map(p=>[p.id,p.probability]),[['a',0.75],['b',0.25]]);
  assert.equal(next(g),'a');
  assert.equal(next(game(es,()=>0.75)),'b');
});
test('이벤트 완료와 특정 행동 완료를 각각 선행 조건으로 사용', () => {
  const es=[event('a',{choices:[{...choice,id:'yes'},{...choice,id:'no'}]}),event('b',{requires:{events:['a']}}),event('c',{requires:{choices:['a:yes']}})];
  const g=game(es);next(g);finish(g,1);
  assert.deepEqual(g.probabilities().map(p=>p.id),['a','b']);
  next(g);finish(g,0);
  assert.deepEqual(g.probabilities().map(p=>p.id),['a','b','c']);
});
test('시작 천장: N회 일반 등장 후 바로 다음은 강제 등장', () => {
  const g=game([event('a'),event('p',{pity:{start:'gameStart',count:2}})]);
  assert.equal(next(g),'a');assert.equal(g.state.pity.p.remaining,1);finish(g);
  assert.equal(next(g),'a');assert.equal(g.state.pity.p.remaining,0);finish(g);
  assert.deepEqual(g.probabilities(),[{id:'p',probability:1,forced:true}]);
  assert.equal(next(g),'p');assert.equal(g.state.forced,true);
});
test('동시 천장에서는 대상만 추첨하고 강제 등장 회차에는 모든 카운트가 유지', () => {
  const g=game([event('a'),event('p',{once:true,pity:{start:'gameStart',count:0}}),event('q',{once:true,pity:{start:'gameStart',count:0}}),event('r',{pity:{start:'gameStart',count:4}})]);
  assert.equal(next(g),'p');assert.equal(g.state.pity.r.remaining,4);finish(g);
  assert.equal(next(g),'q');assert.equal(g.state.pity.r.remaining,4);finish(g);
  assert.equal(next(g),'a');assert.equal(g.state.pity.r.remaining,3);
});
test('특정 행동이 천장을 시작하며 반복 트리거는 초기화하지 않음', () => {
  const g=game([event('a',{choices:[{...choice,startPity:['p']}]}),event('p',{pity:{start:'trigger',count:2},requires:{choices:['a:ok']}})]);
  assert.equal(g.state.pity.p,undefined);next(g);finish(g);
  assert.equal(g.state.pity.p.remaining,2);next(g);finish(g);
  assert.equal(g.state.pity.p.remaining,1);next(g);finish(g);
  assert.equal(g.state.pity.p.remaining,0);assert.equal(next(g),'p');
});
test('잠긴 천장 대상은 해금 후 강제 등장, 일반 추첨으로 먼저 만나면 천장 달성', () => {
  const g=game([event('a'),event('p',{requires:{events:['a']},pity:{start:'gameStart',count:0}})]);
  assert.equal(next(g),'a');finish(g);assert.equal(next(g),'p');
  const early=game([event('p',{pity:{start:'gameStart',count:5}})]);
  next(early);assert.equal(early.state.pity.p.fired,true);finish(early);
  assert.equal(early.probabilities()[0].forced,false);
});
test('선택 대기에는 시간이나 천장이 흐르지 않으며 중복 선택 무시', () => {
  const g=game([event('a'),event('p',{pity:{start:'gameStart',count:5}})]);
  next(g);g.tick(999999);assert.equal(g.state.pity.p.remaining,4);
  assert.equal(g.choose(99),false);assert.equal(g.choose(0,10000),true);
  assert.equal(g.choose(0,10000),false);assert.equal(g.state.deadline,11000);
});
test('설정과 수집품 정지가 겹쳐도 모든 창을 닫기 전까지 정지', () => {
  const g=game([event('a')]);g.start(0);g.pause('settings',300);g.pause('collection',400);
  assert.equal(g.remaining(90000),700);assert.equal(g.tick(90000),false);
  g.resume('settings',90000);assert.equal(g.state.phase,'paused');
  g.resume('collection',100000);assert.equal(g.state.deadline,100700);
});
test('창을 닫아도 수동 일시정지는 유지', () => {
  const g=game([event('a')]);g.start(0);g.togglePause(200);g.pause('settings',300);g.resume('settings',5000);
  assert.equal(g.state.phase,'paused');g.togglePause(10000);assert.equal(g.state.deadline,10800);
});
test('정지 중 배속 변경은 남은 진행 비율을 유지하며 다음 대기에도 적용', () => {
  const g=game([event('a')]);g.start(0);g.pause('settings',200);g.setSpeed(2,200);
  assert.equal(g.remaining(),400);assert.equal(g.state.intervalTotal,500);
  g.resume('settings',5000);assert.equal(g.state.deadline,5400);g.tick(5400);g.choose(0,5400);
  assert.equal(g.state.deadline,5900);
});
test('현재 대기 중 배속 변경과 기본 간격 수정', () => {
  const g=game([event('a')]);g.start(0);g.setSpeed(4,200);assert.equal(g.state.deadline,400);
  g.setCooldown(8);assert.equal(g.state.deadline,400);g.tick(400);g.choose(0,400);assert.equal(g.state.deadline,2400);
});
test('수집품 중복 획득 방지와 저장 복원, 새 게임은 전체 진행 초기화', () => {
  const es=[event('a',{choices:[{...choice,grantItems:['item']} ]})],items=[{id:'item',name:'물건',description:'설명'}];
  const g=game(es,()=>0,items);next(g);finish(g);next(g);finish(g);
  assert.deepEqual(g.state.inventory,['item']);assert.deepEqual(g.state.history[0].gained,[]);
  const restored=new RadioEngine(es,1,g.state,0,()=>0,items);
  assert.deepEqual(restored.state.inventory,['item']);assert.deepEqual(restored.state.completedChoices,['a:ok']);
  const reset=game(es,()=>0,items);assert.deepEqual(reset.state.inventory,[]);assert.deepEqual(reset.state.history,[]);assert.deepEqual(reset.state.completedEvents,[]);
});
test('한 번 등장하는 이벤트는 완료 후 제외되며 후보가 없으면 종료', () => {
  const g=game([event('a',{once:true})]);next(g);finish(g);assert.equal(g.state.phase,'finished');
});
test('저장 복원: 일반 대기 만료는 방송 하나만, 확인창 정지는 계속 보존', () => {
  const es=[event('a')],g=game(es);g.start(0);
  const restored=new RadioEngine(es,1,g.state,999999,()=>0);assert.equal(restored.state.count,1);assert.equal(restored.state.phase,'choice');
  g.pause('collection',400);const paused=new RadioEngine(es,1,g.state,999999,()=>0);
  assert.equal(paused.remaining(),600);paused.resume('collection',999999);assert.equal(paused.state.deadline,1000599);
});
test('실제 이벤트 정의와 유효하지 않은 저장 검사', () => {
  const g=new RadioEngine(events,15,null,0,()=>0,collectibles);assert.equal(g.state.pity['broadcast-02'].remaining,4);
  assert.equal(new RadioEngine(events,15,{version:1},0,()=>0,collectibles).state.phase,'idle');
  assert.throws(()=>game([event('a',{choices:[{...choice,grantItems:['missing']}]})]));
});
