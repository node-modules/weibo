var assert = require('assert');
var tapi = require('../../node-weibo').tapi;
tapi.init('tsina', '3538199806', '18cf587d60e11e3c160114fd92dd1f2b');

var user = { blogtype: 'tsina',
		  authtype: 'oauth',
		  oauth_token_key: 'dfb7e44a2ce957621839ac0177ad717d',
		  oauth_token_secret: 'ddc30c8d41d0f5f92d8618441609fe20' };

tapi.public_timeline({user: {blogtype: 'tsina'}}, function(error, data) {
	assert.ifError(error);
	assert.ok(data.length > 0, 'public_timeline empty');
});

tapi.public_timeline({user: user}, function(error, data) {
	assert.ifError(error);
	assert.ok(data.length > 0, '(oauth) public_timeline empty');
});

var count = 5;
tapi.public_timeline({user: user, count: count}, function(error, data) {
	assert.ifError(error);
	assert.equal(data.length, count, 'public_timeline count params not effect.');
});
var zero_count = 0;
tapi.public_timeline({user: user, count: zero_count}, function(error, data) {
	assert.ifError(error);
	assert.ok(data.length == 19 || data.length == 20, 'public_timeline zero count params.');
});

tapi.user_timeline({user: user}, function(error, data){
	assert.ifError(error);
	assert.ok(data.length == 19 || data.length == 20, 'user_timeline length is wrong: ' + data.length);
	if(data.length > 1) {
		// 最新的在前面
		assert.ok(String(data[0].id) > String(data[data.length-1].id), 'user_timeline data[0].id not greater than data[-1].id');
	}
});

//tapi.get_authorization_url(user, null, function(error, auth_url, res) {
//	console.log(auth_url);
//	console.log(user);
//});
//tapi.get_access_token({ blogtype: 'tsina',
//	  authtype: 'oauth', oauth_verifier: '191503',
//	  oauth_token_key: 'b1420b9818a5c05292a11b3fb8e52bf6',
//	  oauth_token_secret: '2061dddec203e576e7aea3c4b806bce6' }, function(error, auth_user) {
//	console.log(auth_user);
//});


//tapi.user_timeline({user: user}, function(error, data){
//	assert.ifError(error);
//	console.log(data[0]);
//});