var tapi = require('../node-weibo').tapi;
var appkey = '4010445928', secret = 'd119f62bfb70a4ba8d9b68bf14d6e45a';
tapi.init('tsina', appkey, secret);
var oauth_user = { 
    id: 2034126360,
    screen_name: 'tjobtest',
    name: 'tjobtest',
    province: '33',
    city: '1',
    location: '浙江 杭州',
    description: '',
    url: '',
    profile_image_url: 'http://tp1.sinaimg.cn/2034126360/50/0/1',
    domain: '',
    gender: 'm',
    followers_count: 1,
    friends_count: 1,
    statuses_count: 34,
    favourites_count: 0,
    created_at: 'Wed Mar 23 00:00:00 +0800 2011',
    following: false,
    allow_all_act_msg: false,
    geo_enabled: true,
    verified: false,
    t_url: 'http://weibo.com/2034126360',
    blogtype: 'tsina',
    oauth_token_key: '25c0dbf4fc42f5e1a309e3f796c558f5',
    oauth_verifier: '428085',
    oauth_token_secret: '19b7a8ba9437858fd04d08d7226fb265',
    authtype: 'oauth',
    user_id: 'tsina:2034126360' 
};

tapi.public_timeline({user: oauth_user}, function(error, data, response) {
    if(error) {
        console.error(error);
    } else {
        console.log(data);
    }
});

var params = {
    user: oauth_user, 
    status: '更新微博来自node-weibo模块test.js' + new Date()
};
tapi.update(params, function(error, data, response) {
    if(error) {
        console.error(error);
    } else {
        console.log(data);
    }
});