const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const OWNER = "hongseongil985-lab";
const REPO = "apocalypse-seoul";
const BACKUP_FILE = "apocalypse_backup.json";

let world = {
  kakao: {
    players: {},
    regions: {},
    npcs: {},
    vehicles: {},
    market: {},
    events: []
  },
  instagram: {
    players: {},
    regions: {},
    npcs: {},
    vehicles: {},
    market: {},
    events: []
  }
};

let backupSha = null;

const regions = [
  "강남","강북","홍대","종로","명동","서울역","잠실","여의도",
  "마포","용산","동대문","성수","금천","은평","관악","광진","영등포","구로","신촌","한강"
];

const guilds = {
  "하운더": { region:"강남", special:"차량" },
  "약탈자": { region:"마포", special:"탐색" },
  "범죄자들 모임": { region:"관악", special:"거래" },
  "가출팸": { region:"홍대", special:"기동" },
  "시민연합": { region:"종로", special:"의료" },
  "철벽": { region:"용산", special:"방어" },
  "유랑민": { region:"은평", special:"이동" },
  "한강연합": { region:"광진", special:"수상" },
  "폐공장연합": { region:"금천", special:"제작" },
  "상인연합": { region:"영등포", special:"교환" },
  "별의 후예": { region:"여의도", special:"외계" }
};

const jobs = [
  "생존자",
  "정찰병",
  "의무병",
  "기술자",
  "상인",
  "운전사",
  "사냥꾼",
  "탐험가"
];

const spaceSkills = [
  "블링크",
  "텔레포트",
  "공간이동",
  "차원 이동자",
  "아공간",
  "차원을 가르는 참격",
  "ERROR"
];

const zombieNames = [
"워커","러너","크롤러","하울러","스크리머","브루트","헌터","리퍼","베놈","블러드워커",
"나이트워커","그레이브워커","로튼","페스터","본이터","슬러거","스토커","드레드워커","스웜","네스트",
"스파인","크림슨","블랙러너","아이리스","페이스리스","마로더","데바스테이터","거터","스컬러","헬하운드",
"메일스트롬","래비저","그레이브이터","로커스트","블라인드","스크래처","터미너스","카니지","하이브","리치",
"본브레이커","워프드","블라이트","페일","데드맨","블러드하울","로드","타이런트","콜로서스","킹 워커",
"스모커","스파이터","러스트","애시","플레임","프로즌","쇼크","톡식","미스트","스펙터",
"쉐이드","모울러","크러셔","디바우러","스플리터","리애니메이터","본리퍼","페스트마스터","블러드마스터","데드아이",
"아이언워커","스톤워커","와일드","매드맨","로스트","하이드","언더워커","터널러","하이퍼","에볼버",
"뮤턴트","어보미네이션","카오스","디케이","엔드워커","둠러너","데스하울","블랙하운드","레드하운드","화이트하운드",
"그레이하운드","나이트메어","아포칼립스","제로","ERROR","ERROR-01","ERROR-02","UNKNOWN","UNKNOWN-01","서울의 재앙"
];

const alienNames = [
"그레이","제노","크세르","바르곤","네크론","아르곤","제르크","보락","켈론","라크스",
"오르빅","타르곤","벨록","시리온","드라크","노바르","엘론","카르스","모르곤","제타르",
"이그니스","보이드","아스트라","크로노","벡터","솔라","루나","네뷸라","코어","프록시",
"제네시스","옵시디언","오메가","알파","베타","감마","델타","시그마","세타","람다",
"에코","아이온","아크론","벤타","모르타","카이론","세라프","엑시온","페르곤","제노로드",
"스카우터","헌터","워리어","가디언","디스트로이어","인베이더","드론","프레데터","리퍼","워커",
"스토커","컨커러","오버로드","커맨더","엘더","프라임","마더","브루드","하이브","스웜",
"플라즈마","크라이오","그래비티","보이드워커","스타이터","문이터","선이터","블랙스타","레드스타","데드스타",
"폴른","이터널","어센던트","디센던트","아나이얼레이터","엔드브링어","UNKNOWN","UNKNOWN-01","UNKNOWN-02","X-001",
"X-002","X-003","X-004","X-005","XENOS","VOID-X","ZERO-X","OMEGA-X","외계 군주","THE VISITOR"
];

