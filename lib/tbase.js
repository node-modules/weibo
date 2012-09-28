/*!
 * node-weibo - lib/tbase.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var querystring = require('querystring');
var urllib = require('urllib');
var utils = require('./utils');
var OAuth = require('./oauth');
var mime = require('mime');

function TBase() {
  this.config = {
    host: 'api start url',
    result_format: '.json',
    appkey: '',
    secret: '',
    oauth_host: '',
    oauth_callback: 'oob or url',
    // google app key
    google_appkey: 'AIzaSyAu4vq6sYO3WuKxP2G64fYg6T1LdIDu3pk',
    
    userinfo_has_counts: true, // 用户信息中是否包含粉丝数、微博数等信息
    support_counts: true, // 是否支持批量获取转发和评论数
    support_comment: true, // 判断是否支持评论列表
    support_do_comment: true, // 判断是否支持发送评论
    support_repost_comment: true, // 判断是否支持转发同时发评论
    support_repost_comment_to_root: false, // 判断是否支持转发同时给原文作者发评论
    support_upload: true, // 是否支持上传图片
    support_repost: true, // 是否支持新浪形式转载
    repost_pre: '转:', // 转发前缀
    repost_delimiter: '//', //转发的分隔符
    image_shorturl_pre: ' [图] ', // RT图片缩址前缀
    support_favorites: true, // 判断是否支持收藏列表
    support_do_favorite: true, // 判断是否支持收藏功能
    support_geo: true, //是否支持地理位置信息上传
    // 是否支持max_id 分页
    support_max_id: true,
    support_destroy_msg: true, //是否支持删除私信
    support_direct_messages: true, 
    support_sent_direct_messages: true, //是否支持自己发送的私信
    support_mentions: true, 
    support_friendships_create: true,
    support_search: true,
    support_search_max_id: false,
    support_favorites_max_id: false, // 收藏分页使用max_id
    
    need_processMsg: true, //是否需要处理消息的内容
    comment_need_user_id: false, // 评论是否需要使用到用户id，默认为false，兼容所有旧接口
        
    // api
    public_timeline:      '/statuses/public_timeline',
    home_timeline:        '/statuses/home_timeline',
    user_timeline:        '/statuses/user_timeline',
    mentions:             '/statuses/mentions',
    comments_timeline:    '/comments/timeline',
    comments_mentions:    '/comments/mentions',

    repost_timeline:      '/statuses/repost_timeline',
    comments:             '/statuses/comments',

    show:                 '/statuses/show',
    update:               '/statuses/update',
    upload:               '/statuses/upload',
    repost:               '/statuses/repost',
    destroy:              '/statuses/destroy',

    followers:            '/statuses/followers',
    friends:              '/statuses/friends',
    favorites:            '/favorites',
    favorites_create:     '/favorites/create',
    favorites_destroy:    '/favorites/destroy/{{id}}',
    counts:               '/statuses/counts',
    
    comment_create:       '/statuses/comment',
    comment_reply:        '/statuses/reply',
    comment_destroy:      '/statuses/comment_destroy',
    
    destroy_msg:          '/direct_messages/destroy/{{id}}',
    direct_messages:      '/direct_messages', 
    sent_direct_messages: '/direct_messages/sent', //自己发送的私信列表，我当时为什么要命名为sent_direct_messages捏，我擦
    new_message:          '/direct_messages/new',
    verify_credentials:   '/account/verify_credentials',
    rate_limit_status:    '/account/rate_limit_status',
    friendships_create:   '/friendships/create',
    friendships_destroy:  '/friendships/destroy',
    friendships_show:     '/friendships/show',
    reset_count:          '/statuses/reset_count',
    user_show:            '/users/show/{{id}}',
    emotions:             '/emotions',
    
    // 用户标签
    tags:                 '/tags',
    create_tag:           '/tags/create',
    destroy_tag:          '/tags/destroy',
    tags_suggestions:     '/tags/suggestions',
    
    // 搜索
    search:               '/statuses/search',
    user_search:          '/users/search',
    
    oauth_authorize:      '/oauth/authorize',
    oauth_request_token:  '/oauth/request_token',
    oauth_access_token:   '/oauth/access_token',
    
    // 图片上传字段名称
    pic_field: 'pic',
  };
}

module.exports = TBase;

TBase.prototype.init = function (config) {
  for (var k in config) {
    this.config[k] = config[k];
  }
};

TBase.prototype.errorname = function (name) {
  // get_access_token => GetAccessTokenError
  name = name.replace(/(?:^\w|\_\w)/g, function (m) {
    if (m.length === 2) {
      m = m.substring(1);
    }
    return m.toUpperCase();
  });
  return name + 'Error';
};

TBase.prototype.detect_error = function (method, res, playload, data) {
  if (res.statusCode === 200) {
    return null;
  }
  var errMessage = null;
  if (method === 'get_request_token' || method === 'get_access_token') {
    var token = querystring.parse(data);
    if (token) {
      errMessage = 'Get request token error, ' + (token.error_CN || token.error || data);
    } else {
      errMessage = 'Get request token error, empty token string';
    }
  } else {
    errMessage = data.error_CN || data.error || data.message || data;
  }
  var err = new Error(errMessage);
  err.data = data;
  err.name = this.errorname(method);
  return err;
};

/**
 * 封装所有http请求，自动区分处理http和https
 * args: {
 *  data, 
 *  type: 'GET | POST | DELETE', 
 *  headers
 * }
 * callback.call(context, data, error, res || xhr)
 */
