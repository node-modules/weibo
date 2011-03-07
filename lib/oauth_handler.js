// oauth login handler

var TSinaAPI = require('./tsina.js').TSinaAPI;

exports.login = function(res) {
	var user = {};
	TSinaAPI.get_authorization_url(user, function(login_url) {
		console.log(login_url, user);
		res.writeHead(302, {
			'Location': login_url,
			'Content-Length': 0
		});
		res.end();
	});
};