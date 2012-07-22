/*!
 * node-weibo - index.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var libpath = process.env.WEIBO_COV ? './lib-cov' : './lib';
module.exports = require(libpath + '/tapi');
module.exports.oauth = require(libpath + '/oauth_middleware');