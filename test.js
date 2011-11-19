var sinaApp = {
	key : '1306060637',
	secret : '0850d7407392fb537bff0762406c567d',
	blogType: 'tsina',
	oauth_user : { 
		blogtype: 'tsina',
	  	oauth_token_key: '2cfefac248e80189d73fb0cfea81fb51',
	  	oauth_verifier: '333178',
	  	oauth_token_secret: 'e77da0ea0bf4a985444387954939b43a',
	  	blogType: 'tsina',
	  	authtype: 'oauth' 
  }
}

var qqApp = {
	key : '801004324',
	secret : 'f4dccb3a9f1689adcc66dc933b38445e',
	blogType: 'tqq',
	oauth_user : { 
	  oauth_token_key: '78dd54c7380b4cb9b99f061394dfcbf7',
	  oauth_verifier: '987832',
	  oauth_token_secret: '664c81d6061beed7d450a7b845312d3e',
	  blogType: 'tqq',
	  authtype: 'oauth' 
  }
}

var sohuApp = {
	key : 'geDQ7cFZ7iruNPHm3lZk',
	secret : 'iQ%mtL!eh%xVl!SjQN^($Efdw41!#Ytt*r8SMtw8',
	blogType: 'tsohu',
	oauth_user : { 
	  	oauth_token_key: 'a9e1909afeb947edb3f148532b7583aa',
	  	oauth_verifier: '80762835',
	  	oauth_token_secret: 'a865070cb253df351df6d74bfb81b11b',
	  	blogType: 'tsohu',
	  	authtype: 'oauth' 
	}
}

var apps = [sinaApp,  qqApp , sohuApp];
//var apps = [sohuApp];

var tapi = require('../node-weibo').tapi,
	querystring = require('querystring');

for(var i = 0 ; i < apps.length; i++) {
	tapi.init(apps[i].blogType, apps[i].key, apps[i].secret);	
}

for(var i = 0 ; i < apps.length; i++) { 
	/*
	tapi.upload({user:apps[i].oauth_user ,status : '哈哈'}, './test/snake.jpg' ,function(err,data){
	   if(err)
	  		console.log('err:'+ JSON.stringify(err));
	   else {
	    	console.log('upload:'+ data.t_url);
	   }	
	});
	*/
	
	/*
	tapi.public_timeline({user:apps[i].oauth_user}, function(error, data) {
		if(error)
	  		console.log('err:'+ JSON.stringify(error));
	   else {
	    	console.log('data:'+ JSON.stringify(data));
	   }	
	});
	*/
	

	tapi.verify_credentials(apps[i].oauth_user, function(error, t_user) {
		if(error)
	  		console.log('err:'+ JSON.stringify(error));
	   else {
	    	console.log('user:'+ JSON.stringify(t_user));
	   }	
	});
	
	
	/*
	tapi.update({ user:apps[i].oauth_user, status : '今天天气不错 哈哈'},function(err,data){
		if(err)
		  	console.log('err:'+JSON.stringify(err));
		else {
		    console.log('update:'+JSON.stringify(data));
		}	
	});
	*/
};


