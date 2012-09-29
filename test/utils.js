/*!
 * node-weibo - utils test.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var libpath = process.env.WEIBO_COV ? '../lib-cov' : '../lib';
var utils = require(libpath + '/utils');
var qs = require('querystring');
var sha1 = require(libpath + '/sha1');


describe('utils.js', function () {

  describe('String.format()', function () {
    it('should format success', function () {
      '{{hello}}, {{foo}}!!!'.format({
        hello: '你好',
        foo: 'foolish',
        bar: 'bar'
      }).should.equal('你好, foolish!!!');
    });
  });

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

    it('should parse empty', function () {
      Object.keys(utils.querystring.parse()).should.length(0);
      Object.keys(utils.querystring.parse('')).should.length(0);
      Object.keys(utils.querystring.parse('   ')).should.length(0);
      Object.keys(utils.querystring.parse(null)).should.length(0);
      Object.keys(utils.querystring.parse('abc')).should.length(0);
      Object.keys(utils.querystring.parse('=abc')).should.length(0);
    });

  });

  describe('utils.querystring.stringify()', function () {

    it('should stringify success', function () {
      var params = {
        key: '密码',
        name: '名称name==??==',
        password: '**!@#!@????123124',
        '中文key哈哈': 'Chinese key'
      };
      var decode = utils.querystring.stringify(params);
      decode = qs.parse(decode);
      decode.should.have.keys(Object.keys(params));
      for (var k in decode) {
        decode[k].should.equal(params[k]);
      }
    });
  });

  describe('utils.urljoin()', function () {
    it('should work', function () {
      utils.urljoin('http://foo').should.equal('http://foo');
      utils.urljoin('http://foo', {}).should.equal('http://foo');
      utils.urljoin('http://foo', { bar: 'bar2' }).should.equal('http://foo?bar=bar2');
      utils.urljoin('http://foo?', { bar: 'bar2' }).should.equal('http://foo?&bar=bar2');
      utils.urljoin('http://foo?f1=f2', { bar: 'bar2' }).should.equal('http://foo?f1=f2&bar=bar2');
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

    it('should base64 right', function () {
      var bs = 'POST&http%3A%2F%2Fapi.t.sina.com.cn%2Fstatuses%2Frepost.json&id%3D3449709785616243%26oauth_consumer_key%3D4010445928%26oauth_nonce%3D8IuoWgcM2t5QH0xf3DvLlghIgr5pPWnW%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1338066480%26oauth_token%3Dd1ef5fa9aa9fee08fdc6267193a59d6a%26oauth_version%3D1.0%26source%3D4010445928%26status%3D%252525E8%252525BF%25252599%252525E6%25252598%252525AF%252525E6%252525B5%2525258B%252525E8%252525AF%25252595%252525E8%252525BD%252525AC%252525E5%2525258F%25252591%252525E5%252525BE%252525AE%252525E5%2525258D%2525259Arespost%2528%2529%252525EF%252525BC%2525258C%252525E6%2525259D%252525A5%252525E8%25252587%252525AA%252525E5%2525258D%25252595%252525E5%25252585%25252583%252525E6%252525B5%2525258B%252525E8%252525AF%25252595%25252520tapi.test.js%25252520at%25252520Sun%25252520May%2525252027%252525202012%2525252005%2525253A08%2525253A00%25252520GMT%2525252B0800%25252520%2528CST%2529%25252520%2525257C%2525257C%25252520%252525E6%2525258C%25252589%252525E9%25252581%25252593%252525E7%25252590%25252586%252525E6%25252598%252525AF%252525E4%252525B8%2525258D%252525E4%252525BC%2525259A%252525E5%25252587%252525BA%252525E7%2525258E%252525B0%252525E7%2525259A%25252584%252525EF%252525BC%2525258C%252525E5%252525A6%25252582%252525E6%2525259E%2525259C%252525E5%25252587%252525BA%252525E7%2525258E%252525B0%252525E4%252525BA%25252586%252525EF%252525BC%2525258C%252525E5%252525B0%252525B1%252525E6%25252598%252525AF%252525E5%2525258D%25252595%252525E5%25252585%25252583%252525E6%252525B5%2525258B%252525E8%252525AF%25252595%252525E4%252525B8%2525258D%252525E9%25252580%2525259A%252525E8%252525BF%25252587%252525E4%252525BA%25252586%252525E3%25252580%25252582';
      var key = 'd119f62bfb70a4ba8d9b68bf14d6e45a&798722589f339cc4e9e0a66a9b53f693';
      var hash = 'ZM+ttA9KMRSl+XfT9CJrMfnRf14=';
      utils.base64HmacSha1(bs, key).should.equal(hash);
      require('../lib/sha1').b64_hmac_sha1(key, bs).should.equal(hash);
    });
  });

  describe('mimeLookup()', function () {
    var cases = [
      ['', 'application/octet-stream'],
      ['image.jpg2', 'application/octet-stream'],
      ['image', 'application/octet-stream'],
      ['image哈哈', 'application/octet-stream'],
      ['jpg', 'image/jpeg'],
      ['image.jpg', 'image/jpeg'],
      ['中文.jpg', 'image/jpeg'],
      ['/a/b/c/d/image.jpg', 'image/jpeg'],
      ['../../../../../image.jpg', 'image/jpeg'],
      ['jpeg', 'image/jpeg'],
      ['gif', 'image/gif'],
      ['png', 'image/png'],
      ['bmp', 'image/bmp'],
    ];
    cases.forEach(function (item) {
      utils.mimeLookup(item[0]).should.equal(item[1]);
    });
  });

});