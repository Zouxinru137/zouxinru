/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-20 | 大模型：GLM-5.3-Flash
  说明：数据库连接测试页逻辑（请求 /api/zxr_db_test）
*/
(function zxrInitDbPage() {
  var zxrForm = document.getElementById('zxr_db_form');
  var zxrBtn = document.getElementById('zxr_db_submit');
  var zxrMsg = document.getElementById('zxr_db_message');

  function zxrShowMessage(text, zxrIsOk) {
    zxrMsg.textContent = text;
    zxrMsg.className = 'zxr_db_message ' + (zxrIsOk ? 'zxr_ok' : 'zxr_err');
  }

  zxrForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var zxrUsername = document.getElementById('zxr_db_username').value.trim();
    var zxrPassword = document.getElementById('zxr_db_password').value;

    if (!zxrUsername) {
      zxrShowMessage('请输入用户名', false);
      return;
    }

    zxrBtn.disabled = true;
    zxrBtn.textContent = '连接中...';

    fetch('/api/zxr_db_test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: zxrUsername, password: zxrPassword })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        console.log('服务器返回数据：', result);
        if (result.code === 0) {
          var d = result.data || {};
          zxrShowMessage('✓ ' + result.msg + '\nMySQL 版本：' + d.version + '\n主机：' + d.host + '\n数据库列表：' + d.databases.join('、'), true);
        } else {
          zxrShowMessage('✗ ' + result.msg, false);
        }
      })
      .catch(function (err) {
        console.error('请求失败：', err);
        zxrShowMessage('✗ 请求失败：' + err.message, false);
      })
      .finally(function () {
        zxrBtn.disabled = false;
        zxrBtn.textContent = '连接数据库';
      });
  });
})();
