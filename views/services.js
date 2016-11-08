(function() {
    'use strict';

    angular.module('yourCoast.services', [])

    .factory('AccessLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
        var coastalEndPoint   = 'https://api.coastal.ca.gov/access/v1',

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
                                            })
            };

        return locationsAPI;
    }])


    .factory('CCDLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
        var coastalEndPoint   = 'https://api.coastal.ca.gov/ccd/v1',

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
                                            })
            };

        return locationsAPI;
    }])


    .factory('WeatherAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
        var weatherAPI = $resource('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(SELECT%20woeid%20from%20geo.places%20where%20text%3D%22(:latitude%2C:longitude)%22)&format=json',
        {
            latitude: '@latitude',
            longitude: '@longitude'
        },
        {
            query: {
                method: 'GET',
                isArray: false,
                cache: true
            }
        });

        return weatherAPI;
    }]);
})();
