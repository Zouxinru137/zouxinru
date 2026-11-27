/**
 * 文件名：zou-rank.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：排行榜页脚本 —— 调用 /api/zou/video/rank 接口渲染 TOP10 榜单
 */
'use strict';

(async function zouRenderRank() {
  const res = await zouFetch('/api/zou/video/rank');
  const box = document.getElementById('zouRankList');
  const loading = document.getElementById('zouRankLoading');
  if (res.code !== 0) { loading.textContent = '加载失败'; return; }
  loading.remove();
  box.innerHTML = res.data.map((v, i) => `
    <a class="zou-rank-item" href="detail.html?id=${v.id}">
      <span class="zou-rank-item__no">${i + 1}</span>
      <img class="zou-rank-item__cover" src="${v.cover}" alt="${v.title}" loading="lazy">
      <div class="zou-rank-item__info">
        <div class="zou-rank-item__title">${v.title}</div>
        <div class="zou-rank-item__meta">
          <span class="zou-score">${v.score.toFixed(1)} 分</span>
          <span>${v.cname}</span>
          ${v.tags.split(',')[0] ? `<span class="zou-tag">${v.tags.split(',')[0]}</span>` : ''}
        </div>
      </div>
      <div class="zou-rank-item__plays"><span class="zou-icon zou-icon-fire"></span>${zouFmtPlays(v.plays)}</div>
    </a>`).join('');
})();
