/**
 * 文件名：zou-common.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：公共脚本 —— 统一请求封装、toast、登录态、播放量格式化、公共交互
 */
'use strict';

/* zouFetch：统一请求封装（自动携带 token；401 时清除登录态并跳转登录页） */
async function zouFetch(url, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = localStorage.getItem('zou_token');
  if (token) headers.Authorization = 'Bearer ' + token;
  const resp = await fetch(url, Object.assign({}, options, { headers }));
  const json = await resp.json();
  if (json.code === 401) {
    localStorage.removeItem('zou_token');
    localStorage.removeItem('zou_user');
    if (!location.pathname.includes('login.html')) {
      zouToast('请先登录');
      setTimeout(() => (location.href = 'login.html'), 600);
    }
  }
  return json;
}

/* zouToast：轻提示 */
let zouToastTimer = null;
function zouToast(msg) {
  let el = document.querySelector('.zou-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'zou-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  clearTimeout(zouToastTimer);
  zouToastTimer = setTimeout(() => el.remove(), 1800);
}

/* zouFmtPlays：播放量格式化（9823000 -> 982.3万） */
function zouFmtPlays(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}

/* zouLoginUser：读取本地缓存的用户信息 */
function zouLoginUser() {
  try { return JSON.parse(localStorage.getItem('zou_user') || 'null'); } catch (e) { return null; }
}

/* zouBindBacktop：返回顶部（滚动监听效果） */
function zouBindBacktop() {
  const btn = document.createElement('div');
  btn.className = 'zou-backtop';
  btn.innerHTML = '<span class="zou-icon zou-icon-arrow" style="transform:rotate(-90deg)"></span>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('zou-show', window.scrollY > 400);
  });
}

/* zouBindHeaderScroll：页头滚动吸顶变色（滚动监听效果） */
function zouBindHeaderScroll() {
  const header = document.querySelector('.zou-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('zou-header--solid', window.scrollY > 24);
  });
}
