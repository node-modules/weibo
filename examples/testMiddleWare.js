var weibo = require('../node-weibo'),
    home_url = 'http://localhost:8024/oauth',
    tapi = weibo.tapi,
    express = require('express'),
    app = express.createServer(),
    port = 8024;
 
var sinaApp = {
	key : '1306060637',
	secret : '0850d7407392fb537bff0762406c567d',
	blogType: 'tsina'
}

var qqApp = {
	key : '801004324',
	secret : 'f4dccb3a9f1689adcc66dc933b38445e',
	blogType: 'tqq'
}

var sohuApp = {
	key : 'geDQ7cFZ7iruNPHm3lZk',
	secret : 'iQ%mtL!eh%xVl!SjQN^($Efdw41!#Ytt*r8SMtw8',
	blogType: 'tsohu'
}

var apps = [sinaApp , qqApp , sohuApp];

for(var i = 0 ; i < apps.length; i++) {
	tapi.init(apps[i].blogType, apps[i].key, apps[i].secret);	
}

app.listen(port);
console.log('paint app started on port '+port);

app.use(weibo.oauth_middleware(function(oauth_user, referer, req, res, callback) {
    // do something ...
    // save oauth_user
	console.log(oauth_user);
    callback();
}));

