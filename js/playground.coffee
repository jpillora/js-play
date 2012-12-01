
define [
  'util/log'
  'ace'
  'less!../stylesheets/playground'
  'underscore'
  'lib/prettify'
  'bootstrap.js'
  'bootstrap.css'],
  (log, aceExt) ->

    init = ->
      log 'running playground coffee'
      $window = $(window)

      editor = ace.edit("editor")
      editor.getSession().setMode("ace/mode/javascript");
      editor.setShowPrintMargin(false);
      window.editor = editor

      #ace customisations
      editor.setKeyboardHandler
        handleKeyboard: (data, hashId, keyString, keyCode, e) ->
          if keyString is 'return' and e.shiftKey
            runCode()
            e.preventDefault()
            return false
          return true

      #extra scope
      context = (() ->
        @log = (s) -> 
          console.log s
        @print = (s) ->
          $("#output").append  s + "\n";
      )();

      showAlert = (type, msg) ->
        clearTimeout showAlert.t
        $(".alert strong").html(type)
        $(".alert span").html(msg)
        $(".alert").fadeIn()
        showAlert.t = setTimeout hideAlert, 3000

      hideAlert = -> $(".alert").fadeOut()

      #on resize
      resize = ->
        console.log 'resize'
        $('#editor,#results').height $window.height()

      runCount = 0
      runCode = ->
        $("#output").empty()
        
        code = """
          (function() {
            //@ sourceURL=#{(runCount++)}.js

            var window = {};
            var document = {};

            #{editor.getValue()}
            ;;;
          }.call(context));
        """

        try
          eval(code)
        catch e
          showAlert.apply @, e.toString().split(":")

      setCode = (c) ->
        editor.setValue c

      #save and load functions
      storeCode = ->
        key = $("#saveName").val()
        return unless key
        localStorage[key] = editor.getValue()

        updateLoadList()

      loadCode = (e) ->
        key = $(e.currentTarget).html()
        setCode localStorage[key]
        toggleLoadList()

      toggleLoadList = ->
        $("#loadList").slideToggle()

      updateLoadList = ->
        items = _.map _.keys(localStorage), (k) ->
          "<div>#{k}</div>"
        $("#loadList").html items.join('')
        
      initSaveLoad = ->
        if typeof(Storage) is `undefined`
          $("#save,#load").attr('disabled', 'disabled')
          return
      
        $("#save").click storeCode
        $("#load").click toggleLoadList
        $("#loadList").hide().on "click", "div", loadCode
        updateLoadList()

      initRun = ->
        $('#run').click runCode
        setCode "print(_.range(1,20));"
        runCode()

      initAlert = ->
        $(".alert").hide().on "click", hideAlert

      #prepare dom
      $(document).ready ->
        initSaveLoad() 
        initRun()
        initAlert()
        $('.loading-cover').fadeOut()

      $(window).resize resize
      resize()

    #wait for ace to be ready
    init.t = setInterval -> 
      if window.ace isnt `undefined`
        clearInterval(init.t)
        init()
    , 500

