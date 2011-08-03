/**
 * Module dependencies.
 */

(function(exports){

var TSinaAPI;
if(typeof require !== 'undefined') {
	TSinaAPI = require('./tsina').TSinaAPI;
} else {
	TSinaAPI = weibo.tsina.TSinaAPI;
}

/**
 * Twitter API
 */
var TwitterAPI = exports.TwitterAPI = Object.inherits({}, TSinaAPI, {
	config: Object.extend({}, TSinaAPI.config, {
		host: 'https://api.twitter.com',
        user_home_url: 'https://twitter.com/',
        search_url: 'https://twitter.com/search?q=',
        source: '',
        oauth_key: '',
        oauth_secret: '',
        repost_pre: 'RT',
	    support_comment: false,
	    support_do_comment: false,
	    support_repost: false,
	    support_upload: false,
	    need_source: false,
	    oauth_callback: 'oob',
	    search: '/search_statuses',
	    repost: '/statuses/update',
        retweet: '/statuses/retweet/{{id}}',
        favorites_create: '/favorites/create/{{id}}',
        friends_timeline: '/statuses/home_timeline',
        search: '/search'
	}),
	
	before_send_request: function(args) {
		if(args.url == this.config.repost) {
			if(args.data.id) {
				args.data.in_reply_to_status_id = args.data.id;
				delete args.data.id;
			}
		} else if(args.url == this.config.new_message) {
			// id => user
			args.data.user = args.data.id;
			delete args.data.id;
		} else if(args.url == this.config.search) {
			args.data.rpp = args.data.count;
			args.data.show_user = 'true';
			delete args.data.count;
			delete args.data.source;
		}
    },
    
    /**
	 * Format result data
	 * 
	 * @return {Object} depend on play_load
	 * @api public
	 */
    format_result_item: function(data, play_load, args) {
		if(play_load == 'status' && data.id) {
            data.id = data.id_str || data.id;
            data.in_reply_to_status_id = data.in_reply_to_status_id_str || data.in_reply_to_status_id;
            var tpl = this.config.user_home_url + '{{user.screen_name}}/status/{{id}}';
			this.format_result_item(data.user, 'user', args);
			if(data.retweeted_status) {
                data.retweeted_status.id = data.retweeted_status.id_str || data.retweeted_status.id;
				data.retweeted_status.t_url = tpl.format(data.retweeted_status);
				this.format_result_item(data.retweeted_status.user, 'user', args);
			}
			// search
			if(data.from_user && !data.user) {
				data.user = {
					id: data.from_user_id_str || data.from_user_id,
					profile_image_url: data.profile_image_url,
					screen_name: data.from_user
				};
				delete data.from_user_id_str;
				delete data.profile_image_url;
				delete data.from_user;
				//data.source = htmldecode(data.source);
			}
			data.t_url = tpl.format(data);
		} else if(play_load == 'user' && data && data.id) {
			data.t_url = this.config.user_home_url + (data.screen_name || data.id);
		}
		return data;
	},
	
	// 无需urlencode
	url_encode: function(text) {
		return text;
	}
});


})( (function(){
	if(typeof exports === 'undefined') {
		window.weibo.twitter = {};
		return window.weibo.twitter;
	} else {
		return exports;
	}
})() );