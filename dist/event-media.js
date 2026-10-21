export function eventImage(image, title = '', base = 'https://example.invalid/game/') {
  if (!image) return null;
  const data = typeof image === 'string' ? {src:image} : image;
  if (!data || typeof data.src !== 'string' || !data.src.trim()) throw new Error('이벤트 이미지의 src를 확인하세요.');
  const url = new URL(data.src, base);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('이벤트 이미지는 파일 경로나 HTTPS 주소를 사용하세요.');
  if (data.fit && !['contain','cover'].includes(data.fit)) throw new Error('이미지 fit은 contain 또는 cover로 설정하세요.');
  return {src:url.href,alt:typeof data.alt === 'string' ? data.alt : title,caption:typeof data.caption === 'string' ? data.caption : '',fit:data.fit || 'contain'};
}
export function appendEventImage(parent, image, title, doc = document) {
  const data = eventImage(image,title,doc.baseURI);
  if (!data) return;
  const figure = doc.createElement('figure');figure.className='event-image';
  const img = doc.createElement('img');img.alt=data.alt;img.decoding='async';img.style.objectFit=data.fit;
  img.addEventListener('error',()=>{
    figure.replaceChildren();
    const error = doc.createElement('p');error.className='image-error';error.textContent='이미지를 불러오지 못했습니다.';
    figure.append(error);
  },{once:true});
  figure.append(img);
  if(data.caption){const caption=doc.createElement('figcaption');caption.textContent=data.caption;figure.append(caption);}
  parent.append(figure);
  img.src=data.src;
}

export function appendCollectibleImage(parent, item, owned, doc = document) {
  if (owned && item.image) appendEventImage(parent, item.image, item.name, doc);
}
