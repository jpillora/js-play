
App.factory '$exceptionHandler', -> -> (exception, cause) ->
  exception.message += ' (caused by "' + cause + '")';
  console.error exception

App.run ($rootScope, gh) ->
  window.app = $rootScope
  console.log 'playground init'
  $("#loading-cover").fadeOut 1000, -> $(@).remove()
