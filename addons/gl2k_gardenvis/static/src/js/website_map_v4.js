/// <reference path='/austria_data/bundeslaender_und_gemeinden.js'/>


// Global Variables to hold the gardenMap and related data
var gardenMap;

var stateLayer;
var stateMarkerLayerGroup;

var communityLayer;
var communityMarkerLayerGroup;

var state_data = null;
var state_data_glo = [];
var state_data_map = null;

var community_data = null;
var community_data_glo = [];
var community_data_map = null;

var gardenMapGalleryData;


$(document).ready(function () {
    'use strict';

    // Add HTML for the Info-Text-Box above the card
    $('#gardenMap').append('<div id="gardenMapInfoBox"/>');

    // Add HTML for the Image-Gallery
    $('#gardenMap').append('<div id="gardenMapGallery"/>');


    //---------------------
    // GET AND PREPARE DATA
    //---------------------
    


    // Get all data from the /gl2k/garden/data json-controller
    try {
        $.ajax({
            url: "/gl2k/garden/data",
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: JSON.stringify({"params": {}}),

            // request error
            error: function (data) {
                console.log('Error on getting data from /gl2k/garden/data !');
            },

            // request success
            success: function (data) {
                state_data = data.result.state_data;
                state_data_glo = data.result.state_data[0];
                state_data_map = dataToMap(state_data_glo, 'cmp_state', null);
                // console.log('state_data_map', state_data_map);

                community_data = data.result.community_data;
                community_data_glo = data.result.community_data[0];
                community_data_map = dataToMap(community_data_glo, 'cmp_community', null);
                // console.log('community_data_map', community_data_map);

                
                // Initialize the map after we received the data
                initMap();
            }
        });

    // request exception
    } catch (error) {
        console.log('Exception on getting data from /gl2k/garden/data ! ', error);
        return;
    }

    // Helper functions to convert the data
    //-------------------------------------
    function dataToMap(data, name, value) {
        return _.reduce(data, function(acc, item) {
            if (value === null ) {
                acc[filterName(item[name])] = item;
            }
            else {
                acc[filterName(item[name])] = item[value];
            }
            return acc;
        }, {});
    }
    function replaceUmlaute(str) {
        var umlautMap = {
            '\u00dc': 'UE',
            '\u00c4': 'AE',
            '\u00d6': 'OE',
            '\u00fc': 'ue',
            '\u00e4': 'ae',
            '\u00f6': 'oe',
            '\u00df': 'ss',
        };
        return str
            .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
                var big = umlautMap[a.slice(0, 1)];
                return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
            })
            .replace(new RegExp('[' + Object.keys(umlautMap).join('|') + ']', "g"),
                (a) => umlautMap[a]
            );
    }
    function filterName(str) {
        var filtered = replaceUmlaute(str);
        return filtered.replace(/\./g, '').replace(/\-/g, '').replace(/\ /g, '').toLowerCase();
    }


    //-----------------------
    // Initialize Leaflet Map
    //-----------------------

    function initMap() {

        // INITIALIZE THE MAP ON AN HTML ELEMENT WITH id="gardenMap"
        // ---------------------------------------------------------
        var cornerTop = L.latLng(49.009, 9.245),
            cornerBottom = L.latLng(46.294, 17.155),
            boundary = L.latLngBounds(cornerTop, cornerBottom);

        gardenMap = L.map('gardenMap', {
            center: [47.564, 13.364],
            zoom: 7,
            maxBounds: boundary,
        });

        // ADD THE GARDEN-INFO-TEXT-BOX
        // ----------------------------
        showInfoBox();

        // CREATE MAP PANES TO CONTROL THE Z-INDEX AND POINTER EVENTS
        // ----------------------------------------------------------
        gardenMap.createPane('statePane');
        gardenMap.getPane('statePane').style.zIndex = 510;
        // gardenMap.createPane('stateMarkerPane');
        // gardenMap.getPane('stateMarkerPane').style.zIndex = 615;

        gardenMap.createPane('communityPane');
        gardenMap.getPane('communityPane').style.zIndex = 520;
        // gardenMap.createPane('communityMarkerPane');
        // gardenMap.getPane('communityMarkerPane').style.zIndex = 625;

        // ADD MAP LAYERS
        // --------------

        // Map-Tiles-Layer
        // Outer boundary for map-tile loading
        // var tilemapcornerTop = L.latLng(50.009, 10.245),
        //     tilemapcornerBottom = L.latLng(45.294, 16.155),
        //     tilemapboundary = L.latLngBounds(tilemapcornerTop, tilemapcornerBottom);
        L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            maxZoom: 12,
            minZoom: 7,
            // bounds: tilemapboundary,
        }).addTo(gardenMap);

        // States GeoJson Layer
        stateLayer = L.geoJson(austriaBG, {
            filter: function(feature, layer) {return feature.properties.rtype === 'bundesland';},
            style: stateStyle,
            onEachFeature: stateOnEachFeature,
            pane: 'statePane'
        });
        gardenMap.addLayer(stateLayer);

        // stateMarkerLayerGroup Layer Group
        createStateMarkerLayerGroup();
        gardenMap.addLayer(stateMarkerLayerGroup);

        // Communities GeoJson Layer
        communityLayer = L.geoJson(austriaBG, {
            filter: function(feature, layer) {return feature.properties.rtype === 'gemeinde';},
            style: communityStyle,
            onEachFeature: communityOnEachFeature,
            pane: 'communityPane',
        });

        // communityMarkerLayerGroup Layer Group
        createCommunityMarkerLayerGroup();

        // HIDE OR SHOW LAYERS AND MARKERS
        // -------------------------------
        gardenMap.on('zoomend', function () {
            var zoomLevel = gardenMap.getZoom();

            // Display states
            if (zoomLevel < 9) {

                // Hide the communities
                gardenMap.removeLayer(communityMarkerLayerGroup);
                gardenMap.removeLayer(communityLayer);

                // Add the stateMarkers
                gardenMap.addLayer(stateLayer);
                gardenMap.addLayer(stateMarkerLayerGroup);

            // Display communities
            } else if (zoomLevel >= 9) {

                // Remove the stateMarkers
                gardenMap.removeLayer(stateLayer);
                gardenMap.removeLayer(stateMarkerLayerGroup);

                // Display the communities
                gardenMap.addLayer(communityLayer);
                gardenMap.addLayer(communityMarkerLayerGroup);
            }
        });
    }


    //--------------------------------------
    // MAP-LAYERS: STYLES, FILTERS, FEATURES
    //--------------------------------------

    // states
    // ------
    function stateStyle(feature) {
        // get opacity from garden data
        var gsp;
        var opacity = 0;
        var fill='#9ee436';
        var featureStateName = filterName(feature.properties.name);
        if (featureStateName in state_data_map) {
            gsp = state_data_map[featureStateName].garden_size_peg;

            if (gsp > 0.01 && gsp <= 0.15) {
                opacity = 0.3;
                fill = '#9ee436';
            } else if (gsp > 0.15 && gsp <= 0.3 ) {
                opacity = 0.3;
                fill = '#76b837';
            } else if (gsp > 0.3 && gsp <= 0.45 ) {
                opacity = 0.45;
                fill = '#689e18';
            } else if (gsp > 0.45 && gsp <= 0.6 ) {
                opacity = 0.45;
                fill = '#227708';
            } else if (gsp > 0.6 && gsp <= 1 ) {
                opacity = 0.45;
                fill = '#055300';
            }
        }

        return {
            weight: 1,
            opacity: 1,
            color: "#3c3c3b",
            dashArray: "",
            fillOpacity: opacity,
            fillColor: fill,
        };
    }

    function stateOnEachFeature(feature, layer) {
        layer.on({
            // mouseover: highlightFeature,
            // mouseout: resetHighlightState,
            click: zoomToFeature,
        });
    }

    // communities
    // -----------
    function communityStyle(feature) {
        var gsp;
        var opacity = 0;
        var fill='#9ee436';
        var featureCommunityName = filterName(feature.properties.name);
        if (featureCommunityName in community_data_map) {
            gsp = community_data_map[featureCommunityName].garden_size_peg;
            if (gsp > 0.01 && gsp <= 0.15) {
                opacity = 0.3;
                fill = '#9ee436';
            } else if (gsp > 0.15 && gsp <= 0.3 ) {
                opacity = 0.3;
                fill = '#76b837';
            } else if (gsp > 0.3 && gsp <= 0.45 ) {
                opacity = 0.45;
                fill = '#689e18';
            } else if (gsp > 0.45 && gsp <= 0.6 ) {
                opacity = 0.45;
                fill = '#227708';
            } else if (gsp > 0.6 && gsp <= 1 ) {
                opacity = 0.45;
                fill = '#055300';
            }
        }

        return {
            weight: 1,
            opacity: 0.8,
            color: '#3c3c3b',
            dashArray: "4",
            fillOpacity: opacity,
            fillColor: fill,
        };
    }

    function communityOnEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlightCommunity,
            click: zoomToFeature,
        });
    }

    // onEachFeature called functions
    // ------------------------------

    function highlightFeature(e) {
        // if (gardenMapGalleryActive === true) {
        //     return;
        // }
        var layer = e.target;
        layer.setStyle({
            weight: 2,
            color: "#37493a",
            opacity: 1,
            dashArray: "",
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    function resetHighlightState(e) {
        // if (gardenMapGalleryActive === true) {
        //     return;
        // }
        stateLayer.resetStyle(e.target);
    }
    function resetHighlightCommunity(e) {
        // if (gardenMapGalleryActive === true) {
        //     return;
        // }
        communityLayer.resetStyle(e.target);
    }
    function zoomToFeature(e) {
        // if (gardenMapGalleryActive === true) {
        //     return;
        // }
        gardenMap.fitBounds(e.target.getBounds());
    }


    //--------
    // MARKER
    //--------

    // Create State Markers Layer Group
    // --------------------------------
    function createStateMarkerLayerGroup() {
        // console.log('createStateMarkerLayerGroup');

        var stateCenters = {
            'oberoesterreich': [48.2500000, 14.0000000],    //ooe
            'niederoesterreich': [48.2817813, 15.7632457],  //noe
            'wien': [48.2083537, 16.3725042],               //vie
            'burgenland': [47.5000001, 16.4166666],         //bgl
            'steiermark': [47.2500001, 15.1666665],         //stmk
            'kaernten': [46.7500001, 13.8333333],           //car
            'salzburg': [47.4166667, 13.2500000],           //sal
            'tirol': [47.2231930, 11.5261028],              //tir
            'vorarlberg': [47.2500000, 9.9166667],          //vor
        };

        // Generate a list of state markers
        var stateMarkers = [];
        for (var stateName in state_data_map) {
            if (state_data_map[stateName].thumbnail_record_ids) {
                if (stateName in stateCenters) {
                    // create a new marker
                    var marker = L.marker(stateCenters[stateName], {
                        icon: L.divIcon({
                            html: '<img id="' + state_data_map[stateName].cmp_state_id + " bundesland" + '" class="gardenMapMarkerIcon" src="/gl2k_gardenvis/static/src/img/CameraIcon.png" onclick="showGardenMapGallery(this)">',
                        }),
                    });
                    // add it to the list
                    stateMarkers.push(marker)
                }
                else {
                    console.log('Missing state in stateCenters! ', stateName)
                }
            }
        }

        // Add the markers to the stateMarkerLayerGroup
        stateMarkerLayerGroup = L.layerGroup(stateMarkers, {
            // pane: 'statePane'
        });

    }

    // Create Community Markers Layer Group
    // ------------------------------------
    function createCommunityMarkerLayerGroup() {
        // console.log('createCommunityMarkerLayerGroup');

        // Generate a list of community markers
        var communityMarkers = [];
        for (var cName in community_data_map) {
            var community = community_data_map[cName];

            if (community.thumbnail_record_ids) {
                // create a new marker
                var communityCenter = [parseFloat(community.latitude), parseFloat(community.longitude)];
                var marker = L.marker(communityCenter, {
                    icon: L.divIcon({
                        html: '<div class="gardenMapCommunityMaker"><div class="gardenMapCommunityMakerOuter"><img id="' + community.cmp_community_code + " gemeinde" + '" class="gardenMapCommunityMakerImg" src="/gl2k_gardenvis/static/src/img/CameraIcon.png" onclick="showGardenMapGallery(this)"><p class="gardenMapCommunityMakerText">' + community.garden_size + ' m²</p></div></div>',
                    })
                });
                // add it to the list
                communityMarkers.push(marker)
            }
        }

        // Add the markers to the communityMarkerLayerGroup
        communityMarkerLayerGroup = L.layerGroup(communityMarkers, {
            // pane: 'communityPane'
        });
    }

    //------------------
    // GARDENMAP INFOBOX
    //------------------
    function showInfoBox() {
        var maxGardenSize = 0;
        for (var i = 0; i < state_data[0].length; i++) {
            maxGardenSize = maxGardenSize + state_data[0][i].garden_size;
        }
        $("#gardenMapInfoBox").wrapInner("<div class='totalgardensize'><img class='gardenMapInfoBoxBg' src='/gl2k_gardenvis/static/src/img/Zaehler-3.png'/><p class='gardenMapInfoBoxText'>" + maxGardenSize + " m²</p></div>");
    }

});
