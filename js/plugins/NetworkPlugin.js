function NetworkManager() {
    throw new Error('This is a static class');
}

NetworkManager.serverUrl = 'ws://nekomimigame.com:10093/';
NetworkManager.websocket = null;
NetworkManager.state = 0;//0:normal 1:connecting 2:connected
NetworkManager.waitCount = 0;
NetworkManager.connect = function() {
    console.log("try to Connect WebSocket server.");
    if (this.websocket != null) {
        this.websocket.close();
    }
    this.state = 1;
    this.websocket = new WebSocket(this.serverUrl,'my-protocol');
    this.websocket.onopen = function (evt) {
        NetworkManager.state = 2;
        console.log("Connected to WebSocket server.");
        //NetworkManager.sendMsg('start');
        InfoBox.addInfo('与联机服务器连接成功');
        }; 
        
    this.websocket.onclose = function (evt) {
        NetworkManager.state = 0;
        console.log("Disconnected"); 
        
        NetworkManager.websocket = null;
        InfoBox.addInfo('与联机服务器断开连接');
        }; 
    this.websocket.onmessage = function (evt) {
        console.log('Retrieved data from server: ' + evt.data);
        NetworkManager.msgProc(evt.data);
        }; 
    this.websocket.onerror = function (evt) {
        console.log('Error occured: ' + evt.data); 
        if(NetworkManager.state == 2){
            NetworkManager.disconnect();
        }

        
        InfoBox.addInfo('无法与联机服务器连接');
 
    }; 
}
//0:none 1:success 2:timeout
NetworkManager.waitToSuccess = function (state) {
    if (state == this.state) {
        this.waitCount = 0;
        return 1;
    } else{
        this.waitCount++;
        if (this.waitCount >= 50) {
            this.waitCount = 0;
            return 2;
        }
        return 0;
    }
}
NetworkManager.sendMsg = function (data) {
    if (this.state != 2) {
        return;
    }
     this.websocket.send(data);
     console.log("Try to Send Server Message:" + data);
     }; 
NetworkManager.disconnect = function () {
    if(this.websocket){
        console.log("try to disconnect WebSocket server.");

        this.state = 0;
        this.websocket.close();
        delete this.websocket;
    }
     
 }; 

     
     
NetworkManager.msgProc = function(data) {
    var pos = data.indexOf(':');
    var valPart = data.slice(pos+1);
    var msgHead = data.slice(0, pos);
    
    console.log(msgHead);
    var val = valPart.split(',');

    switch(msgHead){
        case 'Appear':
        {
           console.log(valPart);
           var newPlayer = new Game_NetPlayer();
           newPlayer.Id = parseInt(val[0]);
           newPlayer.setPosition(parseInt(val[1]),parseInt(val[2]));
           newPlayer.netName = val[3];
           NetworkPlayerManager.AddMapPlayer(newPlayer);
           break;
        }
        case 'Disappear':
        {
           console.log(valPart);
           NetworkPlayerManager.DelMapPlayer(parseInt(val[0]));
           break;
        }
        case 'MoveStraight':
        {
            console.log(valPart);
            NetworkPlayerManager.MoveMapPlayerDir(parseInt(val[0]),
            parseInt(val[1]),parseInt(val[2]));
            break;
        }
        case 'PreparePK':
        {
            console.log(valPart);
            NetworkPlayerManager.PrepareMapPlayerPK(parseInt(val[0]),val[1]);
            break;
        }
           
    }
}

Window_TitleCommand.prototype.makeCommandList = function() {
    if(NetworkManager.state == 0){
        this.addCommand('线上模式', 'online');
    }
    else if(NetworkManager.state == 2){
        this.addCommand('单人模式', 'offline');
    }
    this.addCommand(TextManager.newGame,   'newGame');
    this.addCommand(TextManager.continue_, 'continue', this.isContinueEnabled());
    this.addCommand(TextManager.options,   'options');
};

