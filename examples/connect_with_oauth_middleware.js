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
weibo.init('github', '8e14edfda73a71f1f226', '1796ac639a8ada0dff6acfee2d63390440ca0f3b');
weibo.init('tqq', '801196838', '9f1a88caa8709de7dccbe3cae4bdc962');

/**
 * Create a web application.
 */

var app = connect(
  connect.query(),
  connect.cookieParser('oh year a cookie secret'),
  connect.session({ secret: "oh year a secret" }),
  // using weibo.oauth middleware for use login
  // will auto save user in req.session.oauthUser
  weibo.oauth({
    loginPath: '/login',
    logoutPath: '/logout',
    blogtypeField: 'type'
  }),
  connect.errorHandler({ stack: true, dump: true })
);

app.use('/', function (req, res, next) {
  var user = req.session.oauthUser;
  res.writeHeader(200, { 'Content-Type': 'text/html' });
  if (!user) {
    res.end('Login with <a href="/login?type=weibo">Weibo</a> | \
      <a href="/login?type=tqq">QQ</a> | \
      <a href="/login?type=github">Github</a>');
    return;
  }
  res.end('Hello, <img src="' + user.profile_image_url + '" />\
    <a href="' + user.t_url + 
    '" target="_blank">@' + user.screen_name + '</a>. ' + 
    '<a href="/logout">Logout</a>');
});

app.listen(8088);
console.log('Server start on http://localhost:8088/');