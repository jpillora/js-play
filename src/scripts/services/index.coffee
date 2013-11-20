

App.factory 'index', ($rootScope) ->


  index = $rootScope.index = $rootScope.$new true

  index.Datum = class Datum
    constructor: ->

  index.add: (d) ->
  index.search: (key, val) ->

  index