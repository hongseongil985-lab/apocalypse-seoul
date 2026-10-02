var http=require("http");
var url=require("url");

var PORT=process.env.PORT||3000;

var regions=[
"서울역","강남","강북","홍대","종로","명동","잠실","여의도","마포","용산",
"동대문","성수","금천","은평","관악","광진","영등포","구로","신촌","한강"
];

var guilds=[
"하운더","약탈자","범죄자들 모임","가출팸","시민연합",
"철벽","유랑민","한강연합","폐공장연합","상인연합","별의 후예"
];

var jobs=[
"생존자","사냥꾼","탐색자","의무병","정비공","상인"
];

var world={
korea:{
platform:"kakao",
players:{},
rooms:{},
gameRoom:null,
market:{},
events:[]
},
asia:{
platform:"instagram",
players:{},
rooms:{},
gameRoom:null,
market:{},
events:[],
minigames:{}
}
};

var miniCounter=1000;

function send(res,data,code){
res.writeHead(code||200,{"Content-Type":"application/json; charset=utf-8"});
res.end(JSON.stringify(data));
}

function readBody(req,callback){
var data="";

req.on("data",function(chunk){
data+=chunk;
});

req.on("end",function(){
if(!data){
callback({});
return;
}

try{
callback(JSON.parse(data));
}catch(e){
callback({});
}
});
}

function getPlatform(req){
var p=String(req.headers["x-platform"]||"kakao").toLowerCase();

if(p==="instagram"){
return"instagram";
}

return"kakao";
}

function getWorld(platform){
if(platform==="instagram"){
return world.asia;
}

return world.korea;
}

function getPlayer(platform,id){
return getWorld(platform).players[id]||null;
}

function touch(player){
player.lastActivity=Date.now();
}

function getStatus(player){
var diff=Date.now()-player.lastActivity;

if(diff<600000){
return"online";
}

if(diff<1800000){
return"away";
}

return"offline";
}

function createPlayer(id,name,platform){
return{
id:id,
name:name,
platform:platform,
level:1,
exp:0,
hp:100,
maxHp:100,
stamina:100,
hunger:100,
thirst:100,
money:0,
coin:0,
region:"서울역",
guild:"",
job:"",
guildTrust:0,
skills:[],
items:{
"물":3,
"식량":3
},
vehicles:[],
fishingRod:false,
fish:{},
kills:{
zombie:0,
alien:0,
creature:0
},
saves:{},
joined:true,
started:false,
lastActivity:Date.now(),
friends:[],
friendRequests:[]
};
}

function addItem(player,item,count){
if(!player.items[item]){
player.items[item]=0;
}

player.items[item]+=count;
}

function randomItem(){
var list=[
"통조림",
"생수",
"붕대",
"배터리",
"철조각",
"전자부품",
"의약품",
"식량",
"탄약",
"고철"
];

return list[Math.floor(Math.random()*list.length)];
}

function randomFish(){
var list=[
"붕어",
"잉어",
"메기",
"연어",
"송어",
"장어",
"농어",
"참치",
"상어",
"황금물고기"
];

return list[Math.floor(Math.random()*list.length)];
}

function levelUp(player){
while(player.exp>=player.level*100){
player.exp-=player.level*100;
player.level++;
player.maxHp+=10;
player.hp=player.maxHp;
player.stamina=100;
}
}

function roomCheck(platform,room){
if(!room){
return false;
}

return getWorld(platform).gameRoom===room;
}

function miniType(type){
type=String(type||"").trim();

if(type==="낚시"||type==="낚시대결")return"fishing";
if(type==="좀비"||type==="좀비대결")return"zombie";
if(type==="외계인"||type==="외계인대결")return"alien";
if(type==="크리쳐"||type==="크리쳐대결")return"creature";
if(type==="물자"||type==="물자대결")return"supply";
if(type==="돈"||type==="돈벌기"||type==="돈벌기대결")return"money";
if(type==="폭탄"||type==="폭탄돌리기")return"bomb";

return null;
}

