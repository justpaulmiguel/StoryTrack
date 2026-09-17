const KEY="storytrack_v1", TYPE_KEY="storytrack_types_v1", BACKUP_KEY="storytrack_last_backup";
const BUILTIN_TYPES=["Book","Movie","Series"];
const UNIT_VALUES=["pages","chapters","episodes","volumes","seasons","%","items"];
const UNIT_SINGULAR={pages:"Page",chapters:"Chapter",episodes:"Episode",volumes:"Volume",seasons:"Season",items:"Item"};
const GROUPS={all:null,progress:["reading","watching"],backlog:["want"],completed:["finished"],dropped:["dnf"]};
let items=JSON.parse(localStorage.getItem(KEY)||"[]");
// Migrate the old combined "ongoing" status into separate user/story statuses.
let migrated=false;
items=items.map(x=>{
  if(x.status==="ongoing"){migrated=true;return {...x,status:"reading",storyStatus:"ongoing"}}
  if(!x.storyStatus){migrated=true;return {...x,storyStatus:"unknown"}}
  return x;
});
if(migrated)localStorage.setItem(KEY,JSON.stringify(items));
let customTypes=JSON.parse(localStorage.getItem(TYPE_KEY)||"[]");
let group="all", sub="all";
const $=id=>document.getElementById(id);
