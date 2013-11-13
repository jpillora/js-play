
App.factory 'runner', ($rootScope) ->

  workerFn = (code)->

    output = ""

    context = (->
      @console =
        log: ->
          args = Array::slice.call arguments
          strs = []
          for arg in args
            strs.push if typeof arg is "object"
              JSON.stringify arg
            else
              arg
          output += strs.join(" ") + "\n"
    )()

    try
      eval.call(context, code)
      return output
    catch err
      return {err:err.toString()}

  run: (code, context) ->
    
    p = new Parallel code,
      evalPath: 'js/eval.js'

    p.require('//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.2.1/lodash.min.js');

    p.spawn(workerFn).then (result) ->

      if typeof result is 'object'
        $.notify result.err
        return

      $rootScope.output = result
      $rootScope.$apply()

    , (err) ->
      console.error "Parallel Worker Failed: ", err
    
    window.currp = p

