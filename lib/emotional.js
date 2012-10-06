// @author qleelulu@gmail.com

// 新浪微博表情转化
var TSINA_FACE_URL_PRE = 'http://timg.sjs.sinajs.cn/t35/style/images/common/face/ext/normal/';
var TSINA_FACE_TPL = '[{{name}}]';
var TSINA_FACES = {
"呵呵": "eb/smile.gif",
"嘻嘻": "c2/tooth.gif",
"哈哈": "6a/laugh.gif",
"爱你": "7e/love.gif",
"晕": "a4/dizzy.gif",
"泪": "d8/sad.gif",
"馋嘴": "b8/cz_thumb.gif",
"抓狂": "4d/crazy.gif",
"哼": "19/hate.gif",
"抱抱": "7c/bb_thumb.gif",
"可爱": "9c/tz_thumb.gif",
"怒": "57/angry.gif",
"汗": "13/sweat.gif",
"困": "8b/sleepy.gif",
"害羞": "05/shame_thumb.gif",
"睡觉": "7d/sleep_thumb.gif",
"钱": "90/money_thumb.gif",
"偷笑": "7e/hei_thumb.gif",
"酷": "40/cool_thumb.gif",
"衰": "af/cry.gif",
"吃惊": "f4/cj_thumb.gif",
"闭嘴": "29/bz_thumb.gif",
"鄙视": "71/bs2_thumb.gif",
"挖鼻屎": "b6/kbs_thumb.gif",
"花心": "64/hs_thumb.gif",
"鼓掌": "1b/gz_thumb.gif",
"失望": "0c/sw_thumb.gif",
"思考": "e9/sk_thumb.gif",
"生病": "b6/sb_thumb.gif",
"亲亲": "8f/qq_thumb.gif",
"怒骂": "89/nm_thumb.gif",
"太开心": "58/mb_thumb.gif",
"懒得理你": "17/ldln_thumb.gif",
"右哼哼": "98/yhh_thumb.gif",
"左哼哼": "6d/zhh_thumb.gif",
"嘘": "a6/x_thumb.gif",
"委屈": "73/wq_thumb.gif",
"吐": "9e/t_thumb.gif",
"可怜": "af/kl_thumb.gif",
"打哈气": "f3/k_thumb.gif",
"顶": "91/d_thumb.gif",
"疑问": "5c/yw_thumb.gif",
"做鬼脸": "88/zgl_thumb.gif",
"握手": "0c/ws_thumb.gif",
"耶": "d9/ye_thumb.gif",
"good": "d8/good_thumb.gif",
"弱": "d8/sad_thumb.gif",
"不要": "c7/no_thumb.gif",
"ok": "d6/ok_thumb.gif",
"赞": "d0/z2_thumb.gif",
"来": "40/come_thumb.gif",
"蛋糕": "6a/cake.gif",
"心": "6d/heart.gif",
"伤心": "ea/unheart.gif",
"钟": "d3/clock_thumb.gif",
"猪头": "58/pig.gif",
"话筒": "1b/m_thumb.gif",
"月亮": "b9/moon.gif",
"太阳": "e5/sun.gif",
"下雨": "50/rain.gif",
"咖啡": "64/cafe_thumb.gif",
"干杯": "bd/cheer.gif",
"绿丝带": "b8/green.gif",
"蜡烛": "cc/candle.gif",
"微风": "a5/wind_thumb.gif",
"月饼": "96/mooncake3_thumb.gif",
"满月": "5d/moon1_thumb.gif",
"酒壶": "64/wine_thumb.gif",
"团": "11/tuan_thumb.gif",
"圆": "53/yuan_thumb.gif",
"左抱抱": "54/left_thumb.gif",
"右抱抱": "0d/right_thumb.gif",
"乐乐": "66/guanbuzhao_thumb.gif",
"团圆月饼": "e6/tuanyuan_thumb.gif",
"欢欢": "49/lbq1_thumb.gif",
"织": "41/zz2_thumb.gif",
"围观": "f2/wg_thumb.gif",
"威武": "70/vw_thumb.gif",
"爱心传递": "c9/axcd_thumb.gif",
"奥特曼": "bc/otm_thumb.gif",
// 亚运
"国旗": "dc/flag_thumb.gif",
"金牌": "f4/jinpai_thumb.gif",
"银牌": "1e/yinpai_thumb.gif",
"铜牌": "26/tongpai_thumb.gif",
"围脖": "3f/weijin_thumb.gif",
"温暖帽子": "f1/wennuanmaozi_thumb.gif",
"手套": "72/shoutao_thumb.gif",
"落叶": "79/yellowMood_thumb.gif",
"照相机": "33/camera_thumb.gif",
"礼物": "c4/liwu_thumb.gif",
"v5": "c5/v5_org.gif",
"书呆子": "61/sdz_org.gif",
"男孩儿": "4e/kissboy_org.gif",
"女孩儿": "1b/kissgirl_org.gif",
"风扇": "92/fan.gif",
"冰棍": "3a/ice.gif",
"西瓜": "6b/watermelon.gif",
"给力": "c9/geili_thumb.gif",
"神马": "60/horse2_thumb.gif",
"浮云": "bc/fuyun_thumb.gif",
"兔子": "81/rabbit_thumb.gif",

"猥琐": "e1/weisuo_thumb.gif",
"挑眉": "c9/tiaomei_thumb.gif", 
"挑逗": "3c/tiaodou_thumb.gif",
"亲耳朵": "1c/qinerduo_thumb.gif",
"媚眼": "32/meiyan_thumb.gif",
"冒个泡": "32/maogepao_thumb.gif",
"囧耳朵": "f0/jiongerduo_thumb.gif",
"鬼脸": "14/guilian_thumb.gif",
"放电": "fd/fangdian_thumb.gif",
"悲剧": "ea/beiju_thumb.gif"
};

