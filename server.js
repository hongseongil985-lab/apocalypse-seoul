var http=require("http");
var url=require("url");

var PORT=process.env.PORT||3000;

var regions=[
"서울역","강남","강북","홍대","종로","명동","잠실","여의도","마포","용산",
"동대문","성수","금천","은평","관악","광진","영등포","구로","신촌","한강"
];

var jobs=[
"생존자","사냥꾼","탐색자","의무병","정비공","상인"
];

var monsterJobs=[
"크리처","좀비","외계인","아귀","대세아귀"
];

var guilds=[
"하운더","약탈자","범죄자들 모임","가출팸","시민연합",
"철벽","유랑민","한강연합","폐공장연합","상인연합","별의 후예"
];

var teamTiers=[
"드문","희귀","레어","영웅","신화","전설",
"고대","절대","불가능","불가사이","신","최초","오류"
];

var world={
korea:{
platform:"kakao",
players:{},
rooms:{},
events:[],
games:{}
},
asia:{
platform:"instagram",
players:{},
rooms:{},
events:[],
games:{}
}
};

var eventId=1;

function send(res,data){
res.writeHead(200,{"Content-Type":"application/json; charset=utf-8"});
res.end(JSON.stringify(data));
}

function read(req,cb){
var s="";
req.on("data",function(x){s+=x;});
req.on("end",function(){
try{cb(s?JSON.parse(s):{});}
catch(e){cb({});}
});
}

function getWorld(req){
return req.headers["x-platform"]==="instagram"?world.asia:world.korea;
}

function normalizePlayer(p){
if(p.maxHp==null)p.maxHp=100;
if(p.hp==null)p.hp=p.maxHp;

if(p.maxMp==null)p.maxMp=100;
if(p.mp==null)p.mp=p.maxMp;

if(p.maxHunger==null)p.maxHunger=100;
if(p.hunger==null)p.hunger=p.maxHunger;

if(p.maxThirst==null)p.maxThirst=100;
if(p.thirst==null)p.thirst=p.maxThirst;

if(p.attack==null)p.attack=10;
if(p.defense==null)p.defense=10;
if(p.agility==null)p.agility=10;
if(p.accuracy==null)p.accuracy=10;
if(p.mentality==null)p.mentality=10;

if(p.coin==null)p.coin=0;

if(!p.items)p.items={};
if(!p.friends)p.friends=[];
if(!p.requests)p.requests=[];

if(!p.faction)p.faction="";
if(!p.monsterType)p.monsterType="";
if(!p.traits)p.traits=[];
if(!p.abilities)p.abilities=[];

if(p.teamTier==null)p.teamTier="드문";
if(p.teamLevel==null)p.teamLevel=1;

if(p.eatenAllies==null)p.eatenAllies=0;
if(p.eatenTotal==null)p.eatenTotal=0;

if(!p.titles)p.titles=[];
if(p.equippedTitle==null)p.equippedTitle="";

return p;
}

function makePlayer(id,name,room){
return{
id:id,
name:name,
room:room||"",
level:1,
exp:0,
hp:100,
maxHp:100,
mp:100,
maxMp:100,
hunger:100,
maxHunger:100,
thirst:100,
maxThirst:100,
attack:10,
defense:10,
agility:10,
accuracy:10,
mentality:10,
money:1000,
coin:0,
region:"서울역",
job:"",
guild:"",
faction:"",
monsterType:"",
traits:[],
abilities:[],
teamTier:"드문",
teamLevel:1,
items:{"물":1,"빵":1},
friends:[],
requests:[],
eatenAllies:0,
eatenTotal:0,
titles:[],
equippedTitle:"",
created:Date.now()
};
}

function findPlayer(w,id){
var p=w.players[id];
if(!p)return null;
return normalizePlayer(p);
}

function findName(w,name){
var ids=Object.keys(w.players);
for(var i=0;i<ids.length;i++){
var p=normalizePlayer(w.players[ids[i]]);
if(p.name===name)return p;
}
return null;
}

