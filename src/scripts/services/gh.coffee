
App.factory 'gh', ($http, $rootScope) ->

  gh = $rootScope.$new true

  gh.login = ->
    win = window.open 'https://github.com/login/oauth/authorize?'+
        'client_id=222d95176d7d50c1b8a3',
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

  getToken = (code) ->
    console.log "code", code
    $http.
      get('http://js-playground-gatekeeper.herokuapp.com/authenticate/'+code).
      success(initGithub)

  initGithub = (obj) ->
    if obj.error
      console.error obj.error
      return
    gh.github = new Github
      token: obj.token
    gh.$broadcast 'authenticated'

  gh