const creatureNames = [
"하울러","페이스리스","스킨워커","본비스트","블러드독","나이트크롤러","아이리스","스크리머","러커","터널비스트",
"그레이브비스트","블랙비스트","레드비스트","화이트비스트","크로울러","스파이더","맨티스","웜","리바이어던","모울",
"크러셔","브루저","헌터","스토커","리퍼","드레드","쉐이드","미러","미믹","더블",
"위스퍼","하이드","글룸","블러드메어","본드래곤","스톤이터","아이언비스트","플레임비스트","프로스트비스트","썬더비스트",
"포이즌비스트","스모그비스트","크림슨비스트","어비스비스트","보이드비스트","드림이터","소울이터","나이트메어","데드아이","크리쳐 킹",
"슬러그","랫킹","몰러","플라이","와스프","스팅어","크로우","블랙버드","본윙","데스윙",
"스크래치","클로","탈론","팽","로어러","시프터","스플리터","퓨전","리버스","에코",
"카르니지","데바우러","아비터","마로더","워처","키퍼","가디언","세이비어","디바인","폴른",
"루인","디케이","카오스","아포칼립스","엔드","UNKNOWN","UNKNOWN-01","ERROR","ERROR-02","BLACK-01",
"RED-01","WHITE-01","ZERO","NULL","VOID","THE LOST","THE HUNGER","THE WATCHER","THE CREATURE","서울의 악몽"
];

const fish = [
"붕어","잉어","메기","미꾸라지","피라미","송사리","가물치","쏘가리","배스","연어",
"송어","참치","고등어","갈치","광어","우럭","농어","도미","방어","전어",
"복어","장어","문어","오징어","새우","게","가재","조개","굴","홍합",
"연어왕","황금잉어","검은붕어","붉은메기","푸른송어","별빛물고기","달빛물고기","태양어","보이드피쉬","크로노피쉬",
"플라즈마피쉬","그래비티피쉬","외계어","제노피쉬","네뷸라피쉬","오메가피쉬","X-피쉬","ERROR 피쉬","UNKNOWN 피쉬","서울의 괴어"
];

for (let i = fish.length + 1; i <= 100; i++) {
  fish.push("물고기-" + i);
}

const vehicleNames = [];

for (let i = 1; i <= 200; i++) {
  vehicleNames.push("지상차량-" + String(i).padStart(3,"0"));
}

for (let i = 1; i <= 50; i++) {
  vehicleNames.push("항공기-" + String(i).padStart(3,"0"));
}

for (let i = 1; i <= 30; i++) {
  vehicleNames.push("수상차량-" + String(i).padStart(3,"0"));
}

[
"X-Runner",
"Void Cruiser",
"Gravity Skiff",
"Warp Rider",
"Dimensional Ark",
"Star Hopper",
"Alien Speeder",
"Orbital Dropper",
"Void Walker",
"X-Gate Carrier",
"Nova Runner",
"Dark Cruiser",
"Galaxy Skiff",
"Void Rider",
"Cosmic Ark",
"Star Cruiser",
"Alien Runner",
"Quantum Walker",
"ERROR Carrier",
"THE VISITOR"
].forEach(v => vehicleNames.push(v));

const itemCategories = [
"식량",
"물",
"의료",
"재료",
"괴물 부산물",
"장비",
"무기",
"방어구",
"외계 장비",
"희귀 아이템"
];

const items = {};

for (let c = 0; c < itemCategories.length; c++) {
  for (let i = 1; i <= 100; i++) {
    items[itemCategories[c] + "-" + String(i).padStart(3,"0")] = {
      category:itemCategories[c],
      price:10 + i * 5,
      tradable:true
    };
  }
}