// python create_emotions_data.py
// 再将结果翻译成繁体 http://translate.google.com/
// 繁体会有问题，需要查看此微博调试 http://weibo.com/1828485392/xyxxpm7AW
var TSINA_API_EMOTIONS = {
  "草泥马": "7a/shenshou_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "给力": "c9/geili_org.gif", "围观": "f2/wg_org.gif", "威武": "70/vw_org.gif", "熊猫": "6e/panda_org.gif", "兔子": "81/rabbit_org.gif", "奥特曼": "bc/otm_org.gif", "囧": "15/j_org.gif", "互粉": "89/hufen_org.gif", "礼物": "c4/liwu_org.gif", "呵呵": "ac/smilea_org.gif", "嘻嘻": "0b/tootha_org.gif", "哈哈": "6a/laugh.gif", "可爱": "14/tza_org.gif", "可怜": "af/kl_org.gif", "挖鼻屎": "a0/kbsa_org.gif", "吃惊": "f4/cj_org.gif", "害羞": "6e/shamea_org.gif", "挤眼": "c3/zy_org.gif", "闭嘴": "29/bz_org.gif", "鄙视": "71/bs2_org.gif", "爱你": "6d/lovea_org.gif", "泪": "9d/sada_org.gif", "偷笑": "19/heia_org.gif", "亲亲": "8f/qq_org.gif", "生病": "b6/sb_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "嘘": "a6/x_org.gif", "衰": "af/cry.gif", "委屈": "73/wq_org.gif", "吐": "9e/t_org.gif", "打哈欠": "f3/k_org.gif", "抱抱": "27/bba_org.gif", "怒": "7c/angrya_org.gif", "疑问": "5c/yw_org.gif", "馋嘴": "a5/cza_org.gif", "拜拜": "70/88_org.gif", "思考": "e9/sk_org.gif", "汗": "24/sweata_org.gif", "困": "7f/sleepya_org.gif", "睡觉": "6b/sleepa_org.gif", "钱": "90/money_org.gif", "失望": "0c/sw_org.gif", "酷": "40/cool_org.gif", "花心": "8c/hsa_org.gif", "哼": "49/hatea_org.gif", "鼓掌": "36/gza_org.gif", "晕": "d9/dizzya_org.gif", "悲伤": "1a/bs_org.gif", "抓狂": "62/crazya_org.gif", "黑线": "91/h_org.gif", "阴险": "6d/yx_org.gif", "怒骂": "89/nm_org.gif", "心": "40/hearta_org.gif", "伤心": "ea/unheart.gif", "猪头": "58/pig.gif", "ok": "d6/ok_org.gif", "耶": "d9/ye_org.gif", "good": "d8/good_org.gif", "不要": "c7/no_org.gif", "赞": "d0/z2_org.gif", "来": "40/come_org.gif", "弱": "d8/sad_org.gif", "蜡烛": "91/lazu_org.gif", "蛋糕": "6a/cake.gif", "钟": "d3/clock_org.gif", "话筒": "1b/m_org.gif", "国旗": "dc/flag_org.gif", "放假啦": "37/lxhfangjiale_org.gif", "月儿圆": "3d/lxhyueeryuan_org.gif", "笑哈哈": "32/lxhwahaha_org.gif", "泪流满面": "64/lxhtongku_org.gif", "带感": "d2/lxhdaigan_org.gif", "得瑟": "ca/lxhdese_org.gif", "gst耐你": "1b/gstnaini_org.gif", "gst好羞射": "8b/gsthaoxiushe_org.gif", "xb小花": "c2/xbxiaohua_org.gif", "xb压力": "e0/xbyali_org.gif", "din推撞": "dd/dintuizhuang_org.gif", "bed凌乱": "fa/brdlingluan_org.gif", "最右": "c8/lxhzuiyou_org.gif", "右边亮了": "ae/lxhliangle_org.gif", "转发": "02/lxhzhuanfa_org.gif", "笑哈哈": "32/lxhwahaha_org.gif", "得意地笑": "d4/lxhdeyidixiao_org.gif", "噢耶": "3b/lxhxixi_org.gif", "偷乐": "fa/lxhtouxiao_org.gif", "泪流满面": "64/lxhtongku_org.gif", "巨汗": "f6/lxhjuhan_org.gif", "抠鼻屎": "48/lxhkoubishi_org.gif", "求关注": "ac/lxhqiuguanzhu_org.gif", "真V5": "3a/lxhv5_org.gif", "群体围观": "a8/lxhweiguan_org.gif", "hold住": "05/lxhholdzhu_org.gif", "羞嗒嗒": "df/lxhxiudada_org.gif", "非常汗": "42/lxhpubuhan_org.gif", "许愿": "87/lxhxuyuan_org.gif", "崩溃": "c7/lxhzhuakuang_org.gif", "好囧": "96/lxhhaojiong_org.gif", "震惊": "e7/lxhchijing_org.gif", "别烦我": "22/lxhbiefanwo_org.gif", "不好意思": "b4/lxhbuhaoyisi_org.gif", "纠结": "1f/lxhjiujie_org.gif", "拍手": "e3/lxhguzhang_org.gif", "给劲": "a5/lxhgeili_org.gif", "好喜欢": "d6/lxhlike_org.gif", "好爱哦": "74/lxhainio_org.gif", "路过这儿": "ac/lxhluguo_org.gif", "悲催": "43/lxhbeicui_org.gif", "不想上班": "6b/lxhbuxiangshangban_org.gif", "躁狂症": "ca/lxhzaokuangzheng_org.gif", "甩甩手": "a6/lxhshuaishuaishou_org.gif", "瞧瞧": "8b/lxhqiaoqiao_org.gif", "同意": "14/lxhtongyi_org.gif", "喝多了": "a7/lxhheduole_org.gif", "啦啦啦啦": "3d/lxhlalalala_org.gif", "杰克逊": "e5/lxhjiekexun_org.gif", "雷锋": "7a/lxhleifeng_org.gif", "带感": "d2/lxhdaigan_org.gif", "亲一口": "88/lxhqinyikou_org.gif", "七夕": "9a/lxhqixi_org.gif", "加油啊": "03/lxhjiayou_org.gif", "困死了": "00/lxhkunsile_org.gif", "有鸭梨": "7e/lxhyouyali_org.gif", "右边亮了": "ae/lxhliangle_org.gif", "撒花": "b3/lxhfangjiala_org.gif", "好棒": "3e/lxhhaobang_org.gif", "想一想": "e9/lxhxiangyixiang_org.gif", "下班": "f2/lxhxiaban_org.gif", "最右": "c8/lxhzuiyou_org.gif", "中箭": "81/lxhzhongjian_org.gif", "丘比特": "35/lxhqiubite_org.gif", "互相膜拜": "3c/lxhhuxiangmobai_org.gif", "膜拜了": "52/lxhmobai_org.gif", "放电抛媚": "d0/lxhfangdianpaomei_org.gif", "霹雳": "41/lxhshandian_org.gif", "被电": "ed/lxhbeidian_org.gif", "拍砖": "3b/lxhpaizhuan_org.gif", "互相拍砖": "5b/lxhhuxiangpaizhuan_org.gif", "采访": "8b/lxhcaifang_org.gif", "发表言论": "f1/lxhfabiaoyanlun_org.gif", "牛": "24/lxhniu_org.gif", "玫瑰": "f6/lxhrose_org.gif", "赞啊": "00/lxhzan_org.gif", "推荐": "e9/lxhtuijian_org.gif", "放假啦": "37/lxhfangjiale_org.gif", "萌翻": "99/lxhmengfan_org.gif", "招财": "a9/lxhzhaocai_org.gif", "月儿圆": "3d/lxhyueeryuan_org.gif", "赶火车": "a2/lxhganhuoche_org.gif", "立志青年": "f9/lxhlizhiqingnian_org.gif", "得瑟": "ca/lxhdese_org.gif", "微博三岁啦": "1e/lxhweibo3yr_org.gif", "复活节": "d6/lxhfuhuojie_org.gif", "挤火车": "09/lxhjihuoche_org.gif", "愚人节": "21/lxhyurenjie_org.gif", "收藏": "83/lxhshoucang_org.gif", "喜得金牌": "a2/lxhhappygold_org.gif", "夺冠感动": "69/lxhduoguan_org.gif", "冠军诞生": "2c/lxhguanjun_org.gif", "传火炬": "f2/lxhchuanhuoju_org.gif", "奥运金牌": "06/lxhgold_org.gif", "奥运银牌": "43/lxhbronze_org.gif", "奥运铜牌": "fd/lxhsilver_org.gif", "德国队加油": "12/germany_org.gif", "西班牙队加油": "be/spain_org.gif", "葡萄牙队加油": "f8/portugal_org.gif", "意大利队加油": "03/italy_org.gif", "耍花灯": "be/lxhshuahuadeng_org.gif", "元宵快乐": "83/lxhyuanxiaohappy_org.gif", "金元宝": "9b/lxhjinyuanbao_org.gif", "吃汤圆": "52/lxhchitangyuan_org.gif", "红包拿来": "bd/lxhhongbaonalai_org.gif", "福到啦": "f4/lxhfudaola_org.gif", "放鞭炮": "bd/lxhbianpao_org.gif", "发红包": "27/lxhhongbao_org.gif", "大红灯笼": "90/lxhdahongdenglong_org.gif", "拜年了": "0c/lxhbainianle_org.gif", "龙啸": "cd/lxhlongxiao_org.gif", "gst挖鼻屎": "44/gstwabishi_org.gif", "gst舔舔": "83/gsttiantian_org.gif", "gst好羞射": "8b/gsthaoxiushe_org.gif", "gst抽你": "37/gstchouniya_org.gif", "gst好难懂": "96/gsthaonandong_org.gif", "gst不活了": "3e/gstrangwosi_org.gif", "gst转转转": "ff/gstzhuanzhuanzhuan_org.gif", "gst汗": "2f/gsthan_org.gif", "gst干嘛噜": "ab/gstganmalu_org.gif", "gst人家不依": "1c/gstnewrenjiabuyi_org.gif", "gst热热热": "11/gstrerere_org.gif", "gst耐你": "1b/gstnaini_org.gif", "gst困": "7c/gstkun_org.gif", "gst好怕呀": "e5/gsthaopaya_org.gif", "gst发工资啦": "41/gstfagongzila_org.gif", "gst嘲笑你": "d9/gstchaoxiaoni_org.gif", "gst呀咩爹": "09/gstyameidie_org.gif", "gst下班啦": "73/gstxiabanla_org.gif", "gst晚安": "8a/gstwanan_org.gif", "gst败了": "35/gsttouxiang_org.gif", "gst死蚊子": "18/gstsiwenzi_org.gif", "gst帅毙了": "fb/gstshuaibile_org.gif", "gst揉揉脸": "52/gstrouroulian_org.gif", "gst嘿嘿嘿": "a0/gstheiheihei_org.gif", "gst得瑟": "14/gstdese_org.gif", "gst艾玛": "48/gstaima_org.gif", "xb自信": "0a/xbzixin_org.gif", "xb转": "08/xbzhuan_org.gif", "xb转圈": "fa/xbzhuanquan_org.gif", "xb指指": "fb/xbzhizhi_org.gif", "xb招手": "69/xbzhaoshou_org.gif", "xb照镜": "d7/xbzhaojing_org.gif", "xb雨": "c3/xbyu_org.gif", "xb坏笑": "49/xbyinxiao_org.gif", "xb疑惑": "e9/xbyihuo_org.gif", "xb摇摆": "1d/xbyaobai_org.gif", "xb眼镜": "6d/xbyanjing_org.gif", "xb压力": "e0/xbyali_org.gif", "xb星": "e8/xbxing_org.gif", "xb兴奋": "7b/xbxingfen_org.gif", "xb喜欢": "5c/xbxihuan_org.gif", "xb小花": "c2/xbxiaohua_org.gif", "xb无奈": "96/xbwunai_org.gif", "xb捂脸": "56/xbwulian_org.gif", "xb天使": "dc/xbtianshi_org.gif", "xb太阳": "0f/xbtaiyang_org.gif", "xb睡觉": "af/xbshuijiao_org.gif", "xb甩葱": "a2/xbshuaicong_org.gif", "xb生日": "12/xbshengri_org.gif", "xb扇子": "41/xbshanzi_org.gif", "xb伤心": "41/xbshangxin_org.gif", "xb揉": "e1/xbrou_org.gif", "xb求神": "a1/xbqiushen_org.gif", "xb青蛙": "06/xbqingwa_org.gif", "xb期待": "b0/xbqidai_org.gif", "xb泡澡": "7a/xbpaozao_org.gif", "xb怒": "07/xbnu_org.gif", "xb努力": "7b/xbnuli_org.gif", "xb拇指": "58/xbmuzhi_org.gif", "xb喵": "85/xbmiao_org.gif", "xb喇叭": "0c/xblaba_org.gif", "xb哭": "dd/xbku_org.gif", "xb看书": "44/xbkanshu_org.gif", "xb开餐": "34/xbkaican_org.gif", "xb举手": "8e/xbjushou_org.gif", "xb奸笑": "cf/xbjianxiao_org.gif", "xb昏": "30/xbhun_org.gif", "xb挥手": "ec/xbhuishou_org.gif", "xb欢乐": "3a/xbhuanle_org.gif", "xb喝茶": "61/xbhecha_org.gif", "xb汗": "36/xbhan_org.gif", "xb害羞": "cc/xbhaixiu_org.gif", "xb害怕": "c4/xbhaipa_org.gif", "xb风吹": "66/xbfengchui_org.gif", "xb风车": "a5/xbfengche_org.gif", "xb恶魔": "28/xbemo_org.gif", "xb打": "72/xbda_org.gif", "xb大笑": "cd/xbdaxiao_org.gif", "xb呆": "9d/xbdai_org.gif", "xb触手": "f4/xbchushou_org.gif", "xb吹": "0c/xbchui_org.gif", "xb吃糖": "e9/xbchitang_org.gif", "xb吃饭": "73/xbchifan_org.gif", "xb吃包": "48/xbchibao_org.gif", "xb唱歌": "1c/xbchangge_org.gif", "xb摆手": "db/xbbaishou_org.gif", "lxhx喵": "9b/lxhxmiao_org.gif", "lxhx喵喵": "5e/lxhxmiao2_org.gif", "lxhx奔跑": "c5/lxhxbenpao_org.gif", "lxhx走": "51/lxhxzou_org.gif", "lxhx蠕过": "93/lxhxruguo_org.gif", "lxhx蹭": "27/lxhxceng_org.gif", "lxhx狂欢": "d5/lxhxkuanghuan_org.gif", "lxhx奋斗": "6c/lxhxfendou_org.gif", "lxhx笑": "3b/lxhxxiao_org.gif", "lxhx懒腰": "d4/lxhxlanyao_org.gif", "lxhx得意": "b0/lxhxdeyi_org.gif", "lxhx右边": "a4/lxhxyou_org.gif", "lxhx转头": "71/lxhxzhuantou_org.gif", "lxhx跳跃": "ee/lxhxtiaoyue_org.gif", "lxhx转体": "11/lxhxzhuanti_org.gif", "lxhx撒欢": "b8/lxhxsahuan_org.gif", "lxhx挠": "89/lxhxnao_org.gif", "lxhx挠皇": "b8/lxhxnaohuang_org.gif", "lxhx逗转圈": "52/lxhxdouzhuanquan_org.gif", "lxhx划": "28/lxhxhua_org.gif", "lxhx得瑟": "80/lxhxdese_org.gif", "lxhx喷嚏": "5c/lxhxpenti2_org.gif", "lxhx打喷嚏": "15/lxhxpenti_org.gif", "lxhx哭": "6a/lxhxku_org.gif", "lxhx扫灰": "37/lxhxsaohui_org.gif", "lxhx听歌": "3d/lxhxtingge_org.gif", "lxhx狂吃": "05/lxhxkuangchi_org.gif", "lxhx画圈": "f0/lxhxhuaquan_org.gif", "lxhx掀桌": "18/lxhxxianzhuo_org.gif", "lxhx刷牙": "ce/lxhxshuaya_org.gif", "lxhx抱枕": "31/lxhxbaozhen_org.gif", "lxhx都不给": "03/lxhxdoubugei_org.gif", "lxhx逗左右": "99/lxhxdouzuoyou_org.gif", "lxhx变化": "14/lxhxbianhua_org.gif", "lxhx打地鼠": "aa/lxhxdadishu_org.gif", "lxhx西瓜": "45/lxhxxigua_org.gif", "lxhx咻": "01/lxhxxiu1_org.gif", "lxhx咻2": "a5/lxhxxiu2_org.gif", "lxhx咻3": "02/lxhxxiu3_org.gif", "lxhx咻4": "75/lxhxxiu4_org.gif", "lxhx咻5": "14/lxhxxiu5_org.gif", "lxhx咻6": "e3/lxhxxiu6_org.gif", "lxhx咻7": "ec/lxhxxiu7_org.gif", "lxhx咻8": "2b/lxhxxiu8_org.gif", "lxhx滚过": "43/lxhxgunguo_org.gif", "lxhx躺中枪": "f9/lxhxtangzhongqiang_org.gif", "lxhx讨厌": "98/lxhxtaoyan_org.gif", "lxhx逗上下": "51/lxhxdoushangxia_org.gif", "lxhx吐血": "03/lxhxtuxue_org.gif", "lxhx病了": "9f/lxhxbingle_org.gif", "lxhx泪目": "ee/lxhxleimu_org.gif", "lxhx无语": "2e/lxhxwuyu_org.gif", "lxhx问号": "fa/lxhxwenhao_org.gif", "lxhx侧目": "8c/lxhxcemu_org.gif", "lxhx惊": "6a/lxhxjing_org.gif", "lxhx吐": "92/lxhxtu_org.gif", "lxhx失落": "52/lxhxshiluo_org.gif", "lxhx汗": "4f/lxhxhan_org.gif", "lxhx暴汗": "03/lxhxhan1_org.gif", "lxhx狠": "8c/lxhxhen_org.gif", "lxhx怨念": "a6/lxhxyuannian_org.gif", "lxhx睡觉": "82/lxhxshuijiao_org.gif", "lxhx求表扬": "21/lxhxqiubiaoyang_org.gif", "lxhx啄地": "4a/lxhxzhuodi_org.gif", "lxhx无聊": "71/lxhxwuliao_org.gif", "lxhx顺毛": "e0/lxhxshunmao_org.gif", "lxhx喝奶": "ab/lxhxhenai_org.gif", "lxhx不爽": "f2/lxhxbushuang_org.gif", "lxhx老大": "89/lxhxlaoda_org.gif", "cai走走": "6a/caizouzou_org.gif", "cai揍人": "25/caizouren_org.gif", "cai撞墙": "54/caizhuangqiang_org.gif", "cai正呀": "68/caizhengya_org.gif", "cai嘻嘻": "fc/caixixi_org.gif", "cai羞羞": "7f/caixiuxiu_org.gif", "cai无语": "6f/caiwuyu_org.gif", "cai脱光": "53/caituoguang_org.gif", "cai偷摸": "c8/caitoutoumomo_org.gif", "cai太好了": "41/caitaihaole_org.gif", "cai庆祝": "b0/caiqingzhu_org.gif", "cai钱": "91/caiqian_org.gif", "cai潜水": "70/caiqianshui_org.gif", "cai怕羞": "6a/caipaxiu_org.gif", "cai落叶": "40/cailuoye_org.gif", "cai哭": "90/caiku_org.gif", "cai开心": "e2/caikaixin_org.gif", "cai惊吓": "a9/caijingxia_org.gif", "cai奸笑": "63/caijianxiao_org.gif", "cai晃头": "22/caihuangtou_org.gif", "cai哈喽": "dc/caihalou_org.gif", "cai飞吻": "75/caifeiwen_org.gif", "cai肚腩": "07/caidunan_org.gif", "cai打打": "1d/caidada_org.gif", "cai扯脸": "95/caichelian_org.gif", "cai插眼": "97/caichayan_org.gif", "cai鼻屎": "21/caibishi_org.gif", "cai崩溃": "a7/caibengkui_org.gif", "cai拜拜": "a4/caibaibai_org.gif", "cai啊": "60/caia_org.gif", "din转转": "57/dinzhuanzhuan_org.gif", "din撞墙": "82/dinzhuangqiang_org.gif", "din抓狂": "3f/dinzhuakuang_org.gif", "din赞好": "ae/dinzanhao_org.gif", "din信息": "1d/dinxinxi_org.gif", "din兴奋": "1f/dinxingfen_org.gif", "din推撞": "dd/dintuizhuang_org.gif", "din天哦": "d4/dintiano_org.gif", "din弹弹": "cf/dintantan_org.gif", "din说话": "39/dinshuohua_org.gif", "din睡觉": "f3/dinshuijiao_org.gif", "din帅": "96/dinshuai_org.gif", "din闪避": "79/dinshanbi_org.gif", "din亲亲": "4c/dinqinqin_org.gif", "din拍手": "ec/dinpaishou_org.gif", "din怒": "a2/dinnu_org.gif", "din摸头": "19/dinmotou_org.gif", "din流血": "25/dinliuxue_org.gif", "din厉害": "3f/dinlihai_org.gif", "din脸红": "c5/dinlianhong_org.gif", "din泪": "64/dinlei_org.gif", "din看看": "71/dinkankan_org.gif", "din贱香": "81/dinjianxiang_org.gif", "din挥手": "7e/dinhuishou_org.gif", "din化妆": "de/dinhuazhuang_org.gif", "din喝": "ff/dinhe_org.gif", "din汗": "d0/dinhan_org.gif", "din害羞": "66/dinhaixiu_org.gif", "din鬼脸": "e1/dinguilian_org.gif", "din挂了": "0b/dinguale_org.gif", "din分身1": "97/dinfenshenb_org.gif", "din分身2": "c5/dinfenshena_org.gif", "din癫当": "a9/dindiandang_org.gif", "din戴熊": "62/dindaixiong_org.gif", "din吃": "92/dinchi_org.gif", "din变身": "57/dinbianshen_org.gif", "din变脸": "dc/dinbianlian_org.gif", "din白旗": "8d/dinbaiqi_org.gif", "din爱你": "83/dinaini_org.gif", "lb装傻": "5e/lbzhuangsha_org.gif", "lb咦": "07/lbyi_org.gif", "lb嗯": "fe/lben_org.gif", "lb糟糕": "3c/lbzaogao_org.gif", "lb嘿嘿": "df/lbheihei_org.gif", "lb鄙视": "a7/lbbishi_org.gif", "lb戳": "7b/lbchuo_org.gif", "lb摇头": "65/lbyaotou_org.gif", "lb惊": "68/lbjing_org.gif", "lb欢乐": "19/lbhuanle_org.gif", "lb雷": "fe/lblei_org.gif", "lb呃": "e9/lbe_org.gif", "lb蹭右": "c8/lbcengyou_org.gif", "lb蹭左": "27/lbcengzuo_org.gif", "lb啊": "98/lba_org.gif", "lb哼": "ea/lbheng_org.gif", "lb撒欢": "7a/lbsahuan_org.gif", "lb爽": "dc/lbshuang_org.gif", "lb味": "d1/lbwei_org.gif", "lb厉害": "bf/lblihai_org.gif", "lb帅": "0d/lbshuai_org.gif", "lb哭": "ec/lbku_org.gif", "lb呵": "9b/lbhe_org.gif", "lb嘻": "12/lbxi_org.gif", "lb讨厌": "5a/lbtaoyan_org.gif", "lt五一": "f7/ltwuyi_org.gif", "lt阴险": "8d/ltyinxian_org.gif", "lt摇摆": "25/ltyaobai_org.gif", "lt羞": "ec/ltxiu_org.gif", "lt闪瞎": "d0/ltshanxia_org.gif", "lt拍手": "8f/ltpaishou_org.gif", "lt蛋疼": "24/ltdanteng_org.gif", "lt撒花": "36/ltsahua_org.gif", "lt母亲节": "9c/ltmuqinjie_org.gif", "lt挖鼻": "c5/ltwabi_org.gif", "lt哈欠": "fc/lehaqian_org.gif", "lt泪目": "31/ltleimu_org.gif", "lt雷": "ee/ltlei_org.gif", "lt中枪": "0c/ltzhongqiang_org.gif", "lt耳朵": "8c/lterduo_org.gif", "lt顶": "02/ltding_org.gif", "lt潜水": "80/ltqianshui_org.gif", "lt拍桌大笑": "80/ltpaizhuodaxiao_org.gif", "lt黑线": "c0/ltheixian_org.gif", "lt喷血": "f1/ltpenxue_org.gif", "lt巨汗": "35/ltjuhan_org.gif", "lt疑惑": "d7/ltyihuo_org.gif", "lt浮云": "a8/ltfuyun_org.gif", "lt笑话": "1f/ltxiaohua_org.gif", "lt喷": "38/ltpen_org.gif", "lt雪": "f8/ltxue_org.gif", "lt转发": "3f/ltzhuanfa_org.gif", "lt偷窥": "57/lttoukui_org.gif", "lt惊吓": "3e/ltjingxia_org.gif", "lt囧": "01/ltjiong_org.gif", "lt灰飞烟灭": "ba/lthuifeiyanmie_org.gif", "lt冰封": "45/ltbengfeng_org.gif", "lt吐": "17/lttu_org.gif", "lt吹泡泡": "b9/ltchuipaopao_org.gif", "lt吓": "e1/ltxia_org.gif", "j疯了": "9c/xyjfengle_org.gif", "j撒娇": "d9/xyjsajiao_org.gif", "j吐血": "57/xyjtuxue_org.gif", "j浪笑": "aa/xyjlangxiao_org.gif", "j作揖": "74/xyjzuoyi_org.gif", "j哎呀": "c0/xyjaiya_org.gif", "j挂了": "b4/xyjguale_org.gif", "j扭秧歌": "8d/xyjniuyangge_org.gif", "j媚眼": "84/xyjmeiyan_org.gif", "j来嘛": "ed/xyjlaima_org.gif", "j蹭": "65/xyjceng_org.gif", "xyj年年有鱼": "b1/longnianxyjyu_org.gif", "xyj红包": "d1/longnianxyjhb_org.gif", "xyj拜年": "e3/longnianxyjbai_org.gif", "抓沙发": "63/chn_zhuashafa_org.gif", "震撼": "ae/chn_zhenhan_org.gif", "晕晕": "bd/chn_yun_org.gif", "瞎眼": "06/chn_xiayan_org.gif", "为难": "7f/chn_weinan_org.gif", "舔": "3a/chn_tian_org.gif", "流汗": "99/chn_liuhan_org.gif", "冷": "48/chn_leng_org.gif", "老大": "90/chn_laoda_org.gif", "瞌睡": "60/chn_keshui_org.gif", "可怜的": "2b/chn_kelian_org.gif", "咖啡咖啡": "d7/chn_kafei_org.gif", "坏笑": "79/chn_huaixiao_org.gif", "顶啊": "c0/chn_ding_org.gif", "好得意": "9e/chn_deyi_org.gif", "冲啊": "b5/chn_chonga_org.gif", "吃西瓜": "63/chn_chixigua_org.gif", "不要啊": "5e/chn_buyaoya_org.gif", "飙泪中": "04/chn_biaolei_org.gif", "爱你哦": "02/chn_aini_org.gif", "挤眼": "c3/zy_org.gif", "亲亲": "8f/qq_org.gif", "怒骂": "89/nm_org.gif", "太开心": "58/mb_org.gif", "懒得理你": "17/ldln_org.gif", "打哈欠": "f3/k_org.gif", "生病": "b6/sb_org.gif", "书呆子": "61/sdz_org.gif", "失望": "0c/sw_org.gif", "可怜": "af/kl_org.gif", "黑线": "91/h_org.gif", "吐": "9e/t_org.gif", "委屈": "73/wq_org.gif", "思考": "e9/sk_org.gif", "哈哈": "6a/laugh.gif", "嘘": "a6/x_org.gif", "右哼哼": "98/yhh_org.gif", "左哼哼": "6d/zhh_org.gif", "疑问": "5c/yw_org.gif", "阴险": "6d/yx_org.gif", "顶": "91/d_org.gif", "钱": "90/money_org.gif", "悲伤": "1a/bs_org.gif", "鄙视": "71/bs2_org.gif", "拜拜": "70/88_org.gif", "吃惊": "f4/cj_org.gif", "闭嘴": "29/bz_org.gif", "衰": "af/cry.gif", "愤怒": "bd/fn_org.gif", "感冒": "a0/gm_org.gif", "酷": "40/cool_org.gif", "来": "40/come_org.gif", "good": "d8/good_org.gif", "haha": "13/ha_org.gif", "不要": "c7/no_org.gif", "ok": "d6/ok_org.gif", "拳头": "cc/o_org.gif", "弱": "d8/sad_org.gif", "握手": "0c/ws_org.gif", "赞": "d0/z2_org.gif", "耶": "d9/ye_org.gif", "最差": "3e/bad_org.gif", "打哈气": "f3/k_org.gif", "可爱": "14/tza_org.gif", "嘻嘻": "0b/tootha_org.gif", "汗": "24/sweata_org.gif", "呵呵": "ac/smilea_org.gif", "困": "7f/sleepya_org.gif", "睡觉": "6b/sleepa_org.gif", "害羞": "6e/shamea_org.gif", "泪": "9d/sada_org.gif", "爱你": "6d/lovea_org.gif", "挖鼻屎": "a0/kbsa_org.gif", "花心": "8c/hsa_org.gif", "偷笑": "19/heia_org.gif", "心": "40/hearta_org.gif", "哼": "49/hatea_org.gif", "鼓掌": "36/gza_org.gif", "晕": "d9/dizzya_org.gif", "馋嘴": "a5/cza_org.gif", "抓狂": "62/crazya_org.gif", "抱抱": "27/bba_org.gif", "怒": "7c/angrya_org.gif", "右抱抱": "0d/right_org.gif", "左抱抱": "54/left_org.gif", "g思考": "3f/guibao1sikao_org.gif", "g震惊": "ba/guibao2zhenjing_org.gif", "g狂笑": "cd/guibao3kuangxiao_org.gif", "g脸红": "e2/guibao4lianhong_org.gif", "g发愣": "70/guibao5faleng_org.gif", "g话痨": "97/guibao6hualao_org.gif", "g吹发": "e4/guibao7chuifa_org.gif", "g爆哭": "1b/guibao8baoku_org.gif", "g伤心": "e9/guibao9shangxin_org.gif", "g得瑟": "16/guibao10dese_org.gif", "g魅眼": "bd/guibao11meiyan_org.gif", "g无辜": "f8/guibao12wugu_org.gif", "g挑眉": "5e/guibao13tiaomei_org.gif", "g墨镜1": "cf/guibao14mojing_org.gif", "g墨镜2": "4f/guibao16mojing_org.gif", "g变脸": "a5/guibao17bianlian_org.gif", "g扇笑": "96/guibao18shanxiao_org.gif", "g扣鼻": "76/guibao19koubi_org.gif", "g扣鼻2": "92/guibao20koubi_org.gif", "g瀑汗": "c6/guibao21baohan_org.gif", "g汗滴": "9e/guibao22handi_org.gif", "g咀嚼": "01/guibao23jujue_org.gif", "g阴影": "fd/guibao24yinying_org.gif", "g鼻血": "fe/guibao25bixue_org.gif", "g呕吐": "15/guibao26outu_org.gif", "g噴血": "6e/guibao27penxue_org.gif", "g泪滴": "38/guibao28leidi_org.gif", "g惊讶1": "b5/guibao29jingya_org.gif", "g头晕": "cf/guibao30touyun_org.gif", "g闪牙1": "3e/guibao31shanya_org.gif", "g闪牙2": "17/guibao32shanya_org.gif", "g巨汗": "28/guibao33juhan_org.gif", "g鼓掌": "8a/guibao34guzhang_org.gif", "g招呼": "ee/guibao35zhaohu_org.gif", "g鼓掌2": "27/guibao36guzhang_org.gif", "g无所谓": "40/guibao37wusuowei_org.gif", "g雷击": "1c/guibao38leiji_org.gif", "g邪笑": "75/guibao39xiexiao_org.gif", "g裸奔1": "53/guibao40luoben_org.gif", "g裸奔2": "e5/guibao41luoben_org.gif", "g裸奔3": "fc/guibao42luoben_org.gif", "g举刀": "2e/guibao43judao_org.gif", "g喝茶": "f0/guibao44hecha_org.gif", "g摇手": "0d/guibao45yaoshou_org.gif", "g病了": "fd/guibao46bingle_org.gif", "g冻上": "2e/guibao47dongshang_org.gif", "g好冷": "9b/guibao48haoleng_org.gif", "g委屈": "67/guibao49weiqu_org.gif", "g发飘": "d6/guibao50fapiao_org.gif", "g卖萌": "e7/guibao51maimeng_org.gif", "g唱歌": "62/guibao52changge_org.gif", "g吃糖": "ec/guibao53chitang_org.gif", "g桂宝": "12/guibao54guibao_org.gif", "g汪汪": "7a/guibao55wangwang_org.gif", "g吐舌": "32/guibao56tushe_org.gif", "g骨头": "df/guibao57gutou_org.gif", "g口水": "f2/guibao58koushui_org.gif", "g惊讶2": "02/guibao59jingya_org.gif", "g爆哭2": "51/guibao60baoku_org.gif", "g激动": "fc/guibao60jidong_org.gif", "lm招财猫": "7d/lmmzhaocaimao0_org.gif", "lm贼笑": "2a/lmmzeixiao0_org.gif", "lm严肃": "fe/lmmyansu0_org.gif", "lm小地主": "a3/lmmxiaodizhu0_org.gif", "lm无奈": "6a/lmmwunai0_org.gif", "lm挖鼻屎": "73/lmmwabisi0_org.gif", "lm天然呆": "93/lmmtianrandai0_org.gif", "lm生病了": "28/lmmshengbingle0_org.gif", "lm扑克脸": "ba/lmmpukelian0_org.gif", "lm瀑布汗": "cb/lmmpubuhan0_org.gif", "lm磨牙": "13/lmmmoya0_org.gif", "lm没听见": "fa/lmmmeitingjian0_org.gif", "lm没事吧": "9f/lmmmeishiba0_org.gif", "lm茫然": "49/lmmmangran0_org.gif", "lm泪流满面": "92/lmmleiliumanmian0_org.gif", "lm囧汗": "29/lmmjionghan0_org.gif", "lm惊恐": "b4/lmmjingkong0_org.gif", "lm惊呆": "e5/lmmjingdai0_org.gif", "lm警察": "63/lmmjingcha0_org.gif", "lm混乱中": "98/lmmhunluan0_org.gif", "lm花痴": "bc/lmmhuachi0_org.gif", "lm喝水": "d3/lmmheshui0_org.gif", "lm嘿嘿": "fc/lmmheihei0_org.gif", "lm哈哈哈": "97/lmmhahaha0_org.gif", "lm干笑": "9e/lmmganxiao0_org.gif", "lm疯了": "24/lmmfengle0_org.gif", "lm恶心": "d6/lmmexin0_org.gif", "lm嘟嘟嘴": "de/lmmduduzui0_org.gif", "lm滴蜡": "cd/lmmdila0_org.gif", "lm点头": "39/lmmdiantou0_org.gif", "lm大怒": "cf/lmmdanu0_org.gif", "lm大惊失色": "08/lmmdajingshise0_org.gif", "lm呆笑": "f9/lmmdaixiao0_org.gif", "lm搭错线": "9d/lmmdacuoxian0_org.gif", "lm大便": "3c/lmmdabian0_org.gif", "lm不": "29/lmmbu0_org.gif", "lm鼻涕虫": "11/lmmbitichong0_org.gif", "lm暴雨汗": "db/lmmbaoyuhan0_org.gif", "lm啊呜啊呜": "77/lmmawuawu0_org.gif", "lm爱爱爱": "44/lmmaiaiai0_org.gif", "mk拜年": "7b/longnianmk_org.gif", "真淡定": "61/cat_zhendanding_org.gif", "运气中": "c3/cat_yunqizhong_org.gif", "嗯": "03/cat_yi_org.gif", "一头竖线": "bb/cat_yitoushuxian_org.gif", "星星眼儿": "9c/cat_xingxingyan_org.gif", "笑眯眯": "26/cat_xiaomimi_org.gif", "小地主": "be/cat_xiaodizhu_org.gif", "我错了": "54/cat_wocuole_org.gif", "喂": "63/cat_wei_org.gif", "伸舌头": "21/cat_tushetou_org.gif", "天然呆": "e2/cat_tianrandai_org.gif", "陶醉了": "8d/cat_taozuile_org.gif", "生气了": "39/cat_shengqile_org.gif", "生病鸟": "06/cat_shengbingle_org.gif", "忍不了": "9c/cat_renbuliao_org.gif", "扑克脸": "05/cat_pukelian_org.gif", "瀑布汗": "22/cat_pubuhan_org.gif", "你没事吧": "3d/cat_nimeishiba_org.gif", "内牛满面": "68/cat_neiniumanmian_org.gif", "没听见": "62/cat_meitingjian_org.gif", "哭死啦": "30/cat_kusila_org.gif", "囧汗": "21/cat_jionghan_org.gif", "惊恐中": "f8/cat_jingkongzhong_org.gif", "混乱中": "e8/cat_hunluanzhong_org.gif", "花痴闪闪": "4e/cat_huachishanshan_org.gif", "嘿嘿嘿": "93/cat_heiheihei_org.gif", "哈哈哈哈": "b9/cat_hahaha_org.gif", "干笑中": "4e/cat_ganxiaozhong_org.gif", "恶心死": "c5/cat_exinsi_org.gif", "嘟嘟嘴": "48/cat_duduzui_org.gif", "大怒": "d9/cat_danu_org.gif", "大惊失色": "55/cat_dajingshise_org.gif", "呆呆": "c2/cat_daidai_org.gif", "搭错线": "94/cat_dacuoxian_org.gif", "鼻涕虫": "15/cat_bitichong_org.gif", "暴雨汗": "e2/cat_baoyuhan_org.gif", "啊呜啊呜": "f4/cat_awuawu_org.gif", "哇": "22/cat_ai_org.gif", "爱爱爱": "ac/cat_aiaiai_org.gif", "bed蹬腿": "d5/brddengtui_org.gif", "bed弹跳": "4d/brdtantiao_org.gif", "bed扯": "71/brdche_org.gif", "bed凌乱": "fa/brdlingluan_org.gif", "bed奔跑": "fa/brdbenpao_org.gif", "bed仰卧起坐": "44/brdyangwoqizuo_org.gif", "bed出浴": "dc/brdchuyu_org.gif", "bed练腰": "bb/brdlianyao_org.gif", "bed皮": "85/brdpi_org.gif", "bed挠痒": "f9/brdnaoyang_org.gif", "bed啦啦啦": "a7/brdlalala_org.gif", "bed举哑铃": "eb/brdjuyaling_org.gif", "bed飘忽": "9c/brdpiaohu_org.gif", "bed拍手": "d6/brdpaishou_org.gif", "bed嘿哈": "4c/brdheiha_org.gif", "bed踏步": "72/brdtabu_org.gif", "bed揉眼": "95/brdrouyan_org.gif", "bed转圈": "86/brdzhuanquan_org.gif", "bed飞吻": "d7/brdfeiwen_org.gif", "bed跳": "bc/brdtiao_org.gif", "bed巴掌": "4e/brdbazhang_org.gif", "bed撒娇": "a1/brdsajiao_org.gif", "bed拍脸": "00/brdpailian_org.gif", "bed好饱": "f0/brdhaobao_org.gif", "bed跑": "e9/brdpao_org.gif", "bed兴奋": "56/brdxingfen_org.gif", "c帅": "78/cshuai_org.gif", "c窃喜": "9b/cqiexi_org.gif", "c迷糊": "78/cmihu_org.gif", "c面瘫": "f2/cmiantan_org.gif", "c囧": "15/cjiong_org.gif", "c汗": "4c/chan_org.gif", "c高明": "3d/cgaoming_org.gif", "c大笑": "6d/cdaxiao_org.gif", "c变脸": "6e/cbianlian_org.gif", "c左右看": "ee/xcjzuoyoukan_org.gif", "c坏笑": "10/xcjhuaixiao_org.gif", "c看热闹": "e0/xcjkanrenao_org.gif", "c开心": "40/xcjkaixin_org.gif", "c关注": "79/xcjguanzhu_org.gif", "c娇羞": "88/xcjjiaoxiu_org.gif", "c无语": "8e/xcjwuyu_org.gif", "c疑惑": "cf/xcjyihuo_org.gif", "c正经": "79/xcjzhengjing_org.gif", "c无聊": "95/xcjwuliao_org.gif", "c挖鼻孔": "b9/xcjwabikong_org.gif", "c期待": "ce/xcjqidai_org.gif", "c摇头看": "09/xcjyaotoukan_org.gif", "c亲亲": "a4/xcjqinqin_org.gif", "c羞涩": "94/xcjxiushe_org.gif", "c悲催": "bb/xcjbeicui_org.gif", "c得瑟": "83/xcjdese_org.gif", "c冷眼": "45/xcjlengyan_org.gif", "c惊讶": "81/xcjjingya_org.gif", "c委屈": "48/xcjweiqu_org.gif", "c甩舌头": "a4/xcjshuaishetou_org.gif", "c摇头萌": "4e/xcjyaotoumeng_org.gif", "c抓狂": "d2/xcjzhuakuang_org.gif", "c发火": "20/xcjfahuo_org.gif", "c卖萌": "ca/xcjmaimeng_org.gif", "c伤心": "cf/xcjshangxin_org.gif", "c捂脸": "96/xcjwulian_org.gif", "c震惊哭": "c7/xcjzhenjingku_org.gif", "c摇摆": "75/xcjyaobai_org.gif", "c得意笑": "b0/xcjdeyixiao_org.gif", "c烦躁": "c5/xcjfanzao_org.gif", "c得意": "9c/xcjdeyi_org.gif", "c脸红": "23/xcjlianhong_org.gif", "toto拜年": "0b/longniantoto_org.gif", "bobo拜年": "64/bobolongnian_org.gif", "toto无聊": "4a/totowuliao_org.gif", "toto我最摇滚": "53/totowozuiyaogun_org.gif", "toto数落": "04/totoshuluo_org.gif", "toto睡觉": "cb/totoshuijiao_org.gif", "toto甩头发": "34/totoshuaitoufa_org.gif", "toto飘过": "74/totopiaoguo_org.gif", "toto狂汗": "c9/totokuanghan_org.gif", "toto好累": "30/totohaolei_org.gif", "bobo抓狂": "8d/bobozhuakuang_org.gif", "bobo疑问": "a3/boboyiwen_org.gif", "bobo抛媚眼": "74/bobopaomeiyan_org.gif", "bobo膜拜": "af/bobomobai_org.gif", "bobo纠结": "f0/bobojiujie_org.gif", "bobo不要啊": "d0/bobobuyaoa_org.gif", "bobo不理你": "98/bobobulini_org.gif", "有爱": "b9/totoyouai_org.gif", "气死了": "b2/totoyes_org.gif", "我爱听": "02/tototingge_org.gif", "怒火": "af/totonu_org.gif", "擂鼓": "bd/totoleigu_org.gif", "讥笑": "d8/totojixiao_org.gif", "抛钱": "37/totoheixianpaoqian_org.gif", "变花": "72/boboxianhua_org.gif", "飙泪": "7f/boboweiqu_org.gif", "藏猫猫": "18/bobotoukan_org.gif", "淘气": "9e/bobotiaopi_org.gif", "生闷气": "47/boboshengmenqi_org.gif", "忍": "a7/boboren_org.gif", "泡泡糖": "a5/bobopaopaotang_org.gif", "好的": "e0/bobook_org.gif", "Hi": "44/bobohi_org.gif", "飞吻": "79/bobofeiwen_org.gif", "我爱西瓜": "29/bobochixigua_org.gif", "吓一跳": "ce/bobochijing_org.gif", "吃饭": "87/bobochifan_org.gif", "雾": "68/w_org.gif", "台风": "55/tf_org.gif", "沙尘暴": "69/sc_org.gif", "晴转多云": "d2/qzdy_org.gif", "流星": "8e/lx_org.gif", "龙卷风": "6a/ljf_org.gif", "洪水": "ba/hs2_org.gif", "风": "74/gf_org.gif", "多云转晴": "f3/dyzq_org.gif", "彩虹": "03/ch_org.gif", "冰雹": "05/bb2_org.gif", "微风": "a5/wind_org.gif", "阳光": "1a/sunny_org.gif", "雪": "00/snow_org.gif", "闪电": "e3/sh_org.gif", "下雨": "50/rain.gif", "阴天": "37/dark_org.gif", "鞭炮": "36/../23/bianpao_org.gif", "让红包飞": "c8/../e0/hongbao1_org.gif", "围脖": "3f/weijin_org.gif", "温暖帽子": "f1/wennuanmaozi_org.gif", "手套": "72/shoutao_org.gif", "红包": "71/hongbao_org.gif", "喜": "bf/xi_org.gif", "礼物": "c4/liwu_org.gif", "蛋糕": "6a/cake.gif", "钻戒": "31/r_org.gif", "钻石": "9f/diamond_org.gif", "大巴": "9c/dynamicbus_org.gif", "飞机": "6d/travel_org.gif", "自行车": "46/zxc_org.gif", "汽车": "a4/jc_org.gif", "手机": "4b/sj2_org.gif", "照相机": "33/camera_org.gif", "药": "5d/y_org.gif", "电脑": "df/dn_org.gif", "手纸": "55/sz_org.gif", "落叶": "79/yellowMood_org.gif", "圣诞树": "a2/christree_org.gif", "圣诞帽": "06/chrishat_org.gif", "圣诞老人": "c5/chrisfather_org.gif", "圣诞铃铛": "64/chrisbell_org.gif", "圣诞袜": "08/chrisocks_org.gif", "草泥马": "7a/shenshou_org.gif", "微博三周年": "21/weibo3yr_org.gif", "皇小冠": "92/weibovip_org.gif", "达人一周年": "13/darenanniversary_org.gif", "伦敦奥火": "5a/lundunaohuo_org.gif", "神龙": "34/longniao_org.gif", "龙蛋": "21/longdan_org.gif", "驯鹿": "0a/xunlu_org.gif", "上海志愿者": "21/shfabu_org.gif", "音乐盒": "79/yinyuehe_org.gif", "首发": "eb/shoufa_org.gif", "悼念乔布斯": "26/Jobs_org.gif", "iPhone": "19/iPhone_org.gif", "微博蛋糕": "e3/weibo2zhounian_org.png", "蜡烛": "91/lazu_org.gif", "康乃馨": "2e/muqinjie_org.png", "图片": "ce/tupianimage_org.gif", "植树节": "56/zhishujie_org.gif", "粉蛋糕": "bf/nycake_org.gif", "糖果": "34/candy_org.gif", "万圣节": "73/nanguatou2_org.gif", "火炬": "3b/hj_org.gif", "酒壶": "64/wine_org.gif", "月饼": "96/mooncake3_org.gif", "满月": "5d/moon1_org.gif", "黑板": "47/blackboard_org.gif", "巧克力": "b1/qkl_org.gif", "脚印": "12/jy_org.gif", "酒": "39/j2_org.gif", "狗": "5d/g_org.gif", "工作": "b2/gz3_org.gif", "档案": "ce/gz2_org.gif", "叶子": "b8/green_org.gif", "钢琴": "b2/gq_org.gif", "印迹": "84/foot_org.gif", "钟": "d3/clock_org.gif", "茶": "a8/cha_org.gif", "西瓜": "6b/watermelon.gif", "雨伞": "33/umb_org.gif", "电视机": "b3/tv_org.gif", "电话": "9d/tel_org.gif", "太阳": "e5/sun.gif", "星": "0b/star_org.gif", "哨子": "a0/shao.gif", "话筒": "1b/m_org.gif", "音乐": "d0/music_org.gif", "电影": "77/movie_org.gif", "月亮": "b9/moon.gif", "唱歌": "79/ktv_org.gif", "冰棍": "3a/ice.gif", "房子": "d1/house_org.gif", "帽子": "25/hat_org.gif", "足球": "c0/football.gif", "鲜花": "6c/flower_org.gif", "花": "6c/flower.gif", "风扇": "92/fan.gif", "干杯": "bd/cheer.gif", "咖啡": "64/cafe_org.gif", "ppbbibi": "9e/ppbbibi_org.gif", "ppb靠": "db/ppbkao_org.gif", "ppb发狂": "9d/ppbfakuang_org.gif", "ppb困": "0b/ppbkun_org.gif", "ppb啊哈哈": "ed/ppbahaha_org.gif", "ppb僵尸": "4f/ppbjiangshi_org.gif", "ppb甩嘴": "40/ppbshuaizui_org.gif", "ppb囧": "52/ppbjiong_org.gif", "ppb去死": "86/ppbqusi_org.gif", "ppb晴天霹雳": "61/ppbqingtianpili_org.gif", "ppb啊": "83/ppba_org.gif", "ppb大哭": "00/ppbdaku_org.gif", "ppb我砍": "7e/ppbwokan_org.gif", "ppb扫射": "9a/ppbsaoshe_org.gif", "ppb杀啊": "83/ppbshaa_org.gif", "ppb啊呜": "6e/ppbawu_org.gif", "ppb蝙蝠侠": "f1/ppbbianfuxia_org.gif", "ppb滚": "5a/ppbgun_org.gif", "ppb欢迎欢迎": "df/ppbhuanying_org.gif", "ppb狂吃": "92/ppbkuangchi_org.gif", "ppb讨厌": "73/ppbtaoyan_org.gif", "ppb爱你哟": "0c/ppbainiyo_org.gif", "ppb卖萌": "06/ppbmaimeng_org.gif", "ala扭啊扭": "8f/altniuaniu_org.gif", "ala吐舌头": "3a/alttushetou_org.gif", "ala么么": "ac/altmeme_org.gif", "ala嘿嘿嘿": "94/altheiheihei_org.gif", "ala哼": "cc/altheng_org.gif", "ala囧": "b3/altjiong_org.gif", "ala上火": "1b/altshanghuo_org.gif", "ala啊哈哈哈": "6a/altahahaha_org.gif", "ala飘走": "33/altpiaozou_org.gif", "ala吃货": "a5/altchihuo_org.gif", "ala悲催": "f2/altbeicui_org.gif", "ala讨厌": "43/alttaoyan_org.gif", "ala衰": "7c/altshuai_org.gif", "哎呦熊做面膜": "42/ayxzuomianmo_org.gif", "哎呦熊咒骂": "3b/ayxzma_org.gif", "哎呦熊震惊": "40/ayxzhenjing_org.gif", "哎呦熊yes": "fa/ayxyes_org.gif", "哎呦熊掩面": "a1/ayxyanmian_org.gif", "哎呦熊乌鸦": "9e/ayxwuya_org.gif", "哎呦熊无奈": "bd/ayxwunai_org.gif", "哎呦熊晚安": "78/ayxwanan_org.gif", "哎呦熊生日快乐": "07/ayxshengrikuaile_org.gif", "哎呦熊撒欢": "e6/ayxsahuan_org.gif", "哎呦熊no": "50/ayxno_org.gif", "哎呦熊路过": "bb/ayxluguo_org.gif", "哎呦熊流汗": "e9/ayxliuhan_org.gif", "哎呦熊流鼻血": "65/ayxliubixue_org.gif", "哎呦熊雷死": "43/ayxleisi_org.gif", "哎呦熊泪奔": "09/ayxleiben_org.gif", "哎呦熊哭泣": "09/ayxkuqi_org.gif", "哎呦熊开心": "80/ayxkaixin_org.gif", "哎呦熊开饭咯": "87/ayxkaifanluo_org.gif", "哎呦熊纠结": "95/ayxjiujie_org.gif", "哎呦熊害羞": "29/ayxhaixiu_org.gif", "哎呦熊鼓掌": "ee/ayxguzhang_org.gif", "哎呦熊感动": "ec/ayxgandong_org.gif", "哎呦熊浮云": "f7/ayxfuyun_org.gif", "哎呦熊飞吻": "31/ayxfeiwen_org.gif", "哎呦熊打招呼": "3e/ayxdazhaohu_org.gif", "哎呦熊补妆": "e0/ayxbuzhuang_org.gif", "哎呦熊崩溃": "8e/ayxbenkui_org.gif", "织": "41/zz2_org.gif", "兔子": "81/rabbit_org.gif", "神马": "60/horse2_org.gif", "浮云": "bc/fuyun_org.gif", "给力": "c9/geili_org.gif", "萌": "42/kawayi_org.gif", "熊猫": "6e/panda_org.gif", "互粉": "89/hufen_org.gif", "围观": "f2/wg_org.gif", "扔鸡蛋": "91/rjd_org.gif", "奥特曼": "bc/otm_org.gif", "威武": "70/vw_org.gif", "伤心": "ea/unheart.gif", "热吻": "60/rw_org.gif", "囧": "15/j_org.gif", "orz": "c0/orz1_org.gif", "宅": "d7/z_org.gif", "帅": "36/s2_org.gif", "猪头": "58/pig.gif", "实习": "48/sx_org.gif", "骷髅": "bd/kl2_org.gif", "便便": "34/s_org.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "跳舞花": "70/twh_org.gif", "礼花": "3d/bingo_org.gif", "打针": "b0/zt_org.gif", "叹号": "3b/th_org.gif", "问号": "9d/wh_org.gif", "句号": "9b/jh_org.gif", "逗号": "cc/dh_org.gif", "闪": "ce/03_org.gif", "啦啦": "c1/04_org.gif", "吼吼": "34/05_org.gif", "庆祝": "67/06_org.gif", "嘿": "d3/01_org.gif", "00": "3a/zero_org.gif", "1": "82/one_org.gif", "2": "61/two_org.gif", "3": "78/three_org.gif", "4": "72/four_org.gif", "5": "f5/five_org.gif", "6": "bf/six_org.gif", "7": "32/seven_org.gif", "8": "5c/eight_org.gif", "9": "54/nine_org.gif", "a": "32/newa_org.gif", "b": "fa/weibob_org.gif", "c": "59/weiboc_org.gif", "d": "d8/newd_org.gif", "e": "dd/weiboe_org.gif", "f": "07/newf_org.gif", "g": "16/newg_org.gif", "h": "8b/newh_org.gif", "i": "e6/weiboi_org.gif", "j": "af/newj_org.gif", "k": "a0/newk_org.gif", "l": "f5/newl_org.gif", "m": "98/weibom_org.gif", "n": "e7/newn_org.gif", "o": "f5/weiboo_org.gif", "p": "e7/newp_org.gif", "q": "de/newq_org.gif", "r": "0c/newr_org.gif", "s": "22/news_org.gif", "t": "75/newt_org.gif", "u": "b8/newu_org.gif", "v": "e3/newv_org.gif", "w": "94/weibow_org.gif", "x": "d7/newx_org.gif", "y": "3b/newy_org.gif", "z": "b2/newz_org.gif", "团": "11/tuan_org.gif", "圆": "53/yuan_org.gif", "男孩儿": "4e/kissboy_org.gif", "女孩儿": "1b/kissgirl_org.gif", "kiss": "59/kiss2_org.gif", "鸭梨": "bb/pear_org.gif", "省略号": "0d/shengluehao_org.gif", "雪人": "d9/xx2_org.gif", "做鬼脸": "14/guilian_org.gif", "22": "43/twot_org.gif", "小丑": "6b/xc_org.gif", "点": "fd/weibop_org.gif", "km问号": "13/km1wenhao_org.gif", "km爱你": "cf/km1aini_org.gif", "km白块旋转": "8e/km1baikuaixuanzhuan_org.gif", "km黑块旋转": "36/km1heikuaixuanzhuan_org.gif", "km花痴": "78/km1huachi_org.gif", "km可爱": "7a/km1keai_org.gif", "km切": "ab/km1qie_org.gif", "km亲亲": "78/km1qinqin_org.gif", "km亲亲白块": "48/km1qinqinbaikuai_org.gif", "km亲亲黑块": "6f/km1qinqinheikuai_org.gif", "km挖鼻屎": "b9/km1wabishi_org.gif", "km哇哇哭": "39/km1wawaku_org.gif", "km围观": "a5/km1weiguan_org.gif", "km委屈": "8d/km1weiqu_org.gif", "km羞": "47/km1xiu_org.gif", "kmFL": "21/kmFL_org.gif", "km侦探": "fd/kmzhentan_org.gif", "km嘻嘻": "67/kmxixi_org.gif", "km呜呜1": "ab/kmwuwu1_org.gif", "km冷笑": "18/kmlengxiao_org.gif", "km邮件": "35/kmyoujian_org.gif", "km闹钟": "5c/kmnaozhong_org.gif", "km哼": "e1/kmheng_org.gif", "km无语": "fa/kmwuyu_org.gif", "km黑块不淡定": "91/kmheikuaibudanding_org.gif", "km害怕": "4e/kmhaipa_org.gif", "km呜呜88": "c7/kmwuwu88_org.gif", "km透亮": "b6/kmtouliang_org.gif", "km唔": "ac/kmwu_org.gif", "km侠盗": "99/kmxiadao_org.gif", "km醉": "40/kmzui_org.gif", "km丽莎2": "13/kmlisha2_org.gif", "km酷2": "1c/kmku2_org.gif", "km憨": "19/kmhan_org.gif", "km中毒": "41/kmzhongdu_org.gif", "km电视": "c4/kmdianshi_org.gif", "km困": "0e/kmkun_org.gif", "km高兴": "ed/kmgaoxing_org.gif", "km幺鸡猫": "a8/kmyaojimao_org.gif", "km黑化笑": "26/kmhaihuaxiao_org.gif", "km花猫": "61/kmhuamao_org.gif", "km好吃": "b4/kmhaochi_org.gif", "kmAI": "bc/kmAI_org.gif", "km黑化唠叨": "3e/kmheihualaodao_org.gif", "km好吃惊": "24/kmhaochijing_org.gif", "km唠叨": "4e/kmlaodao_org.gif", "km眼镜": "ce/kmyanjing_org.gif", "km闪": "fb/kmshan_org.gif", "kmV": "9a/kmV_org.gif", "km不淡定": "48/kmbudanding_org.gif", "km鼻血1": "96/kmbixue1_org.gif", "km好饿": "cf/kmhaoe_org.gif", "km上传": "a4/kmshangchuan_org.gif", "km黑化": "c7/kmheihua_org.gif", "km鼻血": "38/kmbixue_org.gif", "km酷": "8a/kmku_org.gif", "km愁": "fd/kmchou_org.gif", "km相机": "2f/kmxiangji_org.gif", "km喜": "c7/kmxi_org.gif", "km得意": "85/kmdeyi_org.gif", "km怒": "23/kmnu_org.gif", "km生气": "d5/kmshengqi_org.gif", "kmDW": "ff/kmDW_org.gif", "km呜血泪": "26/km1wuxuelei_org.gif", "kmPS": "30/kmPS_org.gif", "km馋": "5c/kmchan_org.gif", "km下载": "0e/kmxiazai_org.gif", "kmX": "69/kmX_org.gif", "km情书": "51/kmqingshu_org.gif", "km骷髅": "0e/kmkulou_org.gif", "km丽莎": "8a/kmlisha_org.gif", "km禁": "cb/kmjin_org.gif", "km晕": "38/kmyun_org.gif", "km热": "40/kmre_org.gif", "km冷": "d0/kmleng_org.gif", "km猫": "10/kmmao_org.gif", "bofu吐舌头": "7e/bofutushetou_org.gif", "bofu拜年": "0d/bofulongnian_org.gif", "bofu淫笑": "d2/bofuyinxiao_org.gif", "bofu压力山大": "64/bofuyalishanda_org.gif", "bofu心灰意冷": "77/bofuxinhuiyileng_org.gif", "bofu心动": "76/bofuxindong_org.gif", "bofu咸蛋超人": "6f/bofuxiandanchaoren_org.gif", "bofu食神": "52/bofushishen_org.gif", "bofu票子快来": "93/bofupiaozikuailai_org.gif", "bofu怒": "50/bofunu_org.gif", "bofu扭": "fb/bofuniu_org.gif", "bofu梦遗": "80/bofumengyi_org.gif", "bofu累": "ee/bofulei_org.gif", "bofu啃西瓜": "5a/bofukenxigua_org.gif", "bofu给力": "5c/bofugeili_org.gif", "bofu发愤图强": "71/bofufafentuqiang_org.gif", "bofu抖骚": "1f/bofudousao_org.gif", "bofu得瑟": "7e/bofudese_org.gif", "bofu打飞机": "37/bofudafeiji_org.gif", "bofu变脸": "bb/bofubianlian_org.gif", "bofu蹦极": "5e/bofubengji_org.gif", "bofu暴躁": "20/bofubaozao_org.gif", "萌萌星星眼": "00/mmxingxingyan_org.gif", "萌萌打滚": "53/mmdagun_org.gif", "萌萌甩帽": "05/mmshuaimaozi_org.gif", "萌萌摔瓶": "d1/mmshuaipingzi_org.gif", "萌萌扭屁股": "4b/mmniupigu_org.gif", "萌萌惊讶": "96/mmjidujingya_org.gif", "萌萌懒得理": "81/mmlandeli_org.gif", "萌萌偷乐": "95/mmwuzuile_org.gif", "萌萌鄙视": "d1/mmbishini_org.gif", "萌萌哈欠": "c4/mmdagehaqian_org.gif", "萌萌石化": "c9/mmshihua_org.gif", "萌萌敲鼓": "d9/mmqiaodagu_org.gif", "萌萌叹气": "e4/mmtankouqi_org.gif", "萌萌捶地笑": "ff/mmchuidixiao_org.gif", "萌萌捂脸": "a7/mmwulian_org.gif", "萌萌流汗": "b8/mmkuangliuhan_org.gif", "萌萌抠鼻": "3e/mmkoubizi_org.gif", "萌萌泪奔": "1f/mmleiben_org.gif", "萌萌献花": "f3/mmxianduohua_org.gif", "欢欢": "c3/liaobuqi_org.gif", "乐乐": "66/guanbuzhao_org.gif", "管不着爱": "78/2guanbuzhao1_org.gif", "爱": "09/ai_org.gif", "了不起爱": "11/2liaobuqiai_org.gif", "gbz真穿越": "2a/gbzzhenchuanyue_org.gif", "gbz再睡会": "73/gbzzaishuihui_org.gif", "gbz呜呜": "c6/gbzwuwu_org.gif", "gbz委屈": "74/gbzweiqu_org.gif", "gbz晚安了": "79/gbzwananle_org.gif", "gbz祈福": "4e/gbzqifu_org.gif", "gbz祈福了": "96/gbzqifule_org.gif", "gbz窃笑": "57/gbzqiexiao_org.gif", "gbz起床啦": "8d/gbzqichuangla_org.gif", "gbz困": "f5/gbzkun_org.gif", "gbz加班": "53/gbzjiaban_org.gif", "gbz加班中": "53/gbzjiabanzhong_org.gif", "gbz饿": "50/gbze_org.gif", "gbz饿晕": "e4/gbzeyun_org.gif", "gbz得意": "0a/gbzdeyi_org.gif", "gbz大笑": "f7/gbzdaxiao_org.gif", "gbz穿越了": "16/gbzchuanyuele_org.gif", "有点困": "68/youdiankun_org.gif", "yes": "9e/yes_org.gif", "咽回去了": "72/yanhuiqule_org.gif", "鸭梨很大": "01/yalihenda_org.gif", "羞羞": "42/xiuxiu_org.gif", "喜欢你": "6b/xihuang_org.gif", "小便屁": "a0/xiaobianpi_org.gif", "无奈": "d6/wunai22_org.gif", "兔兔": "da/tutu_org.gif", "吐舌头": "98/tushetou_org.gif", "头晕": "48/touyun_org.gif", "听音乐": "d3/tingyinyue_org.gif", "睡大觉": "65/shuijiao_org.gif", "闪闪紫": "9e/shanshanzi_org.gif", "闪闪绿": "a8/shanshanlu_org.gif", "闪闪灰": "1e/shanshanhui_org.gif", "闪闪红": "10/shanshanhong_org.gif", "闪闪粉": "9d/shanshanfen_org.gif", "咆哮": "4b/paoxiao_org.gif", "摸头": "2c/motou_org.gif", "真美好": "d2/meihao_org.gif", "脸红自爆": "d8/lianhongzibao_org.gif", "哭泣女": "1c/kuqinv_org.gif", "哭泣男": "38/kuqinan_org.gif", "空": "fd/kong_org.gif", "尽情玩": "9f/jinqingwan_org.gif", "惊喜": "b8/jingxi_org.gif", "惊呆": "58/jingdai_org.gif", "胡萝卜": "e1/huluobo_org.gif", "欢腾去爱": "63/huangtengquai_org.gif", "感冒了": "67/ganmao_org.gif", "怒了": "ef/fennu_org.gif", "我要奋斗": "a6/fendou123_org.gif", "发芽": "95/faya_org.gif", "春暖花开": "ca/chunnuanhuakai_org.gif", "抽烟": "83/chouyan_org.gif", "昂": "31/ang_org.gif", "啊": "12/aa_org.gif", "自插双目": "d3/zichashuangmu_org.gif", "咦": "9f/yiwen_org.gif", "嘘嘘": "cf/xu_org.gif", "我吃": "00/wochiwode_org.gif", "喵呜": "a7/weiqu_org.gif", "v5": "c5/v5_org.gif", "调戏": "f7/tiaoxi_org.gif", "打牙": "d7/taihaoxiaole_org.gif", "手贱": "b8/shoujian_org.gif", "色": "a1/se_org.gif", "喷": "4a/pen_org.gif", "你懂的": "2e/nidongde_org.gif", "喵": "a0/miaomiao_org.gif", "美味": "c1/meiwei_org.gif", "惊恐": "46/jingkong_org.gif", "感动": "7c/gandong_org.gif", "放开": "55/fangkai_org.gif", "痴呆": "e8/chidai_org.gif", "扯脸": "99/chelian_org.gif", "不知所措": "ab/buzhisuocuo_org.gif", "白眼": "24/baiyan_org.gif", "cc疯掉": "22/ccfengdiao_org.gif", "cc吃货": "c6/ccchihuo_org.gif", "cc疑问": "ac/ccyiwen_org.gif", "cc老爷": "2c/cclaoye_org.gif", "cc开心": "e3/cckaixin_org.gif", "cc怕怕": "60/ccpapa_org.gif", "cc哎呦喂": "1e/ccAUV_org.gif", "cc鼻血": "33/ccbixue_org.gif", "cc没有": "93/ccmeiyou_org.gif", "cc晕菜": "a0/ccyuncai_org.gif", "cc媚眼": "21/ccmeiyan_org.gif", "cc鄙视": "e7/ccbishi_org.gif", "cc委屈": "45/ccweiqu_org.gif", "cc革命": "5b/ccgeming_org.gif", "cc撞墙": "4d/cczhuangqiang_org.gif", "cc穿越": "00/ccchuanyue_org.gif", "cc嘿嘿": "86/ccheihei_org.gif", "cc不行": "37/ccbuxing_org.gif", "cc大哭": "eb/ccdaku_org.gif", "cc耍赖": "67/ccshualai_org.gif", "cc激动": "0b/ccjidong_org.gif", "cc哭泣": "da/cckuqi_org.gif", "cc亲亲": "c7/ccqinqin_org.gif", "cc心虚": "ec/ccxinxu_org.gif", "cc舞动": "52/ccwudong_org.gif", "cc数钱": "4c/ccshuqian_org.gif", "cc抱抱": "b5/ccbaobao_org.gif", "cc睡觉": "50/ccshuijiao_org.gif", "cc僵尸": "96/ccjiangshi_org.gif", "cc我踩": "08/ccwocai_org.gif", "cc运动": "58/ccyundong_org.gif", "cc恭喜": "17/ccgongxi_org.gif", "cc歌唱": "fd/ccgechang_org.gif", "cc无语": "01/ccwuyu_org.gif", "cc郁闷": "0c/ccyumen_org.gif", "cc祈祷": "e7/ccqidao_org.gif", "cc思考": "c2/ccsikao_org.gif", "cc惊讶": "1f/ccjingya_org.gif", "cc得瑟": "f9/ccdese_org.gif", "cc不嘛": "2d/ccbuma_org.gif", "cc生气": "4b/ccshengqi_org.gif", "cc乞讨": "69/ccqitao_org.gif", "cc呼啦": "f7/cchula_org.gif", "cc偷乐": "84/cctoule_org.gif", "cc无奈": "c3/ccwunai_org.gif", "cc蒙面": "df/ccmengmian_org.gif", "cc色色": "b6/ccsese_org.gif", "cc哈哈": "36/cchaha_org.gif", "nono卖帅": "f9/nonomaishuai_org.gif", "nono摇手指": "dc/nonoyaoshouzhi_org.gif", "nono来呀来呀": "0c/nonolaiyalaiya_org.gif", "nono哭": "9b/nonoku_org.gif", "nono挑逗": "4f/nonotiaodou_org.gif", "nono娇羞": "e0/nonojiuxiu_org.gif", "nono生病": "48/nonoshengbing_org.gif", "nono开心": "53/nonokaixin_org.gif", "nono看不见我": "00/nonokanbujianwo_org.gif", "nono眨眼": "6b/nonozhayan_org.gif", "nono大礼包": "7d/nonodalibao_org.gif", "nono水汪汪": "3b/nonoshuiwangwang_org.gif", "nonokiss": "01/nonokiss_org.gif", "nono圣诞节": "8b/nonoshengdanjie_org.gif", "nono跳舞": "fc/nonotiaowu_org.gif", "nono害羞": "41/nonohaixiu_org.gif", "nono无语": "91/nonowuyu_org.gif", "nono放屁": "73/nonofangpi_org.gif", "nono晕": "b7/nonoyun_org.gif", "nono悠哉跑": "00/nonoyouzaipao_org.gif", "nono打哈欠": "09/nonodahaqian_org.gif", "nono扭": "c1/nononiu_org.gif", "nonomua": "b0/nonomua_org.gif", "nono尴尬": "e3/nonoganga_org.gif", "nono跑步": "97/nonopaobu_org.gif", "nono转圈圈": "3e/nonozhuanquanquan_org.gif", "nono心心眼": "80/nonoxinxinyan_org.gif", "nono睡觉": "3e/nonoshuijiao_org.gif", "nono星星眼": "d7/nonoxingxingyan_org.gif", "nono抛小球": "fb/nonopaoxiaoqiu_org.gif", "dino求人": "67/dinoqiuren_org.gif", "dino泪奔": "cb/dinoleiben_org.gif", "dino害羞": "9d/dinohaixiu_org.gif", "dino等人": "5a/dinodengren_org.gif", "dino囧": "7b/dinojiong_org.gif", "dino抠鼻": "d0/dinokoubi_org.gif", "dino心碎": "79/dinoxinsui_org.gif", "dino撒花": "7d/dinosahua_org.gif", "dino电筒": "c0/dinodiantong_org.gif", "dino热": "74/dinore_org.gif", "dino坏笑": "c4/dinohuaixiao_org.gif", "dino礼物": "5e/dinoliwu_org.gif", "dino晕倒": "55/dinoyundao_org.gif", "dino诡异": "28/dinoguiyi_org.gif", "dino瞌睡": "cf/dinokeshui_org.gif", "dino安慰": "3b/dinoanwei_org.gif", "dino再见": "50/dinozaijian_org.gif", "dino甜筒": "04/dinotiantong_org.gif", "dino不屑": "ee/dinobuxie_org.gif", "dino早安": "9c/dinozaoan_org.gif", "dino高兴": "16/dinogaoxing_org.gif", "dino投降": "34/dinotouxiang_org.gif", "dino鬼脸": "7c/dinoguilian_org.gif", "dino吃饭": "0a/dinochifan_org.gif", "dino失望": "f4/dinoshiwang_org.gif", "dino数钱": "f7/dinoshuqian_org.gif", "dino打你": "2a/dinodani_org.gif", "dino狂叫": "09/dinokuangjiao_org.gif", "dino吐血": "06/dinotuxue_org.gif", "dino委屈": "e0/dinoweiqu_org.gif", "dino划圈": "04/dinohuaquan_org.gif", "dino发怒": "77/dinofanu_org.gif", "dino吃惊": "7b/dinochijing_org.gif", "dino喝酒": "4f/dinohejiu_org.gif", "dino咬手帕": "0b/dinoyaoshoupa_org.gif", "dino臭美": "e1/dinochoumei_org.gif", "dino困惑": "b7/dinokunhuo_org.gif", "dino许愿": "7b/dinoxuyuan_org.gif", "dino打滚": "19/dinodagun_org.gif", "yz我倒": "4e/yzwodao_org.gif", "yz撞玻璃": "e0/yzzhuangboli_org.gif", "yz淋浴": "77/yzlinyu_org.gif", "yz纳尼": "a4/yznani_org.gif", "yz欢呼": "e8/yzhuanhu_org.gif", "yz拍桌子": "e4/yzpaizhuozi_org.gif", "yz光棍": "b8/yzguanglun_org.gif", "yz哇哇叫": "8a/yzwawajiao_org.gif", "yz求你了": "91/yzqiunile_org.gif", "yz翻滚": "9b/yzfangun_org.gif", "yz偷着笑": "22/yztouzhexiao_org.gif", "yzye": "66/yzye_org.gif", "yz投降": "32/yztouxiang_org.gif", "yz抽风": "2d/yzchoufeng_org.gif", "yzoye": "7b/yzoye_org.gif", "yz撒花": "c1/yzsahua_org.gif", "yz抱枕头": "fd/yzbaozhentou_org.gif", "yz甩手绢": "ae/yzshuaishoujuan_org.gif", "yz右边亮了": "6f/yzyoubianliangle_org.gif", "yz人呢": "f5/yzrenne_org.gif", "yz傻兮兮": "9a/yzshaxixi_org.gif", "yz砸": "ac/yzza_org.gif", "yz招财猫": "ba/yzzhaocaimao_org.gif", "yz扇扇子": "63/yzshanshanzi_org.gif", "yz不呢": "df/yzbune_org.gif", "yz拍屁股": "cc/yzpaipigu_org.gif", "yz委屈哭": "be/yzweiquku_org.gif", "yz听歌": "f8/yztingge_org.gif", "yz吃瓜": "3f/yzchigua_org.gif", "yz好哇": "70/yzhaowa_org.gif", "yz来看看": "fb/yzlaikankan_org.gif", "yz焦糖舞": "eb/yzjiaotangwu_org.gif", "yz放屁": "99/yzfangpi_org.gif", "yz吃苹果": "87/yzchipingguo_org.gif", "yz太好了": "61/yztaihaole_org.gif", "yz好紧张": "13/yzhaojinzhang_org.gif", "ali做鬼脸": "b3/alizuoguilian0_org.gif", "ali追": "08/alizhui0_org.gif", "ali转圈哭": "76/alizhuanquanku0_org.gif", "ali转": "6d/alizhuan0_org.gif", "ali郁闷": "0e/aliyumen0_org.gif", "ali元宝": "ac/aliyuanbao0_org.gif", "ali摇晃": "66/aliyaohuang0_org.gif", "ali嘘嘘嘘": "0f/alixuxuxu0_org.gif", "ali羞": "c2/alixiu0_org.gif", "ali笑死了": "3b/alixiaosile0_org.gif", "ali笑": "64/alixiao0_org.gif", "ali掀桌子": "e2/alixianzhuozi0_org.gif", "ali献花": "42/alixianhua0_org.gif", "ali想": "61/alixiang0_org.gif", "ali吓": "88/alixia0_org.gif", "ali哇": "f0/aliwa0_org.gif", "ali吐血": "c5/alituxue0_org.gif", "ali偷看": "8f/alitoukan0_org.gif", "ali送礼物": "e3/alisongliwu0_org.gif", "ali睡": "35/alishui0_org.gif", "ali甩手": "f1/alishuaishou0_org.gif", "ali摔": "0d/alishuai0_org.gif", "ali撒钱": "66/alisaqian0_org.gif", "ali亲一个": "4c/aliqinyige0_org.gif", "ali欠揍": "7b/aliqianzou0_org.gif", "ali扑倒": "e9/alipudao0_org.gif", "ali扑": "a2/alipu0_org.gif", "ali飘过": "6b/alipiaoguo0_org.gif", "ali飘": "5d/alipiao0_org.gif", "ali喷嚏": "90/alipenti0_org.gif", "ali拍拍手": "7d/alipaipaishou0_org.gif", "ali你": "82/alini0_org.gif", "ali挠墙": "a3/alinaoqiang0_org.gif", "ali摸摸头": "bb/alimomotou0_org.gif", "ali溜": "08/aliliu0_org.gif", "ali赖皮": "7c/alilaipi0_org.gif", "ali来吧": "be/alilaiba0_org.gif", "ali揪": "c3/alijiu0_org.gif", "ali囧": "b5/alijiong0_org.gif", "ali惊": "f9/alijing0_org.gif", "ali加油": "3b/alijiayou0_org.gif", "ali僵尸跳": "03/alijiangshitiao0_org.gif", "ali呼拉圈": "98/alihulaquan0_org.gif", "ali画圈圈": "12/alihuaquanquan0_org.gif", "ali欢呼": "a5/alihuanhu0_org.gif", "ali坏笑": "aa/alihuaixiao0_org.gif", "ali跪求": "48/aliguiqiu0_org.gif", "ali风筝": "23/alifengzheng0_org.gif", "ali飞": "de/alifei0_org.gif", "ali翻白眼": "c9/alifanbaiyan0_org.gif", "ali顶起": "b5/aliding0_org.gif", "ali点头": "0d/alidiantou0_org.gif", "ali得瑟": "bc/alidese0_org.gif", "ali打篮球": "98/alidalanqiu0_org.gif", "ali打滚": "02/alidagun0_org.gif", "ali大吃": "a2/alidachi0_org.gif", "ali踩": "15/alicai0_org.gif", "ali不耐烦": "e2/alibunaifan0_org.gif", "ali不嘛": "6d/alibuma0_org.gif", "ali别吵": "bb/alibiechao0_org.gif", "ali鞭炮": "01/alibianpao0_org.gif", "ali抱一抱": "16/alibaoyibao0_org.gif", "ali拜年": "8a/alibainian0_org.gif", "ali88": "69/alibaibai0_org.gif", "狂笑": "d5/zk_org.gif", "冤": "5f/wq2_org.gif", "蜷": "87/q2_org.gif", "美好": "ae/mh_org.gif", "乐和": "5f/m2_org.gif", "揪耳朵": "15/j3_org.gif", "晃": "bf/h2_org.gif", "high": "e7/f_org.gif", "蹭": "33/c_org.gif", "抱枕": "f4/bz3_org.gif", "不公平": "85/bgp_org.gif", "猥琐": "e1/weisuo_org.gif", "挑眉": "c9/tiaomei_org.gif", "挑逗": "3c/tiaodou_org.gif", "亲耳朵": "1c/qinerduo_org.gif", "媚眼": "32/meiyan_org.gif", "冒个泡": "32/maogepao_org.gif", "囧耳朵": "f0/jiongerduo_org.gif", "鬼脸": "14/guilian_org.gif", "放电": "fd/fangdian_org.gif", "悲剧": "ea/beiju_org.gif", "抚摸": "78/touch_org.gif", "大汗": "13/sweat_org.gif", "大惊": "74/suprise_org.gif", "惊哭": "0c/supcry_org.gif", "星星眼": "5c/stareyes_org.gif", "好困": "8b/sleepy_org.gif", "呕吐": "75/sick_org.gif", "加我一个": "ee/plus1_org.gif", "痞痞兔耶": "19/pipioye_org.gif", "mua": "c6/muamua_org.gif", "面抽": "fd/mianchou_org.gif", "大笑": "6a/laugh_org.gif", "揉": "d6/knead_org.gif", "痞痞兔囧": "38/jiong_org.gif", "哈尼兔耶": "53/honeyoye_org.gif", "开心": "40/happy_org.gif", "咬手帕": "af/handkerchief_org.gif", "去": "6b/go_org.gif", "晕死了": "a4/dizzy_org.gif", "大哭": "af/cry_org.gif", "扇子遮面": "a1/coverface_org.gif", "怒气": "ea/angery_org.gif", "886": "6f/886_org.gif", "白羊": "07/byz2_org.gif", "射手": "46/ssz2_org.gif", "双鱼": "e2/syz2_org.gif", "双子": "89/szz2_org.gif", "天秤": "6b/tpz2_org.gif", "天蝎": "1e/txz2_org.gif", "水瓶": "1b/spz2_org.gif", "处女": "62/cnz2_org.gif", "金牛": "3b/jnz2_org.gif", "巨蟹": "d2/jxz2_org.gif", "狮子": "4a/leo2_org.gif", "摩羯": "16/mjz2_org.gif", "天蝎座": "09/txz_org.gif", "天秤座": "c1/tpz_org.gif", "双子座": "d4/szz_org.gif", "双鱼座": "7f/syz_org.gif", "射手座": "5d/ssz_org.gif", "水瓶座": "00/spz_org.gif", "摩羯座": "da/mjz_org.gif", "狮子座": "23/leo_org.gif", "巨蟹座": "a3/jxz_org.gif", "金牛座": "8d/jnz_org.gif", "处女座": "09/cnz_org.gif", "白羊座": "e0/byz_org.gif", "爱心传递": "b8/aixincd_org.gif", "绿丝带": "9b/green_band_org.gif", "粉红丝带": "77/pink_org.gif", "红丝带": "59/red_band_org.gif", "加油": "d4/jiayou_org.gif", "国旗": "dc/flag_org.gif", "金牌": "f4/jinpai_org.gif", "银牌": "1e/yinpai_org.gif", "铜牌": "26/tongpai_org.gif", "哨子": "a0/shao.gif", "黄牌": "a0/yellowcard.gif", "红牌": "64/redcard.gif", "足球": "c0/football.gif", "篮球": "2c/bball_org.gif", "黑8": "6b/black8_org.gif", "排球": "cf/volleyball_org.gif", "游泳": "b9/swimming_org.gif", "乒乓球": "a5/pingpong_org.gif", "投篮": "7a/basketball_org.gif", "羽毛球": "77/badminton_org.gif", "射门": "e0/zuqiu_org.gif", "射箭": "40/shejian_org.gif", "举重": "14/juzhong_org.gif", "微微笑": "9a/xiaoheweixiao_org.gif", "特委屈": "02/xiaoheweiqu_org.gif", "我吐": "c1/xiaohetua_org.gif", "很生气": "66/xiaoheshengqi_org.gif", "流鼻涕": "08/xiaoheliubiti_org.gif", "默默哭泣": "a0/xiaohekuqi_org.gif", "小盒汗": "e3/xiaohehan_org.gif", "发呆中": "44/xiaohefadai_org.gif", "不理你": "a8/xiaohebulini_org.gif", "强烈鄙视": "d4/xiaohebishi_org.gif", "烦躁": "c5/fanzao_org.gif", "呲牙": "c1/ciya_org.gif", "有钱": "e6/youqian_org.gif", "微笑": "05/weixiao_org.gif", "帅爆": "c1/shuaibao_org.gif", "生气": "0a/shengqi_org.gif", "生病了": "19/shengbing_org.gif", "色眯眯": "90/semimi_org.gif", "疲劳": "d1/pilao_org.gif", "瞄": "14/miao_org.gif", "哭": "79/ku_org.gif", "好可怜": "76/kelian_org.gif", "紧张": "75/jinzhang_org.gif", "惊讶": "dc/jingya_org.gif", "激动": "bb/jidong_org.gif", "见钱": "2b/jianqian_org.gif", "汗了": "7d/han_org.gif", "奋斗": "4e/fendou_org.gif", "小人得志": "09/xrdz_org.gif", "哇哈哈": "cc/whh_org.gif", "叹气": "90/tq_org.gif", "冻结": "d3/sjdj_org.gif", "切": "1d/q_org.gif", "拍照": "ec/pz_org.gif", "怕怕": "7c/pp_org.gif", "怒吼": "4d/nh_org.gif", "膜拜": "9f/mb2_org.gif", "路过": "70/lg_org.gif", "泪奔": "34/lb_org.gif", "脸变色": "cd/lbs_org.gif", "亲": "05/kiss_org.gif", "恐怖": "86/kb_org.gif", "交给我吧": "e2/jgwb_org.gif", "欢欣鼓舞": "2b/hxgw_org.gif", "高兴": "c7/gx3_org.gif", "尴尬": "43/gg_org.gif", "发嗲": "4e/fd_org.gif", "犯错": "19/fc_org.gif", "得意": "fb/dy_org.gif", "吵闹": "fa/cn_org.gif", "冲锋": "2f/cf_org.gif", "抽耳光": "eb/ceg_org.gif", "差得远呢": "ee/cdyn_org.gif", "被砸": "5a/bz2_org.gif", "拜托": "6e/bt_org.gif", "必胜": "cf/bs3_org.gif", "不关我事": "e8/bgws_org.gif", "上火": "64/bf_org.gif", "不倒翁": "b6/bdw_org.gif", "不错哦": "79/bco_org.gif", "yeah": "1a/yeah_org.gif", "喜欢": "5f/xh_org.gif", "心动": "5f/xd_org.gif", "无聊": "53/wl_org.gif", "手舞足蹈": "b2/gx_org.gif", "搞笑": "09/gx2_org.gif", "痛哭": "eb/gd_org.gif", "爆发": "38/fn2_org.gif", "发奋": "31/d2_org.gif", "不屑": "b0/bx_org.gif", "拜年了": "0c/lxhbainianle_org.gif", "cc拜年": "63/longniancc_org.gif", "brd拜年": "46/brdlongnian_org.gif", "brd谨": "56/brdjinlongnian_org.gif", "brd贺": "a6/brdhelongnian_org.gif", "brd新": "82/brdxinlongnian_org.gif", "brd年": "55/brdnianlongnian_org.gif", "bofu拜年": "0d/bofulongnian_org.gif", "yz拜年": "5e/longnianyingzi_org.gif", "xyj拜年": "e3/longnianxyjbai_org.gif", "xyj红包": "d1/longnianxyjhb_org.gif", "xyj年年有鱼": "b1/longnianxyjyu_org.gif", "bobo拜年": "64/bobolongnian_org.gif", "toto拜年": "0b/longniantoto_org.gif", "dx拜年": "91/longniandx_org.gif", "nono拜年": "b3/longnianpanda_org.gif", "mtjj拜年": "5b/longnianmtjj_org.gif", "mk拜年": "7b/longnianmk_org.gif", "km拜年": "df/longniankm_org.gif", "alt拜年": "e9/longnianalt_org.gif", "dx拜年": "91/longniandx_org.gif", "dx炸弹": "78/daxiongzhadan_org.gif", "dx洗澡": "07/daxiongxizao_org.gif", "dx握爪": "ff/daxiongwozhua_org.gif", "dx数落": "4f/daxiongshuluo_org.gif", "dx刷牙": "f5/daxiongshuaya_org.gif", "dx傻": "aa/daxiongsha_org.gif", "dx晒": "c4/daxiongshai_org.gif", "dx抛媚眼": "45/daxiongpaomeiyan_org.gif", "dx拍拍手": "7b/daxiongpaipaishou_org.gif", "dx耶": "10/daxiongoye_org.gif", "dx扭": "00/daxiongniu_org.gif", "dx没有": "7f/daxiongmeiyou_org.gif", "dx卖萌": "51/daxiongmaimeng_org.gif", "dx脸红": "b7/daxionglianhong_org.gif", "dx泪奔": "ca/daxiongleibenxiong_org.gif", "dx加油": "d7/daxiongjiayouxiong_org.gif", "dx脚踏车": "6a/daxiongjiaotache_org.gif", "dx花心": "b9/daxionghuaxin_org.gif", "dx欢乐": "01/daxionghuanle_org.gif", "dx滑板": "9f/daxionghuaban_org.gif", "dx倒": "57/daxiongdao_org.gif", "dx超人": "70/daxiongchaoren_org.gif", "dx饱": "27/daxiongbao_org.gif", "dx哎": "da/daxiongai_org.gif", "眨眨眼": "3b/zy2_org.gif", "杂技": "ec/zs_org.gif", "多问号": "17/wh2_org.gif", "跳绳": "79/ts_org.gif", "强吻": "b1/q3_org.gif", "不活了": "37/lb2_org.gif", "磕头": "6a/kt_org.gif", "呜呜": "55/bya_org.gif", "不": "a2/bx2_org.gif",
  // 繁体只能手动维护  
  "織":"41/zz2_org.gif","神馬":"60/horse2_org.gif","浮雲":"bc/fuyun_org.gif","給力":"c9/geili_org.gif","圍觀":"f2/wg_org.gif","威武":"70/vw_org.gif","熊貓":"6e/panda_org.gif","兔子":"81/rabbit_org.gif","奧特曼":"bc/otm_org.gif","囧":"15/j_org.gif","互粉":"89/hufen_org.gif","禮物":"c4/liwu_org.gif","呵呵":"ac/smilea_org.gif","嘻嘻":"0b/tootha_org.gif","哈哈":"6a/laugh.gif","可愛":"14/tza_org.gif","可憐":"af/kl_org.gif","挖鼻屎":"a0/kbsa_org.gif","吃驚":"f4/cj_org.gif","害羞":"6e/shamea_org.gif","擠眼":"c3/zy_org.gif","閉嘴":"29/bz_org.gif","鄙視":"71/bs2_org.gif","愛你":"6d/lovea_org.gif","淚":"9d/sada_org.gif","偷笑":"19/heia_org.gif","親親":"8f/qq_org.gif","生病":"b6/sb_org.gif","太開心":"58/mb_org.gif","懶得理你":"17/ldln_org.gif","右哼哼":"98/yhh_org.gif","左哼哼":"6d/zhh_org.gif","噓":"a6/x_org.gif","衰":"af/cry.gif","委屈":"73/wq_org.gif","吐":"9e/t_org.gif","打哈氣":"f3/k_org.gif","抱抱":"27/bba_org.gif","怒":"7c/angrya_org.gif","疑問":"5c/yw_org.gif","饞嘴":"a5/cza_org.gif","拜拜":"70/88_org.gif","思考":"e9/sk_org.gif","汗":"24/sweata_org.gif","困":"7f/sleepya_org.gif","睡覺":"6b/sleepa_org.gif","錢":"90/money_org.gif","失望":"0c/sw_org.gif","酷":"40/cool_org.gif","花心":"8c/hsa_org.gif","哼":"49/hatea_org.gif","鼓掌":"36/gza_org.gif","暈":"d9/dizzya_org.gif","悲傷":"1a/bs_org.gif","抓狂":"62/crazya_org.gif","黑線":"91/h_org.gif","陰險":"6d/yx_org.gif","怒駡":"89/nm_org.gif","心":"40/hearta_org.gif","傷心":"ea/unheart.gif","豬頭":"58/pig.gif","ok":"d6/ok_org.gif","耶":"d9/ye_org.gif","good":"d8/good_org.gif","不要":"c7/no_org.gif","贊":"d0/z2_org.gif","來":"40/come_org.gif","弱":"d8/sad_org.gif","蠟燭":"91/lazu_org.gif","鐘":"d3/clock_org.gif","蛋糕":"6a/cake.gif","話筒":"1b/m_org.gif","握手":"0c/ws_org.gif","溫暖帽子":"f1/wennuanmaozi_org.gif","手套":"72/shoutao_org.gif","圍脖":"3f/weijin_org.gif","聖誕樹":"a2/christree_org.gif","聖誕帽":"06/chrishat_org.gif","藥":"5d/y_org.gif","落葉":"79/yellowMood_org.gif","禮花":"3d/bingo_org.gif","淘氣":"9e/bobotiaopi_org.gif","有愛":"b9/totoyouai_org.gif","好可憐":"76/kelian_org.gif","呲牙":"c1/ciya_org.gif","擠眼":"c3/zy_org.gif","親親":"8f/qq_org.gif","怒罵":"89/nm_org.gif","太開心":"58/mb_org.gif","懶得理你":"17/ldln_org.gif","打哈氣":"f3/k_org.gif","生病":"b6/sb_org.gif","書呆子":"61/sdz_org.gif","失望":"0c/sw_org.gif","可憐":"af/kl_org.gif","黑線":"91/h_org.gif","吐":"9e/t_org.gif","委屈":"73/wq_org.gif","思考":"e9/sk_org.gif","哈哈":"6a/laugh.gif","噓":"a6/x_org.gif","右哼哼":"98/yhh_org.gif","左哼哼":"6d/zhh_org.gif","疑問":"5c/yw_org.gif","陰險":"6d/yx_org.gif","頂":"91/d_org.gif","錢":"90/money_org.gif","悲傷":"1a/bs_org.gif","鄙視":"71/bs2_org.gif","拜拜":"70/88_org.gif","吃驚":"f4/cj_org.gif","閉嘴":"29/bz_org.gif","衰":"af/cry.gif","憤怒":"bd/fn_org.gif","感冒":"a0/gm_org.gif","酷":"40/cool_org.gif","來":"40/come_org.gif","good":"d8/good_org.gif","haha":"13/ha_org.gif","不要":"c7/no_org.gif","ok":"d6/ok_org.gif","拳頭":"cc/o_org.gif","弱":"d8/sad_org.gif","握手":"0c/ws_org.gif","贊":"d0/z2_org.gif","最差":"3e/bad_org.gif","可愛":"14/tza_org.gif","嘻嘻":"0b/tootha_org.gif","汗":"24/sweata_org.gif","呵呵":"ac/smilea_org.gif","困":"7f/sleepya_org.gif","睡覺":"6b/sleepa_org.gif","害羞":"6e/shamea_org.gif","淚":"9d/sada_org.gif","愛你":"6d/lovea_org.gif","挖鼻屎":"a0/kbsa_org.gif","花心":"8c/hsa_org.gif","偷笑":"19/heia_org.gif","心":"40/hearta_org.gif","哼":"49/hatea_org.gif","鼓掌":"36/gza_org.gif","暈":"d9/dizzya_org.gif","饞嘴":"a5/cza_org.gif","抓狂":"62/crazya_org.gif","抱抱":"27/bba_org.gif","怒":"7c/angrya_org.gif","右抱抱":"0d/right_org.gif","左抱抱":"54/left_org.gif","有愛":"b9/totoyouai_org.gif","氣死了":"b2/totoyes_org.gif","我愛聽":"02/tototingge_org.gif","怒火":"af/totonu_org.gif","擂鼓":"bd/totoleigu_org.gif","譏笑":"d8/totojixiao_org.gif","拋錢":"37/totoheixianpaoqian_org.gif","變花":"72/boboxianhua_org.gif","飆淚":"7f/boboweiqu_org.gif","藏貓貓":"18/bobotoukan_org.gif","淘氣":"9e/bobotiaopi_org.gif","生悶氣":"47/boboshengmenqi_org.gif","忍":"a7/boboren_org.gif","泡泡糖":"a5/bobopaopaotang_org.gif","好的":"e0/bobook_org.gif","Hi":"44/bobohi_org.gif","飛吻":"79/bobofeiwen_org.gif","我愛西瓜":"29/bobochixigua_org.gif","嚇一跳":"ce/bobochijing_org.gif","吃飯":"87/bobochifan_org.gif","圍脖":"3f/weijin_org.gif","溫暖帽子":"f1/wennuanmaozi_org.gif","手套":"72/shoutao_org.gif","紅包":"71/hongbao_org.gif","喜":"bf/xi_org.gif","禮物":"c4/liwu_org.gif","蛋糕":"6a/cake.gif","鑽戒":"31/r_org.gif","鑽石":"9f/diamond_org.gif","大巴":"9c/dynamicbus_org.gif","飛機":"6d/travel_org.gif","自行車":"46/zxc_org.gif","汽車":"a4/jc_org.gif","手機":"4b/sj2_org.gif","照相機":"33/camera_org.gif","藥":"5d/y_org.gif","電腦":"df/dn_org.gif","手紙":"55/sz_org.gif","落葉":"79/yellowMood_org.gif","聖誕樹":"a2/christree_org.gif","聖誕帽":"06/chrishat_org.gif","聖誕老人":"c5/chrisfather_org.gif","聖誕鈴鐺":"64/chrisbell_org.gif","聖誕襪":"08/chrisocks_org.gif","音樂盒":"79/yinyuehe_org.gif","首發":"eb/shoufa_org.gif","悼念喬佈斯":"26/Jobs_org.gif","iPhone":"19/iPhone_org.gif","微博蛋糕":"e3/weibo2zhounian_org.png","蠟燭":"91/lazu_org.gif","康乃馨":"2e/muqinjie_org.png","圖片":"ce/tupianimage_org.gif","植樹節":"56/zhishujie_org.gif","粉蛋糕":"bf/nycake_org.gif","糖果":"34/candy_org.gif","萬聖節":"73/nanguatou2_org.gif","火炬":"3b/hj_org.gif","酒壺":"64/wine_org.gif","月餅":"96/mooncake3_org.gif","滿月":"5d/moon1_org.gif","巧克力":"b1/qkl_org.gif","腳印":"12/jy_org.gif","酒":"39/j2_org.gif","狗":"5d/g_org.gif","工作":"b2/gz3_org.gif","檔案":"ce/gz2_org.gif","葉子":"b8/green_org.gif","鋼琴":"b2/gq_org.gif","印跡":"84/foot_org.gif","鐘":"d3/clock_org.gif","茶":"a8/cha_org.gif","西瓜":"6b/watermelon.gif","雨傘":"33/umb_org.gif","電視機":"b3/tv_org.gif","電話":"9d/tel_org.gif","太陽":"e5/sun.gif","星":"0b/star_org.gif","哨子":"a0/shao.gif","話筒":"1b/m_org.gif","音樂":"d0/music_org.gif","電影":"77/movie_org.gif","月亮":"b9/moon.gif","唱歌":"79/ktv_org.gif","冰棍":"3a/ice.gif","房子":"d1/house_org.gif","帽子":"25/hat_org.gif","足球":"c0/football.gif","花":"6c/flower.gif","風扇":"92/fan.gif","乾杯":"bd/cheer.gif","咖啡":"64/cafe_org.gif","織":"41/zz2_org.gif","兔子":"81/rabbit_org.gif","神馬":"60/horse2_org.gif","浮雲":"bc/fuyun_org.gif","給力":"c9/geili_org.gif","萌":"42/kawayi_org.gif","鴨梨":"bb/pear_org.gif","熊貓":"6e/panda_org.gif","互粉":"89/hufen_org.gif","圍觀":"f2/wg_org.gif","扔雞蛋":"91/rjd_org.gif","奧特曼":"bc/otm_org.gif","威武":"70/vw_org.gif","傷心":"ea/unheart.gif","熱吻":"60/rw_org.gif","囧":"15/j_org.gif","orz":"c0/orz1_org.gif","宅":"d7/z_org.gif","小丑":"6b/xc_org.gif","帥":"36/s2_org.gif","豬頭":"58/pig.gif","實習":"48/sx_org.gif","骷髏":"bd/kl2_org.gif","便便":"34/s_org.gif","雪人":"d9/xx2_org.gif","黃牌":"a0/yellowcard.gif","紅牌":"64/redcard.gif","跳舞花":"70/twh_org.gif","禮花":"3d/bingo_org.gif","打針":"b0/zt_org.gif","嘆號":"3b/th_org.gif","問號":"9d/wh_org.gif","句號":"9b/jh_org.gif","逗號":"cc/dh_org.gif","閃":"ce/03_org.gif","啦啦":"c1/04_org.gif","吼吼":"34/05_org.gif","慶祝":"67/06_org.gif","嘿":"d3/01_org.gif","00":"3a/zero_org.gif","2":"61/two_org.gif","3":"78/three_org.gif","6":"bf/six_org.gif","7":"32/seven_org.gif","1":"82/one_org.gif","9":"54/nine_org.gif","4":"72/four_org.gif","5":"f5/five_org.gif","8":"5c/eight_org.gif","女孩兒":"1b/kissgirl_org.gif","男孩兒":"4e/kissboy_org.gif","z":"b2/newz_org.gif","y":"3b/newy_org.gif","x":"d7/newx_org.gif","v":"e3/newv_org.gif","u":"b8/newu_org.gif","t":"75/newt_org.gif","s":"22/news_org.gif","r":"0c/newr_org.gif","q":"de/newq_org.gif","p":"e7/newp_org.gif","n":"e7/newn_org.gif","l":"f5/newl_org.gif","k":"a0/newk_org.gif","j":"af/newj_org.gif","h":"8b/newh_org.gif","g":"16/newg_org.gif","f":"07/newf_org.gif","d":"d8/newd_org.gif","a":"32/newa_org.gif","w":"94/weibow_org.gif","點":"fd/weibop_org.gif","o":"f5/weiboo_org.gif","m":"98/weibom_org.gif","i":"e6/weiboi_org.gif","c":"59/weiboc_org.gif","b":"fa/weibob_org.gif","省略號":"0d/shengluehao_org.gif","kiss":"59/kiss2_org.gif","園":"53/yuan_org.gif","團":"11/tuan_org.gif","霧":"68/w_org.gif","颱風":"55/tf_org.gif","沙塵暴":"69/sc_org.gif","晴轉多雲":"d2/qzdy_org.gif","流星":"8e/lx_org.gif","龍捲風":"6a/ljf_org.gif","洪水":"ba/hs2_org.gif","風":"74/gf_org.gif","多雲轉晴":"f3/dyzq_org.gif","彩虹":"03/ch_org.gif","冰雹":"05/bb2_org.gif","微風":"a5/wind_org.gif","陽光":"1a/sunny_org.gif","雪":"00/snow_org.gif","閃電":"e3/sh_org.gif","下雨":"50/rain.gif","陰天":"37/dark_org.gif","粉紅絲帶":"77/pink_org.gif","愛心傳遞":"b8/aixincd_org.gif","歡歡":"c3/liaobuqi_org.gif","樂樂":"66/guanbuzhao_org.gif","管不著愛":"78/2guanbuzhao1_org.gif","愛":"09/ai_org.gif","了不起愛":"11/2liaobuqiai_org.gif","有點困":"68/youdiankun_org.gif","yes":"9e/yes_org.gif","咽回去了":"72/yanhuiqule_org.gif","鴨梨很大":"01/yalihenda_org.gif","羞羞":"42/xiuxiu_org.gif","喜歡你":"6b/xihuang_org.gif","小便屁":"a0/xiaobianpi_org.gif","無奈":"d6/wunai22_org.gif","兔兔":"da/tutu_org.gif","吐舌頭":"98/tushetou_org.gif","頭暈":"48/touyun_org.gif","聽音樂":"d3/tingyinyue_org.gif","睡大覺":"65/shuijiao_org.gif","閃閃紫":"9e/shanshanzi_org.gif","閃閃綠":"a8/shanshanlu_org.gif","閃閃灰":"1e/shanshanhui_org.gif","閃閃紅":"10/shanshanhong_org.gif","閃閃粉":"9d/shanshanfen_org.gif","咆哮":"4b/paoxiao_org.gif","摸頭":"2c/motou_org.gif","真美好":"d2/meihao_org.gif","臉紅自爆":"d8/lianhongzibao_org.gif","哭泣女":"1c/kuqinv_org.gif","哭泣男":"38/kuqinan_org.gif","空":"fd/kong_org.gif","盡情玩":"9f/jinqingwan_org.gif","驚喜":"b8/jingxi_org.gif","驚呆":"58/jingdai_org.gif","胡蘿蔔":"e1/huluobo_org.gif","歡騰去愛":"63/huangtengquai_org.gif","感冒了":"67/ganmao_org.gif","怒了":"ef/fennu_org.gif","我要奮鬥":"a6/fendou123_org.gif","發芽":"95/faya_org.gif","春暖花開":"ca/chunnuanhuakai_org.gif","抽煙":"83/chouyan_org.gif","昂":"31/ang_org.gif","啊":"12/aa_org.gif","自插雙目":"d3/zichashuangmu_org.gif","咦":"9f/yiwen_org.gif","噓噓":"cf/xu_org.gif","我吃":"00/wochiwode_org.gif","喵嗚":"a7/weiqu_org.gif","v5":"c5/v5_org.gif","調戲":"f7/tiaoxi_org.gif","打牙":"d7/taihaoxiaole_org.gif","手賤":"b8/shoujian_org.gif","色":"a1/se_org.gif","噴":"4a/pen_org.gif","你懂的":"2e/nidongde_org.gif","喵":"a0/miaomiao_org.gif","美味":"c1/meiwei_org.gif","驚恐":"46/jingkong_org.gif","感動":"7c/gandong_org.gif","放開":"55/fangkai_org.gif","癡呆":"e8/chidai_org.gif","扯臉":"99/chelian_org.gif","不知所措":"ab/buzhisuocuo_org.gif","白眼":"24/baiyan_org.gif","猥瑣":"e1/weisuo_org.gif","挑眉":"c9/tiaomei_org.gif","挑逗":"3c/tiaodou_org.gif","親耳朵":"1c/qinerduo_org.gif","媚眼":"32/meiyan_org.gif","冒個泡":"32/maogepao_org.gif","囧耳朵":"f0/jiongerduo_org.gif","鬼臉":"14/guilian_org.gif","放電":"fd/fangdian_org.gif","悲劇":"ea/beiju_org.gif","撫摸":"78/touch_org.gif","大汗":"13/sweat_org.gif","大驚":"74/suprise_org.gif","驚哭":"0c/supcry_org.gif","星星眼":"5c/stareyes_org.gif","好困":"8b/sleepy_org.gif","嘔吐":"75/sick_org.gif","加我壹個":"ee/plus1_org.gif","痞痞兔耶":"19/pipioye_org.gif","mua":"c6/muamua_org.gif","面抽":"fd/mianchou_org.gif","大笑":"6a/laugh_org.gif","揉":"d6/knead_org.gif","痞痞兔囧":"38/jiong_org.gif","哈尼兔耶":"53/honeyoye_org.gif","開心":"40/happy_org.gif","咬手帕":"af/handkerchief_org.gif","去":"6b/go_org.gif","暈死了":"a4/dizzy_org.gif","大哭":"af/cry_org.gif","扇子遮面":"a1/coverface_org.gif","怒氣":"ea/angery_org.gif","886":"6f/886_org.gif","白羊":"07/byz2_org.gif","射手":"46/ssz2_org.gif","雙魚":"e2/syz2_org.gif","雙子":"89/szz2_org.gif","天秤":"6b/tpz2_org.gif","水瓶":"1b/spz2_org.gif","處女":"62/cnz2_org.gif","金牛":"3b/jnz2_org.gif","巨蟹":"d2/jxz2_org.gif","獅子":"4a/leo2_org.gif","摩羯":"16/mjz2_org.gif","天蠍座":"09/txz_org.gif","天秤座":"c1/tpz_org.gif","雙子座":"d4/szz_org.gif","雙魚座":"7f/syz_org.gif","射手座":"5d/ssz_org.gif","水瓶座":"00/spz_org.gif","摩羯座":"da/mjz_org.gif","獅子座":"23/leo_org.gif","巨蟹座":"a3/jxz_org.gif","金牛座":"8d/jnz_org.gif","處女座":"09/cnz_org.gif","白羊座":"e0/byz_org.gif","加油":"d4/jiayou_org.gif","國旗":"dc/flag_org.gif","金牌":"f4/jinpai_org.gif","銀牌":"1e/yinpai_org.gif","銅牌":"26/tongpai_org.gif","哨子":"a0/shao.gif","黃牌":"a0/yellowcard.gif","紅牌":"64/redcard.gif","足球":"c0/football.gif","籃球":"2c/bball_org.gif","黑8":"6b/black8_org.gif","排球":"cf/volleyball_org.gif","游泳":"b9/swimming_org.gif","乒乓球":"a5/pingpong_org.gif","投籃":"7a/basketball_org.gif","羽毛球":"77/badminton_org.gif","射門":"e0/zuqiu_org.gif","射箭":"40/shejian_org.gif","舉重":"14/juzhong_org.gif","擊劍":"38/jijian_org.gif","微微笑":"9a/xiaoheweixiao_org.gif","特委屈":"02/xiaoheweiqu_org.gif","我吐":"c1/xiaohetua_org.gif","很生氣":"66/xiaoheshengqi_org.gif","流鼻涕":"08/xiaoheliubiti_org.gif","默默哭泣":"a0/xiaohekuqi_org.gif","小盒汗":"e3/xiaohehan_org.gif","發呆中":"44/xiaohefadai_org.gif","不理你":"a8/xiaohebulini_org.gif","強烈鄙視":"d4/xiaohebishi_org.gif","煩躁":"c5/fanzao_org.gif","呲牙":"c1/ciya_org.gif","有錢":"e6/youqian_org.gif","微笑":"05/weixiao_org.gif","帥爆":"c1/shuaibao_org.gif","生氣":"0a/shengqi_org.gif","生病了":"19/shengbing_org.gif","疲勞":"d1/pilao_org.gif","瞄":"14/miao_org.gif","哭":"79/ku_org.gif","好可憐":"76/kelian_org.gif","緊張":"75/jinzhang_org.gif","驚訝":"dc/jingya_org.gif","激動":"bb/jidong_org.gif","見錢":"2b/jianqian_org.gif","汗了":"7d/han_org.gif","奮鬥":"4e/fendou_org.gif","小人得志":"09/xrdz_org.gif","哇哈哈":"cc/whh_org.gif","歎氣":"90/tq_org.gif","凍結":"d3/sjdj_org.gif","切":"1d/q_org.gif","拍照":"ec/pz_org.gif","怕怕":"7c/pp_org.gif","怒吼":"4d/nh_org.gif","膜拜":"9f/mb2_org.gif","路過":"70/lg_org.gif","淚奔":"34/lb_org.gif","臉變色":"cd/lbs_org.gif","親":"05/kiss_org.gif","恐怖":"86/kb_org.gif","交給我吧":"e2/jgwb_org.gif","歡欣鼓舞":"2b/hxgw_org.gif","高興":"c7/gx3_org.gif","尷尬":"43/gg_org.gif","發嗲":"4e/fd_org.gif","犯錯":"19/fc_org.gif","得意":"fb/dy_org.gif","吵鬧":"fa/cn_org.gif","衝鋒":"2f/cf_org.gif","抽耳光":"eb/ceg_org.gif","差得遠呢":"ee/cdyn_org.gif","被砸":"5a/bz2_org.gif","拜託":"6e/bt_org.gif","必勝":"cf/bs3_org.gif","不關我事":"e8/bgws_org.gif","上火":"64/bf_org.gif","不倒翁":"b6/bdw_org.gif","不錯哦":"79/bco_org.gif","yeah":"1a/yeah_org.gif","喜歡":"5f/xh_org.gif","心動":"5f/xd_org.gif","無聊":"53/wl_org.gif","手舞足蹈":"b2/gx_org.gif","搞笑":"09/gx2_org.gif","痛哭":"eb/gd_org.gif","爆發":"38/fn2_org.gif","發奮":"31/d2_org.gif","不屑":"b0/bx_org.gif","眨眨眼":"3b/zy2_org.gif","雜技":"ec/zs_org.gif","多問號":"17/wh2_org.gif","跳繩":"79/ts_org.gif","強吻":"b1/q3_org.gif","不活了":"37/lb2_org.gif","磕頭":"6a/kt_org.gif","嗚嗚":"55/bya_org.gif","不":"a2/bx2_org.gif","狂笑":"d5/zk_org.gif","冤":"5f/wq2_org.gif","蜷":"87/q2_org.gif","美好":"ae/mh_org.gif","樂和":"5f/m2_org.gif","揪耳朵":"15/j3_org.gif","晃":"bf/h2_org.gif","high":"e7/f_org.gif","蹭":"33/c_org.gif","抱枕":"f4/bz3_org.gif","不公平":"85/bgp_org.gif"
};

