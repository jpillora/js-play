
App.controller 'Controls', ($rootScope, $scope, $window, ace, gh, runner, storage, key) ->

  scope = $rootScope.controls = $scope

  #bind run shortcut
  key.bind 'Enter', ->
    console.log "run"
    scope.run()
  key.bind 'C', ->
    console.log "toggle"
    scope.toggleMode()
  #use prev mode
  scope.mode = storage.get('mode') or 'javascript'
  ace.config mode:scope.mode
  #click handler
  scope.login = ->
    gh.login()
    return
  #handle auth
  gh.$on 'authenticated', ->
    window.gh = gh

  scope.toggleMode = ->
    if scope.mode is 'javascript'
      scope.mode = 'coffee'
    else
      scope.mode = 'javascript'
    ace.config mode:scope.mode
    storage.set('mode', scope.mode)

  scope.run = ->
    code = ace.get()
    #coffeescript
    if scope.mode is 'coffee'
      try
        code = CoffeeScript.compile code
      catch err
        loc = err.location
        if loc
          ace.highlight {row: loc.first_line, col:loc.first_column}
        $.notify err.toString()
        return
    #confirm js syntax
    try
      acorn.parse code
    catch err
      loc = err.loc
      if err.loc
        ace.highlight {row: loc.line-1, col:loc.column}
      $.notify err.toString()
      return
    #now we run
    runner.run(code)
