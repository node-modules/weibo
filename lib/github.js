/*!
 * node-weibo - lib/github.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBaseOauthV2 = require('./tbase_oauth_v2');
var inherits = require('util').inherits;
var TSinaAPI = require('./tsina');
var utils = require('./utils');
var querystring = require('querystring');


function GithubAPI(options) {
  GithubAPI.super_.call(this);
   var config = utils.extend({}, options, {
    host: 'https://api.github.com',
    result_format: '',
    oauth_key: '',
    oauth_secret: '',
    oauth_host: 'https://github.com',
    oauth_authorize: '/login/oauth/authorize',
    oauth_access_token: '/login/oauth/access_token',
        
    verify_credentials: '/user',
    user_show: '/users/{{uid}}',

    support_search: false,
    support_user_search: false,
    support_search_suggestions_at_users: false,
    support_favorites: false,
    support_favorite_show: false,
    support_favorite_create: false,
    support_favorite_destroy: false,
    support_direct_messages_both: false,
    support_direct_messages: false,
    support_direct_messages_sent: false,
    support_direct_message_create: false,
    support_direct_message_destroy: false,
    
  });
  this.init(config);
}

inherits(GithubAPI, TBaseOauthV2);
module.exports = GithubAPI;

/**
 * Utils methods
 */

GithubAPI.prototype.url_encode = function (text) {
  return text;
};

/**
 * OAuth
 */

GithubAPI.prototype.convert_token = function (user) {
  var data = GithubAPI.super_.prototype.convert_token.call(this, user);
  data.state = Date.now();
  return data;
};

/**
 * Result formatters
 */

GithubAPI.prototype.format_access_token = function (token) {
  token = querystring.parse(token);
  return token;
};

/**
 *
{ 
  public_repos: 67,
  following: 84,
  created_at: '2009-11-21T08:07:35Z',
  type: 'User',
  email: 'fengmk2@gmail.com',
  bio: 'nodejs',
  blog: 'http://fengmk2.github.com',
  location: 'Hangzhou, China',
  gravatar_id: '95b9d41231617a05ced5604d242c9670',
  avatar_url: 'https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png',
  public_gists: 21,
  followers: 293,
  login: 'fengmk2',
  name: 'fengmk2',
  company: 'http://www.taobao.com/',
  id: 156269,
  html_url: 'https://github.com/fengmk2',
  hireable: false,
  url: 'https://api.github.com/users/fengmk2'
}
 */
GithubAPI.prototype.format_user = function (data) {
  var user = {
    id: data.login,
    t_url: data.html_url,
    screen_name: data.name,
    name: data.login,
    location: data.location,
    url: data.blog || data.url,
    profile_image_url: data.avatar_url + '&s=50',
    avatar_large: data.avatar_url + '&s=180',
    gender: 'n',
    following: false,
    verified: false,
    follow_me: false,
    followers_count: data.followers,
    friends_count: data.following,
    statuses_count: data.public_repos,
    favourites_count: 0,
    created_at: new Date(data.created_at),
    email: data.email,
  };
  return user;
};


