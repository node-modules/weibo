/*!
 * node-weibo - index.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = exports.tapi = require('./lib/tapi');

/**
 * init appkey and secret
 * 
 *   var weibo = require('node-weibo');
 *   weibo.init('tsina', my_tsina_appkey, my_tsina_secret);
 *   weibo.init('tqq', my_tqq_appkey, my_tqq_secret);
 * 
 */

exports.init = function init(type, appkey, secret) {
	tapi.init.apply(tapi, arguments);
};

exports.oauth = exports.oauth_middleware = require('./lib/oauth_middleware');

exports.instapaper = require('./lib/instapaper');