Scene_Title.prototype.createCommandWindow = function() {
    this._commandWindow = new Window_TitleCommand();
  //  if(NetworkManager.state == 0){
        this._commandWindow.setHandler('online',  this.commandLoginGame.bind(this));
 //   }
  //  else if(NetworkManager.state == 2){
        this._commandWindow.setHandler('offline',  this.commandLoginOutGame.bind(this));
  //  }
    this._commandWindow.setHandler('newGame',  this.commandNewGame.bind(this));
    this._commandWindow.setHandler('continue', this.commandContinue.bind(this));
    this._commandWindow.setHandler('options',  this.commandOptions.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_Title.prototype.commandLoginGame = function() {
    this._commandWindow.close();
    NetworkManager.connect();
    SceneManager.push(Scene_Wait);
};

Scene_Title.prototype.commandLoginOutGame = function() {
    this._commandWindow.close();
    NetworkManager.disconnect();
    SceneManager.push(Scene_Wait);
    //this.waitNetworkToCreateTitleMenu(0);
};

Scene_Wait.prototype.waitNetworkToCreateTitleMenu = function(state){
    if (NetworkManager.waitToSuccess(state) == 2) {
        NetworkManager.disconnect();
        this.popScene();
    }else if(NetworkManager.waitToSuccess(state) == 1){
        this.popScene();
    }else{
         setTimeout('this.waitNetworkToCreateTitleMenu('+ state +')',200);
    }
};

//Scene_Title.prototype.createMessageWindow = function() {
//    this._messageWindow = new Window_Base();
//    this.addWindow(this._messageWindow);
//};

Scene_Title.prototype.update = function() {
    if (!this.isBusy() && NetworkManager.state != 1) {
        this._commandWindow.open();
    }
    Scene_Base.prototype.update.call(this);
};

Scene_Base.prototype.initialize = function() {
    Stage.prototype.initialize.call(this);
    this._active = false;
    this._fadeSign = 0;
    this._fadeDuration = 0;
    this._fadeSprite = null;
    this._backSprite = new Sprite(ImageManager.loadSystem('network'));
    this.backState = 0;
    this._infoBox = new Sprite(new Bitmap());
    if (InfoBox.sprite == null) {
        InfoBox.sprite = new Sprite(new Bitmap(Graphics.width ,Graphics.height));
    }
    
};



function InfoLine(text) {
    this.startTime = new Date().getTime();
    this.endTime = this.startTime + 5000;
   // this.sprite = new Sprite(ImageManager.loadSystem('GameOver'));
//    this.sprite.anchor.x = 1;
//    this.sprite.anchor.y = 1;
    this.text = text;
};


function InfoBox() {
    throw new Error('This is a static class');
}

InfoBox.infoLineList =[];
InfoBox.maxLine = 10;
InfoBox.sprite = null;



InfoBox.addInfo = function(text) {
    this.infoLineList.push(new InfoLine(text));
    this.startTime = Date.now();
    this.endTime = this.startTime + 20000;
    this.needrefresh = true;
};
InfoBox.delInfo = function(index) {
    delete this.infoLineList[index];
    this.infoLineList.splice(index,1);
    this.needrefresh = true;
};

InfoBox.needrefresh = false;

InfoBox.update = function() {
    var list = this.infoLineList;
    for (var i = 0; i < list.length; i++) {
        var info = list[i];
        var now = Date.now();
        if (info.endTime < now) {
            this.delInfo(i);
        }
    }
    if (this.needrefresh) {
        //var list = this.infoLineList;
        var text = "";
        this.sprite.bitmap.clear();
        this.sprite.bitmap.outlineWidth = 3;
        this.sprite.bitmap.fontSize = 12;
        for (var i = 0; i < list.length; i++) {
            this.sprite.bitmap.drawText(list[i].text, 16, Graphics.height/4 - i*16, Graphics.width , Graphics.height, '');
            }

  
        this.needrefresh = false;
        }
};

Scene_Base.prototype.update = function() {
    this.updateFade();
    this.updateChildren();
    AudioManager.checkErrors();
    this.checkNetwork();
    InfoBox.update();
};

Scene_Base.prototype.showListBox = function() {
    this._infoBox.addChild(InfoBox.sprite);
    this.addChild(this._infoBox);
    console.log(this);
}

Scene_Base.prototype.checkNetwork = function() {
    if (this.backState != NetworkManager.state) {
        this.backState = NetworkManager.state
        if (NetworkManager.state == 2) {
            this._backSprite.visible = true;
            this.addChild(this._backSprite);
        }else if(NetworkManager.state == 1){
            this._backSprite.visible = false;
        }else if(NetworkManager.state == 0){
            this._backSprite.visible = false;
        }
    }
};

function Scene_Wait() {
    this.initialize.apply(this, arguments);
}

Scene_Wait.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Wait.prototype.constructor = Scene_Wait;

Scene_Wait.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
};

Scene_Wait.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
//    this.updateActor();
    this.createWindowLayer();
    this.createWaitWindow();
};

