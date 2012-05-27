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

  var currentUser = users.tsina;
  var currentUserProxy = proxyUsers.tsina;

  function checkUser(user) {
    user.id.should.match(/^\d+$/);
    user.screen_name.should.be.a('string');
    user.profile_image_url.should.match(/^http:\/\//);
    user.t_url.should.match(/^http:\/\//);
    if (user.status) {
      checkStatus(user.status);
    }
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
    // status.should.have.property('user');
    if (status.user) {
      checkUser(status.user);
    }
    if (status.retweeted_status) {
      checkStatus(status.retweeted_status);
    }
  }

  function checkComment(comment) {
    comment.text.should.be.a('string');
    comment.source.should.be.a('string');
    comment.id.should.match(/^\d+$/);
    checkUser(comment.user);
    checkStatus(comment.status);
  }

  describe('api_dispatch()', function () {

    it('should return right type api', function () {
      for (var k in tapi.TYPES) {
        var user = { blogType: k };
        tapi.api_dispatch(user).should.equal(tapi.TYPES[k]);
      }
    });

  });

  describe('get_authorization_url()', function () {

    it('should return login url and request token', function (done) {
      tapi.get_authorization_url({ blogType: 'weibo' }, function (err, auth_info) {
        should.not.exist(err);
        auth_info.should.have.keys('auth_url', 'oauth_token_key', 'oauth_token_secret');
        done();
      });
    });

    it('should return login url contains `oauth_callback param` and request token', function (done) {
      var user = { blogType: 'weibo', oauth_callback: 'http://localhost/oauth_callback' };
      tapi.get_authorization_url(user, function (err, auth_info) {
        should.not.exist(err);
        auth_info.should.have.keys('auth_url', 'oauth_token_key', 'oauth_token_secret');
        auth_info.auth_url.should.include('oauth_callback=' + encodeURIComponent(user.oauth_callback));

        auth_info.blogType = 'weibo';
        tapi.get_access_token(auth_info, function (err, auth_user) {
          should.exist(err);
          err.name.should.equal('GetAccessTokenError');
          should.not.exist(auth_user);
          done();
        });
      });
    });

  });

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

  describe('verify_credentials()', function () {

    it('should return current user info', function (done) {
      tapi.verify_credentials(currentUser, function (err, user) {
        should.not.exist(err);
        checkUser(user);
        done();
      });
    });

    it('should return current proxy user info', function (done) {
      tapi.verify_credentials(currentUserProxy, function (err, user) {
        should.not.exist(err);
        checkUser(user);
        done();
      });
    });

  });

  describe('rate_limit_status()', function () {

    it('should return limit status', function (done) {
      tapi.rate_limit_status({ user: currentUser }, function (err, limit) {
        should.not.exist(err);
        should.exist(limit);
        limit.should.have.keys('remaining_hits', 'hourly_limit', 'reset_time_in_seconds', 'reset_time');
        limit.remaining_hits.should.be.a('number');
        limit.hourly_limit.should.be.a('number');
        limit.reset_time_in_seconds.should.be.a('number');
        done();
      });
    });

  });

  describe('user_timeline()', function () {

    it('should return current user timeline', function (done) {
      tapi.user_timeline({ user: currentUser }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('should return current proxy user timeline', function (done) {
      tapi.user_timeline({ user: currentUserProxy }, function (err, statuses) {
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

  describe('comments_timeline()', function () {
    it('should return current user top 20 recently comments timeline', function (done) {
      tapi.comments_timeline({ user: currentUser }, function (err, comments) {
        should.not.exist(err);
        should.exist(comments);
        comments.length.should.above(15);
        comments.forEach(function (comment) {
          checkComment(comment);
        });
        done();
      });
    });

    it('should return current proxy user top 20 recently comments timeline', function (done) {
      tapi.comments_timeline({ user: currentUserProxy }, function (err, comments) {
        should.not.exist(err);
        should.exist(comments);
        comments.length.should.above(15);
        comments.forEach(function (comment) {
          checkComment(comment);
        });
        done();
      });
    });
  });

  describe('repost_timeline()', function () {
    it('should return status 3449978813032955 top 20 recently reposts timeline', function (done) {
      tapi.repost_timeline({ id: 3449978813032955, user: currentUser }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
          status.should.have.property('retweeted_status');
        });
        done();
      });
    });

    it('should return status 3449978813032955 20 recently reposts timeline', function (done) {
      tapi.repost_timeline({ id: 3449978813032955, user: currentUserProxy }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
          status.should.have.property('retweeted_status');
        });
        done();
      });
    });
  });

  describe('mentions()', function () {

    it('should return current user mentions top 20', function (done) {
      tapi.mentions({ user: currentUser }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(15);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('should return current proxy user mentions top 20', function (done) {
      tapi.mentions({ user: currentUserProxy }, function (err, statuses) {
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

  describe('emotions()', function () {
    it('should return all emotions map', function (done) {
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
  });

  describe('followers()', function () {

    it('should return current user top 20 followers', function (done) {
      tapi.followers({ user: currentUser }, function (err, users) {
        should.not.exist(err);
        should.exist(users);
        users.length.should.above(5);
        users.forEach(function (user) {
          checkUser(user);
        });
        done();
      });
    });

    it('should return current proxy user top 20 followers', function (done) {
      tapi.followers({ user: currentUserProxy }, function (err, users) {
        should.not.exist(err);
        should.exist(users);
        users.length.should.above(5);
        users.forEach(function (user) {
          checkUser(user);
        });
        done();
      });
    });

  });

  describe('friends()', function () {

    it('should return current user top 20 friends', function (done) {
      tapi.friends({ user: currentUser }, function (err, users) {
        should.not.exist(err);
        should.exist(users);
        users.length.should.above(5);
        users.forEach(function (user) {
          checkUser(user);
        });
        done();
      });
    });

    it('should return current proxy user top 20 friends', function (done) {
      tapi.friends({ user: currentUserProxy }, function (err, users) {
        should.not.exist(err);
        should.exist(users);
        users.length.should.above(5);
        users.forEach(function (user) {
          checkUser(user);
        });
        done();
      });
    });

  });

  describe('favorites()', function () {

    it('should return currentUser top 20 favorites', function (done) {
      tapi.favorites({ user: currentUser }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(5);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

    it('should return currentUserProxy top 20 favorites', function (done) {
      tapi.favorites({ user: currentUserProxy }, function (err, statuses) {
        should.not.exist(err);
        should.exist(statuses);
        statuses.length.should.above(5);
        statuses.forEach(function (status) {
          checkStatus(status);
        });
        done();
      });
    });

  });

  describe('favorites_create() and favorites_destroy()', function () {

    it('should favorite 3450198095420635 and destroy it', function (done) {
      tapi.favorites_create({ id: 3450198095420635, user: currentUser }, function (err, status) {
        should.not.exist(err);
        String(status.id).should.equal('3450198095420635');
        checkStatus(status);
        tapi.favorites_destroy({ id: '3450198095420635', user: currentUserProxy }, function (err, deleteStatus) {
          String(deleteStatus.id).should.equal('3450198095420635');
          checkStatus(deleteStatus);
          done();
        });
      });
    });

  });
  
  describe('counts()', function () {

    it('should return status counts', function (done) {
      tapi.counts({ ids: [ '3450198095420635', '3450213966299865' ].join(','), user: currentUser }, function (err, counts) {
        should.not.exist(err);
        should.exist(counts);
        counts.should.length(2);
        counts.forEach(function (count) {
          count.should.have.keys('id', 'comments', 'rt');
          count.id.should.match(/^\d+$/);
          count.comments.should.match(/^\d+$/);
          count.rt.should.match(/^\d+$/);
        });
        done();
      });
    });

  });

  // describe('direct_messages()', function () {

  //   it('should return top 20 messages', function (done) {
  //     tapi.direct_messages({ user: currentUser }, function (err, messages) {
  //       should.not.exist(err);
  //       console.log(messages)
  //       done();
  //     });
  //   });

  // });

  describe('user_show()', function () {

    it('should return user info', function (done) {
      tapi.user_show({ id: 1639621773, user: currentUserProxy }, function (err, user) {
        should.not.exist(err);
        checkUser(user);
        done();
      });
    });

  });

  describe('status_show()', function () {

    it('should return 3449709785616243 status', function (done) {
      tapi.status_show({ id: 3449709785616243, user: currentUser }, function (err, status) {
        should.not.exist(err);
        checkStatus(status);
        status.should.have.property('user');
        done();
      });
    });

  });

  // describe('comment()', function () {

  //   it('should comment 3449709785616243', function (done) {
  //     var text = '+!@#这是测试comment(), 来自单元测试 at ' + new Date();
  //     text += '这个是不会出现的，如果出现，就是测试不通过了。';
  //     tapi.comment({ id: 3449709785616243 , comment: text }, function (err, comment) {

  //     });
  //   });

  // });

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