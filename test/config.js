/**
 * Module dependencies.
 */

var weibo = require('../');

// init appkey
weibo.init('tqq', '801196838', '9f1a88caa8709de7dccbe3cae4bdc962', 'oob');
// test account 2490164202 fengmk2@163.com

// weibo.init('tsina', '4010445928', 'd119f62bfb70a4ba8d9b68bf14d6e45a', 'file:///Users/jb/Library/iPhone/www/index.html');
// weibo.init('tsina', '3538199806', '18cf587d60e11e3c160114fd92dd1f2b', 'oob');
// weibo.init('twitter', 'i1aAkHo2GkZRWbUOQe8zA', 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY', 'oob');

var users = exports.users = {
  tqq: {
    blogtype: 'tqq',
    authtype: 'oauth',
    oauth_token: '2d746f8c91ae4baea7243a6867cf309f',
    oauth_token_secret: '2bec75e9ddad6b27067e384a84550e38',
    name: 'node-weibo'
  }
  // tsina: { 
  //   blogtype: 'tsina',
  //   authtype: 'oauth',
  //   // oauth_token_key: 'd1ef5fa9aa9fee08fdc6267193a59d6a',
  //   // oauth_token_secret: '798722589f339cc4e9e0a66a9b53f693' 
  // },
  // twitter: {
  //   blogtype: 'twitter',
  //   authtype: 'oauth',
  //   oauth_token_key: '21738641-mcEnrozo8SyJHG3l6mIoyf9Ri3yj8aG52g4dJAvSd',
  //   oauth_token_secret: 'To2RwooMrr8paJ642D50BxcJBXsiWAoISfG65vRRa8'
  // }
};

var user = users.tqq;
// weibo.get_authorization_url(user, function (error, auth_info) {
//   console.log(error, auth_info);
// });

// http://open.t.qq.com/cgi-bin/oob?oauth_token=ac7b9a83fa1c476b814e87fec7970e76&oauth_verifier=372225&openid=EA68676D5E9DA465822CD0CEB2DC6EF5&openkey=059C41403DDD32977616BF38B568F873
// weibo.get_access_token({ 
//   blogtype: 'tqq',
//   authtype: 'oauth', 
//   oauth_verifier: '372225',
//   oauth_token: 'ac7b9a83fa1c476b814e87fec7970e76',
//   oauth_token_secret: 'cb8579142c4d2930d59125a40f3cf229',
// }, function (err, auth_user) {
//   console.log(err, auth_user);
// });

// tapi.user_timeline({ user: user }, function (error, data) {
//   console.log(data[0]);
// });