//Scene_Wait.prototype.updateActor = function() {
//    this._actor = $gameParty.menuActor();
//};

Scene_Wait.prototype.start = function() {
   Scene_Base.prototype.start.call(this);
};

Scene_Wait.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    if (NetworkManager.state != 1) {
        this.popScene();
    }
};

Scene_Wait.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
};

Scene_Wait.prototype.createWaitWindow = function() {
    this._waitWindow = new Window_WaitMessage();
    this.addChild(this._waitWindow);
    //this._waitWindow.drawWait();
   
    console.log(this._waitWindow);
 //   $gameMessage.newPage();
 //   $gameMessage.add('wait');

};

function Window_WaitMessage() {
    this.initialize.apply(this, arguments);
}

Window_WaitMessage.prototype = Object.create(Window_Base.prototype);
Window_WaitMessage.prototype.constructor = Window_WaitMessage;


Window_WaitMessage.prototype.initialize = function() {
 //   var rewards = BattleManager._rewards;
    var width = 300;
    var height = 100;
 //   var statusHeight = this.fittingHeight(4);
    var x = (Graphics.boxWidth - width) / 2;
    var y = (Graphics.boxHeight - height) / 2;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
//    this.openness = 0;
    this.open();
};

Window_WaitMessage.prototype.refresh = function() {
    this.contents.clear();

    this.drawTextEx('等待连接...', 52, 16);
 //   this.drawText('11111111', x, y);
};

function NetworkPlayerManager() {
    throw new Error('This is a static class');
}

NetworkPlayerManager.MapPlayerList =[];
NetworkPlayerManager.AddMapPlayer = function(newPlayer){
    this.DelMapPlayer(newPlayer.Id);

    
    var img = "";
    switch (Math.randomInt(7)) {
        case 0:
            img = 'Actor1'
            break;
        case 1:
            img = 'Actor2'
            break;
        case 2:
            img = 'Actor3'
            break;
        case 3:
            img = 'People1'
            break;
        case 4:
            img = 'People2'
            break;
        case 5:
            img = 'People4'
            break;
        case 6:
            img = 'Monster'
            break;                                               
        default:
            img = 'Monster'
            break;
    }
    //newPlayer._priorityType = 2;
    newPlayer.setImage(img,Math.randomInt(8));
//    console.log(newPlayer.netName+"==="+"主人公"+"="+ (newPlayer.netName === "主人公"));
//    if (newPlayer.netName == "主人公") {
//        newPlayer.netName = "路人"+newPlayer.Id+"号";
//   }
    this.MapPlayerList.push(newPlayer);
};

NetworkPlayerManager.DelMapPlayer = function(id){
    var list = this.MapPlayerList;
    for (var i = 0; i < list.length; i++) {
        var player = list[i];
        if (player.Id == id) {
            player.deleteState = 1 ;
            break;
        }
    }
    console.log(list);
};

NetworkPlayerManager.MoveMapPlayerDir = function(id,dir,spd){
    var list = this.MapPlayerList;
    for (var i = 0; i < list.length; i++) {
        var player = list[i];
        if (player.Id == id) {
            player.setWalkAnime(true);
            if ($dataMap) {
                player.setMoveSpeed(spd);
                player.moveStraight(dir);
            } else {
                switch (dir)
                {
                case 2:
                    player.setPosition(player._x,player._y+1);
                    break;
                case 4:
                    player.setPosition(player._x,player._y);
                    break;
                case 6:
                    player.setPosition(player._x+1,player._y);
                    break;
                case 8:
                    player.setPosition(player._x,player._y-1);
                    break;
                default:
                    break;
                }
                
            }
            
            break;
        }
    }
    console.log(list);
};



BattleManager.updateBattleEnd = function() {
    if (this.isBattleTest()) {
        AudioManager.stopBgm();
        SceneManager.exit();
    } else if ($gameParty.isAllDead()) {
        if (this._canLose) {
            $gameParty.reviveBattleMembers();
            SceneManager.pop();
        } else {
            SceneManager.goto(Scene_Gameover);
        }
    } else {
        SceneManager.pop();
    }
    this._phase = null;
};


