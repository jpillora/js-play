App.factory 'ace', ($rootScope) ->

  scope = $rootScope.$new true

  editor = ace.edit "ace"
  session = editor.getSession()

  #handler list
  handlers = {}
  scope.handler = (key, fn) ->
    (handlers[key] ?= []).push fn

  #ace pass keyevents to angular
  editor.setKeyboardHandler
    handleKeyboard: (data, hashId, keyString, keyCode, e) ->
      for fn in handlers['key'] or []
        fn(keyString, e)
      return

  #no workers
  editor.getSession().setUseWorker(false)

  #apply new settings
  scope.config = (c) ->
    editor.setTheme c.theme if c.theme
    session.setMode c.mode if c.mode
    session.setTabSize c.tabSize if 'tabSize' of c
    session.setUseSoftTabs c.softTabs if 'softTabs' of c
    editor.setShowPrintMargin c.printMargin if 'printMargin' of c

  scope.set = (val) ->
    session.setValue val

  scope.get = ->
    session.getValue()

  scope.select = ->
    session.addMarker(new Range(1, 0, 15, 0), "ace_active_line", "background");


  #apply default config
  scope.config
    theme: "ace/theme/monokai"
    mode: "ace/mode/javascript"
    tabSize: 2
    softTabs: true
    printMargin: false
  #set default code
  scope.set "console.log('hello world!');"

  # editor.on 'change', update
  scope

