/*!
 * node-weibo - test/utils/check.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');

exports.checkUser = checkUser;
exports.checkStatus = checkStatus;
exports.checkComment = checkComment;

function checkUser(user) {
  user.id.should.match(/^[\w\-]+$/).with.be.a('string');
  user.t_url.should.match(/^http:\/\//);
  user.screen_name.should.be.a('string');
  user.should.have.property('name').with.be.a('string');
  user.should.have.property('location').with.be.a('string');
  if (user.description) {
    user.description.should.be.a('string');
  }
  if (user.url) {
    user.url.should.be.a('string');
  }
  user.profile_image_url.should.match(/^http:\/\//);
  user.should.have.property('avatar_large').with.match(/^http:\/\//);
  user.should.have.property('gender').with.match(/[mfn]/);
  user.should.have.property('followers_count').with.be.a('number');
  user.should.have.property('friends_count').with.be.a('number');
  user.should.have.property('statuses_count').with.be.a('number');
  user.should.have.property('favourites_count').with.be.a('number');
  if ('created_at' in user) {
    user.created_at.constructor.should.equal(Date);
  }
  user.should.have.property('following').with.be.a('boolean');
  if ('allow_all_act_msg' in user) {
    user.allow_all_act_msg.should.be.a('boolean');
  }
  if ('geo_enabled' in user) {
    user.geo_enabled.should.be.a('boolean');
  }
  user.should.have.property('verified').with.be.a('boolean');
  if ('verified_type' in user) {
    user.verified_type.should.be.a('number');
  }
  if ('verified_reason' in user) {
    user.verified_reason.should.be.a('string');
  }
  if ('remark' in user) {
    user.remark.should.be.a('string');
  }
  if ('allow_all_comment' in user) {
    user.allow_all_comment.should.be.a('boolean');
  }
  user.should.have.property('follow_me').with.be.a('boolean');
  if ('online_status' in user) {
    user.online_status.should.be.a('number');
  }
  if ('bi_followers_count' in user) {
    user.bi_followers_count.should.be.a('number');
  }
  if ('lang' in user) {
    user.lang.should.be.a('string');
  }
  if (user.status) {
    checkStatus(user.status);
  }
}

function checkStatus(status) {
  status.should.have.property('id').with.match(/^\d+$/);
  if (status.deleted) {
    return;
  }
  status.t_url.should.match(/^http:\/\//);
  status.should.have.property('created_at').with.be.an.instanceof(Date);
  should.ok(status.created_at);
  status.text.should.be.a('string');
  status.should.have.property('source').with.match(/<a/);
  if (status.thumbnail_pic) {
    status.thumbnail_pic.should.match(/^http:\/\//);
    status.bmiddle_pic.should.match(/^http:\/\//);
    status.original_pic.should.match(/^http:\/\//);
  }
  if (status.user) {
    checkUser(status.user);
  }
  status.should.have.property('reposts_count').with.be.a('number');
  status.should.have.property('comments_count').with.be.a('number');
  if (status.retweeted_status && !status.retweeted_status.deleted) {
    checkStatus(status.retweeted_status);
  }
  if (status.geo) {
    checkGEO(status.geo);
  }
}

function checkComment(comment) {
  comment.id.should.be.a('string').with.match(/^\d+$/);
  comment.should.have.property('created_at').with.be.an.instanceof(Date);
  comment.text.should.be.a('string');
  comment.source.should.be.a('string');
  checkUser(comment.user);
  if (comment.status) {
    checkStatus(comment.status);
  }
  if (comment.reply_comment) {
    checkComment(comment.reply_comment);
  }
}

function checkGEO(geo) {
  geo.should.have.property('longitude').with.be.a('string');
  geo.should.have.property('latitude').with.be.a('string');
  if (geo.address) {
    geo.should.have.property('address').with.be.a('string');
  }
  if ('city_name' in geo) {
    geo.city_name.should.be.a('string');
  }
  if ('province_name' in geo) {
    geo.province_name.should.be.a('string');
  }
}

