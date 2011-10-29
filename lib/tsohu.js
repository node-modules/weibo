(function(exports){
    
var TSinaAPI = null , 
	querystring = require('querystring');
	
if(typeof require !== 'undefined') {
	TSinaAPI = require('./tsina').TSinaAPI;
} else {
	TSinaAPI = weibo.tsina.TSinaAPI;
}

var TSOHUAPI = exports.TSOHUAPI = Object.inherits({}, TSinaAPI, {
	config: Object.extend({}, TSinaAPI.config, {
		host: 'http://api.t.sohu.com',
		user_home_url: 'http://t.sohu.com/',
        search_url: 'http://t.sohu.com/k/',
        result_format: '.json',
		source: '', 
	    oauth_key: '',
	    oauth_secret: '',
	    oauth_host: 'http://api.t.sohu.com',
		oauth_authorize: 	  '/oauth/authorize',
        oauth_request_token:  '/oauth/request_token',
        oauth_access_token:   '/oauth/access_token',
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
        update:               '/statuses/update',
        upload:               '/statuses/upload',
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
        verify_credentials:   '/account/verify_credentials',
        
        gender_map: {0:'n', 1:'m', 2:'f'},

        ErrorCodes: {
            1: '参数错误',
            2: '频率受限',
            3: '鉴权失败',
            4: '服务器内部错误'
        }
	}),
	
	rate_limit_status: function(data, callback){
        callback({error: _u.i18n("comm_no_api")});
    },
    reset_count: function(data, callback) {
		callback();
	},
	
	format_upload_params: function(user, data, pic , boundary) {
    	
    },
    
    url_encode: function(text) {
		return this.super_.url_encode(text);
	},
    
    upload : function(data, pic, callback, context){
    	this.super_.upload.call(this, data, pic, callback, context);
    },
    
    // 同时获取用户信息 user_show
    user_timeline: function(data, callback, context) {
    	var both = this.combo(function(user_info_args, timeline_args) {
    	    var user_info = user_info_args[1]
    	      , timeline = timeline_args[1];
    	    if(user_info && timeline) {
    	        timeline.user = user_info;
    	    }
    	    callback.apply(context, timeline_args);
    	});
    	var user = data.user;
        var params = {name: data.id || data.screen_name, user: user};
    	this.user_show(params, both.add());
    	this.super_.user_timeline.call(this, data, both.add());
    },
    before_send_request: function(args, user) {
		if(args.play_load == 'string') {
			// oauth
			return;
		}
		args.data.format = 'json';
		args.content_type = 'text/json';
	},
	
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

	format_result_item: function(data, play_load, args, users) {
		if(play_load == 'user' && data && data.id) {
			data.t_url = 'http://t.sohu.com/people?uid=' + (data.domain || data.id);
			data.name = data.name ? data.name : data.screen_name;
		} else if(play_load == 'status') {
			if(!data.user) { // search data
				data.user = {
					name : data.from_user,
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
			data.t_url = 'http://t.sohu.com/m/'+data.id; 
		} else if(play_load == 'message') {
			this.format_result_item(data.sender, 'user', args);
			this.format_result_item(data.recipient, 'user', args);
		} else if(play_load == 'comment') {
			this.format_result_item(data.user, 'user', args);
			this.format_result_item(data.status, 'status', args);
		} 
		return data;
	}
});

})( (function(){
	if(typeof exports === 'undefined') {
		window.weibo.tsohu = {};
		return window.weibo.tsohu;
	} else {
		return exports;
	}
})() );