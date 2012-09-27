(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/lib/tapi.js",function(require,module,exports,__dirname,__filename,process,global){/*!
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
var GithubAPI = require('./github');

var TAPI = module.exports = {
  TYPES: {
    github: GithubAPI,
    weibo: TSinaAPI, // alias to tsina
    // twitter: TwitterAPI,
    tqq: TQQAPI,
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

  /**
   * Auto detech which API instance to use by user.
   * 
   * @param {User} user
   * @return {API} api instance
   */
  api_dispatch: function (user) {
    var apiType = user.blogtype || user.blogType;
    return this.TYPES[apiType];
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
   * @param {Buffer|ReadStream} pic
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
};

});

require.define("/lib/utils.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * 格式化字符串
 * eg:
 *  '{0}天有{1}个小时'.format([1, 24]) 
 *  or
 *  '{{day}}天有{{hour}}个小时'.format({day:1, hour:24}})
 * @param {Object} values
 */
var STRING_FORMAT_REGEX = /\{\{([\w\s\.\'\"\(\),-\[\]]+)?\}\}/g;
String.prototype.format = function (values) {
  return this.replace(STRING_FORMAT_REGEX, function(match, key) {
    return values[key];
  });
};

// 格式化时间输出。示例：new Date().format("yyyy-MM-dd hh:mm:ss");
Date.prototype.format = function (format) {
  format = format || "yyyy-MM-dd hh:mm:ss";
  var o = {
    "M+" : this.getMonth() + 1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth() + 3) / 3), //quarter
    "S" : this.getMilliseconds() //millisecond
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }

  for (var k in o) {
    if (new RegExp("("+ k +")").test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    }
  }
  return format;
};

(function () {
  
  var root = this; // window on browser
  var b64_hmac_sha1;
  var exports;
  var crypto;
  if (typeof module === 'undefined') {
    root.weibo = root.weibo || {};
    exports = root.weibo.utils = {};
    b64_hmac_sha1 = root.weibo.sha1.b64_hmac_sha1;
  } else {
    exports = module.exports;
    crypto = require('crypto');
    b64_hmac_sha1 = require('./sha1').b64_hmac_sha1;
  }

  var querystring = {
    parse: function (s) {
      var qs = {};
      if (typeof s !== 'string') {
        return qs;
      }
      var pairs = s.split('&');
      for (var i = 0, len = pairs.length; i < len; i++) {
        var pair = pairs[i].split('=', 2);
        if (pair.length !== 2) {
          continue;
        }
        var key = pair[0].trim();
        if (!key) {
          continue;
        }
        qs[decodeURIComponent(key)] = decodeURIComponent(pair[1]);
      }
      return qs;
    },
    stringify: function (data) {
      var pairs = [];
      data = data || {};
      for (var k in data) {
        pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent('' + data[k]));
      }
      return pairs.join('&');
    }
  };

  function urljoin(url, params) {
    if (typeof params === 'object') {
      params = querystring.stringify(params);
    }
    if (!params) {
      return url;
    }
    if (url.indexOf('?') < 0) {
      url += '?';
    } else {
      url += '&';
    }
    return url + params;
  }

  function base64HmacSha1(baseString, key) {
    if (b64_hmac_sha1) {
      return b64_hmac_sha1(key, baseString);
    }
    return new crypto.Hmac().init("sha1", key).update(baseString).digest("base64");
  }

  // HTML 编码
  // test: hard code testing 。。。 '"!@#$%^&*()-=+ |][ {} ~` &&&&&amp; &lt; & C++ c++c + +c &amp;
  function htmlencode(str) {
    if (!str) { return ''; }
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  exports.extend = function (destination) {
    for (var i = 1, len = arguments.length; i < len; i++) {
      var source = arguments[i];
      if (!source) {
        continue;
      }
      for (var property in source) {
        destination[property] = source[property];
      }
    }
    return destination;
  };

  exports.inherits = function (destination) {
    for (var i = 1, len = arguments.length; i < len; i++) {
      var source = arguments[i];
      if (!source) {
        continue;
      }
      for (var property in source) {
        destination[property] = source[property];
      }
      if (destination.super_ === undefined) {
        destination.super_ = source;
      }
    }
    return destination;
  };

  exports.STRING_FORMAT_REGEX = STRING_FORMAT_REGEX;
  exports.querystring = querystring;
  exports.base64HmacSha1 = base64HmacSha1;
  exports.urljoin = urljoin;
  exports.htmlencode = htmlencode;

})();
});

require.define("crypto",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("crypto-browserify")
});

require.define("/node_modules/crypto-browserify/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {}
});

require.define("/node_modules/crypto-browserify/index.js",function(require,module,exports,__dirname,__filename,process,global){var sha = require('./sha')
var rng = require('./rng')

var algorithms = {
  sha1: {
    hex: sha.hex_sha1,
    binary: sha.b64_sha1,
    ascii: sha.str_sha1
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) {
  alg = alg || 'sha1'
  if(!algorithms[alg])
    error('algorithm:', alg, 'is not yet supported')
  var s = ''
  var _alg = algorithms[alg]
  return {
    update: function (data) {
      s += data
      return this
    },
    digest: function (enc) {
      enc = enc || 'binary'
      var fn
      if(!(fn = _alg[enc]))
        error('encoding:', enc , 'is not yet supported for algorithm', alg)
      var r = fn(s)
      s = null //not meant to use the hash after you've called digest.
      return r
    }
  }
}

exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, rng(size));
    } catch (err) { callback(err); }
  } else {
    return rng(size);
  }
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
;['createCredentials'
, 'createHmac'
, 'createCypher'
, 'createCypheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDeffieHellman'
, 'pbkdf2'].forEach(function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

});

require.define("/node_modules/crypto-browserify/sha.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

exports.hex_sha1 = hex_sha1;
exports.b64_sha1 = b64_sha1;
exports.str_sha1 = str_sha1;
exports.hex_hmac_sha1 = hex_hmac_sha1;
exports.b64_hmac_sha1 = b64_hmac_sha1;
exports.str_hmac_sha1 = str_hmac_sha1;

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}


});

require.define("/node_modules/crypto-browserify/rng.js",function(require,module,exports,__dirname,__filename,process,global){// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  // currently only available in webkit-based browsers.
  if (_global.crypto && crypto.getRandomValues) {
    var _rnds = new Uint32Array(4);
    whatwgRNG = function(size) {
      var bytes = new Array(size);
      crypto.getRandomValues(_rnds);

      for (var c = 0 ; c < size; c++) {
        bytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;
      }
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())
});

require.define("/lib/sha1.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

(function () {

var root = this; // window on browser
var exports;
var crypto;
if (typeof module === 'undefined') {
  root.weibo = root.weibo || {};
  exports = root.weibo.sha1 = {};
} else {
  exports = module.exports;
}

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = "="; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s) {
  return binb2hex(core_sha1(str2binb(s), s.length * chrsz));
}
exports.hex_sha1 = hex_sha1;

function b64_sha1(s) {
  return binb2b64(core_sha1(str2binb(s), s.length * chrsz));
}
exports.b64_sha1 = b64_sha1;

function str_sha1(s) { 
  return binb2str(core_sha1(str2binb(s), s.length * chrsz));
}
exports.str_sha1 = str_sha1;

function hex_hmac_sha1(key, data) { 
  return binb2hex(core_hmac_sha1(key, data));
}
exports.hex_hmac_sha1 = hex_hmac_sha1;

function b64_hmac_sha1(key, data) { 
  return binb2b64(core_hmac_sha1(key, data));
}
exports.b64_hmac_sha1 = b64_hmac_sha1;

function str_hmac_sha1(key, data) { 
  return binb2str(core_hmac_sha1(key, data));
}
exports.str_hmac_sha1 = str_hmac_sha1;

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test() {
  return hex_sha1("abc") === "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = new Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for (var i = 0; i < x.length; i += 16) {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for (var j = 0; j < 80; j++) {
      if (j < 16) {
        w[j] = x[i + j];
      }
      else {
        w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      }
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return [ a, b, c, d, e ];

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d) {
  if (t < 20) {
    return (b & c) | ((~b) & d);
  }
  if (t < 40) {
    return b ^ c ^ d;
  }
  if (t < 60) {
    return (b & c) | (b & d) | (c & d);
  }
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t) {
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data) {
  var bkey = str2binb(key);
  if (bkey.length > 16) {
    bkey = core_sha1(bkey, key.length * chrsz);
  }

  var ipad = new Array(16), opad = new Array(16);
  for(var i = 0; i < 16; i++) {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str) {
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}
exports.str2binb = str2binb;

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin) {
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}
exports.binb2str = binb2str;

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray) {
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++) {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
     hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}
exports.binb2hex = binb2hex;

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray) {
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3) {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}
exports.binb2b64 = binb2b64;

})();
});

