
App.factory 'key', (ace) ->
  key = {}
  key.bind = (key, fn) ->
    ace._editor.commands.addCommand
      name: "custom-"+key,
      bindKey: {win: "Ctrl-"+key, mac: "Command-"+key},
      exec: fn
  key
