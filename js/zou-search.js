/**
 * 文件名：zou-search.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：搜索页脚本 —— 搜索接口调用、搜索历史（localStorage 本地存储效果）、
 *       热门词（取自排行接口）、URL 传参 kw 回显、分页
 */
'use strict';

const zouSearch = {
  kw: '',
  page: 1,
  size: 10,

  /* 搜索历史读写（localStorage） */
  getHistory() { try { return JSON.parse(localStorage.getItem('zou_search_history') || '[]'); } catch (e) { return []; } },
  addHistory(kw) {
    const arr = this.getHistory().filter(x => x !== kw);
    arr.unshift(kw);
    localStorage.setItem('zou_search_history', JSON.stringify(arr.slice(0, 10)));
    this.renderHistory();
  },

  renderHistory() {
    const arr = this.getHistory();
    const sec = document.getElementById('zouHistorySec');
    const box = document.getElementById('zouHistoryChips');
    sec.style.display = arr.length ? 'block' : 'none';
    box.innerHTML = arr.map(k => `<span class="zou-chip" data-kw="${k}">${k}</span>`).join('');
    box.querySelectorAll('.zou-chip').forEach(c => c.addEventListener('click', () => this.doSearch(c.dataset.kw)));
  },

  /* 热门搜索词：从排行榜取前 8 个标题与标签 */
  async renderHot() {
    const res = await zouFetch('/api/zou/video/rank');
    if (res.code !== 0) return;
    const words = [...new Set(res.data.flatMap(v => [v.title, ...v.tags.split(',')]))].slice(0, 10);
    document.getElementById('zouHotChips').innerHTML =
      words.map(k => `<span class="zou-chip" data-kw="${k}">${k}</span>`).join('');
    document.getElementById('zouHotChips').querySelectorAll('.zou-chip').forEach(c =>
      c.addEventListener('click', () => this.doSearch(c.dataset.kw)));
  },

  /* 执行搜索 */
  async doSearch(kw) {
    this.kw = kw;
    const input = document.getElementById('zouSearchInput');
    input.value = kw;
    if (kw) this.addHistory(kw);
    const res = await zouFetch(`/api/zou/video/search?kw=${encodeURIComponent(kw)}&page=${this.page}`);
    if (res.code !== 0) { zouToast(res.message); return; }
    document.getElementById('zouResultSec').style.display = 'block';
    document.getElementById('zouResultCount').textContent = `共 ${res.data.total} 条`;
    document.getElementById('zouResultEmpty').style.display = res.data.list.length ? 'none' : 'block';
    document.getElementById('zouResultGrid').innerHTML = res.data.list.map(v => `
      <a class="zou-card" href="detail.html?id=${v.id}">
        <div class="zou-card__cover">
          <img src="${v.cover}" alt="${v.title}" loading="lazy">
          <span class="zou-card__score">${v.score.toFixed(1)}</span>
          <span class="zou-card__plays"><span class="zou-icon zou-icon-play"></span>${zouFmtPlays(v.plays)}</span>
        </div>
        <div class="zou-card__info">
          <div class="zou-card__title">${v.title}</div>
          <div class="zou-card__desc">${v.cname} · ${v.episodes}</div>
        </div>
      </a>`).join('');
    // URL 传参回显，便于刷新后保留搜索词
    const url = new URL(location.href);
    kw ? url.searchParams.set('kw', kw) : url.searchParams.delete('kw');
    history.replaceState(null, '', url);
    window.scrollTo({ top: 0 });
  }
};

document.getElementById('zouSearchBtn').addEventListener('click', () => {
  const kw = document.getElementById('zouSearchInput').value.trim();
  if (!kw) return zouToast('请输入搜索关键词');
  zouSearch.page = 1;
  zouSearch.doSearch(kw);
});
document.getElementById('zouSearchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('zouSearchBtn').click();
});
document.getElementById('zouHistoryClear').addEventListener('click', () => {
  localStorage.removeItem('zou_search_history');
  zouSearch.renderHistory();
  zouToast('搜索历史已清空');
});

/* 初始化：支持 search.html?kw=xxx 直达 */
zouSearch.renderHistory();
zouSearch.renderHot();
const initKw = new URLSearchParams(location.search).get('kw');
if (initKw) zouSearch.doSearch(initKw);
