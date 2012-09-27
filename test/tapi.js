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
};

describe('tapi.js ' + blogtype + ' API', function () {
  var api;
  var currentUser = users[blogtype];

  describe('api_dispatch()', function () {
    it('should return right type api', function () {
      var user = { blogtype: blogtype };
      api = tapi.api_dispatch(user);
      api.should.an.instanceof(tapi.TYPES[blogtype]);
    });
  });

  describe('get_authorization_url()', function () {

    it('should return login url and request token', function (done) {
      tapi.get_authorization_url({ blogtype: blogtype }, function (err, info) {
        should.not.exist(err);
        info.oauth_token.should.length(32);
        info.oauth_token_secret.should.length(32);
        info.should.have.property('auth_url').with.include(api.config.oauth_host + api.config.oauth_authorize);
        done();
      });
    });

    it('should return login url contains `oauth_callback param` and request token', function (done) {
      var user = { blogtype: blogtype, oauth_callback: 'http://localhost/oauth_callback' };
      tapi.get_authorization_url(user, function (err, info) {
        should.not.exist(err);
        info.oauth_token.should.length(32);
        info.oauth_token_secret.should.length(32);
        info.auth_url.should.include('oauth_callback=' + encodeURIComponent(user.oauth_callback));
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

    it('should return current user info', function (done) {
      tapi.verify_credentials(currentUser, function (err, user) {
        should.not.exist(err);
        check.checkUser(user);
        done();
      });
    });

  });

  describe('update()', function () {

    it('should post a status and check the text', function (done) {
      var text = '这是 update(user, status, callback) ++!--% &amp; \\!@#$%^&*() + _ | / ? 的单元测试，当前时间 ' + new Date();
      tapi.update(currentUser, text, function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        if (status.text) {
          check.checkStatus(status);
        }
        done();     
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
        if (status.text) {
          check.checkStatus(status);
        }
        done();
      });
    });

  });

  describe('upload()', function () {

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
        done();
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
        done();
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
        err.should.have.property('message', 'error content len');
        err.should.have.property('name', 'UploadError');
        err.data.should.have.property('errcode', 2);
        err.data.should.have.property('ret', 1);
        should.not.exist(status);
        done();
      });
    });

  });

  describe('repost()', function () {
    var newStatus;
    before(function (done) {
      tapi.update(currentUser, 'must be repost soon ' + new Date(), function (err, status) {
        should.not.exist(err);
        should.exist(status);
        status.should.have.property('id').with.match(/^\d+$/);
        newStatus = status;
        done();
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
        done();
      });
    });

    it('should repost a not exists status', function (done) {
      var text = '这是 repost(user, id, status, callback) 的单元测试，当前时间 ' + new Date();
      var status = {
        status: text,
        long: '113.421234',
        lat: 22.354231
      };
      tapi.repost(currentUser, 12345, status, function (err, status) {
        should.exist(err);
        err.should.have.property('message', 'root node not exist');
        err.should.have.property('name', 'RepostError');
        err.data.should.have.property('errcode', 11);
        err.data.should.have.property('ret', 4);
        should.not.exist(status);
        done();
      });
    });

  });

  describe('destroy()', function () {
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
      tapi.destroy(currentUser, 12345, function (err, result) {
        should.exist(err);
        err.should.have.property('message', 'tweet has  been deleted');
        err.should.have.property('name', 'DestroyError');
        err.data.should.have.property('errcode', 20);
        err.data.should.have.property('ret', 4);
        should.not.exist(result);
        done();
      });
    });

    it('should error when remove the same status again', function (done) {
      tapi.destroy(currentUser, newStatus.id, function (err, result) {
        if (err) {
          should.exist(err);
          err.should.have.property('message', 'tweet has  been deleted');
          err.should.have.property('name', 'DestroyError');
          err.data.should.have.property('errcode', 20);
          err.data.should.have.property('ret', 4);
          should.not.exist(result);
        }
        // some time, remove has little delay.
        done();
      });
    });

  });

  describe('show()', function () {
    it('should get a status by id', function (done) {
      tapi.show(currentUser, '164652015311097', function (err, status) {
        should.not.exist(err);
        should.exist(status);
        check.checkStatus(status);
        done();
      });
    });
  });

  describe('home_timeline()', function () {
    it('should list recent 20 home timeline statuses with no cursor', function (done) {
      tapi.home_timeline(currentUser, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.length.should.above(0);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
          // console.log(result.items[i])
        }
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
      tapi.user_timeline(currentUser, {id: blogUser.id}, function (err, result) {
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

  describe('comments_timeline()', function () {
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

    it('should list recent 1 comments to my statuses with {count: 1}', function (done) {
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

  describe('repost_timeline()', function () {
    it('should list recent 8 status:164652015311097 repost statuses', function (done) {
      tapi.repost_timeline(currentUser, '164652015311097', {count: 8}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(8);
        for (var i = 0; i < result.items.length; i++) {
          check.checkStatus(result.items[i]);
        }
        done();
      });
    });
  });

  describe('comments()', function () {
    it('should list recent 9 status:164652015311097 comments', function (done) {
      tapi.comments(currentUser, '164652015311097', {count: 9}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.should.be.an.instanceof(Array);
        result.should.have.property('cursor').with.be.a('object');
        result.items.should.length(9);
        for (var i = 0; i < result.items.length; i++) {
          // console.log(result.items[i])
          check.checkComment(result.items[i]);
        }
        done();
      });
    });
  });

});

});

