import Player from './player';
import ROT from './rot';
import GameMap from './map';
import * as util from './util';
import * as config from './config';
import CodeEditor from './codeEditor';
import RotDisplay from './rotDisplay';
import ValidateCode from './validate';

export default class Game {

    constructor(startLevel, domElement) {
        this.startLevel = startLevel;
        this.display = null;
        this.domElement = domElement;
        /* private properties */
        this._currentCode = '';
        this.__commands = [];
        this._playerCodeRunning = false;
        this.dimensions = {
            width: 50,
            height: 25
        };
        this.editor = null;
        this.map = null;
        this._mod = '';
        this._resetTimeout = null;
        this._currentLevel = 0;
        this._currentFile = null;
        this._currentBonusLevel = null;
        this._levelReached = 1;
        this._displayedChapters = [];
        this._eval = window.eval;// store our own copy of eval so that we can override window.eval
        //this._playerPrototype = new Player; // to allow messing with map.js and player.js later
    }

    /* unexposed getters */
    get getHelpCommands () { return __commands; };
    get isPlayerCodeRunning () { return this._playerCodeRunning; };
    //get _getLocalKey (key) { return (this._mod.length == 0 ? '' : this._mod + '.') + key; };

    /* unexposed setters */
    set _setPlayerCodeRunning (pcr) { this._playerCodeRunning = pcr };

    /* unexposed methods */
    
    initialize () {
        //TODO set from backend
        // Get last level reached from localStorage (if any)
        let levelKey = this._mod.length == 0 ? 'levelReached' : this._mod + '.levelReached';
        this._levelReached = parseInt(localStorage.getItem(levelKey)) || 1;

        // // Fix potential corruption
        // // levelReached may be "81111" instead of "8" due to bug
        // if (this._levelReached > this._levelFileNames.length) {
        //     for (var l = 1; l <= this._levelFileNames.length; l++) {
        //         if (!localStorage[this._getLocalKey("level" + l + ".lastGoodState")]) {
        //             this._levelReached = l - 1;
        //             break;
        //         }
        //     }
        // }

        // Initialize sound
        // this.sound = new Sound('local');
        // this.sound = new Sound(debugMode ? 'local' : 'cloudfront');

        this.display = new RotDisplay({
            width: this.dimensions.width,
            height: this.dimensions.height,
            fontSize: 20
        }, this);

        //var display = this.rotDisplay.__getDisplay;
        // $('#screen').append(this.display.getContainer());
        // $('#drawingCanvas, #dummyDom, #dummyDom *').click(function () {
        //     display.focus();
        // });

        // Initialize editor, map, and objects
        this.editor = new CodeEditor("editor", 600, 500, this);
        this.map = new GameMap(this.display, this);
        //this.objects = this.getListOfObjects();

        // Initialize validator
        //this.saveReferenceImplementations(); // prevents tampering with methods
        //this._globalVars = []; // keep track of current global variables
        // for (p in window) {
        //     if (window.propertyIsEnumerable(p)) {
        //         this._globalVars.push(p);
        //     }
        // }

        // Enable controls
        //this.enableShortcutKeys();
        //this.enableButtons();
        //this.setUpNotepad();

        // Load help commands from local storage (if possible)
        // if (localStorage.getItem(this._getLocalKey('helpCommands'))) {
        //     __commands = localStorage.getItem(this._getLocalKey('helpCommands')).split(';');
        // }

        // Lights, camera, action
        if (this.startLevel) {
            this._currentLevel = this.startLevel - 1;
            this._getLevel(this.startLevel);
        } else if (this._levelReached != 1) {
            // load last level reached (unless it's the credits)
            this._getLevel(Math.min(this._levelReached, 21));
        } else {
            this.display.playIntro(this.dimensions.height);
        }

        //Set up event handler
        document.getElementById(this.domElement).addEventListener('keydown', (e) => {
            // directions for moving entities

            if (this.display._intro == true) {
                this.display._intro = false ;
                this.start(); 
            } else if (config.keys[e.keyCode] && this.map.player) {
                this.map.player.move(config.keys[e.keyCode], true);
            }
            //e.preventDefault();
        });
    };

    start (lvl) {
        this.getLevel(lvl ? lvl : 1);
    };

