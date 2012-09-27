# Unity API

All apis and data in `node-weibo` will convert to this unity format.

|API name|Description|Support blogtype|
|--------|-----------|:--------------:|
| **[Status](#status) APIs** |||
| Write |||
|  * [update](#update)(user, status, callback)|Post a status|all|
|  * [upload](#upload)(user, status, pic, callback)|Post a status contain an image|all|
|  * [repost](#repost)(user, id, status, callback)|Repost a status|all|
|  * [destroy](#destroy)(user, id, callback)|Remove a status by id|all|
| Read |||
|  * [show](#show)(user, id, callback)|Get a status by id|all|
|  * [home_timeline](#home_timeline)(user[, cursor], callback)|List user home timeline statuses|all|
|  * [user_timeline](#user_timeline)(user[, cursor], callback)|List user personal timeline statuses|all|
|  * [public_timeline](#public_timeline)(user[, cursor], callback)|List public timeline statuses|all|
|  * [mentions](#mentions)(user[, cursor], callback)|List @me timeline statuses|all|
|  * [comments_mentions](#comments_mentions)(user[, cursor], callback)|List @me comments|weibo|
|  * [comments_timeline](#comments_timeline)(user[, cursor], callback)|List comments to my statues|all|
|  * [repost_timeline](#repost_timeline)(user, id[, cursor], callback)|List one status's reposted statuses|all|
|  * [comments](#comments)(user, id[, cursor], callback)|List one status's comments|all|
|  * [search](#search)(user, query, callback)|Search statues|all|
| **[Comment](#comment) APIs** |||
| Write |||
| Read |||
| **[User](#user) APIs** |||
| Write |||
| Read |||

|Data Structure|
|--------------|
|[Status]|
|[User]|
|[Comment]|
|[Message]|
|[GEO]|
|[Cursor]|

## Read

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

### search

## Write

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
|recipient|[User]|message recipient|`{id: "1233", ...}`|

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
|address|string|Address, maybe empty|`""`|
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

  [Status]: #status
  [User]: #user
  [Comment]: #commnet
  [Message]: #message
  [GEO]: #geo
  [Cursor]: #cursor
