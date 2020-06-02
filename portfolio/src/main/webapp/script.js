// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/** Global variables */
var mapCenter;
var waldoPosition;
var foundWaldo;

/** Function is called when the document body loads */
function onloadHelper() {
    getComments(0);
    setupLogin();
    createMap();
}

/** Hide comments form by default; if user logged in, unhide the form. otherwise, display login link */
function setupLogin() {
    fetch("/loggedin").then(response => response.json()).then((res) => {
        console.log(res)
        const commentsFormElement = document.getElementById("comments-form");
        const loginMessageElement = document.getElementById("login-message");
        const loginLinkElement = document.getElementById("login-link");
        
        // if the response is exactly true, then the user is logged in
        // otherwise, the response should be the login url
        if (res !== true) {
            commentsFormElement.style.display = "none";
            loginLinkElement.href = res;
        } else {
            loginLinkElement.style.display = "none";
        }
    });
}

/** Creates a map and adds it to the page. */
function createMap() {
    var myLatlng = new google.maps.LatLng(37.412373, -122.018402);
    var mapOptions = {
    zoom: 20,
    center: myLatlng,
    mapTypeId: "hybrid",
        styles: [
            {elementType: "geometry", stylers: [{color: "#242f3e"}]},
            {elementType: "labels.text.stroke", stylers: [{color: "#242f3e"}]},
            {elementType: "labels.text.fill", stylers: [{color: "#746855"}]},
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{color: "#d59563"}]
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{color: "#d59563"}]
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{color: "#263c3f"}]
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{color: "#6b9a76"}]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{color: "#38414e"}]
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{color: "#212a37"}]
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{color: "#9ca5b3"}]
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{color: "#746855"}]
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{color: "#1f2835"}]
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{color: "#f3d19c"}]
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{color: "#2f3948"}]
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{color: "#d59563"}]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{color: "#17263c"}]
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{color: "#515c6d"}]
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{color: "#17263c"}]
            }
        ]
    };
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    map.setTilt(45);
    mapCenter = map.getCenter();
    map.addListener("center_changed", function() {
        mapOnCenterChange(map);
    })

    // Create marker on the map
    foundWaldo = false;
    waldoPosition = new google.maps.LatLng(51.5541, -0.1744);
    var waldoIcon = {
        url: "images/waldo.png", // url
        scaledSize: new google.maps.Size(20, 20), // scaled size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var marker = new google.maps.Marker({
        position: waldoPosition,
        icon: waldoIcon,
        map: map
    });

    // Create info window for the marker
    var contentString = "<div id='info-window'>"+
      "<div id='siteNotice'>"+
      "</div>"+
      "<h1 id='firstHeading' class='firstHeading'>You found Waldo!</h1>" +
      "<div id='bodyContent'>" +
      "<p><b>Where's Waldo?</b>, also referred to as <b>Where's Wally?</b> " +
      "in the UK where he originated, is a popular series of children's puzzle books. " +
      "You may also be entertained as a child by the nearly impossible mission of finding Waldo in posters at dentist offices. " +
      "Oh, just me? Okay. </p>" +
      "<p>Anyway, you probably know Waldo as the goof in the red-and-white-striped shirt, bobble hat, and glasses, " +
      "but did you know he also has a nemesis named Odlaw (spell it backwards) who dons yellow and black stripes, " +
      "blue-tint glasses, and a mustache? " +
      "Needless to say, you better watch out for him!</p>" +
      "<p>Read more about the history of Waldo here: <a href='https://en.wikipedia.org/wiki/Where%27s_Wally%3F'>" +
      "https://en.wikipedia.org/wiki/Where%27s_Wally%3F</a>.</p>" +
      "</div>"+
      "</div>";
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    marker.addListener("click", function() {
        markerOnClick(map, marker, infowindow);
    });
}

/** Displays whether the user is hotter or colder based on where they drag the map to find Waldo */
function mapOnCenterChange(map) {
    // If already found Waldo, don't do anything
    if (foundWaldo) return;

    const newCenter = map.getCenter();
    // Calculate the distance between old mapCenter and Waldo and newCenter and Waldo
    const oldDistance = haversine_distance(waldoPosition, mapCenter);
    const newDistance = haversine_distance(waldoPosition, newCenter);

    // Set the message to "hot" or "cold" based on whether the new distance is smaller than the old
    const hotOrColdMessage = document.getElementById("hot-or-cold");
    if (newDistance < oldDistance) {
        hotOrColdMessage.innerHTML = "You are getting hotter!";
    } else {
        hotOrColdMessage.innerHTML = "Oh no, you are getting colder!";
    }

    // Set global variable mapCenter to the newCenter
    mapCenter = newCenter;
}

/** Triggered when the user finds the Waldo marker! */
function markerOnClick(map, marker, infowindow) {
    // configure map zoom and center position
    map.setZoom(10);
    map.setCenter(marker.getPosition());

    // show info windows for Waldo
    infowindow.open(map, marker);

    // Set the message to success
    const hotOrColdMessage = document.getElementById("hot-or-cold");
    hotOrColdMessage.innerHTML = "You found me, congratulations!";
    foundWaldo = true;
}

/* Helper function to calculate the Haversine distance between two points of lat-long
 * Source: https://cloud.google.com/blog/products/maps-platform/how-calculate-distances-map-maps-javascript-api
 * Modified original function to take in latlng arguments instead of markers
 */
function haversine_distance(pos1, pos2) {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = pos1.lat() * (Math.PI/180); // Convert degrees to radians
    var rlat2 = pos2.lat() * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (pos2.lng()-pos1.lng()) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    return d;
}

/*
 * Fetches JSON string from the server and adds it to HTML
 */
function getComments(numComments) {
    console.log(numComments);
    fetch("/data?numcomments=" + numComments).then(response => response.json()).then((comments) => {
        // stats is an object, not a string, so we have to
        // reference its fields to create HTML content

        console.log(comments)
        const commentsListElement = document.getElementById("comments-container");
        commentsListElement.innerHTML = "";
        for (var i = 0; i < comments.length; i++) {
            commentsListElement.appendChild(createListElement(comments[i]));
        }
        if (comments.length == 0) commentsListElement.innerHTML = "No comments posted yet.";
    });
}

/** Sets the number of comments that should be displayed, called from the select input form */
function setNumComments(selectThis) {
    getComments(selectThis.value);
}

/*
 * Deletes all comments on the datastore and returns an empty response
 */
async function deleteComments() {
    const response = await fetch("/delete-data", {method: "POST"});
    const empty = await response.json();
    if (response.status == 200) {
        getComments(0);
    }
}

/** Creates an <li> element containing text. */
function createListElement(comment) {
  const liElement = document.createElement("li");
  const commentElement = document.createElement("span");
  commentElement.classList.add("comment")
  commentElement.innerText = comment.content;
  const authorElement = document.createElement("span");
  authorElement.classList.add("author")
  authorElement.innerText = comment.name;
  liElement.appendChild(commentElement);
  liElement.appendChild(authorElement);
  return liElement;
}
