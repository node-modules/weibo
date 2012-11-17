# Unity API

All apis and data in `node-weibo` will convert to this unity format.

|API name|Description|Support blogtype|
|--------|-----------|:--------------:|
| **[Status](#status) APIs** |||
| Write |||
|  * [update](#update)(user, status, callback)|Post a status|[weibo], [tqq]|
|  * [upload](#upload)(user, status, pic, callback)|Post a status contain an image|[weibo], [tqq]|
|  * [repost](#repost)(user, id, status, callback)|Repost a status|[weibo], [tqq]|
|  * [destroy](#destroy)(user, id, callback)|Remove a status by id|[weibo], [tqq]|
| Read |||
|  * [show](#show)(user, id, callback)|Get a status by id|[weibo], [tqq]|
|  * [count](#status_count)(user, ids, callback)|Get statuses comment count and repost count by ids|[weibo], [tqq]|
|  * [home_timeline](#home_timeline)(user[, cursor], callback)|List user home timeline statuses|[weibo], [tqq]|
|  * [user_timeline](#user_timeline)(user[, cursor], callback)|List user personal timeline statuses|[weibo], [tqq]|
|  * [public_timeline](#public_timeline)(user[, cursor], callback)|List public timeline statuses|[weibo], [tqq]|
|  * [mentions](#mentions)(user[, cursor], callback)|List @me timeline statuses|[weibo], [tqq]|
|  * [repost_timeline](#repost_timeline)(user, id[, cursor], callback)|List one status's reposted statuses|[weibo], [tqq]|
|  * [search](#search-statuses)(user, query, cursor, callback)|Search statues|[tqq]|
|  * [process_text](#process_text)(user, status)|Process text to display html format.|[weibo]|
| **[Comment](#comment) APIs** |||
| Write |||
|  * [comment_create](#comment_create)(user, id, comment, callback)|post a comment to a status|[weibo], [tqq]|
|  * [comment_destroy](#comment_destroy)(user, cid, callback)|remove a comment|[weibo]|
|  * [comment_reply](#comment_reply)(user, cid, id, comment, callback)|reply to a comment|[weibo], [tqq]|
| Read |||
|  * [comments](#comments)(user, id[, cursor], callback)|List one status's comments|[weibo], [tqq]|
|  * [comments_mentions](#comments_mentions)(user[, cursor], callback)|List @me comments|[weibo]|
|  * [comments_timeline](#comments_timeline)(user[, cursor], callback)|List comments to my statues|[weibo], [tqq]|
|  * [comments_to_me](#comments_to_me)(user[, cursor], callback)|List comments to me|[weibo], [tqq]|
|  * [comments_by_me](#comments_by_me)(user[, cursor], callback)|List comments by me|[weibo]|
| **[Favorite](#favorite) APIs** |||
| Write |||
|  * [favorite_create](#favorite_create)(user, id, callback)|Add a status to favorites|[weibo], [tqq]|
|  * [favorite_destroy](#favorite_destroy)(user, id, callback)|Remove the status from favorites|[weibo], [tqq]|
| Read |||
|  * [favorites](#favorites)(user[, cursor], callback)|List favorites|[weibo], [tqq]|
|  * [favorite_show](#favorite_show)(user, id, callback)|Show a favorite item|[weibo], [tqq]|
| **[Friendship](#friendship) APIs** |||
| Write |||
|  * [friendship_create](#friendship_create)(user, uid, screen_name, callback)|Follow a user.|[weibo], [tqq]|
|  * [friendship_destroy](#friendship_destroy)(user, uid, screen_name, callback)|Unfollow a user.|[weibo], [tqq]|
| Read |||
|  * [friendship_show](#friendship_show)(user, id, callback)|Get relation between two users. [tqq] only support current user with others relation.|[weibo], [tqq]|
| **[Message](#message) APIs** |||
| Write |||
|  * [direct_message_create](#direct_message_create)(user, toUser, text, callback)|Sends a new direct message to the specified user from the authenticating user.|[tqq]|
|  * [direct_message_destroy](#direct_message_destroy)(user, id, callback)|Destroys the direct message specified in the required ID parameter.|[tqq]|
| Read |||
|  * [direct_messages_both](#direct_messages_both)(user, cursor, callback)|Returns the direct messages, sent to and sent by the authenticating user.|[tqq]|
|  * [direct_messages](#direct_messages)(user, cursor, callback)|Returns the 20 most recent direct messages sent to the authenticating user.|[tqq]|
|  * [direct_messages_sent](#direct_messages_sent)(user, cursor, callback)|Returns the 20 most recent direct messages sent by the authenticating user.|[tqq]|
|  * [direct_message_show](#direct_message_show)(user, id, callback)|Returns a single direct message, specified by an id parameter.|-|
| **[User] APIs** |||
| Read |||
|  * [verify_credentials](#verify_credentials)(user, callback)|get oauth user profile infomation|[weibo], [tqq], [github]|
|  * [user_show](#user_show)(user, uid[, screen_name], callback)|get user profile infomation by uid|[weibo], [tqq], [github]|
|  * [user_search](#user_search)(user, query, cursor, callback)|Search users by query|[tqq]|
| **[Suggestion] APIs** |||
| Read |||
|  * [search_suggestions_at_users](#search_suggestions_at_users)(user, q, cursor, callback)|Search suggestion users when @somebody|[weibo], [tqq]|
| **[OAuth](#oauth) APIs** |||
| Read |||
|  * [get_authorization_url](#get_authorization_url)(user, callback)|get the user oauth login url|[weibo], [tqq], [github]|
|  * [get_access_token](#get_access_token)(user, callback)|get oauth access token|[weibo], [tqq], [github]|

|Data Structure|
|--------------|
|[Status]|
|[User]|
|[Comment]|
|[Message]|
|[GEO]|
|[Cursor]|
|[Count]|
|[Friendship]|

## Status APIs

### update

```js
/**
 * Post a status
 *
 * @param {User} user, oauth user.
 * @param {String|Object} status
 *  - {String} status, content text.
 *  - {Number} [lat], latitude.
 *  - {Number} [long], longitude.
 *  - {String} [annotations], addtional information.
 * @param {Function(Error, Status)} callback
 * @return {Context} this
 */
update(user, status, callback)
```

### upload

```js
/**
 * Post a status contain an image.
 * 
 * @param {User} user, oauth user.
 * @param {String|Object} status
 *  - {String} status, content text.
 *  - {Number} [lat], latitude.
 *  - {Number} [long], longitude.
 *  - {String} [annotations], addtional information.
 * @param {Object} pic
 *  - {Buffer|ReadStream} data
 *  - {String} [name], image file name
 *  - {String} [content_type], data content type
 *  - {Function(info)} [progress], upload progress callback.
 *   - {Object} info: {total: total Size, loaded: upload Size}.
 * @param {Function(Error, Status)} callback
 * @return {Context} this
 */
upload(user, status, pic, callback)
```

### repost

```js
/**
 * Repost a status.
 * 
 * @param {User} user
 * @param {String|Number} id, need to repost status id.
 * @param {String|Object} status
 *  - {String} status, content text
 *  - {Number} [lat], latitude.
 *  - {Number} [long], longitude.
 *  - {Boolean} isComment, is comment or not, default is `false`.
 * @param {Function(Error, Status)} callback
 * @return {Context} this
 */
repost(user, id, status, callback)
```

### destroy

```js
/**
 * Remove a status by id.
 * 
 * @param {User} user
 * @param {String|Number} id
 * @param {Function(Error, Status)} callback
 * @return {Context} this
 */
destroy(user, id, callback)
```

### show

```js
/**
* Get a status by id.
* 
* @param {User} user
* @param {String|Number} id
* @param {Function(Error, Status)} callback
* @return {Context} this
*/
show(user, id, callback)
```

<a name="status_count"/>
### count

```js
/**
 * Get statuses comment count and repost count by ids.
 * 
 * @param {User} user
 * @param {String|Array} ids, separate by comma.
 * @param {Function(err, counts)} callback
 *   - {String} id
 *   - {Number} comments
 *   - {Number} reposts
 * @return {Context} this
 */
count: function (user, ids, callback)
```

### home_timeline

```js
/**
 * List home timeline statuses.
 * 
 * @param {User} user
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Status, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
home_timeline(user, cursor, callback)
```

### public_timeline

```js
/**
 * List public timeline statuses.
 * 
 * @param {User} user
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Status, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
public_timeline(user, cursor, callback)
```

### user_timeline

```js
/**
 * List user personal timeline statuses.
 * 
 * @param {User} user
 * @param {Cursor} [cursor]
 *  - {String} [uid], user id
 *  - {String} [screen_name], `user.screen_name`, screen_name or uid must be set at least one.
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Status, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
user_timeline(user, cursor, callback)
```

### mentions

```js
/**
 * List @me statuses.
 * 
 * @param {User} user
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Status, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
mentions(user, cursor, callback)
```

### repost_timeline

```js
/**
 * List one status's reposted statuses
 * 
 * @param {User} user
 * @param {String} id, status's id
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 *  - {Number} [filter_by_author], 0: all, 1: only I following、2: stranger, default is `0`.
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Status, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
repost_timeline(user, id[, cursor], callback) 
```

<a name="search-statuses" />
### search

```js
/**
 * Search statuses by query.
 * 
 * @param {AccessToken} user
 * @param {String|Object} query
 *  - {String} q, query keyword
 *  - {String} [long], longitude
 *  - {String} [lat], latitude
 *  - {String} [radius], radius for longitude and latitude.
 * @param {Cursor} [cursor]
 *  - {Number} [count], default is `20`
 *  - {Number} [page], default is the first page.
 * @param {Function(err, result)} callback
 * @return {Context} this
 */
search: function (user, query, cursor, callback)
```

### process_text

```js
/**
 * Process text to display format.
 * 
 * @param {User} user
 * @param {Status} status
 * @return {String}
 */
process_text: function (user, status)
```

## Suggestion APIs

### search_suggestions_at_users

```js
/**
 * Search suggestion users when @somebody.
 * 
 * @param {User} user
 * @param {String} q, search keyword
 * @param {Object} [cursor]
 *  - {Number} [count], return records number, default is `10`.
 *  - {Number} [type], suggestion type, 0: I following, 1: My followers. default is `0`.
 *  - {Number} [range], suggestion search range, 0: only screen_name, 1: only remark, 2: both. default is `2`.
 * @param {Function(err, result)} callback
 *  - {Object} result:
 *   - {Array} items: [ SuggetionUser, ... ]
 *    - {SuggetionUser} { id: '123123', screen_name: 'QLeeLulu', remark: '' }
 */
search_suggestions_at_users: function (user, q, cursor, callback)
```

## OAuth APIs

### get_authorization_url

```js
/**
 * Get authorization token and login url.
 * 
 * @param {Object} user
 *  - {String} blogtype, 'weibo' or other blog type,
 *  - {String} oauth_callback, 'login callback url' or 'oob'
 * @param {Function(err, auth_info)} callback
 *  - {Object} auth_info
 *   - {String} auth_url: 'http://xxxx/auth?xxx',
 *   - {String} oauth_token: $oauth_token,
 *   - {String} oauth_token_secret: $oauth_token_secret
 * @return {Context} this, blogType api.
 */
get_authorization_url: function (user, callback)
```

### get_access_token

```js
/**
 * Get access token.
 * 
 * @param {Object} user
 *  - {String} blogtype
 *  - {String} oauth_token, authorization `oauth_token`
 *  - {String} oauth_verifier, authorization `oauth_verifier`
 *  - {String} oauth_token_secret, request token secret
 * @param {Function(err, token)} callback
 *  - {Object} token
 *   - {String} oauth_token
 *   - {String} oauth_token_secret
 * @return {Context} this
 */
get_access_token: function (user, callback)
```

## User APIs

### verify_credentials

```js
/**
 * Get user profile infomation by access token.
 * 
 * @param {Object} user
 *  - {String} blogtype
 *  - {String} oauth_token, access oauth token
 *  - {String} [oauth_token_secret], access oauth token secret, oauth v2 don't need this param.
 * @param {Function(err, User)} callback
 * @return {Context} this
 */
verify_credentials: function (user, callback)
```

### user_show

```js
/**
  * Get user profile infomation by uid or screen_name.
  *
  * @param {Object} user
  *  - {String} blogtype
  *  - {String} oauth_token, access token
  *  - {String} [oauth_token_secret], access oauth token secret, oauth v2 don't need this param.
  * @param {String} [uid], user id
  * @param {String} [screen_name], user screen_name
  *   uid and screen_name MUST set one. If set both, will use `screen_name`.
  *   `tqq` do not support `screen_name`.
  * @param {Function(err, User)} callback
  * @return {Context} this
  */
user_show: function (user, uid, screen_name, callback)
```

### user_search

```js
/**
 * Search users by query.
 * @param {User} user
 * @param {String} query
 * @param {Object} cursor
 * @param {Function(err, result)} callback
 */
user_search: function (user, query, cursor, callback)
```

## Comment APIs

### comments_timeline

```js
/**
* List comments to my statues
* 
* @param {User} user
* @param {Cursor} [cursor]
*  - {String} since_id
*  - {String} max_id
*  - {String} [since_time], only for tqq
*  - {String} [max_time], only for tqq
*  - {Number} count, default is `20`
*  - {Number} page
* @param {Function(err, result)} callback
*  {Object} result:
*   - {Array} items, [Comment, ...]
*   - {Cursor} cursor
*   - ...
* @return {Context} this
*/
comments_timeline: function (user, cursor, callback)
```

### comments_mentions

```js
/**
* List @me comments
* 
* @param {User} user
* @param {Cursor} [cursor]
*  - {String} since_id
*  - {String} max_id
*  - {Number} count, default is `20`
*  - {Number} page
* @param {Function(err, result)} callback
*  {Object} result:
*   - {Array} items, [Comment, ...]
*   - {Cursor} cursor
*   - ...
* @return {Context} this
*/
comments_mentions: function (user, cursor, callback)
```

### comments_to_me

```js
/**
* List comments to me
* 
* @param {User} user
* @param {Cursor} [cursor]
*  - {String} [since_id]
*  - {String} [max_id]
*  - {Number} [count], default is `20`
*  - {Number} [page]
*  - {Number} [filter_by_author], only support by `weibo`;
*    Filter comments by author type, 0: all, 1: I following, 2: stranger, default is `0`.
*  - {Number} [filter_by_source], only support by `weibo`;
*    Filter comments by source type, 0: all, 1: come from weibo, 2: come from weiqun, default is `0`.
* @param {Function(err, result)} callback
*  {Object} result:
*   - {Array} items, [Comment, ...]
*   - {Cursor} cursor
*   - ...
* @return {Context} this
*/
comments_to_me: function (user, cursor, callback)
```

### comments_by_me

```js
/**
* List comments post by me
* 
* @param {User} user
* @param {Cursor} [cursor]
*  - {String} since_id
*  - {String} max_id
*  - {Number} count, default is `20`
*  - {Number} page
*  - {Number} [filter_by_source], only support by `weibo`;
*    Filter comments by source type, 0: all, 1: come from weibo, 2: come from weiqun, default is `0`.
* @param {Function(err, result)} callback
*  {Object} result:
*   - {Array} items, [Comment, ...]
*   - {Cursor} cursor
*   - ...
* @return {Context} this
*/
comments_by_me: function (user, cursor, callback)
```

### comments

```js
/**
 * List one status's comments
 * 
 * @param {User} user
 * @param {String} id, status's id
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 *  - {Number} [filter_by_author], 0: all, 1: only I following、2: stranger, default is `0`.
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Comment, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
comments(user, id[, cursor], callback) {
```

### comment_create

```js
/**
 * post a comment to a status
 * 
 * @param {AccessToken} user
 * @param {String} id, status's id
 * @param {String|Object} comment
 *  - {String} comment
 *  - {Number} [comment_ori], same comment to the original status when comment on a repost status,
 *    0: no, 1: yes, default is `0`.
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} id, the comment id
 * @return {Context} this
 */
comment_create: function (user, id, comment, callback)
```

### comment_reply

```js
/**
 * reply to a comment
 * @param {AccessToken} user
 * @param {String} cid, comment's id
 * @param {String} id, status's id
 * @param {String|Object} comment
 *  - {String} comment
 *  - {Number} [without_mention], auto add `'reply@username'` to comment text or not,
 *    0: yes, 1: no, default is `1`, won't auto add.
 *  - {Number} [comment_ori], same comment to the original status when comment on a repost status,
 *    0: no, 1: yes, default is `0`.
 * @param {Function(err, result)} callback
 * @return {Context} this
 */
comment_reply: function (user, cid, id, comment, callback)
```

### comment_destroy

```js
/**
 * remove a comment
 * @param {AccessToken} user
 * @param {String} cid, comment's id
 * @param {Function(err, result)} callback
 * @return {Context} this
 */
comment_destroy: function (user, cid, callback) {
```

## Favorite APIs

### favorites

```js
/**
 * List favorites.
 * 
 * @param {User} user
 * @param {Cursor} [cursor]
 *  - {String} since_id
 *  - {String} max_id
 *  - {String} [since_time], only for tqq
 *  - {String} [max_time], only for tqq
 *  - {Number} count, default is `20`
 *  - {Number} page
 * @param {Function(err, result)} callback
 *  {Object} result:
 *   - {Array} items, [Favorite, ...]
 *   - {Cursor} cursor
 *   - ...
 * @return {Context} this
 */
favorites: function (user, cursor, callback)
```

### favorite_show

```js
/**
 * Show a favorite item by item id.
 * 
 * @param {User} user
 * @param {String} id, favorite item's id.
 * @param {Function(err, favorite)} callback
 * @return {Context} this
 */
favorite_show: function (user, id, callback)
```

### favorite_create

```js
/**
 * Add a status to favorites.
 * 
 * @param {User} user
 * @param {String} id, status's id.
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} id, relation item's id.
 *   - addtional infomation maybe.
 * @return {Context} this
 */
favorite_create: function (user, id, callback)
```

### favorite_destroy

```js
/**
 * Remove the status from favorites.
 * 
 * @param {User} user
 * @param {String} id, the favorite item's id.
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} id, relation item's id.
 *   - addtional infomation maybe.
 * @return {Context} this
 */
favorite_destroy: function (user, id, callback)
```

## Message APIs

### direct_messages_both

```js
/**
 * Returns the direct messages, sent to and sent by the authenticating user.
 * 
 * @param {User} user
 * @param {Object} cursor, pagging params.
 *  - {Number} [count], Specifies the number of records to retrieve.
 *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
 *  - {String} [since_time], only for tqq
 *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
 *  - {String} [max_time], only for tqq
 *  - {Number} [page], Specifies the page of results to retrieve.
 *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
 *  - {Boolean} [skip_status], When set to either true, t or 1 statuses will not be included in the returned user objects.
 * @param {Function(err, result)} callback
 */
direct_messages_both: function (user, cursor, callback)
```

### direct_messages

```js
/**
 * Returns the 20 most recent direct messages sent to the authenticating user.
 * 
 * @param {User} user
 * @param {Object} cursor, pagging params.
 *  - {Number} [count], Specifies the number of records to retrieve.
 *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
 *  - {String} [since_time], only for tqq
 *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
 *  - {String} [max_time], only for tqq
 *  - {Number} [page], Specifies the page of results to retrieve.
 *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
 *  - {Boolean} [skip_status], When set to either true, t or 1 statuses will not be included in the returned user objects.
 * @param {Function(err, result)} callback
 */
direct_messages: function (user, cursor, callback)
```

### direct_messages_sent

```js
/**
 * Returns the 20 most recent direct messages sent by the authenticating user.
 * 
 * @param {User} user
 * @param {Object} cursor, pagging params.
 *  - {Number} [count], Specifies the number of records to retrieve.
 *  - {String} [since_id], Returns results with an ID greater than (that is, more recent than) the specified ID.
 *  - {String} [since_time], only for tqq
 *  - {String} [max_id], Returns results with an ID less than (that is, older than) the specified ID.
 *  - {String} [max_time], only for tqq
 *  - {Number} [page], Specifies the page of results to retrieve.
 *  - {Boolean} [include_entities], The entities node will not be included when set to `false`.
 * @param {Function(err, result)} callback
 */
direct_messages_sent: function (user, cursor, callback)
```

### direct_message_show

```js
/**
 * Returns a single direct message, specified by an id parameter.
 * @param {User} user
 * @param {String} id, The ID of the direct message.
 * @param {Function(err, message)} callback
 */
direct_message_show: function (user, id, callback)
```

### direct_message_create

```js
/**
 * Sends a new direct message to the specified user from the authenticating user.
 * @param {User} user
 * @param {Object} toUser, One of uid or screen_name are required.
 *  - {String} uid, The ID of the user who should receive the direct message.
 *  - {String} screen_name, The screen name of the user who should receive the direct message.
 * @param {String} text, The text of your direct message. Be sure to URL encode as necessary.
 * @param {Function(err, result)} callback
 */
direct_message_create: function (user, toUser, text, callback)
```

### direct_message_destroy

```js
/**
 * Destroys the direct message specified in the required ID parameter.
 * @param {User} user
 * @param {String} id, The ID of the direct message to delete.
 * @param {Function(err, result)} callback
 */
direct_message_destroy: function (user, id, callback)
```

## Data Structure

### Status

Tweet in Twitter.

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|String|ID|`'3335688'`|
|t_url|String|Status unity url|`'http://weibo.com/1577826897/yDH17Ex4f'`|
|created_at|Date|Status create datetime|`new Date('Wed Sep 26 2012 19:18:39 GMT+0800 (CST)')`|
|text|string|Content text|`'My name is node-weibo api.'`|
|source|string|Content source|`'<a href="http://github.com/fengmk2/node-weibo">node-weibo</a>'`|
|[favorited]|bool|favorited it not or, default is `false`|`false`|
|[thumbnail_pic]|string|thumbnail size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/thumbnail/61e63796gw1dx9o35biuwj.jpg'`|
|[bmiddle_pic]|string|middle size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/bmiddle/61e63796gw1dx9o35biuwj.jpg'`|
|[original_pic]|string|original image url, `undefined` if empty|`'http://ww1.sinaimg.cn/large/61e63796gw1dx9o35biuwj.jpg'`|
|[geo]|GEO|GEO infomation, see [GEO]|`{}` or `null`|
|[user]|User|Status's author, see [User] |`{screen_name: 'fengmk2', ...}`|
|reposts_count|Number|Reposts count|`1000`|
|comments_count|Number|Comments count|`100`|
|[retweeted_status]|Status|Repost status|`{id: "123111", ...}`|

Demo:

```js
{
    "created_at": new Date("Tue May 31 17:46:55 +0800 2011"),
    "id": "11488058246",
    "t_url": "http://weibo.com/1577826897/yDH17Ex4f",
    "text": "求关注。"，
    "source": "<a href="http://weibo.com" rel="nofollow">新浪微博</a>",
    "favorited": false,
    "geo": null,
    "reposts_count": 8,
    "comments_count": 9,
    "original_pic": "http://ww1.sinaimg.cn/large/61e63796gw1dx9o35biuwj.jpg",
    "bmiddle_pic": "http://ww1.sinaimg.cn/bmiddle/61e63796gw1dx9o35biuwj.jpg",
    "thumbnail_pic": "http://ww1.sinaimg.cn/thumbnail/61e63796gw1dx9o35biuwj.jpg",
    "user": {
        "id": "1404376560",
        "t_url": "http://weibo.com/imk2",
        "screen_name": "zaku",
        "name": "zaku",
        "location": "北京 朝阳区",
        "description": "人生五十年，乃如梦如幻；有生斯有死，壮士复何憾。",
        "url": "http://blog.sina.com.cn/zaku",
        "profile_image_url": "http://tp1.sinaimg.cn/1404376560/50/0/1",
        "domain": "zaku",
        "gender": "m",
        "followers_count": 1204,
        "friends_count": 447,
        "statuses_count": 2908,
        "favourites_count": 0,
        "created_at": new Date("Fri Aug 28 00:00:00 +0800 2009"),
        "following": false,
        "allow_all_act_msg": false,
        "remark": "",
        "geo_enabled": true,
        "verified": false,
        "allow_all_comment": true,
        "avatar_large": "http://tp1.sinaimg.cn/1404376560/180/0/1",
        "verified_reason": "",
        "follow_me": false,
        "online_status": 0,
        "bi_followers_count": 215
    },
    "retweeted_status": {
        "created_at": new Date("Tue May 24 18:04:53 +0800 2011"),
        "id": "11142488790",
        "t_url": "http://weibo.com/1577826897/yDH17Ex4f",
        "text": "我的相机到了。",
        "source": "<a href="http://weibo.com" rel="nofollow">新浪微博</a>",
        "favorited": false,
        "geo": null,
        "reposts_count": 5,
        "comments_count": 8,
        "user": {
            "id": "1073880650",
            "t_url": "http://weibo.com/imk2",
            "screen_name": "檀木幻想",
            "name": "檀木幻想",
            "location": "北京 朝阳区",
            "description": "请访问微博分析家。",
            "url": "http://www.weibo007.com/",
            "profile_image_url": "http://tp3.sinaimg.cn/1073880650/50/1285051202/1",
            "domain": "woodfantasy",
            "gender": "m",
            "followers_count": 723,
            "friends_count": 415,
            "statuses_count": 587,
            "favourites_count": 107,
            "created_at": new Date("Sat Nov 14 00:00:00 +0800 2009"),
            "following": true,
            "allow_all_act_msg": true,
            "remark": "",
            "geo_enabled": true,
            "verified": false,
            "allow_all_comment": true,
            "avatar_large": "http://tp3.sinaimg.cn/1073880650/180/1285051202/1",
            "verified_reason": "",
            "follow_me": true,
            "online_status": 0,
            "bi_followers_count": 199
        }
    }
}
```

### Comment

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|string|Comment ID|`"110111"`|
|created_at|string|Created datetime|`new Date("Fri Aug 28 00:00:00 +0800 2009")`|
|text|string|Comment text|`"Hello world"`|
|source|string|Create source|`"<a href="http://weibo.com" rel="nofollow">新浪微博</a>"`|
|user|[User]|Comment author|`{screen_name: "fengmk2", ...}`|
|status|[Status]|Comment's parent [Status]|`{id: "123123123", ...}`|
|[reply_comment]|[Comment]|Reply to [Comment]|`{id: "123123", ...}`|

Demo:

```js
{
    "created_at": new Date("Wed Jun 01 00:50:25 +0800 2011"),
    "id": "12438492184",
    "text": "love your work.......",
    "source": "<a href="http://weibo.com" rel="nofollow">新浪微博</a>",
    "user": {
        "id": "1404376560",
        "screen_name": "zaku",
        "name": "zaku",
        "location": "北京 朝阳区",
        "description": "人生五十年，乃如梦如幻；有生斯有死，壮士复何憾。",
        "url": "http://blog.sina.com.cn/zaku",
        "profile_image_url": "http://tp1.sinaimg.cn/1404376560/50/0/1",
        "domain": "zaku",
        "gender": "m",
        "followers_count": 1204,
        "friends_count": 447,
        "statuses_count": 2908,
        "favourites_count": 0,
        "created_at": new Date("Fri Aug 28 00:00:00 +0800 2009"),
        "following": false,
        "allow_all_act_msg": false,
        "remark": "",
        "geo_enabled": true,
        "verified": false,
        "allow_all_comment": true,
        "avatar_large": "http://tp1.sinaimg.cn/1404376560/180/0/1",
        "verified_reason": "",
        "follow_me": false,
        "online_status": 0,
        "bi_followers_count": 215
    },
    "status": {
        "created_at": new Date("Tue May 31 17:46:55 +0800 2011"),
        "id": "11488058246",
        "text": "求关注。"，
        "source": "<a href="http://weibo.com" rel="nofollow">新浪微博</a>",
        "favorited": false,
        "truncated": false,
        "geo": null,
        "reposts_count": 8,
        "comments_count": 9,
        "user": {
            "id": "1404376560",
            "screen_name": "zaku",
            "name": "zaku",
            "location": "北京 朝阳区",
            "description": "人生五十年，乃如梦如幻；有生斯有死，壮士复何憾。",
            "url": "http://blog.sina.com.cn/zaku",
            "profile_image_url": "http://tp1.sinaimg.cn/1404376560/50/0/1",
            "domain": "zaku",
            "gender": "m",
            "followers_count": 1204,
            "friends_count": 447,
            "statuses_count": 2908,
            "favourites_count": 0,
            "created_at": new Date("Fri Aug 28 00:00:00 +0800 2009"),
            "following": false,
            "allow_all_act_msg": false,
            "remark": "",
            "geo_enabled": true,
            "verified": false,
            "allow_all_comment": true,
            "avatar_large": "http://tp1.sinaimg.cn/1404376560/180/0/1",
            "verified_reason": "",
            "follow_me": false,
            "online_status": 0,
            "bi_followers_count": 215
        }
    }
}
```

<a name="user_structure" />
### User

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|string|User ID|`"110111"`|
|t_url|string|User profile url|`'http://weibo.com/imk2'`|
|screen_name|string|nick name|`'FaWave'`|
|name|string|other name|`'falang'`|
|location|string|user's location|`'广东 广州'`|
|[description]|string|personal description|`'My name is FaWave'`|
|[url]|string|User blog url|`'http://fengmk2.github.com'`|
|profile_image_url|string|User profile image, size: 50×50|`'http://tp1.sinaimg.cn/1404376560/50/0/1'`|
|avatar_large|string|avatar image, size: 180x180|`'http://tp1.sinaimg.cn/1404376560/180/0/1'`|
|gender|string|User gender, m: male, f: female, n: unknow|`'m'` or `'f'` or `'n'`|
|followers_count|Number|follower count|`100`|
|friends_count|Number|following count|`99`|
|statuses_count|Number|Send [Status] count|`1024`|
|favourites_count|Number|Favouried [Status] count|`10`|
|created_at|string|User register datetime|`new Date("Fri Aug 28 00:00:00 +0800 2009")`|
|[following]|boolean|follow by me or not|`true`|
|[allow_all_act_msg]|bool|allow everyone to send message or no|`true`|
|[geo_enabled]|bool|enable [GEO] or not|`false`|
|verified|bool|User verified or not|`true`|
|[verified_type]|Number|verified type|`0`|
|[verified_reason]|string|verified reason|`'FaWave author'`|
|[remark]|string|remark text by me|`'He is MK2'`|
|[allow_all_comment]|bool|allow everyone to comment or not|`true`|
|[follow_me]|bool|User follow me or not|`true`|
|[online_status]|Number|User online status, 0: online, 1: offline|`1`|
|[bi_followers_count]|Number|follow each other count|`10`|
|[lang]|string|User select language, `zh-cn`: 简体中文，`zh-tw`: 繁体中文，`en`: English|`'zh-cn'`|
|[status]|[Status]|User recently [Status]|`{id: "123123", text: "hi", ...}`|

Demo:

```json
{
    "id": "1404376560",
    "t_url": "http://weibo.com/imk2",
    "screen_name": "zaku",
    "name": "zaku",
    "location": "北京 朝阳区",
    "description": "人生五十年，乃如梦如幻；有生斯有死，壮士复何憾。",
    "url": "http://blog.sina.com.cn/zaku",
    "profile_image_url": "http://tp1.sinaimg.cn/1404376560/50/0/1",
    "domain": "zaku",
    "gender": "m",
    "followers_count": 1204,
    "friends_count": 447,
    "statuses_count": 2908,
    "favourites_count": 0,
    "created_at": new Date("Fri Aug 28 00:00:00 +0800 2009"),
    "following": false,
    "allow_all_act_msg": false,
    "geo_enabled": true,
    "verified": false,
    "status": {
        "created_at": new Date("Tue May 24 18:04:53 +0800 2011"),
        "id": "11142488790",
        "t_url": "http://weibo.com/1577826897/yDH17Ex4f",
        "text": "我的相机到了。",
        "source": "<a href="http://weibo.com" rel="nofollow">新浪微博</a>",
        "favorited": false,
        "geo": null,
        "reposts_count": 5,
        "comments_count": 8
    },
    "allow_all_comment": true,
    "avatar_large": "http://tp1.sinaimg.cn/1404376560/180/0/1",
    "verified_reason": "",
    "follow_me": false,
    "online_status": 0,
    "bi_followers_count": 215
}
```

### Message

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|string|Message ID|`"110111"`|
|text|string|content text|`"this is a message."`|
|created_at|Date|message sent datetime|`new Date("Tue May 24 18:04:53 +0800 2011")`|
|sender|[User]|message sender|`{screen_name: "fengmk2", ...}`|
|[recipient]|[User]|message recipient|`{id: "1233", ...}`|
|[source]|string|message source|`'<a href="http://github.com/fengmk2/node-weibo">node-weibo</a>'`|

Demo:

```js
{
  id: "123",
  text: "This is a message",
  created_at: new Date("Tue May 24 18:04:53 +0800 2011"),
  sender: { ... },
  recipient: { ... }
}
```

### Cursor

Pagging cursor.

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|[since_id]|string|return statues which id > this id|`"110111"`|
|[max_id]|string|return statues which id <= this id|`"110111"`|
|[count]|Number|record count per page, default is `20`|`100`|
|[page]|Number|page number, default is `1`|`10`|

Demo:

```js
{
  "since_id": "123123",
  "count": 20
}
```

### GEO

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|longitude|string|Longitude|`"116.39794"`|
|latitude|string|Latitude|`"39.90817"`|
|[address]|string|Address, maybe empty|`""`|
|[city_name]|string|City name|`"广州"`|
|[province_name]|string|Province name|`"广东"`|

Demo:

```js
{
    "longitude": "116.39794",
    "latitude": "39.90817",
    "city": "11",
    "province": "32",
    "city_name": "北京",
    "province_name": "朝阳区",
    "address": "中国北京市海淀区中关村"
}
```

<a name="count_structure" />
### Count

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|string|Status's id|`"32817222"`|
|comments|Number|Comment's count|`16`|
|reposts|Number|Repost statuses's count|`38`|
|[attitudes]|Number|attitudes's count, only [weibo] support now.|`10`|

Demo:

```js
[
  {
    "id": "32817222",
    "comments": 16,
    "reposts": 38,
    "attitudes": 10
  },
 ...
]
```

### Favorite

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|status|[Status]|Status detail infomation|`{id: "123123", text: "foo", ...}`|
|[tags]|Array|Favorite item's tag list|`[{id: '123', tag: 'funny'}, ...]`|
|[created_at]|Date|favorite item create time|`new Date("Thu Jun 02 15:16:16 +0800 2011")`|

Demo:

```js
{
  "status": {
    "id": "11488058246",
    "text": "求关注。"，
    // ...
  },
  "tags": [
    {
      "id": 23,
      "tag": "80后"
    },
    // ...
  ],
  "favorited_time": new Date("Thu Jun 02 15:16:16 +0800 2011")
}
```

### Friendship

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|target|Object|Target user follow source user detail|`{id: "123123", followed_by: true, ...}`|
|source|Object|Source user follow target user detail|`{id: "999", following: true, ...}`|

Demo:

```js
{
  "target": {
    "id": 1418348195,
    "screen_name": "zaku",
    "followed_by": false, // followed by source
    "following": false, // following the source
    "notifications_enabled": false
  },
  "source": {
    "id": 1734528095,
    "screen_name": "檀木幻想",
    "followed_by": false, // followed by target
    "following": false, // following the target
    "notifications_enabled": false
  }
}
```

## Suggestion

### SuggestionUser

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|String|User id|`"123123"`|
|screen_name|String|User screen display name|`"QLeeLulu"`|
|remark|String|Remark infomation|`"Some guy I meeting in github."`|

Demo:

```js
{ id: '123123', screen_name: 'QLeeLulu', remark: '' }
```

## OAuth

### RequestToken

|Field name|Data Type|
|----------|---------|
|oauth_token|string|
|oauth_token_secret|string|

### AccessToken

|Field name|Data Type|
|----------|---------|
|oauth_token|string|
|oauth_token_secret|string|

### V1.0

![oauth v1.0](http://ww2.sinaimg.cn/large/6cfc7910jw1dxbmrsksvsj.jpg)

### V2.0

![oauth v2.0](http://ww2.sinaimg.cn/large/6cfc7910jw1dxbms40ti8j.jpg)




  [Status]: #status
  [User]: #user_structure
  [Comment]: #comment
  [Message]: #message
  [GEO]: #geo
  [Cursor]: #cursor
  [Count]: #count_structure
  [Friendship]: #friendship
  [Suggestion]: #suggestion
  [weibo]: http://open.weibo.com
  [tqq]: http://dev.t.qq.com
  [t163]: http://open.t.163.com
  [tsohu]: http://open.t.sohu.com
  [github]: http://dev.github.com
  [twitter]: https://dev.twitter.com


