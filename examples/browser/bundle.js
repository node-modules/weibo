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

require.define("/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
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
   *  - {Number} without_mention, don't auto add `'reply@username'` to comment text or not,
   *    0: yes, 1: no, default is `0`, won't auto add.
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
    return this.api_dispatch(user).user_show(user, uid, screen_name, callback);
  },

  /* 获取API的访问频率限制。返回当前小时内还能访问的次数。
   */
  rate_limit_status: function (data, callback) {
    return this.api_dispatch(data).rate_limit_status(data, callback);
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

TAPI.friends_timeline = TAPI.home_timeline;

});

require.define("/lib/utils.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - lib/utils.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var STRING_FORMAT_REGEX = /\{\{([\w\s\.\'\"\(\),-\[\]]+)?\}\}/g;
exports.format = function (s, values) {
  return s.replace(STRING_FORMAT_REGEX, function (match, key) {
    return values[key];
  });
};

/**
 * 格式化字符串
 * eg:
 *  '{0}天有{1}个小时'.format([1, 24]) 
 *  or
 *  '{{day}}天有{{hour}}个小时'.format({day:1, hour:24}})
 * @param {Object} values
 */
String.prototype.format = function (values) {
  return exports.format(this, values);
};

var b64_hmac_sha1 = require('./sha1').b64_hmac_sha1;
var crypto = require('crypto');

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

exports.STRING_FORMAT_REGEX = STRING_FORMAT_REGEX;
exports.querystring = querystring;
exports.base64HmacSha1 = base64HmacSha1;
exports.urljoin = urljoin;
exports.htmlencode = htmlencode;

var MIME_TYPES = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'png': 'image/png',
  'bmp': 'image/bmp',
};

var BIN_TYPE = 'application/octet-stream';

