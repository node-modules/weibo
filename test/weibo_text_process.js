/*!
 * node-weibo - test/weibo_text_process.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var libpath = process.env.WEIBO_COV ? '../lib-cov' : '../lib';
var WeiboAPI = require(libpath + '/weibo');
var weibo = require(libpath + '/tapi');

describe('weibo_text_process.js', function () {

  var weiboapi = new WeiboAPI();

  describe('process_at()', function () {

    it('should handle no-acsii correct', function () {
      var cases = [
        ['【观点·@任志强】今年提出的1000万套的保障房任务可能根本完不成', 
         '【观点·<a class="at_user_link" href="http://weibo.com/n/%E4%BB%BB%E5%BF%97%E5%BC%BA">@任志强</a>】今年提出的1000万套的保障房任务可能根本完不成'],
        ['abc@foo@bar....!@#$', 
         'abc<a class="at_user_link" href="http://weibo.com/n/foo">@foo</a><a class="at_user_link" href="http://weibo.com/n/bar">@bar</a>....!@#$'],
      ];
      cases.forEach(function (item) {
        weiboapi.process_at(item[0]).should.equal(item[1]);
      });
    });

  });

  describe('process_search()', function () {

    it('should convert #hash tag# to search url', function () {
      var cases = [
        ['#沪js#', '<a target="_blank" href="http://s.weibo.com/weibo/%E6%B2%AAjs" title="Search #沪js#">#沪js#</a>'],
        ['#沪js##123#', '<a target="_blank" href="http://s.weibo.com/weibo/%E6%B2%AAjs" title="Search #沪js#">#沪js#</a><a target="_blank" href="http://s.weibo.com/weibo/123" title="Search #123#">#123#</a>'],
        ['#foo bar 123#123123', '<a target="_blank" href="http://s.weibo.com/weibo/foo%20bar%20123" title="Search #foo bar 123#">#foo bar 123#</a>123123'],
      ];
      cases.forEach(function (item) {
        weiboapi.process_search(item[0]).should.equal(item[1]);
      });
    });

  });

  describe('process_text()', function () {

    it('should process url, @user, #hash#', function () {
      var cases = [
        ['http://t.cn/zlcThPG @user#沪js#', '<a target="_blank" class="link" href="http://t.cn/zlcThPG">http://t.cn/zlcThPG</a> <a class="at_user_link" href="http://weibo.com/n/user">@user</a><a target="_blank" href="http://s.weibo.com/weibo/%E6%B2%AAjs" title="Search #沪js#">#沪js#</a>'],
        ['#沪js##123#www.baidu.com', '<a target="_blank" href="http://s.weibo.com/weibo/%E6%B2%AAjs" title="Search #沪js#">#沪js#</a><a target="_blank" href="http://s.weibo.com/weibo/123" title="Search #123#">#123#</a><a target="_blank" class="link" href="http://www.baidu.com">www.baidu.com</a>'],
        ['#foo bar 123#123123', '<a target="_blank" href="http://s.weibo.com/weibo/foo%20bar%20123" title="Search #foo bar 123#">#foo bar 123#</a>123123'],
        ['', '&nbsp;'],
        [null, '&nbsp;'],
        [undefined, '&nbsp;'],
      ];
      cases.forEach(function (item) {
        weibo.process_text({blogtype: 'weibo'}, {text: item[0]}).should.equal(item[1]);
      });
    });

  });

  describe('process_emotional()', function () {
    it('should show emotionurl', function () {

      var cases = [
        ["[ok]", '<img title="[ok]" src="http://timg.sjs.sinajs.cn/t35/style/images/common/face/ext/normal/d6/ok_org.gif" />'],
        ["[呵呵]", '<img title="[呵呵]" src="http://timg.sjs.sinajs.cn/t35/style/images/common/face/ext/normal/ac/smilea_org.gif" />'],
        ['[哼]', '<img title="[哼]" src="http://timg.sjs.sinajs.cn/t35/style/images/common/face/ext/normal/49/hatea_org.gif" />'],
      ];

      cases.forEach(function (item) {
        weibo.process_text({blogtype: 'weibo'}, {text: item[0]}).should.equal(item[1]);
      });

    });
  });
  


});