function miniName(type){
var names={
fishing:"🎣 낚시 대결",
zombie:"🧟 좀비 사냥 대결",
alien:"👽 외계인 사냥 대결",
creature:"👹 크리쳐 사냥 대결",
supply:"📦 물자 수집 대결",
money:"💰 돈벌기 대결",
bomb:"💣 폭탄돌리기"
};

return names[type]||"미니게임";
}

function miniId(){
miniCounter++;
return"IG"+miniCounter;
}

function areFriends(a,b){
var pa=getPlayer("instagram",a);
var pb=getPlayer("instagram",b);

if(!pa||!pb){
return false;
}

return pa.friends.indexOf(b)!==-1&&pb.friends.indexOf(a)!==-1;
}

function createMiniGame(owner,targets,type,seconds){
if(seconds<1)seconds=1;
if(seconds>600)seconds=600;

var players=[owner];

for(var i=0;i<targets.length;i++){
if(players.indexOf(targets[i])===-1){
players.push(targets[i]);
}
}

if(type==="bomb"&&players.length<3){
return{
success:false,
message:"💣 폭탄돌리기는 최소 3명이 필요합니다."
};
}

if(players.length<2){
return{
success:false,
message:"최소 2명이 필요합니다."
};
}

for(var j=0;j<targets.length;j++){
if(!areFriends(owner,targets[j])){
return{
success:false,
message:targets[j]+"님은 서로 친구인 상태여야 합니다."
};
}
}

var id=miniId();

var scores={};

for(var k=0;k<players.length;k++){
scores[players[k]]=0;
}

var game={
id:id,
type:type,
name:miniName(type),
owner:owner,
players:players,
accepted:[owner],
scores:scores,
timeLimit:seconds,
startedAt:0,
endAt:0,
status:"waiting",
bombHolder:null,
createdAt:Date.now(),
result:[]
};

world.asia.minigames[id]=game;

return{
success:true,
message:"대결 생성 완료",
game:game
};
}

function startMiniGame(game){
if(game.status!=="waiting"){
return;
}

game.status="playing";
game.startedAt=Date.now();
game.endAt=Date.now()+game.timeLimit*1000;

if(game.type==="bomb"){
var index=Math.floor(Math.random()*game.accepted.length);
game.bombHolder=game.accepted[index];
}
}

function checkMiniGame(game){
if(!game){
return;
}

if(game.status==="playing"&&Date.now()>=game.endAt){
finishMiniGame(game);
}
}

function finishMiniGame(game){
if(game.status!=="playing"){
return;
}

game.status="finished";

var result=[];

for(var i=0;i<game.accepted.length;i++){
var id=game.accepted[i];
var p=getPlayer("instagram",id);

result.push({
id:id,
name:p?p.name:id,
score:game.scores[id]||0
});
}

result.sort(function(a,b){
return b.score-a.score;
});

game.result=result;
game.finishedAt=Date.now();
}

function acceptMiniGame(id,playerId){
var game=world.asia.minigames[id];

if(!game){
return{
success:false,
message:"존재하지 않는 대결입니다."
};
}

if(game.status!=="waiting"){
return{
success:false,
message:"이미 시작했거나 종료된 대결입니다."
};
}

if(game.players.indexOf(playerId)===-1){
return{
success:false,
message:"초대받은 사람이 아닙니다."
};
}

if(game.accepted.indexOf(playerId)===-1){
game.accepted.push(playerId);
}

if(game.type==="bomb"){
if(game.accepted.length>=3){
startMiniGame(game);
}
}else{
if(game.accepted.length===game.players.length){
startMiniGame(game);
}
}

return{
success:true,
message:game.status==="playing"?"대결 시작!":"참가 완료",
game:game
};
}

