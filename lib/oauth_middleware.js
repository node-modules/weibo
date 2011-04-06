// oauth login handler

var tapi = require('./tapi').API
  , utils = require('connect').utils
  , urlutil = require('url');

function get_referer(req, options) {
	var referer = req.headers['Referer'] || '/';
	// 防止死跳转
	if(referer.indexOf(options.login_path) == 0 || referer.indexOf(options.logout_path) == 0) {
		referer = '/';
	}
	return referer;
};

function set_cookie(res, name, value, options) {
	options = options || {path: '/'};
	res.setHeader("Set-Cookie", utils.serializeCookie(name, value, options));
};

function remove_cookie(res, name) {
	set_cookie(res, name, '', {expires: new Date(1)});
};

function get_cookie(req, name) {
	var cookies = req.cookies;
	if(!cookies) {
		cookies = {};
		var cookie = req.headers.cookie;
		if(cookie) {
	      try {
	        cookies = utils.parseCookie(cookie);
	      } catch (err) {
	        
	      }
	    }
	}
	return cookies[name];
};

function redirect(res, url) {
	res.writeHead(302, {
		'Location': url,
		'Content-Length': 0
	});
	res.end();
};

function send(res, body, status_code, headers) {
	headers = headers || {'Content-Type': 'text/html'};
	res.writeHead(status_code || 200, headers);
	res.write(body);
	res.end();
}

function login(req, res, next, options) {
	var blogtype_field = options.blogtype_field;
	var blogtype = urlutil.parse(req.url, true).query[blogtype_field];
	var referer = get_referer(req, options);
	var auth_callback = options.home_url + options.callback_path 
		+ '?' + blogtype_field + '=' + blogtype;
	var user = {blogtype: blogtype};
	tapi.get_authorization_url(user, auth_callback, function(auth_url, error) {
		if(auth_url) {
			var auth_info = user.oauth_token_secret + '|' + referer;
			set_cookie(res, '_oauth', auth_info);
			redirect(res, auth_url);
		} else if(error) {
			send(res, blogtype + ' get_authorization_url error: ' + error.message
				+ '<br/> <a href="' + referer + '">go back</a>');
		}
	});
}

function callback(req, res, next, options) {
	var query = urlutil.parse(req.url, true).query;
	var blogtype = query[options.blogtype_field]
	var auth_info = get_cookie(req, '_oauth') || '';
	auth_info = auth_info.split('|');
	var user = {
		blogtype: blogtype,
		oauth_token_key: query.oauth_token,
		oauth_verifier: query.oauth_verifier,
		oauth_token_secret: auth_info[0]
	};
	var referer = auth_info[1];
	tapi.get_access_token(user, function(auth_user, error) {
		remove_cookie(res, '_oauth');
		if(auth_user) {
			// get user info
			tapi.verify_credentials(auth_user, function(t_user, error) {
				for(var k in auth_user) {
					t_user[k] = auth_user[k];
				}
				// oauth success, call login_callback function
				options.login_callback(t_user, referer, req, res, function(dont_redirect){
					if(!dont_redirect) {
						redirect(res, referer);
					}
				});
			});
		} else if(error) {
			// oauth fail
			send(res, blogtype + ' get_access_token error: ' + error.message
				+ '<br/> <a href="' + referer + '">go back</a>');
		}
	});
}

function logout(req, res, next, options) {
	var referer = get_referer(req, options);
	redirect(res, referer);
}

module.exports = function oauth_middleware(home_url, login_callback, options) {
	options = options || {};
	options.home_url = home_url.replace(/\/+$/, '');
	options.login_path = options.login_path || '/oauth';
	if(options.login_path.indexOf('/') != 0) {
		options.login_path = '/' + options.login_path;
	}
	options.logout_path = options.logout_path || '/oauth/logout';
	if(options.logout_path.indexOf('/') != 0) {
		options.logout_path = '/' + options.logout_path;
	}
	options.callback_path = options.login_path + '_callback';
	options.blogtype_field = options.blogtype_field || 'blogtype';
	// when login finish, will call login_callback(user, error)
	options.login_callback = login_callback;
	return function(req, res, next) {
		if(req.url.indexOf(options.logout_path) == 0) {
			logout(req, res, next, options);
		} else if(req.url.indexOf(options.callback_path) == 0) {
			callback(req, res, next, options);
		} else if(req.url.indexOf(options.login_path) == 0) {
			login(req, res, next, options);
		} else {
			next();
		}
	};
};