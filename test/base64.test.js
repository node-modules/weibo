/**
 * Module dependencies.
 */

var assert = require('assert')
  , base64 = require('../lib/base64').Base64;

module.exports = {
    'strcode encode': function() {
		var cases = ['你好', 'json', 'XX你好啊！dawa\';:\"/?.>？》！@＃！¥％⋯⋯—＊（}{"'];
		for(var i = 0; i < cases.length; i++) {
			var c = cases[i], key = '523f2d0d134bfd5aa138f9e5af828bf9';
			//console.log(base64.strcode(c, key), base64.strcode(base64.strcode(c, key), key, true));
			assert.equal(base64.strcode(base64.strcode(c, key), key, true), c);
		}
	}               
};
