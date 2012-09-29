/*!
 * node-weibo - index.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var weibo = require('./lib/tapi');
weibo.oauth = require('./lib/oauth_middleware');

module.exports = weibo;