TBase.prototype.request = function (url, args, callback) {
  var playload = args.playload;
  if (playload !== 'string') {
    args.dataType = 'json';
  }
  var self = this;
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return callback(err);
    }
    if (playload === 'string') {
      data = data.toString();
    }
    // console.log(url, args, res.headers, res.statusCode, data)
    // console.log(data.data)
    err = self.detect_error(args.request_method, res, playload, data);
    if (err) {
      return callback(err);
    }
    if (playload === 'string') {
      return callback(null, data);
    }

    callback(null, this.format_result(data, playload, args));
  }, this);
};

/**
 * when you do something before request, override this method
 */ 
TBase.prototype.before_send_request = function (args, user) {
  // override this
};
    
TBase.prototype.send_request = function (url, params, callback) {
  var args = {
    type: 'GET', 
    playload: 'status', 
    headers: {}
  };
  for (var k in params) {
    args[k] = params[k];
  }
  args.type = (args.type || 'GET').toUpperCase();
  args.data = args.data || {};

  var user = args.user || args.data.user || {};
  args.user = user;
  if (args.data && args.data.user) {
    delete args.data.user;
  }

  var api = args.api_host || this.config.host;
  if (args.api_host) {
    delete args.api_host;
  }
  
  this.before_send_request(args, user);

  url = api + url.format(args.data);
  // delete the url params
  url.replace(utils.STRING_FORMAT_REGEX, function (match, key) {
    delete args.data[key];
  });

  if (args.playload !== 'string' && this.config.result_format) {
    url += this.config.result_format;
  }

  this.apply_auth(url, args, user);
  if (args.type === 'POST') {
    args.headers['Content-Type'] = args.content_type || 'application/x-www-form-urlencoded;charset=UTF-8;';
  }
  this.request(url, args, callback);
};

