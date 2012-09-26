
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
    editor.setValue("function foo(items) {\n"+
    "  var i;\n"+
    "  for (i = 0; i < items.length; i++) {\n"+
    "      alert('Ace Rocks ' + items[i]);\n"+
    "  }\n"+
    "}\n");
