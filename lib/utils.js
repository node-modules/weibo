/**
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