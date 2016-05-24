
App.factory 'key', (ace) ->
  #public api
  bind: (key, fn) ->
    mac = key.replace /^Super-/, "Command-"
    win = key.replace /^Super-/, "Ctrl-"
    ace._editor.commands.addCommand
      name: "Custom-"+key,
      bindKey: {win, mac},
      exec: fn