function addMiniScore(id,playerId,amount){
var game=world.asia.minigames[id];

if(!game){
return{
success:false,
message:"대결을 찾을 수 없습니다."
};
}

checkMiniGame(game);

if(game.status!=="playing"){
return{
success:false,
message:"현재 진행 중인 대결이 아닙니다."
};
}

if(game.accepted.indexOf(playerId)===-1){
return{
success:false,
message:"참가자가 아닙니다."
};
}

amount=Number(amount);

if(!isFinite(amount)||amount<0){
amount=0;
}

if(!game.scores[playerId]){
game.scores[playerId]=0;
}

game.scores[playerId]+=amount;

return{
success:true,
score:game.scores[playerId]
};
}

function passBomb(id,from,to){
var game=world.asia.minigames[id];

if(!game){
return{
success:false,
message:"대결을 찾을 수 없습니다."
};
}

checkMiniGame(game);

if(game.status!=="playing"){
return{
success:false,
message:"폭탄돌리기가 진행 중이 아닙니다."
};
}

if(game.type!=="bomb"){
return{
success:false,
message:"폭탄돌리기 게임이 아닙니다."
};
}

if(game.bombHolder!==from){
return{
success:false,
message:"현재 폭탄을 가지고 있지 않습니다."
};
}

if(game.accepted.indexOf(to)===-1){
return{
success:false,
message:"참가자가 아닙니다."
};
}

if(from===to){
return{
success:false,
message:"자기 자신에게는 넘길 수 없습니다."
};
}

game.bombHolder=to;

return{
success:true,
message:"💣 폭탄을 넘겼습니다.",
holder:to
};
}

function register(req,res,data,platform){
var w=getWorld(platform);

if(!data.id||!data.name){
send(res,{
success:false,
message:"아이디와 캐릭터 이름이 필요합니다."
});
return;
}

if(w.players[data.id]){
send(res,{
success:false,
message:"이미 가입되어 있습니다."
});
return;
}

var keys=Object.keys(w.players);

for(var i=0;i<keys.length;i++){
if(w.players[keys[i]].name===data.name){
send(res,{
success:false,
message:"이미 사용 중인 캐릭터 이름입니다."
});
return;
}
}

w.players[data.id]=createPlayer(
data.id,
data.name,
platform
);

send(res,{
success:true,
message:"생존자 등록 완료!",
player:w.players[data.id]
});
}

var server=http.createServer(function(req,res){
var parsed=url.parse(req.url,true);
var path=parsed.pathname;
var platform=getPlatform(req);

if(req.method==="GET"&&path==="/"){
var w=getWorld(platform);

send(res,{
status:"online",
server:"apocalypse-seoul",
platform:platform,
world:platform==="instagram"?"ASIA":"KOREA",
regions:20,
vehicles:300,
items:1001,
zombies:100,
aliens:100,
creatures:100,
fish:100,
guilds:11,
players:Object.keys(w.players).length
});

return;
}

if(req.method==="GET"&&path==="/api/world"){
send(res,{
success:true,
world:platform==="instagram"?"ASIA":"KOREA",
platform:platform
});
return;
}

readBody(req,function(data){

if(req.method==="POST"&&path==="/api/room/set"){
var w=getWorld(platform);

w.gameRoom=data.room;

send(res,{
success:true,
message:"게임방이 설정되었습니다.",
room:data.room
});

return;
}

if(req.method==="POST"&&path==="/api/room/check"){
send(res,{
success:roomCheck(platform,data.room),
message:roomCheck(platform,data.room)?"게임방입니다.":"게임방이 아닙니다."
});

return;
}

if(req.method==="POST"&&path==="/api/register"){
register(req,res,data,platform);
return;
}

if(req.method==="POST"&&path==="/api/start"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{
success:false,
message:"먼저 /가입 닉네임 으로 가입하세요."
});
return;
}

p.started=true;
touch(p);

send(res,{
success:true,
message:"게임이 시작되었습니다.",
player:p
});

return;
}

if(req.method==="POST"&&path==="/api/player"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{
success:false,
message:"플레이어가 없습니다."
});
return;
}

touch(p);

send(res,{
success:true,
player:p,
status:getStatus(p)
});

return;
}

