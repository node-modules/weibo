/*!
 * node-weibo - lib/tapi.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var EventProxy = require('eventproxy');
var utils = require('./utils');
var TSinaAPI = require('./tsina');
var TQQAPI = require('./tqq');
var WeiboAPI = require('./weibo');
var GithubAPI = require('./github');

var TAPI = module.exports = {
  TYPES: {
    weibo: WeiboAPI, // api v2.0
    github: GithubAPI,
    tsina: TSinaAPI, // api v1.0
    // twitter: TwitterAPI,
    tqq: TQQAPI,
    // tsohu: TSOHUAPI 
  },
  
  enables: {},
  
  /**
   * Init API options, must init before use it.
   * 
   * @param {String} blogtype, blog api type, e.g.: 'weibo', 'tqq', 'github' and so on.
   * @param {String} appkey
   * @param {String} secret
   * @param {String|Object} [oauth_callback] or [oauth_options]
   *  - {String} [oauth_callback], oauth callback redirect uri.
   *  - {String} [oauth_scope], comma separated list of scopes. e.g.: `status, user`
   * @return {[type]} [description]
   */
  init: function (blogtype, appkey, secret, oauth_options) {
    if (!appkey) {
      throw new TypeError('appkey must be set');
    }
    if (!secret) {
      throw new TypeError('secret must be set');
    }
    if (typeof oauth_options === 'string') {
      oauth_options = {
        oauth_callback: oauth_options
      };
    }
    var TypeAPI = this.TYPES[blogtype];
    if (!TypeAPI) {
      throw new TypeError(blogtype + ' api not exists');
    }
    var options = {
      appkey: appkey,
      secret: secret
    };
    options = utils.extend(options, oauth_options);
    var instance = new TypeAPI(options);
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
  
  /**
   * Get api instance config by user
   * 
   * @param {User} user
   * @return {Object} config
   */
  get_config: function (user) {
    return this.api_dispatch(user).config;
  },

  /**
   * Check api support the method or not.
   * 
   * @param {User} user
   * @param {String} method
   * @return {Boolean} true or false
   */
  support: function (user, method) {
    return this.get_config(user)['support_' + method] !== false;
  },

  /**
   * Process text to display format.
   * 
   * @param {User} user
   * @param {Status} status
   * @return {String}
   */
  process_text: function (user, status) {
    return this.api_dispatch(user).process_text(status);
  },

  /**
   * Utils methods
   */
  
  _timeline: function (method, user, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    cursor.count = cursor.count || 20;
    var max_id = cursor.max_id;
    var since_id = cursor.since_id;
    var self = this;
    return self.api_dispatch(user)[method](user, cursor, function (err, result) {
      if (err) {
        return callback(err);
      }
      if (!max_id && !since_id) {
        return callback(null, result);
      }
      var testId = String(max_id || since_id);
      // ignore the max_id status
      var needs = [];
      var statuses = result.items || [];
      for (var i = 0, l = statuses.length; i < l; i++) {
        var status = statuses[i];
        if (status.id === testId) {
          continue;
        }
        needs.push(status);
      }
      result.items = needs;
      callback(null, result);
    });
  },

  /**
   * Status
   */

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
   *  - {Function(info)} [progress], upload progress callback.
   *   - {Object} info: {total: total Size, loaded: upload Size}.
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

  /**
   * Get statuses comment count and repost count by ids.
   * 
   * @param {User} user
   * @param {String|Array} ids, separate by comma.
   * @param {Function(err, counts)} callback
   *   - {String} id
   *   - {Number} comments
   *   - {Number} reposts
   * @return {Context} this
   */
  count: function (user, ids, callback) {
    if (Array.isArray(ids)) {
      ids = ids.join(',');
    }
    return this.api_dispatch(user).count(user, ids, callback);
  },

  /**
   * List home timeline statuses.
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {String} [since_time], only for tqq, status.timestamp in seconds.
   *  - {String} [max_time], only for tqq, status.timestamp in seconds.
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
   *  - {Number} [filter_by_author], only support by `weibo`;
   *    Filter statuses by author type, 0: all, 1: only I following、2: stranger, default is `0`.
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
   * Favorite
   */

   /**
   * List favorites.
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
   *   - {Array} items, [Favorite, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  favorites: function (user, cursor, callback) {
    return this._timeline('favorites', user, cursor, callback);
  },

  /**
   * Show a favorite item by item id.
   * 
   * @param {User} user
   * @param {String} id, favorite item's id.
   * @param {Function(err, favorite)} callback
   * @return {Context} this
   */
  favorite_show: function (user, id, callback) {
    return this.api_dispatch(user).favorite_show(user, id, callback);
  },

  /**
   * Add a status to favorites.
   * 
   * @param {User} user
   * @param {String} id, status's id.
   * @param {Function(err, result)} callback
   *  - {Object} result
   *   - {String} id, relation item's id.
   *   - addtional infomation maybe.
   * @return {Context} this
   */
  favorite_create: function (user, id, callback) {
    return this.api_dispatch(user).favorite_create(user, id, callback);
  },

  /**
   * Remove the status from favorites.
   * 
   * @param {User} user
   * @param {String} id, the favorite item's id.
   * @param {Function(err, result)} callback
   *  - {Object} result
   *   - {String} id, relation item's id.
   *   - addtional infomation maybe.
   * @return {Context} this
   */
  favorite_destroy: function (user, id, callback) {
    return this.api_dispatch(user).favorite_destroy(user, id, callback);
  },

  /**
   * Comment
   */
  
  /**
   * List comments to my statues
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
   *   - {Array} items, [Comment, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  comments_timeline: function (user, cursor, callback) {
    return this._timeline('comments_timeline', user, cursor, callback);
  },

  /**
   * List @me comments
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {Number} count, default is `20`
   *  - {Number} page
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Comment, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  comments_mentions: function (user, cursor, callback) {
    return this._timeline('comments_mentions', user, cursor, callback);
  },

  /**
   * List comments post by me
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} since_id
   *  - {String} max_id
   *  - {Number} count, default is `20`
   *  - {Number} page
   *  - {Number} [filter_by_source], only support by `weibo`;
   *    Filter comments by source type, 0: all, 1: come from weibo, 2: come from weiqun, default is `0`.
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Comment, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  comments_by_me: function (user, cursor, callback) {
    return this._timeline('comments_by_me', user, cursor, callback);
  },

  /**
   * List comments to me
   * 
   * @param {User} user
   * @param {Cursor} [cursor]
   *  - {String} [since_id]
   *  - {String} [max_id]
   *  - {Number} [count], default is `20`
   *  - {Number} [page]
   *  - {Number} [filter_by_author], only support by `weibo`;
   *    Filter comments by author type, 0: all, 1: I following, 2: stranger, default is `0`.
   *  - {Number} [filter_by_source], only support by `weibo`;
   *    Filter comments by source type, 0: all, 1: come from weibo, 2: come from weiqun, default is `0`.
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Comment, ...]
   *   - {Cursor} cursor
   *   - ...
   * @return {Context} this
   */
  comments_to_me: function (user, cursor, callback) {
    return this._timeline('comments_to_me', user, cursor, callback);
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
   *  - {Number} [filter_by_author], only support by `weibo`;
   *    Filter comments by author type, 0: all, 1: only I following、2: stranger, default is `0`.
   * @param {Function(err, result)} callback
   *  {Object} result:
   *   - {Array} items, [Comment, ...]
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

  /**
   * post a comment to a status
   * 
   * @param {AccessToken} user
   * @param {String} id, status's id
   * @param {String|Object} comment
   *  - {String} comment
   *  - {Number} [comment_ori], same comment to the original status when comment on a repost status,
   *    0: no, 1: yes, default is `0`.
   * @param {Function(err, result)} callback
   *  - {Object} result
   *   - {String} id, the comment id
   * @return {Context} this
   */
  comment_create: function (user, id, comment, callback) {
    if (typeof comment === 'string') {
      comment = {comment: comment};
    }
    return this.api_dispatch(user).comment_create(user, id, comment, callback);
  },
  
  /**
   * reply to a comment
   * @param {AccessToken} user
   * @param {String} cid, comment's id
   * @param {String} id, status's id
   * @param {String|Object} comment
   *  - {String} comment
   *  - {Number} [without_mention], auto add `'reply@username'` to comment text or not,
   *    0: yes, 1: no, default is `1`, won't auto add.
   *  - {Number} [comment_ori], same comment to the original status when comment on a repost status,
   *    0: no, 1: yes, default is `0`.
   * @param {Function(err, result)} callback
   * @return {Context} this
   */
  comment_reply: function (user, cid, id, comment, callback) {
    if (typeof comment === 'string') {
      comment = {comment: comment};
    }
    return this.api_dispatch(user).comment_reply(user, cid, id, comment, callback);
  },
  
  /**
   * remove a comment
   * @param {AccessToken} user
   * @param {String} cid, comment's id
   * @param {Function(err, result)} callback
   * @return {Context} this
   */
  comment_destroy: function (user, cid, callback) {
    return this.api_dispatch(user).comment_destroy(user, cid, callback);
  },

  /**
   * OAuth
   */
  
  /**
   * Get authorization token and login url.
   * 
   * @param {Object} user
   *  - {String} blogtype, 'weibo' or other blog type,
   *  - {String} oauth_callback, 'login callback url' or 'oob'
   * @param {Function(err, auth_info)} callback
   *  - {Object} auth_info
   *   - {String} auth_url: 'http://xxxx/auth?xxx',
   *   - {String} oauth_token: $oauth_token,
   *   - {String} oauth_token_secret: $oauth_token_secret
   * @return {Context} this, blogType api.
   */
  get_authorization_url: function (user, callback) {
    return this.api_dispatch(user).get_authorization_url(user, callback);
  },
  
  /**
   * Get access token.
   * 
   * @param {Object} user
   *  - {String} blogtype
   *  - {String} oauth_token, authorization `oauth_token`
   *  - {String} oauth_verifier, authorization `oauth_verifier`
   *  - {String} oauth_token_secret, request token secret
   * @param {Function(err, token)} callback
   *  - {Object} token
   *   - {String} oauth_token
   *   - {String} oauth_token_secret
   * @return {Context} this
   */
  get_access_token: function (user, callback) {
    return this.api_dispatch(user).get_access_token(user, callback);
  },

  /**
   * User
   */
  
  /**
   * Get user profile infomation by access token.
   * 
   * @param {Object} user
   *  - {String} blogtype
   *  - {String} oauth_token, access oauth token
   *  - {String} [oauth_token_secret], access oauth token secret, oauth v2 don't need this param.
   * @param {Function(err, User)} callback
   * @return {Context} this
   */
  verify_credentials: function (user, callback) {
    return this.api_dispatch(user).verify_credentials(user, callback);
  },

  /**
   * Get user profile infomation by uid.
   * @param {Object} user
   *  - {String} blogtype
   *  - {String} oauth_token, access token
   *  - {String} [oauth_token_secret], access oauth token secret, oauth v2 don't need this param.
   * @param {String} [uid], user id
   * @param {String} [screen_name], user screen_name
   *   uid and screen_name MUST set one.
   * @param {Function(err, User)} callback
   * @return {Context} this
   */
  user_show: function (user, uid, screen_name, callback) {
    if (typeof screen_name === 'function') {
      callback = screen_name;
      screen_name = null;
    }
    var self = this;
    return self.api_dispatch(user).user_show(user, uid, screen_name, function (err, info) {
      if (err) {
        return callback(err);
      }
      // need to get friendship info
      var data = {
        source_id: user.id,
        target_id: info.id
      };
      self.friendship_show(user, data, function (err, friendship) {
        if (err) {
          return callback(err);
        }
        if (friendship.target.following) {
          info.follow_me = friendship.target.following;
        }
        if (friendship.target.followed_by) {
          info.following = friendship.target.followed_by;
        }
        callback(null, info);
      });
    });
  },

  /**
   * Get relation between two users.
   * 
   * @param {User} user
   * @param {Object} data, source and target.
   *  id and screen_name must set one and only one.
   *  tqq only support source_id and target_id.
   *  - {String} [source_id], set source to current user when source not set.
   *  - {String} [source_screen_name]
   *  - {String} [target_id]
   *  - {String} [target_screen_name]
   * @param {Function(err, relation)} callback
   * @return {Context} this
   */
  friendship_show: function (user, data, callback) {
    if (data.source_id && data.source_screen_name) {
      delete data.source_screen_name;
    }
    if (!data.source_id && !data.source_screen_name) {
      data.source_id = user.uid;
    }
    if (data.target_id && data.target_screen_name) {
      delete data.target_screen_name;
    }
    return this.api_dispatch(user).friendship_show(user, data, callback);
  },

  /**
   * Follow a user.
   * @param {User} user
   * @param {String} uid, user's id which you want to follow.
   * @param {String} [screen_name]
   * @param {Function(err, result)} callback
   */
  friendship_create: function (user, uid, screen_name, callback) {
    if (typeof screen_name === 'function') {
      callback = screen_name;
      screen_name = null;
    }
    return this.api_dispatch(user).friendship_create(user, uid, screen_name, callback);
  },

  /**
   * Unfollow a user.
   * @param {User} user
   * @param {String} uid, user's id which you want to unfollow.
   * @param {String} [screen_name]
   * @param {Function(err, result)} callback
   */
  friendship_destroy: function (user, uid, screen_name, callback) {
    if (typeof screen_name === 'function') {
      callback = screen_name;
      screen_name = null;
    }
    return this.api_dispatch(user).friendship_destroy(user, uid, screen_name, callback);
  },

  /**
   * Message
   */
  
  /**
   * Returns the direct messages, sent to and sent by the authenticating user.
   * 
   * @param {User} user
   * @param {Object} cursor, pagging params.
   *  - {Number} [count], Specifies the number of records to retrieve.
   *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
   *  - {String} [since_time], only for tqq
   *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
   *  - {String} [max_time], only for tqq
   *  - {Number} [page], Specifies the page of results to retrieve.
   *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
   *  - {Boolean} [skip_status], When set to either true, t or 1 statuses will not be included in the returned user objects.
   * @param {Function(err, result)} callback
   */
  direct_messages_both: function (user, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    var ep = EventProxy.create('received', 'sent', function (received, sent) {
      var messages = received.items.concat(sent.items);
      messages.sort(function (a, b) {
        return a.created_at > b.created_at ? -1 : 1;
      });
      callback(null, {
        items: messages,
        received_cursor: received.cursor,
        sent_cursor: sent.cursor
      });
    });
    ep.once('error', function (err) {
      ep.unbind();
      callback(err);
    });
    this.direct_messages(user, cursor, function (err, result) {
      if (err) {
        return ep.emit('error', err);
      }
      ep.emit('received', result);
    });
    this.direct_messages_sent(user, cursor, function (err, result) {
      if (err) {
        return ep.emit('error', err);
      }
      ep.emit('sent', result);
    });
  },
  
  /**
   * Returns the 20 most recent direct messages sent to the authenticating user.
   * 
   * @param {User} user
   * @param {Object} cursor, pagging params.
   *  - {Number} [count], Specifies the number of records to retrieve.
   *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
   *  - {String} [since_time], only for tqq
   *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
   *  - {String} [max_time], only for tqq
   *  - {Number} [page], Specifies the page of results to retrieve.
   *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
   *  - {Boolean} [skip_status], When set to either true, t or 1 statuses will not be included in the returned user objects.
   * @param {Function(err, result)} callback
   */
  direct_messages: function (user, cursor, callback) {
    return this._timeline('direct_messages', user, cursor, callback);
  },

  /**
   * Returns the 20 most recent direct messages sent by the authenticating user.
   * 
   * @param {User} user
   * @param {Object} cursor, pagging params.
   *  - {Number} [count], Specifies the number of records to retrieve.
   *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
   *  - {String} [since_time], only for tqq
   *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
   *  - {String} [max_time], only for tqq
   *  - {Number} [page], Specifies the page of results to retrieve.
   *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
   * @param {Function(err, result)} callback
   */
  direct_messages_sent: function (user, cursor, callback) {
    return this._timeline('direct_messages_sent', user, cursor, callback);
  },

  /**
   * Returns a single direct message, specified by an id parameter.
   * @param {User} user
   * @param {String} id, The ID of the direct message.
   * @param {Function(err, message)} callback
   */
  direct_message_show: function (user, id, callback) {
    return this.api_dispatch(user).direct_message_show(user, id, callback);
  },

  /**
   * Sends a new direct message to the specified user from the authenticating user.
   * @param {User} user
   * @param {Object} toUser, One of uid or screen_name are required.
   *  - {String} uid, The ID of the user who should receive the direct message.
   *  - {String} screen_name, The screen name of the user who should receive the direct message.
   * @param {String} text, The text of your direct message. Be sure to URL encode as necessary.
   * @param {Function(err, result)} callback
   */
  direct_message_create: function (user, toUser, text, callback) {
    return this.api_dispatch(user).direct_message_create(user, toUser, text, callback);
  },

  /**
   * Destroys the direct message specified in the required ID parameter.
   * @param {User} user
   * @param {String} id, The ID of the direct message to delete.
   * @param {Function(err, result)} callback
   */
  direct_message_destroy: function (user, id, callback) {
    return this.api_dispatch(user).direct_message_destroy(user, id, callback);
  },

  /**
   * Search Statuses and Users
   */

  /**
   * Search suggestion users when @somebody.
   * 
   * @param {User} user
   * @param {String} q, search keyword
   * @param {Object} [cursor]
   *  - {Number} [count], return records number, default is `10`.
   *  - {Number} [type], suggestion type, 0: I following, 1: My followers. default is `0`.
   *  - {Number} [range], suggestion search range, 0: only screen_name, 1: only remark, 2: both. default is `2`.
   * @param {Function(err, result)} callback
   *  - {Object} result:
   *   - {Array} items: [ SuggetionUser, ... ]
   *    - {SuggetionUser} { id: '123123', screen_name: 'QLeeLulu', remark: '' }
   */
  search_suggestions_at_users: function (user, q, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    cursor = cursor || {};
    cursor.count = cursor.count || 10;
    cursor.type = String(cursor.count || 0);
    cursor.q = q;
    return this.api_dispatch(user).search_suggestions_at_users(user, cursor, callback);
  },
  
  /**
   * Search statuses by query.
   * 
   * @param {AccessToken} user
   * @param {String|Object} query
   *  - {String} q, query keyword
   *  - {String} [long], longitude
   *  - {String} [lat], latitude
   *  - {String} [radius], radius for longitude and latitude.
   * @param {Cursor} [cursor]
   *  - {Number} [count], default is `20`
   *  - {Number} [page], default is the first page.
   * @param {Function(err, result)} callback
   * @return {Context} this
   */
  search: function (user, query, cursor, callback) {
    if (typeof query === 'string') {
      query = {
        q: query
      };
    }
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    return this.api_dispatch(user).search(user, query, cursor, callback);
  },

  /**
   * Search users by query.
   * @param {User} user
   * @param {String} query
   * @param {Object} cursor
   * @param {Function(err, result)} callback
   */
  user_search: function (user, query, cursor, callback) {
    if (typeof cursor === 'function') {
      callback = cursor;
      cursor = null;
    }
    return this.api_dispatch(user).user_search(user, query, cursor, callback);
  },

};

TAPI.friends_timeline = TAPI.home_timeline;