// 设置认证头
// user: {username, password, authtype}
// oauth 过程简介: 
// 1. 使用app的token获取request token；
// 2. 用户授权给此request token；
// 3. 使用授权后的request token获取access token
TBase.prototype.apply_auth = function (url, args, user) {
  if (!user) {
    return;
  }
  user.authtype = user.authtype || 'oauth';
  args.headers = args.headers || {};
  if (user.authtype === 'baseauth') {
    if (user.username && user.password) {
      args.headers.Authorization = urllib.make_base_auth_header(user.username, user.password);
    }
  } else if (user.authtype === 'oauth' || user.authtype === 'xauth') {
    var accessor = {
      consumerSecret: this.config.secret
    };
    // 已通过oauth认证
    if (user.oauth_token_secret) {
      accessor.tokenSecret = user.oauth_token_secret;
    }
    var parameters = {};

    for (var k in args.data) {
      parameters[k] = args.data[k];
      if (k.substring(0, 6) === 'oauth_') { // 删除oauth_verifier相关参数
        delete args.data[k];
      }
    } 

    var message = {
      action: url,
      method: args.type, 
      parameters: parameters
    };
    message.parameters.oauth_consumer_key = this.config.appkey;
    message.parameters.oauth_version = '1.0';
    
    // 已通过oauth认证
    if (user.oauth_token) {
      message.parameters.oauth_token = user.oauth_token;
    }
    // 设置时间戳
    OAuth.setTimestampAndNonce(message);
    // 签名参数
    // console.log(message.parameters);
    OAuth.SignatureMethod.sign(message, accessor);
    // oauth参数通过get方式传递
    if (this.config.oauth_params_by_get) {
      args.data = message.parameters;
      //console.log(args.data);
    } else {
      // 获取认证头部
      args.headers.Authorization = OAuth.getAuthorizationHeader(this.config.oauth_realm, message.parameters);
    }
  }
},

TBase.prototype.format_authorization_url = function (params) {
  var login_url = (this.config.oauth_host || this.config.host) + this.config.oauth_authorize;
  return OAuth.addToURL(login_url, params);
};

TBase.prototype.get_authorization_url = function (user, callback) {
  var self = this;
  self.get_request_token(user, function (err, token) {
    var info = null;
    if (err) {
      return callback(err);
    }
    if (token) {
      var params = {
        oauth_token: token.oauth_token,
        oauth_callback: user.oauth_callback || self.config.oauth_callback
      };
      info = token;
      info.auth_url = self.format_authorization_url(params);
    }
    callback(err, info);
  });
};

TBase.prototype.get_request_token = function (user, callback) {
  var self = this;
  var url = self.config.oauth_request_token;
  var params = {
    type: 'GET',
    user: user,
    playload: 'string',
    data: {
      oauth_callback: user.oauth_callback || self.config.oauth_callback
    },
    api_host: self.config.oauth_host,
    request_method: 'get_request_token'
  };
  if (self.config.oauth_request_params) {
    utils.extend(params.data, self.config.oauth_request_params);
  }
  self.send_request(url, params, function (err, token) {
    if (err) {
      return callback(err);
    }
    callback(null, querystring.parse(token));
  });
},
  
// user must contain oauth_pin or oauth_verifier
TBase.prototype.get_access_token = function (user, callback) {
  if (!user.authtype) {
    user.authtype = 'oauth';
  }
  var url = this.config.oauth_access_token;
  var data = {};
  var params = {
    type: 'GET',
    user: user,
    playload: 'string',
    data: data,
    api_host: this.config.oauth_host,
    request_method: 'get_access_token'
  };
  var oauth_verifier = user.oauth_pin || user.oauth_verifier || 'no_verifier';
  if (oauth_verifier) {
    data.oauth_verifier = oauth_verifier;
    delete user.oauth_pin;
    delete user.oauth_verifier;
  }
  if (user.authtype === 'xauth') {
    data.x_auth_username = user.username;
    data.x_auth_password = user.password;
    data.x_auth_mode = "client_auth";
  }
  this.send_request(url, params, function (err, token) {
    if (err) {
      return callback(err);
    }
    token = querystring.parse(token);
    callback(null, token);
  });
};

TBase.prototype.verify_credentials = function (user, callback) {
  var params = {
    type: 'GET',
    user: user,
    playload: 'user',
    request_method: 'verify_credentials'
  };
  var url = this.config.verify_credentials;
  this.send_request(url, params, callback);
};

TBase.prototype.url_encode = function (text) {
  return encodeURIComponent(text);
};

TBase.prototype.get_result_items = function (data, playload, args) {
  throw new Error('Must override this method');
};

TBase.prototype.get_result_item = function (data, playload, args) {
  return data;
};

TBase.prototype.get_pagging_cursor = function (data, playload, args) {
  return {};
};

