
define [
  'util/log'
  'ext/ace'
  'css!framework/css/bootstrap-combined.min'
  'less!../stylesheets/playground'
  'underscore'
  'lib/prettify'
  'lib/bootstrap.min'],
  (log, aceLoader) ->  

    log 'running playground coffee'

    editor = ace.edit("editor")
    editor.getSession().setMode("ace/mode/javascript");
    editor.setValue("alert(42);");

    controlHeight = 50

    $window = $(window)

    resize = -> 
      $('#editor,#results').height $window.height() - controlHeight
      $('#controls').height controlHeight


    $(window).resize resize
    resize()