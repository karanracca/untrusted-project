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

        // evaluate the code to get startLevel() and (opt) validateLevel() methods
        //this._eval(allCode);
        
        window.eval(allCode);

        // // start the level on a dummy map to validate
        // game._setPlayerCodeRunning = true;
        // window.startLevel(dummyMap);
        // game._setPlayerCodeRunning = false;

        // // re-run to check if the player messed with startLevel
        // game._startOfStartLevelReached = false;
        // game._endOfStartLevelReached = false;
        // dummyMap.reset();
        // startLevel(dummyMap);

        // // does startLevel() execute fully?
        // //(if we're restarting a level after editing a script, we can't test for this - nor do we care)
        // if (!game._startOfStartLevelReached && !restartingLevelFromScript) {
        //      throw 'startLevel() has been tampered with!';
        // }
        // if (!this._endOfStartLevelReached && !restartingLevelFromScript) {
        //     throw 'startLevel() returned prematurely!';
        // }

        // // has the player tampered with any functions?
        // this.detectTampering(dummyMap, dummyMap.getPlayer());

        // this.validateLevel = function () { return true; };
        // // does validateLevel() succeed?
        // if (typeof(validateLevel) === "function") {
        //     this.validateLevel = validateLevel;
        //     validateLevel(dummyMap);
        // }

        // this.onExit = function () { return true; };
        // if (typeof onExit === "function") {
        //     this.onExit = onExit;
        // }

        // this.objective = function () { return false; };
        // if (typeof objective === "function") {
        //     this.objective = objective;
        // }

        return window.startLevel;
    } catch (e) {
        // cleanup
        //this._setPlayerCodeRunning(false);

        // var exceptionText = e.toString();
        // if (e instanceof SyntaxError) {
        //     var lineNum = this.findSyntaxError(allCode, e.message);
        //     if (lineNum) {
        //         exceptionText = "[Line " + lineNum + "] " + exceptionText;
        //     }
        // }
        // this.display.appendError(exceptionText);

        console.log(e);

        // throw e; // for debugging
        return null;
    }
};