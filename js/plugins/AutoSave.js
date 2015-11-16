Scene_Map.prototype.onMapLoaded = function() {
    if (this._transfer) {
        $gamePlayer.performTransfer();
        $gameSystem.onBeforeSave();
        DataManager.saveGame(1);
    }
    this.createDisplayObjects();
};

Window_SavefileList.prototype.drawItem = function(index) {
    var id = index + 1;
    var valid = DataManager.isThisGameFile(id);
    var info = DataManager.loadSavefileInfo(id);
    var rect = this.itemRectForText(index);
    this.resetTextColor();
    if (this._mode === 'load') {
        this.changePaintOpacity(valid);
    }
    this.drawFileId(id, rect.x, rect.y);
    if (info) {
        this.changePaintOpacity(valid);
        this.drawContents(index, info, rect, valid);
        this.changePaintOpacity(true);
    }
};



Window_SavefileList.prototype.drawContents = function(index, info, rect, valid) {
    var bottom = rect.y + rect.height;
    if (rect.width >= 420) {
        if (index == 0) {
            info.title += ' (自动存档)';
        }
        this.drawGameTitle(info, rect.x + 192, rect.y, rect.width - 192);
        if (valid) {
            this.drawPartyCharacters(info, rect.x + 220, bottom - 4);
        }
    }
    var lineHeight = this.lineHeight();
    var y2 = bottom - lineHeight;
    if (y2 >= lineHeight) {
        this.drawPlaytime(info, rect.x, y2, rect.width);
    }
};