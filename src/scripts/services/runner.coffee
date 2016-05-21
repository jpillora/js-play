App.factory 'runner', ($rootScope) ->

  createWorker = (scripts) ->
    scriptsStr = scripts.map((s)->"importScripts('#{s}');").join("\n")
    workerCode = """
      //js-play imports
      #{scriptsStr}
      //js-play control code
      var context = (function() {
        this.console = {
          log: function() {
            var args = Array.prototype.slice.call(arguments);
            postMessage({log:args});
          }
        };
      }());
      onmessage = function(event) {
        try {
          var result = eval.call(context, event.data);
          postMessage({result:result});
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

  worker =
    n: 0
    curr: null
    scripts: [
      "http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.2.1/lodash.min.js"
    ]
    start: () ->
      @stop("Script cancelled") if @curr
      @n++
      @t0 = +new Date()
      # console.log "start", @n
      @curr = createWorker(@scripts)
      @timeout = setTimeout (=> @stop("Script timeout")), 5000
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
        $.notify "Completed in #{t}", "success"
      clearTimeout @timeout

  tostr = (args) ->
    if(args instanceof Array)
      return args.map((a) -> tostr a).join " "
    else if typeof args is "string"
      return args
    else
      return JSON.stringify args, null, 2

  output = (args) ->
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
      else if d.log
        output d.log
      else if 'result' of d
        output d.result if d.result
        worker.stop()
      $rootScope.$apply()
      return

    $rootScope.output = ""
    worker.send code
    return
