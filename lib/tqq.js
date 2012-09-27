/*!
 * node-weibo - lib/tqq.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var inherits = require('util').inherits;
var TBase = require('./tbase');
var utils = require('./utils');

function TQQAPI(options) {
  TQQAPI.super_.call(this);

  var config = utils.extend({}, options, {
    host: 'http://open.t.qq.com/api',
    result_format: '',
    oauth_host: 'https://open.t.qq.com',
    oauth_authorize:      '/cgi-bin/authorize',
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
    friends_timeline:     '/statuses/home_timeline',
    repost_timeline:      '/t/re_list_repost',
    followers:            '/friends/user_fanslist',
    friends:              '/friends/user_idollist',
    favorites:            '/fav/list_t',
    favorites_create:     '/fav/addt',
    favorites_destroy:    '/fav/delt',
    counts:               '/t/re_count', //仅仅是转播数
    show:                 '/t/show',
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
    tags:                 '/tags',
    create_tag:           '/tags/create',
    destroy_tag:          '/tags/destroy',
    tags_suggestions:     '/tags/suggestions',
    
    // 搜索
    search:               '/search/t',
    user_search:          '/search/user',
    verify_credentials:   '/user/info',
    
    gender_map: {0: 'n', 1: 'm', 2: 'f'}
  });

  this.init(config);
}

inherits(TQQAPI, TBase);
module.exports = TQQAPI;

TQQAPI.prototype.detect_error = function (method, res, playload, data) {
  var headers = res.headers;
  var err;
  if (res.statusCode === 200 && headers.status) {
    err = new Error(headers.status);
  } else if (data.errcode && data.msg) {
    err = new Error(data.msg);
  }
  if (err) {
    err.name = this.errorname(method);
    err.data = data;
    return err;
  }
  TQQAPI.super_.prototype.detect_error.call(this, method, res, playload, data);
};

TQQAPI.prototype.get_result_items = function (data, playload, args) {
  data = data.data;
  if (!data) {
    return data;
  }
  return data.info || data;
};

TQQAPI.prototype.get_result_item = function (data, playload, args) {
  return data.data || data;
};

TQQAPI.prototype.format_search_status = function (status, args) {
  throw new Error('Must override this method.');
};

/**
 *
{ city_code: '1',
  count: 0,
  country_code: '1',
  emotiontype: 0,
  emotionurl: '',
  from: '微博开放平台',
  fromurl: 'http://wiki.open.t.qq.com/index.php/%E4%BA%A7%E5%93%81%E7%B1%BBFAQ#.E6.8F.90.E4.BA.A4.E5.BA.94.E7.94.A8.E6.9D.A5.E6.BA.90.E5.AD.97.E6.AE.B5.E5.AE.A1.E6.A0.B8.E8.83.BD.E5.BE.97.E5.88.B0.E4.BB.80.E4.B9.88.E5.A5.BD.E5.A4.84.EF.BC.9F\n',
  geo: '广东省中山市康乐路１０号',
  head: 'http://app.qlogo.cn/mbloghead/cb1c4eb21aa2b52a233a',
  id: '102460077174373',
  image: null,
  isrealname: 2,
  isvip: 0,
  jing: '113.421234',
  latitude: '22.354231',
  location: '中国 浙江 杭州',
  longitude: '113.421234',
  mcount: 0,
  music: null,
  name: 'node-weibo',
  nick: 'node-weibo',
  openid: 'EA68676D5E9DA465822CD0CEB2DC6EF5',
  origtext: '这是update(user, status, callback) 的单元测试，当前时间 Thu Sep 27 2012 17:04:25 GMT+0800 (CST)',
  province_code: '33',
  self: 1,
  source: null,
  status: 0,
  text: '这是update(user, status, callback) 的单元测试，当前时间 Thu Sep 27 2012 17:04:25 GMT+0800 (CST)',
  timestamp: 1348736665,
  type: 1,
  user: { 'node-weibo': 'node-weibo' },
  video: null,
  wei: '22.354231' }

 * @param {[type]} status [description]
 * @param {[type]} args [description]
 * @return {[type]} [description]
 */
