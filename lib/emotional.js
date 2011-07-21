
//嘀咕的表情
//http://images.digu.com/web_res_v1/emotion/**.gif
var DIGU_EMOTIONS = {
    "微笑": "01", "我晕": "02", "口水": "03", "开心": "04", "鄙视": "05", 
    "我汗": "06", "好爽": "07", "偷笑": "08", "暴走": "09", "垂泪": "10", 
    "死定": "11", "傲慢": "12", "发怒": "13", "害羞": "14", "吃惊": "15", 
    "瞌睡": "16", "阴险": "17", "伤心": "18", "郁闷": "19", "摇头": "20", 
    "牛逼": "21", "呕吐": "22", "可怜": "23", "耍酷": "24", "雷死": "25", 
    "怒吼": "26", "啥玩意儿？": "27", 
    "28":"28", "29":"29", "30":"30", "31":"31", "32":"32"
};

//人间的表情 [//smile]
var RENJIAN_EMOTIONS = {
   "smile":[
      "微笑",
      "0px 0px"
   ],
   "heart":[
      "色",
      "-30px 0px"
   ],
   "yum":[
      "满足",
      "-60px 0px"
   ],
   "laugh":[
      "憨笑",
      "-90px 0px"
   ],
   "grin":[
      "可爱",
      "-120px 0px"
   ],
   "tongue":[
      "调皮",
      "-150px 0px"
   ],
   "hot":[
      "得意",
      "-180px 0px"
   ],
   "ambivalent":[
      "不高兴",
      "-210px 0px"
   ],
   "blush":[
      "害羞",
      "-240px 0px"
   ],
   "frown":[
      "低落",
      "-270px 0px"
   ],
   "halo":[
      "炯炯有神",
      "0px -30px"
   ],
   "crazy":[
      "猥琐",
      "-30px -30px"
   ],
   "crying":[
      "哭",
      "-60px -30px"
   ],
   "undecided":[
      "傲慢",
      "-90px -30px"
   ],
   "naughty":[
      "魔鬼",
      "-120px -30px"
   ],
   "lips":[
      "闭嘴",
      "-150px -30px"
   ],
   "nerd":[
      "得意",
      "-180px -30px"
   ],
   "kiss":[
      "亲亲",
      "-210px -30px"
   ],
   "pirate":[
      "海盗",
      "-240px -30px"
   ],
   "gasp":[
      "惊讶",
      "-270px -30px"
   ],
   "foot":[
      "擦汗",
      "0px -60px"
   ],
   "largegasp":[
      "衰",
      "-30px -60px"
   ],
   "veryangry":[
      "抓狂",
      "-60px -60px"
   ],
   "angry":[
      "无奈",
      "-90px -60px"
   ],
   "confused":[
      "晕",
      "-120px -60px"
   ],
   "sick":[
      "我吐",
      "-150px -60px"
   ],
   "moneymouth":[
      "吐钱",
      "-180px -60px"
   ],
   "ohnoes":[
      "糗大了",
      "-210px -60px"
   ],
   "wink":[
      "眨眼",
      "-240px -60px"
   ],
   "sarcastic":[
      "阴险",
      "-270px -60px"
   ],
   "up":[
      "顶",
      "0px -90px"
   ],
   "down":[
      "鄙视",
      "-30px -90px"
   ],
   "candle":[
      "蜡烛",
      "-60px -90px"
   ],
   "flower":[
      "鲜花",
      "-90px -90px"
   ],
   "ribbon":[
      "丝带",
      "-120px -90px"
   ]
};

