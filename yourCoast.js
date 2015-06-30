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
        libraries: 'weather,geometry,places'
    });
<<<<<<< HEAD
});
=======
});
>>>>>>> 762604718dcb0847a2842941560fdac1b591f75f
