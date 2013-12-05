App.controller 'Spotlight', ($rootScope, $scope, key) ->

  scope = $rootScope.spotlight = $scope

  scope.shown = true

  key.bind 'both+\\', ->
    scope.shown = not scope.shown
    scope.$apply()
