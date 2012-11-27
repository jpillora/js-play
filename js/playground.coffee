
define [
  'util/log'
  'ace'
  'less!../stylesheets/playground'
  'underscore'
  'lib/prettify'
  'bootstrap'],
  (log, aceExt) ->

    init = ->
      log 'running playground coffee'
      editor = ace.edit("editor")
      editor.getSession().setMode("ace/mode/javascript");
      editor.setValue("print(_.range(1,20));");
      window.editor = editor
      $window = $(window)

      editor.setKeyboardHandler
        handleKeyboard: (data, hashId, keyString, keyCode, e) ->
          if keyString is 'return' and e.shiftKey
            runCode()
            e.preventDefault()
            return false
          return true

      context = (() ->
        @window = {}
        @document = {}
        @log = (s) -> console.log s
        @print = (s) -> $("#output").append  s + "\n";
      )();

      resize = ->
        console.log 'resize'
        $('#editor,#results').height $window.height()

      runCode = ->
        $("#output").empty()
        code = editor.getValue()
        eval.apply(context, [code])

      $(document).ready ->
        $('#run').click runCode
        runCode()
        $('.loading-cover').fadeOut()

      $(window).resize resize
      resize()

    init.t = setInterval -> 
      if window.ace isnt `undefined`
        clearInterval(init.t)
        init()
    , 500

