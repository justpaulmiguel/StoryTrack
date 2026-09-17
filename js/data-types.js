function saveTypes(){localStorage.setItem(TYPE_KEY,JSON.stringify(customTypes))}

function allTypes(){
  let set=new Set(BUILTIN_TYPES.concat(customTypes));
  items.forEach(x=>set.add(x.type));
  return Array.from(set);
}
function addCustomType(t){
  if(t && !BUILTIN_TYPES.includes(t) && !customTypes.includes(t)){customTypes.push(t);saveTypes()}
}
function defaultUnitForType(t){
  const map={book:"pages",movie:"%",series:"episodes",manga:"chapters",manhwa:"chapters",webtoon:"chapters",comic:"chapters","light novel":"chapters",anime:"episodes",podcast:"episodes",game:"%",documentary:"%"};
  return map[(t||"").toLowerCase()]||"items";
}
function typeIcon(t){
  const map={book:"📖",movie:"🎬",series:"📺",manga:"📗",manhwa:"📗",webtoon:"📱",comic:"💬",anime:"🎞️",podcast:"🎙️",game:"🎮",documentary:"🎥","light novel":"📕"};
  return map[(t||"").toLowerCase()]||"🗂️";
}
function capitalize(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s}
function effectiveUnit(x){return x.unit||defaultUnitForType(x.type)}

function populateTypeSelects(){
  let sel=$("type"), cur=sel.value;
  sel.innerHTML='<option value="all">All types</option>'+allTypes().map(t=>`<option>${esc(t)}</option>`).join("");
  sel.value=allTypes().includes(cur)?cur:"all";

  let f=$("fType");
  f.innerHTML=BUILTIN_TYPES.concat(customTypes.filter(t=>!BUILTIN_TYPES.includes(t))).map(t=>`<option>${esc(t)}</option>`).join("")+'<option value="__custom__">+ Custom Type</option>';
}

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
