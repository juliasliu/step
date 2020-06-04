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

package com.google.sps.servlets;
import com.google.gson.Gson;

import java.io.IOException;
import java.util.*;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;

import com.google.cloud.language.v1.Document;
import com.google.cloud.language.v1.LanguageServiceClient;
import com.google.cloud.language.v1.Sentiment;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;

@WebServlet("/data")
public class DataServlet extends HttpServlet {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    UserService userService = UserServiceFactory.getUserService();

    private class Comment {
        long id;
        String content;
        String nickname;
        String email;
        double score;
        long timestamp;

        public Comment(long id, String content, String nickname, String email, double score, long timestamp) {
            this.id = id;
            this.content = content;
            this.nickname = nickname;
            this.email = email;
            this.score = score;
            this.timestamp = timestamp;
        }
    }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Query query = new Query("Comment").addSort("timestamp", SortDirection.DESCENDING);

    PreparedQuery results = datastore.prepare(query);

    List<Comment> comments = new ArrayList<Comment>();
    for (Entity entity : results.asIterable()) {
      long id = entity.getKey().getId();
      String content = (String) entity.getProperty("content");
      String nickname = (String) entity.getProperty("nickname");
      String email = (String) entity.getProperty("email");
      double score = (double) entity.getProperty("score");
      long timestamp = (long) entity.getProperty("timestamp");

      Comment comment = new Comment(id, content, nickname, email, score, timestamp);
      comments.add(comment);
    }

    // if the parameter is 0, then show all comments
    Integer numComments = Integer.parseInt(request.getParameter("numcomments"));
    if (numComments > 0 && numComments < comments.size()) comments = comments.subList(0, numComments);

    Gson gson = new Gson();
    String json = gson.toJson(comments);

    // Send the JSON as the response
    response.setContentType("application/json;");
    response.getWriter().println(json);
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get the input from the form.
    String nickname = getUserNickname(userService.getCurrentUser().getUserId());
    String content = getParameter(request, "content", "");
    String email = userService.getCurrentUser().getEmail();
    long timestamp = System.currentTimeMillis();

    // Calculate sentiment score of the content
    double score = getSentimentScore(content);

    Entity comment = new Entity("Comment");
    comment.setProperty("content", content);
    comment.setProperty("nickname", nickname);
    comment.setProperty("email", email);
    comment.setProperty("score", score);
    comment.setProperty("timestamp", timestamp);

    datastore.put(comment);

    // Redirect to the main page
    response.sendRedirect("/comments.html");
  }

  /** Run sentiment analysis and return sentiment score */
  private double getSentimentScore(String message) throws IOException {
    Document doc = 
        Document.newBuilder().setContent(message).setType(Document.Type.PLAIN_TEXT).build();
    LanguageServiceClient languageService = LanguageServiceClient.create();
    Sentiment sentiment = languageService.analyzeSentiment(doc).getDocumentSentiment();
    double score = sentiment.getScore();
    languageService.close();

    return score;
  }

  /**
   * Returns the nickname of the user with id, or empty String if the user has not set a nickname.
   */
  private String getUserNickname(String id) {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Query query =
        new Query("UserInfo")
            .setFilter(new Query.FilterPredicate("id", Query.FilterOperator.EQUAL, id));
    PreparedQuery results = datastore.prepare(query);
    Entity entity = results.asSingleEntity();
    if (entity == null) {
      return "";
    }
    String nickname = (String) entity.getProperty("nickname");
    return nickname;
  }

  /**
   * @return the request parameter, or the default value if the parameter
   *         was not specified by the client
   */
  private String getParameter(HttpServletRequest request, String name, String defaultValue) {
    String value = request.getParameter(name);
    if (value == null) {
      return defaultValue;
    }
    return value;
  }
}
