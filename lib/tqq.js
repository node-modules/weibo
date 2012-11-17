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
var EventProxy = require('eventproxy');
var TBase = require('./tbase');
var utils = require('./utils');

function TQQAPI(options) {
  TQQAPI.super_.call(this);

  this.blogtype = 'tqq';

  var config = utils.extend({}, options, {
    host: 'http://open.t.qq.com/api',
    user_home_url: 'http://t.qq.com/',
    result_format: '',
    oauth_host: 'https://open.t.qq.com',
    oauth_authorize:      '/cgi-bin/authorize',
    oauth_request_token:  '/cgi-bin/request_token',
    oauth_access_token:   '/cgi-bin/access_token',

    count_max_number: 30,

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

    home_timeline:        '/statuses/home_timeline',
    mentions:             '/statuses/mentions_timeline',
    comments_timeline:    '/statuses/mentions_timeline',
    comments_mentions:    '/statuses/mentions_timeline',
    
    repost_timeline:      '/t/re_list',

    followers:            '/friends/user_fanslist',
    friends:              '/friends/user_idollist',
    favorites:            '/fav/list_t',
    favorite_show:        null, // use show() to mock this api
    favorite_create:      '/fav/addt',
    favorite_destroy:     '/fav/delt',
    count:                '/t/re_count', //仅仅是转播数
    show:                 '/t/show',
    update:               '/t/add',
    upload:               '/t/add_pic',
    repost:               '/t/re_add',
    comment_create:       '/t/comment',
    comment_reply:        '/t/comment',
    comments:             '/t/re_list',
    destroy:              '/t/del',

    direct_messages:      '/private/recv',
    direct_messages_sent: '/private/send',
    direct_message_create: '/private/add',
    direct_message_destroy: '/private/del',

    rate_limit_status:    '/account/rate_limit_status',
    friendship_create:    '/friends/add',
    friendship_destroy:   '/friends/del',
    friendship_show:      '/friends/check',
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
    
    gender_map: {0: 'n', 1: 'm', 2: 'f'},

    // support apis
    support_comment_destroy: false,
    support_comments_mentions: false,
    support_comments_by_me: false,
    // support_search_suggestions_at_users: false,
    // support_user_search: false,

  });

  this.init(config);
}

inherits(TQQAPI, TBase);
module.exports = TQQAPI;

/**
 * Utils methods
 */

TQQAPI.prototype.detect_error = function (method, res, playload, data) {
  var headers = res.headers;
  var err;
  if (res.statusCode === 200 && headers.status) {
    err = new Error(headers.status);
  } else if (data.errcode && data.msg) {
    err = new Error(data.msg);
  } else if (!data.data && data.msg && data.errcode !== 0) {
    err = new Error(data.msg);
  }
  if (err) {
    err.name = this.errorname(method);
    err.data = data;
    return err;
  }
  return TQQAPI.super_.prototype.detect_error.call(this, method, res, playload, data);
};

TQQAPI.prototype.url_encode = function (text) {
  return text;
};

/**
 * Emotions
 */

var _VIDEO_PADDING = '!!!{{status.video.shorturl}}!!!';
var _EMOTION_MAP = {
  1: '狂喜', 
  2: '偷乐',
  3: '无感', 
  4: '伤心', 
  5: '咆哮'
};

TQQAPI.prototype.process_text = function (status) {
  var text = status.text;
  var hasVideo = false;
  if (status.video && status.video.picurl && text) {
    // 添加视频链接
    if (text.indexOf(status.video.shorturl) < 0) {
      text += ' ' + status.video.shorturl;
    }
    text = text.replace(status.video.shorturl, this._VIDEO_PADDING);
    hasVideo = true;    
  }

  text = utils.escape(text);
  text = text.replace(this.URL_RE, this._replace_url);
  
  text = this.process_at(text, status.users || {}); //@***

  text = this.process_emotional(text); 

  text = this.process_search(text); //#xxXX#
  
  text = this.process_emoji(text);

  if (hasVideo) {
    var video_html = '<a href="' + status.video.realurl + '" title="' +
    status.video.title + '" class="status_text_link">' + status.video.shorturl + '</a>';
    text = text.replace(this._VIDEO_PADDING, video_html);
    text += '<br/><img class="video_image" title="' + status.video.title + '" src="' + status.video.picurl + '" />';
  }

  if (status.emotionurl) {
    var title = _EMOTION_MAP[status.emotiontype] || ('未知心情:' + status.emotiontype);
    text = '<img src="' + status.emotionurl + '" alt="' + title + '" title="' + title + '" />' + text;
  }
  return text || '&nbsp;';
};

