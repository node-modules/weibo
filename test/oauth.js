/*!
 * node-weibo - oauth test
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth = require('../lib/oauth');

describe('oauth test', function () {

  it('should return second timestamp', function () {
    oauth.timestamp().toString().should.length((new Date().getTime() / 1000).toFixed(0).length);
  });
  
  it('should return nonce', function () {
    for (var i = 0; i < 100; i++) {
      oauth.nonce(i).should.length(i);
    }
    oauth.nonce().should.length(0);
  });

});