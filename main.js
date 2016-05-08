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

var fpsDisplay = makeFPSDisplay(5, 1);

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

var fpsShowAction = makePeriodicAction(1000, function() {
  showFPSDisplay(fpsDisplay, document.getElementById("fps"));
});

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


function drawBall(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}
function WorldDraw(self) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(var i = 0; i < self.objects.length; i++) {
    var obj = self.objects[i];
    drawBall(obj.x, obj.y, obj.radius);
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

var world = WorldMake();
WorldAdd(world, {x:0,y:0,radius:10});

var previousTimestamp = 0;
function step(timestamp) {
  requestAnimationFrame(step);
  var ms = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  updateFPSDisplay(fpsDisplay, timestamp);
  updatePeriodicAction(fpsShowAction, ms);

  WorldDraw(world);
  
  ms = Math.min(ms, 30);
  for(var i = 0; i < ms; i++) {
    WorldUpdate(world, input);
  }

  
}

step(1);