    // makes an ajax request to get the level text file and then loads it into the game
    getLevel (levelNum, isResetting, movingToNextLevel) {
        let game = this;
        let editor = this.editor;

        if (levelNum > config.levelFileNames.length) return;

        this._levelReached = Math.max(levelNum, this._levelReached);
        
        //Store level in local storage
        localStorage.setItem('levelReached', this._levelReached);

        let fileName = config.levelFileNames[levelNum - 1];
        let lvlCode = config.levels['levels/' + fileName];

        if (movingToNextLevel) {
            // save level state and create a gist
            editor.saveGoodState();
            editor.createGist();
        }

        game._currentLevel = levelNum;
        game._currentBonusLevel = null;
        game._currentFile = null;

        //TODO load level code in editor
        game.editor.loadCode(lvlCode);

        // restored saved state for this level?
        // if (!isResetting && editor.getGoodState(levelNum)) {
        //     // unless the current level is a newer version
        //     var newVer = editor.getProperties().version;
        //     var savedVer = editor.getGoodState(levelNum).version;
        //     if (!(newVer && (!savedVer || isNewerVersion(newVer, savedVer)))) {
        //         // restore saved line/section/endOfStartLevel state if possible
        //         if (editor.getGoodState(levelNum).endOfStartLevel) {
        //             editor.setEndOfStartLevel(editor.getGoodState(levelNum).endOfStartLevel);
        //         }
        //         if (editor.getGoodState(levelNum).editableLines) {
        //             editor.setEditableLines(editor.getGoodState(levelNum).editableLines);
        //         }
        //         if (editor.getGoodState(levelNum).editableSections) {
        //             editor.setEditableSections(editor.getGoodState(levelNum).editableSections);
        //         }

        //         // restore saved code
        //         editor.setCode(editor.getGoodState(levelNum).code);
        //     }
        // }

        // start the level and fade in
        game.evalLevelCode(null, null, true);
        //game.display.focus();

        // store the commands introduced in this level (for api reference)
        //__commands = __commands.concat(editor.getProperties().commandsIntroduced).unique();
        //localStorage.setItem(this._getLocalKey('helpCommands'), __commands.join(';'));
    };

