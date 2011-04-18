(function(exports){
	
if(typeof require !== 'undefined') {
	var TSinaAPI = require('./tsina').TSinaAPI;
} else {
	var TSinaAPI = tsina.TSinaAPI;
}

var TwitterAPI = exports.TwitterAPI = Object.extend({}, TSinaAPI);

Object.extend(TwitterAPI, {
	// 覆盖不同的参数
	config: Object.extend({}, TwitterAPI.config, {
		host: 'http://api.twitter.com',
        user_home_url: 'http://twitter.com/',
        search_url: 'http://twitter.com/search?q=',
        oauth_key: 'i1aAkHo2GkZRWbUOQe8zA',
        oauth_secret: 'MCskw4dW5dhWAYKGl3laRVTLzT8jTonOIOpmzEY',
        repost_pre: 'RT',
	    support_comment: false,
	    support_do_comment: false,
	    support_repost: false,
	    support_upload: false,
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
			delete args.data.count;
		}
    },

    format_result_item: function(data, play_load, args) {
		if(play_load == 'status' && data.id) {
            data.id = data.id_str || data.id;
            data.in_reply_to_status_id = data.in_reply_to_status_id_str || data.in_reply_to_status_id;
			var tpl = this.config.user_home_url + '{{user.screen_name}}/status/{{id}}';
			data.t_url = tpl.format(data);
			this.format_result_item(data.user, 'user', args);
			if(data.retweeted_status) {
                data.retweeted_status.id = data.retweeted_status.id_str || data.retweeted_status.id;
				data.retweeted_status.t_url = tpl.format(data.retweeted_status);
				this.format_result_item(data.retweeted_status.user, 'user', args);
			}
		} else if(play_load == 'user' && data && data.id) {
			data.t_url = this.config.user_home_url + (data.screen_name || data.id);
		}
		return data;
	}
});


})( (function(){
	if(typeof exports === 'undefined') {
		window.twitter = {};
		return window.twitter;
	} else {
		return exports;
	}
})() );