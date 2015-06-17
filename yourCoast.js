'use strict';

angular.module('yourCoast', ['ngResource',
							 'ui.router',
							 'uiGmapgoogle-maps',
							 'yourCoast.map'
							])

.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.17',
        libraries: 'weather,geometry'
    });
})