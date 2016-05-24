App.factory 'runner', ($rootScope) ->

  createWorker = (scripts) ->
    #TODO: custom scripts, predeined scripts (lodash, moment, etc...)
    scriptsStr = scripts.map((s)->"importScripts('#{s}');").join("\n")
    workerCode = """
      //imports
      #{scriptsStr}
      onmessage = function(event) {
        //private control code
        var timers = {};
        var checkTimers = function() {
          var ticking = false;
          for(var int in timers) {
            var t = timers[int];
            var now = new Date().getTime();
            if(!t || now > t) {
              delete timers[int];
              continue;
            }
            ticking = true;
            break;
          }
          if(!ticking) {
            postMessage({done:true});
          }
        };
        var print = function() {
          var args = Array.prototype.slice.call(arguments);
          postMessage({print:args});
        }
        var _setTimeout = setTimeout;
        var _clearTimeout = clearTimeout;
        var _setInterval = setInterval;
        var _clearInterval = clearInterval;
        //fake-global context
        var context = (function() {
          this.console = { log: print, info: print, warn: print, error: print };
          this.setTimeout = function(fn, ms) {
            var int = _setTimeout(function() {
              fn.call(this);
              _setTimeout(checkTimers,30);
            }, ms);
            timers[int] = new Date().getTime()+ms+15;
            return int;
          };
          this.clearTimeout = function(int) {
            _clearTimeout(int);
            delete timers[int];
            checkTimers();
          };
          this.setInterval = function(fn, ms) {
            var int = _setInterval(fn, ms);
            timers[int] = Infinity;
            return int;
          };
          this.clearInterval = function(int) {
            _clearInterval(int);
            delete timers[int];
            checkTimers();
          };
        }());
        try {
          eval.call(context, event.data);
          checkTimers();
        } catch(err) {
          postMessage({err: err.stack || err.toString()});
        }
      };
    """
    blob = new Blob [workerCode], type: "text/javascript"
    url = URL.createObjectURL(blob)
    try
      worker = new Worker(url)
    catch
      alert "Blob worker scripts not supported"
  #singleton worker abstraction
  worker =
    n: 0
    curr: null
    scripts: []
    start: () ->
      @stop("Script cancelled") if @curr
      @n++
      @t0 = +new Date()
      # console.log "start", @n
      @curr = createWorker(@scripts)
      @timeout = setTimeout (=> @stop("Script timeout")), 30*1000
    send: (o) ->
      @start() unless @curr
      @curr.postMessage o
    receieve: (fn) ->
      @start() unless @curr
      @curr.onmessage = fn
    stop: (err) ->
      return unless @curr
      now = +new Date()
      t = now-@t0
      if t < 1000
        t = t+"ms"
      else
        t = Math.round(t/100)/10+"s"
      # console.log "stop", @n, t
      @curr.terminate();
      @curr = null
      if err
        $.notify "#{err} (after #{t})", "error"
      else
        $.notify "Ran in #{t}", "success"
      clearTimeout @timeout

  tostr = (args) ->
    if(args instanceof Array)
      return args.map((a) -> tostr a).join " "
    else if typeof args is "string"
      return args
    else
      return JSON.stringify args, null, 2

  print = (args) ->
    args = [args] unless args instanceof Array
    # console.log.apply console, args
    $rootScope.output += tostr(args) + "\n"

  run: (code, context) ->
    worker.start()
    worker.receieve (e) ->
      d = e.data
      if !d or typeof d isnt 'object'
        return
      if d.err
        worker.stop(d.err)
      else if d.print
        print d.print
      else if 'done' of d
        worker.stop()
      $rootScope.$apply()
      return
    $rootScope.output = ""
    worker.send code
    return
