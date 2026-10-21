// 기록 설명과 내부 분류 태그만 수정할 때는 진행을 유지합니다.
export function eventsForStorage(events) {
  return events.map(({logDescription, tags, ...event}) => event);
}
export function historyDescription(entry, events) {
  let event = entry.eventId ? events.find(event => event.id === entry.eventId) : null;
  if (!entry.eventId) {
    const matches = events.filter(event => event.title === entry.title);
    if (matches.length === 1) event = matches[0];
  }
  return event?.logDescription ?? entry.description ?? entry.result ?? '';
}

// 수집품 표시 정보는 진행 조건에 영향을 주지 않습니다.
export function collectiblesForStorage(items) { return items.map(({id}) => ({id})); }
export function compatibleProgress(storage, prefix, events, items) {
  const eventKey = JSON.stringify(eventsForStorage(events));
  const itemKey = JSON.stringify(collectiblesForStorage(items));
  let found = null, latest = -1;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const definitions = JSON.parse(key.slice(prefix.length));
      if (JSON.stringify(eventsForStorage(definitions.events)) !== eventKey || JSON.stringify(collectiblesForStorage(definitions.collectibles)) !== itemKey) continue;
      const save = JSON.parse(storage.getItem(key));
      if (!save || !Array.isArray(save.history)) continue;
      const time = Math.max(0, ...save.history.map(entry => Number(entry.at) || 0));
      if (time > latest) { found = save; latest = time; }
    } catch { /* 손상되었거나 다른 형식인 저장은 건너뜁니다. */ }
  }
  return found;
}
