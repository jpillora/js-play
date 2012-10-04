
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
    editor.setValue("print(42);");

    controlHeight = 50

    $window = $(window)

    context = (() ->
      @log = (s) -> console.log s
      @print = (s) -> $("#output").append  s + "\n";
    )();

    resize = -> 
      $('#editor,#results').height $window.height() - controlHeight
      $('#controls').height controlHeight

    runCode = ->
      $("#output").empty()
      code = editor.getValue()
      eval.apply(context, [code])

    $(document).ready ->
      $('#run').click runCode

    $(window).resize resize
    resize()