(function(exports){
	
if(typeof require !== 'undefined') {
	var TSinaAPI = require('./tsina').TSinaAPI;
} else {
	var TSinaAPI = weibo.tsina.TSinaAPI;
}

var TQQAPI = exports.TQQAPI = Object.extend({}, TSinaAPI);

Object.extend(TQQAPI, {
	config: Object.extend({}, TQQAPI.config, {
		host: 'http://open.t.qq.com/api',
		user_home_url: 'http://t.qq.com/',
        search_url: 'http://t.qq.com/k/',
        result_format: '',
		source: '', 
	    oauth_key: '',
	    oauth_secret: '',
	    oauth_host: 'https://open.t.qq.com',
		oauth_authorize: 	  '/cgi-bin/authorize',
        oauth_request_token:  '/cgi-bin/request_token',
        oauth_access_token:   '/cgi-bin/access_token',
        // 竟然是通过get传递
        oauth_params_by_get: true,
        support_comment: false, // 不支持comment_timeline
        support_do_comment: true,
        support_repost_timeline: true, // 支持查看转发列表
        support_favorites_max_id: true,
        reply_dont_need_at_screen_name: true, // @回复某条微博 无需填充@screen_name 
        rt_at_name: true, // RT的@name而不是@screen_name
        repost_delimiter: ' || ', //转发时的分隔符
        support_counts: false, // 只有rt_count这个，不过貌似有问题，总是404。暂时隐藏
        
        latitude_field: 'wei', // 纬度参数名
        longitude_field: 'jing', // 经度参数名
        friends_timeline: '/statuses/home_timeline',
        repost_timeline: 	  '/t/re_list_repost',
        
        mentions:             '/statuses/mentions_timeline',
        followers:            '/friends/user_fanslist',
        friends:              '/friends/user_idollist',
        favorites:            '/fav/list_t',
        favorites_create:     '/fav/addt',
        favorites_destroy:    '/fav/delt',
        counts:               '/t/re_count', //仅仅是转播数
        status_show:          '/t/show',
        update:               '/t/add',
        upload:               '/t/add_pic',
        repost:               '/t/re_add',
        comment:              '/t/comment',
        comments:             '/t/re_list',
        destroy:              '/t/del',
        destroy_msg:          '/private/del',
        direct_messages:      '/private/recv',
        sent_direct_messages: '/private/send',
        new_message:          '/private/add',
        rate_limit_status:    '/account/rate_limit_status',
        friendships_create:   '/friends/add',
        friendships_destroy:  '/friends/del',
        friendships_show:     '/friends/check',
        reset_count:          '/statuses/reset_count',
        user_show:            '/user/other_info',
        
        // 用户标签
        tags: 				  '/tags',
        create_tag: 	      '/tags/create',
        destroy_tag:          '/tags/destroy',
        tags_suggestions:	  '/tags/suggestions',
        
        // 搜索
        search:               '/search/t',
        user_search:	      '/search/user',
        verify_credentials: '/user/info',
        
        gender_map: {0:'n', 1:'m', 2:'f'},

        ErrorCodes: {
            1: '参数错误',
            2: '频率受限',
            3: '鉴权失败',
            4: '服务器内部错误'
        }
	}),
	
	// urlencode，子类覆盖是否需要urlencode处理
	url_encode: function(text) {
		return text;
	},
	
	rate_limit_status: function(data, callback){
        callback({error: _u.i18n("comm_no_api")});
    },

    //TODO: 腾讯是有提供重置未读数的接口的，后面加
    reset_count: function(data, callback) {
		callback();
	},
	
	format_upload_params: function(user, data, pic) {
    	if(data.status){
            data.content = data.status;
            delete data.status;
        }
    },
    
    // 先获取用户信息 user_show
    user_timeline: function(data, callback, context) {
    	var that = this;
    	var params = {name: data.id || data.screen_name};
    	this.user_show(params, function(error, user_info) {
    		that._user_timeline(data, function(error, results) {
    			results.user = user_info;
    			callback.call(context, error, results);
    		});
    	});
    },
	
    before_send_request: function(args, user) {
		if(args.play_load == 'string') {
			// oauth
			return;
		}
		args.data.format = 'json';
		if(args.data.count) {
			args.data.reqnum = args.data.count;
			delete args.data.count;
		}
        if(args.data.since_id) {
			args.data.pagetime = args.data.since_id;
            args.data.pageflag = args.data.pageflag === undefined ? 2 : args.data.pageflag;
			delete args.data.since_id;
		}
        if(args.data.max_id) {
			args.data.pagetime = args.data.max_id;
            args.data.pageflag = 1;
			delete args.data.max_id;
		}
        if(args.data.status || args.data.text || args.data.comment){
            args.data.content = args.data.status || args.data.text || args.data.comment;
            delete args.data.status;
            delete args.data.text;
            delete args.data.comment;
        }
        
        switch(args.url){
            case this.config.new_message:
            case this.config.user_timeline:
            	if(args.data.id) {
            		args.data.name = args.data.id;
			    	delete args.data.id;
            	} else if(args.data.screen_name) {
            		args.data.name = args.data.screen_name;
			    	delete args.data.screen_name;
            	}
                break;
            case this.config.comments:
            	// flag:标识0 转播列表，1点评列表 2 点评与转播列表
            	args.data.flag = 1;
                args.data.rootid = args.data.id;
			    delete args.data.id;
                break;
            case this.config.repost_timeline:
            	args.url = args.url.replace('_repost', '');
            	args.data.flag = 0;
                args.data.rootid = args.data.id;
			    delete args.data.id;
                break;
            case this.config.reply:
            	// 使用 回复@xxx:abc 点评实现 reply
            	args.url = this.config.comment;
            	args.data.content = '回复@' + args.data.reply_user_id + ':' + args.data.content;
                args.data.reid = args.data.id;
			    delete args.data.id;
			    delete args.data.reply_user_id;
			    delete args.data.cid;
                break;
            case this.config.comment:
                args.data.reid = args.data.id;
			    delete args.data.id;
                break;
            case this.config.counts:
//            	console.log(args.data);
//                args.data.flag = 2;
                break;
            case this.config.repost:
                args.data.reid = args.data.id;
			    delete args.data.id;
                break;
            case this.config.friendships_destroy:
            case this.config.friendships_create:
            	args.data.name = args.data.id;
            	delete args.data.id;
            	break;
           	case this.config.followers:
           	case this.config.friends:
           		args.data.startindex = args.data.cursor;
           		args.data.name = args.data.user_id;
           		if(String(args.data.startindex) == '-1') {
           			args.data.startindex = '0';
           		}
           		if(args.data.reqnum > 30) {
           			// 最大只能获取30，否则就会抛错 {"data":null,"msg":"server error","ret":4}
           			args.data.reqnum = 30;
           		}
           		delete args.data.cursor;
           		delete args.data.user_id;
           		break;
           	case this.config.search:
           	case this.config.user_search:
	            args.data.keyword = args.data.q;
	            args.data.pagesize = args.data.reqnum;
	            delete args.data.reqnum;
	            delete args.data.q;
		        break;
            case this.config.update:
            	// 判断是否@回复
	            if(args.data.sina_id) {
		        	args.data.reid = args.data.sina_id;
		        	delete args.data.sina_id;
		        	args.url = '/t/reply';
		        }
		        break;
        }
	},
	
	format_result: function(data, play_load, args) {
		if(play_load == 'string') {
			return data;
		}
		if(args.url == this.config.friendships_create || args.url == this.config.friendships_destroy) {
			return true;
		}
		data = data.data;
        if(!data){ return data; }
		var items = data.info || data;
		delete data.info;
		var users = data.user || {};
		if(data.results || data.users) {
			items = data.results || data.users;
		}
		if(items instanceof Array) {
	    	for(var i=0; i<items.length; i++) {
	    		items[i] = this.format_result_item(items[i], play_load, args, users);
	    	}
	    	data.items = items;
            if(data.user && !data.user.id){
                delete data.user;
            }
	    	if(args.url == this.config.followers || args.url == this.config.friends) {
	    		if(data.items.length >= parseInt(args.data.reqnum)) {
	    			var start_index = parseInt(args.data.startindex || '0');
		    		if(start_index == -1) {
		    			start_index = 0;
		    		}
		    		data.next_cursor = start_index + data.items.length;
	    		} else {
	    			data.next_cursor = '0'; // 无分页了
	    		}
	    	}
	    } else {
	    	data = this.format_result_item(data, play_load, args, users);
	    }
		return data;
	},

	format_result_item: function(data, play_load, args, users) {
		if(play_load == 'user' && data && data.name) {
			var user = {};
			user.t_url = 'http://t.qq.com/' + data.name;
			user.screen_name = data.nick;
			user.id = data.name;
			user.name = data.name;
			user.province = data.province_code;
			user.city = data.city_code;
			user.verified = data.isvip;
			user.gender = this.config.gender_map[data.sex||0];
			user.profile_image_url = data.head + '/50'; // 竟然直接获取的地址无法拿到头像
			user.followers_count = data.fansnum;
			user.friends_count = data.idolnum;
			user.statuses_count = data.tweetnum;
			user.description = data.introduction;
			if(data.tag) {
				user.tags = data.tag;
			}
			data = user;
		} else if(play_load == 'status' || play_load == 'comment' || play_load == 'message') {
			// type:微博类型 1-原创发表、2-转载、3-私信 4-回复 5-空回 6-提及 7: 点评
			var status = {};
//			status.status_type = data.type;
			if(data.type == 7) {
				// 腾讯的点评会今日hometimeline，很不给力
				status.status_type = 'comments_timeline';
			}
			status.t_url = 'http://t.qq.com/p/t/' + data.id;
			status.id = data.id;
			status.text = data.origtext; //data.text;
            status.created_at = new Date(data.timestamp * 1000);
            status.timestamp = data.timestamp;
            if(data.image){
                status.thumbnail_pic = data.image[0] + '/160';
                status.bmiddle_pic = data.image[0] + '/460';
                status.original_pic = data.image[0] + '/2000';
            }
			if(data.source) {
				if(data.type == 4) { 
					// 回复
					status.text = '@' + data.source.name + ' ' + status.text;
					status.related_dialogue_url = 'http://t.qq.com/p/r/' + status.id;
					status.in_reply_to_status_id = data.source.id;
					status.in_reply_to_screen_name = data.source.nick;
				} else {
					status.retweeted_status = 
						this.format_result_item(data.source, 'status', args, users);
					// 评论
					if(play_load == 'comment') {
						status.status = status.retweeted_status;
						delete status.retweeted_status;
					}
				}
			}
			status.repost_count = data.count || 0;
			status.comments_count = data.mcount || 0; // 评论数
			status.source = data.from;
			status.user = this.format_result_item(data, 'user', args, users);
			// 收件人
//			tohead: ""
//			toisvip: 0
//			toname: "macgirl"
//			tonick: "美仪"
			if(data.toname) {
				status.recipient = {
					name: data.toname,
					nick: data.tonick,
					isvip: data.toisvip,
					head: data.tohead
				};
				status.recipient = this.format_result_item(status.recipient, 'user', args, users);
			}
			
			// 如果有text属性，则替换其中的@xxx 为 中文名(@xxx)
    		if(status && status.text) {
    			var matchs = status.text.match(this.ONLY_AT_USER_RE);
    			if(matchs) {
    				status.users = {};
    				for(var j=0; j<matchs.length; j++) {
    					var name = matchs[j].trim().substring(1);
    					status.users[name] = users[name];
    				}
    			}
    		}
    		data = status;
		} 
		return data;
	}
});

})( (function(){
	if(typeof exports === 'undefined') {
		window.weibo.tqq = {};
		return window.weibo.tqq;
	} else {
		return exports;
	}
})() );