import ROT from './rot';
import * as util from './util';

export default class GameDisplay extends ROT.Display {

    constructor(opts) {
        opts.fontFamily = '"droid sans mono", Courier, "Courier New", monospace';
        super(opts);
        //this.__display = null;
        this.__grid = null;
        this.__offset = 0;
    }

    // drawObject takes care of looking up an object's symbol and color
    // according to name (NOT according to the actual object literal!)
    drawObject(map, x, y, object) {
        let type = object.type;
        let definition = map._getObjectDefinition(type) || this.savedDefinitions[type];
        let symbol = definition.symbol;
        let color = object.color || definition.color || "#fff";
        let bgColor = object.bgColor || "#000";

        this.__display.draw(x, y, symbol, color, bgColor);    
    };

    drawAll(map) {
        
        if (!this.__offset) {this.__offset = 0}
    
        var game = this.__display.game;
    
        // _initialize grid
        this.__grid = new Array(game._dimensions.width);
        
        for (var x = 0; x < game._dimensions.width; x++) {
            this.__grid[x] = new Array(game._dimensions.height);
            for (var y = 0; y < game._dimensions.height; y++) {
                this.__grid[x][y] = {
                    type: 'empty',
                    bgColor: 'black'
                };
            }
        }
    
        // place static objects
        for (var x = 0; x < game._dimensions.width; x++) {
            for (var y = 0; y < game._dimensions.height; y++) {
                this.__grid[x][y] = {
                    type: map._getGrid()[x][y].type,
                    bgColor: map._getGrid()[x][y].bgColor
                };
            }
        }
    
        // place dynamic objects
        for (var i = 0; i < map.getDynamicObjects().length; i++) {
            var obj = map.getDynamicObjects()[i];
            this.__grid[obj.getX()][obj.getY()] = {
                type: obj.getType(),
                bgColor: map._getGrid()[obj.getX()][obj.getY()].bgColor
            };
        }
    
        // place player
        if (map.getPlayer()) {
            let player = map.getPlayer();
            this.__grid[player.getX()][player.getY()] = {
                type: 'player',
                color: player.getColor(),
                bgColor: map._getGrid()[player.getX()][player.getY()].bgColor
            }
        }
    
        // draw grid
        for (var x = 0; x < game._dimensions.width; x++) {
            for (var y = Math.max(0, this.__offset - map.getHeight()); y < game._dimensions.height; y++) {
                this.__drawObject(map, x, y + this.__offset, this.__grid[x][y]);
            }
        }
    
        // write error messages, if any
        if (this.errors && this.errors.length > 0) {
            for (var i = 0; i < this.errors.length; i++) {
                var y = this.game._dimensions.height - this.errors.length + i;
                this.drawText(0, y, this.errors[i]);
            }
        }
    };

    drawPreviousLevel (map, offset) {
        if (!offset) {offset = 0;}
    
        var game = this.game;
        var grid = this.savedGrid;
    
        if (grid) {
            for (var x = 0; x < game._dimensions.width; x++) {
                for (var y = 0; y < game._dimensions.height; y++) {
                    this.__drawObject(map, x, y + offset, grid[x][y]);
                }
            }
        }
    }

    fadeIn (map, speed, callback, i) {
        var display = this.__display;
        var game = this.__display.game;
        if (game._currentLevel == "bonus") {
            var levelName = game._currentBonusLevel;
        } else {
            var levelName = game._levelFileNames[game._currentLevel - 1];
        }
        var command = "%c{#0f0}> run " + levelName; 
    
        if (i < -3) {
            if (callback) { callback(); }
        } else {
            if (typeof i === 'undefined') { i = map.getHeight(); }
            this.__display.clear();
            this.errors = [];
            //this.drawPreviousLevel(map, i - map.getHeight());
    
            this.__offset = i + 3;
            this.drawAll(map);
    
            this.__display.drawText(0, i + 1, command);
    
            setTimeout(function (that) {
                that.__fadeIn(map, speed, callback, i - 1);
            }, speed, this)
        }
    };

    playIntro (map, i) {
        util.playIntro(this.__display, map, i)
    };
}