for (var k in TSINA_FACES) {
  if (!TSINA_API_EMOTIONS[k]) {
    TSINA_API_EMOTIONS[k] = TSINA_FACES[k];
  }
}

exports.weibo = [TSINA_FACE_URL_PRE, TSINA_API_EMOTIONS];

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
//var d = a.find('img').each(function(){
//    console.log('"' +$(this).attr('k')+ $(this).attr('title') + '"' + ': ' + '"' + $(this).attr('src') + '",');
//    }
//);
var TQQ_EMOTIONS_URL_PRE = 'http://mat1.gtimg.com/www/mb/images/';
var TQQ_FACE_TPL = '/{{name}}';
var TQQ_EMOTIONS = {
  "微笑": "face/14.gif",
  "撇嘴": "face/1.gif",
  "色": "face/2.gif",
  "发呆": "face/3.gif",
  "得意": "face/4.gif",
  "流泪": "face/5.gif",
  "害羞": "face/6.gif",
  "闭嘴": "face/7.gif",
  "睡": "face/8.gif",
  "大哭": "face/9.gif",
  "尴尬": "face/10.gif",
  "发怒": "face/11.gif",
  "调皮": "face/12.gif",
  "呲牙": "face/13.gif",
  "惊讶": "face/0.gif",
  "难过": "face/15.gif",
  "酷": "face/16.gif",
  "冷汗": "face/96.gif",
  "抓狂": "face/18.gif",
  "吐": "face/19.gif",
  "偷笑": "face/20.gif",
  "可爱": "face/21.gif",
  "白眼": "face/22.gif",
  "傲慢": "face/23.gif",
  "饥饿": "face/24.gif",
  "困": "face/25.gif",
  "惊恐": "face/26.gif",
  "流汗": "face/27.gif",
  "憨笑": "face/28.gif",
  "大兵": "face/29.gif",
  "奋斗": "face/30.gif",
  "咒骂": "face/31.gif",
  "疑问": "face/32.gif",
  "嘘": "face/33.gif",
  "晕": "face/34.gif",
  "折磨": "face/35.gif",
  "衰": "face/36.gif",
  "骷髅": "face/37.gif",
  "敲打": "face/38.gif",
  "再见": "face/39.gif",
  "擦汗": "face/97.gif",
  "抠鼻": "face/98.gif",
  "鼓掌": "face/99.gif",
  "糗大了": "face/100.gif",
  "坏笑": "face/101.gif",
  "左哼哼": "face/102.gif",
  "右哼哼": "face/103.gif",
  "哈欠": "face/104.gif",
  "鄙视": "face/105.gif",
  "委屈": "face/106.gif",
  "快哭了": "face/107.gif",
  "阴险": "face/108.gif",
  "亲亲": "face/109.gif",
  "吓": "face/110.gif",
  "可怜": "face/111.gif",
  "菜刀": "face/112.gif",
  "西瓜": "face/89.gif",
  "啤酒": "face/113.gif",
  "篮球": "face/114.gif",
  "乒乓": "face/115.gif",
  "咖啡": "face/60.gif",
  "饭": "face/61.gif",
  "猪头": "face/46.gif",
  "玫瑰": "face/63.gif",
  "凋谢": "face/64.gif",
  "示爱": "face/116.gif",
  "爱心": "face/66.gif",
  "心碎": "face/67.gif",
  "蛋糕": "face/53.gif",
  "闪电": "face/54.gif",
  "炸弹": "face/55.gif",
  "刀": "face/56.gif",
  "足球": "face/57.gif",
  "瓢虫": "face/117.gif",
  "便便": "face/59.gif",
  "月亮": "face/75.gif",
  "太阳": "face/74.gif",
  "礼物": "face/69.gif",
  "拥抱": "face/49.gif",
  "强": "face/76.gif",
  "弱": "face/77.gif",
  "握手": "face/78.gif",
  "胜利": "face/79.gif",
  "抱拳": "face/118.gif",
  "勾引": "face/119.gif",
  "拳头": "face/120.gif",
  "差劲": "face/121.gif",
  "爱你": "face/122.gif",
  "NO": "face/123.gif",
  "OK": "face/124.gif",
  "爱情": "face/42.gif",
  "飞吻": "face/85.gif",
  "跳跳": "face/43.gif",
  "发抖": "face/41.gif",
  "怄火": "face/86.gif",
  "转圈": "face/125.gif",
  "磕头": "face/126.gif",
  "回头": "face/127.gif",
  "跳绳": "face/128.gif",
  "挥手": "face/129.gif",
  "激动": "face/130.gif",
  "街舞": "face/131.gif",
  "献吻": "face/132.gif",
  "左太极": "face/133.gif",
  "右太极": "face/134.gif",
  
  "b囧": "cFace/b1.gif",
  "b惊": "cFace/b2.gif",
  "b大笑": "cFace/b3.gif",
  "b闪电": "cFace/b4.gif",
  "b再见": "cFace/b5.gif",
  "b乌鸦": "cFace/b6.gif",
  "b口水": "cFace/b7.gif",
  "b飞": "cFace/b8.gif",
  "b得意": "cFace/b9.gif",
  "b吃": "cFace/b10.gif",
  "b走着": "cFace/b11.gif",
  "b路过": "cFace/b12.gif",
  "b流汗": "cFace/b13.gif",
  
  "c爱心": "cFace/c1.gif",
  "c擦汗": "cFace/c2.gif",
  "c呲牙": "cFace/c3.gif",
  "c大哭": "cFace/c4.gif",
  "c大笑": "cFace/c5.gif",
  "c发呆": "cFace/c6.gif",
  "c激动": "cFace/c7.gif",
  "c可爱": "cFace/c8.gif",
  "c厉害": "cFace/c9.gif",
  "c敲打": "cFace/c10.gif",
  "c色": "cFace/c11.gif",
  "c生气": "cFace/c12.gif",
  "c调皮": "cFace/c13.gif",
  "c偷笑": "cFace/c14.gif",
  "c吐": "cFace/c15.gif",
  "c摇头": "cFace/c16.gif",
  "c再见": "cFace/c17.gif",
  "c折磨": "cFace/c18.gif",
  
  "j吃饭": "cFace/j1.gif",
  "j飞吻": "cFace/j2.gif",
  "j浮云": "cFace/j3.gif",
  "j鼓掌": "cFace/j4.gif",
  "j害羞": "cFace/j5.gif",
  "j囧": "cFace/j6.gif",
  "j纠结": "cFace/j7.gif",
  "j开心": "cFace/j8.gif",
  "j哭泣": "cFace/j9.gif",
  "j晚安": "cFace/j10.gif",
  "j汗": "cFace/j11.gif",
  "j无奈": "cFace/j12.gif",
  "j招手": "cFace/j13.gif",
  "j震惊": "cFace/j14.gif",
  "j咒骂": "cFace/j15.gif"

};

