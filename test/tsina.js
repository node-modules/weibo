/*!
 * node-weibo - tapi.js test cases
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = require('../');
var should = require('should');
var users = require('./config').users;

describe('tsina.js', function () {

  var proxy = 'http://127.0.0.1:37456/';
  var anonymous = {
    blogType: 'weibo'
  };
  var anonymousProxy = {
    blogType: 'weibo',
    proxy: proxy
  };

  var proxyUsers = {};
  for (var blogType in users) {
    var user = users[blogType];
    var proxyUser = {};
    for (var k in user) {
      proxyUser[k] = user[k];
    }
    proxyUser.proxy = proxy;
    proxyUsers[blogType] = proxyUser;
  }

  it('api_dispatch() should return right type', function () {
    for (var k in tapi.TYPES) {
      var user = { blogType: k };
      tapi.api_dispatch(user).should.equal(tapi.TYPES[k]);
    }
  });

  function checkUser(user) {
    user.id.should.match(/^\d+$/);
    user.screen_name.should.be.a('string');
    user.profile_image_url.should.match(/^http:\/\//);
    user.t_url.should.match(/^http:\/\//);
  }

  function checkStatus(status) {
    status.text.should.be.a('string');
    status.id.should.match(/^\d+$/);
    if (status.thumbnail_pic) {
      status.thumbnail_pic.should.match(/^http:\/\//);
    }
    if (status.bmiddle_pic) {
      status.bmiddle_pic.should.match(/^http:\/\//);
    }
    if (status.original_pic) {
      status.original_pic.should.match(/^http:\/\//);
    }
    status.t_url.should.match(/^http:\/\//);
    status.source.should.be.a('string');
    status.should.have.property('user');
    checkUser(status.user);
  }

  describe('update() and destroy()', function () {
    it('should send a text status and destroy it', function (done) {
      var text = '++这是测试微博update()，来自单元测试 tapi.test.js at ' + new Date();
      text += ' || +按道理是不会出现的，如果出现了，就是单元测试不通过了。';
      tapi.update({ user: users.tsina, status: text }, function (err, status) {
        should.not.exist(err);
        status.text.should.equal(text);
        tapi.destroy({ user: users.tsina, id: status.id }, function (err, deleteStatus) {
          should.not.exist(err);
          String(deleteStatus.id).should.equal(String(status.id));
          done();
        });
      });
    });
  });

  describe('public_timeline()', function () {

    it('anonymous should return', function (done) {
      tapi.public_timeline({ user: anonymous }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('anonymousProxy should return', function (done) {
      tapi.public_timeline({ user: anonymousProxy }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('oauth user should return', function (done) {
      tapi.public_timeline({ user: users.tsina }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('oauth userProxy should return', function (done) {
      tapi.public_timeline({ user: proxyUsers.tsina }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

  });

  describe('friends_timeline()', function () {

    var firstStatuses;
    before(function (done) {
      tapi.friends_timeline({ user: users.tsina }, function (err, statuses) {
        should.not.exist(err);
        firstStatuses = statuses;
        done();
      });
    });

    it('anonymous should not return', function (done) {
      tapi.friends_timeline({ user: anonymous }, function (err, statuses) {
        should.exist(err);
        err.name.should.equal('HTTPResponseError');
        err.message.should.include('auth faild');
        err.status_code.should.equal(403);
        should.not.exist(statuses);
        done();
      });
    });

    it('anonymousProxy should not return', function (done) {
      tapi.friends_timeline({ user: anonymousProxy }, function (err, statuses) {
        should.exist(err);
        err.name.should.equal('HTTPResponseError');
        err.message.should.include('auth faild');
        err.status_code.should.equal(403);
        should.not.exist(statuses);
        done();
      });
    });

    it('oauth user should return', function (done) {
      tapi.friends_timeline({ user: users.tsina }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('oauth proxyUser should return', function (done) {
      tapi.friends_timeline({ user: proxyUsers.tsina }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('should get next page by max_id and ignore the max_id status', function (done) {
      var max_id = firstStatuses[firstStatuses.length - 1].id;
      tapi.friends_timeline({ user: users.tsina, max_id: max_id }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        String(statuses[0].id).should.not.equal(String(max_id));
        done();
      });
    });
  });

  it('emotions() should return', function (done) {
    tapi.emotions(anonymous, function (err, emotions) {
      should.not.exist(err);
      should.exist(emotions);
      var keys = Object.keys(emotions);
      keys.length.should.above(10);
      keys.forEach(function (key) {
        var emotion = emotions[key];
        emotion.phrase.should.equal(key);
        emotion.phrase.should.match(/^\[[^\]]+\]$/);
        emotion.url.should.match(/^http:\/\//);
        emotion.title.should.be.a('string');
        emotion.title.should.length(emotion.phrase.length - 2);
      });
      done();
    });
  });

  describe('respost() and destroy()', function () {
    it('should respost a status and destroy it', function (done) {
      var text = '+这是测试转发微博respost()，++来自单元测试 tapi.test.js at ' + new Date();
      text += ' || 按道理是不会出现的，如果出现了，就是单元测试不通过了。';
      var source_id = 3449709785616243;
      tapi.repost({ user: users.tsina, id: source_id, status: text }, function (err, status) {
        should.not.exist(err);
        status.text.should.equal(text);
        String(status.retweeted_status.id).should.equal(String(source_id));
        tapi.destroy({ user: users.tsina, id: status.id }, function (err, deleteStatus) {
          should.not.exist(err);
          String(deleteStatus.id).should.equal(String(status.id));
          done();
        });
      });
    });
  });

});