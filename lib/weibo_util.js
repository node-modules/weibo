/**
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