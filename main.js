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
    x:0,
    y:0,
    canvas: (function(){
      var canvas = document.createElement('canvas');
      canvas.width = 49;
      canvas.height = 49;
      var context = canvas.getContext('2d');
      context.beginPath();
      context.moveTo(24, 0);
      context.lineTo(48, 48);
      context.lineTo(24, 34);
      context.lineTo(0, 48);
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
  var dx = obj.x - canvas.width / 2;
  var dy = obj.y - canvas.height / 2;
  ctx.drawImage(canvas, dx, dy);
}

function WorldDraw(self) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    drawObject(obj);
  }
}
function WorldUpdate(self, input) {
  var player = self.objects[self.player];
  if(input.pressedLeft) {
    player.x += -0.1;
  }
  if(input.pressedRight) {
    player.x += 0.1;
  }
  if(input.pressedUp) {
    player.y -= 0.1;
  }
  if(input.pressedDown) {
    player.y -= -0.1;
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
