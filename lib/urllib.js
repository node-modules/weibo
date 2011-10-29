(function(exports){

/**
 * Fixed JSON bad word, more detail see [JSON parse在各浏览器的兼容性列表](http://www.cnblogs.com/rubylouvre/archive/2011/02/12/1951760.html)
 * @type {String}
 * @const
 */
exports.RE_JSON_BAD_WORD = /[\u000B\u000C]/ig; 

/**
 * The default request timeout(in milliseconds)
 * @type {Object.<Number>}
 * @const
 */
exports.TIMEOUT = 60000;

function format_args(args) {
	if(!args) {
		args = {};
	}
	if(!args.timeout) {
		args.timeout = exports.TIMEOUT;
	}
	args.type = (args.type || 'GET').toUpperCase();
	return args;
};

function format_result(args, data, response, callback, context) {
	var error = null;
	var status_code = response.status || response.statusCode;
	if(status_code == 200 || status_code == 201) {
		if(args.data_type === 'json') {
			//data = data.replace(RE_JSON_BAD_WORD, '');
			try {
				data = JSON.parse(data);
			} catch(e) {
				error = new Error('JSON format error');
				error.data = data;
				error.status_code = status_code;
				data = null;
			}
		}
	} else {
		error = data;
		if(typeof(error) === 'string') {
			try {
				error = JSON.parse(data);
				if(!error.message) {
					error.message = error.error;
				}
			} catch(e) {
				error = new Error(data || 'status ' + status_code);
			}
			error.status_code = status_code;
		}
		
		data = null;
	}
	if(callback) {
		callback.call(context, error, data, response);
	}
};

var Base64 = null;

if(typeof require !== 'undefined') {
	var http = require('http')
	  , https = require('https')
	  , urlutil = require('url')
	  , querystring = require('querystring');
	Base64 = require('./base64').Base64;
	
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
	 *   - timeout: request timeout(in milliseconds), default is urllib.TIMEOUT(60 seconds)
	 * @param {Function} callback
	 * @param {Object} optional context of callback, callback.call(context, data, error, res)
	 * @api public
	 */
	exports.request = function(url, args, callback, context) {
		var info = urlutil.parse(url);
		args = format_args(args);
		var method = args.type;
		var request_method = http.request;
		var port = info.port || 80;
		if(info.protocol == 'https:') {
			request_method = https.request;
			if(!info.port) {
				port = 443;
			}
		}
		//console.log('url:'+url);
		var options = {
			host: info.hostname,
			path: info.pathname || '/',
			method: method,
			port: port
		};
		if(args.headers) {
			options.headers = args.headers;
		}
		//console.log(args.headers);
		if(info.query) {
			options.path += info.search;
			
		}

		var body = args.content || args.data;
		
		//console.log(body);
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
			options.headers['Content-Length'] = body.length ;
		}
		var timer = null;
		 
		var req = request_method(options, function(res) {
		    clearTimeout(timer);
			var chunks = [], length = 0;
			res.on('data', function(chunk) {
				length += chunk.length;
				chunks.push(chunk);
			});
			res.on('end', function(){
				var data = new Buffer(length);				
				// 延后copy
				for(var i=0, pos=0, size=chunks.length; i<size; i++) {
					chunks[i].copy(data, pos);
					pos += chunks[i].length;
				}				
				data = data.toString();
				res.destroy();
				format_result(args, data, res, callback, context);
			});
		});
		req.on('error', function(err) {
			
		    clearTimeout(timer);
		    callback.call(context, err);
		});
		if(body) {
			req.write(body);
		}
		req.end();
		// TODO: add timeout
        timer = setTimeout(function() {
            req.abort();
            var error = new Error('Timeout');
            error.status_code = 0;
            callback.call(context, error);
        }, args.timeout);
	};
	
} else {
    Base64 = weibo.base64.Base64;
	
	/**
	 * 封装所有http请求，自动区分处理http和https
	 * 
	 * @require jQuery
	 * @param {String} url
	 * @param {Object} args
	 *   - data: request data
	 *   - content: optional, if set content, `data` will ignore
	 *   - type: optional, could be GET | POST | DELETE | PUT, default is GET
	 *   - data_type: `text` or `json`, default is text
	 *   - headers: 
	 *   - timeout: request timeout, default is urllib.TIMEOUT(60 seconds)
	 * @param {Function} callback
	 * @param {Object} optional context of callback, callback.call(context, data, error, res)
	 * @api public
	 */
	exports.request = function(url, args, callback, context) {
		args = format_args(args);
		var process_data = args.process_data || true;
		if(args.content) {
			process_data = false;
			args.data = args.content;
		}
		jQuery.ajax({
			url: url
		  , type: args.type
		  , headers: args.headers || {}
		  , data: args.data
		  , processData: process_data
		  , timeout: args.timeout
		  , dataType: 'text'
		  , success: function(data, text_status, xhr) {
			    format_result(args, data, xhr, callback, context);
		    }
		  , error: function(xhr, text_status, error) {
			    if(!error) {
			    	error = new Error(text_status);
			    }
			    format_result(args, error, xhr, callback, context);
		    }
		});
	};
}

/**
 * 生成HTTP Basic Authentication的字符串："Base base64String"
 * 
 * @param {String} user
 * @param {String} password 
 * @return {String} 'Basic xxxxxxxxxxxxxxxx'
 * @api public
 */
exports.make_base_auth_header = function(user, password) {
    var token = user + ':' + password;
    var hash = Base64.encode(token);
    return "Basic " + hash;
};


})( (function(){
	if(typeof exports === 'undefined') {
		window.weibo.urllib = {};
		return window.weibo.urllib;
	} else {
		return exports;
	}
})() );