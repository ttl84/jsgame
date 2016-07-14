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

// FPS counter
function FPSCounter(oldWeight, newWeight) {
  this.begin = new Date;
  this.end = new Date;
  this.avg = 0;
  this.old_weight = oldWeight;
  this.new_weight = newWeight;
  this.txt = "";
}
FPSCounter.prototype.update = function(timestamp) {
  this.begin = this.end;
  this.end = timestamp;
  var delta = this.end - this.begin;
  this.avg = (this.avg * this.old_weight + delta * this.new_weight) / (this.old_weight + this.new_weight);
}
FPSCounter.prototype.updateText = function() {
  this.txt = "fps=" + (1000/this.avg).toFixed(1);
}
FPSCounter.prototype.draw = function(ctx, x, y) {
  ctx.font = "30px Comic Sans MS";
  ctx.fillStyle = "red";
  ctx.fillText(this.txt, x, y);
}

// Periodic action
function PeriodicAction(period, func) {
  this.period = period;
  this.ticks = 0;
  this.func = func;
}
PeriodicAction.prototype.update = function(ticks) {
  this.ticks += ticks;
  if(this.ticks >= this.period) {
    this.ticks -= this.period;
    this.func();
  }
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
}
World.prototype.drawObjects = function(ctx) {
  ctx.save();
  var focusObj = this.objects[this.cameraFocus];
  ctx.translate(-focusObj.x + ctx.canvas.width / 2, -focusObj.y + ctx.canvas.height / 2);

  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].draw(ctx);
  }

  ctx.restore();
}
World.prototype.updateObjects = function(input, dt) {
  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].updateOnInput(input, dt);
  }
  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].updatePhysics(dt);
  }
}

var fpsCounter = new FPSCounter(5, 1);
var fpsCounterDisplayUpdateAction = new PeriodicAction(1000, function() {
  fpsCounter.updateText();
});

var world = new World();
world.addObject(new Ship());

var previousTimestamp = 0;
var deltaTime = 0;
function step(timestamp) {
  requestAnimationFrame(step);

  deltaTime += (timestamp - previousTimestamp);
  previousTimestamp = timestamp;

  // draw stuff
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  world.drawObjects(ctx);
  fpsCounter.draw(ctx, 10, 50);

  // update other stuff
  fpsCounter.update(timestamp);
  fpsCounterDisplayUpdateAction.update(deltaTime);
  
  // update game objects
  var inputs = new Inputs();
  deltaTime = Math.min(deltaTime, 30);
  while(deltaTime > 0) {
    world.updateObjects(inputs, 1.0/1000.0);
    deltaTime -= 1.0;
  }
}

step(1);
