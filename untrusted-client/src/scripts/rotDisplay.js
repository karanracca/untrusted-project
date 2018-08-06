import ROT from './rot';
import * as config from './config';

export default class GameDisplay extends ROT.Display {

    constructor(opts, game) {
        opts.fontFamily = '"droid sans mono", Courier, "Courier New", monospace';
        super(opts);
        this._grid = null;
        this._offset = 0;
        this._intro = false;
        this.game = game;
        this.errors = [];
    }

    // drawObject takes care of looking up an object's symbol and color
    // according to name (NOT according to the actual object literal!)
    drawObject(map, x, y, object) {
        let type = object.type;
        let definition = this.game.getItemDefinition(type) || this.savedDefinitions[type]; // change map.getObjectDefination
        let symbol = definition.symbol;
        let color = object.color || definition.color || "#fff";
        let bgColor = object.bgColor || "#000";

        this.draw(x, y, symbol, color, bgColor);    
    };

    drawAll(map) {
        
        if (!this._offset) this._offset = 0;
    
        // initialize grid
        this._grid = new Array(this.game.dimensions.width);
        
        for (let x = 0; x < this.game.dimensions.width; x++) {
            this._grid[x] = new Array(this.game.dimensions.height);
            for (let y = 0; y < this.game.dimensions.height; y++) {
                this._grid[x][y] = {
                    type: 'empty',
                    bgColor: 'black'
                };
            }
        }
    
        // place static objects
        for (let x = 0; x < this.game.dimensions.width; x++) {
            for (let y = 0; y < this.game.dimensions.height; y++) {
                this._grid[x][y] = {
                    type: map._grid[x][y].type,
                    bgColor: map._grid[x][y].bgColor
                };
            }
        }
    
        // place dynamic objects
        for (let i = 0; i < map._dynamicObjects.length; i++) {
            let obj = map._dynamicObjects[i];
            this._grid[obj.getX()][obj.getY()] = {
                type: obj.getType(),
                bgColor: map._grid[obj.getX()][obj.getY()].bgColor
            };
        }
    
        // place player
        if (map.player) {
            let player = map.player
            this._grid[player.getX()][player.getY()] = {
                type: 'player',
                color: player.getColor(),
                bgColor: map._grid[player.getX()][player.getY()].bgColor
            }
        }
    
        // draw grid
        for (let x = 0; x < this.game.dimensions.width; x++) {
            for (var y = Math.max(0, this._offset - map.height); y < this.game.dimensions.height; y++) {
                this.drawObject(map, x, y + this._offset, this._grid[x][y]);
            }
        }
    
        // write error messages, if any
        if (this.errors && this.errors.length > 0) {
            for (var i = 0; i < this.errors.length; i++) {
                var y = this.game.dimensions.height - this.errors.length + i;
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
        
        if (this.game._currentLevel == "bonus") {
            var levelName = this.game._currentBonusLevel;
        } else {
            var levelName = config.levelFileNames[this.game._currentLevel - 1];
        }
        
        var command = "%c{#0f0}> run " + levelName; 
    
        if (i < -3) {
            if (callback) { callback(); }
        } else {
            if (typeof i === 'undefined') { i = map.height }
            this.clear();
            this.errors = [];
            //this.drawPreviousLevel(map, i - map.getHeight());
    
            this._offset = i + 3;
            this.drawAll(map);
    
            this.drawText(0, i + 1, command);
    
            setTimeout(function (that) {
                that.fadeIn(map, speed, callback, i - 1);
            }, speed, this)
        }
    };

    writeStatus (text) {
        let h = this.game.map.height;
        let w = this.game.map.width;

        let strings = [text];
        
        if (text.length > w) {
            // split into two lines
            let minCutoff = w - 10;
            let cutoff = minCutoff + text.slice(minCutoff).indexOf(" ");
            strings = [text.slice(0, cutoff), text.slice(cutoff + 1)];
        }
    
        for (let i = 0; i < strings.length; i++) {
            let str = strings[i];
            let x = Math.floor((w - str.length) / 2);
            let y = h + i - strings.length - 1;
            this.drawText(x, y, str);
        }
    };

    appendError (errorText, command) {
        let map = this.game.map;
        if (!command) {
            command = "%c{#0f0}> run " + config.levelFileNames[this.game._currentLevel - 1];
        }
    
        this._offset -= 3;
        this.errors = this.errors.concat([command, errorText, ""]);
        this.clear();
        this.drawAll(map);
    };

}