require.define("/lib/tsina.js",function(require,module,exports,__dirname,__filename,process,global){var utils = require('./utils');
var OAuth = require('./oauth');
var EventProxy = require('eventproxy').EventProxy;
var urllib = require('./urllib');
var fs = require('fs');
var path = require('path');

var TSinaAPI = module.exports = {
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
      args.dataType = 'json';
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
        var params = { oauth_token: token.oauth_token, forcelogin: 'true' };
        params.oauth_callback = user.oauth_callback || this.config.oauth_callback ||
          this.config.default_oauth_callback;
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
    if (typeof error === 'string') {
      try {
        error = JSON.parse(error);
        if (!error.message) {
          error.message = error.error_CN || error.error;
        }
      } catch (err) {
        err.data = error;
        error = err;
      }
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

});

require.define("/lib/oauth.js",function(require,module,exports,__dirname,__filename,process,global){/*
 * Copyright 2008 Netflix, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Here's some JavaScript software that's useful for implementing OAuth.
// The HMAC-SHA1 signature method calls b64_hmac_sha1, defined by
// http://pajhome.org.uk/crypt/md5/sha1.js
/* An OAuth message is represented as an object like this:
   {method: "GET", action: "http://server.com/path", parameters: ...}
   The parameters may be either a map {name: value, name2: value2}
   or an Array of name-value pairs [[name, value], [name2, value2]].
   The latter representation is more powerful: it supports parameters
   in a specific sequence, or several parameters with the same name;
   for example [["a", 1], ["b", 2], ["a", 3]].
   Parameter names and values are NOT percent-encoded in an object.
   They must be encoded before transmission and decoded after reception.
   For example, this message object:
   {method: "GET", action: "http://server/path", parameters: {p: "x y"}}
   ... can be transmitted as an HTTP request that begins:
   GET /path?p=x%20y HTTP/1.0
   (This isn't a valid OAuth request, since it lacks a signature etc.)
   Note that the object "x y" is transmitted as x%20y.  To encode
   parameters, you can call OAuth.addToURL, OAuth.formEncode or
   OAuth.getAuthorization.
   This message object model harmonizes with the browser object model for
   input elements of an form, whose value property isn't percent encoded.
   The browser encodes each value before transmitting it. For example,
   see consumer.setInputs in example/consumer.js.
 */

(function () {

var utils;
if (typeof require !== 'undefined') {
  utils = require('./utils');
} else {
  utils = weibo.utils;
}

var OAuth = {};

OAuth.setProperties = function setProperties(into, from) {
  if (into && from) {
    for (var key in from) {
      into[key] = from[key];
    }
  }
  return into;
};

// utility functions
OAuth.setProperties(OAuth, {
  percentEncode: function percentEncode(s) {
    if (!s) {
      return "";
    }
    if (s instanceof Array) {
      var e = "";
      for (var i = 0; i < s.length; ++s) {
        if (e) {
          e += '&';
        }
        e += percentEncode(s[i]);
      }
      return e;
    }
    s = encodeURIComponent(s);
    // Now replace the values which encodeURIComponent doesn't do
    // encodeURIComponent ignores: - _ . ! ~ * ' ( )
    // OAuth dictates the only ones you can ignore are: - _ . ~
    // Source: http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Functions:encodeURIComponent
    s = s.replace(/\!/g, "%21");
    s = s.replace(/\*/g, "%2A");
    s = s.replace(/\'/g, "%27");
    // s = s.replace("(", "%28", "g");
    s = s.replace(/\(/g, "%28");
    s = s.replace(/\)/g, "%29");
    return s;
  },
  decodePercent: decodeURIComponent,
  /** Convert the given parameters to an Array of name-value pairs. */
  getParameterList: function getParameterList(parameters) {
    if (!parameters) {
      return [];
    }
    if (typeof parameters !== "object") {
      return this.decodeForm(parameters + "");
    }
    if (parameters instanceof Array) {
      return parameters;
    }
    var list = [];
    for (var p in parameters) {
      list.push([ p, parameters[p] ]);
    }
    return list;
  },
  /** Convert the given parameters to a map from name to value. */
  getParameterMap: function getParameterMap(parameters) {
    if (!parameters) {
      return {};
    }
    if (typeof parameters !== "object") {
      return this.getParameterMap(this.decodeForm(parameters + ""));
    }
    if (parameters instanceof Array) {
      var map = {};
      for (var p = 0; p < parameters.length; ++p) {
        var key = parameters[p][0];
        if (map[key] === undefined) { // first value wins
          map[key] = parameters[p][1];
        }
      }
      return map;
    }
    return parameters;
  },
  formEncode: function formEncode(parameters) {
    var form = "";
    var list = OAuth.getParameterList(parameters);
    for (var p = 0, l = list.length; p < l; p++) {
      var pair = list[p];
      var value = pair[1];
      if (!value) {
        value = "";
      }
      if (form) {
        form += '&';
      }
      form += OAuth.percentEncode(pair[0]) + '=' + OAuth.percentEncode(value);
    }
    return form;
  },
  decodeForm: function decodeForm(form) {
    var list = [];
    var nvps = form.split('&');
    for (var n = 0; n < nvps.length; ++n) {
      var nvp = nvps[n];
      if (!nvp) {
        continue;
      }
      var equals = nvp.indexOf('=');
      var name;
      var value;
      if (equals < 0) {
        name = OAuth.decodePercent(nvp);
        value = null;
      } else {
        name = OAuth.decodePercent(nvp.substring(0, equals));
        value = OAuth.decodePercent(nvp.substring(equals + 1));
      }
      list.push([name, value]);
    }
    return list;
  },
  setParameter: function setParameter(message, name, value) {
    var parameters = message.parameters;
    if (parameters instanceof Array) {
      for (var p = 0; p < parameters.length; ++p) {
        if (parameters[p][0] === name) {
          if (value === undefined) {
            parameters.splice(p, 1);
          } else {
            parameters[p][1] = value;
            value = undefined;
          }
        }
      }
      if (value !== undefined) {
        parameters.push([name, value]);
      }
    } else {
      parameters = OAuth.getParameterMap(parameters);
      parameters[name] = value;
      message.parameters = parameters;
    }
  },
  setParameters: function setParameters(message, parameters) {
    var list = OAuth.getParameterList(parameters);
    for (var i = 0; i < list.length; ++i) {
      OAuth.setParameter(message, list[i][0], list[i][1]);
    }
  },
  setTimestampAndNonce: function setTimestampAndNonce(message) {
    OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
    OAuth.setParameter(message, "oauth_nonce", OAuth.nonce(32));
  },
  addToURL: function addToURL(url, parameters) {
      if (parameters) {
        var toAdd = OAuth.formEncode(parameters);
        if (toAdd) {
          if (url.indexOf('?') < 0) {
            url += '?';
          } else {
            url += '&';
          }
          url += toAdd;
        }
      }
      return url;
  },
  /** Construct the value of the Authorization header for an HTTP request. */
  getAuthorizationHeader: function getAuthorizationHeader(realm, parameters) {
    var header = '';
    if (realm) {
      header += ', realm="' + OAuth.percentEncode(realm) + '"';
    }
    var list = OAuth.getParameterList(parameters);
    for (var p = 0; p < list.length; ++p) {
      var parameter = list[p];
      var name = parameter[0];
      if (name.indexOf("oauth_") === 0) {
        header += ', ' + OAuth.percentEncode(name) + '="' + OAuth.percentEncode(parameter[1]) + '"';
      }
    }
    return 'OAuth ' + header.substring(2);
  },

  timestamp: function timestamp() {
    return Math.floor(new Date().getTime() / 1000);
  },

  nonce: function nonce(length) {
    if (!length) {
      return '';
    }
    var chars = OAuth.nonce.CHARS;
    var result = "";
    for (var i = 0; i < length; ++i) {
      var rnum = Math.floor(Math.random() * chars.length);
      result += chars.substring(rnum, rnum + 1);
    }
    return result;
  }
});

OAuth.nonce.CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
/** Define a constructor function,
    without causing trouble to anyone who was using it as a namespace.
    That is, if parent[name] already existed and had properties,
    copy those properties into the new constructor.
 */
OAuth.declareClass = function declareClass(parent, name, newConstructor) {
  var previous = parent[name];
  parent[name] = newConstructor;
  if (newConstructor && previous) {
    for (var key in previous) {
      if (key !== "prototype") {
        newConstructor[key] = previous[key];
      }
    }
  }
  return newConstructor;
};

/** An abstract algorithm for signing messages. */
OAuth.declareClass(OAuth, "SignatureMethod", function OAuthSignatureMethod() {});

// instance members
OAuth.setProperties(OAuth.SignatureMethod.prototype, {
  /** Add a signature to the message. */
  sign: function sign(message) {
    var baseString = OAuth.SignatureMethod.getBaseString(message);
    var signature = this.getSignature(baseString);
    // console.log(baseString, this.key, signature)
    OAuth.setParameter(message, "oauth_signature", signature);
    return signature; // just in case someone's interested
  },
  /** Set the key string for signing. */
  initialize: function initialize(name, accessor) {
    var consumerSecret;
    if (accessor.accessorSecret && name.length > 9 && name.substring(name.length-9) === "-Accessor") {
        consumerSecret = accessor.accessorSecret;
    } else {
        consumerSecret = accessor.consumerSecret;
    }
    this.key = OAuth.percentEncode(consumerSecret) + "&" + OAuth.percentEncode(accessor.tokenSecret);
  }
});

/* SignatureMethod expects an accessor object to be like this:
   {tokenSecret: "lakjsdflkj...", consumerSecret: "QOUEWRI..", accessorSecret: "xcmvzc..."}
   The accessorSecret property is optional.
 */
// Class members:
OAuth.setProperties(OAuth.SignatureMethod, {
  sign: function sign(message, accessor) {
    var name = OAuth.getParameterMap(message.parameters).oauth_signature_method;
    if (!name) {
      name = 'HMAC-SHA1';
      OAuth.setParameter(message, 'oauth_signature_method', name);
    }
    OAuth.SignatureMethod.newMethod(name, accessor).sign(message);
  },

  /** Instantiate a SignatureMethod for the given method name. */
  newMethod: function newMethod(name, accessor) {
    var Impl = OAuth.SignatureMethod.REGISTERED[name];
    if (typeof Impl === 'function') {
      var method = new Impl();
      method.initialize(name, accessor);
      return method;
    }
    var err = new Error("signature_method_rejected");
    var acceptable = "";
    for (var r in OAuth.SignatureMethod.REGISTERED) {
      if (acceptable) {
        acceptable += '&';
      }
      acceptable += OAuth.percentEncode(r);
    }
    err.oauth_acceptable_signature_methods = acceptable;
    throw err;
  },
  /** A map from signature method name to constructor. */
  REGISTERED: {},
  /** Subsequently, the given constructor will be used for the named methods.
      The constructor will be called with no parameters.
      The resulting object should usually implement getSignature(baseString).
      You can easily define such a constructor by calling makeSubclass, below.
   */
  registerMethodClass: function registerMethodClass(names, classConstructor) {
    for (var n = 0, l = names.length; n < l; ++n) {
      OAuth.SignatureMethod.REGISTERED[names[n]] = classConstructor;
    }
  },
  /** Create a subclass of OAuth.SignatureMethod, with the given getSignature function. */
  makeSubclass: function makeSubclass(getSignatureFunction) {
    var SuperClass = OAuth.SignatureMethod;
    var subClass = function() {
      SuperClass.call(this);
    }; 
    subClass.prototype = new SuperClass();
    // Delete instance variables from prototype:
    // delete subclass.prototype... There aren't any.
    subClass.prototype.getSignature = getSignatureFunction;
    subClass.prototype.constructor = subClass;
    return subClass;
  },
  getBaseString: function getBaseString(message) {
      var URL = message.action;
      var q = URL.indexOf('?');
      var parameters;
      if (q < 0) {
          parameters = message.parameters;
      } else {
          // Combine the URL query string with the other parameters:
          parameters = OAuth.decodeForm(URL.substring(q + 1));
          var toAdd = OAuth.getParameterList(message.parameters);
          for (var a = 0, l = toAdd.length; a < l; ++a) {
              parameters.push(toAdd[a]);
          }
      }
      return OAuth.percentEncode(message.method.toUpperCase()) + '&' +
        OAuth.percentEncode(OAuth.SignatureMethod.normalizeUrl(URL)) + '&' +
        OAuth.percentEncode(OAuth.SignatureMethod.normalizeParameters(parameters));
  },
  normalizeUrl: function normalizeUrl(url) {
    var uri = OAuth.SignatureMethod.parseUri(url);
    var scheme = uri.protocol.toLowerCase();
    var authority = uri.authority.toLowerCase();
    var dropPort = (scheme === "http" && uri.port === 80) || (scheme === "https" && uri.port === 443);
    if (dropPort) {
      // find the last : in the authority
      var index = authority.lastIndexOf(":");
      if (index >= 0) {
        authority = authority.substring(0, index);
      }
    }
    var path = uri.path;
//        if (!path) {
//            path = "/"; // conforms to RFC 2616 section 3.2.2
//        }
    // we know that there is no query and no fragment here.
    return scheme + "://" + authority + path;
  },
  parseUri: function parseUri(str) {
    /* This function was adapted from parseUri 1.2.1
       http://stevenlevithan.com/demo/parseuri/js/assets/parseuri.js
     */
    var o = {
      key: [ "source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
      parser: { strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/ }};
    var m = o.parser.strict.exec(str);
    var uri = {};
    var i = 14;
    while (i--) {
      uri[o.key[i]] = m[i] || "";
    }
    return uri;
  },
  normalizeParameters: function normalizeParameters(parameters) {
    if (!parameters) {
      return "";
    }
    var norm = [];
    var list = OAuth.getParameterList(parameters);
    for (var p = 0; p < list.length; ++p) {
      var nvp = list[p];
      if (nvp[0] !== "oauth_signature") {
        norm.push(nvp);
      }
    }
    norm.sort(function (a, b) {
      if (a[0] < b[0]) { return -1; }
      if (a[0] > b[0]) { return 1; }
      if (a[1] < b[1]) { return  -1; }
      if (a[1] > b[1]) { return 1; }
      return 0;
    });
    return OAuth.formEncode(norm);
  }
});

OAuth.SignatureMethod.registerMethodClass(["PLAINTEXT", "PLAINTEXT-Accessor"],
OAuth.SignatureMethod.makeSubclass(
  function getSignature(baseString) {
    return this.key;
  }
));

OAuth.SignatureMethod.registerMethodClass(["HMAC-SHA1", "HMAC-SHA1-Accessor"],
OAuth.SignatureMethod.makeSubclass(
  function getSignature(baseString) {
    return utils.base64HmacSha1(baseString, this.key);
  }
));

var root = this; // window on browser
if (typeof module === 'undefined') {
  root.weibo = root.weibo || {};
  root.weibo.OAuth = OAuth;
} else {
  module.exports = OAuth;
}

})();

});

require.define("/node_modules/eventproxy/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"eventproxy.js"}
});

require.define("/node_modules/eventproxy/eventproxy.js",function(require,module,exports,__dirname,__filename,process,global){/*global exports */
/**
 * @fileoverview This file is used for define the EventProxy library.
 * @author <a href="mailto:shyvo1987@gmail.com">Jackson Tian</a>
 * @version 0.1.0
 */
(function () {
    /**
     * @description EventProxy. A module that can be mixed in to *any object* in order to provide it with
     * custom events. You may `bind` or `unbind` a callback function to an event;
     * `trigger`-ing an event fires all callbacks in succession.
     * @constructor
     * @name EventProxy
     * @class EventProxy. An implementation of task/event based asynchronous pattern.
     * @example
     * var render = function (template, resources) {};
     * var proxy = new EventProxy();
     * proxy.assign("template", "l10n", render);
     * proxy.trigger("template", template);
     * proxy.trigger("l10n", resources);
     */
    var EventProxy = function () {
        if (!(this instanceof EventProxy)) {
            return new EventProxy();
        }
        this._callbacks = {};
        this._fired = {};
    };

    /**
     * @description Bind an event, specified by a string name, `ev`, to a `callback` function.
     * Passing `"all"` will bind the callback to all events fired.
     * @memberOf EventProxy#
     * @param {string} eventName Event name.
     * @param {function} callback Callback.
     */
    EventProxy.prototype.addListener = function (ev, callback) {
        this._callbacks = this._callbacks || {};
        this._callbacks[ev] = this._callbacks[ev] || [];
        this._callbacks[ev].push(callback);
        return this;
    };
    EventProxy.prototype.bind = EventProxy.prototype.addListener;
    EventProxy.prototype.on = EventProxy.prototype.addListener;
    EventProxy.prototype.await = EventProxy.prototype.addListener;

    /**
     * @description Remove one or many callbacks. If `callback` is null, removes all
     * callbacks for the event. If `ev` is null, removes all bound callbacks
     * for all events.
     * @memberOf EventProxy#
     * @param {string} eventName Event name.
     * @param {function} callback Callback.
     */
    EventProxy.prototype.removeListener = function (ev, callback) {
        var calls = this._callbacks, i, l;
        if (!ev) {
            this._callbacks = {};
        } else if (calls) {
            if (!callback) {
                calls[ev] = [];
            } else {
                var list = calls[ev];
                if (!list) {
                    return this;
                }
                l = list.length;
                for (i = 0; i < l; i++) {
                    if (callback === list[i]) {
                        list[i] = null;
                        break;
                    }
                }
            }
        }
        return this;
    };
    EventProxy.prototype.unbind = EventProxy.prototype.removeListener;

    /**
     * @description Remove all listeners.
     * It equals unbind(); Just add this API for as same as Event.Emitter.
     * @memberOf EventProxy#
     * @param {string} event Event name.
     */
    EventProxy.prototype.removeAllListeners = function (event) {
        return this.unbind(event);
    };

    /**
     * @description Trigger an event, firing all bound callbacks. Callbacks are passed the
     * same arguments as `trigger` is, apart from the event name.
     * Listening for `"all"` passes the true event name as the first argument.
     * @param {string} eventName Event name.
     * @param {mix} data Pass in data. 
     */
    EventProxy.prototype.trigger = function (eventName, data) {
        var list, calls, ev, callback, args, i, l;
        var both = 2;
        if (!(calls = this._callbacks)) {
            return this;
        }
        while (both--) {
            ev = both ? eventName : 'all';
            list = calls[ev];
            if (list) {
                for (i = 0, l = list.length; i < l; i++) {
                    if (!(callback = list[i])) {
                        list.splice(i, 1); i--; l--;
                    } else {
                        args = both ? Array.prototype.slice.call(arguments, 1) : arguments;
                        callback.apply(this, args);
                    }
                }
            }
        }
        return this;
    };
    EventProxy.prototype.emit = EventProxy.prototype.trigger;
    EventProxy.prototype.fire = EventProxy.prototype.trigger;

    /**
     * @description Bind an event like the bind method, but will remove the listener after it was fired.
     * @param {string} ev Event name.
     * @param {function} callback Callback.
     */
    EventProxy.prototype.once = function (ev, callback) {
        var self = this,
            wrapper = function () {
                callback.apply(self, arguments);
                self.unbind(ev, wrapper);
            };
        this.bind(ev, wrapper);
        return this;
    };
    
    /**
     * @description Bind an event, and trigger it immediately.
     * @param {string} ev Event name.
     * @param {function} callback Callback.
     * @param {mix} data The data that will be passed to calback as arguments.
     */
    EventProxy.prototype.immediate = function (ev, callback, data) {
        this.bind(ev, callback);
        this.trigger(ev, data);
        return this;
    };

    var _assign = function (eventname1, eventname2, cb, once) {
        var proxy = this, length, index = 0, argsLength = arguments.length,
            bind, _all,
            callback, events, isOnce, times = 0, flag = {};

        // Check the arguments length.
        if (argsLength < 3) {
            return this;
        }

        events = Array.prototype.slice.apply(arguments, [0, argsLength - 2]);
        callback = arguments[argsLength - 2];
        isOnce = arguments[argsLength - 1];

        // Check the callback type.
        if (typeof callback !== "function") {
            return this;
        }

        length = events.length;
        bind = function (key) {
            var method = isOnce ? "once" : "bind";
            proxy[method](key, function (data) {
                proxy._fired[key] = proxy._fired[key] || {};
                proxy._fired[key].data = data;
                if (!flag[key]) {
                    flag[key] = true;
                    times++;
                }
            });
        };

        for (index = 0; index < length; index++) {
            bind(events[index]);
        }

        _all = function (event) {

            if (times < length) {
                return;
            }
            if (!flag[event]) {
                return;
            }
            var data = [];
            for (index = 0; index < length; index++) {
                data.push(proxy._fired[events[index]].data);
            }
            if (isOnce) {
                proxy.unbind("all", _all);
            }

            callback.apply(null, data);
        };
        proxy.bind("all", _all);
    };

    /**
     * @description Assign some events, after all events were fired, the callback will be executed once.
     * @example
     * proxy.all(ev1, ev2, callback);
     * proxy.all([ev1, ev2], callback);
     * proxy.all(ev1, [ev2, ev3], callback);
     * @param {string} eventName1 First event name.
     * @param {string} eventName2 Second event name.
     * @param {function} callback Callback, that will be called after predefined events were fired.
     */
    EventProxy.prototype.all = function (eventname1, eventname2, cb) {
        var args = Array.prototype.concat.apply([], arguments);
        args.push(true);
        _assign.apply(this, args);
        return this;
    };
    EventProxy.prototype.assign = EventProxy.prototype.all;

    /**
     * @description Assign some events, after all events were fired, the callback will be executed first time.
     * then any event that predefined be fired again, the callback will executed with the newest data.
     * @example
     * proxy.tail(ev1, ev2, callback);
     * proxy.tail([ev1, ev2], callback);
     * proxy.tail(ev1, [ev2, ev3], callback);
     * @memberOf EventProxy#
     * @param {string} eventName1 First event name.
     * @param {string} eventName2 Second event name.
     * @param {function} callback Callback, that will be called after predefined events were fired.
     */
    EventProxy.prototype.tail = function () {
        var args = Array.prototype.concat.apply([], arguments);
        args.push(false);
        _assign.apply(this, args);
        return this;
    };
    EventProxy.prototype.assignAll = EventProxy.prototype.tail;
    EventProxy.prototype.assignAlways = EventProxy.prototype.tail;

    /**
     * @description The callback will be executed after the event be fired N times.
     * @memberOf EventProxy#
     * @param {string} eventName Event name.
     * @param {number} times N times.
     * @param {function} callback Callback, that will be called after event was fired N times.
     */
    EventProxy.prototype.after = function (eventName, times, callback) {
        if (times === 0) {
            callback.call(null, []);
            return this;
        }
        var proxy = this,
            firedData = [],
            all;
        all = function (name, data) {
            if (name === eventName) {
                times--;
                firedData.push(data);
                if (times < 1) {
                    proxy.unbind("all", all);
                    callback.apply(null, [firedData]);
                }
            }
        };
        proxy.bind("all", all);
        return this;
    };

    /**
     * @description The callback will be executed after any registered event was fired. It only executed once.
     * @memberOf EventProxy#
     * @param {string} eventName1 Event name.
     * @param {string} eventName2 Event name.
     * @param {function} callback The callback will get a map that has data and eventName attributes.
     */
    EventProxy.prototype.any = function () {
        var proxy = this,
            index,
            _bind,
            len = arguments.length,
            callback = arguments[len - 1],
            events = Array.prototype.slice.apply(arguments, [0, len - 1]),
            count = events.length,
            _eventName = events.join("_");

        proxy.once(_eventName, callback);

        _bind = function (key) {
            proxy.bind(key, function (data) {
                proxy.trigger(_eventName, {"data": data, eventName: key});
            });
        };

        for (index = 0; index < count; index++) {
            _bind(events[index]);
        }
    };

    /**
     * @description The callback will be executed when the evnet name not equals with assigned evnet.
     * @memberOf EventProxy#
     * @param {string} eventName Event name.
     * @param {function} callback Callback.
     */
    EventProxy.prototype.not = function (eventName, callback) {
        var proxy = this;
        proxy.bind("all", function (name, data) {
            if (name !== eventName) {
                callback(data);
            }
        });
    };
    
    /**
     * Create a new EventProxy
     * @example
     *     var ep = EventProxy.create();
     *     ep.assign('user', 'articles', function(user, articles) {
     *       // do something...
     *     });
     * 
     *     // or one line ways: Create EventProxy and Assign
     *     
     *     var ep = EventProxy.create('user', 'articles', function(user, articles) {
     *       // do something...
     *     });
     * 
     * @returns {EventProxy}
     */
    EventProxy.create = function () {
        var ep = new EventProxy();
        if (arguments.length) {
            ep.assign.apply(ep, Array.prototype.slice.call(arguments));
        }
        return ep;
    };

    // Event proxy can be used in browser and Nodejs both.
    if (typeof exports !== "undefined") {
        exports.EventProxy = EventProxy;
    } else {
        this.EventProxy = EventProxy;
    }

}());

});

require.define("/lib/urllib.js",function(require,module,exports,__dirname,__filename,process,global){(function () {

var Base64;
var utils;
var root = this; // window on browser
var exports;
if (typeof module === 'undefined') {
  root.weibo = root.weibo || {};
  exports = root.weibo.urllib = {};
  Base64 = root.weibo.base64;
  utils = root.weibo.utils;
} else {
  exports = module.exports;
  Base64 = require('./base64');
  utils = require('./utils');
}

/**
 * Fixed JSON bad word, more detail see [JSON parse在各浏览器的兼容性列表](http://www.cnblogs.com/rubylouvre/archive/2011/02/12/1951760.html)
 * @type {String}
 * @const
 */
exports.RE_JSON_BAD_WORD = /[\u000B\u000C]/ig; 

/**
 * The default request timeout(in milliseconds)
 * @type {Object.<Number>}
 * @const
 */
exports.TIMEOUT = 60000;

function format_args(args) {
  if (!args) {
    args = {};
  }
  if (!args.timeout) {
    args.timeout = exports.TIMEOUT;
  }
  args.type = (args.type || 'GET').toUpperCase();
  return args;
}

function format_result(args, data, response, callback, context) {
  var error = null;
  var status_code = 0;
  if (response) {
    status_code = response.status || response.statusCode;
  }
  if (status_code === 200 || status_code === 201) {
    if (args.dataType === 'json' && typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        error = new Error('JSON format error');
        error.name = 'JSONParseError';
        error.data = data;
        error.status_code = error.statusCode = status_code;
        data = null;
      }
    }
  } else {
    error = data;
    if (typeof error === 'string') {
      try {
        error = JSON.parse(data);
        var err = new Error();
        err.name = 'HTTPResponseError';
        for (var k in error) {
          err[k] = error[k];
        }
        if (!err.message) {
          err.message = error.error || data;
        }
        error = err;
      } catch (e) {
        error = new Error(data || 'status ' + status_code);
        error.name = 'JSONParseError';
      }
      error.status_code = error.statusCode = status_code;
    }
    if (error) {
      error.status_code = error.statusCode = status_code;
    }
    data = null;
  }
  if (callback) {
    callback.call(context, error, data, response);
  }
}

var request;
if (typeof require !== 'undefined') {
  request = require('urllib').request;
} else {  
  /**
   * 封装所有http请求，自动区分处理http和https
   * 
   * @require jQuery
   * @param {String} url
   * @param {Object} args
   *   - data: request data
   *   - content: optional, if set content, `data` will ignore
   *   - type: optional, could be GET | POST | DELETE | PUT, default is GET
   *   - dataType: `text` or `json`, default is text
   *   - processData: process data or not
   *   - headers: http request headers
   *   - timeout: request timeout, default is urllib.TIMEOUT(60 seconds)
   * @param {Function} callback
   * @param {Object} optional context of callback, callback.call(context, data, error, res)
   * @api public
   */
  request = function (url, args, callback) {
    args = format_args(args);
    var processData = args.process_data || args.processData || true;
    if (args.content) {
      processData = false;
      args.data = args.content;
    }
    var dataType = args.dataType || 'text';
    $.ajax({
      url: url,
      type: args.type, 
      headers: args.headers || {}, 
      data: args.data, 
      processData: processData,
      timeout: args.timeout, 
      dataType: dataType, 
      success: function (data, text_status, xhr) {
        callback(null, data, xhr);
      }, 
      error: function (xhr, text_status, err) {
        if (!err) {
          err = new Error(text_status);
          err.name = 'AjaxRequestError';
        }
        callback(err, null, xhr);
      }
    });
  };
}

exports.request = function (url, args, callback, context) {
  args = format_args(args);
  if (args.user && args.user.proxy) {
    if (args.type === 'GET' && args.data) {
      url = utils.urljoin(url, args.data);
      delete args.data;
    }
    url = args.user.proxy + '?url=' + encodeURIComponent(url);
  }
  request(url, args, function (err, data, res) {
    if (err) {
      return format_result(args, err, res, callback, context);
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      data = data.toString();
    }
    format_result(args, data, res, callback, context);
  });
};

/**
 * 生成HTTP Basic Authentication的字符串："Base base64String"
 * 
 * @param {String} user
 * @param {String} password 
 * @return {String} 'Basic xxxxxxxxxxxxxxxx'
 * @api public
 */
exports.make_base_auth_header = function (user, password) {
  var token = user + ':' + password;
  var hash = Base64.encode(token);
  return "Basic " + hash;
};


})();
});

require.define("/lib/base64.js",function(require,module,exports,__dirname,__filename,process,global){/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

// support atob and btoa native method in browser

(function () {

var Base64 = {
 
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
  // public method for encoding
  encode: function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = Base64._utf8_encode(input);
 
    while (i < input.length) {
 
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
 
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
 
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
 
      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
    }
 
    return output;
  },
 
  // public method for decoding
  decode: function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
 
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
    while (i < input.length) {
 
      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));
 
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
 
      output = output + String.fromCharCode(chr1);
 
      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }
 
    }
 
    output = Base64._utf8_decode(output);
 
    return output;
 
  },
 
  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
 
    for (var n = 0; n < string.length; n++) {
 
      var c = string.charCodeAt(n);
 
      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
 
    }
 
    return utftext;
  },
 
  // private method for UTF-8 decoding
  _utf8_decode : function (utftext) {
    var string = "";
    var i = 0;
    var c = 0, c1 = 0, c2 = 0;
 
    while ( i < utftext.length ) {
 
      c = utftext.charCodeAt(i);
 
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return string;
  },
  /**
   * A str encode and decode use on phpwind
   * 
   * e.g.: var my_key = 'awejfosjdlxldfjlsdfwerwljxoasldf!@##@'
   *  // encode
   *  var encode_str = Base64.strcode('fawave发威', my_key);
   *  // decode
   *  var source_str = Base64.strcode(encode_str, my_key, true)
   * 
   * @param {String} str
   * @param {String} key
   * @param {Boolen} decode, default is `false`
   * @return {String} encode or decode string
   * @api public
   */
  strcode: function (str, key, decode) {
      var keybuffer = this.utf8_encode(key);
      var key_length = keybuffer.length;
      var buffer = null, encoding = 'base64';
      if(decode) {
        buffer = this.decode(str);
      } else {
        buffer = this.utf8_encode(str);
      }
      var buf = '';
      for (var i = 0, len = buffer.length; i < len; i++) {
        var k = i % key_length;
        buf += String.fromCharCode(buffer.charCodeAt(i) ^ keybuffer.charCodeAt(k));
      }
      if (decode) {
        return this.utf8_decode(buffer);
      } else {
        return this.encode(buffer);
      }
  }
};

Base64.utf8_encode = Base64._utf8_encode;
Base64.utf8_decode = Base64._utf8_decode;

var root = this; // window on browser
if (typeof module === 'undefined') {
  root.weibo = root.weibo || {};
  root.weibo.base64 = Base64;
} else {
  module.exports = Base64;
}

})();
});