if(req.method==="POST"&&path==="/api/job"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

if(jobs.indexOf(data.job)===-1){
send(res,{
success:false,
message:"직업: "+jobs.join(", ")
});
return;
}

p.job=data.job;
touch(p);

send(res,{
success:true,
message:"직업이 "+data.job+"로 결정되었습니다.",
player:p
});

return;
}

if(req.method==="POST"&&path==="/api/guild"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

if(guilds.indexOf(data.guild)===-1){
send(res,{
success:false,
message:"길드: "+guilds.join(", ")
});
return;
}

p.guild=data.guild;
p.guildTrust=1;
touch(p);

send(res,{
success:true,
message:"🏴 "+data.guild+" 가입 완료!",
player:p
});

return;
}

if(req.method==="POST"&&path==="/api/move"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

if(regions.indexOf(data.destination)===-1){
send(res,{
success:false,
message:"존재하지 않는 지역입니다."
});
return;
}

p.region=data.destination;
p.stamina=Math.max(0,p.stamina-10);
touch(p);

send(res,{
success:true,
message:"📍 "+data.destination+"으로 이동했습니다.",
player:p
});

return;
}

if(req.method==="POST"&&path==="/api/explore"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

var item=randomItem();

addItem(p,item,1);
p.exp+=20;
p.stamina=Math.max(0,p.stamina-10);
touch(p);
levelUp(p);

send(res,{
success:true,
message:"🔎 탐색 성공!\n"+item+" x1 획득\nEXP +20"
});

return;
}

if(req.method==="POST"&&path==="/api/hunt"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

var enemy=["zombie","alien","creature"];
var e=enemy[Math.floor(Math.random()*enemy.length)];

p.kills[e]++;
p.exp+=30;
p.money+=50;
p.stamina=Math.max(0,p.stamina-15);
touch(p);
levelUp(p);

var enemyName={
zombie:"좀비",
alien:"외계인",
creature:"크리쳐"
};

send(res,{
success:true,
message:"⚔️ "+enemyName[e]+" 사냥 성공!\n💰 돈 +50\nEXP +30"
});

return;
}

if(req.method==="POST"&&path==="/api/fishing"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

if(!p.fishingRod){
p.fishingRod=true;
}

var fish=randomFish();

if(!p.fish[fish]){
p.fish[fish]=0;
}

p.fish[fish]++;
p.exp+=25;
touch(p);
levelUp(p);

send(res,{
success:true,
message:"🎣 "+fish+"을(를) 낚았습니다!\nEXP +25"
});

return;
}

if(req.method==="POST"&&path==="/api/friend/request"){
if(platform!=="instagram"){
send(res,{
success:false,
message:"친구 시스템은 계정별로 독립되어 있습니다."
});
return;
}

var a=getPlayer(platform,data.id);
var b=getPlayer(platform,data.target);

if(!a||!b){
send(res,{
success:false,
message:"플레이어를 찾을 수 없습니다."
});
return;
}

if(a.friends.indexOf(data.target)!==-1){
send(res,{
success:false,
message:"이미 친구입니다."
});
return;
}

if(b.friendRequests.indexOf(data.id)===-1){
b.friendRequests.push(data.id);
}

send(res,{
success:true,
message:b.name+"님에게 친구 요청을 보냈습니다."
});

return;
}

if(req.method==="POST"&&path==="/api/friend/accept"){
var a=getPlayer(platform,data.id);
var b=getPlayer(platform,data.target);

if(!a||!b){
send(res,{
success:false,
message:"플레이어를 찾을 수 없습니다."
});
return;
}

if(a.friendRequests.indexOf(data.target)===-1){
send(res,{
success:false,
message:"친구 요청이 없습니다."
});
return;
}

a.friendRequests.splice(
a.friendRequests.indexOf(data.target),
1
);

if(a.friends.indexOf(data.target)===-1){
a.friends.push(data.target);
}

if(b.friends.indexOf(data.id)===-1){
b.friends.push(data.id);
}

send(res,{
success:true,
message:"🤝 "+b.name+"님과 친구가 되었습니다."
});

return;
}

