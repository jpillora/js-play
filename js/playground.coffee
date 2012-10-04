
define [
  'util/log'
  'ext/ace'
  'less!../stylesheets/playground'
  'underscore'
  'lib/prettify'
  'bootstrap'],
  (log, aceExt) ->

    log 'running playground coffee'

    editor = ace.edit("editor")
    editor.getSession().setMode("ace/mode/javascript");
    editor.setValue("alert(42);");

    controlHeight = 50

    $window = $(window)

    resize = -> 
      $('#editor,#results').height $window.height() - controlHeight
      $('#controls').height controlHeight

    runCode = ->
      eval(editor.getValue())

    $(document).ready ->
      $('#run').click runCode

    $(window).resize resize
    resize()