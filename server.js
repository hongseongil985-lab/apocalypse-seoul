const http=require("http");
const https=require("https");

const PORT=process.env.PORT||3000;
const GITHUB_TOKEN=process.env.GITHUB_TOKEN||"";
const OWNER="hongseongil985-lab";
const REPO="apocalypse-seoul";
const BACKUP_FILE="apocalypse_backup.json";

const guilds={
"하운더":{region:"강남",special:"차량"},
"약탈자":{region:"마포",special:"탐색"},
"범죄자들 모임":{region:"관악",special:"거래"},
"가출팸":{region:"홍대",special:"기동"},
"시민연합":{region:"종로",special:"의료"},
"철벽":{region:"용산",special:"방어"},
"유랑민":{region:"은평",special:"이동"},
"한강연합":{region:"광진",special:"수상"},
"폐공장연합":{region:"금천",special:"제작"},
"상인연합":{region:"영등포",special:"교환"},
"별의 후예":{region:"여의도",special:"외계"}
};

const jobs=["생존자","정찰병","의무병","기술자","상인","운전사","사냥꾼","탐험가"];

const skills=["블링크","텔레포트","공간이동","차원 이동자","아공간","차원을 가르는 참격","ERROR"];

const regions={
"강남":{risk:3,supply:500,control:"하운더"},
"강북":{risk:3,supply:450,control:"없음"},
"홍대":{risk:4,supply:300,control:"가출팸"},
"종로":{risk:2,supply:650,control:"시민연합"},
"명동":{risk:4,supply:700,control:"없음"},
"서울역":{risk:5,supply:900,control:"없음"},
"잠실":{risk:3,supply:550,control:"없음"},
"여의도":{risk:3,supply:600,control:"별의 후예"},
"마포":{risk:4,supply:400,control:"약탈자"},
"용산":{risk:2,supply:600,control:"철벽"},
"동대문":{risk:4,supply:700,control:"없음"},
"성수":{risk:3,supply:550,control:"없음"},
"금천":{risk:3,supply:500,control:"폐공장연합"},
"은평":{risk:3,supply:450,control:"유랑민"},
"관악":{risk:5,supply:500,control:"범죄자들 모임"},
"광진":{risk:3,supply:650,control:"한강연합"},
"영등포":{risk:2,supply:750,control:"상인연합"},
"구로":{risk:4,supply:600,control:"없음"},
"신촌":{risk:4,supply:450,control:"없음"},
"한강":{risk:4,supply:800,control:"한강연합"}
};

const zombieNames=["워커","러너","크롤러","하울러","스크리머","브루트","헌터","리퍼","베놈","블러드워커","나이트워커","그레이브워커","로튼","페스터","본이터","슬러거","스토커","드레드워커","스웜","네스트","스파인","크림슨","블랙러너","아이리스","페이스리스","마로더","데바스테이터","거터","스컬러","헬하운드","메일스트롬","래비저","그레이브이터","로커스트","블라인드","스크래처","터미너스","카니지","하이브","리치","본브레이커","워프드","블라이트","페일","데드맨","블러드하울","로드","타이런트","콜로서스","킹 워커","스모커","스파이터","러스트","애시","플레임","프로즌","쇼크","톡식","미스트","스펙터","쉐이드","모울러","크러셔","디바우러","스플리터","리애니메이터","본리퍼","페스트마스터","블러드마스터","데드아이","아이언워커","스톤워커","와일드","매드맨","로스트","하이드","언더워커","터널러","하이퍼","에볼버","뮤턴트","어보미네이션","카오스","디케이","엔드워커","둠러너","데스하울","블랙하운드","레드하운드","화이트하운드","그레이하운드","나이트메어","아포칼립스","제로","ERROR","ERROR-01","ERROR-02","UNKNOWN","UNKNOWN-01","서울의 재앙"];

const alienNames=["그레이","제노","크세르","바르곤","네크론","아르곤","제르크","보락","켈론","라크스","오르빅","타르곤","벨록","시리온","드라크","노바르","엘론","카르스","모르곤","제타르","이그니스","보이드","아스트라","크로노","벡터","솔라","루나","네뷸라","코어","프록시","제네시스","옵시디언","오메가","알파","베타","감마","델타","시그마","세타","람다","에코","아이온","아크론","벤타","모르타","카이론","세라프","엑시온","페르곤","제노로드","스카우터","헌터","워리어","가디언","디스트로이어","인베이더","드론","프레데터","리퍼","워커","스토커","컨커러","오버로드","커맨더","엘더","프라임","마더","브루드","하이브","스웜","플라즈마","크라이오","그래비티","보이드워커","스타이터","문이터","선이터","블랙스타","레드스타","데드스타","폴른","이터널","어센던트","디센던트","아나이얼레이터","엔드브링어","UNKNOWN","UNKNOWN-01","UNKNOWN-02","X-001","X-002","X-003","X-004","X-005","XENOS","VOID-X","ZERO-X","OMEGA-X","외계 군주","THE VISITOR"];

