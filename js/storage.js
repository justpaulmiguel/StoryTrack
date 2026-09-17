function save(){localStorage.setItem(KEY,JSON.stringify(items));render()}
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

function openAdd(){
  populateTypeSelects();
  $("modalTitle").textContent="Add story";$("form").reset();$("editId").value="";
  $("fType").value="Book";$("fCustomType").style.display="none";$("fCustomType").value="";
  $("fProgress").value=0;$("fTotal").value="";$("fRating").value=0;
  $("fUnit").value=defaultUnitForType("Book");$("fCustomUnit").style.display="none";$("fCustomUnit").value="";
  $("modal").classList.add("show")
}
function editItem(id){
  let x=items.find(i=>i.id===id);if(!x)return;
  populateTypeSelects();
  $("modalTitle").textContent="Edit story";$("editId").value=x.id;
  $("fTitle").value=x.title;
  if([...$("fType").options].some(o=>o.value===x.type)){$("fType").value=x.type}else{$("fType").value="Book"}
  $("fCustomType").style.display="none";$("fCustomType").value="";
  $("fCreator").value=x.creator||"";$("fStatus").value=x.status;
  $("fProgress").value=x.progress||0;$("fTotal").value=(x.total==null?"":x.total);
  let u=effectiveUnit(x);
  if(UNIT_VALUES.includes(u)){$("fUnit").value=u;$("fCustomUnit").style.display="none";$("fCustomUnit").value=""}
  else{$("fUnit").value="custom";$("fCustomUnit").style.display="block";$("fCustomUnit").value=u}
  $("fRating").value=x.rating||0;$("fYear").value=x.year||"";$("fCover").value=x.cover||"";$("fNotes").value=x.notes||"";
  $("modal").classList.add("show")
}
function closeModal(){$("modal").classList.remove("show")}

$("fType").addEventListener("change",()=>{
  let v=$("fType").value;
  $("fCustomType").style.display=v==="__custom__"?"block":"none";
  if(v!=="__custom__"){$("fUnit").value=defaultUnitForType(v);$("fUnit").dispatchEvent(new Event("change"))}
});
$("fUnit").addEventListener("change",()=>{
  $("fCustomUnit").style.display=$("fUnit").value==="custom"?"block":"none";
});

$("form").onsubmit=e=>{
  e.preventDefault();
  let id=$("editId").value;
  let typeVal=$("fType").value;
  let finalType=typeVal==="__custom__"?($("fCustomType").value.trim()||"Custom"):typeVal;
  addCustomType(finalType);
  let unitVal=$("fUnit").value;
  let finalUnit=unitVal==="custom"?($("fCustomUnit").value.trim()||"items"):unitVal;
  let totalRaw=$("fTotal").value.trim();
  let total=totalRaw===""?null:(+totalRaw||0);
  let x={id:id||crypto.randomUUID(),title:$("fTitle").value.trim(),type:finalType,creator:$("fCreator").value.trim(),status:$("fStatus").value,progress:+$("fProgress").value||0,total:total,unit:finalUnit,rating:+$("fRating").value||0,year:+$("fYear").value||"",cover:$("fCover").value.trim(),notes:$("fNotes").value.trim(),updated:Date.now()};
  if(id){let n=items.findIndex(i=>i.id===id);items[n]=x}else items.unshift(x);
  closeModal();populateTypeSelects();save()
};

async function exportData(){
  let payload={version:2,exportedAt:Date.now(),items:items,customTypes:customTypes};
  let filename="storytrack-backup-"+new Date().toISOString().slice(0,10)+".json";
  let blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  let downloads=await getCapability("downloads");
  if(!downloads){alert("File downloads aren't available in this view.");return}
  try{
    await downloads.save({filename,data:blob});
    localStorage.setItem(BACKUP_KEY,String(Date.now()));
    updateBackupNote();
  }catch(err){
    if(err&&err.code==="declined")return;
    alert("Couldn't save the backup file.");
  }
}
function updateBackupNote(){
  let ts=localStorage.getItem(BACKUP_KEY), el=$("backupNote");
  if(!ts){el.textContent="No backups yet — tap Export to save a copy you control.";el.style.color="var(--danger)";return}
  let days=Math.floor((Date.now()-(+ts))/86400000);
  if(days<=0){el.textContent="Backed up today.";el.style.color="var(--muted)"}
  else{el.textContent=`Last backup: ${days} day${days===1?"":"s"} ago.`;el.style.color=days>=14?"var(--danger)":"var(--muted)"}
}
$("importFile").addEventListener("change",e=>{
  let file=e.target.files[0];if(!file)return;
  let reader=new FileReader();
  reader.onload=()=>{
    try{
      let data=JSON.parse(reader.result);
      let incoming=Array.isArray(data)?data:(data.items||[]);
      let incomingTypes=Array.isArray(data)?[]:(data.customTypes||[]);
      if(!Array.isArray(incoming)) throw new Error("bad format");
      let added=0,updated=0;
      incoming.forEach(x=>{
        if(!x||!x.id)return;
        let idx=items.findIndex(i=>i.id===x.id);
        if(idx>-1){items[idx]=x;updated++}else{items.push(x);added++}
      });
      incomingTypes.forEach(t=>addCustomType(t));
      populateTypeSelects();save();
      alert(`Import complete: ${added} added, ${updated} updated.`);
    }catch(err){
      alert("Couldn't read that file — make sure it's a StoryTrack backup (.json).");
    }
    e.target.value="";
  };
  reader.readAsText(file);
});
