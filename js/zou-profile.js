/**
 * 文件名：zou-profile.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：个人中心脚本 —— 页面加载时校验登录态（未登录跳转登录页，鉴权拦截），
 *       token 有效性通过 /api/zou/user/info 接口确认；
 *       收藏与观看历史基于 localStorage；支持退出登录与清空历史
 */
'use strict';

(async function zouInitProfile() {
  const user = zouLoginUser();
  // 鉴权拦截：未登录直接跳转登录页
  if (!user) { location.replace('login.html'); return; }
  // 服务端 token 校验：失败则 zouFetch 统一跳转登录
  const info = await zouFetch('/api/zou/user/info');
  if (info.code !== 0) return;

  document.getElementById('zouNickname').textContent = info.data.nickname || user.nickname;
  document.getElementById('zouUid').textContent = `账号：${info.data.username} · ${info.data.role === 'admin' ? '管理员' : '普通用户'}`;
  document.getElementById('zouAvatar').src = info.data.avatar || user.avatar;
  if (info.data.role === 'admin') document.getElementById('zouAdminEntry').style.display = 'flex';

  /* 收藏（localStorage） */
  const favs = JSON.parse(localStorage.getItem('zou_favs') || '[]');
  document.getElementById('zouFavCount').textContent = favs.length;
  if (favs.length) {
    document.getElementById('zouFavSec').style.display = 'block';
    document.getElementById('zouFavGrid').innerHTML = favs.map(v => `
      <a class="zou-card" href="detail.html?id=${v.id}">
        <div class="zou-card__cover">
          <img src="${v.cover}" alt="${v.title}">
          <span class="zou-card__score">${v.score.toFixed(1)}</span>
        </div>
        <div class="zou-card__info"><div class="zou-card__title">${v.title}</div></div>
      </a>`).join('');
  }

  /* 观看历史（localStorage） */
  const his = JSON.parse(localStorage.getItem('zou_history') || '[]');
  document.getElementById('zouHisCount').textContent = his.length;
  document.getElementById('zouSearchCount').textContent =
    (JSON.parse(localStorage.getItem('zou_search_history') || '[]')).length;
  if (his.length) {
    document.getElementById('zouHisSec').style.display = 'block';
    document.getElementById('zouHisList').innerHTML = his.slice(0, 8).map(v => `
      <a class="zou-rank-item" href="detail.html?id=${v.id}">
        <img class="zou-rank-item__cover" src="${v.cover}" alt="${v.title}">
        <div class="zou-rank-item__info">
          <div class="zou-rank-item__title">${v.title}</div>
          <div class="zou-rank-item__meta">观看于 ${new Date(v.time).toLocaleString('zh-CN')}</div>
        </div>
        <span class="zou-cell__arrow zou-icon zou-icon-arrow"></span>
      </a>`).join('');
  }

  /* 清空观看历史 */
  document.getElementById('zouClearHis').addEventListener('click', () => {
    localStorage.removeItem('zou_history');
    zouToast('观看历史已清空');
    setTimeout(() => location.reload(), 600);
  });

  /* 退出登录：调接口删 token 并清本地存储 */
  document.getElementById('zouLogout').addEventListener('click', async () => {
    await zouFetch('/api/zou/user/logout', { method: 'POST' });
    localStorage.removeItem('zou_token');
    localStorage.removeItem('zou_user');
    zouToast('已退出登录');
    setTimeout(() => (location.href = 'login.html'), 600);
  });
})();
