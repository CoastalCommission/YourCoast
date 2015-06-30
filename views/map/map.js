'use strict';

angular.module('yourCoast.map', [])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

		$stateProvider
			.state('map', {
				url: '/map',
				templateUrl: 'views/map/map.html',
				controller: 'mapController'
			})

			.state('location', {
				url: '/map/location/:locationID',
				templateUrl: 'views/map/map.html',
				controller: 'mapController'
			});


		$urlRouterProvider.otherwise('/map');
}])


.factory('AccessLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
  var remoteBaseURL = 'http://sf7144d.coastal.ca.gov:333/access/v1/locations',

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
			// 					,
			//
			// getWeatherByLatLong: $resource('api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude,
    	// 					   {},
    	// 					   {
    	// 					   		query: {
    	// 					   			method: 'GET',
    	// 					   			isArray: true,
    	// 					   			cache: true
    	// 					   		}
    	// 					   }
			// 					)
    };


	return locationsAPI;
}])


.controller('mapController', ['$scope', 'AccessLocationsAPI', 'uiGmapGoogleMapApi', '$stateParams', 'ngDialog', function($scope, AccessLocationsAPI, uiGmapGoogleMapApi, $stateParams, ngDialog) {
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
	$scope.map.locationList = [];

	$scope.openHelp = function helpOverlay() {
			$('body').chardinJs('start');
	}

	$scope.openFeedback = function openFeedback() {
			ngDialog.open({
					template: 'views/dialog/feedback.html'
			});
	}

	$scope.openAbout = function openAbout() {
			ngDialog.open({
					template: 'views/dialog/about.html'
			});
	}

	$scope.openPhoto = function openPhoto(photo) {
			ngDialog.open({
					template: "<img src='" + photo + "' style='width:100%'/>",
					plain: true
			});

			console.log(photo);
	}

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
			$scope.map.locationList = promisedLocations;

			angular.forEach(promisedLocations, function(location) {
				// add coords obj to each location
				location.coords = {
					latitude: location.LATITUDE,
					longitude: location.LONGITUDE
				};
			});

			$scope.openInfoWindow = function openInfoWindow(marker) {
				// from from map, else from sidebar
				if("model" in marker) {
					$scope.map.selectedMarker = marker.model;
					$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;
				} else {
					$scope.map.selectedMarker = marker;
					$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;
				}
			}

			$scope.closeInfoWindow = function closeInfoWindow() {
				$scope.map.selectedMarker.show = false;
			};

			$scope.openLocationPanel = function openLocationPanel(marker) {
				if("model" in marker) {
					$scope.map.selectedMarker = marker.model;
				} else {
					$scope.map.selectedMarker = marker;
				}

				console.log($scope.map.selectedMarker);

				$scope.map.locations           = [$scope.map.selectedMarker];
				$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;

				if($scope.map.selectedMarker != null) {
					$scope.map.selectedMarker.mapFifty = !$scope.map.selectedMarker.mapFifty;
				}


				$scope.map.options.center      = {
					latitude: $scope.map.selectedMarker.LATITUDE - 0.22,
					longitude: $scope.map.selectedMarker.LONGITUDE
				};

				$scope.map.options.zoom = 10;

				console.log($scope.map.options.center);

				// var locationPanel       = $('#LocationPanel'),
				//  		locationPanelHeight = locationPanel.height(),
				// 		mapContainer        = $('.angular-google-map-container'),
				// 		mapContainerHeight  = mapContainer.height();
				//
				// console.log(locationPanelHeight + ', ' + mapContainerHeight);
				// mapContainer.height(mapContainerHeight - locationPanelHeight);
			}

			$scope.closeLocationPanel = function closeLocationPanel() {
				$scope.map.selectedMarker      = [];
				$scope.map.locations           = promisedLocations;
				$scope.map.selectedMarker.show = false;
			}

			if($stateParams.locationID) {
				AccessLocationsAPI.getLocationByID.query().$promise.then(function(location) {
					$scope.openLocationPanel(location[0]);

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
  });
}]);