NetworkPlayerManager.NetPlayerActors = [];
NetworkPlayerManager.PrepareMapPlayerPK = function(id,level){
    if (id&&!$gameParty.inBattle()) {
        $gameParty.battleMembers().forEach(function(member) {
            var enemy = new Game_OtherActor(member.actorId());
            enemy.changeLevel(member._level,false);
            enemy._classId = member._classId
            enemy._name = member._name;

            enemy._equips = [];
            enemy._skills = [];
            member._equips.forEach(function(equip) {
                enemy._equips.push(equip);
            }, this);
            member._skills.forEach(function(skill) {
                enemy._skills.push(skill);
            }, this);
            enemy.addParam(0, enemy.paramBase(0) * (level*0.2));
            for (var index = 0; index < 7; index++) {
                 enemy.addParam(index + 1,enemy.paramBase(index + 1) * (level*0.02));
            }
            console.log(enemy.param(0));
            enemy.refresh();
            enemy.recoverAll();
            member.recoverAll();
            this.NetPlayerActors.push(enemy);
        }, this);

        BattleManager.battleState = 2;
        BattleManager.setupPK();
        
//           BattleManager.setEventCallback(function(n) {
//               this._branch[this._indent] = n;
//           }.bind(this));
//      $gamePlayer.makeEncounterCount();
        SceneManager.push(Scene_Battle);
    }
}

BattleManager.endBattle = function(result) {
    this._phase = 'battleEnd';
    if (this._eventCallback) {
        this._eventCallback(result);
    }
    if (result === 0) {
        $gameSystem.onBattleWin();
    } else if (this._escaped) {
        $gameSystem.onBattleEscape();
    }
    
    NetworkPlayerManager.NetPlayerActors = [];
    if (BattleManager.battleState == 2) {
        delete $gameTroop;
        $gameTroop = new Game_Troop();
    }
    BattleManager.battleState = 0;
};

Game_NetParty.prototype.onBattleEnd = function() {
    this._inBattle = false;
    this.members().forEach(function(member) {
        member.onBattleEnd();
        delete member;
    });

};


BattleManager.setupPK = function() {
    this.initMembers();
    this._canEscape = false;
    this._canLose = true;

    delete $gameTroop;
    $gameTroop = $gameNetParty;
    
    $gameTroop.setup();
    $gameScreen.onBattleStart();
    
    //this.makeEscapeRatio();
};

Yanfly.ASP3.BattleManager_setupPK = BattleManager.setupPK;
BattleManager.setupPK = function() {
    this.resetCamera();
		this.actionResetZoom([1]);
		Yanfly.ASP3.BattleManager_setupPK.call(this);
};

function Spriteset_PKBattle() {
    this.initialize.apply(this, arguments);
}


BattleManager.battleState = 0;


function Game_NetParty() {
    this.initialize.apply(this, arguments);
}

Game_NetParty.prototype = Object.create(Game_Unit.prototype);
Game_NetParty.prototype.constructor = Game_NetParty;

Game_NetParty.prototype.initialize = function() {
    Game_Unit.prototype.initialize.call(this);
    this._interpreter = new Game_Interpreter();
    this.clear();
};

Game_NetParty.prototype.isEventRunning = function() {
    return this._interpreter.isRunning();
};

Game_NetParty.prototype.updateInterpreter = function() {
    this._interpreter.update();
};

Game_NetParty.prototype.turnCount = function() {
    return this._turnCount;
};

Game_NetParty.prototype.members = function() {
    return this._enemies;
};

Game_NetParty.prototype.clear = function() {
    this._interpreter.clear();
    this._enemies = [];
    this._turnCount = 0;
    this._namesCount = {};
};

Game_NetParty.prototype.setup = function() {
    this.clear();
    this._enemies = [];
    if (!NetworkPlayerManager.NetPlayerActors.length) {
        return
    }
    NetworkPlayerManager.NetPlayerActors.forEach(function(member) {
            this._enemies.push(member);
    }, this);
};

Game_NetParty.prototype.enemyNames = function() {
    var names = [];
    this.members().forEach(function(enemy) {
        var name = enemy.name();
        if (enemy.isAlive()) {
            names.push(name);
        }
    });
    return names;
};

Game_NetParty.prototype.meetsConditions = function(page) {
    var c = page.conditions;
    if (!c.turnEnding && !c.turnValid && !c.enemyValid &&
            !c.actorValid && !c.switchValid) {
        return false;  // Conditions not set
    }
    if (c.turnEnding) {
        if (!BattleManager.isTurnEnd()) {
            return false;
        }
    }
    if (c.turnValid) {
        var n = this._turnCount;
        var a = c.turnA;
        var b = c.turnB;
        if ((b === 0 && n !== a)) {
            return false;
        }
        if ((b > 0 && (n < 1 || n < a || n % b !== a % b))) {
            return false;
        }
    }
    if (c.enemyValid) {
        var enemy = $gameTroop.members()[c.enemyIndex];
        if (!enemy || enemy.hpRate() * 100 > c.enemyHp) {
            return false;
        }
    }
    if (c.actorValid) {
        var actor = $gameActors.actor(c.actorId);
        if (!actor || actor.hpRate() * 100 > c.actorHp) {
            return false;
        }
    }
    if (c.switchValid) {
        if (!$gameSwitches.value(c.switchId)) {
            return false;
        }
    }
    return true;
};

