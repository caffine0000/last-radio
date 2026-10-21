import test from 'node:test';
import assert from 'node:assert/strict';
import {eventImage,appendEventImage,appendCollectibleImage} from '../dist/event-media.js';
test('이미지는 선택 사항이며 저장소 하위 경로의 파일을 읽는다',()=>{
 assert.equal(eventImage(null),null);
 assert.deepEqual(eventImage({src:'images/one.webp'},'방송','https://user.github.io/radio/'),{src:'https://user.github.io/radio/images/one.webp',alt:'방송',caption:'',fit:'contain'});
});
test('외부 이미지, 대체 텍스트, 캡션과 맞춤 모드',()=>{
 const data=eventImage({src:'https://example.com/a.png',alt:'장면',caption:'출처',fit:'cover'});
 assert.equal(data.src,'https://example.com/a.png');assert.equal(data.fit,'cover');assert.equal(data.alt,'장면');assert.equal(data.caption,'출처');
 assert.throws(()=>eventImage({src:'javascript:alert(1)'}));assert.throws(()=>eventImage({src:''}));assert.throws(()=>eventImage({src:'a.jpg',fit:'invalid'}));
});
test('이미지 로딩 실패는 오류 안내로 대체하며 이벤트 화면을 유지',()=>{
 class Element{constructor(tag){this.tag=tag;this.style={};this.children=[];this.handlers={}}append(n){this.children.push(n)}replaceChildren(){this.children=[]}addEventListener(n,f){this.handlers[n]=f}}
 const doc={baseURI:'https://example.com/radio/',createElement:tag=>new Element(tag)};
 const parent=new Element('div');appendEventImage(parent,{src:'images/test.png',caption:'설명'},'제목',doc);
 const figure=parent.children[0],img=figure.children[0];assert.equal(img.src,'https://example.com/radio/images/test.png');assert.equal(img.alt,'제목');assert.equal(figure.children[1].textContent,'설명');
 img.handlers.error();assert.equal(parent.children.length,1);assert.equal(figure.children[0].textContent,'이미지를 불러오지 못했습니다.');
});


test('획득한 수집품만 이미지를 표시하고 미발견 시 이미지 요청도 하지 않는다',()=>{
 class Element{constructor(tag){this.tag=tag;this.style={};this.children=[];this.handlers={}}append(n){this.children.push(n)}replaceChildren(){this.children=[]}addEventListener(n,f){this.handlers[n]=f}}
 const doc={baseURI:'https://user.github.io/last-radio/',createElement:tag=>new Element(tag)};
 const item={name:'명물 디저트',image:{src:'images/famous-dessert.svg'}};
 const hidden=new Element('article');appendCollectibleImage(hidden,item,false,doc);assert.equal(hidden.children.length,0);
 const owned=new Element('article');appendCollectibleImage(owned,item,true,doc);
 assert.equal(owned.children[0].children[0].src,'https://user.github.io/last-radio/images/famous-dessert.svg');
 assert.equal(owned.children[0].children[0].alt,'명물 디저트');
 const noImage=new Element('article');appendCollectibleImage(noImage,{name:'사진 없음'},true,doc);assert.equal(noImage.children.length,0);
});
