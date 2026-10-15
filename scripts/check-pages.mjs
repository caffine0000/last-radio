import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

// 프로젝트 Pages의 /저장소/ 하위 경로에서도 동작하도록 절대 경로를 검사합니다.
const root = resolve('dist');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
const modules = ['app.js', 'engine.js', 'events.js', 'sky.js', 'room.js', 'room-config.js', 'event-media.js', 'radio-colors.js'];
for (const file of modules) {
  const source = await readFile(resolve(root, file), 'utf8');
  for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    refs.push(match[1]);
  }
}
for (const ref of refs) {
  if (/^(https?:|data:|#)/.test(ref)) continue;
  assert(!ref.startsWith('/'), `저장소 하위 경로를 벗어나는 주소: ${ref}`);
  const target = resolve(root, ref);
  assert(target === root || target.startsWith(root + sep), `dist 밖의 주소: ${ref}`);
  const info = await stat(target);
  assert(info.isFile() || ref === './', `배포 파일 없음: ${ref}`);
}
console.log('Pages 파일 및 저장소 하위 경로 검사 통과');
