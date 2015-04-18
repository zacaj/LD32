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

var Entity = (function () {
    function Entity() {
        this.isDead = false;
        this.a = 0;
    }
    Entity.prototype.draw = function () {
        game.box(this.r * 2, this.r * 2, this.color, this.p, this.a);
        if (this.p.x + this.r < 0 || this.p.x - this.r > game.canvas.width || this.p.y + this.r < -1000 || this.p.y - this.r > game.canvas.height)
            this.isDead = true;
    };
    Entity.prototype.collidedWith = function (e) {
    };
    Entity.prototype.explode = function () {
        game.entities.push(new Explosion(this.p, this.r * 2.5));
        this.isDead = true;
    };
    return Entity;
})();
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
        if (e instanceof Enemy || e instanceof Player)
            e.explode();
    };
    return Explosion;
})(Entity);
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this);
        this.p = new vec2(Math.random() * game.canvas.width, -50);
        this.r = 10;
        this.color = "#FF0000";
        this.a = Math.random() * Math.PI * 2;
    }
    Enemy.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (player.grabbed == this)
            return;
        this.p.y += 2.3;
        this.a += .03;
        if (this.p.y > game.canvas.height)
            this.isDead = true;
        if (game.nFrame % 50 == 0) {
            game.entities.push(new Bullet(this.p.copy(), this.a, 2));
        }
    };
    return Enemy;
})(Entity);
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet(p, a, speed, r) {
        if (typeof r === "undefined") { r = 2; }
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
        this.color = "#00FF00";
    }
    Player.prototype.draw = function () {
        _super.prototype.draw.call(this);
        if (!this.charging) {
            if (keys[38])
                this.p.y -= 5;
            if (keys[40])
                this.p.y += 5;
            if (keys[37])
                this.p.x -= 5;
            if (keys[39])
                this.p.x += 5;
            if (keys[32])
                this.charging = true;
            if (this.grabbed) {
                this.grabbed.p.x = this.p.x;
                this.grabbed.p.y = this.p.y - this.r - this.grabbed.r;
                this.aim += this.aimDir;
                if (Math.abs(this.aim + Math.PI / 2) > 1)
                    this.aimDir = -this.aimDir;
                var d = this.p.copy();
                d.x += Math.cos(this.aim) * 20;
                d.y += Math.sin(this.aim) * 20;
                game.line([this.p, d], "#FFFFFF", false);
            } else
                this.aim = -Math.PI / 2;
        } else {
            this.p.y += 20;
            if (this.p.y + this.r * 2 > game.canvas.height) {
                this.charging = false;
                this.p.y = game.canvas.height - this.r * 2;
            }
        }
    };
    Player.prototype.collidedWith = function (e) {
        if (e == this.grabbed)
            return;
        if (!this.charging) {
            if (e instanceof Enemy) {
                this.explode();
                e.explode();
            }
            if (e instanceof Bullet) {
                this.explode();
            }
        } else {
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
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        game = this;
    }
    Game.prototype.line = function (points, color, close, p, angle) {
        if (typeof close === "undefined") { close = true; }
        if (typeof p === "undefined") { p = new vec2(0, 0); }
        if (typeof angle === "undefined") { angle = 0; }
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
        if (typeof p === "undefined") { p = new vec2(0, 0); }
        if (typeof angle === "undefined") { angle = 0; }
        this.line([
            new vec2(-w / 2, -h / 2),
            new vec2(-w / 2, h / 2),
            new vec2(w / 2, h / 2),
            new vec2(w / 2, -h / 2)], color, true, p, angle);
    };

    Game.prototype.start = function () {
        var _this = this;
        this.timerToken = setInterval(function () {
            return _this.draw();
        }, 21);
        this.entities.push(new Player());
        window.onkeydown = function (e) {
            keys[e.keyCode] = true;
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
    };

    Game.prototype.stop = function () {
        clearTimeout(this.timerToken);
    };

    Game.prototype.draw = function () {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.entities.forEach(function (entity) {
            entity.draw();
        });
        var entities = this.entities.slice();
        for (var i = 0; i < entities.length; i++) {
            var a = entities[i];
            for (var j = i + 1; j < entities.length; j++) {
                var b = entities[j];
                if ((a.p.x - b.p.x) * (a.p.x - b.p.x) + (a.p.y - b.p.y) * (a.p.y - b.p.y) < (a.r + b.r) * (a.r + b.r)) {
                    a.collidedWith(b);
                    b.collidedWith(a);
                }
            }
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
