/**
 * only use in browser envirment
 * 
 * MUST use the namespace: `weibo`
 *  e.g: 
 *  
 *    weibo.TAPI.init(key, sceret);
 * 
 * deal with javascript script loading
 */

(function () {

var root = this;
var weibo = root.weibo = {};

weibo._requires = [
  'lib/sha1.js',
  'lib/base64.js',
  'lib/utils.js',
  'lib/oauth.js',
  'lib/urllib.js',
  'lib/tsina.js',
  // 'lib/twitter.js',
  // 'lib/tqq.js',
  'lib/tapi.js'
];

weibo.load = function (url_prefix) {
  if (url_prefix[url_prefix.length - 1] != '/') {
    url_prefix += '/';
  }
  for (var i = 0, len = weibo._requires.length; i < len; i++) {
    var src = url_prefix + weibo._requires[i];
    document.write('<script type="text/javascript" src="' + src + '"></script>'); 
  }
};

})();