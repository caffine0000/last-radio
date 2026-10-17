export function localDateKey(now = Date.now()) {
  const date = new Date(now);
  return `${date.getFullYear().toString().padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
function minutes(value, end = false) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h,m] = value.split(':').map(Number);
  if (end && h === 24 && m === 0) return 1440;
  return h < 24 && m < 60 ? h * 60 + m : null;
}
export function validateAvailability(availability) {
  if (availability === undefined) return;
  if (!availability || typeof availability !== 'object' || Array.isArray(availability)) throw new Error('availability는 설정 객체여야 합니다.');
  if (Object.keys(availability).some(key => !['dates','dateRange','timeRanges'].includes(key))) throw new Error('availability의 필드 이름을 확인하세요.');
  const {dates,dateRange,timeRanges} = availability;
  if (dates !== undefined && (!Array.isArray(dates) || !dates.length || dates.some(d => !validDate(d)))) throw new Error('dates는 YYYY-MM-DD 날짜 배열로 작성하세요.');
  if (dateRange !== undefined && (!dateRange || !validDate(dateRange.start) || !validDate(dateRange.end) || dateRange.start > dateRange.end)) throw new Error('dateRange의 시작·종료 날짜를 확인하세요.');
  if (timeRanges !== undefined && (!Array.isArray(timeRanges) || !timeRanges.length || timeRanges.some(r => !r || minutes(r.start) === null || minutes(r.end,true) === null || minutes(r.start) === minutes(r.end,true)))) throw new Error('timeRanges는 서로 다른 시작·종료 시각(HH:MM)으로 작성하세요.');
}
export function matchesAvailability(availability, now = Date.now()) {
  if (!availability) return true;
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) return false;
  const key = localDateKey(now);
  if (availability.dates && !availability.dates.includes(key)) return false;
  if (availability.dateRange && (key < availability.dateRange.start || key > availability.dateRange.end)) return false;
  if (!availability.timeRanges) return true;
  const minute = date.getHours() * 60 + date.getMinutes();
  return availability.timeRanges.some(range => {
    const start = minutes(range.start),end = minutes(range.end,true);
    return start < end ? minute >= start && minute < end : minute >= start || minute < end;
  });
}
