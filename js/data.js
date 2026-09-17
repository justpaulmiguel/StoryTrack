const KEY="storytrack_v1", TYPE_KEY="storytrack_types_v1", BACKUP_KEY="storytrack_last_backup";
const BUILTIN_TYPES=["Book","Movie","Series"];
const UNIT_VALUES=["pages","chapters","episodes","volumes","seasons","%","items"];
const UNIT_SINGULAR={pages:"Page",chapters:"Chapter",episodes:"Episode",volumes:"Volume",seasons:"Season",items:"Item"};
const GROUPS={all:null,progress:["reading","watching","ongoing"],backlog:["want"],completed:["finished"],dropped:["dnf"]};
let items=JSON.parse(localStorage.getItem(KEY)||"[]");
let customTypes=JSON.parse(localStorage.getItem(TYPE_KEY)||"[]");
let group="all", sub="all";
const $=id=>document.getElementById(id);