exports.tqq = [TQQ_EMOTIONS_URL_PRE, TQQ_EMOTIONS];

// http://t.163.com/yunying.do?action=getEmotions
// {
//   cartoon: [
//     {
//       catName: 'xxx',
//       emotions: [
//         [ 'g巴掌', 'http://img4.cache.netease.com/t/face/bierde/bahang.gif' ],
//         ...
//       ]
//     }, 
//     ...
//   ],
//   common: [
//     [ '崩溃', 'http://img4.cache.netease.com/t/face/popo/bengkui.gif' ],
//     ...
//   ],
//   hot: [
//     [ 'k石化', 'http://img4.cache.netease.com/t/face/jieluo/shihua.gif' ],
//     ...
//   ]
// }
var T163_FACES = {"cartoon":[{"catName":"彼尔德","emotions":[["g巴掌","http://img4.cache.netease.com/t/face/bierde/bahang.gif"],["g奔跑","http://img4.cache.netease.com/t/face/bierde/benpao.gif"],["g扯","http://img4.cache.netease.com/t/face/bierde/che.gif"],["g出浴","http://img4.cache.netease.com/t/face/bierde/chuyu.gif"],["g蹬腿","http://img4.cache.netease.com/t/face/bierde/dengtui.gif"],["g飞吻","http://img4.cache.netease.com/t/face/bierde/feiwen.gif"],["g好饱","http://img4.cache.netease.com/t/face/bierde/haobao.gif"],["g嘿哈","http://img4.cache.netease.com/t/face/bierde/heiha.gif"],["g举哑铃","http://img4.cache.netease.com/t/face/bierde/juyaling.gif"],["g啦啦啦","http://img4.cache.netease.com/t/face/bierde/lalala.gif"],["g练腰","http://img4.cache.netease.com/t/face/bierde/lianyao.gif"],["g凌乱","http://img4.cache.netease.com/t/face/bierde/lingluan.gif"],["g挠痒","http://img4.cache.netease.com/t/face/bierde/naoyang.gif"],["g拍肚皮","http://img4.cache.netease.com/t/face/bierde/paidupi.gif"],["g拍脸","http://img4.cache.netease.com/t/face/bierde/pailian.gif"],["g拍手","http://img4.cache.netease.com/t/face/bierde/paishou.gif"],["g跑","http://img4.cache.netease.com/t/face/bierde/pao.gif"],["g飘","http://img4.cache.netease.com/t/face/bierde/piao.gif"],["g揉眼","http://img4.cache.netease.com/t/face/bierde/rouyan.gif"],["g撒娇","http://img4.cache.netease.com/t/face/bierde/sajiao.gif"],["g踏步","http://img4.cache.netease.com/t/face/bierde/tabu.gif"],["g弹跳","http://img4.cache.netease.com/t/face/bierde/tantiao.gif"],["g兴奋","http://img4.cache.netease.com/t/face/bierde/xingfen.gif"],["g仰卧起坐","http://img4.cache.netease.com/t/face/bierde/yangwoqizuo.gif"]]},{"catName":"阿狸","emotions":[["d啊","http://img4.cache.netease.com/t/face/ali21/a.gif"],["d抱抱走","http://img4.cache.netease.com/t/face/ali21/baobaozou.gif"],["d别","http://img4.cache.netease.com/t/face/ali21/bie.gif"],["d不公平","http://img4.cache.netease.com/t/face/ali21/bugongping.gif"],["d不要啊","http://img4.cache.netease.com/t/face/ali21/buyaoa.gif"],["d蹭","http://img4.cache.netease.com/t/face/ali21/ceng.gif"],["d嘲弄","http://img4.cache.netease.com/t/face/ali21/chaonong.gif"],["d吃惊","http://img4.cache.netease.com/t/face/ali21/chijin.gif"],["d大汗","http://img4.cache.netease.com/t/face/ali21/dahan.gif"],["d点头","http://img4.cache.netease.com/t/face/ali21/diantou.gif"],["d风筝","http://img4.cache.netease.com/t/face/ali21/fengzhen.gif"],["d寒","http://img4.cache.netease.com/t/face/ali21/han.gif"],["d嗨","http://img4.cache.netease.com/t/face/ali21/hi.gif"],["d惊","http://img4.cache.netease.com/t/face/ali21/jing.gif"],["d囧","http://img4.cache.netease.com/t/face/ali21/jiong.gif"],["d揪耳朵","http://img4.cache.netease.com/t/face/ali21/jiuerduo.gif"],["d渴望","http://img4.cache.netease.com/t/face/ali21/kewang.gif"],["d抠鼻孔","http://img4.cache.netease.com/t/face/ali21/koubikong.gif"],["d哭","http://img4.cache.netease.com/t/face/ali21/ku.gif"],["d狂笑","http://img4.cache.netease.com/t/face/ali21/kuangxiao.gif"],["d啦啦啦","http://img4.cache.netease.com/t/face/ali21/lalala.gif"],["d流汗","http://img4.cache.netease.com/t/face/ali21/liuhan.gif"],["d礼物","http://img4.cache.netease.com/t/face/ali21/liwu.gif"],["d捏脸","http://img4.cache.netease.com/t/face/ali21/nielian.gif"]]},{"catName":"但丁","emotions":[["e拜拜","http://img4.cache.netease.com/t/face/danding/baibai.gif"],["e鄙视","http://img4.cache.netease.com/t/face/danding/bishi.gif"],["e闭嘴","http://img4.cache.netease.com/t/face/danding/bizui.gif"],["e大笑","http://img4.cache.netease.com/t/face/danding/daxiao.gif"],["e鼓掌","http://img4.cache.netease.com/t/face/danding/guzhang.gif"],["e汗","http://img4.cache.netease.com/t/face/danding/han.gif"],["e哼","http://img4.cache.netease.com/t/face/danding/heng.gif"],["e坏笑","http://img4.cache.netease.com/t/face/danding/huaixiao.gif"],["e惊讶","http://img4.cache.netease.com/t/face/danding/jingya.gif"],["e开心","http://img4.cache.netease.com/t/face/danding/kaixin.gif"],["e可怜","http://img4.cache.netease.com/t/face/danding/kelian.gif"],["e空","http://img4.cache.netease.com/t/face/danding/kong.gif"],["e泪流","http://img4.cache.netease.com/t/face/danding/leiliu.gif"],["e流鼻血","http://img4.cache.netease.com/t/face/danding/liubixie.gif"],["e流口水","http://img4.cache.netease.com/t/face/danding/liukoushui.gif"],["e骂","http://img4.cache.netease.com/t/face/danding/ma.gif"],["e冒火","http://img4.cache.netease.com/t/face/danding/maohuo.gif"],["e亲","http://img4.cache.netease.com/t/face/danding/qin.gif"],["e疑问","http://img4.cache.netease.com/t/face/danding/wen.gif"],["e无语","http://img4.cache.netease.com/t/face/danding/wuyu.gif"],["e小意思","http://img4.cache.netease.com/t/face/danding/xiaoyisi.gif"],["e羞","http://img4.cache.netease.com/t/face/danding/xiu.gif"],["e晕","http://img4.cache.netease.com/t/face/danding/yun.gif"],["e扭","http://img4.cache.netease.com/t/face/danding/niu.gif"]]},{"catName":"大熊","emotions":[["f蹦擦擦","http://img4.cache.netease.com/t/face/daxiong/bengcaca.gif"],["f草裙舞","http://img4.cache.netease.com/t/face/daxiong/caoqunwu.gif"],["f超人","http://img4.cache.netease.com/t/face/daxiong/chaoren.gif"],["f吃东西","http://img4.cache.netease.com/t/face/daxiong/chidongxi.gif"],["f粉刷","http://img4.cache.netease.com/t/face/daxiong/fenshua.gif"],["f害羞","http://img4.cache.netease.com/t/face/daxiong/haixiu.gif"],["f好饱啊","http://img4.cache.netease.com/t/face/daxiong/haobaoa.gif"],["f好晒","http://img4.cache.netease.com/t/face/daxiong/haoshai.gif"],["f高兴","http://img4.cache.netease.com/t/face/daxiong/happy.gif"],["f欢乐","http://img4.cache.netease.com/t/face/daxiong/huanle.gif"],["f卖萌","http://img4.cache.netease.com/t/face/daxiong/maimeng.gif"],["f拍手","http://img4.cache.netease.com/t/face/daxiong/paishou.gif"],["f抛媚眼","http://img4.cache.netease.com/t/face/daxiong/paomeiyan.gif"],["f起床号","http://img4.cache.netease.com/t/face/daxiong/qichuanghao.gif"],["f傻","http://img4.cache.netease.com/t/face/daxiong/sha.gif"],["f刷牙","http://img4.cache.netease.com/t/face/daxiong/shuaya.gif"],["f睡","http://img4.cache.netease.com/t/face/daxiong/shui.gif"],["f叹气","http://img4.cache.netease.com/t/face/daxiong/tanqi.gif"],["f谢谢","http://img4.cache.netease.com/t/face/daxiong/thanks.gif"],["f我倒","http://img4.cache.netease.com/t/face/daxiong/wodao.gif"],["f我是花","http://img4.cache.netease.com/t/face/daxiong/woshihua.gif"],["f握手","http://img4.cache.netease.com/t/face/daxiong/woshou.gif"],["f洗澡","http://img4.cache.netease.com/t/face/daxiong/xizao.gif"],["f月光族","http://img4.cache.netease.com/t/face/daxiong/yueguangzu.gif"]]},{"catName":"白骨精","emotions":[["i摆","http://img4.cache.netease.com/t/face/baigujing2/bai.gif"],["i摆动","http://img4.cache.netease.com/t/face/baigujing2/baidong.gif"],["i扯脸","http://img4.cache.netease.com/t/face/baigujing2/chelian.gif"],["i打肚子","http://img4.cache.netease.com/t/face/baigujing2/dadu.gif"],["i恩","http://img4.cache.netease.com/t/face/baigujing2/en.gif"],["i感动","http://img4.cache.netease.com/t/face/baigujing2/gandong.gif"],["i黑","http://img4.cache.netease.com/t/face/baigujing2/hei.gif"],["i哭","http://img4.cache.netease.com/t/face/baigujing2/ku.gif"],["i啦啦","http://img4.cache.netease.com/t/face/baigujing2/lala.gif"],["i哦","http://img4.cache.netease.com/t/face/baigujing2/ou.gif"],["i喷血","http://img4.cache.netease.com/t/face/baigujing2/pengxie.gif"],["i屁屁","http://img4.cache.netease.com/t/face/baigujing2/pipi.gif"],["i揉脸","http://img4.cache.netease.com/t/face/baigujing2/roulian.gif"],["i萎了","http://img4.cache.netease.com/t/face/baigujing2/weile.gif"],["i羞","http://img4.cache.netease.com/t/face/baigujing2/xiu.gif"],["i旋转","http://img4.cache.netease.com/t/face/baigujing2/xunzhuan.gif"],["i打哈欠","http://img4.cache.netease.com/t/face/baigujing2/yanxun.gif"],["i摇头","http://img4.cache.netease.com/t/face/baigujing2/yaotou.gif"],["i转","http://img4.cache.netease.com/t/face/baigujing2/zhuan.gif"],["i撞","http://img4.cache.netease.com/t/face/baigujing2/zhuang.gif"],["i转圈","http://img4.cache.netease.com/t/face/baigujing2/zhuanquan.gif"],["i左右看","http://img4.cache.netease.com/t/face/baigujing2/zuoyoukan.gif"]]},{"catName":"影子","emotions":[["h不","http://img4.cache.netease.com/t/face/yingzi/bu.gif"],["h吃西瓜","http://img4.cache.netease.com/t/face/yingzi/chixigua.gif"],["h挨砸","http://img4.cache.netease.com/t/face/yingzi/eiza.gif"],["h翻滚","http://img4.cache.netease.com/t/face/yingzi/fangun.gif"],["h河蟹","http://img4.cache.netease.com/t/face/yingzi/hexie.gif"],["h欢呼","http://img4.cache.netease.com/t/face/yingzi/huanhu.gif"],["h挥手帕","http://img4.cache.netease.com/t/face/yingzi/huishoupa.gif"],["h焦糖舞","http://img4.cache.netease.com/t/face/yingzi/jiaotangwu.gif"],["h紧张","http://img4.cache.netease.com/t/face/yingzi/jinzhang.gif"],["h卷被","http://img4.cache.netease.com/t/face/yingzi/juanbei.gif"],["h看楼上","http://img4.cache.netease.com/t/face/yingzi/kanloushang.gif"],["h哭","http://img4.cache.netease.com/t/face/yingzi/ku.gif"],["h没有钱","http://img4.cache.netease.com/t/face/yingzi/meiyouqian.gif"],["h纳尼","http://img4.cache.netease.com/t/face/yingzi/nani.gif"],["h拿玩偶","http://img4.cache.netease.com/t/face/yingzi/nawanou.gif"],["h哦也","http://img4.cache.netease.com/t/face/yingzi/ouye.gif"],["h拍屁股","http://img4.cache.netease.com/t/face/yingzi/paipigu.gif"],["h拍手","http://img4.cache.netease.com/t/face/yingzi/paishou.gif"],["h求你了","http://img4.cache.netease.com/t/face/yingzi/qiunile.gif"],["h人呢","http://img4.cache.netease.com/t/face/yingzi/renne.gif"],["h撒花","http://img4.cache.netease.com/t/face/yingzi/sahua.gif"],["h扇扇子","http://img4.cache.netease.com/t/face/yingzi/shanshanzi.gif"],["h眺望","http://img4.cache.netease.com/t/face/yingzi/tiaowang.gif"],["h哇哇叫","http://img4.cache.netease.com/t/face/yingzi/wawajiao.gif"]]},{"catName":"卡洛","emotions":[["j汗","http://img4.cache.netease.com/t/face/kaluo/han.gif"],["j可爱","http://img4.cache.netease.com/t/face/kaluo/keai.gif"],["j哭","http://img4.cache.netease.com/t/face/kaluo/ku.gif"],["j冷","http://img4.cache.netease.com/t/face/kaluo/leng.gif"],["j挠头","http://img4.cache.netease.com/t/face/kaluo/naotou.gif"],["jNO","http://img4.cache.netease.com/t/face/kaluo/NO.gif"],["j怒火","http://img4.cache.netease.com/t/face/kaluo/nuhuo.gif"],["j潜水","http://img4.cache.netease.com/t/face/kaluo/qianshui.gif"],["j头疼","http://img4.cache.netease.com/t/face/kaluo/touteng.gif"],["j吐血","http://img4.cache.netease.com/t/face/kaluo/tuxie.gif"],["j笑","http://img4.cache.netease.com/t/face/kaluo/xiao.gif"],["j洗头","http://img4.cache.netease.com/t/face/kaluo/xitou.gif"],["j砸头","http://img4.cache.netease.com/t/face/kaluo/zatou.gif"],["j抓","http://img4.cache.netease.com/t/face/kaluo/zhua.gif"]]},{"catName":"杰洛","emotions":[["k88","http://img4.cache.netease.com/t/face/jieluo/88.gif"],["k被打击","http://img4.cache.netease.com/t/face/jieluo/beidaji.gif"],["k飞吻","http://img4.cache.netease.com/t/face/jieluo/feiwen.gif"],["k跪拜","http://img4.cache.netease.com/t/face/jieluo/guibai.gif"],["k汗","http://img4.cache.netease.com/t/face/jieluo/han.gif"],["k囧","http://img4.cache.netease.com/t/face/jieluo/jiong.gif"],["k砍西瓜","http://img4.cache.netease.com/t/face/jieluo/kanxigua.gif"],["k可爱","http://img4.cache.netease.com/t/face/jieluo/keai.gif"],["k哭","http://img4.cache.netease.com/t/face/jieluo/ku.gif"],["k雷","http://img4.cache.netease.com/t/face/jieluo/lei.gif"],["k冷","http://img4.cache.netease.com/t/face/jieluo/leng.gif"],["k怒","http://img4.cache.netease.com/t/face/jieluo/nu.gif"],["k生病","http://img4.cache.netease.com/t/face/jieluo/shengbing.gif"],["k石化","http://img4.cache.netease.com/t/face/jieluo/shihua.gif"],["k耍赖","http://img4.cache.netease.com/t/face/jieluo/shualai.gif"],["k睡觉","http://img4.cache.netease.com/t/face/jieluo/shuijiao.gif"],["k吐","http://img4.cache.netease.com/t/face/jieluo/tu.gif"],["k喜欢","http://img4.cache.netease.com/t/face/jieluo/xihuan.gif"],["k晕","http://img4.cache.netease.com/t/face/jieluo/yun.gif"],["k炸弹","http://img4.cache.netease.com/t/face/jieluo/zhuadan.gif"]]}],"common":[["崩溃","http://img4.cache.netease.com/t/face/popo/bengkui.gif"],["鄙视你","http://img4.cache.netease.com/t/face/popo/bishini.gif"],["不说","http://img4.cache.netease.com/t/face/popo/bizui.gif"],["大哭","http://img4.cache.netease.com/t/face/popo/daku.gif"],["飞吻","http://img4.cache.netease.com/t/face/popo/feiwen.gif"],["工作忙","http://img4.cache.netease.com/t/face/popo/gongzuomang.gif"],["鼓掌","http://img4.cache.netease.com/t/face/popo/guzhang.gif"],["害羞","http://img4.cache.netease.com/t/face/popo/haixiu.gif"],["坏","http://img4.cache.netease.com/t/face/popo/huai.gif"],["坏笑","http://img4.cache.netease.com/t/face/popo/tushetou.gif"],["教训","http://img4.cache.netease.com/t/face/popo/jiaoxun.gif"],["惊讶","http://img4.cache.netease.com/t/face/popo/jinya.gif"],["可爱","http://img4.cache.netease.com/t/face/popo/keai.gif"],["老大","http://img4.cache.netease.com/t/face/popo/laoda.gif"],["欠揍","http://img4.cache.netease.com/t/face/popo/qianzou.gif"],["撒娇","http://img4.cache.netease.com/t/face/popo/sajiao.gif"],["色迷迷","http://img4.cache.netease.com/t/face/popo/se.gif"],["送花","http://img4.cache.netease.com/t/face/popo/songhua.gif"],["偷笑","http://img4.cache.netease.com/t/face/popo/toutouxiao.gif"],["挖鼻孔","http://img4.cache.netease.com/t/face/popo/koubikong.gif"],["我吐","http://img4.cache.netease.com/t/face/popo/wotu.gif"],["嘘","http://img4.cache.netease.com/t/face/popo/xu.gif"],["仰慕你","http://img4.cache.netease.com/t/face/popo/xingxingyan.gif"],["yeah","http://img4.cache.netease.com/t/face/popo/yeah.gif"],["疑问","http://img4.cache.netease.com/t/face/popo/yi.gif"],["晕","http://img4.cache.netease.com/t/face/popo/yun.gif"],["眨眼","http://img4.cache.netease.com/t/face/popo/jiyan.gif"],["砸死你","http://img4.cache.netease.com/t/face/popo/zasini.gif"],["嗷嗷嗷","http://img4.cache.netease.com/t/face/popo/aoaoao.gif"],["尴尬","http://img4.cache.netease.com/t/face/popo/ganga.gif"],["阿弥陀佛","http://img4.cache.netease.com/t/face/popo/emituofo.gif"],["哈哈","http://img4.cache.netease.com/t/face/popo/haha.gif"],["汗","http://img4.cache.netease.com/t/face/popo/han.gif"],["黑线","http://img4.cache.netease.com/t/face/popo/heixian.gif"],["很得意","http://img4.cache.netease.com/t/face/popo/hendeyi.gif"],["奸笑","http://img4.cache.netease.com/t/face/popo/jianxiao.gif"],["睫毛弯弯","http://img4.cache.netease.com/t/face/popo/jiemaowanwan.gif"],["惊恐","http://img4.cache.netease.com/t/face/popo/jingkong.gif"],["啾啾","http://img4.cache.netease.com/t/face/popo/jiujiu.gif"],["沮丧","http://img4.cache.netease.com/t/face/popo/jusang.gif"],["乐","http://img4.cache.netease.com/t/face/popo/kaixin.gif"],["困","http://img4.cache.netease.com/t/face/popo/kun.gif"],["流口水","http://img4.cache.netease.com/t/face/popo/liukoushui.gif"],["流泪","http://img4.cache.netease.com/t/face/popo/liulei.gif"],["迷惑","http://img4.cache.netease.com/t/face/popo/mihuo.gif"],["摸摸","http://img4.cache.netease.com/t/face/popo/momo.gif"],["扭捏","http://img4.cache.netease.com/t/face/popo/niunie.gif"],["拍桌子","http://img4.cache.netease.com/t/face/popo/paizhuozi.gif"],["飘啊飘","http://img4.cache.netease.com/t/face/popo/piaoapiao.gif"],["气呼呼","http://img4.cache.netease.com/t/face/popo/qihuhu.gif"],["亲亲","http://img4.cache.netease.com/t/face/popo/qinqin.gif"],["亲一个","http://img4.cache.netease.com/t/face/popo/qinyige.gif"],["色色","http://img4.cache.netease.com/t/face/popo/semimi.gif"],["耍酷","http://img4.cache.netease.com/t/face/popo/shuaku.gif"],["叹气","http://img4.cache.netease.com/t/face/popo/tanqi.gif"],["微笑","http://img4.cache.netease.com/t/face/popo/weixiao.gif"],["无辜","http://img4.cache.netease.com/t/face/popo/wugu.gif"],["秀一下","http://img4.cache.netease.com/t/face/popo/xiuyixia.gif"],["再见","http://img4.cache.netease.com/t/face/popo/zaijian.gif"],["擂鼓","http://img1.cache.netease.com/t/face/default/gu.gif"],["爆青筋","http://img4.cache.netease.com/t/face/popo/zhuakuang.gif"],["黑社会","http://img4.cache.netease.com/t/face/popo/zhuangku.gif"],["不好","http://img4.cache.netease.com/t/face/popo/buhao.gif"],["抽烟","http://img4.cache.netease.com/t/face/popo/chouyan.gif"],["灯泡","http://img4.cache.netease.com/t/face/popo/dengpao.gif"],["电话","http://img4.cache.netease.com/t/face/popo/dianhua.gif"],["好","http://img4.cache.netease.com/t/face/popo/hao.gif"],["喝酒","http://img4.cache.netease.com/t/face/popo/hejiu.gif"],["花","http://img4.cache.netease.com/t/face/popo/hua.gif"],["礼物","http://img1.cache.netease.com/t/face/default/liwu.gif"],["杀死你","http://img4.cache.netease.com/t/face/popo/shasini.gif"],["屎","http://img4.cache.netease.com/t/face/popo/shi.gif"],["吻你","http://img4.cache.netease.com/t/face/popo/wenni.gif"],["握手","http://img4.cache.netease.com/t/face/popo/woshou.gif"],["心","http://img4.cache.netease.com/t/face/popo/xin.gif"],["心碎","http://img4.cache.netease.com/t/face/popo/xinsui.gif"],["炸弹","http://img4.cache.netease.com/t/face/popo/zhadan.gif"],["月亮","http://img4.cache.netease.com/t/face/popo/yuliang.gif"],["勾引","http://img1.cache.netease.com/t/face/yunying/gouyin.gif"],["纠结","http://img1.cache.netease.com/t/face/yunying/jiujie.gif"],["开心","http://img1.cache.netease.com/t/face/yunying/kaixin.gif"],["困死了","http://img1.cache.netease.com/t/face/yunying/kunsile.gif"],["路过","http://img1.cache.netease.com/t/face/yunying/luguo.gif"],["冒泡","http://img1.cache.netease.com/t/face/yunying/maopao.gif"],["飘走","http://img1.cache.netease.com/t/face/yunying/piaozou.gif"],["思考","http://img1.cache.netease.com/t/face/yunying/sikao.gif"],["我顶","http://img1.cache.netease.com/t/face/yunying/woding.gif"],["我晕","http://img1.cache.netease.com/t/face/yunying/woyun.gif"],["抓狂","http://img1.cache.netease.com/t/face/yunying/zhuakuang.gif"],["装酷","http://img1.cache.netease.com/t/face/yunying/zhuangku.gif"],["福","http://img1.cache.netease.com/t/face/default/fu.gif"],["红包","http://img1.cache.netease.com/t/face/default/hongbao.gif"],["菊花","http://img1.cache.netease.com/t/face/default/jvhua.gif"],["蜡烛","http://img1.cache.netease.com/t/face/default/lazhu.gif"],["圣诞老人","http://img1.cache.netease.com/t/face/default/sdlr.gif"],["圣诞帽","http://img1.cache.netease.com/t/face/default/sdm.gif"],["圣诞树","http://img1.cache.netease.com/t/face/default/sds.gif"],["粽子","http://img1.cache.netease.com/t/face/default/zongzi.gif"]],"hot":[["k石化","http://img4.cache.netease.com/t/face/jieluo/shihua.gif"],["k囧","http://img4.cache.netease.com/t/face/jieluo/jiong.gif"],["j潜水","http://img4.cache.netease.com/t/face/kaluo/qianshui.gif"],["j汗","http://img4.cache.netease.com/t/face/kaluo/han.gif"],["i恩","http://img4.cache.netease.com/t/face/baigujing2/en.gif"],["g飘","http://img4.cache.netease.com/t/face/bierde/piao.gif"],["g凌乱","http://img4.cache.netease.com/t/face/bierde/lingluan.gif"],["g扯","http://img4.cache.netease.com/t/face/bierde/che.gif"],["e流鼻血","http://img4.cache.netease.com/t/face/danding/liubixie.gif"],["e开心","http://img4.cache.netease.com/t/face/danding/kaixin.gif"],["e汗","http://img4.cache.netease.com/t/face/danding/han.gif"],["i转","http://img4.cache.netease.com/t/face/baigujing2/zhuan.gif"],["d礼物","http://img4.cache.netease.com/t/face/ali21/liwu.gif"],["h河蟹","http://img4.cache.netease.com/t/face/yingzi/hexie.gif"]]};

