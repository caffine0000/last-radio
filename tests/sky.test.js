import test from 'node:test';
import assert from 'node:assert/strict';
import { skyPeriod, updateSky } from '../dist/sky.js';
test('현지 시각의 새벽·낮·노을·밤 경계', () => {
  for (const [h,period] of [[0,'night'],[4,'night'],[5,'dawn'],[7,'dawn'],[8,'day'],[15,'day'],[16,'sunset'],[18,'sunset'],[19,'night'],[23,'night']]) assert.equal(skyPeriod(h),period);
});
test('하늘, 창가 문구, 시계가 함께 갱신된다', () => {
  const elements = {'sky-caption':{},'local-clock':{}};
  globalThis.document = {documentElement:{dataset:{}},getElementById:id=>elements[id]};
  updateSky(new Date(2026,9,15,17,30));
  assert.equal(document.documentElement.dataset.sky,'sunset');
  assert.match(elements['sky-caption'].textContent,/노을/);
  assert.match(elements['local-clock'].textContent,/17:30/);
  updateSky(new Date(2026,9,15,22,10));
  assert.equal(document.documentElement.dataset.sky,'night');
  assert.match(elements['sky-caption'].textContent,/달빛/);
  delete globalThis.document;
});
