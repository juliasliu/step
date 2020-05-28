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

/**
 * Adds a random greeting to the page.
 */
function addRandomGreeting() {
  const greetings =
      ["Life is like a box of chocolates. You never know what you're gonna get. - Forrest Gump", 'Plata o plumo. - Narcos', "Mirror mirror on the wall, who's the fairest of 'em all? - Snow White", "Keep your friends close, but your enemies closer. - The GodFather"];

  // Pick a random greeting.
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Add it to the page.
  const greetingContainer = document.getElementById('greeting-container');
  greetingContainer.innerText = greeting;
}

/*
 * Fetches JSON string from the server and adds it to HTML
 */
function getMessages() {
  fetch('/data').then(response => response.json()).then((messages) => {
    // stats is an object, not a string, so we have to
    // reference its fields to create HTML content

    // console.log(messages)
    const messagesListElement = document.getElementById('greeting-container');
    messagesListElement.innerHTML = '';
    for (var i = 0; i < messages.length; i++) {
        messagesListElement.appendChild(createListElement(messages[i]));
    }
  });
}

/** Creates an <li> element containing text. */
function createListElement(text) {
  const liElement = document.createElement('li');
  liElement.innerText = text;
  return liElement;
}
