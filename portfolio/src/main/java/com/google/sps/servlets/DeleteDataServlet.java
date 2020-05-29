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
import com.google.appengine.api.datastore.Key;
import java.util.*;

/** Servlet that returns some example content. TODO: modify this file to handle comments data */
@WebServlet("/delete-data")
public class DeleteDataServlet extends HttpServlet {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get all the comments from the datastore
    Query query = new Query("Comment").addSort("timestamp", SortDirection.DESCENDING);

    PreparedQuery results = datastore.prepare(query);

    // Delete all the entities in batch
    for (Entity entity : results.asIterable()) {
        Key key = entity.getKey();
        datastore.delete(key);
    };

    // Send the JSON as the response
    response.setContentType("application/json;");
    response.getWriter().println(new Gson().toJson(""));
  }
}
