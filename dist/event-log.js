// 기록 설명만 수정할 때는 진행을 유지하도록 저장 키에서 제외합니다.
export function eventsForStorage(events) {
  return events.map(({logDescription, ...event}) => event);
}
export function historyDescription(entry, events) {
  let event = entry.eventId ? events.find(event => event.id === entry.eventId) : null;
  if (!entry.eventId) {
    const matches = events.filter(event => event.title === entry.title);
    if (matches.length === 1) event = matches[0];
  }
  return event?.logDescription ?? entry.description ?? entry.result ?? '';
}
