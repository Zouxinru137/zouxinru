/**
 * 文件名：server.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：三级项目后端服务（路径 A：Express + node:sqlite）
 *       提供前台接口、登录注册鉴权、后台管理接口、统计接口与 LLM 调用接口。
 *       所有接口统一返回 { code, message, data }。
 */
const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const db = new DatabaseSync(path.join(__dirname, 'video.sqlite'));
const PORT = 3000;
const TOKEN_TTL = 7 * 24 * 3600 * 1000; // token 有效期 7 天

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ---------- 公共工具 ----------
/** zouOk / zouFail：统一响应格式 */
const zouOk = (data, message = 'ok') => ({ code: 0, message, data });
const zouFail = (message, code = 1) => ({ code, message, data: null });

/** zouEncrypt：sha256 加盐加密（密码加密存储，高阶功能） */
function zouEncrypt(pwd, salt = 'zou-salt') {
  return crypto.createHash('sha256').update(salt + pwd + salt).digest('hex');
}

/** zouAuth：登录态校验中间件，token 放在 Authorization 请求头 */
function zouAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token) return res.json(zouFail('未登录', 401));
  const row = db.prepare('SELECT t.uid, t.expire, u.username, u.nickname, u.role, u.avatar FROM zou_token t JOIN zou_user u ON u.id = t.uid WHERE t.token = ?').get(token);
  if (!row || row.expire < Date.now()) return res.json(zouFail('登录已过期', 401));
  req.zouUser = row;
  next();
}

/** zouAdmin：管理员鉴权中间件（未登录或非管理员均拦截） */
function zouAdmin(req, res, next) {
  zouAuth(req, res, () => {
    if (req.zouUser.role !== 'admin') return res.json(zouFail('无管理员权限', 403));
    next();
  });
}

/** zouPaging：分页参数解析 */
function zouPaging(q, defSize = 10) {
  const page = Math.max(1, parseInt(q.page) || 1);
  const size = Math.min(50, parseInt(q.size) || defSize);
  return { page, size, offset: (page - 1) * size };
}

// ================= 前台接口 =================

/** 分类列表 */
app.get('/api/zou/category/list', (req, res) => {
  const list = db.prepare('SELECT * FROM zou_category ORDER BY sort ASC').all();
  res.json(zouOk(list));
});