items["임무 핵심 물품"] = {
  category:"희귀 아이템",
  price:0,
  tradable:false
};

for (let i = 0; i < regions.length; i++) {
  const r = regions[i];

  world.kakao.regions[r] = {
    risk:1 + Math.floor(Math.random() * 5),
    supplies:100 + Math.floor(Math.random() * 900),
    control:"없음",
    players:[],
    incidents:[]
  };

  world.instagram.regions[r] = {
    risk:1 + Math.floor(Math.random() * 5),
    supplies:100 + Math.floor(Math.random() * 900),
    control:"없음",
    players:[],
    incidents:[]
  };
}

function send(res, code, data) {
  res.writeHead(code,{
    "Content-Type":"application/json; charset=utf-8",
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  });

  res.end(JSON.stringify(data));
}

function githubRequest(method,path,body) {
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

      res.on("data",chunk=>{
        result+=chunk;
      });

      res.on("end",()=>{
        try {
          resolve({
            status:res.statusCode,
            data:JSON.parse(result)
          });
        } catch(e) {
          resolve({
            status:res.statusCode,
            data:result
          });
        }
      });
    });

    req.on("error",reject);

    if(body) req.write(JSON.stringify(body));

    req.end();
  });
}

async function loadBackup() {
  if(!GITHUB_TOKEN) return;

  try {
    const result=await githubRequest(
      "GET",
      "/repos/"+OWNER+"/"+REPO+"/contents/"+BACKUP_FILE
    );

    if(result.status!==200) return;

    backupSha=result.data.sha;

    const raw=result.data.content.replace(/\n/g,"");

    const decoded=Buffer.from(raw,"base64").toString("utf8");

    const saved=JSON.parse(decoded);

    if(saved && saved.kakao && saved.instagram) {
      world=saved;
    }
  } catch(e) {}
}

async function saveBackup() {
  if(!GITHUB_TOKEN) return false;

  try {
    const content=Buffer.from(
      JSON.stringify(world,null,2),
      "utf8"
    ).toString("base64");

    const body={
      message:"아포칼립스 서울 자동 백업",
      content:content
    };

    if(backupSha) body.sha=backupSha;

    const result=await githubRequest(
      "PUT",
      "/repos/"+OWNER+"/"+REPO+"/contents/"+BACKUP_FILE,
      body
    );

    if(result.status===200 || result.status===201) {
      backupSha=result.data.content.sha;
      return true;
    }
  } catch(e) {}

  return false;
}

function getPlatform(req) {
  const p=req.headers["x-platform"];

  if(p==="instagram") return "instagram";

  return "kakao";
}

function createPlayer(platform,id,name) {
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
    coin:0,
    money:1000,
    region:"서울역",
    guild:null,
    job:null,
    items:{
      "물-001":3,
      "식량-001":3
    },
    vehicles:[],
    skills:[],
    fishingRod:null,
    catches:[],
    kills:0,
    saves:[null,null,null],
    createdAt:Date.now(),
    lastLogin:Date.now()
  };
}

function getPlayer(platform,id) {
  return world[platform].players[id] || null;
}

function nameExists(platform,name) {
  const players=world[platform].players;

  for(const id in players) {
    if(players[id].name===name) return true;
  }

  return false;
}

function addItem(player,name,count) {
  if(!player.items[name]) player.items[name]=0;

  player.items[name]+=count;
}

function removeItem(player,name,count) {
  if(!player.items[name]) return false;

  if(player.items[name]<count) return false;

  player.items[name]-=count;

  if(player.items[name]<=0) delete player.items[name];

  return true;
}

