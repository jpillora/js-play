App.factory 'database', () ->
  fdb = firebase.database()
  #auth
  auth = (fn) ->
    if auth.user
      fn null, auth.user
    req = firebase.auth().signInAnonymously()
    req.onAuthStateChanged (user) ->
      auth.user = user
      fn null, auth.user
    req.catch (error) ->
      console.warn "firebase auth error", error
      fn error
  #api
  database =
    set: (k,v) ->
      auth ->
        fdb.ref(k).set(v)
      return
    on: (k, fn) ->
      auth ->
        fdb.ref(k).on "value", (snap) -> fn(snap.val())
      return
  window.database = database
  return database
