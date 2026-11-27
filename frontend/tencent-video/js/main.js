/* =====================================================
 * 腾讯视频模拟项目 - 前端逻辑（原生 JavaScript，无第三方库）
 * 数据源：Supabase REST API（PostgREST）
 * ===================================================== */

/* ---------- Supabase 配置 ---------- */
const SUPABASE_URL = 'https://zssycxolrsjyitguyilw.supabase.co';
const SUPABASE_API_KEY = 'sb_publishable_dszp5-1x6Z5UMH5etJu0dw_bIT_CddZ';

const REST_BASE = SUPABASE_URL + '/rest/v1';

/* 公共请求头：apikey + Authorization（匿名身份，仅可读取） */
function apiHeaders() {
  return {
    'apikey': SUPABASE_API_KEY,
    'Authorization': 'Bearer ' + SUPABASE_API_KEY,
    'Accept': 'application/json'
  };
}

/* 通用 GET 请求 */
async function restGet(path) {
  const res = await fetch(REST_BASE + path, { headers: apiHeaders() });
  if (!res.ok) {
    throw new Error('REST 请求失败: ' + res.status + ' ' + (await res.text()));
  }
  return res.json();
}

/* ---------- 全局状态 ---------- */
const state = {
  categories: [],
  videos: [],
  activeSlug: 'all',   // 当前分类
  orderBy: 'rating.desc', // 当前排序
  keyword: ''          // 搜索关键词
};

/* ---------- 工具函数 ---------- */

/* 防 XSS：转义 HTML */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* 播放量格式化：亿 / 万 */
function formatViews(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}

/* 星级：score 1-5 -> ★★★☆☆ */
function stars(score) {
  return '★★★★★'.slice(0, score) + '☆☆☆☆☆'.slice(0, 5 - score);
}

