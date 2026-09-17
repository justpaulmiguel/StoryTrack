function openAdd(){
  populateTypeSelects();
  $("modalTitle").textContent="Add story";$("form").reset();$("editId").value="";
  $("fType").value="Book";$("fCustomType").style.display="none";$("fCustomType").value="";
  $("fStoryStatus").value="unknown";$("fProgress").value=0;$("fTotal").value="";$("fRating").value=0;
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
  $("fCreator").value=x.creator||"";$("fStatus").value=x.status||"want";$("fStoryStatus").value=x.storyStatus||"unknown";
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
  let x={id:id||crypto.randomUUID(),title:$("fTitle").value.trim(),type:finalType,creator:$("fCreator").value.trim(),status:$("fStatus").value,storyStatus:$("fStoryStatus").value,progress:+$("fProgress").value||0,total:total,unit:finalUnit,rating:+$("fRating").value||0,year:+$("fYear").value||"",cover:$("fCover").value.trim(),notes:$("fNotes").value.trim(),updated:Date.now()};
  if(id){let n=items.findIndex(i=>i.id===id);items[n]=x}else items.unshift(x);
  closeModal();populateTypeSelects();save()
};
function removeItem(id){if(confirm("Delete this item?")){items=items.filter(i=>i.id!==id);save()}}
function statusText(s){return {want:"Want to read/watch",reading:"Currently reading",watching:"Currently watching",finished:"Finished",dnf:"DNF / Dropped"}[s]||"Unknown"}
function storyStatusText(s){return {ongoing:"Ongoing",completed:"Completed",hiatus:"Hiatus",cancelled:"Cancelled",unknown:"Story status not set"}[s]||"Story status not set"}

function openDetails(id){
  let x=items.find(i=>i.id===id); if(!x)return;
  let u=effectiveUnit(x), pct=progressPct(x), progress=progressLabel(x);
  let cover=x.cover?`style="background-image:url('${x.cover.replaceAll("'","%27")}')"`:"";
  let progressBlock="";
  if(pct!=null){
    progressBlock=`<div class="detail-progress"><div class="meta">Progress · ${esc(progress)}${u!=="%"?` · ${pct}%`:""}</div><div class="progress"><i style="width:${pct}%"></i></div></div>`;
  }else if(x.progress){
    progressBlock=`<div class="detail-progress"><div class="meta">Progress · ${esc(progress)}</div></div>`;
  }
  $("detailContent").innerHTML=`
    <div class="detail-top">
      <div class="detail-cover" ${cover}>${x.cover?"":`<b>${typeIcon(x.type)}</b>`}</div>
      <div>
        <div class="detail-type">${esc(x.type)}</div>
        <div class="detail-title">${esc(x.title)}</div>
        <div class="detail-creator">${esc(x.creator||"No creator/author added")}${x.year?` · ${x.year}`:""}</div>
        <span class="badge">${statusText(x.status)}</span>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><small>Your status</small><b>${esc(statusText(x.status))}</b></div>
      <div class="detail-item"><small>Story status</small><b>${esc(storyStatusText(x.storyStatus))}</b></div>
      <div class="detail-item"><small>Progress unit</small><b>${esc(u)}</b></div>
      <div class="detail-item"><small>Rating</small><b>${x.rating?`★ ${x.rating}/10`:"Not rated"}</b></div>
    </div>
    ${progressBlock}
    ${x.notes?`<div class="detail-notes"><strong>Notes</strong><br>${esc(x.notes)}</div>`:""}
    <div class="detail-actions">
      <button class="btn primary" onclick="closeDetails();editItem('${x.id}')">Edit</button>
      <button class="btn danger" onclick="closeDetails();removeItem('${x.id}')">Delete</button>
      <button class="btn" onclick="closeDetails()">Close</button>
    </div>`;
  $("detailModal").classList.add("show");
}
function closeDetails(){$("detailModal").classList.remove("show")}

function render(){
  populateTypeSelects();
  let q=$("search").value.toLowerCase(),t=$("type").value,s=$("sort").value;
  let filtered=items.filter(x=>{
    let inGroup = group==="all" ? true : GROUPS[group].includes(x.status);
    let inSub = group!=="progress" || sub==="all" || (sub==="ongoing" ? x.storyStatus==="ongoing" : x.status===sub);
    return inGroup && inSub && (t==="all"||x.type===t) && ((x.title+" "+x.creator+" "+x.notes).toLowerCase().includes(q));
  });
  filtered.sort((a,b)=>s==="title"?a.title.localeCompare(b.title):s==="rating"?b.rating-a.rating:b.updated-a.updated);
  $("shown").textContent=filtered.length;
  $("total").textContent=items.length;
  $("done").textContent=items.filter(x=>x.status==="finished").length;
  let statusCounts={want:0,reading:0,watching:0,finished:0,dnf:0};
  items.forEach(x=>{if(statusCounts.hasOwnProperty(x.status))statusCounts[x.status]++});
  $("cnt-all").textContent=items.length;
  $("cnt-progress").textContent=statusCounts.reading+statusCounts.watching;
  $("cnt-backlog").textContent=statusCounts.want;
  $("cnt-completed").textContent=statusCounts.finished;
  $("cnt-dropped").textContent=statusCounts.dnf;
  $("cnt-sub-reading").textContent=statusCounts.reading;
  $("cnt-sub-watching").textContent=statusCounts.watching;
  $("cnt-sub-ongoing").textContent=items.filter(x=>x.storyStatus==="ongoing" && ["reading","watching"].includes(x.status)).length;
  let heading={
    all:["My Stories","Everything you're tracking, in one place."],
    backlog:["Backlog","Things you want to get to."],
    completed:["Completed","Stories you've finished."],
    dropped:["Dropped","Stuff you decided not to continue."],
    progress:{all:["In Progress","Everything you're actively reading, watching or following."],reading:["Reading","Books you're currently reading."],watching:["Watching","Movies and series you're currently watching."],ongoing:["Ongoing Stories","Stories that are still being published or released."]}
  };
  let [h,d]=group==="progress"?heading.progress[sub]:heading[group];
  $("heading").textContent=h;$("description").textContent=d;
  if(!filtered.length){$("grid").innerHTML='<div class="empty">Nothing here yet.<br><br><button class="btn primary" onclick="openAdd()">＋ Add your first story</button></div>';return}
  $("grid").innerHTML='<div class="grid">'+filtered.map(x=>{
    return `<article class="card" role="button" tabindex="0" onclick="openDetails('${x.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetails('${x.id}')}"><div class="cover" ${x.cover?`style="background-image:url('${x.cover.replaceAll("'","%27")}')"`:""}>${x.cover?"":`<b>${typeIcon(x.type)}</b>`}</div><div class="body"><div class="title">${esc(x.title)}</div></div></article>`;
  }).join('')+'</div>';
}

document.querySelectorAll("#primaryTabs .tab").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#primaryTabs .tab").forEach(z=>z.classList.remove("active"));
  b.classList.add("active");
  group=b.dataset.group; sub="all";
  $("subTabs").style.display = group==="progress" ? "flex" : "none";
  if(group==="progress"){
    document.querySelectorAll("#subTabs .chip").forEach(z=>z.classList.remove("active"));
    $("subTabs").querySelector('[data-sub="all"]').classList.add("active");
  }
  render();
});
document.querySelectorAll("#subTabs .chip").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#subTabs .chip").forEach(z=>z.classList.remove("active"));
  b.classList.add("active");
  sub=b.dataset.sub;
  render();
});
["search","type","sort"].forEach(id=>$(id).oninput=render);