require.define("/node_modules/urllib/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/urllib/index.js",function(require,module,exports,__dirname,__filename,process,global){
module.exports = require('./lib/urllib');
});

require.define("/node_modules/urllib/lib/urllib.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Module dependencies.
 */

var http = require('http');
var https = require('https');
var urlutil = require('url');
var qs = require('querystring');

var USER_AGENT = exports.USER_AGENT = 'node-urllib/1.0';
var TIME_OUT = exports.TIME_OUT = 60000; // 60 seconds

// change Agent.maxSockets to 1000
exports.agent = new http.Agent();
exports.agent.maxSockets = 1000;

exports.httpsAgent = new https.Agent();
exports.httpsAgent.maxSockets = 1000;

/**
 * The default request timeout(in milliseconds).
 * @type {Number}
 * @const
 */
exports.TIMEOUT = 5000;


/**
 * Handle all http request, both http and https support well.
 *
 * @example
 * 
 * var urllib = require('urllib');
 * // GET http://httptest.cnodejs.net
 * urllib.request('http://httptest.cnodejs.net/test/get', function(err, data, res) {});
 * // POST http://httptest.cnodejs.net
 * var args = { type: 'post', data: { foo: 'bar' } };
 * urllib.request('http://httptest.cnodejs.net/test/post', args, function(err, data, res) {});
 * 
 * @param {String} url
 * @param {Object} args
 *   - {Object} data: request data
 *   - {String|Buffer} content: optional, if set content, `data` will ignore
 *   - {String} type: optional, could be GET | POST | DELETE | PUT, default is GET
 *   - {String} dataType: `text` or `json`, default is text
 *   - {Object} headers: 
 *   - {Number} timeout: request timeout(in milliseconds), default is `exports.TIMEOUT`
 * @param {Function} callback, callback(error, data, res)
 * @param {Object} optional context of callback, callback.call(context, error, data, res)
 * @api public
 */
exports.request = function (url, args, callback, context) {
  if (typeof args === 'function') {
    context = callback;
    callback = args;
    args = null;
  }
  args = args || {};
  args.timeout = args.timeout || exports.TIMEOUT;
  args.type = (args.type || 'GET').toUpperCase();
  var info = urlutil.parse(url);
  var method = args.type;
  var port = info.port || 80;
  var httplib = http;
  var agent = exports.agent;
  if (info.protocol === 'https:') {
    httplib = https;
    agent = exports.httpsAgent;
    if (!info.port) {
      port = 443;
    }
  }
  var options = {
    host: info.hostname,
    path: info.path || '/',
    method: method,
    port: port,
    agent: agent,
    headers: args.headers || {}
  };
  var body = args.content || args.data;
  if (!args.content) {
    if (body && !(body instanceof String || body instanceof Buffer)) {
      body = qs.stringify(body);
    }
  }
  if (method === 'GET' && body) {
    options.path += (info.query ? '' : '?') + body;
    body = null;
  }
  if (body) {
    var length = body.length;
    if (!Buffer.isBuffer(body)) {
      length = Buffer.byteLength(body);
    }
    options.headers['Content-Length'] = length;
  }
  if (args.dataType === 'json') {
    options.headers.Accept = 'application/json';
  }
  var timer = null;
  var req = httplib.request(options, function (res) {
    var chunks = [], size = 0;
    res.on('data', function (chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      var data = null;
      switch (chunks.length) {
      case 0: 
        data = new Buffer(0); 
        break;
      case 1: 
        data = chunks[0]; 
        break;
      default:
        data = new Buffer(size);
        for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
          chunks[i].copy(data, pos);
          pos += chunks[i].length;
        }
        break;
      }
      var err = null;
      if (args.dataType === 'json') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          err = e;
        }
      }
      callback.call(context, err, data, res);
    });
  });
  var timeout = args.timeout;
  timer = setTimeout(function () {
    timer = null;
    req.__isTimeout = true;
    req.abort();
  }, timeout);
  req.on('error', function (err) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (req.__isTimeout) {
      err.name = 'RequestTimeoutError';
      err.message = err.message + ', request timeout for ' + timeout + 'ms.';
    } else {
      err.name = 'RequestError';
    }
    callback.call(context, err);
  });
  req.end(body);
};