/* 根据用户名生成稳定头像色 */
function avatarColor(name) {
  const palette = ['#4f8cff', '#38d2c2', '#b06bff', '#ff7f6e', '#f5a623', '#5ec269'];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

/* ---------- 数据加载 ---------- */

/* 加载分类（GET /rest/v1/categories） */
async function loadCategories() {
  state.categories = await restGet('/categories?order=sort_order.asc');
  renderCategoryTabs();
}

/* 加载视频（GET /rest/v1/videos，关联 categories 表取分类名） */
async function loadVideos() {
  let path = '/videos?select=*,categories(name,slug)&order=' + encodeURIComponent(state.orderBy);

  if (state.activeSlug !== 'all') {
    // 由 slug 查到对应分类 id 后按外键精确过滤
    const cat = state.categories.find(function (c) { return c.slug === state.activeSlug; });
    if (cat) path += '&category_id=eq.' + cat.id;
  }
  if (state.keyword) {
    // 模糊搜索，仅支持单个关键词（ilike 语法）
    path += '&title=ilike.*' + encodeURIComponent(state.keyword) + '*';
  }

  state.videos = await restGet(path);
  renderVideoGrid();
}

/* 加载某视频的评论（GET /rest/v1/comments?video_id=eq.X） */
async function loadComments(videoId) {
  return restGet('/comments?video_id=eq.' + videoId + '&order=like_count.desc');
}

/* ---------- 渲染 ---------- */

/* 分类标签 */
function renderCategoryTabs() {
  const box = document.getElementById('categoryTabs');
  const tabsHtml = ['<button class="tab active" data-slug="all">全部</button>']
    .concat(state.categories.map(function (c) {
      return '<button class="tab" data-slug="' + esc(c.slug) + '">' + esc(c.name) + '</button>';
    }));
  box.innerHTML = tabsHtml.join('');
}

/* 视频网格 */
function renderVideoGrid() {
  const grid = document.getElementById('videoGrid');
  const title = document.getElementById('listTitle');

  if (!state.videos.length) {
    title.textContent = '精选推荐';
    grid.innerHTML = '<div class="loading">没有匹配的内容，换个关键词试试～</div>';
    return;
  }

  title.textContent = state.keyword
    ? '“' + state.keyword + '” 的搜索结果（' + state.videos.length + '）'
    : '精选推荐';

  grid.innerHTML = state.videos.map(function (v) {
    const catName = v.categories && v.categories.name ? v.categories.name : '';
    return (
      '<div class="video-card" data-id="' + v.id + '">' +
        '<div class="cover-wrap">' +
          '<img src="' + esc(v.cover_url) + '" alt="' + esc(v.title) + '" loading="lazy">' +
          '<div class="cover-mask">' +
            '<span class="views">' + formatViews(v.view_count) + ' 播放</span>' +
            '<span class="score-pill">' + Number(v.rating).toFixed(1) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-info">' +
          '<div class="card-title">' + esc(v.title) + '</div>' +
          '<div class="card-meta">' +
            '<span class="cat">' + esc(catName) + '</span>' +
            '<span>' + v.release_year + '</span>' +
            (v.is_vip ? '<span class="vip">VIP</span>' : '<span class="free">免费</span>') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* 焦点横幅：取评分最高的视频 */
function renderHero() {
  const top = state.videos.slice().sort(function (a, b) { return b.rating - a.rating; })[0];
  if (!top) return;

  const hero = document.getElementById('hero');
  hero.style.setProperty('--hero-image', 'url("' + top.cover_url + '")');
  document.getElementById('heroTitle').textContent = top.title;
  document.getElementById('heroDesc').textContent = top.description;
  document.getElementById('heroMeta').innerHTML =
    '<span class="score">' + Number(top.rating).toFixed(1) + ' 分</span>' +
    '<span>' + top.release_year + ' 年</span>' +
    '<span>' + formatViews(top.view_count) + ' 次播放</span>' +
    (top.is_vip ? '<span>VIP 专享</span>' : '<span>免费观看</span>');
}

/* 详情弹窗 */
async function openModal(videoId) {
  const video = state.videos.find(function (v) { return v.id === videoId; });
  if (!video) return;

  const catName = video.categories && video.categories.name ? video.categories.name : '';
  document.getElementById('modalBody').innerHTML =
    '<div class="detail-hero"><img src="' + esc(video.cover_url) + '" alt="' + esc(video.title) + '"></div>' +
    '<div class="detail-info">' +
      '<h2>' + esc(video.title) + '</h2>' +
      '<div class="detail-tags">' +
        '<span class="score">' + Number(video.rating).toFixed(1) + ' 分</span>' +
        '<span>' + esc(catName) + '</span>' +
        '<span>' + video.release_year + '</span>' +
        '<span>' + formatViews(video.view_count) + ' 次播放</span>' +
        (video.is_vip ? '<span class="vip">VIP</span>' : '<span>免费</span>') +
      '</div>' +
      '<p class="detail-desc">' + esc(video.description) + '</p>' +
    '</div>' +
    '<div class="comment-section">' +
      '<h3>热门评论</h3>' +
      '<div id="commentList"><div class="loading">评论加载中…</div></div>' +
    '</div>';

  document.getElementById('modalMask').classList.add('show');

  // 异步加载评论
  try {
    const comments = await loadComments(videoId);
    const box = document.getElementById('commentList');
    if (!box) return; // 弹窗已关闭

    box.innerHTML = comments.length
      ? comments.map(function (c) {
          return (
            '<div class="comment-item">' +
              '<div class="comment-avatar" style="background:' + avatarColor(c.user_name) + '">' +
                esc(c.user_name.slice(0, 1)) +
              '</div>' +
              '<div class="comment-main">' +
                '<div class="comment-user">' + esc(c.user_name) + '</div>' +
                '<div class="comment-text">' + esc(c.content) + '</div>' +
                '<div class="comment-foot">' +
                  '<span class="stars">' + stars(c.rating) + '</span>' +
                  '<span>👍 ' + c.like_count + '</span>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('')
      : '<div class="loading">还没有评论，快来抢沙发～</div>';
  } catch (e) {
    const box = document.getElementById('commentList');
    if (box) box.innerHTML = '<div class="loading">评论加载失败：' + esc(e.message) + '</div>';
  }
}

function closeModal() {
  document.getElementById('modalMask').classList.remove('show');
}

/* ---------- 事件绑定 ---------- */
function bindEvents() {
  // 分类切换
  document.getElementById('categoryTabs').addEventListener('click', function (e) {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    this.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    btn.classList.add('active');
    state.activeSlug = btn.dataset.slug;
    loadVideos().catch(showError);
  });

  // 排序切换
  document.getElementById('sortSelect').addEventListener('change', function () {
    state.orderBy = this.value;
    loadVideos().catch(showError);
  });

  // 搜索
  function doSearch() {
    state.keyword = document.getElementById('searchInput').value.trim();
    state.activeSlug = 'all';
    const tabs = document.getElementById('categoryTabs');
    tabs.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.slug === 'all');
    });
    loadVideos().catch(showError);
  }
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  // 打开详情
  document.getElementById('videoGrid').addEventListener('click', function (e) {
    const card = e.target.closest('.video-card');
    if (card) openModal(Number(card.dataset.id));
  });

  // 关闭弹窗
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalMask').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
}

/* 错误提示 */
function showError(e) {
  document.getElementById('videoGrid').innerHTML =
    '<div class="loading">数据加载失败：' + esc(e.message) + '</div>';
}

/* ---------- 启动 ---------- */
async function init() {
  bindEvents();
  try {
    await loadCategories();
    await loadVideos();
    renderHero();
  } catch (e) {
    showError(e);
  }
}

document.addEventListener('DOMContentLoaded', init);
