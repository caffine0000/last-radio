import { roomRules } from './room-config.js';
export const roomDecorations = ['desk-lamp','books','photo-frame','glass-vase'];
export function resolveRoom(inventory, rules = roomRules) {
  const owned = new Set(inventory);
  const decorations = new Set();
  let accent = null;
  for (const rule of rules) {
    // 조건이 없는 규칙은 자동 해금하지 않습니다. id의 오타도 미해금으로 처리합니다.
    if (!Array.isArray(rule.requiresItems) || !rule.requiresItems.length || !rule.requiresItems.every(id => owned.has(id))) continue;
    for (const id of rule.show || []) if (roomDecorations.includes(id)) decorations.add(id);
    if (/^#[0-9a-f]{6}$/i.test(rule.accent || '')) accent = rule.accent;
  }
  return {decorations:[...decorations],accent};
}
export function updateRoom(inventory, root = document) {
  const room = resolveRoom(inventory);
  for (const element of root.querySelectorAll('[data-room-decoration]')) {
    const visible = room.decorations.includes(element.dataset.roomDecoration);
    element.toggleAttribute('hidden',!visible);
  }
  const scene = root.querySelector('.window-scene');
  if (scene) {
    scene.classList.toggle('has-desk-lamp',room.decorations.includes('desk-lamp'));
    if (room.accent) scene.style.setProperty('--room-accent',room.accent);
    else scene.style.removeProperty('--room-accent');
  }
}
