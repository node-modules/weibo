# Unity API

All apis and data in `node-weibo` will convert to this unity format.

## Read

## Write

## Search

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
|favorited|bool|favorited it not or|`true`|
|thumbnail_pic|string|thumbnail size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/thumbnail/61e63796gw1dx9o35biuwj.jpg'`|
|bmiddle_pic|string|middle size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/bmiddle/61e63796gw1dx9o35biuwj.jpg'`|
|original_pic|string|original size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/large/61e63796gw1dx9o35biuwj.jpg'`|
|geo|GEO|GEO infomation, see [GEO]|`{}` or `null`|
|user|User|Status's author, see [User] |`{screen_name: 'fengmk2', ...}`|
|reposts_count|Number|Reposts count|`1000`|
|comments_count|Number|Comments count|`100`|
|retweeted_status|Status|Repost status|`{id: "123111", ...}`|

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
            "created_at": "Sat Nov 14 00:00:00 +0800 2009",
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

### User

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|id|string|User ID|`"110111"`|
|t_url|string|User profile url|`'http://weibo.com/imk2'`|
|screen_name|string|nick name|`'FaWave'`|
|name|string|other name|`'falang'`|
|location|string|user's location|`'广东 广州'`|
|description|string|personal description|`'My name is FaWave'`|
|url|string|User blog url|`'http://fengmk2.github.com'`|
|profile_image_url|string|User profile image, size: 50×50|`'http://tp1.sinaimg.cn/1404376560/50/0/1'`|
|avatar_large|string|avatar image, size: 180x180|`'http://tp1.sinaimg.cn/1404376560/180/0/1'`|
|gender|string|User gender, m: male, f: female, n: unknow|`'m'` or `'f'` or `'n'`|
|followers_count|Number|follower count|`100`|
|friends_count|Number|following count|`99`|
|statuses_count|Number|Send [Status] count|`1024`|
|favourites_count|Number|Favouried [Status] count|`10`|
|created_at|string|User register datetime|`new Date("Fri Aug 28 00:00:00 +0800 2009")`|
|following|boolean|follow by me or not|`true`|
|allow_all_act_msg|bool|allow everyone to send message or no|`true`|
|geo_enabled|bool|enable [GEO] or not|`false`|
|verified|bool|User verified or not|`true`|
|verified_type|Number|verified type|`0`|
|verified_reason|string|verified reason|`'FaWave author'`|
|remark|string|remark text by me|`'He is MK2'`|
|allow_all_comment|bool|allow everyone to comment or not|`true`|
|follow_me|bool|User follow me or not|`true`|
|online_status|Number|User online status, 0: online, 1: offline|`1`|
|bi_followers_count|Number|follow each other count|`10`|
|lang|string|User select language, `zh-cn`: 简体中文，`zh-tw`: 繁体中文，`en`: English|`'zh-cn'`|
|status|[Status]|User recently [Status]|`{id: "123123", text: "hi", ...}`|

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

### Cursor

### GEO

 [Status]: #status
 [GEO]: #geo
 [User]: #user