TQQAPI.prototype.format_status = function (data, args) {
  var status = {};
  status.id = String(data.id);
  status.t_url = 'http://t.qq.com/p/t/' + data.id;
  status.created_at = new Date(data.timestamp * 1000);
  status.text = data.origtext;
  status.source = '<a href="' + data.fromurl + '">' + data.from + '</a>';
  // status.favorited = 
  if (data.image && data.image[0]) {
    var image = data.image[0];
    status.thumbnail_pic = image + '/160';
    status.bmiddle_pic = image + '/460';
    status.original_pic = image + '/2000';
  }
  if (data.latitude) {
    status.geo = this.format_geo(data, args);
  }
  if (data.name) {
    status.user = this.format_user(data, args);
  }
  status.reposts_count = data.count || 0;
  status.comments_count = data.mcount || 0;
  if (data.source) {
    status.retweeted_status = this.format_status(data.source, args);
  }
  return status;
  // type:微博类型 1-原创发表、2-转载、3-私信 4-回复 5-空回 6-提及 7: 点评
//      status.status_type = data.type;
//       if(data.type == 7) {
//         // 腾讯的点评会今日hometimeline，很不给力
//         status.status_type = 'comments_timeline';
//       }
      
//             status.created_at = new Date(data.timestamp * 1000);
//             status.timestamp = data.timestamp;
//             if(data.image){
//                 status.thumbnail_pic = data.image[0] + '/160';
//                 status.bmiddle_pic = data.image[0] + '/460';
//                 status.original_pic = data.image[0] + '/2000';
//             }
//       if (data.source) {
//         if(data.type == 4) { 
//           // 回复
//           status.text = '@' + data.source.name + ' ' + status.text;
//           status.related_dialogue_url = 'http://t.qq.com/p/r/' + status.id;
//           status.in_reply_to_status_id = data.source.id;
//           status.in_reply_to_screen_name = data.source.nick;
//         } else {
//           status.retweeted_status = 
//             this.format_result_item(data.source, 'status', args, users);
//           // 评论
//           if(play_load == 'comment') {
//             status.status = status.retweeted_status;
//             delete status.retweeted_status;
//           }
//         }
//       }
//       status.repost_count = data.count || 0;
//       status.comments_count = data.mcount || 0; // 评论数
//       status.source = data.from;
//       status.user = this.format_result_item(data, 'user', args, users);
//       // 收件人
// //      tohead: ""
// //      toisvip: 0
// //      toname: "macgirl"
// //      tonick: "美仪"
//       if(data.toname) {
//         status.recipient = {
//           name: data.toname,
//           nick: data.tonick,
//           isvip: data.toisvip,
//           head: data.tohead
//         };
//         status.recipient = this.format_result_item(status.recipient, 'user', args, users);
//       }
      
//       // 如果有text属性，则替换其中的@xxx 为 中文名(@xxx)
//         if(status && status.text) {
//           var matchs = status.text.match(this.ONLY_AT_USER_RE);
//           if(matchs) {
//             status.users = {};
//             for(var j=0; j<matchs.length; j++) {
//               var name = matchs[j].trim().substring(1);
//               status.users[name] = users[name];
//             }
//           }
//         }
//         data = status;
};

/**
 *
{ birth_day: 1,
  birth_month: 1,
  birth_year: 2010,
  city_code: '1',
  comp: null,
  country_code: '1',
  edu: null,
  email: '',
  exp: 56,
  fansnum: 3,
  favnum: 0,
  head: 'http://app.qlogo.cn/mbloghead/2045de7c75623f2c2b06',
  homecity_code: '',
  homecountry_code: '',
  homepage: '',
  homeprovince_code: '',
  hometown_code: '',
  idolnum: 46,
  industry_code: 0,
  introduction: '',
  isent: 0,
  ismyblack: 0,
  ismyfans: 0,
  ismyidol: 0,
  isrealname: 2,
  isvip: 0,
  level: 1,
  location: '中国 杭州',
  mutual_fans_num: 0,
  name: 'node-weibo',
  nick: 'node-weibo',
  openid: 'EA68676D5E9DA465822CD0CEB2DC6EF5',
  province_code: '33',
  regtime: 1348724066,
  send_private_flag: 2,
  sex: 1,
  tag: null,
  tweetinfo: 
   [ { city_code: '1',
       country_code: '1',
       emotiontype: 0,
       emotionurl: '',
       from: '腾讯微博',
       fromurl: 'http://t.qq.com\n',
       geo: '',
       id: '70997003338788',
       image: null,
       latitude: '0',
       location: '中国 杭州',
       longitude: '0',
       music: null,
       origtext: '#新人报到# 伟大的旅程都是从第一条微博开始的！',
       province_code: '33',
       self: 1,
       status: 0,
       text: '#新人报到# 伟大的旅程都是从第一条微博开始的！',
       timestamp: 1348724111,
       type: 1,
       video: null } ],
  tweetnum: 1,
  verifyinfo: '' }
 */
