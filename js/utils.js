// utils.js
async function getCapability(name){
  try{
    if(!window.claude||typeof window.claude.use!=="function") return null;
    return await window.claude.use(name);
  }catch(e){return null}
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function capitalize(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s}
function defaultUnitForType(t){
  const map={book:"pages",movie:"%",series:"episodes",manga:"chapters",manhwa:"chapters",webtoon:"chapters",comic:"chapters","light novel":"chapters",anime:"episodes",podcast:"episodes",game:"%",documentary:"%"};
  return map[(t||"").toLowerCase()]||"items";
}
function typeIcon(t){
  const map={book:"📖",movie:"🎬",series:"📺",manga:"📗",manhwa:"📗",webtoon:"📱",comic:"💬",anime:"🎞️",podcast:"🎙️",game:"🎮",documentary:"🎥","light novel":"📕"};
  return map[(t||"").toLowerCase()]||"🗂️";
}
function effectiveUnit(x){return x.unit||defaultUnitForType(x.type)}
function progressPct(x){
  let u=effectiveUnit(x);
  if(u==="%") return Math.min(100,Math.max(0,x.progress||0));
  if(x.total==null||x.total===0) return null;
  return Math.min(100,Math.round((x.progress/x.total)*100));
}
function progressLabel(x){
  let u=effectiveUnit(x);
  if(u==="%") return `${Math.min(100,Math.max(0,x.progress||0))}%`;
  if(x.total==null||x.total===0){
    let label=UNIT_SINGULAR[u]||capitalize(u);
    return `${label} ${x.progress}`;
  }
  return `${x.progress} / ${x.total} ${u}`;
}
