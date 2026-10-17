import { validateAvailability, matchesAvailability } from './schedule.js';
import { eventImage } from './event-media.js';
export function validateEvents(events, collectibles = []) {
  if (!Array.isArray(events) || !events.length) throw new Error('이벤트를 하나 이상 등록하세요.');
  const ids = new Set(events.map(e => e.id));
  const items = new Set(collectibles.map(i => i.id));
  const choices = new Set(events.flatMap(e => (e.choices || []).map(c => `${e.id}:${c.id}`)));
  if (items.size !== collectibles.length || collectibles.some(i => !i.id || typeof i.name !== 'string' || typeof i.description !== 'string')) throw new Error('수집품 정의를 확인하세요.');
  if (ids.size !== events.length) throw new Error('이벤트 id가 중복되었습니다.');
  for (const e of events) {
    eventImage(e.image, e.title);
    try { validateAvailability(e.availability); } catch (error) { throw new Error(`${e.id}: ${error.message}`); }
    if (!e.id || typeof e.title !== 'string' || typeof e.text !== 'string' || !Number.isFinite(e.weight) || e.weight < 0 || !Array.isArray(e.choices) || !e.choices.length) throw new Error(`${e.id}: 이벤트 형식을 확인하세요.`);
    if (e.pity && (!Number.isInteger(e.pity.count) || e.pity.count < 0 || !['gameStart', 'trigger'].includes(e.pity.start))) throw new Error(`${e.id}: 천장 설정을 확인하세요.`);
    if ((e.requires?.events || []).some(id => !ids.has(id)) || (e.requires?.choices || []).some(id => !choices.has(id))) throw new Error(`${e.id}: 선행 조건 id를 확인하세요.`);
    const seen = new Set();
    for (const c of e.choices) {
      if (!c.id || seen.has(c.id) || typeof c.text !== 'string' || typeof c.result !== 'string') throw new Error(`${e.id}: 행동 id와 문구를 확인하세요.`);
      if (c.disableEvent !== undefined && typeof c.disableEvent !== 'boolean') throw new Error(`${e.id}: disableEvent는 true 또는 false여야 합니다.`);
      seen.add(c.id);
      if ((c.grantItems || []).some(id => !items.has(id))) throw new Error(`${e.id}: 수집품 id를 확인하세요.`);
      if ((c.startPity || []).some(id => !events.find(event => event.id === id)?.pity)) throw new Error(`${e.id}: 천장 대상 id를 확인하세요.`);
    }
  }
}

