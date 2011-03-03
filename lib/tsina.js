var http = require('http'),
	https = require('https'),
	querystring = require('querystring'),
	util = require('util'),
	urllib = require('url');

/**
 * 格式化字符串
 * eg:
 * 	'{0}天有{1}个小时'.format([1, 24]) 
 *  or
 *  '{{day}}天有{{hour}}个小时'.format({day:1, hour:24}})
 * @param {Object} values
 */
String.prototype.format = function(values) {
	var pattern = /\{\{([\w\s\.\(\)"',-\[\]]+)?\}\}/g;
    return msg.replace(pattern, function(match, key) {
    	return values[key] || eval('(values.' +key+')');
    });
};

var $ = {};

var OAUTH_CALLBACK_URL = '';

var TSinaAPI = {
	
	config: {
		host: 'http://api.t.sina.com.cn',
        user_home_url: 'http://t.sina.com.cn/n/',
        search_url: 'http://t.sina.com.cn/k/',
		result_format: '.json',
		source: '3538199806',
        oauth_key: '3538199806',
        oauth_secret: '18cf587d60e11e3c160114fd92dd1f2b',
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
		support_search_max_id: true,
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
        user_search:               '/users/search',
        
        oauth_authorize: 	  '/oauth/authorize',
        oauth_request_token:  '/oauth/request_token',
        oauth_callback: OAUTH_CALLBACK_URL,
        oauth_access_token:   '/oauth/access_token',

        detailUrl:        '/jump?aid=detail&twId=',
        searchUrl:        '/search/',
        
        ErrorCodes: {
        	"40025:Error: repeated weibo text!": "重复发送",
        	"40028:": "新浪微博接口内部错误",
        	"40031:Error: target weibo does not exist!": "不存在的微博ID",
        	"40015:Error: not your own comment!": "评论ID不在登录用户的comments_by_me列表中",
        	"40303:Error: already followed": "已跟随"
        }
    },
    
    // 封装所有http请求，自动区分处理http和https
//    request: function(url, params, method, callback) {
    request: function(url, args, callback) {
    	var info = urllib.parse(url);
    	if(!args) {
    		args = {};
    	}
    	var method = args.method || 'GET';
    	var request_method = info.protocol == 'http:' ? http.request : https.request;
    	console.log(info);
    	var options = {
    		host: info.hostname,
    		path: info.pathname,
    		method: method
    	};
    	if(info.port) {
    		options.port = info.port;
    	}
    	if(args.headers) {
    		options.headers = args.headers;
    	}
    	if(info.query) {
    		options.path += info.search;
		}
    	var body = null;
    	if(args.data) {
    		body = querystring.stringify(args.data);
    	}
    	if(method == 'GET' && body) {
    		options.path += (info.query ? '' : '?') + body;
    		body = null;
    	}
    	console.log(options);
    	var req = request_method(options, function(res) {
    		console.log('statusCode:', res.statusCode);
    		console.log('headers:', res.headers);
//    		var chunks = [], length = 0;
    		res.on('data', function(chunk) {
    			callback(chunk, res);
//    			length += chunk.length;
//    			chunks.push(chunk);
//    			console.log('on data ' + chunk.length);
    		});
//    		res.on('end', function(){
//    			console.log(chunks);
//    			var data = new Buffer(length);
//    			for(var i=0, pos=0, size=chunks.length; i<size; i++) {
//    				chunks[i].copy(data, pos);
//    			}
//    			callback(data, res);
//    		});
//    		res.on('error', function(data) {
//    			console.log(data);
//    		});
    	});
    	if(body) {
    		console.log(body);
    		req.write(body);
    	}
    	req.end();
    },
    
    _sendRequest: function(params, callback) {
    	var args = {type: 'GET', play_load: 'status', headers: {}};
    	for(var k in params) {
    		args[k] = params[k];
    	}
    	args.data = args.data || {};
    	args.data.source = args.data.source || this.config.source;
    	if(args.need_source === false) {
    		delete args.need_source;
    		delete args.data.source;
    	}
    	var user = args.user || args.data.user;
        args.user = user;
        if(args.data && args.data.user) delete args.data.user;
        
        if(args.data.status){
        	args.data.status = this.url_encode(args.data.status);
        }
        if(args.data.comment){
        	args.data.comment = this.url_encode(args.data.comment);
        }
        // 请求前调用
        this.before_sendRequest(args, user);
        var api = user.apiProxy || args.apiHost || this.config.host;
    	var url = api + args.url.format(args.data);
    	if(args.play_load != 'string' && this.config.result_format) {
    		url += this.config.result_format;
    	}
    	// 删除已经填充到url中的参数
    	var pattern = /\{\{([\w\s\.\(\)"',-]+)?\}\}/g;
	    args.url.replace(pattern, function(match, key) {
	    	delete args.data[key];
	    });
        // 设置认证头部
        this.apply_auth(url, args, user);
        var play_load = args.play_load; // 返回的是什么类型的数据格式
        var callmethod = user.uniqueKey + ': ' + args.type + ' ' + args.url;
        var request_data = args.content || args.data;
        var processData = !args.content;
        var content_type = args.content_type || 'application/x-www-form-urlencoded';
//        $.ajax({
//            url: url,
////            cache: false, // chrome不会出现ie本地cache的问题, 若url参数带有_=xxxxx，digu无法获取完整的用户信息
//            timeout: 60*1000, //一分钟超时
//            type: args.type,
//            data: request_data,
//            contentType: content_type,
//            processData: processData,
//            dataType: 'text',
//            context: this,
//            beforeSend: function(req) {
//        		for(var key in args.headers) {
//        			req.setRequestHeader(key, args.headers[key]);
//        		}
//        	},
//            success: function (data, textStatus, xhr) {
//            	if(play_load != 'string') {
//            		try{
//                        data = JSON.parse(data);
//                    }
//                    catch(err){
//                    	if(xhr.status == 201 || xhr.statusText == "Created") { // rest成功
//                    		data = data;
//                    	} else {
//                    		if(data.indexOf('{"wrong":"no data"}') > -1 || data == '' || data.toLowerCase() == 'ok'){
//                        		data = [];
//                        	} else {
//                                data = {error: callmethod + ' 服务器返回结果错误，本地解析错误。' + err, error_code:500};
//                                textStatus = 'error';
//                        	}
//                    	}
//                    }
//            	}
//                var error_code = null;
//                if(data){
//                	error_code = data.error_code || data.code;
//                    var error = data.error;
//                    if(data.ret && data.ret != 0){ //腾讯
//                        if(data.msg == 'have no tweet'){
//                            data.data = {info:[]};
//                        }else{
//                            error = data.msg;
//                            error_code = data.ret;
//                        }
//                    }
//                    if(!error && data.errors){
//                        if(typeof(data.errors)==='string'){
//                            error = data.errors;
//                        }else if(data.errors.length){ //'{"errors":[{"code":53,"message":"Basic authentication is not supported"}]}'
//                            if(data.errors[0].message){
//                                error = data.errors[0].message;
//                            }else{
//                                for(var i in data.errors[0]){
//                                    error += i + ': ' + data.errors[0][i];
//                                }
//                            }
//                        }
//                    }
//                    if(error || error_code){
//                    	data.error = error;
//                    	textStatus = this.format_error(data.error || data.wrong || data.message, error_code);
//                    	var error_msg = callmethod + ' error: ' + textStatus;
//                    	if(!textStatus && error_code){ // 错误为空，才显示错误代码
//                    		error_msg += ', error_code: ' + error_code;
//                    	}
//                        error_code = error_code || 'unknow';
//                        showMsg(error_msg);
//                    } else {
//                        //成功再去格式化结果
//                    	data = this.format_result(data, play_load, args);
//                    }
//                } else {
//                	error_code = 400;
//                }
//                callback(data, textStatus, error_code);
//            },
//            error: function (xhr, textStatus, errorThrown) {
//                var r = null, status = 'unknow';
//                try{
//                    if(xhr){
//                        if(xhr.status){
//                            status = xhr.status;
//                        }
//                        if(xhr.responseText){
//                            var r = xhr.responseText;
//                            try{
//                                r = JSON.parse(r);
//                            }
//                            catch(err){
//                                r = null;
//                            }
//                            if(r){
//                            	if(typeof(r.error) === 'object') {
//									r = r.error;
//                            	}
//                            	var error_code = r.error_code || r.code || r.type;
//                            	r.error = this.format_error(r.error || r.wrong || r.message || r.error_text, error_code);
//		                    	var error_msg = callmethod + ' error: ' + r.error;
//		                    	if(!r.error && error_code){ // 错误为空，才显示错误代码
//		                    		error_msg += ', error_code: ' + error_code;
//		                    	}
//		                    	showMsg(error_msg);
//                            }
//                        }
//                    }
//                }catch(err){
//                    r = null;
//                }
//                if(!r){
//                    textStatus = textStatus ? ('textStatus: ' + textStatus + '; ') : '';
//                    errorThrown = errorThrown ? ('errorThrown: ' + errorThrown + '; ') : '';
//                    r = {error:callmethod + ' error: ' + textStatus + errorThrown + ' statuCode: ' + status};
//                    showMsg(r.error);
//                }
//                callback(r||{}, 'error', status); //不管什么状态，都返回 error
//            }
//        });
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

    /**
     * 处理内容
     */
    processMsg: function (str, notEncode) {
        if(!str){ return ''; }
        if(!this.config.need_processMsg) { // 无需处理
        	return str;
        }
        if(!notEncode){
            str = HTMLEnCode(str);
        }

        var re = new RegExp('(?:\\[url\\s*=\\s*|)((?:www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+~]+)(?:\\](.+)\\[/url\\]|)', 'ig');
        str = str.replace(re, this._replaceUrl);
        
        str = this.processAt(str); //@***

        str = this.processSearch(str);
       
        str = this.processEmotional(str);

        str = str.replace( /([\uE001-\uE537])/gi, this.getIphoneEmoji );
        
        return str;
    },
    getIphoneEmoji: function(str){
        return "<span class=\"iphoneEmoji "+ str.charCodeAt(0).toString(16).toUpperCase()+"\"></span>";
    },
    processSearch: function (str) {
    	var search_url = this.config.search_url;
        str = str.replace(/#([^#]+)#/g, function(m, g1) {
        	// 修复#xxx@xxx#嵌套问题
        	var search = g1.remove_html_tag();
        	return '<a target="_blank" href="'+ search_url + '{{search}}" title="Search #{{search}}">#{{search}}#</a>'.format({search: search});
        });
        return str;
    },
    processAt: function (str) { //@*** u4e00-\u9fa5:中文字符 \u2E80-\u9FFF:中日韩字符
        str = str.replace(/@([\w\-\u2E80-\u9FFF\_]+)/g, '<a target="_blank" href="javascript:getUserTimeline(\'$1\');" rhref="'+ this.config.user_home_url +'$1" title="左键查看微薄，右键打开主页">@$1</a>');
//        str = str.replace(/([^#])@([\w\-\u4e00-\u9fa5\_]+)/g, '$1<a target="_blank" href="javascript:getUserTimeline(\'$2\');" rhref="'+ this.config.user_home_url +'$2" title="左键查看微薄，右键打开主页">@$2</a>');
        
        return str;
    },
    processEmotional: function(str){
        str = str.replace(/\[([\u4e00-\u9fff,\uff1f,\w]{1,4})\]/g, this._replaceEmotional);
        return str;
    },
    _replaceUrl: function(m, g1, g2){
        var _url = g1;
        if(g1.indexOf('http') != 0){
            _url = 'http://' + g1;
        }
        // 增加图片预览功能
//        if(window.ImageService){ //page.js 里面没有加载这个
//            var service = ImageService.check(_url);
//            if(service) {
//                return '<a target="_blank" onclick="previewPic(this, \"{{service.name}}\");" href="javascript:void();" rhref="{{url}}" title="左键点击预览图片，右键直接打开网址">{{value}}</a>'.format({
//                    url: _url, 
//                    title: g1, 
//                    value: g2||g1,
//                    service: service
//                });
//            }
//        }
        return '<a target="_blank" class="link" href="{{url}}">{{value}}</a>'.format({
            url: _url, title: g1, value: g2||g1
        });
    },
    _replaceEmotional: function(m, g1){
        var tpl = '<img title="{{title}}" src="{{src}}" />';
        if(window.emotionalDict && g1) {
            if(emotionalDict[g1]){
                var src = emotionalDict[g1];
                if(src.indexOf('http') != 0){
                    src = '/images/faces/' + src + '.gif';
                }
                return tpl.format({title: m, src: src});
            }
            var other = TSINA_API_EMOTIONS[g1] || TSINA_FACES[g1];
            if(other) {
                return tpl.format({title: m, src: TSINA_FACE_URL_PRE + other});
            }
        }
        return m;
    },
    

	// 设置认证头
    // user: {username, password, authtype}
	apply_auth: function(url, args, user) {
		if(!user) {
			return;
		}
        user.authtype = user.authtype || 'baseauth'; //兼容旧版本
		if(user.authtype == 'baseauth') {
			args.headers['Authorization'] = make_base_auth_header(user.username, user.password);
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
    get_authorization_url: function(user, callbackFn) {
    	if(user.authtype == 'oauth') {
    		var login_url = null;
//    		var me = this;
    		this.get_request_token(user, function(token, text_status, error_code) {
    			if(token) {
    				user.oauth_token_key = token.oauth_token;
        			user.oauth_token_secret = token.oauth_token_secret;
        			// 返回登录url给用户登录
        			var params = {oauth_token: user.oauth_token_key};
        			if(this.config.oauth_callback) {
            			params.oauth_callback = this.config.oauth_callback;
            		}
        			login_url = this.format_authorization_url(params);
    			}
    			callbackFn(login_url, text_status, error_code);
    		}, this);
    	} else {
    		throw new Error(user.authtype + ' not support get_authorization_url');
    	}
    },
    
    get_request_token: function(user, callbackFn, context) {
    	if(user.authtype == 'oauth') {
    		var params = {
	            url: this.config.oauth_request_token,
	            type: 'get',
	            user: user,
	            play_load: 'string',
	            apiHost: this.config.oauth_host,
	            data: {},
	            need_source: false
	        };
    		if(this.config.oauth_callback) {
    			params.data.oauth_callback = this.config.oauth_callback;
    		}
    		if(this.config.oauth_request_params){
    			$.extend(params.data, this.config.oauth_request_params);
    		}
    		this._sendRequest(params, function(token_str, text_status, error_code) {
    			var token = null;
    			if(text_status != 'error') {
    				token = decodeForm(token_str);
    				if(!token.oauth_token) {
    					token = null;
    					error_code = token_str;
    					text_status = 'error';
    				}
    			}
    			callbackFn.call(context, token, text_status, error_code);
    		});
    	} else {
    		throw new Error(user.authtype + ' not support get_request_token');
    	}
    },
    
    // 必须设置user.oauth_pin
    get_access_token: function(user, callbackFn) {
    	if(user.authtype == 'oauth' || user.authtype == 'xauth') {
    		var params = {
	            url: this.config.oauth_access_token,
	            type: 'get',
	            user: user,
	            play_load: 'string',
	            apiHost: this.config.oauth_host,
	            data: {},
	            need_source: false
	        };
	        if(user.oauth_pin) {
	        	params.data.oauth_verifier = user.oauth_pin;
	        }
	        if(user.authtype == 'xauth') {
	        	params.data.x_auth_username = user.username;
				params.data.x_auth_password = user.password;
				params.data.x_auth_mode = "client_auth";
	        }
    		this._sendRequest(params, function(token_str, text_status, error_code) {
    			var token = null;
    			if(text_status != 'error') {
    				token = decodeForm(token_str);
    				if(!token.oauth_token) {
    					token = null;
    					error_code = token_str;
    					text_status = 'error';
    				} else {
    					user.oauth_token_key = token.oauth_token;
            			user.oauth_token_secret = token.oauth_token_secret;
    				}
    			}
    			callbackFn(token ? user : null, text_status, error_code);
    		});
    	} else {
    		throw new Error(user.authtype + ' not support get_access_token');
    	}
    },
    
    /*
        callbackFn(data, textStatus, errorCode): 
            成功和错误都会调用的方法。
            如果失败则errorCode为服务器返回的错误代码(例如: 400)。
    */
    verify_credentials: function(user, callbackFn, data){
        if(!user || !callbackFn) return;
        var params = {
            url: this.config.verify_credentials,
            type: 'get',
            user: user,
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},
        
    rate_limit_status: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.rate_limit_status,
            type: 'get',
            play_load: 'rate',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},
	
	// since_id, max_id, count, page 
	friends_timeline: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.friends_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},
	
	// id, user_id, screen_name, since_id, max_id, count, page 
    user_timeline: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.user_timeline,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},
	
	// id, count, page
    comments_timeline: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.comments_timeline,
            type: 'get',
            play_load: 'comment',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

	// since_id, max_id, count, page 
    mentions: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.mentions,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

	// id, user_id, screen_name, cursor, count
    followers: function(data, callback){
        var params = {
            url: this.config.followers,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callback);
	},
	
	public_timeline: function(data, callback) {
		var params = {
            url: this.config.followers,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callback);
	},

	// id, user_id, screen_name, cursor, count
    friends: function(data, callback){
        var params = {
            url: this.config.friends,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callback);
	},

	// page
    favorites: function(data, callback){
        var params = {
            url: this.config.favorites,
            type: 'get',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callback);
	},

	// id
    favorites_create: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.favorites_create,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

	// id
    favorites_destroy: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.favorites_destroy,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

	// ids
    counts: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.counts,
            type: 'get',
            play_load: 'count',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    // id
    user_show: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.user_show,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    // since_id, max_id, count, page 
    direct_messages: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.direct_messages,
            type: 'get',
            play_load: 'message',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

	// id
    destroy_msg: function(data, callbackFn){
		if(!callbackFn) return;
        var params = {
            url: this.config.destroy_msg,
            type: 'post',
            play_load: 'message',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},

    /*data的参数列表：
    content 待发送消息的正文，请确定必要时需要进行URL编码 ( encode ) ，另外，不超过140英文或140汉字。
    message 必须 0 表示悄悄话 1 表示戳一下
    receiveUserId 必须，接收方的用户id
    source 可选，显示在网站上的来自哪里对应的标识符。如果想显示指定的字符，请与官方人员联系。
    */
    new_message: function(data, callbackFn){//悄悄话
		if(!callbackFn) return;
        var params = {
            url: this.config.new_message,
            type: 'post',
            play_load: 'message',
            data: data
        };
        this._sendRequest(params, callbackFn);
	},
	
	// id
	status_show: function(data, callback) {
		var params = {
			url: this.config.status_show,
			play_load: 'status',
			data: data
		};
		this._sendRequest(params, callback);
	},
    
    update: function(data, callbackFn){
        if(!callbackFn) return;
        if(this.config.support_geo && Settings.get().isGeoEnabled && Settings.get().geoPosition){
        	if(Settings.get().geoPosition.latitude) {
    			data.lat = Settings.get().geoPosition.latitude;
                data.long = Settings.get().geoPosition.longitude;
    		}
        }
        var params = {
            url: this.config.update,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },
    
    // 格式上传参数，方便子类覆盖做特殊处理
    // 子类可以增加自己的参数
    format_upload_params: function(user, data, pic) {
    	
    },
    
    /* 上传图片
     * user: 当前用户
     * data: {source: xxx, status: xxx, ...}
     * pic: {keyname: 'pic', file: fileobj}
     * before_request: before_request function
     * onprogress: on_progress_callback function
     * callback: finish callback function
     * */
    upload: function(user, data, pic, before_request, onprogress, callback, context) {
    	var auth_args = {type: 'post', data: {}, headers: {}};
    	pic.keyname = pic.keyname || 'pic';
    	data.source = data.source || this.config.source;
    	if(this.config.support_geo && Settings.get().isGeoEnabled && Settings.get().geoPosition){
    		if(Settings.get().geoPosition.latitude) {
    			data.lat = Settings.get().geoPosition.latitude;
                data.long = Settings.get().geoPosition.longitude;
    		}
        }
    	this.format_upload_params(user, data, pic);
	    var boundary = '----multipartformboundary' + (new Date).getTime();
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
	    builder += 'Content-Disposition: form-data; name="' + pic.keyname + '"';
	    if(pic.file.fileName) {
	      builder += '; filename="' + this.url_encode(pic.file.fileName) + '"';
	    }
	    builder += crlf;
	
	    builder += 'Content-Type: '+ pic.file.type;
	    builder += crlf;
	    builder += crlf; 

	    var bb = new BlobBuilder(); //NOTE
	    bb.append(builder);
	    bb.append(pic.file);
	    builder = crlf;
	    
	    /* Mark end of the request.*/ 
	    builder += dashdash;
	    builder += boundary;
	    builder += dashdash;
	    builder += crlf;
	
	    bb.append(builder);
	    
	    if(before_request) {
	    	before_request();
	    }
		
	    $.ajax({
	        url: url,
	        cache: false,
	        timeout: 5*60*1000, //5分钟超时
	        type : 'post',
	        data: bb.getBlob(),
	        dataType: 'text',
	        contentType: 'multipart/form-data; boundary=' + boundary,
	        processData: false,
	        beforeSend: function(req) {
		    	for(var k in auth_args.headers) {
		    		req.setRequestHeader(k, auth_args.headers[k]);
	    		}
	            if(onprogress) {
	            	if(req.upload){
		                req.upload.onprogress = function(ev){
		                    onprogress(ev);
		                };
		            }
	            }
	        },
	        success: function(data, textStatus) {
	            try{
	                data = JSON.parse(data);
	            }
	            catch(err){
	                //data = null;
	                data = {error:'服务器返回结果错误，本地解析错误。', error_code:500};
	                textStatus = 'error';
	            }
	            var error_code = null;
	            if(data){
                    var error = data.errors || data.error;
	                if(error || data.error_code){
	                	data.error = error;
	                    _showMsg('error: ' + data.error + ', error_code: ' + data.error_code);
	                    error_code = data.error_code || error_code;
	                }
	            }else{error_code = 400;}
	            callback.call(context, data, textStatus, error_code);
	        },
	        error: function (xhr, textStatus, errorThrown) {
	            var r = null, status = 'unknow';
	            if(xhr){
	                if(xhr.status){
	                    status = xhr.status;
	                }
	                if(xhr.responseText){
	                    var r = xhr.responseText;
	                    try{
	                        r = JSON.parse(r);
	                    }
	                    catch(err){
	                        r = null;
	                    }
	                    if(r){_showMsg('error_code:' + r.error_code + ', error:' + r.error);}
	                }
	            }
	            if(!r){
	                textStatus = textStatus ? ('textStatus: ' + textStatus + '; ') : '';
	                errorThrown = errorThrown ? ('errorThrown: ' + errorThrown + '; ') : '';
	                _showMsg('error: ' + textStatus + errorThrown + 'statuCode: ' + status);
	            }
	            callback.call(context, {}, 'error', status); //不管什么状态，都返回 error
	        }
	    });
    },

    repost: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.repost,
            type: 'post',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    comment: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.comment,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    reply: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.reply,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    comments: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.comments,
            type: 'get',
            play_load: 'comment',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    // id
    comment_destroy: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.comment_destroy,
            type: 'post',
            play_load: 'comment',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    friendships_create: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.friendships_create,
            type: 'post',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    // id
    friendships_destroy: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.friendships_destroy,
            type: 'post',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    friendships_show: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.friendships_show,
            type: 'get',
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },

    // type
    reset_count: function(data, callbackFn){
        if(!callbackFn) return;
        var params = {
            url: this.config.reset_count,
            type: 'post',
            play_load: 'result',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },
    
    // user_id, count, page
    tags: function(data, callback) {
    	var params = {
            url: this.config.tags,
            play_load: 'tag',
            data: data
        };
        this._sendRequest(params, callback);
    },
    
    // count, page
    tags_suggestions: function(data, callback) {
    	var params = {
            url: this.config.tags_suggestions,
            play_load: 'tag',
            data: data
        };
        this._sendRequest(params, callback);
    },
    
    // tags
    create_tag: function(data, callback) {
    	var params = {
            url: this.config.create_tag,
            type: 'post',
            play_load: 'tag',
            data: data
        };
        this._sendRequest(params, callback);
    },
    
    // tag_id
    destroy_tag: function(data, callback) {
    	var params = {
            url: this.config.destroy_tag,
            type: 'post',
            play_load: 'tag',
            data: data
        };
        this._sendRequest(params, callback);
    },

    // id
    destroy: function(data, callbackFn){
        if(!data || !data.id || !callbackFn){return;}
        var params = {
            url: this.config.destroy,
            type: 'POST',
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callbackFn);
    },
    
    // q, max_id, count
    search: function(data, callback) {
    	var params = {
            url: this.config.search,
            play_load: 'status',
            data: data
        };
        this._sendRequest(params, callback);
    },
    
    // q, page, count
    user_search: function(data, callback) {
    	var params = {
            url: this.config.user_search,
            play_load: 'user',
            data: data
        };
        this._sendRequest(params, callback);
    },
    
    // 格式化数据格式，其他微博实现兼容新浪微博的数据格式
    // play_load: status, user, comment, message, count, result(reset_count)
    // args: request arguments
    format_result: function(data, play_load, args) {
    	var items = data;
    	if(!$.isArray(items)) {
    		items = data.results || data.users;
    	}
		if($.isArray(items)) {
	    	for(var i in items) {
	    		items[i] = this.format_result_item(items[i], play_load, args);
	    	}
	    } else {
	    	data = this.format_result_item(data, play_load, args);
	    }
	    if(args.url == this.config.search && data.next_page) {
	    	// "next_page":"?page=2&max_id=1291867917&q=fawave", 提取max_id
	    	var p = decodeForm(data.next_page);
	    	data.max_id = p.max_id;
	    }
		return data;
	},
	
	format_result_item: function(data, play_load, args) {
		if(play_load == 'user' && data && data.id) {
			data.t_url = 'http://t.sina.com.cn/' + (data.domain || data.id);
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
			var tpl = this.config.host + '/{{user.id}}/statuses/{{id}}';
			if(data.retweeted_status) {
				data.retweeted_status = this.format_result_item(data.retweeted_status, 'status', args);
			}
			// 设置status的t_url
			data.t_url = tpl.format(data);
		} else if(play_load == 'message') {
			this.format_result_item(data.sender, 'user', args);
			this.format_result_item(data.recipient, 'user', args);
		} else if(play_load == 'comment') {
			this.format_result_item(data.user, 'user', args);
			this.format_result_item(data.status, 'status', args);
		} 
		return data;
	},
	
	// urlencode，子类覆盖是否需要urlencode处理
	url_encode: function(text) {
		return OAuth.percentEncode(text);
	},
    
	before_sendRequest: function(args, user) {
		
	},
	
	format_error: function(error, error_code) {
		if(this.config.ErrorCodes){
			error = this.config.ErrorCodes[error] || error;
		}
		return error;
	}
};


//以下为一些有用的函数或者扩展

// 生成HTTP Basic Authentication的字符串："Base base64String"
function make_base_auth_header(user, password) {
  var tok = user + ':' + password;
  var hash = Base64.encode(tok);
  return "Basic " + hash;
};

// 生成HTTP Basic Authentication的url："http://username:password@domain.com"
function make_base_auth_url(domain, user, password) {
  return "http://" + user + ":" + password + "@" + domain;
};

//TSinaAPI.translate('hello world', null, function(data, response) {
//	console.log(data.toString());
//});
setTimeout(function() {}, 601000);
TSinaAPI.request('http://nodejs.org/docs/v0.4.0/api/timers.html', {}, function(data) {
	console.log(data);
});
//TSinaAPI.translate('hello world', function(data, response) {
//	console.log(data);
//});