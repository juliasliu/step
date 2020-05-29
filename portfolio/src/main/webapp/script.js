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

/*
 * Fetches JSON string from the server and adds it to HTML
 */
function getComments(numComments) {
    console.log(numComments);
    fetch('/data?numcomments=' + numComments).then(response => response.json()).then((comments) => {
        // stats is an object, not a string, so we have to
        // reference its fields to create HTML content

        console.log(comments)
        const commentsListElement = document.getElementById('comments-container');
        commentsListElement.innerHTML = '';
        for (var i = 0; i < comments.length; i++) {
            commentsListElement.appendChild(createListElement(comments[i]));
        }
        if (comments.length == 0) commentsListElement.innerHTML = 'No comments posted yet.';
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
    const response = await fetch('/delete-data', {method: 'POST'});
    const empty = await response.json();
    if (response.status == 200) {
        getComments(0);
    }
}

/** Creates an <li> element containing text. */
function createListElement(comment) {
  const liElement = document.createElement('li');
  const commentElement = document.createElement('span');
  commentElement.classList.add("comment")
  commentElement.innerText = comment.content;
  const authorElement = document.createElement('span');
  authorElement.classList.add("author")
  authorElement.innerText = comment.name;
  liElement.appendChild(commentElement);
  liElement.appendChild(authorElement);
  return liElement;
}
