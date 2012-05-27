/**
 * Module dependencies.
 */

var tapi = require('../');

// init appkey
tapi.init('tsina', '4010445928', 'd119f62bfb70a4ba8d9b68bf14d6e45a', 'file:///Users/jb/Library/iPhone/www/index.html');
// tapi.init('tsina', '3538199806', '18cf587d60e11e3c160114fd92dd1f2b', 'oob');
// tapi.init('twitter', 'i1aAkHo2GkZRWbUOQe8zA', 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY', 'oob');

// exports.tapi = tapi;
var users = exports.users = {
  tsina: { 
    blogtype: 'tsina',
    authtype: 'oauth',
    oauth_token_key: 'd1ef5fa9aa9fee08fdc6267193a59d6a',
    oauth_token_secret: '798722589f339cc4e9e0a66a9b53f693' 
  },
  twitter: {
    blogtype: 'twitter',
    authtype: 'oauth',
    oauth_token_key: '21738641-mcEnrozo8SyJHG3l6mIoyf9Ri3yj8aG52g4dJAvSd',
    oauth_token_secret: 'To2RwooMrr8paJ642D50BxcJBXsiWAoISfG65vRRa8'
  }
};

var user = users.tsina;
// tapi.get_authorization_url(user, function (error, auth_info) {
//   console.log(error, auth_info);
// });

// tapi.get_access_token({ blogtype: 'tsina',
//   authtype: 'oauth', 
//   oauth_verifier: '838320',
//   oauth_token_key: '9bfc5e567e614e37763f4fecca8d6abb',
//   oauth_token_secret: 'ed003a5d06c52dda0d504abebaa4de46' }, function (error, auth_user) {
//   console.log(auth_user);
// });


// tapi.user_timeline({ user: user }, function (error, data) {
//   console.log(data[0]);
// });