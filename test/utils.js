/*!
 * node-weibo - utils test.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../lib/utils');
var qs = require('querystring');
var sha1 = require('../lib/sha1');


describe('utils.js', function () {

  describe('utils.querystring.parse()', function () {

    it('should parse success', function () {
      var params = {
        key: '密码',
        name: '名称name==??==',
        password: '**!@#!@????123124',
        '中文key哈哈': 'Chinese key'
      };
      var qstring = qs.stringify(params);
      var to = utils.querystring.parse(qstring);
      to.should.have.keys(Object.keys(params));
      for (var k in to) {
        to[k].should.equal(params[k]);
      }
    });
  });

  describe('utils.base64HmacSha1()', function () {
    it('should create a sha1 hash', function () {
      var words = [
        '中文sdfjlsdfjslf', 'foo', '哈红十渡地方级无法技术类j哦w法'
      ];
      words.forEach(function (word) {
        utils.base64HmacSha1(word, word + 'key').should.equal(sha1.b64_hmac_sha1(word + 'key', word));
      });
    });
  });

});