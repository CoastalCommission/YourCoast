'use strict';

angular.module('yourCoast', ['ngResource',
							 'ngSanitize',
							 'ui.router',
							 'uiGmapgoogle-maps',
							 'ngDialog',
							 '720kb.socialshare',
							 'angular-google-analytics',
							 'yourCoast.services',
							 'yourCoast.map',
							 'yourCoast.location'
							])

// Google Maps config
.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        // key: 'AIzaSyAx3mZAAx_JC8C3Xww3xXPDaT3bG5_8BhY', // *.coastal.ca.gov/*
		key: 'AIzaSyDvU4e-mutCkm5V77UnBU4bO5ptYj-bbGw', // general
        v: '3.17'
        // libraries: 'weather,geometry,places'
    });
})

// Google Analytics config
.config(function(AnalyticsProvider) {
		AnalyticsProvider.setAccount('UA-53319606-2');
		AnalyticsProvider.trackPages(true);
		AnalyticsProvider.trackUrlParams(true);
		AnalyticsProvider.useAnalytics(true);
		AnalyticsProvider.setPageEvent('$stateChangeSuccess');
}).run(function(Analytics) {
  	// relying on automatic page tracking, you need to inject Analytics
})

// trust HTML characters in bindings
.filter('trust', ['$sce', function($sce){
		return function(input) {
			return $sce.trustAsHtml(input);
		};
}]);
