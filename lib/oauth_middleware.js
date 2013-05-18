/*!
 * node-weibo - oauth_middleware for connect
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = require('./tapi');

function getReferer(req, options) {
  var referer = req.headers.referer || '/';
  if (referer.indexOf(options.loginPath) === 0 || referer.indexOf(options.logoutPath) === 0) {
    referer = '/';
  }
  return referer;
}

function redirect(res, url) {
  res.writeHead(302, {
    Location: url
  });
  res.end();
}

function getAuthCallback(options) {
  return options.homeUrl + options.callbackPath;
}

function login(req, res, next, options) {
  var blogtypeField = options.blogtypeField;
  var blogtype = req.query[blogtypeField];
  var referer = getReferer(req, options);
  
  options.homeUrl = options._customeHomeUrl || 'http://' + req.headers.host;
  var authCallback = getAuthCallback(options);
  var user = {
    blogtype: blogtype,
    oauth_callback: authCallback
  };
  tapi.get_authorization_url(user, function (err, authInfo) {
    if (err) {
      return next(err);
    }
    authInfo.blogtype = blogtype;
    authInfo.referer = referer;
    req.session.oauthInfo = authInfo;
    redirect(res, authInfo.auth_url);
  });
}

function logout(req, res, next, options) {
  options.beforeLogout(req, res, function (err) {
    if (err) {
      return next(err);
    }
    var referer = getReferer(req, options);
    req.session.oauthUser = null;
    redirect(res, referer);
  });
}

function oauthCallback(req, res, next, options) {
  var oauthInfo = req.session.oauthInfo || {};
  var blogtype = req.query[options.blogtypeField] || oauthInfo.blogtype;
  req.session.oauthInfo = null;
  var token = req.query;
  token.blogtype = blogtype;
  token.oauth_callback = getAuthCallback(options);
  if (oauthInfo.oauth_token_secret) {
    token.oauth_token_secret = oauthInfo.oauth_token_secret;
  }
  var referer = oauthInfo.referer;
  tapi.get_access_token(token, function (err, accessToken) {
    if (err) {
      return next(err);
    }
    // get user info
    tapi.verify_credentials(accessToken, function (err, user) {
      if (err) {
        return next(err);
      }
      for (var k in accessToken) {
        user[k] = accessToken[k];
      }
      req.session.oauthUser = user;
      options.afterLogin(req, res, function (err) {
        if (err) {
          return next(err);
        }
        redirect(res, referer);
      });
    });
  });
}

function defaultCallback(req, res, callback) {
  callback();
}

/**
 * oauth middleware for connect
 *
 * example:
 *
 *  connect(
 *    connect.query(),
 *    connect.cookieParser('I\'m cookie secret.'),
 *    connect.session({ secret: "oh year a secret" }),
 *    weibo.oauth()
 *  );
 *
 * @param {Object} [options]
 *   - {String} [homeUrl], use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - {String} [loginPath], login url, default is '/oauth'
 *   - {String} [logoutPath], default is '/oauth/logout'
 *   - {String} [callbackPath], default is login_path + '/callback'
 *   - {String} [blogtypeField], default is 'type', 
 *       if you want to connect weibo, login url should be '/oauth?type=weibo'
 *   - {Function(req, res, callback)} [afterLogin], when oauth login success, will call this function.
 *   - {Function(req, res, callback)} [beforeLogout], will call this function before user logout.
 */

module.exports = function oauth(options) {
  options = options || {};
  if (options.homeUrl) {
     options.homeUrl = options.homeUrl.replace(/\/+$/, ''); 
     options._customeHomeUrl = options.homeUrl;
  }
  options.loginPath = options.loginPath || '/oauth';
  options.logoutPath = options.logoutPath || '/oauth/logout';
  options.callbackPath = options.callbackPath || (options.loginPath + '/callback');
  options.blogtypeField = options.blogtypeField || 'type';
  options.afterLogin = options.afterLogin || defaultCallback;
  options.beforeLogout = options.beforeLogout || defaultCallback;
  return function (req, res, next) {
    if (req.url.indexOf(options.callbackPath) === 0) {
      oauthCallback(req, res, next, options);
    } else if (req.url.indexOf(options.loginPath) === 0) {
      login(req, res, next, options);
    } else if (req.url.indexOf(options.logoutPath) === 0) {
      logout(req, res, next, options);
    } else {
      next();
    }
  };
};