export class RadioEngine {
  constructor(events, seconds = 15, saved = null, now = Date.now(), random = Math.random, collectibles = []) {
    validateEvents(events, collectibles);
    this.events = events;
    this.collectibles = collectibles;
    this.random = random;
    this.state = this.validSave(saved) ? structuredClone(saved) : {
      version: 2, phase: 'idle', eventId: null, count: 0, forced: false, waitingForSchedule: false,
      deadline: null, remaining: 0, intervalTotal: 0, pauseReasons: [],
      cooldown: this.validSeconds(seconds), speed: 1, history: [],
      completedEvents: [], completedChoices: [], inventory: [], pity: {},
    };
    if (!saved || !this.validSave(saved)) for (const e of events) {
      if (e.pity?.start === 'gameStart') this.startPity(e.id);
    }
    this.tick(now);
  }
  validSeconds(n) { return Math.max(1, Math.min(3600, Number(n) || 15)); }
  validSave(s) {
    if (!s || s.version !== 2 || !['idle','waiting','paused','choice','finished'].includes(s.phase)) return false;
    if (!Number.isFinite(s.cooldown) || s.cooldown < 1 || s.cooldown > 3600 || ![0.5,1,2,4,8].includes(s.speed)) return false;
    if (!Number.isInteger(s.count) || s.count < 0 || !Number.isFinite(s.intervalTotal) || s.intervalTotal < 0 || !Number.isFinite(s.remaining) || s.remaining < 0) return false;
    if (s.phase === 'waiting' && !Number.isFinite(s.deadline)) return false;
    if (!Array.isArray(s.pauseReasons) || s.pauseReasons.some(r => !['manual','settings','collection'].includes(r)) || (s.phase === 'paused' && !s.pauseReasons.length)) return false;
    if (s.phase === 'waiting' && s.pauseReasons.length) return false;
    if (!['completedEvents','completedChoices','inventory','history'].every(k => Array.isArray(s[k]))) return false;
    if (s.completedEvents.some(id => !this.events.some(e => e.id === id)) || s.completedChoices.some(id => !this.events.some(e => e.choices.some(c => `${e.id}:${c.id}` === id))) || s.inventory.some(id => !this.collectibles.some(i => i.id === id))) return false;
    if (s.history.some(h => !h || typeof h.title !== 'string' || typeof h.choice !== 'string' || typeof h.result !== 'string' || !Number.isFinite(h.at))) return false;
    if (s.phase === 'choice' && !this.events.some(e => e.id === s.eventId)) return false;
    return s.pity && typeof s.pity === 'object' && !Array.isArray(s.pity) && Object.entries(s.pity).every(([id,p]) => this.events.some(e => e.id === id && e.pity) && p && Number.isInteger(p.remaining) && p.remaining >= 0 && typeof p.fired === 'boolean');
  }
  get event() { return this.events.find(e => e.id === this.state.eventId); }
  baseEligible(e) {
    const s = this.state;
    return !(e.once && s.completedEvents.includes(e.id)) &&
      !e.choices.some(c => c.disableEvent && s.completedChoices.includes(`${e.id}:${c.id}`)) &&
      (e.requires?.events || []).every(id => s.completedEvents.includes(id)) &&
      (e.requires?.choices || []).every(id => s.completedChoices.includes(id));
  }
  eligible(e, now = Date.now()) { return this.baseEligible(e) && matchesAvailability(e.availability, now); }
  candidates(now = Date.now()) {
    const available = this.events.filter(e => this.eligible(e, now) && e.weight > 0);
    const due = available.filter(e => this.state.pity[e.id]?.remaining === 0 && !this.state.pity[e.id].fired);
    return { events: due.length ? due : available, forced: due.length > 0 };
  }
  probabilities(now = Date.now()) {
    const {events, forced} = this.candidates(now);
    const total = events.reduce((sum, e) => sum + e.weight, 0);
    return events.map(e => ({id:e.id, probability:e.weight / total, forced}));
  }
  draw(now = Date.now()) {
    const pool = this.candidates(now);
    if (!pool.events.length) {
      if (this.events.some(e => this.baseEligible(e) && e.weight > 0)) this.wait(now, true);
      else { this.state.phase = 'finished'; this.state.deadline = null; this.state.waitingForSchedule = false; }
      return;
    }
    this.state.waitingForSchedule = false;
    let roll = this.random() * pool.events.reduce((sum,e) => sum + e.weight, 0);
    let event = pool.events.at(-1);
    for (const e of pool.events) { roll -= e.weight; if (roll < 0) { event = e; break; } }
    // 일반 방송 등장 시에만 감쇠. 0이 된 천장은 그 다음 방송을 강제합니다.
    if (!pool.forced) for (const pity of Object.values(this.state.pity)) {
      if (!pity.fired) pity.remaining = Math.max(0, pity.remaining - 1);
    }
    const ownPity = this.state.pity[event.id];
    if (ownPity && !ownPity.fired) ownPity.fired = true;
    this.state.eventId = event.id;
    this.state.forced = pool.forced;
    this.state.count++;
    this.state.phase = 'choice';
    this.state.deadline = null;
  }
  startPity(id) {
    const event = this.events.find(e => e.id === id);
    // 천장은 게임당 한 번만 시작합니다. 같은 트리거를 반복해도 초기화하지 않습니다.
    if (!event?.pity || this.state.pity[id]) return;
    this.state.pity[id] = {remaining:event.pity.count, fired:false};
  }
  wait(now, waitingForSchedule = false) {
    const s = this.state;
    s.waitingForSchedule = waitingForSchedule;
    s.remaining = s.cooldown * 1000 / s.speed;
    s.intervalTotal = s.remaining;
    s.phase = s.pauseReasons.length ? 'paused' : 'waiting';
    s.deadline = s.phase === 'waiting' ? now + s.remaining : null;
  }
  start(now = Date.now()) { if (this.state.phase === 'idle') this.wait(now); }
  tick(now = Date.now()) {
    if (this.state.phase === 'waiting' && now >= this.state.deadline) { this.draw(now); return true; }
    return false;
  }
  choose(index, now = Date.now()) {
    if (this.state.phase !== 'choice' || !Number.isInteger(index) || !this.event.choices[index]) return false;
    const e = this.event, c = e.choices[index], s = this.state;
    if (!s.completedEvents.includes(e.id)) s.completedEvents.push(e.id);
    if (!s.completedChoices.includes(`${e.id}:${c.id}`)) s.completedChoices.push(`${e.id}:${c.id}`);
    const gained = [...new Set(c.grantItems || [])].filter(id => !s.inventory.includes(id));
    s.inventory.push(...gained);
    for (const id of c.startPity || []) this.startPity(id);
    s.history.unshift({title:e.title, choice:c.text, result:c.result, at:now, gained, forced:s.forced});
    s.history = s.history.slice(0, 200);
    s.eventId = null;
    if (!this.events.some(event => this.baseEligible(event) && event.weight > 0)) { s.phase = 'finished'; s.deadline = null; s.waitingForSchedule = false; }
    else this.wait(now, !this.candidates(now).events.length);
    return true;
  }
  pause(reason, now = Date.now()) {
    if (this.state.pauseReasons.includes(reason)) return;
    if (this.state.phase === 'waiting') {
      // 모달을 연 순간부터 정지하며, 이미 만료된 경우에도 닫을 때까지 표시를 미룹니다.
      this.state.remaining = this.remaining(now);
      this.state.deadline = null;
      this.state.phase = 'paused';
    }
    this.state.pauseReasons.push(reason);
  }
  resume(reason, now = Date.now()) {
    this.state.pauseReasons = this.state.pauseReasons.filter(r => r !== reason);
    if (this.state.phase === 'paused' && !this.state.pauseReasons.length) {
      this.state.deadline = now + this.state.remaining;
      this.state.phase = 'waiting';
    }
  }
  togglePause(now = Date.now()) {
    if (this.state.pauseReasons.includes('manual')) this.resume('manual',now);
    else this.pause('manual',now);
  }
  setCooldown(seconds) { this.state.cooldown = this.validSeconds(seconds); }
  setSpeed(speed, now = Date.now()) {
    if (![0.5,1,2,4,8].includes(speed)) return false;
    const s = this.state, ratio = s.speed / speed;
    s.remaining = this.remaining(now) * ratio;
    s.intervalTotal *= ratio;
    if (s.phase === 'waiting') s.deadline = now + s.remaining;
    s.speed = speed;
    return true;
  }
  remaining(now = Date.now()) {
    return this.state.phase === 'waiting' ? Math.max(0,this.state.deadline - now) : this.state.phase === 'paused' ? this.state.remaining : 0;
  }
}
