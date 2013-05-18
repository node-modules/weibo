# node-weibo [![Build Status](https://secure.travis-ci.org/fengmk2/node-weibo.png)](http://travis-ci.org/fengmk2/node-weibo)

![logo](https://raw.github.com/fengmk2/node-weibo/master/logo.png)

A [weibo](http://weibo.com)(like [twitter](http://twitter.com)) API SDK, use on browser client and nodejs server.

Please see the [API Documents](https://github.com/fengmk2/node-weibo/blob/master/api.md) first.

## Supports APIs

 * weibo: [http://t.sina.com.cn/](http://weibo.com/)
 * tqq: [http://t.qq.com/](http://t.qq.com/)
 * github: [http://github.com](http://github.com), only `oauth` for now.
 * twitter(unavailable): [http://twitter.com/](http://twitter.com/)
 * facebook(unavailable): [http://facebook.com/](http://facebook.com/)
 * fanfou(unavailable): [http://fanfou.com/](http://fanfou.com/)
 * digu(unavailable): [http://digu.com/](http://digu.com/)
 * tsohu(unavailable): [http://t.sohu.com/](http://t.sohu.com/)
 * t163(unavailable): [http://t.163.com/](http://t.163.com/)
 * plurk(unavailable): [http://plurk.com/](http://plurk.com/)

## Nodejs Install

```bash
$ npm install weibo
```

## How to use

`entry.js`

```js
var weibo = require('weibo');

// change appkey to yours
var appkey = 'your appkey';
var secret = 'your app secret';
var oauth_callback_url = 'your callback url';
weibo.init('weibo', appkey, secret, oauth_callback_url);

var user = { blogtype: 'weibo' };
var cursor = {count: 20};
weibo.public_timeline(user, cursor, function (err, statuses) {
  if (err) {
    console.error(err);
  } else {
    console.log(statuses);
  }
});
```

Demo on nodejs and browser just the same code.

Thanks for [browserify](https://github.com/substack/node-browserify),
let us to use the same code on nodejs and browser.

### Browser: `Phonegap`, `Chrome extension` or [node-webkit](https://github.com/rogerwang/node-webkit).

NOTICE: browser must enable **cross-domain** request.

browserify to `bundle.js`

```bash
$ browserify entry.js -o bundle.js
```

Include `bundle.js` to your html.

```html
<html>
  <head>
    <title>Weibo Hello world</title>
    <script src="bundle.js"></script>
  </head>
  <body>
    Hello world.
  </body>
</html>
```
    
### Use `weibo.oauth` middleware

handler oauth login middleware, use on connect, express.

```js
/**
 * oauth middleware for connect
 *
 * example:
 *
 *  connect(
 *    connect.query(),
 *    connect.cookieParser('I\'m cookie secret.'),
 *    connect.session({ secret: "oh year a secret" }),
 *    weibo.oauth()
 *  );
 *
 * @param {Object} [options]
 *   - {String} [homeUrl], use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - {String} [loginPath], login url, default is '/oauth'
 *   - {String} [logoutPath], default is '/oauth/logout'
 *   - {String} [callbackPath], default is login_path + '/callback'
 *   - {String} [blogtypeField], default is 'type', 
 *       if you want to connect weibo, login url should be '/oauth?type=weibo'
 *   - {Function(req, res, callback)} [afterLogin], when oauth login success, will call this function.
 *   - {Function(req, res, callback)} [beforeLogout], will call this function before user logout.
 */
```
    
Example: A simple web with oauth login.

```js
var connect = require('connect');
var weibo = require('../');

/**
 * init weibo api settings
 */ 

weibo.init('weibo', '$appkey', '$secret');
weibo.init('tqq', '$appkey', '$secret');
weibo.init('github', '$ClientID', '$ClientSecret');

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
    blogtypeField: 'type',
    afterLogin: function (req, res, callback) {
      console.log(req.session.oauthUser.screen_name, 'login success');
      process.nextTick(callback);
    },
    beforeLogout: function (req, res, callback) {
      console.log(req.session.oauthUser.screen_name, 'loging out');
      process.nextTick(callback);
    }
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
```

## Test

```bash
$ npm install
$ npm test
```

jscoverage: [79%](http://fengmk2.github.com/coverage/node-weibo.html)

## Authors

Below is the output from `git-summary`.

```bash
$ git summary 

 project  : node-weibo
 repo age : 2 years, 3 months
 active   : 67 days
 commits  : 163
 files    : 53
 authors  : 
   150  fengmk2                 92.0%
     7  hpf1908                 4.3%
     2  QLeelulu                1.2%
     1  hbbalfred               0.6%
     1  im007boy                0.6%
     1  mk2                     0.6%
     1  xydudu                  0.6%
```

## License 

(The MIT License)

Copyright (c) 2011-2013 fengmk2 &lt;fengmk2@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