// TSOHU 表情
// .find('i').each(function(){console.log('"' + $(this).attr('title') + '": "' + $(this).attr('class') + '",')});
var TSOHU_EMOTIONS_URL_PRE = 'http://s3.cr.itc.cn/img/';
var TSOHU_FACE_TPL = '[{{name}}]';
var TSOHU_EMOTIONS = {
"地球一小时": "i2/t/178.gif",
"盐": "t/536.gif",
"心相映": "t/532.gif",
"急救箱": "t/531.gif",
"地震": "t/530.gif",
"蜡烛": "t/425.gif",
//"握手": "x x53",
"蛋糕": "t/527.gif",
"内裤": "t/528.gif",
"内衣": "t/529.gif",
"雪": "t/526.gif",
"福": "t/519.gif",
"微笑": "i3/t/2026.gif",
"色": "i3/t/2027.gif",
"呲牙": "i3/t/2028.gif",
"偷笑": "i3/t/2029.gif",
"害羞": "i3/t/2030.gif",
"大哭": "i3/t/2031.gif",
"哭": "i3/t/061.gif",
"酷": "i3/t/2033.gif",
"发火": "i3/t/2034.gif",
"怒": "i3/t/2035.gif",
"疑问": "i3/t/2036.gif",
"感叹": "i3/t/2037.gif",
"调皮": "i3/t/2038.gif",
"眨眼": "i3/t/2039.gif",
"寒": "i3/t/2040.gif",
"睡觉": "i3/t/2041.gif",
"困": "i3/t/2042.gif",
"不满": "i3/t/2043.gif",
"噘嘴": "i3/t/2044.gif",
"听歌": "i3/t/2045.gif",
"汗": "i3/t/2046.gif",
"脸红": "i3/t/2047.gif",
"耳语": "i3/t/2048.gif",
"嘘": "i3/t/2049.gif",
"吐": "i3/t/2050.gif",
"馋": "i3/t/2051.gif",
"鄙视": "i3/t/2052.gif",
"讽刺": "i3/t/2053.gif",
"发呆": "i3/t/2054.gif",
"晕": "i3/t/2055.gif",
"被踹": "i3/t/2056.gif",
"衰": "i3/t/2057.gif",
"受伤": "i3/t/2058.gif",
"海盗": "i3/t/2059.gif",
"闭嘴": "i3/t/2060.gif",
"佐罗": "i3/t/2061.gif"
};