exports.mimeLookup = function (name, fallback) {
  var ext = name.replace(/.*[\.\/]/, '').toLowerCase();
  return MIME_TYPES[ext] || fallback || BIN_TYPE;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 */
exports.escape = function (html) {
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

/**
 * Remove all html tags.
 * 
 * @param {String} s
 * @return {String}
 */
exports.removeHTML = function (s) {
  return s.replace(/(<.*?>)/ig, '');
};
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

require.define("/lib/tsina.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - lib/tsina.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var inherits = require('util').inherits;
var utils = require('./utils');
var EventProxy = require('eventproxy').EventProxy;
var fs = require('fs');
var path = require('path');
var TBase = require('./tbase');
var weiboutil = require('./weibo_util');


function TSinaAPI(options) {
  TSinaAPI.super_.call(this);

  var config = utils.extend({}, options, {
    host: 'http://api.t.sina.com.cn'
  });
  this.init(config);
}

inherits(TSinaAPI, TBase);
module.exports = TSinaAPI;

TSinaAPI.prototype.format_authorization_url = function (params) {
  params.forcelogin = 'true';
  return TSinaAPI.super_.prototype.format_authorization_url.call(this, params);
};

TSinaAPI.prototype.get_result_items = function (data, playload, args) {
  return data.results || data.users || data;
};

TSinaAPI.prototype.format_search_status = function (status, args) {
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
  return this.format_status(status, args);
};

TSinaAPI.prototype.format_status = function (status, args) {
  if (status.user) {
    status.user = this.format_user(status.user, args);
  }
  
  if (status.retweeted_status) {
    status.retweeted_status = this.format_status(status.retweeted_status, args);
  }
  if (status.user) {
    status.t_url = 'http://weibo.com/' + status.user.id + '/' + weiboutil.mid2url(status.mid);
  }
  return status;
};

TSinaAPI.prototype.format_user = function (user, args) {
  user.t_url = 'http://weibo.com/' + (user.domain || user.id);
  if (user.status) {
    user.status = this.format_status(user.status, args);
    if (!user.status.t_url) {
      user.status.t_url = 'http://weibo.com/' + user.id + '/' + weiboutil.mid2url(user.status.mid || user.status.id);
    }
  }
  return user;
};

TSinaAPI.prototype.format_comment = function (comment, args) {
  comment.user = this.format_user(comment.user, args);
  comment.status = this.format_status(comment.status, args);
  return comment;
};

TSinaAPI.prototype.format_message = function (message, args) {
  message.sender = this.format_user(message.sender, args);
  message.recipient = this.format_user(message.recipient, args);
  return message;
};

TSinaAPI.prototype.format_emotion = function (emotion, args) {
  emotion.title = emotion.phrase.substring(1, emotion.phrase.length - 1);
  return emotion;
};

        
//   rate_limit_status: function (data, callback, context) {
//     var params = {
//       url: this.config.rate_limit_status,
//       type: 'GET',
//       play_load: 'rate',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // since_id, max_id, count, page 
//   friends_timeline: function (data, callback, context) {
//     var params = {
//       url: this.config.friends_timeline,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // id, user_id, screen_name, since_id, max_id, count, page 
//   user_timeline: function (data, callback, context) {
//     var params = {
//       url: this.config.user_timeline,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // id, count, page
//   comments_timeline: function (data, callback, context) {
//     var params = {
//       url: this.config.comments_timeline,
//       type: 'GET',
//       play_load: 'comment',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // id, since_id, max_id, count, page
//   repost_timeline: function (data, callback, context) {
//     var params = {
//       url: this.config.repost_timeline,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // since_id, max_id, count, page 
//   mentions: function (data, callback, context){
//     var params = {
//       url: this.config.mentions,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id, user_id, screen_name, cursor, count
//   followers: function (data, callback, context) {
//     var params = {
//       url: this.config.followers,
//       type: 'GET',
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   public_timeline: function (data, callback, context) {
//     var params = {
//       url: this.config.public_timeline,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id, user_id, screen_name, cursor, count
//   friends: function (data, callback, context) {
//     var params = {
//       url: this.config.friends,
//       type: 'GET',
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // page
//   favorites: function (data, callback, context) {
//     var params = {
//       url: this.config.favorites,
//       type: 'GET',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   favorites_create: function (data, callback, context) {
//     var params = {
//       url: this.config.favorites_create,
//       type: 'POST',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   favorites_destroy: function (data, callback, context) {
//     var params = {
//       url: this.config.favorites_destroy,
//       type: 'POST',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // ids
//   counts: function (data, callback, context) {
//     var params = {
//       url: this.config.counts,
//       type: 'GET',
//       play_load: 'count',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   user_show: function (data, callback, context) {
//     var params = {
//       url: this.config.user_show,
//       type: 'GET',
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//     // since_id, max_id, count, page 
//   direct_messages: function (data, callback, context) {
//     var params = {
//       url: this.config.direct_messages,
//       type: 'GET',
//       play_load: 'message',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   destroy_msg: function (data, callback, context) {
//     var params = {
//       url: this.config.destroy_msg,
//       type: 'POST',
//       play_load: 'message',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   /*data的参数列表：
//   content 待发送消息的正文，请确定必要时需要进行URL编码 ( encode ) ，另外，不超过140英文或140汉字。
//   message 必须 0 表示悄悄话 1 表示戳一下
//   receiveUserId 必须，接收方的用户id
//   source 可选，显示在网站上的来自哪里对应的标识符。如果想显示指定的字符，请与官方人员联系。
//   */
//   new_message: function (data, callback, context) {
//     var params = {
//       url: this.config.new_message,
//       type: 'POST',
//       play_load: 'message',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // id
//   status_show: function (data, callback, context) {
//     var params = {
//       url: this.config.status_show,
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
    
//   // 格式上传参数，方便子类覆盖做特殊处理
//   // 子类可以增加自己的参数
//   format_upload_params: function (user, data, pic) {
    
//   },

    

//   repost: function (data, callback, context) {
//     var params = {
//       url: this.config.repost,
//       type: 'POST',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   comment: function (data, callback, context) {
//     var params = {
//       url: this.config.comment,
//       type: 'POST',
//       play_load: 'comment',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   reply: function (data, callback, context) {
//     var params = {
//       url: this.config.reply,
//       type: 'POST',
//       play_load: 'comment',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   comments: function (data, callback, context) {
//     var params = {
//       url: this.config.comments,
//       type: 'GET',
//       play_load: 'comment',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   comment_destroy: function (data, callback, context) {
//     var params = {
//       url: this.config.comment_destroy,
//       type: 'POST',
//       play_load: 'comment',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   friendships_create: function (data, callback, context) {
//     var params = {
//       url: this.config.friendships_create,
//       type: 'POST',
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   friendships_destroy: function (data, callback, context) {
//     var params = {
//       url: this.config.friendships_destroy,
//       type: 'POST',
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   friendships_show: function (data, callback, context) {
//     var params = {
//       url: this.config.friendships_show,
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // type
//   reset_count: function (data, callback, context) {
//     var params = {
//       url: this.config.reset_count,
//       type: 'POST',
//       play_load: 'result',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
    
//   // user_id, count, page
//   tags: function (data, callback, context) {
//     var params = {
//       url: this.config.tags,
//       play_load: 'tag',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
    
//   // count, page
//   tags_suggestions: function (data, callback, context) {
//     var params = {
//       url: this.config.tags_suggestions,
//       play_load: 'tag',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // tags
//   create_tag: function (data, callback, context) {
//     var params = {
//       url: this.config.create_tag,
//       type: 'POST',
//       play_load: 'tag',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // tag_id
//   destroy_tag: function (data, callback, context) {
//     var params = {
//       url: this.config.destroy_tag,
//       type: 'POST',
//       play_load: 'tag',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   // id
//   destroy: function (data, callback, context) {
//     if (!data || !data.id) {
//       return;
//     }
//     var params = {
//       url: this.config.destroy,
//       type: 'POST',
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // q, max_id, count
//   search: function (data, callback, context) {
//     var params = {
//       url: this.config.search,
//       play_load: 'status',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },
  
//   // q, page, count
//   user_search: function (data, callback, context) {
//     var params = {
//       url: this.config.user_search,
//       play_load: 'user',
//       data: data
//     };
//     this._send_request(params, callback, context);
//   },

//   /**
//    * List all emotions.
//    * 
//    * @param {Object} user
//    * @param {Function(err, emotions)} callback
//    *  - {Object} emotions: {
//    *    '[哈哈]': {
//    *      url: "http://img.t.sinajs.cn/t35/style/images/common/face/ext/normal/41/zz2_org.gif",
//    *      type: "face",
//    *      title: "哈哈",
//    *    },
//    *    ...
//    *  }
//    * @param {Object} context, callback context
//    * @return this
//    */
//   emotions: function (user, callback, context) {
//     // http://api.t.sina.com.cn/emotions.json?&source=3538199806&language=cnname
//     // http://api.t.sina.com.cn/emotions.json?&source=3538199806&language=twname
    
//     var ep = EventProxy.create();
//     ep.after('emotions', this.config.emotion_types.length, function (datas) {
//       var emotions = {};
//       for (var i = 0, l = datas.length; i < l; i++) {
//         var items = datas[i];
//         if (!items) {
//           continue;
//         }
//         for (var j = 0, jl = items.length; j < jl; j++) {
//           var emotion = items[j];
//           emotions[emotion.phrase] = emotion;
//         }
//       }
//       callback.call(this, null, emotions);
//     });
//     ep.once('error', function (err) {
//       ep.unbind();
//       callback.call(this, err);
//     });
//     var that = this;
//     that.config.emotion_types.forEach(function (args) {
//       var data = {
//         user: user
//       };
//       for (var k in args) {
//         data[k] = args[k];
//       }
//       var params = {
//         url: that.config.emotions,
//         play_load: 'emotion',
//         need_source: true,
//         data: data
//       };
//       that._send_request(params, function (err, emotions) {
//         if (err) {
//           return ep.emit('error', err);
//         }
//         ep.emit('emotions', emotions);
//       });
//     });
//     return this;
//   },
  
  

//   URL_RE: new RegExp('(?:\\[url\\s*=\\s*|)((?:www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+~]+)(?:\\](.+)\\[/url\\]|)', 'ig'),
//   /**
//    * format status.text to display
//    */
//   process_text: function (str_or_status, need_encode) {
//     var str = str_or_status;
//     if (need_encode === 'undedfined') {
//         need_encode = true;
//     }
//     if (str_or_status.text !== undefined) {
//         str = str_or_status.text;
//     }
//     if (str) {
//       if (need_encode) {
//         str = utils.htmlencode(str);
//       }
//       str = str.replace(this.URL_RE, this._replace_url_callback);
//       str = this.process_at(str, str_or_status); //@***
//       str = this.process_emotional(str); 
//       str = this.process_search(str); //#xxXX#
//       // iPhone emoji
//       str = str.replace( /([\uE001-\uE537])/gi, this._get_iphone_emoji);
//     }
//     return str || '&nbsp;';
//   },
//   _replace_url_callback: function (m, g1, g2) {
//     var _url = g1;
//     if (g1.indexOf('http') !== 0) {
//       _url = 'http://' + g1;
//     }
//     return '<a target="_blank" class="link" href="{{url}}">{{value}}</a>'.format({
//       url: _url, title: g1, value: g2||g1
//     });
//   },

//   _get_iphone_emoji: function (str) {
//     return "<span class=\"iphoneEmoji "+ str.charCodeAt(0).toString(16).toUpperCase()+"\"></span>";
//   },

//   SEARCH_MATCH_RE: /#([^#]+)#/g,
//   SEARCH_TPL: '<a target="_blank" href="{{search_url}}{{search}}" title="Search #{{search}}">#{{search}}#</a>',
  
//   process_search: function (str) {
//     var that = this;
//     return str.replace(this.SEARCH_MATCH_RE, function (m, g1) {
//       return that._process_search_callback(m, g1);
//     });
//   },

//   _process_search_callback: function (m, g1) {
//     // 修复#xxx@xxx#嵌套问题
//     // var search = g1.remove_html_tag();
//     return this.SEARCH_TPL.format({ search: g1, search_url: this.config.search_url });
//   },

//   format_search_text: function (str) { // 格式化主题
//     return '#' + str.trim() + '#';
//   },

//   AT_RE: /@([\w\-\_\u2E80-\u3000\u303F-\u9FFF]+)/g,
//   process_at: function (str) { 
//     //@*** u4e00-\u9fa5:中文字符 \u2E80-\u9FFF:中日韩字符
//     //【观点·@任志强】今年提出的1000万套的保障房任务可能根本完不成
//     // http://blog.oasisfeng.com/2006/10/19/full-cjk-unicode-range/
//     // CJK标点符号：3000-303F
//     var tpl = '<a class="at_user" data-name="$1" href="javascript:;" rhref="' + 
//       this.config.user_home_url + '$1" title="show users">@$1</a>';
//     return str.replace(this.AT_RE, tpl);
//   },

//   process_emotional: function (str) {
//     var that = this;
//     return str.replace(/\[([\u4e00-\u9fff,\uff1f,\w]{1,4})\]/g, function (m, g1) {
//       return that._replace_emotional_callback(m, g1);
//     });
//   },

//   EMOTIONAL_TPL: '<img title="{{title}}" src="{{src}}" />',
//   _replace_emotional_callback: function (m, g1) {
//     if (g1) {
//       var face = this.EMOTIONS[g1];
//       if (face) {
//         return this.EMOTIONAL_TPL.format({ title: m, src: FACE_URL_PRE + face });
//       }
//     }
//     return m;
//   },

// };


// //新浪微博表情转化
// var FACE_URL_PRE = TSinaAPI.FACE_URL_PRE = 'http://timg.sjs.sinajs.cn/t3/style/images/common/face/ext/normal/';
// var FACE_TPL = TSinaAPI.FACE_TPL = '[{{name}}]';
// var FACES = TSinaAPI.FACES = {
//   "呵呵": "eb/smile.gif",
//   "嘻嘻": "c2/tooth.gif",
//   "哈哈": "6a/laugh.gif",
//   "爱你": "7e/love.gif",
//   "晕": "a4/dizzy.gif",
//   "泪": "d8/sad.gif",
//   "馋嘴": "b8/cz_thumb.gif",
//   "抓狂": "4d/crazy.gif",
//   "哼": "19/hate.gif",
//   "可爱": "9c/tz_thumb.gif",
//   "怒": "57/angry.gif",
//   "汗": "13/sweat.gif",
//   "困": "8b/sleepy.gif",
//   "害羞": "05/shame_thumb.gif",
//   "睡觉": "7d/sleep_thumb.gif",
//   "钱": "90/money_thumb.gif",
//   "偷笑": "7e/hei_thumb.gif",
//   "酷": "40/cool_thumb.gif",
//   "衰": "af/cry.gif",
//   "吃惊": "f4/cj_thumb.gif",
//   "闭嘴": "29/bz_thumb.gif",
//   "鄙视": "71/bs2_thumb.gif",
//   "挖鼻屎": "b6/kbs_thumb.gif",
//   "花心": "64/hs_thumb.gif",
//   "鼓掌": "1b/gz_thumb.gif",
//   "失望": "0c/sw_thumb.gif",
//   "思考": "e9/sk_thumb.gif",
//   "生病": "b6/sb_thumb.gif",
//   "亲亲": "8f/qq_thumb.gif",
//   "怒骂": "89/nm_thumb.gif",
//   "太开心": "58/mb_thumb.gif",
//   "懒得理你": "17/ldln_thumb.gif",
//   "右哼哼": "98/yhh_thumb.gif",
//   "左哼哼": "6d/zhh_thumb.gif",
//   "嘘": "a6/x_thumb.gif",
//   "委屈": "73/wq_thumb.gif",
//   "吐": "9e/t_thumb.gif",
//   "可怜": "af/kl_thumb.gif",
//   "打哈气": "f3/k_thumb.gif",
//   "做鬼脸": "88/zgl_thumb.gif",
//   "握手": "0c/ws_thumb.gif",
//   "耶": "d9/ye_thumb.gif",
//   "good": "d8/good_thumb.gif",
//   "弱": "d8/sad_thumb.gif",
//   "不要": "c7/no_thumb.gif",
//   "ok": "d6/ok_thumb.gif",
//   "赞": "d0/z2_thumb.gif",
//   "来": "40/come_thumb.gif",
//   "蛋糕": "6a/cake.gif",
//   "心": "6d/heart.gif",
//   "伤心": "ea/unheart.gif",
//   "钟": "d3/clock_thumb.gif",
//   "猪头": "58/pig.gif",
//   "咖啡": "64/cafe_thumb.gif",
//   "话筒": "1b/m_thumb.gif",
//   "干杯": "bd/cheer.gif",
//   "绿丝带": "b8/green.gif",
//   "蜡烛": "cc/candle.gif",
//   "微风": "a5/wind_thumb.gif",
//   "月亮": "b9/moon.gif",
//   "月饼": "96/mooncake3_thumb.gif",
//   "满月": "5d/moon1_thumb.gif",
//   "酒壶": "64/wine_thumb.gif",
//   "团": "11/tuan_thumb.gif",
//   "圆": "53/yuan_thumb.gif",
//   "左抱抱": "54/left_thumb.gif",
//   "右抱抱": "0d/right_thumb.gif",
//   "乐乐": "66/guanbuzhao_thumb.gif",
//   "团圆月饼": "e6/tuanyuan_thumb.gif",
//   "快快": "49/lbq1_thumb.gif",
//   "织": "41/zz2_thumb.gif",
//   "围观": "f2/wg_thumb.gif",
//   "威武": "70/vw_thumb.gif",
//   "爱心专递": "c9/axcd_thumb.gif",
//   "奥特曼": "bc/otm_thumb.gif",
//   //亚运
//   "国旗": "dc/flag_thumb.gif",
//   "金牌": "f4/jinpai_thumb.gif",
//   "银牌": "1e/yinpai_thumb.gif",
//   "铜牌": "26/tongpai_thumb.gif",
//   "围脖": "3f/weijin_thumb.gif",
//   "温暖帽子": "f1/wennuanmaozi_thumb.gif",
//   "手套": "72/shoutao_thumb.gif",
//   "落叶": "79/yellowMood_thumb.gif",
//   "照相机": "33/camera_thumb.gif",
//   "白云": "ff/y3_thumb.gif",
//   "礼物": "c4/liwu_thumb.gif",
//   "v5": "c5/v5_org.gif",
//   "书呆子": "61/sdz_org.gif"
// };

// // http://api.t.sina.com.cn/emotions.json
// TSinaAPI.EMOTIONS = {
//   "呵呵": "eb/smile.gif", "嘻嘻": "c2/tooth.gif", "哈哈": "6a/laugh.gif", "爱你": "7e/love.gif", "晕": "a4/dizzy.gif", "泪": "d8/sad.gif", "馋嘴": "b8/cz_org.gif", "抓狂": "4d/crazy.gif", "哼": "19/hate.gif", "可爱": "9c/tz_org.gif", "怒": "57/angry.gif", "汗": "13/sweat.gif", "困": "8b/sleepy.gif", "害羞": "05/shame_org.gif", "睡觉": "7d/sleep_org.gif", "钱": "90/money_org.gif", "偷笑": "7e/hei_org.gif", "酷": "40/cool_org.gif", "衰": "af/cry.gif", "吃惊": "f4/cj_org.gif", "闭嘴": "29/bz_org.gif", "鄙视": "71/bs2_org.gif", "挖鼻屎": "b6/kbs_org.gif", "花心": "64/hs_org.gif", "鼓掌": "1b/gz_org.gif", "失望": "0c/sw_org.gif", "思考": "e9/sk_org.gif", "生病": "b6/sb_org.gif", "亲亲": "8f/qq_org.gif", "怒骂": "89/nm_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "嘘": "a6/x_org.gif", "委屈": "73/wq_org.gif", "吐": "9e/t_org.gif", "可怜": "af/kl_org.gif", "打哈气": "f3/k_org.gif", "顶": "91/d_org.gif", "疑问": "5c/yw_org.gif", "做鬼脸": "88/zgl_org.gif", "握手": "0c/ws_org.gif", "耶": "d9/ye_org.gif", "good": "d8/good_org.gif", "弱": "d8/sad_org.gif", "不要": "c7/no_org.gif", "ok": "d6/ok_org.gif", "赞": "d0/z2_org.gif", "来": "40/come_org.gif", "蛋糕": "6a/cake.gif", "心": "6d/heart.gif", "伤心": "ea/unheart.gif", "钟": "d3/clock_org.gif", "猪头": "58/pig.gif", "咖啡": "64/cafe_org.gif", "话筒": "1b/m_org.gif", "月亮": "b9/moon.gif", "太阳": "e5/sun.gif", "干杯": "bd/cheer.gif", "微风": "a5/wind_org.gif", "飞机": "6d/travel_org.gif", "兔子": "81/rabbit_org.gif", "熊猫": "6e/panda_org.gif", "给力": "c9/geili_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "织": "41/zz2_org.gif", "围观": "f2/wg_org.gif", "威武": "70/vw_org.gif", "奥特曼": "bc/otm_org.gif", "实习": "48/sx_org.gif", "自行车": "46/zxc_org.gif", "照相机": "33/camera_org.gif", "叶子": "b8/green_org.gif", "春暖花开": "ca/chunnuanhuakai_org.gif", "咆哮": "4b/paoxiao_org.gif", "彩虹": "03/ch_org.gif", "沙尘暴": "69/sc_org.gif", "地球一小时": "4f/diqiuxiuxiyixiaoshi_org.gif", "爱心传递": "c9/axcd_org.gif", "蜡烛": "cc/candle.gif", "绿丝带": "b8/green.gif", "挤眼": "c3/zy_org.gif", "亲亲": "8f/qq_org.gif", "怒骂": "89/nm_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "打哈气": "f3/k_org.gif", "生病": "b6/sb_org.gif", "书呆子": "61/sdz_org.gif", "失望": "0c/sw_org.gif", "可怜": "af/kl_org.gif", "挖鼻屎": "b6/kbs_org.gif", "黑线": "91/h_org.gif", "花心": "64/hs_org.gif", "可爱": "9c/tz_org.gif", "吐": "9e/t_org.gif", "委屈": "73/wq_org.gif", "思考": "e9/sk_org.gif", "哈哈": "6a/laugh.gif", "嘘": "a6/x_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "疑问": "5c/yw_org.gif", "阴险": "6d/yx_org.gif", "做鬼脸": "88/zgl_org.gif", "爱你": "7e/love.gif", "馋嘴": "b8/cz_org.gif", "顶": "91/d_org.gif", "钱": "90/money_org.gif", "嘻嘻": "c2/tooth.gif", "汗": "13/sweat.gif", "呵呵": "eb/smile.gif", "睡觉": "7d/sleep_org.gif", "困": "8b/sleepy.gif", "害羞": "05/shame_org.gif", "悲伤": "1a/bs_org.gif", "鄙视": "71/bs2_org.gif", "抱抱": "7c/bb_org.gif", "拜拜": "70/88_org.gif", "怒": "57/angry.gif", "吃惊": "f4/cj_org.gif", "闭嘴": "29/bz_org.gif", "泪": "d8/sad.gif", "偷笑": "7e/hei_org.gif", "哼": "19/hate.gif", "晕": "a4/dizzy.gif", "衰": "af/cry.gif", "抓狂": "4d/crazy.gif", "愤怒": "bd/fn_org.gif", "感冒": "a0/gm_org.gif", "鼓掌": "1b/gz_org.gif", "酷": "40/cool_org.gif", "来": "40/come_org.gif", "good": "d8/good_org.gif", "haha": "13/ha_org.gif", "不要": "c7/no_org.gif", "ok": "d6/ok_org.gif", "拳头": "cc/o_org.gif", "弱": "d8/sad_org.gif", "握手": "0c/ws_org.gif", "赞": "d0/z2_org.gif", "耶": "d9/ye_org.gif", "最差": "3e/bad_org.gif", "右抱抱": "0d/right_org.gif", "左抱抱": "54/left_org.gif", "粉红丝带": "77/pink_org.gif", "爱心传递": "c9/axcd_org.gif", "心": "6d/heart.gif", "绿丝带": "b8/green.gif", "蜡烛": "cc/candle.gif", "围脖": "3f/weijin_org.gif", "温暖帽子": "f1/wennuanmaozi_org.gif", "手套": "72/shoutao_org.gif", "红包": "71/hongbao_org.gif", "喜": "bf/xi_org.gif", "礼物": "c4/liwu_org.gif", "蛋糕": "6a/cake.gif", "钻戒": "31/r_org.gif", "钻石": "9f/diamond_org.gif", "大巴": "9c/dynamicbus_org.gif", "飞机": "6d/travel_org.gif", "自行车": "46/zxc_org.gif", "汽车": "a4/jc_org.gif", "手机": "4b/sj2_org.gif", "照相机": "33/camera_org.gif", "药": "5d/y_org.gif", "电脑": "df/dn_org.gif", "手纸": "55/sz_org.gif", "落叶": "79/yellowMood_org.gif", "圣诞树": "a2/christree_org.gif", "圣诞帽": "06/chrishat_org.gif", "圣诞老人": "c5/chrisfather_org.gif", "圣诞铃铛": "64/chrisbell_org.gif", "圣诞袜": "08/chrisocks_org.gif", "图片": "ce/tupianimage_org.gif", "六芒星": "c2/liumangxing_org.gif", "地球一小时": "4f/diqiuxiuxiyixiaoshi_org.gif", "植树节": "56/zhishujie_org.gif", "粉蛋糕": "bf/nycake_org.gif", "糖果": "34/candy_org.gif", "万圣节": "73/nanguatou2_org.gif", "火炬": "3b/hj_org.gif", "酒壶": "64/wine_org.gif", "月饼": "96/mooncake3_org.gif", "满月": "5d/moon1_org.gif", "巧克力": "b1/qkl_org.gif", "脚印": "12/jy_org.gif", "酒": "39/j2_org.gif", "狗": "5d/g_org.gif", "工作": "b2/gz3_org.gif", "档案": "ce/gz2_org.gif", "叶子": "b8/green_org.gif", "钢琴": "b2/gq_org.gif", "印迹": "84/foot_org.gif", "钟": "d3/clock_org.gif", "茶": "a8/cha_org.gif", "西瓜": "6b/watermelon.gif", "雨伞": "33/umb_org.gif", "电视机": "b3/tv_org.gif", "电话": "9d/tel_org.gif", "太阳": "e5/sun.gif", "星": "0b/star_org.gif", "哨子": "a0/shao.gif", "话筒": "1b/m_org.gif", "音乐": "d0/music_org.gif", "电影": "77/movie_org.gif", "月亮": "b9/moon.gif", "唱歌": "79/ktv_org.gif", "冰棍": "3a/ice.gif", "房子": "d1/house_org.gif", "帽子": "25/hat_org.gif", "足球": "c0/football.gif", "鲜花": "6c/flower_org.gif", "花": "6c/flower.gif", "风扇": "92/fan.gif", "干杯": "bd/cheer.gif", "咖啡": "64/cafe_org.gif", "兔子": "81/rabbit_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "给力": "c9/geili_org.gif", "萌": "42/kawayi_org.gif", "鸭梨": "bb/pear_org.gif", "熊猫": "6e/panda_org.gif", "互粉": "89/hufen_org.gif", "织": "41/zz2_org.gif", "围观": "f2/wg_org.gif", "扔鸡蛋": "91/rjd_org.gif", "奥特曼": "bc/otm_org.gif", "威武": "70/vw_org.gif", "伤心": "ea/unheart.gif", "热吻": "60/rw_org.gif", "囧": "15/j_org.gif", "orz": "c0/orz1_org.gif", "宅": "d7/z_org.gif", "小丑": "6b/xc_org.gif", "帅": "36/s2_org.gif", "猪头": "58/pig.gif", "实习": "48/sx_org.gif", "骷髅": "bd/kl2_org.gif", "便便": "34/s_org.gif", "雪人": "d9/xx2_org.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "跳舞花": "70/twh_org.gif", "礼花": "3d/bingo_org.gif", "打针": "b0/zt_org.gif", "叹号": "3b/th_org.gif", "问号": "9d/wh_org.gif", "句号": "9b/jh_org.gif", "逗号": "cc/dh_org.gif", "1": "9b/1_org.gif", "2": "2c/2_org.gif", "3": "f3/3_org.gif", "4": "2c/4_org.gif", "5": "d5/5_org.gif", "6": "dc/6_org.gif", "7": "43/7_org.gif", "8": "6d/8_org.gif", "9": "26/9_org.gif", "0": "d8/ling_org.gif", "闪": "ce/03_org.gif", "啦啦": "c1/04_org.gif", "吼吼": "34/05_org.gif", "庆祝": "67/06_org.gif", "嘿": "d3/01_org.gif", "省略号": "0d/shengluehao_org.gif", "kiss": "59/kiss2_org.gif", "圆": "53/yuan_org.gif", "团": "11/tuan_org.gif", "团圆月饼": "e6/tuanyuan_org.gif", "欢欢": "c3/liaobuqi_org.gif", "乐乐": "66/guanbuzhao_org.gif", "管不着爱": "78/2guanbuzhao1_org.gif", "爱": "09/ai_org.gif", "了不起爱": "11/2liaobuqiai_org.gif", "有点困": "68/youdiankun_org.gif", "yes": "9e/yes_org.gif", "咽回去了": "72/yanhuiqule_org.gif", "鸭梨很大": "01/yalihenda_org.gif", "羞羞": "42/xiuxiu_org.gif", "喜欢你": "6b/xihuang_org.gif", "小便屁": "a0/xiaobianpi_org.gif", "无奈": "d6/wunai22_org.gif", "兔兔": "da/tutu_org.gif", "吐舌头": "98/tushetou_org.gif", "头晕": "48/touyun_org.gif", "听音乐": "d3/tingyinyue_org.gif", "睡大觉": "65/shuijiao_org.gif", "闪闪紫": "9e/shanshanzi_org.gif", "闪闪绿": "a8/shanshanlu_org.gif", "闪闪灰": "1e/shanshanhui_org.gif", "闪闪红": "10/shanshanhong_org.gif", "闪闪粉": "9d/shanshanfen_org.gif", "咆哮": "4b/paoxiao_org.gif", "摸头": "2c/motou_org.gif", "真美好": "d2/meihao_org.gif", "脸红自爆": "d8/lianhongzibao_org.gif", "哭泣女": "1c/kuqinv_org.gif", "哭泣男": "38/kuqinan_org.gif", "空": "fd/kong_org.gif", "尽情玩": "9f/jinqingwan_org.gif", "惊喜": "b8/jingxi_org.gif", "惊呆": "58/jingdai_org.gif", "胡萝卜": "e1/huluobo_org.gif", "欢腾去爱": "63/huangtengquai_org.gif", "感冒了": "67/ganmao_org.gif", "怒了": "ef/fennu_org.gif", "我要奋斗": "a6/fendou123_org.gif", "发芽": "95/faya_org.gif", "春暖花开": "ca/chunnuanhuakai_org.gif", "抽烟": "83/chouyan_org.gif", "昂": "31/ang_org.gif", "啊": "12/aa_org.gif", "自插双目": "d3/zichashuangmu_org.gif", "咦": "9f/yiwen_org.gif", "嘘嘘": "cf/xu_org.gif", "我吃": "00/wochiwode_org.gif", "喵呜": "a7/weiqu_org.gif", "v5": "c5/v5_org.gif", "调戏": "f7/tiaoxi_org.gif", "打牙": "d7/taihaoxiaole_org.gif", "手贱": "b8/shoujian_org.gif", "色": "a1/se_org.gif", "喷": "4a/pen_org.gif", "你懂的": "2e/nidongde_org.gif", "喵": "a0/miaomiao_org.gif", "美味": "c1/meiwei_org.gif", "惊恐": "46/jingkong_org.gif", "感动": "7c/gandong_org.gif", "放开": "55/fangkai_org.gif", "痴呆": "e8/chidai_org.gif", "扯脸": "99/chelian_org.gif", "不知所措": "ab/buzhisuocuo_org.gif", "白眼": "24/baiyan_org.gif", "猥琐": "e1/weisuo_org.gif", "挑眉": "c9/tiaomei_org.gif", "挑逗": "3c/tiaodou_org.gif", "亲耳朵": "1c/qinerduo_org.gif", "媚眼": "32/meiyan_org.gif", "冒个泡": "32/maogepao_org.gif", "囧耳朵": "f0/jiongerduo_org.gif", "鬼脸": "14/guilian_org.gif", "放电": "fd/fangdian_org.gif", "悲剧": "ea/beiju_org.gif", "抚摸": "78/touch_org.gif", "大汗": "13/sweat_org.gif", "大惊": "74/suprise_org.gif", "惊哭": "0c/supcry_org.gif", "星星眼": "5c/stareyes_org.gif", "好困": "8b/sleepy_org.gif", "呕吐": "75/sick_org.gif", "加我一个": "ee/plus1_org.gif", "痞痞兔耶": "19/pipioye_org.gif", "mua": "c6/muamua_org.gif", "面抽": "fd/mianchou_org.gif", "大笑": "6a/laugh_org.gif", "揉": "d6/knead_org.gif", "痞痞兔囧": "38/jiong_org.gif", "哈尼兔耶": "53/honeyoye_org.gif", "开心": "40/happy_org.gif", "咬手帕": "af/handkerchief_org.gif", "去": "6b/go_org.gif", "晕死了": "a4/dizzy_org.gif", "大哭": "af/cry_org.gif", "扇子遮面": "a1/coverface_org.gif", "怒气": "ea/angery_org.gif", "886": "6f/886_org.gif", "雾": "68/w_org.gif", "台风": "55/tf_org.gif", "沙尘暴": "69/sc_org.gif", "晴转多云": "d2/qzdy_org.gif", "流星": "8e/lx_org.gif", "龙卷风": "6a/ljf_org.gif", "洪水": "ba/hs2_org.gif", "风": "74/gf_org.gif", "多云转晴": "f3/dyzq_org.gif", "彩虹": "03/ch_org.gif", "冰雹": "05/bb2_org.gif", "微风": "a5/wind_org.gif", "阳光": "1a/sunny_org.gif", "雪": "00/snow_org.gif", "闪电": "e3/sh_org.gif", "下雨": "50/rain.gif", "阴天": "37/dark_org.gif", "白羊": "07/byz2_org.gif", "射手": "46/ssz2_org.gif", "双鱼": "e2/syz2_org.gif", "双子": "89/szz2_org.gif", "天秤": "6b/tpz2_org.gif", "天蝎": "1e/txz2_org.gif", "水瓶": "1b/spz2_org.gif", "处女": "62/cnz2_org.gif", "金牛": "3b/jnz2_org.gif", "巨蟹": "d2/jxz2_org.gif", "狮子": "4a/leo2_org.gif", "摩羯": "16/mjz2_org.gif", "天蝎座": "09/txz_org.gif", "天秤座": "c1/tpz_org.gif", "双子座": "d4/szz_org.gif", "双鱼座": "7f/syz_org.gif", "射手座": "5d/ssz_org.gif", "水瓶座": "00/spz_org.gif", "摩羯座": "da/mjz_org.gif", "狮子座": "23/leo_org.gif", "巨蟹座": "a3/jxz_org.gif", "金牛座": "8d/jnz_org.gif", "处女座": "09/cnz_org.gif", "白羊座": "e0/byz_org.gif", "yeah": "1a/yeah_org.gif", "喜欢": "5f/xh_org.gif", "心动": "5f/xd_org.gif", "无聊": "53/wl_org.gif", "手舞足蹈": "b2/gx_org.gif", "搞笑": "09/gx2_org.gif", "痛哭": "eb/gd_org.gif", "爆发": "38/fn2_org.gif", "发奋": "31/d2_org.gif", "不屑": "b0/bx_org.gif", "加油": "d4/jiayou_org.gif", "国旗": "dc/flag_org.gif", "金牌": "f4/jinpai_org.gif", "银牌": "1e/yinpai_org.gif", "铜牌": "26/tongpai_org.gif", "哨子": "a0/shao.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "足球": "c0/football.gif", "篮球": "2c/bball_org.gif", "黑8": "6b/black8_org.gif", "排球": "cf/volleyball_org.gif", "游泳": "b9/swimming_org.gif", "乒乓球": "a5/pingpong_org.gif", "投篮": "7a/basketball_org.gif", "羽毛球": "77/badminton_org.gif", "射门": "e0/zuqiu_org.gif", "射箭": "40/shejian_org.gif", "举重": "14/juzhong_org.gif", "击剑": "38/jijian_org.gif", "烦躁": "c5/fanzao_org.gif", "呲牙": "c1/ciya_org.gif", "有钱": "e6/youqian_org.gif", "微笑": "05/weixiao_org.gif", "帅爆": "c1/shuaibao_org.gif", "生气": "0a/shengqi_org.gif", "生病了": "19/shengbing_org.gif", "色眯眯": "90/semimi_org.gif", "疲劳": "d1/pilao_org.gif", "瞄": "14/miao_org.gif", "哭": "79/ku_org.gif", "好可怜": "76/kelian_org.gif", "紧张": "75/jinzhang_org.gif", "惊讶": "dc/jingya_org.gif", "激动": "bb/jidong_org.gif", "见钱": "2b/jianqian_org.gif", "汗了": "7d/han_org.gif", "奋斗": "4e/fendou_org.gif", "小人得志": "09/xrdz_org.gif", "哇哈哈": "cc/whh_org.gif", "叹气": "90/tq_org.gif", "冻结": "d3/sjdj_org.gif", "切": "1d/q_org.gif", "拍照": "ec/pz_org.gif", "怕怕": "7c/pp_org.gif", "怒吼": "4d/nh_org.gif", "膜拜": "9f/mb2_org.gif", "路过": "70/lg_org.gif", "泪奔": "34/lb_org.gif", "脸变色": "cd/lbs_org.gif", "亲": "05/kiss_org.gif", "恐怖": "86/kb_org.gif", "交给我吧": "e2/jgwb_org.gif", "欢欣鼓舞": "2b/hxgw_org.gif", "高兴": "c7/gx3_org.gif", "尴尬": "43/gg_org.gif", "发嗲": "4e/fd_org.gif", "犯错": "19/fc_org.gif", "得意": "fb/dy_org.gif", "吵闹": "fa/cn_org.gif", "冲锋": "2f/cf_org.gif", "抽耳光": "eb/ceg_org.gif", "差得远呢": "ee/cdyn_org.gif", "被砸": "5a/bz2_org.gif", "拜托": "6e/bt_org.gif", "必胜": "cf/bs3_org.gif", "不关我事": "e8/bgws_org.gif", "上火": "64/bf_org.gif", "不倒翁": "b6/bdw_org.gif", "不错哦": "79/bco_org.gif", "眨眨眼": "3b/zy2_org.gif", "杂技": "ec/zs_org.gif", "多问号": "17/wh2_org.gif", "跳绳": "79/ts_org.gif", "强吻": "b1/q3_org.gif", "不活了": "37/lb2_org.gif", "磕头": "6a/kt_org.gif", "呜呜": "55/bya_org.gif", "不": "a2/bx2_org.gif", "狂笑": "d5/zk_org.gif", "冤": "5f/wq2_org.gif", "蜷": "87/q2_org.gif", "美好": "ae/mh_org.gif", "乐和": "5f/m2_org.gif", "揪耳朵": "15/j3_org.gif", "晃": "bf/h2_org.gif", "high": "e7/f_org.gif", "蹭": "33/c_org.gif", "抱枕": "f4/bz3_org.gif", "不公平": "85/bgp_org.gif"
// };

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

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/lib/tbase.js",function(require,module,exports,__dirname,__filename,process,global){/*!
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
var emoji = require('emoji');

/**
 * TAPI Base class, support OAuth v1.0
 */
function TBase() {
  this.config = {
    host: 'api start url',
    result_format: '.json',
    appkey: '',
    secret: '',
    oauth_host: '',
    oauth_callback: 'oob or url',
    oauth_version: '1.0',
    
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
    comments_to_me:       '/comments/to_me',
    comments_by_me:       '/comments/by_me',

    repost_timeline:      '/statuses/repost_timeline',
    comments:             '/statuses/comments',

    show:                 '/statuses/show',
    count:                '/statuses/count',
    update:               '/statuses/update',
    upload:               '/statuses/upload',
    repost:               '/statuses/repost',
    destroy:              '/statuses/destroy',

    followers:            '/statuses/followers',
    friends:              '/statuses/friends',
    favorites:            '/favorites',
    favorites_create:     '/favorites/create',
    favorites_destroy:    '/favorites/destroy/{{id}}',
    
    comment_create:       '/statuses/comment',
    comment_reply:        '/statuses/reply',
    comment_destroy:      '/statuses/comment_destroy',
    
    destroy_msg:          '/direct_messages/destroy/{{id}}',
    direct_messages:      '/direct_messages', 
    sent_direct_messages: '/direct_messages/sent', //自己发送的私信列表，我当时为什么要命名为sent_direct_messages捏，我擦
    new_message:          '/direct_messages/new',
    verify_credentials:   '/account/verify_credentials',
    user_show:            '/users/show',
    rate_limit_status:    '/account/rate_limit_status',
    friendships_create:   '/friendships/create',
    friendships_destroy:  '/friendships/destroy',
    friendships_show:     '/friendships/show',
    reset_count:          '/statuses/reset_count',
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

/**
 * Utils methods
 */

TBase.prototype.URL_RE = new RegExp('(?:\\[url\\s*=\\s*|)((?:www\\.|http[s]?://)[\\w\\.\\?%&\\-/#=;:!\\+~]+)(?:\\](.+)\\[/url\\]|)', 'ig');

TBase.prototype.process_text = function (status) {
  var text = status.text;
  if (!text) {
    return '&nbsp;';
  }
  text = utils.escape(text);
  text = text.replace(this.URL_RE, this._replace_url);
  
  text = this.process_at(text, status); //@***

  text = this.process_emotional(text, status); 

  text = this.process_search(text, status); //#xxXX#
  
  text = emoji.unifiedToHTML(emoji.softbankToUnified(text));
  return text || '&nbsp;';
};

TBase.prototype._replace_url = function (m, g1, g2) {
  var url = g1;
  if (g1.indexOf('http') !== 0) {
    url = 'http://' + g1;
  }
  var tpl = '<a target="_blank" class="link" href="{{url}}">{{value}}</a>';
  return utils.format(tpl, { url: url, title: g1, value: g2 || g1 });
};

TBase.prototype.SearchMatchReg = /#([^#]+)#/g;
TBase.prototype.process_search = function (text, status) {
  var url = this.config.search_url;
  return text.replace(this.SearchMatchReg, function (m, g1) {
    // fixed #xxx@xxx# nesting problem
    var search = utils.removeHTML(g1);
    var tpl = '<a target="_blank" href="{{url}}{{searchEncode}}" title="Search #{{search}}#">#{{search}}#</a>';
    return utils.format(tpl, {search: search, searchEncode: encodeURIComponent(search), url: url});
  });
};

// // return [[hash1, hash_value], ..., [#xxx#, xxx]]
// TBase.prototype.findSearchText = function (text, status) {
//   var matchs = text.match(this.SearchMatchReg);
//   var result = [];
//   if (matchs) {
//     for (var i = 0, len = matchs.length; i < len; i++) {
//       var s = matchs[i];
//       result.push([s, s.substring(1, s.length - 1)]);
//     }
//   }
//   return result;
// };

// TBase.prototype.formatSearchText = function (str) { // 格式化主题
//     return '#' + str.trim() + '#';
// };

TBase.prototype._at_match_rex = /@([●\w\-\_\u2E80-\u3000\u303F-\u9FFF]+)/g;
TBase.prototype.process_at = function (text, status) { 
  // Handle no-ascii
  //@*** u4e00-\u9fa5:中文字符 \u2E80-\u9FFF:中日韩字符
  //【观点·@任志强】今年提出的1000万套的保障房任务可能根本完不成
  // http://blog.oasisfeng.com/2006/10/19/full-cjk-unicode-range/
  // CJK标点符号：3000-303F
  var homeurl = this.config.user_home_url;
  return text.replace(this._at_match_rex, function (m, g1) {
    var url = homeurl + encodeURIComponent(g1);
    return '<a class="at-user-link" href="' + url + '">@' + g1 + '</a>';
  });
};

// // 获取str里面所有@用户的名称列表，不包含@符合
// find_at_users: function (str) {
//     if (!str) {
//         return null;
//     }
//     var matchs = str.match(this._at_match_rex);
//     if (matchs) {
//         var users = [];
//         for(var i = 0, l = matchs.length; i < l; i++) {
//             var name = matchs[i].substring(1);
//             if(users.indexOf(name) < 0) {
//                 users.push(name);
//             }
//         }
//         return users;
//     }
//     return null;
// },

TBase.prototype.process_emotional = function (text, status) {
  return text.replace(/\[([\u4e00-\u9fff,\uff1f,\w]{1,6})\]/g, this._replace_emotional.bind(this));
};

TBase.prototype.EMOTION_TPL = '<img title="{{title}}" src="{{src}}" />';

TBase.prototype._replace_emotional = function (m, g1) {
  if (!g1) {
    return m;
  }
  // if (!this.bgEmotions && typeof getBackgroundView !== 'undefined') {
  //   this.bgEmotions = getBackgroundView().Emotions;
  //   if (this.bgEmotions) {
  //     this.bgEmotions = this.bgEmotions.weibo;
  //   }
  // }
  // var face = this.bgEmotions && this.bgEmotions[g1];
  // if (!face) {
  //     face = TSINA_API_EMOTIONS[g1];
  //     if (face) {
  //         face = TSINA_FACE_URL_PRE + face;
  //     }
  // }
  // if (face) {
  //     return this.EMOTION_TPL.format({ title: m, src: face });
  // }
  return m;
};

TBase.prototype.url_encode = function (text) {
  return encodeURIComponent(text);
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

/**
 * OAuth
 */

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
      info.blogtype = user.blogtype;
      info.auth_url = self.format_authorization_url(params);
    }
    callback(err, info);
  });
  return this;
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
    token = self.format_access_token(token);
    token.blogtype = user.blogtype;
    callback(null, token);
  });
  return this;
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
    token.blogtype = user.blogtype;
    callback(null, token);
  });
  return this;
};

TBase.prototype.apply_auth = function (url, args, user) {
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
};

/**
 * Result getters
 */

TBase.prototype.get_result_items = function (data, playload, args) {
  throw new Error('Must override this method');
};

TBase.prototype.get_result_item = function (data, playload, args) {
  return data;
};

TBase.prototype.get_pagging_cursor = function (data, playload, args) {
  return {};
};

/**
 * Result formaters
 */

TBase.prototype.format_result = function (data, playload, args) {
  // status[]: need Array and item type is `status`
  // status: need item, type is `status`
  var index = playload.indexOf('[]');
  var isList = index > 0;
  if (isList) {
    var itemPlayload = playload.substring(0, index);
    var items = this.get_result_items(data, itemPlayload, args) || [];
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

TBase.prototype.format_access_token = function (token) {
  return querystring.parse(token);
};

TBase.prototype.format_count = function (count, args) {
  throw new Error('Must override this method.');
};

/**
 * Params converters
 */

TBase.prototype.convert_cursor = function (cursor) {
  return cursor;
};

TBase.prototype.convert_status = function (status) {
  return status;
};

TBase.prototype.convert_comment = function (comment) {
  return comment;
};

TBase.prototype.convert_user = function (data) {
  return data;
};

TBase.prototype.convert_ids = function (ids) {
  return {ids: ids};
};

/**
 * User
 */

TBase.prototype.verify_credentials = function (user, callback) {
  var params = {
    type: 'GET',
    user: user,
    playload: 'user',
    request_method: 'verify_credentials'
  };
  var url = this.config.verify_credentials;
  this.send_request(url, params, callback);
  return this;
};

TBase.prototype.user_show = function (user, uid, screen_name, callback) {
  var data = {};
  if (uid) {
    data.uid = uid;
  }
  if (screen_name) {
    data.screen_name = screen_name;
    delete data.uid; // only support one
  }
  data = this.convert_user(data);
  var params = {
    type: 'GET',
    user: user,
    data: data,
    playload: 'user',
    request_method: 'user_show'
  };
  var url = this.config.user_show;
  this.send_request(url, params, callback);
  return this;
};

/**
 * Status APIs
 */

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
    pic.content_type = utils.mimeLookup(pic.name);
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

TBase.prototype.count = function (user, ids, callback) {
  var data = this.convert_ids(ids);
  var params = {
    type: 'GET',
    playload: 'count[]',
    user: user,
    data: data,
    request_method: 'count'
  };
  var url = this.config.count;
  this.send_request(url, params, function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result.items);
  });
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

TBase.prototype.repost_timeline = function (user, cursor, callback) {
  return this._timeline('repost_timeline', user, cursor, callback);
};

TBase.prototype.search = function (user, query, cursor, callback) {
  cursor = cursor || {};
  cursor.count = cursor.count || 20;
  cursor = this.convert_cursor(cursor);
  query = utils.extend(query, cursor);
  var params = {
    type: 'GET',
    playload: 'status[]',
    user: user,
    data: query,
    request_method: 'search'
  };
  var url = this.config.search;
  this.send_request(url, params, callback);
  return this;
};

/**
 * Comment
 */

TBase.prototype.comments = function (user, cursor, callback) {
  return this._timeline('comments', user, cursor, callback, 'comment[]');
};

TBase.prototype.comments_timeline = function (user, cursor, callback) {
  return this._timeline('comments_timeline', user, cursor, callback, 'comment[]');
};

TBase.prototype.comments_mentions = function (user, cursor, callback) {
  return this._timeline('comments_mentions', user, cursor, callback, 'comment[]');
};

TBase.prototype.comments_to_me = function (user, cursor, callback) {
  return this._timeline('comments_to_me', user, cursor, callback, 'comment[]');
};

TBase.prototype.comments_by_me = function (user, cursor, callback) {
  return this._timeline('comments_by_me', user, cursor, callback, 'comment[]');
};

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

require.define("/node_modules/urllib/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/urllib/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('./lib/urllib');
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
 * @param {Object} [args], optional
 *   - {Object} [data]: request data
 *   - {String|Buffer} [content]: optional, if set content, `data` will ignore
 *   - {String} [type]: optional, could be GET | POST | DELETE | PUT, default is GET
 *   - {String} [dataType]: optional, `text` or `json`, default is text
 *   - {Object} [headers]: optional, request headers
 *   - {Number} [timeout]: request timeout(in milliseconds), default is `exports.TIMEOUT`
 *   - {Agent} [agent]: optional, http agent
 *   - {Agent} [httpsAgent]: optional, https agent
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
  var agent = args.agent || exports.agent;
  if (info.protocol === 'https:') {
    httplib = https;
    agent = args.httpsAgent || exports.httpsAgent;
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
    if (body && !(body instanceof String || Buffer.isBuffer(body))) {
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

require.define("/node_modules/emoji/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/emoji/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('./lib/emoji');
});

require.define("/node_modules/emoji/lib/emoji.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * emoji
 *
 * This file auto create by `bin/create_emoji_js.py`.
 * Emoji\'s table come from <a href="http://code.iamcal.com/php/emoji/">http://code.iamcal.com/php/emoji/</a>
 * 
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

(function () {

var jEmoji = {};
if (typeof module === 'undefined') {
  window.jEmoji = jEmoji;
} else {
  module.exports = jEmoji;
}

/**
 * Emoji code map.
 *
 * format: 
 *   Unified: [unified_unicode, title, classname, DoCoMo, KDDI, Softbank, Google]'
 * 
 * @type {Object}
 */
var EMOJI_MAP = jEmoji.EMOJI_MAP = {
  "☀": ["U+2600", "black sun with rays", "2600", ["", "U+E63E"], ["", "U+E488"], ["", "U+E04A"], ["󾀀", "U+FE000"]],
  "☁": ["U+2601", "cloud", "2601", ["", "U+E63F"], ["", "U+E48D"], ["", "U+E049"], ["󾀁", "U+FE001"]],
  "☔": ["U+2614", "umbrella with rain drops", "2614", ["", "U+E640"], ["", "U+E48C"], ["", "U+E04B"], ["󾀂", "U+FE002"]],
  "⛄": ["U+26C4", "snowman without snow", "26c4", ["", "U+E641"], ["", "U+E485"], ["", "U+E048"], ["󾀃", "U+FE003"]],
  "⚡": ["U+26A1", "high voltage sign", "26a1", ["", "U+E642"], ["", "U+E487"], ["", "U+E13D"], ["󾀄", "U+FE004"]],
  "🌀": ["U+1F300", "cyclone", "1f300", ["", "U+E643"], ["", "U+E469"], ["", "U+E443"], ["󾀅", "U+FE005"]],
  "🌁": ["U+1F301", "foggy", "1f301", ["", "U+E644"], ["", "U+E598"], ["-", "-"], ["󾀆", "U+FE006"]],
  "🌂": ["U+1F302", "closed umbrella", "1f302", ["", "U+E645"], ["", "U+EAE8"], ["", "U+E43C"], ["󾀇", "U+FE007"]],
  "🌃": ["U+1F303", "night with stars", "1f303", ["", "U+E6B3"], ["", "U+EAF1"], ["", "U+E44B"], ["󾀈", "U+FE008"]],
  "🌄": ["U+1F304", "sunrise over mountains", "1f304", ["", "U+E63E"], ["", "U+EAF4"], ["", "U+E04D"], ["󾀉", "U+FE009"]],
  "🌅": ["U+1F305", "sunrise", "1f305", ["", "U+E63E"], ["", "U+EAF4"], ["", "U+E449"], ["󾀊", "U+FE00A"]],
  "🌆": ["U+1F306", "cityscape at dusk", "1f306", ["-", "-"], ["", "U+E5DA"], ["", "U+E146"], ["󾀋", "U+FE00B"]],
  "🌇": ["U+1F307", "sunset over buildings", "1f307", ["", "U+E63E"], ["", "U+E5DA"], ["", "U+E44A"], ["󾀌", "U+FE00C"]],
  "🌈": ["U+1F308", "rainbow", "1f308", ["-", "-"], ["", "U+EAF2"], ["", "U+E44C"], ["󾀍", "U+FE00D"]],
  "❄": ["U+2744", "snowflake", "2744", ["-", "-"], ["", "U+E48A"], ["-", "-"], ["󾀎", "U+FE00E"]],
  "⛅": ["U+26C5", "sun behind cloud", "26c5", ["", "U+E63E U+E63F"], ["", "U+E48E"], ["", "U+E04A U+E049"], ["󾀏", "U+FE00F"]],
  "🌉": ["U+1F309", "bridge at night", "1f309", ["", "U+E6B3"], ["", "U+E4BF"], ["", "U+E44B"], ["󾀐", "U+FE010"]],
  "🌊": ["U+1F30A", "water wave", "1f30a", ["", "U+E73F"], ["", "U+EB7C"], ["", "U+E43E"], ["󾀸", "U+FE038"]],
  "🌋": ["U+1F30B", "volcano", "1f30b", ["-", "-"], ["", "U+EB53"], ["-", "-"], ["󾀺", "U+FE03A"]],
  "🌌": ["U+1F30C", "milky way", "1f30c", ["", "U+E6B3"], ["", "U+EB5F"], ["", "U+E44B"], ["󾀻", "U+FE03B"]],
  "🌏": ["U+1F30F", "earth globe asia-australia", "1f30f", ["-", "-"], ["", "U+E5B3"], ["-", "-"], ["󾀹", "U+FE039"]],
  "🌑": ["U+1F311", "new moon symbol", "1f311", ["", "U+E69C"], ["", "U+E5A8"], ["-", "-"], ["󾀑", "U+FE011"]],
  "🌔": ["U+1F314", "waxing gibbous moon symbol", "1f314", ["", "U+E69D"], ["", "U+E5A9"], ["", "U+E04C"], ["󾀒", "U+FE012"]],
  "🌓": ["U+1F313", "first quarter moon symbol", "1f313", ["", "U+E69E"], ["", "U+E5AA"], ["", "U+E04C"], ["󾀓", "U+FE013"]],
  "🌙": ["U+1F319", "crescent moon", "1f319", ["", "U+E69F"], ["", "U+E486"], ["", "U+E04C"], ["󾀔", "U+FE014"]],
  "🌕": ["U+1F315", "full moon symbol", "1f315", ["", "U+E6A0"], ["-", "-"], ["-", "-"], ["󾀕", "U+FE015"]],
  "🌛": ["U+1F31B", "first quarter moon with face", "1f31b", ["", "U+E69E"], ["", "U+E489"], ["", "U+E04C"], ["󾀖", "U+FE016"]],
  "🌟": ["U+1F31F", "glowing star", "1f31f", ["-", "-"], ["", "U+E48B"], ["", "U+E335"], ["󾭩", "U+FEB69"]],
  "🌠": ["U+1F320", "shooting star", "1f320", ["-", "-"], ["", "U+E468"], ["-", "-"], ["󾭪", "U+FEB6A"]],
  "🕐": ["U+1F550", "clock face one oclock", "1f550", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E024"], ["󾀞", "U+FE01E"]],
  "🕑": ["U+1F551", "clock face two oclock", "1f551", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E025"], ["󾀟", "U+FE01F"]],
  "🕒": ["U+1F552", "clock face three oclock", "1f552", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E026"], ["󾀠", "U+FE020"]],
  "🕓": ["U+1F553", "clock face four oclock", "1f553", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E027"], ["󾀡", "U+FE021"]],
  "🕔": ["U+1F554", "clock face five oclock", "1f554", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E028"], ["󾀢", "U+FE022"]],
  "🕕": ["U+1F555", "clock face six oclock", "1f555", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E029"], ["󾀣", "U+FE023"]],
  "🕖": ["U+1F556", "clock face seven oclock", "1f556", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02A"], ["󾀤", "U+FE024"]],
  "🕗": ["U+1F557", "clock face eight oclock", "1f557", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02B"], ["󾀥", "U+FE025"]],
  "🕘": ["U+1F558", "clock face nine oclock", "1f558", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02C"], ["󾀦", "U+FE026"]],
  "🕙": ["U+1F559", "clock face ten oclock", "1f559", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02D"], ["󾀧", "U+FE027"]],
  "🕚": ["U+1F55A", "clock face eleven oclock", "1f55a", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02E"], ["󾀨", "U+FE028"]],
  "🕛": ["U+1F55B", "clock face twelve oclock", "1f55b", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02F"], ["󾀩", "U+FE029"]],
  "⌚": ["U+231A", "watch", "231a", ["", "U+E71F"], ["", "U+E57A"], ["-", "-"], ["󾀝", "U+FE01D"]],
  "⌛": ["U+231B", "hourglass", "231b", ["", "U+E71C"], ["", "U+E57B"], ["-", "-"], ["󾀜", "U+FE01C"]],
  "⏰": ["U+23F0", "alarm clock", "23f0", ["", "U+E6BA"], ["", "U+E594"], ["", "U+E02D"], ["󾀪", "U+FE02A"]],
  "⏳": ["U+23F3", "hourglass with flowing sand", "23f3", ["", "U+E71C"], ["", "U+E47C"], ["-", "-"], ["󾀛", "U+FE01B"]],
  "♈": ["U+2648", "aries", "2648", ["", "U+E646"], ["", "U+E48F"], ["", "U+E23F"], ["󾀫", "U+FE02B"]],
  "♉": ["U+2649", "taurus", "2649", ["", "U+E647"], ["", "U+E490"], ["", "U+E240"], ["󾀬", "U+FE02C"]],
  "♊": ["U+264A", "gemini", "264a", ["", "U+E648"], ["", "U+E491"], ["", "U+E241"], ["󾀭", "U+FE02D"]],
  "♋": ["U+264B", "cancer", "264b", ["", "U+E649"], ["", "U+E492"], ["", "U+E242"], ["󾀮", "U+FE02E"]],
  "♌": ["U+264C", "leo", "264c", ["", "U+E64A"], ["", "U+E493"], ["", "U+E243"], ["󾀯", "U+FE02F"]],
  "♍": ["U+264D", "virgo", "264d", ["", "U+E64B"], ["", "U+E494"], ["", "U+E244"], ["󾀰", "U+FE030"]],
  "♎": ["U+264E", "libra", "264e", ["", "U+E64C"], ["", "U+E495"], ["", "U+E245"], ["󾀱", "U+FE031"]],
  "♏": ["U+264F", "scorpius", "264f", ["", "U+E64D"], ["", "U+E496"], ["", "U+E246"], ["󾀲", "U+FE032"]],
  "♐": ["U+2650", "sagittarius", "2650", ["", "U+E64E"], ["", "U+E497"], ["", "U+E247"], ["󾀳", "U+FE033"]],
  "♑": ["U+2651", "capricorn", "2651", ["", "U+E64F"], ["", "U+E498"], ["", "U+E248"], ["󾀴", "U+FE034"]],
  "♒": ["U+2652", "aquarius", "2652", ["", "U+E650"], ["", "U+E499"], ["", "U+E249"], ["󾀵", "U+FE035"]],
  "♓": ["U+2653", "pisces", "2653", ["", "U+E651"], ["", "U+E49A"], ["", "U+E24A"], ["󾀶", "U+FE036"]],
  "⛎": ["U+26CE", "ophiuchus", "26ce", ["-", "-"], ["", "U+E49B"], ["", "U+E24B"], ["󾀷", "U+FE037"]],
  "🍀": ["U+1F340", "four leaf clover", "1f340", ["", "U+E741"], ["", "U+E513"], ["", "U+E110"], ["󾀼", "U+FE03C"]],
  "🌷": ["U+1F337", "tulip", "1f337", ["", "U+E743"], ["", "U+E4E4"], ["", "U+E304"], ["󾀽", "U+FE03D"]],
  "🌱": ["U+1F331", "seedling", "1f331", ["", "U+E746"], ["", "U+EB7D"], ["", "U+E110"], ["󾀾", "U+FE03E"]],
  "🍁": ["U+1F341", "maple leaf", "1f341", ["", "U+E747"], ["", "U+E4CE"], ["", "U+E118"], ["󾀿", "U+FE03F"]],
  "🌸": ["U+1F338", "cherry blossom", "1f338", ["", "U+E748"], ["", "U+E4CA"], ["", "U+E030"], ["󾁀", "U+FE040"]],
  "🌹": ["U+1F339", "rose", "1f339", ["-", "-"], ["", "U+E5BA"], ["", "U+E032"], ["󾁁", "U+FE041"]],
  "🍂": ["U+1F342", "fallen leaf", "1f342", ["", "U+E747"], ["", "U+E5CD"], ["", "U+E119"], ["󾁂", "U+FE042"]],
  "🍃": ["U+1F343", "leaf fluttering in wind", "1f343", ["-", "-"], ["", "U+E5CD"], ["", "U+E447"], ["󾁃", "U+FE043"]],
  "🌺": ["U+1F33A", "hibiscus", "1f33a", ["-", "-"], ["", "U+EA94"], ["", "U+E303"], ["󾁅", "U+FE045"]],
  "🌻": ["U+1F33B", "sunflower", "1f33b", ["-", "-"], ["", "U+E4E3"], ["", "U+E305"], ["󾁆", "U+FE046"]],
  "🌴": ["U+1F334", "palm tree", "1f334", ["-", "-"], ["", "U+E4E2"], ["", "U+E307"], ["󾁇", "U+FE047"]],
  "🌵": ["U+1F335", "cactus", "1f335", ["-", "-"], ["", "U+EA96"], ["", "U+E308"], ["󾁈", "U+FE048"]],
  "🌾": ["U+1F33E", "ear of rice", "1f33e", ["-", "-"], ["-", "-"], ["", "U+E444"], ["󾁉", "U+FE049"]],
  "🌽": ["U+1F33D", "ear of maize", "1f33d", ["-", "-"], ["", "U+EB36"], ["-", "-"], ["󾁊", "U+FE04A"]],
  "🍄": ["U+1F344", "mushroom", "1f344", ["-", "-"], ["", "U+EB37"], ["-", "-"], ["󾁋", "U+FE04B"]],
  "🌰": ["U+1F330", "chestnut", "1f330", ["-", "-"], ["", "U+EB38"], ["-", "-"], ["󾁌", "U+FE04C"]],
  "🌼": ["U+1F33C", "blossom", "1f33c", ["-", "-"], ["", "U+EB49"], ["", "U+E305"], ["󾁍", "U+FE04D"]],
  "🌿": ["U+1F33F", "herb", "1f33f", ["", "U+E741"], ["", "U+EB82"], ["", "U+E110"], ["󾁎", "U+FE04E"]],
  "🍒": ["U+1F352", "cherries", "1f352", ["", "U+E742"], ["", "U+E4D2"], ["-", "-"], ["󾁏", "U+FE04F"]],
  "🍌": ["U+1F34C", "banana", "1f34c", ["", "U+E744"], ["", "U+EB35"], ["-", "-"], ["󾁐", "U+FE050"]],
  "🍎": ["U+1F34E", "red apple", "1f34e", ["", "U+E745"], ["", "U+EAB9"], ["", "U+E345"], ["󾁑", "U+FE051"]],
  "🍊": ["U+1F34A", "tangerine", "1f34a", ["-", "-"], ["", "U+EABA"], ["", "U+E346"], ["󾁒", "U+FE052"]],
  "🍓": ["U+1F353", "strawberry", "1f353", ["-", "-"], ["", "U+E4D4"], ["", "U+E347"], ["󾁓", "U+FE053"]],
  "🍉": ["U+1F349", "watermelon", "1f349", ["-", "-"], ["", "U+E4CD"], ["", "U+E348"], ["󾁔", "U+FE054"]],
  "🍅": ["U+1F345", "tomato", "1f345", ["-", "-"], ["", "U+EABB"], ["", "U+E349"], ["󾁕", "U+FE055"]],
  "🍆": ["U+1F346", "aubergine", "1f346", ["-", "-"], ["", "U+EABC"], ["", "U+E34A"], ["󾁖", "U+FE056"]],
  "🍈": ["U+1F348", "melon", "1f348", ["-", "-"], ["", "U+EB32"], ["-", "-"], ["󾁗", "U+FE057"]],
  "🍍": ["U+1F34D", "pineapple", "1f34d", ["-", "-"], ["", "U+EB33"], ["-", "-"], ["󾁘", "U+FE058"]],
  "🍇": ["U+1F347", "grapes", "1f347", ["-", "-"], ["", "U+EB34"], ["-", "-"], ["󾁙", "U+FE059"]],
  "🍑": ["U+1F351", "peach", "1f351", ["-", "-"], ["", "U+EB39"], ["-", "-"], ["󾁚", "U+FE05A"]],
  "🍏": ["U+1F34F", "green apple", "1f34f", ["", "U+E745"], ["", "U+EB5A"], ["", "U+E345"], ["󾁛", "U+FE05B"]],
  "👀": ["U+1F440", "eyes", "1f440", ["", "U+E691"], ["", "U+E5A4"], ["", "U+E419"], ["󾆐", "U+FE190"]],
  "👂": ["U+1F442", "ear", "1f442", ["", "U+E692"], ["", "U+E5A5"], ["", "U+E41B"], ["󾆑", "U+FE191"]],
  "👃": ["U+1F443", "nose", "1f443", ["-", "-"], ["", "U+EAD0"], ["", "U+E41A"], ["󾆒", "U+FE192"]],
  "👄": ["U+1F444", "mouth", "1f444", ["", "U+E6F9"], ["", "U+EAD1"], ["", "U+E41C"], ["󾆓", "U+FE193"]],
  "👅": ["U+1F445", "tongue", "1f445", ["", "U+E728"], ["", "U+EB47"], ["", "U+E409"], ["󾆔", "U+FE194"]],
  "💄": ["U+1F484", "lipstick", "1f484", ["", "U+E710"], ["", "U+E509"], ["", "U+E31C"], ["󾆕", "U+FE195"]],
  "💅": ["U+1F485", "nail polish", "1f485", ["-", "-"], ["", "U+EAA0"], ["", "U+E31D"], ["󾆖", "U+FE196"]],
  "💆": ["U+1F486", "face massage", "1f486", ["-", "-"], ["", "U+E50B"], ["", "U+E31E"], ["󾆗", "U+FE197"]],
  "💇": ["U+1F487", "haircut", "1f487", ["", "U+E675"], ["", "U+EAA1"], ["", "U+E31F"], ["󾆘", "U+FE198"]],
  "💈": ["U+1F488", "barber pole", "1f488", ["-", "-"], ["", "U+EAA2"], ["", "U+E320"], ["󾆙", "U+FE199"]],
  "👤": ["U+1F464", "bust in silhouette", "1f464", ["", "U+E6B1"], ["-", "-"], ["-", "-"], ["󾆚", "U+FE19A"]],
  "👦": ["U+1F466", "boy", "1f466", ["", "U+E6F0"], ["", "U+E4FC"], ["", "U+E001"], ["󾆛", "U+FE19B"]],
  "👧": ["U+1F467", "girl", "1f467", ["", "U+E6F0"], ["", "U+E4FA"], ["", "U+E002"], ["󾆜", "U+FE19C"]],
  "👨": ["U+1F468", "man", "1f468", ["", "U+E6F0"], ["", "U+E4FC"], ["", "U+E004"], ["󾆝", "U+FE19D"]],
  "👩": ["U+1F469", "woman", "1f469", ["", "U+E6F0"], ["", "U+E4FA"], ["", "U+E005"], ["󾆞", "U+FE19E"]],
  "👪": ["U+1F46A", "family", "1f46a", ["-", "-"], ["", "U+E501"], ["-", "-"], ["󾆟", "U+FE19F"]],
  "👫": ["U+1F46B", "man and woman holding hands", "1f46b", ["-", "-"], ["-", "-"], ["", "U+E428"], ["󾆠", "U+FE1A0"]],
  "👮": ["U+1F46E", "police officer", "1f46e", ["-", "-"], ["", "U+E5DD"], ["", "U+E152"], ["󾆡", "U+FE1A1"]],
  "👯": ["U+1F46F", "woman with bunny ears", "1f46f", ["-", "-"], ["", "U+EADB"], ["", "U+E429"], ["󾆢", "U+FE1A2"]],
  "👰": ["U+1F470", "bride with veil", "1f470", ["-", "-"], ["", "U+EAE9"], ["-", "-"], ["󾆣", "U+FE1A3"]],
  "👱": ["U+1F471", "person with blond hair", "1f471", ["-", "-"], ["", "U+EB13"], ["", "U+E515"], ["󾆤", "U+FE1A4"]],
  "👲": ["U+1F472", "man with gua pi mao", "1f472", ["-", "-"], ["", "U+EB14"], ["", "U+E516"], ["󾆥", "U+FE1A5"]],
  "👳": ["U+1F473", "man with turban", "1f473", ["-", "-"], ["", "U+EB15"], ["", "U+E517"], ["󾆦", "U+FE1A6"]],
  "👴": ["U+1F474", "older man", "1f474", ["-", "-"], ["", "U+EB16"], ["", "U+E518"], ["󾆧", "U+FE1A7"]],
  "👵": ["U+1F475", "older woman", "1f475", ["-", "-"], ["", "U+EB17"], ["", "U+E519"], ["󾆨", "U+FE1A8"]],
  "👶": ["U+1F476", "baby", "1f476", ["-", "-"], ["", "U+EB18"], ["", "U+E51A"], ["󾆩", "U+FE1A9"]],
  "👷": ["U+1F477", "construction worker", "1f477", ["-", "-"], ["", "U+EB19"], ["", "U+E51B"], ["󾆪", "U+FE1AA"]],
  "👸": ["U+1F478", "princess", "1f478", ["-", "-"], ["", "U+EB1A"], ["", "U+E51C"], ["󾆫", "U+FE1AB"]],
  "👹": ["U+1F479", "japanese ogre", "1f479", ["-", "-"], ["", "U+EB44"], ["-", "-"], ["󾆬", "U+FE1AC"]],
  "👺": ["U+1F47A", "japanese goblin", "1f47a", ["-", "-"], ["", "U+EB45"], ["-", "-"], ["󾆭", "U+FE1AD"]],
  "👻": ["U+1F47B", "ghost", "1f47b", ["-", "-"], ["", "U+E4CB"], ["", "U+E11B"], ["󾆮", "U+FE1AE"]],
  "👼": ["U+1F47C", "baby angel", "1f47c", ["-", "-"], ["", "U+E5BF"], ["", "U+E04E"], ["󾆯", "U+FE1AF"]],
  "👽": ["U+1F47D", "extraterrestrial alien", "1f47d", ["-", "-"], ["", "U+E50E"], ["", "U+E10C"], ["󾆰", "U+FE1B0"]],
  "👾": ["U+1F47E", "alien monster", "1f47e", ["-", "-"], ["", "U+E4EC"], ["", "U+E12B"], ["󾆱", "U+FE1B1"]],
  "👿": ["U+1F47F", "imp", "1f47f", ["-", "-"], ["", "U+E4EF"], ["", "U+E11A"], ["󾆲", "U+FE1B2"]],
  "💀": ["U+1F480", "skull", "1f480", ["-", "-"], ["", "U+E4F8"], ["", "U+E11C"], ["󾆳", "U+FE1B3"]],
  "💁": ["U+1F481", "information desk person", "1f481", ["-", "-"], ["-", "-"], ["", "U+E253"], ["󾆴", "U+FE1B4"]],
  "💂": ["U+1F482", "guardsman", "1f482", ["-", "-"], ["-", "-"], ["", "U+E51E"], ["󾆵", "U+FE1B5"]],
  "💃": ["U+1F483", "dancer", "1f483", ["-", "-"], ["", "U+EB1C"], ["", "U+E51F"], ["󾆶", "U+FE1B6"]],
  "🐌": ["U+1F40C", "snail", "1f40c", ["", "U+E74E"], ["", "U+EB7E"], ["-", "-"], ["󾆹", "U+FE1B9"]],
  "🐍": ["U+1F40D", "snake", "1f40d", ["-", "-"], ["", "U+EB22"], ["", "U+E52D"], ["󾇓", "U+FE1D3"]],
  "🐎": ["U+1F40E", "horse", "1f40e", ["", "U+E754"], ["", "U+E4D8"], ["", "U+E134"], ["󾟜", "U+FE7DC"]],
  "🐔": ["U+1F414", "chicken", "1f414", ["-", "-"], ["", "U+EB23"], ["", "U+E52E"], ["󾇔", "U+FE1D4"]],
  "🐗": ["U+1F417", "boar", "1f417", ["-", "-"], ["", "U+EB24"], ["", "U+E52F"], ["󾇕", "U+FE1D5"]],
  "🐫": ["U+1F42B", "bactrian camel", "1f42b", ["-", "-"], ["", "U+EB25"], ["", "U+E530"], ["󾇖", "U+FE1D6"]],
  "🐘": ["U+1F418", "elephant", "1f418", ["-", "-"], ["", "U+EB1F"], ["", "U+E526"], ["󾇌", "U+FE1CC"]],
  "🐨": ["U+1F428", "koala", "1f428", ["-", "-"], ["", "U+EB20"], ["", "U+E527"], ["󾇍", "U+FE1CD"]],
  "🐒": ["U+1F412", "monkey", "1f412", ["-", "-"], ["", "U+E4D9"], ["", "U+E528"], ["󾇎", "U+FE1CE"]],
  "🐑": ["U+1F411", "sheep", "1f411", ["-", "-"], ["", "U+E48F"], ["", "U+E529"], ["󾇏", "U+FE1CF"]],
  "🐙": ["U+1F419", "octopus", "1f419", ["-", "-"], ["", "U+E5C7"], ["", "U+E10A"], ["󾇅", "U+FE1C5"]],
  "🐚": ["U+1F41A", "spiral shell", "1f41a", ["-", "-"], ["", "U+EAEC"], ["", "U+E441"], ["󾇆", "U+FE1C6"]],
  "🐛": ["U+1F41B", "bug", "1f41b", ["-", "-"], ["", "U+EB1E"], ["", "U+E525"], ["󾇋", "U+FE1CB"]],
  "🐜": ["U+1F41C", "ant", "1f41c", ["-", "-"], ["", "U+E4DD"], ["-", "-"], ["󾇚", "U+FE1DA"]],
  "🐝": ["U+1F41D", "honeybee", "1f41d", ["-", "-"], ["", "U+EB57"], ["-", "-"], ["󾇡", "U+FE1E1"]],
  "🐞": ["U+1F41E", "lady beetle", "1f41e", ["-", "-"], ["", "U+EB58"], ["-", "-"], ["󾇢", "U+FE1E2"]],
  "🐠": ["U+1F420", "tropical fish", "1f420", ["", "U+E751"], ["", "U+EB1D"], ["", "U+E522"], ["󾇉", "U+FE1C9"]],
  "🐡": ["U+1F421", "blowfish", "1f421", ["", "U+E751"], ["", "U+E4D3"], ["", "U+E019"], ["󾇙", "U+FE1D9"]],
  "🐢": ["U+1F422", "turtle", "1f422", ["-", "-"], ["", "U+E5D4"], ["-", "-"], ["󾇜", "U+FE1DC"]],
  "🐤": ["U+1F424", "baby chick", "1f424", ["", "U+E74F"], ["", "U+E4E0"], ["", "U+E523"], ["󾆺", "U+FE1BA"]],
  "🐥": ["U+1F425", "front-facing baby chick", "1f425", ["", "U+E74F"], ["", "U+EB76"], ["", "U+E523"], ["󾆻", "U+FE1BB"]],
  "🐦": ["U+1F426", "bird", "1f426", ["", "U+E74F"], ["", "U+E4E0"], ["", "U+E521"], ["󾇈", "U+FE1C8"]],
  "🐣": ["U+1F423", "hatching chick", "1f423", ["", "U+E74F"], ["", "U+E5DB"], ["", "U+E523"], ["󾇝", "U+FE1DD"]],
  "🐧": ["U+1F427", "penguin", "1f427", ["", "U+E750"], ["", "U+E4DC"], ["", "U+E055"], ["󾆼", "U+FE1BC"]],
  "🐩": ["U+1F429", "poodle", "1f429", ["", "U+E6A1"], ["", "U+E4DF"], ["", "U+E052"], ["󾇘", "U+FE1D8"]],
  "🐟": ["U+1F41F", "fish", "1f41f", ["", "U+E751"], ["", "U+E49A"], ["", "U+E019"], ["󾆽", "U+FE1BD"]],
  "🐬": ["U+1F42C", "dolphin", "1f42c", ["-", "-"], ["", "U+EB1B"], ["", "U+E520"], ["󾇇", "U+FE1C7"]],
  "🐭": ["U+1F42D", "mouse face", "1f42d", ["-", "-"], ["", "U+E5C2"], ["", "U+E053"], ["󾇂", "U+FE1C2"]],
  "🐯": ["U+1F42F", "tiger face", "1f42f", ["-", "-"], ["", "U+E5C0"], ["", "U+E050"], ["󾇀", "U+FE1C0"]],
  "🐱": ["U+1F431", "cat face", "1f431", ["", "U+E6A2"], ["", "U+E4DB"], ["", "U+E04F"], ["󾆸", "U+FE1B8"]],
  "🐳": ["U+1F433", "spouting whale", "1f433", ["-", "-"], ["", "U+E470"], ["", "U+E054"], ["󾇃", "U+FE1C3"]],
  "🐴": ["U+1F434", "horse face", "1f434", ["", "U+E754"], ["", "U+E4D8"], ["", "U+E01A"], ["󾆾", "U+FE1BE"]],
  "🐵": ["U+1F435", "monkey face", "1f435", ["-", "-"], ["", "U+E4D9"], ["", "U+E109"], ["󾇄", "U+FE1C4"]],
  "🐶": ["U+1F436", "dog face", "1f436", ["", "U+E6A1"], ["", "U+E4E1"], ["", "U+E052"], ["󾆷", "U+FE1B7"]],
  "🐷": ["U+1F437", "pig face", "1f437", ["", "U+E755"], ["", "U+E4DE"], ["", "U+E10B"], ["󾆿", "U+FE1BF"]],
  "🐻": ["U+1F43B", "bear face", "1f43b", ["-", "-"], ["", "U+E5C1"], ["", "U+E051"], ["󾇁", "U+FE1C1"]],
  "🐹": ["U+1F439", "hamster face", "1f439", ["-", "-"], ["-", "-"], ["", "U+E524"], ["󾇊", "U+FE1CA"]],
  "🐺": ["U+1F43A", "wolf face", "1f43a", ["", "U+E6A1"], ["", "U+E4E1"], ["", "U+E52A"], ["󾇐", "U+FE1D0"]],
  "🐮": ["U+1F42E", "cow face", "1f42e", ["-", "-"], ["", "U+EB21"], ["", "U+E52B"], ["󾇑", "U+FE1D1"]],
  "🐰": ["U+1F430", "rabbit face", "1f430", ["-", "-"], ["", "U+E4D7"], ["", "U+E52C"], ["󾇒", "U+FE1D2"]],
  "🐸": ["U+1F438", "frog face", "1f438", ["-", "-"], ["", "U+E4DA"], ["", "U+E531"], ["󾇗", "U+FE1D7"]],
  "🐾": ["U+1F43E", "paw prints", "1f43e", ["", "U+E698"], ["", "U+E4EE"], ["", "U+E536"], ["󾇛", "U+FE1DB"]],
  "🐲": ["U+1F432", "dragon face", "1f432", ["-", "-"], ["", "U+EB3F"], ["-", "-"], ["󾇞", "U+FE1DE"]],
  "🐼": ["U+1F43C", "panda face", "1f43c", ["-", "-"], ["", "U+EB46"], ["-", "-"], ["󾇟", "U+FE1DF"]],
  "🐽": ["U+1F43D", "pig nose", "1f43d", ["", "U+E755"], ["", "U+EB48"], ["", "U+E10B"], ["󾇠", "U+FE1E0"]],
  "😠": ["U+1F620", "angry face", "1f620", ["", "U+E6F1"], ["", "U+E472"], ["", "U+E059"], ["󾌠", "U+FE320"]],
  "😩": ["U+1F629", "weary face", "1f629", ["", "U+E6F3"], ["", "U+EB67"], ["", "U+E403"], ["󾌡", "U+FE321"]],
  "😲": ["U+1F632", "astonished face", "1f632", ["", "U+E6F4"], ["", "U+EACA"], ["", "U+E410"], ["󾌢", "U+FE322"]],
  "😞": ["U+1F61E", "disappointed face", "1f61e", ["", "U+E6F2"], ["", "U+EAC0"], ["", "U+E058"], ["󾌣", "U+FE323"]],
  "😵": ["U+1F635", "dizzy face", "1f635", ["", "U+E6F4"], ["", "U+E5AE"], ["", "U+E406"], ["󾌤", "U+FE324"]],
  "😰": ["U+1F630", "face with open mouth and cold sweat", "1f630", ["", "U+E723"], ["", "U+EACB"], ["", "U+E40F"], ["󾌥", "U+FE325"]],
  "😒": ["U+1F612", "unamused face", "1f612", ["", "U+E725"], ["", "U+EAC9"], ["", "U+E40E"], ["󾌦", "U+FE326"]],
  "😍": ["U+1F60D", "smiling face with heart-shaped eyes", "1f60d", ["", "U+E726"], ["", "U+E5C4"], ["", "U+E106"], ["󾌧", "U+FE327"]],
  "😤": ["U+1F624", "face with look of triumph", "1f624", ["", "U+E753"], ["", "U+EAC1"], ["", "U+E404"], ["󾌨", "U+FE328"]],
  "😜": ["U+1F61C", "face with stuck-out tongue and winking eye", "1f61c", ["", "U+E728"], ["", "U+E4E7"], ["", "U+E105"], ["󾌩", "U+FE329"]],
  "😝": ["U+1F61D", "face with stuck-out tongue and tightly-closed eyes", "1f61d", ["", "U+E728"], ["", "U+E4E7"], ["", "U+E409"], ["󾌪", "U+FE32A"]],
  "😋": ["U+1F60B", "face savouring delicious food", "1f60b", ["", "U+E752"], ["", "U+EACD"], ["", "U+E056"], ["󾌫", "U+FE32B"]],
  "😘": ["U+1F618", "face throwing a kiss", "1f618", ["", "U+E726"], ["", "U+EACF"], ["", "U+E418"], ["󾌬", "U+FE32C"]],
  "😚": ["U+1F61A", "kissing face with closed eyes", "1f61a", ["", "U+E726"], ["", "U+EACE"], ["", "U+E417"], ["󾌭", "U+FE32D"]],
  "😷": ["U+1F637", "face with medical mask", "1f637", ["-", "-"], ["", "U+EAC7"], ["", "U+E40C"], ["󾌮", "U+FE32E"]],
  "😳": ["U+1F633", "flushed face", "1f633", ["", "U+E72A"], ["", "U+EAC8"], ["", "U+E40D"], ["󾌯", "U+FE32F"]],
  "😃": ["U+1F603", "smiling face with open mouth", "1f603", ["", "U+E6F0"], ["", "U+E471"], ["", "U+E057"], ["󾌰", "U+FE330"]],
  "😅": ["U+1F605", "smiling face with open mouth and cold sweat", "1f605", ["", "U+E722"], ["", "U+E471 U+E5B1"], ["", "U+E415 U+E331"], ["󾌱", "U+FE331"]],
  "😆": ["U+1F606", "smiling face with open mouth and tightly-closed eyes", "1f606", ["", "U+E72A"], ["", "U+EAC5"], ["", "U+E40A"], ["󾌲", "U+FE332"]],
  "😁": ["U+1F601", "grinning face with smiling eyes", "1f601", ["", "U+E753"], ["", "U+EB80"], ["", "U+E404"], ["󾌳", "U+FE333"]],
  "😂": ["U+1F602", "face with tears of joy", "1f602", ["", "U+E72A"], ["", "U+EB64"], ["", "U+E412"], ["󾌴", "U+FE334"]],
  "😊": ["U+1F60A", "smiling face with smiling eyes", "1f60a", ["", "U+E6F0"], ["", "U+EACD"], ["", "U+E056"], ["󾌵", "U+FE335"]],
  "☺": ["U+263A", "white smiling face", "263a", ["", "U+E6F0"], ["", "U+E4FB"], ["", "U+E414"], ["󾌶", "U+FE336"]],
  "😄": ["U+1F604", "smiling face with open mouth and smiling eyes", "1f604", ["", "U+E6F0"], ["", "U+E471"], ["", "U+E415"], ["󾌸", "U+FE338"]],
  "😢": ["U+1F622", "crying face", "1f622", ["", "U+E72E"], ["", "U+EB69"], ["", "U+E413"], ["󾌹", "U+FE339"]],
  "😭": ["U+1F62D", "loudly crying face", "1f62d", ["", "U+E72D"], ["", "U+E473"], ["", "U+E411"], ["󾌺", "U+FE33A"]],
  "😨": ["U+1F628", "fearful face", "1f628", ["", "U+E757"], ["", "U+EAC6"], ["", "U+E40B"], ["󾌻", "U+FE33B"]],
  "😣": ["U+1F623", "persevering face", "1f623", ["", "U+E72B"], ["", "U+EAC2"], ["", "U+E406"], ["󾌼", "U+FE33C"]],
  "😡": ["U+1F621", "pouting face", "1f621", ["", "U+E724"], ["", "U+EB5D"], ["", "U+E416"], ["󾌽", "U+FE33D"]],
  "😌": ["U+1F60C", "relieved face", "1f60c", ["", "U+E721"], ["", "U+EAC5"], ["", "U+E40A"], ["󾌾", "U+FE33E"]],
  "😖": ["U+1F616", "confounded face", "1f616", ["", "U+E6F3"], ["", "U+EAC3"], ["", "U+E407"], ["󾌿", "U+FE33F"]],
  "😔": ["U+1F614", "pensive face", "1f614", ["", "U+E720"], ["", "U+EAC0"], ["", "U+E403"], ["󾍀", "U+FE340"]],
  "😱": ["U+1F631", "face screaming in fear", "1f631", ["", "U+E757"], ["", "U+E5C5"], ["", "U+E107"], ["󾍁", "U+FE341"]],
  "😪": ["U+1F62A", "sleepy face", "1f62a", ["", "U+E701"], ["", "U+EAC4"], ["", "U+E408"], ["󾍂", "U+FE342"]],
  "😏": ["U+1F60F", "smirking face", "1f60f", ["", "U+E72C"], ["", "U+EABF"], ["", "U+E402"], ["󾍃", "U+FE343"]],
  "😓": ["U+1F613", "face with cold sweat", "1f613", ["", "U+E723"], ["", "U+E5C6"], ["", "U+E108"], ["󾍄", "U+FE344"]],
  "😥": ["U+1F625", "disappointed but relieved face", "1f625", ["", "U+E723"], ["", "U+E5C6"], ["", "U+E401"], ["󾍅", "U+FE345"]],
  "😫": ["U+1F62B", "tired face", "1f62b", ["", "U+E72B"], ["", "U+E474"], ["", "U+E406"], ["󾍆", "U+FE346"]],
  "😉": ["U+1F609", "winking face", "1f609", ["", "U+E729"], ["", "U+E5C3"], ["", "U+E405"], ["󾍇", "U+FE347"]],
  "😺": ["U+1F63A", "smiling cat face with open mouth", "1f63a", ["", "U+E6F0"], ["", "U+EB61"], ["", "U+E057"], ["󾍈", "U+FE348"]],
  "😸": ["U+1F638", "grinning cat face with smiling eyes", "1f638", ["", "U+E753"], ["", "U+EB7F"], ["", "U+E404"], ["󾍉", "U+FE349"]],
  "😹": ["U+1F639", "cat face with tears of joy", "1f639", ["", "U+E72A"], ["", "U+EB63"], ["", "U+E412"], ["󾍊", "U+FE34A"]],
  "😽": ["U+1F63D", "kissing cat face with closed eyes", "1f63d", ["", "U+E726"], ["", "U+EB60"], ["", "U+E418"], ["󾍋", "U+FE34B"]],
  "😻": ["U+1F63B", "smiling cat face with heart-shaped eyes", "1f63b", ["", "U+E726"], ["", "U+EB65"], ["", "U+E106"], ["󾍌", "U+FE34C"]],
  "😿": ["U+1F63F", "crying cat face", "1f63f", ["", "U+E72E"], ["", "U+EB68"], ["", "U+E413"], ["󾍍", "U+FE34D"]],
  "😾": ["U+1F63E", "pouting cat face", "1f63e", ["", "U+E724"], ["", "U+EB5E"], ["", "U+E416"], ["󾍎", "U+FE34E"]],
  "😼": ["U+1F63C", "cat face with wry smile", "1f63c", ["", "U+E753"], ["", "U+EB6A"], ["", "U+E404"], ["󾍏", "U+FE34F"]],
  "🙀": ["U+1F640", "weary cat face", "1f640", ["", "U+E6F3"], ["", "U+EB66"], ["", "U+E403"], ["󾍐", "U+FE350"]],
  "🙅": ["U+1F645", "face with no good gesture", "1f645", ["", "U+E72F"], ["", "U+EAD7"], ["", "U+E423"], ["󾍑", "U+FE351"]],
  "🙆": ["U+1F646", "face with ok gesture", "1f646", ["", "U+E70B"], ["", "U+EAD8"], ["", "U+E424"], ["󾍒", "U+FE352"]],
  "🙇": ["U+1F647", "person bowing deeply", "1f647", ["-", "-"], ["", "U+EAD9"], ["", "U+E426"], ["󾍓", "U+FE353"]],
  "🙈": ["U+1F648", "see-no-evil monkey", "1f648", ["-", "-"], ["", "U+EB50"], ["-", "-"], ["󾍔", "U+FE354"]],
  "🙊": ["U+1F64A", "speak-no-evil monkey", "1f64a", ["-", "-"], ["", "U+EB51"], ["-", "-"], ["󾍕", "U+FE355"]],
  "🙉": ["U+1F649", "hear-no-evil monkey", "1f649", ["-", "-"], ["", "U+EB52"], ["-", "-"], ["󾍖", "U+FE356"]],
  "🙋": ["U+1F64B", "happy person raising one hand", "1f64b", ["-", "-"], ["", "U+EB85"], ["", "U+E012"], ["󾍗", "U+FE357"]],
  "🙌": ["U+1F64C", "person raising both hands in celebration", "1f64c", ["-", "-"], ["", "U+EB86"], ["", "U+E427"], ["󾍘", "U+FE358"]],
  "🙍": ["U+1F64D", "person frowning", "1f64d", ["", "U+E6F3"], ["", "U+EB87"], ["", "U+E403"], ["󾍙", "U+FE359"]],
  "🙎": ["U+1F64E", "person with pouting face", "1f64e", ["", "U+E6F1"], ["", "U+EB88"], ["", "U+E416"], ["󾍚", "U+FE35A"]],
  "🙏": ["U+1F64F", "person with folded hands", "1f64f", ["-", "-"], ["", "U+EAD2"], ["", "U+E41D"], ["󾍛", "U+FE35B"]],
  "🏠": ["U+1F3E0", "house building", "1f3e0", ["", "U+E663"], ["", "U+E4AB"], ["", "U+E036"], ["󾒰", "U+FE4B0"]],
  "🏡": ["U+1F3E1", "house with garden", "1f3e1", ["", "U+E663"], ["", "U+EB09"], ["", "U+E036"], ["󾒱", "U+FE4B1"]],
  "🏢": ["U+1F3E2", "office building", "1f3e2", ["", "U+E664"], ["", "U+E4AD"], ["", "U+E038"], ["󾒲", "U+FE4B2"]],
  "🏣": ["U+1F3E3", "japanese post office", "1f3e3", ["", "U+E665"], ["", "U+E5DE"], ["", "U+E153"], ["󾒳", "U+FE4B3"]],
  "🏥": ["U+1F3E5", "hospital", "1f3e5", ["", "U+E666"], ["", "U+E5DF"], ["", "U+E155"], ["󾒴", "U+FE4B4"]],
  "🏦": ["U+1F3E6", "bank", "1f3e6", ["", "U+E667"], ["", "U+E4AA"], ["", "U+E14D"], ["󾒵", "U+FE4B5"]],
  "🏧": ["U+1F3E7", "automated teller machine", "1f3e7", ["", "U+E668"], ["", "U+E4A3"], ["", "U+E154"], ["󾒶", "U+FE4B6"]],
  "🏨": ["U+1F3E8", "hotel", "1f3e8", ["", "U+E669"], ["", "U+EA81"], ["", "U+E158"], ["󾒷", "U+FE4B7"]],
  "🏩": ["U+1F3E9", "love hotel", "1f3e9", ["", "U+E669 U+E6EF"], ["", "U+EAF3"], ["", "U+E501"], ["󾒸", "U+FE4B8"]],
  "🏪": ["U+1F3EA", "convenience store", "1f3ea", ["", "U+E66A"], ["", "U+E4A4"], ["", "U+E156"], ["󾒹", "U+FE4B9"]],
  "🏫": ["U+1F3EB", "school", "1f3eb", ["", "U+E73E"], ["", "U+EA80"], ["", "U+E157"], ["󾒺", "U+FE4BA"]],
  "⛪": ["U+26EA", "church", "26ea", ["-", "-"], ["", "U+E5BB"], ["", "U+E037"], ["󾒻", "U+FE4BB"]],
  "⛲": ["U+26F2", "fountain", "26f2", ["-", "-"], ["", "U+E5CF"], ["", "U+E121"], ["󾒼", "U+FE4BC"]],
  "🏬": ["U+1F3EC", "department store", "1f3ec", ["-", "-"], ["", "U+EAF6"], ["", "U+E504"], ["󾒽", "U+FE4BD"]],
  "🏯": ["U+1F3EF", "japanese castle", "1f3ef", ["-", "-"], ["", "U+EAF7"], ["", "U+E505"], ["󾒾", "U+FE4BE"]],
  "🏰": ["U+1F3F0", "european castle", "1f3f0", ["-", "-"], ["", "U+EAF8"], ["", "U+E506"], ["󾒿", "U+FE4BF"]],
  "🏭": ["U+1F3ED", "factory", "1f3ed", ["-", "-"], ["", "U+EAF9"], ["", "U+E508"], ["󾓀", "U+FE4C0"]],
  "⚓": ["U+2693", "anchor", "2693", ["", "U+E661"], ["", "U+E4A9"], ["", "U+E202"], ["󾓁", "U+FE4C1"]],
  "🏮": ["U+1F3EE", "izakaya lantern", "1f3ee", ["", "U+E74B"], ["", "U+E4BD"], ["", "U+E30B"], ["󾓂", "U+FE4C2"]],
  "🗻": ["U+1F5FB", "mount fuji", "1f5fb", ["", "U+E740"], ["", "U+E5BD"], ["", "U+E03B"], ["󾓃", "U+FE4C3"]],
  "🗼": ["U+1F5FC", "tokyo tower", "1f5fc", ["-", "-"], ["", "U+E4C0"], ["", "U+E509"], ["󾓄", "U+FE4C4"]],
  "🗽": ["U+1F5FD", "statue of liberty", "1f5fd", ["-", "-"], ["-", "-"], ["", "U+E51D"], ["󾓆", "U+FE4C6"]],
  "🗾": ["U+1F5FE", "silhouette of japan", "1f5fe", ["-", "-"], ["", "U+E572"], ["-", "-"], ["󾓇", "U+FE4C7"]],
  "🗿": ["U+1F5FF", "moyai", "1f5ff", ["-", "-"], ["", "U+EB6C"], ["-", "-"], ["󾓈", "U+FE4C8"]],
  "👞": ["U+1F45E", "mans shoe", "1f45e", ["", "U+E699"], ["", "U+E5B7"], ["", "U+E007"], ["󾓌", "U+FE4CC"]],
  "👟": ["U+1F45F", "athletic shoe", "1f45f", ["", "U+E699"], ["", "U+EB2B"], ["", "U+E007"], ["󾓍", "U+FE4CD"]],
  "👠": ["U+1F460", "high-heeled shoe", "1f460", ["", "U+E674"], ["", "U+E51A"], ["", "U+E13E"], ["󾓖", "U+FE4D6"]],
  "👡": ["U+1F461", "womans sandal", "1f461", ["", "U+E674"], ["", "U+E51A"], ["", "U+E31A"], ["󾓗", "U+FE4D7"]],
  "👢": ["U+1F462", "womans boots", "1f462", ["-", "-"], ["", "U+EA9F"], ["", "U+E31B"], ["󾓘", "U+FE4D8"]],
  "👣": ["U+1F463", "footprints", "1f463", ["", "U+E698"], ["", "U+EB2A"], ["", "U+E536"], ["󾕓", "U+FE553"]],
  "👓": ["U+1F453", "eyeglasses", "1f453", ["", "U+E69A"], ["", "U+E4FE"], ["-", "-"], ["󾓎", "U+FE4CE"]],
  "👕": ["U+1F455", "t-shirt", "1f455", ["", "U+E70E"], ["", "U+E5B6"], ["", "U+E006"], ["󾓏", "U+FE4CF"]],
  "👖": ["U+1F456", "jeans", "1f456", ["", "U+E711"], ["", "U+EB77"], ["-", "-"], ["󾓐", "U+FE4D0"]],
  "👑": ["U+1F451", "crown", "1f451", ["", "U+E71A"], ["", "U+E5C9"], ["", "U+E10E"], ["󾓑", "U+FE4D1"]],
  "👔": ["U+1F454", "necktie", "1f454", ["-", "-"], ["", "U+EA93"], ["", "U+E302"], ["󾓓", "U+FE4D3"]],
  "👒": ["U+1F452", "womans hat", "1f452", ["-", "-"], ["", "U+EA9E"], ["", "U+E318"], ["󾓔", "U+FE4D4"]],
  "👗": ["U+1F457", "dress", "1f457", ["-", "-"], ["", "U+EB6B"], ["", "U+E319"], ["󾓕", "U+FE4D5"]],
  "👘": ["U+1F458", "kimono", "1f458", ["-", "-"], ["", "U+EAA3"], ["", "U+E321"], ["󾓙", "U+FE4D9"]],
  "👙": ["U+1F459", "bikini", "1f459", ["-", "-"], ["", "U+EAA4"], ["", "U+E322"], ["󾓚", "U+FE4DA"]],
  "👚": ["U+1F45A", "womans clothes", "1f45a", ["", "U+E70E"], ["", "U+E50D"], ["", "U+E006"], ["󾓛", "U+FE4DB"]],
  "👛": ["U+1F45B", "purse", "1f45b", ["", "U+E70F"], ["", "U+E504"], ["-", "-"], ["󾓜", "U+FE4DC"]],
  "👜": ["U+1F45C", "handbag", "1f45c", ["", "U+E682"], ["", "U+E49C"], ["", "U+E323"], ["󾓰", "U+FE4F0"]],
  "👝": ["U+1F45D", "pouch", "1f45d", ["", "U+E6AD"], ["-", "-"], ["-", "-"], ["󾓱", "U+FE4F1"]],
  "💰": ["U+1F4B0", "money bag", "1f4b0", ["", "U+E715"], ["", "U+E4C7"], ["", "U+E12F"], ["󾓝", "U+FE4DD"]],
  "💱": ["U+1F4B1", "currency exchange", "1f4b1", ["-", "-"], ["-", "-"], ["", "U+E149"], ["󾓞", "U+FE4DE"]],
  "💹": ["U+1F4B9", "chart with upwards trend and yen sign", "1f4b9", ["-", "-"], ["", "U+E5DC"], ["", "U+E14A"], ["󾓟", "U+FE4DF"]],
  "💲": ["U+1F4B2", "heavy dollar sign", "1f4b2", ["", "U+E715"], ["", "U+E579"], ["", "U+E12F"], ["󾓠", "U+FE4E0"]],
  "💳": ["U+1F4B3", "credit card", "1f4b3", ["-", "-"], ["", "U+E57C"], ["-", "-"], ["󾓡", "U+FE4E1"]],
  "💴": ["U+1F4B4", "banknote with yen sign", "1f4b4", ["", "U+E6D6"], ["", "U+E57D"], ["-", "-"], ["󾓢", "U+FE4E2"]],
  "💵": ["U+1F4B5", "banknote with dollar sign", "1f4b5", ["", "U+E715"], ["", "U+E585"], ["", "U+E12F"], ["󾓣", "U+FE4E3"]],
  "💸": ["U+1F4B8", "money with wings", "1f4b8", ["-", "-"], ["", "U+EB5B"], ["-", "-"], ["󾓤", "U+FE4E4"]],
  "🇨🇳": ["U+1F1E8 U+1F1F3", "regional indicator symbol letters cn", "1f1e81f1f3", ["-", "-"], ["", "U+EB11"], ["", "U+E513"], ["󾓭", "U+FE4ED"]],
  "🇩🇪": ["U+1F1E9 U+1F1EA", "regional indicator symbol letters de", "1f1e91f1ea", ["-", "-"], ["", "U+EB0E"], ["", "U+E50E"], ["󾓨", "U+FE4E8"]],
  "🇪🇸": ["U+1F1EA U+1F1F8", "regional indicator symbol letters es", "1f1ea1f1f8", ["-", "-"], ["", "U+E5D5"], ["", "U+E511"], ["󾓫", "U+FE4EB"]],
  "🇫🇷": ["U+1F1EB U+1F1F7", "regional indicator symbol letters fr", "1f1eb1f1f7", ["-", "-"], ["", "U+EAFA"], ["", "U+E50D"], ["󾓧", "U+FE4E7"]],
  "🇬🇧": ["U+1F1EC U+1F1E7", "regional indicator symbol letters gb", "1f1ec1f1e7", ["-", "-"], ["", "U+EB10"], ["", "U+E510"], ["󾓪", "U+FE4EA"]],
  "🇮🇹": ["U+1F1EE U+1F1F9", "regional indicator symbol letters it", "1f1ee1f1f9", ["-", "-"], ["", "U+EB0F"], ["", "U+E50F"], ["󾓩", "U+FE4E9"]],
  "🇯🇵": ["U+1F1EF U+1F1F5", "regional indicator symbol letters jp", "1f1ef1f1f5", ["-", "-"], ["", "U+E4CC"], ["", "U+E50B"], ["󾓥", "U+FE4E5"]],
  "🇰🇷": ["U+1F1F0 U+1F1F7", "regional indicator symbol letters kr", "1f1f01f1f7", ["-", "-"], ["", "U+EB12"], ["", "U+E514"], ["󾓮", "U+FE4EE"]],
  "🇷🇺": ["U+1F1F7 U+1F1FA", "regional indicator symbol letters ru", "1f1f71f1fa", ["-", "-"], ["", "U+E5D6"], ["", "U+E512"], ["󾓬", "U+FE4EC"]],
  "🇺🇸": ["U+1F1FA U+1F1F8", "regional indicator symbol letters us", "1f1fa1f1f8", ["-", "-"], ["", "U+E573"], ["", "U+E50C"], ["󾓦", "U+FE4E6"]],
  "🔥": ["U+1F525", "fire", "1f525", ["-", "-"], ["", "U+E47B"], ["", "U+E11D"], ["󾓶", "U+FE4F6"]],
  "🔦": ["U+1F526", "electric torch", "1f526", ["", "U+E6FB"], ["", "U+E583"], ["-", "-"], ["󾓻", "U+FE4FB"]],
  "🔧": ["U+1F527", "wrench", "1f527", ["", "U+E718"], ["", "U+E587"], ["-", "-"], ["󾓉", "U+FE4C9"]],
  "🔨": ["U+1F528", "hammer", "1f528", ["-", "-"], ["", "U+E5CB"], ["", "U+E116"], ["󾓊", "U+FE4CA"]],
  "🔩": ["U+1F529", "nut and bolt", "1f529", ["-", "-"], ["", "U+E581"], ["-", "-"], ["󾓋", "U+FE4CB"]],
  "🔪": ["U+1F52A", "hocho", "1f52a", ["-", "-"], ["", "U+E57F"], ["-", "-"], ["󾓺", "U+FE4FA"]],
  "🔫": ["U+1F52B", "pistol", "1f52b", ["-", "-"], ["", "U+E50A"], ["", "U+E113"], ["󾓵", "U+FE4F5"]],
  "🔮": ["U+1F52E", "crystal ball", "1f52e", ["-", "-"], ["", "U+EA8F"], ["", "U+E23E"], ["󾓷", "U+FE4F7"]],
  "🔯": ["U+1F52F", "six pointed star with middle dot", "1f52f", ["-", "-"], ["", "U+EA8F"], ["", "U+E23E"], ["󾓸", "U+FE4F8"]],
  "🔰": ["U+1F530", "japanese symbol for beginner", "1f530", ["-", "-"], ["", "U+E480"], ["", "U+E209"], ["󾁄", "U+FE044"]],
  "🔱": ["U+1F531", "trident emblem", "1f531", ["", "U+E71A"], ["", "U+E5C9"], ["", "U+E031"], ["󾓒", "U+FE4D2"]],
  "💉": ["U+1F489", "syringe", "1f489", ["-", "-"], ["", "U+E510"], ["", "U+E13B"], ["󾔉", "U+FE509"]],
  "💊": ["U+1F48A", "pill", "1f48a", ["-", "-"], ["", "U+EA9A"], ["", "U+E30F"], ["󾔊", "U+FE50A"]],
  "🅰": ["U+1F170", "negative squared latin capital letter a", "1f170", ["-", "-"], ["", "U+EB26"], ["", "U+E532"], ["󾔋", "U+FE50B"]],
  "🅱": ["U+1F171", "negative squared latin capital letter b", "1f171", ["-", "-"], ["", "U+EB27"], ["", "U+E533"], ["󾔌", "U+FE50C"]],
  "🆎": ["U+1F18E", "negative squared ab", "1f18e", ["-", "-"], ["", "U+EB29"], ["", "U+E534"], ["󾔍", "U+FE50D"]],
  "🅾": ["U+1F17E", "negative squared latin capital letter o", "1f17e", ["-", "-"], ["", "U+EB28"], ["", "U+E535"], ["󾔎", "U+FE50E"]],
  "🎀": ["U+1F380", "ribbon", "1f380", ["", "U+E684"], ["", "U+E59F"], ["", "U+E314"], ["󾔏", "U+FE50F"]],
  "🎁": ["U+1F381", "wrapped present", "1f381", ["", "U+E685"], ["", "U+E4CF"], ["", "U+E112"], ["󾔐", "U+FE510"]],
  "🎂": ["U+1F382", "birthday cake", "1f382", ["", "U+E686"], ["", "U+E5A0"], ["", "U+E34B"], ["󾔑", "U+FE511"]],
  "🎄": ["U+1F384", "christmas tree", "1f384", ["", "U+E6A4"], ["", "U+E4C9"], ["", "U+E033"], ["󾔒", "U+FE512"]],
  "🎅": ["U+1F385", "father christmas", "1f385", ["-", "-"], ["", "U+EAF0"], ["", "U+E448"], ["󾔓", "U+FE513"]],
  "🎌": ["U+1F38C", "crossed flags", "1f38c", ["-", "-"], ["", "U+E5D9"], ["", "U+E143"], ["󾔔", "U+FE514"]],
  "🎆": ["U+1F386", "fireworks", "1f386", ["-", "-"], ["", "U+E5CC"], ["", "U+E117"], ["󾔕", "U+FE515"]],
  "🎈": ["U+1F388", "balloon", "1f388", ["-", "-"], ["", "U+EA9B"], ["", "U+E310"], ["󾔖", "U+FE516"]],
  "🎉": ["U+1F389", "party popper", "1f389", ["-", "-"], ["", "U+EA9C"], ["", "U+E312"], ["󾔗", "U+FE517"]],
  "🎍": ["U+1F38D", "pine decoration", "1f38d", ["-", "-"], ["", "U+EAE3"], ["", "U+E436"], ["󾔘", "U+FE518"]],
  "🎎": ["U+1F38E", "japanese dolls", "1f38e", ["-", "-"], ["", "U+EAE4"], ["", "U+E438"], ["󾔙", "U+FE519"]],
  "🎓": ["U+1F393", "graduation cap", "1f393", ["-", "-"], ["", "U+EAE5"], ["", "U+E439"], ["󾔚", "U+FE51A"]],
  "🎒": ["U+1F392", "school satchel", "1f392", ["-", "-"], ["", "U+EAE6"], ["", "U+E43A"], ["󾔛", "U+FE51B"]],
  "🎏": ["U+1F38F", "carp streamer", "1f38f", ["-", "-"], ["", "U+EAE7"], ["", "U+E43B"], ["󾔜", "U+FE51C"]],
  "🎇": ["U+1F387", "firework sparkler", "1f387", ["-", "-"], ["", "U+EAEB"], ["", "U+E440"], ["󾔝", "U+FE51D"]],
  "🎐": ["U+1F390", "wind chime", "1f390", ["-", "-"], ["", "U+EAED"], ["", "U+E442"], ["󾔞", "U+FE51E"]],
  "🎃": ["U+1F383", "jack-o-lantern", "1f383", ["-", "-"], ["", "U+EAEE"], ["", "U+E445"], ["󾔟", "U+FE51F"]],
  "🎊": ["U+1F38A", "confetti ball", "1f38a", ["-", "-"], ["", "U+E46F"], ["-", "-"], ["󾔠", "U+FE520"]],
  "🎋": ["U+1F38B", "tanabata tree", "1f38b", ["-", "-"], ["", "U+EB3D"], ["-", "-"], ["󾔡", "U+FE521"]],
  "🎑": ["U+1F391", "moon viewing ceremony", "1f391", ["-", "-"], ["", "U+EAEF"], ["", "U+E446"], ["󾀗", "U+FE017"]],
  "📟": ["U+1F4DF", "pager", "1f4df", ["", "U+E65A"], ["", "U+E59B"], ["-", "-"], ["󾔢", "U+FE522"]],
  "☎": ["U+260E", "black telephone", "260e", ["", "U+E687"], ["", "U+E596"], ["", "U+E009"], ["󾔣", "U+FE523"]],
  "📞": ["U+1F4DE", "telephone receiver", "1f4de", ["", "U+E687"], ["", "U+E51E"], ["", "U+E009"], ["󾔤", "U+FE524"]],
  "📱": ["U+1F4F1", "mobile phone", "1f4f1", ["", "U+E688"], ["", "U+E588"], ["", "U+E00A"], ["󾔥", "U+FE525"]],
  "📲": ["U+1F4F2", "mobile phone with rightwards arrow at left", "1f4f2", ["", "U+E6CE"], ["", "U+EB08"], ["", "U+E104"], ["󾔦", "U+FE526"]],
  "📝": ["U+1F4DD", "memo", "1f4dd", ["", "U+E689"], ["", "U+EA92"], ["", "U+E301"], ["󾔧", "U+FE527"]],
  "📠": ["U+1F4E0", "fax machine", "1f4e0", ["", "U+E6D0"], ["", "U+E520"], ["", "U+E00B"], ["󾔨", "U+FE528"]],
  "✉": ["U+2709", "envelope", "2709", ["", "U+E6D3"], ["", "U+E521"], ["", "U+E103"], ["󾔩", "U+FE529"]],
  "📨": ["U+1F4E8", "incoming envelope", "1f4e8", ["", "U+E6CF"], ["", "U+E591"], ["", "U+E103"], ["󾔪", "U+FE52A"]],
  "📩": ["U+1F4E9", "envelope with downwards arrow above", "1f4e9", ["", "U+E6CF"], ["", "U+EB62"], ["", "U+E103"], ["󾔫", "U+FE52B"]],
  "📪": ["U+1F4EA", "closed mailbox with lowered flag", "1f4ea", ["", "U+E665"], ["", "U+E51B"], ["", "U+E101"], ["󾔬", "U+FE52C"]],
  "📫": ["U+1F4EB", "closed mailbox with raised flag", "1f4eb", ["", "U+E665"], ["", "U+EB0A"], ["", "U+E101"], ["󾔭", "U+FE52D"]],
  "📮": ["U+1F4EE", "postbox", "1f4ee", ["", "U+E665"], ["", "U+E51B"], ["", "U+E102"], ["󾔮", "U+FE52E"]],
  "📰": ["U+1F4F0", "newspaper", "1f4f0", ["-", "-"], ["", "U+E58B"], ["-", "-"], ["󾠢", "U+FE822"]],
  "📢": ["U+1F4E2", "public address loudspeaker", "1f4e2", ["-", "-"], ["", "U+E511"], ["", "U+E142"], ["󾔯", "U+FE52F"]],
  "📣": ["U+1F4E3", "cheering megaphone", "1f4e3", ["-", "-"], ["", "U+E511"], ["", "U+E317"], ["󾔰", "U+FE530"]],
  "📡": ["U+1F4E1", "satellite antenna", "1f4e1", ["-", "-"], ["", "U+E4A8"], ["", "U+E14B"], ["󾔱", "U+FE531"]],
  "📤": ["U+1F4E4", "outbox tray", "1f4e4", ["-", "-"], ["", "U+E592"], ["-", "-"], ["󾔳", "U+FE533"]],
  "📥": ["U+1F4E5", "inbox tray", "1f4e5", ["-", "-"], ["", "U+E593"], ["-", "-"], ["󾔴", "U+FE534"]],
  "📦": ["U+1F4E6", "package", "1f4e6", ["", "U+E685"], ["", "U+E51F"], ["", "U+E112"], ["󾔵", "U+FE535"]],
  "📧": ["U+1F4E7", "e-mail symbol", "1f4e7", ["", "U+E6D3"], ["", "U+EB71"], ["", "U+E103"], ["󾮒", "U+FEB92"]],
  "🔠": ["U+1F520", "input symbol for latin capital letters", "1f520", ["-", "-"], ["", "U+EAFD"], ["-", "-"], ["󾭼", "U+FEB7C"]],
  "🔡": ["U+1F521", "input symbol for latin small letters", "1f521", ["-", "-"], ["", "U+EAFE"], ["-", "-"], ["󾭽", "U+FEB7D"]],
  "🔢": ["U+1F522", "input symbol for numbers", "1f522", ["-", "-"], ["", "U+EAFF"], ["-", "-"], ["󾭾", "U+FEB7E"]],
  "🔣": ["U+1F523", "input symbol for symbols", "1f523", ["-", "-"], ["", "U+EB00"], ["-", "-"], ["󾭿", "U+FEB7F"]],
  "🔤": ["U+1F524", "input symbol for latin letters", "1f524", ["-", "-"], ["", "U+EB55"], ["-", "-"], ["󾮀", "U+FEB80"]],
  "✒": ["U+2712", "black nib", "2712", ["", "U+E6AE"], ["", "U+EB03"], ["-", "-"], ["󾔶", "U+FE536"]],
  "💺": ["U+1F4BA", "seat", "1f4ba", ["", "U+E6B2"], ["-", "-"], ["", "U+E11F"], ["󾔷", "U+FE537"]],
  "💻": ["U+1F4BB", "personal computer", "1f4bb", ["", "U+E716"], ["", "U+E5B8"], ["", "U+E00C"], ["󾔸", "U+FE538"]],
  "✏": ["U+270F", "pencil", "270f", ["", "U+E719"], ["", "U+E4A1"], ["", "U+E301"], ["󾔹", "U+FE539"]],
  "📎": ["U+1F4CE", "paperclip", "1f4ce", ["", "U+E730"], ["", "U+E4A0"], ["-", "-"], ["󾔺", "U+FE53A"]],
  "💼": ["U+1F4BC", "briefcase", "1f4bc", ["", "U+E682"], ["", "U+E5CE"], ["", "U+E11E"], ["󾔻", "U+FE53B"]],
  "💽": ["U+1F4BD", "minidisc", "1f4bd", ["-", "-"], ["", "U+E582"], ["", "U+E316"], ["󾔼", "U+FE53C"]],
  "💾": ["U+1F4BE", "floppy disk", "1f4be", ["-", "-"], ["", "U+E562"], ["", "U+E316"], ["󾔽", "U+FE53D"]],
  "💿": ["U+1F4BF", "optical disc", "1f4bf", ["", "U+E68C"], ["", "U+E50C"], ["", "U+E126"], ["󾠝", "U+FE81D"]],
  "📀": ["U+1F4C0", "dvd", "1f4c0", ["", "U+E68C"], ["", "U+E50C"], ["", "U+E127"], ["󾠞", "U+FE81E"]],
  "✂": ["U+2702", "black scissors", "2702", ["", "U+E675"], ["", "U+E516"], ["", "U+E313"], ["󾔾", "U+FE53E"]],
  "📍": ["U+1F4CD", "round pushpin", "1f4cd", ["-", "-"], ["", "U+E560"], ["-", "-"], ["󾔿", "U+FE53F"]],
  "📃": ["U+1F4C3", "page with curl", "1f4c3", ["", "U+E689"], ["", "U+E561"], ["", "U+E301"], ["󾕀", "U+FE540"]],
  "📄": ["U+1F4C4", "page facing up", "1f4c4", ["", "U+E689"], ["", "U+E569"], ["", "U+E301"], ["󾕁", "U+FE541"]],
  "📅": ["U+1F4C5", "calendar", "1f4c5", ["-", "-"], ["", "U+E563"], ["-", "-"], ["󾕂", "U+FE542"]],
  "📁": ["U+1F4C1", "file folder", "1f4c1", ["-", "-"], ["", "U+E58F"], ["-", "-"], ["󾕃", "U+FE543"]],
  "📂": ["U+1F4C2", "open file folder", "1f4c2", ["-", "-"], ["", "U+E590"], ["-", "-"], ["󾕄", "U+FE544"]],
  "📓": ["U+1F4D3", "notebook", "1f4d3", ["", "U+E683"], ["", "U+E56B"], ["", "U+E148"], ["󾕅", "U+FE545"]],
  "📖": ["U+1F4D6", "open book", "1f4d6", ["", "U+E683"], ["", "U+E49F"], ["", "U+E148"], ["󾕆", "U+FE546"]],
  "📔": ["U+1F4D4", "notebook with decorative cover", "1f4d4", ["", "U+E683"], ["", "U+E49D"], ["", "U+E148"], ["󾕇", "U+FE547"]],
  "📕": ["U+1F4D5", "closed book", "1f4d5", ["", "U+E683"], ["", "U+E568"], ["", "U+E148"], ["󾔂", "U+FE502"]],
  "📗": ["U+1F4D7", "green book", "1f4d7", ["", "U+E683"], ["", "U+E565"], ["", "U+E148"], ["󾓿", "U+FE4FF"]],
  "📘": ["U+1F4D8", "blue book", "1f4d8", ["", "U+E683"], ["", "U+E566"], ["", "U+E148"], ["󾔀", "U+FE500"]],
  "📙": ["U+1F4D9", "orange book", "1f4d9", ["", "U+E683"], ["", "U+E567"], ["", "U+E148"], ["󾔁", "U+FE501"]],
  "📚": ["U+1F4DA", "books", "1f4da", ["", "U+E683"], ["", "U+E56F"], ["", "U+E148"], ["󾔃", "U+FE503"]],
  "📛": ["U+1F4DB", "name badge", "1f4db", ["-", "-"], ["", "U+E51D"], ["-", "-"], ["󾔄", "U+FE504"]],
  "📜": ["U+1F4DC", "scroll", "1f4dc", ["", "U+E70A"], ["", "U+E55F"], ["-", "-"], ["󾓽", "U+FE4FD"]],
  "📋": ["U+1F4CB", "clipboard", "1f4cb", ["", "U+E689"], ["", "U+E564"], ["", "U+E301"], ["󾕈", "U+FE548"]],
  "📆": ["U+1F4C6", "tear-off calendar", "1f4c6", ["-", "-"], ["", "U+E56A"], ["-", "-"], ["󾕉", "U+FE549"]],
  "📊": ["U+1F4CA", "bar chart", "1f4ca", ["-", "-"], ["", "U+E574"], ["", "U+E14A"], ["󾕊", "U+FE54A"]],
  "📈": ["U+1F4C8", "chart with upwards trend", "1f4c8", ["-", "-"], ["", "U+E575"], ["", "U+E14A"], ["󾕋", "U+FE54B"]],
  "📉": ["U+1F4C9", "chart with downwards trend", "1f4c9", ["-", "-"], ["", "U+E576"], ["-", "-"], ["󾕌", "U+FE54C"]],
  "📇": ["U+1F4C7", "card index", "1f4c7", ["", "U+E683"], ["", "U+E56C"], ["", "U+E148"], ["󾕍", "U+FE54D"]],
  "📌": ["U+1F4CC", "pushpin", "1f4cc", ["-", "-"], ["", "U+E56D"], ["-", "-"], ["󾕎", "U+FE54E"]],
  "📒": ["U+1F4D2", "ledger", "1f4d2", ["", "U+E683"], ["", "U+E56E"], ["", "U+E148"], ["󾕏", "U+FE54F"]],
  "📏": ["U+1F4CF", "straight ruler", "1f4cf", ["-", "-"], ["", "U+E570"], ["-", "-"], ["󾕐", "U+FE550"]],
  "📐": ["U+1F4D0", "triangular ruler", "1f4d0", ["-", "-"], ["", "U+E4A2"], ["-", "-"], ["󾕑", "U+FE551"]],
  "📑": ["U+1F4D1", "bookmark tabs", "1f4d1", ["", "U+E689"], ["", "U+EB0B"], ["", "U+E301"], ["󾕒", "U+FE552"]],
  "🎽": ["U+1F3BD", "running shirt with sash", "1f3bd", ["", "U+E652"], ["-", "-"], ["-", "-"], ["󾟐", "U+FE7D0"]],
  "⚾": ["U+26BE", "baseball", "26be", ["", "U+E653"], ["", "U+E4BA"], ["", "U+E016"], ["󾟑", "U+FE7D1"]],
  "⛳": ["U+26F3", "flag in hole", "26f3", ["", "U+E654"], ["", "U+E599"], ["", "U+E014"], ["󾟒", "U+FE7D2"]],
  "🎾": ["U+1F3BE", "tennis racquet and ball", "1f3be", ["", "U+E655"], ["", "U+E4B7"], ["", "U+E015"], ["󾟓", "U+FE7D3"]],
  "⚽": ["U+26BD", "soccer ball", "26bd", ["", "U+E656"], ["", "U+E4B6"], ["", "U+E018"], ["󾟔", "U+FE7D4"]],
  "🎿": ["U+1F3BF", "ski and ski boot", "1f3bf", ["", "U+E657"], ["", "U+EAAC"], ["", "U+E013"], ["󾟕", "U+FE7D5"]],
  "🏀": ["U+1F3C0", "basketball and hoop", "1f3c0", ["", "U+E658"], ["", "U+E59A"], ["", "U+E42A"], ["󾟖", "U+FE7D6"]],
  "🏁": ["U+1F3C1", "chequered flag", "1f3c1", ["", "U+E659"], ["", "U+E4B9"], ["", "U+E132"], ["󾟗", "U+FE7D7"]],
  "🏂": ["U+1F3C2", "snowboarder", "1f3c2", ["", "U+E712"], ["", "U+E4B8"], ["-", "-"], ["󾟘", "U+FE7D8"]],
  "🏃": ["U+1F3C3", "runner", "1f3c3", ["", "U+E733"], ["", "U+E46B"], ["", "U+E115"], ["󾟙", "U+FE7D9"]],
  "🏄": ["U+1F3C4", "surfer", "1f3c4", ["", "U+E712"], ["", "U+EB41"], ["", "U+E017"], ["󾟚", "U+FE7DA"]],
  "🏆": ["U+1F3C6", "trophy", "1f3c6", ["-", "-"], ["", "U+E5D3"], ["", "U+E131"], ["󾟛", "U+FE7DB"]],
  "🏈": ["U+1F3C8", "american football", "1f3c8", ["-", "-"], ["", "U+E4BB"], ["", "U+E42B"], ["󾟝", "U+FE7DD"]],
  "🏊": ["U+1F3CA", "swimmer", "1f3ca", ["-", "-"], ["", "U+EADE"], ["", "U+E42D"], ["󾟞", "U+FE7DE"]],
  "🚃": ["U+1F683", "railway car", "1f683", ["", "U+E65B"], ["", "U+E4B5"], ["", "U+E01E"], ["󾟟", "U+FE7DF"]],
  "🚇": ["U+1F687", "metro", "1f687", ["", "U+E65C"], ["", "U+E5BC"], ["", "U+E434"], ["󾟠", "U+FE7E0"]],
  "Ⓜ": ["U+24C2", "circled latin capital letter m", "24c2", ["", "U+E65C"], ["", "U+E5BC"], ["", "U+E434"], ["󾟡", "U+FE7E1"]],
  "🚄": ["U+1F684", "high-speed train", "1f684", ["", "U+E65D"], ["", "U+E4B0"], ["", "U+E435"], ["󾟢", "U+FE7E2"]],
  "🚅": ["U+1F685", "high-speed train with bullet nose", "1f685", ["", "U+E65D"], ["", "U+E4B0"], ["", "U+E01F"], ["󾟣", "U+FE7E3"]],
  "🚗": ["U+1F697", "automobile", "1f697", ["", "U+E65E"], ["", "U+E4B1"], ["", "U+E01B"], ["󾟤", "U+FE7E4"]],
  "🚙": ["U+1F699", "recreational vehicle", "1f699", ["", "U+E65F"], ["", "U+E4B1"], ["", "U+E42E"], ["󾟥", "U+FE7E5"]],
  "🚌": ["U+1F68C", "bus", "1f68c", ["", "U+E660"], ["", "U+E4AF"], ["", "U+E159"], ["󾟦", "U+FE7E6"]],
  "🚏": ["U+1F68F", "bus stop", "1f68f", ["-", "-"], ["", "U+E4A7"], ["", "U+E150"], ["󾟧", "U+FE7E7"]],
  "🚢": ["U+1F6A2", "ship", "1f6a2", ["", "U+E661"], ["", "U+EA82"], ["", "U+E202"], ["󾟨", "U+FE7E8"]],
  "✈": ["U+2708", "airplane", "2708", ["", "U+E662"], ["", "U+E4B3"], ["", "U+E01D"], ["󾟩", "U+FE7E9"]],
  "⛵": ["U+26F5", "sailboat", "26f5", ["", "U+E6A3"], ["", "U+E4B4"], ["", "U+E01C"], ["󾟪", "U+FE7EA"]],
  "🚉": ["U+1F689", "station", "1f689", ["-", "-"], ["", "U+EB6D"], ["", "U+E039"], ["󾟬", "U+FE7EC"]],
  "🚀": ["U+1F680", "rocket", "1f680", ["-", "-"], ["", "U+E5C8"], ["", "U+E10D"], ["󾟭", "U+FE7ED"]],
  "🚤": ["U+1F6A4", "speedboat", "1f6a4", ["", "U+E6A3"], ["", "U+E4B4"], ["", "U+E135"], ["󾟮", "U+FE7EE"]],
  "🚕": ["U+1F695", "taxi", "1f695", ["", "U+E65E"], ["", "U+E4B1"], ["", "U+E15A"], ["󾟯", "U+FE7EF"]],
  "🚚": ["U+1F69A", "delivery truck", "1f69a", ["-", "-"], ["", "U+E4B2"], ["", "U+E42F"], ["󾟱", "U+FE7F1"]],
  "🚒": ["U+1F692", "fire engine", "1f692", ["-", "-"], ["", "U+EADF"], ["", "U+E430"], ["󾟲", "U+FE7F2"]],
  "🚑": ["U+1F691", "ambulance", "1f691", ["-", "-"], ["", "U+EAE0"], ["", "U+E431"], ["󾟳", "U+FE7F3"]],
  "🚓": ["U+1F693", "police car", "1f693", ["-", "-"], ["", "U+EAE1"], ["", "U+E432"], ["󾟴", "U+FE7F4"]],
  "⛽": ["U+26FD", "fuel pump", "26fd", ["", "U+E66B"], ["", "U+E571"], ["", "U+E03A"], ["󾟵", "U+FE7F5"]],
  "🅿": ["U+1F17F", "negative squared latin capital letter p", "1f17f", ["", "U+E66C"], ["", "U+E4A6"], ["", "U+E14F"], ["󾟶", "U+FE7F6"]],
  "🚥": ["U+1F6A5", "horizontal traffic light", "1f6a5", ["", "U+E66D"], ["", "U+E46A"], ["", "U+E14E"], ["󾟷", "U+FE7F7"]],
  "🚧": ["U+1F6A7", "construction sign", "1f6a7", ["-", "-"], ["", "U+E5D7"], ["", "U+E137"], ["󾟸", "U+FE7F8"]],
  "🚨": ["U+1F6A8", "police cars revolving light", "1f6a8", ["-", "-"], ["", "U+EB73"], ["", "U+E432"], ["󾟹", "U+FE7F9"]],
  "♨": ["U+2668", "hot springs", "2668", ["", "U+E6F7"], ["", "U+E4BC"], ["", "U+E123"], ["󾟺", "U+FE7FA"]],
  "⛺": ["U+26FA", "tent", "26fa", ["-", "-"], ["", "U+E5D0"], ["", "U+E122"], ["󾟻", "U+FE7FB"]],
  "🎠": ["U+1F3A0", "carousel horse", "1f3a0", ["", "U+E679"], ["-", "-"], ["-", "-"], ["󾟼", "U+FE7FC"]],
  "🎡": ["U+1F3A1", "ferris wheel", "1f3a1", ["-", "-"], ["", "U+E46D"], ["", "U+E124"], ["󾟽", "U+FE7FD"]],
  "🎢": ["U+1F3A2", "roller coaster", "1f3a2", ["-", "-"], ["", "U+EAE2"], ["", "U+E433"], ["󾟾", "U+FE7FE"]],
  "🎣": ["U+1F3A3", "fishing pole and fish", "1f3a3", ["", "U+E751"], ["", "U+EB42"], ["", "U+E019"], ["󾟿", "U+FE7FF"]],
  "🎤": ["U+1F3A4", "microphone", "1f3a4", ["", "U+E676"], ["", "U+E503"], ["", "U+E03C"], ["󾠀", "U+FE800"]],
  "🎥": ["U+1F3A5", "movie camera", "1f3a5", ["", "U+E677"], ["", "U+E517"], ["", "U+E03D"], ["󾠁", "U+FE801"]],
  "🎦": ["U+1F3A6", "cinema", "1f3a6", ["", "U+E677"], ["", "U+E517"], ["", "U+E507"], ["󾠂", "U+FE802"]],
  "🎧": ["U+1F3A7", "headphone", "1f3a7", ["", "U+E67A"], ["", "U+E508"], ["", "U+E30A"], ["󾠃", "U+FE803"]],
  "🎨": ["U+1F3A8", "artist palette", "1f3a8", ["", "U+E67B"], ["", "U+E59C"], ["", "U+E502"], ["󾠄", "U+FE804"]],
  "🎩": ["U+1F3A9", "top hat", "1f3a9", ["", "U+E67C"], ["", "U+EAF5"], ["", "U+E503"], ["󾠅", "U+FE805"]],
  "🎪": ["U+1F3AA", "circus tent", "1f3aa", ["", "U+E67D"], ["", "U+E59E"], ["-", "-"], ["󾠆", "U+FE806"]],
  "🎫": ["U+1F3AB", "ticket", "1f3ab", ["", "U+E67E"], ["", "U+E49E"], ["", "U+E125"], ["󾠇", "U+FE807"]],
  "🎬": ["U+1F3AC", "clapper board", "1f3ac", ["", "U+E6AC"], ["", "U+E4BE"], ["", "U+E324"], ["󾠈", "U+FE808"]],
  "🎭": ["U+1F3AD", "performing arts", "1f3ad", ["-", "-"], ["", "U+E59D"], ["", "U+E503"], ["󾠉", "U+FE809"]],
  "🎮": ["U+1F3AE", "video game", "1f3ae", ["", "U+E68B"], ["", "U+E4C6"], ["-", "-"], ["󾠊", "U+FE80A"]],
  "🀄": ["U+1F004", "mahjong tile red dragon", "1f004", ["-", "-"], ["", "U+E5D1"], ["", "U+E12D"], ["󾠋", "U+FE80B"]],
  "🎯": ["U+1F3AF", "direct hit", "1f3af", ["-", "-"], ["", "U+E4C5"], ["", "U+E130"], ["󾠌", "U+FE80C"]],
  "🎰": ["U+1F3B0", "slot machine", "1f3b0", ["-", "-"], ["", "U+E46E"], ["", "U+E133"], ["󾠍", "U+FE80D"]],
  "🎱": ["U+1F3B1", "billiards", "1f3b1", ["-", "-"], ["", "U+EADD"], ["", "U+E42C"], ["󾠎", "U+FE80E"]],
  "🎲": ["U+1F3B2", "game die", "1f3b2", ["-", "-"], ["", "U+E4C8"], ["-", "-"], ["󾠏", "U+FE80F"]],
  "🎳": ["U+1F3B3", "bowling", "1f3b3", ["-", "-"], ["", "U+EB43"], ["-", "-"], ["󾠐", "U+FE810"]],
  "🎴": ["U+1F3B4", "flower playing cards", "1f3b4", ["-", "-"], ["", "U+EB6E"], ["-", "-"], ["󾠑", "U+FE811"]],
  "🃏": ["U+1F0CF", "playing card black joker", "1f0cf", ["-", "-"], ["", "U+EB6F"], ["-", "-"], ["󾠒", "U+FE812"]],
  "🎵": ["U+1F3B5", "musical note", "1f3b5", ["", "U+E6F6"], ["", "U+E5BE"], ["", "U+E03E"], ["󾠓", "U+FE813"]],
  "🎶": ["U+1F3B6", "multiple musical notes", "1f3b6", ["", "U+E6FF"], ["", "U+E505"], ["", "U+E326"], ["󾠔", "U+FE814"]],
  "🎷": ["U+1F3B7", "saxophone", "1f3b7", ["-", "-"], ["-", "-"], ["", "U+E040"], ["󾠕", "U+FE815"]],
  "🎸": ["U+1F3B8", "guitar", "1f3b8", ["-", "-"], ["", "U+E506"], ["", "U+E041"], ["󾠖", "U+FE816"]],
  "🎹": ["U+1F3B9", "musical keyboard", "1f3b9", ["-", "-"], ["", "U+EB40"], ["-", "-"], ["󾠗", "U+FE817"]],
  "🎺": ["U+1F3BA", "trumpet", "1f3ba", ["-", "-"], ["", "U+EADC"], ["", "U+E042"], ["󾠘", "U+FE818"]],
  "🎻": ["U+1F3BB", "violin", "1f3bb", ["-", "-"], ["", "U+E507"], ["-", "-"], ["󾠙", "U+FE819"]],
  "🎼": ["U+1F3BC", "musical score", "1f3bc", ["", "U+E6FF"], ["", "U+EACC"], ["", "U+E326"], ["󾠚", "U+FE81A"]],
  "〽": ["U+303D", "part alternation mark", "303d", ["-", "-"], ["-", "-"], ["", "U+E12C"], ["󾠛", "U+FE81B"]],
  "📷": ["U+1F4F7", "camera", "1f4f7", ["", "U+E681"], ["", "U+E515"], ["", "U+E008"], ["󾓯", "U+FE4EF"]],
  "📹": ["U+1F4F9", "video camera", "1f4f9", ["", "U+E677"], ["", "U+E57E"], ["", "U+E03D"], ["󾓹", "U+FE4F9"]],
  "📺": ["U+1F4FA", "television", "1f4fa", ["", "U+E68A"], ["", "U+E502"], ["", "U+E12A"], ["󾠜", "U+FE81C"]],
  "📻": ["U+1F4FB", "radio", "1f4fb", ["-", "-"], ["", "U+E5B9"], ["", "U+E128"], ["󾠟", "U+FE81F"]],
  "📼": ["U+1F4FC", "videocassette", "1f4fc", ["-", "-"], ["", "U+E580"], ["", "U+E129"], ["󾠠", "U+FE820"]],
  "💋": ["U+1F48B", "kiss mark", "1f48b", ["", "U+E6F9"], ["", "U+E4EB"], ["", "U+E003"], ["󾠣", "U+FE823"]],
  "💌": ["U+1F48C", "love letter", "1f48c", ["", "U+E717"], ["", "U+EB78"], ["", "U+E103 U+E328"], ["󾠤", "U+FE824"]],
  "💍": ["U+1F48D", "ring", "1f48d", ["", "U+E71B"], ["", "U+E514"], ["", "U+E034"], ["󾠥", "U+FE825"]],
  "💎": ["U+1F48E", "gem stone", "1f48e", ["", "U+E71B"], ["", "U+E514"], ["", "U+E035"], ["󾠦", "U+FE826"]],
  "💏": ["U+1F48F", "kiss", "1f48f", ["", "U+E6F9"], ["", "U+E5CA"], ["", "U+E111"], ["󾠧", "U+FE827"]],
  "💐": ["U+1F490", "bouquet", "1f490", ["-", "-"], ["", "U+EA95"], ["", "U+E306"], ["󾠨", "U+FE828"]],
  "💑": ["U+1F491", "couple with heart", "1f491", ["", "U+E6ED"], ["", "U+EADA"], ["", "U+E425"], ["󾠩", "U+FE829"]],
  "💒": ["U+1F492", "wedding", "1f492", ["-", "-"], ["", "U+E5BB"], ["", "U+E43D"], ["󾠪", "U+FE82A"]],
  "🔞": ["U+1F51E", "no one under eighteen symbol", "1f51e", ["-", "-"], ["", "U+EA83"], ["", "U+E207"], ["󾬥", "U+FEB25"]],
  "©": ["U+00A9", "copyright sign", "a9", ["", "U+E731"], ["", "U+E558"], ["", "U+E24E"], ["󾬩", "U+FEB29"]],
  "®": ["U+00AE", "registered sign", "ae", ["", "U+E736"], ["", "U+E559"], ["", "U+E24F"], ["󾬭", "U+FEB2D"]],
  "™": ["U+2122", "trade mark sign", "2122", ["", "U+E732"], ["", "U+E54E"], ["", "U+E537"], ["󾬪", "U+FEB2A"]],
  "ℹ": ["U+2139", "information source", "2139", ["-", "-"], ["", "U+E533"], ["-", "-"], ["󾭇", "U+FEB47"]],
  "#⃣": ["U+0023 U+20E3", "hash key", "2320e3", ["", "U+E6E0"], ["", "U+EB84"], ["", "U+E210"], ["󾠬", "U+FE82C"]],
  "1⃣": ["U+0031 U+20E3", "keycap 1", "3120e3", ["", "U+E6E2"], ["", "U+E522"], ["", "U+E21C"], ["󾠮", "U+FE82E"]],
  "2⃣": ["U+0032 U+20E3", "keycap 2", "3220e3", ["", "U+E6E3"], ["", "U+E523"], ["", "U+E21D"], ["󾠯", "U+FE82F"]],
  "3⃣": ["U+0033 U+20E3", "keycap 3", "3320e3", ["", "U+E6E4"], ["", "U+E524"], ["", "U+E21E"], ["󾠰", "U+FE830"]],
  "4⃣": ["U+0034 U+20E3", "keycap 4", "3420e3", ["", "U+E6E5"], ["", "U+E525"], ["", "U+E21F"], ["󾠱", "U+FE831"]],
  "5⃣": ["U+0035 U+20E3", "keycap 5", "3520e3", ["", "U+E6E6"], ["", "U+E526"], ["", "U+E220"], ["󾠲", "U+FE832"]],
  "6⃣": ["U+0036 U+20E3", "keycap 6", "3620e3", ["", "U+E6E7"], ["", "U+E527"], ["", "U+E221"], ["󾠳", "U+FE833"]],
  "7⃣": ["U+0037 U+20E3", "keycap 7", "3720e3", ["", "U+E6E8"], ["", "U+E528"], ["", "U+E222"], ["󾠴", "U+FE834"]],
  "8⃣": ["U+0038 U+20E3", "keycap 8", "3820e3", ["", "U+E6E9"], ["", "U+E529"], ["", "U+E223"], ["󾠵", "U+FE835"]],
  "9⃣": ["U+0039 U+20E3", "keycap 9", "3920e3", ["", "U+E6EA"], ["", "U+E52A"], ["", "U+E224"], ["󾠶", "U+FE836"]],
  "0⃣": ["U+0030 U+20E3", "keycap 0", "3020e3", ["", "U+E6EB"], ["", "U+E5AC"], ["", "U+E225"], ["󾠷", "U+FE837"]],
  "🔟": ["U+1F51F", "keycap ten", "1f51f", ["-", "-"], ["", "U+E52B"], ["-", "-"], ["󾠻", "U+FE83B"]],
  "📶": ["U+1F4F6", "antenna with bars", "1f4f6", ["-", "-"], ["", "U+EA84"], ["", "U+E20B"], ["󾠸", "U+FE838"]],
  "📳": ["U+1F4F3", "vibration mode", "1f4f3", ["-", "-"], ["", "U+EA90"], ["", "U+E250"], ["󾠹", "U+FE839"]],
  "📴": ["U+1F4F4", "mobile phone off", "1f4f4", ["-", "-"], ["", "U+EA91"], ["", "U+E251"], ["󾠺", "U+FE83A"]],
  "🍔": ["U+1F354", "hamburger", "1f354", ["", "U+E673"], ["", "U+E4D6"], ["", "U+E120"], ["󾥠", "U+FE960"]],
  "🍙": ["U+1F359", "rice ball", "1f359", ["", "U+E749"], ["", "U+E4D5"], ["", "U+E342"], ["󾥡", "U+FE961"]],
  "🍰": ["U+1F370", "shortcake", "1f370", ["", "U+E74A"], ["", "U+E4D0"], ["", "U+E046"], ["󾥢", "U+FE962"]],
  "🍜": ["U+1F35C", "steaming bowl", "1f35c", ["", "U+E74C"], ["", "U+E5B4"], ["", "U+E340"], ["󾥣", "U+FE963"]],
  "🍞": ["U+1F35E", "bread", "1f35e", ["", "U+E74D"], ["", "U+EAAF"], ["", "U+E339"], ["󾥤", "U+FE964"]],
  "🍳": ["U+1F373", "cooking", "1f373", ["-", "-"], ["", "U+E4D1"], ["", "U+E147"], ["󾥥", "U+FE965"]],
  "🍦": ["U+1F366", "soft ice cream", "1f366", ["-", "-"], ["", "U+EAB0"], ["", "U+E33A"], ["󾥦", "U+FE966"]],
  "🍟": ["U+1F35F", "french fries", "1f35f", ["-", "-"], ["", "U+EAB1"], ["", "U+E33B"], ["󾥧", "U+FE967"]],
  "🍡": ["U+1F361", "dango", "1f361", ["-", "-"], ["", "U+EAB2"], ["", "U+E33C"], ["󾥨", "U+FE968"]],
  "🍘": ["U+1F358", "rice cracker", "1f358", ["-", "-"], ["", "U+EAB3"], ["", "U+E33D"], ["󾥩", "U+FE969"]],
  "🍚": ["U+1F35A", "cooked rice", "1f35a", ["", "U+E74C"], ["", "U+EAB4"], ["", "U+E33E"], ["󾥪", "U+FE96A"]],
  "🍝": ["U+1F35D", "spaghetti", "1f35d", ["-", "-"], ["", "U+EAB5"], ["", "U+E33F"], ["󾥫", "U+FE96B"]],
  "🍛": ["U+1F35B", "curry and rice", "1f35b", ["-", "-"], ["", "U+EAB6"], ["", "U+E341"], ["󾥬", "U+FE96C"]],
  "🍢": ["U+1F362", "oden", "1f362", ["-", "-"], ["", "U+EAB7"], ["", "U+E343"], ["󾥭", "U+FE96D"]],
  "🍣": ["U+1F363", "sushi", "1f363", ["-", "-"], ["", "U+EAB8"], ["", "U+E344"], ["󾥮", "U+FE96E"]],
  "🍱": ["U+1F371", "bento box", "1f371", ["-", "-"], ["", "U+EABD"], ["", "U+E34C"], ["󾥯", "U+FE96F"]],
  "🍲": ["U+1F372", "pot of food", "1f372", ["-", "-"], ["", "U+EABE"], ["", "U+E34D"], ["󾥰", "U+FE970"]],
  "🍧": ["U+1F367", "shaved ice", "1f367", ["-", "-"], ["", "U+EAEA"], ["", "U+E43F"], ["󾥱", "U+FE971"]],
  "🍖": ["U+1F356", "meat on bone", "1f356", ["-", "-"], ["", "U+E4C4"], ["-", "-"], ["󾥲", "U+FE972"]],
  "🍥": ["U+1F365", "fish cake with swirl design", "1f365", ["", "U+E643"], ["", "U+E4ED"], ["-", "-"], ["󾥳", "U+FE973"]],
  "🍠": ["U+1F360", "roasted sweet potato", "1f360", ["-", "-"], ["", "U+EB3A"], ["-", "-"], ["󾥴", "U+FE974"]],
  "🍕": ["U+1F355", "slice of pizza", "1f355", ["-", "-"], ["", "U+EB3B"], ["-", "-"], ["󾥵", "U+FE975"]],
  "🍗": ["U+1F357", "poultry leg", "1f357", ["-", "-"], ["", "U+EB3C"], ["-", "-"], ["󾥶", "U+FE976"]],
  "🍨": ["U+1F368", "ice cream", "1f368", ["-", "-"], ["", "U+EB4A"], ["-", "-"], ["󾥷", "U+FE977"]],
  "🍩": ["U+1F369", "doughnut", "1f369", ["-", "-"], ["", "U+EB4B"], ["-", "-"], ["󾥸", "U+FE978"]],
  "🍪": ["U+1F36A", "cookie", "1f36a", ["-", "-"], ["", "U+EB4C"], ["-", "-"], ["󾥹", "U+FE979"]],
  "🍫": ["U+1F36B", "chocolate bar", "1f36b", ["-", "-"], ["", "U+EB4D"], ["-", "-"], ["󾥺", "U+FE97A"]],
  "🍬": ["U+1F36C", "candy", "1f36c", ["-", "-"], ["", "U+EB4E"], ["-", "-"], ["󾥻", "U+FE97B"]],
  "🍭": ["U+1F36D", "lollipop", "1f36d", ["-", "-"], ["", "U+EB4F"], ["-", "-"], ["󾥼", "U+FE97C"]],
  "🍮": ["U+1F36E", "custard", "1f36e", ["-", "-"], ["", "U+EB56"], ["-", "-"], ["󾥽", "U+FE97D"]],
  "🍯": ["U+1F36F", "honey pot", "1f36f", ["-", "-"], ["", "U+EB59"], ["-", "-"], ["󾥾", "U+FE97E"]],
  "🍤": ["U+1F364", "fried shrimp", "1f364", ["-", "-"], ["", "U+EB70"], ["-", "-"], ["󾥿", "U+FE97F"]],
  "🍴": ["U+1F374", "fork and knife", "1f374", ["", "U+E66F"], ["", "U+E4AC"], ["", "U+E043"], ["󾦀", "U+FE980"]],
  "☕": ["U+2615", "hot beverage", "2615", ["", "U+E670"], ["", "U+E597"], ["", "U+E045"], ["󾦁", "U+FE981"]],
  "🍸": ["U+1F378", "cocktail glass", "1f378", ["", "U+E671"], ["", "U+E4C2"], ["", "U+E044"], ["󾦂", "U+FE982"]],
  "🍺": ["U+1F37A", "beer mug", "1f37a", ["", "U+E672"], ["", "U+E4C3"], ["", "U+E047"], ["󾦃", "U+FE983"]],
  "🍵": ["U+1F375", "teacup without handle", "1f375", ["", "U+E71E"], ["", "U+EAAE"], ["", "U+E338"], ["󾦄", "U+FE984"]],
  "🍶": ["U+1F376", "sake bottle and cup", "1f376", ["", "U+E74B"], ["", "U+EA97"], ["", "U+E30B"], ["󾦅", "U+FE985"]],
  "🍷": ["U+1F377", "wine glass", "1f377", ["", "U+E756"], ["", "U+E4C1"], ["", "U+E044"], ["󾦆", "U+FE986"]],
  "🍻": ["U+1F37B", "clinking beer mugs", "1f37b", ["", "U+E672"], ["", "U+EA98"], ["", "U+E30C"], ["󾦇", "U+FE987"]],
  "🍹": ["U+1F379", "tropical drink", "1f379", ["", "U+E671"], ["", "U+EB3E"], ["", "U+E044"], ["󾦈", "U+FE988"]],
  "↗": ["U+2197", "north east arrow", "2197", ["", "U+E678"], ["", "U+E555"], ["", "U+E236"], ["󾫰", "U+FEAF0"]],
  "↘": ["U+2198", "south east arrow", "2198", ["", "U+E696"], ["", "U+E54D"], ["", "U+E238"], ["󾫱", "U+FEAF1"]],
  "↖": ["U+2196", "north west arrow", "2196", ["", "U+E697"], ["", "U+E54C"], ["", "U+E237"], ["󾫲", "U+FEAF2"]],
  "↙": ["U+2199", "south west arrow", "2199", ["", "U+E6A5"], ["", "U+E556"], ["", "U+E239"], ["󾫳", "U+FEAF3"]],
  "⤴": ["U+2934", "arrow pointing rightwards then curving upwards", "2934", ["", "U+E6F5"], ["", "U+EB2D"], ["", "U+E236"], ["󾫴", "U+FEAF4"]],
  "⤵": ["U+2935", "arrow pointing rightwards then curving downwards", "2935", ["", "U+E700"], ["", "U+EB2E"], ["", "U+E238"], ["󾫵", "U+FEAF5"]],
  "↔": ["U+2194", "left right arrow", "2194", ["", "U+E73C"], ["", "U+EB7A"], ["-", "-"], ["󾫶", "U+FEAF6"]],
  "↕": ["U+2195", "up down arrow", "2195", ["", "U+E73D"], ["", "U+EB7B"], ["-", "-"], ["󾫷", "U+FEAF7"]],
  "⬆": ["U+2B06", "upwards black arrow", "2b06", ["-", "-"], ["", "U+E53F"], ["", "U+E232"], ["󾫸", "U+FEAF8"]],
  "⬇": ["U+2B07", "downwards black arrow", "2b07", ["-", "-"], ["", "U+E540"], ["", "U+E233"], ["󾫹", "U+FEAF9"]],
  "➡": ["U+27A1", "black rightwards arrow", "27a1", ["-", "-"], ["", "U+E552"], ["", "U+E234"], ["󾫺", "U+FEAFA"]],
  "⬅": ["U+2B05", "leftwards black arrow", "2b05", ["-", "-"], ["", "U+E553"], ["", "U+E235"], ["󾫻", "U+FEAFB"]],
  "▶": ["U+25B6", "black right-pointing triangle", "25b6", ["-", "-"], ["", "U+E52E"], ["", "U+E23A"], ["󾫼", "U+FEAFC"]],
  "◀": ["U+25C0", "black left-pointing triangle", "25c0", ["-", "-"], ["", "U+E52D"], ["", "U+E23B"], ["󾫽", "U+FEAFD"]],
  "⏩": ["U+23E9", "black right-pointing double triangle", "23e9", ["-", "-"], ["", "U+E530"], ["", "U+E23C"], ["󾫾", "U+FEAFE"]],
  "⏪": ["U+23EA", "black left-pointing double triangle", "23ea", ["-", "-"], ["", "U+E52F"], ["", "U+E23D"], ["󾫿", "U+FEAFF"]],
  "⏫": ["U+23EB", "black up-pointing double triangle", "23eb", ["-", "-"], ["", "U+E545"], ["-", "-"], ["󾬃", "U+FEB03"]],
  "⏬": ["U+23EC", "black down-pointing double triangle", "23ec", ["-", "-"], ["", "U+E544"], ["-", "-"], ["󾬂", "U+FEB02"]],
  "🔺": ["U+1F53A", "up-pointing red triangle", "1f53a", ["-", "-"], ["", "U+E55A"], ["-", "-"], ["󾭸", "U+FEB78"]],
  "🔻": ["U+1F53B", "down-pointing red triangle", "1f53b", ["-", "-"], ["", "U+E55B"], ["-", "-"], ["󾭹", "U+FEB79"]],
  "🔼": ["U+1F53C", "up-pointing small red triangle", "1f53c", ["-", "-"], ["", "U+E543"], ["-", "-"], ["󾬁", "U+FEB01"]],
  "🔽": ["U+1F53D", "down-pointing small red triangle", "1f53d", ["-", "-"], ["", "U+E542"], ["-", "-"], ["󾬀", "U+FEB00"]],
  "⭕": ["U+2B55", "heavy large circle", "2b55", ["", "U+E6A0"], ["", "U+EAAD"], ["", "U+E332"], ["󾭄", "U+FEB44"]],
  "❌": ["U+274C", "cross mark", "274c", ["-", "-"], ["", "U+E550"], ["", "U+E333"], ["󾭅", "U+FEB45"]],
  "❎": ["U+274E", "negative squared cross mark", "274e", ["-", "-"], ["", "U+E551"], ["", "U+E333"], ["󾭆", "U+FEB46"]],
  "❗": ["U+2757", "heavy exclamation mark symbol", "2757", ["", "U+E702"], ["", "U+E482"], ["", "U+E021"], ["󾬄", "U+FEB04"]],
  "⁉": ["U+2049", "exclamation question mark", "2049", ["", "U+E703"], ["", "U+EB2F"], ["-", "-"], ["󾬅", "U+FEB05"]],
  "‼": ["U+203C", "double exclamation mark", "203c", ["", "U+E704"], ["", "U+EB30"], ["-", "-"], ["󾬆", "U+FEB06"]],
  "❓": ["U+2753", "black question mark ornament", "2753", ["-", "-"], ["", "U+E483"], ["", "U+E020"], ["󾬉", "U+FEB09"]],
  "❔": ["U+2754", "white question mark ornament", "2754", ["-", "-"], ["", "U+E483"], ["", "U+E336"], ["󾬊", "U+FEB0A"]],
  "❕": ["U+2755", "white exclamation mark ornament", "2755", ["", "U+E702"], ["", "U+E482"], ["", "U+E337"], ["󾬋", "U+FEB0B"]],
  "〰": ["U+3030", "wavy dash", "3030", ["", "U+E709"], ["-", "-"], ["-", "-"], ["󾬇", "U+FEB07"]],
  "➰": ["U+27B0", "curly loop", "27b0", ["", "U+E70A"], ["", "U+EB31"], ["-", "-"], ["󾬈", "U+FEB08"]],
  "➿": ["U+27BF", "double curly loop", "27bf", ["", "U+E6DF"], ["-", "-"], ["", "U+E211"], ["󾠫", "U+FE82B"]],
  "❤": ["U+2764", "heavy black heart", "2764", ["", "U+E6EC"], ["", "U+E595"], ["", "U+E022"], ["󾬌", "U+FEB0C"]],
  "💓": ["U+1F493", "beating heart", "1f493", ["", "U+E6ED"], ["", "U+EB75"], ["", "U+E327"], ["󾬍", "U+FEB0D"]],
  "💔": ["U+1F494", "broken heart", "1f494", ["", "U+E6EE"], ["", "U+E477"], ["", "U+E023"], ["󾬎", "U+FEB0E"]],
  "💕": ["U+1F495", "two hearts", "1f495", ["", "U+E6EF"], ["", "U+E478"], ["", "U+E327"], ["󾬏", "U+FEB0F"]],
  "💖": ["U+1F496", "sparkling heart", "1f496", ["", "U+E6EC"], ["", "U+EAA6"], ["", "U+E327"], ["󾬐", "U+FEB10"]],
  "💗": ["U+1F497", "growing heart", "1f497", ["", "U+E6ED"], ["", "U+EB75"], ["", "U+E328"], ["󾬑", "U+FEB11"]],
  "💘": ["U+1F498", "heart with arrow", "1f498", ["", "U+E6EC"], ["", "U+E4EA"], ["", "U+E329"], ["󾬒", "U+FEB12"]],
  "💙": ["U+1F499", "blue heart", "1f499", ["", "U+E6EC"], ["", "U+EAA7"], ["", "U+E32A"], ["󾬓", "U+FEB13"]],
  "💚": ["U+1F49A", "green heart", "1f49a", ["", "U+E6EC"], ["", "U+EAA8"], ["", "U+E32B"], ["󾬔", "U+FEB14"]],
  "💛": ["U+1F49B", "yellow heart", "1f49b", ["", "U+E6EC"], ["", "U+EAA9"], ["", "U+E32C"], ["󾬕", "U+FEB15"]],
  "💜": ["U+1F49C", "purple heart", "1f49c", ["", "U+E6EC"], ["", "U+EAAA"], ["", "U+E32D"], ["󾬖", "U+FEB16"]],
  "💝": ["U+1F49D", "heart with ribbon", "1f49d", ["", "U+E6EC"], ["", "U+EB54"], ["", "U+E437"], ["󾬗", "U+FEB17"]],
  "💞": ["U+1F49E", "revolving hearts", "1f49e", ["", "U+E6ED"], ["", "U+E5AF"], ["", "U+E327"], ["󾬘", "U+FEB18"]],
  "💟": ["U+1F49F", "heart decoration", "1f49f", ["", "U+E6F8"], ["", "U+E595"], ["", "U+E204"], ["󾬙", "U+FEB19"]],
  "♥": ["U+2665", "black heart suit", "2665", ["", "U+E68D"], ["", "U+EAA5"], ["", "U+E20C"], ["󾬚", "U+FEB1A"]],
  "♠": ["U+2660", "black spade suit", "2660", ["", "U+E68E"], ["", "U+E5A1"], ["", "U+E20E"], ["󾬛", "U+FEB1B"]],
  "♦": ["U+2666", "black diamond suit", "2666", ["", "U+E68F"], ["", "U+E5A2"], ["", "U+E20D"], ["󾬜", "U+FEB1C"]],
  "♣": ["U+2663", "black club suit", "2663", ["", "U+E690"], ["", "U+E5A3"], ["", "U+E20F"], ["󾬝", "U+FEB1D"]],
  "🚬": ["U+1F6AC", "smoking symbol", "1f6ac", ["", "U+E67F"], ["", "U+E47D"], ["", "U+E30E"], ["󾬞", "U+FEB1E"]],
  "🚭": ["U+1F6AD", "no smoking symbol", "1f6ad", ["", "U+E680"], ["", "U+E47E"], ["", "U+E208"], ["󾬟", "U+FEB1F"]],
  "♿": ["U+267F", "wheelchair symbol", "267f", ["", "U+E69B"], ["", "U+E47F"], ["", "U+E20A"], ["󾬠", "U+FEB20"]],
  "🚩": ["U+1F6A9", "triangular flag on post", "1f6a9", ["", "U+E6DE"], ["", "U+EB2C"], ["-", "-"], ["󾬢", "U+FEB22"]],
  "⚠": ["U+26A0", "warning sign", "26a0", ["", "U+E737"], ["", "U+E481"], ["", "U+E252"], ["󾬣", "U+FEB23"]],
  "⛔": ["U+26D4", "no entry", "26d4", ["", "U+E72F"], ["", "U+E484"], ["", "U+E137"], ["󾬦", "U+FEB26"]],
  "♻": ["U+267B", "black universal recycling symbol", "267b", ["", "U+E735"], ["", "U+EB79"], ["-", "-"], ["󾬬", "U+FEB2C"]],
  "🚲": ["U+1F6B2", "bicycle", "1f6b2", ["", "U+E71D"], ["", "U+E4AE"], ["", "U+E136"], ["󾟫", "U+FE7EB"]],
  "🚶": ["U+1F6B6", "pedestrian", "1f6b6", ["", "U+E733"], ["", "U+EB72"], ["", "U+E201"], ["󾟰", "U+FE7F0"]],
  "🚹": ["U+1F6B9", "mens symbol", "1f6b9", ["-", "-"], ["-", "-"], ["", "U+E138"], ["󾬳", "U+FEB33"]],
  "🚺": ["U+1F6BA", "womens symbol", "1f6ba", ["-", "-"], ["-", "-"], ["", "U+E139"], ["󾬴", "U+FEB34"]],
  "🛀": ["U+1F6C0", "bath", "1f6c0", ["", "U+E6F7"], ["", "U+E5D8"], ["", "U+E13F"], ["󾔅", "U+FE505"]],
  "🚻": ["U+1F6BB", "restroom", "1f6bb", ["", "U+E66E"], ["", "U+E4A5"], ["", "U+E151"], ["󾔆", "U+FE506"]],
  "🚽": ["U+1F6BD", "toilet", "1f6bd", ["", "U+E66E"], ["", "U+E4A5"], ["", "U+E140"], ["󾔇", "U+FE507"]],
  "🚾": ["U+1F6BE", "water closet", "1f6be", ["", "U+E66E"], ["", "U+E4A5"], ["", "U+E309"], ["󾔈", "U+FE508"]],
  "🚼": ["U+1F6BC", "baby symbol", "1f6bc", ["-", "-"], ["", "U+EB18"], ["", "U+E13A"], ["󾬵", "U+FEB35"]],
  "🚪": ["U+1F6AA", "door", "1f6aa", ["", "U+E714"], ["-", "-"], ["-", "-"], ["󾓳", "U+FE4F3"]],
  "🚫": ["U+1F6AB", "no entry sign", "1f6ab", ["", "U+E738"], ["", "U+E541"], ["-", "-"], ["󾭈", "U+FEB48"]],
  "✔": ["U+2714", "heavy check mark", "2714", ["-", "-"], ["", "U+E557"], ["-", "-"], ["󾭉", "U+FEB49"]],
  "🆑": ["U+1F191", "squared cl", "1f191", ["", "U+E6DB"], ["", "U+E5AB"], ["-", "-"], ["󾮄", "U+FEB84"]],
  "🆒": ["U+1F192", "squared cool", "1f192", ["-", "-"], ["", "U+EA85"], ["", "U+E214"], ["󾬸", "U+FEB38"]],
  "🆓": ["U+1F193", "squared free", "1f193", ["", "U+E6D7"], ["", "U+E578"], ["-", "-"], ["󾬡", "U+FEB21"]],
  "🆔": ["U+1F194", "squared id", "1f194", ["", "U+E6D8"], ["", "U+EA88"], ["", "U+E229"], ["󾮁", "U+FEB81"]],
  "🆕": ["U+1F195", "squared new", "1f195", ["", "U+E6DD"], ["", "U+E5B5"], ["", "U+E212"], ["󾬶", "U+FEB36"]],
  "🆖": ["U+1F196", "squared ng", "1f196", ["", "U+E72F"], ["-", "-"], ["-", "-"], ["󾬨", "U+FEB28"]],
  "🆗": ["U+1F197", "squared ok", "1f197", ["", "U+E70B"], ["", "U+E5AD"], ["", "U+E24D"], ["󾬧", "U+FEB27"]],
  "🆘": ["U+1F198", "squared sos", "1f198", ["-", "-"], ["", "U+E4E8"], ["-", "-"], ["󾭏", "U+FEB4F"]],
  "🆙": ["U+1F199", "squared up with exclamation mark", "1f199", ["-", "-"], ["", "U+E50F"], ["", "U+E213"], ["󾬷", "U+FEB37"]],
  "🆚": ["U+1F19A", "squared vs", "1f19a", ["-", "-"], ["", "U+E5D2"], ["", "U+E12E"], ["󾬲", "U+FEB32"]],
  "🈁": ["U+1F201", "squared katakana koko", "1f201", ["-", "-"], ["-", "-"], ["", "U+E203"], ["󾬤", "U+FEB24"]],
  "🈂": ["U+1F202", "squared katakana sa", "1f202", ["-", "-"], ["", "U+EA87"], ["", "U+E228"], ["󾬿", "U+FEB3F"]],
  "🈲": ["U+1F232", "squared cjk unified ideograph-7981", "1f232", ["", "U+E738"], ["-", "-"], ["-", "-"], ["󾬮", "U+FEB2E"]],
  "🈳": ["U+1F233", "squared cjk unified ideograph-7a7a", "1f233", ["", "U+E739"], ["", "U+EA8A"], ["", "U+E22B"], ["󾬯", "U+FEB2F"]],
  "🈴": ["U+1F234", "squared cjk unified ideograph-5408", "1f234", ["", "U+E73A"], ["-", "-"], ["-", "-"], ["󾬰", "U+FEB30"]],
  "🈵": ["U+1F235", "squared cjk unified ideograph-6e80", "1f235", ["", "U+E73B"], ["", "U+EA89"], ["", "U+E22A"], ["󾬱", "U+FEB31"]],
  "🈶": ["U+1F236", "squared cjk unified ideograph-6709", "1f236", ["-", "-"], ["-", "-"], ["", "U+E215"], ["󾬹", "U+FEB39"]],
  "🈚": ["U+1F21A", "squared cjk unified ideograph-7121", "1f21a", ["-", "-"], ["-", "-"], ["", "U+E216"], ["󾬺", "U+FEB3A"]],
  "🈷": ["U+1F237", "squared cjk unified ideograph-6708", "1f237", ["-", "-"], ["-", "-"], ["", "U+E217"], ["󾬻", "U+FEB3B"]],
  "🈸": ["U+1F238", "squared cjk unified ideograph-7533", "1f238", ["-", "-"], ["-", "-"], ["", "U+E218"], ["󾬼", "U+FEB3C"]],
  "🈹": ["U+1F239", "squared cjk unified ideograph-5272", "1f239", ["-", "-"], ["", "U+EA86"], ["", "U+E227"], ["󾬾", "U+FEB3E"]],
  "🈯": ["U+1F22F", "squared cjk unified ideograph-6307", "1f22f", ["-", "-"], ["", "U+EA8B"], ["", "U+E22C"], ["󾭀", "U+FEB40"]],
  "🈺": ["U+1F23A", "squared cjk unified ideograph-55b6", "1f23a", ["-", "-"], ["", "U+EA8C"], ["", "U+E22D"], ["󾭁", "U+FEB41"]],
  "㊙": ["U+3299", "circled ideograph secret", "3299", ["", "U+E734"], ["", "U+E4F1"], ["", "U+E315"], ["󾬫", "U+FEB2B"]],
  "㊗": ["U+3297", "circled ideograph congratulation", "3297", ["-", "-"], ["", "U+EA99"], ["", "U+E30D"], ["󾭃", "U+FEB43"]],
  "🉐": ["U+1F250", "circled ideograph advantage", "1f250", ["-", "-"], ["", "U+E4F7"], ["", "U+E226"], ["󾬽", "U+FEB3D"]],
  "🉑": ["U+1F251", "circled ideograph accept", "1f251", ["-", "-"], ["", "U+EB01"], ["-", "-"], ["󾭐", "U+FEB50"]],
  "➕": ["U+2795", "heavy plus sign", "2795", ["-", "-"], ["", "U+E53C"], ["-", "-"], ["󾭑", "U+FEB51"]],
  "➖": ["U+2796", "heavy minus sign", "2796", ["-", "-"], ["", "U+E53D"], ["-", "-"], ["󾭒", "U+FEB52"]],
  "✖": ["U+2716", "heavy multiplication x", "2716", ["-", "-"], ["", "U+E54F"], ["", "U+E333"], ["󾭓", "U+FEB53"]],
  "➗": ["U+2797", "heavy division sign", "2797", ["-", "-"], ["", "U+E554"], ["-", "-"], ["󾭔", "U+FEB54"]],
  "💠": ["U+1F4A0", "diamond shape with a dot inside", "1f4a0", ["", "U+E6F8"], ["-", "-"], ["-", "-"], ["󾭕", "U+FEB55"]],
  "💡": ["U+1F4A1", "electric light bulb", "1f4a1", ["", "U+E6FB"], ["", "U+E476"], ["", "U+E10F"], ["󾭖", "U+FEB56"]],
  "💢": ["U+1F4A2", "anger symbol", "1f4a2", ["", "U+E6FC"], ["", "U+E4E5"], ["", "U+E334"], ["󾭗", "U+FEB57"]],
  "💣": ["U+1F4A3", "bomb", "1f4a3", ["", "U+E6FE"], ["", "U+E47A"], ["", "U+E311"], ["󾭘", "U+FEB58"]],
  "💤": ["U+1F4A4", "sleeping symbol", "1f4a4", ["", "U+E701"], ["", "U+E475"], ["", "U+E13C"], ["󾭙", "U+FEB59"]],
  "💥": ["U+1F4A5", "collision symbol", "1f4a5", ["", "U+E705"], ["", "U+E5B0"], ["-", "-"], ["󾭚", "U+FEB5A"]],
  "💦": ["U+1F4A6", "splashing sweat symbol", "1f4a6", ["", "U+E706"], ["", "U+E5B1"], ["", "U+E331"], ["󾭛", "U+FEB5B"]],
  "💧": ["U+1F4A7", "droplet", "1f4a7", ["", "U+E707"], ["", "U+E4E6"], ["", "U+E331"], ["󾭜", "U+FEB5C"]],
  "💨": ["U+1F4A8", "dash symbol", "1f4a8", ["", "U+E708"], ["", "U+E4F4"], ["", "U+E330"], ["󾭝", "U+FEB5D"]],
  "💩": ["U+1F4A9", "pile of poo", "1f4a9", ["-", "-"], ["", "U+E4F5"], ["", "U+E05A"], ["󾓴", "U+FE4F4"]],
  "💪": ["U+1F4AA", "flexed biceps", "1f4aa", ["-", "-"], ["", "U+E4E9"], ["", "U+E14C"], ["󾭞", "U+FEB5E"]],
  "💫": ["U+1F4AB", "dizzy symbol", "1f4ab", ["-", "-"], ["", "U+EB5C"], ["", "U+E407"], ["󾭟", "U+FEB5F"]],
  "💬": ["U+1F4AC", "speech balloon", "1f4ac", ["-", "-"], ["", "U+E4FD"], ["-", "-"], ["󾔲", "U+FE532"]],
  "✨": ["U+2728", "sparkles", "2728", ["", "U+E6FA"], ["", "U+EAAB"], ["", "U+E32E"], ["󾭠", "U+FEB60"]],
  "✴": ["U+2734", "eight pointed black star", "2734", ["", "U+E6F8"], ["", "U+E479"], ["", "U+E205"], ["󾭡", "U+FEB61"]],
  "✳": ["U+2733", "eight spoked asterisk", "2733", ["", "U+E6F8"], ["", "U+E53E"], ["", "U+E206"], ["󾭢", "U+FEB62"]],
  "⚪": ["U+26AA", "medium white circle", "26aa", ["", "U+E69C"], ["", "U+E53A"], ["", "U+E219"], ["󾭥", "U+FEB65"]],
  "⚫": ["U+26AB", "medium black circle", "26ab", ["", "U+E69C"], ["", "U+E53B"], ["", "U+E219"], ["󾭦", "U+FEB66"]],
  "🔴": ["U+1F534", "large red circle", "1f534", ["", "U+E69C"], ["", "U+E54A"], ["", "U+E219"], ["󾭣", "U+FEB63"]],
  "🔵": ["U+1F535", "large blue circle", "1f535", ["", "U+E69C"], ["", "U+E54B"], ["", "U+E21A"], ["󾭤", "U+FEB64"]],
  "🔲": ["U+1F532", "black square button", "1f532", ["", "U+E69C"], ["", "U+E54B"], ["", "U+E21A"], ["󾭤", "U+FEB64"]],
  "🔳": ["U+1F533", "white square button", "1f533", ["", "U+E69C"], ["", "U+E54B"], ["", "U+E21B"], ["󾭧", "U+FEB67"]],
  "⭐": ["U+2B50", "white medium star", "2b50", ["-", "-"], ["", "U+E48B"], ["", "U+E32F"], ["󾭨", "U+FEB68"]],
  "⬜": ["U+2B1C", "white large square", "2b1c", ["-", "-"], ["", "U+E548"], ["", "U+E21B"], ["󾭫", "U+FEB6B"]],
  "⬛": ["U+2B1B", "black large square", "2b1b", ["-", "-"], ["", "U+E549"], ["", "U+E21A"], ["󾭬", "U+FEB6C"]],
  "▫": ["U+25AB", "white small square", "25ab", ["-", "-"], ["", "U+E531"], ["", "U+E21B"], ["󾭭", "U+FEB6D"]],
  "▪": ["U+25AA", "black small square", "25aa", ["-", "-"], ["", "U+E532"], ["", "U+E21A"], ["󾭮", "U+FEB6E"]],
  "◽": ["U+25FD", "white medium small square", "25fd", ["-", "-"], ["", "U+E534"], ["", "U+E21B"], ["󾭯", "U+FEB6F"]],
  "◾": ["U+25FE", "black medium small square", "25fe", ["-", "-"], ["", "U+E535"], ["", "U+E21A"], ["󾭰", "U+FEB70"]],
  "◻": ["U+25FB", "white medium square", "25fb", ["-", "-"], ["", "U+E538"], ["", "U+E21B"], ["󾭱", "U+FEB71"]],
  "◼": ["U+25FC", "black medium square", "25fc", ["-", "-"], ["", "U+E539"], ["", "U+E21A"], ["󾭲", "U+FEB72"]],
  "🔶": ["U+1F536", "large orange diamond", "1f536", ["-", "-"], ["", "U+E546"], ["", "U+E21B"], ["󾭳", "U+FEB73"]],
  "🔷": ["U+1F537", "large blue diamond", "1f537", ["-", "-"], ["", "U+E547"], ["", "U+E21B"], ["󾭴", "U+FEB74"]],
  "🔸": ["U+1F538", "small orange diamond", "1f538", ["-", "-"], ["", "U+E536"], ["", "U+E21B"], ["󾭵", "U+FEB75"]],
  "🔹": ["U+1F539", "small blue diamond", "1f539", ["-", "-"], ["", "U+E537"], ["", "U+E21B"], ["󾭶", "U+FEB76"]],
  "❇": ["U+2747", "sparkle", "2747", ["", "U+E6FA"], ["", "U+E46C"], ["", "U+E32E"], ["󾭷", "U+FEB77"]],
  "💮": ["U+1F4AE", "white flower", "1f4ae", ["-", "-"], ["", "U+E4F0"], ["-", "-"], ["󾭺", "U+FEB7A"]],
  "💯": ["U+1F4AF", "hundred points symbol", "1f4af", ["-", "-"], ["", "U+E4F2"], ["-", "-"], ["󾭻", "U+FEB7B"]],
  "↩": ["U+21A9", "leftwards arrow with hook", "21a9", ["", "U+E6DA"], ["", "U+E55D"], ["-", "-"], ["󾮃", "U+FEB83"]],
  "↪": ["U+21AA", "rightwards arrow with hook", "21aa", ["-", "-"], ["", "U+E55C"], ["-", "-"], ["󾮈", "U+FEB88"]],
  "🔃": ["U+1F503", "clockwise downwards and upwards open circle arrows", "1f503", ["", "U+E735"], ["", "U+EB0D"], ["-", "-"], ["󾮑", "U+FEB91"]],
  "🔊": ["U+1F50A", "speaker with three sound waves", "1f50a", ["-", "-"], ["", "U+E511"], ["", "U+E141"], ["󾠡", "U+FE821"]],
  "🔋": ["U+1F50B", "battery", "1f50b", ["-", "-"], ["", "U+E584"], ["-", "-"], ["󾓼", "U+FE4FC"]],
  "🔌": ["U+1F50C", "electric plug", "1f50c", ["-", "-"], ["", "U+E589"], ["-", "-"], ["󾓾", "U+FE4FE"]],
  "🔍": ["U+1F50D", "left-pointing magnifying glass", "1f50d", ["", "U+E6DC"], ["", "U+E518"], ["", "U+E114"], ["󾮅", "U+FEB85"]],
  "🔎": ["U+1F50E", "right-pointing magnifying glass", "1f50e", ["", "U+E6DC"], ["", "U+EB05"], ["", "U+E114"], ["󾮍", "U+FEB8D"]],
  "🔒": ["U+1F512", "lock", "1f512", ["", "U+E6D9"], ["", "U+E51C"], ["", "U+E144"], ["󾮆", "U+FEB86"]],
  "🔓": ["U+1F513", "open lock", "1f513", ["", "U+E6D9"], ["", "U+E51C"], ["", "U+E145"], ["󾮇", "U+FEB87"]],
  "🔏": ["U+1F50F", "lock with ink pen", "1f50f", ["", "U+E6D9"], ["", "U+EB0C"], ["", "U+E144"], ["󾮐", "U+FEB90"]],
  "🔐": ["U+1F510", "closed lock with key", "1f510", ["", "U+E6D9"], ["", "U+EAFC"], ["", "U+E144"], ["󾮊", "U+FEB8A"]],
  "🔑": ["U+1F511", "key", "1f511", ["", "U+E6D9"], ["", "U+E519"], ["", "U+E03F"], ["󾮂", "U+FEB82"]],
  "🔔": ["U+1F514", "bell", "1f514", ["", "U+E713"], ["", "U+E512"], ["", "U+E325"], ["󾓲", "U+FE4F2"]],
  "☑": ["U+2611", "ballot box with check", "2611", ["-", "-"], ["", "U+EB02"], ["-", "-"], ["󾮋", "U+FEB8B"]],
  "🔘": ["U+1F518", "radio button", "1f518", ["-", "-"], ["", "U+EB04"], ["-", "-"], ["󾮌", "U+FEB8C"]],
  "🔖": ["U+1F516", "bookmark", "1f516", ["-", "-"], ["", "U+EB07"], ["-", "-"], ["󾮏", "U+FEB8F"]],
  "🔗": ["U+1F517", "link symbol", "1f517", ["-", "-"], ["", "U+E58A"], ["-", "-"], ["󾭋", "U+FEB4B"]],
  "🔙": ["U+1F519", "back with leftwards arrow above", "1f519", ["-", "-"], ["", "U+EB06"], ["", "U+E235"], ["󾮎", "U+FEB8E"]],
  "🔚": ["U+1F51A", "end with leftwards arrow above", "1f51a", ["", "U+E6B9"], ["-", "-"], ["-", "-"], ["󾀚", "U+FE01A"]],
  "🔛": ["U+1F51B", "on with exclamation mark with left right arrow above", "1f51b", ["", "U+E6B8"], ["-", "-"], ["-", "-"], ["󾀙", "U+FE019"]],
  "🔜": ["U+1F51C", "soon with rightwards arrow above", "1f51c", ["", "U+E6B7"], ["-", "-"], ["-", "-"], ["󾀘", "U+FE018"]],
  "🔝": ["U+1F51D", "top with upwards arrow above", "1f51d", ["-", "-"], ["-", "-"], ["", "U+E24C"], ["󾭂", "U+FEB42"]],
  " ": ["U+2003", "em space", "2003", ["-", "-"], ["", "U+E58C"], ["-", "-"], ["󾭌", "U+FEB4C"]],
  " ": ["U+2002", "en space", "2002", ["-", "-"], ["", "U+E58D"], ["-", "-"], ["󾭍", "U+FEB4D"]],
  " ": ["U+2005", "four-per-em space", "2005", ["-", "-"], ["", "U+E58E"], ["-", "-"], ["󾭎", "U+FEB4E"]],
  "✅": ["U+2705", "white heavy check mark", "2705", ["-", "-"], ["", "U+E55E"], ["-", "-"], ["󾭊", "U+FEB4A"]],
  "✊": ["U+270A", "raised fist", "270a", ["", "U+E693"], ["", "U+EB83"], ["", "U+E010"], ["󾮓", "U+FEB93"]],
  "✋": ["U+270B", "raised hand", "270b", ["", "U+E695"], ["", "U+E5A7"], ["", "U+E012"], ["󾮕", "U+FEB95"]],
  "✌": ["U+270C", "victory hand", "270c", ["", "U+E694"], ["", "U+E5A6"], ["", "U+E011"], ["󾮔", "U+FEB94"]],
  "👊": ["U+1F44A", "fisted hand sign", "1f44a", ["", "U+E6FD"], ["", "U+E4F3"], ["", "U+E00D"], ["󾮖", "U+FEB96"]],
  "👍": ["U+1F44D", "thumbs up sign", "1f44d", ["", "U+E727"], ["", "U+E4F9"], ["", "U+E00E"], ["󾮗", "U+FEB97"]],
  "☝": ["U+261D", "white up pointing index", "261d", ["-", "-"], ["", "U+E4F6"], ["", "U+E00F"], ["󾮘", "U+FEB98"]],
  "👆": ["U+1F446", "white up pointing backhand index", "1f446", ["-", "-"], ["", "U+EA8D"], ["", "U+E22E"], ["󾮙", "U+FEB99"]],
  "👇": ["U+1F447", "white down pointing backhand index", "1f447", ["-", "-"], ["", "U+EA8E"], ["", "U+E22F"], ["󾮚", "U+FEB9A"]],
  "👈": ["U+1F448", "white left pointing backhand index", "1f448", ["-", "-"], ["", "U+E4FF"], ["", "U+E230"], ["󾮛", "U+FEB9B"]],
  "👉": ["U+1F449", "white right pointing backhand index", "1f449", ["-", "-"], ["", "U+E500"], ["", "U+E231"], ["󾮜", "U+FEB9C"]],
  "👋": ["U+1F44B", "waving hand sign", "1f44b", ["", "U+E695"], ["", "U+EAD6"], ["", "U+E41E"], ["󾮝", "U+FEB9D"]],
  "👏": ["U+1F44F", "clapping hands sign", "1f44f", ["-", "-"], ["", "U+EAD3"], ["", "U+E41F"], ["󾮞", "U+FEB9E"]],
  "👌": ["U+1F44C", "ok hand sign", "1f44c", ["", "U+E70B"], ["", "U+EAD4"], ["", "U+E420"], ["󾮟", "U+FEB9F"]],
  "👎": ["U+1F44E", "thumbs down sign", "1f44e", ["", "U+E700"], ["", "U+EAD5"], ["", "U+E421"], ["󾮠", "U+FEBA0"]],
  "👐": ["U+1F450", "open hands sign", "1f450", ["", "U+E695"], ["", "U+EAD6"], ["", "U+E422"], ["󾮡", "U+FEBA1"]]
};


/**
 * Create map keys rexgep, keys sort by key's length desc.
 * 
 * @param {Object} map
 * @return {RegExp}
 */
function _createRegexp(map) {
  var keys = Object.keys(map);
  keys.sort(function (a, b) {
    return b.length - a.length;
  });
  return new RegExp('(' + keys.join('|') + ')', 'g');
}

var EMOJI_RE = null;
/**
 * Convert unified code to HTML.
 * 
 * @param {String} text
 * @return {String} html with emoji classname.
 */
function unifiedToHTML(text) {
  if (!EMOJI_RE) {
    EMOJI_RE = _createRegexp(EMOJI_MAP);
  }
  return text.replace(EMOJI_RE, function (_, m) {
    var em = EMOJI_MAP[m];
    return '<span class="emoji emoji' + em[2] + '" title="' + em[1] + '"></span>';
  });
}
jEmoji.unifiedToHTML = unifiedToHTML;

var EMOJI_DOCOMO_MAP = {};
var EMOJI_KDDI_MAP = {};
var EMOJI_SOFTBANK_MAP = {};
var EMOJI_GOOGLE_MAP = {};
var _maps = [EMOJI_DOCOMO_MAP, EMOJI_KDDI_MAP, EMOJI_SOFTBANK_MAP, EMOJI_GOOGLE_MAP];
for (var k in EMOJI_MAP) {
  var em = EMOJI_MAP[k];
  for (var i = 0; i < _maps.length; i++) {
    var index = i + 3;
    var code = em[index][0];
    var map = _maps[i];
    if (code === '-' || map[code]) { // use first code
      continue;
    }
    map[code] = k;
  }
}

var EMOJI_DOCOMO_RE = null;
/**
 * Convert DoCoMo code to Unified code.
 *
 * @param {String} text
 * @return {String}
 */
function docomoToUnified(text) {
  if (!EMOJI_DOCOMO_RE) {
    EMOJI_DOCOMO_RE = _createRegexp(EMOJI_DOCOMO_MAP);
  }
  return text.replace(EMOJI_DOCOMO_RE, function (_, m) {
    return EMOJI_DOCOMO_MAP[m];
  });
}
jEmoji.docomoToUnified = docomoToUnified;

var EMOJI_KDDI_RE = null;
/**
 * Convert KDDI code to Unified code.
 *
 * @param {String} text
 * @return {String}
 */
function kddiToUnified(text) {
  if (!EMOJI_KDDI_RE) {
    EMOJI_KDDI_RE = _createRegexp(EMOJI_KDDI_MAP);
  }
  return text.replace(EMOJI_KDDI_RE, function (_, m) {
    return EMOJI_KDDI_MAP[m];
  });
}
jEmoji.kddiToUnified = kddiToUnified;

var EMOJI_SOFTBANK_RE = null;
/**
 * Convert SoftBank code to Unified code.
 *
 * @param {String} text
 * @return {String}
 */
function softbankToUnified(text) {
  if (!EMOJI_SOFTBANK_RE) {
    EMOJI_SOFTBANK_RE = _createRegexp(EMOJI_SOFTBANK_MAP);
  }
  return text.replace(EMOJI_SOFTBANK_RE, function (_, m) {
    return EMOJI_SOFTBANK_MAP[m];
  });
}
jEmoji.softbankToUnified = softbankToUnified;

var EMOJI_GOOGLE_RE = null;
/**
 * Convert Google code to Unified code.
 *
 * @param {String} text
 * @return {String}
 */
function googleToUnified(text) {
  if (!EMOJI_GOOGLE_RE) {
    EMOJI_GOOGLE_RE = _createRegexp(EMOJI_GOOGLE_MAP);
  }
  return text.replace(EMOJI_GOOGLE_RE, function (_, m) {
    return EMOJI_GOOGLE_MAP[m];
  });
}
jEmoji.googleToUnified = googleToUnified;

})();
});

require.define("/lib/weibo_util.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * 新浪微博mid与url互转实用工具
 * 作者: XiNGRZ (http://weibo.com/xingrz)
 */

var WeiboUtil = module.exports = {
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
});

require.define("/lib/tqq.js",function(require,module,exports,__dirname,__filename,process,global){/*!
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

    home_timeline:        '/statuses/home_timeline',
    mentions:             '/statuses/mentions_timeline',
    comments_timeline:    '/statuses/mentions_timeline',
    comments_mentions:    '/statuses/mentions_timeline',
    
    repost_timeline:      '/t/re_list',

    followers:            '/friends/user_fanslist',
    friends:              '/friends/user_idollist',
    favorites:            '/fav/list_t',
    favorites_create:     '/fav/addt',
    favorites_destroy:    '/fav/delt',
    count:                '/t/re_count', //仅仅是转播数
    show:                 '/t/show',
    update:               '/t/add',
    upload:               '/t/add_pic',
    repost:               '/t/re_add',
    comment_create:       '/t/comment',
    comment_reply:        '/t/comment',
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
    
    gender_map: {0: 'n', 1: 'm', 2: 'f'},

    // support apis
    support_comment_destroy: false,
    support_comments_mentions: false,
    support_comments_to_me: false,
    support_comments_by_me: false,
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
  } else if (!data.data && data.msg && data.msg !== 'ok') {
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
  return data.info;
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
  if (data.user) {
    result.users = data.user;
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
  throw new Error('Must override this method.');
};

TQQAPI.prototype.format_emotion = function (emotion, args) {
  throw new Error('Must override this method.');
};

/**
 * Params converters
 */

TQQAPI.prototype.convert_comment = function (comment) {
  // http://wiki.open.t.qq.com/index.php/%E5%BE%AE%E5%8D%9A%E7%9B%B8%E5%85%B3/%E7%82%B9%E8%AF%84%E4%B8%80%E6%9D%A1%E5%BE%AE%E5%8D%9A
  var data = {
    content: comment.comment,
    reid: comment.id
  };
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
    // data.lastid = cursor.sina_id;
  } else {
    // top page
    data.pageflag = '0';
    data.pagetime = '0';
    data.lastid = '0';
  }
  if (typeof cursor.callback === 'function') {
    data = cursor.callback(data);
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


});

require.define("/lib/weibo.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - lib/weibo.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBaseOauthV2 = require('./tbase_oauth_v2');
var inherits = require('util').inherits;
var utils = require('./utils');
var weiboutil = require('./weibo_util');


function WeiboAPI(options) {
  WeiboAPI.super_.call(this);

  var config = utils.extend({}, options, {
    host:                 'https://api.weibo.com/2',
    user_home_url:        'http://weibo.com/n/',
    search_url:           'http://s.weibo.com/weibo/',

    oauth_host:           'https://api.weibo.com/oauth2',
    oauth_authorize:      '/authorize',
    oauth_access_token:   '/access_token',
    verify_credentials:   '/users/show',

    comments:             '/comments/show',
    comment_create:       '/comments/create',
    comment_reply:        '/comments/reply',
    comment_destroy:      '/comments/destroy',

    support_search: false,
  });

  this.init(config);
}

inherits(WeiboAPI, TBaseOauthV2);
module.exports = WeiboAPI;

/**
 * Result getters
 */

WeiboAPI.prototype.get_result_items = function (data, playload, args) {
  return data.statuses || data.comments || data.reposts || data.messages || data;
};

/**
 * Result formatters
 */

WeiboAPI.prototype.format_search_status = function (status, args) {
  return status;
};

WeiboAPI.prototype.format_status = function (status, args) {
  status.id = status.idstr;
  status.created_at = new Date(status.created_at);
  if (status.user) {
    status.user = this.format_user(status.user, args);
    status.t_url = 'http://weibo.com/' + status.user.id + '/' + weiboutil.mid2url(status.mid);
  }

  // geo: { type: 'Point', coordinates: [ 22.354231, 113.421234 ] } latitude, longitude
  if (status.geo && status.geo.type === 'Point' && status.geo.coordinates) {
    var geo = {
      latitude: String(status.geo.coordinates[0]),
      longitude: String(status.geo.coordinates[1]),
    };
    status.geo = geo;
  }

  if (status.retweeted_status) {
    status.retweeted_status = this.format_status(status.retweeted_status, args);
    if (!status.retweeted_status.t_url) {
      status.retweeted_status.t_url =
        'http://weibo.com/' + status.user.id + '/' + weiboutil.mid2url(status.retweeted_status.mid);
    }
  }
  return status;
};

WeiboAPI.prototype.format_user = function (user, args) {
  user.id = user.idstr;
  user.created_at = new Date(user.created_at);
  user.t_url = 'http://weibo.com/' + (user.domain || user.id);
  if (user.status) {
    user.status = this.format_status(user.status, args);
    if (!user.status.t_url) {
      user.status.t_url = user.t_url + '/' + weiboutil.mid2url(user.status.mid || user.status.id);
    }
  }
  return user;
};

WeiboAPI.prototype.format_comment = function (comment, args) {
  comment.id = comment.idstr;
  comment.created_at = new Date(comment.created_at);
  if (comment.user) {
    comment.user = this.format_user(comment.user, args);
  }
  if (comment.status) {
    comment.status = this.format_status(comment.status, args);
  }
  if (comment.reply_comment) {
    comment.reply_comment = this.format_comment(comment.reply_comment, args);
  }
  return comment;
};

WeiboAPI.prototype.format_message = function (message, args) {
  return message;
};

WeiboAPI.prototype.format_emotion = function (emotion, args) {
  return emotion;
};

WeiboAPI.prototype.format_count = function (count, args) {
  count.id = String(count.id);
  return count;
};

/**
 * User
 */

WeiboAPI.prototype.verify_credentials = function (user, callback) {
  var uid = user.uid || user.id;
  return this.user_show(user, uid, null, callback);
};


});

require.define("/lib/tbase_oauth_v2.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - lib/tbase_oauth_v2.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBase = require('./tbase');
var inherits = require('util').inherits;
var utils = require('./utils');
var querystring = require('querystring');

/**
 * TAPI Base class, support OAuth v2.0
 */
function TBaseOauthV2() {
  TBaseOauthV2.super_.call(this);
  this.config.oauth_version = '2.0';
}

inherits(TBaseOauthV2, TBase);
module.exports = TBaseOauthV2;

/**
 * Result formatters
 */

TBaseOauthV2.prototype.format_access_token = function (token) {
  token = JSON.parse(token);
  return token;
};

/**
 * OAuth
 */

TBaseOauthV2.prototype.convert_token = function (user) {
  var params = {
    redirect_uri: user.oauth_callback || this.config.oauth_callback,
    client_id: this.config.appkey,
    response_type: 'code',
  };
  var oauth_scope = user.oauth_scope || this.config.oauth_scope;
  if (oauth_scope) {
    params.oauth_scope = oauth_scope;
  }
  if (user.state) {
    // An unguessable random string. It is used to protect against cross-site request forgery attacks.
    params.state = user.state;
  }
  return params;
};

TBaseOauthV2.prototype.get_authorization_url = function (user, callback) {
  var data = this.convert_token(user);
  data.response_type = 'code';
  var info = {
    blogtype: user.blogtype,
    auth_url: this.format_authorization_url(data)
  };
  process.nextTick(function () {
    callback(null, info);
  });
  return this;
};

TBaseOauthV2.prototype.get_access_token = function (user, callback) {
  var params = {
    type: 'POST',
    user: user,
    playload: 'string',
    api_host: this.config.oauth_host,
    request_method: 'get_access_token'
  };
  var data = this.convert_token(user);
  data.grant_type = 'authorization_code';
  data.client_secret = this.config.secret;
  var code = user.code || user.oauth_verifier || user.oauth_pin;
  if (code) {
    data.code = code;
  }

  params.data = data;
  var self = this;
  var url = self.config.oauth_access_token;
  self.send_request(url, params, function (err, token) {
    if (err) {
      return callback(err);
    }
    // { access_token: '2.00EkofzBtMpzNBb9bc3108d8MwDTTE',
    // remind_in: '633971',
    // expires_in: 633971,
    // uid: '1827455832' }
    token = self.format_access_token(token);
    if (!token.access_token) {
      var message = token.error || JSON.stringify(token);
      err = new Error(message);
      err.data = token;
      err.name = self.errorname('get_access_token');
      return callback(err);
    }
    token.blogtype = user.blogtype;
    callback(null, token);
  });
  return this;
};

TBaseOauthV2.prototype.apply_auth = function (url, args, user) {
  args.data = args.data || {};
  args.data.access_token = user.access_token;
};


});

require.define("/lib/github.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * node-weibo - lib/github.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var TBaseOauthV2 = require('./tbase_oauth_v2');
var inherits = require('util').inherits;
var TSinaAPI = require('./tsina');
var utils = require('./utils');
var querystring = require('querystring');


function GithubAPI(options) {
  GithubAPI.super_.call(this);
   var config = utils.extend({}, options, {
    host: 'https://api.github.com',
    result_format: '',
    oauth_key: '',
    oauth_secret: '',
    oauth_host: 'https://github.com',
    oauth_authorize: '/login/oauth/authorize',
    oauth_access_token: '/login/oauth/access_token',
        
    verify_credentials: '/user',
    user_show: '/users/{{uid}}',
  });
  this.init(config);
}

inherits(GithubAPI, TBaseOauthV2);
module.exports = GithubAPI;

/**
 * Utils methods
 */

GithubAPI.prototype.url_encode = function (text) {
  return text;
};

/**
 * OAuth
 */

GithubAPI.prototype.convert_token = function (user) {
  var data = GithubAPI.super_.prototype.convert_token.call(this, user);
  data.state = Date.now();
  return data;
};

/**
 * Result formatters
 */

GithubAPI.prototype.format_access_token = function (token) {
  token = querystring.parse(token);
  return token;
};

/**
 *
{ 
  public_repos: 67,
  following: 84,
  created_at: '2009-11-21T08:07:35Z',
  type: 'User',
  email: 'fengmk2@gmail.com',
  bio: 'nodejs',
  blog: 'http://fengmk2.github.com',
  location: 'Hangzhou, China',
  gravatar_id: '95b9d41231617a05ced5604d242c9670',
  avatar_url: 'https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png',
  public_gists: 21,
  followers: 293,
  login: 'fengmk2',
  name: 'fengmk2',
  company: 'http://www.taobao.com/',
  id: 156269,
  html_url: 'https://github.com/fengmk2',
  hireable: false,
  url: 'https://api.github.com/users/fengmk2'
}
 */
GithubAPI.prototype.format_user = function (data) {
  var user = {
    id: data.login,
    t_url: data.html_url,
    screen_name: data.name,
    name: data.login,
    location: data.location,
    url: data.blog || data.url,
    profile_image_url: data.avatar_url + '&s=50',
    avatar_large: data.avatar_url + '&s=180',
    gender: 'n',
    following: false,
    verified: false,
    follow_me: false,
    followers_count: data.followers,
    friends_count: data.following,
    statuses_count: data.public_repos,
    favourites_count: 0,
    created_at: new Date(data.created_at),
    email: data.email,
  };
  return user;
};



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

function getAuthCallback(options) {
  return options.homeUrl + options.callbackPath;
}

function login(req, res, next, options) {
  var blogtypeField = options.blogtypeField;
  var blogtype = req.query[blogtypeField];
  var referer = getReferer(req, options);
  if (!options.homeUrl) {
    options.homeUrl = 'http://' + req.headers.host;
  }
  var authCallback = getAuthCallback(options);
  var user = {
    blogtype: blogtype,
    oauth_callback: authCallback
  };
  tapi.get_authorization_url(user, function (err, authInfo) {
    if (err) {
      return next(err);
    }
    authInfo.blogtype = blogtype;
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
  var oauthInfo = req.session.oauthInfo || {};
  var blogtype = req.query[options.blogtypeField] || oauthInfo.blogtype;
  req.session.oauthInfo = null;
  var token = req.query;
  token.blogtype = blogtype;
  token.oauth_callback = getAuthCallback(options);
  if (oauthInfo.oauth_token_secret) {
    token.oauth_token_secret = oauthInfo.oauth_token_secret;
  }
  var referer = oauthInfo.referer;
  tapi.get_access_token(token, function (err, accessToken) {
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
 *    connect.cookieParser('I\'m cookie secret.'),
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

require.define("/examples/browser/entry.js",function(require,module,exports,__dirname,__filename,process,global){var weibo = require('../../');

// change appkey to yours
var appkey = 'your appkey';
var secret = 'your app secret';
var oauth_callback_url = 'your callback url';
weibo.init('weibo', appkey, secret, oauth_callback_url);

var user = { blogtype: 'weibo' };
var cursor = {count: 20};
weibo.public_timeline(user, cursor, function (err, statuses) {
  if (err) {
    console.error(err);
  } else {
    console.log(statuses);
  }
});
});
require("/examples/browser/entry.js");
})();