async function handle(req,res) {
  if(req.method==="OPTIONS") {
    res.writeHead(204,{
      "Access-Control-Allow-Origin":"*",
      "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    });

    return res.end();
  }

  const platform=getPlatform(req);

  if(req.method==="GET" && req.url==="/") {
    return send(res,200,{
      status:"online",
      server:"apocalypse-seoul",
      platform:platform,
      backup:GITHUB_TOKEN ? "enabled":"disabled",
      regions:regions.length,
      vehicles:vehicleNames.length,
      items:Object.keys(items).length,
      zombies:zombieNames.length,
      aliens:alienNames.length,
      creatures:creatureNames.length,
      fish:fish.length,
      guilds:Object.keys(guilds).length
    });
  }

  if(req.method==="GET" && req.url==="/api/game") {
    return send(res,200,{
      success:true,
      platform:platform,
      guilds:guilds,
      jobs:jobs,
      regions:world[platform].regions,
      vehicles:vehicleNames,
      items:items,
      zombies:zombieNames,
      aliens:alienNames,
      creatures:creatureNames,
      fish:fish,
      spaceSkills:spaceSkills
    });
  }

  if(req.method==="GET" && req.url==="/api/data") {
    return send(res,200,{
      success:true,
      platform:platform,
      data:world[platform]
    });
  }

  if(req.method==="GET" && req.url==="/api/player") {
    const url=new URL(req.url,"http://localhost");

    return send(res,200,{
      success:true
    });
  }

  if(req.method==="POST" && req.url==="/api/player/create") {
    let body="";

    req.on("data",chunk=>{
      body+=chunk;
    });

    req.on("end",async()=>{
      try {
        const input=JSON.parse(body);

        if(!input.id || !input.name) {
          return send(res,400,{
            success:false,
            error:"아이디와 이름이 필요합니다."
          });
        }

        if(world[platform].players[input.id]) {
          return send(res,400,{
            success:false,
            error:"이미 가입된 아이디입니다."
          });
        }

        if(nameExists(platform,input.name)) {
          return send(res,400,{
            success:false,
            error:"이미 사용 중인 캐릭터 이름입니다."
          });
        }

        world[platform].players[input.id]=createPlayer(
          platform,
          input.id,
          input.name
        );

        await saveBackup();

        return send(res,200,{
          success:true,
          player:world[platform].players[input.id]
        });
      } catch(e) {
        return send(res,400,{
          success:false,
          error:"잘못된 요청입니다."
        });
      }
    });

    return;
  }

  if(req.method==="POST" && req.url==="/api/player/update") {
    let body="";

    req.on("data",chunk=>{
      body+=chunk;
    });

    req.on("end",async()=>{
      try {
        const input=JSON.parse(body);

        if(!input.id) {
          return send(res,400,{
            success:false,
            error:"아이디가 없습니다."
          });
        }

        if(!world[platform].players[input.id]) {
          return send(res,404,{
            success:false,
            error:"플레이어를 찾을 수 없습니다."
          });
        }

        const old=world[platform].players[input.id];

        world[platform].players[input.id]={
          ...old,
          ...input,
          id:old.id,
          platform:old.platform
        };

        world[platform].players[input.id].lastLogin=Date.now();

        await saveBackup();

        return send(res,200,{
          success:true,
          player:world[platform].players[input.id]
        });
      } catch(e) {
        return send(res,400,{
          success:false,
          error:"잘못된 요청입니다."
        });
      }
    });

    return;
  }

  if(req.method==="POST" && req.url==="/api/save") {
    let body="";

    req.on("data",chunk=>{
      body+=chunk;
    });

    req.on("end",async()=>{
      try {
        const input=JSON.parse(body);

        const p=world[platform].players[input.id];

        if(!p) {
          return send(res,404,{
            success:false,
            error:"플레이어를 찾을 수 없습니다."
          });
        }

        const slot=Number(input.slot);

        if(slot<1 || slot>3) {
          return send(res,400,{
            success:false,
            error:"저장 슬롯은 1~3입니다."
          });
        }

        p.saves[slot-1]=JSON.parse(JSON.stringify({
          level:p.level,
          exp:p.exp,
          hp:p.hp,
          maxHp:p.maxHp,
          stamina:p.stamina,
          hunger:p.hunger,
          thirst:p.thirst,
          coin:p.coin,
          money:p.money,
          region:p.region,
          guild:p.guild,
          job:p.job,
          items:p.items,
          vehicles:p.vehicles,
          skills:p.skills,
          fishingRod:p.fishingRod,
          catches:p.catches,
          kills:p.kills
        }));

        await saveBackup();

        return send(res,200,{
          success:true,
          slot:slot
        });
      } catch(e) {
        return send(res,400,{
          success:false,
          error:"저장 실패"
        });
      }
    });

    return;
  }

  if(req.method==="POST" && req.url==="/api/load") {
    let body="";

    req.on("data",chunk=>{
      body+=chunk;
    });

    req.on("end",async()=>{
      try {
        const input=JSON.parse(body);

        const p=world[platform].players[input.id];

        if(!p) {
          return send(res,404,{
            success:false,
            error:"플레이어를 찾을 수 없습니다."
          });
        }

        const slot=Number(input.slot);

        if(slot<1 || slot>3 || !p.saves[slot-1]) {
          return send(res,400,{
            success:false,
            error:"해당 저장 데이터가 없습니다."
          });
        }

        const saved=p.saves[slot-1];

        Object.assign(p,saved);

        await saveBackup();

        return send(res,200,{
          success:true,
          player:p
        });
      } catch(e) {
        return send(res,400,{
          success:false,
          error:"불러오기 실패"
        });
      }
    });

    return;
  }

  if(req.method==="POST" && req.url==="/api/trade") {
    let body="";

    req.on("data",chunk=>{
      body+=chunk;
    });

    req.on("end",async()=>{
      try {
        const input=JSON.parse(body);

        const a=world[platform].players[input.from];
        const b=world[platform].players[input.to];

        if(!a || !b) {
          return send(res,404,{
            success:false,
            error:"플레이어를 찾을 수 없습니다."
          });
        }

        if(a.region!==b.region) {
          return send(res,400,{
            success:false,
            error:"같은 지역에서만 거래할 수 있습니다."
          });
        }

        const itemA=input.itemA;
        const countA=Number(input.countA)||0;
        const itemB=input.itemB;
        const countB=Number(input.countB)||0;

        if(!items[itemA] || !items[itemB]) {
          return send(res,400,{
            success:false,
            error:"존재하지 않는 아이템입니다."
          });
        }

        if(!items[itemA].tradable || !items[itemB].tradable) {
          return send(res,400,{
            success:false,
            error:"거래할 수 없는 아이템입니다."
          });
        }

        if(!a.items[itemA] || a.items[itemA]<countA) {
          return send(res,400,{
            success:false,
            error:"첫 번째 플레이어의 아이템이 부족합니다."
          });
        }

        if(!b.items[itemB] || b.items[itemB]<countB) {
          return send(res,400,{
            success:false,
            error:"두 번째 플레이어의 아이템이 부족합니다."
          });
        }

        removeItem(a,itemA,countA);
        removeItem(b,itemB,countB);

        addItem(a,itemB,countB);
        addItem(b,itemA,countA);

        await saveBackup();

        return send(res,200,{
          success:true,
          message:"거래가 완료되었습니다."
        });
      } catch(e) {
        return send(res,400,{
          success:false,
          error:"거래 실패"
        });
      }
    });

    return;
  }

  send(res,404,{
    success:false,
    error:"Not Found"
  });
}

async function start() {
  await loadBackup();

  http.createServer(handle).listen(PORT,()=>{
    console.log("Apocalypse Seoul Server Online");
    console.log("Port: "+PORT);
    console.log("Backup: "+(GITHUB_TOKEN ? "ON":"OFF"));
  });

  setInterval(()=>{
    saveBackup();
  },60000);
}

start();
