App.factory 'ace', ($rootScope, storage) ->

  scope = $rootScope.ace = $rootScope.$new true

  Range = ace.require('ace/range').Range
  editor = ace.edit "ace"
  session = editor.getSession()

  scope._editor = editor
  scope._session = session

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
    editor.setTheme "ace/theme/#{c.theme}" if c.theme
    session.setMode "ace/mode/#{c.mode}" if c.mode
    session.setTabSize c.tabSize if 'tabSize' of c
    session.setUseSoftTabs c.softTabs if 'softTabs' of c
    editor.setShowPrintMargin c.printMargin if 'printMargin' of c

  scope.set = (val) ->
    session.setValue val

  scope.get = ->
    session.getValue()

  scope.highlight = (loc, t = 3000) ->
    r = new Range(loc.row, loc.col, loc.row, loc.col+1)
    m = session.addMarker r, "ace_warning", "text", true
    setTimeout ->
      session.removeMarker m
    , t

  #apply default config
  scope.config
    theme: "monokai"
    tabSize: 2
    softTabs: true
    printMargin: false
  #set default code
  scope.set storage.get('ace-current-code') or "console.log('hello world!');"

  editor.on 'change', ->
    storage.set 'ace-current-code', scope.get()

  scope

