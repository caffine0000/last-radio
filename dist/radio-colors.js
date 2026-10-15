export const defaultRadioColors = {body:'#78a9a4',trim:'#cad5cc',handle:'#a7b9b1'};
export function normalizeHex(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : null;
}
export function radioPalette(input = {}) {
  return Object.fromEntries(Object.entries(defaultRadioColors).map(([part,fallback])=>[part,normalizeHex(input?.[part]) || fallback]));
}
function darker(hex) { return '#' + hex.slice(1).match(/../g).map(n=>Math.round(parseInt(n,16)*.65).toString(16).padStart(2,'0')).join(''); }
export function applyRadioColors(colors, root = document.documentElement) {
  const palette=radioPalette(colors);
  for (const [part,color] of Object.entries(palette)) root.style.setProperty('--radio-'+part,color);
  root.style.setProperty('--radio-body-shadow',darker(palette.body));
  root.style.setProperty('--radio-trim-shadow',darker(palette.trim));
}
export function initRadioColors(key, root = document, storage = null) {
  if (!storage) { try {storage=localStorage;} catch {} }
  let colors=radioPalette();
  try {colors=radioPalette(JSON.parse(storage?.getItem(key)));} catch {}
  function show(palette) {
    applyRadioColors(palette,root.documentElement);
    for (const part of Object.keys(defaultRadioColors)) {
      root.getElementById('color-'+part).value=palette[part];
      root.getElementById('picker-'+part).value=palette[part];
    }
  }
  function read() { return Object.fromEntries(Object.keys(defaultRadioColors).map(part=>[part,root.getElementById('color-'+part).value])); }
  for (const part of Object.keys(defaultRadioColors)) {
    const code=root.getElementById('color-'+part),picker=root.getElementById('picker-'+part);
    code.addEventListener('input',()=>{const hex=normalizeHex(code.value);if(hex){picker.value=hex;applyRadioColors(read(),root.documentElement);}});
    picker.addEventListener('input',()=>{code.value=picker.value;applyRadioColors(read(),root.documentElement);});
  }
  show(colors);
  return {
    restore(){show(colors);},
    reset(){show(defaultRadioColors);},
    save(){
      for(const part of Object.keys(defaultRadioColors)) if(!root.getElementById('color-'+part).reportValidity()) return {valid:false};
      colors=radioPalette(read());show(colors);
      try { if(!storage) throw new Error('no storage');storage.setItem(key,JSON.stringify(colors));return {valid:true,saved:true}; }
      catch {return {valid:true,saved:false};}
    },
  };
}