/**
 * guest data charset from req.headers and html content-type meta tag
 * headers:
 *  'content-type': 'text/html;charset=gbk'
 * meta tag:
 *  {meta http-equiv="Content-Type" content="text/html; charset=xxxx"/}
 * 
 * @param {Object} res
 * @param {Buffer} data
 * @return {String} charset (lower case, eg: utf-8, gbk, gb2312, ...)
 *  If can\'t guest, return null
 * @api public
 */
exports.getCharset = function getCharset(res, data) {
  var CHARTSET_RE = /charset=([\w\-]+)/ig;
  var matchs = null;
  var end = data.length > 512 ? 512 : data.length;
  // console.log(data.toString())
  var content_type = res.headers['content-type'];
  if (content_type) {
    // guest from header first
    matchs = CHARTSET_RE.exec(content_type);
  }
  if (!matchs) {
    // guest from html header
    content_type = data.slice(0, end).toString();
    matchs = CHARTSET_RE.exec(content_type);
  }
  if (matchs) {
    return matchs[1].toLowerCase();
  }
  return null;
};

});

require.define("http",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("http-browserify")
});

require.define("/node_modules/http-browserify/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js","browserify":"index.js"}
});

require.define("/node_modules/http-browserify/index.js",function(require,module,exports,__dirname,__filename,process,global){var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');

http.request = function (params, cb) {
    if (!params) params = {};
    if (!params.host) params.host = window.location.host.split(':')[0];
    if (!params.port) params.port = window.location.port;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

});

require.define("events",function(require,module,exports,__dirname,__filename,process,global){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/http-browserify/lib/request.js",function(require,module,exports,__dirname,__filename,process,global){var EventEmitter = require('events').EventEmitter;
var Response = require('./response');
var concatStream = require('concat-stream')

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.xhr = xhr;
    self.body = concatStream()
    
    var uri = params.host + ':' + params.port + (params.path || '/');
    
    xhr.open(
        params.method || 'GET',
        (params.scheme || 'http') + '://' + uri,
        true
    );
    
    if (params.headers) {
        Object.keys(params.headers).forEach(function (key) {
            if (!self.isSafeRequestHeader(key)) return;
            var value = params.headers[key];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    xhr.setRequestHeader(key, v);
                });
            }
            else xhr.setRequestHeader(key, value)
        });
    }
    
    var res = new Response;
    res.on('ready', function () {
        self.emit('response', res);
    });
    
    xhr.onreadystatechange = function () {
        res.handle(xhr);
    };
};

