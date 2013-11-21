App.factory 'storage', (datums) ->

  datums.type 'storage', {
    save: ->
    remove: ->
  }

  get: (key) ->
    str = localStorage.getItem key
    if str and str.substr(0,4) is "J$ON"
      return JSON.parse str.substr 4
    return str

  set: (key, val) ->
    if typeof val is 'object'
      val = "J$ON#{JSON.stringify(val)}"
    localStorage.setItem key, val

  del: (key) ->
    localStorage.removeItem key