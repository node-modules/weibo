/**
 * Module dependencies.
 */

var tapi = require('../lib/tapi');

// init appkey
tapi.init('tsina', '4010445928', 'd119f62bfb70a4ba8d9b68bf14d6e45a', 'oob');
// tapi.init('twitter', 'i1aAkHo2GkZRWbUOQe8zA', 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY', 'oob');

// exports.tapi = tapi;
var users = exports.users = {
  tsina: { 
    blogtype: 'tsina',
    authtype: 'oauth',
    oauth_token_key: '10860b4bd170b003381ea6d953f3aba6',
    oauth_token_secret: 'c0af7008eba4d9de8e14a4c61e45b318' 
  },
  twitter: {
    blogtype: 'twitter',
    authtype: 'oauth',
    oauth_token_key: '21738641-mcEnrozo8SyJHG3l6mIoyf9Ri3yj8aG52g4dJAvSd',
    oauth_token_secret: 'To2RwooMrr8paJ642D50BxcJBXsiWAoISfG65vRRa8'
  }
};

// var user = users.tsina;
// tapi.get_authorization_url(user, null, function (error, auth_url, res) {
//   console.log(auth_url);
//   console.log(user);
// });

// tapi.get_access_token({ blogtype: 'tsina',
//   authtype: 'oauth', 
//   oauth_verifier: '774897',
//   oauth_token_key: '720a0a45ee131374bc681ac87245c9a9',
//   oauth_token_secret: 'd0c829b62cade4699d66255fca9e6345' }, function(error, auth_user) {
//   console.log(auth_user);
// });


// tapi.user_timeline({ user: user }, function (error, data) {
//   console.log(data[0]);
// });