function exp(p,n){
p.exp+=n;
var need=p.level*100;
var t="";

while(p.exp>=need){
p.exp-=need;
p.level++;
p.maxHp+=10;
p.hp=p.maxHp;
p.maxMp+=10;
p.mp=p.maxMp;
t+="\n🎉 Lv."+p.level+" 레벨업!";
need=p.level*100;
}

return t;
}

function item(p,n,c){
if(!p.items[n])p.items[n]=0;
p.items[n]+=c;
}

function addEvent(w,message){
var e={
id:eventId++,
message:message,
time:Date.now()
};

w.events.push(e);

if(w.events.length>100){
w.events.shift();
}

return e;
}

function coinFound(w,p){
p.coin++;

var message=
"📢 [코인 발견] "+
p.name+
"님이 "+
p.region+
"에서 코인을 발견하였습니다! 🪙";

addEvent(w,message);

return message;
}

function statName(n){
var map={
"공격력":"attack",
"공격":"attack",
"방어력":"defense",
"방어":"defense",
"민첩":"agility",
"민첩성":"agility",
"명중률":"accuracy",
"명중":"accuracy",
"정신력":"mentality",
"정신":"mentality",
"체력":"hp",
"HP":"hp",
"마력":"mp",
"MP":"mp"
};

return map[n]||"";
}

function upgradeStat(p,n){
var key=statName(n);

if(!key){
return{
success:false,
message:"강화할 수 없는 스탯입니다."
};
}

if(p.coin<1){
return{
success:false,
message:"🪙 코인이 부족합니다."
};
}

if(key==="hp"){
p.maxHp+=10;
p.hp+=10;
}else if(key==="mp"){
p.maxMp+=10;
p.mp+=10;
}else{
p[key]++;
}

p.coin--;

var text=
"🪙 코인 1개 사용!\n\n"+
"📈 "+n+" 강화 완료!";

return{
success:true,
message:text,
player:p
};
}

function monsterTrait(type){
var traits=[
"멘헤라",
"고스트",
"방사능",
"아귀",
"대세아귀"
];

if(type==="크리처"||type==="좀비"||type==="외계인"){
return traits[Math.floor(Math.random()*3)];
}

return type;
}

function canBecomeMonster(p){
return p.faction==="괴물진영";
}

function eatTarget(w,p,target){
if(!p||!target){
return{
success:false,
message:"대상을 찾을 수 없습니다."
};
}

if(p.monsterType!=="아귀"&&p.monsterType!=="대세아귀"){
return{
success:false,
message:"아귀 계열만 사용할 수 있습니다."
};
}

if(p.id===target.id){
return{
success:false,
message:"자기 자신은 먹을 수 없습니다."
};
}

var absorbedAttack=target.attack||10;
var absorbedDefense=target.defense||10;
var absorbedAgility=target.agility||10;
var absorbedAccuracy=target.accuracy||10;
var absorbedMentality=target.mentality||10;

p.attack+=Math.max(1,Math.floor(absorbedAttack/10));
p.defense+=Math.max(1,Math.floor(absorbedDefense/10));
p.agility+=Math.max(1,Math.floor(absorbedAgility/10));
p.accuracy+=Math.max(1,Math.floor(absorbedAccuracy/10));
p.mentality+=Math.max(1,Math.floor(absorbedMentality/10));

p.eatenTotal++;

if(target.faction==="괴물진영"){
p.eatenAllies++;
}

var text=
"👹 "+target.name+"을(를) 먹어치웠습니다!\n"+
"⚔️ 공격력 흡수\n"+
"🛡️ 방어력 흡수\n"+
"⚡ 민첩 흡수\n"+
"🎯 명중률 흡수\n"+
"🧠 정신력 흡수";

if(target.monsterType==="좀비"){
var chance=p.monsterType==="대세아귀"?0.01:0.005;

if(Math.random()<chance){
text+="\n\n[입안에서 무언가 딱딱한 것이 느껴진다.]";
text+="\n🪙 코인 1개를 발견했습니다!";
text+="\n"+coinFound(w,p);
}
}

if(p.monsterType==="대세아귀"&&p.eatenAllies>=100&&!p._secretConditionDone){
p._secretConditionDone=true;
p.titles.push("대세아귀");
text+="\n\n👹 숨겨진 조건을 달성했습니다.";
}

return{
success:true,
message:text,
player:p
};
}

