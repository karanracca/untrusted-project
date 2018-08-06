export default class DynamicObject {
    
    constructor(map, type, x, y, __game) {
        this.__x = x;
        this.__y = y;
        this.__type = type;
        this.__definition = __game.callUnexposedMethod(function () {
            return map.getObjectDefinition(type);
        });
        this.__inventory = [];
        this.__destroyed = false;
        this.__myTurn = true;
        this.__timer = null;
        this._map = map;
        this.__game = __game;

        // constructor
        if (!map._dummy && this.__definition.interval) {
            this._onTurn();
        }
    }

    _computeDestination (startX, startY, direction) {
        if (this.__game.isPlayerCodeRunning) { throw 'Forbidden method call: object._computeDestination()';}

        switch (direction) {
            case 'up':
                return {'x': startX, 'y': startY - 1};
            case 'down':
                return {'x': startX, 'y': startY + 1};
            case 'left':
                return {'x': startX - 1, 'y': startY};
            case 'right':
                return {'x': startX + 1, 'y': startY};
            default:
                return {'x': startX, 'y': startY};
        }
    };

    _onTurn () {
        if (this.__game.isPlayerCodeRunning) { throw 'Forbidden method call: object._onTurn()';}

        let me = this;
        let player = this._map.player;

        function executeTurn() {
            this.__myTurn = true;
            try {
                //we need to check for a collision with the player *after*
                //the player has moved but *before* the object itself moves
                //this prevents a bug where players and objects can 'pass through'
                //each other
                if (this.__x === player.getX() && this.__y === player.getY()) {
                    if (this.__definition.pushable) {
                        me.move(player.getLastMoveDirection());
                    }
                    if (this.__definition.onCollision) {
                        this._map._validateCallback(function () {
                            this.__definition.onCollision(player, me);
                        });
                    }
                }

                if (this.__myTurn && this.__definition.behavior) {
                    this._map._validateCallback(function () {
                        this.__definition.behavior(me, player);
                    }.bind(this));
                }
            } catch (e) {
                // throw e; // for debugging
                this._map.writeStatus(e.toString());
            }
        }

        if (this.__definition.interval) {
            // start timer if not already set
            if (!this.__timer) {
                this.__timer = setInterval(executeTurn, this.__definition.interval);
            }

            // don't move on regular turn, but still check for player collision
            if (map.player.atLocation(this.__x, this.__y) &&
                    (this.__definition.onCollision || this.__definition.projectile)) {
                // trigger collision
                if (this.__definition.projectile) {
                    // projectiles automatically kill
                    map.player.killedBy('a ' + this.__type);
                } else {
                    map._validateCallback(function () {
                        this.__definition.onCollision(map.getPlayer(), this);
                    });
                }
            }
        } else {
            executeTurn.call(this);
        }
    };

    _afterMove () {
        if (this.__game.isPlayerCodeRunning) { throw 'Forbidden method call: object._afterMove()';}

        // try to pick up items
        let objectName = this._map._grid[this.__x][this.__y].type;
        let object = this._map.getObjectDefinition(objectName);
        if (object.type === 'item' && !this.__definition.projectile) {
            this.__inventory.push(objectName);
            this._map._removeItemFromMap(this.__x, this.__y, objectName);
            //map._playSound('pickup');
        } else if (object.type === 'trap') {
            // this part is used by janosgyerik's bonus levels
            if (object.deactivatedBy && object.deactivatedBy.indexOf(this.__type) > -1) {
                if (typeof(object.onDeactivate) === 'function') {
                    object.onDeactivate();
                }
                this._map._removeItemFromMap(this.__x, this.__y, objectName);
            }
        }
    };

    _destroy (onMapReset) {
        if (this.__game.isPlayerCodeRunning) { throw 'Forbidden method call: object._destroy()';}

        let me = this;

        this.__destroyed = true;
        clearInterval(this.__timer);

        // remove this object from map's __dynamicObjects list
        this._map._refreshDynamicObjects();

        // unless the map is being reset, play an explosion
        // and call this object's onDestroy method
        if (this.__definition.onDestroy && !onMapReset) {
            if (!this.__definition.projectile) {
                //map._playSound('explosion');
            }

            this._map._validateCallback(function () {
                this.__definition.onDestroy(me);
            });
        }
    };

    /* exposed methods */

    getX () { return this.__x; };
    getY () { return this.__y; };
    getType () { return this.__type; };
    isDestroyed () { return this.__destroyed; };

    giveItemTo (player, itemType) {
        let pl_at = player.atLocation;

        if (!(pl_at(this.__x, this.__y) || pl_at(this.__x+1, this.__y) || pl_at(this.__x-1, this.__y) ||
                pl_at(this.__x, this.__y+1) || pl_at(this.__x, this.__y-1))) {
            throw (type + ' says: Can\'t give an item unless I\'m touching the player!');
        }
        if (this.__inventory.indexOf(itemType) < 0) {
            throw (type + ' says: I don\'t have that item!');
        }

        player._pickUpItem(itemType, map.getObjectDefinition(itemType));
    };

    move (direction) {
        let dest = this._computeDestination(this.__x, this.__y, direction);

        if (!this.__myTurn) {
            throw 'Can\'t move when it isn\'t your turn!';
        }

        let nearestObj = this._map._findNearestToPoint("anyDynamic", dest.x, dest.y);

        // check for collision with player
        if (this._map.player.atLocation(dest.x, dest.y) &&
                (this.__definition.onCollision || this.__definition.projectile)) {
            // trigger collision
            if (this.__definition.projectile) {
                // projectiles automatically kill
                this._map.player.killedBy('a ' + this.__type);
            } else {
                this.__definition.onCollision(this._map.player, this);
            }
        } else if (this._map._canMoveTo(dest.x, dest.y, this.__type) &&
                !this._map._isPointOccupiedByDynamicObject(dest.x, dest.y)) {
            // move the object
            this.__x = dest.x;
            this.__y = dest.y;
            this._afterMove(this.__x, this.__y);
        } else {
            // cannot move
            if (this.__definition.projectile) {
                // projectiles disappear when they cannot move
                this._destroy();

                // projectiles also destroy any dynamic objects they touch
                if (this._map._isPointOccupiedByDynamicObject(dest.x, dest.y)) {
                    this._map._findDynamicObjectAtPoint(dest.x, dest.y)._destroy();
                }
            }
        }

        this.__myTurn = false;
    };

    canMove (direction) {
        let dest = this._computeDestination(this.__x, this.__y, direction);

        // check if the object can move there and will not collide with
        // another dynamic object
        return (this._map._canMoveTo(dest.x, dest.y, this.__type) &&
            !this._map._isPointOccupiedByDynamicObject(dest.x, dest.y));
    };

    findNearest (type) {
        return this._map._findNearestToPoint(type, this.__x, this.__y);
    };

    // only for teleporters
    setTarget (target) {
        if (this.__type != 'teleporter') {
            throw 'setTarget() can only be called on a teleporter!';
        }

        if (target === this) {
            throw 'Teleporters cannot target themselves!';
        }

        this.target = target;
    };
}