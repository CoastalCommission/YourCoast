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

// stores all returned markers
 var markers = [];

// Enable the visual refresh
google.maps.visualRefresh = true;

var MapsLib = MapsLib || {};
var MapsLib = {

  //Setup section - put your Fusion Table details here
  //Using the v1 Fusion Tables API. See https://developers.google.com/fusiontables/docs/v1/migration_guide for more info

  //the encrypted Table ID of your Fusion Table (found under File => About)
  //NOTE: numeric IDs will be depricated soon
  fusionTableId:      "1HCOIEnj3VpLHmJtiOQ_5P0N_ZFslh1w_Xf_mepmK",

  //*New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/
  //*Important* this key is for demonstration purposes. please register your own.
  googleApiKey:       "AIzaSyA3FQFrNr5W2OEVmuENqhb2MBB2JabdaOY",

  //name of the location column in your Fusion Table.
  //NOTE: if your location column name has spaces in it, surround it with single quotes
  //example: locationColumn:     "'my location'",
  locationColumn:     "LATITUDE",

  map_centroid:       new google.maps.LatLng(37.632711, -122.572511), //center that your map defaults to
  locationScope:      "california",      //geographical area appended to all address searches
  recordName:         "Result",       //for showing number of results
  recordNamePlural:   "Results",

  searchRadius:       3220,            //in meters ~ 1/2 mile
  defaultZoom:        11,             //zoom level when map is loaded (bigger is more zoomed in)
  addrMarkerImage:    'images/blue-pushpin.png',
  currentPinpoint:    null,

  initialize: function() {
    $( "#result_count" ).html("");

    geocoder = new google.maps.Geocoder();
    var myOptions = {
      zoom: MapsLib.defaultZoom,
      center: MapsLib.map_centroid,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
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
              "elementType":"all",
              "stylers":[
                {"color":"#29b6f6"}
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
      		] // end map styles
    };
    map = new google.maps.Map($("#map_canvas")[0],myOptions);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(map, 'idle', function() {
        MapsLib.calculateCenter();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(MapsLib.map_centroid);
    });

    MapsLib.searchrecords = null;

    //reset filters
    $("#search_address").val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") $("#search_radius").val(loadRadius);
    else $("#search_radius").val(MapsLib.searchRadius);
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
      if (address.toLowerCase().indexOf(MapsLib.locationScope) == -1)
        address = address + " " + MapsLib.locationScope;

      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);
          map.setZoom(14);

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
      // Change the content of the InfoWindow
      e.infoWindowHtml = "<div class='googft-info-window'> <h4 style='text-align:center;'>" + e.row['NameMobileWeb'].value + "</h4>";

      // Display values if they exist
      if (e.row['DescriptionMobileWeb'].value) {
        e.infoWindowHtml += "<p><strong>" + e.row['DescriptionMobileWeb'].value + "</strong></p>";
      }

      if (e.row['LocationMobileWeb'].value) {
        e.infoWindowHtml += "<p>Location: <strong>" + e.row['LocationMobileWeb'].value + "</strong></p>";
      }

      if (e.row['PHONE_NMBR'].value) {
        e.infoWindowHtml += "<p>Phone Number: <strong>" + e.row['PHONE_NMBR'].value + "</strong></p>";
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
        e.infoWindowHtml += "<ul style=\"margin: 0px 0px 20px -20px\">";
          if (e.row['FEE'].value == 'Yes') {
            e.infoWindowHtml += "<li>Fee</li>";
          }

          if (e.row['PARKING'].value == 'Yes') {
            e.infoWindowHtml += "<li>Parking</li>";
          }

          if (e.row['DSABLDACSS'].value == 'Yes') {
            e.infoWindowHtml += "<li>Disabled access</li>";
          }

          if (e.row['RESTROOMS'].value == 'Yes') {
            e.infoWindowHtml += "<li>Restrooms</li>";
          }

          if (e.row['VISTOR_CTR'].value == 'Yes') {
            e.infoWindowHtml += "<li>Visitor center</li>";
          }

          if (e.row['PCNC_AREA'].value == 'Yes') {
            e.infoWindowHtml += "<li>Picnic area</li>";
          }

          if (e.row['CAMPGROUND'].value == 'Yes') {
            e.infoWindowHtml += "<li>Campground</li>";
          }

          if (e.row['SNDY_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<li>Sandy beach</li>";
          }

          if (e.row['RKY_SHORE'].value == 'Yes') {
            e.infoWindowHtml += "<li>Rocky shore</li>";
          }

          if (e.row['DUNES'].value == 'Yes') {
            e.infoWindowHtml += "<li>Dunes</li>";
          }

          if (e.row['BLUFF'].value == 'Yes') {
            e.infoWindowHtml += "<li>Bluff</li>";
          }

          if (e.row['STRS_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<li>Stairs to beach</li>";
          }

          if (e.row['PTH_BEACH'].value == 'Yes') {
            e.infoWindowHtml += "<li>Path to beach</li>";
          }

          if (e.row['BLFTP_TRLS'].value == 'Yes') {
            e.infoWindowHtml += "<li>Blufftop trails</li>";
          }

          if (e.row['BLFTP_PRK'].value == 'Yes') {
            e.infoWindowHtml += "<li>Blufftop parking</li>";
          }

          if (e.row['WLDLFE_VWG'].value == 'Yes') {
            e.infoWindowHtml += "<li>Wildlife viewing</li>";
          }

          if (e.row['TIDEPOOL'].value == 'Yes') {
            e.infoWindowHtml += "<li>Tidepools</li>";
          }

          if (e.row['VOLLEYBALL'].value == 'Yes') {
            e.infoWindowHtml += "<li>Volleyball</li>";
          }

          if (e.row['FISHING'].value == 'Yes') {
            e.infoWindowHtml += "<li>Fishing</li>";
          }

          if (e.row['BOATING'].value == 'Yes') {
            e.infoWindowHtml += "<li>Boating</li>";
          }
        e.infoWindowHtml += "</ul>";
      }
      
    });

    // google.maps.event.addListener(document.getElementById('map_canvas'), 'click', function() {
    //     infowindow.close();
    // });

    MapsLib.searchrecords.setMap(map);
    MapsLib.getCount(whereClause);
    MapsLib.getList(whereClause);
  },

  clearSearch: function() {
    if (MapsLib.searchrecords != null)
      MapsLib.searchrecords.setMap(null);
    if (MapsLib.addrMarker != null)
      MapsLib.addrMarker.setMap(null);
    if (MapsLib.searchRadiusCircle != null)
      MapsLib.searchRadiusCircle.setMap(null);
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
    // queryStr.push(" ORDER BY " + orderClause);

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
    var selectColumns = "NameMobileWeb, DescriptionMobileWeb, PHONE_NMBR";
    MapsLib.query(selectColumns, whereClause, "MapsLib.displayList");
  },

  displayList: function(json) {
    MapsLib.handleError(json);
    var data = json["rows"];
    console.log(data);
    var template = "";

    /////////////////////////// for (var i = 0; i < data.length; i++) {
    ///////////////////////////   markers.push(data[row]);
    ///////////////////////////   console.log(markers);
    /////////////////////////// };

    var results = $("#results_list");
    results.hide().empty(); //hide the existing list and empty it out first

    if (data == null) {
      //clear results list
      results.append("<li><span class='lead'>No results found</span></li>");
    }
    else {
      for (var row in data) {
        if(data[row][0]) {
          // template = "\
          //   <div class='row-fluid item-list'>\
          //     <div class='span12'>\
          //       <strong>\
          //         <a href=\"#\" onclick=\"myClick(" + data.indexOf() + ");\">" + data[row][0] + "</a>\
          //       </strong>\
          //       <br />\
          //       " + data[row][1] + "\
          //     </div>\
          //   </div>"

          template = "\
            <div class='row-fluid item-list'>\
              <div class='span12'>\
                <strong>" + data[row][0] + "</strong>\
                <br />\
                " + data[row][1] + "\
              </div>\
            </div>"
          }
        results.append(template);
      }
      // console.log(data);
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
  }
  
  //-----custom functions-------
  // NOTE: if you add custom functions, make sure to append each one with a comma, except for the last one.
  // This also applies to the convertToPlainString function above
  
  //-----end of custom functions-------
}
