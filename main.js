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

// FPS display
function makeFPSDisplay(oldWeight, newWeight) {
  return {
    begin : new Date,
    end : new Date,
    avg : 0,
    old_weight : oldWeight,
    new_weight : newWeight,

  };
}

function updateFPSDisplay(self, timestamp) {
  self.begin = self.end;
  self.end = timestamp;
  var delta = self.end - self.begin;
  self.avg = (self.avg * self.old_weight + delta * self.new_weight) / (self.old_weight + self.new_weight);
}
function showFPSDisplay(self, ele) {
  ele.innerHTML = "fps=" + (1000/self.avg).toFixed(1);
}

// Periodic action
function makePeriodicAction(period_, func_) {
  return {
    period : period_,
    cycles: 0,
    func : func_
  };
}

function updatePeriodicAction(action, cycles) {
  action.cycles += cycles;
  if(action.cycles >= action.period) {
    action.cycles -= action.period;
    action.func();
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

var fpsDisplay = makeFPSDisplay(5, 1);
var fpsShowAction = makePeriodicAction(1000, function() {
  showFPSDisplay(fpsDisplay, document.getElementById("fps"));
});

var world = WorldMake();
WorldAdd(world, ShipMake());

var previousTimestamp = 0;
var deltaTime = 0;
function step(timestamp) {
  requestAnimationFrame(step);
  deltaTime += (timestamp - previousTimestamp);
  previousTimestamp = timestamp;

  updateFPSDisplay(fpsDisplay, timestamp);
  updatePeriodicAction(fpsShowAction, deltaTime);

  WorldDraw(world);
  
  deltaTime = Math.min(deltaTime, 30);
  while(deltaTime > 0) {
    WorldUpdate(world, input, 1.0/1000.0);
    deltaTime -= 1.0;
  }
}

step(1);
