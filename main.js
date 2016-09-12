"use strict";

// data
var player_stats = {
  acceleration : -500,
  deceleration : 500,
  side_acceleration: 500,
  target_vy : -500,
  rotation : 5
}


// input
var Keyboard =  {};
Keyboard.pressed = [];
document.addEventListener("keydown", function(e) {
  Keyboard.pressed[e.keyCode] = true;
});
document.addEventListener("keyup", function(e) {
  Keyboard.pressed[e.keyCode] = false;
});
Keyboard.left = function () {
  return Keyboard.pressed[37];
};
Keyboard.right = function () {
  return Keyboard.pressed[39];
};
Keyboard.accelerate = function () {
  return Keyboard.pressed[38];
};
Keyboard.brake = function () {
  return Keyboard.pressed[40];
};
Keyboard.shoot = function () {
  return Keyboard.pressed[32];
};


function TextDisplay(args) {
  this.font = args.font || "30px Comic Sans MS";
  this.fillStyle = args.fillStyle || "red";
  this.src = args.src;
  this.x = args.x || 0;
  this.y = args.y || 0;
}
TextDisplay.prototype.draw = function(ctx) {
  ctx.save();
  ctx.font = this.font;
  ctx.fillStyle = this.fillStyle;
  ctx.fillText(this.src.getText(), this.x, this.y);
  ctx.restore();
}

// FPS counter
function FPSCounter(args) {
  this.avg = 0;
  this.oldWeight = args.oldWeight;
  this.newWeight = args.newWeight;
  this.txt = "fps=?";
  this.scheduleTextUpdate();
}
FPSCounter.prototype.update = function(dt) {
  this.avg = (this.avg * this.oldWeight + dt * this.newWeight) / (this.oldWeight + this.newWeight);
};
FPSCounter.prototype.getAvg = function() {
  return this.avg;
};
FPSCounter.prototype.scheduleTextUpdate = function(interval) {
  if(this.interval) {
    this.stopUpdate();
  }
  this.interval = setInterval(function() {
    var avg = this.getAvg();
    var fps = 1000 / avg;
    this.txt = "fps=" + fps.toFixed(1);
  }.bind(this), interval || 1000);
};
FPSCounter.prototype.stopUpdate = function() {
  if(this.interval) {
    clearInterval(this.interval);
    this.interval = undefined;
  }
};
FPSCounter.prototype.getText = function () {
  return this.txt;
};

// GameObj
function combine(){
  var sum = {};
  for(var i = 0; i < arguments.length; i++) {
    var object = arguments[i];
    Object.keys(object).forEach(function(key) {
      if(typeof(sum[key]) === typeof(object[key])) {
        if(typeof(sum[key]) === "object") {
          sum[key] = combine(sum[key], object[key]);
        } else {
          sum[key] = object[key];
        }
      } else if(typeof(sum[key]) === "undefined") {
        sum[key] = object[key];
      } else {
        throw "combine: type conflict";
      }
    });
  }
  return sum;
}

function assertImplemented(obj, meth) {
  if(typeof (obj[meth]) !== "function") {
    throw meth + " is not implemented";
  }
}

function extendPrototype(dst, src) {
  dst.prototype = combine(dst.prototype, src.prototype);
}

function Physics() {
  this.x = 0;
  this.y = 0;
  this.r = 0;
  this.vx = 0;
  this.vy = 0;
  this.vr = 0;
  this.ax = 0;
  this.ay = 0;
  this.ar = 0;
}
Physics.prototype.updatePhysics = function(dt) {
  this.vx += dt * this.ax;
  this.vy += dt * this.ay;
  this.vr += dt * this.ar;

  this.x += dt * this.vx;
  this.y += dt * this.vy;
  this.r += dt * this.vr;

  this.ax = 0;
  this.ay = 0;
  this.ar = 0;
};

function Drawable() {
  this.width = 0;
  this.height = 0;
  this.x = 0;
  this.y = 0;
  this.r = 0;
  assertImplemented(this, "customDraw");
}
Drawable.prototype.draw = function(ctx) {
  ctx.save();

  ctx.translate(this.x, this.y);
  ctx.rotate(this.r);
  //ctx.translate(-this.width/2, -this.height/2);

  this.customDraw(ctx);

  ctx.restore();

};

function Inputable(){
  assertImplemented(this, "updateOnInput");
}

function Bullet(parent) {
  Physics.call(this);
  Drawable.call(this);
  this.width = 3;
  this.height = 3;
  var speed = 100;
  var headingX = speed * Math.cos(parent.r);
  var headingY = speed * Math.sin(parent.r);
  this.vx = headingX + parent.vx;
  this.vy = headingY + parent.vy;
  this.x = parent.x;
  this.y = parent.y;
}
extendPrototype(Bullet, Physics);
extendPrototype(Bullet, Drawable);
Bullet.prototype.customDraw = function(ctx) {
  ctx.beginPath();
  ctx.moveTo(-1, -1);
  ctx.lineTo(1, -1);
  ctx.lineTo(1, 1);
  ctx.closePath();
  ctx.stroke();
};