TBase.prototype.format_result = function (data, playload, args) {
  // status[]: need Array and item type is `status`
  // status: need item, type is `status`
  var index = playload.indexOf('[]');
  var isList = index > 0;
  if (isList) {
    var itemPlayload = playload.substring(0, index);
    var items = this.get_result_items(data) || [];
    for (var i = 0; i < items.length; i++) {
      items[i] = this.format_result_item(items[i], itemPlayload, args);
    }
    var result = {};
    result.items = items;
    // try to get pagging cursor.
    result.cursor = this.get_pagging_cursor(data, itemPlayload, args);
    return result;
  }

  var item = this.get_result_item(data, playload, args);
  return this.format_result_item(item, playload, args);
};

TBase.prototype.format_result_item = function (data, playload, args) {
  var method = 'format_' + playload;
  return this[method](data, args);
};

TBase.prototype.format_search_status = function (status, args) {
  throw new Error('Must override this method.');
};

TBase.prototype.format_status = function (status, args) {
  throw new Error('Must override this method.');
};

TBase.prototype.format_user = function (user, args) {
  throw new Error('Must override this method.');
};

TBase.prototype.format_comment = function (comment, args) {
  throw new Error('Must override this method.');
};

TBase.prototype.format_message = function (message, args) {
  throw new Error('Must override this method.');
};

TBase.prototype.format_emotion = function (emotion, args) {
  throw new Error('Must override this method.');
};

/**
 * Status APIs
 */

TBase.prototype.convert_status = function (status) {
  return status;
};

TBase.prototype.convert_comment = function (comment) {
  return comment;
};

