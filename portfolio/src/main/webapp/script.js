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
var commentsList = [];

// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart', 'timeline']});

/** Function is called when the document body loads */
function onloadHelper(page) {
    switch(page) {
        case "home":
            break;
        case "about":
            createCharts();
            break;
        case "projects":
            createMap();
            break;
        case "comments":
            getComments(0);
            setupLogin();
            break;
        default:
            // nothing
    }
}

/** Creates charts and adds it to the page. */
function createCharts() {
    // Set a callback to run when the Google Visualization API is loaded.
    google.charts.setOnLoadCallback(drawTimelineChart);
}

/** Draws the timeline chart */
function drawTimelineChart() {

    const data = new google.visualization.DataTable();
    data.addColumn({ type: 'string', id: 'School' });
    data.addColumn({ type: 'string', id: 'Name' });
    data.addColumn({ type: 'date', id: 'Start' });
    data.addColumn({ type: 'date', id: 'End' });
    data.addRows([
        ['Elementary', 'Doyle Elementary School', new Date(2005, 8, 1), new Date(2008, 1, 4) ],
        ['Elementary', 'Stone Ranch Elementary School',      new Date(2008, 1, 5),  new Date(2009, 2, 7) ],
        ['Elementary', 'Garden Gate Elementary School',  new Date(2009, 2, 8),  new Date(2011, 6, 11) ],
        ['Middle', 'Lawson Middle School',  new Date(2011, 8, 14),  new Date(2014, 6, 4) ],
        ['High', 'Monta Vista High School',  new Date(2014, 8, 17),  new Date(2014, 9, 4) ],
        ['High', 'Cupertino High School',  new Date(2014, 9, 5),  new Date(2018, 5, 31) ],
        ['College', 'University of California, Berkeley',  new Date(2018, 8, 21),  new Date(2022, 5, 14) ]
    ]);

    const options = {
        'title': 'Timeline of schools I attended',
        'height': 250,
    };

    const container = document.getElementById('chart-div-timeline');
    const chart = new google.visualization.Timeline(container);
    chart.draw(data, options);
}

/** Draws the comments sentiment score bar chart */
function drawCommentsChart() {

    // load list of comments into a map object
    let commentVotes = new Map();
    for (var i = 0; i < commentsList.length; i++) {
        var score = Math.round(commentsList[i].score * 100.0) / 100.0
        var currentVotes = commentVotes.has(score) ? commentVotes.get(score) : 0;
        commentVotes.set(score, currentVotes + 1);
    }

    // create the data table
    const data = new google.visualization.DataTable();
    data.addColumn('number', 'Sentiment score');
    data.addColumn('number', 'Frequency');
    data.addColumn({type: 'string', role: 'style'});
    commentVotes.forEach((frequency, score) => {    // (value, key)
        data.addRow([score, frequency, getScoreColor(score)]);
    });

    const options = {
        'title': 'Sentiment score distribution for comments',
        'width':600,
        'height':500
    };

    const container = document.getElementById('chart-div-comments');
    const chart = new google.visualization.ColumnChart(container);
    chart.draw(data, options);
}

/** Returns a color based on a sentiment score */
function getScoreColor(score) {
    if (score == 0)
        return 'blue';
    else if (score < 0)
        return 'red';
    else 
        return 'green';
}

/** Hide comments form by default; if user logged in, unhide the form. otherwise, display login link */
function setupLogin() {
    fetch("/loggedin").then(response => response.json()).then((res) => {
        console.log(res)
        const commentsFormElement = document.getElementById("comments-form");
        const nicknameFormElement = document.getElementById("nickname-form");
        const loginMessageElement = document.getElementById("login-message");
        const loginLinkElement = document.getElementById("login-link");
        const logoutMessageElement = document.getElementById("logout-message");
        const logoutLinkElement = document.getElementById("logout-link");
        
        // if the response is true, then the user is logged in
        if (res.loggedIn == true) {
            loginMessageElement.style.display = "none";
            logoutLinkElement.href = res.url;
            setupNickname();
        } else {
            // otherwise, the response should be the login url
            commentsFormElement.style.display = "none";
            nicknameFormElement.style.display = "none";
            logoutMessageElement.style.display = "none";
            loginLinkElement.href = res.url;
        }
    });
}

/* Set the nickname of the user if it exists, show nickname form */
async function setupNickname() {
    const nicknameElement = document.getElementById("nickname");
    const nicknameInputElement = document.getElementById("nickname-input");

    // retrieve nickname from server
    const response = await fetch("/nickname");
    const json = await response.json();

    if (response.status == 200) {
        nicknameElement.innerHTML = json;
        nicknameInputElement.value = json;

        const nicknameGreetingElement = document.getElementById("nickname-greeting");
        const sadNicknameGreetingElement = document.getElementById("sad-nickname-greeting");
        
        // show the normal greeting message with nickname if nickname exists
        if (json && json != "") {
            sadNicknameGreetingElement.style.display = "none";
        } else {
            // otherwise, show a sad greeting message with no nickname
            nicknameGreetingElement.style.display = "none";
        }
    }
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
    fetch("/data?numcomments=" + numComments).then(response => response.json()).then((comments) => {
        // stats is an object, not a string, so we have to
        // reference its fields to create HTML content

        console.log(comments)
        const commentsListElement = document.getElementById("comments-container");
        commentsListElement.innerHTML = "";
        for (var i = 0; i < comments.length; i++) {
            commentsListElement.appendChild(createListElement(comments[i]));
            commentsList.push(comments[i]);
        }
        if (comments.length == 0) commentsListElement.innerHTML = "No comments posted yet.";

        // Draws the comments bar chart
        drawCommentsChart();
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

  const contentElement = document.createElement("span");
  contentElement.classList.add("comment")
  contentElement.innerText = comment.content;
  liElement.appendChild(contentElement);

    // show nickname if exists
    if (comment.nickname != "") {
        const nicknameElement = document.createElement("span");
        nicknameElement.classList.add("nickname")
        nicknameElement.innerText = comment.nickname;
        liElement.appendChild(nicknameElement);
    } else {
        // otherwise, show email
        const emailElement = document.createElement("span");
        emailElement.classList.add("email")
        emailElement.innerText = comment.email;
        liElement.appendChild(emailElement);
    }

  const scoreElement = document.createElement("span");
  scoreElement.classList.add("score")
  // round the score to the nearest hundredth place
  scoreElement.innerText = "Sentiment score: " + Math.round(comment.score * 100.0) / 100.0;
  liElement.appendChild(scoreElement);

  return liElement;
}
