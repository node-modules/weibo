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
var TQQAPI = require(libpath + '/tqq');

describe('tqq_text_process.js', function () {

  var tqq = new TQQAPI();

  describe('process_at()', function () {

    it('should handle process tqq at user', function () {

      var users = {
        'Foreverdream-sky': '唯美-English',
        'I-Capricorn': '摩羯-座丶心理',
        QQphoto: '腾讯图片',
        'i-loveangel': '天使爱丶美丽',
        i1ii18: '海绵宝宝精选',
        iamtiejianxia: '铁肩侠',
        kds: '',
        lanjingr: '爱美女潮这看',
        linyiwangren: '临沂网',
        meilishuo: '美丽说',
        mijiuClub: '米九',
        qlwbyw: '齐鲁晚报',
        sdTeChan: '爆笑女神',
        sdnews: '鲁网',
        tjTeChan: '弗洛伊德行为心理学',
        v5boos: '幸福心理学',
        vip445: '热门搞笑排行榜',
        vip489: '搞笑排行榜',
        wesc: '四川微新闻',
        yumcea: '狮子座专属'
      };
      var cases = [
        ['@Foreverdream-sky', '<a class="at_user_link" href="http://t.qq.com/Foreverdream-sky" data-uid="Foreverdream-sky">@唯美-English(@Foreverdream-sky)</a>'],
        ['@mk2', '<a class="at_user_link" href="http://t.qq.com/mk2" data-uid="mk2">@mk2</a>'],
        ['你好@Foreverdream-sky 我是@vip489', 
         '你好<a class="at_user_link" href="http://t.qq.com/Foreverdream-sky" data-uid="Foreverdream-sky">@唯美-English(@Foreverdream-sky)</a> 我是<a class="at_user_link" href="http://t.qq.com/vip489" data-uid="vip489">@搞笑排行榜(@vip489)</a>'],
        ['#@Foreverdream-sky', '#<a class="at_user_link" href="http://t.qq.com/Foreverdream-sky" data-uid="Foreverdream-sky">@唯美-English(@Foreverdream-sky)</a>'],
      ];
      cases.forEach(function (item) {
        tqq.process_at(item[0], users).should.equal(item[1]);
      });
    });

  });

  describe('process_search()', function () {

    xit('should convert #hash tag# to search url', function () {
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

    xit('should process url, @user, #hash#', function () {
      var cases = [
        ['http://t.cn/zlcThPG @user#沪js#', '<a target="_blank" class="link" href="http://t.cn/zlcThPG">http://t.cn/zlcThPG</a> <a class="at-user-link" href="http://weibo.com/n/user">@user</a><a target="_blank" href="http://s.weibo.com/weibo/%E6%B2%AAjs" title="Search #沪js#">#沪js#</a>'],
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

});
