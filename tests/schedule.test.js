import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAvailability,matchesAvailability,localDateKey} from '../dist/schedule.js';
import {RadioEngine} from '../dist/engine.js';
const at=(h,m=0,day=17)=>new Date(2026,9,day,h,m).getTime();
const c={id:'ok',text:'행동',result:'결과'};
const e=(id,extra={})=>({id,title:id,text:'본문',weight:1,choices:[c],...extra});
const make=events=>new RadioEngine(events,1,null,at(9),()=>0);

test('시간 제한 생략 및 현재 기기의 달력 날짜',()=>{
 assert.equal(matchesAvailability(undefined,at(9)),true);assert.equal(localDateKey(at(1)),'2026-10-17');
});
test('일반 시간대는 시작 포함·종료 제외, 여러 구간은 OR',()=>{
 const a={timeRanges:[{start:'09:00',end:'12:00'},{start:'18:00',end:'20:00'}]};
 for(const [h,m,expected] of [[8,59,false],[9,0,true],[11,59,true],[12,0,false],[18,0,true],[20,0,false]])assert.equal(matchesAvailability(a,at(h,m)),expected);
});
test('자정 넘는 시간대와 종료 시각 24:00',()=>{
 const a={timeRanges:[{start:'22:00',end:'05:00'}]};
 for(const [h,m,expected] of [[21,59,false],[22,0,true],[23,59,true],[0,0,true],[4,59,true],[5,0,false]])assert.equal(matchesAvailability(a,at(h,m)),expected);
 assert.equal(matchesAvailability({timeRanges:[{start:'18:00',end:'24:00'}]},at(23,59)),true);
 assert.equal(matchesAvailability({timeRanges:[{start:'18:00',end:'24:00'}]},at(0)),false);
});
test('날짜 목록·날짜 범위·시간대를 모두 만족해야 한다',()=>{
 const a={dates:['2026-10-17','2026-10-19'],dateRange:{start:'2026-10-16',end:'2026-10-18'},timeRanges:[{start:'18:00',end:'22:00'}]};
 assert.equal(matchesAvailability(a,at(19)),true);assert.equal(matchesAvailability(a,at(12)),false);
 assert.equal(matchesAvailability(a,at(19,0,18)),false);assert.equal(matchesAvailability(a,at(19,0,19)),false);
 assert.equal(matchesAvailability({dateRange:{start:'2026-10-17',end:'2026-10-18'}},at(23,59,18)),true);
});
test('잘못된 날짜·시각 및 오타 설정은 시작 시 명확하게 검출',()=>{
 for(const a of [null,[],{dates:[]},{dates:['2026-02-30']},{dates:['10-17']},{dateRange:{start:'2026-10-18',end:'2026-10-17'}},{timeRanges:[{start:'9:00',end:'10:00'}]},{timeRanges:[{start:'24:00',end:'05:00'}]},{timeRanges:[{start:'22:00',end:'22:00'}]},{timeRanges:[{start:'22:00',end:'25:00'}]},{times:[]}])assert.throws(()=>validateAvailability(a));
 validateAvailability({dates:['2028-02-29'],timeRanges:[{start:'00:00',end:'24:00'}]});
 assert.throws(()=>make([e('a',{choices:[{...c,disableEvent:'true'}]})]));
});
test('특정 행동을 선택한 경우에만 재등장 금지되며 저장 후에도 유지',()=>{
 const events=[e('a',{choices:[{...c,id:'stay'},{...c,id:'end',disableEvent:true}]}),e('b')];
 const g=make(events);g.start(at(9));g.tick(at(9)+1000);g.choose(0,at(9)+1000);
 assert.deepEqual(g.probabilities(at(9)).map(p=>p.id),['a','b']);
 g.tick(at(9)+2000);g.choose(1,at(9)+2000);
 assert.deepEqual(g.probabilities(at(9)).map(p=>p.id),['b']);
 const restored=new RadioEngine(events,1,g.state,at(9)+2000,()=>0);
 assert.deepEqual(restored.probabilities(at(9)).map(p=>p.id),['b']);
 assert.deepEqual(make(events).probabilities(at(9)).map(p=>p.id),['a','b']);
});
test('모든 이벤트가 재등장 금지되면 종료',()=>{
 const g=make([e('a',{choices:[{...c,disableEvent:true}]})]);g.start(at(9));g.tick(at(9)+1000);g.choose(0,at(9)+1000);
 assert.equal(g.state.phase,'finished');
});
test('현재 시간 후보가 없으면 카운트 소비 없이 대기하고 다음 수신 때 재평가',()=>{
 const g=make([e('night',{availability:{timeRanges:[{start:'22:00',end:'05:00'}]},pity:{start:'gameStart',count:3}})]);
 g.start(at(9));g.tick(at(9)+1000);
 assert.equal(g.state.phase,'waiting');assert.equal(g.state.waitingForSchedule,true);assert.equal(g.state.count,0);assert.equal(g.state.pity.night.remaining,3);assert.equal(g.state.deadline,at(9)+2000);
 g.tick(at(22));assert.equal(g.event.id,'night');assert.equal(g.state.count,1);assert.equal(g.state.waitingForSchedule,false);
});
test('특정 행동 선택 후 다음 방송이 시간 제한이면 종료하지 않음',()=>{
 const g=make([e('intro',{once:true}),e('late',{requires:{events:['intro']},availability:{timeRanges:[{start:'22:00',end:'05:00'}]}})]);
 g.start(at(9));g.tick(at(9)+1000);g.choose(0,at(9)+1000);
 assert.equal(g.state.phase,'waiting');assert.equal(g.state.waitingForSchedule,true);
 g.tick(at(22));assert.equal(g.event.id,'late');
});
test('천장도 시간 제한을 지키고 해제 시 우선 등장하며 금지된 이벤트는 제외',()=>{
 const g=make([e('normal'),e('night',{availability:{timeRanges:[{start:'22:00',end:'05:00'}]},pity:{start:'gameStart',count:0}})]);
 assert.deepEqual(g.probabilities(at(9)).map(p=>p.id),['normal']);assert.deepEqual(g.probabilities(at(22)),[{id:'night',probability:1,forced:true}]);
 g.state.completedChoices.push('night:ok');g.events[1].choices=[{...c,disableEvent:true}];
 assert.deepEqual(g.probabilities(at(22)).map(p=>p.id),['normal']);
});
test('이미 도착한 이벤트는 시간이 지나도 선택 가능',()=>{
 const g=make([e('a',{availability:{timeRanges:[{start:'09:00',end:'10:00'}]}})]);
 g.start(at(9));g.tick(at(9)+1000);g.tick(at(11));assert.equal(g.state.phase,'choice');assert.equal(g.choose(0,at(11)),true);assert.equal(g.state.phase,'waiting');
});
test('이전 저장 형식도 새로운 상태 필드 없이 복원',()=>{
 const g=make([e('a')]);delete g.state.waitingForSchedule;
 const restored=new RadioEngine(g.events,1,g.state,at(9),()=>0);assert.equal(restored.state.phase,'idle');
});
