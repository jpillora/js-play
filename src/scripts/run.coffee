
App.factory '$exceptionHandler', (console) -> (exception, cause) ->
  console.error 'Exception caught\n', exception.stack or exception
  console.error 'Exception cause', cause if cause

App.run ($rootScope, gh, console) ->
  window.root = $rootScope
  console.log 'Init'
  $("#loading-cover").fadeOut 1000, -> $(@).remove()

window.Plugins = angular.module 'plugins', ['playground']
