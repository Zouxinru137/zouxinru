/**
 * 文件名：zou-seed.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：三级项目建库脚本（路径 A：Node.js + SQLite）
 *       使用 Node 内置 node:sqlite 模块建表并写入测试数据，可重复执行（先删后建）。
 */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');

const dbPath = path.join(__dirname, 'video.sqlite');
const db = new DatabaseSync(dbPath);

/** zouEncrypt：sha256 加盐加密（高阶功能：密码加密存储） */
function zouEncrypt(pwd, salt) {
  return crypto.createHash('sha256').update(salt + pwd + salt).digest('hex');
}

// ---------- 建表 ----------
db.exec(`
DROP TABLE IF EXISTS zou_comment;
DROP TABLE IF EXISTS zou_video;
DROP TABLE IF EXISTS zou_category;
DROP TABLE IF EXISTS zou_user;
DROP TABLE IF EXISTS zou_token;

CREATE TABLE zou_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 主键
  username TEXT NOT NULL UNIQUE,              -- 用户名（登录账号）
  password TEXT NOT NULL,                     -- sha256 加盐密文，格式 salt:hash
  nickname TEXT DEFAULT '',                   -- 昵称
  avatar TEXT DEFAULT 'images/avatar.png',    -- 头像
  role TEXT DEFAULT 'user',                   -- 角色 user / admin
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE zou_category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                         -- 分类名（电视剧/电影/动漫/综艺/纪录片）
  sort INTEGER DEFAULT 0,                     -- 排序权重
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE zou_video (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                        -- 片名
  cid INTEGER NOT NULL,                       -- 分类 id，关联 zou_category.id
  cover TEXT NOT NULL,                        -- 封面图（本地 images/）
  score REAL DEFAULT 0,                       -- 评分 0~10
  actors TEXT DEFAULT '',                     -- 主演
  director TEXT DEFAULT '',                   -- 导演
  year INTEGER DEFAULT 2026,                  -- 年份
  area TEXT DEFAULT '',                       -- 地区
  episodes TEXT DEFAULT '',                   -- 集数/更新至
  tags TEXT DEFAULT '',                       -- 标签（逗号分隔）
  plays INTEGER DEFAULT 0,                    -- 热度值
  summary TEXT DEFAULT '',                    -- 剧情简介
  status INTEGER DEFAULT 1,                   -- 1 上架 0 下架
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE zou_comment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vid INTEGER NOT NULL,                       -- 关联 zou_video.id
  uid INTEGER NOT NULL,                       -- 关联 zou_user.id
  content TEXT NOT NULL,                      -- 评论内容
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE zou_token (
  token TEXT PRIMARY KEY,                     -- 登录令牌
  uid INTEGER NOT NULL,                       -- 关联 zou_user.id
  expire INTEGER NOT NULL                     -- 过期时间戳（毫秒）
);
`);

// ---------- 分类种子 ----------
const cats = [
  ['电视剧', 1], ['电影', 2], ['动漫', 3], ['综艺', 4], ['纪录片', 5]
];
const insCat = db.prepare('INSERT INTO zou_category (name, sort) VALUES (?, ?)');
for (const c of cats) insCat.run(...c);

