
define [
  'lib/coffee-script'
  'util/log'
  'ace'
  'less!../stylesheets/playground'
  'underscore'
  'lib/prettify'
  'bootstrap.js'
  'bootstrap.css'],
  (CoffeeScript, log, aceExt) ->

    init = ->
      log 'running playground coffee'
      $window = $(window)

      editor = ace.edit("editor")
      editor.setShowPrintMargin(false);
      window.editor = editor
      window.CoffeeScript = CoffeeScript

      codeTemplate = _.template """
        (function() {
          //@ sourceURL=<%= count %>.js
          var window = {};
          var document = {};
          <%= code %>
        }());
        """

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

      hideAlert = -> 
        $(".alert").fadeOut()

      useCoffeeScript = (bool) ->
        if bool isnt `undefined`
          changed = bool isnt useCoffeeScript()
          $("#coffeeToggle")[0].checked = bool
          setEditMode() if changed
          return bool
        
        return $("#coffeeToggle")[0].checked

      setEditMode = ->
        mode = if useCoffeeScript() then "coffee" else "javascript"
        editor.getSession().setMode("ace/mode/#{mode}")

      #on resize
      resize = ->
        $('#editor,#results').height $window.height()

      runCount = 0
      runCode = ->
        $("#output").empty()
        
        value = editor.getValue()

        if useCoffeeScript()
          runCoffeeScript value
        else
          runJavaScript value

      runCoffeeScript = (code) ->

        try
          jsCode = CoffeeScript.compile code
        catch e
          showAlert.apply @, e.toString().split(":")
          return

        runJavaScript jsCode

      runJavaScript = (code) ->

        finalCode = codeTemplate { count: runCount++, code }

        try
          eval.call context, finalCode
        catch e
          showAlert.apply @, e.toString().split(":")

      setCode = (c) ->
        editor.setValue c

      #save and load functions
      saveCode = ->
        key = $("#saveName").val()
        return unless key
        localStorage[key] = JSON.stringify
          coffee: useCoffeeScript()
          code: editor.getValue()

        updateLoadList()
        localStorage['__lastSave__'] = key

      loadCodeEvent = (e) -> 
        loadCode $(e.currentTarget).html()

      loadCode = (key) ->
        stored = localStorage[key]
        return false unless stored
        {coffee, code} = JSON.parse stored
        setCode code
        useCoffeeScript coffee
        toggleLoadList()
        return true

      toggleLoadList = ->
        $("#loadList").slideToggle()

      updateLoadList = ->
        items = _.map _.keys(localStorage), (k) ->
          if k is "__lastSave__" then "" else "<div>#{k}</div>"
        $("#loadList").html items.join('')
        
      initSaveLoad = ->

        $("#loadList").hide().on "click", "div", loadCodeEvent

        if typeof(Storage) is `undefined`
          $("#save,#load").attr('disabled', 'disabled')
          return
      
        $("#save").click saveCode
        $("#load").click toggleLoadList
        updateLoadList()

      initRun = ->
        $("#coffeeToggle").change setEditMode
        $('#run').click runCode

        unless loadCode localStorage['__lastSave__']
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

