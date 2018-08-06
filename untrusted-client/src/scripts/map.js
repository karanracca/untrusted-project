import * as util from './util';
import Player from './player';
import DynamicObject from './dynamicObject';

export default class Map {

    constructor(display, game) {
        /* private variables */
        this.game = game;
        this.app = game.app;
        this.display = display;
        this.player;
        this.objectDefinitions = util.getListOfObjects(this.game);
        this.domCSS = '';
        this.chapterHideTimeout;

        /* unexposed variables */
        this._properties = {};
        this._allowOverwrite;
        this._keyDelay = 0;
        this._refreshRate = null;
        this._grid;
        this._dynamicObjects = [];
        this._intervals = [];
        this._lines;
        this._dom;
        this._finalLevel = false;
        this._callbackValidationFailed = false;
        this.dummy = false; // overridden by dummyMap in validate.js
        this.status = '';
        this._overrideKeys = {};

        /* initialization */
        this.reset();
    }

    get width() { return this.game.dimensions.width; };
    get height() { return this.game.dimensions.height; };

    getObjectDefinition(objName) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map.getObjectDefinition()'; }
        return this.objectDefinitions[objName];
    }

    getObjectDefinitions() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._getObjectDefinitions()'; }
        return this.objectDefinitions;
    };

    setProperties(mapProperties) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._setProperties()'; }

        // set defaults
        this._allowOverwrite = false;
        this._keyDelay = 0;
        this._refreshRate = null;

        // now set any properties that were passed in
        if (mapProperties) {
            this._properties = mapProperties;

            if (mapProperties.allowOverwrite === true) this._allowOverwrite = true;

            if (mapProperties.keyDelay) this._keyDelay = mapProperties.keyDelay;

            if (mapProperties.refreshRate) this._refreshRate = mapProperties.refreshRate;
        }
    };

    displayChapter(chapterName, cssClass) {
        this.game.displayChapter(chapterName, cssClass);
    }

    writeStatus(status) {
        setTimeout(function (that) {
            that.display.writeStatus(status);
        }, 100, this);
    };

    reset() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._reset()'; }

        this.objectDefinitions = util.getListOfObjects(this.game);

        this.display.clear();

        this._grid = new Array(this.game.dimensions.width);
        for (let x = 0; x < this.game.dimensions.width; x++) {
            this._grid[x] = new Array(this.game.dimensions.height);
            for (let y = 0; y < this.game.dimensions.height; y++) {
                this._grid[x][y] = { type: 'empty' };
            }
        }

        this._dynamicObjects.forEach((obj) => obj._destroy(true));
        this._dynamicObjects = [];

        this.player = null;

        for (let i = 0; i < this._intervals.length; i++) {
            clearInterval(this._intervals.length[i]);
        }
        this._intervals = [];

        this._lines = [];
        this._dom = '';
        this._overrideKeys = {};

        this.finalLevel = false;
        this._callbackValidationFailed = false;
    };

    /* wrapper */
    wrapExposedMethod(f, map) {
        return function () {
            var args = arguments;
            return this.game.callUnexposedMethod(function () {
                return f.apply(map, args);
            });
        };
    };

    ready() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._ready()'; }
    };

    _canMoveTo(x, y, myType) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._canMoveTo()'; }

        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || x >= this.game.dimensions.width || y < 0 || y >= this.game.dimensions.height) {
            return false;
        }

        // look for static objects that can serve as obstacles
        let objType = this._grid[x][y].type;
        let object = this.objectDefinitions[objType];
        if (object.impassable) {
            if (myType && object.passableFor && object.passableFor.indexOf(myType) > -1) {
                // this object is of a type that can pass the obstacle
                return true;
            } else if (typeof object.impassable === 'function') {
                // the obstacle is impassable only in certain circumstances
                try {
                    return this._validateCallback(() => {
                        return !object.impassable(this.player, object);
                    });
                } catch (e) {
                    this.display.writeStatus(e.toString());
                }
            } else {
                // the obstacle is always impassable
                return false;
            }
        } else if (myType && object.impassableFor && object.impassableFor.indexOf(myType) > -1) {
            // this object is of a type that cannot pass the obstacle
            return false;
        } else {
            // no obstacle
            return true;
        }
    };

    // Returns the object of the given type closest to target coordinates
    _findNearestToPoint(type, targetX, targetY) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._findNearestToPoint()'; }

        let foundObjects = [];

        // look for static objects
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this._grid[x][y].type === type) {
                    foundObjects.push({ x: x, y: y });
                }
            }
        }

        // look for dynamic objects
        for (let i = 0; i < this._dynamicObjects.length; i++) {
            let object = this._dynamicObjects[i];
            if (object.getType() === type) {
                foundObjects.push({ x: object.getX(), y: object.getY() });
            }
        }

        // look for player
        if (type === 'player') {
            foundObjects.push({ x: this.player.getX(), y: this.player.getY() });
        }

        var dists = [];
        for (var i = 0; i < foundObjects.length; i++) {
            var obj = foundObjects[i];
            dists[i] = Math.sqrt(Math.pow(targetX - obj.x, 2) + Math.pow(targetY - obj.y, 2));

            // We want to find objects distinct from ourselves
            if (dists[i] === 0) {
                dists[i] = 999;
            }
        }

        let minDist = Math.min.apply(Math, dists);
        let closestTarget = foundObjects[dists.indexOf(minDist)];

        return closestTarget;
    };

    _isPointOccupiedByDynamicObject(x, y) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._isPointOccupiedByDynamicObject()'; }

        x = Math.floor(x);
        y = Math.floor(y);

        for (let i = 0; i < this._dynamicObjects.length; i++) {
            var object = this._dynamicObjects[i];
            if (object.getX() === x && object.getY() === y) {
                return true;
            }
        }
        return false;
    };

    _moveAllDynamicObjects() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._moveAllDynamicObjects()'; }

        // "move" teleporters
        this._dynamicObjects.filter(function (object) {
            return (object.getType() === 'teleporter');
        }).forEach(function (object) {
            object._onTurn();
        });

        // move everything else
        this._dynamicObjects.filter(function (object) {
            return (object.getType() !== 'teleporter');
        }).forEach(function (object) {
            object._onTurn();
        });

        // refresh only at the end
        this.refresh();
    };

    _removeItemFromMap(x, y, klass) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._removeItemFromMap()'; }

        x = Math.floor(x);
        y = Math.floor(y);

        if (this._grid[x][y].type === klass) {
            this._grid[x][y].type = 'empty';
        }
    };

    _reenableMovementForPlayer(player) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._reenableMovementForPlayer()'; }

        if (!this._callbackValidationFailed) {
            setTimeout(function () {
                player._canMove = true;
            }, this._keyDelay);
        }
    };

    _hideChapter() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._hideChapter()'; }
        // also, clear any status text if map is refreshing automatically (e.g. boss level)
        this._status = '';
    };

    _refreshDynamicObjects() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._refreshDynamicObjects()'; }

        this._dynamicObjects = this._dynamicObjects.filter(function (obj) { return !obj.isDestroyed(); });
    };

    _startOfStartLevelReached() {
        this.game._startOfStartLevelReached = true;
    };

    _endOfStartLevelReached() {
        this.game._endOfStartLevelReached = true;
    };

    _validateCallback(callback) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._validateCallback()'; }
        return this.game.validateCallback(callback, false, true);
    };

    //exposed methods
    refresh() {
        if (this._dom) {
            this.display.clear();
            let domHTML = this._dom[0].outerHTML
                .replace(/"/g, "'")
                .replace(/<hr([^>]*)>/g, '<hr $1 />')
                .replace(/<img([^>]*)>/g, '<img $1 />');

            this.display.renderDom(domHTML, this._domCSS);
        } else {
            this.display.drawAll(this);
        }
        //__game.drawInventory();
    };

    countObjects(type) {
        let count = 0;
        // count static objects
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this._grid[x][y].type === type) {
                    count++;
                }
            }
        }
        // count dynamic objects
        this._dynamicObjects.forEach(function (obj) {
            if (obj.getType() === type) {
                count++;
            }
        })
        return count;
    };

    placeObject(x, y, type) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (!this.objectDefinitions[type]) throw "There is no type of object named " + type + "!";

        if (this.player && x == this.player.getX() && y == this.player.getY()) throw "Can't place object on top of player!";

        if (typeof (this._grid[x]) === 'undefined' || typeof (this._grid[x][y]) === 'undefined') {
            return;
            // throw "Not a valid location to place an object!";
        }

        if (this.objectDefinitions[type].type === 'dynamic') {
            // dynamic object
            this._dynamicObjects.push(new DynamicObject(this, type, x, y, this.game));
        } else {
            // static object
            if (this._grid[x][y].type === 'empty' || this._grid[x][y].type === type || this._allowOverwrite) {
                this._grid[x][y].type = type;
            } else {
                throw "There is already an object at (" + x + ", " + y + ")!";
            }
        }
    };

    placePlayer(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        if (this.player) throw "Can't place player twice!";
        this.player = new Player(x, y, this, this.game);
        this.display.drawAll(this);
    }

    createFromGrid(grid, tiles, xOffset, yOffset) {
        for (let y = 0; y < grid.length; y++) {
            let line = grid[y];
            for (let x = 0; x < line.length; x++) {
                let tile = line[x];
                let type = tiles[tile];
                if (type === 'player') {
                    this.placePlayer(x + xOffset, y + yOffset);
                } else if (type) {
                    this.placeObject(x + xOffset, y + yOffset, type);
                }
            }
        }
    };

    setSquareColor(x, y, bgColor) {
        x = Math.floor(x);
        y = Math.floor(y);
        this._grid[x][y].bgColor = bgColor;
    };

    defineObject(name, properties) {
        if (this.objectDefinitions[name]) {
            throw "There is already a type of object named " + name + "!";
        }

        if (this._properties.interval && this._properties.interval < 100) {
            throw "defineObject(): minimum interval is 100 milliseconds";
        }

        this.objectDefinitions[name] = properties;
    };

    getObjectTypeAt(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);

        // Bazek: We should always check, if the coordinates are inside of map!
        if (x >= 0 && x < this.width && y >= 0 && y < this.height)
            return this._grid[x][y].type;
        else
            return '';
    };

    //     /* validators */

    validateAtLeastXObjects(num, type) {
        let count = this.countObjects(type);
        if (count < num) {
            throw 'Not enough ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
        }
    };

    validateAtMostXObjects(num, type) {
        let count = this.countObjects(type);
        if (count > num) {
            throw 'Too many ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
        }
    };

    validateExactlyXManyObjects(num, type) {
        let count = this.countObjects(type);
        if (count != num) {
            throw 'Wrong number of ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
        }
    };

    validateAtMostXDynamicObjects(num) {
        let count = this.dynamicObjects.length;
        if (count > num) {
            throw 'Too many dynamic objects on the map! Expected: ' + num + ', found: ' + count;
        }
    };

    validateAtLeastXLines(num) {
        let count = this._lines.length;
        if (count < num) {
            throw 'Not enough lines on the map! Expected: ' + num + ', found: ' + count;
        }
    };
}