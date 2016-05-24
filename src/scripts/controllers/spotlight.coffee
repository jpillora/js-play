#TODO(jpillora): see 'dataums'
App.controller 'Spotlight', ($rootScope, $scope, key) ->
  scope = $rootScope.spotlight = $scope
  scope.shown = false
  key.bind 'Super-\\', ->
    scope.shown = not scope.shown
    scope.$apply()