TQQAPI.prototype.format_user = function (data, args) {
  var user = {};
  user.id = data.name;
  user.t_url = 'http://t.qq.com/' + data.name;
  user.screen_name = data.nick;
  user.name = data.name;
  user.location = data.location || '';
  user.description = data.introduction || '';
  // no url
  user.profile_image_url = data.head + '/50'; // 竟然直接获取的地址无法拿到头像
  user.avatar_large = data.head + '/180';
  user.gender = this.config.gender_map[data.sex||0];
  user.followers_count = data.fansnum || 0;
  user.friends_count = data.idolnum || 0;
  user.statuses_count = data.tweetnum || 0;
  user.favourites_count = data.favnum || 0;
  if (data.regtime) {
    user.created_at = new Date(data.regtime * 1000);
  }
  user.following = data.ismyidol || false;
  user.follow_me = data.ismyfans || false;
  // send_private_flag : 是否允许所有人给当前用户发私信，0-仅有偶像，1-名人+听众，2-所有人,
  user.allow_all_act_msg = data.send_private_flag === 2;
  // no geo_enabled
  user.verified = !!data.isvip;
  // no verified_type
  user.verified_reason = data.verifyinfo || '';
  // user.remark = 
  user.allow_all_comment = true;
  // user.online_status = true;
  user.bi_followers_count = data.mutual_fans_num || 0;
  // user.lang
  user.status = null;
  if (data.tweetinfo && data.tweetinfo[0]) {
    user.status = this.format_status(data.tweetinfo[0], args);
  }

  if (data.tag) {
    user.tags = data.tag;
  }
  return user;
};

TQQAPI.prototype.format_geo = function (data, args) {
  var geo = {
    longitude: data.longitude,
    latitude: data.latitude,
    // city_name string  City name "广州"
    // province_name string  Province name "广东"
    address: data.geo,
  };
  return geo;
};

TQQAPI.prototype.format_comment = function (comment, args) {
  throw new Error('Must override this method.');
};

TQQAPI.prototype.format_message = function (message, args) {
  throw new Error('Must override this method.');
};

TQQAPI.prototype.format_emotion = function (emotion, args) {
  throw new Error('Must override this method.');
};

TQQAPI.prototype.convert_status = function (status) {
  // syncflag 微博同步到空间分享标记（可选，0-同步，1-不同步，默认为0），目前仅支持oauth1.0鉴权方式
  var data = {
    content: status.status
  };
  if (status.long) {
    data.longitude = status.long;
    data.latitude = status.lat;
  }
  if (status.id) {
    data.reid = status.id;
  }
  return data;
};

// TQQAPI.prototype.after_update = function (err, user, id, callback) {
//   if (err) {
//     return callback(err);
//   }
//   this.show(user, id, callback);
// };

// TQQAPI.prototype.update = function (user, status, callback) {
//   var self = this;  
//   TQQAPI.super_.prototype.update.call(this, user, status, function (err, result) {
//     self.after_update(err, user, result && result.id, callback);
//   });
// };

// TQQAPI.prototype.upload = function (user, status, pic, callback) {
//   var self = this;  
//   TQQAPI.super_.prototype.upload.call(this, user, status, pic, function (err, result) {
//     self.after_update(err, user, result && result.id, callback);
//   });
// };

TQQAPI.prototype.url_encode = function (text) {
  return text;
};

// utils.inherits({}, TSinaAPI, {
//   config: utils.extend({}, TSinaAPI.config, {
//     host: 'http://open.t.qq.com/api',
//     user_home_url: 'http://t.qq.com/',
//     search_url: 'http://t.qq.com/k/',
//     result_format: '',
//     source: '', 
//     oauth_key: '',
//     oauth_secret: '',
    

//     ErrorCodes: {
//         1: '参数错误',
//         2: '频率受限',
//         3: '鉴权失败',
//         4: '服务器内部错误'
//     }
//   }),
  
//   rate_limit_status: function (data, callback){
//     callback();
//   },

//   //TODO: 腾讯是有提供重置未读数的接口的，后面加
//   reset_count: function (data, callback) {
//     callback();
//   },
  
//   format_upload_params: function (user, data, pic) {
//     if (data.status){
//       data.content = data.status;
//       delete data.status;
//     }
//   },
    
//     // 同时获取用户信息 user_show
//     user_timeline: function(data, callback, context) {
//       var both = this.combo(function(user_info_args, timeline_args) {
//         var user_info = user_info_args[1]
//           , timeline = timeline_args[1];
//         if(user_info && timeline) {
//             timeline.user = user_info;
//         }
//         callback.apply(context, timeline_args);
//       });
//       var user = data.user;
//         var params = {name: data.id || data.screen_name, user: user};
//       this.user_show(params, both.add());
//       this.super_.user_timeline.call(this, data, both.add());
//     },
//     before_send_request: function(args, user) {
//     if(args.play_load == 'string') {
//       // oauth
//       return;
//     }
//     args.data.format = 'json';
//     if(args.data.count) {
//       args.data.reqnum = args.data.count;
//       delete args.data.count;
//     }
//         if(args.data.since_id) {
//       args.data.pagetime = args.data.since_id;
//             args.data.pageflag = args.data.pageflag === undefined ? 2 : args.data.pageflag;
//       delete args.data.since_id;
//     }
//         if(args.data.max_id) {
//       args.data.pagetime = args.data.max_id;
//             args.data.pageflag = 1;
//       delete args.data.max_id;
//     }
//         if(args.data.status || args.data.text || args.data.comment){
//             args.data.content = args.data.status || args.data.text || args.data.comment;
//             delete args.data.status;
//             delete args.data.text;
//             delete args.data.comment;
//         }
        
