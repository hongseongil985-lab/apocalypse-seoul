var http=require("http");
var url=require("url");

var PORT=process.env.PORT||3000;

var regions=[
"서울역","강남","강북","홍대","종로","명동","잠실","여의도","마포","용산",
"동대문","성수","금천","은평","관악","광진","영등포","구로","신촌","한강"
];

var jobs=["생존자","사냥꾼","탐색자","의무병","정비공","상인"];

var guilds=[
"하운더","약탈자","범죄자들 모임","가출팸","시민연합",
"철벽","유랑민","한강연합","폐공장연합","상인연합","별의 후예"
];

var world={
korea:{
platform:"kakao",
players:{},
rooms:{},
events:[]
},
asia:{
platform:"instagram",
players:{},
rooms:{},
events:[],
games:{}
}
};

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

function makePlayer(id,name,room){
return{
id:id,
name:name,
room:room||"",
level:1,
exp:0,
hp:100,
maxHp:100,
money:1000,
coin:0,
region:"서울역",
job:"",
guild:"",
items:{"물":1,"빵":1},
friends:[],
requests:[],
created:Date.now()
};
}

function findPlayer(w,id){
return w.players[id];
}

function findName(w,name){
var ids=Object.keys(w.players);
for(var i=0;i<ids.length;i++){
if(w.players[ids[i]].name===name)return w.players[ids[i]];
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
need=p.level*100;
t+="\n🎉 Lv."+p.level+" 레벨업!";
}
return t;
}

function item(p,n,c){
if(!p.items[n])p.items[n]=0;
p.items[n]+=c;
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
guilds:guilds.length
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
guilds:guilds
});
return;
}

if(path==="/api/register"&&method==="POST"){
read(req,function(d){
if(!d.id||!d.name){
send(res,{success:false,message:"닉네임을 입력하세요."});
return;
}
if(w.players[d.id]){
send(res,{success:false,message:"이미 가입되어 있습니다."});
return;
}
if(findName(w,d.name)){
send(res,{success:false,message:"이미 사용 중인 닉네임입니다."});
return;
}
w.players[d.id]=makePlayer(d.id,d.name,d.room);
send(res,{success:true,message:"☣️ "+d.name+" 가입 완료!"});
});
return;
}

if(path==="/api/start"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 /가입 닉네임"});
return;
}
send(res,{
success:true,
message:"☣️ 아포칼립스 서울에 입장했습니다.\n📍 현재 위치: "+p.region
});
});
return;
}

if(path==="/api/player"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
send(res,{success:true,player:p});
});
return;
}

if(path==="/api/job"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
if(jobs.indexOf(d.job)<0){
send(res,{success:false,message:"없는 직업입니다.\n"+jobs.join(" / ")});
return;
}
p.job=d.job;
send(res,{success:true,message:"🔧 직업이 "+d.job+"(으)로 변경되었습니다."});
});
return;
}

if(path==="/api/guild"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
if(guilds.indexOf(d.guild)<0){
send(res,{success:false,message:"없는 길드입니다.\n"+guilds.join(" / ")});
return;
}
p.guild=d.guild;
send(res,{success:true,message:"🏴 "+d.guild+" 가입 완료!"});
});
return;
}

if(path==="/api/move"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
if(regions.indexOf(d.destination)<0){
send(res,{success:false,message:"존재하지 않는 지역입니다."});
return;
}
p.region=d.destination;
send(res,{success:true,message:"📍 "+d.destination+"(으)로 이동했습니다."});
});
return;
}

if(path==="/api/explore"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
var n=Math.floor(Math.random()*3)+1;
var money=Math.floor(Math.random()*501)+100;
item(p,"물자",n);
p.money+=money;
send(res,{
success:true,
message:"🔎 "+p.region+" 탐색 완료!\n📦 물자 x"+n+"\n💰 "+money+"원"
});
});
return;
}

if(path==="/api/hunt"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
var damage=Math.floor(Math.random()*20)+5;
p.hp-=damage;
if(p.hp<1)p.hp=1;
var money=Math.floor(Math.random()*401)+100;
p.money+=money;
var lv=exp(p,30);
send(res,{
success:true,
message:"⚔️ 사냥 성공!\n💰 "+money+"원\n❤️ 피해 "+damage+lv
});
});
return;
}

