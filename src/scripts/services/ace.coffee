App.factory 'ace', ($rootScope, storage) ->

  #prefixed store
  storage = storage.create 'ace'

  scope = $rootScope.ace = $rootScope.$new true

  Range = ace.require('ace/range').Range
  editor = ace.edit "ace"
  editor.$blockScrolling = Infinity
  session = editor.getSession()
  scope._ace = ace
  scope._editor = editor
  scope._session = session

  #ace pass keyevents to angular
  # editor.setKeyboardHandler
  #   handleKeyboard: (data, hashId, keyString, keyCode, e) ->
  #     return unless e
  #     keys = []
  #     keys.push 'ctrl' if e.ctrlKey
  #     keys.push 'command' if e.metaKey
  #     keys.push 'shift' if e.shiftKey
  #     keys.push keyString
  #     str = keys.join '+'
  #     if key.isBound str
  #       key.trigger str
  #       e.preventDefault()
  #       return false
  #     return true

  #no workers
  session.setUseWorker(false)

  #apply new settings
  scope.config = (c) ->
    editor.setTheme "ace/theme/#{c.theme}" if c.theme
    editor.setShowPrintMargin c.printMargin if 'printMargin' of c
    session.setMode "ace/mode/#{c.mode}" if c.mode
    session.setTabSize c.tabSize if 'tabSize' of c
    session.setUseSoftTabs c.softTabs if 'softTabs' of c
    console.log "config", c

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
  scope.set storage.get('current-code') or "console.log('hello world!');"

  editor.on 'change', ->
    storage.set 'current-code', scope.get()

  scope
