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

class Entity {
    isDead = false;
    color: string;
    p: vec2;
    r: number;
    a: number = 0;
    draw() {
        game.box(this.r * 2, this.r * 2, this.color, this.p, this.a);
        if (this.p.x + this.r < 0 || this.p.x - this.r > game.canvas.width || this.p.y + this.r < -1000 || this.p.y - this.r > game.canvas.height)
            this.isDead = true;
    }
    collidedWith(e: Entity) { }
    explode() {
        game.entities.push(new Explosion(this.p, this.r * 2.5));
        this.isDead = true;
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
        if (e instanceof Enemy || e instanceof Player)
            e.explode();
    }
}
class Enemy extends Entity {

    constructor() {
        super();
        this.p = new vec2(Math.random() * game.canvas.width, -50);
        this.r = 10;
        this.color = "#FF0000";
        this.a = Math.random() * Math.PI * 2;
    }
    draw() {
        super.draw();
        if (player.grabbed == this)
            return;
        this.p.y += 2.3;
        this.a += .03;
        if (this.p.y > game.canvas.height)
            this.isDead = true;
        if (game.nFrame % 50 == 0) {
            game.entities.push(new Bullet(this.p.copy(), this.a, 2));
        }
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
    grabbed: Entity;
    aim = -Math.PI / 2;
    aimDir = -.01;
    constructor() {
        super();
        player = this;
        this.p = new vec2(game.canvas.width / 2, game.canvas.height * 3 / 4);
        this.r = 8;
        this.color = "#00FF00";
    }
    draw() {
        super.draw();
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
                if (Math.abs(this.aim+Math.PI/2)>1)
                    this.aimDir = -this.aimDir
                var d = this.p.copy();
                d.x += Math.cos(this.aim) * 20;
                d.y += Math.sin(this.aim) * 20;
                game.line([this.p, d], "#FFFFFF", false);
            }
            else
                this.aim = -Math.PI / 2;
        }
        else {
            this.p.y += 20;
            if (this.p.y + this.r * 2 > game.canvas.height) {
                this.charging = false;
                this.p.y = game.canvas.height - this.r * 2;
            }
        }
    }
    collidedWith(e: Entity) {
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
        this.timerToken = setInterval(() => this.draw(), 21);
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
        var spawn= function  () {
            game.entities.push(new Enemy());
            setTimeout(spawn, Math.random() * 1000 + 1000-enemies);
            enemies++;
        }
        spawn();
    }

    stop() {
        clearTimeout(this.timerToken);
    }

    draw() {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.entities.forEach(function (entity: Entity) {
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