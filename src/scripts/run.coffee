
App.factory '$exceptionHandler', (console) -> (exception, cause) ->
  console.error 'Exception caught\n', exception.stack or exception
  console.error 'Exception cause', cause if cause

App.run ($rootScope, gh, console) ->
  window.root = $rootScope
  $("#loading-cover").fadeOut 1000, -> $(@).remove()
  setTimeout ->
    superkey = if /Macintosh/.test window.navigator.userAgent then "Cmd" else "Ctrl"
    $.notify "Run with #{superkey}+Enter", "info"
  , 10*1000

window.Plugins = angular.module 'plugins', ['playground']
