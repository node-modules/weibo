# tapi: A weibo(like twitter) API SDK, use on browser client and nodejs server.

## Supports:
 * twitter: [http://twitter.com/](http://twitter.com/)
 * facebook: [http://facebook.com/](http://facebook.com/)
 * fanfou: [http://fanfou.com/](http://fanfou.com/)
 * digu: [http://digu.com/](http://digu.com/)
 * zuosa: [http://zuosa.com/](http://zuosa.com/)
 * tsina: [http://t.sina.com.cn/](http://t.sina.com.cn/)
 * tqq: [http://t.qq.com/](http://t.qq.com/)
 * tsohu: [http://t.sohu.com/](http://t.sohu.com/)
 * t163: [http://t.163.com/](http://t.163.com/)
 * renjian: [http://renjian.com/](http://renjian.com/)
 * leihou: [http://leihou.com/](http://leihou.com/)
 * plurk: [http://plurk.com/](http://plurk.com/)

tapi SDK api base on tsina(weibo) api document: [http://open.weibo.com/](http://open.weibo.com/)

## Requires:
 * browser client: jquery(for ajax request)
 * server: nodejs

## Nodejs Install

```
$ npm install weibo
```

## How to use

### Browser

```
// Include the `weibo.js` javascript files:

<script type="text/javascript" src="../weibo.js"></script>
<script type="text/javascript">
// load all the lib scripts with urlprefix where the `weibo` directory you put into 
weibo.load('/public/js/weibo');

var tapi = weibo.tapi;
var appkey = 'your appkey', secret = 'your app secret';
var oauth_callback_url = 'your callback url' || 'oob';
tapi.init('tsina', appkey, secret, oauth_callback_url);
tapi.public_timeline({}, function(error, data, xhr) {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
});

</script>
```

### Server

```
var tapi = require('weibo').tapi;
// change appkey to yours
var appkey = 'your appkey', secret = 'your app secret';
var oauth_callback_url = 'your callback url' || 'oob';
tapi.init('tsina', appkey, secret, oauth_callback_url);
tapi.public_timeline({}, function(error, data, response) {
  if (error) {
      console.error(error);
  } else {
      console.log(data);
  }
});
```
    
### Use oauth_middleware

handler oauth login middleware, use on connect, express.

```
/**
 * oauth middleware for connect
 *
 * example:
 *
 *  connect(
 *    connect.query(),
 *    connect.cookieParser(),
 *    connect.session({ secret: "oh year a secret" }),
 *    weibo.oauth()
 *  );
 *
 * @param {Object} options
 *   - `home_url`: use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - `login_path`: login url, default is '/oauth'
 *   - `logout_path`: default is '/oauth/logout'
 *   - `callback_path`: default is login_path + '_callback'
 *   - `blogtype_field`: default is 'blogtype', 
 *     if you want to connect weibo, login url should be '/oauth?blogtype=weibo'
 */
```
    
Example: A simple web with oauth login.

```
var connect = require('connect');
var weibo = require('../');

/**
 * init weibo api settings
 */ 

weibo.init('weibo', 'appkey', 'secret');

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
```
