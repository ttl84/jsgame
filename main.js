"use strict";
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// data
var player_stats = {
  acceleration : -500,
  deceleration : 500,
  side_acceleration: 500,
  target_vy : -500,
  rotation : 5
}
var shipCanvas = (function(){
  var canvas = document.createElement('canvas');
  canvas.width = 49;
  canvas.height = 49;

  var context = canvas.getContext('2d');
  context.beginPath();
  context.moveTo(24, 0);
  context.lineTo(48, 48);
  context.lineTo(24, 40);
  context.lineTo(0, 48);
  context.closePath();
  context.stroke();

  context.fillStyle = "#0095DD";
  context.fill();
  return canvas;
})();

// input
var keyCodes = {
  left : 37,
  accelerate: 38,
  right : 39,
  brake : 40,
  shoot : 32,
};

var keypress = [];


document.addEventListener("keydown", function(e) {
    keypress[e.keyCode] = true;
  }, false);
document.addEventListener("keyup", function(e) {
    keypress[e.keyCode] = false;
  }, false);

function Inputs() {
  this.left = keypress[keyCodes.left];
  this.right = keypress[keyCodes.right];
  this.accelerate = keypress[keyCodes.accelerate];
  this.brake = keypress[keyCodes.brake];
  this.shoot = keypress[keyCodes.shoot];
}

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
}

// GameObj
function GameObj(canvas){
  this.x = 100;
  this.y = 100;
  this.r = 0;
  this.vx = 0;
  this.vy = 0;
  this.vr = 0;
  this.ax = 0;
  this.ay = 0;
  this.ar = 0;
  this.canvas = canvas;
}
GameObj.prototype.draw = function(ctx) {
  ctx.save();

  ctx.translate(this.x, this.y);
  ctx.rotate(this.r);

  ctx.drawImage(this.canvas, -this.canvas.width/2, -this.canvas.height/2);

  ctx.restore();
}
GameObj.prototype.updateOnInput = function(input, dt) {
  throw "updateOnInput not implemented";
}
GameObj.prototype.updatePhysics = function(dt) {
  this.vx += dt * this.ax;
  this.vy += dt * this.ay;
  this.vr += dt * this.ar;

  this.x += dt * this.vx;
  this.y += dt * this.vy;
  this.r += dt * this.vr;

  this.ax = 0;
  this.ay = 0;
  this.ar = 0;
}

function Ship() {
  GameObj.call(this, shipCanvas);
}
Ship.prototype = Object.create(GameObj.prototype);
Ship.prototype.updateOnInput = function(input, dt) {

  if(!input.accelerate && !input.brake) {
    var diff_vy = player_stats.target_vy - this.vy;
    this.ay += diff_vy * 0.5;
  } else if(input.accelerate) {
    this.ay += player_stats.acceleration;
  } else if(input.brake) {
    this.ay += player_stats.deceleration;
  }

  if(!input.left && !input.right) {
    this.ax += this.vx * -0.99;
  } else if(input.left) {
    this.ax += -player_stats.side_acceleration;
  } else if(input.right) {
    this.ax += player_stats.side_acceleration;
  }
}

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
  ctx.translate(-focusObj.x + ctx.canvas.width / 2, -focusObj.y + ctx.canvas.height / 2);

  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].draw(ctx);
  }

  ctx.restore();
};
World.prototype.update = function (dt) {
  var inputs = new Inputs();
  this.updateObjects(inputs, dt);
};
World.prototype.updateObjects = function(input, timestep) {
  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].updateOnInput(input, timestep);
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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  this.world.draw(ctx);
  this.fpsCounterDisplay.draw(ctx);
  this.playerPositionDisplay.draw(ctx);
};
Game.prototype.update = function () {
  if(!this.running) {
    return;
  }
  setTimeout(Game.prototype.update.bind(this), 1);

  var timestamp = performance.now();
  this.dt += (timestamp - this.previousUpdateTime) / 1000;
  this.previousUpdateTime = timestamp;

  while(this.dt > 0) {
    this.world.update(0.001);
    this.dt -= 0.001;
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