var server=http.createServer(function(req,res){

var q=url.parse(req.url,true);
var path=q.pathname;
var method=req.method;
var w=getWorld(req);

if(path==="/"&&method==="GET"){
send(res,{
status:"online",
server:"apocalypse-seoul",
platform:w.platform,
region:w.platform==="kakao"?"KOREA":"ASIA",
players:Object.keys(w.players).length,
regions:regions.length,
guilds:guilds.length,
coins:"rare"
});
return;
}

if(path==="/api/world"&&method==="GET"){
send(res,{
success:true,
platform:w.platform,
region:w.platform==="kakao"?"KOREA":"ASIA",
players:Object.keys(w.players).length,
regions:regions,
jobs:jobs,
monsterJobs:monsterJobs,
guilds:guilds,
teamTiers:teamTiers
});
return;
}

if(path==="/api/events"&&method==="GET"){
var after=Number(q.query.after||0);

var events=w.events.filter(function(e){
return e.id>after;
});

send(res,{
success:true,
events:events
});
return;
}

if(path==="/api/register"&&method==="POST"){
read(req,function(d){

if(!d.id||!d.name){
send(res,{
success:false,
message:"닉네임을 입력하세요."
});
return;
}

if(w.players[d.id]){
send(res,{
success:false,
message:"이미 가입되어 있습니다."
});
return;
}

if(findName(w,d.name)){
send(res,{
success:false,
message:"이미 사용 중인 닉네임입니다."
});
return;
}

w.players[d.id]=makePlayer(d.id,d.name,d.room);

send(res,{
success:true,
message:"☣️ "+d.name+" 가입 완료!"
});

});

return;
}

if(path==="/api/start"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 /가입 닉네임"
});
return;
}

send(res,{
success:true,
message:
"☣️ 아포칼립스 서울에 입장했습니다.\n"+
"📍 현재 위치: "+p.region
});

});

return;
}

if(path==="/api/player"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

send(res,{
success:true,
player:p
});

});

return;
}

if(path==="/api/stats"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

send(res,{
success:true,
stats:{
hp:p.hp,
maxHp:p.maxHp,
mp:p.mp,
maxMp:p.maxMp,
hunger:p.hunger,
maxHunger:p.maxHunger,
thirst:p.thirst,
maxThirst:p.maxThirst,
attack:p.attack,
defense:p.defense,
agility:p.agility,
accuracy:p.accuracy,
mentality:p.mentality,
coin:p.coin
}
});

});

return;
}

if(path==="/api/stat-upgrade"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

var r=upgradeStat(p,d.stat);

send(res,r);

});

return;
}

if(path==="/api/faction"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

if(p.faction){
send(res,{
success:false,
message:"이미 진영을 선택했습니다."
});
return;
}

if(d.faction!=="인간진영"&&d.faction!=="괴물진영"){
send(res,{
success:false,
message:"인간진영 또는 괴물진영을 선택하세요."
});
return;
}

p.faction=d.faction;

send(res,{
success:true,
message:"⚔️ "+d.faction+" 선택 완료!"
});

});

return;
}

if(path==="/api/job"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

if(d.job==="대세아귀"){
send(res,{
success:false,
message:"[히든조건을 달성해야합니다.]"
});
return;
}

if(monsterJobs.indexOf(d.job)>=0){

if(!canBecomeMonster(p)){
send(res,{
success:false,
message:"괴물진영만 선택할 수 있습니다."
});
return;
}

p.monsterType=d.job;
p.job=d.job;

if(d.job==="크리처"||d.job==="좀비"||d.job==="외계인"){
p.traits.push(monsterTrait(d.job));
}

send(res,{
success:true,
message:"👹 "+d.job+" 선택 완료!"
});

return;
}

if(jobs.indexOf(d.job)<0){
send(res,{
success:false,
message:"없는 직업입니다.\n"+jobs.join(" / ")
});
return;
}

if(p.faction==="괴물진영"){
send(res,{
success:false,
message:"괴물진영은 괴물 직업을 선택해야 합니다."
});
return;
}

p.job=d.job;

send(res,{
success:true,
message:"🔧 직업이 "+d.job+"(으)로 변경되었습니다."
});

});

