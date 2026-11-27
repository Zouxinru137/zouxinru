/**
 * 文件名：zou-register.js
 * 作者：邹欣茹  学号：24002120217
 * 时间：2026-11-27
 * 说明：注册页脚本 —— 正则表单校验（用户名/密码/确认密码）、注册接口调用，
 *       密码在后端以 sha256 加盐加密存储（高阶功能）
 */
'use strict';

function zouSetErr(id, msg) { document.getElementById(id).textContent = msg || ''; }

document.getElementById('zouRegBtn').addEventListener('click', async () => {
  const name = document.getElementById('zouRegName').value.trim();
  const nick = document.getElementById('zouRegNick').value.trim();
  const pwd = document.getElementById('zouRegPwd').value;
  const pwd2 = document.getElementById('zouRegPwd2').value;
  let ok = true;

  // 用户名：字母开头 4~16 位字母数字下划线
  if (!/^[a-zA-Z][a-zA-Z0-9_]{3,15}$/.test(name)) {
    zouSetErr('zouRegNameErr', '用户名须为字母开头、4~16 位字母/数字/下划线'); ok = false;
  } else zouSetErr('zouRegNameErr');
  // 密码：至少 6 位，须包含数字与字母
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(pwd)) {
    zouSetErr('zouRegPwdErr', '密码须 6 位以上且同时包含字母和数字'); ok = false;
  } else zouSetErr('zouRegPwdErr');
  // 确认密码一致
  if (pwd2 !== pwd || !pwd2) {
    zouSetErr('zouRegPwd2Err', '两次输入的密码不一致'); ok = false;
  } else zouSetErr('zouRegPwd2Err');
  if (!ok) return;

  const btn = document.getElementById('zouRegBtn');
  btn.classList.add('zou-btn--disabled');
  const res = await zouFetch('/api/zou/user/register', {
    method: 'POST',
    body: JSON.stringify({ username: name, password: pwd, nickname: nick })
  });
  btn.classList.remove('zou-btn--disabled');
  if (res.code !== 0) return zouToast(res.message);
  zouToast('注册成功，请登录');
  setTimeout(() => (location.href = 'login.html'), 700);
});
