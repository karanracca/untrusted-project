import ROT from './rot';
import GameMap from './map';

export function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export function createDisplay(game, opts) {
    opts.fontFamily = '"droid sans mono", Courier, "Courier New", monospace';
    var display = new ROT.Display(opts);
    display.game = game;
    return display;
}

export function getListOfObjects (__game) {
    let game = __game;
    return {
        // special
        'empty' : {
            'symbol': ' ',
            'impassableFor': ['raft']
        },

        'player' : {
            'symbol': '@',
            'color': '#0f0'
        },

        'exit' : {
            'symbol' : String.fromCharCode(0x2395), // ⎕
            'color': '#0ff',
            'onCollision': function (player) {
                if (!game.map.finalLevel) {
                    game._moveToNextLevel();
                }
            }
        },

        // obstacles

        'block': {
            'symbol': '#',
            'color': '#999',
            'impassable': true
        },

        'tree': {
            'symbol': '♣',
            'color': '#080',
            'impassable': true
        },

        'mine': {
            'symbol': ' ',
            'onCollision': function (player) {
                player.killedBy('a hidden mine');
            }
        },

        'trap': {
            'type': 'dynamic',
            'symbol': '*',
            'color': '#f00',
            'onCollision': function (player, me) {
                player.killedBy('a trap');
            },
            'behavior': null
        },

        'teleporter': {
            'type': 'dynamic',
            'symbol' : String.fromCharCode(0x2395), // ⎕
            'color': '#f0f',
            'onCollision': function (player, me) {
                if (!player._hasTeleported) {
                    if (me.target) {
                        game._callUnexposedMethod(function () {
                            player._moveTo(me.target);
                        });
                    } else {
                        throw 'TeleporterError: Missing target for teleporter'
                    }
                }
                player._hasTeleported = true;
            },
            'behavior': null
        },

        // items

        'computer': {
            'type': 'item',
            'symbol': String.fromCharCode(0x2318), // ⌘
            'color': '#ccc',
            'onPickUp': function (player) {
                $('#editorPane').fadeIn();
                game.editor.refresh();
                game.map.writeStatus('You have picked up the computer!');
            },
            'onDrop': function () {
                $('#editorPane').hide();
            }
        },

        'phone': {
            'type': 'item',
            'symbol': String.fromCharCode(0x260E), // ☎
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up the function phone!');
                $('#phoneButton').show();
            },
            'onDrop': function () {
                $('#phoneButton').hide();
            }
        },

        'redKey': {
            'type': 'item',
            'symbol': 'k',
            'color': 'red',
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up a red key!');
            }
        },

        'greenKey': {
            'type': 'item',
            'symbol': 'k',
            'color': '#0f0',
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up a green key!');
            }
        },

        'blueKey': {
            'type': 'item',
            'symbol': 'k',
            'color': '#06f',
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up a blue key!');
            }
        },

        'yellowKey': {
            'type': 'item',
            'symbol': 'k',
            'color': 'yellow',
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up a yellow key!');
            }
        },

        'theAlgorithm': {
            'type': 'item',
            'symbol': 'A',
            'color': 'white',
            'onPickUp': function (player) {
                game.map.writeStatus('You have picked up the Algorithm!');
            },
            'onDrop': function () {
                game.map.writeStatus('You have lost the Algorithm!');
            }
        },

        // used by bonus levels 01 through 04
        'eye': {
            'type': 'dynamic',
            'symbol': 'E',
            'color': 'red',
            'behavior': function (me) {
                followAndKeepDistance(me, 'player');
                killPlayerIfTooFar(me);
            },
            'onCollision': function (player) {
                player.killedBy('"the eye"');
            },
        },

        // used by bonus levels 01 through 04
        'guard': {
            'type': 'dynamic',
            'symbol': 'd',
            'color': 'red',
            'behavior': function (me) {
                moveToward(me, 'player');
            },
            'onCollision': function (player) {
                player.killedBy('a guard drone');
            },
        }
    };
};

export function playIntro (display, map, i) {
    if (i < 0) {
        display._intro = true;
    } else {
        if (typeof i === 'undefined') { i = map.getHeight(); }
        display.clear();
        display.drawText(0, i - 2, "%c{#0f0}> initialize");
        display.drawText(15, i + 3, "U N T R U S T E D");
        display.drawText(20, i + 5, "- or - ");
        display.drawText(5, i + 7, "THE CONTINUING ADVENTURES OF DR. EVAL");
        display.drawText(3, i + 12, "a game by Alex Nisnevich and Greg Shuflin");
        display.drawText(10, i + 22, "Press any key to begin ...");
        setTimeout(function () {
            playIntro(display, map, i - 1);
        }, 100);
    }
}

export function setEventHandler(e, game) {
    // directions for moving entities
    var keys = {
        37: 'left', // left arrow
        38: 'up', // up arrow
        39: 'right', // right arrow
        40: 'down', // down arrow
    };

    if (game.rotDisplay.__getDisplay._intro == true) {
        //game.rotDisplay.__getDisplay = false;
        game._start();  
    } else if (keys[e.keyCode] && game.map.getPlayer()) {
        game.map.getPlayer().move(keys[e.keyCode], true);
    }

    //e.preventDefault();
}