Game_NetParty.prototype.setupBattleEvent = function() {
    if (!this._interpreter.isRunning()) {
        if (this._interpreter.setupReservedCommonEvent()) {
            return;
        }
        if (!this.troop()) {
            return;
        }
        var pages = this.troop().pages;
        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            if (this.meetsConditions(page) && !this._eventFlags[i]) {
                this._interpreter.setup(page.list);
                if (page.span <= 1) {
                    this._eventFlags[i] = true;
                }
                break;
            }
        }
    }
};

Game_NetParty.prototype.troop = function() {
    return $dataTroops[0];
};

Game_NetParty.prototype.increaseTurn = function() {
    this._turnCount++;
};

Game_NetParty.prototype.expTotal = function() {
        return 0;
};

Game_NetParty.prototype.goldTotal = function() {
        return 0;
};

Game_NetParty.prototype.goldRate = function() {
        return 0;
};

Game_NetParty.prototype.makeDropItems = function() {
        return [];
};

Game_NetParty.prototype.removeBattleStates = function() {
    this.members().forEach(function(actor) {
        actor.removeBattleStates();
    });
};

Game_NetParty.prototype.requestMotionRefresh = function() {
    this.members().forEach(function(actor) {
        actor.requestMotionRefresh();
    });
};

$gameNetParty = null;
DataManager.createGameObjects = function() {
    $gameTemp          = new Game_Temp();
    $gameSystem        = new Game_System();
    $gameScreen        = new Game_Screen();
    $gameTimer         = new Game_Timer();
    $gameMessage       = new Game_Message();
    $gameSwitches      = new Game_Switches();
    $gameVariables     = new Game_Variables();
    $gameSelfSwitches  = new Game_SelfSwitches();
    $gameActors        = new Game_Actors();
    $gameParty         = new Game_Party();
    $gameTroop         = new Game_Troop();
    $gameMap           = new Game_Map();
    $gamePlayer        = new Game_Player();
    $gameNetParty      = new Game_NetParty();
};

NetworkManager.RandTable = [];
NetworkManager.RandCount = 0;


$randomtmp = Math.random;
Math.random = function(){
    var list = NetworkManager.RandTable;
    if (list.length == 0) {
        return $randomtmp.call();
    }
    console.log("Index ="+NetworkManager.RandCount);
    var rf = list[NetworkManager.RandCount];
    NetworkManager.RandCount ++;
    console.log("Index ++ ="+NetworkManager.RandCount);
    if (NetworkManager.RandCount >= list.length) {
        NetworkManager.RandCount = 0;
    }
    return rf;
}

Spriteset_Battle.prototype.createLowerLayer = function() {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createBackground();
    this.createBattleField();
    this.createBattleback();
    if (BattleManager.battleState == 2) {
        this.createEnemyActors();
    }
    else{
        this.createEnemies();
    }
    this.createActors();
};

Spriteset_Battle.prototype.createEnemyActors = function() {
    this._enemySprites = [];
    for (var i = 0; i < $gameTroop.members().length; i++) {
        this._enemySprites[i] = new Sprite_EnemyActor();
        this._enemySprites[i].setMirror(true);
        this._battleField.addChild(this._enemySprites[i]);
    }
};

Spriteset_Battle.prototype.updateEnemyActors = function() {
    var members = $gameTroop.members();
    for (var i = 0; i < this._enemySprites.length; i++) {
        this._enemySprites[i].setBattler(members[i]);
    }
};

Spriteset_Battle.prototype.update = function() {
    Spriteset_Base.prototype.update.call(this);
    this.updateActors();
    this.updateEnemyActors();
    this.updateBattleback();
};

Game_NetParty.prototype.updateAIPatterns = function() {
    for (var i = 0; i < this.aliveMembers().length; ++i) {
      var member = this.aliveMembers()[i];
      if (member) member.setAIPattern();
    }
};



function Sprite_EnemyActor() {
    this.initialize.apply(this, arguments);
}



