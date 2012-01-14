/*!
 * node-weibo - demo for using oauth_middleware in connect
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var connect = require('connect');
var weibo = require('../');

/**
 * init weibo api settings
 */ 

weibo.init('weibo', '1306060637', '0850d7407392fb537bff0762406c567d');

/**
 * Create a web application.
 */

var app = connect(
  connect.query(),
  connect.cookieParser(),
  connect.session({ secret: "oh year a secret" }),
  // using weibo.oauth middleware for use login
  // will auto save user in req.session.oauthUser
  weibo.oauth({
    login_path: '/login',
    logout_path: '/logout',
    blogtype_field: 'type'
  }),
  connect.errorHandler({ stack: true, dump: true })
);

app.use('/', function(req, res, next) {
  var user = req.session.oauthUser;
  res.writeHeader(200, { 'Content-Type': 'text/html' });
  if (!user) {
    res.end('<a href="/login?type=weibo">Login</a> first, please.');
    return;
  }
  res.end('Hello, <a href="' + user.t_url + 
    '" target="_blank">@' + user.screen_name + '</a>. ' + 
    '<a href="/logout">Logout</a>');
});

app.listen(8080);