if(path==="/api/fishing"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
var fish=["붕어","잉어","메기","연어","황금물고기"];
var f=fish[Math.floor(Math.random()*fish.length)];
item(p,f,1);
send(res,{
success:true,
message:"🎣 낚시 성공!\n🐟 "+f+" x1"
});
});
return;
}

if(path==="/api/friend/request"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
var t=findName(w,d.target);
if(!p||!t){
send(res,{success:false,message:"플레이어를 찾을 수 없습니다."});
return;
}
if(p.id===t.id){
send(res,{success:false,message:"자기 자신은 친구로 추가할 수 없습니다."});
return;
}
if(p.friends.indexOf(t.id)>=0){
send(res,{success:false,message:"이미 친구입니다."});
return;
}
if(t.requests.indexOf(p.id)<0)t.requests.push(p.id);
send(res,{success:true,message:"👥 친구 요청을 보냈습니다."});
});
return;
}

if(path==="/api/friend/accept"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
var t=findName(w,d.target);
if(!p||!t){
send(res,{success:false,message:"플레이어를 찾을 수 없습니다."});
return;
}
if(p.requests.indexOf(t.id)<0){
send(res,{success:false,message:"친구 요청이 없습니다."});
return;
}
p.requests.splice(p.requests.indexOf(t.id),1);
if(p.friends.indexOf(t.id)<0)p.friends.push(t.id);
if(t.friends.indexOf(p.id)<0)t.friends.push(p.id);
send(res,{success:true,message:"🤝 "+t.name+"님과 친구가 되었습니다."});
});
return;
}

if(path==="/api/friend/list"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
var list=[];
for(var i=0;i<p.friends.length;i++){
var f=w.players[p.friends[i]];
if(f)list.push(f.name);
}
send(res,{
success:true,
message:list.length?("👥 친구 목록\n\n"+list.join("\n")):"👥 친구가 없습니다."
});
});
return;
}

if(path==="/api/chat"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
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
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
send(res,{success:true,message:"💾 저장 완료! 슬롯: "+d.slot});
});
return;
}

if(path==="/api/load"&&method==="POST"){
read(req,function(d){
var p=findPlayer(w,d.id);
if(!p){
send(res,{success:false,message:"먼저 가입하세요."});
return;
}
send(res,{success:true,message:"📂 슬롯 "+d.slot+" 불러오기 완료!"});
});
return;
}

if(path==="/api/instagram/minigame/create"&&method==="POST"){
if(w.platform!=="instagram"){
send(res,{success:false,message:"ASIA 전용 기능입니다."});
return;
}
read(req,function(d){
if(!d.id||!d.type){
send(res,{success:false,message:"게임 정보를 입력하세요."});
return;
}
var id="GAME"+Date.now();
var players=[d.id];
var targets=d.targets||[];
for(var i=0;i<targets.length;i++){
if(players.indexOf(targets[i])<0)players.push(targets[i]);
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
for(var j=0;j<players.length;j++)game.scores[players[j]]=0;
w.games[id]=game;
send(res,{success:true,game:game});
});
return;
}

if(path==="/api/instagram/minigame/accept"&&method==="POST"){
read(req,function(d){
var g=w.games[d.gameId];
if(!g){
send(res,{success:false,message:"게임을 찾을 수 없습니다."});
return;
}
if(g.players.indexOf(d.id)<0){
send(res,{success:false,message:"초대받은 플레이어가 아닙니다."});
return;
}
if(g.accepted.indexOf(d.id)<0)g.accepted.push(d.id);
if(g.accepted.length===g.players.length)g.status="playing";
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
send(res,{success:false,message:"게임을 찾을 수 없습니다."});
return;
}
if(g.status!=="playing"){
send(res,{success:false,message:"아직 게임이 시작되지 않았습니다."});
return;
}
if(g.players.indexOf(d.id)<0){
send(res,{success:false,message:"참가자가 아닙니다."});
return;
}
g.scores[d.id]=(g.scores[d.id]||0)+Number(d.score||0);
send(res,{success:true,message:"점수 +"+Number(d.score||0),game:g});
});
return;
}

if(path==="/api/instagram/minigame"&&method==="GET"){
var g=w.games[q.query.id];
if(!g){
send(res,{success:false,message:"게임을 찾을 수 없습니다."});
return;
}
send(res,{
success:true,
game:g
});
return;
}

send(res,{success:false,message:"없는 요청입니다."});
});

server.listen(PORT,function(){
console.log("apocalypse-seoul online "+PORT);
});
