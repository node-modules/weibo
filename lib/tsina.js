
(function () {

var utils;
var OAuth;
var EventProxy;
var urllib;

var root = this; // window on browser

if (typeof require !== 'undefined') {
  var fs = require('fs');
  var path = require('path');
  OAuth = require('./oauth');
  urllib = require('./urllib');
  utils = require('./utils');
  EventProxy = require('../lib/eventproxy').EventProxy; // no need to coverage
} else {
  OAuth = weibo.OAuth;
  urllib = weibo.urllib;
  utils = weibo.utils;
  EventProxy = root.EventProxy;
}

var TSinaAPI = {
  config: {
    host: 'http://api.t.sina.com.cn',
    user_home_url: 'http://weibo.com/n/',
    search_url: 'http://weibo.com/k/',
    result_format: '.json',
    source: '',
    need_source: true,
    oauth_key: '',
    oauth_secret: '',
    oauth_callback: '',
    default_oauth_callback: 'oob',
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
    friends_timeline:     '/statuses/friends_timeline',
    comments_timeline:    '/statuses/comments_timeline',
    user_timeline:        '/statuses/user_timeline',
    mentions:             '/statuses/mentions',
    followers:            '/statuses/followers',
    friends:              '/statuses/friends',
    favorites:            '/favorites',
    favorites_create:     '/favorites/create',
    favorites_destroy:    '/favorites/destroy/{{id}}',
    counts:               '/statuses/counts',
    status_show:          '/statuses/show/{{id}}',
    update:               '/statuses/update',
    upload:               '/statuses/upload',
    repost:               '/statuses/repost',
    // repost:               '/statuses/retweet/{{id}}',
    repost_timeline:      '/statuses/repost_timeline',
    comment:              '/statuses/comment',
    reply:                '/statuses/reply',
    comment_destroy:      '/statuses/comment_destroy/{{id}}',
    comments:             '/statuses/comments',
    destroy:              '/statuses/destroy/{{id}}',
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
    emotions: '/emotions',
    emotion_types: [ { language: 'cnname'}, { language: 'twname' } ],
    
    // 用户标签
    tags:           '/tags',
    create_tag:         '/tags/create',
    destroy_tag:          '/tags/destroy',
    tags_suggestions:   '/tags/suggestions',
    
    // 搜索
    search:               '/statuses/search',
    user_search:          '/users/search',
    
    oauth_authorize:    '/oauth/authorize',
    oauth_request_token:  '/oauth/request_token',
    oauth_access_token:   '/oauth/access_token',
    
    // 图片上传字段名称
    pic_field: 'pic',
    
    ErrorCodes: {
      "40025:Error: repeated weibo text!": "重复发送",
      "40028:": "新浪微博接口内部错误",
      "40031:Error: target weibo does not exist!": "不存在的微博ID",
      "40015:Error: not your own comment!": "评论ID不在登录用户的comments_by_me列表中",
      "40303:Error: already followed": "已跟随"
    }
  },
    
  /**
   * 封装所有http请求，自动区分处理http和https
   * args: {
   *  data, 
   *  type: 'GET | POST | DELETE', 
   *  headers
   * }
   * callback.call(context, data, error, res || xhr)
   */

  request: function (url, args, callback, context) {
    if (args.play_load !== 'string') {
      args.data_type = 'json';
    }
    urllib.request(url, args, function (error, data, res) {
      if (args.play_load !== 'string') {
        if (error) {
          // create error, format error to {message: error message}
          error = this.format_error(error, res);
        } else if (data) {
          data = this.format_result(data, args.play_load, args);
        }
      }
      callback.call(context, error, data, res);
    }, this);
  },
    
  _send_request: function (params, callback, context) {
    var args = {
      type: 'GET', 
      play_load: 'status', 
      headers: {}
    };
    for (var k in params) {
      args[k] = params[k];
    }
    args.type = (args.type || 'GET').toUpperCase();
    args.data = args.data || {};
    if (!args.data.source) {
      if (args.need_source === false || this.config.need_source === false) {
        delete args.data.source;
      } else {
        args.data.source = this.config.source;
      }
    }

    var user = args.user || args.data.user || {};
    args.user = user;
    if (args.data && args.data.user) {
      delete args.data.user;
    }
 
    if (args.data.status) { 
      args.data.status = this.url_encode(args.data.status);
    }
    if (args.data.comment) {
      args.data.comment = this.url_encode(args.data.comment);
    }
    // 请求前调用
    this.before_send_request(args, user);
    var api = user.apiProxy || args.api_host || this.config.host;
     // console.log('api:' + this.config.host);
    var url = api + args.url.format(args.data);

    if (args.play_load !== 'string' && this.config.result_format) {
      url += this.config.result_format;
    }
    // 删除已经填充到url中的参数
    args.url.replace(utils.STRING_FORMAT_REGEX, function (match, key) {
      delete args.data[key];
    });
    // console.log(url, args, user)
    // 设置认证头部
    this.apply_auth(url, args, user);
    var callmethod = user.uniqueKey + ': ' + args.type + ' ' + args.url;
    if (args.type === 'POST') {
      args.headers['Content-Type'] = args.content_type || 'application/x-www-form-urlencoded;charset=UTF-8;';
    }
    this.request(url, args, callback, context);
  },
  
  // from google
  translate: function (text, target, callback) {
    var api = 'https://www.googleapis.com/language/translate/v2';
    if (!target || target === 'zh-CN' || target === 'zh-TW') {
      target = 'zh';
    }
    var params = {
      key: this.config.google_appkey, 
      target: target, 
      q: text
    };
    this.request(api, { data: params }, callback);
  },

  // 设置认证头
  // user: {username, password, authtype}
  // oauth 过程简介: 
  // 1. 使用app的token获取request token；
  // 2. 用户授权给此request token；
  // 3. 使用授权后的request token获取access token
  apply_auth: function (url, args, user) {
    if (!user) {
      return;
    }
    user.authtype = user.authtype || 'baseauth';
    args.headers = args.headers || {};
    if (user.authtype === 'baseauth') {
      if (user.username && user.password) {
        args.headers.Authorization = urllib.make_base_auth_header(user.username, user.password);
      }
    } else if (user.authtype === 'oauth' || user.authtype === 'xauth') {
      var accessor = {
        consumerSecret: this.config.oauth_secret
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
      message.parameters.oauth_consumer_key = this.config.oauth_key;
      message.parameters.oauth_version = '1.0';
      
      // 已通过oauth认证
      if (user.oauth_token_key) {
        message.parameters.oauth_token = user.oauth_token_key;
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
  
  format_authorization_url: function (params) {
    var login_url = (this.config.oauth_host || this.config.host) + this.config.oauth_authorize;
    return OAuth.addToURL(login_url, params);
  },
  
  // 获取认证url
  get_authorization_url: function (user, callback, context) {
    var auth_info = null;
    this.get_request_token(user, function (error, token) {
      if (token) {
        // 返回登录url给用户登录
        var params = { oauth_token: token.oauth_token };
        params.oauth_callback = user.oauth_callback || this.config.oauth_callback || this.config.default_oauth_callback;
        auth_info = {};
        auth_info.auth_url = this.format_authorization_url(params);
        auth_info.oauth_token_key = token.oauth_token;
        auth_info.oauth_token_secret = token.oauth_token_secret;
      }
      callback.call(context, error, auth_info);
    }, this);
  },

  get_request_token: function (user, callback, context) {
    if (user.authtype !== 'oauth') {
      user.authtype = 'oauth';
    }
    var params = {
      url: this.config.oauth_request_token,
      type: 'GET',
      user: user,
      play_load: 'string',
      api_host: this.config.oauth_host,
      data: {},
      need_source: false
    };
    // 若没有设置oauth_callback参数，则使用默认的参数
    params.data.oauth_callback = user.oauth_callback || this.config.oauth_callback || 
      this.config.default_oauth_callback;
    if (this.config.oauth_request_params) {
      utils.extend(params.data, this.config.oauth_request_params);
    }
    this._send_request(params, function (err, token_str, response) {
      var token = null;
      if (token_str) {
        token = utils.querystring.parse(token_str);
        if (!token.oauth_token) {
          token = null;
          if (!err) {
            err = new Error('Get request token error, ' + token_str);
            err.name = 'GetRequestTokenError';
          }
        }
      } else {
        if (!err) {
          err = new Error('Get request token error, empty token string');
          err.name = 'GetRequestTokenError';
        }
      }
      callback.call(context, err, token, response);
    });
  },
    
  // 必须设置user.oauth_pin 或 user.oauth_verifier
  get_access_token: function (user, callback, context) {
    if (!user.authtype) {
      user.authtype = 'oauth';
    }
    var params = {
      url: this.config.oauth_access_token,
      type: 'GET',
      user: user,
      play_load: 'string',
      api_host: this.config.oauth_host,
      data: {},
      need_source: false
    };
    var oauth_verifier = user.oauth_pin || user.oauth_verifier;
    if (oauth_verifier) {
      params.data.oauth_verifier = oauth_verifier;
      delete user.oauth_pin;
      delete user.oauth_verifier;
    }
    if (user.authtype === 'xauth') {
      params.data.x_auth_username = user.username;
      params.data.x_auth_password = user.password;
      params.data.x_auth_mode = "client_auth";
    }
    this._send_request(params, function (err, token_str) {
      var token = null;
      var message;
      if (token_str) {
        token = utils.querystring.parse(token_str);
        if(!token.oauth_token) {
          token = null;
          message = token.error_CN || token.error || token_str;
          err = new Error('Get access token error: ' + message);
        } else {
          user.oauth_token_key = token.oauth_token;
          user.oauth_token_secret = token.oauth_token_secret;
        }
      } else if (typeof err === 'string') {
        var error = utils.querystring.parse(err.message || err);
        message = error.message || error.error_CN || error.error || err;
        err = new Error(message);
      }
      if (err) {
        err.name = 'GetAccessTokenError';
        user = null;
      }
      callback.call(context, err, user);
    });
  },
    
  /*
  callback(data, textStatus, errorCode): 
  成功和错误都会调用的方法。
  如果失败则errorCode为服务器返回的错误代码(例如: 400)。
  */
  verify_credentials: function (user, callback, context) {
    var params = {
      url: this.config.verify_credentials,
      type: 'GET',
      user: user,
      play_load: 'user'
    };
    this._send_request(params, callback, context);
  },
        
  rate_limit_status: function (data, callback, context) {
    var params = {
      url: this.config.rate_limit_status,
      type: 'GET',
      play_load: 'rate',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // since_id, max_id, count, page 
  friends_timeline: function (data, callback, context) {
    var params = {
      url: this.config.friends_timeline,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // id, user_id, screen_name, since_id, max_id, count, page 
  user_timeline: function (data, callback, context) {
    var params = {
      url: this.config.user_timeline,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // id, count, page
  comments_timeline: function (data, callback, context) {
    var params = {
      url: this.config.comments_timeline,
      type: 'GET',
      play_load: 'comment',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // id, since_id, max_id, count, page
  repost_timeline: function (data, callback, context) {
    var params = {
      url: this.config.repost_timeline,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // since_id, max_id, count, page 
  mentions: function (data, callback, context){
    var params = {
      url: this.config.mentions,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id, user_id, screen_name, cursor, count
  followers: function (data, callback, context) {
    var params = {
      url: this.config.followers,
      type: 'GET',
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  public_timeline: function (data, callback, context) {
    var params = {
      url: this.config.public_timeline,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id, user_id, screen_name, cursor, count
  friends: function (data, callback, context) {
    var params = {
      url: this.config.friends,
      type: 'GET',
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // page
  favorites: function (data, callback, context) {
    var params = {
      url: this.config.favorites,
      type: 'GET',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  favorites_create: function (data, callback, context) {
    var params = {
      url: this.config.favorites_create,
      type: 'POST',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  favorites_destroy: function (data, callback, context) {
    var params = {
      url: this.config.favorites_destroy,
      type: 'POST',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // ids
  counts: function (data, callback, context) {
    var params = {
      url: this.config.counts,
      type: 'GET',
      play_load: 'count',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  user_show: function (data, callback, context) {
    var params = {
      url: this.config.user_show,
      type: 'GET',
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

    // since_id, max_id, count, page 
  direct_messages: function (data, callback, context) {
    var params = {
      url: this.config.direct_messages,
      type: 'GET',
      play_load: 'message',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  destroy_msg: function (data, callback, context) {
    var params = {
      url: this.config.destroy_msg,
      type: 'POST',
      play_load: 'message',
      data: data
    };
    this._send_request(params, callback, context);
  },

  /*data的参数列表：
  content 待发送消息的正文，请确定必要时需要进行URL编码 ( encode ) ，另外，不超过140英文或140汉字。
  message 必须 0 表示悄悄话 1 表示戳一下
  receiveUserId 必须，接收方的用户id
  source 可选，显示在网站上的来自哪里对应的标识符。如果想显示指定的字符，请与官方人员联系。
  */
  new_message: function (data, callback, context) {
    var params = {
      url: this.config.new_message,
      type: 'POST',
      play_load: 'message',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // id
  status_show: function (data, callback, context) {
    var params = {
      url: this.config.status_show,
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },
    
  // 格式上传参数，方便子类覆盖做特殊处理
  // 子类可以增加自己的参数
  format_upload_params: function (user, data, pic) {
    
  },
  
  FILE_CONTENT_TYPES: {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png'
  },
    
  fileinfo: function (file) {
    var name, content_type;
    if (typeof file === 'string') {
      var ext = path.extname(file);
      content_type = this.FILE_CONTENT_TYPES[ext];
      name = path.basename(file);
    } else {
      name = file.name || file.fileName;
      content_type = file.fileType || file.type;
    }
    return { name: name, content_type: content_type };
  },
    
  /** 
   * 上传图片
   * data: {user: user1, source: xxx, status: xxx, ...}
   * pic: filepath
   * callback: finish callback function
   **/
  upload: function(data, pic, callback, context) {
    var user = data.user;
    delete data.user;
    var auth_args = { type: 'post', data: {}, headers: {} };
    var pic_field = this.config.pic_field || 'pic';
    data.source = data.source || this.config.source;
    
    var boundary = 'boundary' + new Date().getTime();
    this.format_upload_params(user, data, pic , boundary);
    var dashdash = '--';
    var crlf = '\r\n';

    /* Build RFC2388 string. */
    var builder = '';

    builder += dashdash;
    builder += boundary;
    builder += crlf;

    var key;
    for (key in data) {
      var value = this.url_encode(data[key]);
      auth_args.data[key] = value;
    }
    
    var api = user.apiProxy || this.config.host;
    var url = api + this.config.upload + this.config.result_format;
  
    var fileinfo = this.fileinfo(pic);    
  
    //auth_args.data.format = 'json';
    //auth_args.data.Filename = this.url_encode(fileinfo.name);
    //auth_args.data.Upload = this.url_encode('Sumbit');
     
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
   
    builder += '; filename="' + this.url_encode(fileinfo.name) + '"';
    builder += crlf;

    builder += 'Content-Type: '+ fileinfo.content_type + ';'; 
    builder += crlf;
    builder += crlf;
    
  //  console.log(builder);
    var that = this;
    // 处理文件内容
    this.read_file(pic, function (file_buffer) {
      var endstr = crlf + dashdash + boundary + dashdash +  crlf;
      var buffer = null;
      if (typeof BlobBuilder === 'undefined') {
        var builderLength = new Buffer(builder).length;
        var size = builderLength + file_buffer.length + endstr.length;
        buffer = new Buffer(size);
        var offset = 0;
        buffer.write(builder);
        offset += builderLength ;
        file_buffer.copy(buffer, offset);
        offset += file_buffer.length;
        buffer.write(endstr, offset);
      } else {
        buffer = new BlobBuilder(); //NOTE WebKitBlogBuilder
        buffer.append(builder);
        buffer.append(pic);
        buffer.append(endstr);
        buffer = buffer.getBlob();
      }
      
      auth_args.headers['Content-Type'] = 'multipart/form-data;boundary=' + boundary;

      that.request(url, {
        type: 'POST', 
        play_load: 'status', 
        data: buffer, 
        process_data: false,
        headers: auth_args.headers
      }, callback, context);
    });
  },
    
  read_file: function (pic, callback) {
    if (typeof pic === 'string') {
      fs.stat(pic, function (err, stats) {
        fs.readFile(pic, function (err, file_buffer) {
          if (!err) {
            callback(file_buffer);
          }
        });
      });
    } else {
      callback(pic);
    }
  },

  update: function (data, callback, context) {
    var params = {
      url: this.config.update,
      type: 'POST',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  repost: function (data, callback, context) {
    var params = {
      url: this.config.repost,
      type: 'POST',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },

  comment: function (data, callback, context) {
    var params = {
      url: this.config.comment,
      type: 'POST',
      play_load: 'comment',
      data: data
    };
    this._send_request(params, callback, context);
  },

  reply: function (data, callback, context) {
    var params = {
      url: this.config.reply,
      type: 'POST',
      play_load: 'comment',
      data: data
    };
    this._send_request(params, callback, context);
  },

  comments: function (data, callback, context) {
    var params = {
      url: this.config.comments,
      type: 'GET',
      play_load: 'comment',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  comment_destroy: function (data, callback, context) {
    var params = {
      url: this.config.comment_destroy,
      type: 'POST',
      play_load: 'comment',
      data: data
    };
    this._send_request(params, callback, context);
  },

  friendships_create: function (data, callback, context) {
    var params = {
      url: this.config.friendships_create,
      type: 'POST',
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  friendships_destroy: function (data, callback, context) {
    var params = {
      url: this.config.friendships_destroy,
      type: 'POST',
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

  friendships_show: function (data, callback, context) {
    var params = {
      url: this.config.friendships_show,
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // type
  reset_count: function (data, callback, context) {
    var params = {
      url: this.config.reset_count,
      type: 'POST',
      play_load: 'result',
      data: data
    };
    this._send_request(params, callback, context);
  },
    
  // user_id, count, page
  tags: function (data, callback, context) {
    var params = {
      url: this.config.tags,
      play_load: 'tag',
      data: data
    };
    this._send_request(params, callback, context);
  },
    
  // count, page
  tags_suggestions: function (data, callback, context) {
    var params = {
      url: this.config.tags_suggestions,
      play_load: 'tag',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // tags
  create_tag: function (data, callback, context) {
    var params = {
      url: this.config.create_tag,
      type: 'POST',
      play_load: 'tag',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // tag_id
  destroy_tag: function (data, callback, context) {
    var params = {
      url: this.config.destroy_tag,
      type: 'POST',
      play_load: 'tag',
      data: data
    };
    this._send_request(params, callback, context);
  },

  // id
  destroy: function (data, callback, context) {
    if (!data || !data.id) {
      return;
    }
    var params = {
      url: this.config.destroy,
      type: 'POST',
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // q, max_id, count
  search: function (data, callback, context) {
    var params = {
      url: this.config.search,
      play_load: 'status',
      data: data
    };
    this._send_request(params, callback, context);
  },
  
  // q, page, count
  user_search: function (data, callback, context) {
    var params = {
      url: this.config.user_search,
      play_load: 'user',
      data: data
    };
    this._send_request(params, callback, context);
  },

  /**
   * List all emotions.
   * 
   * @param {Object} user
   * @param {Function(err, emotions)} callback
   *  - {Object} emotions: {
   *    '[哈哈]': {
   *      url: "http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/41/zz2_org.gif",
   *      type: "face",
   *      title: "哈哈",
   *    },
   *    ...
   *  }
   * @param {Object} context, callback context
   * @return this
   */
  emotions: function (user, callback, context) {
    // http://api.t.sina.com.cn/emotions.json?&source=3538199806&language=cnname
    // http://api.t.sina.com.cn/emotions.json?&source=3538199806&language=twname
    
    var ep = EventProxy.create();
    ep.after('emotions', this.config.emotion_types.length, function (datas) {
      var emotions = {};
      for (var i = 0, l = datas.length; i < l; i++) {
        var items = datas[i];
        if (!items) {
          continue;
        }
        for (var j = 0, jl = items.length; j < jl; j++) {
          var emotion = items[j];
          emotions[emotion.phrase] = emotion;
        }
      }
      callback.call(this, null, emotions);
    });
    ep.once('error', function (err) {
      ep.unbind();
      callback.call(this, err);
    });
    var that = this;
    that.config.emotion_types.forEach(function (args) {
      var data = {
        user: user
      };
      for (var k in args) {
        data[k] = args[k];
      }
      var params = {
        url: that.config.emotions,
        play_load: 'emotion',
        need_source: true,
        data: data
      };
      that._send_request(params, function (err, emotions) {
        if (err) {
          return ep.emit('error', err);
        }
        ep.emit('emotions', emotions);
      });
    });
    return this;
  },
    
  format_error: function (error) {
    if (error instanceof Error) {
      return error;
    }
    try {
      error = JSON.parse(error);
      if (!error.message) {
        error.message = error.error_CN || error.error;
      }
    } catch (err) {
      err.data = error;
      error = err;
    }
    return error;
  },
    
  // 格式化数据格式，其他微博实现兼容新浪微博的数据格式
  // play_load: status, user, comment, message, count, result(reset_count)
  // args: request arguments
  format_result: function (data, play_load, args) {
    if (data.error) {
      return data;
    }
    var items = data.results || data.users || data;
    if (items instanceof Array) {
      for (var i = 0, l = items.length; i < l; i++) {
        items[i] = this.format_result_item(items[i], play_load, args);
      }
    } else {
      data = this.format_result_item(data, play_load, args);
    }
    if (args.url === this.config.search && data.next_page) {
      // "next_page":"?page=2&max_id=1291867917&q=fawave", 提取max_id
      var qs = data.next_page.substring(url.indexOf('?') + 1);
      var p = utils.querystring.parse(qs);
      data.max_id = p.max_id;
    }
    return data;
  },
  
  format_result_item: function (data, play_load, args) {
    if (!data) {
      return data;
    }
    var method = 'format_' + play_load;
    if (typeof this[method] === 'function') {
      var item = this[method](data, args);
      if (item) {
        return item;
      }
    }
    return data;
  },

  format_status: function (status, args) {
    if (!status.user && status.from_user) { // search data
      status.user = {
        screen_name: status.from_user,
        profile_image_url: status.profile_image_url,
        id: status.from_user_id
      };
      delete status.profile_image_url;
      delete status.from_user;
      delete status.from_user_id;
    }
    if (status.user) {
      status.user = this.format_user(status.user, args);
    }
    
    if (status.retweeted_status) {
      status.retweeted_status = this.format_status(status.retweeted_status, args);
    }
    if (status.user) {
      status.t_url = 'http://weibo.com/' + status.user.id + '/' + WeiboUtil.mid2url(status.mid);
    }
    return status;
  },

  format_user: function (user, args) {
    user.t_url = 'http://weibo.com/' + (user.domain || user.id);
    if (user.status) {
      user.status = this.format_status(user.status, args);
      if (!user.status.t_url) {
        user.status.t_url = 'http://weibo.com/' + user.id + '/' + WeiboUtil.mid2url(user.status.mid || ser.status.id);
      }
    }
    return user;
  },

  format_comment: function (comment, args) {
    this.format_user(comment.user, args);
    this.format_status(comment.status, args);
    return comment;
  },

  format_message: function (message, args) {
    this.format_user(message.sender, args);
    this.format_user(message.recipient, args);
    return message;
  },

  format_emotion: function (emotion, args) {
    emotion.title = emotion.phrase.substring(1, emotion.phrase.length - 1);
    return emotion;
  },

  URL_RE: new RegExp('(?:\\[url\\s*=\\s*|)((?:www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+~]+)(?:\\](.+)\\[/url\\]|)', 'ig'),
  /**
   * format status.text to display
   */
  process_text: function (str_or_status, need_encode) {
    var str = str_or_status;
    if (need_encode === 'undedfined') {
        need_encode = true;
    }
    if (str_or_status.text !== undefined) {
        str = str_or_status.text;
    }
    if (str) {
      if (need_encode) {
        str = utils.htmlencode(str);
      }
      str = str.replace(this.URL_RE, this._replace_url_callback);
      str = this.process_at(str, str_or_status); //@***
      str = this.process_emotional(str); 
      str = this.process_search(str); //#xxXX#
      // iPhone emoji
      str = str.replace( /([\uE001-\uE537])/gi, this._get_iphone_emoji);
    }
    return str || '&nbsp;';
  },
  _replace_url_callback: function (m, g1, g2) {
    var _url = g1;
    if (g1.indexOf('http') !== 0) {
      _url = 'http://' + g1;
    }
    return '<a target="_blank" class="link" href="{{url}}">{{value}}</a>'.format({
      url: _url, title: g1, value: g2||g1
    });
  },

  _get_iphone_emoji: function (str) {
    return "<span class=\"iphoneEmoji "+ str.charCodeAt(0).toString(16).toUpperCase()+"\"></span>";
  },

  SEARCH_MATCH_RE: /#([^#]+)#/g,
  SEARCH_TPL: '<a target="_blank" href="{{search_url}}{{search}}" title="Search #{{search}}">#{{search}}#</a>',
  
  process_search: function (str) {
    var that = this;
    return str.replace(this.SEARCH_MATCH_RE, function (m, g1) {
      return that._process_search_callback(m, g1);
    });
  },

  _process_search_callback: function (m, g1) {
    // 修复#xxx@xxx#嵌套问题
    // var search = g1.remove_html_tag();
    return this.SEARCH_TPL.format({ search: g1, search_url: this.config.search_url });
  },

  format_search_text: function (str) { // 格式化主题
    return '#' + str.trim() + '#';
  },

  AT_RE: /@([\w\-\_\u2E80-\u3000\u303F-\u9FFF]+)/g,
  process_at: function (str) { 
    //@*** u4e00-\u9fa5:中文字符 \u2E80-\u9FFF:中日韩字符
    //【观点·@任志强】今年提出的1000万套的保障房任务可能根本完不成
    // http://blog.oasisfeng.com/2006/10/19/full-cjk-unicode-range/
    // CJK标点符号：3000-303F
    var tpl = '<a class="at_user" data-name="$1" href="javascript:;" rhref="' + 
      this.config.user_home_url + '$1" title="show users">@$1</a>';
    return str.replace(this.AT_RE, tpl);
  },

  process_emotional: function (str) {
    var that = this;
    return str.replace(/\[([\u4e00-\u9fff,\uff1f,\w]{1,4})\]/g, function (m, g1) {
      return that._replace_emotional_callback(m, g1);
    });
  },

  EMOTIONAL_TPL: '<img title="{{title}}" src="{{src}}" />',
  _replace_emotional_callback: function (m, g1) {
    if (g1) {
      var face = this.EMOTIONS[g1];
      if (face) {
        return this.EMOTIONAL_TPL.format({ title: m, src: FACE_URL_PRE + face });
      }
    }
    return m;
  },
  
  /**
   * urlencode，子类覆盖是否需要urlencode处理
   * 
   * @param text
   * @returns {String} url encode text
   */
  url_encode: function (text) {
    return encodeURIComponent(text);
  },
    
  /**
   * when you do something before request, override this method
   */ 
  before_send_request: function (args, user) {
    
  }

};


/**
 * 新浪微博mid与url互转实用工具
 * 作者: XiNGRZ (http://weibo.com/xingrz)
 */

var WeiboUtil = {
    // 62进制字典
    str62keys: [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
    ],
};

/**
 * 62进制值转换为10进制
 * @param {String} str62 62进制值
 * @return {String} 10进制值
 */
WeiboUtil.str62to10 = function (str62) {
  var i10 = 0;
  for (var i = 0; i < str62.length; i++) {
    var n = str62.length - i - 1;
    var s = str62[i];
    i10 += this.str62keys.indexOf(s) * Math.pow(62, n);
  }
  return i10;
};

/**
 * 10进制值转换为62进制
 * @param {String} int10 10进制值
 * @return {String} 62进制值
 */
WeiboUtil.int10to62 = function (int10) {
  var s62 = '';
  var r = 0;
  while (int10 !== 0 && s62.length < 100) {
    r = int10 % 62;
    s62 = this.str62keys[r] + s62;
    int10 = Math.floor(int10 / 62);
  }
  return s62;
};

/**
 * URL字符转换为mid
 * @param {String} url 微博URL字符，如 "wr4mOFqpbO"
 * @return {String} 微博mid，如 "201110410216293360"
 */
WeiboUtil.url2mid = function (url) {
  var mid = '';
  //从最后往前以4字节为一组读取URL字符
  for (var i = url.length - 4; i > -4; i = i - 4) {
    var offset1 = i < 0 ? 0 : i;
    var offset2 = i + 4;
    var str = url.substring(offset1, offset2);
    
    str = this.str62to10(str);
    if (offset1 > 0) {
      //若不是第一组，则不足7位补0
      while (str.length < 7) {
        str = '0' + str;
      }
    }
    
    mid = str + mid;
  }
  
  return mid;
};

/**
 * mid转换为URL字符
 * @param {String} mid 微博mid，如 "201110410216293360"
 * @return {String} 微博URL字符，如 "wr4mOFqpbO"
 */
WeiboUtil.mid2url = function (mid) {
  if (!mid) {
      return mid;
  }
  mid = String(mid); //mid数值较大，必须为字符串！
  if (!/^\d+$/.test(mid)) { return mid; }
  var url = '';
  // 从最后往前以7字节为一组读取mid
  for (var i = mid.length - 7; i > -7; i = i - 7) {
    var offset1 = i < 0 ? 0 : i;
    var offset2 = i + 7;
    var num = mid.substring(offset1, offset2);
    
    num = this.int10to62(num);
    url = num + url;
  }
  return url;
};


//新浪微博表情转化
var FACE_URL_PRE = TSinaAPI.FACE_URL_PRE = 'http://timg.sjs.sinajs.cn/t3/style/images/common/face/ext/normal/';
var FACE_TPL = TSinaAPI.FACE_TPL = '[{{name}}]';
var FACES = TSinaAPI.FACES = {
  "呵呵": "eb/smile.gif",
  "嘻嘻": "c2/tooth.gif",
  "哈哈": "6a/laugh.gif",
  "爱你": "7e/love.gif",
  "晕": "a4/dizzy.gif",
  "泪": "d8/sad.gif",
  "馋嘴": "b8/cz_thumb.gif",
  "抓狂": "4d/crazy.gif",
  "哼": "19/hate.gif",
  "可爱": "9c/tz_thumb.gif",
  "怒": "57/angry.gif",
  "汗": "13/sweat.gif",
  "困": "8b/sleepy.gif",
  "害羞": "05/shame_thumb.gif",
  "睡觉": "7d/sleep_thumb.gif",
  "钱": "90/money_thumb.gif",
  "偷笑": "7e/hei_thumb.gif",
  "酷": "40/cool_thumb.gif",
  "衰": "af/cry.gif",
  "吃惊": "f4/cj_thumb.gif",
  "闭嘴": "29/bz_thumb.gif",
  "鄙视": "71/bs2_thumb.gif",
  "挖鼻屎": "b6/kbs_thumb.gif",
  "花心": "64/hs_thumb.gif",
  "鼓掌": "1b/gz_thumb.gif",
  "失望": "0c/sw_thumb.gif",
  "思考": "e9/sk_thumb.gif",
  "生病": "b6/sb_thumb.gif",
  "亲亲": "8f/qq_thumb.gif",
  "怒骂": "89/nm_thumb.gif",
  "太开心": "58/mb_thumb.gif",
  "懒得理你": "17/ldln_thumb.gif",
  "右哼哼": "98/yhh_thumb.gif",
  "左哼哼": "6d/zhh_thumb.gif",
  "嘘": "a6/x_thumb.gif",
  "委屈": "73/wq_thumb.gif",
  "吐": "9e/t_thumb.gif",
  "可怜": "af/kl_thumb.gif",
  "打哈气": "f3/k_thumb.gif",
  "做鬼脸": "88/zgl_thumb.gif",
  "握手": "0c/ws_thumb.gif",
  "耶": "d9/ye_thumb.gif",
  "good": "d8/good_thumb.gif",
  "弱": "d8/sad_thumb.gif",
  "不要": "c7/no_thumb.gif",
  "ok": "d6/ok_thumb.gif",
  "赞": "d0/z2_thumb.gif",
  "来": "40/come_thumb.gif",
  "蛋糕": "6a/cake.gif",
  "心": "6d/heart.gif",
  "伤心": "ea/unheart.gif",
  "钟": "d3/clock_thumb.gif",
  "猪头": "58/pig.gif",
  "咖啡": "64/cafe_thumb.gif",
  "话筒": "1b/m_thumb.gif",
  "干杯": "bd/cheer.gif",
  "绿丝带": "b8/green.gif",
  "蜡烛": "cc/candle.gif",
  "微风": "a5/wind_thumb.gif",
  "月亮": "b9/moon.gif",
  "月饼": "96/mooncake3_thumb.gif",
  "满月": "5d/moon1_thumb.gif",
  "酒壶": "64/wine_thumb.gif",
  "团": "11/tuan_thumb.gif",
  "圆": "53/yuan_thumb.gif",
  "左抱抱": "54/left_thumb.gif",
  "右抱抱": "0d/right_thumb.gif",
  "乐乐": "66/guanbuzhao_thumb.gif",
  "团圆月饼": "e6/tuanyuan_thumb.gif",
  "快快": "49/lbq1_thumb.gif",
  "织": "41/zz2_thumb.gif",
  "围观": "f2/wg_thumb.gif",
  "威武": "70/vw_thumb.gif",
  "爱心专递": "c9/axcd_thumb.gif",
  "奥特曼": "bc/otm_thumb.gif",
  //亚运
  "国旗": "dc/flag_thumb.gif",
  "金牌": "f4/jinpai_thumb.gif",
  "银牌": "1e/yinpai_thumb.gif",
  "铜牌": "26/tongpai_thumb.gif",
  "围脖": "3f/weijin_thumb.gif",
  "温暖帽子": "f1/wennuanmaozi_thumb.gif",
  "手套": "72/shoutao_thumb.gif",
  "落叶": "79/yellowMood_thumb.gif",
  "照相机": "33/camera_thumb.gif",
  "白云": "ff/y3_thumb.gif",
  "礼物": "c4/liwu_thumb.gif",
  "v5": "c5/v5_org.gif",
  "书呆子": "61/sdz_org.gif"
};

// http://api.t.sina.com.cn/emotions.json
TSinaAPI.EMOTIONS = {
  "呵呵": "eb/smile.gif", "嘻嘻": "c2/tooth.gif", "哈哈": "6a/laugh.gif", "爱你": "7e/love.gif", "晕": "a4/dizzy.gif", "泪": "d8/sad.gif", "馋嘴": "b8/cz_org.gif", "抓狂": "4d/crazy.gif", "哼": "19/hate.gif", "可爱": "9c/tz_org.gif", "怒": "57/angry.gif", "汗": "13/sweat.gif", "困": "8b/sleepy.gif", "害羞": "05/shame_org.gif", "睡觉": "7d/sleep_org.gif", "钱": "90/money_org.gif", "偷笑": "7e/hei_org.gif", "酷": "40/cool_org.gif", "衰": "af/cry.gif", "吃惊": "f4/cj_org.gif", "闭嘴": "29/bz_org.gif", "鄙视": "71/bs2_org.gif", "挖鼻屎": "b6/kbs_org.gif", "花心": "64/hs_org.gif", "鼓掌": "1b/gz_org.gif", "失望": "0c/sw_org.gif", "思考": "e9/sk_org.gif", "生病": "b6/sb_org.gif", "亲亲": "8f/qq_org.gif", "怒骂": "89/nm_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "嘘": "a6/x_org.gif", "委屈": "73/wq_org.gif", "吐": "9e/t_org.gif", "可怜": "af/kl_org.gif", "打哈气": "f3/k_org.gif", "顶": "91/d_org.gif", "疑问": "5c/yw_org.gif", "做鬼脸": "88/zgl_org.gif", "握手": "0c/ws_org.gif", "耶": "d9/ye_org.gif", "good": "d8/good_org.gif", "弱": "d8/sad_org.gif", "不要": "c7/no_org.gif", "ok": "d6/ok_org.gif", "赞": "d0/z2_org.gif", "来": "40/come_org.gif", "蛋糕": "6a/cake.gif", "心": "6d/heart.gif", "伤心": "ea/unheart.gif", "钟": "d3/clock_org.gif", "猪头": "58/pig.gif", "咖啡": "64/cafe_org.gif", "话筒": "1b/m_org.gif", "月亮": "b9/moon.gif", "太阳": "e5/sun.gif", "干杯": "bd/cheer.gif", "微风": "a5/wind_org.gif", "飞机": "6d/travel_org.gif", "兔子": "81/rabbit_org.gif", "熊猫": "6e/panda_org.gif", "给力": "c9/geili_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "织": "41/zz2_org.gif", "围观": "f2/wg_org.gif", "威武": "70/vw_org.gif", "奥特曼": "bc/otm_org.gif", "实习": "48/sx_org.gif", "自行车": "46/zxc_org.gif", "照相机": "33/camera_org.gif", "叶子": "b8/green_org.gif", "春暖花开": "ca/chunnuanhuakai_org.gif", "咆哮": "4b/paoxiao_org.gif", "彩虹": "03/ch_org.gif", "沙尘暴": "69/sc_org.gif", "地球一小时": "4f/diqiuxiuxiyixiaoshi_org.gif", "爱心传递": "c9/axcd_org.gif", "蜡烛": "cc/candle.gif", "绿丝带": "b8/green.gif", "挤眼": "c3/zy_org.gif", "亲亲": "8f/qq_org.gif", "怒骂": "89/nm_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "打哈气": "f3/k_org.gif", "生病": "b6/sb_org.gif", "书呆子": "61/sdz_org.gif", "失望": "0c/sw_org.gif", "可怜": "af/kl_org.gif", "挖鼻屎": "b6/kbs_org.gif", "黑线": "91/h_org.gif", "花心": "64/hs_org.gif", "可爱": "9c/tz_org.gif", "吐": "9e/t_org.gif", "委屈": "73/wq_org.gif", "思考": "e9/sk_org.gif", "哈哈": "6a/laugh.gif", "嘘": "a6/x_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "疑问": "5c/yw_org.gif", "阴险": "6d/yx_org.gif", "做鬼脸": "88/zgl_org.gif", "爱你": "7e/love.gif", "馋嘴": "b8/cz_org.gif", "顶": "91/d_org.gif", "钱": "90/money_org.gif", "嘻嘻": "c2/tooth.gif", "汗": "13/sweat.gif", "呵呵": "eb/smile.gif", "睡觉": "7d/sleep_org.gif", "困": "8b/sleepy.gif", "害羞": "05/shame_org.gif", "悲伤": "1a/bs_org.gif", "鄙视": "71/bs2_org.gif", "抱抱": "7c/bb_org.gif", "拜拜": "70/88_org.gif", "怒": "57/angry.gif", "吃惊": "f4/cj_org.gif", "闭嘴": "29/bz_org.gif", "泪": "d8/sad.gif", "偷笑": "7e/hei_org.gif", "哼": "19/hate.gif", "晕": "a4/dizzy.gif", "衰": "af/cry.gif", "抓狂": "4d/crazy.gif", "愤怒": "bd/fn_org.gif", "感冒": "a0/gm_org.gif", "鼓掌": "1b/gz_org.gif", "酷": "40/cool_org.gif", "来": "40/come_org.gif", "good": "d8/good_org.gif", "haha": "13/ha_org.gif", "不要": "c7/no_org.gif", "ok": "d6/ok_org.gif", "拳头": "cc/o_org.gif", "弱": "d8/sad_org.gif", "握手": "0c/ws_org.gif", "赞": "d0/z2_org.gif", "耶": "d9/ye_org.gif", "最差": "3e/bad_org.gif", "右抱抱": "0d/right_org.gif", "左抱抱": "54/left_org.gif", "粉红丝带": "77/pink_org.gif", "爱心传递": "c9/axcd_org.gif", "心": "6d/heart.gif", "绿丝带": "b8/green.gif", "蜡烛": "cc/candle.gif", "围脖": "3f/weijin_org.gif", "温暖帽子": "f1/wennuanmaozi_org.gif", "手套": "72/shoutao_org.gif", "红包": "71/hongbao_org.gif", "喜": "bf/xi_org.gif", "礼物": "c4/liwu_org.gif", "蛋糕": "6a/cake.gif", "钻戒": "31/r_org.gif", "钻石": "9f/diamond_org.gif", "大巴": "9c/dynamicbus_org.gif", "飞机": "6d/travel_org.gif", "自行车": "46/zxc_org.gif", "汽车": "a4/jc_org.gif", "手机": "4b/sj2_org.gif", "照相机": "33/camera_org.gif", "药": "5d/y_org.gif", "电脑": "df/dn_org.gif", "手纸": "55/sz_org.gif", "落叶": "79/yellowMood_org.gif", "圣诞树": "a2/christree_org.gif", "圣诞帽": "06/chrishat_org.gif", "圣诞老人": "c5/chrisfather_org.gif", "圣诞铃铛": "64/chrisbell_org.gif", "圣诞袜": "08/chrisocks_org.gif", "图片": "ce/tupianimage_org.gif", "六芒星": "c2/liumangxing_org.gif", "地球一小时": "4f/diqiuxiuxiyixiaoshi_org.gif", "植树节": "56/zhishujie_org.gif", "粉蛋糕": "bf/nycake_org.gif", "糖果": "34/candy_org.gif", "万圣节": "73/nanguatou2_org.gif", "火炬": "3b/hj_org.gif", "酒壶": "64/wine_org.gif", "月饼": "96/mooncake3_org.gif", "满月": "5d/moon1_org.gif", "巧克力": "b1/qkl_org.gif", "脚印": "12/jy_org.gif", "酒": "39/j2_org.gif", "狗": "5d/g_org.gif", "工作": "b2/gz3_org.gif", "档案": "ce/gz2_org.gif", "叶子": "b8/green_org.gif", "钢琴": "b2/gq_org.gif", "印迹": "84/foot_org.gif", "钟": "d3/clock_org.gif", "茶": "a8/cha_org.gif", "西瓜": "6b/watermelon.gif", "雨伞": "33/umb_org.gif", "电视机": "b3/tv_org.gif", "电话": "9d/tel_org.gif", "太阳": "e5/sun.gif", "星": "0b/star_org.gif", "哨子": "a0/shao.gif", "话筒": "1b/m_org.gif", "音乐": "d0/music_org.gif", "电影": "77/movie_org.gif", "月亮": "b9/moon.gif", "唱歌": "79/ktv_org.gif", "冰棍": "3a/ice.gif", "房子": "d1/house_org.gif", "帽子": "25/hat_org.gif", "足球": "c0/football.gif", "鲜花": "6c/flower_org.gif", "花": "6c/flower.gif", "风扇": "92/fan.gif", "干杯": "bd/cheer.gif", "咖啡": "64/cafe_org.gif", "兔子": "81/rabbit_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "给力": "c9/geili_org.gif", "萌": "42/kawayi_org.gif", "鸭梨": "bb/pear_org.gif", "熊猫": "6e/panda_org.gif", "互粉": "89/hufen_org.gif", "织": "41/zz2_org.gif", "围观": "f2/wg_org.gif", "扔鸡蛋": "91/rjd_org.gif", "奥特曼": "bc/otm_org.gif", "威武": "70/vw_org.gif", "伤心": "ea/unheart.gif", "热吻": "60/rw_org.gif", "囧": "15/j_org.gif", "orz": "c0/orz1_org.gif", "宅": "d7/z_org.gif", "小丑": "6b/xc_org.gif", "帅": "36/s2_org.gif", "猪头": "58/pig.gif", "实习": "48/sx_org.gif", "骷髅": "bd/kl2_org.gif", "便便": "34/s_org.gif", "雪人": "d9/xx2_org.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "跳舞花": "70/twh_org.gif", "礼花": "3d/bingo_org.gif", "打针": "b0/zt_org.gif", "叹号": "3b/th_org.gif", "问号": "9d/wh_org.gif", "句号": "9b/jh_org.gif", "逗号": "cc/dh_org.gif", "1": "9b/1_org.gif", "2": "2c/2_org.gif", "3": "f3/3_org.gif", "4": "2c/4_org.gif", "5": "d5/5_org.gif", "6": "dc/6_org.gif", "7": "43/7_org.gif", "8": "6d/8_org.gif", "9": "26/9_org.gif", "0": "d8/ling_org.gif", "闪": "ce/03_org.gif", "啦啦": "c1/04_org.gif", "吼吼": "34/05_org.gif", "庆祝": "67/06_org.gif", "嘿": "d3/01_org.gif", "省略号": "0d/shengluehao_org.gif", "kiss": "59/kiss2_org.gif", "圆": "53/yuan_org.gif", "团": "11/tuan_org.gif", "团圆月饼": "e6/tuanyuan_org.gif", "欢欢": "c3/liaobuqi_org.gif", "乐乐": "66/guanbuzhao_org.gif", "管不着爱": "78/2guanbuzhao1_org.gif", "爱": "09/ai_org.gif", "了不起爱": "11/2liaobuqiai_org.gif", "有点困": "68/youdiankun_org.gif", "yes": "9e/yes_org.gif", "咽回去了": "72/yanhuiqule_org.gif", "鸭梨很大": "01/yalihenda_org.gif", "羞羞": "42/xiuxiu_org.gif", "喜欢你": "6b/xihuang_org.gif", "小便屁": "a0/xiaobianpi_org.gif", "无奈": "d6/wunai22_org.gif", "兔兔": "da/tutu_org.gif", "吐舌头": "98/tushetou_org.gif", "头晕": "48/touyun_org.gif", "听音乐": "d3/tingyinyue_org.gif", "睡大觉": "65/shuijiao_org.gif", "闪闪紫": "9e/shanshanzi_org.gif", "闪闪绿": "a8/shanshanlu_org.gif", "闪闪灰": "1e/shanshanhui_org.gif", "闪闪红": "10/shanshanhong_org.gif", "闪闪粉": "9d/shanshanfen_org.gif", "咆哮": "4b/paoxiao_org.gif", "摸头": "2c/motou_org.gif", "真美好": "d2/meihao_org.gif", "脸红自爆": "d8/lianhongzibao_org.gif", "哭泣女": "1c/kuqinv_org.gif", "哭泣男": "38/kuqinan_org.gif", "空": "fd/kong_org.gif", "尽情玩": "9f/jinqingwan_org.gif", "惊喜": "b8/jingxi_org.gif", "惊呆": "58/jingdai_org.gif", "胡萝卜": "e1/huluobo_org.gif", "欢腾去爱": "63/huangtengquai_org.gif", "感冒了": "67/ganmao_org.gif", "怒了": "ef/fennu_org.gif", "我要奋斗": "a6/fendou123_org.gif", "发芽": "95/faya_org.gif", "春暖花开": "ca/chunnuanhuakai_org.gif", "抽烟": "83/chouyan_org.gif", "昂": "31/ang_org.gif", "啊": "12/aa_org.gif", "自插双目": "d3/zichashuangmu_org.gif", "咦": "9f/yiwen_org.gif", "嘘嘘": "cf/xu_org.gif", "我吃": "00/wochiwode_org.gif", "喵呜": "a7/weiqu_org.gif", "v5": "c5/v5_org.gif", "调戏": "f7/tiaoxi_org.gif", "打牙": "d7/taihaoxiaole_org.gif", "手贱": "b8/shoujian_org.gif", "色": "a1/se_org.gif", "喷": "4a/pen_org.gif", "你懂的": "2e/nidongde_org.gif", "喵": "a0/miaomiao_org.gif", "美味": "c1/meiwei_org.gif", "惊恐": "46/jingkong_org.gif", "感动": "7c/gandong_org.gif", "放开": "55/fangkai_org.gif", "痴呆": "e8/chidai_org.gif", "扯脸": "99/chelian_org.gif", "不知所措": "ab/buzhisuocuo_org.gif", "白眼": "24/baiyan_org.gif", "猥琐": "e1/weisuo_org.gif", "挑眉": "c9/tiaomei_org.gif", "挑逗": "3c/tiaodou_org.gif", "亲耳朵": "1c/qinerduo_org.gif", "媚眼": "32/meiyan_org.gif", "冒个泡": "32/maogepao_org.gif", "囧耳朵": "f0/jiongerduo_org.gif", "鬼脸": "14/guilian_org.gif", "放电": "fd/fangdian_org.gif", "悲剧": "ea/beiju_org.gif", "抚摸": "78/touch_org.gif", "大汗": "13/sweat_org.gif", "大惊": "74/suprise_org.gif", "惊哭": "0c/supcry_org.gif", "星星眼": "5c/stareyes_org.gif", "好困": "8b/sleepy_org.gif", "呕吐": "75/sick_org.gif", "加我一个": "ee/plus1_org.gif", "痞痞兔耶": "19/pipioye_org.gif", "mua": "c6/muamua_org.gif", "面抽": "fd/mianchou_org.gif", "大笑": "6a/laugh_org.gif", "揉": "d6/knead_org.gif", "痞痞兔囧": "38/jiong_org.gif", "哈尼兔耶": "53/honeyoye_org.gif", "开心": "40/happy_org.gif", "咬手帕": "af/handkerchief_org.gif", "去": "6b/go_org.gif", "晕死了": "a4/dizzy_org.gif", "大哭": "af/cry_org.gif", "扇子遮面": "a1/coverface_org.gif", "怒气": "ea/angery_org.gif", "886": "6f/886_org.gif", "雾": "68/w_org.gif", "台风": "55/tf_org.gif", "沙尘暴": "69/sc_org.gif", "晴转多云": "d2/qzdy_org.gif", "流星": "8e/lx_org.gif", "龙卷风": "6a/ljf_org.gif", "洪水": "ba/hs2_org.gif", "风": "74/gf_org.gif", "多云转晴": "f3/dyzq_org.gif", "彩虹": "03/ch_org.gif", "冰雹": "05/bb2_org.gif", "微风": "a5/wind_org.gif", "阳光": "1a/sunny_org.gif", "雪": "00/snow_org.gif", "闪电": "e3/sh_org.gif", "下雨": "50/rain.gif", "阴天": "37/dark_org.gif", "白羊": "07/byz2_org.gif", "射手": "46/ssz2_org.gif", "双鱼": "e2/syz2_org.gif", "双子": "89/szz2_org.gif", "天秤": "6b/tpz2_org.gif", "天蝎": "1e/txz2_org.gif", "水瓶": "1b/spz2_org.gif", "处女": "62/cnz2_org.gif", "金牛": "3b/jnz2_org.gif", "巨蟹": "d2/jxz2_org.gif", "狮子": "4a/leo2_org.gif", "摩羯": "16/mjz2_org.gif", "天蝎座": "09/txz_org.gif", "天秤座": "c1/tpz_org.gif", "双子座": "d4/szz_org.gif", "双鱼座": "7f/syz_org.gif", "射手座": "5d/ssz_org.gif", "水瓶座": "00/spz_org.gif", "摩羯座": "da/mjz_org.gif", "狮子座": "23/leo_org.gif", "巨蟹座": "a3/jxz_org.gif", "金牛座": "8d/jnz_org.gif", "处女座": "09/cnz_org.gif", "白羊座": "e0/byz_org.gif", "yeah": "1a/yeah_org.gif", "喜欢": "5f/xh_org.gif", "心动": "5f/xd_org.gif", "无聊": "53/wl_org.gif", "手舞足蹈": "b2/gx_org.gif", "搞笑": "09/gx2_org.gif", "痛哭": "eb/gd_org.gif", "爆发": "38/fn2_org.gif", "发奋": "31/d2_org.gif", "不屑": "b0/bx_org.gif", "加油": "d4/jiayou_org.gif", "国旗": "dc/flag_org.gif", "金牌": "f4/jinpai_org.gif", "银牌": "1e/yinpai_org.gif", "铜牌": "26/tongpai_org.gif", "哨子": "a0/shao.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "足球": "c0/football.gif", "篮球": "2c/bball_org.gif", "黑8": "6b/black8_org.gif", "排球": "cf/volleyball_org.gif", "游泳": "b9/swimming_org.gif", "乒乓球": "a5/pingpong_org.gif", "投篮": "7a/basketball_org.gif", "羽毛球": "77/badminton_org.gif", "射门": "e0/zuqiu_org.gif", "射箭": "40/shejian_org.gif", "举重": "14/juzhong_org.gif", "击剑": "38/jijian_org.gif", "烦躁": "c5/fanzao_org.gif", "呲牙": "c1/ciya_org.gif", "有钱": "e6/youqian_org.gif", "微笑": "05/weixiao_org.gif", "帅爆": "c1/shuaibao_org.gif", "生气": "0a/shengqi_org.gif", "生病了": "19/shengbing_org.gif", "色眯眯": "90/semimi_org.gif", "疲劳": "d1/pilao_org.gif", "瞄": "14/miao_org.gif", "哭": "79/ku_org.gif", "好可怜": "76/kelian_org.gif", "紧张": "75/jinzhang_org.gif", "惊讶": "dc/jingya_org.gif", "激动": "bb/jidong_org.gif", "见钱": "2b/jianqian_org.gif", "汗了": "7d/han_org.gif", "奋斗": "4e/fendou_org.gif", "小人得志": "09/xrdz_org.gif", "哇哈哈": "cc/whh_org.gif", "叹气": "90/tq_org.gif", "冻结": "d3/sjdj_org.gif", "切": "1d/q_org.gif", "拍照": "ec/pz_org.gif", "怕怕": "7c/pp_org.gif", "怒吼": "4d/nh_org.gif", "膜拜": "9f/mb2_org.gif", "路过": "70/lg_org.gif", "泪奔": "34/lb_org.gif", "脸变色": "cd/lbs_org.gif", "亲": "05/kiss_org.gif", "恐怖": "86/kb_org.gif", "交给我吧": "e2/jgwb_org.gif", "欢欣鼓舞": "2b/hxgw_org.gif", "高兴": "c7/gx3_org.gif", "尴尬": "43/gg_org.gif", "发嗲": "4e/fd_org.gif", "犯错": "19/fc_org.gif", "得意": "fb/dy_org.gif", "吵闹": "fa/cn_org.gif", "冲锋": "2f/cf_org.gif", "抽耳光": "eb/ceg_org.gif", "差得远呢": "ee/cdyn_org.gif", "被砸": "5a/bz2_org.gif", "拜托": "6e/bt_org.gif", "必胜": "cf/bs3_org.gif", "不关我事": "e8/bgws_org.gif", "上火": "64/bf_org.gif", "不倒翁": "b6/bdw_org.gif", "不错哦": "79/bco_org.gif", "眨眨眼": "3b/zy2_org.gif", "杂技": "ec/zs_org.gif", "多问号": "17/wh2_org.gif", "跳绳": "79/ts_org.gif", "强吻": "b1/q3_org.gif", "不活了": "37/lb2_org.gif", "磕头": "6a/kt_org.gif", "呜呜": "55/bya_org.gif", "不": "a2/bx2_org.gif", "狂笑": "d5/zk_org.gif", "冤": "5f/wq2_org.gif", "蜷": "87/q2_org.gif", "美好": "ae/mh_org.gif", "乐和": "5f/m2_org.gif", "揪耳朵": "15/j3_org.gif", "晃": "bf/h2_org.gif", "high": "e7/f_org.gif", "蹭": "33/c_org.gif", "抱枕": "f4/bz3_org.gif", "不公平": "85/bgp_org.gif"
};

if (typeof module === 'undefined') {
  root.weibo = root.weibo || {};
  root.weibo.TSinaAPI = TSinaAPI;
} else {
  module.exports = TSinaAPI;
}

})();
