/*!
 * node-weibo - test/tapi.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var tapi = process.env.WEIBO_COV ? require('../lib-cov/tapi') : require('../lib/tapi');
var should = require('should');
var users = require('./config').users;
var check = require('./utils/check');
var fs = require('fs');
var path = require('path');

var types = Object.keys(users);
types.forEach(function (blogtype) {

var userIDs = {
  tqq: {id: 'fengmk2', screen_name: 'Python发烧友'},
  weibo: {id: '1640328892', screen_name: 'Python发烧友'},
  github: {id: 'fengmk2', screen_name: 'fengmk2'},
};

describe('tapi.js ' + blogtype + ' API', function () {
  var currentUser = users[blogtype];

  describe('api_dispatch()', function () {
    it('should return right type api', function () {
      var user = { blogtype: blogtype };
      var api = tapi.api_dispatch(user);
      api.should.an.instanceof(tapi.TYPES[blogtype]);
    });
  });

  describe('get_authorization_url()', function () {

    it('should return login url and request token', function (done) {
      var api = tapi.get_authorization_url({ blogtype: blogtype }, function (err, info) {
        should.not.exist(err);
        if (info.oauth_token) {
          info.oauth_token.should.length(32);
          info.oauth_token_secret.should.length(32);
        }
        var url = api.config.oauth_host + api.config.oauth_authorize;
        info.should.have.property('auth_url').with.include(url);
        done();
      });
    });

    it('should return login url contains `oauth_callback param` and request token', function (done) {
      var user = { blogtype: blogtype, oauth_callback: 'http://localhost/oauth_callback' };
      tapi.get_authorization_url(user, function (err, info) {
        should.not.exist(err);
        if (info.oauth_token) {
          // oauth v1.0
          info.oauth_token.should.length(32);
          info.oauth_token_secret.should.length(32);
        }
        info.auth_url.should.include(encodeURIComponent(user.oauth_callback));
        info.blogtype = blogtype;
        tapi.get_access_token(info, function (err, auth_user) {
          should.exist(err);
          err.name.should.equal('GetAccessTokenError');
          should.not.exist(auth_user);
          done();
        });
      });
    });

  });

  describe('verify_credentials()', function () {

    it('should get current user info', function (done) {
      tapi.verify_credentials(currentUser, function (err, user) {
        should.not.exist(err);
        user.should.have.property('id', currentUser.id);
        user.should.have.property('screen_name', currentUser.screen_name);
        // console.log(user)
        check.checkUser(user);
        done();
      });
    });

  });

  describe('user_show()', function () {

    it('should get a user info by uid', function (done) {
      var uid = 'aichidemao2013';
      if (blogtype === 'weibo') {
        uid = '1640328892';
      } else if (blogtype === 'github') {
        uid = 'substack';
      }
      tapi.user_show(currentUser, uid, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.should.have.property('id', uid);
        check.checkUser(user);
        done();
      });
    });

    if (blogtype === 'weibo') {
      it('should get a user info by screen_name', function (done) {
        tapi.user_show(currentUser, '123', 'Python发烧友', function (err, user) {
          should.not.exist(err);
          should.exist(user);
          user.should.have.property('screen_name', 'Python发烧友');
          check.checkUser(user);
          done();
        });
      });
    }
  });

  describe('update()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should post a status and check the text', function (done) {
      var text = '这是 update(user, status, callback) ++!--% &amp; \\!@#$%^&*() + _ | / ? 的单元测试，当前时间 ' + new Date();
      tapi.update(currentUser, text, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        // console.log(status)
        if (status.text) {
          check.checkStatus(status);
        }
        setTimeout(done, 5000);
      });
    });

    it('should post a status with latitude and longitude', function (done) {
      var text = '这是 update(user, status, callback) with latitude and longitude 的单元测试，当前时间 ' + new Date();
      tapi.update(currentUser, {
        status: text,
        long: '113.421234',
        lat: 22.354231
      }, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        // console.log(status)
        if (status.text) {
          check.checkStatus(status);
        }
        setTimeout(done, 5000);
      });
    });

  });

  describe('upload()', function () {

    if (blogtype === 'github') {
      return;
    }

    var picpath = path.join(__dirname, 'snake.jpg');

    it('should post a photo with text', function (done) {
      var text = '这是 upload(user, status, pic, callback) ++!--% &amp; \\!@#$%^&*() + _ | / ? 的单元测试，当前时间 ' + new Date();
      var pic = {
        data: fs.createReadStream(picpath),
        name: picpath
      };
      tapi.upload(currentUser, text, pic, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        if (status.text) {
          check.checkStatus(status);
        }
        setTimeout(done, 5000);
      });
    });

    it('should post a photo status with latitude and longitude', function (done) {
      var text = '这是 upload(user, status, pic, callback)  with latitude and longitude 的单元测试，当前时间 ' + new Date();
      var status = {
        status: text,
        long: '113.421234',
        lat: 22.354231
      };
      var pic = {
        data: fs.createReadStream(picpath),
        name: picpath
      };
      tapi.upload(currentUser, status, pic, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        if (status.text) {
          check.checkStatus(status);
        }
        setTimeout(done, 5000);
      });
    });

    it('should return error when post a photo status with empty content', function (done) {
      var text = '';
      var pic = {
        data: fs.createReadStream(picpath),
        name: picpath
      };
      tapi.upload(currentUser, text, pic, function (err, status) {
        should.exist(err);
        should.not.exist(status);
        err.should.have.property('name', 'UploadError');
        if (blogtype === 'tqq') {
          err.should.have.property('message', 'error content len');
          err.data.should.have.property('errcode', 2);
          err.data.should.have.property('ret', 1);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'miss required parameter (status), see doc for more info.');
          err.data.should.have.property('error_code', 10016);
          err.data.should.have.property('request', '/2/statuses/upload.json');
        }
        done();
      });
    });

  });

  describe('repost()', function () {

    if (blogtype === 'github') {
      return;
    }

    var newStatus;
    before(function (done) {
      tapi.update(currentUser, 'must be repost soon ' + new Date(), function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        newStatus = status;
        setTimeout(done, 5000);
      });
    });

    it('should repost a status', function (done) {
      var text = '这是 repost(user, id, status, callback) 的单元测试，当前时间 ' + new Date();
      var status = {
        status: text,
        long: '113.421234',
        lat: 22.354231
      };
      tapi.repost(currentUser, newStatus.id, status, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        if (status.text) {
          check.checkStatus(status);
        }
        setTimeout(done, 5000);
      });
    });

    it('should repost a not exists status', function (done) {
      var text = '这是 repost(user, id, status, callback) 的单元测试，当前时间 ' + new Date();
      var status = {
        status: text,
        long: '113.421234',
        lat: 22.354231
      };
      var id = 12315;
      if (blogtype === 'weibo') {
        id = '9223372036854775807';
      }
      tapi.repost(currentUser, id, status, function (err, status) {
        should.exist(err);
        should.not.exist(status);
        err.should.have.property('name', 'RepostError');
        if (blogtype === 'tqq') {
          err.should.have.property('message', 'root node not exist');
          err.data.should.have.property('errcode', 11);
          err.data.should.have.property('ret', 4);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'target weibo does not exist!');
          err.data.should.have.property('error_code', 20101);
          err.data.should.have.property('request', '/2/statuses/repost.json');
        }
        done();
      });
    });

  });

  describe('destroy()', function () {

    if (blogtype === 'github') {
      return;
    }

    var newStatus;
    before(function (done) {
      tapi.update(currentUser, 'must be destroy soon ' + new Date(), function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        newStatus = status;
        done();
      });
    });

    it('should remove a status', function (done) {
      tapi.destroy(currentUser, newStatus.id, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        done();
      });
    });

    it('should remove a not exists status', function (done) {
      var id = 12315;
      if (blogtype === 'weibo') {
        id = '9223372036854775807';
      }
      tapi.destroy(currentUser, id, function (err, result) {
        should.exist(err);
        err.should.have.property('name', 'DestroyError');
        should.not.exist(result);
        if (blogtype === 'tqq') {
          err.should.have.property('message', 'tweet has  been deleted');
          err.data.should.have.property('errcode', 20);
          err.data.should.have.property('ret', 4);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'target weibo does not exist!');
          err.data.should.have.property('error_code', 20101);
          err.data.should.have.property('request', '/2/statuses/destroy.json');
        }
        done();
      });
    });

    it('should error when remove the same status again', function (done) {
      tapi.destroy(currentUser, newStatus.id, function (err, result) {
        if (err) {
          should.exist(err);
          err.should.have.property('name', 'DestroyError');
          should.not.exist(result);
          if (blogtype === 'tqq') {
            err.should.have.property('message', 'tweet has  been deleted');
            err.data.should.have.property('errcode', 20);
            err.data.should.have.property('ret', 4);
          } else if (blogtype === 'weibo') {
            err.should.have.property('message', 'target weibo does not exist!');
            err.data.should.have.property('error_code', 20101);
            err.data.should.have.property('request', '/2/statuses/destroy.json');
          }          
        }
        // some time, remove has little delay.
        done();
      });
    });

  });

  describe('show()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should get a status by id', function (done) {
      var id = '164652015311097';
      if (blogtype === 'weibo') {
        id = '3495319633461422';
      }
      tapi.show(currentUser, id, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        // console.log(status)
        check.checkStatus(status);
        done();
      });
    });
  });

  describe('count()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should get statuses counts by ids', function (done) {
      var ids = '131214014527619,141401129216965';
      if (blogtype === 'weibo') {
        ids = '3495319633461422,3496092735702068';
      }
      tapi.count(currentUser, ids, function (err, counts) {
        should.not.exist(err);
        should.exist(counts);
        counts.should.length(2);
        // console.log(counts)
        for (var i = 0; i < counts.length; i++) {
          var count = counts[i];
          check.checkCount(count);
        }
        done();
      });
    });

    it('should get many ids counts', function (done) {
      var ids = ["111318005835652","104417044624881","116318010008931","41994132913658","82177066854856","132656061790828","26982128953962","3990127024926","66445025297060","93432007200508","80669000906359","141647121347584","26973086189917","21869046756098","53441070691757","91904115047948","87933092979645","122306078212487","69434055308055","142144126035696","111305100574676","112801084258174","102393050096034","74879089594916","29472011805270","12977059235230","48445109483234","25473012801479","67429009192876","110301000953825","54935021681316","25966123739832"];
      if (blogtype === 'weibo') {
        ids = ["3497224040519887","3497218961405556","3497197327226238","3497067869977646","3497189122882224","3497189093513339","3497189055753613","3497189026810553","3497188997440832","3497188972265681","3497166649897778","3497151550375723","3497137884816653","3497136991828840","3497136446890528","3497121343108924","3497108239681279","3497106835232754","3497106243442114","3497106138841925","3497072910720616","3497049733619361","3497066670114087","3497063889658528","3497063210019706","3497062111221957","3497061641378105","3497061062728213","3497060832002118","3497060412497677","3497060232110246","3497059200393333","3497058768048762","3497058361396811","3497058294277389","3497058109697188","3497057719564435","3497057346450102","3497057228751499","3497056440585453","3497033816125644","3496918757949972","3496906221348721","3496902484111890","3496902459310463","3496900584036169","3496900584036167","3496900139788908","3496899598706169","3496899342845306","3496894561088841","3496894213304617","3496892925606866","3496879742541953","3496864634772446","3496862973691016","3496849535528769","3496834439926589","3496819336407686","3496804236798935","3496792257955945","3496785072830638","3496783726991008","3496742621878746","3496695935943170","3496695163869342","3496695063190154","3496657955710135","3495900498056439","3496622430826363","3494446203650864","3496621347723880","3496461826754347","3496438468640758","3496412778013700","3496371753715164","3496370096409542","3496310252821724","3496363700784477","3496363629336943","3496349008097696","3496347452219348","3496338811776521","3496345501654686","3496337117280870","3496334860252535","3496331807268412","3496304607178383","3496320918703932","3496320885484962","3496320847729398","3496320814169492","3496320784464668","3496320755100056","3496318427712933","3496318406737439","3496318381566942","3496318356093943","3496318335118764","3496318310251597","3496317953375910","3496317932400382","3496317907526535","3496317886550457","3496317861380500"];
      }
      tapi.count(currentUser, ids, function (err, counts) {
        should.not.exist(err);
        should.exist(counts);
        counts.should.length(ids.length);
        for (var i = 0; i < counts.length; i++) {
          var count = counts[i];
          check.checkCount(count);
        }
        done();
      });
    });

    it('should error when ids is empty', function (done) {
      var ids = '';
      tapi.count(currentUser, ids, function (err, counts) {
        should.exist(err);
        should.not.exist(counts);
        err.should.have.property('name', 'CountError');
        if (blogtype === 'tqq') {
          err.should.have.property('message', 'error ids len');
          err.data.should.have.property('errcode', 16);
          err.data.should.have.property('ret', 1);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'parameter (ids)\'s value invalid,expect (str[str length：1~-1]), but get (), see doc for more info.');
          err.data.should.have.property('error_code', 10017);
          err.data.should.have.property('request', '/2/statuses/count.json');
        }
        done();
      });
    });

  });

  describe('home_timeline()', function () {

    if (blogtype === 'github') {
      return;
    }

    var since_time, since_id, max_time, max_id;

    it('should list recent 20 home timeline statuses with no cursor', function (done) {
      tapi.home_timeline(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          var item = result.items[i];
          check.checkStatus(item);
          if (blogtype === 'tqq') {
            item.should.have.property('users').with.be.a('object');
          }
        }
        var first = result.items[0];
        var last = result.items[result.items.length - 1];
        max_id = last.id;
        max_time = last.timestamp;
        since_id = first.id;
        since_time = first.timestamp;
        done();
      });
    });

    it('should list prev 20 home timeline statuses with {since_id, since_time}', function (done) {
      tapi.home_timeline(currentUser, {since_id: since_id, since_time: since_time}, 
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        // result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });

    it('should list next 20 home timeline statuses with {max_id, max_time}', function (done) {
      tapi.home_timeline(currentUser, {max_id: max_id, max_time: max_time}, 
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        var first = result.items[0];
        first.timestamp.should.below(max_time);
        // first.id.should.below(max_id);
        done();
      });
    });

    it('should list recent 1 home timeline statuses with {count: 1}', function (done) {
      tapi.home_timeline(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        if (result.items.length) {
          result.items.should.length(1);
        }
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });

  });

  describe('public_timeline()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should list recent 20 public timeline statuses with no cursor', function (done) {
      tapi.public_timeline(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });

    it('should list recent 1 public timeline statuses with {count: 1}', function (done) {
      tapi.public_timeline(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });
  });

  describe('user_timeline()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should list recent 20 current user timeline statuses with no cursor', function (done) {
      tapi.user_timeline(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });

    var blogUser = userIDs[blogtype];

    it('should list recent 20 ' + blogUser.id + '\'s timeline statuses by user.id {id: "' + blogUser.id + '"}',
    function (done) {
      tapi.user_timeline(currentUser, {uid: blogUser.id}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          var status = result.items[i];
          // console.log(status)
          check.checkStatus(status);
          status.user.id.should.equal(blogUser.id);
          status.user.screen_name.should.equal(blogUser.screen_name);
        }
        done();
      });
    });
  });

  describe('mentions()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should list recent 20 @me statuses with no cursor', function (done) {
      tapi.mentions(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });

    it('should list recent 1 @me statuses with {count: 1}', function (done) {
      tapi.mentions(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });
  });

  describe('search()', function () {

    if (blogtype === 'github') {
      return;
    }

    var test = xit;
    if (tapi.support(currentUser, 'search')) {
      test = it;
    }

    test('should search with keyword:fawave', function (done) {
      tapi.search(currentUser, 'fawave', function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array).with.length(20);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        result.should.have.property('cursor').with.be.a('object');
        done();
      });
    });

  });

  describe('comments_timeline()', function () {

    if (blogtype === 'github') {
      return;
    }

    it('should list recent 20 comments to my statuses with no cursor', function (done) {
      tapi.comments_timeline(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });

    it('should list recent 1 comment to my statuses with {count: 1}', function (done) {
      tapi.comments_timeline(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkComment(result.items[i]);
        }
        done();
      });
    });
  });
  
  describe('comments_mentions()', function () {

    if (blogtype === 'github') {
      return;
    }

    var test = xit;
    if (tapi.support(currentUser, 'comments_mentions')) {
      test = it;
    }

    test('should list recent 20 @me comments', function (done) {
      tapi.comments_mentions(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });

    test('should list recent 1 @me comment with {count: 1}', function (done) {
      tapi.comments_mentions(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkComment(result.items[i]);
        }
        done();
      });
    });
  });

  describe('comments_to_me()', function () {

    if (blogtype === 'github') {
      return;
    }

    var test = xit;
    if (tapi.support(currentUser, 'comments_to_me')) {
      test = it;
    }

    test('should list recent 20 to me comments', function (done) {
      tapi.comments_to_me(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });

    test('should list recent 1 to me comment with {count: 1}', function (done) {
      tapi.comments_to_me(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkComment(result.items[i]);
        }
        done();
      });
    });
  });

  describe('comments_by_me()', function () {

    if (blogtype === 'github') {
      return;
    }

    var test = xit;
    if (tapi.support(currentUser, 'comments_by_me')) {
      test = it;
    }

    test('should list recent 20 by me comments', function (done) {
      tapi.comments_by_me(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });

    test('should list recent 1 by me comment with {count: 1}', function (done) {
      tapi.comments_by_me(currentUser, {count: 1}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(1);
        for (var i = 0; i < result.items.length; i++) {
          check.checkComment(result.items[i]);
        }
        done();
      });
    });
  });

  describe('repost_timeline()', function () {

    if (blogtype === 'github') {
      return;
    }

    var id = '164652015311097';
    if (blogtype === 'weibo') {
      id = '2830347985';
    }
    it('should list recent 8 status:' + id + ' repost statuses', function (done) {
      tapi.repost_timeline(currentUser, id, {count: 8}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });
  });

  describe('comments()', function () {
    if (blogtype === 'github') {
      return;
    }
    
    var id = '164652015311097';
    var sinceParams = { id: 150161002336620, params: {count: 10 } };
    if (blogtype === 'weibo') {
      id = '2830347985';
      sinceParams = { id: 3497138228866132, params: {count: 10 } };
    }
    it('should list recent 9 status:' + id + ' comments', function (done) {
      tapi.comments(currentUser, id, {count: 9}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        console.log(result.users)
        console.log(result.items[0])
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });

    it('should list be since_id and not include the since_id', function (done) {
      tapi.comments(currentUser, sinceParams.id, sinceParams.params, function (err, result) {
        should.not.exist(err);
        var comments = result.items;
        comments.length.should.above(0);
        var first = comments[0];
        sinceParams.params.since_id = first.id;
        if (first.timestamp) {
          sinceParams.params.since_time = first.timestamp;
        }
        tapi.comments(currentUser, sinceParams.id, sinceParams.params, function (err, result) {
          should.not.exist(err);
          var comments = result.items;
          if (comments.length) {
            comments[comments.length - 1].id.should.not.equal(first.id);
          }
          done();
        });
      });
    });
  });

  describe('comment_create()', function () {

    if (blogtype === 'github') {
      return;
    }

    var id = '70997003338788';
    if (blogtype === 'weibo') {
      id = '2830347985';
    }
    it('should post a comment on status:' + id, function (done) {
      var text = '这是一个 comment_create: function (user, id, comment, callback) 的测试 ++' + new Date();
      tapi.comment_create(currentUser, id, text, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('id').with.match(/^\d+$/);
        if (result.text) {
          check.checkComment(result);
        }
        done();
      });
    });

    it('should post a comment on not exists status', function (done) {
      var text = '这是一个 comment_create: function (user, id, comment, callback) 的测试 ++' + new Date();
      var id = 123;
      if (blogtype === 'weibo') {
        id = '9223372036854775807';
      }
      tapi.comment_create(currentUser, id, text, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property('name', 'CommentCreateError');
        if (blogtype === 'tqq') {
          err.should.have.property('message', 'root node not exist');
          err.should.have.property('data');
          err.data.should.have.property('errcode', 11);
          err.data.should.have.property('ret', 4);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'target weibo does not exist!');
          err.should.have.property('data');
          err.data.should.have.property('error_code', 20101);
          err.data.should.have.property('request', '/2/comments/create.json');
        }
        done();
      });
    });

    it('should post a empty comment', function (done) {
      tapi.comment_create(currentUser, '70997003338788', '', function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property('name', 'CommentCreateError');

        if (blogtype === 'tqq') {
          err.should.have.property('message', 'error content len');
          err.should.have.property('data');
          err.data.should.have.property('errcode', 2);
          err.data.should.have.property('ret', 1);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'content is null!');
          err.should.have.property('data');
          err.data.should.have.property('error_code', 20008);
          err.data.should.have.property('request', '/2/comments/create.json');
        }
        
        done();
      });
    });
  });

  describe('comment_reply()', function () {

    if (blogtype === 'github') {
      return;
    }

    var cid = '83231031553455';
    var id = '70997003338788';
    if (blogtype === 'weibo') {
      cid = '3495376428605830';
      id = '2830347985';
    }
    it('should reply to comment:' + cid + ' status:' + id, function (done) {
      var text = '这是一个 comment_reply: function (user, cid, id, comment, callback) 的测试 ++' + new Date();
      tapi.comment_reply(currentUser, cid, id, text, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        // console.log(result)
        result.should.have.property('id').with.match(/^\d+$/);
        if (result.text) {
          check.checkComment(result);
        }
        done();
      });
    });

    it('should reply a comment on not exists status', function (done) {
      var cid = 123;
      var id = 1234;
      if (blogtype === 'weibo') {
        cid = '2830347985';
        id = '9223372036854775807';
      }
      var text = '这是一个 comment_reply: function (user, cid, id, comment, callback) 的测试 ++' + new Date();
      tapi.comment_reply(currentUser, cid, id, text, function (err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property('name', 'CommentReplyError');

        if (blogtype === 'tqq') {
          err.should.have.property('message', 'root node not exist');
          err.should.have.property('data');
          err.data.should.have.property('errcode', 11);
          err.data.should.have.property('ret', 4);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'target weibo does not exist!');
          err.should.have.property('data');
          err.data.should.have.property('error_code', 20101);
          err.data.should.have.property('request', '/2/comments/reply.json');
        }
        done();
      });
    });

    it('should reply empty content', function (done) {
      tapi.comment_reply(currentUser, '83231031553455', '70997003338788', '', function (err, result) {
        should.exist(err);
        err.should.have.property('name', 'CommentReplyError');
        should.not.exist(result);

        if (blogtype === 'tqq') {
          err.should.have.property('message', 'error content len');
          err.should.have.property('data');
          err.data.should.have.property('errcode', 2);
          err.data.should.have.property('ret', 1);
        } else if (blogtype === 'weibo') {
          err.should.have.property('message', 'content is null!');
          err.should.have.property('data');
          err.data.should.have.property('error_code', 20008);
          err.data.should.have.property('request', '/2/comments/reply.json');
        }
        done();
      });
    });
  });

  describe('comment_destroy()', function () {

    if (blogtype === 'github') {
      return;
    }

    var test = xit;
    var newComment;
    var id = '70997003338788';
    if (blogtype === 'weibo') {
      id = '2830347985';
    }
    if (tapi.support(currentUser, 'comment_destroy')) {
      test = it;
      before(function (done) {
        var text = 'this comment 很快被删除! ++' + new Date();
        tapi.comment_create(currentUser, id, text, function (err, comment) {
          should.not.exist(err);
          newComment = comment;
          done();
        });
      });
    }
    test('should destroy a comment', function (done) {
      tapi.comment_destroy(currentUser, newComment.id, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('id').with.match(/^\d+$/);
        done();
      });
    });

  });

  describe('favorites()', function () {

    if (!tapi.support(currentUser, 'favorites')) {
      return;
    }

    it('should return recently top 20 favorites items', function (done) {
      tapi.favorites(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.length.should.above(18);
        for (var i = 0; i < result.items.length; i++) {
          var item = result.items[i];
          // console.log(item);
          check.checkFavorite(item);
        } 
        done();
      });
    });

  });

  describe('favorite_show()', function () {

    if (!tapi.support(currentUser, 'favorite_show')) {
      return;
    }

    var id = '130714030326029';
    if (blogtype === 'weibo') {
      id = '3496082502085667';
    }

    it('should get the favorie item', function (done) {
      tapi.favorite_show(currentUser, id, function (err, item) {
        should.not.exist(err);
        should.exist(item);
        check.checkFavorite(item);
        done();
      });
    });

  });

  describe('favorite_create()', function () {

    if (!tapi.support(currentUser, 'favorite_create')) {
      return;
    }

    var id = '27933112527179';
    if (blogtype === 'weibo') {
      id = '3496055356589436';
    }

    before(function (done) {
      tapi.favorite_destroy(currentUser, id, function () {
        done();
      });
    });

    it('should favorie the status by id', function (done) {
      tapi.favorite_create(currentUser, id, function (err, item) {
        should.not.exist(err);
        // console.log(item)
        should.exist(item);
        check.checkFavorite(item);
        done();
      });
    });

    it('should favorie the same status', function (done) {
      tapi.favorite_create(currentUser, id, function (err, item) {
        if (blogtype === 'tqq') {
          // will success
          should.not.exist(err);
          should.exist(item);
          check.checkFavorite(item);
          return done();
        }
        should.exist(err);
        should.not.exist(item);
        err.should.have.property('name', 'FavoriteCreateError');
        if (blogtype === 'weibo') {
          err.should.have.property('message', 'you have collected this status!');
          err.should.have.property('data').with.be.a('object');
          err.data.should.have.property('error_code', 20704);
          err.data.should.have.property('request', '/2/favorites/create.json');
        }
        done();
      });
    });

  });

  describe('favorite_destroy()', function () {

    if (!tapi.support(currentUser, 'favorite_destroy')) {
      return;
    }

    var id = '27933112527179';
    if (blogtype === 'weibo') {
      id = '3496055356589436';
    }

    before(function (done) {
      tapi.favorite_create(currentUser, id, function () {
        done();
      });
    });

    it('should remove a favorite item by id', function (done) {
      tapi.favorite_destroy(currentUser, id, function (err, item) {
        should.not.exist(err);
        // console.log(item)
        should.exist(item);
        check.checkFavorite(item);
        done();
      });
    });

    it('should remove the same favorite item', function (done) {
      tapi.favorite_destroy(currentUser, id, function (err, item) {
        if (blogtype === 'tqq') {
          // will success
          should.not.exist(err);
          should.exist(item);
          check.checkFavorite(item);
          return done();
        }
        should.exist(err);
        should.not.exist(item);
        err.should.have.property('name', 'FavoriteDestroyError');
        if (blogtype === 'weibo') {
          err.should.have.property('message', 'not your collection!');
          err.should.have.property('data').with.be.a('object');
          err.data.should.have.property('error_code', 20705);
          err.data.should.have.property('request', '/2/favorites/destroy.json');
        }
        done();
      });
    });

  });

});

});