// TQQ表情
// http://mat1.gtimg.com/www/mb/images/face/14.gif
// .find('a').each(function(i, item){console.log('"' + $(this).attr('title') + '"' + ': ' + '"' + $(this).attr('class').substring(1) + '.gif",');});
var TQQ_EMOTIONS_URL_PRE = 'http://mat1.gtimg.com/www/mb/images/face/';
var TQQ_FACE_TPL = '/{{name}}';
var TQQ_EMOTIONS = {
	"微笑": "14.gif",
	"撇嘴": "1.gif",
	"色": "2.gif",
	"发呆": "3.gif",
	"得意": "4.gif",
	"流泪": "5.gif",
	"害羞": "6.gif",
	"闭嘴": "7.gif",
	"睡": "8.gif",
	"大哭": "9.gif",
	"尴尬": "10.gif",
	"发怒": "11.gif",
	"调皮": "12.gif",
	"呲牙": "13.gif",
	"惊讶": "0.gif",
	"难过": "15.gif",
	"酷": "16.gif",
	"冷汗": "96.gif",
	"抓狂": "18.gif",
	"吐": "19.gif",
	"偷笑": "20.gif",
	"可爱": "21.gif",
	"白眼": "22.gif",
	"傲慢": "23.gif",
	"饥饿": "24.gif",
	"困": "25.gif",
	"惊恐": "26.gif",
	"流汗": "27.gif",
	"憨笑": "28.gif",
	"大兵": "29.gif",
	"奋斗": "30.gif",
	"咒骂": "31.gif",
	"疑问": "32.gif",
	"嘘": "33.gif",
	"晕": "34.gif",
	"折磨": "35.gif",
	"衰": "36.gif",
	"骷髅": "37.gif",
	"敲打": "38.gif",
	"再见": "39.gif",
	"擦汗": "97.gif",
	"抠鼻": "98.gif",
	"鼓掌": "99.gif",
	"糗大了": "100.gif",
	"坏笑": "101.gif",
	"左哼哼": "102.gif",
	"右哼哼": "103.gif",
	"哈欠": "104.gif",
	"鄙视": "105.gif",
	"委屈": "106.gif",
	"快哭了": "107.gif",
	"阴险": "108.gif",
	"亲亲": "109.gif",
	"吓": "110.gif",
	"可怜": "111.gif",
	"菜刀": "112.gif",
	"西瓜": "89.gif",
	"啤酒": "113.gif",
	"篮球": "114.gif",
	"乒乓": "115.gif",
	"咖啡": "60.gif",
	"饭": "61.gif",
	"猪头": "46.gif",
	"玫瑰": "63.gif",
	"凋谢": "64.gif",
	"示爱": "116.gif",
	"爱心": "66.gif",
	"心碎": "67.gif",
	"蛋糕": "53.gif",
	"闪电": "54.gif",
	"炸弹": "55.gif",
	"刀": "56.gif",
	"足球": "57.gif",
	"瓢虫": "117.gif",
	"便便": "59.gif",
	"月亮": "75.gif",
	"太阳": "74.gif",
	"礼物": "69.gif",
	"拥抱": "49.gif",
	"强": "76.gif",
	"弱": "77.gif",
	"握手": "78.gif",
	"胜利": "79.gif",
	"抱拳": "118.gif",
	"勾引": "119.gif",
	"拳头": "120.gif",
	"差劲": "121.gif",
	"爱你": "122.gif",
	"NO": "123.gif",
	"OK": "124.gif",
	"爱情": "42.gif",
	"飞吻": "85.gif",
	"跳跳": "43.gif",
	"发抖": "41.gif",
	"怄火": "86.gif",
	"转圈": "125.gif",
	"磕头": "126.gif",
	"回头": "127.gif",
	"跳绳": "128.gif",
	"挥手": "129.gif",
	"激动": "130.gif",
	"街舞": "131.gif",
	"献吻": "132.gif",
	"左太极": "133.gif",
	"右太极": "134.gif"
};