var T163_FACES_MAP = {};
for (var k in T163_FACES) {
  var items;
  if (k === 'cartoon') {
    items = [];
    var list = T163_FACES[k];
    for (var i = 0, l = list.length; i < l; i++) {
      items = items.concat(list[i].emotions || []);
    }
  } else {
    items = T163_FACES[k] || [];
  }
  for (var j = 0, jl = items.length; j < jl; j++) {
    var item = items[j];
    T163_FACES_MAP[item[0]] = item[1];
  }
}
T163_FACES = null;

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

//http://www.douban.com/photos/album/46634840/
var YANWENZI = {
    "ʅ(‾◡◝)ʃ": "ʅ(‾◡◝)ʃ",
    "♪(´ε｀)": "♪(´ε｀)",
    "<(￣︶￣)>": "得意 <(￣︶￣)>",
    "╮(╯_╰)╭": "沒辦法啦 ╮(╯_╰)╭",
    "(⊙ˍ⊙)": "(⊙ˍ⊙)",
    "(￣ˇ￣)": "(￣ˇ￣)",
    "（¯﹃¯）": "（¯﹃¯）",
    "”(*´ｪ`*)”": "”(*´ｪ`*)”",
    "<(▰˘◡˘▰)>": "<(▰˘◡˘▰)>",
    "(●'◡'●)ﾉ♥": "(●'◡'●)ﾉ♥",
    "(・ω< )★": "(・ω< )★",
    "(☍﹏⁰)": "(☍﹏⁰) 流泪。。",
    "(♥◠‿◠)ﾉ": "(♥◠‿◠)ﾉ",
    "(*ﾟｪﾟ*)": "(*ﾟｪﾟ*)",
    "(〒ˍ〒)": "(〒ˍ〒)",
    "╯-__-)╯ ╩╩": "╯-__-)╯ ╩╩",
    "(≧▽≦)": "(≧▽≦)",
    "(✿✪‿✪｡)ﾉ": "(✿✪‿✪｡)ﾉ",
    "囧rz": "囧rz",
    "orz": "orz",
    "✧ (≖ ‿ ≖)✧": "✧ (≖ ‿ ≖)✧",
    
    "╮(╯▽╰)╭": "沒辦法啦 ╮(╯▽╰)╭",
    "┑(￣。￣)┍": "沒辦法啦 ┑(￣。￣)┍",
    "ƪ(΄◞ิ۝◟ิ‵)ʃ": "ƪ(΄◞ิ۝◟ิ‵)ʃ",
    "└(^o^)┘": "└(^o^)┘; 偶頭好狀壯ㄋㄟ```",
    "(ˇˍˇ)": "我想想 (ˇˍˇ)",
    
    "o(╯□╰)o": "o(╯□╰)o",
    "（￣ c￣）": "（￣ c￣）",
    "Σ( ° △ °|||)︴": "Σ( ° △ °|||)︴",
    "<(=﹫_﹫;=)?>": "<(=﹫_﹫;=)?>",
    "(@^_^@)": "(@^_^@)",
    "(๑>◡<๑)": "(๑>◡<๑)",
    "ヽ(*΄◞ิ౪◟ิ‵ *)": "ヽ(*΄◞ิ౪◟ิ‵ *)",
    
    "ઈ(◕ั◡◕ั)☄*ﾟ*": "ઈ(◕ั◡◕ั)☄*ﾟ*",
    "(´･ω･｀) ": "(´･ω･｀) ",
    
    "( -'`-; )": "( -'`-; )",
    "Σ(｀д′*ノ)ノ": "Σ(｀д′*ノ)ノ",
    "＜(╰﹏╯)╯": "＜(╰﹏╯)╯",
    "罒ω罒": "罒ω罒",
    "(°Д°≡°д°)ｴｯ!?": "(°Д°≡°д°)ｴｯ!?",
    "ಥ_______ಥ": "ಥ_______ಥ",
    "(‵﹏′)": "(‵﹏′)",
    "╰ ε ╯": "╰ ε ╯",
    "(〃ω〃)彡": "(〃ω〃)彡",
    "(－－〆)": "(－－〆)",
    "(///▽///)": "(///▽///)",
    "(///ω///)": "(///ω///)",
    "≧︿≦": "≧︿≦",
    "(〃㉦〃)": "(〃㉦〃)",
    "˙ω˙": "˙ω˙",
    "⁽⁽(ཀ д ཀ)⁾⁾": "⁽⁽(ཀ д ཀ)⁾⁾",
    "乛 з乛": "乛 з乛",
    "(乛乛)": "(乛乛)",
    "(*°▽°*)": "(*°▽°*)",
    "<(ll°д°ll)>!": "<(ll°д°ll)>!",
    
    "o(∩∩)o": "o(∩∩)o",
    "✪ω✪": "✪ω✪",
    "\^O^/": "\^O^/",
    "＼(*´▽`)／": "＼(*´▽`)／",
    "(*´v`)": "(*´v`)",
    "(˘❥˘)": "(˘❥˘)",
    "(♩￢3￢)": "(♩￢3￢)",
    "( ^３^ )╱~~": "( ^３^ )╱~~",
    "ლ(╹◡╹ლ )": "ლ(╹◡╹ლ )",
    "ლ◕ิ‿◕ิლ": "ლ◕ิ‿◕ิლ",
    "ლↀѡↀლ": "ლↀѡↀლ",
    "／人◕ ‿‿ ◕人＼": "／人◕ ‿‿ ◕人＼",
    "(´・ω・｀)": "(´・ω・｀)",
    "(┬＿┬)": "(┬＿┬)",
    "(T_T)": "(T_T)",
    "(^_^)": "(^_^)",
    "(OvO)": "(OvO)",
    "(〃^∇^)o": "(〃^∇^)o",
    "(﹁\"﹁)": "(﹁\"﹁)",
    "(￣◇￣;)": "(￣◇￣;)",
    "o(￣▽￣)o": "o(￣▽￣)o",
    "o(*≧▽≦)ツ": "o(*≧▽≦)ツ",
    ">д<": ">д<",
    "ಠ_ಠ": "ಠ_ಠ",
    "Ͼ_Ͽ": "Ͼ_Ͽ",
    " ⃔⌄ ⃔": " ⃔⌄ ⃔",
    "→_→": "→_→",
    "(๑°3°๑)": "(๑°3°๑)",
    "(♩￢3￢)": "(♩￢3￢)",
    "｡◕‿◕｡": "｡◕‿◕｡",
    "(￣ε(#￣)": "被打一巴掌 (￣ε(#￣)",
    "(︶︿︶)╭∩╮": "哼.哼.哼 (︶︿︶)╭∩╮",
    "(╬▔＾▔)凸": "(╬▔＾▔)凸",
    "(^_-)-☆": "(^_-)-☆",
    "(*^︹^*)": "(*^︹^*)",
    "(*^﹏^*)": "(*^﹏^*)",
    "&( ^___^ )&": "&( ^___^ )& 麻花辫女孩",
    "(,,Ծ‸Ծ,,)": "(,,Ծ‸Ծ,,)",
    "v( ^-^(ё_ёゝ": "v( ^-^(ё_ёゝ 我女喷油",
    "٩͡[๏̯͡๏]۶": "٩͡[๏̯͡๏]۶",
    "ℰ⋆‿⋆ℰ": "ℰ⋆‿⋆ℰ 卷发的小姑凉",
    "இwஇ": "இwஇ",
    "థ౪థ": "థ౪థ",
    "(*☉౪⊙*)": "(*☉౪⊙*) 监狱兔",
    "ヾ(o゜_,゜o)ノ": "ヾ(o゜_,゜o)ノ 有酒窝的孩纸",
    "(,,゜c_,゜*)ノ": "(,,゜c_,゜*)ノ 挂鼻环的青年你伤不起~",
    "=@~@=": "=@~@= 一个看到美眉就紧张+脸红的大学生",
    "<。)#)))≦": "<。)#)))≦ 烤魚",
    "^m^": "^m^",
    "(｡・`ω´･)": "(｡・`ω´･)",
    "(゜_゜>)": "(゜_゜>)你说神马？",
    "(;_;)/~~~": "(;_;)/~~~",
    "(‘;’)": "(‘;’) 我不系斗鸡眼",
    "(^人^)": "(^人^)",
    "m(_ _)m": "m(_ _)m",
    "( ′θ`)": "( ′θ`)",
    " (ノへ￣、)": " (ノへ￣、)",
    "ˇ▽ˇ": "ˇ▽ˇ",
    "(.Q.)": "(.Q.)",
    "╰（‵□′）╯": "╰（‵□′）╯",
    "♥(꒪.̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̨̨̨̨̨̨̨̨̨̨̨̨.̸̸̨̨꒪ )": "流鼻血 ♥(꒪.̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̸̨̨̨̨̨̨̨̨̨̨̨̨.̸̸̨̨꒪ )",
    "~Ⴚ(●ტ●)Ⴢ~": "~Ⴚ(●ტ●)Ⴢ~",
    "٩(×̯×)۶": "٩(×̯×)۶",
    "٩(•̮̮̃•̃)۶": "٩(•̮̮̃•̃)۶",
    "٩(-̮̮̃-̃)۶": "٩(-̮̮̃-̃)۶",
    "(๑꒪◞౪◟꒪๑)": "(๑꒪◞౪◟꒪๑)",
    "✷(ꇐ‿ꇐ)✷": "✷(ꇐ‿ꇐ)✷",
    "<( ‵□′)───C＜─___-)||": "捏脸 <( ‵□′)───C＜─___-)||",
    "_(:3」∠)_": "_(:3」∠)_",
    "__ノ乙(、'ノ、)_": "__ノ乙(、'ノ、)_",
};

