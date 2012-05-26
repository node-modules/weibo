(function () {

var TAPI = {};
var utils;
var root = this; // window on browser
if (typeof module === 'undefined') {
  root.weibo.TAPI = TAPI;
  utils = root.weibo.utils;
} else {
  module.exports = TAPI;
  utils = require('./utils');
}

var TSinaAPI;
var TwitterAPI;
var TQQAPI;
var TSOHUAPI;

if (typeof require !== 'undefined') {
  TSinaAPI = require('./tsina');
  // TwitterAPI = require('./twitter');
  // TQQAPI = require('./tqq');
  // TSOHUAPI = require('./tsohu');
} else {
  TSinaAPI = root.weibo.TSinaAPI;
  TwitterAPI = root.weibo.TwitterAPI;
  TQQAPI = root.weibo.TQQAPI;
  TSOHUAPI = root.weibo.TSOHUAPI;
}

// 封装兼容所有微博的api，自动判断微博类型
utils.extend(TAPI, {
  
  TYPES: {
    tsina: TSinaAPI,
    weibo: TSinaAPI, // alias to tsina
    // twitter: TwitterAPI,
    // tqq: TQQAPI ,
    // tsohu: TSOHUAPI 
  },
  
  enables: {},
  
  init: function (blogtype, appkey, secret, oauth_callback_url) {
    if (!appkey) {
      throw new Error('appkey must be set');
    }
    var api = this.TYPES[blogtype];
    if (!api) {
      throw new Error(blogtype + ' api not exists');
    }
    api.config.source = api.config.oauth_key = appkey;
    api.config.oauth_secret = secret;
    this.enables[blogtype] = true;
    if (oauth_callback_url) {
      api.config.oauth_callback = oauth_callback_url;
    }
  },

  // 自动判断当前用户所使用的api, 根据user.blogType判断
  api_dispatch: function (data) {
    var user = data.user || data;
    if (user && !user.blogType) {
      // 兼容user.blogtype
      user.blogType = user.blogtype;
    }
    return this.TYPES[user.blogType || 'tsina'];
  },
  
  // 获取配置信息
  get_config: function (user) {
    return this.api_dispatch(user).config;
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
  
  /* google 翻译api
   * text, target 目标语言
   */
  translate: function (user, text, target, callback, context) {
    return this.api_dispatch(user).translate(text, target, callback, context);
  },
  
  /* 获取用户认证url
   * auth_callback: 认证通过的跳转url
   * callback(auth_url, user)
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
  
  // count, base_app: 0 all, 1 current app
  public_timeline: function (data, callback, context) {
    return this.api_dispatch(data).public_timeline(data, callback, context);
  },

  // since_id, max_id, count, page 
  // home_timeline in twitter
  friends_timeline: function (data, callback, context) {
    var max_id = data.max_id;
    return this.api_dispatch(data).friends_timeline(data, function (err, statuses) {
      if (err || !max_id) {
        return callback.call(context, err, statuses);
      }
      max_id = String(max_id);
      // ignore the max_id status
      var needs = [];
      for (var i = 0, l = statuses.length; i < l; i++) {
        var status = statuses[i];
        if (String(status.id) === max_id) {
          continue;
        }
        needs.push(status);
      }
      callback.call(context, null, needs);
    }, this);
  },
  
  /* 
   * id、user_id、screen_name三个参数均未指定，则返回当前登录用户最近发表的微博消息列表。
   * since_id false int64 若指定此参数，则只返回ID比since_id大（即比since_id发表时间晚的）的微博消息。
   * max_id false int64 若指定此参数，则返回ID小于或等于max_id的微博消息
   * count  false int，默认值20，最大值200。 指定每页返回的记录条数。
   * page false int，默认值1。 页码。注意：最多返回200条分页内容。
   * base_app false int 是否基于当前应用来获取数据。1为限制本应用微博，0为不做限制。
   * feature  false int 微博类型，0全部，1原创，2图片，3视频，4音乐. 返回指定类型的微博信息内容。
   */
  user_timeline: function (data, callback, context) {
    return this.api_dispatch(data).user_timeline(data, callback, context);
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
  
  /* 返回一条原创微博消息的最新n条转发微博消息。本接口无法对非原创微博进行查询。
   * id true  int64 要获取转发微博列表的原创微博ID。
   * since_id false int64 若指定此参数，则只返回ID比since_id大的记录（比since_id发表时间晚）。
   * max_id false int64 若指定此参数，则返回ID小于或等于max_id的记录
   * count  false int，默认值20，最大值200。 单页返回的记录条数。
   * page false int，默认值1。 返回结果的页码。
   */
  repost_timeline: function (data, callback, context) {
    return this.api_dispatch(data).repost_timeline(data, callback, context);
  },
  
  /*
   * since_id false int64 若指定此参数，则只返回ID比since_id大的提到当前登录用户的微博消息（比since_id发表时间晚）。
   * max_id false int64 若指定此参数，则返回ID小于或等于max_id的提到当前登录用户微博消息
   * count  false int，默认值20，最大值200。 单页返回的记录条数。
   * page false int，默认值1。 返回结果的页码。注意：有分页限制。
   */
  mentions: function (data, callback, context) {
    return this.api_dispatch(data).mentions(data, callback, context);
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
   * status, in_reply_to_status_id
   * lat, long: lat和long参数需配合使用，用于标记发表微博消息时所在的地理位置，只有用户设置中geo_enabled=true时候地理位置信息才有效。
   * annotations: 元数据，主要是为了方便第三方应用记录一些适合于自己使用的信息。每条微博可以包含一个或者多个元数据。请以json字串的形式提交，字串长度不超过512个字符，具体内容可以自定。
   */
  update: function (data, callback, context) {
    if (!data.pic) {
      return this.api_dispatch(data).update(data, callback, context);
    }
    // 包含图片
    var pic = data.pic;
    delete data.pic;
    return this.api_dispatch(data).upload(data, pic, callback, context);
  },
  
  /*
   * status
   * pic: {keyname: 'pic', file: filepath} 要上传的图片。仅支持JPEG,GIF,PNG图片,为空返回400错误。目前上传图片大小限制为<5M。
   */
  upload: function (data, pic, callback, context) {
    return this.api_dispatch(data).upload(data, pic, callback, context);
  },
  
  upload_pic_url: function (data, pic, callback, context) {
    return this.api_dispatch(data).upload_pic_url(data, pic, callback, context);
  },
  
  /*
   * id, status, is_comment
   */
  repost: function (data, callback, context) {
    return this.api_dispatch(data).repost(data, callback, context);
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
  
  /*
   * id, count, page
   */
  comments: function (data, callback, context) {
    return this.api_dispatch(data).comments(data, callback, context);
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
    
    // id 瑞推
  retweet: function (data, callback, context) {
    return this.api_dispatch(data).retweet(data, callback, context);
  },
  
  // id
  destroy: function (data, callback, context) {
    return this.api_dispatch(data).destroy(data, callback, context);
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
  
  // id
  status_show: function (data, callback, context) {
    return this.api_dispatch(data).status_show(data, callback, context);
  },

  // list all emotions
  emotions: function (data, callback, context) {
    return this.api_dispatch(data).emotions(data, callback, context);
  }
});

})();
