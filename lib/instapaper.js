/**
 * http://www.instapaper.com/api/simple
 * 
 * @type Object
 */

(function(exports){
	
var urllib = require('./urllib');

Object.extend(exports, {
	
	request: function(user, url, data, callback, context){
		var args = {
			data: data,
			type: 'post',
			headers: {
				Authorization: urllib.make_base_auth_header(user.username, user.password),
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};
		urllib.request(url, args, function(text, error, response){
			var success = (text == '201' || text == '200');
			callback.call(context, error, success, response);
		}, this);
	},
	
//	ajax_request: function(user, url, data, callback, context){
//		var headers = {Authorization: urllib.make_base_auth_header(user.username, user.password)};
//		$.ajax({
//			url: url,
//			data: data,
//			timeout: 60000,
//			type: 'post',
//			beforeSend: function(req) {
//		    	for(var k in headers) {
//		    		req.setRequestHeader(k, headers[k]);
//	    		}
//	        },
//			success: function(data, text_status, xhr){
//	        	callback.call(context, text_status == 'success', text_status, xhr);
//			},
//			error: function(xhr, text_status, err){
//				callback.call(context, false, text_status, xhr);
//			}
//		});
//	},
//	
	authenticate: function(user, callback, context) {
		var api = 'https://www.instapaper.com/api/authenticate';
		this.request(user, api, {}, callback, context);
	},
	
	// url, title, selection
	add: function(user, data, callback, context){
		var api = 'https://www.instapaper.com/api/add';
		this.request(user, api, data, callback, context);
	}
});

})( (function(){
	if(typeof exports === 'undefined') {
		window.instapaper = {};
		return window.instapaper;
	} else {
		return exports;
	}
})() );