return;
}

if(path==="/api/guild"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

if(guilds.indexOf(d.guild)<0){
send(res,{
success:false,
message:"없는 길드입니다.\n"+guilds.join(" / ")
});
return;
}

p.guild=d.guild;

send(res,{
success:true,
message:"🏴 "+d.guild+" 가입 완료!"
});

});

return;
}

if(path==="/api/move"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

if(regions.indexOf(d.destination)<0){
send(res,{
success:false,
message:"존재하지 않는 지역입니다."
});
return;
}

p.region=d.destination;

send(res,{
success:true,
message:"📍 "+d.destination+"(으)로 이동했습니다."
});

});

return;
}

if(path==="/api/explore"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

var n=Math.floor(Math.random()*3)+1;
var money=Math.floor(Math.random()*501)+100;

item(p,"물자",n);
p.money+=money;

send(res,{
success:true,
message:
"🔎 "+p.region+" 탐색 완료!\n"+
"📦 물자 x"+n+"\n"+
"💰 "+money+"원"
});

});

return;
}

if(path==="/api/hunt"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

var damage=Math.max(
1,
Math.floor(Math.random()*20)+5-p.defense/5
);

p.hp-=damage;

if(p.hp<1)p.hp=1;

var money=Math.floor(Math.random()*401)+100;

p.money+=money;

var lv=exp(p,30);

send(res,{
success:true,
message:
"⚔️ 사냥 성공!\n"+
"💰 "+money+"원\n"+
"❤️ 피해 "+Math.floor(damage)+lv
});

});

return;
}

if(path==="/api/fishing"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

var fish=[
"붕어",
"잉어",
"메기",
"연어",
"황금물고기"
];

var f=fish[Math.floor(Math.random()*fish.length)];

item(p,f,1);

var text=
"🎣 낚시 성공!\n"+
"🐟 "+f+" x1";

if(Math.random()<0.005){
text+="\n\n🪙 희박한 확률로 코인을 낚았습니다!";
text+="\n"+coinFound(w,p);
}

send(res,{
success:true,
message:text
});

});

return;
}

if(path==="/api/eat"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);
var target=findPlayer(w,d.target);

var r=eatTarget(w,p,target);

send(res,r);

});

return;
}

if(path==="/api/team-upgrade"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"플레이어를 찾을 수 없습니다."
});
return;
}

if(p.monsterType!=="대세아귀"){
send(res,{
success:false,
message:"대세아귀만 사용할 수 있습니다."
});
return;
}

if(p.coin<1){
send(res,{
success:false,
message:"🪙 코인이 부족합니다."
});
return;
}

var index=teamTiers.indexOf(p.teamTier);

if(index<0||index>=teamTiers.length-1){
send(res,{
success:false,
message:"더 이상 팀 등급을 올릴 수 없습니다."
});
return;
}

var before=p.teamTier;

p.teamTier=teamTiers[index+1];
p.teamLevel++;

p.coin--;

send(res,{
success:true,
message:
"👹 신력이 발동했습니다!\n\n"+
"🏴 팀 등급\n"+
before+" → "+p.teamTier+"\n\n"+
"🪙 코인 1개 사용!"
});

});

return;
}

if(path==="/api/friend/request"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);
var t=findName(w,d.target);

if(!p||!t){
send(res,{
success:false,
message:"플레이어를 찾을 수 없습니다."
});
return;
}

if(p.id===t.id){
send(res,{
success:false,
message:"자기 자신은 친구로 추가할 수 없습니다."
});
return;
}

if(p.friends.indexOf(t.id)>=0){
send(res,{
success:false,
message:"이미 친구입니다."
});
return;
}

if(t.requests.indexOf(p.id)<0)t.requests.push(p.id);

send(res,{
success:true,
message:"👥 친구 요청을 보냈습니다."
});

});

return;
}

if(path==="/api/friend/accept"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);
var t=findName(w,d.target);

if(!p||!t){
send(res,{
success:false,
message:"플레이어를 찾을 수 없습니다."
});
return;
}

