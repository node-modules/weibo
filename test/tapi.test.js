/**
 * Module dependencies.
 */

var assert = require('assert')
  , config = require('./config');
var tapi = config.tapi;

var blogtypes = ['tsina', 'twitter'];
for(var i = 0, len = blogtypes.length; i < len; i++) {
	var blogtype = blogtypes[i];
	
	var user = config.users[blogtype];

	tapi.public_timeline({user: {blogtype: blogtype}}, function(error, data) {
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
//		assert.equal(data.length, count, blogtype + ' public_timeline count params not effect.');
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
	
}