/** GET /api/zou/video/list?page=&size=&cid= 分页列表 */
app.get('/api/zou/video/list', (req, res) => {
  const { page, size, offset } = zouPaging(req.query);
  const cid = parseInt(req.query.cid) || 0;
  const where = cid ? 'WHERE status = 1 AND cid = ' + cid : 'WHERE status = 1';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM zou_video ${where}`).get().n;
  const list = db.prepare(`SELECT v.id, v.title, v.cover, v.score, v.tags, v.episodes, v.plays, v.year, v.area, c.name AS cname
    FROM zou_video v LEFT JOIN zou_category c ON c.id = v.cid ${where}
    ORDER BY v.plays DESC LIMIT ? OFFSET ?`).all(size, offset);
  res.json(zouOk({ total, page, size, list }));
});

/** GET /api/zou/video/search?kw=&page= 关键词搜索（标题/主演/标签） */
app.get('/api/zou/video/search', (req, res) => {
  const { page, size, offset } = zouPaging(req.query);
  const kw = (req.query.kw || '').trim();
  if (!kw) return res.json(zouOk({ total: 0, page, size, list: [] }));
  const like = `%${kw}%`;
  const total = db.prepare(`SELECT COUNT(*) AS n FROM zou_video WHERE status = 1 AND (title LIKE ? OR actors LIKE ? OR tags LIKE ?)`).get(like, like, like).n;
  const list = db.prepare(`SELECT v.id, v.title, v.cover, v.score, v.tags, v.episodes, v.plays, v.year, v.area, c.name AS cname
    FROM zou_video v LEFT JOIN zou_category c ON c.id = v.cid
    WHERE status = 1 AND (title LIKE ? OR actors LIKE ? OR tags LIKE ?)
    ORDER BY v.plays DESC LIMIT ? OFFSET ?`).all(like, like, like, size, offset);
  res.json(zouOk({ total, page, size, list, kw }));
});

/** GET /api/zou/video/rank 热播榜（按热度前 10） */
app.get('/api/zou/video/rank', (req, res) => {
  const list = db.prepare(`SELECT v.id, v.title, v.cover, v.score, v.plays, v.tags, c.name AS cname
    FROM zou_video v LEFT JOIN zou_category c ON c.id = v.cid
    WHERE v.status = 1 ORDER BY v.plays DESC LIMIT 10`).all();
  res.json(zouOk(list));
});

/** GET /api/zou/video/detail?id= 详情（URL 传参 id 调用），浏览量 +1 */
app.get('/api/zou/video/detail', (req, res) => {
  const id = parseInt(req.query.id) || 0;
  const v = db.prepare(`SELECT v.*, c.name AS cname FROM zou_video v LEFT JOIN zou_category c ON c.id = v.cid WHERE v.id = ?`).get(id);
  if (!v) return res.json(zouFail('内容不存在'));
  db.prepare('UPDATE zou_video SET plays = plays + 1 WHERE id = ?').run(id);
  const comments = db.prepare(`SELECT cm.id, cm.content, cm.created_at, u.nickname, u.avatar FROM zou_comment cm
    JOIN zou_user u ON u.id = cm.uid WHERE cm.vid = ? ORDER BY cm.created_at DESC LIMIT 20`).all(id);
  const related = db.prepare(`SELECT id, title, cover, score, plays FROM zou_video WHERE cid = ? AND id != ? AND status = 1 ORDER BY plays DESC LIMIT 4`).all(v.cid, id);
  res.json(zouOk({ ...v, plays: v.plays + 1, comments, related }));
});

/** POST /api/zou/user/register 注册（用户名唯一校验 + 密码加密存储） */
app.post('/api/zou/user/register', (req, res) => {
  const { username, password, nickname } = req.body || {};
  if (!username || !password) return res.json(zouFail('用户名和密码不能为空'));
  if (!/^[a-zA-Z][a-zA-Z0-9_]{3,15}$/.test(username)) return res.json(zouFail('用户名须为 4~16 位字母开头'));
  if (password.length < 6) return res.json(zouFail('密码至少 6 位'));
  const exist = db.prepare('SELECT id FROM zou_user WHERE username = ?').get(username);
  if (exist) return res.json(zouFail('用户名已被注册'));
  const info = db.prepare('INSERT INTO zou_user (username, password, nickname) VALUES (?, ?, ?)')
    .run(username, zouEncrypt(password), nickname || '用户' + username.slice(0, 4));
  res.json(zouOk({ id: Number(info.lastInsertRowid), username }, '注册成功'));
});

/** POST /api/zou/user/login 登录（校验密文，签发 token） */
app.post('/api/zou/user/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = db.prepare('SELECT * FROM zou_user WHERE username = ?').get(username || '');
  if (!u || u.password !== zouEncrypt(password || '')) return res.json(zouFail('用户名或密码错误'));
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO zou_token (token, uid, expire) VALUES (?, ?, ?)').run(token, u.id, Date.now() + TOKEN_TTL);
  res.json(zouOk({ token, id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar, role: u.role }, '登录成功'));
});

/** POST /api/zou/user/logout 退出登录 */
app.post('/api/zou/user/logout', zouAuth, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  db.prepare('DELETE FROM zou_token WHERE token = ?').run(token);
  res.json(zouOk(null, '已退出'));
});

/** GET /api/zou/user/info 当前用户信息（需 token） */
app.get('/api/zou/user/info', zouAuth, (req, res) => {
  res.json(zouOk(req.zouUser));
});

/** GET /api/zou/comment/list?vid= 评论列表 */
app.get('/api/zou/comment/list', (req, res) => {
  const vid = parseInt(req.query.vid) || 0;
  const list = db.prepare(`SELECT cm.id, cm.content, cm.created_at, u.nickname, u.avatar FROM zou_comment cm
    JOIN zou_user u ON u.id = cm.uid WHERE cm.vid = ? ORDER BY cm.created_at DESC`).all(vid);
  res.json(zouOk(list));
});

/** POST /api/zou/comment/add 发表评论（需登录） */
app.post('/api/zou/comment/add', zouAuth, (req, res) => {
  const { vid, content } = req.body || {};
  if (!vid || !content) return res.json(zouFail('参数不完整'));
  const info = db.prepare('INSERT INTO zou_comment (vid, uid, content) VALUES (?, ?, ?)').run(vid, req.zouUser.uid, content);
  res.json(zouOk({ id: Number(info.lastInsertRowid) }, '评论成功'));
});

// ================= 后台管理接口（均需管理员 token） =================

/** 实体通用 CRUD 工厂：table, 搜索字段 */
function zouMakeCrud(base, table, searchCols, orderCol = 'id DESC') {
  // 列表（分页 + 搜索）
  app.get(`/api/zou/admin/${base}/list`, zouAdmin, (req, res) => {
    const { page, size, offset } = zouPaging(req.query, 8);
    const kw = (req.query.kw || '').trim();
    let where = '1=1', params = [];
    if (kw) {
      where = '(' + searchCols.map(c => `${c} LIKE ?`).join(' OR ') + ')';
      params = searchCols.map(() => `%${kw}%`);
    }
    const total = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get(...params).n;
    const list = db.prepare(`SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderCol} LIMIT ? OFFSET ?`).all(...params, size, offset);
    res.json(zouOk({ total, page, size, list }));
  });
  // 新增
  app.post(`/api/zou/admin/${base}/add`, zouAdmin, (req, res) => {
    const cols = Object.keys(req.body || {});
    if (!cols.length) return res.json(zouFail('参数不完整'));
    const info = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map(c => req.body[c]));
    res.json(zouOk({ id: Number(info.lastInsertRowid) }, '新增成功'));
  });
  // 修改
  app.put(`/api/zou/admin/${base}/:id`, zouAdmin, (req, res) => {
    const cols = Object.keys(req.body || {});
    if (!cols.length) return res.json(zouFail('参数不完整'));
    db.prepare(`UPDATE ${table} SET ${cols.map(c => `${c} = ?`).join(',')} WHERE id = ?`).run(...cols.map(c => req.body[c]), req.params.id);
    res.json(zouOk(null, '修改成功'));
  });
  // 删除
  app.delete(`/api/zou/admin/${base}/:id`, zouAdmin, (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json(zouOk(null, '删除成功'));
  });
}

// 三个实体：视频 / 分类 / 用户
zouMakeCrud('video', 'zou_video', ['title', 'actors', 'tags']);
zouMakeCrud('category', 'zou_category', ['name']);
zouMakeCrud('user', 'zou_user', ['username', 'nickname']);

// GET /api/zou/admin/stat/overview 仪表盘统计数据（真实接口数据，图表不写死）
app.get('/api/zou/admin/stat/overview', zouAdmin, (req, res) => {
  const byCategory = db.prepare(`SELECT c.name, COUNT(v.id) AS value FROM zou_category c
    LEFT JOIN zou_video v ON v.cid = c.id GROUP BY c.id ORDER BY c.sort`).all();
  // 近 7 天每日新增视频数
  const days = [];
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    days.push(key.slice(5));
    daily.push(db.prepare(`SELECT COUNT(*) AS n FROM zou_video WHERE substr(created_at, 1, 10) = ?`).get(key).n);
  }
  const counts = {
    video: db.prepare('SELECT COUNT(*) AS n FROM zou_video').get().n,
    user: db.prepare('SELECT COUNT(*) AS n FROM zou_user').get().n,
    comment: db.prepare('SELECT COUNT(*) AS n FROM zou_comment').get().n,
    category: db.prepare('SELECT COUNT(*) AS n FROM zou_category').get().n,
    totalPlays: db.prepare('SELECT SUM(plays) AS n FROM zou_video').get().n || 0
  };
  res.json(zouOk({ counts, byCategory, daily: { days, values: daily } }));
});

// ================= LLM 调用接口（大模型能力，密钥仅在后端） =================
const AI_URL = process.env.ZOU_AI_URL || '';   // OpenAI 兼容接口地址
const AI_KEY = process.env.ZOU_AI_KEY || '';   // API Key（环境变量，不进前端）

/** zouCallLLM：调用 OpenAI 兼容大模型接口；未配置密钥时返回 null，走本地降级 */
async function zouCallLLM(system, user) {
  if (!AI_URL || !AI_KEY) return null;
  try {
    const resp = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AI_KEY },
      body: JSON.stringify({
        model: process.env.ZOU_AI_MODEL || 'qwen-plus',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.7
      })
    });
    const j = await resp.json();
    return j.choices && j.choices[0] && j.choices[0].message.content || null;
  } catch (e) {
    console.error('LLM 调用失败:', e.message);
    return null;
  }
}

/** POST /api/zou/ai/summary AI 剧情简介（对影片简介做智能扩写推荐语） */
app.post('/api/zou/ai/summary', async (req, res) => {
  const id = parseInt((req.body || {}).vid) || 0;
  const v = db.prepare('SELECT title, tags, summary FROM zou_video WHERE id = ?').get(id);
  if (!v) return res.json(zouFail('内容不存在'));
  const text = await zouCallLLM(
    '你是影视推荐官，用 80 字以内生成一段有吸引力的推荐语，口语化，不出现书名号。',
    `片名《${v.title}》，类型 ${v.tags}。剧情：${v.summary}`
  );
  // 降级方案：无密钥/调用失败时基于数据本地生成，保证功能可运行
  const fallback = `《${v.title}》聚焦${(v.tags || '精彩剧情').split(',')[0]}题材，${v.summary.slice(0, 60)}……口碑佳作，值得一追！`;
  res.json(zouOk({ text: text || fallback, source: text ? 'llm' : 'local' }));
});

/** POST /api/zou/ai/chat AI 智能客服（影视问答） */
app.post('/api/zou/ai/chat', async (req, res) => {
  const msg = ((req.body || {}).message || '').trim();
  if (!msg) return res.json(zouFail('请输入内容'));
  // 检索站内影片作为上下文（简单关键词匹配）
  const like = `%${msg}%`;
  const hits = db.prepare(`SELECT title, score, tags FROM zou_video WHERE title LIKE ? OR tags LIKE ? OR actors LIKE ? LIMIT 3`).all(like, like, like);
  const text = await zouCallLLM(
    '你是"zou 视频站"的智能客服，回答影视相关问题，50 字以内，语气亲切。',
    `用户问题：${msg}。站内相关影片：${hits.map(h => `${h.title}(${h.score}分)`).join('、') || '无'}`
  );
  const fallback = hits.length
    ? `为您找到相关影片：${hits.map(h => h.title).join('、')}，可在搜索页查看详情哦~`
    : `暂时没有找到与"${msg}"相关的内容，您可以试试搜索"科幻""悬疑"等关键词~`;
  res.json(zouOk({ text: text || fallback, source: text ? 'llm' : 'local' }));
});

app.listen(PORT, () => console.log(`zou-video 服务已启动: http://localhost:${PORT}/index.html`));
