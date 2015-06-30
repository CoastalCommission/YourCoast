'use strict';

angular.module('yourCoast.map', [])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('map', {
				url: '/map',
				templateUrl: '/views/map/map.html',
				controller: 'mapController'
			})

			.state('location', {
				url: '/map/location/:locationID',
				templateUrl: '/views/map/map.html',
				controller: 'mapController'
			});


		$urlRouterProvider.otherwise('/map');
}])


.factory('AccessLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
  var remoteBaseURL = 'http://localhost:333/access/v1/locations',

    locationsAPI   = {
    	getAllLocations: $resource(remoteBaseURL,
		                            {},
		                            {
		                            	query: {
			                                method: 'GET',
			                                isArray: true,
			                                cache: true
		                            	}
		                            }),

    	getLocationByID: $resource(remoteBaseURL + '/' + $stateParams.locationID,
		                            {},
		                            {
		                            	query: {
			                                method: 'GET',
			                                isArray: true,
			                                cache: true
		                            	}
		                            }),

    	getLocationByName: $resource(remoteBaseURL + '/' + $stateParams.locationName,
    						   {},
    						   {
    						   		query: {
    						   			method: 'GET',
    						   			isArray: true,
    						   			cache: true
    						   		}
    						   }
    						   )
    };
    						

	return locationsAPI;
}])


.controller('mapController', ['$scope', 'AccessLocationsAPI', 'uiGmapGoogleMapApi', '$stateParams', function($scope, AccessLocationsAPI, uiGmapGoogleMapApi, $stateParams) {
	$scope.map = {};
	$scope.map.locations = [];
	$scope.map.locations.coords = {};
	$scope.map.selectedMarker = [];
	$scope.map.selectedMarker.show = false;
	$scope.map.options = {
							center: {
								latitude: 37.632711,
								longitude: -122.572511
							},
							zoom: 6,
							cluster: {
								minimumClusterSize : 10,
								zoomOnClick: true,
								clusterStyles: [
									{
										textColor: 'white',
										url: 'icons/m3.png',
										height: 50,
										width: 50
									}
								]
							},
							custom: {
								panControl: false,
								scaleControl: false,
								zoomControl: true,
								scaleControl: true,
								streetViewControl: true,
								mapTypeId: "terrain",
								// streetViewControlOptions: {
								// 	position: "ControlPosition.RIGHT_TOP"
								// },
								styles: [
											{"featureType":"landscape",
												"stylers":[
													{"hue":"#F1FF00"},
													{"saturation":-27.4},
													{"lightness":9.4},
													{"gamma":1}
												]
											},
											{"featureType":"road.highway",
												"stylers":[
													{"hue":"#ffd54f"},
													{"saturation":-20},
													{"lightness":36.4},
													{"gamma":1}
												]
											},
											{"featureType":"road.arterial",
												"stylers":[
													{"hue":"#00FF4F"},
													{"saturation":0},
													{"lightness":0},
													{"gamma":1}
												]
											},
											{"featureType":"road.local",
												"stylers":[
													{"hue":"#FFB300"},
													{"saturation":-38},
													{"lightness":11.2},
													{"gamma":1}
												]
											},
											{"featureType":"water",
											"elementType":"geometry.fill",
												"stylers":[
													{"color":"#81D4FA"},
													{"visibility": "on"}
												]
											},
											{"featureType":"poi",
												"stylers":[
													{"hue":"#5af158"},
													{"saturation":0},
													{"lightness":0},
													{"gamma":1}
												]
											}
										]
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
		AccessLocationsAPI.getAllLocations.query().$promise.then(function(promisedLocations) {
			$scope.map.locations = promisedLocations;

			angular.forEach(promisedLocations, function(location) {
				// add coords obj to each location
				location.coords = {
					latitude: location.LATITUDE,
					longitude: location.LONGITUDE
				};
			});
		});

		$scope.openInfoWindow = function openInfoWindow(marker) {
			// from from map, else from sidebar
			if("model" in marker) {
				$scope.map.selectedMarker      = marker.model;
				$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;
			} else {
				$scope.map.selectedMarker      = marker;
				$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;
			}
		}

		$scope.closeInfoWindow = function closeInfoWindow() {
			$scope.map.selectedMarker.show = false;
		};

		if($stateParams.locationID) {
			AccessLocationsAPI.getLocationByID.query().$promise.then(function(location) {
				console.log(location[0]);
				$scope.openInfoWindow(location[0]);

				angular.forEach(location, function(location) {
					// add coords obj to each location
					location.coords = {
						latitude: location.LATITUDE,
						longitude: location.LONGITUDE
					};
				});
			});
		}

		if($stateParams.locationName) {
			AccessLocationsAPI.getLocationByID.query().$promise.then(function(location) {
				console.log(location[0]);
				$scope.openInfoWindow(location[0]);

				angular.forEach(location, function(location) {
					// add coords obj to each location
					location.coords = {
						latitude: location.LATITUDE,
						longitude: location.LONGITUDE
					};
				});
			});
		}
    });
}]);