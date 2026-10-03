var http=require("http");
var url=require("url");
var fs=require("fs");

var PORT=process.env.PORT||3000;
var DATA_FILE=process.env.DATA_FILE||"./apocalypse-data.json";

var regions=["서울역","강남","강북","홍대","종로","명동","잠실","여의도","마포","용산","동대문","성수","금천","은평","관악","광진","영등포","구로","신촌","한강"];

var baseJobs=["생존자","사냥꾼","탐색자","의무병","정비공","상인"];
var monsterJobs=["크리처","좀비","외계인","아귀","대세아귀"];
var jobs=baseJobs.slice();

for(var ji=1;ji<=94;ji++)jobs.push("전문직업"+ji);

var guilds=["하운더","약탈자","범죄자들 모임","가출팸","시민연합","철벽","유랑민","한강연합","폐공장연합","상인연합","별의 후예"];

var teamTiers=["드문","희귀","레어","영웅","신화","전설","고대","절대","불가능","불가사이","신","최초","오류"];

var titles=[];
var titleTiers=["드문","희귀","레어","영웅","신화","전설","고대","절대","불가능","불가사이","신","최초","오류"];

for(var ti=1;ti<=400;ti++){
    var tier=titleTiers[Math.min(titleTiers.length-1,Math.floor((ti-1)/31))];
    titles.push({
        name:"칭호"+ti,
        tier:tier,
        condition:"조건 "+ti
    });
}

titles[0]={
    name:"최초의 창조자",
    tier:"최초",
    condition:"서버 최초 생성자"
};

titles[1]={
    name:"2대 창조자",
    tier:"최초",
    condition:"최초의 창조자에게 양도받음"
};

titles[2]={
    name:"대세아귀",
    tier:"오류",
    condition:"비공개 히든 조건"
};

var variantTraits=[
    "멘헤라",
    "고스트",
    "방사능",
    "아귀",
    "대세아귀"
];

var variantWeapons=[];

for(var vi=1;vi<=10;vi++){
    variantWeapons.push("변종무기"+vi);
}

var items=[];

for(var ii=1;ii<=1000;ii++){
    items.push("물자"+ii);
}

items[0]="물";
items[1]="빵";
items[2]="통조림";
items[3]="라면";
items[4]="초콜릿";
items[5]="생수";
items[6]="의약품";
items[7]="연료통";

var skills=[];

for(var si=1;si<=100;si++){
    skills.push("스킬"+si);
}

var fish=[];

for(var fi=1;fi<=100;fi++){
    fish.push("물고기"+fi);
}

fish[0]="붕어";
fish[1]="잉어";
fish[2]="메기";
fish[3]="연어";
fish[4]="황금물고기";

var vehicles=[];

for(var vi2=1;vi2<=300;vi2++){
    vehicles.push({
        name:"차량"+vi2,
        fuelMax:100,
        durability:100,
        speed:vi2%5+1
    });
}

vehicles[0]={
    name:"경차",
    fuelMax:50,
    durability:80,
    speed:3
};

vehicles[1]={
    name:"승용차",
    fuelMax:70,
    durability:100,
    speed:4
};

vehicles[2]={
    name:"SUV",
    fuelMax:100,
    durability:130,
    speed:5
};

vehicles[3]={
    name:"구급차",
    fuelMax:90,
    durability:110,
    speed:4
};

vehicles[4]={
    name:"트럭",
    fuelMax:140,
    durability:160,
    speed:3
};

var guildInfo={
    "하운더":{start:"강남",bonus:"민첩"},
    "약탈자":{start:"금천",bonus:"공격력"},
    "범죄자들 모임":{start:"구로",bonus:"돈"},
    "가출팸":{start:"홍대",bonus:"민첩"},
    "시민연합":{start:"종로",bonus:"정신력"},
    "철벽":{start:"서울역",bonus:"방어력"},
    "유랑민":{start:"용산",bonus:"이동"},
    "한강연합":{start:"한강",bonus:"낚시"},
    "폐공장연합":{start:"성수",bonus:"정비"},
    "상인연합":{start:"명동",bonus:"거래"},
    "별의 후예":{start:"여의도",bonus:"마력"}
};

var regionInfo={};

for(var ri=0;ri<regions.length;ri++){
    regionInfo[regions[ri]]={
        danger:(ri%10)+1,
        food:Math.max(1,10-(ri%7)),
        water:Math.max(1,10-(ri%5)),
        event:"지역 사건 "+(ri+1)
    };
}

var world={
    korea:{
        platform:"kakao",
        players:{},
        rooms:{},
        events:[],
        games:{},
        slots:{}
    },
    asia:{
        platform:"instagram",
        players:{},
        rooms:{},
        events:[],
        games:{},
        slots:{}
    }
};

var eventId=1;

try{
    if(fs.existsSync(DATA_FILE)){
        var saved=JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));

        if(saved.korea)world.korea=saved.korea;
        if(saved.asia)world.asia=saved.asia;
        if(saved.eventId)eventId=saved.eventId;
    }
}catch(e){}

function persist(){
    try{
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({
                korea:world.korea,
                asia:world.asia,
                eventId:eventId
            })
        );
    }catch(e){}
}

function send(res,data){
    res.writeHead(200,{
        "Content-Type":"application/json; charset=utf-8",
        "Access-Control-Allow-Origin":"*"
    });

    res.end(JSON.stringify(data));
}

