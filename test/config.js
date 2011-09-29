/**
 * Module dependencies.
 */

var tapi = require('../lib/tapi');

// init appkey
tapi.init('tsina', '4010445928', 'd119f62bfb70a4ba8d9b68bf14d6e45a', 'oob');
tapi.init('twitter', 'i1aAkHo2GkZRWbUOQe8zA', 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY', 'oob');

exports.tapi = tapi;
var users = exports.users = {
	tsina: { 
		blogtype: 'tsina',
		authtype: 'oauth',
		oauth_token_key: 'dfb7e44a2ce957621839ac0177ad717d',
		oauth_token_secret: 'ddc30c8d41d0f5f92d8618441609fe20' 
	},
	twitter: {
		blogtype: 'twitter',
		authtype: 'oauth',
		oauth_token_key: '21738641-mcEnrozo8SyJHG3l6mIoyf9Ri3yj8aG52g4dJAvSd',
		oauth_token_secret: 'To2RwooMrr8paJ642D50BxcJBXsiWAoISfG65vRRa8'
	}
};

//var user = users.twitter;
//tapi.get_authorization_url(user, null, function(error, auth_url, res) {
//	console.log(auth_url);
//	console.log(user);
//});
//tapi.get_access_token({ blogtype: 'twitter',
//	  authtype: 'oauth', oauth_verifier: '2652733',
//	  oauth_token_key: 'rKHpmgRCkFHKZc4R9J3stMIhb2z0lw8e6fKPUXZSgU',
//	  oauth_token_secret: 'ozbwtlRniSSof6pmUK8gyCUJE6jfh8npHFeEPPeT2iI' }, function(error, auth_user) {
//	console.log(auth_user);
//});


//tapi.user_timeline({user: user}, function(error, data){
//	console.log(data[0]);
//});