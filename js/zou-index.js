/**
 * 文件名：zou-index.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：首页脚本 —— 轮播图（JS效果1）、频道导航渲染、热门列表渲染、
 *       canvas 粒子背景（动画：canvas）、滚动监听吸顶
 */
'use strict';

/* ---------- 轮播图：接口数据 + 自动播放 + 指示点点击切换 ---------- */
const zouCarousel = {
  list: [],
  idx: 0,
  timer: null,
  async init() {
    const res = await zouFetch('/api/zou/video/list?page=1&size=5');
    if (res.code !== 0) return;
    this.list = res.data.list;
    const track = document.getElementById('zouCarouselTrack');
    const dots = document.getElementById('zouCarouselDots');
    track.innerHTML = this.list.map(v => `
      <a class="zou-carousel__item" href="detail.html?id=${v.id}">
        <img src="${v.cover}" alt="${v.title}">
        <div class="zou-carousel__caption">
          <div>
            <div class="zou-carousel__title">${v.title}</div>
            <div class="zou-carousel__meta">${v.cname} · ${v.episodes} · 播放量 ${zouFmtPlays(v.plays)}</div>
          </div>
          <span class="zou-score">${v.score.toFixed(1)}</span>
        </div>
      </a>`).join('');
    dots.innerHTML = this.list.map((_, i) =>
      `<span class="zou-carousel__dot${i === 0 ? ' zou-carousel__dot--active' : ''}" data-i="${i}"></span>`).join('');
    dots.querySelectorAll('.zou-carousel__dot').forEach(d =>
      d.addEventListener('click', () => { this.go(+d.dataset.i); this.restart(); }));
    this.restart();
  },
  go(i) {
    this.idx = (i + this.list.length) % this.list.length;
    document.getElementById('zouCarouselTrack').style.transform = `translateX(-${this.idx * 100}%)`;
    document.querySelectorAll('.zou-carousel__dot').forEach((d, j) =>
      d.classList.toggle('zou-carousel__dot--active', j === this.idx));
  },
  restart() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.go(this.idx + 1), 3500);
  }
};

/* ---------- 频道金刚区：分类接口渲染 ---------- */
async function zouRenderChannel() {
  const res = await zouFetch('/api/zou/category/list');
  if (res.code !== 0) return;
  const icons = ['tv', 'film', 'star', 'heart', 'history'];
  document.getElementById('zouChannel').innerHTML = res.data.map((c, i) => `
    <a class="zou-channel__item" href="list.html?cid=${c.id}">
      <span class="zou-channel__icon"><span class="zou-icon zou-icon-${icons[i % icons.length]}"></span></span>
      <span>${c.name}</span>
    </a>`).join('');
}

/* ---------- 热门推荐列表渲染 ---------- */
async function zouRenderHot() {
  const res = await zouFetch('/api/zou/video/list?page=1&size=10');
  const grid = document.getElementById('zouHotGrid');
  const loading = document.getElementById('zouHotLoading');
  if (res.code !== 0) { loading.textContent = '加载失败'; return; }
  loading.remove();
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
}

/* ---------- canvas 粒子背景（动画：canvas + requestAnimationFrame） ---------- */
function zouParticles() {
  const canvas = document.getElementById('zouParticleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, parts;
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  function create() {
    parts = Array.from({ length: 36 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.35, vy: -(Math.random() * 0.45 + 0.12),
      a: Math.random() * 0.5 + 0.15
    }));
  }
  function step() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -8 || p.x > W + 8) p.vx *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 165, 90, ${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  resize(); create(); step();
  window.addEventListener('resize', () => { resize(); create(); });
}

zouCarousel.init();
zouRenderChannel();
zouRenderHot();
zouParticles();
zouBindHeaderScroll();
zouBindBacktop();
