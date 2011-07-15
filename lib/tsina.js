(function(exports){

if(typeof require !== 'undefined') {
	var http = require('http'),
		https = require('https'),
		querystring = require('querystring'),
		util = require('util'),
		urlutil = require('url'),
		fs = require('fs'),
		path = require('path'),
		OAuth = require('./oauth').OAuth,
		urllib = require('./urllib');
} else {
	var OAuth = weibo.oauth.OAuth
	  , urllib = weibo.urllib;
	var querystring = {
        parse: function(s) {
            var params = OAuth.decodeForm(s);
            if(!params || params.length === 0) {
                return null;
            }
            var qs = {};
            for(var i = 0, len = params.length; i < len; i++) {
                var ps = params[i];
                qs[ps[0]] = ps[1];
            }
            return qs;
        }
	};
}

if(!Object.extend) {
	// destination, source1[, source2, ...]
	Object.extend = function(destination) {
		for(var i = 1, len = arguments.length; i < len; i++) {
			var source = arguments[i];
			for(var property in source) {
			    destination[property] = source[property];
			}
		}
		return destination;
	};
}

/**
 * 格式化字符串
 * eg:
 * 	'{0}天有{1}个小时'.format([1, 24]) 
 *  or
 *  '{{day}}天有{{hour}}个小时'.format({day:1, hour:24}})
 * @param {Object} values
 */
var STRING_FORMAT_REGEX = /\{\{([\w\s\.\'\"\(\),-\[\]]+)?\}\}/g;
String.prototype.format = function(values) {
    return this.replace(STRING_FORMAT_REGEX, function(match, key) {
    	return values[key] || eval('(values.' +key+')');
    });
};

//格式化时间输出。示例：new Date().format("yyyy-MM-dd hh:mm:ss");
Date.prototype.format = function(format)
{
	format = format || "yyyy-MM-dd hh:mm:ss";
	var o = {
		"M+" : this.getMonth()+1, //month
		"d+" : this.getDate(),    //day
		"h+" : this.getHours(),   //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth()+3)/3), //quarter
		"S" : this.getMilliseconds() //millisecond
	};
	if(/(y+)/.test(format)) {
		format=format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	}

	for(var k in o) {
		if(new RegExp("("+ k +")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		}
	}
	return format;
};

exports.TSinaAPI = {
	
	config: {
		host: 'http://api.t.sina.com.cn',
        user_home_url: 'http://weibo.com/n/',
        search_url: 'http://weibo.com/k/',
		result_format: '.json',
		source: '',
        oauth_key: '',
        oauth_secret: '',
        // google app key
        google_appkey: 'AIzaSyAu4vq6sYO3WuKxP2G64fYg6T1LdIDu3pk',
        
        userinfo_has_counts: true, // 用户信息中是否包含粉丝数、微博数等信息
        support_counts: true, // 是否支持批量获取转发和评论数
        support_comment: true, // 判断是否支持评论列表
        support_do_comment: true, // 判断是否支持发送评论
        support_repost_comment: true, // 判断是否支持转发同时发评论
        support_repost_comment_to_root: false, // 判断是否支持转发同时给原文作者发评论
		support_upload: true, // 是否支持上传图片
		support_repost: true, // 是否支持新浪形式转载
		repost_pre: '转:', // 转发前缀
        repost_delimiter: '//', //转发的分隔符
		image_shorturl_pre: ' [图] ', // RT图片缩址前缀
		support_favorites: true, // 判断是否支持收藏列表
		support_do_favorite: true, // 判断是否支持收藏功能
        support_geo: true, //是否支持地理位置信息上传
		// 是否支持max_id 分页
		support_max_id: true,
		support_destroy_msg: true, //是否支持删除私信
		support_direct_messages: true, 
		support_sent_direct_messages: true, //是否支持自己发送的私信
		support_mentions: true, 
		support_friendships_create: true,
		support_search: true,
		support_search_max_id: false,
		support_favorites_max_id: false, // 收藏分页使用max_id
		
		need_processMsg: true, //是否需要处理消息的内容
		comment_need_user_id: false, // 评论是否需要使用到用户id，默认为false，兼容所有旧接口
        
		// api
        public_timeline:      '/statuses/public_timeline',
        friends_timeline:     '/statuses/friends_timeline',
        comments_timeline: 	  '/statuses/comments_timeline',
        user_timeline: 	      '/statuses/user_timeline',
        mentions:             '/statuses/mentions',
        followers:            '/statuses/followers',
        friends:              '/statuses/friends',
        favorites:            '/favorites',
        favorites_create:     '/favorites/create',
        favorites_destroy:    '/favorites/destroy/{{id}}',
        counts:               '/statuses/counts',
        status_show:          '/statuses/show/{{id}}',
        update:               '/statuses/update',
        upload:               '/statuses/upload',
        repost:               '/statuses/repost',
        repost_timeline:      '/statuses/repost_timeline',
        comment:              '/statuses/comment',
        reply:                '/statuses/reply',
        comment_destroy:      '/statuses/comment_destroy/{{id}}',
        comments:             '/statuses/comments',
        destroy:              '/statuses/destroy/{{id}}',
        destroy_msg:          '/direct_messages/destroy/{{id}}',
        direct_messages:      '/direct_messages', 
        sent_direct_messages: '/direct_messages/sent', //自己发送的私信列表，我当时为什么要命名为sent_direct_messages捏，我擦
        new_message:          '/direct_messages/new',
        verify_credentials:   '/account/verify_credentials',
        rate_limit_status:    '/account/rate_limit_status',
        friendships_create:   '/friendships/create',
        friendships_destroy:  '/friendships/destroy',
        friendships_show:     '/friendships/show',
        reset_count:          '/statuses/reset_count',
        user_show:            '/users/show/{{id}}',
        
        // 用户标签
        tags: 				  '/tags',
        create_tag: 	      '/tags/create',
        destroy_tag:          '/tags/destroy',
        tags_suggestions:	  '/tags/suggestions',
        
        // 搜索
        search:               '/statuses/search',
        user_search:          '/users/search',
        
        oauth_authorize: 	  '/oauth/authorize',
        oauth_request_token:  '/oauth/request_token',
        oauth_callback: 'oob',
        oauth_access_token:   '/oauth/access_token',
        
        // 图片上传字段名称
        pic_field: 'pic',
        
        ErrorCodes: {
        	"40025:Error: repeated weibo text!": "重复发送",
        	"40028:": "新浪微博接口内部错误",
        	"40031:Error: target weibo does not exist!": "不存在的微博ID",
        	"40015:Error: not your own comment!": "评论ID不在登录用户的comments_by_me列表中",
        	"40303:Error: already followed": "已跟随"
        }
    },
    
    // 封装所有http请求，自动区分处理http和https
    // args: {data, 
    //		  type: 'GET | POST | DELETE', 
    //		  headers}
    // callback.call(context, data, error, res || xhr)
    request: function(url, args, callback, context) {
    	if(args.play_load != 'string') {
    		args.data_type = 'json';
    	}
    	urllib.request(url, args, function(error, data, res){
    		if(args.play_load != 'string') {
        		if(error) {
        			// create error, format error to {message: error message}
        			error = this.format_error(error, res);
        		} else if(data){
        			data = this.format_result(data, args.play_load, args);
        		}
    		}
    		callback.call(context, error, data, res);
    	}, this);
    },
    
    _send_request: function(params, callback, context) {
    	var args = {type: 'GET', play_load: 'status', headers: {}};
    	for(var k in params) {
    		args[k] = params[k];
    	}
    	args.data = args.data || {};
    	args.data.source = args.data.source || this.config.source;
    	if(!args.data.source || args.need_source === false || this.config.need_source === false) {
    		delete args.need_source;
    		delete args.data.source;
    	}
    	var user = args.user || args.data.user || {};
        args.user = user;
        if(args.data && args.data.user) delete args.data.user;
        
        if(args.data.status){
        	args.data.status = this.url_encode(args.data.status);
        }
        if(args.data.comment){
        	args.data.comment = this.url_encode(args.data.comment);
        }
        // 请求前调用
        this.before_send_request(args, user);
        var api = user.apiProxy || args.api_host || this.config.host;
    	var url = api + args.url.format(args.data);
    	if(args.play_load != 'string' && this.config.result_format) {
    		url += this.config.result_format;
    	}
    	// 删除已经填充到url中的参数
	    args.url.replace(STRING_FORMAT_REGEX, function(match, key) {
	    	delete args.data[key];
	    });
	    
        // 设置认证头部
        this.apply_auth(url, args, user);
        var callmethod = user.uniqueKey + ': ' + args.type + ' ' + args.url;
        args.headers['Content-Type'] = args.content_type || 'application/x-www-form-urlencoded';
        this.request(url, args, callback, context);
    },
    
    // 翻译
    translate: function(text, target, callback) {
    	var api = 'https://www.googleapis.com/language/translate/v2';
    	if(!target || target == 'zh-CN' || target == 'zh-TW') {
    		target = 'zh';
    	}
    	var params = {key: this.config.google_appkey, target: target, q: text};
    	this.request(api, {data: params}, callback);
    },

	// 设置认证头
    // user: {username, password, authtype}
    // oauth 过程简介: 
    // 1. 使用app的token获取request token；
    // 2. 用户授权给此request token；
    // 3. 使用授权后的request token获取access token
	apply_auth: function(url, args, user) {
		if(!user) {
			return;
		}
        user.authtype = user.authtype || 'baseauth';

		if(user.authtype == 'baseauth') {
			if(user.username && user.password) {
				args.headers['Authorization'] = urllib.make_base_auth_header(user.username, user.password);
			}
		} else if(user.authtype == 'oauth' || user.authtype == 'xauth') {
			var accessor = {
				consumerSecret: this.config.oauth_secret
			};
			// 已通过oauth认证
			if(user.oauth_token_secret) {
				accessor.tokenSecret = user.oauth_token_secret;
			}
			var parameters = {};
			for(var k in args.data) {
				parameters[k] = args.data[k];
				if(k.substring(0, 6) == 'oauth_') { // 删除oauth_verifier相关参数
					delete args.data[k];
				}
			}
			var message = {
				action: url,
				method: args.type, 
				parameters: parameters
	        };
			message.parameters.oauth_consumer_key = this.config.oauth_key;
			message.parameters.oauth_version = '1.0';
			// 已通过oauth认证
			if(user.oauth_token_key) {
				message.parameters.oauth_token = user.oauth_token_key;
			}
			// 设置时间戳
			OAuth.setTimestampAndNonce(message);
			// 签名参数
		    OAuth.SignatureMethod.sign(message, accessor);
		    // oauth参数通过get方式传递
		    if(this.config.oauth_params_by_get === true) {
		    	args.data = message.parameters;
		    } else {
		    	// 获取认证头部
			    args.headers['Authorization'] = OAuth.getAuthorizationHeader(this.config.oauth_realm, message.parameters);
		    }
		}
	},
	
	format_authorization_url: function(params) {
		var login_url = (this.config.oauth_host || this.config.host) + this.config.oauth_authorize;
		return OAuth.addToURL(login_url, params);
	},
	
    // 获取认证url
    get_authorization_url: function(user, oauth_callback, callback, context) {
    	var auth_url = null;
    	if(typeof(oauth_callback) === 'function') {
    	    context = callback;
    	    callback = oauth_callback;
    	    oauth_callback = null;
    	}
    	oauth_callback = oauth_callback || 'oob';
		this.get_request_token(user, oauth_callback, function(error, token, response) {
			if(token) {
    			// 返回登录url给用户登录
    			var params = {oauth_token: token.oauth_token, oauth_callback: oauth_callback};
    			auth_url = this.format_authorization_url(params);
    			user.oauth_token_key = token.oauth_token;
    			user.oauth_token_secret = token.oauth_token_secret;
			}
			callback.call(context, error, auth_url, response);
		}, this);
    },
    
    get_request_token: function(user, oauth_callback, callback, context) {
    	if(user.authtype != 'oauth') {
    		user.authtype = 'oauth';
    	}
		var params = {
            url: this.config.oauth_request_token,
            type: 'get',
            user: user,
            play_load: 'string',
            api_host: this.config.oauth_host,
            data: {},
            need_source: false
        };
		params.data.oauth_callback = oauth_callback;
		if(this.config.oauth_request_params){
			Object.extend(params.data, this.config.oauth_request_params);
		}
		this._send_request(params, function(error, token_str, response) {
			var token = null;
			if(token_str) {
				token = querystring.parse(token_str);
				if(!token.oauth_token) {
					token = null;
					error = {message: error || token_str};
				}
			} else if(error) {
				// request=%2Foauth%2Frequest_token&error_code=401&error=40109%3AOauth+Error%3A+consumer_key_refused%21&error_CN=%E9%94%99%E8%AF%AF%3Aconsumer_key%E4%B8%8D%E5%90%88%E6%B3%95%21
				try {
					error = querystring.parse(error);
					if(!error.message) {
						error.message = error.error_CN || error.error;
					}
				} catch(e) {
					error = {message: error};
				}
			}
			callback.call(context, error, token, response);
		});
    },
    
    // 必须设置user.oauth_pin 或 user.oauth_verifier
    get_access_token: function(user, callback) {
    	if(user.authtype != 'oauth') {
    		user.authtype = 'oauth';
    	}
    	var params = {
            url: this.config.oauth_access_token,
            type: 'get',
            user: user,
            play_load: 'string',
            api_host: this.config.oauth_host,
            data: {},
            need_source: false
        };
        if(user.oauth_pin || user.oauth_verifier) {
        	params.data.oauth_verifier = user.oauth_pin || user.oauth_verifier;
        }
        if(user.authtype == 'xauth') {
        	params.data.x_auth_username = user.username;
			params.data.x_auth_password = user.password;
			params.data.x_auth_mode = "client_auth";
        }
		this._send_request(params, function(error, token_str, response) {
			var token = null;
			if(token_str) {
				token = querystring.parse(token_str);
				if(!token.oauth_token) {
					token = null;
					error = {message: 'error token str: ' + token_str};
				} else {
					user.oauth_token_key = token.oauth_token;
        			user.oauth_token_secret = token.oauth_token_secret;
				}
			} else if(error) {
				error = querystring.parse(error);
				if(!error.message) {
					error.message = error.error_CN || error.error;
				}
			}
			callback(error, user, response);
		});
    },
    
    /*
        callback(data, textStatus, errorCode): 
            成功和错误都会调用的方法。
            如果失败则errorCode为服务器返回的错误代码(例如: 400)。
    */
    verify_credentials: function(user, callback, context) {
        var params = {
            url: this.config.verify_credentials,
            type: 'get',
            user: user,
            play_load: 'user',
            data: {}
        };
        this._send_request(params, callback, context);
	},
        
    rate_limit_status: function(data, callback, context) {
        if(!callback) return;
        var params = {
            url: this.config.rate_limit_status,
            type: 'get',
            play_load: 'rate',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	// since_id, max_id, count, page 
	friends_timeline: function(data, callback, context) {
        var params = {
            url: this.config.friends_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	// id, user_id, screen_name, since_id, max_id, count, page 
    user_timeline: function(data, callback, context) {
        var params = {
            url: this.config.user_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	// id, count, page
    comments_timeline: function(data, callback, context) {
        var params = {
            url: this.config.comments_timeline,
            type: 'get',
            play_load: 'comment',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	// id, since_id, max_id, count, page
	repost_timeline: function(data, callback, context) {
		var params = {
            url: this.config.repost_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// since_id, max_id, count, page 
    mentions: function(data, callback, context){
        var params = {
            url: this.config.mentions,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// id, user_id, screen_name, cursor, count
    followers: function(data, callback, context) {
        var params = {
            url: this.config.followers,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	public_timeline: function(data, callback, context) {
		var params = {
            url: this.config.public_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// id, user_id, screen_name, cursor, count
    friends: function(data, callback, context){
        var params = {
            url: this.config.friends,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// page
    favorites: function(data, callback, context) {
        var params = {
            url: this.config.favorites,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// id
    favorites_create: function(data, callback, context) {
		if(!callback) return;
        var params = {
            url: this.config.favorites_create,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// id
    favorites_destroy: function(data, callback, context) {
		if(!callback) return;
        var params = {
            url: this.config.favorites_destroy,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// ids
    counts: function(data, callback, context) {
        if(!callback) return;
        var params = {
            url: this.config.counts,
            type: 'get',
            play_load: 'count',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // id
    user_show: function(data, callback, context) {
        var params = {
            url: this.config.user_show,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // since_id, max_id, count, page 
    direct_messages: function(data, callback, context) {
		if(!callback) return;
        var params = {
            url: this.config.direct_messages,
            type: 'get',
            play_load: 'message',
            data: data
        };
        this._send_request(params, callback, context);
	},

	// id
    destroy_msg: function(data, callback, context) {
		if(!callback) return;
        var params = {
            url: this.config.destroy_msg,
            type: 'post',
            play_load: 'message',
            data: data
        };
        this._send_request(params, callback, context);
	},

    /*data的参数列表：
    content 待发送消息的正文，请确定必要时需要进行URL编码 ( encode ) ，另外，不超过140英文或140汉字。
    message 必须 0 表示悄悄话 1 表示戳一下
    receiveUserId 必须，接收方的用户id
    source 可选，显示在网站上的来自哪里对应的标识符。如果想显示指定的字符，请与官方人员联系。
    */
    new_message: function(data, callback, context) {
		if(!callback) return;
        var params = {
            url: this.config.new_message,
            type: 'post',
            play_load: 'message',
            data: data
        };
        this._send_request(params, callback, context);
	},
	
	// id
	status_show: function(data, callback, context) {
		var params = {
			url: this.config.status_show,
			play_load: 'status',
			data: data
		};
		this._send_request(params, callback, context);
	},
    
    update: function(data, callback, context) {
        var params = {
            url: this.config.update,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // 格式上传参数，方便子类覆盖做特殊处理
    // 子类可以增加自己的参数
    format_upload_params: function(user, data, pic) {
    	
    },
    
    FILE_CONTENT_TYPES: {
    	'.gif': 'image/gif',
    	'.jpeg': 'image/jpeg',
    	'.jpg': 'image/jpeg',
    	'.png': 'image/png'
    },
    
    fileinfo: function(file) {
        var name, content_type;
        if(typeof(filepath) === 'string') {
            var ext = path.extname(file);
            content_type = this.FILE_CONTENT_TYPES[ext];
            name = path.basename(file);
        } else {
            name = file.name || file.fileName;
            content_type = file.fileType || file.type;
        }
    	return {name: name, content_type: content_type};
    },
    
    /* 上传图片
     * data: {user: user1, source: xxx, status: xxx, ...}
     * pic: filepath
     * callback: finish callback function
     * */
    upload: function(data, pic, callback, context) {
    	var user = data.user;
    	delete data.user;
    	var auth_args = {type: 'post', data: {}, headers: {}};
    	var pic_field = this.config.pic_field || 'pic';
    	data.source = data.source || this.config.source;
    	this.format_upload_params(user, data, pic);
	    var boundary = 'boundary' + (new Date).getTime();
	    var dashdash = '--';
	    var crlf = '\r\n';
	
	    /* Build RFC2388 string. */
	    var builder = '';
	
	    builder += dashdash;
	    builder += boundary;
	    builder += crlf;
		
	    for(var key in data) {
		    var value = this.url_encode(data[key]);
		    // set auth params
		    auth_args.data[key] = value;
	    }
	    
	    var api = user.apiProxy || this.config.host;
		var url = api + this.config.upload + this.config.result_format;
		// 设置认证头部
        this.apply_auth(url, auth_args, user);
        for(var key in auth_args.data) {
	    	/* Generate headers. key */            
		    builder += 'Content-Disposition: form-data; name="' + key + '"';
		    builder += crlf;
		    builder += crlf; 
		     /* Append form data. */
		    builder += auth_args.data[key];
		    builder += crlf;
		    
		    /* Write boundary. */
		    builder += dashdash;
		    builder += boundary;
		    builder += crlf;
	    }
	    /* Generate headers. [PIC] */            
	    builder += 'Content-Disposition: form-data; name="' + pic_field + '"';
	    var fileinfo = this.fileinfo(pic);
	    builder += '; filename="' + this.url_encode(fileinfo.name) + '"';
	    builder += crlf;
	
	    builder += 'Content-Type: '+ fileinfo.content_type;
	    builder += crlf;
	    builder += crlf;
	    
	    var that = this;
	    // 处理文件内容
	    this.read_file(pic, function(file_buffer) {
	        var endstr = crlf + dashdash + boundary + dashdash + crlf
	          , buffer = null;
	        if(typeof(BlobBuilder) === 'undefined') {
	            var size = builder.length + file_buffer.length + endstr.length;
	            buffer = new Buffer(size);
	            var offset = 0;
	            buffer.write(builder);
	            offset += builder.length;
	            data.copy(buffer, builder.length);
	            offset += stats.size;
	            buffer.write(endstr, offset);
	        } else {
	            buffer = new BlobBuilder(); //NOTE WebKitBlogBuilder
	            buffer.append(builder);
	            buffer.append(pic);
	            buffer.append(endstr);
	            buffer = buffer.getBlob();
	        }
            auth_args.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
            that.request(url, {
                type: 'POST', 
                play_load: 'status', 
                data: buffer, 
                process_data: false,
                headers: auth_args.headers
            }, callback, context);
	    });
    },
    
    _read_file: function(pic) {
        if(typeof(pic) === 'string') {
            fs.stat(pic, function(err, stats) {
                fs.readFile(pic, function (err, file_buffer) {
                    callback(file_buffer);
                });
            });
        } else {
            callback(pic);
        }
    },

    repost: function(data, callback, context) {
        var params = {
            url: this.config.repost,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
    },

    comment: function(data, callback, context) {
        var params = {
            url: this.config.comment,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._send_request(params, callback, context);
    },

    reply: function(data, callback, context) {
        var params = {
            url: this.config.reply,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._send_request(params, callback, context);
    },

    comments: function(data, callback, context) {
        var params = {
            url: this.config.comments,
            type: 'get',
            play_load: 'comment',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // id
    comment_destroy: function(data, callback, context) {
        var params = {
            url: this.config.comment_destroy,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._send_request(params, callback, context);
    },

    friendships_create: function(data, callback, context) {
        var params = {
            url: this.config.friendships_create,
            type: 'post',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // id
    friendships_destroy: function(data, callback, context) {
        if(!callback) return;
        var params = {
            url: this.config.friendships_destroy,
            type: 'post',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
    },

    friendships_show: function(data, callback, context) {
        if(!callback) return;
        var params = {
            url: this.config.friendships_show,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // type
    reset_count: function(data, callback, context) {
        if(!callback) return;
        var params = {
            url: this.config.reset_count,
            type: 'post',
            play_load: 'result',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // user_id, count, page
    tags: function(data, callback, context) {
    	var params = {
            url: this.config.tags,
            play_load: 'tag',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // count, page
    tags_suggestions: function(data, callback, context) {
    	var params = {
            url: this.config.tags_suggestions,
            play_load: 'tag',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // tags
    create_tag: function(data, callback, context) {
    	var params = {
            url: this.config.create_tag,
            type: 'post',
            play_load: 'tag',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // tag_id
    destroy_tag: function(data, callback, context) {
    	var params = {
            url: this.config.destroy_tag,
            type: 'post',
            play_load: 'tag',
            data: data
        };
        this._send_request(params, callback, context);
    },

    // id
    destroy: function(data, callback, context) {
        if(!data || !data.id || !callback){return;}
        var params = {
            url: this.config.destroy,
            type: 'POST',
            play_load: 'status',
            data: data
        };
        this._send_request(params, callbac, contextk);
    },
    
    // q, max_id, count
    search: function(data, callback, context) {
    	var params = {
            url: this.config.search,
            play_load: 'status',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    // q, page, count
    user_search: function(data, callback, context) {
    	var params = {
            url: this.config.user_search,
            play_load: 'user',
            data: data
        };
        this._send_request(params, callback, context);
    },
    
    format_error: function(error, res) {
    	try {
    		error = JSON.parse(error);
    		if(!error.message) {
				error.message = error.error_CN || error.error;
			}
    	} catch(e) {
    		error = {message: error};
    	}
    	return error;
    },
    
    // 格式化数据格式，其他微博实现兼容新浪微博的数据格式
    // play_load: status, user, comment, message, count, result(reset_count)
    // args: request arguments
    format_result: function(data, play_load, args) {
    	if(data.error){
    		return data;
    	}
    	var items = data.results || data.users || data;
		if(items instanceof Array) {
	    	for(var i in items) {
	    		items[i] = this.format_result_item(items[i], play_load, args);
	    	}
	    } else {
	    	data = this.format_result_item(data, play_load, args);
	    }
	    if(args.url == this.config.search && data.next_page) {
	    	// "next_page":"?page=2&max_id=1291867917&q=fawave", 提取max_id
	    	var p = urlutil.parse(data.next_page, true).query;
	    	data.max_id = p.max_id;
	    }
		return data;
	},
	
	format_result_item: function(data, play_load, args) {
		if(play_load == 'user' && data && data.id) {
			data.t_url = 'http://weibo.com/' + (data.domain || data.id);
		} else if(play_load == 'status') {
			if(!data.user) { // search data
				data.user = {
					screen_name: data.from_user,
					profile_image_url: data.profile_image_url,
					id: data.from_user_id
				};
				delete data.profile_image_url;
				delete data.from_user;
				delete data.from_user_id;
			}
			this.format_result_item(data.user, 'user', args);
			
			if(data.retweeted_status) {
				data.retweeted_status = this.format_result_item(data.retweeted_status, 'status', args);
			}
			// 设置status的t_url
//			var tpl = this.config.host + '/{{user.id}}/statuses/{{id}}';
//			data.t_url = tpl.format(data);
			data.t_url = 'http://weibo.com/' + data.user.id + '/' + WeiboUtil.mid2url(data.mid); 
		} else if(play_load == 'message') {
			this.format_result_item(data.sender, 'user', args);
			this.format_result_item(data.recipient, 'user', args);
		} else if(play_load == 'comment') {
			this.format_result_item(data.user, 'user', args);
			this.format_result_item(data.status, 'status', args);
		} 
		return data;
	},
	
	/**
	 * urlencode，子类覆盖是否需要urlencode处理
	 * 
	 * @param text
	 * @returns {String} url encode text
	 */
	url_encode: function(text) {
		return OAuth.percentEncode(text);
	},
    
	before_send_request: function(args, user) {
		
	}
};


/**
 * 新浪微博mid与url互转实用工具
 * 作者: XiNGRZ (http://weibo.com/xingrz)
 */

var WeiboUtil = {
    // 62进制字典
    str62keys: [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
    ],
};

/**
 * 62进制值转换为10进制
 * @param {String} str62 62进制值
 * @return {String} 10进制值
 */
WeiboUtil.str62to10 = function(str62) {
    var i10 = 0;
    for (var i = 0; i < str62.length; i++)
    {
        var n = str62.length - i - 1;
        var s = str62[i];
        i10 += this.str62keys.indexOf(s) * Math.pow(62, n);
    }
    return i10;
};

/**
 * 10进制值转换为62进制
 * @param {String} int10 10进制值
 * @return {String} 62进制值
 */
WeiboUtil.int10to62 = function(int10) {
    var s62 = '';
    var r = 0;
    while (int10 != 0 && s62.length < 100) {
        r = int10 % 62;
        s62 = this.str62keys[r] + s62;
        int10 = Math.floor(int10 / 62);
    }
    return s62;
};

/**
 * URL字符转换为mid
 * @param {String} url 微博URL字符，如 "wr4mOFqpbO"
 * @return {String} 微博mid，如 "201110410216293360"
 */
WeiboUtil.url2mid = function(url) {
    var mid = '';
    
    for (var i = url.length - 4; i > -4; i = i - 4) //从最后往前以4字节为一组读取URL字符
    {
        var offset1 = i < 0 ? 0 : i;
        var offset2 = i + 4;
        var str = url.substring(offset1, offset2);
        
        str = this.str62to10(str);
        if (offset1 > 0)    //若不是第一组，则不足7位补0
        {
            while (str.length < 7)
            {
                str = '0' + str;
            }
        }
        
        mid = str + mid;
    }
    
    return mid;
};

/**
 * mid转换为URL字符
 * @param {String} mid 微博mid，如 "201110410216293360"
 * @return {String} 微博URL字符，如 "wr4mOFqpbO"
 */
WeiboUtil.mid2url = function(mid) {
    if(!mid) {
        return mid;
    }
    mid = String(mid); //mid数值较大，必须为字符串！
    if(!/^\d+$/.test(mid)){ return mid; }
    var url = '';
    
    for (var i = mid.length - 7; i > -7; i = i - 7) //从最后往前以7字节为一组读取mid
    {
        var offset1 = i < 0 ? 0 : i;
        var offset2 = i + 7;
        var num = mid.substring(offset1, offset2);
        
        num = this.int10to62(num);
        url = num + url;
    }
    
    return url;
};

})( (function(){
	if(typeof exports === 'undefined') {
		window.weibo.tsina = {};
		return window.weibo.tsina;
	} else {
		return exports;
	}
})() );
