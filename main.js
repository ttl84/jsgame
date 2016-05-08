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

// timing
var timer = makeTimer(5, 1);
var fpsShowAction = makePeriodicAction(1000, function() {
  showFPSCounter(timer, document.getElementById("fps"));
});
function showFPSCounter(timer, ele) {
  ele.innerHTML = "fps=" + (1000/timer.avg).toFixed(1);
}

function makeTimer(oldWeight, newWeight) {
  return {
    begin : new Date,
    end : new Date,
    avg : 0,
    old_weight : oldWeight,
    new_weight : newWeight,
  };
}
function updateTimer(t) {
  t.begin = t.end;
  t.end = new Date;
  var delta = t.end - t.begin;
  t.avg = (t.avg * t.old_weight + delta * t.new_weight) / (t.old_weight + t.new_weight);
  return t.avg;
}

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

function step() {
  var ms = updateTimer(timer);
  updatePeriodicAction(fpsShowAction, ms);

  WorldDraw(world);
  ms = Math.min(ms, 30);
  for(var i = 0; i < ms; i++) {
    WorldUpdate(world, input);
  }

}

var world = WorldMake();
WorldAdd(world, {x:0,y:0,radius:10});
setInterval(step, 0);
