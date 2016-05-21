App.factory 'database', () ->
  #init and auth
  db = null
  user = null
  prepare = (fn) ->
    if db
      return fn()
    firebase.initializeApp
      apiKey: "AIzaSyAXxUJr9p5lMcN8_XXsn-ugsKUTQvXKoRc",
      authDomain: "js-play-cd3d8.firebaseapp.com",
      databaseURL: "https://js-play-cd3d8.firebaseio.com",
      storageBucket: ""
    db = window.database = firebase.database()
    success = null
    int = setInterval ->
      u = firebase.auth().currentUser
      if u and success is null
        success = true
        user = u
        fn()
        clearInterval int
    , 100
    setTimeout ->
      if success is null
        success = false
        fn()
    , 3000
  auth = (fn) ->
    #has user
    if user
      return fn()
    #create account and fetch user
    console.log "no current user, creating account"
    firebase.auth().signInAnonymously().catch (error) ->
      fn(error)
    firebase.auth().onAuthStateChanged (u) ->
      user = u
      console.log "got user", u
      fn()
    return null
  #api
  database =
    init: (k, fn) ->
      prepare (error) ->
        if error
          return fn(error)
        auth (error) ->
          console.log "authed", error
          if error
            return fn(error)
          database.get k, (val) ->
            fn(null, val)
    set: (k,v) ->
      db.ref(k).set(v)
    get: (k, fn) ->
      db.ref(k).once "value", (snap) -> fn(snap.val())
    on: (k, fn) ->
      db.ref(k).on "value", (snap) -> fn(snap.val())
    off: ->
      db.ref(k).off "value"
  return database
