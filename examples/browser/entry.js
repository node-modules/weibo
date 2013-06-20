var weibo = require('../../');

// change appkey to yours
var appkey = 'your appkey';
var secret = 'your app secret';
var oauth_callback_url = 'your callback url';
weibo.init('weibo', appkey, secret, oauth_callback_url);

var user = { blogtype: 'weibo' };
var cursor = {count: 20, source: appkey};
weibo.public_timeline(user, cursor, function (err, statuses) {
  if (err) {
    console.error(err);
  } else {
    console.log(statuses);
  }
});