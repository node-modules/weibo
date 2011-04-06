var tapi = exports.tapi = require('./lib/tapi').API;

/**
 * init appkey and secret
 * 
 *   var weibo = require('node-weibo');
 *   weibo.init('tsina', my_tsina_appkey, my_tsina_secret);
 *   weibo.init('tqq', my_tqq_appkey, my_tqq_secret);
 * 
 */
exports.init = function tapi_init() {
	tapi.init.apply(tapi, arguments);
};

/**
 * handler oauth login middleware, use on connect, express.
 * 
 * e.g.:
 * 
 *   app.use(weibo.oauth_middleware(home_url, function(oauth_user, referer, req, res, callback) {
 *   	// do something ...
 *   	// save oauth_user
 *   	// if auto redirect, callback()
 *   	// otherwise, callback(true), and handler redirect by yourself
 *   }));
 */
exports.oauth_middleware = require('./lib/oauth_middleware');

exports.instapaper = require('./lib/instapaper').instapaper;
