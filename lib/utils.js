/*!
 * node-weibo - lib/utils.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var STRING_FORMAT_REGEX = exports.STRING_FORMAT_REGEX = /\{\{([\w\s\.\'\"\(\),-\[\]]+)?\}\}/g;

/**
 * 格式化字符串
 * eg:
 *  '{0}天有{1}个小时'.format([1, 24]) 
 *  or
 *  '{{day}}天有{{hour}}个小时'.format({day:1, hour:24}})
 * @param {Object} values
 */

 /**
  * Simple string template helper.
  * 
  * @param {String} s, template string
  * @param {Object|Function} values, template values or match callback.
  * @return {String}
  */
exports.format = function (s, values) {
  var cb;
  if (typeof values === 'function') {
    cb = values;
  } else {
    cb = function (match, key) {
      try {
        return values[key] || eval('(values.' + key + ')');
      } catch (e) {
        console.log(JSON.stringify([s, values, key]));
        // return s;
        throw e;
      }
    };
  }
  return s.replace(STRING_FORMAT_REGEX, cb);
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

function getChromeVersion() {
  var m = /Chrome\/(\d+)/i.exec(window.navigator.userAgent);
  if (m) {
    return m[1];
  }
  return;
}
exports.getChromeVersion = getChromeVersion;

function buildBlob(parts) {
  var blob = null;
  var version = parseInt(getChromeVersion() || 0, 10);
  // https://developer.mozilla.org/en/DOM/Blob
  // Chrome 20+ support Blob() constructor
  if (version >= 20) {
    blob = new window.Blob(parts);
  } else {
    if (typeof window.BlobBuilder === 'undefined') {
      window.BlobBuilder = window.WebKitBlobBuilder;
    }
    var bb = new window.BlobBuilder();
    for (var i = 0; i < parts.length; i++) {
      bb.append(parts[i]);
    }
    blob = bb.getBlob();
  }
  return blob;
}
exports.buildBlob = buildBlob;

exports.xhrProvider = function (onprogress) {
  return function () {
    var xhr = jQuery.ajaxSettings.xhr();
    if (onprogress && xhr.upload) {
      xhr.upload.addEventListener('progress', onprogress, false);
    }
    return xhr;
  };
};

exports.build_upload_params = function (data, pic) {
  pic.keyname = pic.keyname || 'file';
  var boundary = '----multipartformboundary' + Date.now();
  var dashdash = '--';
  var crlf = '\r\n';

  /* Build RFC2388 string. */
  var builder = '';

  builder += dashdash;
  builder += boundary;
  builder += crlf;
  
  for (var key in data) {
    var value = encodeURIComponent(data[key]);
    /* Generate headers. key */            
    builder += 'Content-Disposition: form-data; name="' + key + '"';
    builder += crlf;
    builder += crlf; 
     /* Append form data. */
    builder += value;
    builder += crlf;
    
    /* Write boundary. */
    builder += dashdash;
    builder += boundary;
    builder += crlf;
  }
  /* Generate headers. [PIC] */            
  builder += 'Content-Disposition: form-data; name="' + pic.keyname + '"';
  var filename = pic.fileName || pic.name;
  if (filename) {
    builder += '; filename="' + filename + '"';
  }
  builder += crlf;
  var contentType = pic.fileType || pic.type;
  builder += 'Content-Type: '+ contentType;
  builder += crlf;
  builder += crlf;
  var parts = [];
  parts.push(builder);
  parts.push(pic);
  
  builder = crlf;
  /* Mark end of the request.*/ 
  builder += dashdash;
  builder += boundary;
  builder += dashdash;
  builder += crlf;
  parts.push(builder);

  var blob = buildBlob(parts);
  blob.contentType = 'multipart/form-data; boundary=' + boundary;
  return blob;
};
