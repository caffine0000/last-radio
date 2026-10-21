import test from 'node:test';
import assert from 'node:assert/strict';
import {historyDescription,eventsForStorage,collectiblesForStorage,compatibleProgress} from '../dist/event-log.js';
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
 const old=events.map(({logDescription,tags,...event})=>event);
 assert.equal(JSON.stringify({events:eventsForStorage(events),collectibles}),JSON.stringify({events:old,collectibles}));
 assert.equal(JSON.stringify(eventsForStorage(events.map(event=>({...event,logDescription:'다른 설명'})))),JSON.stringify(old));
});
test('기록 설명은 문자열만 허용',()=>{
 assert.throws(()=>validateEvents([{...events[0],logDescription:123}],collectibles));
});

test('내부 태그만 추가·수정·삭제해도 저장 키와 기존 진행 유지',()=>{
 const plain=[{id:'opening',title:'오프닝',weight:100}];
 const tagged=[{...plain[0],tags:['오프닝','음악']}];
 assert.deepEqual(eventsForStorage(tagged),eventsForStorage(plain));
 assert.deepEqual(eventsForStorage([{...plain[0],tags:[]}]),eventsForStorage(plain));
});


test('수집품 이미지·설명 변경 후 이전 저장을 찾아 획득 상태를 보존',()=>{
 const items=[{id:'dessert',name:'명물 디저트',description:'예전 설명'}];
 const updated=[{...items[0],description:'새 설명',image:{src:'images/dessert.svg'}}];
 assert.deepEqual(collectiblesForStorage(items),collectiblesForStorage(updated));
 const prefix='last-radio-v2:/last-radio/:';
 const oldKey=prefix+JSON.stringify({events,collectibles:items});
 const save={history:[{at:100}],inventory:['dessert'],count:5};
 const data=new Map([[oldKey,JSON.stringify(save)],['unrelated','invalid'],[prefix+'broken','broken']]);
 const storage={get length(){return data.size},key:i=>[...data.keys()][i],getItem:key=>data.get(key)};
 assert.deepEqual(compatibleProgress(storage,prefix,events,updated),save);
 assert.equal(compatibleProgress(storage,prefix,[{id:'other'}],updated),null);
 assert.equal(compatibleProgress(storage,prefix,events,[{id:'different'}]),null);
});

test('고양이 블루스의 이전 청취 기록에도 마침표 적용',()=>{
 assert.equal(historyDescription({eventId:'cat-blues',result:'고양이의 노랫소리에 편안해진다'},events),'고양이의 노랫소리에 편안해진다.');
});
test('견본 수집품 삭제 후 실제 수집품과 진행을 보존하고 옛 스탠드 수집품만 제거',()=>{
 assert.deepEqual(collectibles.map(item=>item.id),['famous-dessert']);
 const prefix='last-radio-v2:/last-radio/:';
 const oldItems=[{id:'item-01',name:'견본',description:'설명'},...collectibles];
 const oldKey=prefix+JSON.stringify({events,collectibles:oldItems});
 const save={history:[{eventId:'dessert-talk',at:100}],inventory:['item-01','famous-dessert'],completedChoices:['dessert-talk:buy-dessert']};
 const storage={length:1,key:()=>oldKey,getItem:()=>JSON.stringify(save)};
 const migrated=compatibleProgress(storage,prefix,events,collectibles);
 assert.deepEqual(migrated.inventory,['famous-dessert']);assert.deepEqual(migrated.completedChoices,save.completedChoices);assert.deepEqual(migrated.history,save.history);
});