//         switch(args.url){
//             case this.config.new_message:
//             case this.config.user_timeline:
//               if(args.data.id) {
//                 args.data.name = args.data.id;
//             delete args.data.id;
//               } else if(args.data.screen_name) {
//                 args.data.name = args.data.screen_name;
//             delete args.data.screen_name;
//               }
//                 break;
//             case this.config.comments:
//               // flag:标识0 转播列表，1点评列表 2 点评与转播列表
//               args.data.flag = 1;
//                 args.data.rootid = args.data.id;
//           delete args.data.id;
//                 break;
//             case this.config.repost_timeline:
//               args.url = args.url.replace('_repost', '');
//               args.data.flag = 0;
//                 args.data.rootid = args.data.id;
//           delete args.data.id;
//                 break;
//             case this.config.reply:
//               // 使用 回复@xxx:abc 点评实现 reply
//               args.url = this.config.comment;
//               args.data.content = '回复@' + args.data.reply_user_id + ':' + args.data.content;
//                 args.data.reid = args.data.id;
//           delete args.data.id;
//           delete args.data.reply_user_id;
//           delete args.data.cid;
//                 break;
//             case this.config.comment:
//                 args.data.reid = args.data.id;
//           delete args.data.id;
//                 break;
//             case this.config.counts:
// //              console.log(args.data);
// //                args.data.flag = 2;
//                 break;
//             case this.config.repost:
//                 args.data.reid = args.data.id;
//           delete args.data.id;
//                 break;
//             case this.config.friendships_destroy:
//             case this.config.friendships_create:
//               args.data.name = args.data.id;
//               delete args.data.id;
//               break;
//             case this.config.followers:
//             case this.config.friends:
//               args.data.startindex = args.data.cursor;
//               args.data.name = args.data.user_id;
//               if(String(args.data.startindex) == '-1') {
//                 args.data.startindex = '0';
//               }
//               if(args.data.reqnum > 30) {
//                 // 最大只能获取30，否则就会抛错 {"data":null,"msg":"server error","ret":4}
//                 args.data.reqnum = 30;
//               }
//               delete args.data.cursor;
//               delete args.data.user_id;
//               break;
//             case this.config.search:
//             case this.config.user_search:
//               args.data.keyword = args.data.q;
//               args.data.pagesize = args.data.reqnum;
//               delete args.data.reqnum;
//               delete args.data.q;
//             break;
//             case this.config.update:
//               // 判断是否@回复
//               if(args.data.sina_id) {
//               args.data.reid = args.data.sina_id;
//               delete args.data.sina_id;
//               args.url = '/t/reply';
//             }
//             break;
//         }
//   },
  
//   format_result: function(data, play_load, args) {
//     if(play_load == 'string') {
//       return data;
//     }
//     if(args.url == this.config.friendships_create || args.url == this.config.friendships_destroy) {
//       return true;
//     }
//     data = data.data;
//         if(!data){ return data; }
//     var items = data.info || data;
//     delete data.info;
//     var users = data.user || {};
//     if(data.results || data.users) {
//       items = data.results || data.users;
//     }
//     if(items instanceof Array) {
//         for(var i=0; i<items.length; i++) {
//           items[i] = this.format_result_item(items[i], play_load, args, users);
//         }
//         data.items = items;
//             if(data.user && !data.user.id){
//                 delete data.user;
//             }
//         if(args.url == this.config.followers || args.url == this.config.friends) {
//           if(data.items.length >= parseInt(args.data.reqnum)) {
//             var start_index = parseInt(args.data.startindex || '0');
//             if(start_index == -1) {
//               start_index = 0;
//             }
//             data.next_cursor = start_index + data.items.length;
//           } else {
//             data.next_cursor = '0'; // 无分页了
//           }
//         }
//       } else {
//         data = this.format_result_item(data, play_load, args, users);
//       }
//     return data;
//   },

//   format_result_item: function(data, play_load, args, users) {
//     if(play_load == 'user' && data && data.name) {
//       
//     } else if(play_load == 'status' || play_load == 'comment' || play_load == 'message') {
//       
//     } 
//     return data;
//   }
// });

