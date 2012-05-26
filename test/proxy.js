var http = require('http');
var urlparse = require('url').parse;

http.createServer(function (req, res) {
  var url = urlparse(req.url, true).query.url;
  if (!url) {
    return res.end(req.method + ': ' + req.url);
  }
  var target = urlparse(url);
  var headers = {};
  for (var k in req.headers) {
    if (k === 'host' || k === 'connection') {
      continue;
    }
    headers[k] = req.headers[k];
  }
  var options = {
    host: target.hostname,
    port: target.port || 80,
    path: target.path,
    method: req.method,
    headers: headers
  };

  var proxyReq = http.request(options, function (response) {
    res.writeHead(response.statusCode, response.headers);
    response.on('data', function (chunk) {
      res.write(chunk);
    });
    response.on('end', function () {
      res.end();
    });
  });

  proxyReq.on('error', function (err) {
    proxyReq.abort();
    res.writeHead(500);
    res.end(req.query.url + ' error: ' + err.message);
  });

  req.on('data', function (chunk) {
    // console.log('data', chunk.toString());
    proxyReq.write(chunk);
  });
  req.on('end', function () {
    proxyReq.end();
  });
}).listen(37456);