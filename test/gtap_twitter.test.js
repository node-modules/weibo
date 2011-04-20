/**
 * Module dependencies.
 */

var assert = require('assert')
  , config = require('./config');
var tapi = config.tapi;

var user = config.users.gtap_twitter;

console.log(user);

tapi.user_timeline({user: user}, function(error, data){
	assert.ifError(error);
	console.dir(data);
	assert.ok(data.length == 19 || data.length == 20, 'user_timeline length is wrong: ' + data.length);
	if(data.length > 1) {
		// 最新的在前面
		assert.ok(String(data[0].id) > String(data[data.length-1].id), 'user_timeline data[0].id not greater than data[-1].id');
	}
});

