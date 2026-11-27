/**
 * 文件名：zou-detail.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：详情页脚本 —— location.search 解析 URL 传参 id，调用详情接口渲染；
 *       AI 简介与 AI 客服（LLM 接口调用）、评论列表与发表评论（登录鉴权）、
 *       收藏（localStorage 本地存储效果）
 */
'use strict';

/* 解析 URL 传参：detail.html?id=3 */
const qs = new URLSearchParams(location.search);
const vid = parseInt(qs.get('id')) || 1;

/* ---------- 详情渲染 ---------- */
async function zouRenderDetail() {
  const res = await zouFetch(`/api/zou/video/detail?id=${vid}`);
  if (res.code !== 0) { zouToast(res.message); return; }
  const v = res.data;
  document.title = `${v.title} - zou视频`;
  document.getElementById('zouPoster').src = v.cover;
  document.getElementById('zouTitle').textContent = v.title;
  document.getElementById('zouMeta').innerHTML = `
    <span class="zou-score">${v.score.toFixed(1)} 分</span>
    <span>${v.cname}</span><span>${v.year}</span><span>${v.area}</span>
    <span>${v.episodes}</span><span>${v.plays} 热度</span>
    ${v.tags.split(',').map(t => `<span class="zou-tag">${t}</span>`).join('')}`;
  document.getElementById('zouDirector').textContent = v.director;
  document.getElementById('zouActors').textContent = v.actors;
  document.getElementById('zouSummary').textContent = v.summary;
  // 相关推荐
  document.getElementById('zouRelated').innerHTML = v.related.map(r => `
    <a class="zou-card" href="detail.html?id=${r.id}">
      <div class="zou-card__cover">
        <img src="${r.cover}" alt="${r.title}" loading="lazy">
        <span class="zou-card__score">${r.score.toFixed(1)}</span>
      </div>
      <div class="zou-card__info"><div class="zou-card__title">${r.title}</div></div>
    </a>`).join('');
  // 收藏按钮状态（localStorage 本地存储效果）
  zouRenderFavBtn(v);
  // 播放按钮：点击弹出提示（演示项目，无真实片源）
  document.getElementById('zouPlayBtn').addEventListener('click', () => zouToast('演示项目：开始播放《' + v.title + '》'));
  document.getElementById('zouPlayBtn2').addEventListener('click', () => zouToast('演示项目：开始播放《' + v.title + '》'));
  // 观看历史写入 localStorage（本地存储效果）
  zouSaveHistory(v);
}

/* ---------- 收藏（localStorage） ---------- */
function zouRenderFavBtn(v) {
  const favs = JSON.parse(localStorage.getItem('zou_favs') || '[]');
  const btn = document.getElementById('zouFavBtn');
  const fav = favs.find(x => x.id === v.id);
  btn.innerHTML = fav
    ? '<span class="zou-icon zou-icon-heart"></span> 已收藏'
    : '<span class="zou-icon zou-icon-heart"></span> 收藏';
  btn.style.background = fav ? 'var(--zou-card2)' : '';
  btn.style.color = fav ? 'var(--zou-accent)' : '';
  btn.onclick = () => {
    const user = zouLoginUser();
    if (!user) { zouToast('请先登录'); return setTimeout(() => location.href = 'login.html', 600); }
    const arr = JSON.parse(localStorage.getItem('zou_favs') || '[]');
    const idx = arr.findIndex(x => x.id === v.id);
    if (idx >= 0) { arr.splice(idx, 1); zouToast('已取消收藏'); }
    else { arr.unshift({ id: v.id, title: v.title, cover: v.cover, score: v.score }); zouToast('收藏成功'); }
    localStorage.setItem('zou_favs', JSON.stringify(arr));
    zouRenderFavBtn(v);
  };
}

/* ---------- 观看历史 / 收藏（localStorage 本地存储效果） ---------- */
function zouSaveHistory(v) {
  const his = JSON.parse(localStorage.getItem('zou_history') || '[]')
    .filter(x => x.id !== v.id);
  his.unshift({ id: v.id, title: v.title, cover: v.cover, score: v.score, time: Date.now() });
  localStorage.setItem('zou_history', JSON.stringify(his.slice(0, 20)));
}

/* ---------- AI 剧情简介（调用 /api/zou/ai/summary，大模型能力） ---------- */
async function zouRenderAi() {
  const box = document.getElementById('zouAiText');
  const res = await zouFetch('/api/zou/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ vid })
  });
  if (res.code !== 0) { box.textContent = 'AI 暂时开小差了，稍后再试'; return; }
  box.classList.remove('zou-ai-box__text--loading');
  box.textContent = res.data.text;
  document.getElementById('zouAiSource').textContent =
    res.data.source === 'llm' ? '大模型生成' : '本地降级生成';
}

/* ---------- 评论 ---------- */
async function zouRenderComments() {
  const res = await zouFetch(`/api/zou/comment/list?vid=${vid}`);
  if (res.code !== 0) return;
  const list = res.data;
  document.getElementById('zouCmtCount').textContent = list.length;
  const box = document.getElementById('zouCommentList');
  box.innerHTML = list.length ? list.map(c => `
    <div class="zou-comment">
      <img class="zou-comment__avatar" src="${c.avatar}" alt="${c.nickname}">
      <div>
        <div class="zou-comment__name">${c.nickname}</div>
        <div class="zou-comment__content">${c.content}</div>
        <div class="zou-comment__time">${c.created_at}</div>
      </div>
    </div>`).join('') : '<div class="zou-empty" style="padding:1rem 0">还没有评论，快来抢沙发~</div>';
}

document.getElementById('zouCmtSend').addEventListener('click', async () => {
  const input = document.getElementById('zouCmtInput');
  const content = input.value.trim();
  if (!content) return zouToast('请输入评论内容');
  if (!zouLoginUser()) { zouToast('请先登录'); return setTimeout(() => location.href = 'login.html', 600); }
  const res = await zouFetch('/api/zou/comment/add', {
    method: 'POST',
    body: JSON.stringify({ vid, content })
  });
  if (res.code !== 0) return zouToast(res.message);
  input.value = '';
  zouToast('评论成功');
  zouRenderComments();
});

/* ---------- AI 客服对话框（调用 /api/zou/ai/chat） ---------- */
const chatMask = document.getElementById('zouChatMask');
const chatBody = document.getElementById('zouChatBody');
document.getElementById('zouAiFab').addEventListener('click', () => chatMask.classList.add('zou-show'));
document.getElementById('zouChatClose').addEventListener('click', () => chatMask.classList.remove('zou-show'));
chatMask.addEventListener('click', e => { if (e.target === chatMask) chatMask.classList.remove('zou-show'); });

async function zouSendChat() {
  const input = document.getElementById('zouChatInput');
  const msg = input.value.trim();
  if (!msg) return;
  chatBody.insertAdjacentHTML('beforeend', `<div class="zou-chat__msg zou-chat__msg--me">${msg}</div>`);
  input.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;
  const res = await zouFetch('/api/zou/ai/chat', { method: 'POST', body: JSON.stringify({ message: msg }) });
  const reply = res.code === 0 ? res.data.text : '客服开小差了，请稍后再试';
  chatBody.insertAdjacentHTML('beforeend', `<div class="zou-chat__msg zou-chat__msg--ai">${reply}</div>`);
  chatBody.scrollTop = chatBody.scrollHeight;
}
document.getElementById('zouChatSend').addEventListener('click', zouSendChat);
document.getElementById('zouChatInput').addEventListener('keydown', e => { if (e.key === 'Enter') zouSendChat(); });

zouRenderDetail();
zouRenderAi();
zouRenderComments();