function Ship() {
  Physics.call(this);
  Drawable.call(this);
  Inputable.call(this);
  this.width = 49;
  this.height = 49;
  this.gunCooldown = 0;
}
extendPrototype(Ship, Physics);
extendPrototype(Ship, Drawable);
extendPrototype(Ship, Inputable);
Ship.prototype.updateOnInput = function(game, dt) {
  this.ar = 0;
  this.vr = 0;
  this.r = 0;
  var screenCenterX = game.canvas.width / 2;
  var screenCenterY = game.canvas.height / 2;
  var headingX = game.pointer.x - screenCenterX;
  var headingY = game.pointer.y - screenCenterY;
  this.vx = headingX;
  this.vy = headingY;
  this.r = Math.atan2(this.vx, -this.vy);

  if(game.pointer.down[0] && this.gunCooldown <= 0) {
    this.gunCooldown = 0.1;
    game.world.addObject(new Bullet(this));
  } else {
    this.gunCooldown -= dt;
  }
};
Ship.prototype.customDraw = function(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(24, 24);
  ctx.lineTo(0, 16);
  ctx.lineTo(-24, 24);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#0095DD";
  ctx.fill();
};


// World
function World() {
  this.objects = [];
  this.cameraFocus = 0;
  this.player = 0;
}
World.prototype.addObject = function(o) {
  this.objects.push(o);
};
World.prototype.draw = function(ctx) {
  ctx.save();
  var focusObj = this.objects[this.cameraFocus];
  //ctx.translate(-focusObj.x + ctx.canvas.width / 2, -focusObj.y + ctx.canvas.height / 2);

  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].draw(ctx);
  }

  ctx.restore();
};
World.prototype.update = function(input, timestep) {
  for(var i = 0; i < this.objects.length; i++) {
    if(this.objects[i].updateOnInput) {
      this.objects[i].updateOnInput(input, timestep);
    }
  }
  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].updatePhysics(timestep);
  }
};

function PlayerPositionWatch (world) {
  this.world = world;
}
PlayerPositionWatch.prototype.getText = function () {
  var player = this.world.objects[this.world.player];
  return "position=(" + player.x.toFixed(0) + " " + player.y.toFixed(0) + ")";
};

function Game () {
  this.previousDrawTime = performance.now();
  this.previousUpdateTime = performance.now();
  this.dt = 0;

  this.world = new World();
  this.world.addObject(new Ship());

  this.playerPositionDisplay = new TextDisplay({
    src: new PlayerPositionWatch(this.world),
    x: 10,
    y: 100
  })

  this.fpsCounter = new FPSCounter({
    oldWeight: 5,
    newWeight: 1
  });
  this.fpsCounterDisplay = new TextDisplay({
    src: this.fpsCounter,
    x: 10,
    y: 50
  });
  this.canvas = document.getElementById("canvas");
  this.ctx = canvas.getContext("2d");

  this.pointer = {
    x:0,
    y:0,
    down:[]
  };
  this.canvas.addEventListener("mousemove", function(e) {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }.bind(this));
  this.canvas.addEventListener("mousedown", function(e) {
    this.pointer.down[e.button] = true;
  }.bind(this));
  this.canvas.addEventListener("mouseup", function(e) {
    this.pointer.down[e.button] = false;
  }.bind(this));

  this.running = false;

  this.outsideRadius = window.innerWidth + window.innerHeight;
  this.maxEnemies = 1;
}
Game.prototype.draw = function (timestamp) {
  if(!this.running) {
    return;
  }

  requestAnimationFrame(Game.prototype.draw.bind(this));
  timestamp = timestamp || 0;
  this.fpsCounter.update(timestamp - this.previousDrawTime);
  this.previousDrawTime = timestamp;
  // draw stuff
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);

  this.world.draw(this.ctx);
  this.fpsCounterDisplay.draw(this.ctx);
  this.playerPositionDisplay.draw(this.ctx);
};
Game.prototype.update = function () {
  if(!this.running) {
    return;
  }
  setTimeout(Game.prototype.update.bind(this), 1);

  var timestamp = performance.now();
  this.dt += (timestamp - this.previousUpdateTime);
  this.previousUpdateTime = timestamp;

  this.outsideRadius = window.innerWidth + window.innerHeight;

  while(this.dt > 0) {
    this.world.update(this, 0.001);
    this.dt -= 1.0;
  }
};
Game.prototype.run = function () {
  if(this.running) {
    return;
  }
  this.running = true;
  this.update();
  this.draw();
};
Game.prototype.stop = function () {
  this.running = false;
};

var game = new Game();
game.run();