const creatureNames=["하울러","페이스리스","스킨워커","본비스트","블러드독","나이트크롤러","아이리스","스크리머","러커","터널비스트","그레이브비스트","블랙비스트","레드비스트","화이트비스트","크로울러","스파이더","맨티스","웜","리바이어던","모울","크러셔","브루저","헌터","스토커","리퍼","드레드","쉐이드","미러","미믹","더블","위스퍼","하이드","글룸","블러드메어","본드래곤","스톤이터","아이언비스트","플레임비스트","프로스트비스트","썬더비스트","포이즌비스트","스모그비스트","크림슨비스트","어비스비스트","보이드비스트","드림이터","소울이터","나이트메어","데드아이","크리쳐 킹","슬러그","랫킹","몰러","플라이","와스프","스팅어","크로우","블랙버드","본윙","데스윙","스크래치","클로","탈론","팽","로어러","시프터","스플리터","퓨전","리버스","에코","카르니지","데바우러","아비터","마로더","워처","키퍼","가디언","세이비어","디바인","폴른","루인","디케이","카오스","아포칼립스","엔드","UNKNOWN","UNKNOWN-01","ERROR","ERROR-02","BLACK-01","RED-01","WHITE-01","ZERO","NULL","VOID","THE LOST","THE HUNGER","THE WATCHER","THE CREATURE","서울의 악몽"];

const fishNames=["붕어","잉어","메기","미꾸라지","피라미","송사리","가물치","쏘가리","배스","연어","송어","참치","고등어","갈치","광어","우럭","농어","도미","방어","전어","복어","장어","문어","오징어","새우","게","가재","조개","굴","홍합","연어왕","황금잉어","검은붕어","붉은메기","푸른송어","별빛물고기","달빛물고기","태양어","보이드피쉬","크로노피쉬","플라즈마피쉬","그래비티피쉬","외계어","제노피쉬","네뷸라피쉬","오메가피쉬","X-피쉬","ERROR 피쉬","UNKNOWN 피쉬","서울의 괴어"];

while(fishNames.length<100) fishNames.push("물고기-"+fishNames.length);

const vehicleNames=[];
for(let i=1;i<=200;i++) vehicleNames.push("지상차량-"+String(i).padStart(3,"0"));
for(let i=1;i<=50;i++) vehicleNames.push("항공기-"+String(i).padStart(3,"0"));
for(let i=1;i<=30;i++) vehicleNames.push("수상차량-"+String(i).padStart(3,"0"));
["X-Runner","Void Cruiser","Gravity Skiff","Warp Rider","Dimensional Ark","Star Hopper","Alien Speeder","Orbital Dropper","Void Walker","X-Gate Carrier","Nova Runner","Dark Cruiser","Galaxy Skiff","Void Rider","Cosmic Ark","Star Cruiser","Alien Runner","Quantum Walker","ERROR Carrier","THE VISITOR"].forEach(v=>vehicleNames.push(v));

const itemCategories=["식량","물","의료","재료","괴물 부산물","장비","무기","방어구","외계 장비","희귀 아이템"];
const items={};

for(let c=0;c<itemCategories.length;c++){
  for(let i=1;i<=100;i++){
    const n=itemCategories[c]+"-"+String(i).padStart(3,"0");
    items[n]={category:itemCategories[c],price:10+i*5,tradable:true};
  }
}

items["임무 핵심 물품"]={category:"희귀 아이템",price:0,tradable:false};

const world={
kakao:{players:{},market:{},events:[]},
instagram:{players:{},market:{},events:[]}
};

let backupSha=null;

function send(res,code,data){
  res.writeHead(code,{
    "Content-Type":"application/json; charset=utf-8",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  });
  res.end(JSON.stringify(data));
}

