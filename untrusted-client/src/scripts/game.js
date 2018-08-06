import Player from './player';
import GameMap from './map';
import * as util from './util';
import * as config from './config';
import CodeEditor from './codeEditor';
import RotDisplay from './rotDisplay';
import ValidateCode from './validate';

export default class Game {

    constructor(startLevel, domElement, app) {
        this.app = app;
        this.startLevel = startLevel;
        this.display = null;
        this.domElement = domElement;
        this.inventory = [];
        this._currentCode = '';
        this._commands = [];
        this._playerCodeRunning = false;
        this.dimensions = {
            width: 50,
            height: 25
        };
        this.timer;
        this.remainingTime;
        this.editor = null;
        this.map = null;
        this._mod = '';
        this._resetTimeout = null;
        this._currentLevel = 0;
        this._currentFile = null;
        this._currentBonusLevel = null;
        this._levelReached = 1;
        this._displayedChapters = [];
        this._globalVars = [];
    }

    get helpCommands() { return this._commands; };
    get isPlayerCodeRunning() { return this._playerCodeRunning; };
    set _setPlayerCodeRunning(pcr) { this._playerCodeRunning = pcr };

    initialize() {
        this._levelReached = JSON.parse(localStorage.getItem('currentPlayer')).level.levelNo;

        this.display = new RotDisplay({
            width: this.dimensions.width,
            height: this.dimensions.height,
            fontSize: 20
        }, this);

        // Initialize editor, map, and objects
        this.editor = new CodeEditor("editor", 600, 500, this);
        this.map = new GameMap(this.display, this);

        // Initialize validator
        this.saveReferenceImplementations(); // prevents tampering with methods
        // keep track of current global variables
        for (let p in window) {
            if (window.propertyIsEnumerable(p)) {
                this._globalVars.push(p);
            }
        }

        //Load help commands from local storage (if possible)
        if (localStorage.getItem('helpCommands')) {
            this._commands = localStorage.getItem('helpCommands').split(';');
        }

        // Lights, camera, action
        if (this.startLevel > 1) {
            this._currentLevel = this.startLevel - 1;
            this.getLevel(this.startLevel);
        } else {
            this.getLevel(this.startLevel);
        }

        //Set up event handler
        document.getElementById(this.domElement).addEventListener('keydown', (e) => {
            e.preventDefault();
            // directions for moving entities
            if (config.keys[e.keyCode] && this.map.player) {
                this.map.player.move(config.keys[e.keyCode], true);
            }
        });
    };

    start(lvl) {
        this.getLevel(lvl? lvl :this.startLevel);
    }

    // makes an ajax request to get the level text file and then loads it into the game
    getLevel(levelNum, isResetting, movingToNextLevel) {

        let game = this;
        let editor = this.editor;

        if (levelNum > config.levelFileNames.length) return;

        this._levelReached = Math.max(levelNum, this._levelReached);

        let fileName =  JSON.parse(localStorage.getItem('currentPlayer')).level.name;
        //let lvlCode = config.levels['levels/' + fileName];
        let lvlCode =JSON.parse(localStorage.getItem('currentPlayer')).level.layout;

        game._currentLevel = levelNum;
        game._currentBonusLevel = null;
        game._currentFile = null;

        //load level code in editor
        game.editor.loadCode(lvlCode);

        // start the level and fade in
        game.evalLevelCode(null, null, true);

        // store the commands introduced in this level (for api reference)
        this._commands = util.unique(this._commands.concat(editor.getProperties().commandsIntroduced));
        localStorage.setItem('helpCommands', this._commands.join(';'));
    };

