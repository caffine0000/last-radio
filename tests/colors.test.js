import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRadioColors,normalizeHex,radioPalette,applyRadioColors,initRadioColors } from '../dist/radio-colors.js';
test('HEX 코드 정규화 및 잘못된 저장 색상 복원',()=>{
 assert.equal(normalizeHex(' #AA12fF '),'#aa12ff');assert.equal(normalizeHex('#abc'),null);
 assert.equal(normalizeHex('red'),null);assert.equal(normalizeHex('url(x)'),null);
 assert.deepEqual(radioPalette(null),defaultRadioColors);assert.equal(radioPalette({body:'bad'}).body,defaultRadioColors.body);
});
test('사용자 색상은 외장 세 파트와 외장 음영에만 적용',()=>{
 const styles=new Map();applyRadioColors({body:'#ff0000',display:'#000000',speaker:'#ffffff',knobs:'#ff00ff'},{style:{setProperty:(k,v)=>styles.set(k,v)}});
 assert.equal(styles.get('--radio-body'),'#ff0000');assert.equal(styles.get('--radio-body-shadow'),'#a60000');
 assert.deepEqual([...styles.keys()].sort(),['--radio-body','--radio-body-shadow','--radio-handle','--radio-trim','--radio-trim-shadow'].sort());
});
test('이전 저장의 본체색은 유지하고 조작부 색상은 가져오지 않음',()=>{
 const migrated=radioPalette({body:'#123456',display:'#ff0000',speaker:'#ff0000',knobs:'#ff0000'});
 assert.equal(migrated.body,'#123456');assert.equal(migrated.trim,defaultRadioColors.trim);assert.equal(migrated.handle,defaultRadioColors.handle);
 assert.deepEqual(Object.keys(migrated),['body','trim','handle']);
});
test('색상 미리보기, 적용, 저장 복원, 기본색 복구를 게임 저장과 분리',()=>{
 const elements={},styles=new Map(),storage=new Map();
 for(const part of Object.keys(defaultRadioColors))for(const prefix of ['color-','picker-'])elements[prefix+part]={value:'',handlers:{},addEventListener(n,f){this.handlers[n]=f},reportValidity(){return !!normalizeHex(this.value)}};
 const root={documentElement:{style:{setProperty:(k,v)=>styles.set(k,v)}},getElementById:id=>elements[id]};
 const store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const ui=initRadioColors('colors',root,store);
 elements['color-body'].value='#112233';elements['color-body'].handlers.input();assert.equal(styles.get('--radio-body'),'#112233');assert.equal(storage.size,0);
 ui.restore();assert.equal(elements['color-body'].value,defaultRadioColors.body);
 elements['picker-body'].value='#123456';elements['picker-body'].handlers.input();assert.equal(elements['color-body'].value,'#123456');
 assert.equal(ui.save().saved,true);initRadioColors('colors',root,store);assert.equal(elements['color-body'].value,'#123456');
 ui.reset();assert.equal(elements['color-body'].value,defaultRadioColors.body);assert.equal(JSON.parse(storage.get('colors')).body,'#123456');
 elements['color-handle'].value='bad';assert.equal(ui.save().valid,false);
});
