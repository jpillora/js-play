#github logins, fetch gists, see 'datums' for usecase
App.factory 'gh', ($http, $rootScope, $timeout, storage, console, datums) ->
  #prefixed store
  storage = storage.create 'gh'
  gh = $rootScope.gh = $rootScope.$new true
  gh.authed = false
  #indexable gh datum
  datums.type 'gist', {
    save: ->
    remove: ->
  }
  #public methods
  gh.login = ->
    win = window.open 'https://github.com/login/oauth/authorize?'+
                      'client_id=222d95176d7d50c1b8a3&'+
                      'scope=gist',
                      'gh-login',
                      'top=100,left=100'
    recieved = false
    recieveCode = (e) ->
      recieved = true
      window.removeEventListener recieveCode
      getToken e.data
    check = ->
      return if recieved
      win.postMessage "!","*"
      setTimeout check, 100
    window.addEventListener "message", recieveCode
    check()

  gh.logout = ->
    storage.del "auth"
    gh.github = null
    gh.authed = false

  #private methods
  getToken = (code) ->
    $http.
      get('http://js-playground-gatekeeper.herokuapp.com/authenticate/'+code).
      success(init)

  init = (auth) ->
    unless auth
      return

    if auth.error
      console.error auth.error
      return

    auth.date = Date.now()
    gh.github = new Github
      token: auth.token

    gh.authed = true
    storage.set "auth", auth
    gh.$broadcast 'authenticated'
    console.log "gh: init: %s", auth.token
    loadGists()

  loadGists = ->
    gh.github.getUser().gists (err, gists) ->
      return console.error err if err
      gh.gists = gists

  #reload last session
  $timeout ->
    init storage.get "auth"

  gh
