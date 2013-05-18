
0.6.9 / 2013-05-18 
==================

  * fix redirect_url bug: #32 (@hbbalfred)

0.6.8 / 2013-02-04 
==================

  * Merge pull request #28 from im007boy/master
  * Update lib/tapi.js

0.6.7 / 2012-11-17 
==================

  * fixed #26 support direct_message_create and destroy
  * npm ignore logo.png
  * add logo

0.6.6 / 2012-10-08 
==================

  * let tqq support comments_to_me.
  * let TQQAPI.prototype.comments_to_me equal comments_timeline on tqq.
  * only test with tqq now.
  * fixed ep 0.1.3 not export EventProxy problem.
  * let tqq support user_search and at user suggestions.

0.6.5 / 2012-10-07 
==================

  * add search_suggestions_at_users()
  * remove _blank for alink

0.6.4 / 2012-10-05 
==================

  * fixed direct_messages_both duplite bug.
  * add direct_messages() apis
  * add tqq friendship_show()
  * follow and unfollow
  * add friend ship
  * add emotions and @user text process.
  * fixed since_id include in timeline api; fixed count() dont not suppport many ids problem.
  * fixed tqq timeline pagging problem.
  * upload support progress callback.

0.6.3 / 2012-10-01 
==================

  * add favorites apis: favorites(), favorite_create(), favorite_destroy(), favorite_show().
  * add jscoverage result to readme.md.
  * add count() for status.
  * add text process helpers.

0.6.2 / 2012-09-29
==================

* remove mime dependency.
* add browser env demo on examples/browser.
* add browser test on test/browser/weibo_browser_test.html.

0.6.1 / 2012-09-29
==================

* Refactor core code.
* All TAPI inherits from `TBase`.
* `WeiboAPI` support weibo api 2.0 now.
* only support node >= 0.8.0.
* all support apis test pass.
* use browserify to support browser env.

0.5.1 / 2012-09-26
==================

* let oauth middleware support login callback and logout callback.

0.5.0 / 2012-07-22
==================

* support github oauth.
