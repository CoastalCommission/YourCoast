/*!
 * Searchable Map Template with Google Fusion Tables
 * http://derekeder.com/searchable_map_template/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/FusionTable-Map-Template/wiki/License
 *
 * Date: 12/10/2012
 *
 */

// Enable the visual refresh
google.maps.visualRefresh = true;

// construct MapsLib library namespace
var MapsLib = MapsLib || {};

var MapsLib = {
  // the encrypted Table ID (found under File => About)
  fusionTableId:      "1HCOIEnj3VpLHmJtiOQ_5P0N_ZFslh1w_Xf_mepmK",

  //*New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/
  //*Important* this key is for demonstration purposes. please register your own.
  googleApiKey:       "AIzaSyA3FQFrNr5W2OEVmuENqhb2MBB2JabdaOY",

  // lat,long column
  locationColumn:     "LATITUDE",

  //center that your map defaults to
  map_centroid:       new google.maps.LatLng(37.632711, -122.572511),

  // geographical area appended to all address searches
  locationScope:      "california",

  // for showing number of results      
  recordName:         "Result",
  recordNamePlural:   "Results",

  // in meters ~ 1/2 mile
  searchRadius:       3220,

  // default zoom level (bigger == more zoom)
  defaultZoom:        6,

  // search geo epicenter icon 
  addrMarkerImage:    'images/blue-pushpin.png',

  // geo epicenter
  currentPinpoint:    null,

  // global infowindow
  _infowindow:        null,

  initialize: function() {
    // default result count
    $( "#result_count" ).html("");

    // access geocoder
    geocoder = new google.maps.Geocoder();

    // config
    var myOptions = {
      // set zoom
      zoom: MapsLib.defaultZoom,

      // set center
      center: MapsLib.map_centroid,

      panControl: false,
      scaleControl: false,
      zoomControl: true,
      scaleControl: true,
      streetViewControl: true,
      streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
      },

      // set base map
      mapTypeId: google.maps.MapTypeId.ROAD,

      // set base map custom styles
      styles: [
            {
              "markerOptions": {
                "iconName": "large_green"
              }
            },
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
              "elementType":"all",
              "stylers":[
                {"color":"#B5D8FF"}
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
    };

    // inject new map into DOM container using our set options
    map = new google.maps.Map($("#map_canvas")[0],myOptions);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(map, 'idle', function() {
        MapsLib.calculateCenter();
    });

    // listen for window resize events & center based on new size
    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(MapsLib.map_centroid);
    });

    // set search results to nothing by default
    MapsLib.searchrecords = null;

    //reset filters
    $("#search_address").val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") {
      $("#search_radius").val(loadRadius);
    } else {
      $("#search_radius").val(MapsLib.searchRadius);
    }
    $(":checkbox").prop("checked", "checked");
    $("#result_box").hide();
    
    //-----custom initializers-------
    
    //-----end of custom initializers-------

    //run the default search
    MapsLib.doSearch();
  },

  doSearch: function(location) {
    MapsLib.clearSearch();
    var address = $("#search_address").val();
    MapsLib.searchRadius = $("#search_radius").val();

    var whereClause = MapsLib.locationColumn + " not equal to ''";

    //-----custom filters-------

    //-------end of custom filters--------

    if (address != "") {
      if (address.toLowerCase().indexOf(MapsLib.locationScope) == -1) {
        address = address + " " + MapsLib.locationScope;
      }

      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);
          map.setZoom(12);

          MapsLib.addrMarker = new google.maps.Marker({
            position: MapsLib.currentPinpoint,
            map: map,
            icon: MapsLib.addrMarkerImage,
            animation: google.maps.Animation.DROP,
            title:address
          });

          whereClause += " AND ST_INTERSECTS(" + MapsLib.locationColumn + ", CIRCLE(LATLNG" + MapsLib.currentPinpoint.toString() + "," + MapsLib.searchRadius + "))";

          MapsLib.drawSearchRadiusCircle(MapsLib.currentPinpoint);
          MapsLib.submitSearch(whereClause, map, MapsLib.currentPinpoint);
        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      MapsLib.submitSearch(whereClause, map);
    }
  },

  submitSearch : function(whereClause, map, location) {
    //get using all filters
    //NOTE: styleId and templateId are recently added attributes to load custom marker styles and info windows
    //you can find your Ids inside the link generated by the 'Publish' option in Fusion Tables
    //for more details, see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles

    MapsLib.searchrecords = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.fusionTableId,
        select: MapsLib.locationColumn,
        where:  whereClause
      },
      styleId:3,
      templateId:5,
      // ensures InfoWindows open
      suppressInfoWindows:false
    });

    google.maps.event.addListener(MapsLib.searchrecords, 'click', function(e) {
      console.log(e);

      // Change the content of the InfoWindow
      e.infoWindowHtml = "<div class='googft-info-window'>" +
                            "<div class='row'>" +
                              "<div class='column-12'>" +
                                "<div class='row'>" +
                                  "<div class='column-9 push-2'>" +
                                    "<h4 class='center-text blue-text slab medium'>" +
                                      e.row['NameMobileWeb'].value +
                                    "</h4>" +
                                  "</div>" +
                                "</div>" +
                              "</div>" +
                            "</div>";

      // Display values if they exist
      if (e.row['DescriptionMobileWeb'].value) {
        e.infoWindowHtml += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-info'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  e.row['DescriptionMobileWeb'].value +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }

      if (e.row['LocationMobileWeb'].value) {
        e.infoWindowHtml += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-map-marker'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  e.row['LocationMobileWeb'].value +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }

      if (e.row['PHONE_NMBR'].value) {
        e.infoWindowHtml += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-phone'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  e.row['PHONE_NMBR'].value +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }

      if (   e.row['FEE'].value         == 'Yes'
          || e.row['PARKING'].value     == 'Yes'
          || e.row['DSABLDACSS'].value  == 'Yes'
          || e.row['RESTROOMS'].value   == 'Yes'
          || e.row['VISTOR_CTR'].value  == 'Yes'
          || e.row['PCNC_AREA'].value   == 'Yes'
          || e.row['CAMPGROUND'].value  == 'Yes'
          || e.row['SNDY_BEACH'].value  == 'Yes'
          || e.row['RKY_SHORE'].value   == 'Yes'
          || e.row['DUNES'].value       == 'Yes'
          || e.row['BLUFF'].value       == 'Yes'
          || e.row['STRS_BEACH'].value  == 'Yes'
          || e.row['PTH_BEACH'].value   == 'Yes'
          || e.row['BLFTP_TRLS'].value  == 'Yes'
          || e.row['BLFTP_PRK'].value   == 'Yes'
          || e.row['WLDLFE_VWG'].value  == 'Yes'
          || e.row['TIDEPOOL'].value    == 'Yes'
          || e.row['VOLLEYBALL'].value  == 'Yes'
          || e.row['FISHING'].value     == 'Yes'
          || e.row['BOATING'].value     == 'Yes') {
        // e.infoWindowHtml += "<ul style='margin: 0px 0px 20px -20px'>";
          if (e.row['FEE'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-money'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Fee" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['PARKING'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-car'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Parking" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['DSABLDACSS'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-wheelchair'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Disabled Access" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['RESTROOMS'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-female'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Restrooms" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['VISTOR_CTR'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-flag'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Visitor Center" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['PCNC_AREA'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-cutlery'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Picnic Area" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['CAMPGROUND'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-leaf'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Campground" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['SNDY_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Sandy Shore" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['RKY_SHORE'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Rocky Shore" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['DUNES'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Dunes" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['BLUFF'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Bluffs" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['STRS_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Stairs to Beach" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['PTH_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Path to Beach" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['BLFTP_TRLS'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Blufftop Trails" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['BLFTP_PRK'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Blufftop Park" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['WLDLFE_VWG'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-eye'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Wildlife Viewing" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['TIDEPOOL'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Tidepools" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['VOLLEYBALL'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-futbol-o'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Vollyball" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['FISHING'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-check'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Fishing" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['BOATING'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-ship'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Boating" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['DOG_FRIENDLY'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-paw'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Dog Friendly" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['EZ4STROLLERS'].value == 'Yes') {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                    "<div class='column-1'>" +
                                        "<i class='fa fa-child'></i>" +
                                    "</div>" +
                                    "<div class='column-11'>" +
                                        "Stroller Friendly" +
                                    "</div>" +
                                "</div>";
          }

          if (e.row['Photo_1'].value != null) {
            e.infoWindowHtml += "<div class='row gutters margin-top'>" +
                                    "<div class='column-4'>" +
                                        "<a href='#' data-featherlight='" + e.row['Photo_1'].value + "'>" +
                                          "<img src='" + e.row['Photo_1'].value + "' alt='' />" +
                                        "</a>" +
                                    "</div>";
          }

          if (e.row['Photo_2'].value != null) {
            e.infoWindowHtml += "<div class='column-4'>" +
                                    "<a href='#' data-featherlight='" + e.row['Photo_2'].value + "'>" +
                                      "<img src='" + e.row['Photo_2'].value + "' alt='' />" +
                                    "</a>" +
                                "</div>";
          }

          if (e.row['Photo_3'].value != null) {
            e.infoWindowHtml += "<div class='column-4'>" +
                                    "<a href='#' data-featherlight='" + e.row['Photo_3'].value + "'>" +
                                      "<img src='" + e.row['Photo_3'].value + "' alt='' />" +
                                    "</a>" +
                                "</div>";
          }

          if (   e.row['Photo_2'].value != null
              || e.row['Photo_3'].value != null) {
            e.infoWindowHtml += "</div> <!-- end .row -->";
          }

          if (e.row['Photo_4'].value != null) {
            e.infoWindowHtml += "<div class='row gutters'>" +
                                  "<div class='column-4'>" +
                                    "<a href='#' data-featherlight='" + e.row['Photo_4'].value + "'>" +
                                      "<img src='" + e.row['Photo_4'].value + "' alt='' />" +
                                    "</a>" +
                                  "</div>" +
                                "</div> <!-- end .row -->";
          }
      }      
    });

    MapsLib.searchrecords.setMap(map);
    MapsLib.getCount(whereClause);
    MapsLib.getList(whereClause);
  },

  clearSearch: function() {
    if (MapsLib.searchrecords != null) {
      MapsLib.searchrecords.setMap(null);
    }
    if (MapsLib.addrMarker != null) {
      MapsLib.addrMarker.setMap(null);
    }
    if (MapsLib.searchRadiusCircle != null) {
      MapsLib.searchRadiusCircle.setMap(null);
    }
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        MapsLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },

  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          MapsLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  drawSearchRadiusCircle: function(point) {
      var circleOptions = {
        strokeColor: "#4b58a6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#4b58a6",
        fillOpacity: 0.05,
        map: map,
        center: point,
        clickable: false,
        zIndex: -1,
        radius: parseInt(MapsLib.searchRadius)
      };
      MapsLib.searchRadiusCircle = new google.maps.Circle(circleOptions);
  },

  query: function(selectColumns, whereClause, callback) {
    var queryStr = [];
    queryStr.push("SELECT " + selectColumns);
    queryStr.push(" FROM " + MapsLib.fusionTableId);
    queryStr.push(" WHERE " + whereClause);
    queryStr.push(" ORDER BY " + "LIST_ORDER");

    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({url: "https://www.googleapis.com/fusiontables/v1/query?sql="+sql+"&callback="+callback+"&key="+MapsLib.googleApiKey, dataType: "jsonp"});
  },

  handleError: function(json) {
    if (json["error"] != undefined) {
      var error = json["error"]["errors"]
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row]["domain"]);
        console.log(" Reason: " + error[row]["reason"]);
        console.log(" Message: " + error[row]["message"]);
      }
    }
  },

  getCount: function(whereClause) {
    var selectColumns = "Count()";
    MapsLib.query(selectColumns, whereClause,"MapsLib.displaySearchCount");
  },

  displaySearchCount: function(json) {
    MapsLib.handleError(json);
    var numRows = 0;
    if (json["rows"] != null)
      numRows = json["rows"][0];

    var name = MapsLib.recordNamePlural;
    if (numRows == 1)
    name = MapsLib.recordName;
    $( "#result_count" ).fadeIn(function() {
      $( "#result_count" ).html(MapsLib.addCommas(numRows));
    });
  },


  getList: function(whereClause) {
    var selectColumns = "NameMobileWeb, Index";
    MapsLib.query(selectColumns, whereClause, "MapsLib.displayList");
  },

  displayList: function(json) {
    MapsLib.handleError(json);
    var data = json["rows"];
    var template = "";

    var results = $("#results_list");
    results.hide().empty(); //hide the existing list and empty it out first

    if (data == null) {
      //clear results list
      results.append("<li><span class='lead'>No results found</span></li>");
    }
    else {
      for (var row in data) {
        if(data[row][0]) {
          template = "\
              <li>\
                <strong>\
                  <a href=\"#\" onclick=\"MapsLib.openMarkerByIndex(" + data[row][1] + ");\">" + data[row][0] + "</a>\
                </strong>\
              </li>"
          }
        results.append(template);
      }
    }
    results.fadeIn();
  },


  addCommas: function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },

  // maintains map centerpoint for responsive design
  calculateCenter: function() {
    center = map.getCenter();
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
  	return decodeURIComponent(text);
  },
  
  //-----custom functions-------
  // NOTE: if you add custom functions, make sure to append each one with a comma, except for the last one.
  // This also applies to the convertToPlainString function above

  openMarkerByIndex: function(locationIndex) {
    if(MapsLib.infoWindow != null) {
      MapsLib.infoWindow.close();
    }
    var whereClause = "Index = " + locationIndex;
    MapsLib.query("*", whereClause, "MapsLib.openSelectedInfoWindow");
  },

  openSelectedInfoWindow: function(json) {
      MapsLib.infoWindow = new google.maps.InfoWindow({});

      var name        = json["rows"][0][5],
          location    = json["rows"][0][6],
          description = json["rows"][0][7],
          phone       = json["rows"][0][8],
          fee         = json["rows"][0][9],
          parking     = json["rows"][0][10],
          disabled    = json["rows"][0][11],
          restrooms   = json["rows"][0][12],
          viscenter   = json["rows"][0][13],
          dogfriend   = json["rows"][0][14],
          strollers   = json["rows"][0][15],
          picnic      = json["rows"][0][16],
          camping     = json["rows"][0][17],
          sandy       = json["rows"][0][18],
          dunes       = json["rows"][0][19],
          rocky       = json["rows"][0][20],
          bluff       = json["rows"][0][21],
          stairs      = json["rows"][0][22],
          path        = json["rows"][0][23],
          blufftrails = json["rows"][0][24],
          bluffpark   = json["rows"][0][25],
          animalview  = json["rows"][0][26],
          tidepool    = json["rows"][0][27],
          volleyball  = json["rows"][0][28],
          fishing     = json["rows"][0][29],
          boating     = json["rows"][0][30],
          lat         = json["rows"][0][33],
          long        = json["rows"][0][34]
          photo1      = json["rows"][0][35],
          photo2      = json["rows"][0][36],
          photo3      = json["rows"][0][37],
          photo4      = json["rows"][0][38],
          position    = new google.maps.LatLng(lat, long);

      var selectedLocHTML = "<div class='googft-info-window'>" +
                              "<div class='row'>" +
                                "<div class='column-12'>" +
                                  "<div class='row'>" +
                                    "<div class='column-9 push-2'>" +
                                      "<h4 class='center-text blue-text slab medium'>" +
                                        name +
                                      "</h4>" +
                                    "</div>" +
                                  "</div>" +
                                "</div>" +
                              "</div>";

      if (description) {
        selectedLocHTML += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-info'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  description +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }

      if (location) {
        selectedLocHTML += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-map-marker'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  location +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }

      if (phone) {
        selectedLocHTML += "<div class='row gutters'>" +
                              "<div class='column-1'>" +
                                "<i class='fa fa-phone'></i>" +
                              "</div>" +
                              "<div class='column-11'>" +
                                "<strong>" +
                                  phone +
                                "</strong>" +
                              "</div>" +
                            "</div>";
      }


      if (fee == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-money'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Fee" +
                                "</div>" +
                            "</div>";
      }

      if (parking == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-car'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Parking" +
                                "</div>" +
                            "</div>";
      }

      if (disabled == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-wheelchair'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Disabled Access" +
                                "</div>" +
                            "</div>";
      }

      if (restrooms == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-female'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Restrooms" +
                                "</div>" +
                            "</div>";
      }

      if (viscenter == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-flag'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Visitor Center" +
                                "</div>" +
                            "</div>";
      }

      if (picnic == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-cutlery'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Picnic Area" +
                                "</div>" +
                            "</div>";
      }

      if (camping == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-leaf'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Campground" +
                                "</div>" +
                            "</div>";
      }

      if (sandy == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Sandy Shore" +
                                "</div>" +
                            "</div>";
      }

      if (rocky == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Rocky Shore" +
                                "</div>" +
                            "</div>";
      }

      if (dunes == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Dunes" +
                                "</div>" +
                            "</div>";
      }

      if (bluff == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Bluffs" +
                                "</div>" +
                            "</div>";
      }

      if (stairs == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Stairs to Beach" +
                                "</div>" +
                            "</div>";
      }

      if (path == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Path to Beach" +
                                "</div>" +
                            "</div>";
      }

      if (blufftrails == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Blufftop Trails" +
                                "</div>" +
                            "</div>";
      }

      if (bluffpark == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Blufftop Park" +
                                "</div>" +
                            "</div>";
      }

      if (animalview == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-eye'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Wildlife Viewing" +
                                "</div>" +
                            "</div>";
      }

      if (tidepool == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Tidepools" +
                                "</div>" +
                            "</div>";
      }

      if (volleyball == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-futbol-o'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Vollyball" +
                                "</div>" +
                            "</div>";
      }

      if (fishing == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-check'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Fishing" +
                                "</div>" +
                            "</div>";
      }

      if (boating == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-ship'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Boating" +
                                "</div>" +
                            "</div>";
      }

      if (dogfriend == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-paw'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Dog Friendly" +
                                "</div>" +
                            "</div>";
      }

      if (strollers == 'Yes') {
        selectedLocHTML += "<div class='row gutters'>" +
                                "<div class='column-1'>" +
                                    "<i class='fa fa-child'></i>" +
                                "</div>" +
                                "<div class='column-11'>" +
                                    "Stroller Friendly" +
                                "</div>" +
                            "</div>";
      }

      if (photo1 != null) {
        selectedLocHTML += "<div class='row gutters margin-top'>" +
                                "<div class='column-4'>" +
                                    "<a href='#' data-featherlight='" + photo1 + "'>" +
                                      "<img src='" + photo1 + "' alt='' />" +
                                    "</a>" +
                                "</div>";
      }

      if (photo2 != null) {
        selectedLocHTML += "<div class='column-4'>" +
                                "<a href='#' data-featherlight='" + photo2 + "'>" +
                                  "<img src='" + photo2 + "' alt='' />" +
                                "</a>" +
                            "</div>";
      }

      if (photo3 != null) {
        selectedLocHTML += "<div class='column-4'>" +
                                "<a href='#' data-featherlight='" + photo3 + "'>" +
                                  "<img src='" + photo3 + "' alt='' />" +
                                "</a>" +
                            "</div>";
      }

      if (   photo2 != null
          || photo3 != null) {
        selectedLocHTML += "</div> <!-- end .row -->";
      }

      if (photo4 != null) {
        selectedLocHTML += "<div class='row gutters'>" +
                              "<div class='column-4'>" +
                                "<a href='#' data-featherlight='" + photo4 + "'>" +
                                  "<img src='" + photo4 + "' alt='' />" +
                                "</a>" +
                              "</div>" +
                            "</div> <!-- end .row -->";
      }

      MapsLib.infoWindow.setOptions({
        content: selectedLocHTML,
        position: position
      });
      MapsLib.infoWindow.open(map);
  }
  
  //-----end of custom functions-------
}