Sprite_EnemyActor.prototype = Object.create(Sprite_Actor.prototype);
Sprite_EnemyActor.prototype.constructor = Sprite_EnemyActor;

Sprite_EnemyActor.prototype.isEnemy = function() {
    return true;
};


Sprite_EnemyActor.prototype.refreshMotion = function() {
    var actor = this._actor;
    if (actor) {
        var stateMotion = actor.stateMotionIndex();
        if (actor.isInputting() || actor.isActing()) {
            this.startMotion('walk');
        } else if (stateMotion === 3) {
            this.startMotion('dead');
        } else if (stateMotion === 2) {
            this.startMotion('sleep');
        } else if (actor.isChanting()) {
            this.startMotion('chant');
        } else if (actor.isGuard() || actor.isGuardWaiting()) {
            this.startMotion('guard');
        } else if (stateMotion === 1) {
            this.startMotion('abnormal');
        } else if (actor.isDying()) {
            this.startMotion('dying');
        } else if (actor.isUndecided()) {
            this.startMotion('walk');
        } else {
            this.startMotion('wait');
        }
    }
    this.setMirror(true);
};


Sprite_EnemyActor.prototype.startMove = function(x, y, duration) {
    x *= -1;   
    if (this._targetOffsetX !== x || this._targetOffsetY !== y) {
        this._targetOffsetX = x;
        this._targetOffsetY = y;
        this._movementDuration = duration;
        if (duration === 0) {
            this._offsetX = x;
            this._offsetY = y;
        }
    }
};


Sprite_EnemyActor.prototype.setActorHome = function(index) {
    if ($gameSystem.isSideView()) {
      var homeX = eval(Yanfly.Param.BECHomePosX) * -1 + Graphics.boxWidth; 
  		var homeY = eval(Yanfly.Param.BECHomePosY);
    } else {
      var homeX = eval(Yanfly.Param.BECFrontPosX);
  		var homeY = eval(Yanfly.Param.BECFrontPosY);
    }
		this.setHome(homeX, homeY);
};



Sprite_EnemyActor.prototype.setBattler = function(battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    var changed = (battler !== this._actor);
    if (changed) {
        this._actor = battler;
        if (battler) {
            this.setActorHome(battler.index());
        }
        this.startEntryMotion();
        this._stateSprite.setup(battler);
    }
};

Sprite_EnemyActor.prototype.startAnimation = function(animation, mirror, delay) {
    var sprite = new Sprite_Animation();
    sprite.setup(this._effectTarget, animation, mirror, delay);
    this.parent.addChild(sprite);
    this._animationSprites.push(sprite);
    
};

Sprite_EnemyActor.prototype.updateBitmap = function() {
    Sprite_Battler.prototype.updateBitmap.call(this);
    var name = this._actor.battlerName();
    if (this._battlerName !== name) {
        this._battlerName = name;
        this._mainSprite.bitmap = ImageManager.loadSvActor(name);
    }
};

function Game_OtherActor() {
    Game_Actor.apply(this, arguments);
}




Game_OtherActor.prototype = Object.create(Game_Actor.prototype);
Game_OtherActor.prototype.constructor = Game_OtherActor;


Game_OtherActor.prototype.setAIPattern = function() {
    
};
Game_OtherActor.prototype.setup = function(actorId) {
    var actor = $dataActors[actorId];
    this._actorId = actorId;
    this._name = actor.name;
    this._nickname = actor.nickname;
    this._profile = actor.profile;
    this._classId = actor.classId;
    this._level = actor.initialLevel;
    this.initImages();
    this.initExp();
    this.initSkills();
    this.initEquips(actor.equips);
    this.clearParamPlus();
    this.recoverAll();
};

Game_OtherActor.prototype.startAnimation = function(animationId, mirror, delay) {
    var data = { animationId: animationId, mirror: mirror, delay: delay };
    this._animations.push(data);
};

Game_OtherActor.prototype.isActor = function() {
    return true;
};

Game_OtherActor.prototype.isEnemyActor = function() {
    return (BattleManager.battleState == 2);
};

Game_Battler.prototype.isEnemyActor = function() {
    return false;
};

Game_OtherActor.prototype.friendsUnit = function() {
    return this.isEnemyActor() ? $gameTroop : $gameParty;
};

Game_OtherActor.prototype.opponentsUnit = function() {
    return this.isEnemyActor() ? $gameParty : $gameTroop;
};

Game_OtherActor.prototype.index = function() {
    return $gameTroop.members().indexOf(this);
};