Request.prototype = new EventEmitter;

Request.prototype.setHeader = function (key, value) {
    if ((Array.isArray && Array.isArray(value))
    || value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            this.xhr.setRequestHeader(key, value[i]);
        }
    }
    else {
        this.xhr.setRequestHeader(key, value);
    }
};

Request.prototype.write = function (s) {
    this.body.write(s);
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.write(s);
    this.body.end()
    this.xhr.send(this.body.getBody());
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return (Request.unsafeHeaders.indexOf(headerName.toLowerCase()) === -1)
};

});

require.define("/node_modules/http-browserify/lib/response.js",function(require,module,exports,__dirname,__filename,process,global){var EventEmitter = require('events').EventEmitter;

var Response = module.exports = function (res) {
    this.offset = 0;
};

Response.prototype = new EventEmitter;

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
                if ((Array.isArray && Array.isArray(headers[key]))
                || headers[key] instanceof Array) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = xhr.responseType.toLowerCase();
    if (respType === "blob") return xhr.responseBlob;
    if (respType === "arraybuffer") return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this.write(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this.write(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
    }
};

Response.prototype.write = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

});

require.define("/node_modules/http-browserify/node_modules/concat-stream/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {}
});

require.define("/node_modules/http-browserify/node_modules/concat-stream/index.js",function(require,module,exports,__dirname,__filename,process,global){var stream = require('stream')
var util = require('util')

function ConcatStream(cb) {
  stream.Stream.call(this)
  this.writable = true
  if (cb) this.cb = cb
  this.body = []
  if (this.cb) this.on('error', cb)
}

util.inherits(ConcatStream, stream.Stream)

ConcatStream.prototype.write = function(chunk) {
  this.body.push(chunk)
}

ConcatStream.prototype.arrayConcat = function(arrs) {
  if (arrs.length === 0) return []
  if (arrs.length === 1) return arrs[0]
  return arrs.reduce(function (a, b) { return a.concat(b) })
}

ConcatStream.prototype.isArray = function(arr) {
  var isArray = Array.isArray(arr)
  var isTypedArray = arr.toString().match(/Array/)
  return isArray || isTypedArray
}

ConcatStream.prototype.getBody = function () {
  if (this.body.length === 0) return
  if (typeof(this.body[0]) === "string") return this.body.join('')
  if (this.isArray(this.body[0])) return this.arrayConcat(this.body)
  if (typeof(Buffer) !== "undefined" && Buffer.isBuffer(this.body[0])) {
    return Buffer.concat(this.body)
  }
  return this.body
}

ConcatStream.prototype.end = function() {
  if (this.cb) this.cb(false, this.getBody())
}

module.exports = function(cb) {
  return new ConcatStream(cb)
}

module.exports.ConcatStream = ConcatStream

});