var RENREN_FACES_TPL = '({{name}})';
var RENREN_FACES = {
  "谄笑": "http://a.xnimg.cn/imgpro/emotions/tie/2.gif?ver=1",
  "吃饭": "http://a.xnimg.cn/imgpro/emotions/tie/3.gif?ver=1",
  "调皮": "http://a.xnimg.cn/imgpro/emotions/tie/4.gif?ver=1",
  "尴尬": "http://a.xnimg.cn/imgpro/emotions/tie/5.gif?ver=1",
  "汗": "http://a.xnimg.cn/imgpro/emotions/tie/6.gif?ver=1",
  "惊恐": "http://a.xnimg.cn/imgpro/emotions/tie/7.gif?ver=1",
  "囧": "http://a.xnimg.cn/imgpro/emotions/tie/8.gif?ver=1",
  "可爱": "http://a.xnimg.cn/imgpro/emotions/tie/9.gif?ver=1",
  "酷": "http://a.xnimg.cn/imgpro/emotions/tie/10.gif?ver=1",
  "流口水": "http://a.xnimg.cn/imgpro/emotions/tie/11.gif?ver=1",
  "生病": "http://a.xnimg.cn/imgpro/emotions/tie/14.gif?ver=1",
  "叹气": "http://a.xnimg.cn/imgpro/emotions/tie/15.gif",
  "淘气": "http://a.xnimg.cn/imgpro/emotions/tie/16.gif",
  "舔": "http://a.xnimg.cn/imgpro/emotions/tie/17.gif",
  "偷笑": "http://a.xnimg.cn/imgpro/emotions/tie/18.gif",
  "吻": "http://a.xnimg.cn/imgpro/emotions/tie/20.gif",
  "晕": "http://a.xnimg.cn/imgpro/emotions/tie/21.gif?ver=1",
  "住嘴": "http://a.xnimg.cn/imgpro/emotions/tie/23.gif",
  "大笑": "http://a.xnimg.cn/imgpro/icons/statusface/16.gif?ver=1",
  "害羞": "http://a.xnimg.cn/imgpro/icons/statusface/shy.gif",
  "口罩": "http://a.xnimg.cn/imgpro/icons/statusface/17.gif",
  "哭": "http://a.xnimg.cn/imgpro/icons/statusface/cry.gif",
  "困": "http://a.xnimg.cn/imgpro/icons/statusface/sleepy.gif",
  "难过": "http://a.xnimg.cn/imgpro/icons/statusface/sad.gif",
  "生气": "http://a.xnimg.cn/imgpro/icons/statusface/5.gif?ver=1",
  "书呆子": "http://a.xnimg.cn/imgpro/icons/statusface/13.gif?ver=1",
  "微笑": "http://a.xnimg.cn/imgpro/icons/statusface/1.gif?ver=1",
  "不": "http://a.xnimg.cn/imgpro/emotions/tie/1.gif",
  "惊讶": "http://a.xnimg.cn/imgpro/icons/statusface/surprise.gif",
  "kb": "http://a.xnimg.cn/imgpro/icons/statusface/kbz2.gif", 
  "sx": "http://a.xnimg.cn/imgpro/icons/statusface/shaoxiang.gif",
  "gl": "http://a.xnimg.cn/imgpro/icons/statusface/geili.gif",
  "yl": "http://a.xnimg.cn/imgpro/icons/statusface/yali.gif",
  "hold1": "http://a.xnimg.cn/imgpro/icons/statusface/holdzhu.gif",
  "cold": "http://a.xnimg.cn/imgpro/icons/statusface/cold.gif",
  "bw": "http://a.xnimg.cn/imgpro/icons/statusface/sleep.gif",
  "feng": "http://a.xnimg.cn/imgpro/icons/statusface/fan.gif",
  "hot": "http://a.xnimg.cn/imgpro/icons/statusface/hot.gif",
  "nuomi": "http://a.xnimg.cn/imgpro/icons/statusface/nuomi2.gif",
  "rs": "http://a.xnimg.cn/imgpro/icons/statusface/rose0314.gif",
  "sbq": "http://a.xnimg.cn/imgpro/icons/statusface/shangbuqi.gif",
  "th": "http://a.xnimg.cn/imgpro/icons/statusface/exclamation.gif",
  "mb": "http://a.xnimg.cn/imgpro/icons/statusface/guibai.gif",
  "tucao": "http://a.xnimg.cn/imgpro/icons/statusface/tuc.gif",
  "gk3": "http://a.xnimg.cn/imgpro/icons/statusface/gk.gif",
  "xx": "http://a.xnimg.cn/imgpro/icons/statusface/xx.gif"
};

