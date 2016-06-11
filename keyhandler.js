var raycast = raycast || {};

raycast.keyhandler = (function () {
  var codes = {
    up: 38,
    w: 87,
    down: 40,
    left: 37,
    a: 65,
    right: 39,
    d: 68,
    space: 32,
    ctrl: 17,
    esc: 27
  };

  var state = new Array();
  var lastState = new Array();

  for (var i = 0; i < 255; i++) {
    state[i] = false; 
    lastState[i] = false;
  }

  onKeyup = function (e) {
    state[e.which] = false;
    if (isUsedKey(e.which)) 
      e.preventDefault();
  }

  onKeydown = function (e) {
    state[e.which] = true;
    if (isUsedKey(e.which)) 
      e.preventDefault();
  }

  function isUsedKey(keycode) {
    for (var key in codes) {
      if (codes[key] == keycode) {
        return true;
      }
    }
    return false;
  }

  isKeydown = function(keyname) {
    return state[codes[keyname]];
  }

	isKeypress = function(keyname) {
		return state[codes[keyname]] && !lastState[codes[keyname]];
	}

	tick = function() {
		lastState = state.slice();
	}

  return {
    onKeyup: onKeyup,
    onKeydown: onKeydown,
    isKeydown: isKeydown,
    isKeypress: isKeypress,
    tick: tick
  };
})();