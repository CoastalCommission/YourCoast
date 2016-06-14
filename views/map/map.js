(function() {
	'use strict';

	angular.module('yourCoast.map', [])

	.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

		$stateProvider
			// default map view
			.state('map', {
				abstract: true,
				url: '/map',
				template: '<ui-view/>'
			})

			.state('map.index', {
				url: '',
				templateUrl: 'views/map/map.html',
				controller: 'mapController',
				controllerAs: 'mapCtrl',
				resolve: {
					locations: ['AccessLocationsAPI', function(AccessLocationsAPI) {
						return AccessLocationsAPI.getAllLocations.query();
					}],

					location: [function() {
						return
					}]
				}
			})

			.state('map.location-id', {
				url: '/locations/:locationID',
				templateUrl: 'views/map/map.html',
				controller: 'mapController',
				controllerAs: 'mapCtrl',
				resolve: {
					locations: ['AccessLocationsAPI', function(AccessLocationsAPI) {
						return AccessLocationsAPI.getAllLocations.query();
					}],

					location: ['$stateParams', 'AccessLocationsAPI', function($stateParams, AccessLocationsAPI) {
						return AccessLocationsAPI.getLocationByID.query({
							locationID: $stateParams.locationID
						});
					}]
				}
			});
	}])


	.controller('mapController', ['locations', 'location', 'WeatherAPI', 'uiGmapGoogleMapApi', '$filter', '$state', 'ngDialog', function(locations, location, WeatherAPI, uiGmapGoogleMapApi, $filter, $state, ngDialog) {

		// view model
		var vm = this;

		// defaults
		vm.map = {};
		vm.map.locations = [];
		vm.map.fullyLoaded = false;
		vm.hasGeolocation = false;
		vm.map.geolocation = {};
		vm.map.selectedMarker = [];
		if(locations && location) {
			vm.map.selectedMarker.show = true;
		} else {
			vm.map.selectedMarker.show = false;
		}
		vm.map.options = {
			center: {
				latitude: 37.632711,
				longitude: -120.572511
			},
			zoom: 6,
			cluster: {
				minimumClusterSize : 10,
				zoomOnClick: true,
				styles: [
					{
							url: 'icons/m4-fab.png',
							width:60,
							height:60,
							textColor: 'white',
							textSize: 14,
							fontFamily: 'Open Sans'
					}
				],
				averageCenter: true,
				clusterClass: 'cluster-icon'
			},
			custom: {
				panControl: false,
				tilt: 0,
				zoomControl: true,
				scaleControl: true,
				streetViewControl: true,
				mapTypeId: 'terrain',
				// streetViewControlOptions: {
				// 	position: 'ControlPosition.RIGHT_TOP'
				// },
				styles: [
					{'featureType':'landscape',
						'stylers':[
							{'hue':'#F1FF00'},
							{'saturation':-27.4},
							{'lightness':9.4},
							{'gamma':1}
						]
					},
					{'featureType':'road.highway',
						'stylers':[
							{'hue':'#ffd54f'},
							{'saturation':-20},
							{'lightness':36.4},
							{'gamma':1}
						]
					},
					{'featureType':'road.arterial',
						'stylers':[
							{'hue':'#00FF4F'},
							{'saturation':0},
							{'lightness':0},
							{'gamma':1}
						]
					},
					{'featureType':'road.local',
						'stylers':[
							{'hue':'#FFB300'},
							{'saturation':-38},
							{'lightness':11.2},
							{'gamma':1}
						]
					},
					{'featureType':'water',
					'elementType':'geometry.fill',
						'stylers':[
							{'color':'#81D4FA'},
							{'visibility': 'on'}
						]
					},
					{'featureType':'poi',
						'stylers':[
							{'hue':'#5af158'},
							{'saturation':0},
							{'lightness':0},
							{'gamma':1}
						]
					}
				]
			}
		};
		vm.map.events = {
			click: function click(marker, eventName, model) {
				$state.go('map.location-id', {
					locationID: model.ID
				});
            }
		};
		vm.menuActive = false;
		vm.locationsList = [];

		// $scope.$watch(function() {
		// 	$rootScope.searchQuery = vm.search;
		// });

		if(locations) {
			locations.$promise.then(function(promisedLocations) {
				angular.forEach(promisedLocations, function(location) {
					location.coords = {
						latitude: location.LATITUDE,
						longitude: location.LONGITUDE
					};

					// WeatherAPI.query({
					//     latitude: location.LATITUDE,
					//     longitude: location.LONGITUDE
					// }).$promise.then(function(promisedWeather) {
					//     location.weather = promisedWeather.query.results.channel;
					// });

					location.icon = 'http://maps.google.com/mapfiles/ms/micons/yellow.png';
				});

				vm.locationsList = promisedLocations;
				vm.map.locations = promisedLocations;
			});
		}

		if(location) {
			location.$promise.then(function(promisedLocation) {
				angular.forEach(promisedLocation, function(location) {
					location.coords = {
						latitude: location.LATITUDE,
						longitude: location.LONGITUDE
					};

					// WeatherAPI.query({
					//     latitude: location.LATITUDE,
					//     longitude: location.LONGITUDE
					// }).$promise.then(function(promisedWeather) {
					//     location.weather = promisedWeather.query.results.channel;
					// });

					location.icon = 'http://maps.google.com/mapfiles/ms/micons/yellow.png';
				});

				// set page title
				document.title = promisedLocation[0].NameMobileWeb;

				vm.map.selectedMarker = promisedLocation[0];
				vm.map.locations = [vm.map.selectedMarker];

				// toggle LocationPanel visibility
				vm.map.selectedMarker.show = !vm.map.selectedMarker.show;

				// pan map viewport to selected marker
				vm.map.options.center = {
					latitude: vm.map.selectedMarker.LATITUDE - 0.01,
					longitude: vm.map.selectedMarker.LONGITUDE
				};

				// zoom in on selected marker
				vm.map.options.zoom = 14;
			});
		}

		vm.toggleMenu = function toggleMenu() {
			vm.menuActive = !vm.menuActive;
		};

		vm.openHelp = function helpOverlay() {
			$('body').chardinJs('start');
		};

		vm.openFeedback = function openFeedback() {
			ngDialog.open({
				template: 'views/dialog/feedback.html'
			});
		};

		vm.openAbout = function openAbout() {
			ngDialog.open({
				template: 'views/dialog/about.html'
			});
		};

		vm.openShare = function openShare() {
			ngDialog.open({
				template: 'views/dialog/share.html',
				scope: vm
			});
		};

		vm.openPhoto = function openPhoto(photo) {
			ngDialog.open({
				template: '<img src="' + photo + '" style="width:100%"/>',
				plain: true
			});
		};

		// proceed on if the browser supports geolocation
		if('geolocation' in navigator) {
			vm.hasGeolocation = true;
			vm.geolocate = function geolocate() {
				navigator.geolocation.getCurrentPosition(function(position) {
					vm.map.options.center.latitude = position.coords.latitude;
					vm.map.options.center.longitude = position.coords.longitude;
					vm.map.geolocation = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude
					};
					vm.map.options.zoom = 10;
					vm.geolocated = true;
					vm.closeLocationPanel();
				});
			};
		} else {
			vm.feedback = 'Sorry, your browser doesn\'t support geolocation.';
			vm.hasGeolocation = false;
		}

		// proceed only if we have all things Google Maps
		uiGmapGoogleMapApi.then(function(maps) {
			// show map once we have it
			vm.map.fullyLoaded = true;

			if($( window ).width() <= 736) {
				vm.map.options.custom.mapTypeId = 'roadmap';
			} else {
				vm.map.options.custom.mapTypeId = 'terrain';
			}

			vm.closeLocationPanel = function closeLocationPanel() {
				// $state.go('map.index');

				// reset location to all
				vm.map.locations = vm.locationsList;

				// hide the LocationPanel
				vm.map.selectedMarker.show = false;

				vm.map.options.zoom = 13;
			};
		});
	}]);
})();
