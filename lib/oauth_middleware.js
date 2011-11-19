// oauth login handler
var tapi = require('./tapi')
  , urlutil = require('url');
/**
 * Parse the given cookie string into an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */
var parseCookie = function(str){
  var obj = {}
    , pairs = str.split(/[;,] */);
  for (var i = 0, len = pairs.length; i < len; ++i) {
    var pair = pairs[i]
      , eqlIndex = pair.indexOf('=')
      , key = pair.substr(0, eqlIndex).trim().toLowerCase()
      , val = pair.substr(++eqlIndex, pair.length).trim();
    // quoted values
    if ('"' == val[0]) val = val.slice(1, -1);
    // only assign once
    if (undefined == obj[key]) {
      val = val.replace(/\+/g, ' ');
      try {
        obj[key] = decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          obj[key] = val;
        } else {
          throw err;
        }
      }
    }
  }
  return obj;
};
/**
 * Serialize the given object into a cookie string.
 *
 *      utils.serializeCookie('name', 'tj', { httpOnly: true })
 *      // => "name=tj; httpOnly"
 *
 * @param {String} name
 * @param {String} val
 * @param {Object} obj
 * @return {String}
 * @api public
 */
var serializeCookie = function(name, val, obj){
  var pairs = [name + '=' + encodeURIComponent(val)]
    , obj = obj || {};
  if (obj.domain) pairs.push('domain=' + obj.domain);
  if (obj.path) pairs.push('path=' + obj.path);
  if (obj.expires) pairs.push('expires=' + obj.expires.toUTCString());
  if (obj.httpOnly) pairs.push('httpOnly');
  if (obj.secure) pairs.push('secure');
  return pairs.join('; ');
};
function get_referer(req, options) {
	var referer = req.headers['Referer'] || (req.param ? req.param('reffer') : '/') || '/';
	// 防止死跳转
	if(referer.indexOf(options.login_path) == 0 || referer.indexOf(options.logout_path) == 0) {
		referer = '/';
	}
	return referer;
};
function set_cookie(res, name, value, options) {
	options = options || {path: '/'};
	res.setHeader("Set-Cookie", serializeCookie(name, value, options));
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
	        cookies = parseCookie(cookie);
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
	var blogtype = urlutil.parse(req.url, true).query[blogtype_field] || options.default_blogtype;
	var referer = get_referer(req, options);
	if(!options.home_url) {
	    options.home_url = 'http://' + req.headers.host;
	}
	var auth_callback = options.home_url + options.callback_path 
		+ '?' + blogtype_field + '=' + blogtype;
	var user = {blogType: blogtype};
	tapi.get_authorization_url(user, auth_callback, function(error, auth_url, response) {
	    if(error || !auth_url) {
	        if(!error) {
	            error = new Error('empty auth_url');
	        }
	        return options.error_callback(error, referer, user, req, res);
	    }
	    var auth_info = user.oauth_token_secret + '|' + referer;
        set_cookie(res, '_oauth', auth_info);
        redirect(res, auth_url);
	});
}
function callback(req, res, next, options) {
	var query = urlutil.parse(req.url, true).query;
	var blogtype = query[options.blogtype_field] || options.default_blogtype;
	var auth_info = get_cookie(req, '_oauth') || '';
	auth_info = auth_info.split('|');
	var user = {
		blogtype: blogtype,
		blogType: blogtype,
		oauth_token_key: query.oauth_token,
		oauth_verifier: query.oauth_verifier,
		oauth_token_secret: auth_info[0]
	};
	var referer = auth_info[1];
	tapi.get_access_token(user, function(error, auth_user) {
		remove_cookie(res, '_oauth');
		if(error) return options.error_callback(error, referer, user, req, res);
		// get user info
		tapi.verify_credentials(auth_user, function(error, t_user) {
			if(error) return options.error_callback(error, referer, user, req, res);
			for(var k in auth_user) {
				t_user[k] = auth_user[k];
			}
			// oauth success, call login_callback function
			options.login_callback(t_user, referer, req, res, function(error){
			    if(error) {
			        return options.error_callback(error, referer, user, req, res);
			    }
			    redirect(res, referer);
			});
		});
	});
}
module.exports = function oauth_middleware(login_callback, options) {
	options = options || {};
	if(options.home_url) {
	    options.home_url = home_url.replace(/\/+$/, '');
	}
	options.login_path = options.login_path || '/oauth';
	if(options.login_path.indexOf('/') != 0) {
		options.login_path = '/' + options.login_path;
	}
	options.callback_path = options.login_path + '_callback';
	options.blogtype_field = options.blogtype_field || 'blogtype'; // url 不区分大小写
	options.login_callback = login_callback;
	if(!options.error_callback) {
	    options.error_callback = function error_callback(error, referer, user, req, res, next) {
	        // oauth fail
			send(res, user.blogType + ' get_access_token error: ' + error.message
				+ '<br/> <a href="' + referer + '">go back</a>');
	    };
	}
	return function(req, res, next) {
		if(req.url.indexOf(options.callback_path) === 0) {
			callback(req, res, next, options);
		} else if(req.url.indexOf(options.login_path) === 0) {
			login(req, res, next, options);
		} else {
			next();
		}
	};
};
