App.factory 'datums', ($rootScope) ->

  datums = $rootScope.datums = $rootScope.$new true

  types = {}

  #base datum methods
  class BaseDatum
    constructor: ->

  #create new datums
  datums.type = (name, methods) ->
    class NewDatum extends BaseDatum
      constructor: ->
      name: name

    NewDatum::[k] = v for k,v of methods

    types[name] = NewDatum
    true

  #add a new datum point, requires type
  datums.add = (d) ->

  #custom angular filter
  datums.filter = (key, val) ->

  datums
