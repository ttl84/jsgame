"use strict";
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// data
var player_stats = {
  acceleration : 500,
  deceleration : -500,
  rotation : 5
}

// input
var inputMapping = {
  left : 37,
  accelerate: 38,
  right : 39,
  brake : 40,
  shoot : 32,
};

var input = [];
document.addEventListener("keydown", function(e) {
    input[e.keyCode] = true;
  }, false);
document.addEventListener("keyup", function(e) {
    input[e.keyCode] = false;
  }, false);

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
  this.cycles = 0;
  this.func = func;
}
PeriodicAction.prototype.update = function(cycles) {
  this.cycles += cycles;
  if(this.cycles >= this.period) {
    this.cycles -= this.period;
    this.func();
  }
}

// game logic
function WorldMake(){
  return {
    objects : [],
    cameraFocus : 0,
    player : 0
  };
}
function WorldAdd(self, o){
  self.objects.push(o);
}

function ShipMake(){
  return {
    x:100,
    y:100,
    vx:0,
    vy:0,
    rotation: 0,
    acceleration: 0,
    canvas: (function(){
      var canvas = document.createElement('canvas');
      canvas.width = 49;
      canvas.height = 49;

      var context = canvas.getContext('2d');
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(48, 24);
      context.lineTo(0, 48);
      context.lineTo(14, 24);
      context.closePath();
      context.stroke();

      context.fillStyle = "#0095DD";
      context.fill();
      return canvas;
    })()
  }
}

function ObjectDraw(obj) {
  var canvas = obj.canvas;

  ctx.save();

  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.rotation);

  ctx.drawImage(canvas, -canvas.width/2, -canvas.height/2);

  ctx.restore();
}

function ObjectPhysics(obj, dt) {

  var ax = Math.cos(obj.rotation);
  var ay = Math.sin(obj.rotation);
  var aLen = Math.sqrt(ax * ax + ay * ay);
  ax = ax / aLen * obj.acceleration;
  ay = ay / aLen * obj.acceleration;
  
  obj.vx += dt * ax;
  obj.vy += dt * ay;

  obj.x += dt * obj.vx;
  obj.y += dt * obj.vy;

}

function WorldDraw(self) {

  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    ObjectDraw(obj);
  }
}
function WorldUpdate(self, input, dt) {
  var player = self.objects[self.player];
  if(input[inputMapping.left]) {
    player.rotation -= dt * player_stats.rotation;
  }
  if(input[inputMapping.right]) {
    player.rotation += dt * player_stats.rotation;
  }

  player.acceleration = 0;
  if(input[inputMapping.accelerate]) {
    player.acceleration = player_stats.acceleration;
  }
  if(input[inputMapping.brake]) {
    player.acceleration = player_stats.deceleration;
  }
  
  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    ObjectPhysics(obj, dt);
  }
}

var fpsCounter = new FPSCounter(5, 1);
var fpsCounterDisplayUpdateAction = new PeriodicAction(1000, function() {
  fpsCounter.updateText();
});

var world = WorldMake();
WorldAdd(world, ShipMake());

var previousTimestamp = 0;
var deltaTime = 0;
function step(timestamp) {
  requestAnimationFrame(step);

  deltaTime += (timestamp - previousTimestamp);
  previousTimestamp = timestamp;

  // draw stuff
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  WorldDraw(world);
  fpsCounter.draw(ctx, 10, 50);

  // update other stuff
  fpsCounter.update(timestamp);
  fpsCounterDisplayUpdateAction.update(deltaTime);
  
  // update game objects
  deltaTime = Math.min(deltaTime, 30);
  while(deltaTime > 0) {
    WorldUpdate(world, input, 1.0/1000.0);
    deltaTime -= 1.0;
  }
}

step(1);
