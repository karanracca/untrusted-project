import * as util from './util';
import * as config from './config';
import GameMap from './map';

export default function Validate(allCode, playerCode, restartingLevelFromScript, g) {

    let game = g;

    try {
        for (var i = 0; i < config.verbotenWords.length; i++) {
            var badWord = config.verbotenWords[i];
            if (playerCode.indexOf(badWord) > -1) {
                throw "You are not allowed to use '" + badWord + "'!";
            }
        }

        let dummyMap = new GameMap(new util.DummyDisplay, game);
        dummyMap._dummy = true;
        dummyMap.setProperties(game.editor.getProperties().mapProperties);

        // modify the code to always check time to prevent infinite loops
        allCode = allCode.replace(/\)\s*{/g, ") {"); // converts Allman indentation -> K&R
        allCode = allCode.replace(/\n\s*while\s*\((.*)\)/g, "\nfor (dummy=0;$1;)"); // while -> for
        allCode = allCode.split('\n').map(function (line, i) {
            return line.replace(/for\s*\((.*);(.*);(.*)\)\s*{/g,
                "for ($1, startTime = Date.now();$2;$3){" +
                "if (Date.now() - startTime > " + game.allowedTime + ") {" +
                "throw '[Line " + (i + 1) + "] TimeOutException: Maximum loop execution time of " + game.allowedTime + " ms exceeded.';" +
                "}");
        }).join('\n');
        allCode = allCode.replace(/\\/g, "")

        // evaluate the code to get startLevel() and (opt) validateLevel() methods
        window.eval(allCode);

        // start the level on a dummy map to validate
        game._setPlayerCodeRunning = true;
        window.startLevel(dummyMap);
        game._setPlayerCodeRunning = false;

        if (typeof (window.validateLevel) === "function") {
            //this.validateLevel = validateLevel;
            window.validateLevel(dummyMap);
        }

        return window.startLevel;
    } catch (e) {
        throw e;
    }
};