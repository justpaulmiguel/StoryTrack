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
function removeItem(id){if(confirm("Delete this item?")){items=items.filter(i=>i.id!==id);save()}}
function statusText(s){return {want:"Want to read/watch",reading:"Currently reading",watching:"Currently watching",ongoing:"Ongoing / Incomplete",finished:"Finished",dnf:"DNF / Dropped"}[s]}

function render(){
  populateTypeSelects();
  let q=$("search").value.toLowerCase(),t=$("type").value,s=$("sort").value;
  let filtered=items.filter(x=>{
    let inGroup = group==="all" ? true : GROUPS[group].includes(x.status);
    let inSub = group!=="progress" || sub==="all" || x.status===sub;
    return inGroup && inSub && (t==="all"||x.type===t) && ((x.title+" "+x.creator+" "+x.notes).toLowerCase().includes(q));
  });
  filtered.sort((a,b)=>s==="title"?a.title.localeCompare(b.title):s==="rating"?b.rating-a.rating:b.updated-a.updated);
  $("shown").textContent=filtered.length;
  $("total").textContent=items.length;
  $("done").textContent=items.filter(x=>x.status==="finished").length;
  let statusCounts={want:0,reading:0,watching:0,ongoing:0,finished:0,dnf:0};
  items.forEach(x=>{if(statusCounts.hasOwnProperty(x.status))statusCounts[x.status]++});
  $("cnt-all").textContent=items.length;
  $("cnt-progress").textContent=statusCounts.reading+statusCounts.watching+statusCounts.ongoing;
  $("cnt-backlog").textContent=statusCounts.want;
  $("cnt-completed").textContent=statusCounts.finished;
  $("cnt-dropped").textContent=statusCounts.dnf;
  $("cnt-sub-reading").textContent=statusCounts.reading;
  $("cnt-sub-watching").textContent=statusCounts.watching;
  $("cnt-sub-ongoing").textContent=statusCounts.ongoing;
  let heading={
    all:["My Stories","Everything you're tracking, in one place."],
    backlog:["Backlog","Things you want to get to."],
    completed:["Completed","Stories you've finished."],
    dropped:["Dropped","Stuff you decided not to continue."],
    progress:{
      all:["In Progress","Everything you're actively reading, watching or following."],
      reading:["Reading","Books you're currently reading."],
      watching:["Watching","Movies and series you're currently watching."],
      ongoing:["Ongoing / Incomplete","Manga, series, podcasts and more that haven't concluded yet."]
    }
  };
  let [h,d]= group==="progress" ? heading.progress[sub] : heading[group];
  $("heading").textContent=h;$("description").textContent=d;
  if(!filtered.length){$("grid").innerHTML='<div class="empty">Nothing here yet.<br><br><button class="btn primary" onclick="openAdd()">＋ Add your first story</button></div>';return}
  $("grid").innerHTML='<div class="grid">'+filtered.map(x=>{
    let u=effectiveUnit(x);
    let known=u==="%"||(x.total!=null&&x.total>0);
    let progressHtml="";
    if(known){
      let pct=progressPct(x);
      progressHtml=`<div class="progress"><i style="width:${pct}%"></i></div><div class="meta">${progressLabel(x)}${u!=="%"?` · ${pct}%`:""}</div>`;
    }else if(x.progress){
      progressHtml=`<div class="progress ongoing"><i></i></div><div class="meta">${progressLabel(x)}</div>`;
    }
    return `<article class="card"><div class="cover" ${x.cover?`style="background-image:url('${x.cover.replaceAll("'","%27")}')"`:""}>${x.cover?"":`<b>${typeIcon(x.type)}</b>`}</div><div class="body"><div class="type">${esc(x.type)}</div><div class="title">${esc(x.title)}</div><div class="meta">${esc(x.creator||"—")}${x.year?" · "+x.year:""}</div><span class="badge">${statusText(x.status)}</span>${progressHtml}${x.rating?`<div class="meta" style="margin-top:7px">★ ${x.rating}/10</div>`:""}<div class="cardfoot"><button class="small" onclick="editItem('${x.id}')">Edit</button><button class="small danger" onclick="removeItem('${x.id}')">Delete</button></div></div></article>`;
  }).join("")+'</div>'
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
