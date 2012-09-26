# Unity API

## Read

## Write

## Search

## Data Structure

### Status

Tweet in Twitter.

|Field name|Data Type|Description|Demo|
|----------|---------|-----------|----|
|created_at|Date|Status create datetime|`new Date('Wed Sep 26 2012 19:18:39 GMT+0800 (CST)')`|
|id|String|ID|`'3335688'`|
|text|string|Content text|`'My name is node-weibo api.'`|
|source|string|Content source|`'<a href="http://github.com/fengmk2/node-weibo">node-weibo</a>'`|
|favorited|bool|favorited it not or|`true`|
|thumbnail_pic|string|thumbnail size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/thumbnail/61e63796gw1dx9o35biuwj.jpg'`|
|bmiddle_pic|string|middle size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/bmiddle/61e63796gw1dx9o35biuwj.jpg'`|
|original_pic|string|original size image url, `undefined` if empty|`'http://ww1.sinaimg.cn/large/61e63796gw1dx9o35biuwj.jpg'`|
|geo|GEO|GEO infomation, see [GEO](#geo)|`{}`|
|user|User|Status's author, see [Status](#status) |`{screen_name: 'fengmk2', ...}`|
|reposts_count|Number|Reposts count|`1000`|
|comments_count|Number|Comments count|`100`|

### Comment

### User

### Cursor

### GEO