TBase.prototype.update = function (user, status, callback) {
  status = this.convert_status(status);
  var params = {
    type: 'POST',
    playload: 'status',
    user: user,
    data: status,
    request_method: 'update'
  };
  var url = this.config.update;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.upload = function (user, status, pic, callback) {
  status = this.convert_status(status);
  pic.name = pic.name || 'node-weibo-upload-image.jpg';
  if (!pic.content_type) {
    pic.content_type = mime.lookup(pic.name);
  }
  if (Buffer.isBuffer(pic.data)) {
    this._upload(user, status, pic, callback);
    return this;
  }
  var buffers = [];
  var size = 0;
  var self = this;
  pic.data.on('data', function (chunk) {
    size += chunk.length;
    buffers.push(chunk);
  });
  pic.data.once('end', function () {
    pic.data = Buffer.concat(buffers, size);
    self._upload(user, status, pic, callback);
  });
  pic.data.once('error', function (err) {
    callback(err);
  });
  return this;
};

TBase.prototype._upload = function (user, data, pic, callback) {
  var auth_args = {
    type: 'post',
    data: {},
    headers: {}
  };
  var pic_field = this.config.pic_field || 'pic';  
  var boundary = 'boundary' + Date.now();
  // this.format_upload_params(user, data, pic , boundary);
  var dashdash = '--';
  var crlf = '\r\n';

  /* RFC2388 */
  var builder = '';

  builder += dashdash;
  builder += boundary;
  builder += crlf;

  var key;
  for (key in data) {
    var value = this.url_encode(data[key]);
    auth_args.data[key] = value;
  }
  
  var api = this.config.host;
  var url = api + this.config.upload + this.config.result_format;

  // 设置认证头部
  this.apply_auth(url, auth_args, user); 
  
  for (key in auth_args.data) {
    /* Generate headers. key */            
    builder += 'Content-Disposition: form-data; name="' + key + '"';
    builder += crlf;
    builder += crlf; 
     /* Append form data. */
    builder += auth_args.data[key];
    builder += crlf;
    
    /* Write boundary. */
    builder += dashdash;
    builder += boundary;
    builder += crlf;
  }
  /* Generate headers. [PIC] */            
  builder += 'Content-Disposition: form-data; name="' + pic_field + '"';
 
  builder += '; filename="' + this.url_encode(pic.name) + '"';
  builder += crlf;

  builder += 'Content-Type: ' + pic.content_type + ';'; 
  builder += crlf;
  builder += crlf;
  
  var endstr = crlf + dashdash + boundary + dashdash +  crlf;
  var builderLength = Buffer.byteLength(builder);
  var size = builderLength + pic.data.length + endstr.length;
  var buffer = new Buffer(size);
  var offset = 0;
  buffer.write(builder);
  offset += builderLength ;
  pic.data.copy(buffer, offset);
  offset += pic.data.length;
  buffer.write(endstr, offset);
  // if (typeof BlobBuilder === 'undefined') {
  // } 
  // else {
  //   buffer = new BlobBuilder(); //NOTE WebKitBlogBuilder
  //   buffer.append(builder);
  //   buffer.append(pic);
  //   buffer.append(endstr);
  //   buffer = buffer.getBlob();
  // }
  auth_args.headers['Content-Type'] = 'multipart/form-data;boundary=' + boundary;
  var params = {
    type: 'POST', 
    playload: 'status', 
    content: buffer, 
    headers: auth_args.headers,
    request_method: 'upload'
  };
  this.request(url, params, callback);
  return this;
};

TBase.prototype.repost = function (user, id, status, callback) {
  status.id = id;
  status = this.convert_status(status);
  var params = {
    type: 'POST',
    playload: 'status',
    user: user,
    data: status,
    request_method: 'repost'
  };
  var url = this.config.repost;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.destroy = function (user, id, callback) {
  var params = {
    type: 'POST',
    playload: 'status',
    user: user,
    data: {id: id},
    request_method: 'destroy'
  };
  var url = this.config.destroy;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.show = function (user, id, callback) {
  var params = {
    type: 'GET',
    playload: 'status',
    user: user,
    data: {
      id: id
    },
    request_method: 'show'
  };
  var url = this.config.show;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.convert_cursor = function (cursor) {
  return cursor;
};

TBase.prototype._timeline = function (request_method, user, cursor, callback, playload) {
  cursor = this.convert_cursor(cursor);
  var params = {
    type: 'GET',
    playload: playload || 'status[]',
    user: user,
    data: cursor,
    request_method: request_method
  };
  var url = this.config[request_method];
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.home_timeline = function (user, cursor, callback) {
  return this._timeline('home_timeline', user, cursor, callback);
};

TBase.prototype.user_timeline = function (user, cursor, callback) {
  return this._timeline('user_timeline', user, cursor, callback);
};

TBase.prototype.public_timeline = function (user, cursor, callback) {
  return this._timeline('public_timeline', user, cursor, callback);
};

TBase.prototype.mentions = function (user, cursor, callback) {
  return this._timeline('mentions', user, cursor, callback);
};

TBase.prototype.comments_timeline = function (user, cursor, callback) {
  return this._timeline('comments_timeline', user, cursor, callback, 'comment[]');
};

TBase.prototype.repost_timeline = function (user, cursor, callback) {
  return this._timeline('repost_timeline', user, cursor, callback);
};

TBase.prototype.comments = function (user, cursor, callback) {
  return this._timeline('comments', user, cursor, callback, 'comment[]');
};

/**
 * Comment
 */

TBase.prototype.comment_create = function (user, id, comment, callback) {
  comment.id = id;
  comment = this.convert_comment(comment);
  var params = {
    type: 'POST',
    playload: 'comment',
    user: user,
    data: comment,
    request_method: 'comment_create'
  };
  var url = this.config.comment_create;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.comment_reply = function (user, cid, id, comment, callback) {
  comment.id = id;
  comment.cid = cid;
  comment = this.convert_comment(comment);
  var params = {
    type: 'POST',
    playload: 'comment',
    user: user,
    data: comment,
    request_method: 'comment_reply'
  };
  var url = this.config.comment_reply;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.comment_destroy = function (user, cid, callback) {
  var params = {
    type: 'POST',
    playload: 'comment',
    user: user,
    data: {cid: cid},
    request_method: 'comment_destroy'
  };
  var url = this.config.comment_destroy;
  this.send_request(url, params, callback);
  return this;
};

