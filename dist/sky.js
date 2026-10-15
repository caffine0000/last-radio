// 기기 현지 시각 기준의 연출입니다. 실제 날씨 API는 사용하지 않습니다.
export function skyPeriod(hour) {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'sunset';
  return 'night';
}
export function updateSky(now = new Date()) {
  const period = skyPeriod(now.getHours());
  document.documentElement.dataset.sky = period;
  const words = {dawn:'새벽빛 사이로 여우비가 내려요.',day:'햇살 사이로 여우비가 내려요.',sunset:'노을 사이로 여우비가 내려요.',night:'달빛 사이로 여우비가 내려요.'};
  const caption = document.getElementById('sky-caption');
  if (caption) caption.textContent = words[period];
  const clock = document.getElementById('local-clock');
  if (clock) {
    clock.textContent = now.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}) + ' · 나의 시간';
    clock.dateTime = now.toISOString();
  }
}