var TAOBAO_FACES_URL_PRE = 'http://t.taobao.org/theme/taobao/emotions/';
var TAOBAO_FACES_TPL = '[^{{name}}^]';
var TAOBAO_FACES = {
  '微笑': '0.gif',
  '害羞': '1.gif',
  '吐舌头': '2.gif',
  '偷笑': '3.gif',
  '爱慕': '4.gif',
  '大笑': '5.gif',
  '跳舞': '6.gif',
  '飞吻': '7.gif',
  '安慰': '8.gif',
  '抱抱': '9.gif',
  '加油': '10.gif',
  '胜利': '11.gif',
  '强': '12.gif',
  '亲亲': '13.gif',
  '花痴': '14.gif',
  '露齿笑': '15.gif',
  '查找': '16.gif',
  '呼叫': '17.gif',
  '算账': '18.gif',
  '财迷': '19.gif',
  '好主意': '20.gif',
  '鬼脸': '21.gif',
  '天使': '22.gif',
  '拜拜': '23.gif',
  '流口水': '24.gif',
  '享受': '25.gif',
  '色情狂': '26.gif',
  '呆若木鸡': '27.gif',
  '思考': '28.gif',
  '迷惑': '29.gif',
  '疑问': '30.gif',
  '没钱了': '31.gif',
  '无聊': '32.gif',
  '怀疑': '33.gif',
  '嘘': '34.gif',
  '小样': '35.gif',
  '摇头': '36.gif',
  '感冒': '37.gif',
  '尴尬': '38.gif',
  '傻笑': '39.gif',
  '不会吧\t': '40.gif',
  '无奈': '41.gif',
  '流汗': '42.gif',
  '凄凉': '43.gif',
  '困了': '44.gif',
  '晕': '45.gif',
  '忧伤': '46.gif',
  '委屈': '47.gif',
  '悲泣': '48.gif',
  '大哭': '49.gif',
  '痛哭': '50.gif',
  'I服了U': '51.gif',
  '对不起': '52.gif',
  '再见': '53.gif',
  '皱眉': '54.gif',
  '好累': '55.gif',
  '生病': '56.gif',
  '吐': '57.gif',
  '背': '58.gif',
  '惊讶': '59.gif',
  '惊愕': '60.gif',
  '闭嘴': '61.gif',
  '欠扁': '62.gif',
  '鄙视你': '63.gif',
  '大怒': '64.gif',
  '生气': '65.gif',
  '财神': '66.gif',
  '学习雷锋': '67.gif',
  '恭喜发财': '68.gif',
  '小二': '69.gif',
  '老大': '70.gif',
  '邪恶': '71.gif',
  '单挑': '72.gif',
  'CS': '73.gif',
  '隐形人': '74.gif',
  '炸弹': '75.gif',
  '惊声尖叫': '76.gif',
  '漂亮MM': '77.gif',
  '帅哥': '78.gif',
  '招财猫': '79.gif',
  '成交': '80.gif',
  '鼓掌': '81.gif',
  '握手': '82.gif',
  '红唇': '83.gif',
  '玫瑰': '84.gif',
  '残花': '85.gif',
  '爱心': '86.gif',
  '心碎': '87.gif',
  '钱': '88.gif',
  '购物': '89.gif',
  '礼物': '90.gif',
  '收邮件': '91.gif',
  '电话': '92.gif',
  '举杯庆祝': '93.gif',
  '时钟': '94.gif',
  '等待': '95.gif',
  '很晚了': '96.gif',
  '飞机': '97.gif',
  '支付宝': '98.gif'
};

exports.faces = {
  'tsina': [ TSINA_FACES, TSINA_FACE_URL_PRE, TSINA_FACE_TPL, '新浪' ],
  'weibo': [ TSINA_FACES, TSINA_FACE_URL_PRE, TSINA_FACE_TPL, '新浪' ],   
  'tqq': [ TQQ_EMOTIONS, TQQ_EMOTIONS_URL_PRE, TQQ_FACE_TPL, '腾讯' ],
  'yanwenzi': [ YANWENZI, null, null, '颜文字' ],
  't_taobao': [ TAOBAO_FACES, TAOBAO_FACES_URL_PRE, TAOBAO_FACES_TPL, '淘宝' ],
  'tsohu': [ TSOHU_EMOTIONS, TSOHU_EMOTIONS_URL_PRE, TSOHU_FACE_TPL, '搜狐' ],
  't163': [ T163_EMOTIONS, T163_EMOTIONS_URL_PRE, T163_FACE_TPL, '网易' ],
  'renren': [ RENREN_FACES, '', RENREN_FACES_TPL, '人人' ]
};

