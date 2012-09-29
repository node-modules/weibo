var weibo = require('../../');
var domready = require('domready');

domready(function () {
  var blogtypes = [
    'weibo', 'tqq', 'github', 'twitter'
  ];
  var $console = $('#console');
  var html = $console.html();
  for (var i = 0; i < blogtypes.length; i++) {
    var blogtype = blogtypes[i];
    var api = weibo.TYPES[blogtype];
    if (!api) {
      html += '<li style="color: red;">' + blogtype + ' error.</li>';
    } else {
      html += '<li style="color: green;">' + blogtype + ' success.</li>';
    }
  }
  $console.html(html);
});