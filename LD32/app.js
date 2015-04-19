var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var vec2 = (function () {
    function vec2(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    vec2.prototype.copy = function () {
        return new vec2(this.x, this.y);
    };
    return vec2;
})();
var game;
var keys = {};
var pressed = {};
var combo = 0;
var comboTimeLeft = -1;
var score = 0;
var nextScore = 0;
var addScore = 0;
var lastScore = 0;
function angleToNumber(a) {
    var i = Math.floor(((a % (Math.PI * 2)) + Math.PI / 8) / Math.PI / 2 * 8);
    var mapping = {
        '-1': 6,
        0: 2,
        1: 5,
        2: 1,
        3: 7,
        4: 4,
        5: 8,
        6: 3,
        7: 6,
        8: 2
    };
    return mapping[i];
}
var Entity = (function () {
    function Entity() {
        this.isDead = false;
        this.collides = true;
        this.a = 0;
    }
    Entity.prototype.draw = function () {
        if (this.p.x + this.r < 0 || this.p.x - this.r > game.canvas.width || this.p.y + this.r < -1000 || this.p.y - this.r > game.canvas.height)
            this.isDead = true;
        if (this.image) {
            var name = this.image();
            var image = game.images[name];
            if (image) {
                game.ctx.drawImage(image, this.p.x - this.r * 5, this.p.y - this.r * 5, this.r * 2 * 5, this.r * 2 * 5);
                return;
            }
        }
        game.box(this.r * 2, this.r * 2, this.color, this.p, this.a);
    };
    Entity.prototype.collidedWith = function (e) {
    };
    Entity.prototype.explode = function (size) {
        if (size === void 0) { size = 2.5; }
        if (this.isDead)
            return;
        game.entities.push(new Explosion(this.p, this.r * size));
        this.isDead = true;
    };
    return Entity;
})();
var Star = (function (_super) {
    __extends(Star, _super);
    function Star() {
        _super.call(this);
        this.collides = false;
        this.p = new vec2(Math.random() * game.canvas.width, Math.random() * game.canvas.height);
        this.r = 1;
        var level = Math.random();
        if (level < .3) {
            this.speed = Math.random() * .1 + .7;
            this.color = "#333";
        }
        else if (level < .6) {
            this.speed = Math.random() * .1 + .9;
            this.color = "#696969";
        }
        else if (level < 1) {
            this.speed = Math.random() * .1 + 1;
            this.color = "#999";
        }
    }
    Star.prototype.draw = function () {
        game.ctx.fillStyle = this.color;
        game.ctx.fillRect(this.p.x, this.p.y, 2, 2);
        this.p.y += this.speed;
        if (this.p.y > game.canvas.height)
            this.p.y -= game.canvas.height;
    };
    return Star;
})(Entity);
var Explosion = (function (_super) {
    __extends(Explosion, _super);
    function Explosion(p, r) {
        _super.call(this);
        this.p = p;
        this.r = r;
        this.startFrame = game.nFrame;
        this.color = "#FF8800";
    }
    Explosion.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (game.nFrame - this.startFrame > 30)
            this.isDead = true;
    };
    Explosion.prototype.collidedWith = function (e) {
        if ((e instanceof Enemy && !e.flying) || e instanceof Player)
            e.explode();
    };
    return Explosion;
})(Entity);
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this);
        this.flyingFor = 0;
        this.v = new vec2(0, 0);
        this.value = 10;
        this.p = new vec2(Math.random() * game.canvas.width, -50);
        this.r = 10;
        this.color = "#FF0000";
        this.a = Math.random() * Math.PI * 2;
        if (Math.random() < .1) {
            this.value *= 5;
            this.v.x = Math.random() > .5 ? 1.5 : -1.5;
        }
        if (Math.random() < .02) {
            this.value *= 10;
            this.v.y = 2;
        }
        var enemy = this;
        this.image = function () {
            var pref = 'armdown';
            if (enemy.flying)
                pref = 'out';
            return 'redCharacter_' + pref + angleToNumber(enemy.a) + '.png';
        };
    }
    Enemy.prototype.draw = function () {
        if (player.grabbed == this)
            return;
        _super.prototype.draw.call(this);
        var n = new vec2(this.p.x + Math.cos(this.a) * 20, this.p.y + Math.sin(this.a) * 20);
        // game.line([this.p, n], "#FFFFFF", false);
        if (this.flying) {
            this.p.x += this.flying.x;
            this.p.y += this.flying.y;
            this.flyingFor++;
            // if (this.flyingFor > 120)
            //     this.explode(4);
            this.a += .2;
        }
        else {
            this.p.y += this.v.y || 2;
            this.p.x += this.v.x;
            if (this.p.x + this.r * 2 > game.canvas.width || this.p.x - this.r * 2 < 0)
                this.v.x *= -1;
            if (this.v.y)
                if (this.p.y + this.r * 2 > game.canvas.height || this.p.y - this.r * 2 < 0)
                    this.v.y *= -1;
            this.a += .02;
            if (this.p.y > game.canvas.height)
                this.isDead = true;
            if (game.nFrame % 50 == 0) {
                game.entities.push(new Bullet(this.p.copy(), this.a, 1.5));
            }
        }
    };
    Enemy.prototype.collidedWith = function (e) {
        if (e instanceof Enemy && !e.flying) {
            e.explode();
            if (this.flying) {
                this.value *= 10;
                this.flying.x *= -1;
            }
        }
    };
    Enemy.prototype.explode = function (size) {
        if (size === void 0) { size = 2.5; }
        _super.prototype.explode.call(this, size);
        nextScore += this.value;
        combo++;
        comboTimeLeft = 30;
    };
    return Enemy;
})(Entity);
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet(p, a, speed, r) {
        if (r === void 0) { r = 2; }
        _super.call(this);
        this.p = p;
        this.a = a;
        this.speed = speed;
        this.r = r;
    }
    Bullet.prototype.draw = function () {
        _super.prototype.draw.call(this);
        this.p.x += Math.cos(this.a) * this.speed;
        this.p.y += Math.sin(this.a) * this.speed;
        _super.prototype.draw.call(this);
    };
    return Bullet;
})(Entity);
var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        _super.call(this);
        this.charging = false;
        this.aim = -Math.PI / 2;
        this.aimDir = -.01;
        player = this;
        this.p = new vec2(game.canvas.width / 2, game.canvas.height * 3 / 4);
        this.r = 8;
        // this.color = "#00FF00";
        this.image = function () {
            if (player.charging)
                return 'character_attack1.png';
            if (player.grabbed)
                return 'character_attack3.png';
            return 'character_armdown3.png';
        };
    }
    Player.prototype.draw = function () {
        if (!this.charging) {
            if (keys[38])
                this.p.y -= 5;
            if (keys[40])
                this.p.y += 5;
            if (keys[37])
                this.p.x -= 5;
            if (keys[39])
                this.p.x += 5;
            if (pressed[32] && !this.grabbed) {
                this.charging = true;
                delete pressed[32];
            }
        }
        else {
            this.p.y += 20;
            if (this.p.y + this.r * 2 > game.canvas.height) {
                this.charging = false;
                this.p.y = game.canvas.height - this.r * 2;
            }
        }
        if (this.grabbed) {
            this.grabbed.p.x = this.p.x;
            this.grabbed.a = Math.PI / 2 * 3;
            this.grabbed.p.y = this.p.y - this.r - this.grabbed.r;
            _super.prototype.draw.call(this.grabbed);
            this.aim += this.aimDir;
            if (Math.abs(this.aim + Math.PI / 2) > .45)
                this.aimDir = -this.aimDir;
            var d = this.p.copy();
            d.x += Math.cos(this.aim) * 40;
            d.y += Math.sin(this.aim) * 40;
            game.line([this.p, d], "#FFFFFF", false);
            if (pressed[32]) {
                delete pressed[32];
                this.grabbed.flying = new vec2(Math.cos(this.aim + this.aimDir * 2) * 5, Math.sin(this.aim + this.aimDir * 2) * 5);
                this.grabbed = undefined;
            }
        }
        else
            this.aim = -Math.PI / 2;
        if (this.p.x - this.r < 0)
            this.p.x = this.r;
        if (this.p.x + this.r > game.canvas.width)
            this.p.x = game.canvas.width - this.r;
        if (this.p.y - this.r < 0)
            this.p.y = this.r;
        if (this.p.y + this.r > game.canvas.height)
            this.p.y = game.canvas.height - this.r;
        _super.prototype.draw.call(this);
    };
    Player.prototype.collidedWith = function (e) {
        if (e == this.grabbed)
            return;
        if (!this.charging) {
            if (e instanceof Enemy && !e.flying) {
                this.explode();
                e.explode();
            }
            if (e instanceof Bullet) {
                this.explode();
            }
        }
        else {
            if (!this.grabbed)
                if (e instanceof Enemy) {
                    this.grabbed = e;
                }
            if (e instanceof Bullet)
                e.isDead = true;
        }
    };
    return Player;
})(Entity);
var player;
var Game = (function () {
    function Game() {
        this.entities = new Array();
        this.nFrame = 0;
        this.images = {};
        this.neededImages = 0;
        this.loadedImages = 0;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        game = this;
    }
    Game.prototype.needImage = function (name) {
        var image = new Image();
        image.onload = function () {
            game.images[name] = image;
            game.loadedImages++;
        };
        image.src = name;
    };
    Game.prototype.line = function (points, color, close, p, angle) {
        if (close === void 0) { close = true; }
        if (p === void 0) { p = new vec2(0, 0); }
        if (angle === void 0) { angle = 0; }
        this.ctx.strokeStyle = color;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        if (close)
            this.ctx.lineTo(points[0].x, points[0].y);
        this.ctx.stroke();
        this.ctx.restore();
    };
    Game.prototype.box = function (w, h, color, p, angle) {
        if (p === void 0) { p = new vec2(0, 0); }
        if (angle === void 0) { angle = 0; }
        this.line([new vec2(-w / 2, -h / 2), new vec2(-w / 2, h / 2), new vec2(w / 2, h / 2), new vec2(w / 2, -h / 2)], color, true, p, angle);
    };
    Game.prototype.start = function () {
        var _this = this;
        this.entities.push(new Player());
        window.onkeydown = function (e) {
            keys[e.keyCode] = true;
            pressed[e.keyCode] = true;
            e.preventDefault();
        };
        window.onkeyup = function (e) {
            delete keys[e.keyCode];
            e.preventDefault();
        };
        var enemies = 0;
        var spawn = function () {
            game.entities.push(new Enemy());
            setTimeout(spawn, Math.random() * 1000 + 1000 - enemies);
            enemies++;
        };
        spawn();
        for (var i = 0; i < 100; i++)
            game.entities.push(new Star());
        for (var i = 1; i <= 8; i++) {
            game.needImage('character_attack' + i + '.png');
            game.needImage('character_armdown' + i + '.png');
            game.needImage('character_out' + i + '.png');
            game.needImage('redCharacter_attack' + i + '.png');
            game.needImage('redCharacter_armdown' + i + '.png');
            game.needImage('redCharacter_out' + i + '.png');
        }
        while (game.neededImages != game.loadedImages)
            ;
        this.timerToken = setInterval(function () { return _this.draw(); }, 21);
    };
    Game.prototype.stop = function () {
        clearTimeout(this.timerToken);
    };
    Game.prototype.draw = function () {
        if (addScore > 0) {
            var change = Math.floor(Math.max(Math.floor(lastScore / 40), 1));
            score += change;
            addScore -= change;
        }
        else
            lastScore = 0;
        if (comboTimeLeft > 0)
            comboTimeLeft--;
        if (comboTimeLeft == 0) {
            addScore += Math.floor(nextScore * combo);
            lastScore = addScore;
            nextScore = 0;
            combo = 0;
            comboTimeLeft = -1;
        }
        document.getElementById('score').innerHTML = "" + score;
        document.getElementById('addScore').innerHTML = "" + (addScore > 0 ? (" +" + addScore) : "");
        document.getElementById('nextScore').innerHTML = "" + (nextScore > 0 ? ("+" + nextScore) : "");
        document.getElementById('combo').innerHTML = "" + (combo > 1 ? (" x" + combo) : "");
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.entities.forEach(function (entity) {
            entity.draw();
        });
        var entities = this.entities.slice();
        for (var i = 0; i < entities.length; i++) {
            var a = entities[i];
            if (!a.collides)
                continue;
            if (typeof a.flying != 'undefined')
                a.r *= 3.5;
            for (var j = i + 1; j < entities.length; j++) {
                var b = entities[j];
                if (!b.collides)
                    continue;
                if (typeof b.flying != 'undefined')
                    b.r *= 3.5;
                if ((a.p.x - b.p.x) * (a.p.x - b.p.x) + (a.p.y - b.p.y) * (a.p.y - b.p.y) < (a.r + b.r) * (a.r + b.r)) {
                    a.collidedWith(b);
                    b.collidedWith(a);
                }
                if (typeof b.flying != 'undefined')
                    b.r /= 3.5;
            }
            if (typeof a.flying != 'undefined')
                a.r /= 3.5;
        }
        this.entities.slice().forEach(function (entity) {
            if (entity.isDead)
                this.entities.splice(this.entities.indexOf(entity), 1);
        }, this);
        this.nFrame++;
    };
    return Game;
})();
window.onload = function () {
    var greeter = new Game();
    greeter.start();
};
//# sourceMappingURL=app.js.map