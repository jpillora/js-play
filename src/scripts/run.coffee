
# App.factory '$exceptionHandler', -> -> (exception, cause) ->
#   exception.message += ' (caused by "' + cause + '")';
#   console.error exception

App.run ($rootScope, gh) ->
  console.log 'playground init'


