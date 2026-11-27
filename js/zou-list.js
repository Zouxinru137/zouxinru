/**
 * 文件名：zou-list.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：列表页脚本 —— 分类 tab（选项卡效果）、列表分页渲染、
 *       支持 URL 传参 cid（list.html?cid=2 直达分类）
 */
'use strict';

const zouList = {
  cid: 0,          // 当前分类（0 = 全部）
  page: 1,
  size: 10,
  total: 0,

  /* 分类 tab 渲染 + 点击切换 */
  async initTabs() {
    const res = await zouFetch('/api/zou/category/list');
    if (res.code !== 0) return;
    const tabs = [{ id: 0, name: '全部' }, ...res.data];
    // URL 传参进入指定分类
    const qs = new URLSearchParams(location.search);
    const cid = parseInt(qs.get('cid')) || 0;
    this.cid = cid;
    const box = document.getElementById('zouCatTabs');
    box.innerHTML = tabs.map(c => `
      <button class="zou-tabs__item${c.id === this.cid ? ' zou-tabs__item--active' : ''}" data-cid="${c.id}">${c.name}</button>`).join('');
    box.querySelectorAll('.zou-tabs__item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cid = +btn.dataset.cid;
        this.page = 1;
        box.querySelectorAll('.zou-tabs__item').forEach(b => b.classList.toggle('zou-tabs__item--active', b === btn));
        this.load();
        // 同步修改地址栏参数，便于分享
        const url = new URL(location.href);
        url.searchParams.set('cid', this.cid);
        history.replaceState(null, '', url);
        window.scrollTo({ top: 0 });
      });
    });
  },

  /* 列表加载与渲染 */
  async load() {
    const grid = document.getElementById('zouListGrid');
    const loading = document.getElementById('zouListLoading');
    const empty = document.getElementById('zouListEmpty');
    const res = await zouFetch(`/api/zou/video/list?page=${this.page}&size=${this.size}&cid=${this.cid}`);
    if (res.code !== 0) { zouToast(res.message); return; }
    this.total = res.data.total;
    loading.style.display = 'none';
    empty.style.display = res.data.list.length ? 'none' : 'block';
    grid.innerHTML = res.data.list.map(v => `
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
    this.renderPager();
    window.scrollTo({ top: 0 });
  },

  /* 分页控件 */
  renderPager() {
    const pages = Math.max(1, Math.ceil(this.total / this.size));
    const box = document.getElementById('zouPager');
    box.innerHTML = `
      <button class="zou-pagination__btn${this.page <= 1 ? ' zou-pagination__btn--disabled' : ''}" id="zouPrevBtn">上一页</button>
      <span class="zou-pagination__num">第 <b>${this.page}</b> / ${pages} 页 · 共 ${this.total} 部</span>
      <button class="zou-pagination__btn${this.page >= pages ? ' zou-pagination__btn--disabled' : ''}" id="zouNextBtn">下一页</button>`;
    document.getElementById('zouPrevBtn').addEventListener('click', () => { if (this.page > 1) { this.page--; this.load(); } });
    document.getElementById('zouNextBtn').addEventListener('click', () => { if (this.page < pages) { this.page++; this.load(); } });
  }
};

zouList.initTabs().then(() => zouList.load());
zouBindBacktop();
