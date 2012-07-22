# node-weibo: A weibo(like twitter) API SDK, use on browser client and nodejs server.

[![Build Status](https://secure.travis-ci.org/fengmk2/node-weibo.png?branch=master)](http://travis-ci.org/fengmk2/node-weibo)

## Supports:
 * twitter: [http://twitter.com/](http://twitter.com/)
 * facebook: [http://facebook.com/](http://facebook.com/)
 * fanfou: [http://fanfou.com/](http://fanfou.com/)
 * digu: [http://digu.com/](http://digu.com/)
 * zuosa: [http://zuosa.com/](http://zuosa.com/)
 * weibo: [http://t.sina.com.cn/](http://weibo.com/)
 * tqq: [http://t.qq.com/](http://t.qq.com/)
 * tsohu: [http://t.sohu.com/](http://t.sohu.com/)
 * t163: [http://t.163.com/](http://t.163.com/)
 * renjian: [http://renjian.com/](http://renjian.com/)
 * leihou: [http://leihou.com/](http://leihou.com/)
 * plurk: [http://plurk.com/](http://plurk.com/)

node-weibo API base on weibo API document: [http://open.weibo.com/](http://open.weibo.com/)

## Requires:
 * (working)browser client: jquery(for ajax request), browser must enable cross-domain request.
 * server: nodejs

## Nodejs Install

```bash
$ npm install weibo
```

## How to use

### Browser: `Phonegap` or `Chrome extension`

* require `jQuery`

```javascript
// Include the javascript files:

<script src="lib/weibo/lib/eventproxy.js"></script>
<script src="lib/weibo/lib/base64.js"></script>
<script src="lib/weibo/lib/sha1.js"></script>
<script src="lib/weibo/lib/utils.js"></script>
<script src="lib/weibo/lib/oauth.js"></script>
<script src="lib/weibo/lib/urllib.js"></script>
<script src="lib/weibo/lib/tsina.js"></script>
<script src="lib/weibo/lib/tapi.js"></script>
<script type="text/javascript">
var tapi = weibo.TAPI;
var appkey = 'your appkey', secret = 'your app secret';
var oauth_callback_url = 'your callback url' || 'oob';
tapi.init('tsina', appkey, secret, oauth_callback_url);
tapi.public_timeline({ user: { blogType: 'tsina' } }, function (err, statuses) {
  if (err) {
    console.error(error);
  } else {
    console.log(statuses);
  }
});
</script>
```

### Server

```javascript

var tapi = require('weibo');

// change appkey to yours
var appkey = 'your appkey', secret = 'your app secret';
var oauth_callback_url = 'your callback url' || 'oob';
tapi.init('tsina', appkey, secret, oauth_callback_url);

tapi.public_timeline({ user: { blogType: 'tsina' } }, function (err, statuses) {
  if (err) {
    console.error(err);
  } else {
    console.log(statuses);
  }
});
```
    
### Use oauth_middleware

handler oauth login middleware, use on connect, express.

```javascript
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
 * @param {Object} options
 *   - `homeUrl`: use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - `loginPath`: login url, default is '/oauth'
 *   - `logoutPath`: default is '/oauth/logout'
 *   - `callbackPath`: default is login_path + '/callback'
 *   - `blogtypeField`: default is 'type', 
 *     if you want to connect weibo, login url should be '/oauth?type=weibo'
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
```

## Authors

Below is the output from `git-summary`.

```
 project: node-weibo
 commits: 102
 active : 49 days
 files  : 49
 authors: 
    91  fengmk2                 89.2%
     7  hpf1908                 6.9%
     2  QLeelulu                2.0%
     1  mk2                     1.0%
     1  xydudu                  1.0%
```

## License 

(The MIT License)

Copyright (c) 2011-2012 fengmk2 &lt;fengmk2@gmail.com&gt;

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
