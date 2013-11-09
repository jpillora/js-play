
App.factory 'runner', ($rootScope) ->

  workerFn = (code)->

    output = ""

    context = (() ->
      @console =
        log: (s) -> output += s
    )()

    try
      eval.call(context, code)
      return output
    catch err
      return "!!!"+err.toString()

  run: (code, context) ->
    new Parallel(code).spawn(workerFn).then((str) ->

      if str.substr(0,3) is "!!!"
        $.notify str.substr 3
        return

      $rootScope.output = str
      $rootScope.$apply()

    , (err) ->
      console.error "Parallel Worker Failed: ", err
    )


