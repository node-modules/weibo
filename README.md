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

tapi SDK api base on tsina api document: [http://open.t.sina.com.cn/](http://open.t.sina.com.cn/)

## Requires:
 * browser client: jquery(for ajax request)
 * server: nodejs

## How to use

### Browser

Include the javascript files:
1. sha1.js
2. base64.js
3. oauth.js
4. tsina.js
   ...
5. twitter.js

    // tapi are all ready in window object.
    tapi.public_timeline();

### Server
    var tapi = require('./node-weibo');
    tapi.public_timeline();