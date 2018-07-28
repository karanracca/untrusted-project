import * as util from './util';
import Player from './player';

export default class Map {

    constructor(display, game) {
        /* private variables */
        this.game = game;
        this.display = display;
        this.player;
        this.objectDefinitions;
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
    }

    get width() { return this.game.dimensions.width; };
    get height() { return this.game.dimensions.height; };

    getObjectDefinition(objName) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._getObjectDefinition()'; }
        return this.objectDefinitions[objName];
    };

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

        //TODO
        // preload stylesheet for DOM level
        // $.get('styles/dom.css', function (css) {
        //     __domCSS = css;
        // });

        this.finalLevel = false;
        this._callbackValidationFailed = false;
    };

    /* wrapper */

    //     function wrapExposedMethod(f, map) {
    //         return function () {
    //             var args = arguments;
    //             return __game._callUnexposedMethod(function () {
    //                 return f.apply(map, args);
    //             });
    //         };
    //     };

    //     /* unexposed getters */

    //     
    //     this._getGrid = function () {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._getGrid()';}
    //         return __grid;
    //     };
    //     this._getLines = function() {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._getLines()';}
    //         return __lines;
    //     };

    //     /* exposed getters */

    //     this.getDynamicObjects = function () { return __dynamicObjects; };
    //     this.getPlayer = function () { return __player; };
    //     

    //     /* unexposed methods */

    ready() {

        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._ready()'; }

        // // set refresh rate if one is specified
        // if (__refreshRate) {
        //     map.startTimer(function () {
        //         // refresh the map
        //         map.refresh();

        //         // rewrite status
        //         if (map._status) {
        //             map.writeStatus(map._status);
        //         }

        //         // check for nonstandard victory condition
        //         if (typeof(__game.objective) === 'function' && __game.objective(map)) {
        //             __game._moveToNextLevel();
        //         }
        //     }, __refreshRate);
        // }
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
                    return this._validateCallback(function () {
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

    //     // Returns the object of the given type closest to target coordinates
    //     this._findNearestToPoint = function (type, targetX, targetY) {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._findNearestToPoint()';}

    //         var foundObjects = [];

    //         // look for static objects
    //         for (var x = 0; x < this.getWidth(); x++) {
    //             for (var y = 0; y < this.getHeight(); y++) {
    //                 if (__grid[x][y].type === type) {
    //                     foundObjects.push({x: x, y: y});
    //                 }
    //             }
    //         }

    //         // look for dynamic objects
    //         for (var i = 0; i < this.getDynamicObjects().length; i++) {
    //             var object = this.getDynamicObjects()[i];
    //             if (object.getType() === type) {
    //                 foundObjects.push({x: object.getX(), y: object.getY()});
    //             }
    //         }

    //         // look for player
    //         if (type === 'player') {
    //             foundObjects.push({x: __player.getX(), y: __player.getY()});
    //         }

    //         var dists = [];
    //         for (var i = 0; i < foundObjects.length; i++) {
    //             var obj = foundObjects[i];
    //             dists[i] = Math.sqrt(Math.pow(targetX - obj.x, 2) + Math.pow(targetY - obj.y, 2));

    //             // We want to find objects distinct from ourselves
    //             if (dists[i] === 0) {
    //                 dists[i] = 999;
    //             }
    //         }

    //         var minDist = Math.min.apply(Math, dists);
    //         var closestTarget = foundObjects[dists.indexOf(minDist)];

    //         return closestTarget;
    //     };

    //     this._isPointOccupiedByDynamicObject = function (x, y) {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._isPointOccupiedByDynamicObject()';}

    //         var x = Math.floor(x); var y = Math.floor(y);

    //         for (var i = 0; i < this.getDynamicObjects().length; i++) {
    //             var object = this.getDynamicObjects()[i];
    //             if (object.getX() === x && object.getY() === y) {
    //                 return true;
    //             }
    //         }
    //         return false;
    //     };

    //     this._findDynamicObjectAtPoint = function (x, y) {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._findDynamicObjectAtPoint()';}

    //         var x = Math.floor(x); var y = Math.floor(y);

    //         for (var i = 0; i < this.getDynamicObjects().length; i++) {
    //             var object = this.getDynamicObjects()[i];
    //             if (object.getX() === x && object.getY() === y) {
    //                 return object;
    //             }
    //         }
    //         return false;
    //     };

    _moveAllDynamicObjects() {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._moveAllDynamicObjects()'; }

        // the way things work right now, teleporters must take precedence
        // over all other objects -- otherwise, pointers.jsx will not work
        // correctly.
        // TODO: make this not be the case

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

    _removeItemFromMap (x, y, klass) {
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

        // start fading out chapter immediately
        // unless it's a death message, in which case wait 2.5 sec
        // clearInterval(this.chapterHideTimeout);
        // this.chapterHideTimeout = setTimeout(function () {
        //     $('#chapter').fadeOut(1000);
        // }, $('#chapter').hasClass('death') ? 2500 : 0);

        // also, clear any status text if map is refreshing automatically (e.g. boss level)
        this._status = '';
    };

    //     this._refreshDynamicObjects = function() {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._refreshDynamicObjects()';}

    //         __dynamicObjects = __dynamicObjects.filter(function (obj) { return !obj.isDestroyed(); });
    //     };

    //     this._countTimers = function() {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._countTimers()';}

    //         return __intervals.length;
    //     }

    //     /* (unexposed) wrappers for game methods */

    _startOfStartLevelReached() {
        this.game._startOfStartLevelReached = true;
    };

    _endOfStartLevelReached() {
        this.game._endOfStartLevelReached = true;
    };

    //     this._playSound = function (sound) {
    //         if (__game._isPlayerCodeRunning()) { throw 'Forbidden method call: map._playSound()';}

    //         __game.sound.playSound(sound);
    //     };

    _validateCallback(callback) {
        if (this.game.isPlayerCodeRunning) { throw 'Forbidden method call: map._validateCallback()'; }
        return this.game.validateCallback(callback);
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

    //     this.countObjects = wrapExposedMethod(function (type) {
    //         var count = 0;

    //         // count static objects
    //         for (var x = 0; x < this.getWidth(); x++) {
    //             for (var y = 0; y < this.getHeight(); y++) {
    //                 if (__grid[x][y].type === type) {
    //                     count++;
    //                 }
    //             }
    //         }

    //         // count dynamic objects
    //         this.getDynamicObjects().forEach(function (obj) {
    //             if (obj.getType() === type) {
    //                 count++;
    //             }
    //         })

    //         return count;
    //     }, this);

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

    //     this.createFromGrid = wrapExposedMethod(function (grid, tiles, xOffset, yOffset) {
    //         for (var y = 0; y < grid.length; y++) {
    //             var line = grid[y];
    //             for (var x = 0; x < line.length; x++) {
    //                 var tile = line[x];
    //                 var type = tiles[tile];
    //                 if (type === 'player') {
    //                     this.placePlayer(x + xOffset, y + yOffset);
    //                 } else if (type) {
    //                     this.placeObject(x + xOffset, y + yOffset, type);
    //                 }
    //             }
    //         }
    //     }, this);

    //     this.setSquareColor = wrapExposedMethod(function (x, y, bgColor) {
    //         var x = Math.floor(x); var y = Math.floor(y);

    //         __grid[x][y].bgColor = bgColor;
    //     }, this);

    //     this.defineObject = wrapExposedMethod(function (name, properties) {
    //         if (__objectDefinitions[name]) {
    //             throw "There is already a type of object named " + name + "!";
    //         }

    //         if (properties.interval && properties.interval < 100) {
    //             throw "defineObject(): minimum interval is 100 milliseconds";
    //         }

    //         __objectDefinitions[name] = properties;
    //     }, this);

    //     this.getObjectTypeAt = wrapExposedMethod(function (x, y) {
    //         var x = Math.floor(x); var y = Math.floor(y);

    //         // Bazek: We should always check, if the coordinates are inside of map!
    //         if (x >= 0 && x < this.getWidth() && y >= 0 && y < this.getHeight())
    //             return __grid[x][y].type;
    //         else
    //             return '';
    //     }, this);

    //     this.getAdjacentEmptyCells = wrapExposedMethod(function (x, y) {
    //         var x = Math.floor(x); var y = Math.floor(y);

    //         var map = this;
    //         var actions = ['right', 'down', 'left', 'up'];
    //         var adjacentEmptyCells = [];
    //         $.each(actions, function (i, action) {
    //             switch (actions[i]) {
    //                 case 'right':
    //                     var child = [x+1, y];
    //                     break;
    //                 case 'left':
    //                     var child = [x-1, y];
    //                     break;
    //                 case 'down':
    //                     var child = [x, y+1];
    //                     break;
    //                 case 'up':
    //                     var child = [x, y-1];
    //                     break;
    //             }
    //             // Bazek: We need to check, if child is inside of map!
    //             var childInsideMap = child[0] >= 0 && child[0] < map.getWidth() && child[1] >= 0 && child[1] < map.getHeight();
    //             if (childInsideMap && map.getObjectTypeAt(child[0], child[1]) === 'empty') {
    //                 adjacentEmptyCells.push([child, action]);
    //             }
    //         });
    //         return adjacentEmptyCells;
    //     }, this);

    //     this.startTimer = wrapExposedMethod(function(timer, delay) {
    //         if (!delay) {
    //             throw "startTimer(): delay not specified"
    //         } else if (delay < 25) {
    //             throw "startTimer(): minimum delay is 25 milliseconds";
    //         }

    //         __intervals.push(setInterval(timer, delay));
    //     }, this);

    //     this.timeout = wrapExposedMethod(function(timer, delay) {
    //         if (!delay) {
    //             throw "timeout(): delay not specified"
    //         } else if (delay < 25) {
    //             throw "timeout(): minimum delay is 25 milliseconds";
    //         }

    //         __intervals.push(setTimeout(timer, delay));
    //     }, this);

    //     // this.displayChapter = wrapExposedMethod(function(chapterName, cssClass) {
    //     //     if (__game._displayedChapters.indexOf(chapterName) === -1) {
    //     //         $('#chapter').html(chapterName.replace("\n","<br>"));
    //     //         $('#chapter').removeClass().show();

    //     //         if (cssClass) {
    //     //             $('#chapter').addClass(cssClass);
    //     //         } else {
    //     //             __game._displayedChapters.push(chapterName);
    //     //         }

    //     //         setTimeout(function () {
    //     //             $('#chapter').fadeOut();
    //     //         }, 5 * 1000);
    //     //     }
    //     // }, this);

    displayChapter() {
        return true;
    }

    //     this.writeStatus = wrapExposedMethod(function(status) {
    //         this._status = status;

    //         if (__refreshRate) {
    //             // write the status immediately
    //             display.writeStatus(status);
    //         } else {
    //             // wait 100 ms for redraw reasons
    //             setTimeout(function () {
    //                 display.writeStatus(status);
    //             }, 100);
    //         }
    //     }, this);

    //     // used by validators
    //     // returns true iff called at the start of the level (that is, on DummyMap)
    //     // returns false iff called by validateCallback (that is, on the actual map)
    //     this.isStartOfLevel = wrapExposedMethod(function () {
    //         return this._dummy;
    //     }, this);

    //     /* canvas-related stuff */

    //     this.getCanvasContext = wrapExposedMethod(function() {
    //         return $('#drawingCanvas')[0].getContext('2d');
    //     }, this);

    // getCanvasCoords(obj) {
    //     var canvas = $('#drawingCanvas')[0];
    //     return {
    //         x: (obj.getX() + 0.5) * canvas.width / __game._dimensions.width,
    //         y: (obj.getY() + 0.5) * canvas.height / __game._dimensions.height
    //     };
    // }

    //     this.getRandomColor = wrapExposedMethod(function(start, end) {
    //         var mean = [
    //             Math.floor((start[0] + end[0]) / 2),
    //             Math.floor((start[1] + end[1]) / 2),
    //             Math.floor((start[2] + end[2]) / 2)
    //         ];
    //         var std = [
    //             Math.floor((end[0] - start[0]) / 2),
    //             Math.floor((end[1] - start[1]) / 2),
    //             Math.floor((end[2] - start[2]) / 2)
    //         ];
    //         return ROT.Color.toHex(ROT.Color.randomize(mean, std));
    //     }, this);

    //     this.createLine = wrapExposedMethod(function(start, end, callback) {
    //         __lines.push({'start': start, 'end': end, 'callback': callback});
    //     }, this);

    // testLineCollisions(player) {
    //     let threshold = 7;
    //     // let playerCoords = this.getCanvasCoords(player);
    //     // __lines.forEach(function (line) {
    //     //     if (pDistance(playerCoords.x, playerCoords.y,
    //     //         line.start[0], line.start[1],
    //     //         line.end[0], line.end[1]) < threshold) {
    //     //         line.callback(__player);
    //     //     }
    //     // })
    // }

    //     /* for DOM manipulation level */

    //     this.getDOM = wrapExposedMethod(function () {
    //         return __dom;
    //     })

    //     this.createFromDOM = wrapExposedMethod(function(dom) {
    //         __dom = dom;
    //     }, this);

    //     this.updateDOM = wrapExposedMethod(function(dom) {
    //         __dom = dom;
    //     }, this);

    //     this.overrideKey = wrapExposedMethod(function(keyName, callback) {
    //         this._overrideKeys[keyName] = callback;
    //     }, this);

    //     /* validators */

    //     this.validateAtLeastXObjects = wrapExposedMethod(function(num, type) {
    //         var count = this.countObjects(type);
    //         if (count < num) {
    //             throw 'Not enough ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
    //         }
    //     }, this);

    //     this.validateAtMostXObjects = wrapExposedMethod(function(num, type) {
    //         var count = this.countObjects(type);
    //         if (count > num) {
    //             throw 'Too many ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
    //         }
    //     }, this);

    //     this.validateExactlyXManyObjects = wrapExposedMethod(function(num, type) {
    //         var count = this.countObjects(type);
    //         if (count != num) {
    //             throw 'Wrong number of ' + type + 's on the map! Expected: ' + num + ', found: ' + count;
    //         }
    //     }, this);

    //     this.validateAtMostXDynamicObjects = wrapExposedMethod(function(num) {
    //         var count = this.getDynamicObjects().length;
    //         if (count > num) {
    //             throw 'Too many dynamic objects on the map! Expected: ' + num + ', found: ' + count;
    //         }
    //     }, this);

    //     this.validateNoTimers = wrapExposedMethod(function() {
    //         var count = this._countTimers();
    //         if (count > 0) {
    //             throw 'Too many timers set on the map! Expected: 0, found: ' + count;
    //         }
    //     }, this);

    //     this.validateAtLeastXLines = wrapExposedMethod(function(num) {
    //         var count = this._getLines().length;
    //         if (count < num) {
    //             throw 'Not enough lines on the map! Expected: ' + num + ', found: ' + count;
    //         }
    //     }, this);

    //     /* initialization */

    //     this._reset();
}