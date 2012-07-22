(function () {
    
var TSinaAPI;
var utils;
  
if (typeof require !== 'undefined') {
  TSinaAPI = require('./tsina');
  utils = require('./utils');
} else {
  TSinaAPI = weibo.TSinaAPI;
  utils = weibo.utils;
}

var GithubAPI = utils.inherits({}, TSinaAPI, {
  config: utils.extend({}, TSinaAPI.config, {
    host: 'https://api.github.com',
    result_format: '',
    source: '', 
    oauth_key: '8e14edfda73a71f1f226',
    oauth_secret: '1796ac639a8ada0dff6acfee2d63390440ca0f3b',
    oauth_callback: 'http://localhost:8088/github/callback',
    oauth_host: 'https://github.com',
    oauth_authorize: '/login/oauth/authorize',
    oauth_access_token: '/login/oauth/access_token',
    oauth_scope: '',
    
    verify_credentials: '/user',
  }),
  
  url_encode: function (text) {
    return text;
  },

  apply_auth: function (url, args, user) {
    delete args.data.source;
    if (user && user.oauth_token_key) {
      args.data.access_token = user.oauth_token_key;
    }
  },
  
  get_access_token: function (user, callback, context) {
    var params = {
      url: this.config.oauth_access_token,
      type: 'GET',
      play_load: 'json',
      api_host: this.config.oauth_host,
      data: {
        code: user.oauth_token_key,
        client_id: this.config.oauth_key, 
        client_secret: this.config.oauth_secret,
        state: user.state,
      },
    };
    this._send_request(params, function (err, data) {
      if (err) {
        callback.call(context, err);
        return;
      }
      if (data.error) {
        callback.call(context, new Error(data.error));
        return;
      }
      var authUser = {
        blogType: user.blogType,
        oauth_token_key: data.access_token,
        oauth_token_type: data.token_type,
      };
      callback.call(context, null, authUser);
    });
  },
  
  get_authorization_url: function (user, callback, context) {
    var params = {
      response_type: 'code',
      client_id: this.config.oauth_key, 
      redirect_uri: user.oauth_callback || this.config.oauth_callback,
      scope: user.oauth_scope || this.config.oauth_scope,
      state: String(new Date().getTime())
    };
    var loginURL = this.config.oauth_host + this.config.oauth_authorize + '?';
    var args = [];
    for (var k in params) {
      args.push(k + '=' + encodeURIComponent(params[k]));
    }
    loginURL += args.join('&');
    callback.call(context, null, {auth_url: loginURL});
  },

  format_user: function (data, args) {
    var user = {
      id: data.id,
      t_url: data.html_url,
      screen_name: data.name,
      name: data.login,
      location: data.location,
      followers_count: data.followers,
      friends_count: data.following,
      created_at: data.created_at,
      email: data.email,
      description: (data.bio || '') + ' ' + (data.company || ''),
      public_gists: data.public_gists,
      public_repos: data.public_repos,
      blog: data.blog,
      hireable: data.hireable,
      profile_image_url: data.avatar_url,
    };
    return user;
  },
  
});

if (typeof module === 'undefined') {
  weibo.GithubAPI = GithubAPI;
} else {
  module.exports = GithubAPI;
}

})();