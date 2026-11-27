/**
 * 文件名：zou-login.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：登录页脚本 —— canvas 图形验证码（高阶功能）、正则表单校验、
 *       登录接口调用与 token 保持（localStorage）
 */
'use strict';

/* ---------- canvas 图形验证码（动画：canvas 绘制） ---------- */
const zouCaptcha = {
  text: '',
  chars: 'ABCDEFGHJKLMNPQRSTUVWXY345678',
  canvas: document.getElementById('zouCaptchaCanvas'),
  refresh() {
    this.text = Array.from({ length: 4 }, () => this.chars[Math.floor(Math.random() * this.chars.length)]).join('');
    const ctx = this.canvas.getContext('2d');
    const { width: w, height: h } = this.canvas;
    // 背景噪点
    ctx.fillStyle = '#1a2438';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // 干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(255,127,41,${0.25 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
    // 字符（旋转 + 变色）
    this.text.split('').forEach((ch, i) => {
      ctx.save();
      ctx.translate(16 + i * 24, h / 2);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.font = `bold 22px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ['#ff7f29', '#4f7cf0', '#4fd8b0', '#e9edf5'][i % 4];
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  },
  check(input) { return input.toUpperCase() === this.text.toUpperCase(); }
};
zouCaptcha.refresh();
zouCaptcha.canvas.addEventListener('click', () => zouCaptcha.refresh());

/* ---------- 密码可见切换 ---------- */
document.getElementById('zouLoginEye').addEventListener('click', () => {
  const pwd = document.getElementById('zouLoginPwd');
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
});

/* ---------- 表单校验 + 登录提交 ---------- */
function zouSetErr(id, msg) { document.getElementById(id).textContent = msg || ''; }

document.getElementById('zouLoginBtn').addEventListener('click', async () => {
  const name = document.getElementById('zouLoginName').value.trim();
  const pwd = document.getElementById('zouLoginPwd').value;
  const cap = document.getElementById('zouLoginCaptcha').value.trim();
  let ok = true;
  // 用户名校验：4~16 位字母开头
  if (!/^[a-zA-Z][a-zA-Z0-9_]{3,15}$/.test(name)) {
    zouSetErr('zouLoginNameErr', '用户名须为 4~16 位、字母开头'); ok = false;
  } else zouSetErr('zouLoginNameErr');
  // 密码校验：至少 6 位
  if (pwd.length < 6) {
    zouSetErr('zouLoginPwdErr', '密码至少 6 位'); ok = false;
  } else zouSetErr('zouLoginPwdErr');
  // 验证码校验
  if (!cap) {
    zouSetErr('zouLoginCaptchaErr', '请输入验证码'); ok = false;
  } else if (!zouCaptcha.check(cap)) {
    zouSetErr('zouLoginCaptchaErr', '验证码不正确'); zouCaptcha.refresh(); ok = false;
  } else zouSetErr('zouLoginCaptchaErr');
  if (!ok) return;

  const btn = document.getElementById('zouLoginBtn');
  btn.classList.add('zou-btn--disabled');
  const res = await zouFetch('/api/zou/user/login', {
    method: 'POST',
    body: JSON.stringify({ username: name, password: pwd })
  });
  btn.classList.remove('zou-btn--disabled');
  if (res.code !== 0) { zouCaptcha.refresh(); return zouToast(res.message); }
  // 登录态保持：token + 用户信息写入 localStorage
  localStorage.setItem('zou_token', res.data.token);
  localStorage.setItem('zou_user', JSON.stringify({
    id: res.data.id, username: res.data.username,
    nickname: res.data.nickname, avatar: res.data.avatar, role: res.data.role
  }));
  zouToast('登录成功，欢迎回来~');
  setTimeout(() => { location.href = res.data.role === 'admin' ? 'admin.html' : 'profile.html'; }, 700);
});