if(p.requests.indexOf(t.id)<0){
send(res,{
success:false,
message:"친구 요청이 없습니다."
});
return;
}

p.requests.splice(p.requests.indexOf(t.id),1);

if(p.friends.indexOf(t.id)<0)p.friends.push(t.id);
if(t.friends.indexOf(p.id)<0)t.friends.push(p.id);

send(res,{
success:true,
message:"🤝 "+t.name+"님과 친구가 되었습니다."
});

});

return;
}

if(path==="/api/friend/list"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

var list=[];

for(var i=0;i<p.friends.length;i++){
var f=w.players[p.friends[i]];
if(f)list.push(f.name);
}

send(res,{
success:true,
message:
list.length?
"👥 친구 목록\n\n"+list.join("\n"):
"👥 친구가 없습니다."
});

});

return;
}

if(path==="/api/chat"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

send(res,{
success:true,
message:"💬 "+p.name+": "+d.message
});

});

return;
}

if(path==="/api/save"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

send(res,{
success:true,
message:"💾 저장 완료! 슬롯: "+d.slot
});

});

return;
}

if(path==="/api/load"&&method==="POST"){
read(req,function(d){

var p=findPlayer(w,d.id);

if(!p){
send(res,{
success:false,
message:"먼저 가입하세요."
});
return;
}

send(res,{
success:true,
message:"📂 슬롯 "+d.slot+" 불러오기 완료!"
});

});

return;
}

if(path==="/api/instagram/minigame/create"&&method==="POST"){

if(w.platform!=="instagram"){
send(res,{
success:false,
message:"ASIA 전용 기능입니다."
});
return;
}

read(req,function(d){

if(!d.id||!d.type){
send(res,{
success:false,
message:"게임 정보를 입력하세요."
});
return;
}

var id="GAME"+Date.now();

var players=[d.id];
var targets=d.targets||[];

for(var i=0;i<targets.length;i++){
if(players.indexOf(targets[i])<0){
players.push(targets[i]);
}
}

var game={
id:id,
type:d.type,
name:d.type,
timeLimit:Number(d.seconds)||60,
players:players,
accepted:[d.id],
scores:{},
status:"waiting",
created:Date.now()
};

for(var j=0;j<players.length;j++){
game.scores[players[j]]=0;
}

w.games[id]=game;

send(res,{
success:true,
game:game
});

});

return;
}

if(path==="/api/instagram/minigame/accept"&&method==="POST"){
read(req,function(d){

var g=w.games[d.gameId];

if(!g){
send(res,{
success:false,
message:"게임을 찾을 수 없습니다."
});
return;
}

if(g.players.indexOf(d.id)<0){
send(res,{
success:false,
message:"초대받은 플레이어가 아닙니다."
});
return;
}

if(g.accepted.indexOf(d.id)<0){
g.accepted.push(d.id);
}

if(g.accepted.length===g.players.length){
g.status="playing";
}

send(res,{
success:true,
message:g.status==="playing"?"🎮 게임 시작!":"참가 완료!",
game:g
});

});

return;
}

if(path==="/api/instagram/minigame/score"&&method==="POST"){
read(req,function(d){

var g=w.games[d.gameId];

if(!g){
send(res,{
success:false,
message:"게임을 찾을 수 없습니다."
});
return;
}

if(g.status!=="playing"){
send(res,{
success:false,
message:"아직 게임이 시작되지 않았습니다."
});
return;
}

if(g.players.indexOf(d.id)<0){
send(res,{
success:false,
message:"참가자가 아닙니다."
});
return;
}

g.scores[d.id]=(g.scores[d.id]||0)+Number(d.score||0);

send(res,{
success:true,
message:"점수 +"+Number(d.score||0),
game:g
});

});

return;
}

if(path==="/api/instagram/minigame"&&method==="GET"){

var g=w.games[q.query.id];

if(!g){
send(res,{
success:false,
message:"게임을 찾을 수 없습니다."
});
return;
}

send(res,{
success:true,
game:g
});

return;
}

send(res,{
success:false,
message:"없는 요청입니다."
});

});

server.listen(PORT,function(){
console.log("apocalypse-seoul online "+PORT);
});