Game_OtherActor.prototype.isBattleMember = function() {
    return true;
};

Game_OtherActor.prototype.bestEquipItem = function(slotId) {
    var etypeId = this.equipSlots()[slotId];
    var items = $gameTroop.equipItems().filter(function(item) {
        return item.etypeId === etypeId && this.canEquip(item);
    }, this);
    var bestItem = null;
    var bestPerformance = -1000;
    for (var i = 0; i < items.length; i++) {
        var performance = this.calcEquipItemPerformance(items[i]);
        if (performance > bestPerformance) {
            bestPerformance = performance;
            bestItem = items[i];
        }
    }
    return bestItem;
};

Game_OtherActor.prototype.performCollapse = function() {
    Game_Battler.prototype.performCollapse.call(this);
    if ($gameTroop.inBattle()) {
        SoundManager.playActorCollapse();
    }
};

Game_OtherActor.prototype.makeActions = function() {
    Game_Battler.prototype.makeActions.call(this);
    if (this.numActions() > 0) {
        this.setActionState('undecided');
    } else {
        this.setActionState('waiting');
    }
    if (this.isAutoBattle()) {
        this.makeAutoBattleActions();
    } else if (this.isConfused()) {
        this.makeConfusionActions();
    }
};

Game_OtherActor.prototype.makeAutoBattleActions = function() {
    for (var i = 0; i < this.numActions(); i++) {
        var list = this.makeActionList();
        var maxValue = Number.MIN_VALUE;
        for (var j = 0; j < list.length; j++) {
            var value = list[j].evaluate();
            if (value > maxValue) {
                maxValue = value;
                //this.setAction(i, list[j]);
                this.forceAction(list[j]._item.itemId(), -1);
                console.log(list[j]._item.itemId());
            }
        }
    }
    this.setActionState('waiting');
};

Game_Battler.prototype.forceAction = function(skillId, targetIndex) {
    this.clearActions();
    var action = new Game_Action(this, true);
    action.setSkill(skillId);
    if (targetIndex === -2) {
        action.setTarget(this._lastTargetIndex);
    } else if (targetIndex === -1) {
        action.decideRandomTarget();
    } else {
        action.setTarget(targetIndex);
    }
    this._actions.push(action);
};

Game_Action.prototype.decideRandomTarget = function() {
    var target;
    if (this.isForDeadFriend()) {
        target = this.friendsUnit().randomDeadTarget();
    } else if (this.isForFriend()) {
        target = this.friendsUnit().randomTarget();
    } else {
        target = this.opponentsUnit().randomTarget();
    }
    if (target) {
        this._targetIndex = target.index();
    } else {
        this.clear();
    }
};

Game_Unit.prototype.randomTarget = function() {
    var tgrRand = Math.random() * this.tgrSum();
    var target = null;
    this.aliveMembers().forEach(function(member) {
        tgrRand -= member.tgr;
        if (tgrRand <= 0 && !target) {
            target = member;
        }
    });
    return target;
};

Game_OtherActor.prototype.makeActionList = function() {
    var list = [];
    var action = new Game_Action(this);
    action.setAttack();
    list.push(action);
    this.usableSkills().forEach(function(skill) {
        action = new Game_Action(this);
        action.setSkill(skill.id);
        list.push(action);
    }, this);
    return list;
};
Game_OtherActor.prototype.isAutoBattle = function() {
    return true;
};

Game_OtherActor.prototype.isOnline = function() {
    return NetworkManager.state == 2;
};

Game_Action.prototype.aiRegisterElementRate = function(target) {
    if (this.item().damage.elementId < 0) return;
    var elementId = this.item().damage.elementId;
    if (this.subject().isEnemyActor()) {
      $gameTroop.aiRegisterElementRate(target, elementId);
            return;
       }
    if (this.subject().isActor()) {
      $gameParty.aiRegisterElementRate(target, elementId);
    } else {
      $gameTroop.aiRegisterElementRate(target, elementId);
    }
};


AIManager.elementRateMatch = function(target, elementId, type) {
    var rate = target.elementRate(elementId).toFixed(2);
    if (this.battler().isEnemyActor()) {
     if (!$gameTroop.aiElementRateKnown(target, elementId)) return true;
    }
    if (this.battler().isActor()) {
      if (!$gameParty.aiElementRateKnown(target, elementId)) return true;
    } else {
      if (!$gameTroop.aiElementRateKnown(target, elementId)) return true;
    }
    if (['NEUTRAL', 'NORMAL'].contains(type)) {
      return rate === 1.00;
    } else if (['WEAK', 'WEAKNESS', 'VULNERABLE'].contains(type)) {
      return rate > 1.00;
    } else if (['RESIST', 'RESISTANT', 'STRONG'].contains(type)) {
      return rate < 1.00;
    } else if (['NULL', 'CANCEL', 'NO EFFECT'].contains(type)) {
      return rate === 0.00;
    } else if (['ABSORB', 'HEAL'].contains(type)) {
      return rate < 0.00;
    }
    return false;
};

