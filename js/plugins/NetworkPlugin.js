function NetworkManager() {
    throw new Error('This is a static class');
}

NetworkManager.serverUrl = 'ws://localhost:7681/' //'ws://nekomimigame.com:10093/';
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