export const levels = {
    'levels/01_cellBlockA.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["global.startLevel", "global.onExit", "map.placePlayer",\n         "map.placeObject", "map.getHeight", "map.getWidth",\n         "map.displayChapter", "map.getPlayer", "player.hasItem"],\n    "music": "The Green"\n}\n#END_PROPERTIES#\n/*****************\n * cellBlockA.js *\n *****************\n *\n * Good morning, Dr. Eval.\n *\n * It wasn\'t easy, but I\'ve managed to get your computer down\n * to you. This system might be unfamiliar, but the underlying\n * code is still JavaScript. Just like we predicted.\n *\n * Now, let\'s get what we came here for and then get you out of\n * here. Easy peasy.\n *\n * I\'ve given you as much access to their code as I could, but\n * it\'s not perfect. The red background indicates lines that\n * are off-limits from editing.\n *\n * The code currently places blocks in a rectangle surrounding\n * you. All you need to do is make a gap. You don\'t even need\n * to do anything extra. In fact, you should be doing less.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.displayChapter(\'Chapter 1\\nBreakout\');\n\n    map.placePlayer(7, 5);\n#BEGIN_EDITABLE#\n\n    for (y = 3; y <= map.getHeight() - 10; y++) {\n        map.placeObject(5, y, \'block\');\n        map.placeObject(map.getWidth() - 5, y, \'block\');\n    }\n\n    for (x = 5; x <= map.getWidth() - 5; x++) {\n        map.placeObject(x, 3, \'block\');\n        map.placeObject(x, map.getHeight() - 10, \'block\');\n    }\n#END_EDITABLE#\n\n    map.placeObject(15, 12, \'computer\');\n\n    map.placeObject(map.getWidth()-7, map.getHeight()-5, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'computer\')) {\n        map.writeStatus("Don\'t forget to pick up the computer!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/02_theLongWayOut.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": ["ROT.Map.DividedMaze", "player.atLocation"],\n    "music": "gurh"\n}\n#END_PROPERTIES#\n/********************\n * theLongWayOut.js *\n ********************\n *\n * Well, it looks like they\'re on to us. The path isn\'t as\n * clear as I thought it\'d be. But no matter - four clever\n * characters should be enough to erase all their tricks.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.placePlayer(7, 5);\n\n    var maze = new ROT.Map.DividedMaze(map.getWidth(), map.getHeight());\n#BEGIN_EDITABLE#\n\n#END_EDITABLE#\n    maze.create( function (x, y, mapValue) {\n\n        // don\'t write maze over player\n        if (map.getPlayer().atLocation(x,y)) {\n            return 0;\n        }\n\n        else if (mapValue === 1) { //0 is empty space 1 is wall\n            map.placeObject(x,y, \'block\');\n        }\n        else {\n            map.placeObject(x,y,\'empty\');\n        }\n    });\n\n    map.placeObject(map.getWidth()-4, map.getHeight()-4, \'block\');\n    map.placeObject(map.getWidth()-6, map.getHeight()-4, \'block\');\n    map.placeObject(map.getWidth()-5, map.getHeight()-5, \'block\');\n    map.placeObject(map.getWidth()-5, map.getHeight()-3, \'block\');\n#BEGIN_EDITABLE#\n\n#END_EDITABLE#\n    map.placeObject(map.getWidth()-5, map.getHeight()-4, \'exit\');\n#END_OF_START_LEVEL#\n}\n ', 
    'levels/03_validationEngaged.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["global.validateLevel", "map.validateAtLeastXObjects",\n         "map.validateExactlyXManyObjects"],\n    "music": "Obscure Terrain"\n}\n#END_PROPERTIES#\n/************************\n * validationEngaged.js *\n ************************\n *\n * They\'re really on to us now! The validateLevel function\n * has been activated to enforce constraints on what you can\n * do. In this case, you\'re not allowed to remove any blocks.\n *\n * They\'re doing all they can to keep you here. But you\n * can still outsmart them.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.placePlayer(map.getWidth()-7, map.getHeight()-5);\n#BEGIN_EDITABLE#\n\n    for (y = 10; y <= map.getHeight() - 3; y++) {\n        map.placeObject(5, y, \'block\');\n        map.placeObject(map.getWidth() - 5, y, \'block\');\n    }\n\n    for (x = 5; x <= map.getWidth() - 5; x++) {\n        map.placeObject(x, 10, \'block\');\n        map.placeObject(x, map.getHeight() - 3, \'block\');\n    }\n#END_EDITABLE#\n\n    map.placeObject(7, 5, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    numBlocks = 2 * (map.getHeight()-13) + 2 * (map.getWidth()-10);\n\n    map.validateAtLeastXObjects(numBlocks, \'block\');\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/04_multiplicity.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": [],\n    "music": "coming soon"\n}\n#END_PROPERTIES#\n/*******************\n * multiplicity.js *\n *******************\n *\n * Out of one cell and into another. They\'re not giving you\n * very much to work with here, either. Ah, well.\n *\n * Level filenames can be hints, by the way. Have I\n * mentioned that before?\n *\n * No more cells after this one. I promise.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n\n    map.placePlayer(map.getWidth()-5, map.getHeight()-4);\n\n    for (y = 7; y <= map.getHeight() - 3; y++) {\n        map.placeObject(7, y, \'block\');\n        map.placeObject(map.getWidth() - 3, y, \'block\');\n    }\n#BEGIN_EDITABLE#\n\n#END_EDITABLE#\n    for (x = 7; x <= map.getWidth() - 3; x++) {\n        map.placeObject(x, 7, \'block\');\n        map.placeObject(x, map.getHeight() - 3, \'block\');\n    }\n\n    map.placeObject(map.getWidth() - 5, 5, \'exit\');\n#END_OF_START_LEVEL#\n}\n ', 
    'levels/05_minesweeper.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2.1",\n    "commandsIntroduced": ["map.setSquareColor"],\n    "music": "cloudy_sin"\n}\n#END_PROPERTIES#\n/******************\n * minesweeper.js *\n ******************\n *\n * So much for Asimov\'s Laws. They\'re actually trying to kill\n * you now. Not to be alarmist, but the floor is littered\n * with mines. Rushing for the exit blindly may be unwise.\n * I need you alive, after all.\n *\n * If only there was some way you could track the positions\n * of the mines...\n */\n\nfunction getRandomInt(min, max) {\n    return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    for (x = 0; x < map.getWidth(); x++) {\n        for (y = 0; y < map.getHeight(); y++) {\n            map.setSquareColor(x, y, \'#f00\');\n        }\n    }\n\n    map.placePlayer(map.getWidth() - 5, 5);\n\n    for (var i = 0; i < 75; i++) {\n        var x = getRandomInt(0, map.getWidth() - 1);\n        var y = getRandomInt(0, map.getHeight() - 1);\n        if ((x != 2 || y != map.getHeight() - 1)\n            && (x != map.getWidth() - 5 || y != 5)) {\n            // don\'t place mine over exit or player!\n            map.placeObject(x, y, \'mine\');\n#BEGIN_EDITABLE#\n\n#END_EDITABLE#\n        }\n    }\n\n    map.placeObject(2, map.getHeight() - 1, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateAtLeastXObjects(40, \'mine\');\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/06_drones101.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n	"commandsIntroduced":\n        ["object.type", "object.behavior", "object.findNearest",\n         "object.getX", "object.getY", "object.canMove", "object.move"],\n    "music": "GameScratch"\n}\n#END_PROPERTIES#\n\n/****************\n * drones101.js *\n ****************\n *\n * Do you remember, my dear Professor, a certain introductory\n * computational rationality class you taught long ago? Assignment\n * #2, behavior functions of autonomous agents? I remember that one\n * fondly - but attack drones are so much easier to reason about\n * when they\'re not staring you in the face, I would imagine!\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    function moveToward(obj, type) {\n        var target = obj.findNearest(type);\n        var leftDist = obj.getX() - target.x;\n        var upDist = obj.getY() - target.y;\n\n        var direction;\n        if (upDist == 0 && leftDist == 0) {\n        	return;\n        } if (upDist > 0 && upDist >= leftDist) {\n            direction = \'up\';\n        } else if (upDist < 0 && upDist < leftDist) {\n            direction = \'down\';\n        } else if (leftDist > 0 && leftDist >= upDist) {\n            direction = \'left\';\n        } else {\n            direction = \'right\';\n        }\n\n        if (obj.canMove(direction)) {\n            obj.move(direction);\n        }\n    }\n\n    map.defineObject(\'attackDrone\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'d\',\n        \'color\': \'red\',\n        \'onCollision\': function (player) {\n            player.killedBy(\'an attack drone\');\n        },\n        \'behavior\': function (me) {\n            moveToward(me, \'player\');\n        }\n    });\n\n\n    map.placePlayer(1, 1);\n    map.placeObject(map.getWidth()-2, 12, \'attackDrone\');\n    map.placeObject(map.getWidth()-1, 12, \'exit\');\n\n    map.placeObject(map.getWidth()-1, 11, \'block\');\n    map.placeObject(map.getWidth()-2, 11, \'block\');\n    map.placeObject(map.getWidth()-1, 13, \'block\');\n    map.placeObject(map.getWidth()-2, 13, \'block\');\n#BEGIN_EDITABLE#\n\n\n\n\n#END_EDITABLE#\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/07_colors.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["map.defineObject", "player.getColor", "player.setColor",\n         "object.color", "object.impassable", "object.symbol",\n         "player.setPhoneCallback"],\n    "music": "Y"\n}\n#END_PROPERTIES#\n/*************\n* colors.js *\n *************\n *\n * You\'re almost at the exit. You just need to get past this\n * color lock.\n *\n * Changing your environment is no longer enough. You must\n * learn to change yourself. I\'ve sent you a little something\n * that should help with that.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.placePlayer(0, 12);\n\n    map.placeObject(5, 12, \'phone\');\n\n    // The function phone lets you call arbitrary functions,\n    // as defined by player.setPhoneCallback() below.\n    // The function phone callback is bound to Q or Ctrl-6.\n    map.getPlayer().setPhoneCallback(function () {\n#BEGIN_EDITABLE#\n        var player = map.getPlayer();\n\n        player.setColor(\'#f00\');\n\n\n\n\n\n#END_EDITABLE#\n    });\n\n\n    map.defineObject(\'redLock\', {\n        symbol: \'☒\',\n        color: "#f00", // red\n        impassable: function(player, object) {\n            return player.getColor() != object.color;\n        }\n    });\n\n    map.defineObject(\'greenLock\', {\n        symbol: \'☒\',\n        color: "#0f0", // green\n        impassable: function(player, object) {\n            return player.getColor() != object.color;\n        }\n    });\n\n    map.defineObject(\'yellowLock\', {\n        symbol: \'☒\',\n        color: "#ff0", // yellow\n        impassable: function(player, object) {\n            return player.getColor() != object.color;\n        }\n    });\n\n    for (var x = 20; x <= 40; x++) {\n        map.placeObject(x, 11, \'block\');\n        map.placeObject(x, 13, \'block\');\n    }\n    map.placeObject(22, 12, \'greenLock\');\n    map.placeObject(25, 12, \'redLock\');\n    map.placeObject(28, 12, \'yellowLock\');\n    map.placeObject(31, 12, \'greenLock\');\n    map.placeObject(34, 12, \'redLock\');\n    map.placeObject(37, 12, \'yellowLock\');\n    map.placeObject(40, 12, \'exit\');\n    for (var y = 0; y < map.getHeight(); y++) {\n        if (y != 12) {\n            map.placeObject(40, y, \'block\');\n        }\n        for (var x = 41; x < map.getWidth(); x++) {\n            map.setSquareColor(x, y, \'#080\');\n        }\n    }\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'phone\')) {\n        map.writeStatus("We need the phone!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/08_intoTheWoods.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["map.getObjectTypeAt", "player.getX", "player.getY",\n         "map.refresh"],\n    "mapProperties": {\n        "allowOverwrite": true\n    },\n    "music": "Night Owl"\n}\n#END_PROPERTIES#\n/*******************\n * intoTheWoods.js *\n *******************\n *\n * Ah, you\'re out of the woods now. Or into the woods, as the\n * case may be.\n *\n * So take a deep breath, relax, and remember what you\'re here\n * for in the first place.\n *\n * I\'ve traced its signal and the Algorithm is nearby. You\'ll\n * need to go through the forest and across the river, and\n * you\'ll reach the fortress where it\'s kept. Their defences\n * are light, and we should be able to catch them off-guard.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    // NOTE: In this level alone, map.placeObject is allowed to\n    //overwrite existing objects.\n\n    map.displayChapter(\'Chapter 2\\nRaiders of the Lost Algorithm\');\n\n    map.placePlayer(2, map.getHeight() - 1);\n\n    var functionList = {};\n\n    functionList[\'fortresses\'] = function () {\n        function genRandomValue(direction) {\n            if (direction === "height") {\n                return Math.floor(Math.random() * (map.getHeight()-3));\n            } else if (direction === "width") {\n                return Math.floor(Math.random() * (map.getWidth()+1));\n            }\n        }\n\n        var x = genRandomValue("width");\n        var y = genRandomValue("height");\n\n        for (var i = x-2; i < x+2; i++) {\n            map.placeObject(i,y-2, \'block\');\n        }\n        for (var i = x-2; i < x+2; i++) {\n            map.placeObject(i,y+2, \'block\');\n        }\n\n        for (var j = y-2; j < y+2; j++) {\n            map.placeObject(x-2,j, \'block\');\n        }\n\n        for (var j = y-2; j < y+2; j++) {\n            map.placeObject(x+2,j, \'block\');\n        }\n    };\n\n    functionList[\'generateForest\'] = function () {\n        for (var i = 0; i < map.getWidth(); i++) {\n            for (var j = 0; j < map.getHeight(); j++) {\n\n                // initialize to empty if the square contains a forest already\n                if (map.getObjectTypeAt(i, j) === \'tree\') {\n                    // remove existing forest\n                    map.placeObject(i,j, \'empty\');\n                }\n\n                if (map.getPlayer().atLocation(i,j) ||\n                        map.getObjectTypeAt(i, j) === \'block\' ||\n                        map.getObjectTypeAt(i, j) === \'exit\') {\n                    continue;\n                }\n\n                var rv = Math.random();\n                if (rv < 0.45) {\n                    map.placeObject(i, j, \'tree\');\n                }\n            }\n        }\n        map.refresh();\n    };\n\n    functionList[\'movePlayerToExit\'] = function () {\n        map.writeStatus("Permission denied.");\n    }\n\n    functionList[\'pleaseMovePlayerToExit\'] = function () {\n        map.writeStatus("I don\'t think so.");\n    }\n\n    functionList[\'movePlayerToExitDamnit\'] = function () {\n        map.writeStatus("So, how \'bout them <LOCAL SPORTS TEAM>?");\n    }\n\n    // generate forest\n    functionList[\'generateForest\']();\n\n    // generate fortresses\n    functionList[\'fortresses\']();\n    functionList[\'fortresses\']();\n    functionList[\'fortresses\']();\n    functionList[\'fortresses\']();\n\n    map.getPlayer().setPhoneCallback(functionList[#{#"movePlayerToExit"#}#]);\n\n    map.placeObject(map.getWidth()-1, map.getHeight()-1, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateAtLeastXObjects(100, \'tree\');\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/09_fordingTheRiver.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["player.killedBy", "object.onCollision"],\n    "music": "The_Waves_Call_Her_Name"\n}\n#END_PROPERTIES#\n/**********************\n * fordingTheRiver.js *\n **********************\n *\n * And there\'s the river. Fortunately, I was prepared for this.\n * See the raft on the other side?\n *\n * Everything is going according to plan.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    var raftDirection = \'down\';\n\n    map.placePlayer(map.getWidth()-1, map.getHeight()-1);\n    var player = map.getPlayer();\n\n    map.defineObject(\'raft\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'▓\',\n        \'color\': \'#420\',\n        \'transport\': true, // (prevents player from drowning in water)\n        \'behavior\': function (me) {\n            me.move(raftDirection);\n        }\n    });\n\n    map.defineObject(\'water\', {\n        \'symbol\': \'░\',\n        \'color\': \'#44f\',\n        \'onCollision\': function (player) {\n            player.killedBy(\'drowning in deep dark water\');\n        }\n    });\n\n    for (var x = 0; x < map.getWidth(); x++) {\n        for (var y = 5; y < 15; y++) {\n            map.placeObject(x, y, \'water\');\n        }\n    }\n\n    map.placeObject(20, 5, \'raft\');\n    map.placeObject(0, 2, \'exit\');\n    map.placeObject(0, 1, \'block\');\n    map.placeObject(1, 1, \'block\');\n    map.placeObject(0, 3, \'block\');\n    map.placeObject(1, 3, \'block\');\n\n#BEGIN_EDITABLE#\n\n\n\n#END_EDITABLE#\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateExactlyXManyObjects(1, \'raft\');\n}\n ', 
    'levels/10_ambush.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": [],\n    "music": "Come and Find Me"\n}\n#END_PROPERTIES#\n/*************\n * ambush.js *\n *************\n *\n * Oh. Oh, I see. This wasn\'t quite part of the plan.\n *\n * Looks like they won\'t let you take the Algorithm\n * without a fight. You\'ll need to carefully weave your\n * way through the guard drones.\n *\n * Well, time to improvise. Let\'s mess with their programming\n * a little, shall we?\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    function moveToward(obj, type) {\n        var target = obj.findNearest(type);\n        var leftDist = obj.getX() - target.x;\n        var upDist = obj.getY() - target.y;\n\n        var direction;\n        if (upDist == 0 && leftDist == 0) {\n            return;\n        } if (upDist > 0 && upDist >= leftDist) {\n            direction = \'up\';\n        } else if (upDist < 0 && upDist < leftDist) {\n            direction = \'down\';\n        } else if (leftDist > 0 && leftDist >= upDist) {\n            direction = \'left\';\n        } else {\n            direction = \'right\';\n        }\n\n        if (obj.canMove(direction)) {\n            obj.move(direction);\n        }\n    }\n\n    map.defineObject(\'attackDrone\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'d\',\n        \'color\': \'red\',\n        \'onCollision\': function (player) {\n            player.killedBy(\'an attack drone\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n            moveToward(me, \'player\');\n#END_EDITABLE#\n        }\n    });\n\n    map.defineObject(\'reinforcementDrone\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'d\',\n        \'color\': \'yellow\',\n        \'onCollision\': function (player) {\n            player.killedBy(\'a reinforcement drone\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n            me.move(\'left\');\n#END_EDITABLE#\n        }\n    });\n\n    map.defineObject(\'defenseDrone\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'d\',\n        \'color\': \'green\',\n        \'onCollision\': function (player) {\n            player.killedBy(\'a defense drone\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n\n#END_EDITABLE#\n        }\n    });\n\n    // just for decoration\n    map.defineObject(\'water\', {\n        \'symbol\': \'░\',\n        \'color\': \'#44f\'\n    });\n\n    map.placePlayer(0, 12);\n\n    for (var x = 0; x < map.getWidth(); x++) {\n        map.placeObject(x, 10, \'block\');\n        map.placeObject(x, 14, \'block\');\n\n        for (var y = 20; y < map.getHeight(); y++) {\n            map.placeObject(x, y, \'water\');\n        }\n    }\n\n    map.placeObject(23, 11, \'attackDrone\');\n    map.placeObject(23, 12, \'attackDrone\');\n    map.placeObject(23, 13, \'attackDrone\');\n\n    map.placeObject(27, 11, \'defenseDrone\');\n    map.placeObject(27, 12, \'defenseDrone\');\n    map.placeObject(27, 13, \'defenseDrone\');\n\n    map.placeObject(24, 11, \'reinforcementDrone\');\n    map.placeObject(25, 11, \'reinforcementDrone\');\n    map.placeObject(26, 11, \'reinforcementDrone\');\n    map.placeObject(24, 13, \'reinforcementDrone\');\n    map.placeObject(25, 13, \'reinforcementDrone\');\n    map.placeObject(26, 13, \'reinforcementDrone\');\n\n    map.placeObject(map.getWidth()-1, 12, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/11_robot.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["object.giveItemTo", "object.passableFor",\n         "map.validateAtMostXObjects"],\n    "music": "conspiracy"\n}\n#END_PROPERTIES#\n/*\n * robot.js\n *\n * You\'ll need three keys in order to unlock the\n * Algorithm: the red key, the green key, and the\n * blue key. Unfortunately, all three of them are\n * behind human-proof barriers.\n *\n * The plan is simple: reprogram the maintenance\n * robots to grab the key and bring it through\n * the barrier to us.\n *\n * Let\'s try it on the red key first.\n */\n\nfunction getRandomInt(min, max) {\n    return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    // Hint: you can press R or 5 to "rest" and not move the\n    // player, while the robot moves around.\n\n    map.placePlayer(map.getWidth()-2, map.getHeight()-2);\n    var player = map.getPlayer();\n\n    map.defineObject(\'robot\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'R\',\n        \'color\': \'gray\',\n        \'onCollision\': function (player, me) {\n            me.giveItemTo(player, \'redKey\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n            // Available commands: me.move(direction)\n            //                 and me.canMove(direction)\n\n\n\n#END_EDITABLE#\n        }\n    });\n\n    map.defineObject(\'barrier\', {\n        \'symbol\': \'░\',\n        \'color\': \'purple\',\n        \'impassable\': true,\n        \'passableFor\': [\'robot\']\n    });\n\n    map.placeObject(0, map.getHeight() - 1, \'exit\');\n    map.placeObject(1, 1, \'robot\');\n    map.placeObject(map.getWidth() - 2, 8, \'redKey\');\n    map.placeObject(map.getWidth() - 2, 9, \'barrier\');\n\n    for (var x = 0; x < map.getWidth(); x++) {\n        map.placeObject(x, 0, \'block\');\n        if (x != map.getWidth() - 2) {\n            map.placeObject(x, 9, \'block\');\n        }\n    }\n\n    for (var y = 1; y < 9; y++) {\n        map.placeObject(0, y, \'block\');\n        map.placeObject(map.getWidth() - 1, y, \'block\');\n    }\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateExactlyXManyObjects(1, \'robot\');\n    map.validateAtMostXObjects(1, \'redKey\');\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'redKey\')) {\n        map.writeStatus("We need to get that key!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/12_robotNav.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": [],\n    "music": "Messeah"\n}\n#END_PROPERTIES#\n/*\n * robotNav.js\n *\n * The green key is located in a slightly more\n * complicated room. You\'ll need to get the robot\n * past these obstacles.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    // Hint: you can press R or 5 to "rest" and not move the\n    // player, while the robot moves around.\n\n    map.placePlayer(0, map.getHeight() - 1);\n    var player = map.getPlayer();\n\n    map.defineObject(\'robot\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'R\',\n        \'color\': \'gray\',\n        \'onCollision\': function (player, me) {\n            me.giveItemTo(player, \'greenKey\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n            if (me.canMove(\'right\')) {\n                me.move(\'right\');\n            } else {\n                me.move(\'down\');\n            }\n\n\n\n\n\n\n\n\n\n\n\n#END_EDITABLE#\n        }\n    });\n\n    map.defineObject(\'barrier\', {\n        \'symbol\': \'░\',\n        \'color\': \'purple\',\n        \'impassable\': true,\n        \'passableFor\': [\'robot\']\n    });\n\n    map.placeObject(map.getWidth() - 1, map.getHeight() - 1, \'exit\');\n    map.placeObject(1, 1, \'robot\');\n    map.placeObject(map.getWidth() - 2, 8, \'greenKey\');\n    map.placeObject(map.getWidth() - 2, 9, \'barrier\');\n\n    for (var x = 0; x < map.getWidth(); x++) {\n        map.placeObject(x, 0, \'block\');\n        if (x != map.getWidth() - 2) {\n            map.placeObject(x, 9, \'block\');\n        }\n    }\n\n    for (var y = 1; y < 9; y++) {\n        map.placeObject(0, y, \'block\');\n        map.placeObject(map.getWidth() - 1, y, \'block\');\n    }\n\n    for (var i = 0; i < 4; i++) {\n        map.placeObject(20 - i, i + 1, \'block\');\n        map.placeObject(35 - i, 8 - i, \'block\');\n    }\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateExactlyXManyObjects(1, \'robot\');\n    map.validateAtMostXObjects(1, \'greenKey\');\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'greenKey\')) {\n        map.writeStatus("We need to get that key!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/13_robotMaze.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": ["map.getAdjacentEmptyCells"],\n    "music": "Searching"\n}\n#END_PROPERTIES#\n/*\n * robotMaze.js\n *\n * The blue key is inside a labyrinth, and extracting\n * it will not be easy.\n *\n * It\'s a good thing that you\'re a AI expert, or\n * we would have to leave empty-handed.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    // Hint: you can press R or 5 to "rest" and not move the\n    // player, while the robot moves around.\n\n    map.getRandomInt = function(min, max) {\n        return Math.floor(Math.random() * (max - min + 1)) + min;\n    }\n\n    map.placePlayer(map.getWidth()-1, map.getHeight()-1);\n    var player = map.getPlayer();\n\n    map.defineObject(\'robot\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'R\',\n        \'color\': \'gray\',\n        \'onCollision\': function (player, me) {\n            me.giveItemTo(player, \'blueKey\');\n        },\n        \'behavior\': function (me) {\n#BEGIN_EDITABLE#\n            // move randomly\n            var moves = map.getAdjacentEmptyCells(me.getX(), me.getY());\n            // getAdjacentEmptyCells gives array of ((x, y), direction) pairs\n            me.move(moves[map.getRandomInt(0, moves.length - 1)][1]);\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n#END_EDITABLE#\n        }\n    });\n\n    map.defineObject(\'barrier\', {\n        \'symbol\': \'░\',\n        \'color\': \'purple\',\n        \'impassable\': true,\n        \'passableFor\': [\'robot\']\n    });\n\n    map.placeObject(0, map.getHeight() - 1, \'exit\');\n    map.placeObject(1, 1, \'robot\');\n    map.placeObject(map.getWidth() - 2, 8, \'blueKey\');\n    map.placeObject(map.getWidth() - 2, 9, \'barrier\');\n\n    var autoGeneratedMaze = new ROT.Map.DividedMaze(map.getWidth(), 10);\n    autoGeneratedMaze.create( function (x, y, mapValue) {\n        // don\'t write maze over robot or barrier\n        if ((x == 1 && y == 1) || (x == map.getWidth() - 2 && y >= 8)) {\n            return 0;\n        } else if (mapValue === 1) { //0 is empty space 1 is wall\n            map.placeObject(x,y, \'block\');\n        } else {\n            map.placeObject(x,y,\'empty\');\n        }\n    });\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateExactlyXManyObjects(1, \'robot\');\n    map.validateAtMostXObjects(1, \'blueKey\');\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'blueKey\')) {\n        map.writeStatus("We need to get that key!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/14_crispsContest.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["map.createFromGrid", "player.removeItem"],\n    "music": "Chip"\n}\n#END_PROPERTIES#\n/********************\n * crispsContest.js *\n ********************\n *\n * The Algorithm is almost in our grasp!\n * At long last, we will definitively establish\n * that 3SAT is solvable in polynomial time. It\'s\n * been a long, strange journey, but it will all be\n * worth it.\n *\n * You have the red, green, and blue keys. Now you\n * just need to figure out how to unlock this thing.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.defineObject(\'redLock\', {\n        \'symbol\': String.fromCharCode(0x2297),\n        \'color\': \'red\',\n        \'impassable\': function (player) {\n            if (player.hasItem(\'redKey\')) {\n                player.removeItem(\'redKey\');\n                return false;\n            } else {\n                return true;\n            }\n        }\n    });\n\n    map.defineObject(\'blueLock\', {\n        \'symbol\': String.fromCharCode(0x2297),\n        \'color\': \'#06f\',\n        \'impassable\': function (player) {\n            if (player.hasItem(\'blueKey\')) {\n                player.removeItem(\'blueKey\');\n                return false;\n            } else {\n                return true;\n            }\n        }\n    });\n\n    map.defineObject(\'greenLock\', {\n        \'symbol\': String.fromCharCode(0x2297),\n        \'color\': \'#0f0\',\n        \'impassable\': function (player) {\n            if (player.hasItem(\'greenKey\')) {\n                player.removeItem(#{#\'greenKey\'#}#);\n                return false;\n            } else {\n                return true;\n            }\n        }\n    });\n\n    map.defineObject(\'yellowLock\', {\n        \'symbol\': String.fromCharCode(0x2297),\n        \'color\': \'yellow\',\n        \'impassable\': function (player) {\n            if (player.hasItem(\'yellowKey\')) {\n                player.removeItem(\'yellowKey\');\n                return false;\n            } else {\n                return true;\n            }\n        }\n    });\n\n    map.createFromGrid(\n       [\'  +++++ +++++  \',\n        \'  + b +++ r +  \',\n        \'  +   +E+   +  \',\n        \'+++G+B+ +R+G+++\',\n        \'+ y B     R b +\',\n        \'+   +     +   +\',\n        \'+++++  @  +++++\',\n        \'+   +     +   +\',\n        \'+ y R     B y +\',\n        \'++++++Y+Y++++++\',\n        \'    +  +  +    \',\n        \'    + ABy +    \',\n        \'    +++++++    \'],\n    {\n        \'@\': \'player\',\n        \'E\': \'exit\',\n        \'A\': \'theAlgorithm\',\n        \'+\': \'block\',\n        \'R\': \'redLock\',\n        \'G\': \'greenLock\',\n        \'B\': \'blueLock\',\n        \'Y\': \'yellowLock\',\n        \'r\': \'redKey\',\n        \'g\': \'greenKey\',\n        \'b\': \'blueKey\',\n        \'y\': \'yellowKey\'\n    }, 17, 6);\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateAtMostXObjects(1, \'theAlgorithm\');\n    map.validateAtMostXObjects(4, \'yellowKey\');\n    map.validateAtMostXObjects(2, \'blueKey\');\n    map.validateAtMostXObjects(1, \'redKey\');\n}\n\nfunction onExit(map) {\n    // make sure we have all the items we need!\n    if (!map.getPlayer().hasItem(\'theAlgorithm\')) {\n        map.writeStatus("You must get that Algorithm!!");\n        return false;\n    } else if (!map.getPlayer().hasItem(\'computer\')) {\n        map.writeStatus("You\'ll need your computer! [Ctrl-5 to restart]");\n        return false;\n    } else if (!map.getPlayer().hasItem(\'phone\')) {\n        map.writeStatus("You\'ll need your phone! [Ctrl-5 to restart]");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/15_exceptionalCrossing.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced": [],\n    "music": "The_Waves_Call_Her_Name",\n    "startingMessage": "You have lost the Algorithm!"\n}\n#END_PROPERTIES#\n/**************************\n * exceptionalCrossing.js *\n **************************\n *\n * Sorry, old friend, but I\'m afraid I can\'t share\n * co-authorship on this paper. You\'ve done a very\n * good job getting this Algorithm for me. The bit\n * with the keys was especially clever! I wouldn\'t\n * have thought of it myself. But then, of course,\n * that\'s why you were here in the first place.\n *\n * You\'ve served your purpose well. But now, alas,\n * it is time for you to die.\n *\n * I\'m not heartless, though. In fact, I will let\n * you choose your mode of death. There, isn\'t that\n * nice?\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.displayChapter(\'Chapter 3\\nBetrayal\');\n\n    map.placePlayer(0, 0);\n\n    // yoink!\n    map.getPlayer().removeItem(\'theAlgorithm\');\n\n    map.defineObject(\'water\', {\n        \'symbol\': \'░\',\n        \'color\': \'#44f\',\n        \'onCollision\': function (player) {\n            player.killedBy#{#(\'drowning in deep dark water\')#}#;\n        }\n    });\n\n    for (var x = 0; x < map.getWidth(); x++)\n        for (var y = 5; y < 15; y++)\n            map.placeObject(x, y, \'water\');\n\n    map.placeObject(map.getWidth()-1, map.getHeight()-1, \'exit\');\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/16_lasers.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2.3",\n    "commandsIntroduced":\n        ["map.getCanvasContext", "canvas.beginPath", "canvas.strokeStyle",\n         "canvas.lineWidth", "canvas.moveTo", "canvas.lineTo",\n         "canvas.stroke", "map.createLine", "map.validateAtLeastXLines"],\n    "music": "Soixante-8",\n    "mapProperties": {\n        "showDrawingCanvas": true\n    }\n}\n#END_PROPERTIES#\n/*************\n * lasers.js *\n *************\n *\n * Time to unleash the killer lasers! Each laser will kill you\n * unless you have the appropriate color. Too bad you can\'t\n * see which color corresponds to which laser!\n */\n\nfunction getRandomInt(min, max) {\n    return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.placePlayer(0, 0);\n    map.placeObject(map.getWidth()-1, map.getHeight()-1, \'exit\');\n    var player = map.getPlayer();\n\n    for (var i = 0; i < 25; i++) {\n        var colors = [\'red\', \'yellow\', \'teal\'];\n\n        var startX = getRandomInt(0, 600);\n        var startY = getRandomInt(0, 500);\n        var angle = getRandomInt(0, 360);\n        var length = getRandomInt(200, 300);\n        var color = colors[i % 3];\n        createLaser(startX, startY, angle, length, color);\n    }\n\n    function createLaser(centerX, centerY, angleInDegrees, length, color) {\n        var angleInRadians = angleInDegrees * Math.PI / 180;\n\n        var x1 = centerX - Math.cos(angleInRadians) * length / 2;\n        var y1 = centerY + Math.sin(angleInRadians) * length / 2;\n        var x2 = centerX + Math.cos(angleInRadians) * length / 2;\n        var y2 = centerY - Math.sin(angleInRadians) * length / 2;\n\n        // map.createLine() creates a line with an effect when\n        // the player moves over it, but doesn\'t display it\n        map.createLine([x1, y1], [x2, y2], function (player) {\n            if (player.getColor() != color) {\n                player.killedBy(\'a \' + color + \' laser\');\n            }\n        });\n\n#BEGIN_EDITABLE#\n        // using canvas to draw the line\n        var ctx = map.getCanvasContext();\n        ctx.beginPath();\n        ctx.strokeStyle = \'white\';\n        ctx.lineWidth = 5;\n        ctx.moveTo(x1, y1);\n        ctx.lineTo(x2, y2);\n        ctx.stroke();\n#END_EDITABLE#\n\n    }\n\n#BEGIN_EDITABLE#\n\n\n\n\n\n\n\n\n\n#END_EDITABLE#\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateAtLeastXLines(25);\n}\n ', 
    'levels/17_pointers.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2.1",\n    "commandsIntroduced":\n        ["map.getDynamicObjects", "map.getCanvasCoords", "object.setTarget"],\n    "music": "Tart",\n    "mapProperties": {\n        "showDrawingCanvas": true\n    }\n}\n#END_PROPERTIES#\n/***************\n * pointers.js *\n ***************\n *\n * You! How are you still alive?\n *\n * Well, no matter. Good luck getting through this\n * maze of rooms - you\'ll never see me or the Algorithm again!\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    function shuffle(o){ //v1.0 [http://bit.ly/1l6LGQT]\n        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),\n            x = o[--i], o[i] = o[j], o[j] = x);\n        return o;\n    };\n\n    map.createFromGrid(\n        [\'+++++++++++++++++++++++++++++++++++++++++++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+* @ o++*   o++*   o++*   o++*   o++*   o++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+++++++++++++++++++++++++++++++++++++++++++++\',\n         \'+++++* o++++* o++++* o++++* o++++* o++++* o++\',\n         \'++++o   *++o   *++o   *++o   *++o   *++o   *+\',\n         \'+++++* o++++* o++++* o++++* o++++* o++++* o++\',\n         \'+++++++++++++++++++++++++++++++++++++++++++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+*   o++*   o++*   o++*   o++*   o++*   o++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+++++++++++++++++++++++++++++++++++++++++++++\',\n         \'+++++* o++++* o++++* o++++* o++++* o++++* o++\',\n         \'++++o   *++o   *++o   *++o   *++o   *++o   *+\',\n         \'+++++* o++++* o++++* o++++* o++++* o++++* o++\',\n         \'+++++++++++++++++++++++++++++++++++++++++++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+*   o++*   o++*   o++*   o++*   o++* E o++++\',\n         \'++o *++++o *++++o *++++o *++++o *++++o *+++++\',\n         \'+++++++++++++++++++++++++++++++++++++++++++++\'],\n        {\n            \'@\': \'player\',\n            \'E\': \'exit\',\n            \'+\': \'block\',\n            \'o\': \'teleporter\',\n            \'*\': \'trap\',\n        }, 2, 2);\n\n    var canvas = map.getCanvasContext();\n\n    var teleportersAndTraps = map.getDynamicObjects();\n    teleportersAndTraps = shuffle(teleportersAndTraps);\n\n    for (i = 0; i < teleportersAndTraps.length; i+=2) {\n        var t1 = teleportersAndTraps[i];\n        var t2 = teleportersAndTraps[i+1];\n\n        // Point each teleporter to either another teleporter\n        // or a trap\n        if (t1.getType() == \'teleporter\') {\n            t1.setTarget(t2);\n        }\n        if (t2.getType() == \'teleporter\') {\n            t2.setTarget(t1);\n        }\n\n#BEGIN_EDITABLE#\n        // TODO find a way to remove the API docs\n        // wouldn\'t want the \'good doctor\' to find\n        // out about map.getCanvasCoords()...\n\n\n\n\n\n#END_EDITABLE#\n    }\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n}\n ', 
    'levels/18_superDrEvalBros.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2.2",\n    "commandsIntroduced": ["player.move", "map.startTimer"],\n    "music": "Beach Wedding Dance",\n    "mapProperties": {\n         "keyDelay": 25\n    }\n}\n#END_PROPERTIES#\n/**********************\n * superDrEvalBros.js *\n **********************\n *\n * You\'re still here?! Well, Dr. Eval, let\'s see\n * how well you can operate with one less dimension.\n *\n * Give up now. Unless you have a magic mushroom\n * up your sleeve, it\'s all over.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    var fl = Math.floor;\n    var w = map.getWidth();\n    var h = map.getHeight();\n\n    map.placePlayer(1, fl(h/2)-1);\n    var player = map.getPlayer();\n\n    map.placeObject(w-1, fl(h/2)-1, \'exit\');\n\n    for (var x = 0; x < fl(w/2) - 5; x++) {\n        for (var y = fl(h/2); y < h; y++) {\n            map.placeObject(x, y, \'block\');\n        }\n    }\n\n    for (var x = fl(w/2) + 5; x <= w; x++) {\n        for (var y = fl(h/2); y < h; y++) {\n            map.placeObject(x, y, \'block\');\n        }\n    }\n\n    function gravity() {\n        var x = player.getX();\n        var y = player.getY() + 1;\n\n        if (y === map.getHeight() - 2) {\n            player.killedBy("gravity");\n        }\n\n        if (map.getObjectTypeAt(x,y) === "empty") {\n            player.move("down");\n        }\n\n    }\n    map.startTimer(gravity, 45);\n\n    function jump() {\n#BEGIN_EDITABLE#\n\n\n\n\n\n\n\n#END_EDITABLE#\n    }\n\n    player.setPhoneCallback(function () {\n        var x = player.getX();\n        var y = player.getY() + 1;\n\n        if (map.getObjectTypeAt(x,y) !== "empty") {\n            jump();\n        }\n    });\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    map.validateExactlyXManyObjects(1, \'exit\');\n    map.validateExactlyXManyObjects(520, \'block\');\n}\n ', 
    'levels/19_documentObjectMadness.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.3",\n    "commandsIntroduced":\n        ["global.objective", "map.getDOM", "map.createFromDOM",\n         "map.updateDOM", "map.overrideKey", "global.$",\n         "jQuery.find", "jQuery.addClass", "jQuery.hasClass",\n         "jQuery.removeClass", "jQuery.parent", "jQuery.length",\n         "jQuery.children", "jQuery.first", "jQuery.next",\n         "jQuery.prev"],\n    "music": "BossLoop",\n    "mapProperties": {\n        "showDummyDom": true\n    }\n}\n#END_PROPERTIES#\n/****************************\n * documentObjectMadness.js *\n ****************************\n *\n * I can\'t believe it! I can\'t believe you made it onto\n * Department of Theoretical Computation\'s web server!\n * YOU SHOULD HAVE BEEN DELETED! This shouldn\'t even be\n * possible! What the hell were the IT folks thinking?\n *\n * No matter. I still have the Algorithm. That\'s the\n * important part. The rest is just implementation, and\n * how hard could that be?\n *\n * Anyway you\'re not going to catch me now, my good Doctor.\n * After all, you\'re a tenured professor with a well-respected\n * history of research - you probably don\'t know jQuery!\n */\n\nfunction objective(map) {\n    return map.getDOM().find(\'.adversary\').hasClass(\'drEval\');\n}\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    var html = "<div class=\'container\'>" +\n    "<div style=\'width: 600px; height: 500px; background-color: white; font-size: 10px;\'>" +\n        "<center><h1>Department of Theoretical Computation</h1></center>" +\n        "<hr />" +\n        "<table border=\'0\'><tr valign=\'top\'>" +\n            "<td><div id=\'face\' /></td>" +\n            "<td>" +\n                "<h2 class=facultyName>Cornelius Eval</h2>" +\n                "<h3>Associate Professor of Computer Science</h3>" +\n                "<ul>" +\n                    "<li>BS, Mathematics, University of Manitoba</li>" +\n                    "<li>PhD, Theoretical Computation, <a href=\'http://www.mit.edu\'>MIT</a></li>" +\n                "</ul>" +\n                "<h4>About me</h4>" +\n                "<p>I am an associate professor of computer science, attached to the Department of " +\n                "Theoretical Computation. My current research interests include the human-machine " +\n                "interface, NP complete problems, and parallelized mesh mathematics.</p>" +\n                "<p>I am also the current faculty advisor to the <a href=\'\'>undergraduate Super Smash Bros. team</a>. " +\n                "In my spare time I enjoy polka and dirtbiking. </p>" +\n            "</td>" +\n        "</tr></table>" +\n\n        "<div id=\'class_schedule\'>" +\n          "<h4>Class Schedule</h4>" +\n            "<table>" +\n             "<tr>" +\n                "<th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th>" +\n             "</tr>" +\n             "<tr>" +\n                "<td>CS145 - Semicolons</td><td>Nothing Planned</td><td>CS145 - Semicolons</td><td>CS199 - Practical Theorycrafting </td><td>CS145 - Semicolons</td>" +\n             "</tr>" +\n            "</table>" +\n        "</div>" +\n        "<div id=\'loremIpsum\'>" +\n        "<h4>Lorem Ipsum</h4>" +\n          "<blockquote>" +\n            "<code>Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci " +\n            "velit, sed quia nonnumquam eiusmodi tempora incidunt ut labore et dolore magnam aliquam quaerat " +\n            "voluptatem.</code>" +\n            "<footer>— " +\n              "<cite>Cicero, De Finibus Bonorum et Malorum</cite>" +\n            "</footer>" +\n          "</blockquote>" +\n        "</div>" +\n    "</div></div>";\n\n    var $dom = $(html);\n\n    $dom.find(\'.facultyName\').addClass(\'drEval\');\n    $dom.find(\'cite\').addClass(\'adversary\');\n\n    function moveToParent(className) {\n        var currentPosition = $dom.find(\'.\' + className);\n        if (currentPosition.parent().length > 0) {\n            if (currentPosition.parent().hasClass(\'container\')) {\n                if (className === \'drEval\') {\n                    map.getPlayer().killedBy(\'moving off the edge of the DOM\');\n                } else {\n                    return false;\n                }\n            } else {\n                currentPosition.parent().addClass(className);\n                currentPosition.removeClass(className);\n                map.updateDOM($dom);\n            }\n        }\n    }\n\n    function moveToFirstChild(className) {\n        var currentPosition = $dom.find(\'.\' + className);\n        if (currentPosition.children().length > 0) {\n            currentPosition.children().first().addClass(className);\n            currentPosition.removeClass(className);\n            map.updateDOM($dom);\n        }\n    }\n\n    function moveToPreviousSibling(className) {\n        var currentPosition = $dom.find(\'.\' + className);\n        if (currentPosition.prev().length > 0) {\n            currentPosition.prev().addClass(className);\n            currentPosition.removeClass(className);\n            map.updateDOM($dom);\n        }\n    }\n\n    function moveToNextSibling(className) {\n        var currentPosition = $dom.find(\'.\' + className);\n        if (currentPosition.next().length > 0) {\n            currentPosition.next().addClass(className);\n            currentPosition.removeClass(className);\n            map.updateDOM($dom);\n        }\n    }\n\n    map.overrideKey(\'up\', function () { moveToParent(\'drEval\'); });\n    map.overrideKey(\'down\', function () { moveToFirstChild(\'drEval\'); });\n    map.overrideKey(\'left\', function () { moveToPreviousSibling(\'drEval\'); });\n    map.overrideKey(\'right\', function () { moveToNextSibling(\'drEval\'); });\n\n    map.defineObject(\'adversary\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'@\',\n        \'color\': \'red\',\n        \'behavior\': function (me) {\n            var move = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, or 4\n            if (move == 1) {\n                moveToParent(\'adversary\');\n            } else if (move == 2) {\n                moveToFirstChild(\'adversary\');\n            } else if (move == 3) {\n                moveToPreviousSibling(\'adversary\');\n            } else if (move == 4) {\n                moveToNextSibling(\'adversary\');\n            }\n        }\n    });\n\n    map.placePlayer(1, 1);\n    map.placeObject(map.getWidth() - 2, map.getHeight() - 2, \'adversary\');\n\n    map.createFromDOM($dom);\n#END_OF_START_LEVEL#\n}\n ', 
    'levels/20_bossFight.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "commandsIntroduced":\n        ["object.onDestroy", "object.projectile",\n         "map.countObjects", "map.isStartOfLevel",\n         "map.validateAtMostXDynamicObjects", "map.validateNoTimers"],\n	"music": "Adversity",\n    "mapProperties": {\n        "refreshRate": 50,\n        "quickValidateCallback": true\n    }\n}\n#END_PROPERTIES#\n\n/*****************\n * bossFight.js *\n *****************\n *\n * NO FARTHER, DR. EVAL!!!!\n * YOU WILL NOT GET OUT OF HERE ALIVE!!!!\n * IT\'S TIME YOU SEE MY TRUE FORM!!!!\n * FACE MY ROBOT WRATH!!!!!\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n	map.defineObject(\'boss\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'⊙\',\n        \'color\': \'red\',\n        \'interval\': 200,\n        \'onCollision\': function (player) {\n            player.killedBy(\'the boss\');\n        },\n        \'behavior\': function (me) {\n        	if (!me.direction) {\n        		me.direction = \'right\';\n        	}\n        	if (me.canMove(me.direction)) {\n            	me.move(me.direction);\n        	} else {\n        		me.direction = (me.direction == \'right\') ? \'left\' : \'right\';\n        	}\n        	if (Math.random() < 0.3) {\n            	map.placeObject(me.getX(), me.getY() + 2, \'bullet\');\n        	}\n        },\n        \'onDestroy\': function (me) {\n            if (map.countObjects(\'boss\') == 0) {\n                map.placeObject(me.getX(), me.getY(), \'theAlgorithm\');\n            }\n        }\n    });\n\n    map.defineObject(\'bullet\', {\n        \'type\': \'dynamic\',\n        \'symbol\': \'.\',\n        \'color\': \'red\',\n        \'interval\': 100,\n        \'projectile\': true,\n        \'behavior\': function (me) {\n            me.move(\'down\');\n        }\n    });\n\n    map.placePlayer(0, map.getHeight() - 3);\n    map.placeObject(map.getWidth() - 1, map.getHeight() - 1, \'exit\');\n\n    // Not so tough now, huh?\n    map.getPlayer().removeItem(\'phone\');\n    map.placeObject(map.getWidth() - 1, map.getHeight() - 3, \'phone\');\n\n    map.placeObject(0, map.getHeight() - 4, \'block\');\n    map.placeObject(1, map.getHeight() - 4, \'block\');\n    map.placeObject(2, map.getHeight() - 4, \'block\');\n    map.placeObject(2, map.getHeight() - 3, \'block\');\n    map.placeObject(map.getWidth() - 1, map.getHeight() - 4, \'block\');\n    map.placeObject(map.getWidth() - 2, map.getHeight() - 4, \'block\');\n    map.placeObject(map.getWidth() - 3, map.getHeight() - 4, \'block\');\n    map.placeObject(map.getWidth() - 3, map.getHeight() - 3, \'block\');\n\n    for (var x = 0; x < map.getWidth(); x++) {\n        map.placeObject(x, 4, \'block\');\n    }\n\n    map.placeObject(9, 5, \'boss\');\n    map.placeObject(11, 5, \'boss\');\n    map.placeObject(13, 5, \'boss\');\n    map.placeObject(15, 5, \'boss\');\n    map.placeObject(17, 5, \'boss\');\n    map.placeObject(19, 5, \'boss\');\n    map.placeObject(21, 5, \'boss\');\n    map.placeObject(23, 5, \'boss\');\n    map.placeObject(25, 5, \'boss\');\n    map.placeObject(27, 5, \'boss\');\n    map.placeObject(29, 5, \'boss\');\n    map.placeObject(31, 5, \'boss\');\n\n    map.placeObject(10, 6, \'boss\');\n    map.placeObject(12, 6, \'boss\');\n    map.placeObject(14, 6, \'boss\');\n    map.placeObject(16, 6, \'boss\');\n    map.placeObject(18, 6, \'boss\');\n    map.placeObject(20, 6, \'boss\');\n    map.placeObject(22, 6, \'boss\');\n    map.placeObject(24, 6, \'boss\');\n    map.placeObject(26, 6, \'boss\');\n    map.placeObject(28, 6, \'boss\');\n    map.placeObject(30, 6, \'boss\');\n\n#BEGIN_EDITABLE#\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n#END_EDITABLE#\n\n#END_OF_START_LEVEL#\n}\n\nfunction validateLevel(map) {\n    // called at start of level and whenever a callback executes\n    map.validateAtMostXObjects(59, \'block\');\n    map.validateAtMostXObjects(1, \'phone\');\n\n    if (map.countObjects(\'theAlgorithm\') > 0 && map.countObjects(\'boss\') > 0) {\n        throw "The Algorithm can only be dropped by the boss!";\n    }\n\n    // only called at start of level\n    if (map.isStartOfLevel()) {\n        map.validateAtMostXDynamicObjects(23);\n        map.validateNoTimers();\n    }\n}\n\nfunction onExit(map) {\n    if (!map.getPlayer().hasItem(\'theAlgorithm\')) {\n        map.writeStatus("You must take back the Algorithm!!");\n        return false;\n    } else if (!map.getPlayer().hasItem(\'phone\')) {\n        map.writeStatus("We need the phone!");\n        return false;\n    } else {\n        return true;\n    }\n}\n ', 
    'levels/21_endOfTheLine.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2",\n    "music": "Comme Des Orages"\n}\n#END_PROPERTIES#\n\n/*******************\n * endOfTheLine.js *\n *******************\n *\n * I don\'t feel guilty at all, Cornelius.\n *\n * Did you really expect me to? Did you really think that\n * you could be trusted with coauthorship on the paper that\n * would prove P = NP in the eyes of the world?\n *\n * You\'re a very pure researcher, my good Doctor. "Department\n * of Theoretical Computation", divorced from the realities\n * of the world. I don\'t think you ever considered the\n * implications - the *physical* implications - of the\n * Algorithm. What humanity might do if it was as easy to\n * solve an intractable puzzle as it was to conceive of it.\n *\n * We would become as unto Gods, Cornelius, if this knowledge\n * was public. Immature children wielding power unimaginable.\n * We\'ve already had one Oppenheimer - we don\'t need Dr.\n * Cornelius Eval to be another.\n *\n * If I had succeeded the Algorithm would be safe and secure\n * in the hands of those with the sound judgement and sense\n * of responsibility to use it wisely. I pray my failure\n * will not doom mankind - but I cannot hope so\n * optimistically.\n *\n * You may have defeated my robot form, but I anticipated\n * this eventuality. The Algorithm must never leave the\n * Machine Continuum. And so neither can you.\n *\n * This is bigger than me and bigger than you. I have no\n * regrets. I would do it again in an instant.\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    map.finalLevel = true;\n    map.placePlayer(15, 12);\n    map.placeObject(25, 12, \'exit\');\n#END_OF_START_LEVEL#\n}\n ', 
    'levels/22_credits.jsx': '#BEGIN_PROPERTIES#\n{\n    "version": "1.2.1",\n    "music": "Brazil"\n}\n#END_PROPERTIES#\n/**************\n * credits.js *\n *************\n *\n * Congratulations! Dr. Eval has successfully escaped from the\n * Machine Continuum with the Algorithm in hand.\n *\n * Give yourself a pat on the back. You are one clever hacker.\n *\n *\n *\n * Hungry for more?\n *\n * Check out Untrusted\'s github repository at\n *      https://github.com/AlexNisnevich/untrusted\n *\n * Perhaps try your hand at making your own level or two!\n *\n * Like what you\'ve been hearing? You can listen to the full\n * soundtrack at\n *      https://soundcloud.com/untrusted\n *\n * Feel free to drop us a line at [\n *      \'alex [dot] nisnevich [at] gmail [dot] com\',\n *      \'greg [dot] shuflin [at] gmail [dot] com\'\n * ]\n *\n * Once again, congratulations!\n *\n *             -- Alex and Greg\n */\n\nfunction startLevel(map) {\n#START_OF_START_LEVEL#\n    var credits = [\n        [15, 1, "U N T R U S T E D"],\n        [20, 2, "- or -"],\n        [5, 3, "THE CONTINUING ADVENTURES OF DR. EVAL"],\n        [1, 4, "{"],\n        [2, 5, "a_game_by: \'Alex Nisnevich and Greg Shuflin\',"],\n        [2, 7, "special_thanks_to: {"],\n        [5, 8, "Dmitry_Mazin: [\'design\', \'code\'],"],\n        [5, 9, "Jordan_Arnesen: [\'levels\', \'playtesting\'],"],\n        [5, 10, "Natasha_HullRichter: [\'levels\',\'playtesting\']"],\n        [2, 11, "},"],\n        [2, 13, "music_by: "],\n        [4, 14, "[\'Jonathan Holliday\',"],\n        [5, 15, "\'Dmitry Mazin\',"],\n        [5, 16, "\'Revolution Void\',"],\n        [5, 17, "\'Fex\',"],\n        [5, 18, "\'iNTRICATE\',"],\n        [5, 19, "\'Tortue Super Sonic\',"],\n        [5, 20, "\'Broke For Free\',"],\n        [5, 21, "\'Sycamore Drive\',"],\n        [5, 22, "\'Eric Skiff\'],"],\n        [30, 14, "\'Mike and Alan\',"],\n        [30, 15, "\'RoccoW\',"],\n        [30, 16, "\'That Andy Guy\',"],\n        [30, 17, "\'Obsibilo\',"],\n        [30, 18, "\'BLEO\',"],\n        [30, 19, "\'Rolemusic\',"],\n        [30, 20, "\'Seropard\',"],\n        [30, 21, "\'Vernon Lenoir\',"],\n        [15, map.getHeight() - 2, "Thank_you: \'for playing!\'"],\n        [1, map.getHeight() - 1, "}"]\n    ];\n\n    function drawCredits(i) {\n        if (i >= credits.length) {\n            return;\n        }\n\n        // redraw lines bottom to top to avoid cutting off letters\n        for (var j = i; j >= 0; j--) {\n            var line = credits[j];\n            map._display.drawText(line[0], line[1], line[2]);\n        }\n\n        map.timeout(function () {drawCredits(i+1);}, 2000)\n    }\n\n    map.timeout(function () {drawCredits(0);}, 4000);\n\n#END_OF_START_LEVEL#\n}\n ', 
}

