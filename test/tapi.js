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
        setTimeout(function () {
          tapi.show(currentUser, status.id, function (err, status) {
            console.log(arguments)
            should.not.exist(err);
            should.exist(status);
            check.checkStatus(status);
            status.text.should.equal(text);
            done();
          });
        }, 5000);        
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
    before(function (done) {
      tapi.verify_credentials(currentUser, function (err, user) {
        should.not.exist(err);
        check.checkUser(user);
        for (var k in user) {
          currentUser[k] = user[k];
        }
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
      tapi.repost(currentUser, currentUser.status.id, status, function (err, status) {
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
    before(function (done) {
      tapi.verify_credentials(currentUser, function (err, user) {
        should.not.exist(err);
        check.checkUser(user);
        for (var k in user) {
          currentUser[k] = user[k];
        }
        done();
      });
    });

    it('should remove a status', function (done) {
      tapi.destroy(currentUser, currentUser.status.id, function (err, result) {
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

    it('should remove the same status again', function (done) {
      tapi.destroy(currentUser, currentUser.status.id, function (err, result) {
        should.not.exist(err);
        should.exist(result);
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

});

});

