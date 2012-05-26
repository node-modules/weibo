/*!
 * node-weibo - tapi.js test cases
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var tapi = require('../lib/tapi');
var should = require('should');
var users = require('./config').users;

describe('tapi.js', function () {

  var anonymous = {
    blogType: 'weibo'
  };

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

  });

  describe('friends_timeline()', function () {

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

});