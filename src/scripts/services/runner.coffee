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
            var str = Array.prototype.slice.call(arguments).map(function(arg) {
              return typeof arg === "object" ? JSON.stringify(arg) : ""+arg;
            }).join(" ");
            postMessage({log:str});
          }
        };
      }());
      onmessage = function(event) {
        try {
          eval.call(context, event.data);
        } catch(err) {
          postMessage({err: err.stack || err.toString()});
        }
      };
    """

    # zone.fork({
    #   onZoneLeave: function () {
    #     postMessage({result:true});
    #   },
    #   onError: function (err) {
    #     postMessage({err: err.stack || err.toString()});
    #   }
    # }).run(function () {
    #   eval.call(context, event.data);
    # });

    blob = new Blob [workerCode], type: "text/javascript"
    url = URL.createObjectURL(blob)
    try
      worker = new Worker(url)
    catch
      alert "Blob worker scripts not supported"

  worker =
    curr: null
    scripts: [
      "http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.2.1/lodash.min.js"
      # location.origin+"/js/zones.js"
    ]
    start: () ->
      @stop() if @curr
      console.log "start"
      @curr = createWorker(@scripts)
      @timeout = setTimeout (=> @stop()), 5000
    send: (o) ->
      @start() unless @curr
      @curr.postMessage o
    receieve: (fn) ->
      @start() unless @curr
      @curr.onmessage = fn
    stop: ->
      return unless @curr
      console.log "stop"
      @curr.terminate();
      @curr = null
      clearTimeout @timeout

  run: (code, context) ->
    worker.start()

    worker.receieve (e) ->
      d = e.data
      if typeof d isnt 'object'
        return
      if d.err
        $.notify d.err
        worker.stop()
      else if d.log
        $rootScope.output += d.log + "\n"
      else if d.result
        worker.stop()
      $rootScope.$apply()
      return

    $rootScope.output = ""
    worker.send code
    return

