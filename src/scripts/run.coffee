
App.factory '$exceptionHandler', (console) -> (exception, cause) ->
  console.error 'exception caught\n', exception.stack or exception
  console.error 'exception cause', cause if cause

App.run ($rootScope, gh, console) ->
  window.root = $rootScope
  console.log 'playground init'
  $("#loading-cover").fadeOut 1000, -> $(@).remove()


window.Plugins = angular.module 'plugins', ['playground']