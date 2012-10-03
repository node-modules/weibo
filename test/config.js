/**
 * Module dependencies.
 */

var libpath = process.env.WEIBO_COV ? '../lib-cov' : '../lib';
var weibo = require(libpath + '/tapi');

var oauth_callback = 'http://nodeweibo.org/oauth/callback';

// init appkey
weibo.init('tqq', '801196838', '9f1a88caa8709de7dccbe3cae4bdc962', 'oob');
weibo.init('weibo', '1122960051', 'e678e06f627ffe0e60e2ba48abe3a1e3', oauth_callback);
weibo.init('github', '8e14edfda73a71f1f226', 'e678e06f627ffe0e60e2ba48abe3a1e3', oauth_callback);

// weibo.init('twitter', 'i1aAkHo2GkZRWbUOQe8zA', 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY', 'oob');

var users = exports.users = {
  tqq: {
    blogtype: 'tqq',
    oauth_token: '2d746f8c91ae4baea7243a6867cf309f',
    oauth_token_secret: '2bec75e9ddad6b27067e384a84550e38',
    name: 'node-weibo'
  },
  weibo: { 
    blogtype: 'weibo',
    access_token: '2.00EkofzBtMpzNBb9bc3108d8MwDTTE',
    uid: 1827455832,
  },
  github: { 
    blogtype: 'github',
    access_token: '23c53f2f70977a0a2c15c77c840c2a65247f9299',
  }
};

// var user = users.tqq;
var user = users.weibo;
// var user = users.github;
// weibo.get_authorization_url(user, function (err, auth_info) {
//   console.log(err, auth_info);
// });

// {"access_token":"2.00EkofzBtMpzNBb9bc3108d8MwDTTE","remind_in":"633971","expires_in":633971,"uid":"1827455832"}'
// 
// http://localhost.nodeweibo.com/oauth/callback?code=8c3ef76abed0eeb0c789f5fc56b568f8
// http://open.t.qq.com/cgi-bin/oob?oauth_token=86e8a48c83904d918cad0d513d4bf99d&oauth_verifier=796840&openid=EA68676D5E9DA465822CD0CEB2DC6EF5&openkey=1E7DE375708D08ECCB665ACB0362BD05
// http://localhost.nodeweibo.com:8088/oauth/callback?code=70c616ef260be1304e12&state=1348901925953
// weibo.get_access_token({ 
//   blogtype: user.blogtype,
//   oauth_verifier: '168c90094e41d2ec882504a45ba0caeb',
//   // state: '1348901925953',
// }, function (err, auth_user) {
//   console.log(err, auth_user);
// });

// weibo.user_timeline(user, function (err, data) {
//   console.log(data.items[0]);
// });