require.define("stream",function(require,module,exports,__dirname,__filename,process,global){var events = require('events');
var util = require('util');

function Stream() {
  events.EventEmitter.call(this);
}
util.inherits(Stream, events.EventEmitter);
module.exports = Stream;
// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once, and
  // only when all sources have ended.
  if (!dest._isStdio && (!options || options.end !== false)) {
    dest._pipeCount = dest._pipeCount || 0;
    dest._pipeCount++;

    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest._pipeCount--;

    // remove the listeners
    cleanup();

    if (dest._pipeCount > 0) {
      // waiting for other incoming streams to end.
      return;
    }

    dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (this.listeners('error').length === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('end', cleanup);
    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('end', cleanup);
  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

});

require.define("util",function(require,module,exports,__dirname,__filename,process,global){var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

});

require.define("https",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('http');

});

require.define("url",function(require,module,exports,__dirname,__filename,process,global){var punycode = { encode : function (s) { return s } };

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

function arrayIndexOf(array, subject) {
    for (var i = 0, j = array.length; i < j; i++) {
        if(array[i] == subject) return i;
    }
    return -1;
}

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = arrayIndexOf(rest, '@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = arrayIndexOf(rest, nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = arrayIndexOf(rest, nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = objectKeys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = arrayIndexOf(rest, delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = arrayIndexOf(rest, '#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = arrayIndexOf(rest, '?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                objectKeys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

});

require.define("querystring",function(require,module,exports,__dirname,__filename,process,global){var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    };

var objectKeys = Object.keys || function objectKeys(object) {
    if (object !== Object(object)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;
    return keys;
}


/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.3.1';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

/**
 * Parse the given query `str`, returning an object.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};

  function promote(parent, key) {
    if (parent[key].length == 0) return parent[key] = {};
    var t = {};
    for (var i in parent[key]) t[i] = parent[key][i];
    parent[key] = t;
    return t;
  }

  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{ 
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length)
        , parent = ret;

      // ?foo
      if ('' == key) key = pair, val = '';

      // nested
      if (~key.indexOf(']')) {
        var parts = key.split('[')
          , len = parts.length
          , last = len - 1;

        function parse(parts, parent, key) {
          var part = parts.shift();

          // end
          if (!part) {
            if (isArray(parent[key])) {
              parent[key].push(val);
            } else if ('object' == typeof parent[key]) {
              parent[key] = val;
            } else if ('undefined' == typeof parent[key]) {
              parent[key] = val;
            } else {
              parent[key] = [parent[key], val];
            }
          // array
          } else {
            obj = parent[key] = parent[key] || [];
            if (']' == part) {
              if (isArray(obj)) {
                if ('' != val) obj.push(val);
              } else if ('object' == typeof obj) {
                obj[objectKeys(obj).length] = val;
              } else {
                obj = parent[key] = [parent[key], val];
              }
            // prop
            } else if (~part.indexOf(']')) {
              part = part.substr(0, part.length - 1);
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            // key
            } else {
              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);
              parse(parts, obj, part);
            }
          }
        }

        parse(parts, parent, 'base');
      // optimize
      } else {
        if (notint.test(key) && isArray(parent.base)) {
          var t = {};
          for(var k in parent.base) t[k] = parent.base[k];
          parent.base = t;
        }
        set(parent.base, key, val);
      }

      return ret;
    }, {base: {}}).base;
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/lib/tqq.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    
var TSinaAPI;
var utils;
  
if (typeof require !== 'undefined') {
  TSinaAPI = require('./tsina');
  utils = require('./utils');
} else {
  TSinaAPI = weibo.TSinaAPI;
  utils = weibo.utils;
}

var TQQAPI = utils.inherits({}, TSinaAPI, {
  config: utils.extend({}, TSinaAPI.config, {
    host: 'http://open.t.qq.com/api',
    user_home_url: 'http://t.qq.com/',
    search_url: 'http://t.qq.com/k/',
    result_format: '',
    source: '', 
    oauth_key: '',
    oauth_secret: '',
    oauth_host: 'https://open.t.qq.com',
    oauth_authorize:    '/cgi-bin/authorize',
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
    friends_timeline: '/statuses/home_timeline',
    repost_timeline:    '/t/re_list_repost',
    
    mentions:             '/statuses/mentions_timeline',
    followers:            '/friends/user_fanslist',
    friends:              '/friends/user_idollist',
    favorites:            '/fav/list_t',
    favorites_create:     '/fav/addt',
    favorites_destroy:    '/fav/delt',
    counts:               '/t/re_count', //仅仅是转播数
    status_show:          '/t/show',
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
    tags:           '/tags',
    create_tag:         '/tags/create',
    destroy_tag:          '/tags/destroy',
    tags_suggestions:   '/tags/suggestions',
    
    // 搜索
    search:               '/search/t',
    user_search:        '/search/user',
    verify_credentials: '/user/info',
    
    gender_map: {0:'n', 1:'m', 2:'f'},

    ErrorCodes: {
        1: '参数错误',
        2: '频率受限',
        3: '鉴权失败',
        4: '服务器内部错误'
    }
  }),
  
  // urlencode，子类覆盖是否需要urlencode处理
  url_encode: function (text) {
    return text;
  },
  
  rate_limit_status: function (data, callback){
    callback();
  },

  //TODO: 腾讯是有提供重置未读数的接口的，后面加
  reset_count: function (data, callback) {
    callback();
  },
  
  format_upload_params: function (user, data, pic) {
    if (data.status){
      data.content = data.status;
      delete data.status;
    }
  },
    
    // 同时获取用户信息 user_show
    user_timeline: function(data, callback, context) {
      var both = this.combo(function(user_info_args, timeline_args) {
        var user_info = user_info_args[1]
          , timeline = timeline_args[1];
        if(user_info && timeline) {
            timeline.user = user_info;
        }
        callback.apply(context, timeline_args);
      });
      var user = data.user;
        var params = {name: data.id || data.screen_name, user: user};
      this.user_show(params, both.add());
      this.super_.user_timeline.call(this, data, both.add());
    },
    before_send_request: function(args, user) {
    if(args.play_load == 'string') {
      // oauth
      return;
    }
    args.data.format = 'json';
    if(args.data.count) {
      args.data.reqnum = args.data.count;
      delete args.data.count;
    }
        if(args.data.since_id) {
      args.data.pagetime = args.data.since_id;
            args.data.pageflag = args.data.pageflag === undefined ? 2 : args.data.pageflag;
      delete args.data.since_id;
    }
        if(args.data.max_id) {
      args.data.pagetime = args.data.max_id;
            args.data.pageflag = 1;
      delete args.data.max_id;
    }
        if(args.data.status || args.data.text || args.data.comment){
            args.data.content = args.data.status || args.data.text || args.data.comment;
            delete args.data.status;
            delete args.data.text;
            delete args.data.comment;
        }
        
        switch(args.url){
            case this.config.new_message:
            case this.config.user_timeline:
              if(args.data.id) {
                args.data.name = args.data.id;
            delete args.data.id;
              } else if(args.data.screen_name) {
                args.data.name = args.data.screen_name;
            delete args.data.screen_name;
              }
                break;
            case this.config.comments:
              // flag:标识0 转播列表，1点评列表 2 点评与转播列表
              args.data.flag = 1;
                args.data.rootid = args.data.id;
          delete args.data.id;
                break;
            case this.config.repost_timeline:
              args.url = args.url.replace('_repost', '');
              args.data.flag = 0;
                args.data.rootid = args.data.id;
          delete args.data.id;
                break;
            case this.config.reply:
              // 使用 回复@xxx:abc 点评实现 reply
              args.url = this.config.comment;
              args.data.content = '回复@' + args.data.reply_user_id + ':' + args.data.content;
                args.data.reid = args.data.id;
          delete args.data.id;
          delete args.data.reply_user_id;
          delete args.data.cid;
                break;
            case this.config.comment:
                args.data.reid = args.data.id;
          delete args.data.id;
                break;
            case this.config.counts:
//              console.log(args.data);
//                args.data.flag = 2;
                break;
            case this.config.repost:
                args.data.reid = args.data.id;
          delete args.data.id;
                break;
            case this.config.friendships_destroy:
            case this.config.friendships_create:
              args.data.name = args.data.id;
              delete args.data.id;
              break;
            case this.config.followers:
            case this.config.friends:
              args.data.startindex = args.data.cursor;
              args.data.name = args.data.user_id;
              if(String(args.data.startindex) == '-1') {
                args.data.startindex = '0';
              }
              if(args.data.reqnum > 30) {
                // 最大只能获取30，否则就会抛错 {"data":null,"msg":"server error","ret":4}
                args.data.reqnum = 30;
              }
              delete args.data.cursor;
              delete args.data.user_id;
              break;
            case this.config.search:
            case this.config.user_search:
              args.data.keyword = args.data.q;
              args.data.pagesize = args.data.reqnum;
              delete args.data.reqnum;
              delete args.data.q;
            break;
            case this.config.update:
              // 判断是否@回复
              if(args.data.sina_id) {
              args.data.reid = args.data.sina_id;
              delete args.data.sina_id;
              args.url = '/t/reply';
            }
            break;
        }
  },
  
  format_result: function(data, play_load, args) {
    if(play_load == 'string') {
      return data;
    }
    if(args.url == this.config.friendships_create || args.url == this.config.friendships_destroy) {
      return true;
    }
    data = data.data;
        if(!data){ return data; }
    var items = data.info || data;
    delete data.info;
    var users = data.user || {};
    if(data.results || data.users) {
      items = data.results || data.users;
    }
    if(items instanceof Array) {
        for(var i=0; i<items.length; i++) {
          items[i] = this.format_result_item(items[i], play_load, args, users);
        }
        data.items = items;
            if(data.user && !data.user.id){
                delete data.user;
            }
        if(args.url == this.config.followers || args.url == this.config.friends) {
          if(data.items.length >= parseInt(args.data.reqnum)) {
            var start_index = parseInt(args.data.startindex || '0');
            if(start_index == -1) {
              start_index = 0;
            }
            data.next_cursor = start_index + data.items.length;
          } else {
            data.next_cursor = '0'; // 无分页了
          }
        }
      } else {
        data = this.format_result_item(data, play_load, args, users);
      }
    return data;
  },

  format_result_item: function(data, play_load, args, users) {
    if(play_load == 'user' && data && data.name) {
      var user = {};
      user.t_url = 'http://t.qq.com/' + data.name;
      user.screen_name = data.nick;
      user.id = data.name;
      user.name = data.name;
      user.province = data.province_code;
      user.city = data.city_code;
      user.verified = data.isvip;
      user.gender = this.config.gender_map[data.sex||0];
      user.profile_image_url = data.head + '/50'; // 竟然直接获取的地址无法拿到头像
      user.followers_count = data.fansnum;
      user.friends_count = data.idolnum;
      user.statuses_count = data.tweetnum;
      user.description = data.introduction;
      if(data.tag) {
        user.tags = data.tag;
      }
      data = user;
    } else if(play_load == 'status' || play_load == 'comment' || play_load == 'message') {
      // type:微博类型 1-原创发表、2-转载、3-私信 4-回复 5-空回 6-提及 7: 点评
      var status = {};
//      status.status_type = data.type;
      if(data.type == 7) {
        // 腾讯的点评会今日hometimeline，很不给力
        status.status_type = 'comments_timeline';
      }
      status.t_url = 'http://t.qq.com/p/t/' + data.id;
      status.id = data.id;
      status.text = data.origtext; //data.text;
            status.created_at = new Date(data.timestamp * 1000);
            status.timestamp = data.timestamp;
            if(data.image){
                status.thumbnail_pic = data.image[0] + '/160';
                status.bmiddle_pic = data.image[0] + '/460';
                status.original_pic = data.image[0] + '/2000';
            }
      if(data.source) {
        if(data.type == 4) { 
          // 回复
          status.text = '@' + data.source.name + ' ' + status.text;
          status.related_dialogue_url = 'http://t.qq.com/p/r/' + status.id;
          status.in_reply_to_status_id = data.source.id;
          status.in_reply_to_screen_name = data.source.nick;
        } else {
          status.retweeted_status = 
            this.format_result_item(data.source, 'status', args, users);
          // 评论
          if(play_load == 'comment') {
            status.status = status.retweeted_status;
            delete status.retweeted_status;
          }
        }
      }
      status.repost_count = data.count || 0;
      status.comments_count = data.mcount || 0; // 评论数
      status.source = data.from;
      status.user = this.format_result_item(data, 'user', args, users);
      // 收件人
//      tohead: ""
//      toisvip: 0
//      toname: "macgirl"
//      tonick: "美仪"
      if(data.toname) {
        status.recipient = {
          name: data.toname,
          nick: data.tonick,
          isvip: data.toisvip,
          head: data.tohead
        };
        status.recipient = this.format_result_item(status.recipient, 'user', args, users);
      }
      
      // 如果有text属性，则替换其中的@xxx 为 中文名(@xxx)
        if(status && status.text) {
          var matchs = status.text.match(this.ONLY_AT_USER_RE);
          if(matchs) {
            status.users = {};
            for(var j=0; j<matchs.length; j++) {
              var name = matchs[j].trim().substring(1);
              status.users[name] = users[name];
            }
          }
        }
        data = status;
    } 
    return data;
  }
});

if (typeof module === 'undefined') {
  weibo.TQQAPI = TQQAPI;
} else {
  module.exports = TQQAPI;
}

})();
});

require.define("/lib/github.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    
var TSinaAPI;
var utils;
  
if (typeof require !== 'undefined') {
  TSinaAPI = require('./tsina');
  utils = require('./utils');
} else {
  TSinaAPI = weibo.TSinaAPI;
  utils = weibo.utils;
}

var GithubAPI = utils.inherits({}, TSinaAPI, {
  config: utils.extend({}, TSinaAPI.config, {
    host: 'https://api.github.com',
    result_format: '',
    source: '', 
    oauth_key: '8e14edfda73a71f1f226',
    oauth_secret: '1796ac639a8ada0dff6acfee2d63390440ca0f3b',
    oauth_callback: 'http://localhost:8088/github/callback',
    oauth_host: 'https://github.com',
    oauth_authorize: '/login/oauth/authorize',
    oauth_access_token: '/login/oauth/access_token',
    oauth_scope: '',
    
    verify_credentials: '/user',
  }),
  
  url_encode: function (text) {
    return text;
  },

  apply_auth: function (url, args, user) {
    delete args.data.source;
    if (user && user.oauth_token_key) {
      args.data.access_token = user.oauth_token_key;
    }
  },
  
  get_access_token: function (user, callback, context) {
    var params = {
      url: this.config.oauth_access_token,
      type: 'GET',
      play_load: 'json',
      api_host: this.config.oauth_host,
      data: {
        code: user.oauth_token_key,
        client_id: this.config.oauth_key, 
        client_secret: this.config.oauth_secret,
        state: user.state,
      },
    };
    this._send_request(params, function (err, data) {
      if (err) {
        callback.call(context, err);
        return;
      }
      if (data.error) {
        callback.call(context, new Error(data.error));
        return;
      }
      var authUser = {
        blogType: user.blogType,
        oauth_token_key: data.access_token,
        oauth_token_type: data.token_type,
      };
      callback.call(context, null, authUser);
    });
  },
  
  get_authorization_url: function (user, callback, context) {
    var params = {
      response_type: 'code',
      client_id: this.config.oauth_key, 
      redirect_uri: user.oauth_callback || this.config.oauth_callback,
      scope: user.oauth_scope || this.config.oauth_scope,
      state: String(new Date().getTime())
    };
    var loginURL = this.config.oauth_host + this.config.oauth_authorize + '?';
    var args = [];
    for (var k in params) {
      args.push(k + '=' + encodeURIComponent(params[k]));
    }
    loginURL += args.join('&');
    callback.call(context, null, {auth_url: loginURL});
  },

  format_user: function (data, args) {
    var user = {
      id: data.id,
      t_url: data.html_url,
      screen_name: data.name,
      name: data.login,
      location: data.location,
      followers_count: data.followers,
      friends_count: data.following,
      created_at: data.created_at,
      email: data.email,
      description: (data.bio || '') + ' ' + (data.company || ''),
      public_gists: data.public_gists,
      public_repos: data.public_repos,
      blog: data.blog,
      hireable: data.hireable,
      profile_image_url: data.avatar_url,
    };
    return user;
  },
  
});

if (typeof module === 'undefined') {
  weibo.GithubAPI = GithubAPI;
} else {
  module.exports = GithubAPI;
}

})();
});

require.define("/lib/oauth_middleware.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - oauth_middleware for connect
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = require('./tapi');

function getReferer(req, options) {
  var referer = req.headers.referer || '/';
  if (referer.indexOf(options.loginPath) === 0 || referer.indexOf(options.logoutPath) === 0) {
    referer = '/';
  }
  return referer;
}

function redirect(res, url) {
  res.writeHead(302, {
    Location: url
  });
  res.end();
}

function login(req, res, next, options) {
  var blogtypeField = options.blogtypeField;
  var blogtype = req.query[blogtypeField];
  var referer = getReferer(req, options);
  if (!options.homeUrl) {
    options.homeUrl = 'http://' + req.headers.host;
  }
  var authCallback = options.homeUrl + options.callbackPath +
    '?' + blogtypeField + '=' + blogtype;
  var user = { blogType: blogtype, oauth_callback: authCallback };
  tapi.get_authorization_url(user, function (err, authInfo) {
    if (err) {
      return next(err);
    }
    if (typeof authInfo === 'string') {
      authInfo = {
        auth_url: authInfo
      };
    }
    authInfo.referer = referer;
    req.session.oauthInfo = authInfo;
    redirect(res, authInfo.auth_url);
  });
}

function logout(req, res, next, options) {
  options.beforeLogout(req, res, function (err) {
    if (err) {
      return next(err);
    }
    var referer = getReferer(req, options);
    req.session.oauthUser = null;
    redirect(res, referer);
  });
}

function oauthCallback(req, res, next, options) {
  var blogType = req.query[options.blogtypeField];
  var oauthInfo = req.session.oauthInfo || {};
  req.session.oauthInfo = null;
  var oauth_token = req.query.oauth_token || req.query.code;
  var user = {
    blogType: blogType,
    oauth_token_key: oauth_token,
    oauth_verifier: req.query.oauth_verifier,
    oauth_token_secret: oauthInfo.oauth_token_secret,
    state: req.query.state,
  };
  var referer = oauthInfo.referer;
  tapi.get_access_token(user, function (err, accessToken) {
    if (err) {
      return next(err);
    }
    // get user info
    tapi.verify_credentials(accessToken, function (err, user) {
      if (err) {
        return next(err);
      }
      for (var k in accessToken) {
        user[k] = accessToken[k];
      }
      req.session.oauthUser = user;
      options.afterLogin(req, res, function (err) {
        if (err) {
          return next(err);
        }
        redirect(res, referer);
      });
    });
  });
}

function defaultCallback(req, res, callback) {
  callback();
}

/**
 * oauth middleware for connect
 *
 * example:
 *
 *  connect(
 *    connect.query(),
 *    connect.cookieParser(),
 *    connect.session({ secret: "oh year a secret" }),
 *    weibo.oauth()
 *  );
 *
 * @param {Object} [options]
 *   - {String} [homeUrl], use to create login success oauth_callback url with referer header, 
 *     default is `'http://' + req.headers.host`;
 *   - {String} [loginPath], login url, default is '/oauth'
 *   - {String} [logoutPath], default is '/oauth/logout'
 *   - {String} [callbackPath], default is login_path + '/callback'
 *   - {String} [blogtypeField], default is 'type', 
 *       if you want to connect weibo, login url should be '/oauth?type=weibo'
 *   - {Function(req, res, callback)} [afterLogin], when oauth login success, will call this function.
 *   - {Function(req, res, callback)} [beforeLogout], will call this function before user logout.
 */

module.exports = function oauth(options) {
  options = options || {};
  if (options.homeUrl) {
     options.homeUrl = options.homeUrl.replace(/\/+$/, ''); 
  }
  options.loginPath = options.loginPath || '/oauth';
  options.logoutPath = options.logoutPath || '/ouath/logout';
  options.callbackPath = options.callbackPath || (options.loginPath + '/callback');
  options.blogtypeField = options.blogtypeField || 'type';
  options.afterLogin = options.afterLogin || defaultCallback;
  options.beforeLogout = options.beforeLogout || defaultCallback;
  return function (req, res, next) {
    if (req.url.indexOf(options.callbackPath) === 0) {
      oauthCallback(req, res, next, options);
    } else if (req.url.indexOf(options.loginPath) === 0) {
      login(req, res, next, options);
    } else if (req.url.indexOf(options.logoutPath) === 0) {
      logout(req, res, next, options);
    } else {
      next();
    }
  };
};

});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - index.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var weibo = require('./lib/tapi');
weibo.oauth = require('./lib/oauth_middleware');

module.exports = weibo;
});
require("/index.js");
})();
