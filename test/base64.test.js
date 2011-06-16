/**
 * Module dependencies.
 */

var assert = require('assert')
  , base64 = require('../lib/base64').Base64;

module.exports = {
    'strcode encode': function() {
		var cases = ['你好', 'json', 'XX你好啊！dawa\';:\"/?.>？》！@＃！¥％⋯⋯—＊（}{"'];
		for(var i = 0; i < cases.length; i++) {
			var c = cases[i], key = 'asdfwfewfwfwfwwefwfwefw';
			//console.log(base64.strcode(c, key), base64.strcode(base64.strcode(c, key), key, true));
			assert.equal(base64.strcode(base64.strcode(c, key), key, true), c);
		}
	}               
};