// ---------- 视频种子（25 条，封面 images/cover1.jpg ~ cover25.jpg） ----------
// 字段：title, cid, score, actors, director, year, area, episodes, tags, plays, summary
const vids = [
  ['三体电视剧版', 1, 8.7, '张鲁一,于和伟,陈瑾', '杨磊', 2023, '中国大陆', '30集全', '科幻,悬疑', 9823000, '纳米科学家汪淼在军方协助下调查科学家连续死亡事件，发现虚拟游戏《三体》背后隐藏的地外文明真相，一场关乎人类存亡的博弈就此展开。'],
  ['漫长的季节', 1, 9.4, '范伟,秦昊,陈明昊', '辛爽', 2023, '中国大陆', '12集全', '悬疑,剧情', 8765000, '出租车司机王响与妹夫龚彪、老刑警马德胜因一起碎尸案重新聚首，三人在东北小城桦林的秋天里，追查横跨二十年的真相与救赎。'],
  ['庆余年第二季', 1, 8.0, '张若昀,李沁,陈道明', '孙皓', 2024, '中国大陆', '36集全', '古装,权谋', 9958000, '范闲历经生死劫难回到京都，在朝堂与江湖的夹缝中继续前行，家国天下的棋局越下越大，他能否守住心中道义？'],
  ['繁花', 1, 8.7, '胡歌,马伊琍,唐嫣', '王家卫', 2023, '中国大陆', '30集全', '年代,商战', 7894000, '九十年代的上海黄河路，阿宝借改革开放东风跻身商界新贵，在机遇与人情交织的时代浪潮中书写沪上传奇。'],
  ['狂飙', 1, 8.5, '张译,张颂文,李一桐', '徐纪周', 2023, '中国大陆', '39集全', '犯罪,剧情', 9120000, '刑警安欣与鱼贩高启强跨越二十年的正邪较量，一场扫黑风暴揭开京海市盘根错节的利益链条。'],
  ['去有风的地方', 1, 8.7, '刘亦菲,李现,胡冰卿', '丁梓光', 2023, '中国大陆', '40集全', '治愈,爱情', 6721000, '酒店经理许红豆辞职后前往云南大理散心，在苍山洱海间的有风小院里，与返乡创业青年谢之遥相遇，重拾生活勇气。'],
  ['流浪地球2电影版', 2, 8.3, '吴京,刘德华,李雪健', '郭帆', 2023, '中国大陆', '173分钟', '科幻,灾难', 8830000, '太阳危机来袭，人类提出移山计划驱动地球逃离太阳系。刘培强、图恒宇等人在末日倒计时中抉择，为子孙后代留下火种。'],
  ['封神第一部', 2, 7.8, '费翔,李雪健,黄渤', '乌尔善', 2023, '中国大陆', '148分钟', '神话,史诗', 7654000, '殷寿篡位称王引发天谴，姬发从质子成长为英雄，在朝歌的权力漩涡与封神榜的传说中踏上归乡之路。'],
  ['孤注一掷', 2, 7.5, '张艺兴,金晨,咏梅', '申奥', 2023, '中国大陆', '135分钟', '犯罪,剧情', 6980000, '程序员潘生与模特安娜被诱骗至境外诈骗工厂，在金钱与人性的炼狱中挣扎求生，揭开电信诈骗产业链的黑幕。'],
  ['满江红', 2, 7.0, '沈腾,易烊千玺,张译', '张艺谋', 2023, '中国大陆', '159分钟', '古装,悬疑', 6543000, '南宋绍兴年间，小兵张大与亲兵营副统领孙均卷入金国使者死亡谜案，一场局中有局的生死博弈直指岳飞遗词。'],
  ['热辣滚烫', 2, 7.5, '贾玲,雷佳音,张小斐', '贾玲', 2024, '中国大陆', '129分钟', '喜剧,励志', 7230000, '宅家多年的杜乐莹在生活接连受挫后走进拳击馆，用汗水重塑自我，学会为自己赢一次。'],
  ['长安三万里', 2, 8.3, '杨天翔,凌振赫,吴俊全', '谢君伟', 2023, '中国大陆', '168分钟', '动画,历史', 5876000, '安史之乱后，高适回忆与李白跨越数十年的交往，以诗篇串联大唐由盛转衰的壮阔画卷。'],
  ['斗罗大陆动画版', 3, 8.0, '沈磊,翟巍,黄莺', '沈乐平', 2021, '中国大陆', '更新至268集', '玄幻,热血', 9345000, '唐门外门弟子唐三因偷学内门绝学跳崖明志，穿越到斗罗大陆的武魂世界，与伙伴们一路升级并肩对抗强敌。'],
  ['完美世界动画版', 3, 7.6, '锦鲤,阎么么', '白雨函', 2021, '中国大陆', '更新至212集', '玄幻,冒险', 7123000, '石村少年石昊天生至尊骨却被夺走，从大荒中崛起，一路征战诸天，追寻完美世界之路。'],
  ['凡人修仙传动画版', 3, 8.1, '钱文青,杨天翔', '王裕仁', 2020, '中国大陆', '更新至136集', '修仙,凡人流', 8012000, '山村穷小子韩立凭借一点点灵根踏入修仙界，在弱肉强食的仙途上以小心谨慎与坚韧步步登天。'],
  ['画江湖之不良人', 3, 8.6, '边江,申秋香,阎萌萌', '刘阔', 2014, '中国大陆', '更新至第七季', '武侠,悬疑', 6989000, '唐末乱世，不良人组织遗脉李星云身怀龙泉宝藏之谜，与幻音坊、通文馆各方势力周旋，续写江湖恩仇。'],
  ['灵笼动画版', 3, 8.3, '张杰,段艺璇,马正阳', '董相博', 2019, '中国大陆', '14集全', '科幻,末世', 5874000, '大灾变后人类躲进空中堡垒灯塔苟延残喘，马克队长率猎荒者小队下地面搜集物资，揭开玛娜生态与人类存续的秘密。'],
  ['奔跑吧兄弟第八季', 4, 6.8, '李晨,郑恺,沙溢', '王恬', 2024, '中国大陆', '12期全', '真人秀,竞技', 6230000, '兄弟团回归，在全新一季的户外竞技与爆笑游戏中展开体能与智力的双重比拼，传递快乐与正能量。'],
  ['歌手当打之年', 4, 7.2, '华晨宇,周深,米希亚', '洪啸', 2020, '中国大陆', '13期全', '音乐,竞演', 5764000, '首发七组歌手云端开唱，在线竞演实时投票，华语乐坛当打之年的实力唱将们掀起一场音乐风暴。'],
  ['向往的生活第七季', 4, 7.9, '黄磊,何炅,张艺兴', '王征宇', 2023, '中国大陆', '14期全', '慢综艺,生活', 6521000, '蘑菇屋最后一季，黄磊何炅与老友新朋回归田园，种田做饭闲话家常，在慢节奏中收藏告别与重逢。'],
  ['披荆斩棘的哥哥', 4, 7.0, '陈小春,张智霖,言承旭', '刘涛', 2021, '中国大陆', '12期全', '竞演,真人秀', 5412000, '三十余位男艺人组成滚烫家族，通过一次次公演舞台的淬炼，挑战自我突破圈层，展现三十而励的锋芒。'],
  ['脱口秀大会第五季', 4, 7.1, '李诞,大张伟,周迅', '谭晓虹', 2022, '中国大陆', '10期全', '喜剧,脱口秀', 4987000, '来自各行各业的脱口秀演员同台竞技，用段子解构生活，笑点与观点齐飞，谁才是这季的幽默之王。'],
  ['蓝色星球第二季', 5, 9.8, '大卫·爱登堡', 'Owen Gower', 2017, '英国', '7集全', '自然,海洋', 4567000, '从深海热泉到极地冰盖，尖端摄影技术潜入人类未曾抵达的海域，记录海洋生命的壮丽奇观与生存智慧。'],
  ['河西走廊纪录片', 5, 9.7, '吕秀兰', '赵启辰', 2015, '中国大陆', '10集全', '历史,人文', 4321000, '从汉代张骞凿空西域到当代丝路复兴，以编年体史诗再现河西走廊两千年间的金戈铁马与文化交融。'],
  ['人生第一次纪录片', 5, 9.2, '涂松岩,高亚麟', '谢有定', 2020, '中国大陆', '12集全', '人文,社会', 3876000, '出生、上学、当兵、成家、养老……镜头对准普通中国人的十二个人生断面，在平凡瞬间里看见生活的重量。']
];
const insVid = db.prepare(`INSERT INTO zou_video
  (title, cid, cover, score, actors, director, year, area, episodes, tags, plays, summary, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
// created_at 分布在近 7 天内，供仪表盘"近 7 天新增"图表使用
const dayOffsets = [6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 6, 5, 4, 3];
vids.forEach((v, i) => {
  const d = new Date(Date.now() - dayOffsets[i] * 86400000);
  const ts = d.toISOString().slice(0, 19).replace('T', ' ');
  insVid.run(v[0], v[1], `images/cover${i + 1}.jpg`, v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], ts);
});

// ---------- 用户种子 ----------
const insUser = db.prepare('INSERT INTO zou_user (username, password, nickname, role, created_at) VALUES (?, ?, ?, ?, ?)');
insUser.run('admin', zouEncrypt('zou123456', 'zou-salt'), '管理员', 'admin', '2026-11-20 09:00:00');
insUser.run('zoulin', zouEncrypt('123456', 'zou-salt'), '小邹同学', 'user', '2026-11-21 10:30:00');
insUser.run('wangfang', zouEncrypt('123456', 'zou-salt'), '追剧少女', 'user', '2026-11-22 14:20:00');
insUser.run('liqiang', zouEncrypt('123456', 'zou-salt'), '科幻迷李强', 'user', '2026-11-23 19:45:00');
insUser.run('chenjing', zouEncrypt('123456', 'zou-salt'), '纪录片爱好者', 'user', '2026-11-24 08:10:00');

// ---------- 评论种子 ----------
const insCmt = db.prepare('INSERT INTO zou_comment (vid, uid, content, created_at) VALUES (?, ?, ?, ?)');
insCmt.run(1, 2, '还原度很高，汪淼的视角拍出来了，科幻迷狂喜！', '2026-11-24 20:15:00');
insCmt.run(1, 3, '于和伟的史强太有味道了，一口气看完。', '2026-11-25 12:30:00');
insCmt.run(2, 2, '东北话台词太绝了，秋季限定神剧。', '2026-11-25 18:00:00');
insCmt.run(3, 4, '剧情节奏比第一季更好，范闲成长了。', '2026-11-26 09:20:00');
insCmt.run(7, 4, '特效全国顶级，太空电梯那段震撼。', '2026-11-26 21:40:00');
insCmt.run(13, 3, '看到 200 多集了，唐三越来越强。', '2026-11-26 22:10:00');
insCmt.run(23, 5, '每一帧都是壁纸，海洋的浪漫。', '2026-11-27 08:05:00');

console.log('建库完成：' + dbPath);
const cnt = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log(`zou_category: ${cnt('zou_category')} 条, zou_video: ${cnt('zou_video')} 条, zou_user: ${cnt('zou_user')} 条, zou_comment: ${cnt('zou_comment')} 条`);
db.close();