function githubRequest(method,path,body){
  return new Promise((resolve,reject)=>{
    const req=https.request({
      hostname:"api.github.com",
      path:path,
      method:method,
      headers:{
        "User-Agent":"apocalypse-seoul",
        "Authorization":"Bearer "+GITHUB_TOKEN,
        "Accept":"application/vnd.github+json",
        "Content-Type":"application/json"
      }
    },res=>{
      let result="";
      res.on("data",c=>result+=c);
      res.on("end",()=>{
        try{resolve({status:res.statusCode,data:JSON.parse(result)});}
        catch(e){resolve({status:res.statusCode,data:result});}
      });
    });
    req.on("error",reject);
    if(body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function loadBackup(){
  if(!GITHUB_TOKEN) return;
  try{
    const r=await githubRequest("GET","/repos/"+OWNER+"/"+REPO+"/contents/"+BACKUP_FILE);
    if(r.status!==200) return;
    backupSha=r.data.sha;
    const raw=r.data.content.replace(/\n/g,"");
    const saved=JSON.parse(Buffer.from(raw,"base64").toString("utf8"));
    if(saved.kakao&&saved.instagram){
      world.kakao=saved.kakao;
      world.instagram=saved.instagram;
    }
  }catch(e){}
}

async function saveBackup(){
  if(!GITHUB_TOKEN) return false;
  try{
    const content=Buffer.from(JSON.stringify(world,null,2),"utf8").toString("base64");
    const body={message:"아포칼립스 서울 자동 백업",content:content};
    if(backupSha) body.sha=backupSha;
    const r=await githubRequest("PUT","/repos/"+OWNER+"/"+REPO+"/contents/"+BACKUP_FILE,body);
    if(r.status===200||r.status===201){
      backupSha=r.data.content.sha;
      return true;
    }
  }catch(e){}
  return false;
}

function getPlatform(req){
  return req.headers["x-platform"]==="instagram"?"instagram":"kakao";
}

function getPlayer(platform,id){
  return world[platform].players[id]||null;
}

function findPlayer(platform,name){
  const ps=world[platform].players;
  for(const id in ps){
    if(ps[id].name===name) return ps[id];
  }
  return null;
}

function nameExists(platform,name){
  return !!findPlayer(platform,name);
}

function createPlayer(platform,id,name){
  return {
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
    money:1000,
    coin:0,
    region:"서울역",
    guild:null,
    job:null,
    guildTrust:50,
    skills:[],
    items:{"식량-001":3,"물-001":3},
    vehicles:[],
    fishingRod:null,
    fish:[],
    kills:0,
    saves:[null,null,null],
    joined:true,
    started:false,
    lastActivity:Date.now(),
    chatCooldown:0,
    whisperCooldown:0,
    friends:[],
    friendRequests:[]
  };
}

function statusOf(p){
  const diff=Date.now()-p.lastActivity;
  if(diff>=1800000) return "offline";
  if(diff>=600000) return "away";
  return "online";
}

function statusText(s){
  if(s==="online") return "🟢 온라인";
  if(s==="away") return "🟡 자리비움";
  return "⚫ 오프라인";
}

function activity(p){
  p.lastActivity=Date.now();
}

function addItem(p,name,count){
  if(!p.items[name]) p.items[name]=0;
  p.items[name]+=count;
}

function removeItem(p,name,count){
  if(!p.items[name]||p.items[name]<count) return false;
  p.items[name]-=count;
  if(p.items[name]<=0) delete p.items[name];
  return true;
}

function expUp(p,n){
  p.exp+=n;
  let levelup=false;
  while(p.exp>=p.level*100){
    p.exp-=p.level*100;
    p.level++;
    p.maxHp+=10;
    p.hp=p.maxHp;
    levelup=true;
  }
  return levelup;
}

function playerInfo(p){
  return {
    name:p.name,
    level:p.level,
    exp:p.exp,
    hp:p.hp,
    maxHp:p.maxHp,
    stamina:p.stamina,
    hunger:p.hunger,
    thirst:p.thirst,
    money:p.money,
    coin:p.coin,
    region:p.region,
    guild:p.guild,
    job:p.job,
    guildTrust:p.guildTrust,
    skills:p.skills,
    items:p.items,
    vehicles:p.vehicles,
    fishingRod:p.fishingRod,
    fish:p.fish,
    kills:p.kills,
    status:statusOf(p)
  };
}

function registerPlayer(platform,id,name){
  if(!id||!name) return {success:false,message:"아이디와 캐릭터 이름을 입력해주세요."};
  if(world[platform].players[id]) return {success:false,message:"이미 가입된 아이디입니다."};
  if(nameExists(platform,name)) return {success:false,message:"이미 사용 중인 캐릭터 이름입니다."};
  const p=createPlayer(platform,id,name);
  world[platform].players[id]=p;
  return {success:true,player:playerInfo(p)};
}

function startPlayer(platform,id){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  p.started=true;
  activity(p);
  return {success:true,player:playerInfo(p)};
}

function chooseJob(platform,id,job){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(jobs.indexOf(job)===-1) return {success:false,message:"존재하지 않는 직업입니다."};
  p.job=job;
  activity(p);
  return {success:true,message:"직업이 "+job+"으로 설정되었습니다.",player:playerInfo(p)};
}

function chooseGuild(platform,id,guild){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(!guilds[guild]) return {success:false,message:"존재하지 않는 길드입니다."};
  p.guild=guild;
  p.region=guilds[guild].region;
  p.guildTrust=50;
  activity(p);
  return {success:true,message:"🏴 길드 가입 완료\n길드: "+guild+"\n지역: "+p.region+"\n특화: "+guilds[guild].special,player:playerInfo(p)};
}

function movePlayer(platform,id,destination){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(!regions[destination]) return {success:false,message:"존재하지 않는 지역입니다."};
  if(!p.started) return {success:false,message:"/시작을 먼저 해주세요."};
  if(p.region===destination) return {success:false,message:"이미 "+destination+"에 있습니다."};

  const distance=1+Math.floor(Math.random()*4);
  const foodNeed=distance;
  const waterNeed=distance;

  if(!p.items["식량-001"]||p.items["식량-001"]<foodNeed){
    return {success:false,message:"이동에 필요한 식량이 부족합니다."};
  }

  if(!p.items["물-001"]||p.items["물-001"]<waterNeed){
    return {success:false,message:"이동에 필요한 물이 부족합니다."};
  }

  removeItem(p,"식량-001",foodNeed);
  removeItem(p,"물-001",waterNeed);

  const from=p.region;
  p.region=destination;
  p.hunger=Math.max(0,p.hunger-foodNeed*5);
  p.thirst=Math.max(0,p.thirst-waterNeed*5);
  activity(p);

  return {
    success:true,
    message:"🚶 이동 완료\n"+from+" → "+destination+"\n식량 -"+foodNeed+"\n물 -"+waterNeed+"\n위험도 ★"+regions[destination].risk,
    player:playerInfo(p)
  };
}

function explore(platform,id){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(!p.started) return {success:false,message:"/시작을 먼저 해주세요."};

  activity(p);

  const roll=Math.random();

  if(roll<0.35){
    addItem(p,"식량-001",1);
    return {success:true,message:"🔎 탐색 완료\n식량-001 x1을 발견했습니다."};
  }

  if(roll<0.65){
    addItem(p,"물-001",1);
    return {success:true,message:"🔎 탐색 완료\n물-001 x1을 발견했습니다."};
  }

  if(roll<0.82){
    addItem(p,"재료-001",1);
    return {success:true,message:"🔎 탐색 완료\n재료-001 x1을 발견했습니다."};
  }

  if(roll<0.94){
    p.money+=100;
    return {success:true,message:"🔎 탐색 완료\n💰 100원을 발견했습니다."};
  }

  p.coin++;
  return {success:true,message:"🔎 탐색 완료\n🪙 희귀한 코인 1개를 발견했습니다."};
}

function hunt(platform,id){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(!p.started) return {success:false,message:"/시작을 먼저 해주세요."};

  activity(p);

  const r=regions[p.region];
  const list=r.risk>=5?zombieNames.slice(0,100):zombieNames.slice(0,70);
  const enemy=list[Math.floor(Math.random()*list.length)];
  const reward=50+r.risk*25;

  p.kills++;
  p.money+=reward;
  const levelup=expUp(p,10);

  addItem(p,"괴물 부산물-"+String(1+Math.floor(Math.random()*100)).padStart(3,"0"),1);

  let text="🧟 "+enemy+" 처치!\n💰 +"+reward+"\n⭐ 경험치 +10\n☠️ 처치 수: "+p.kills;

  if(levelup) text+="\n🎉 레벨 업! Lv."+p.level;

  return {success:true,message:text,player:playerInfo(p)};
}

function fishing(platform,id){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"/가입 먼저 해주세요."};
  if(!p.started) return {success:false,message:"/시작을 먼저 해주세요."};
  if(!p.fishingRod) return {success:false,message:"낚싯대가 없습니다. 국회시장 → 낚시용품점에서 낚싯대를 구매하세요."};

  activity(p);

  const fish=fishNames[Math.floor(Math.random()*fishNames.length)];
  p.fish.push(fish);

  return {success:true,message:"🎣 낚시 성공!\n🐟 "+fish+"을(를) 잡았습니다."};
}

function saveGame(platform,id,slot){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"가입된 캐릭터가 없습니다."};

  slot=Number(slot);

  if(slot<1||slot>3) return {success:false,message:"저장 슬롯은 1~3입니다."};

  p.saves[slot-1]={
    level:p.level,
    exp:p.exp,
    hp:p.hp,
    maxHp:p.maxHp,
    stamina:p.stamina,
    hunger:p.hunger,
    thirst:p.thirst,
    money:p.money,
    coin:p.coin,
    region:p.region,
    guild:p.guild,
    job:p.job,
    guildTrust:p.guildTrust,
    skills:p.skills,
    items:p.items,
    vehicles:p.vehicles,
    fishingRod:p.fishingRod,
    fish:p.fish,
    kills:p.kills
  };

  activity(p);

  return {success:true,message:"💾 "+slot+"번 슬롯에 저장했습니다."};
}

function loadGame(platform,id,slot){
  const p=getPlayer(platform,id);
  if(!p) return {success:false,message:"가입된 캐릭터가 없습니다."};

  slot=Number(slot);

  if(slot<1||slot>3||!p.saves[slot-1]) return {success:false,message:"해당 저장 데이터가 없습니다."};

  Object.assign(p,p.saves[slot-1]);
  activity(p);

  return {success:true,message:"📂 "+slot+"번 슬롯을 불러왔습니다.",player:playerInfo(p)};
}

function requestFriend(platform,id,name){
  const p=getPlayer(platform,id);
  const target=findPlayer(platform,name);

  if(!p||!p.started) return {success:false,message:"/시작을 먼저 해주세요."};
  if(!target) return {success:false,message:"해당 닉네임의 플레이어를 찾을 수 없습니다."};
  if(p.id===target.id) return {success:false,message:"자기 자신에게 친구 요청을 할 수 없습니다."};
  if(p.friends.indexOf(target.id)!==-1) return {success:false,message:"이미 친구입니다."};
  if(target.friendRequests.indexOf(p.id)!==-1) return {success:false,message:"이미 친구 요청을 보냈습니다."};

  target.friendRequests.push(p.id);
  activity(p);

  return {success:true,message:"👥 "+target.name+" 님에게 친구 요청을 보냈습니다."};
}

function acceptFriend(platform,id,name){
  const p=getPlayer(platform,id);
  const target=findPlayer(platform,name);

  if(!p||!target) return {success:false,message:"플레이어를 찾을 수 없습니다."};

  const index=p.friendRequests.indexOf(target.id);

  if(index===-1) return {success:false,message:"해당 친구 요청이 없습니다."};

  p.friendRequests.splice(index,1);

  if(p.friends.indexOf(target.id)===-1) p.friends.push(target.id);
  if(target.friends.indexOf(p.id)===-1) target.friends.push(p.id);

  activity(p);

  return {
    success:true,
    message:"🤝 "+target.name+" 님과 친구가 되었습니다.\n서로의 현재 지역이 공개됩니다."
  };
}

function friendList(platform,id){
  const p=getPlayer(platform,id);

  if(!p) return {success:false,message:"가입된 캐릭터가 없습니다."};

  let text="👥 친구 목록\n\n";

  if(p.friends.length===0) text+="친구가 없습니다.";

  for(let i=0;i<p.friends.length;i++){
    const f=world[platform].players[p.friends[i]];
    if(f){
      text+=f.name+"\n";
      text+="상태: "+statusText(statusOf(f))+"\n";
      text+="지역: "+f.region+"\n\n";
    }
  }

  return {success:true,message:text};
}

function chat(platform,id,message){
  const p=getPlayer(platform,id);

  if(!p||!p.started) return {success:false,message:"/시작을 먼저 해주세요."};

  const now=Date.now();

  if(now-p.chatCooldown<10000){
    return {success:false,message:"채팅은 10초에 한 번 사용할 수 있습니다."};
  }

  p.chatCooldown=now;
  activity(p);

  return {
    success:true,
    message:"📢 [전체 채팅] "+p.name+" 님이 "+message+"라고 하셨습니다."
  };
}

function whisper(platform,id,targetName,message){
  const p=getPlayer(platform,id);
  const target=findPlayer(platform,targetName);

  if(!p||!p.started) return {success:false,message:"/시작을 먼저 해주세요."};
  if(!target) return {success:false,message:"해당 닉네임의 플레이어를 찾을 수 없습니다."};

  const now=Date.now();

  if(now-p.whisperCooldown<5000){
    return {success:false,message:"귓속말은 5초에 한 번 사용할 수 있습니다."};
  }

  p.whisperCooldown=now;
  activity(p);

  return {
    success:true,
    message:"💬 [귓속말 → "+target.name+"] "+message,
    targetMessage:"💬 [귓속말 ← "+p.name+"] "+message,
    targetId:target.id
  };
}

async function handle(req,res){
  if(req.method==="OPTIONS"){
    res.writeHead(204,{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    });
    return res.end();
  }

  const platform=getPlatform(req);

  if(req.method==="GET"&&req.url==="/"){
    return send(res,200,{
      status:"online",
      server:"apocalypse-seoul",
      platform:platform,
      backup:GITHUB_TOKEN?"enabled":"disabled",
      regions:Object.keys(regions).length,
      vehicles:vehicleNames.length,
      items:Object.keys(items).length,
      zombies:zombieNames.length,
      aliens:alienNames.length,
      creatures:creatureNames.length,
      fish:fishNames.length,
      guilds:Object.keys(guilds).length
    });
  }

  if(req.method==="GET"&&req.url==="/api/game"){
    return send(res,200,{
      success:true,
      guilds:guilds,
      jobs:jobs,
      regions:regions,
      skills:skills,
      vehicles:vehicleNames,
      items:items,
      zombies:zombieNames,
      aliens:alienNames,
      creatures:creatureNames,
      fish:fishNames
    });
  }

  if(req.method==="POST"){
    let body="";

    req.on("data",chunk=>body+=chunk);

    req.on("end",async()=>{
      try{
        const input=body?JSON.parse(body):{};
        let result=null;

        if(req.url==="/api/register"){
          result=registerPlayer(platform,input.id,input.name);
        }

        else if(req.url==="/api/start"){
          result=startPlayer(platform,input.id);
        }

        else if(req.url==="/api/job"){
          result=chooseJob(platform,input.id,input.job);
        }

        else if(req.url==="/api/guild"){
          result=chooseGuild(platform,input.id,input.guild);
        }

        else if(req.url==="/api/player"){
          const p=getPlayer(platform,input.id);
          result=p?{success:true,player:playerInfo(p)}:{success:false,message:"플레이어를 찾을 수 없습니다."};
        }

        else if(req.url==="/api/move"){
          result=movePlayer(platform,input.id,input.destination);
        }

        else if(req.url==="/api/explore"){
          result=explore(platform,input.id);
        }

        else if(req.url==="/api/hunt"){
          result=hunt(platform,input.id);
        }

        else if(req.url==="/api/fishing"){
          result=fishing(platform,input.id);
        }

        else if(req.url==="/api/save"){
          result=saveGame(platform,input.id,input.slot);
        }

        else if(req.url==="/api/load"){
          result=loadGame(platform,input.id,input.slot);
        }

        else if(req.url==="/api/friend/request"){
          result=requestFriend(platform,input.id,input.target);
        }

        else if(req.url==="/api/friend/accept"){
          result=acceptFriend(platform,input.id,input.target);
        }

        else if(req.url==="/api/friend/list"){
          result=friendList(platform,input.id);
        }

        else if(req.url==="/api/chat"){
          result=chat(platform,input.id,input.message);
        }

        else if(req.url==="/api/whisper"){
          result=whisper(platform,input.id,input.target,input.message);
        }

        else if(req.url==="/api/status"){
          const p=getPlayer(platform,input.id);
          result=p?{success:true,status:statusText(statusOf(p)),region:p.region}:{success:false,message:"플레이어를 찾을 수 없습니다."};
        }

        else{
          return send(res,404,{success:false,message:"Not Found"});
        }

        if(result.success&&req.url!=="/api/status"){
          await saveBackup();
        }

        send(res,result.success?200:400,result);
      }catch(e){
        send(res,400,{success:false,message:"잘못된 요청입니다."});
      }
    });

    return;
  }

  send(res,404,{success:false,message:"Not Found"});
}

async function start(){
  await loadBackup();

  http.createServer(handle).listen(PORT,()=>{
    console.log("Apocalypse Seoul Server Online");
    console.log("Port: "+PORT);
    console.log("Backup: "+(GITHUB_TOKEN?"ON":"OFF"));
  });

  setInterval(()=>{
    saveBackup();
  },60000);
}

start();
