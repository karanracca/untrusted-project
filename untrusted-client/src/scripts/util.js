
export function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export class DummyDisplay {
    constructor() {}
    clear () {};
    drawAll () {};
    drawObject () {};
    drawText () {};
    writeStatus () {};
};

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
                //TODO
                // $('#editorPane').fadeIn();
                // game.editor.refresh();
                // game.map.writeStatus('You have picked up the computer!');
                console.log("Picked up computer");
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

