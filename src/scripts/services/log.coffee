App.factory 'console', ->

  log: ->
    console.log.apply console, arguments

  error: ->
    console.error.apply console, arguments