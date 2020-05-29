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

import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import java.util.*;

/** Servlet that returns some example content. TODO: modify this file to handle comments data */
@WebServlet("/data")
public class DataServlet extends HttpServlet {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

    private class Comment {
        long id;
        String content;
        String name;
        long timestamp;

        public Comment(long id, String content, String name, long timestamp) {
            this.id = id;
            this.content = content;
            this.name = name;
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
      String name = (String) entity.getProperty("name");
      long timestamp = (long) entity.getProperty("timestamp");

      Comment comment = new Comment(id, content, name, timestamp);
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
    String name = getParameter(request, "name", "");
    String content = getParameter(request, "content", "");
    long timestamp = System.currentTimeMillis();

    Entity taskEntity = new Entity("Comment");
    taskEntity.setProperty("content", content);
    taskEntity.setProperty("name", name);
    taskEntity.setProperty("timestamp", timestamp);

    datastore.put(taskEntity);

    // Redirect to the main page
    response.sendRedirect("/");
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
