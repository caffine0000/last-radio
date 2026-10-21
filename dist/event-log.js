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
