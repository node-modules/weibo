/*!
 * node-weibo - lib/tbase_oauth_v2.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBase = require('./tbase');
var inherits = require('util').inherits;
var utils = require('./utils');
var querystring = require('querystring');


function TBaseOauthV2() {
  TBaseOauthV2.super_.call(this);
  this.config.oauth_version = '2.0';
}

inherits(TBaseOauthV2, TBase);
module.exports = TBaseOauthV2;

TBaseOauthV2.prototype.get_authorization_url = function (user, callback) {
  var params = {
    redirect_uri: user.oauth_callback || this.config.oauth_callback,
    client_id: this.config.appkey,
    response_type: 'code',
  };
  params = utils.extend(params, this.config.oauth_params);
  var info = {
    auth_url: this.format_authorization_url(params)
  };
  process.nextTick(function () {
    callback(null, info);
  });
  return this;
};

// http://localhost.nodeweibo.com/oauth/callback?code=0a80cb1382594e49a467b6c1e19473ec
TBaseOauthV2.prototype.get_access_token = function (user, callback) {
  var oauth_verifier = user.code || user.oauth_pin || user.oauth_verifier || 'no_verifier';
  // $oauth_host/$access_token?client_id=YOUR_CLIENT_ID
  //  &client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code
  //  &redirect_uri=YOUR_REGISTERED_REDIRECT_URI&code=CODE
  var params = {
    type: 'POST',
    user: user,
    playload: 'string',
    api_host: this.config.oauth_host,
    request_method: 'get_access_token'
  };
  var data = {
    redirect_uri: user.oauth_callback || this.config.oauth_callback,
    client_id: this.config.appkey,
    client_secret: this.config.secret,
    grant_type: 'authorization_code',
    code: oauth_verifier,
  };
  params.data = data;
  var url = this.config.oauth_access_token;
  this.send_request(url, params, function (err, token) {
    if (err) {
      return callback(err);
    }
    // { access_token: '2.00EkofzBtMpzNBb9bc3108d8MwDTTE',
    // remind_in: '633971',
    // expires_in: 633971,
    // uid: '1827455832' }
    token = JSON.parse(token);
    token.oauth_token = token.access_token;
    callback(null, token);
  });
};

TBaseOauthV2.prototype.apply_auth = function (url, args, user) {
  args.data = args.data || {};
  args.data.access_token = user.oauth_token || user.access_token;
};

TBaseOauthV2.prototype.verify_credentials = function (user, callback) {
  var uid = user.uid || user.id;
  this.user_show(user, uid, null, callback);
};

