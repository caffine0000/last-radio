import test from 'node:test';
import assert from 'node:assert/strict';
import {historyDescription,eventsForStorage} from '../dist/event-log.js';
import {RadioEngine,validateEvents} from '../dist/engine.js';
import {events,collectibles} from '../dist/events.js';
const expected="처음으로 들어본 오프닝. 종말이라는 말과 달리, '팰리스'라는 자는 발랄하다.";
test('오프닝의 청취 기록 전용 설명과 실제 방송 내용 분리',()=>{
 assert.equal(events[0].logDescription,expected);
 const g=new RadioEngine(events,1,null,0,()=>0,collectibles);g.start(0);g.tick(1000);g.completeObservation(2000);
 assert.equal(g.state.history[0].eventId,'opening');assert.equal(g.state.history[0].description,expected);assert.equal(g.state.history[0].result,'오프닝을 들었다.');
 assert.equal(historyDescription(g.state.history[0],events),expected);
});
test('이전 기록도 유일한 제목으로 최신 설명을 표시',()=>{
 assert.equal(historyDescription({title:'오프닝',result:'이전 설명'},events),expected);
 assert.equal(historyDescription({title:'중복',result:'이전'},[{id:'a',title:'중복',logDescription:'a'},{id:'b',title:'중복',logDescription:'b'}]),'이전');
 assert.equal(historyDescription({eventId:'deleted',title:'오프닝',result:'기존 기록'},events),'기존 기록');
});
test('설명 미설정 시 기존 기록을 보존하며 설명만 수정하면 저장 키는 유지',()=>{
 assert.equal(historyDescription({eventId:'a',description:'저장된 설명',result:'결과'},[{id:'a'}]),'저장된 설명');
 assert.equal(historyDescription({result:'결과'},[]),'결과');
 const old=events.map(({logDescription,...event})=>event);
 assert.equal(JSON.stringify({events:eventsForStorage(events),collectibles}),JSON.stringify({events:old,collectibles}));
 assert.equal(JSON.stringify(eventsForStorage(events.map(event=>({...event,logDescription:'다른 설명'})))),JSON.stringify(old));
});
test('기록 설명은 문자열만 허용',()=>{
 assert.throws(()=>validateEvents([{...events[0],logDescription:123}],collectibles));
});