      evalLevelCode(allCode, playerCode, isNewLevel, restartingLevelFromScript) {
        
        let game = this;
        
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

        //save current display state (for scrolling up later)
        //this.display.saveGrid(this.map);

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

            // clear drawing canvas and hide it until level loads
            // var screenCanvas = $('#screen canvas')[0];
            // $('#drawingCanvas')[0].width = screenCanvas.width;
            // $('#drawingCanvas')[0].height = screenCanvas.height;
            // $('#drawingCanvas').hide();
            // $('#dummyDom').hide();

            // set correct inventory state
            //this.setInventoryStateByLevel(this._currentLevel);

            // start the level
            validatedStartLevel(this.map);

            //deal with sneaky players
            //this.clearModifiedGlobals();

            // draw the map
            this.display.fadeIn(this.map, isNewLevel ? 100 : 10, () => {
                
                //this.map.refresh(); // refresh inventory display

                // // show map overlays if necessary
                // if (game.map._properties.showDrawingCanvas) {
                //     $('#drawingCanvas').show();
                // } else if (game.map._properties.showDummyDom) {
                //     $('#dummyDom').show();
                // }

                // workaround because we can't use writeStatus() in startLevel()
                // (due to the text getting overwritten by the fade-in)
                if (this.editor.getProperties().startingMessage) {
                    this.display.writeStatus(game.editor.getProperties().startingMessage);
                }
            });

            this.map.ready();

            // start bg music for this level
            // if (this.editor.getProperties().music) {
            //     this.sound.playTrackByName(this.editor.getProperties().music);
            // }

            // // activate super menu if 21_endOfTheLine has been reached
            // if (this._levelReached >= 21) {
            //     this.activateSuperMenu();
            // }

            //finally, allow player movement
            if (this.map.player) {
                this.map.player._canMove = true;
                //game.display.focus();
            }
        } else { // code is invalid
            // play error sound
            this.sound.playSound('static');
            // disable player movement
            this.map.getPlayer()._canMove = false;
        }
    };

    // setInventoryStateByLevel (levelNum) {
    //     // first remove items that have onDrop effects on UI
    //     if (levelNum == 1) {
    //         this.removeFromInventory('computer');
    //     }
    //     if (levelNum <= 7) {
    //         this.removeFromInventory('phone');
    //     }
    
    //     // clear any remaining items from inventory
    //     this.inventory = [];
    
    //     // repopulate inventory by level
    //     if (levelNum > 1) {
    //         this.addToInventory('computer');
    //         $('#editorPane').fadeIn();
    //         this.editor.refresh();
    //     }
    //     if (levelNum > 7) {
    //         this.addToInventory('phone');
    //         $('#phoneButton').show();
    //     }
    //     if (levelNum > 11) {
    //         this.addToInventory('redKey');
    //     }
    //     if (levelNum > 12) {
    //         this.addToInventory('greenKey');
    //     }
    //     if (levelNum > 13) {
    //         this.addToInventory('blueKey');
    //     }
    //     if (levelNum > 14) {
    //         this.addToInventory('theAlgorithm');
    //         this.removeFromInventory('redKey');
    //         this.removeFromInventory('greenKey');
    //         this.removeFromInventory('blueKey');
    //     }
    //     if (levelNum > 15) {
    //         this.removeFromInventory('theAlgorithm');
    //     }
    //     if (levelNum > 20) {
    //         this.addToInventory('theAlgorithm');
    //     }
    
    //     // clear any status messages generated by this
    //     this.map._status = '';
    // };

    // removeFromInventory (itemName) {
    //     var object = this.getItemDefinition(itemName);
    //     if (!object) {
    //         throw 'No such object: ' + itemName;
    //     }
    //     if (object.type != 'item') {
    //         throw 'Object is not an item: ' + itemName;
    //     }
    
    //     this.inventory.remove(itemName);
    //     this.drawInventory();
    
    //     if (object.onDrop) {
    //         object.onDrop(this);
    //     }
    // };

    // this._moveToNextLevel = function () {
    //     // is the player permitted to exit?
    //     if (typeof this.onExit === 'function' && !this.onExit(this.map)) {
    //         this.sound.playSound('blip');
    //         return;
    //     }

    //     this.sound.playSound('complete');

    //     //we disable moving so the player can't move during the fadeout
    //     this.map.getPlayer()._canMove = false;

    //     if (this._currentLevel == 'bonus') {
    //         // open main menu
    //         $('#helpPane, #notepadPane').hide();
    //         $('#menuPane').show();
    //     } else {
    //         this._getLevel(this._currentLevel + 1, false, true);
    //     }
    // };

    // this._jumpToNthLevel = function (levelNum) {
    //     this._currentFile = null;
    //     this._getLevel(levelNum, false, false);
    //     this.display.focus();
    //     this.sound.playSound('blip');
    // };

    // this._getLevelByPath = function (filePath) {
    //     var game = this;
    //     var editor = this.editor;

    //     $.get(filePath, function (lvlCode) {
    //         game._currentLevel = 'bonus';
    //         game._currentBonusLevel = filePath.split("levels/")[1];
    //         game._currentFile = null;

    //         // load level code in editor
    //         editor.loadCode(lvlCode);

    //         // start the level and fade in
    //         game._evalLevelCode(null, null, true);
    //         game.display.focus();

    //         // store the commands introduced in this level (for api reference)
    //         __commands = __commands.concat(editor.getProperties().commandsIntroduced).unique();
    //         localStorage.setItem(this._getLocalKey('helpCommands'), __commands.join(';'));
    //     }, 'text');

    // };

    // // how meta can we go?
    // this._editFile = function (filePath) {
    //     var game = this;

    //     var fileName = filePath.split('/')[filePath.split('/').length - 1];
    //     game._currentFile = filePath;

    //     $.get(filePath, function (code) {
    //         // load level code in editor
    //         if (game._editableScripts.indexOf(fileName) > -1) {
    //             game.editor.loadCode('#BEGIN_EDITABLE#\n' + code + '\n#END_EDITABLE#');
    //         } else {
    //             game.editor.loadCode(code);
    //         }
    //     }, 'text');
    // };

    // this._resetLevel = function (level) {
    //     var game = this;
    //     var resetTimeout_msec = 2500;

    //     if (this._resetTimeout != null) {
    //         $('body, #buttons').css('background-color', '#000');
    //         window.clearTimeout(this._resetTimeout);
    //         this._resetTimeout = null;

    //         if (game._currentBonusLevel) {
    //             game._getLevelByPath('levels/' + game._currentBonusLevel);
    //         } else {
    //             this._getLevel(level, true);
    //         }
    //     } else {
    //         this.display.writeStatus("To reset this level press ^4 again.");
    //         $('body, #buttons').css('background-color', '#900');

    //         this._resetTimeout = setTimeout(function () {
    //             game._resetTimeout = null;

    //             $('body, #buttons').css('background-color', '#000');
    //         }, resetTimeout_msec);
    //     }
    // };

    // // restart level with currently loaded code
    // this._restartLevel = function () {
    //     this.editor.setCode(__currentCode);
    //     this._evalLevelCode();
    // };

    callUnexposedMethod (f) {
        if (this._playerCodeRunning) {
            this._playerCodeRunning = false;
            res = f();
            this._playerCodeRunning = true;
            return res;
        } else {
            return f();
        }
    };

    

    



}