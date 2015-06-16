'use strict';

angular.module('yourCoast.map', [])

.config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

		$stateProvider.state('map', {
			url: '/map',
			templateUrl: '/views/map/map.html',
			controller: 'mapController'
		});

		$urlRouterProvider.otherwise('/map');
}])


.factory('AccessLocationsAPI', ['$resource',
                		function($resource) {
  var remoteSearchURL = 'http://localhost:7000/access/v1/locations',

    locationsAPI   = $resource(remoteSearchURL,
                            {},
                            {
                              getAllLocations: {
                                method: 'GET',
                                isArray: true,
                                cache: true
                              }
                            }
                           );

  return locationsAPI;
}])


.controller('mapController', ['$scope', 'AccessLocationsAPI',
						function($scope, AccessLocationsAPI) {

	$scope.locations = AccessLocationsAPI.getAllLocations();
	console.log($scope.locations);
}]);