var _SHUOSHUO_EMOTION_RE = /\[em\](\w+)\[\/em\]/g;
var _EMOTION_RE = null;

TQQAPI.prototype.process_emotional = function (text) {
  // show shuoshuo faces : http://code.google.com/p/falang/issues/detail?id=318
  text = text.replace(_SHUOSHUO_EMOTION_RE, function (m, g1) {
    if (g1) {
      return '<img src="http://qzonestyle.gtimg.cn/qzone/em/' + g1 + '.gif" />';
    }
  });
  var emotions = this.load_emotions();
  var map = emotions[1];
  if (!_EMOTION_RE) {
    _EMOTION_RE = new RegExp('\/(' + Object.keys(map).join('|') + ')', 'g');
  }
  var tpl = '<img title="{{title}}" src="{{face}}" />';
  return text.replace(_EMOTION_RE, function (m, g1) {
    var face = map[g1];
    if (face) {
      return utils.format(tpl, {title: g1, face: emotions[0] + face});
    }
    return m;
  });
};

var AT_USER_RE = /([^#])?@([\w\-\_]+)/g;
var ONLY_AT_USER_RE = /@([\w\-\_]+)/g;
  
TQQAPI.prototype.process_at = function (text, users) { //@***
  var tpl = '{{pre}}<a class="at_user_link" href="' +
    this.config.user_home_url + '{{uid}}" data-uid="{{uid}}">@{{screen_name}}</a>';
  var homeurl = this.config.user_home_url;
  return text.replace(AT_USER_RE, function (match, m1, m2) {
    var uid = m2;
    var username = users[uid];
    if (username) {
      username += '(@' + uid + ')';
    } else {
      username = uid;
    }
    var data = {
      pre: m1 || '',
      url: homeurl + uid,
      uid: uid,
      screen_name: username
    };
    return utils.format(tpl, data);
  });
};

/**
 * Result getters
 */

TQQAPI.prototype.get_result_items = function (data, playload, args) {
  if (playload === 'count') {
    var counts = [];
    for (var id in data) {
      var item = data[id];
      counts.push({id: id, reposts: item.count, comments: item.mcount});
    }
    return counts;
  }
  var items = data && data.info;
  return items || [];
};

/**
 * { hasnext: 0,
     info: 
      [ [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object],
        [Object] ],
     timestamp: 1348753615,
     user: { GreenMango: '青芒', 'node-weibo': 'node-weibo' } },
 */
// TQQAPI.prototype.get_pagging_cursor = function (data, playload, args) {
//   return {};
// };

/**
 * Result formatters
 */

TQQAPI.prototype.format_result = function (data, playload, args) {
  data = data.data;
  var result = TQQAPI.super_.prototype.format_result.call(this, data, playload, args);
  if (data && data.user) {
    if (Array.isArray(result.items)) {
      var items = result.items;
      for (var i = 0; i < items.length; i++) {
        items[i].users = data.user;
      }
    } else {
      result.users = data.user;
    }
  }
  return result;
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

 */
TQQAPI.prototype.format_status = function (data, args) {
  var status = {};
  status.id = String(data.id);
  status.t_url = 'http://t.qq.com/p/t/' + data.id;
  if (!data.timestamp) {
    return status;
  }
  status.timestamp = data.timestamp;
  status.created_at = new Date(data.timestamp * 1000);
  status.text = data.origtext;
  data.fromurl = (data.fromurl || 'http://t.qq.com').trim();
  status.source = '<a href="' + data.fromurl + '">' + data.from + '</a>';
  // status.favorited = 
  if (data.image && data.image[0]) {
    var image = data.image[0];
    status.thumbnail_pic = image + '/160';
    status.bmiddle_pic = image + '/460';
    status.original_pic = image + '/2000';
  }
  if (data.latitude && String(data.latitude) !== '0') {
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
  if (data.head) {
    user.profile_image_url = data.head + '/50'; // 竟然直接获取的地址无法拿到头像
    user.avatar_large = data.head + '/180';
  } else {
    user.profile_image_url = 'http://mat1.gtimg.com/www/mb/images/head_50.jpg';
    user.avatar_large = 'http://mat1.gtimg.com/www/mb/images/head_180.jpg';
  }
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
  if (data.tweetinfo && data.tweetinfo[0]) {
    user.status = this.format_status(data.tweetinfo[0], args);
  }

  if (data.tag) {
    user.tags = data.tag;
  }
  return user;
};

TQQAPI.prototype.format_count = function (count, args) {
  return count;
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

TQQAPI.prototype.format_comment = function (data, args) {
  var comment = this.format_status(data, args);
  if (comment.retweeted_status) {
    comment.status = comment.retweeted_status;
    delete comment.retweeted_status;
  }
  return comment;
};

TQQAPI.prototype.format_message = function (message, args) {
  var recipient = null;
  if (message.toname) {
    // tohead: 'http://app.qlogo.cn/mbloghead/03cfac444e03cafd2a3a',
    // toisvip: 0,
    // toname: 'fengmk2',
    // tonick: 'Python发烧友',
    recipient = {
      name: message.toname,
      nick: message.tonick,
      isvip: message.toisvip,
      head: message.tohead
    };
  }
  
  message = this.format_status(message, args);
  if (message.user) {
    message.sender = message.user;
    delete message.user;
  }
  if (recipient) {
    message.recipient = this.format_user(recipient);
  }
  return message;
};

TQQAPI.prototype.format_emotion = function (emotion, args) {
  throw new Error('Must override this method.');
};

TQQAPI.prototype.format_favorite = function (status, args) {
  var favorite = {
    created_at: new Date(status.storetime * 1000),
    status: this.format_status(status)
  };
  return favorite;
};

/**
 * Params converters
 */

TQQAPI.prototype.convert_friendship = function (data) {
  var args = {
    name: data.uid
  };
  return args;
};

TQQAPI.prototype.convert_comment = function (comment) {
  // http://wiki.open.t.qq.com/index.php/%E5%BE%AE%E5%8D%9A%E7%9B%B8%E5%85%B3/%E7%82%B9%E8%AF%84%E4%B8%80%E6%9D%A1%E5%BE%AE%E5%8D%9A
  var data = {
    content: comment.comment,
    reid: comment.id
  };
  return data;
};

TQQAPI.prototype.convert_message = function (message) {
  // http://wiki.open.t.qq.com/index.php/API%E6%96%87%E6%A1%A3/%E7%A7%81%E4%BF%A1%E7%9B%B8%E5%85%B3/%E5%8F%91%E7%A7%81%E4%BF%A1
  var data = {
    content: message.text,
    contentflag: 1,
    name: message.uid,
  };
  if (message.openid) {
    data.fopenid = message.openid;
  }
  // TODO: support pic
  return data;
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

TQQAPI.prototype.convert_user = function (user) {
  var data = {
    name: user.uid || user.screen_name
  };
  return data;
};

TQQAPI.prototype.convert_ids = function (ids) {
  return {
    ids: ids,
    flag: '2'
  };
};

TQQAPI.prototype.convert_user_search_cursor = function (cursor) {
  var data = {
    keyword: cursor.q,
    pagesize: cursor.count,
    page: cursor.page || 1
  };
  return data;
};

/**
 * pageflag
 分页标识（0：第一页，1：向下翻页，2：向上翻页）
 pagetime
 本页起始时间（第一页：填0，向上翻页：填上一次请求返回的第一条记录时间，向下翻页：填上一次请求返回的最后一条记录时间）
 reqnum
 每次请求记录的条数（1-70条）
 type
 拉取类型（需填写十进制数字）
0x1 原创发表 0x2 转载 如需拉取多个类型请使用|，如(0x1|0x2)得到3，则type=3即可，填零表示拉取所有类型 
 contenttype
 内容过滤。0-表示所有类型，1-带文本，2-带链接，4-带图片，8-带视频，0x10-带音频
  建议不使用contenttype为1的类型，如果要拉取只有文本的微博，建议使用0x80
 * 
 */
TQQAPI.prototype.convert_cursor = function (cursor) {
  var data = {};
  // type: 拉取类型, 0x1 原创发表 0x2 转载 0x8 回复 0x10 空回 0x20 提及 0x40 点评
  data.type = String(0x1 | 0x2 | 0x8 | 0x10 | 0x20);
  data.contenttype = '0';
  data.reqnum = cursor.count;
  if (cursor.max_id) {
    // get older statuses
    data.pageflag = '1';
    data.pagetime = cursor.max_time;
    data.lastid = cursor.max_id;
  } else if (cursor.since_id) {
    // get newer statuses
    // 0：第一页，1：向下翻页，2：向上翻页
    data.pageflag = '2';
    data.pagetime = cursor.since_time;
    data.lastid = cursor.sina_id;
  } else {
    // top page
    data.pageflag = '0';
    data.pagetime = '0';
    data.lastid = '0';
  }
  if (typeof cursor.callback === 'function') {
    data = cursor.callback(data);
  }
  if (cursor.page) {
    data.page = cursor.page;
  }
  return data;
};

/**
 * Status
 */

TQQAPI.prototype.repost_timeline = function (user, cursor, callback) {
  cursor.callback = function (data) {
    data.rootid = cursor.id;
    data.flag = '0';
    // twitterid 微博id，与pageflag、pagetime共同使用，实现翻页功能（第1页填0，继续向下翻页，填上一次请求返回的最后一条记录id）
    if (data.lastid) {
      data.twitterid = data.lastid;
      delete data.lastid;
    }
    return data;
  };
  return TQQAPI.super_.prototype.repost_timeline.call(this, user, cursor, callback);
};

TQQAPI.prototype.user_timeline = function (user, cursor, callback) {
  cursor.callback = function (data) {
    if (cursor.uid || cursor.screen_name) {
      data.name = cursor.uid || cursor.screen_name;
    }
    return data;
  };
  return TQQAPI.super_.prototype.user_timeline.call(this, user, cursor, callback);
};

/**
 * Comment
 */

TQQAPI.prototype.comments_timeline = function (user, cursor, callback) {
  cursor.callback = function (data) {
    data.type = String(0x40);
    return data;
  };
  return TQQAPI.super_.prototype.comments_timeline.call(this, user, cursor, callback);
};

TQQAPI.prototype.comments = function (user, cursor, callback) {
  cursor.callback = function (data) {
    data.rootid = cursor.id;
    data.flag = '1';
    if (data.lastid) {
      data.twitterid = data.lastid;
      delete data.lastid;
    }
    return data;
  };
  return TQQAPI.super_.prototype.comments.call(this, user, cursor, callback);
};

TQQAPI.prototype.comment_destroy = function (user, cid, callback) {
  callback(new TypeError('comment_destroy not support.'));
};

/**
 * Favorite
 */

TQQAPI.prototype.favorite_show = function (user, id, callback) {
  var self = this;
  self.show(user, id, function (err, status) {
    if (err) {
      err.name = self.errorname('favorite_show');
      return callback(err);
    }
    var favorite = {
      status: status,
      created_at: status.created_at
    };
    callback(null, favorite);
  });
};

/**
 * FriendShip
 */

TQQAPI.prototype.friendship_show = function (user, data, callback) {
  var args = {
    names: data.target_id,
    flag: 2
  };
  TQQAPI.super_.prototype.friendship_show.call(this, user, args, function (err, relations) {
    if (err) {
      return callback(err);
    }
    var relation = relations[data.target_id] || {};
    // name1:｛isidol:true,isfans,false｝,
    // isfans: following source
    // isidol: followed_by source
    var ship = {
      target: {
        id: data.target_id,
        following: relation.isfans,
        followed_by: relation.isidol,
      },
      source: {
        id: data.source_id
      }
    };
    callback(null, ship);
  });
};


/**
 * Search 
 */

TQQAPI.prototype.search = function (user, query, cursor, callback) {
  cursor = cursor || {};
  var q = {
    keyword: query.q
  };
  if (query.long && query.lat && query.radius) {
    q.longitude = query.long;
    q.latitude = query.lat;
    q.radius = query.radius;
  }
  cursor.callback = function (data) {
    data.pagesize = data.reqnum || 20;
    return data;
  };
  return TQQAPI.super_.prototype.search.call(this, user, q, cursor, callback);
};

TQQAPI.prototype.search_suggestions_at_users = function (user, cursor, callback) {
  return this.user_search(user, cursor.q, cursor, function (err, result) {
    if (err) {
      return callback(err);
    }
    var users = [];
    var items = result.items || [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      users.push({
        id: item.id,
        screen_name: item.screen_name,
        remark: item.name,
      });
    }
    result.items = users;
    callback(null, result);
  });
};

TQQAPI.prototype.comments_to_me = TQQAPI.prototype.comments_timeline;

