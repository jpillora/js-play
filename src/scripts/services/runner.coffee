
App.factory 'runner', ($rootScope) ->

  workerFn = (code)->

    output = ""

    context = (->
      @console =
        log: ->
          args = Array::slice.call arguments
          str = ""
          for arg in args
            switch typeof arg
              when "object" then str += JSON.stringify arg
              else str += arg
          output += str + "\n"
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

