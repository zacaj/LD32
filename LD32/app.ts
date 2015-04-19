class vec2 {
    x = 0;
    y = 0;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new vec2(this.x, this.y);
    }
}
var game: Game;
var keys = {};
var pressed = {};

var combo = 0;
var comboTimeLeft = -1;
var score = 0;
var nextScore = 0;
var addScore = 0;
var lastScore = 0;

function angleToNumber(a: number): number {
    var i = Math.floor(((a%(Math.PI*2))+Math.PI/8) / Math.PI / 2 * 8);
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
class Entity {
    isDead = false;
    color: string;
    p: vec2;
    collides = true;
    r: number;
    a: number = 0;
    image;
    draw() {
        if (this.p.x + this.r < 0 || this.p.x - this.r > game.canvas.width || this.p.y + this.r < -1000 || this.p.y - this.r > game.canvas.height)
            this.isDead = true;
        if (this.image) {
            var name = this.image();
            var image = game.images[name];
            if (image) {
                game.ctx.drawImage(image, this.p.x - this.r*5, this.p.y - this.r*5, this.r * 2*5, this.r * 2*5);
                return;
            }
        }
        game.box(this.r * 2, this.r * 2, this.color, this.p, this.a);
    }
    collidedWith(e: Entity) { }
    explode(size: number = 2.5) {
        if (this.isDead)
            return;
        game.entities.push(new Explosion(this.p, this.r * size));
        this.isDead = true;
    }
}
class Star extends Entity{
    speed: number;
    constructor() {
        super();
        this.collides = false;
        this.p = new vec2(Math.random() * game.canvas.width, Math.random()*game.canvas.height);
        this.r = 1;
        var level = Math.random();
        if (level < .3) {
            this.speed = Math.random()*.1+.7;
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
    draw() {
        game.ctx.fillStyle = this.color;
        game.ctx.fillRect(this.p.x, this.p.y, 2, 2);
        this.p.y += this.speed;
        if (this.p.y > game.canvas.height)
            this.p.y -= game.canvas.height;
    }
}
        
class Explosion extends Entity {
    startFrame: number;
    constructor(p: vec2, r: number) {
        super();
        this.p = p;
        this.r = r;
        this.startFrame = game.nFrame;
        this.color = "#FF8800";
    }
    draw() {
        super.draw();
        if (game.nFrame - this.startFrame > 30)
            this.isDead = true;
    }
    collidedWith(e: Entity) {
        if ((e instanceof Enemy && !(<Enemy>e).flying) || e instanceof Player)
            e.explode();
    }
}
class Enemy extends Entity {
    flying: vec2;
    flyingFor = 0;
    v = new vec2(0, 0);
    value = 10;
    constructor() {
        super();
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
    draw() {
        if (player.grabbed == this)
            return;
        super.draw();
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
            this.p.y += this.v.y||2;
            this.p.x += this.v.x;
            if (this.p.x + this.r * 2 > game.canvas.width || this.p.x-this.r*2<0)
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
    }
    collidedWith(e: Entity) {
        if (e instanceof Enemy && !(<Enemy>e).flying) {
            e.explode();
            if (this.flying) {
                this.value *= 10;
                this.flying.x *= -1;
            }
        }
    }
    explode(size: number = 2.5) {
        super.explode(size);

        nextScore += this.value;
        combo++;
        comboTimeLeft = 30;
    }
}
class Bullet extends Entity {
    speed: number;
    constructor(p: vec2, a: number, speed: number, r: number=2) {
        super();
        this.p = p;
        this.a = a;
        this.speed = speed;
        this.r = r;
    }
    draw() {
        super.draw();
        this.p.x += Math.cos(this.a) * this.speed;
        this.p.y += Math.sin(this.a) * this.speed;
        super.draw();
    }
}
class Player extends Entity {
    charging = false;
    grabbed: Enemy;
    aim = -Math.PI / 2;
    aimDir = -.01;
    constructor() {
        super();
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
    draw() {
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
            this.grabbed.a = Math.PI / 2*3;
            this.grabbed.p.y = this.p.y - this.r - this.grabbed.r;
            super.draw.call(this.grabbed);
            this.aim += this.aimDir;
            if (Math.abs(this.aim + Math.PI / 2) > .45)
                this.aimDir = -this.aimDir
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
        super.draw();
    }
    collidedWith(e: Entity) {
        if (e == this.grabbed)
            return;
        if (!this.charging) {
            if (e instanceof Enemy && !(<Enemy>e).flying) {
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
    }
}
var player: Player;
class Game {
    entities = new Array<Entity>();
    nFrame = 0;
    images = {};
    neededImages = 0;
    loadedImages = 0;
    needImage(name: string) {
        var image = new Image();
        image.onload = function () {
            game.images[name] = image;
            game.loadedImages++;
        };
        image.src = name;
    }
    line(points: vec2[], color: string, close: boolean = true, p: vec2= new vec2(0, 0), angle: number= 0 ) {
        this.ctx.strokeStyle = color;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x , points[0].y );
        for (var i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x , points[i].y );
        }
        if (close)
            this.ctx.lineTo(points[0].x , points[0].y );

        this.ctx.stroke();
        this.ctx.restore();
    }

    box(w: number, h: number, color: string, p: vec2= new vec2(0, 0), angle: number=0) {
        this.line([new vec2(-w / 2 , -h / 2 ),
            new vec2(-w / 2 , h / 2 ),
            new vec2(w / 2 , h / 2 ),
            new vec2(w / 2, -h / 2 )], color,true,p,angle);
    }
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    timerToken: number;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        game = this;
    }

    start() {
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
        var spawn= function  () {
            game.entities.push(new Enemy());
            setTimeout(spawn, Math.random() * 1000 + 1000-enemies);
            enemies++;
        }
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
        while (game.neededImages != game.loadedImages);

        this.timerToken = setInterval(() => this.draw(), 21);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

    draw() {
        if (addScore > 0) {
            var change: number = Math.floor(Math.max(Math.floor(lastScore / 40), 1));
            score += change;
            addScore -= change;
        } else
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
        this.entities.forEach(function (entity: Entity) {
            entity.draw();
        });
        var entities = this.entities.slice();
        for (var i = 0; i < entities.length; i++) {
            var a = entities[i];
            if (!a.collides)
                continue;
            if (typeof (<any>a).flying !='undefined')
                a.r *= 3.5;
            for (var j = i + 1; j < entities.length; j++) {
                var b = entities[j];
                if (!b.collides)
                    continue;
                if (typeof (<any>b).flying != 'undefined')
                    b.r *= 3.5;
                if ((a.p.x - b.p.x) * (a.p.x - b.p.x) + (a.p.y - b.p.y) * (a.p.y - b.p.y) < (a.r + b.r) * (a.r + b.r)) {
                    a.collidedWith(b);
                    b.collidedWith(a);
                }
                if (typeof (<any>b).flying != 'undefined')
                    b.r /= 3.5;
            }
            if (typeof (<any>a).flying != 'undefined')
                a.r /= 3.5;
        }
        this.entities.slice().forEach(function (entity: Entity) {
            if(entity.isDead)
                this.entities.splice(this.entities.indexOf(entity),1);
        }, this);
        this.nFrame++;
    }

}

window.onload = () => {
    var greeter = new Game();
    greeter.start();
};