    validateCallback(callback, throwExceptions, ignoreForbiddenCalls) {
        try {
            let result;
            // run the callback and check for forbidden method calls
            try {
                if (!ignoreForbiddenCalls) {
                    this._setPlayerCodeRunning = true;
                }
                result = callback();
                this._setPlayerCodeRunning = false;
            } catch (e) {
                // cleanup
                this._setPlayerCodeRunning = false;

                if (e.toString().indexOf("Forbidden method call") > -1) {
                    // display error, disable player movement
                    this.display.appendError(e.toString(), "%c{red}Please reload the level.");
                    //this.sound.playSound('static');
                    this.map.player._canMove = false;
                    this.map._callbackValidationFailed = true;

                    // throw e; // for debugging
                    return;
                } else {
                    // other exceptions are fine here - just pass them up
                    throw e;
                }
            }

            // check if validator still passes
            try {
                if (typeof (this.validateLevel) === 'function') {
                    this.validateLevel(this.map);
                }
            } catch (e) {
                // validation failed - not much to do here but restart the level, unfortunately
                this.display.appendError(e.toString(), "%c{red}Validation failed! Please reload the level.");

                // play error sound
                //this.sound.playSound('static');

                // disable player movement
                this.map.player._canMove = false;
                this.map._callbackValidationFailed = true;
                return;
            }

            // on maps with many objects (e.g. boss fight),
            // we can't afford to do these steps
            if (!this.map._properties.quickValidateCallback) {
                this.clearModifiedGlobals();

                // has the player tampered with any functions?
                try {
                    this.detectTampering(this.map, this.map.player);
                } catch (e) {
                    this.display.appendError(e.toString(), "%c{red}Validation failed! Please reload the level.");
                    
                    // disable player movement
                    this.map.player._canMove = false;
                    this.map._callbackValidationFailed = true;
                    return;
                }
                // refresh the map, just in case
                this.map.refresh();
                return result;
            }
        } catch (e) {
            //this.display.writeStatus(e.toString());
            console.log(e);
            // throw e; // for debugging
            if (throwExceptions) {
                this.display.writeStatus(e.toString());
                throw e;
            }
        }
    };

    saveReferenceImplementations () {
        for (let f in config.referenceImplementations.map) {
            if (config.referenceImplementations.map.hasOwnProperty(f)) {
                config.referenceImplementations.map[f] = this.map[f];
            }
        }
    
        let dummyPlayer = new Player(0, 0, this.map, this);
        for (let f in config.referenceImplementations.player) {
            if (config.referenceImplementations.player.hasOwnProperty(f)) {
                config.referenceImplementations.player[f] = dummyPlayer[f];
            }
        }
    };

    detectTampering (map, player) {

        for (let f in config.referenceImplementations.map) {
            if (config.referenceImplementations.map.hasOwnProperty(f) && map[f]) {
                if (config.referenceImplementations.map[f].toString() != map[f].toString()) {
                    throw (f + '() has been tampered with!');
                }
            }
        }

        if (player) {
            for ( let f in config.referenceImplementations.player) {
                if (config.referenceImplementations.player.hasOwnProperty(f) && player[f]) {
                    if (config.referenceImplementations.player[f].toString() != player[f].toString()) {
                        throw (f + '() has been tampered with!');
                    }
                }
            }
        }
    };

    evalLevelCode(allCode, playerCode, isNewLevel, restartingLevelFromScript) {

        let game = this;

        try {
        // by default, get code from the editor
        let loadedFromEditor = false;
        if (!allCode) {
            allCode = game.editor.getCode();
            playerCode = game.editor.getPlayerCode();
            loadedFromEditor = true;
        }

        // if we're editing a script file, do something completely different
        if (game._currentFile !== null && !restartingLevelFromScript) {
            game.validateAndRunScript(allCode);
            return;
        }

        // validate the code if it passes validation, returns the startLevel function else returns false
        let validatedStartLevel = ValidateCode(allCode, playerCode, restartingLevelFromScript, this);

        if (validatedStartLevel) { // code is valid
            // reset the map
            this.map.reset(); // for cleanup
            this.map = new GameMap(this.display, this);
            this.map.reset();
            this.map.setProperties(this.editor.getProperties()['mapProperties']);

            // save editor state
            this._currentCode = allCode;
            if (loadedFromEditor && !restartingLevelFromScript) {
                this.editor.saveGoodState();
            }

            // set correct inventory state
            this.setInventoryStateByLevel(this._currentLevel);

            // start the level
            validatedStartLevel(this.map);

            //deal with sneaky players
            this.clearModifiedGlobals();

            // draw the map
            this.display.fadeIn(this.map, isNewLevel ? 100 : 10, () => {

                //this.map.refresh(); // refresh inventory display

                if (this.editor.getProperties().startingMessage) {
                    this.display.writeStatus(game.editor.getProperties().startingMessage);
                }
            });

            this.map.ready();

            //finally, allow player movement
            if (this.map.player) {
                this.map.player._canMove = true;
            }
        } else { // code is invalid
            // disable player movement
            this.map.player._canMove = false;
        }
    } catch (e) {
        console.log(e);
        // cleanup
        this._setPlayerCodeRunning = false;

        // disable player movement
        this.map.player._canMove = false;
        
        let exceptionText = e.toString();
        if (e instanceof SyntaxError) {
           var lineNum = this.findSyntaxError(allCode, e.message);
            if (lineNum) {
                exceptionText = "[Line " + lineNum + "] " + exceptionText;
            }
        }
        this.display.appendError(exceptionText);
    }
    };

