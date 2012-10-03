
var Base64 = require('./base64');
var utils = require('./utils');

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