const verbotenWords = [
    'eval', '.call', 'call(', 'apply', 'bind', // prevents arbitrary code execution
    'prototype', // prevents messing with prototypes
    'setTimeout', 'setInterval', // requires players to use map.startTimer() instead
    'requestAnimationFrame', 'mozRequestAnimationFrame', // (more timeout-like methods)
    'webkitRequestAnimationFrame', 'setImmediate', // (more timeout-like methods)
    'prompt', 'confirm', // prevents dialogs asking for user input
    'debugger', // prevents pausing execution
    'delete', // prevents removing items
    'atob(','btoa(',//prevent bypassing checks using Base64
    'Function(', //prevent constructing arbitrary function
    'constructor', // prevents retrieval of Function using an instance of it
    'window', // prevents setting "window.[...] = map", etc.
    'document', // in particular, document.write is dangerous
    'self.', 'self[', 'top.', 'top[', 'frames',  // self === top === frames === window
    'parent', 'content', // parent === content === window in most of cases
    'validate', 'onExit', 'objective', // don't let players rewrite these methods
    'this[' // prevents this['win'+'dow'], etc.
];

export const DummyDisplay = function () {
    this.clear = function () {};
    this.drawAll = function () {};
    this.drawObject = function () {};
    this.drawText = function () {};
    this.writeStatus = function () {};
};

