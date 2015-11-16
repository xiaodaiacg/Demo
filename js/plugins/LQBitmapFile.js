ImageManager.loadBattleback1 = function(filename, hue) {
    return this.loadBitmapJPG('img/battlebacks1/', filename, hue, true);
};

ImageManager.loadParallax = function(filename, hue) {
    return this.loadBitmapJPG('img/parallaxes/', filename, hue, true);
};

ImageManager.loadTitle1 = function(filename, hue) {
    return this.loadBitmapJPG('img/titles1/', filename, hue, true);
};

ImageManager.loadBitmapJPG = function(folder, filename, hue, smooth) {
    if (filename) {
        var path = folder + encodeURIComponent(filename) + '.jpg';
        var bitmap = this.loadNormalBitmap(path, hue || 0);
        bitmap.smooth = smooth;
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};