if(req.method==="POST"&&path==="/api/friend/list"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

var names=[];

for(var i=0;i<p.friends.length;i++){
var f=getPlayer(platform,p.friends[i]);

if(f){
names.push(
f.name+" ["+getStatus(f)+"] "+f.region
);
}
}

send(res,{
success:true,
message:names.length?names.join("\n"):"친구가 없습니다.",
friends:names
});

return;
}

if(req.method==="POST"&&path==="/api/chat"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

if(Date.now()<p.chatCooldown){
send(res,{
success:false,
message:"채팅은 10초마다 가능합니다."
});
return;
}

p.chatCooldown=Date.now()+10000;
touch(p);

send(res,{
success:true,
message:"💬 "+p.name+": "+String(data.message||"")
});

return;
}

if(req.method==="POST"&&path==="/api/save"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

var slot=String(data.slot||"1");

p.saves[slot]=JSON.parse(JSON.stringify(p));

send(res,{
success:true,
message:"💾 저장 완료!"
});

return;
}

if(req.method==="POST"&&path==="/api/load"){
var p=getPlayer(platform,data.id);

if(!p){
send(res,{success:false,message:"플레이어가 없습니다."});
return;
}

var slot=String(data.slot||"1");

if(!p.saves[slot]){
send(res,{
success:false,
message:"저장 데이터가 없습니다."
});
return;
}

var oldId=p.id;
var oldPlatform=p.platform;

p=JSON.parse(JSON.stringify(p.saves[slot]));
p.id=oldId;
p.platform=oldPlatform;
p.saves=p.saves||{};
p.lastActivity=Date.now();

getWorld(platform).players[data.id]=p;

send(res,{
success:true,
message:"📂 불러오기 완료!",
player:p
});

return;
}

if(platform==="instagram"&&req.method==="POST"&&path==="/api/instagram/minigame/create"){
var type=miniType(data.type);
var seconds=Number(data.seconds);

if(!data.id||!type){
send(res,{
success:false,
message:"플레이어와 게임 종류가 필요합니다."
});
return;
}

if(!isFinite(seconds)||seconds<1||seconds>600){
send(res,{
success:false,
message:"제한시간은 1~600초입니다."
});
return;
}

var p=getPlayer("instagram",data.id);

if(!p){
send(res,{
success:false,
message:"인스타그램 계정이 없습니다."
});
return;
}

var targets=Array.isArray(data.targets)?data.targets:[];

var created=createMiniGame(
data.id,
targets,
type,
seconds
);

send(res,created);
return;
}

if(platform==="instagram"&&req.method==="POST"&&path==="/api/instagram/minigame/accept"){
var accepted=acceptMiniGame(
data.gameId,
data.id
);

send(res,accepted);
return;
}

if(platform==="instagram"&&req.method==="POST"&&path==="/api/instagram/minigame/score"){
var score=addMiniScore(
data.gameId,
data.id,
data.amount
);

send(res,score);
return;
}

if(platform==="instagram"&&req.method==="POST"&&path==="/api/instagram/minigame/bomb"){
var bomb=passBomb(
data.gameId,
data.id,
data.target
);

send(res,bomb);
return;
}

if(platform==="instagram"&&req.method==="GET"&&path==="/api/instagram/minigame"){
var gameId=parsed.query.id;
var game=world.asia.minigames[gameId];

if(!game){
send(res,{
success:false,
message:"대결을 찾을 수 없습니다."
});
return;
}

checkMiniGame(game);

send(res,{
success:true,
game:game
});

return;
}

send(res,{
success:false,
message:"존재하지 않는 요청입니다."
},404);

});
});

server.listen(PORT,function(){
console.log("APOCALYPSE SEOUL ONLINE");
console.log("KOREA = KAKAO");
console.log("ASIA = INSTAGRAM");
console.log("PORT = "+PORT);
});
