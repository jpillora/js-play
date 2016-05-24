#TODO(jpillora): this service was supposed to generically store all forms
#of snippets, whatever the source (e.g. localstorage, firebase, gists, etc)
#each 'datum' should be searchable using 'spotlight'
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
  datums.search = (key, val) ->
  datums
