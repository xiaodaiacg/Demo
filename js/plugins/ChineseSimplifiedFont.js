//=============================================================================
// ChineseSimplifiedSupport.js
//=============================================================================
 
/*:
 * @plugindesc Support Chinese Simplified.ver1.0
 * @author woodey
 * 
 * @param UseFont
 * @desc UseFont Name.
 * default: SimHei, Heiti TC, sans-serif
 * @default SimHei, Heiti TC, sans-serif
 */

var parameter = PluginManager.parameters('ChineseSimplifiedFont')
var useFont = parameter['UseFont'];

Window_Base.prototype.standardFontFace = function() {
		return useFont;
    }