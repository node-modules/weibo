/*!
 * node-weibo - oauth_middleware for connect
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = require('./tapi');

function get_referer(req, options) {
	var referer = req.headers['referer'] || '/';
	// 防止死跳转
	if (referer.indexOf(options.login_path) === 0 || referer.indexOf(options.logout_path) === 0) {
		referer = '/';
	}
	return referer;
}

function redirect(res, url) {
	res.writeHead(302, {
		'Location': url
	});
	res.end();
}

function login(req, res, next, options) {
	var blogtype_field = options.blogtype_field;
	var blogtype = req.query[blogtype_field];
	var referer = get_referer(req, options);
	if (!options.home_url) {
    options.home_url = 'http://' + req.headers.host;
	}
	var auth_callback = options.home_url + options.callback_path 
		+ '?' + blogtype_field + '=' + blogtype;
	var user = { blogType: blogtype };
	tapi.get_authorization_url(user, auth_callback, function(error, auth_url) {
    if (error || !auth_url) {
      if (!error) {
          error = new Error('empty auth_url');
      }
      return options.error_callback(error, referer, user, req, res);
    }
    req.session.oauth_info = {
      oauth_token_secret: user.oauth_token_secret,
      referer: referer
    };
    redirect(res, auth_url);
	});
}

function logout(req, res, next, options) {
  var referer = get_referer(req, options);
  req.session.oauthUser = null;
  redirect(res, referer);
}

function callback(req, res, next, options) {
	var blogtype = req.query[options.blogtype_field];
  var oauth_info = req.session.oauth_info || {};
  req.session.oauth_info = null;
	var user = {
		blogtype: blogtype,
		blogType: blogtype,
		oauth_token_key: req.query.oauth_token,
		oauth_verifier: req.query.oauth_verifier,
		oauth_token_secret: oauth_info.oauth_token_secret
	};
	var referer = oauth_info.referer;
	tapi.get_access_token(user, function(error, auth_user) {
		if (error) {
      return next(error);
    }
		// get user info
		tapi.verify_credentials(auth_user, function(error, t_user) {
			if (error) {
        return next(error);
      }
			for (var k in auth_user) {
				t_user[k] = auth_user[k];
			}
      req.session.oauthUser = t_user;
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
 *   - `home_url`: use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - `login_path`: login url, default is '/oauth'
 *   - `logout_path`: default is '/oauth/logout'
 *   - `callback_path`: default is login_path + '_callback'
 *   - `blogtype_field`: default is 'blogtype', 
 *     if you want to connect weibo, login url should be '/oauth?blogtype=weibo'
 */

module.exports = function oauth(options) {
  if (typeof arguments[0] === 'function') {
    // support old arguments style: (login_callback, options)
    options = arguments[1] || {};
    options.login_callback = arguments[0];
  } else {
    options = options || {};
  }
	if (options.home_url) {
	   options.home_url = options.home_url.replace(/\/+$/, '');	
	  //options.home_url = home_url.replace(/\/+$/, '');
	}
	options.login_path = options.login_path || '/oauth';
  options.logout_path = options.logout_path || '/ouath/logout';
	options.callback_path = options.login_path + '_callback';
	options.blogtype_field = options.blogtype_field || 'blogtype'; // url 不区分大小写\
	return function(req, res, next) {
		if (req.url.indexOf(options.callback_path) === 0) {
			callback(req, res, next, options);
		} else if (req.url.indexOf(options.login_path) === 0) {
			login(req, res, next, options);
		} else if (req.url.indexOf(options.logout_path) === 0) {
      logout(req, res, next, options);
    } else {
			next();
		}
	};
};