    findSyntaxError (code, errorMsg) {
        let lines = code.split('\n');
        for (let i = 1; i <= lines.length; i++) {
            let testCode = lines.slice(0, i).join('\n');
    
            try {
                window.eval(testCode);
            } catch (e) {
                if (e.message === errorMsg) {
                    return i;
                }
            }
        }
        return null;
    };

    addToInventory(itemName) {
        if (this.inventory.indexOf(itemName) === -1) {
            let object = this.map.getObjectDefinition(itemName);
            this.inventory.push(object);
            if (itemName === 'phone') this.app.showPhone();
            this.app.drawInventory();
        }
    };

    setInventoryStateByLevel (levelNum) {
        // first remove items that have onDrop effects on UI
        if (levelNum == 1) {
            this.removeFromInventory('computer');
        }
        if (levelNum <= 7) {
            this.removeFromInventory('phone');
        }

        // clear any remaining items from inventory
        this.inventory = [];

        // repopulate inventory by level
        if (levelNum > 1) {
            this.addToInventory('computer');
            this.editor.refresh();
        }
        if (levelNum > 7) {
            this.addToInventory('phone');
        }
        if (levelNum > 11) {
            this.addToInventory('redKey');
        }
        if (levelNum > 12) {
            this.addToInventory('greenKey');
        }
        if (levelNum > 13) {
            this.addToInventory('blueKey');
        }
        if (levelNum > 14) {
            this.addToInventory('theAlgorithm');
            this.removeFromInventory('redKey');
            this.removeFromInventory('greenKey');
            this.removeFromInventory('blueKey');
        }
        if (levelNum > 15) {
            this.removeFromInventory('theAlgorithm');
        }
        if (levelNum > 20) {
            this.addToInventory('theAlgorithm');
        }

        // clear any status messages generated by this
        //this.map._status = '';
    };

    removeFromInventory (itemName) {
        let object = this.map.getObjectDefinition(itemName);
        if (!object) throw 'No such object: ' + itemName;
        
        if (object.type != 'item') throw 'Object is not an item: ' + itemName;
        
        let index = this.inventory.indexOf(itemName);
        if (index > 0) this.inventory.splice(index, 1);
        this.app.drawInventory();
        //TODO
        // if (object.onDrop) {
        //     object.onDrop(this);
        // }
    };

    _moveToNextLevel() {
        // is the player permitted to exit?
        if (typeof this.onExit === 'function' && !this.onExit(this.map)) {
            this.sound.playSound('blip');
            return;
        }

        //this.sound.playSound('complete');

        //we disable moving so the player can't move during the fadeout
        this.map.player._canMove = false;

        if (this._currentLevel == 'bonus') {
            console.log("In bonus level")
        } else {
            //this.getLevel(this._currentLevel + 1, false, true);
            this.app.levelComplete(this._currentLevel);
        }
    };

    _restartLevel () {
        this.getLevel(this._currentLevel, true);
    };


    resetLevel(level) {
        let game = this;
        let resetTimeout_msec = 2500;

        if (this._resetTimeout != null) {
            //$('body, #buttons').css('background-color', '#000');
            window.clearTimeout(this._resetTimeout);
            this._resetTimeout = null;

            if (game._currentBonusLevel) {
                game._getLevelByPath('levels/' + game._currentBonusLevel);
            } else {
                this.getLevel(level, true);
            }
        } else {
            this.display.writeStatus("To reset this level press ^4 again.");
            //$('body, #buttons').css('background-color', '#900');

            this._resetTimeout = setTimeout(function () {
                game._resetTimeout = null;

                //$('body, #buttons').css('background-color', '#000');
            }, resetTimeout_msec);
        }
    };

    callUnexposedMethod(f) {
        if (this._playerCodeRunning) {
            this._playerCodeRunning = false;
            let res = f();
            this._playerCodeRunning = true;
            return res;
        } else {
            return f();
        }
    };

    clearModifiedGlobals () {
        for (let p in window) {
            if (window.propertyIsEnumerable(p) && this._globalVars.indexOf(p) == -1) {
                window[p] = null;
            }
        }
    };

    displayChapter(chapterName, cssClass) {
        this.app.displayChapter(chapterName, cssClass);
    }

    usePhone () {
        let player = this.map.player;       
        if (player && player._canMove && player.hasItem(this.map.getObjectDefinition('phone'))) {
            if (player._phoneFunc) {
                this.validateCallback(player._phoneFunc);
            } else {
                this.display.writeStatus("Your function phone isn't bound to any function!");
            }
        }
    };

    checkInventory (itemName) {
        return this.inventory.indexOf(itemName) > -1;
    };

    getItemDefinition (itemName) {
        let map = this.map;
        return this.callUnexposedMethod(function () {
            return map.getObjectDefinition(itemName);
        });
    };


}