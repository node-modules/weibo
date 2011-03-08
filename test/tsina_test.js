var assert = require('assert');
var tapi = require('../../node-weibo');

var user = {
	authtype: 'oauth',
	oauth_token_key: 'd474afa55f3b631ef2ec7bf4072c8762',
	oauth_token_secret: '5ec23da65f4bf43cadc7c3f7dc726ce0'
};

tapi.public_timeline({}, function(data) {
	assert.ok(data.length > 0, 'public_timeline empty');
});

tapi.public_timeline({user: user}, function(data) {
	assert.ok(data.length > 0, '(oauth) public_timeline empty');
});

var count = 5;
tapi.public_timeline({user: user, count: count}, function(data) {
	assert.equal(data.length, count, 'public_timeline count params not effect.');
});
var zero_count = 0;
tapi.public_timeline({user: user, count: zero_count}, function(data) {
	assert.ok(data.length == 19 || data.length == 20, 'public_timeline zero count params.');
});

tapi.user_timeline({user: user}, function(data){
	assert.ok(data.length == 19 || data.length == 20, 'user_timeline empty. ' + data.length);
	if(data.length > 1) {
		// 最新的在前面
		assert.ok(String(data[0].id) > String(data[data.length-1].id), 'user_timeline data[0].id not greater than data[-1].id');
	}
});

//tapi.get_authorization_url({}, null, function(auth_url, user) {
//	console.log(auth_url);
//	console.log(user);
//});
//tapi.get_access_token({
//authtype: 'oauth', oauth_verifier: 516479,
//oauth_token_key: 'b9c78eaa5281b160307ff4d5f4f3e02c',
//oauth_token_secret: '5ec23da65f4bf43cadc7c3f7dc726ce0'}, function(user) {
//	console.log(user);
//});


//tapi.user_timeline({user: user}, function(data){
//	console.log(data[0]);
//});