/*!
 * node-weibo - lib/tapi.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utils = require('./utils');
var TSinaAPI = require('./tsina');
var TQQAPI = require('./tqq');
// var GithubAPI = require('./github');

var TAPI = module.exports = {
  TYPES: {
    // github: GithubAPI,
    tsina: TSinaAPI, // api v1.0
    // twitter: TwitterAPI,
    tqq: TQQAPI,
    // tsohu: TSOHUAPI 
  },
  
  enables: {},
  
  init: function (blogtype, appkey, secret, oauth_callback_url) {
    if (!appkey) {
      throw new TypeError('appkey must be set');
    }
    if (!secret) {
      throw new TypeError('secret must be set');
    }
    var TypeAPI = this.TYPES[blogtype];
    if (!TypeAPI) {
      throw new TypeError(blogtype + ' api not exists');
    }
    var instance = new TypeAPI({
      appkey: appkey,
      secret: secret,
      oauth_callback: oauth_callback_url
    });
    this.enables[blogtype] = instance;
  },

  /**
   * Auto detech which API instance to use by user.
   * 
   * @param {User} user
   * @return {API} api instance
   */
  api_dispatch: function (user) {
    var apiType = user.blogtype || user.blogType;
    return this.enables[apiType];
  },
  
  // 获取配置信息
  get_config: function (user) {
    return this.api_dispatch(user).config;
  },

  /**
   * Post a status
   *
   * @param {User} user, oauth user.
   * @param {String|Object} status
   *  - {String} status, content text.
   *  - {Number} [lat], latitude.
   *  - {Number} [long], longitude.
   *  - {String} [annotations], addtional information.
   * @param {Function(Error, Status)} callback
   * @return {Context} this
   */
  update: function (user, status, callback) {
    if (typeof status === 'string') {
      status = {status: status};
    }
    return this.api_dispatch(user).update(user, status, callback);
  },
  
  /**
   * Post a status contain an image.
   * 
   * @param {User} user, oauth user.
   * @param {String|Object} status
   *  - {String} status, content text.
   *  - {Number} [lat], latitude.
   *  - {Number} [long], longitude.
   *  - {String} [annotations], addtional information.
   * @param {Object} pic
   *  - {Buffer|ReadStream} data
   *  - {String} [name], image file name
   *  - {String} [content_type], data content type
   * @param {Function(Error, Status)} callback
   * @return {Context} this
   */
  upload: function (user, status, pic, callback) {
    if (typeof status === 'string') {
      status = {status: status};
    }
    return this.api_dispatch(user).upload(user, status, pic, callback);
  },

  /**
   * Repost a status.
   * 
   * @param {User} user
   * @param {String|Number} id, need to repost status id.
   * @param {String|Object} status
   *  - {String} status, content text
   *  - {Number} [lat], latitude.
   *  - {Number} [long], longitude.
   *  - {Boolean} isComment, is comment or not, default is `false`.
   * @param {Function(Error, Status)} callback
   * @return {Context} this
   */
  repost: function (user, id, status, callback) {
    if (typeof status === 'string') {
      status = {status: status};
    }
    id = String(id);
    return this.api_dispatch(user).repost(user, id, status, callback);
  },

  /**
   * Remove a status by id.
   * 
   * @param {User} user
   * @param {String|Number} id
   * @param {Function(Error, Status)} callback
   * @return {Context} this
   */
  destroy: function (user, id, callback) {
    id = String(id);
    return this.api_dispatch(user).destroy(user, id, callback);
  },
  
  // upload_pic_url: function (data, pic, callback, context) {
  //   return this.api_dispatch(data).upload_pic_url(data, pic, callback, context);
  // },

  // // id 瑞推
  // retweet: function (data, callback, context) {
  //   return this.api_dispatch(data).retweet(data, callback, context);
  // },
  
  /**
   * Get a status by id.
   * 
   * @param {User} user
   * @param {String|Number} id
   * @param {Function(Error, Status)} callback
   * @return {Context} this
   */
  show: function (user, id, callback) {
    return this.api_dispatch(user).show(user, String(id), callback);
  },

  _timeline: function (method, user, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    cursor.count = cursor.count || 20;
    var max_id = cursor.max_id;
    var self = this;
    return self.api_dispatch(user)[method](user, cursor, function (err, result) {
      if (err || !max_id) {
        return callback(err, result);
      }
      max_id = String(max_id);
      // ignore the max_id status
      var needs = [];
      var statuses = result.items || [];
      for (var i = 0, l = statuses.length; i < l; i++) {
        var status = statuses[i];
        if (status.id === max_id) {
          continue;
        }
        needs.push(status);
      }
      result.items = needs;
      callback(null, result);
    });
  },

  /**
   * List home timeline statuses.
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  home_timeline: function (user, cursor, callback) {
    return this._timeline('home_timeline', user, cursor, callback);
  },

  /**
   * List home timeline statuses.
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  public_timeline: function (user, cursor, callback) {
    return this._timeline('public_timeline', user, cursor, callback);
  },
  
  /**
   * List user personal timeline statuses.
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} [uid], user id
   *  - {String} [screen_name], `user.screen_name`, screen_name or uid must be set at least one.
   *  - {String} [since_id]
   *  - {String} [max_id]
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  user_timeline: function (user, cursor, callback) {
    return this._timeline('user_timeline', user, cursor, callback);
  },

  /**
   * List @me statuses.
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  mentions: function (user, cursor, callback) {
    return this._timeline('mentions', user, cursor, callback);
  },
  
  /* 返回最新n条发送及收到的评论。
   * since_id false int64 若指定此参数，则只返回ID比since_id大的评论（比since_id发表时间晚）。
   * max_id false int64 若指定此参数，则返回ID小于或等于max_id的评论
   * count  false int，默认值20，最大值200。 单页返回的记录条数。
   * page false int，默认值1。 返回结果的页码。注意：有分页限制。
   */
  comments_timeline: function (data, callback, context) {
    return this.api_dispatch(data).comments_timeline(data, callback, context);
  },
  
  /**
   * List one status's reposted statuses
   * 
   * @param {User} user
   * @param {String} id, status's id
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   *  - {Number} [filter_by_author], 0: all, 1: only I following、2: stranger, default is `0`.
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  repost_timeline: function (user, id, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    cursor.id = id;
    return this._timeline('repost_timeline', user, cursor, callback);
  },
  
  /**
   * List one status's comments
   * 
   * @param {User} user
   * @param {String} id, status's id
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq
   *  - {String} [max_time], only for tqq
   *  - {Number} count, default is `20`
   *  - {Number} page
   *  - {Number} [filter_by_author], 0: all, 1: only I following、2: stranger, default is `0`.
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Status, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  comments: function (user, id, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    cursor.id = id;
    return this._timeline('comments', user, cursor, callback);
  },

  /* 返回与关键字相匹配的微博。未新浪合作key只能返回第一页
   * q  true  string  搜索的关键字。必须进行URL Encode
   * page false int 页码，从1开始，默认为1。
   * rpp  false int 每页返回的微博数。（默认返回10条，最大200条）
   * geocode  false string  返回指定经纬度附近的信息。经纬度参数格式是“纬度，经度，半径”，半径支持km（公里），m（米），mi（英里）。格式需要URL Encode编码
   */
  search: function (data, callback, context) {
    return this.api_dispatch(data).search(data, callback, context);
  },
  
  /** 
   * 获取用户认证url
   * oauth_callback_url: 认证后回跳url
   * callback(err, auth_token)
   *  - {Object} auth_token: {
   *    auth_url: 'http://xxxx/auth?xxx',
   *    oauth_token: $oauth_token,
   *    oauth_token_secret: $oauth_token_secret
   *  }
   */
  /**
   * Get authorization token and login url.
   * 
   * @param {Object} user
   * - {Object} user: {
   *   blogType: 'tsina' or other blog type,
   *   oauth_callback: 'login callback url' or 'oob'
   * }
   * @param {Function(err, auth_info)} callback
   * - {Object} auth_token: {
   *   auth_url: 'http://xxxx/auth?xxx',
   *   oauth_token_key: $oauth_token_key,
   *   oauth_token_secret: $oauth_token_secret
   * }
   * @param {Object} [context]
   * @return {Object} blogType api.
   */
  get_authorization_url: function (user, callback, context) {
    return this.api_dispatch(user).get_authorization_url(user, callback, context);
  },
  
  /** 
   * 获取access token
   */
  get_access_token: function (user, callback, context) {
    return this.api_dispatch(user).get_access_token(user, callback, context);
  },
  
  /* 
   * 验证用户是否已经开通微博服务。并返回用户信息和最新的一条微博
   */
  verify_credentials: function (user, callback, context) {
    return this.api_dispatch(user).verify_credentials(user, callback, context);
  },
    
  /* 获取API的访问频率限制。返回当前小时内还能访问的次数。
   */
  rate_limit_status: function (data, callback, context) {
    return this.api_dispatch(data).rate_limit_status(data, callback, context);
  },
  
  
  
  /*
   * id false int64/string  用户ID(int64)或者昵称(string)。该参数为一个REST风格参数。调用示例见注意事项
   * user_id  false int64 用户ID，主要是用来区分用户ID跟微博昵称。当微博昵称为数字导致和用户ID产生歧义，特别是当微博昵称和用户ID一样的时候，建议使用该参数
   * screen_name  false string  微博昵称，主要是用来区分用户UID跟微博昵称，当二者一样而产生歧义的时候，建议使用该参数
   * id, user_id, screen_name 可以任选一个参数，在3个都不提供的情况下，系统返回当前登录用户的关注列表
   * 
   * cursor false int 用于分页请求，请求第1页cursor传-1，在返回的结果中会得到next_cursor字段，表示下一页的cursor。next_cursor为0表示已经到记录末尾。
   * count  false int，默认20，最大200  每页返回的最大记录数，最大不能超过200，默认为20。
   */
  friends: function (data, callback, context) {
    return this.api_dispatch(data).friends(data, callback, context);
  },
  
  // 同friends
  followers: function (data, callback, context) {
    return this.api_dispatch(data).followers(data, callback, context);
  },
  
  // page
  favorites: function (data, callback, context) {
    return this.api_dispatch(data).favorites(data, callback, context);
  },
  
  // id
  favorites_create: function (data, callback, context) {
    return this.api_dispatch(data).favorites_create(data, callback, context);
  },
  
  // id
  favorites_destroy: function (data, callback, context) {
    return this.api_dispatch(data).favorites_destroy(data, callback, context);
  },
  
  // ids: 要获取评论数和转发数的微博消息ID列表，用逗号隔开
  counts: function (data, callback, context) {
    return this.api_dispatch(data).counts(data, callback, context);
  },
  
  // id
  user_show: function (data, callback, context) {
    return this.api_dispatch(data).user_show(data, callback, context);
  },
  
  // since_id, max_id, count, page 
  direct_messages: function (data, callback, context) {
    return this.api_dispatch(data).direct_messages(data, callback, context);
  },
  
  // id
  destroy_msg: function (data, callback, context) {
    return this.api_dispatch(data).destroy_msg(data, callback, context);
  },
  
  /*
   * id true  int64/string  私信接收方的用户ID(int64)或者微博昵称(string)
   * text true  string  要发生的消息内容，需要做URLEncode，文本大小必须小于300个汉字。
   * user_id  false int64 私信接收方的用户ID，在用户ID与微博昵称容易混淆的时候，建议使用该参数。
   * screen_name  false string  私信接收方的微博昵称，在用户ID与微博昵称容易混淆的时候，建议使用该参数。
   * 
   * 私信的接收方必须是发送方的粉丝。否则无法成功发送私信
   * 系统返回400错误，提示：40017:Error: can't send direct message to user who is not your follower!
   */
  new_message: function (data, callback, context) {
    return this.api_dispatch(data).new_message(data, callback, context);
  },
  
  /*
   * id, comment, cid
   * without_mention: 1：回复中不自动加入“回复@用户名”，0：回复中自动加入“回复@用户名”. 默认为0.
   */
  comment: function (data, callback, context) {
    return this.api_dispatch(data).comment(data, callback, context);
  },
  
  /*
   * cid, comment
   * id: 要评论的微博消息ID
   * without_mention: 1：回复中不自动加入“回复@用户名”，0：回复中自动加入“回复@用户名”.默认为0.
   */
  reply: function (data, callback, context) {
    return this.api_dispatch(data).reply(data, callback, context);
  },
  
  
  // id
  comment_destroy: function (data, callback, context) {
    return this.api_dispatch(data).comment_destroy(data, callback, context);
  },
  
  /*
   * id, user_id, screen_name 这三个参数必填其一。
   */
  friendships_create: function (data, callback, context) {
    return this.api_dispatch(data).friendships_create(data, callback, context);
  },
  
  // id
  friendships_destroy: function (data, callback, context) {
    return this.api_dispatch(data).friendships_destroy(data, callback, context);
  },
  
  /*
   * target_id, target_screen_name: 参数必选其一
   * source_id, source_screen_name: 参数可不填，如果不填，则默认取当前登录用户
   */
  friendships_show: function (data, callback, context) {
    return this.api_dispatch(data).friendships_show(data, callback, context);
  },
  
  // type: 需要清零的计数类别，值为下列四个之一：1. 评论数，2. @me数，3. 私信数，4. 关注数
  reset_count: function (data, callback, context) {
    return this.api_dispatch(data).reset_count(data, callback, context);
  },
  
  // user_id, count, page
  tags: function (data, callback, context) {
    return this.api_dispatch(data).tags(data, callback, context);
  },
  
  // count, page
  tags_suggestions: function (data, callback, context) {
    return this.api_dispatch(data).tags_suggestions(data, callback, context);
  },
  
  // tags
  create_tag: function (data, callback, context) {
    return this.api_dispatch(data).create_tag(data, callback, context);
  },
  
  // tag_id
  destroy_tag: function (data, callback, context) {
    return this.api_dispatch(data).destroy_tag(data, callback, context);
  },
  

  // list all emotions
  emotions: function (data, callback, context) {
    return this.api_dispatch(data).emotions(data, callback, context);
  }
};
