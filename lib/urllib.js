/**
 * Module dependencies.
 */

var http = require('http')
  , https = require('https')
  , urlutil = require('url')
  , querystring = require('querystring')
  , Base64 = require('./base64').Base64;

/**
 * Fixed JSON bad word, more detail see [JSON parse在各浏览器的兼容性列表](http://www.cnblogs.com/rubylouvre/archive/2011/02/12/1951760.html)
 */
var RE_JSON_BAD_WORD = /[\u000B\u000C]/ig; 

/**
 * 封装所有http请求，自动区分处理http和https
 * 
 * @param {String} url
 * @param {Object} args
 *   - data: request data
 *   - content: optional, if set content, `data` will ignore
 *   - type: optional, could be GET | POST | DELETE | PUT, default is GET
 *   - data_type: `text` or `json`, default is text
 *   - headers: 
 * @param {Function} callback
 * @param {Object} optional context of callback, callback.call(context, data, error, res)
 * @api public
 */
exports.request = function(url, args, callback, context) {
	var info = urlutil.parse(url);
	if(!args) {
		args = {};
	}
	var method = (args.type || 'GET').toUpperCase();
	var request_method = http.request;
	var port = info.port || 80;
	if(info.protocol == 'https:') {
		request_method = https.request;
		if(!info.port) {
			port = 443;
		}
	}
	var options = {
		host: info.hostname,
		path: info.pathname || '/',
		method: method,
		port: port
	};
	if(args.headers) {
		options.headers = args.headers;
	}
	if(info.query) {
		options.path += info.search;
	}
	var body = args.content || args.data;
	if(!args.content) { // 需要对数据进行编码
		if(body && !(body instanceof String || body instanceof Buffer)) {
    		body = querystring.stringify(body);
    	}
	}
	if(method == 'GET' && body) {
		options.path += (info.query ? '' : '?') + body;
		body = null;
	}
	if(body) {
		options.headers['Content-Length'] = body.length;
	}
	var req = request_method(options, function(res) {
//		console.log(options);
//		console.log('statusCode:', res.statusCode);
//		console.log('headers:', res.headers);
		var chunks = [], length = 0;
		res.on('data', function(chunk) {
			length += chunk.length;
			chunks.push(chunk);
//    			console.log('on data ' + chunk.length);
		});
		res.on('end', function(){
//    			console.log(chunks.length);
			var data = new Buffer(length);
			var error = null;
			// 延后copy
			for(var i=0, pos=0, size=chunks.length; i<size; i++) {
				chunks[i].copy(data, pos);
				pos += chunks[i].length;
			}
			data = data.toString();
			//console.log(res.statusCode, data)
			if(res.statusCode == 200 || res.statusCode == 201) {
				if(args.data_type == 'json') {
    				data = data.replace(RE_JSON_BAD_WORD, '');
    				data = JSON.parse(data);
    			}
			} else {
				error = data;
				// TODO: format error
				data = null;
			}
			if(callback) {
				callback.call(context, error, data, res);
			}
		});
	});
	if(body) {
		req.write(body);
	}
	req.end();
};

/**
 * 生成HTTP Basic Authentication的字符串："Base base64String"
 * 
 * @param {String} user
 * @param {String} password 
 * @return {String} 'Basic xxxxxxxxxxxxxxxx'
 * @api public
 */
exports.make_base_auth_header = function(user, password) {
	var tok = user + ':' + password;
	var hash = Base64.encode(tok);
	return "Basic " + hash;
};
