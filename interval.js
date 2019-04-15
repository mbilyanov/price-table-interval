// Construct a time string for debug purposes.
const getTime = () => {
  var now = new Date();
  var h = now.getHours().toString().padStart(2, '0');
  var m = now.getMinutes().toString().padStart(2, '0');
  var s = now.getSeconds().toString().padStart(2, '0');
  const timeSignature = h + ':' + m + ':' + s;
  return timeSignature;
}

const getNeighbour = ((array, val, dir) => {
  for (var i = 0; i < array.length; i++) {
    if (dir == true) {
      if (array[i] > val) {
        return array[i - 1] || 0;
      }
    } else {
      if (array[i] >= val) {
        return array[i];
      }
    }
  }
});

const rangeBuilder = ((interval) => {
  let rangeList = [];
  let limit = Math.floor(60 / interval);
  //console.log('limit:', limit);
  var i = 0;
  while (i < limit) {
    rangeList.push(i * interval);
    i++;
  }
  //console.log('range:', rangeList);
  // Add the terminator.
  rangeList.push(60);
  return rangeList;
});

function Interval(name = 'default') {
  // Private Data
  let pivotIsLocal, mode;
  let _counter = 0;
  let state = {
    isFirstRun: true,
    get counter() {
      let prepCounter = _counter.toString().padStart(6,"000000");
      return prepCounter;
      }
  };

  console.log('Init interval [' + name + ']');

  // Public access point.
  let self = {};

  // Private Methods
  const updateCounter = function(value){
    _counter += value;
  }

  const getState = function(item){
    return state[item];
  }

  const getNextTick = function(mySkip, myInterval, currentSeconds) {
    let CONTEXT = 'getNextTick'
    // Local Data
    let myGap, pivotIsLocal, mode, nextUpdateMilliseconds;

    // Debug
    console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> SKIP (MINUTES):' + mySkip + ', ' +
      'INTERVAL (SECONDS):' + myInterval + ', ' +
      'ENTRY AT (SECONDS):' + currentSeconds);

    console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> IS_FIRST_RUN (STATE):' + getState('isFirstRun'));

    // Pivot detection for our entry point.
    // For cases where our entry is before the INTERVAL or right at the INTERVAL,
    // we consider the pivot to be local as the temporal resolution will take place
    // within the current minute. For situations where we are beyond the INTERVAL,
    // we will be waiting for the start of the next minute for the resolution to be
    // started.
    if (currentSeconds <= myInterval) {
      // Just a debug.
      if (currentSeconds == myInterval) {
        console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> start_time_aligned')
      } else {
        console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> start_time_ahead')
      }
      pivotIsLocal = true;
    } else {
      console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> start_time_on_next_minute')
      pivotIsLocal = false;
    }

    if (currentSeconds % 60 == 0) {
      // We need to move $INTERVAL seconds forward.
      console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> We are at ??:00.')
      mode = 0;
    } else {
      if (currentSeconds == myInterval) {
        // We need to move 60 seconds forward.
        console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> We are at the interval of (' + myInterval + ') seconds.')
        mode = 1;
      } else {
        // We need to calculate how much we will be jumping forward.
        console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> We are at an arbitary time location.')
        mode = 2;
      }
    }

    if (mode == 2) {
      // mode 2

      // Reset skip only if we are in the first cycle.
      if(getState('isFirstRun')){
        // Need to reset skip.
        console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> Resetting the SKIP value.')
        mySkip = 0;
      }

      if (pivotIsLocal) {
        myGap = (myInterval - currentSeconds);
      } else {
        myGap = (60 - currentSeconds) + myInterval;
      }
    } else {
      // mode 0 and mode 1
      if (mode == 0) {
        // mode 0
        myGap = myInterval;
      } else {
        // mode 1
        myGap = 60;
      }
    }

    // Debug
    console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> LOCAL_PIVOT:' + pivotIsLocal + ', ' +
      'MODE:' + mode + ', ' +
      'SKIP:' + mySkip + ', ' +
      'GAP:' + myGap + ' seconds');

    nextUpdateMilliseconds = (myGap * 1000) + (mySkip * 60 * 1000);
    return nextUpdateMilliseconds;
  }

  const startInterval = function(timeToNextTick, skip, interval) {
    // Plant the next run.
    setTimeout(function() {
      console.log(';\n\t(' + getTime() +') Performing data push ...');

      // PERFORM THE WEBSOCKETS DATA PUSH.
      console.time('\t\t>>>push');
      console.log('\t\t>>>___DATA_PUSH at ' + getTime());
      console.timeEnd('\t\t>>>push');

      // Recursion
      console.log('\t(' + getTime() + ') Restarting runInterval() ...\n;');

      // Stick to the raw parameters.
      self.runInterval(skip, interval);
    }, timeToNextTick)
  };

  const setState = function(item, value){
    state[item] = value;
  }

  // Public Methods
  self.runInterval = function(skip, interval) {
    let CONTEXT = 'runInterval'
    var date = new Date();
    let myInterval = interval;              // Used
    let mySkip = skip;                      // Used
    let currentSeconds = date.getSeconds(); // Used
    let timeSignature = getTime();

    // Start
    updateCounter(1);
    let timeToNextTick = getNextTick(mySkip, myInterval, currentSeconds);
    console.log('[' + name + '.' + CONTEXT + '] (' + getState('counter') +') <' + getTime() + '> Next data push expected in ' + timeToNextTick + ' milliseconds.');

    startInterval(timeToNextTick, mySkip, myInterval);

    // Rest first run state flag.
    setState('isFirstRun', false)
  }

  return self;
};

foo = new Interval('push');
foo.runInterval(0, 25);
