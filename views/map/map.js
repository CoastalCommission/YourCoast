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
				controller: 'mapController'
			});

		$urlRouterProvider.otherwise('/map');
	}])


	.factory('AccessLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
		var coastalEndPoint   = 'http://134.186.6.10/access/v1',
			instagramEndPoint = 'https://api.instagram.com/v1',

		    locationsAPI   = {
		    	getAllLocations: $resource(coastalEndPoint + '/locations/',
				                            {},
				                            {
				                            	query: {
					                                method: 'GET',
					                                isArray: true,
					                                cache: true
				                            	}
				                            }),

		    	getLocationByID: $resource(coastalEndPoint + '/locations/id/:locationID',
				                            {
												locationID: '@locationID'
											},
				                            {
				                            	query: {
					                                method: 'GET',
					                                isArray: true,
					                                cache: true
				                            	}
				                            }),

		    	getLocationByName: $resource(coastalEndPoint + '/locations/name/' + $stateParams.locationName,
			    						   {},
			    						   {
			    						   		query: {
			    						   			method: 'GET',
			    						   			isArray: true,
			    						   			cache: true
			    						   		}
			    						   }),

				getPhotosByLatLong: $resource(instagramEndPoint + 'locations/search?lat=' + '&lng=' + '?client_id=27bae1323ac94c67963054afdd50fff4&callback=JSON_CALLBACK',
											{},
											{
												query: {
													method: 'GET',
													isArray: true,
													cache: true
												}
											})
		    };

		return locationsAPI;
	}])


	.controller('mapController', ['$scope', '$rootScope', 'AccessLocationsAPI', 'uiGmapGoogleMapApi', '$state', '$stateParams', '$filter', 'ngDialog', function($scope, $rootScope, AccessLocationsAPI, uiGmapGoogleMapApi, $state, $stateParams, $filter, ngDialog) {
		// defaults
		$scope.map = {};
		$scope.map.locations = [];
		$scope.map.locations.coords = {};
		$scope.map.locations.icon = '';
		$scope.map.fullyLoaded = false;
		$scope.hasGeolocation = false;
		$scope.map.selectedMarker = [];
		$scope.map.selectedMarker.show = false;
		$scope.map.options = {
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
		$scope.map.events = {
			tilesloaded: function (map, eventName, originalEventArgs) {
				var panoLocation = new google.maps.LatLng($scope.map.selectedMarker.LATITUDE, $scope.map.selectedMarker.LONGITUDE);
				var panoramaOptions = {
					position: panoLocation,
					pov: {
						heading: 30,
						pitch: 5,
						zoom: 1
					}
				};
				var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
				map.setStreetView(panorama);
			}
		},
		$scope.map.locationList = [];
		$scope.menuActive = false;
		$scope.markerClick = function markerClick(name, id) {
			console.log(id);

			$scope.clickedMarker = {};

			$scope.clickedMarker.name = name;
			$scope.clickedMarker.id = id;
			$scope.clickedMarker.show = true;
		};

		$scope.$watch(function() {
				$rootScope.searchQuery = $scope.search;
		});

		var iconURL = 'http://maps.google.com/mapfiles/ms/micons/yellow.png';

		$scope.toggleMenu = function toggleMenu() {
			$scope.menuActive = !$scope.menuActive;
		};

		$scope.openHelp = function helpOverlay() {
			$('body').chardinJs('start');
		};

		$scope.openFeedback = function openFeedback() {
			ngDialog.open({
				template: 'views/dialog/feedback.html'
			});
		};

		$scope.openAbout = function openAbout() {
			ngDialog.open({
				template: 'views/dialog/about.html'
			});
		};

		$scope.openShare = function openShare() {
			ngDialog.open({
				template: 'views/dialog/share.html',
				scope: $scope
			});
		};

		$scope.openPhoto = function openPhoto(photo) {
			ngDialog.open({
				template: '<img src="' + photo + '" style="width:100%"/>',
				plain: true
			});
		};

		// proceed on if the browser supports geolocation
		if('geolocation' in navigator) {
			$scope.hasGeolocation = true;
			$scope.geolocate = function geolocate() {
				navigator.geolocation.getCurrentPosition(function(position) {
					$scope.$apply(function() {
						$scope.map.options.center.latitude = position.coords.latitude;
						$scope.map.options.center.longitude = position.coords.longitude;
						$scope.map.options.zoom = 12;
					});
					$scope.geolocated = true;
					$scope.closeLocationPanel();
				});
			};
		} else {
			$scope.feedback = 'Sorry, your browser doesn\'t support geolocation.';
			$scope.hasGeolocation = false;
		}

		// proceed only if we have all things Google Maps
		uiGmapGoogleMapApi.then(function(maps) {
			// show map once we have it
			$scope.map.fullyLoaded = true;

			if($( window ).width() <= 736) {
				$scope.map.options.custom.mapTypeId = 'roadmap';
			} else {
				$scope.map.options.custom.mapTypeId = 'terrain';
			}

			// fetch all locations
			AccessLocationsAPI.getAllLocations.query().$promise.then(function(promisedLocations) {
				// bind to map
				$scope.map.locations    = promisedLocations;

				// bind to list
				$scope.map.locationList = promisedLocations;

				// bind to $rootScope
				$rootScope.locationList = promisedLocations;

				// add properties to each location before view
				angular.forEach(promisedLocations, function(location) {
					location.coords = {
						latitude: location.LATITUDE,
						longitude: location.LONGITUDE
					};

					location.icon = iconURL;
				});

				$scope.openLocationPanel = function openLocationPanel(marker) {
					// nessesary - fixes issue with re-selecting previously selected marker
					$scope.map.selectedMarker.show = false;

					// check is marker is coming from map or list
					if('model' in marker) {
						$filter('trust')(marker.model.DescriptionMobileWeb);
						$scope.map.selectedMarker = marker.model;
					} else {
						$filter('trust')(marker.DescriptionMobileWeb);
						$scope.map.selectedMarker = marker;
						$scope.toggleMenu();
					}

					// remove all markers except for the selected marker
					$scope.map.locations = [$scope.map.selectedMarker];

					// toggle LocationPanel visibility
					$scope.map.selectedMarker.show = !$scope.map.selectedMarker.show;

					// pan map viewport to selected marker
					$scope.map.options.center = {
						latitude: $scope.map.selectedMarker.LATITUDE - 0.01,
						longitude: $scope.map.selectedMarker.LONGITUDE
					};

					// zoom in on selected marker
					$scope.map.options.zoom = 14;

					// set page title
					document.title = marker.NameMobileWeb;
				};

				$scope.closeLocationPanel = function closeLocationPanel() {
					// reset location to all
					$scope.map.locations           = promisedLocations;

					// hise the LocationPanel
					$scope.map.selectedMarker.show = false;
				};

				$scope.switchLocations = function switchLocations(locationID) {
					$state.transitionTo('map.location-id', {locationID:locationID});
				};
			});
	  });
	}])
})();