function read(req,cb){
    var s="";

    req.on("data",function(x){
        s+=x;
    });

    req.on("end",function(){
        try{
            cb(s?JSON.parse(s):{});
        }catch(e){
            cb({});
        }
    });
}

function getWorld(req){
    return req.headers["x-platform"]==="instagram"
        ?world.asia
        :world.korea;
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

    if(p.money==null)p.money=1000;
    if(p.coin==null)p.coin=0;

    if(!p.items)p.items={};
    if(!p.friends)p.friends=[];
    if(!p.requests)p.requests=[];

    if(!p.faction)p.faction="";
    if(!p.monsterType)p.monsterType="";

    if(!p.traits)p.traits=[];
    if(!p.abilities)p.abilities=[];
    if(!p.skills)p.skills=[];

    if(p.teamTier==null)p.teamTier="드문";
    if(p.teamLevel==null)p.teamLevel=1;

    if(p.eatenAllies==null)p.eatenAllies=0;
    if(p.eatenTotal==null)p.eatenTotal=0;

    if(!p.titles)p.titles=[];
    if(p.equippedTitle==null)p.equippedTitle="";

    if(!p.vehicle)p.vehicle=null;

    if(p.tutorialStep==null)p.tutorialStep=0;

    if(p.dead==null)p.dead=false;

    if(!p.kills)p.kills=0;
    if(!p.fishCaught)p.fishCaught=0;
    if(!p.cooked)p.cooked=0;

    if(!p.missions)p.missions=[];

    return p;
}

