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
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import java.util.*;

@WebServlet("/loggedin")
public class UserServlet extends HttpServlet {

    private class UserInfo {
        boolean loggedIn = false;
        String url = "";

        public UserInfo(boolean loggedIn, String url) {
            this.loggedIn = loggedIn;
            this.url = url;
        }
    }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    
    response.setContentType("application/json");
    UserService userService = UserServiceFactory.getUserService();


    if (userService.isUserLoggedIn()) {
        String urlToRedirectToAfterUserLogsOut = "/";
        String logoutUrl = userService.createLogoutURL(urlToRedirectToAfterUserLogsOut);
        UserInfo userInfo =  new UserInfo(true, logoutUrl);
        response.getWriter().println(new Gson().toJson(userInfo));
    } else {
        String urlToRedirectToAfterUserLogsIn = "/";
        String loginUrl = userService.createLoginURL(urlToRedirectToAfterUserLogsIn);
        UserInfo userInfo =  new UserInfo(false, loginUrl);
        response.getWriter().println(new Gson().toJson(userInfo));
    }
  }
}
