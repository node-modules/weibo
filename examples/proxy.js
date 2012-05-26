var httpProxy = require('http-proxy');
var urlparse = require('url').parse;

//
// Http Proxy
//
httpProxy.createServer(function (req, res, proxy) {
  var buffer = httpProxy.buffer(req);
  var url = urlparse(req.url, true).query.url;
  if (!url) {
    return res.end();
  }
  var info = urlparse(url);
  req.url = info.url;
  proxy.proxyRequest(req, res, {
    port: info.port || 80,
    host: info.hostname,
    buffer: buffer
  });
}).listen(8002);
