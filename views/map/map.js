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


.controller('mapController', ['$scope', 'AccessLocationsAPI', 'uiGmapGoogleMapApi',
						function($scope, AccessLocationsAPI, uiGmapGoogleMapApi) {

	$scope.map = {};
	$scope.map.locations = [];
	$scope.map.locations.coords = {};
	$scope.map.options = {
							center: {
								latitude: 37.632711,
								longitude: -122.572511
							},
							zoom: 6,
							cluster: {
								minimumClusterSize : 10
							}
						};
	$scope.map.events = {
							tilesloaded: function (maps, eventName, args) {},
							dragend: function (maps, eventName, args) {},
							zoom_changed: function (maps, eventName, args) {}
                        };

	if("geolocation" in navigator) {
		$scope.geolocate = function geolocate() {
			navigator.geolocation.getCurrentPosition(function(position) {
				$scope.$apply(function() {
					$scope.map.options.center.latitude = position.coords.latitude;
					$scope.map.options.center.longitude = position.coords.longitude
					$scope.map.options.zoom = 12;
				});

				console.log($scope.map);
			});
		}
	} else {
		$scope.feedback = "Sorry, your browser doesn't support geolocation."
	}

	uiGmapGoogleMapApi.then(function(maps) {
		console.log(maps);

		AccessLocationsAPI.getAllLocations().$promise.then(function(promisedLocations) {
			$scope.map.locations = promisedLocations;

			angular.forEach(promisedLocations, function(location) {
				// add coords obj to each location
				location.coords = {
					latitude: location.LATITUDE,
					longitude: location.LONGITUDE
				};
			});

			console.log($scope.map.locations);
		});
    });
}]);