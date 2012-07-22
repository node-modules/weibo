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

function login(req, res, next, options) {
  var blogtypeField = options.blogtypeField;
  var blogtype = req.query[blogtypeField];
  var referer = getReferer(req, options);
  if (!options.homeUrl) {
    options.homeUrl = 'http://' + req.headers.host;
  }
  var authCallback = options.homeUrl + options.callbackPath +
    '?' + blogtypeField + '=' + blogtype;
  var user = { blogType: blogtype, oauth_callback: authCallback };
  tapi.get_authorization_url(user, function (err, authInfo) {
    if (err) {
      return next(err);
    }
    if (typeof authInfo === 'string') {
      authInfo = {
        auth_url: authInfo
      };
    }
    authInfo.referer = referer;
    req.session.oauthInfo = authInfo;
    redirect(res, authInfo.auth_url);
  });
}

function logout(req, res, next, options) {
  var referer = getReferer(req, options);
  req.session.oauthUser = null;
  redirect(res, referer);
}

function oauthCallback(req, res, next, options) {
  var blogType = req.query[options.blogtypeField];
  var oauthInfo = req.session.oauthInfo || {};
  req.session.oauthInfo = null;
  var oauth_token = req.query.oauth_token || req.query.code;
  var user = {
    blogType: blogType,
    oauth_token_key: oauth_token,
    oauth_verifier: req.query.oauth_verifier,
    oauth_token_secret: oauthInfo.oauth_token_secret,
    state: req.query.state,
  };
  var referer = oauthInfo.referer;
  tapi.get_access_token(user, function (err, accessToken) {
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
      redirect(res, referer);
    });
  });
}

/**
 * oauth middleware for connect
 *
 * example:
 *
 *  connect(
 *    connect.query(),
 *    connect.cookieParser(),
 *    connect.session({ secret: "oh year a secret" }),
 *    weibo.oauth()
 *  );
 *
 * @param {Object} options
 *   - `homeUrl`: use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - `loginPath`: login url, default is '/oauth'
 *   - `logoutPath`: default is '/oauth/logout'
 *   - `callbackPath`: default is login_path + '/callback'
 *   - `blogtypeField`: default is 'type', 
 *     if you want to connect weibo, login url should be '/oauth?type=weibo'
 */

module.exports = function oauth(options) {
  options = options || {};
  if (options.homeUrl) {
     options.homeUrl = options.homeUrl.replace(/\/+$/, ''); 
  }
  options.loginPath = options.loginPath || '/oauth';
  options.logoutPath = options.logoutPath || '/ouath/logout';
  options.callbackPath = options.callbackPath || (options.loginPath + '/callback');
  options.blogtypeField = options.blogtypeField || 'type';
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
