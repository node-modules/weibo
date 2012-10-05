
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
