/**
 * Module dependencies.
 */

var connect = require('connect')
  , FileStore = require('filestore').FileStore
  , fs = require('fs')
  , urlutil = require('url')
  , tapi = require('../tapi')
  , twitter = tapi.api_dispatch({blogtype: 'twitter'})
  , oauth = require('../oauth_middleware');

exports.start = function(port, store_dir) {
	store_dir = store_dir || process.cwd();
	/**
	 * Gtap APPKEY: http://code.google.com/p/gtap/source/browse/trunk/main.py
	 * CONSUMER_KEY = 'xzR7LOq6Aeq8uAaGORJHGQ'
	 * CONSUMER_SECRET = 'bCgaGEfejtE9mzq5pTMZngjnjd6rRL7hf2WBFjT4'
	 */
	tapi.init('twitter', 'xzR7LOq6Aeq8uAaGORJHGQ', 'bCgaGEfejtE9mzq5pTMZngjnjd6rRL7hf2WBFjT4');

	function redirect(res, url) {
		res.writeHead(302, {
			'Location': url,
			'Content-Length': 0
		});
		res.end();
	};
	
	var cache = new FileStore(store_dir + '/gtap_oauth_user_cache');
	
	var views = {
		'/': fs.readFileSync(__dirname + '/views/index.html'),
		'/setting': fs.readFileSync(__dirname + '/views/setting.html')
	};
	
	var server = connect.createServer(
		connect.bodyParser(),
		connect.static(__dirname + '/public'),
		connect.favicon(),
		connect.logger(),
		connect.cookieParser(),
		connect.session({secret: 'gtap-server-session-secret', store: new FileStore(store_dir + '/gtap_sessions')}),
		oauth(function(oauth_user, referer, req, res, callback) {
			var key = req.session.user.username + req.session.user.password;
			cache.set(key, oauth_user);
			redirect(res, '/user_info');
			callback(true);
		}, {default_blogtype: 'twitter'}),
		function(req, res, next) {
			if(req.url == '/') {
				var view = null;
				var user = req.session.user;
				if(user) {
					var key = user.username + user.password;
					cache.get(key, function(err, oauth_user) {
						if(oauth_user) {
							redirect(res, '/user_info');
						} else {
							res.end(views['/setting']);
						}
					});
				} else {
					res.end(views['/']);
				}
			} else if(req.url == '/login') {
				var user = {username: req.body.username, password: req.body.password};
				var key = user.username + user.password;
				cache.get(key, function(err, oauth_user) {
					if(oauth_user) {
						if(oauth_user.screen_name == user.username) {
							req.session.user = user;
							redirect(res, '/user_info');
						} else {
							res.writeHeader(200, {'Content-type': 'text/html'});
							res.end(req.session.user.username + ' already exits，Please <a href="/">Reset your username and password</a>');
						}
					} else {
						req.session.user = user;
						redirect(res, '/');
					}
				});
			} else if(req.url == '/user_info') {
				res.writeHeader(200, {'Content-type': 'text/html'});
				res.end(req.session.user.username + '(' + req.session.user.password 
					+ ') has connect to twitter. <br />gtap api: http://' + req.headers.host + '/api');
			} else {
				next();
			}
		},
		function(req, res, next) {
			var urlinfo = urlutil.parse(req.url, true);
			if(urlinfo.pathname.indexOf('/api') === 0) {
				urlinfo.pathname = urlinfo.pathname.substring(4);
			}
			var data = urlinfo.query;
			if(req.body) {
				for(var k in req.body) {
					data[k] = req.body[k];
				}
			}
			delete data.source;
			var authorization = req.headers.authorization;
		    if (!authorization) return connect.utils.unauthorized(res, '');
	
		    var parts = authorization.split(' ')
		      , scheme = parts[0]
		      , credentials = new Buffer(parts[1], 'base64').toString().split(':');
	
		    if ('Basic' != scheme) return connect.utils.badRequest(res);
		    var key = credentials[0] + credentials[1];
		    cache.get(key, function(err, oauth_user) {
		    	var params = {
		    		url: urlinfo.pathname,
		    		play_load: 'string',
		    		type: req.method,
		    		user: oauth_user,
		    		data: data
		    	};
		    	twitter._send_request(params, function(err, data) {
		    		res.end(data);
		    	});
		    });
		}
	);
	server.listen(port || 8080);
	console.log('server start');
};