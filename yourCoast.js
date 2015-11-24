'use strict';

angular.module('yourCoast', ['ngResource',
							 'ngSanitize',
							 'ngMaterial',
							 'ui.router',
							 'uiGmapgoogle-maps',
							 'ngDialog',
							 '720kb.socialshare',
							 'angular-google-analytics',

							 'yourCoast.map',
							 'yourCoast.location'
							])

// Google Maps config
.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        // key: 'AIzaSyAx3mZAAx_JC8C3Xww3xXPDaT3bG5_8BhY',
		key: 'AIzaSyDvU4e-mutCkm5V77UnBU4bO5ptYj-bbGw',
        v: '3.17'
    });
})

.config(function($mdThemingProvider) {
	$mdThemingProvider.theme('default')
	    .primaryPalette('light-blue', {
			'default': '400', // by default use shade 400
			'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
			'hue-2': '700', // use shade 600 for the <code>md-hue-2</code> class
			'hue-3': '900' // use shade A100 for the <code>md-hue-3</code> class
		})
	    .accentPalette('yellow', {
			'default': '500'
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
