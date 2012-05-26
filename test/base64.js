/**
 * Module dependencies.
 */

var libpath = process.env.WEIBO_COV ? '../lib-cov' : '../lib';
var base64 = require(libpath + '/base64');

describe('base64.js', function () {

  var cases = [ 
    'foo', 
    '哈哈1239！@＃！@¥！¥！@¥！@＃！¥ 中文字幕',
    '哦w额u热wrjlw而wljr哦wj萨fhlsfjs我是的哦啊呸留学生；蓄势待发哦w二坡第五大文排版',
    'XX你好啊！dawa\';:\"/?.>？》！@＃！¥％⋯⋯—＊（}{"'
  ];

  it('should encode right', function () {
    cases.forEach(function (word) {
      base64.encode(word).should.equal(new Buffer(word).toString('base64'));
    });
  });

  it('should decode right', function () {
    cases.forEach(function (word) {
      new Buffer(base64.encode(word), 'base64').toString().should.equal(word);
    });
  });

});

