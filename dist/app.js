import { historyDescription, eventsForStorage, collectiblesForStorage, compatibleProgress } from './event-log.js';
import { initRadioColors } from './radio-colors.js';
import { appendEventImage, appendCollectibleImage } from './event-media.js';
import { updateRoom } from './room.js';
import { updateSky } from './sky.js';
import { settings, events, collectibles } from './events.js';
import { RadioEngine } from './engine.js';

const $ = id => document.getElementById(id);
// 이벤트 데이터를 바꾸면 기존 저장 데이터와 섞이지 않도록 별도로 저장합니다.
const radioColors = initRadioColors('last-radio-colors-v1:' + location.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/'));
const keyPrefix = 'last-radio-v2:' + location.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/') + ':';
const key = keyPrefix + JSON.stringify({events:eventsForStorage(events), collectibles:collectiblesForStorage(collectibles)});
let saved;
try { saved = JSON.parse(localStorage.getItem(key)) ?? compatibleProgress(localStorage, keyPrefix, events, collectibles); } catch { /* 저장 없이도 플레이 가능 */ }
let engine;
try { engine = new RadioEngine(events, settings.cooldownSeconds, saved, Date.now(), Math.random, collectibles); }
catch (error) { $('message').textContent = error.message; $('power').disabled = true; throw error; }
// 새로고침으로 확인창은 닫히므로 보존된 남은 시간부터 재개합니다.
engine.resume('settings'); engine.resume('collection');
function persist() {
  try { localStorage.setItem(key, JSON.stringify(engine.state)); }
  catch { $('save-status').textContent = '저장 공간에 접근할 수 없어 이번 플레이는 저장되지 않습니다.'; }
}
function node(tag, text, cls) {
  const n = document.createElement(tag); n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function updateClock() {
  const s = engine.state;
  const ms = engine.remaining();
  const seconds = Math.ceil(ms / 1000);
  $('timer').textContent = s.phase === 'idle' ? format(Math.ceil(s.cooldown / s.speed)) : s.phase === 'choice' ? 'ON AIR' : s.phase === 'finished' ? '––:––' : format(seconds);
  const observationCountdown = $('observation-countdown');
  if (observationCountdown) observationCountdown.textContent = s.pauseReasons.length ? '일시정지' : `${seconds}초 후 자동 진행`;
  $('progress-fill').style.width = (s.phase === 'choice' || s.phase === 'finished' ? 100 : s.phase === 'idle' ? 0 : 100 * (1 - ms / Math.max(1, s.intervalTotal))) + '%';
}
function format(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function render() {
  const s = engine.state;
  updateRoom(s.inventory);
  const observation = s.phase === 'observation';
  const active = s.phase === 'choice' || observation;
  document.body.classList.toggle('receiving', active);
  $('signal').textContent = ({idle:'방송을 기다리며',waiting:'방송 대기중',paused:'재생 중지',choice:'누군가 말을 걸어왔어요',observation:'방송을 듣고 있습니다',finished:'오늘의 방송을 마치며'})[s.phase];
  if (observation && s.pauseReasons.length) $('signal').textContent = '재생 중지';
  $('phase-badge').textContent = ({idle:'STANDBY',waiting:'TUNING',paused:'PAUSED',choice:'ON AIR',observation:'LISTENING',finished:'END OF SIGNAL'})[s.phase];
  $('frequency').textContent = active ? engine.event.frequency || '––.–' : '––.–';
  $('channel').textContent = `${String(s.count).padStart(3, '0')} RECEIVED`;
  $('power').textContent = ({idle:'라디오 켜기 ↗',waiting:'잠깐 쉬기 Ⅱ',paused:'다시 듣기 ↗',choice:'방송이 왔어요 ♪',observation:s.pauseReasons.includes('manual') ? '다시 듣기 ↗' : '잠깐 쉬기 Ⅱ',finished:'방송 종료'})[s.phase];
  $('power').disabled = s.phase === 'choice' || s.phase === 'finished';
  $('timer-note').textContent = ({idle:'전원을 켜면 첫 번째 방송을 기다립니다.',waiting:'다음 신호를 기다리고 있습니다.',paused:'남은 시간이 보존됩니다.',choice:'행동을 선택하면 다음 수신이 시작됩니다.',observation:'10초 동안 관람하거나 아래 버튼을 누르면 진행됩니다.',finished:'현재 등장 가능한 방송이 없습니다.'})[s.phase];
  const message = $('message'); message.replaceChildren();
  message.append(node('div', active ? '⌁' : '· · ·', 'message-icon'));
  message.append(node('h2', active ? engine.event.title : ({idle:'청취 대기',waiting:'다음 방송을 기다립니다.',paused:'청취를 잠시 멈췄습니다.',finished:'오늘의 방송 종료'})[s.phase]));
  if (active) appendEventImage(message, engine.event.image, engine.event.title);
  message.append(node('p', active ? engine.event.text : ({idle:'서류를 잠시 내려놓은 수사관의 사무실.\n창가의 라디오를 켜면 누군가의 이야기가 찾아옵니다.',waiting:'창문에는 빗방울이, 방 안에는 작은 잡음이.\n다음 이야기가 들려올 때까지 잠시 귀를 기울입니다.',paused:'준비가 되면 수신을 재개하세요.',finished:'더 이상 등장 가능한 방송이 없습니다.\n처음부터 들으려면 수신 설정에서 진행을 초기화하세요.'})[s.phase]));
  if (s.phase === 'waiting' && s.waitingForSchedule) {
    message.replaceChildren(node('h2', '다음 방송 시간을 기다립니다.'), node('p', '지금은 방송 시간이 아닙니다.\n다음 수신 때 다시 확인합니다.'));
    $('timer-note').textContent = '방송 시간이 되면 다음 수신 때 이야기가 도착합니다.';
  }
  if (s.phase === 'waiting' && s.waitingForRepeat) {
    message.replaceChildren(node('h2', '다른 방송을 기다립니다.'), node('p', '같은 방송을 연속으로 듣지 않도록 다른 방송을 기다립니다.'));
    $('timer-note').textContent = '다른 방송이 가능해지면 수신을 재개합니다.';
  }
  const choices = $('choices'); choices.replaceChildren();
  if (s.phase === 'choice') engine.event.choices.forEach((choice, index) => {
    const button = node('button', '', 'choice');
    button.append(node('b', String(index + 1).padStart(2, '0')), node('span', choice.text), node('span', '↗', 'arrow'));
    button.addEventListener('click', () => {
      if (!engine.choose(index)) return;
      persist(); render();
    });
    choices.append(button);
  });
  if (observation) {
    const note = node('p', '', 'observation-note');
    note.append(node('span', '선택 없이 듣는 방송 · '));
    const countdown = node('span', ''); countdown.id = 'observation-countdown'; note.append(countdown);
    const button = node('button', engine.event.continueText || '계속 듣기 →', 'choice observation-continue');
    button.disabled = s.pauseReasons.length > 0;
    button.addEventListener('click', () => { if (engine.completeObservation()) { persist(); render(); } });
    choices.append(note, button);
  }
  $('log-count').textContent = String(s.history.length).padStart(2, '0');
  const history = $('history'); history.replaceChildren();
  if (!s.history.length) history.append(node('p', '아직 수신 기록이 없습니다. 첫 번째 방송을 기다려 주세요.', 'empty-log'));
  for (const entry of s.history) {
    const row = node('article', '', 'log-row');
    const time = node('time', new Date(entry.at).toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit',hour12:false}));
    time.dateTime = new Date(entry.at).toISOString();
    const content = node('div', '');
    content.append(node('h3', entry.title), node('p', '↳ ' + (entry.choice === '관람 완료' ? '감상 완료' : entry.choice), 'chosen'), node('p', historyDescription(entry, events)));
    if (entry.gained?.length) content.append(node('p', '수집품 획득: ' + entry.gained.map(id => collectibles.find(item => item.id === id)?.name || id).join(', '), 'chosen'));
    row.append(time, content); history.append(row);
  }
  $('collection-count').textContent = `${s.inventory.length} / ${collectibles.length}`;
  const list = $('collection-list'); list.replaceChildren();
  if (!collectibles.length) list.append(node('p', '등록된 수집품이 없습니다.'));
  for (const item of collectibles) {
    const owned = s.inventory.includes(item.id);
    const card = node('article', '', 'collection-card');
    card.append(node('h3', owned ? item.name : '미발견 수집품'));
    appendCollectibleImage(card, item, owned);
    card.append(node('p', owned ? item.description : '방송에서 행동을 선택하여 발견하세요.'));
    list.append(card);
  }
  updateClock();
}
$('cooldown').value = engine.state.cooldown;
$('speed').value = engine.state.speed;
$('power').addEventListener('click', () => {
  if (engine.state.phase === 'idle') engine.start();
  else engine.togglePause();
  persist(); render();
});
for (const name of ['settings', 'collection']) {
  const dialog = $(name + '-dialog');
  $('open-' + name).addEventListener('click', () => {
    engine.pause(name);
    persist(); render(); dialog.showModal();
  });
  $('close-' + name).addEventListener('click', () => dialog.close());
  // Escape 또는 닫기 버튼으로 닫아도 해당 창의 정지만 해제합니다.
  dialog.addEventListener('close', () => { if(name === 'settings') radioColors.restore(); engine.resume(name); persist(); render(); });
}
$('save-settings').addEventListener('click', () => {
  if (!$('cooldown').reportValidity()) return;
  const colorResult = radioColors.save();
  if (!colorResult.valid) return;
  engine.setCooldown(Number($('cooldown').value));
  engine.setSpeed(Number($('speed').value));
  persist(); updateClock(); $('save-status').textContent = colorResult.saved ? '설정과 라디오 색상을 저장했습니다.' : '설정을 적용했지만 브라우저 저장 공간에 접근할 수 없어 색상이 유지되지 않습니다.';
});
$('reset-radio-colors').addEventListener('click', () => radioColors.reset());
$('reset').addEventListener('click', () => {
  if (!confirm('기록, 해금, 천장 카운트, 수집품을 모두 지울까요?')) return;
  const speed = engine.state.speed;
  engine = new RadioEngine(events, engine.state.cooldown, null, Date.now(), Math.random, collectibles);
  engine.setSpeed(speed);
  engine.pause('settings');
  persist(); render();
  $('save-status').textContent = '진행을 초기화했습니다. 설정을 닫고 수신을 시작하세요.';
});
setInterval(() => {
  if (engine.tick()) { persist(); render(); }
  else updateClock();
}, 200);
updateSky();
setInterval(() => updateSky(), 30000);
document.addEventListener('visibilitychange', () => {
  updateSky();
  if (engine.tick()) { persist(); render(); } else updateClock();
});
persist(); render();
