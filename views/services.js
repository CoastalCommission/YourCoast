(function() {
    'use strict';

    angular.module('yourCoast.services', [])

    .factory('AccessLocationsAPI', ['$resource', '$stateParams', '$filter', function($resource, $stateParams, $filter) {
        var coastalEndPoint   = 'http://134.186.6.10/access/v1',

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
                                           })
            };

        return locationsAPI;
    }]);
})();
