"use strict";
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// input
var inputMapping = {
  left : 37,
  up: 38,
  right : 39,
  down : 40,
};

var input = {
  pressedUp : false,
  pressedDown : false,
  pressedLeft : false,
  pressedRight : false
};

function makeKeyPressHandler(value) {
  return function(e) {
    if(e.keyCode == inputMapping.left) {
      input.pressedLeft = value;
    }
    if(e.keyCode == inputMapping.right) {
      input.pressedRight = value;
    }
    if(e.keyCode == inputMapping.up) {
      input.pressedUp = value;
    }
    if(e.keyCode == inputMapping.down) {
      input.pressedDown = value;
    }
  }
}

document.addEventListener("keydown", makeKeyPressHandler(true), false);
document.addEventListener("keyup", makeKeyPressHandler(false), false);

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

function ObjectPhysics(obj) {

  var ax = Math.cos(obj.rotation);
  var ay = Math.sin(obj.rotation);
  var aLen = Math.sqrt(ax * ax + ay * ay);
  ax = ax / aLen * obj.acceleration;
  ay = ay / aLen * obj.acceleration;
  
  obj.vx += ax;
  obj.vy += ay;

  obj.x += obj.vx;
  obj.y += obj.vy;

}

function WorldDraw(self) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    ObjectDraw(obj);
  }
}
function WorldUpdate(self, input) {
  var player = self.objects[self.player];
  if(input.pressedLeft) {
    player.rotation -= 0.001;
  }
  if(input.pressedRight) {
    player.rotation += 0.001;
  }

  player.acceleration = 0;
  if(input.pressedUp) {
    player.acceleration = 0.0001;
  }
  if(input.pressedDown) {
    player.acceleration = -0.00005;
  }
  
  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    ObjectPhysics(obj);
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
    WorldUpdate(world, input);
    deltaTime -= 1.0;
  }
}

step(1);
