import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoom, updateRoom } from '../dist/room.js';
test('미보유 상태에는 기본 창가, 획득하면 해당 소품만 표시',()=>{
 assert.deepEqual(resolveRoom([]),{decorations:[],accent:null});
 assert.deepEqual(resolveRoom(['item-01']),{decorations:[],accent:null});
});
test('복수 수집 조건, 소품 중복 제거, 색상 우선순위',()=>{
 const rules=[{requiresItems:['a','b'],show:['glass-vase','books','unknown'],accent:'#123456'},{requiresItems:['a'],show:['books','photo-frame'],accent:'#abcdef'}];
 assert.deepEqual(resolveRoom(['a'],rules),{decorations:['books','photo-frame'],accent:'#abcdef'});
 assert.deepEqual(resolveRoom(['a','b'],rules),{decorations:['glass-vase','books','photo-frame'],accent:'#abcdef'});
 assert.deepEqual(resolveRoom(['x'],rules),{decorations:[],accent:null});
});
test('저장 복원과 리셋에 따라 소품과 색상을 갱신',()=>{
 const props=['desk-lamp','books'].map(id=>({dataset:{roomDecoration:id},hidden:true,toggleAttribute(key,value){this[key]=value;}}));
 const classes=new Set(),styles=new Map();
 const scene={classList:{toggle(k,v){v?classes.add(k):classes.delete(k)}},style:{setProperty(k,v){styles.set(k,v)},removeProperty(k){styles.delete(k)}}};
 const root={querySelectorAll:()=>props,querySelector:()=>scene};
 updateRoom(['item-01'],root);assert.equal(props[0].hidden,true);assert.equal(props[1].hidden,true);assert.equal(classes.has('has-desk-lamp'),false);
 updateRoom([],root);assert.equal(props[0].hidden,true);assert.equal(classes.size,0);assert.equal(styles.size,0);
});
