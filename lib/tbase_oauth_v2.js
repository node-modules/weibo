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

/**
 * TAPI Base class, support OAuth v2.0
 */
function TBaseOauthV2() {
  TBaseOauthV2.super_.call(this);
  this.config.oauth_version = '2.0';
}

inherits(TBaseOauthV2, TBase);
module.exports = TBaseOauthV2;

/**
 * Result formatters
 */

TBaseOauthV2.prototype.format_access_token = function (token) {
  token = JSON.parse(token);
  return token;
};

/**
 * OAuth
 */

TBaseOauthV2.prototype.convert_token = function (user) {
  var params = {
    redirect_uri: user.oauth_callback || this.config.oauth_callback,
    client_id: this.config.appkey,
    response_type: 'code',
  };
  var oauth_scope = user.oauth_scope || this.config.oauth_scope;
  if (oauth_scope) {
    params.oauth_scope = oauth_scope;
  }
  if (user.state) {
    // An unguessable random string. It is used to protect against cross-site request forgery attacks.
    params.state = user.state;
  }
  if (user.forcelogin) {
    params.forcelogin = user.forcelogin;
  }
  return params;
};

TBaseOauthV2.prototype.get_authorization_url = function (user, callback) {
  var data = this.convert_token(user);
  data.response_type = 'code';
  var info = {
    blogtype: user.blogtype,
    auth_url: this.format_authorization_url(data)
  };
  process.nextTick(function () {
    callback(null, info);
  });
  return this;
};

TBaseOauthV2.prototype.get_access_token = function (user, callback) {
  var params = {
    type: 'POST',
    user: user,
    playload: 'string',
    api_host: this.config.oauth_host,
    request_method: 'get_access_token'
  };
  var data = this.convert_token(user);
  data.grant_type = 'authorization_code';
  data.client_secret = this.config.secret;
  var code = user.code || user.oauth_verifier || user.oauth_pin;
  if (code) {
    data.code = code;
  }

  params.data = data;
  var self = this;
  var url = self.config.oauth_access_token;
  self.send_request(url, params, function (err, token) {
    if (err) {
      return callback(err);
    }
    // { access_token: '2.00EkofzBtMpzNBb9bc3108d8MwDTTE',
    // remind_in: '633971',
    // expires_in: 633971,
    // uid: '1827455832' }
    token = self.format_access_token(token);
    if (!token.access_token) {
      var message = token.error || JSON.stringify(token);
      err = new Error(message);
      err.data = token;
      err.name = self.errorname('get_access_token');
      return callback(err);
    }
    token.blogtype = user.blogtype;
    callback(null, token);
  });
  return this;
};

TBaseOauthV2.prototype.apply_auth = function (url, args, user) {
  args.data = args.data || {};
  args.data.access_token = user.access_token;
};