// t163
var T163_EMOTIONS_URL_PRE = 'http://img1.cache.netease.com/t/face/';
var T163_FACE_TPL = '[{{name}}]';
var T163_EMOTIONS = {
"勾引": "yunying/gouyin.gif",
"纠结": "yunying/jiujie.gif",
"开心": "yunying/kaixin.gif",
"困死了": "yunying/kunsile.gif",
"路过": "yunying/luguo.gif",
"冒泡": "yunying/maopao.gif",
"飘走": "yunying/piaozou.gif",
"思考": "yunying/sikao.gif",
"我顶": "yunying/woding.gif",
"我晕": "yunying/woyun.gif",
"抓狂": "yunying/zhuakuang.gif",
"装酷": "yunying/zhuangku.gif",
"福": "default/fu.gif",
"红包": "default/hongbao.gif",
"菊花": "default/jvhua.gif",
"蜡烛": "default/lazhu.gif",
"礼物": "default/liwu.gif",
"圣诞老人": "default/sdlr.gif",
"圣诞帽": "default/sdm.gif",
"圣诞树": "default/sds.gif",
"崩溃": "default/bengkui.gif",
"鄙视你": "default/bishini.gif",
"不说": "default/bushuo.gif",
"大哭": "default/daku.gif",
"飞吻": "default/feiwen.gif",
"工作忙": "default/gongzuomang.gif",
"鼓掌": "default/guzhang.gif",
"害羞": "default/haixiu.gif",
"坏": "default/huai.gif",
"坏笑": "default/huaixiao.gif",
"教训": "default/jiaoxun.gif",
"惊讶": "default/jingya.gif",
"可爱": "default/keai.gif",
"老大": "default/laoda.gif",
"欠揍": "default/qianzou.gif",
"撒娇": "default/sajiao.gif",
"色迷迷": "default/semimi.gif",
"送花": "default/songhua.gif",
"偷笑": "default/touxiao.gif",
"挖鼻孔": "default/wabikou.gif",
"我吐": "default/wotu.gif",
"嘘": "default/xu.gif",
"仰慕你": "default/yangmuni.gif",
"yeah": "default/yeah.gif",
"疑问": "default/yiwen.gif",
"晕": "default/yun.gif",
"砸死你": "default/zasini.gif",
"眨眼": "default/zhayan.gif",
"扭扭": "ali/niuniu.gif",
"转圈圈": "ali/feng.gif",
"踢踏舞": "ali/tita.gif",
"强": "ali/qiang.gif",
"跳舞": "ali/niu.gif",
"蜷": "ali/juan.gif",
"吃惊": "ali/bie.gif",
"我汗": "ali/liuhan.gif",
"呐喊": "ali/aaa.gif",
"生病": "ali/dahan.gif",
"隐身": "ali/yinshen.gif",
"放松": "ali/jian.gif",
"捶地": "ali/bugongping.gif",
"嗯": "ali/diantou.gif",
"撒花": "ali/saqian.gif",
"撒花": "ali/saqian.gif",
"心": "ali/xin.gif",
"囧": "ali/jiong.gif",
"害怕": "ali/leng.gif",
"冷": "ali/han.gif",
"震惊": "ali/jingya.gif",
"怒": "ali/nuqi.gif",
"狂笑": "ali/kuangxiao.gif",
"渴望": "ali/kewang.gif",
"飘过": "ali/piaoguo.gif",
"转圈哭": "ali/zhuanquanku.gif",
"得瑟": "ali/lala.gif",
"hi": "ali/hi.gif",
"闪电": "ali/jing.gif",
"同意": "ali/erduo.gif",
"星星眼": "ali/a.gif",
"爆头": "popb/baotou.gif",
"唱歌": "popb/changge.gif",
"嘲笑": "popb/chaoxiao.gif",
"抽烟": "popb/chouyan.gif",
"大笑": "popb/daxiao.gif",
"淡定": "popb/danding.gif",
"疯了": "popb/fengle.gif",
"感动": "popb/gandong.gif",
"哈哈": "popb/haha.gif",
"汗": "popb/han.gif",
"好冷": "popb/haoleng.gif",
"哼哒": "popb/hengda.gif",
"警告": "popb/jinggao.gif",
"跳跳": "popb/kaiqiang.gif",
"困": "popb/kun.gif",
"泪奔": "popb/leiben.gif",
"卖萌": "popb/maimeng.gif",
"拍手": "popb/paishou.gif",
"路过这里": "popb/piaoguo.gif",
"杀无赦": "popb/shawushe.gif",
"烧香": "popb/shaoxiang.gif",
"掏鼻孔": "popb/taobikong.gif",
"舔舔": "popb/tiantian.gif",
"开枪": "popb/tiaotiao.gif",
"吐口水": "popb/tukoushui.gif",
"瞎得瑟": "popb/xiadese.gif",
"吆西": "popb/yaoxi.gif",
"晕倒": "popb/yundao.gif",
"早安": "popb/zaoan.gif",
"揍你": "popb/zouni.gif",
};

var FACE_TYPES = [
    ['tsina', TSINA_FACES, TSINA_FACE_URL_PRE, TSINA_FACE_TPL, '新浪'],      
    ['tqq', TQQ_EMOTIONS, TQQ_EMOTIONS_URL_PRE, TQQ_FACE_TPL, '腾讯'],
    ['tsohu', TSOHU_EMOTIONS, TSOHU_EMOTIONS_URL_PRE, TSOHU_FACE_TPL, '搜狐'],
    ['t163', T163_EMOTIONS, T163_EMOTIONS_URL_PRE, T163_FACE_TPL, '网易'],
];