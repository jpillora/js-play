
App.controller 'Controls', ($scope, ace, gh, runner) ->

  scope = window.ctrl = $scope

  scope.mode = 'javascript'

  #handle auth
  gh.$on 'authenticated', ->
    console.log 'github ready!'
    window.gh = gh

  #click handler
  scope.login = ->
    gh.login()

  #key handler
  ace.handler 'key', (key, e) ->
    if key is 'return' and e.shiftKey
      run()
      e.preventDefault()
    return

  scope.run = ->
    code = ace.get()
    if scope.mode is 'coffeescript'
      try 
        code = CoffeeScript.compile code
      catch err
        if err.location
          ace.select()
        $.notify err.toString()
        return

    runner.run(code)