BattleManager.registerSprite = function(battler, sprite) {
  var id = 0;
  if (!this._registeredSprites) this._registeredSprites = {};
  if (battler.isActor()) battler.isEnemyActor()?  id = 200000 + battler.index():id = 100000 + battler.actorId();
  if (battler.isEnemy()) id = 200000 + battler.index();
  this._registeredSprites[id] = sprite;
};

BattleManager.getSprite = function(battler) {
  var id = 0;
  if (!this._registeredSprites) this._registeredSprites = {};
  if (battler.isActor()) battler.isEnemyActor()?  id = 200000 + battler.index():id = 100000 + battler.actorId();
  if (battler.isEnemy()) id = 200000 + battler.index();
  return this._registeredSprites[id];
};

Window_BattleLog.prototype.displayAddedStates = function(target) {
    target.result().addedStateObjects().forEach(function(state) {
        var stateMsg = (target.isActor() && target.isEnemyActor()) ? state.message1 : state.message2;
        if (state.id === target.deathStateId()) {
            this.push('performCollapse', target);
        }
        if (stateMsg) {
            this.push('popBaseLine');
            this.push('pushBaseLine');
            this.push('addText', target.name() + stateMsg);
            this.push('waitForEffect');
        }
    }, this);
};


Game_Action.prototype.setSubject = function(subject) {
    if (subject.isActor() && !subject.isEnemyActor()) {
        this._subjectActorId = subject.actorId();
        this._subjectEnemyIndex = -1;
    } else {
        this._subjectEnemyIndex = subject.index();
        this._subjectActorId = 0;
    }
};



BattleManager.startTurn = function() {
    this._phase = 'turn';
    this.clearActor();
    $gameTroop.increaseTurn();
    this._performedBattlers = [];
    this.makeActionOrders();
    if (this.battleState == 2)
        $gameTroop.requestMotionRefresh();
    $gameParty.requestMotionRefresh();

    this._logWindow.startTurn();
    this._subject = this.getNextSubject();
};

BattleManager.updateTurn = function() {
    if (this.battleState == 2)
        $gameTroop.requestMotionRefresh();
    $gameParty.requestMotionRefresh();
    if (!this._subject) {
        this._subject = this.getNextSubject();
    }
    if (this._subject) {
        this.processTurn();
    } else {
        this.endTurn();
    }
};

BattleManager.processTurn = function() {
    var subject = this._subject;
    var action = subject.currentAction();
    if (action) {
        action.prepare();
        if (action.isValid()) {
            this.startAction();
        }
        subject.removeCurrentAction();
    } else {
        subject.onAllActionsEnd();
        this.refreshStatus();
        this._logWindow.displayAutoAffectedStatus(subject);
        this._logWindow.displayCurrentState(subject);
        this._logWindow.displayRegeneration(subject);
        this._subject = this.getNextSubject();
    }
};

BattleManager.startAction = function() {
    var subject = this._subject;
    subject.onAllActionsEnd();
    var action = subject.currentAction();
    this._action = action;
	var targets = action.makeTargets();
    this._targets = targets;
	this._allTargets = targets.slice();
    this._individualTargets = targets.slice();
		this._phase = 'phaseChange';
		this._phaseSteps = ['setup', 'whole', 'target', 'follow', 'finish'];
		this._returnPhase = '';
		this._actionList = [];
    subject.useItem(this._action.item());
    this._action.applyGlobal();
    this.refreshStatus();
    this._logWindow.startAction(this._subject, this._action, this._targets);
};



Game_Item.prototype.setObject = function(item) {
    if (DataManager.isSkill(item)) {
        this._dataClass = 'skill';
    } else if (DataManager.isItem(item)) {
        this._dataClass = 'item';
    } else if (DataManager.isWeapon(item)) {
        this._dataClass = 'weapon';
    } else if (DataManager.isArmor(item)) {
        this._dataClass = 'armor';
    } else {
        this._dataClass = '';
    }
    this._itemId = item ? item.id : 0;
};