var tapi = require('../node-weibo').tapi;
var appkey = '3434422667', secret = '523f2d0d134bfd5aa138f9e5af828bf9';
tapi.init('tsina', appkey, secret);
tapi.public_timeline({}, function(error, data, response) {
    if(error) {
        console.error(error);
    } else {
        console.log(data);
    }
});