App.factory 'console', ->

  ga 'create', 'UA-38709761-12', 'jsplay.com'
  ga 'send', 'pageview'

  log: ->
    console.log.apply console, arguments
    ga 'send', 'event', 'Log', [].slice.call(arguments).join(' ')

  error: ->
    console.error.apply console, arguments
    ga 'send', 'event', 'Error', [].slice.call(arguments).join(' ')