function makePlayer(id,name,room){
    return normalizePlayer({
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
        skills:[],

        teamTier:"드문",
        teamLevel:1,

        items:{
            "물":1,
            "빵":1
        },

        friends:[],
        requests:[],

        eatenAllies:0,
        eatenTotal:0,

        titles:[],
        equippedTitle:"",

        vehicle:null,

        tutorialStep:0,
        dead:false,

        kills:0,
        fishCaught:0,
        cooked:0,

        missions:[],

        created:Date.now()
    });
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

function expGain(p,n){
    p.exp+=n;

    var text="";

    while(p.exp>=p.level*100){

        p.exp-=p.level*100;

        p.level++;

        p.maxHp+=10;
        p.hp=p.maxHp;

        p.maxMp+=10;
        p.mp=p.maxMp;

        text+="\n🎉 Lv."+p.level+" 레벨업!";
    }

    return text;
}

function item(p,n,c){

    if(!p.items[n])p.items[n]=0;

    p.items[n]+=c;

    if(p.items[n]<=0){
        delete p.items[n];
    }
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

    persist();

    return e;
}

function coinFound(w,p){

    p.coin++;

    return addEvent(
        w,
        "📢 [코인 발견] "+
        p.name+
        "님이 "+
        p.region+
        "에서 코인을 발견하였습니다! 🪙"
    ).message;
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

    persist();

    return{
        success:true,
        message:"🪙 코인 1개 사용!\n📈 "+n+" 강화 완료!",
        player:p
    };
}

function distance(a,b){

    if(a===b)return 0;

    var ai=regions.indexOf(a);
    var bi=regions.indexOf(b);

    if(ai<0||bi<0)return 999;

    return Math.abs(ai-bi)+1;
}

function survivalCheck(p){

    var text="";

    if(p.hunger<=0){
        p.hp-=5;
        text+="\n🍽️ 배고픔 때문에 체력이 감소했습니다.";
    }

    if(p.thirst<=0){
        p.hp-=8;
        text+="\n💧 탈수 때문에 체력이 감소했습니다.";
    }

    if(p.hp<=0){
        p.hp=0;
        p.dead=true;
    }

    return text;
}

function foodValue(n){

    var map={
        "빵":20,
        "통조림":35,
        "라면":25,
        "초콜릿":15,
        "김밥":30,
        "고기":45,
        "생선구이":40
    };

    return map[n]||10;
}

function waterValue(n){

    var map={
        "물":35,
        "생수":50
    };

    return map[n]||0;
}

function eat(p,n){

    if(!p.items[n]||p.items[n]<1){
        return{
            success:false,
            message:"🍽️ "+n+"이(가) 없습니다."
        };
    }

    var v=foodValue(n);

    if(v<=0){
        return{
            success:false,
            message:"먹을 수 없는 물자입니다."
        };
    }

    item(p,n,-1);

    p.hunger=Math.min(
        p.maxHunger,
        p.hunger+v
    );

    persist();

    return{
        success:true,
        message:
            "🍽️ "+n+"을(를) 먹었습니다.\n"+
            "🍖 배고픔 +"+v+"\n"+
            "현재 배고픔: "+
            p.hunger+"/"+p.maxHunger
    };
}

function drink(p,n){

    if(!p.items[n]||p.items[n]<1){
        return{
            success:false,
            message:"💧 "+n+"이(가) 없습니다."
        };
    }

    var v=waterValue(n);

    if(v<=0){
        return{
            success:false,
            message:"마실 수 없는 물자입니다."
        };
    }

    item(p,n,-1);

    p.thirst=Math.min(
        p.maxThirst,
        p.thirst+v
    );

    persist();

    return{
        success:true,
        message:
            "💧 "+n+"을(를) 마셨습니다.\n"+
            "💧 목마름 +"+v+"\n"+
            "현재 목마름: "+
            p.thirst+"/"+p.maxThirst
    };
}

function movePlayer(p,destination){

    var d=distance(p.region,destination);
    var cost=Math.max(1,d*3);

    p.hunger=Math.max(0,p.hunger-d*2);
    p.thirst=Math.max(0,p.thirst-d*3);

    if(p.vehicle){

        var fuelCost=Math.max(
            1,
            Math.ceil(d*4/p.vehicle.speed)
        );

        if(p.vehicle.fuel<fuelCost){
            return{
                success:false,
                message:
                    "⛽ 연료가 부족합니다.\n"+
                    "필요한 연료: "+fuelCost
            };
        }

        p.vehicle.fuel-=fuelCost;

        p.vehicle.durability-=Math.max(1,d);

        if(p.vehicle.durability<=0){
            p.vehicle.durability=0;

            return{
                success:false,
                message:"🚗 차량이 고장났습니다."
            };
        }

    }else{

        p.money=Math.max(
            0,
            p.money-cost
        );
    }

    p.region=destination;

    var s=survivalCheck(p);

    persist();

    return{
        success:true,
        message:
            "📍 "+destination+" 도착!\n"+
            "🛣️ 거리: "+d+"칸"+
            (
                p.vehicle
                ?"\n⛽ 연료 소모"
                :"\n💰 이동비용: "+cost+"원"
            )+
            s,
        player:p
    };
                                       }function chooseMonsterTrait(type){

    if(
        type==="크리처"||
        type==="좀비"||
        type==="외계인"
    ){
        return variantTraits[
            Math.floor(Math.random()*3)
        ];
    }

    return type;
}

function awardTitle(w,p,name,text){

    var exists=false;

    for(var i=0;i<p.titles.length;i++){
        if(p.titles[i]===name){
            exists=true;
        }
    }

    if(exists)return text;

    p.titles.push(name);

    var found=null;

    for(var j=0;j<titles.length;j++){
        if(titles[j].name===name){
            found=titles[j];
            break;
        }
    }

    if(
        found&&
        (
            found.tier==="고대"||
            found.tier==="절대"||
            found.tier==="불가능"||
            found.tier==="불가사이"||
            found.tier==="신"||
            found.tier==="최초"||
            found.tier==="오류"
        )
    ){

        text+=
            "\n\n📢 [칭호 획득 공지]\n"+
            p.name+
            "님이 ["+
            name+
            "] 칭호를 획득했습니다!";

        addEvent(w,text);
    }

    return text;
}

function eatTarget(w,p,target){

    if(!p||!target){
        return{
            success:false,
            message:"대상을 찾을 수 없습니다."
        };
    }

    if(
        p.monsterType!=="아귀"&&
        p.monsterType!=="대세아귀"
    ){
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

    p.attack+=Math.max(
        1,
        Math.floor((target.attack||10)/10)
    );

    p.defense+=Math.max(
        1,
        Math.floor((target.defense||10)/10)
    );

    p.agility+=Math.max(
        1,
        Math.floor((target.agility||10)/10)
    );

    p.accuracy+=Math.max(
        1,
        Math.floor((target.accuracy||10)/10)
    );

    p.mentality+=Math.max(
        1,
        Math.floor((target.mentality||10)/10)
    );

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

        var chance=
            p.monsterType==="대세아귀"
            ?0.01
            :0.005;

        if(Math.random()<chance){

            text+=
                "\n🪙 코인 1개 발견!";

            coinFound(w,p);
        }
    }

    if(
        p.monsterType==="대세아귀"&&
        p.eatenAllies>=100&&
        !p._secretConditionDone
    ){

        p._secretConditionDone=true;

        text=awardTitle(
            w,
            p,
            "대세아귀",
            text+
            "\n👹 숨겨진 조건을 달성했습니다."
        );
    }

    persist();

    return{
        success:true,
        message:text,
        player:p
    };
}

function tutorial(p){

    var steps=[
        "📖 튜토리얼 1/6\n"+
        "☣️ 서울에서 살아남으세요.\n"+
        "먼저 /진영 인간진영 또는 /진영 괴물진영을 선택하세요.",

        "📖 튜토리얼 2/6\n"+
        "직업을 선택하세요.\n"+
        "/직업 직업명",

        "📖 튜토리얼 3/6\n"+
        "길드에 가입하세요.\n"+
        "/길드 길드명",

        "📖 튜토리얼 4/6\n"+
        "음식과 물을 챙기세요.\n"+
        "먹기와 마시기로 배고픔과 목마름을 관리합니다.",

        "📖 튜토리얼 5/6\n"+
        "지역을 이동하고 탐색하세요.\n"+
        "차량이 있다면 연료도 관리해야 합니다.",

        "📖 튜토리얼 6/6\n"+
        "생존, 전투, 거래, 낚시, 요리, 친구, "+
        "칭호와 히든미션을 자유롭게 진행하세요."
    ];

    return steps[
        Math.min(
            p.tutorialStep,
            steps.length-1
        )
    ];
}

var server=http.createServer(function(req,res){

    var q=url.parse(req.url,true);
    var path=q.pathname;
    var method=req.method;
    var w=getWorld(req);

    if(method==="OPTIONS"){
        res.writeHead(204,{
            "Access-Control-Allow-Origin":"*",
            "Access-Control-Allow-Headers":
                "Content-Type,X-Platform"
        });
        res.end();
        return;
    }

    if(path==="/"&&method==="GET"){

        send(res,{
            status:"online",
            server:"apocalypse-seoul",
            platform:w.platform,
            region:
                w.platform==="kakao"
                ?"KOREA"
                :"ASIA",
            players:Object.keys(w.players).length,
            regions:regions.length,
            jobs:jobs.length,
            monsterJobs:monsterJobs.length,
            guilds:guilds.length,
            items:items.length,
            skills:skills.length,
            vehicles:vehicles.length,
            fish:fish.length,
            titles:titles.length
        });

        return;
    }

    if(path==="/api/world"&&method==="GET"){

        send(res,{
            success:true,
            platform:w.platform,
            region:
                w.platform==="kakao"
                ?"KOREA"
                :"ASIA",

            players:Object.keys(w.players).length,

            regions:regions,
            jobs:jobs,
            monsterJobs:monsterJobs,
            guilds:guilds,
            teamTiers:teamTiers,

            traits:variantTraits,
            variantWeapons:variantWeapons,

            items:items,
            skills:skills,
            vehicles:vehicles,
            fish:fish,
            titles:titles,

            regionInfo:regionInfo,
            guildInfo:guildInfo
        });

        return;
    }

    if(path==="/api/events"&&method==="GET"){

        var after=Number(
            q.query.after||0
        );

        send(res,{
            success:true,
            events:w.events.filter(function(e){
                return e.id>after;
            })
        });

        return;
    }

    if(path==="/api/register"&&method==="POST"){

        read(req,function(d){

            if(!d.id||!d.name){
                return send(res,{
                    success:false,
                    message:"닉네임을 입력하세요."
                });
            }

            if(w.players[d.id]){
                return send(res,{
                    success:false,
                    message:"이미 가입되어 있습니다."
                });
            }

            if(findName(w,d.name)){
                return send(res,{
                    success:false,
                    message:"이미 사용 중인 닉네임입니다."
                });
            }

            w.players[d.id]=makePlayer(
                d.id,
                d.name,
                d.room
            );

            persist();

            send(res,{
                success:true,
                message:"☣️ "+d.name+" 가입 완료!",
                player:w.players[d.id]
            });
        });

        return;
    }

    if(path==="/api/start"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 /가입 닉네임"
                });
            }

            persist();

            send(res,{
                success:true,
                message:
                    "☣️ 아포칼립스 서울에 입장했습니다.\n"+
                    "📍 현재 위치: "+p.region+
                    "\n\n"+
                    tutorial(p),
                player:p
            });
        });

        return;
    }

    if(path==="/api/tutorial"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(d.next){
                p.tutorialStep++;
            }

            persist();

            send(res,{
                success:true,
                message:tutorial(p),
                step:p.tutorialStep
            });
        });

        return;
    }

    if(path==="/api/player"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
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
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
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
                    money:p.money,
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
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            send(res,upgradeStat(p,d.stat));
        });

        return;
    }

    if(path==="/api/faction"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(p.faction){
                return send(res,{
                    success:false,
                    message:"이미 진영을 선택했습니다."
                });
            }

            if(
                d.faction!=="인간진영"&&
                d.faction!=="괴물진영"
            ){
                return send(res,{
                    success:false,
                    message:
                        "인간진영 또는 괴물진영을 선택하세요."
                });
            }

            p.faction=d.faction;
            p.tutorialStep=Math.max(
                p.tutorialStep,
                1
            );

            persist();

            send(res,{
                success:true,
                message:
                    "⚔️ "+d.faction+
                    " 선택 완료!\n\n"+
                    tutorial(p),
                player:p
            });
        });

        return;
    }

    if(path==="/api/job"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(d.job==="대세아귀"){
                return send(res,{
                    success:false,
                    message:
                        "[히든조건을 달성해야합니다.]"
                });
            }

            if(monsterJobs.indexOf(d.job)>=0){

                if(p.faction!=="괴물진영"){
                    return send(res,{
                        success:false,
                        message:
                            "괴물진영만 선택할 수 있습니다."
                    });
                }

                p.monsterType=d.job;
                p.job=d.job;

                if(
                    d.job==="크리처"||
                    d.job==="좀비"||
                    d.job==="외계인"
                ){
                    p.traits.push(
                        chooseMonsterTrait(d.job)
                    );
                }

                p.tutorialStep=Math.max(
                    p.tutorialStep,
                    2
                );

                persist();

                return send(res,{
                    success:true,
                    message:
                        "👹 "+d.job+
                        " 선택 완료!\n\n"+
                        tutorial(p),
                    player:p
                });
            }

            if(jobs.indexOf(d.job)<0){
                return send(res,{
                    success:false,
                    message:"없는 직업입니다."
                });
            }

            if(p.faction==="괴물진영"){
                return send(res,{
                    success:false,
                    message:
                        "괴물진영은 괴물 직업을 선택해야 합니다."
                });
            }

            p.job=d.job;

            p.tutorialStep=Math.max(
                p.tutorialStep,
                2
            );

            persist();

            send(res,{
                success:true,
                message:
                    "🔧 직업이 "+
                    d.job+
                    "(으)로 변경되었습니다.\n\n"+
                    tutorial(p),
                player:p
            });
        });

        return;
    }

    if(path==="/api/guild"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(guilds.indexOf(d.guild)<0){
                return send(res,{
                    success:false,
                    message:"없는 길드입니다."
                });
            }

            p.guild=d.guild;

            p.region=guildInfo[d.guild].start;

            if(guildInfo[d.guild].bonus==="공격력"){
                p.attack+=3;
            }

            if(guildInfo[d.guild].bonus==="방어력"){
                p.defense+=3;
            }

            if(guildInfo[d.guild].bonus==="민첩"){
                p.agility+=3;
            }

            if(guildInfo[d.guild].bonus==="정신력"){
                p.mentality+=3;
            }

            p.tutorialStep=Math.max(
                p.tutorialStep,
                3
            );

            persist();

            send(res,{
                success:true,
                message:
                    "🏴 "+d.guild+
                    " 가입 완료!\n"+
                    "📍 길드 시작 위치: "+
                    p.region+
                    "\n\n"+
                    tutorial(p),
                player:p
            });
        });

        return;
    }

    if(path==="/api/move"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(regions.indexOf(d.destination)<0){
                return send(res,{
                    success:false,
                    message:"존재하지 않는 지역입니다."
                });
            }

            send(
                res,
                movePlayer(
                    p,
                    d.destination
                )
            );
        });

        return;
    }

    if(path==="/api/rest"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(p.dead){
                return send(res,{
                    success:false,
                    message:"게임오버 상태입니다."
                });
            }

            p.hp=Math.min(
                p.maxHp,
                p.hp+20
            );

            p.mp=Math.min(
                p.maxMp,
                p.mp+20
            );

            p.hunger=Math.max(
                0,
                p.hunger-5
            );

            p.thirst=Math.max(
                0,
                p.thirst-5
            );

            persist();

            send(res,{
                success:true,
                message:
                    "🛏️ 휴식 완료!\n"+
                    "❤️ 체력 +20\n"+
                    "🔵 마력 +20",
                player:p
            });
        });

        return;
    }

    if(path==="/api/explore"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(p.dead){
                return send(res,{
                    success:false,
                    message:"게임오버 상태입니다."
                });
            }

            var info=regionInfo[p.region];

            var n=
                Math.floor(
                    Math.random()*info.food
                )+1;

            var money=
                Math.floor(
                    Math.random()*501
                )+100;

            var found=
                Math.random()<0.25
                ?"통조림"
                :"물";

            item(p,found,n);

            p.money+=money;

            p.hunger=Math.max(
                0,
                p.hunger-5
            );

            p.thirst=Math.max(
                0,
                p.thirst-5
            );

            var s=survivalCheck(p);

            persist();

            send(res,{
                success:true,
                message:
                    "🔎 "+p.region+
                    " 탐색 완료!\n"+
                    "📦 "+found+
                    " x"+n+"\n"+
                    "💰 "+money+"원"+
                    s,
                player:p
            });
        });

        return;
    }

    if(path==="/api/hunt"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var damage=Math.max(
                1,
                Math.floor(
                    Math.random()*20
                )+5-
                Math.floor(p.defense/5)
            );

            p.hp-=damage;

            p.hunger=Math.max(
                0,
                p.hunger-8
            );

            p.thirst=Math.max(
                0,
                p.thirst-8
            );

            var money=
                Math.floor(
                    Math.random()*401
                )+100;

            p.money+=money;

            p.kills++;

            var lv=expGain(p,30);

            var s=survivalCheck(p);

            if(p.hp<=0){
                p.dead=true;
                p.hp=0;
            }

            persist();

            send(res,{
                success:true,
                message:
                    "⚔️ 사냥 성공!\n"+
                    "💰 "+money+"원\n"+
                    "❤️ 피해 "+damage+
                    lv+
                    s,
                player:p
            });
        });

        return;
    }

    if(path==="/api/eat"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            send(
                res,
                eat(
                    p,
                    d.item||d.food
                )
            );
        });

        return;
    }

    if(path==="/api/drink"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            send(
                res,
                drink(
                    p,
                    d.item||"물"
                )
            );
        });

        return;
}    if(path==="/api/fishing"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(p.region!=="한강"){
                return send(res,{
                    success:false,
                    message:
                        "🎣 낚시는 한강에서만 가능합니다."
                });
            }

            var f=
                fish[
                    Math.floor(
                        Math.random()*fish.length
                    )
                ];

            item(p,f,1);

            p.fishCaught++;

            p.hunger=Math.max(
                0,
                p.hunger-2
            );

            p.thirst=Math.max(
                0,
                p.thirst-2
            );

            var text=
                "🎣 낚시 성공!\n"+
                "🐟 "+f+" x1";

            if(Math.random()<0.005){

                text+=
                    "\n🪙 코인을 낚았습니다!";

                coinFound(w,p);
            }

            persist();

            send(res,{
                success:true,
                message:text,
                player:p
            });
        });

        return;
    }

    if(path==="/api/cook"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var n=d.item||"생선구이";

            if(n==="생선구이"){

                var has=false;

                for(
                    var k=0;
                    k<fish.length;
                    k++
                ){

                    if(p.items[fish[k]]){

                        item(
                            p,
                            fish[k],
                            -1
                        );

                        has=true;

                        break;
                    }
                }

                if(!has){
                    return send(res,{
                        success:false,
                        message:
                            "요리할 생선이 없습니다."
                    });
                }

                item(
                    p,
                    "생선구이",
                    1
                );

                p.cooked++;

                persist();

                return send(res,{
                    success:true,
                    message:
                        "🍳 생선구이 1개를 만들었습니다."
                });
            }

            if(!p.items[n]||p.items[n]<1){
                return send(res,{
                    success:false,
                    message:"요리 재료가 없습니다."
                });
            }

            item(p,n,-1);

            item(
                p,
                "요리된 "+n,
                1
            );

            p.cooked++;

            persist();

            send(res,{
                success:true,
                message:
                    "🍳 요리 완료!\n"+
                    "🍽️ 요리된 "+n+" x1"
            });
        });

        return;
    }

    if(path==="/api/vehicle/get"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var v=null;

            for(
                var i=0;
                i<vehicles.length;
                i++
            ){

                if(
                    vehicles[i].name===
                    d.vehicle
                ){
                    v=vehicles[i];
                    break;
                }
            }

            if(!v){
                return send(res,{
                    success:false,
                    message:"없는 차량입니다."
                });
            }

            if(p.money<500){
                return send(res,{
                    success:false,
                    message:
                        "차량을 얻으려면 500원이 필요합니다."
                });
            }

            p.money-=500;

            p.vehicle={
                name:v.name,
                fuel:v.fuelMax,
                fuelMax:v.fuelMax,
                durability:v.durability,
                maxDurability:v.durability,
                speed:v.speed
            };

            persist();

            send(res,{
                success:true,
                message:
                    "🚗 "+v.name+" 획득!\n"+
                    "⛽ 연료 "+v.fuelMax+"\n"+
                    "🔧 내구도 "+v.durability,
                player:p
            });
        });

        return;
    }

    if(path==="/api/vehicle/fuel"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p||!p.vehicle){
                return send(res,{
                    success:false,
                    message:"차량이 없습니다."
                });
            }

            var amount=Math.max(
                1,
                Number(d.amount)||10
            );

            var cost=amount*10;

            if(p.money<cost){
                return send(res,{
                    success:false,
                    message:
                        "연료를 살 돈이 부족합니다."
                });
            }

            p.money-=cost;

            p.vehicle.fuel=Math.min(
                p.vehicle.fuelMax,
                p.vehicle.fuel+amount
            );

            persist();

            send(res,{
                success:true,
                message:
                    "⛽ 연료 +"+amount+"\n"+
                    "💰 "+cost+"원",
                player:p
            });
        });

        return;
    }

    if(path==="/api/vehicle/repair"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p||!p.vehicle){
                return send(res,{
                    success:false,
                    message:"차량이 없습니다."
                });
            }

            var need=
                p.vehicle.maxDurability-
                p.vehicle.durability;

            var cost=need*5;

            if(p.money<cost){
                return send(res,{
                    success:false,
                    message:"수리비가 부족합니다."
                });
            }

            p.money-=cost;

            p.vehicle.durability=
                p.vehicle.maxDurability;

            persist();

            send(res,{
                success:true,
                message:
                    "🔧 차량 수리 완료!\n"+
                    "💰 "+cost+"원",
                player:p
            });
        });

        return;
    }

    if(path==="/api/eat-target"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var t=findPlayer(w,d.target);

            send(
                res,
                eatTarget(w,p,t)
            );
        });

        return;
    }

    if(path==="/api/team-upgrade"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:
                        "플레이어를 찾을 수 없습니다."
                });
            }

            if(p.monsterType!=="대세아귀"){
                return send(res,{
                    success:false,
                    message:
                        "대세아귀만 사용할 수 있습니다."
                });
            }

            if(p.coin<1){
                return send(res,{
                    success:false,
                    message:
                        "🪙 코인이 부족합니다."
                });
            }

            var index=
                teamTiers.indexOf(
                    p.teamTier
                );

            if(
                index<0||
                index>=teamTiers.length-1
            ){
                return send(res,{
                    success:false,
                    message:
                        "더 이상 팀 등급을 올릴 수 없습니다."
                });
            }

            var before=p.teamTier;

            p.teamTier=
                teamTiers[index+1];

            p.teamLevel++;

            p.coin--;

            persist();

            send(res,{
                success:true,
                message:
                    "👹 신력이 발동했습니다!\n"+
                    "🏴 팀 등급\n"+
                    before+
                    " → "+
                    p.teamTier+
                    "\n🪙 코인 1개 사용!",
                player:p
            });
        });

        return;
    }

    if(path==="/api/friend/request"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var t=findName(w,d.target);

            if(!p||!t){
                return send(res,{
                    success:false,
                    message:
                        "플레이어를 찾을 수 없습니다."
                });
            }

            if(p.id===t.id){
                return send(res,{
                    success:false,
                    message:
                        "자기 자신은 친구로 추가할 수 없습니다."
                });
            }

            if(p.friends.indexOf(t.id)>=0){
                return send(res,{
                    success:false,
                    message:
                        "이미 친구입니다."
                });
            }

            if(t.requests.indexOf(p.id)<0){
                t.requests.push(p.id);
            }

            persist();

            send(res,{
                success:true,
                message:
                    "👥 친구 요청을 보냈습니다."
            });
        });

        return;
    }

    if(path==="/api/friend/accept"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var t=findName(w,d.target);

            if(!p||!t){
                return send(res,{
                    success:false,
                    message:
                        "플레이어를 찾을 수 없습니다."
                });
            }

            if(p.requests.indexOf(t.id)<0){
                return send(res,{
                    success:false,
                    message:
                        "친구 요청이 없습니다."
                });
            }

            p.requests.splice(
                p.requests.indexOf(t.id),
                1
            );

            if(p.friends.indexOf(t.id)<0){
                p.friends.push(t.id);
            }

            if(t.friends.indexOf(p.id)<0){
                t.friends.push(p.id);
            }

            persist();

            send(res,{
                success:true,
                message:
                    "🤝 "+t.name+
                    "님과 친구가 되었습니다."
            });
        });

        return;
    }

    if(path==="/api/friend/list"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var list=[];

            for(
                var i=0;
                i<p.friends.length;
                i++
            ){

                var f=
                    w.players[
                        p.friends[i]
                    ];

                if(f){
                    list.push(f.name);
                }
            }

            send(res,{
                success:true,
                message:
                    list.length
                    ?"👥 친구 목록\n\n"+
                     list.join("\n")
                    :"👥 친구가 없습니다."
            });
        });

        return;
    }

    if(path==="/api/chat"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var message=
                String(d.message||"")
                .slice(0,500);

            addEvent(
                w,
                "💬 "+p.name+": "+message
            );

            send(res,{
                success:true,
                message:
                    "💬 "+p.name+
                    ": "+message
            });
        });

        return;
    }

    if(path==="/api/title/list"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            send(res,{
                success:true,
                titles:p.titles,
                equippedTitle:p.equippedTitle,
                allTitles:titles
            });
        });

        return;
    }

    if(path==="/api/title/equip"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(
                p.titles.indexOf(d.title)<0
            ){
                return send(res,{
                    success:false,
                    message:
                        "획득하지 않은 칭호입니다."
                });
            }

            p.equippedTitle=d.title;

            persist();

            send(res,{
                success:true,
                message:
                    "🏷️ ["+
                    d.title+
                    "] 장착 완료!"
            });
        });

        return;
    }

    if(path==="/api/mission"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            var id=
                String(
                    d.missionId||""
                );

            if(
                id==="explore10"&&
                p.kills>=10
            ){

                var before=p.titles.length;

                var text=awardTitle(
                    w,
                    p,
                    "칭호10",
                    ""
                );

                persist();

                return send(res,{
                    success:true,
                    message:
                        "🎯 히든미션 보상 완료!\n"+
                        (
                            p.titles.length>before
                            ?p.titles[p.titles.length-1]
                            :"이미 획득"
                        )
                });
            }

            if(
                id==="fish10"&&
                p.fishCaught>=10
            ){

                p.coin++;

                persist();

                return send(res,{
                    success:true,
                    message:
                        "🎣 낚시 히든미션 완료!\n"+
                        "🪙 보상 코인 +1"
                });
            }

            if(
                id==="cook10"&&
                p.cooked>=10
            ){

                p.money+=1000;

                persist();

                return send(res,{
                    success:true,
                    message:
                        "🍳 요리 히든미션 완료!\n"+
                        "💰 1000원"
                });
            }

            send(res,{
                success:false,
                message:
                    "조건을 달성하지 못했습니다."
            });
        });

        return;
    }

    if(path==="/api/save"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var slot=Number(d.slot);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(slot<1||slot>3){
                return send(res,{
                    success:false,
                    message:
                        "세이브 슬롯은 1~3입니다."
                });
            }

            if(!w.slots[p.id]){
                w.slots[p.id]={};
            }

            w.slots[p.id][slot]=
                JSON.parse(
                    JSON.stringify(p)
                );

            persist();

            send(res,{
                success:true,
                message:
                    "💾 저장 완료! 슬롯: "+
                    slot
            });
        });

        return;
    }

    if(path==="/api/load"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var slot=Number(d.slot);

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(slot<1||slot>3){
                return send(res,{
                    success:false,
                    message:
                        "세이브 슬롯은 1~3입니다."
                });
            }

            if(
                !w.slots[p.id]||
                !w.slots[p.id][slot]
            ){
                return send(res,{
                    success:false,
                    message:
                        "비어 있는 슬롯입니다."
                });
            }

            w.players[p.id]=
                normalizePlayer(
                    JSON.parse(
                        JSON.stringify(
                            w.slots[p.id][slot]
                        )
                    )
                );

            persist();

            send(res,{
                success:true,
                message:
                    "📂 슬롯 "+
                    slot+
                    " 불러오기 완료!",
                player:w.players[p.id]
            });
        });

        return;
    }

    if(path==="/api/gameover"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);
            var slot=Number(d.slot);

            if(!p){
                return send(res,{
                    success:false,
                    message:
                        "플레이어를 찾을 수 없습니다."
                });
            }

            if(
                slot>=1&&
                slot<=3&&
                w.slots[p.id]
            ){
                delete w.slots[p.id][slot];
            }

            p.dead=true;

            persist();

            send(res,{
                success:true,
                message:
                    "☠️ 게임오버\n"+
                    "해당 세이브 슬롯이 삭제되었습니다."
            });
        });

        return;
    }

    if(path==="/api/shop/buy"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            var name=String(
                d.item||""
            );

            var qty=Math.max(
                1,
                Number(d.amount)||1
            );

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(
                items.indexOf(name)<0&&
                fish.indexOf(name)<0
            ){
                return send(res,{
                    success:false,
                    message:"없는 물품입니다."
                });
            }

            var price=
                (
                    10+
                    name.length*7+
                    regionInfo[p.region].danger*3
                )*qty;

            if(p.guild==="상인연합"){
                price=Math.floor(
                    price*0.9
                );
            }

            if(p.money<price){
                return send(res,{
                    success:false,
                    message:
                        "💰 돈이 부족합니다.\n"+
                        "가격: "+price+"원"
                });
            }

            p.money-=price;

            item(
                p,
                name,
                qty
            );

            persist();

            send(res,{
                success:true,
                message:
                    "🛒 "+name+
                    " x"+qty+
                    " 구매!\n"+
                    "💰 -"+price+"원",
                player:p
            });
        });

        return;
    }

    if(path==="/api/shop/sell"&&method==="POST"){

        read(req,function(d){

            var p=findPlayer(w,d.id);

            var name=String(
                d.item||""
            );

            var qty=Math.max(
                1,
                Number(d.amount)||1
            );

            if(!p){
                return send(res,{
                    success:false,
                    message:"먼저 가입하세요."
                });
            }

            if(
                !p.items[name]||
                p.items[name]<qty
            ){
                return send(res,{
                    success:false,
                    message:
                        "물품이 부족합니다."
                });
            }

            var price=
                Math.max(
                    1,
                    Math.floor(
                        (
                            10+
                            name.length*7+
                            regionInfo[p.region].danger*3
                        )*0.5
                    )
                )*qty;

            item(
                p,
                name,
                -qty
            );

            p.money+=price;

            persist();

            send(res,{
                success:true,
                message:
                    "💱 "+name+
                    " x"+qty+
                    " 판매!\n"+
                    "💰 +"+price+"원",
                player:p
            });
        });

        return;
    }

    if(path==="/api/instagram/minigame/create"&&method==="POST"){

        if(w.platform!=="instagram"){
            return send(res,{
                success:false,
                message:
                    "ASIA 전용 기능입니다."
            });
        }

        read(req,function(d){

            if(!d.id||!d.type){
                return send(res,{
                    success:false,
                    message:
                        "게임 정보를 입력하세요."
                });
            }

            var id=
                "GAME"+
                Date.now();

            var players=[d.id];

            var targets=d.targets||[];

            for(
                var i=0;
                i<targets.length;
                i++
            ){
                if(
                    players.indexOf(
                        targets[i]
                    )<0
                ){
                    players.push(
                        targets[i]
                    );
                }
            }

            var game={
                id:id,
                type:d.type,
                name:d.type,
                timeLimit:
                    Number(d.seconds)||60,
                players:players,
                accepted:[d.id],
                scores:{},
                status:"waiting",
                created:Date.now()
            };

            for(
                var j=0;
                j<players.length;
                j++
            ){
                game.scores[
                    players[j]
                ]=0;
            }

            w.games[id]=game;

            persist();

            send(res,{
                success:true,
                game:game
            });
        });

        return;
    }

    if(path==="/api/instagram/minigame/accept"&&method==="POST"){

        read(req,function(d){

            var g=
                w.games[d.gameId];

            if(!g){
                return send(res,{
                    success:false,
                    message:
                        "게임을 찾을 수 없습니다."
                });
            }

            if(
                g.players.indexOf(d.id)<0
            ){
                return send(res,{
                    success:false,
                    message:
                        "초대받은 플레이어가 아닙니다."
                });
            }

            if(
                g.accepted.indexOf(d.id)<0
            ){
                g.accepted.push(d.id);
            }

            if(
                g.accepted.length===
                g.players.length
            ){
                g.status="playing";
            }

            persist();

            send(res,{
                success:true,
                message:
                    g.status==="playing"
                    ?"🎮 게임 시작!"
                    :"참가 완료!",
                game:g
            });
        });

        return;
    }

    if(path==="/api/instagram/minigame/score"&&method==="POST"){

        read(req,function(d){

            var g=
                w.games[d.gameId];

            if(!g){
                return send(res,{
                    success:false,
                    message:
                        "게임을 찾을 수 없습니다."
                });
            }

            if(g.status!=="playing"){
                return send(res,{
                    success:false,
                    message:
                        "아직 게임이 시작되지 않았습니다."
                });
            }

            if(
                g.players.indexOf(d.id)<0
            ){
                return send(res,{
                    success:false,
                    message:
                        "참가자가 아닙니다."
                });
            }

            g.scores[d.id]=
                (g.scores[d.id]||0)+
                Number(d.score||0);

            persist();

            send(res,{
                success:true,
                message:
                    "점수 +"+
                    Number(d.score||0),
                game:g
            });
        });

        return;
    }

    if(path==="/api/instagram/minigame"&&method==="GET"){

        var g=
            w.games[
                q.query.id
            ];

        if(!g){
            return send(res,{
                success:false,
                message:
                    "게임을 찾을 수 없습니다."
            });
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

server.listen(
    PORT,
    function(){
        console.log(
            "apocalypse-seoul online "+
            PORT
        );
    }
);