export function validate (allCode, playerCode, restartingLevelFromScript, g) {
    var game = g;

    try {
        for (var i = 0; i < verbotenWords.length; i++) {
            var badWord = verbotenWords[i];
            if (playerCode.indexOf(badWord) > -1) {
                throw "You are not allowed to use '" + badWord + "'!";
            }
        }

        var dummyMap = new GameMap(new DummyDisplay(), this);
        dummyMap._dummy = true;
        dummyMap._setProperties(this.editor.getProperties().mapProperties);

        // modify the code to always check time to prevent infinite loops
        allCode = allCode.replace(/\)\s*{/g, ") {"); // converts Allman indentation -> K&R
        allCode = allCode.replace(/\n\s*while\s*\((.*)\)/g, "\nfor (dummy=0;$1;)"); // while -> for
        allCode = $.map(allCode.split('\n'), function (line, i) {
            return line.replace(/for\s*\((.*);(.*);(.*)\)\s*{/g,
                "for ($1, startTime = Date.now();$2;$3){" +
                    "if (Date.now() - startTime > " + game.allowedTime + ") {" +
                        "throw '[Line " + (i+1) + "] TimeOutException: Maximum loop execution time of " + game.allowedTime + " ms exceeded.';" +
                    "}");
        }).join('\n');

        if (this._debugMode) {
            console.log(allCode);
        }

        // evaluate the code to get startLevel() and (opt) validateLevel() methods

        this._eval(allCode);

        // start the level on a dummy map to validate
        this._setPlayerCodeRunning(true);
        startLevel(dummyMap);
        this._setPlayerCodeRunning(false);

        // re-run to check if the player messed with startLevel
        this._startOfStartLevelReached = false;
        this._endOfStartLevelReached = false;
        dummyMap._reset();
        startLevel(dummyMap);

        // does startLevel() execute fully?
        // (if we're restarting a level after editing a script, we can't test for this
        // - nor do we care)
        if (!this._startOfStartLevelReached && !restartingLevelFromScript) {
            throw 'startLevel() has been tampered with!';
        }
        if (!this._endOfStartLevelReached && !restartingLevelFromScript) {
            throw 'startLevel() returned prematurely!';
        }

        // has the player tampered with any functions?
        this.detectTampering(dummyMap, dummyMap.getPlayer());

        this.validateLevel = function () { return true; };
        // does validateLevel() succeed?
        if (typeof(validateLevel) === "function") {
            this.validateLevel = validateLevel;
            validateLevel(dummyMap);
        }

        this.onExit = function () { return true; };
        if (typeof onExit === "function") {
            this.onExit = onExit;
        }

        this.objective = function () { return false; };
        if (typeof objective === "function") {
            this.objective = objective;
        }

        return startLevel;
    } catch (e) {
        // cleanup
        //this._setPlayerCodeRunning(false);

        var exceptionText = e.toString();
        if (e instanceof SyntaxError) {
            var lineNum = this.findSyntaxError(allCode, e.message);
            if (lineNum) {
                exceptionText = "[Line " + lineNum + "] " + exceptionText;
            }
        }
        this.display.appendError(exceptionText);

        // throw e; // for debugging
        return null;
    }
};

