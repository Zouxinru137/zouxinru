/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：中华美食街在线客服交互逻辑
  - 服务商列表由后端 /api/zxr_ai_providers 提供（Key 只存在后端 .env，前端永远拿不到）
  - 多轮对话：维护 zxr_history，随每次提问一起发送
  - 服务器返回的数据和错误信息输出到浏览器控制台
*/
(function () {
  var zxrChatBox = document.getElementById('zxr_chat_box');
  var zxrInput = document.getElementById('zxr_input');
  var zxrSendBtn = document.getElementById('zxr_send_btn');
  var zxrClearBtn = document.getElementById('zxr_clear_btn');
  var zxrProviderSelect = document.getElementById('zxr_provider_select');
  var zxrStatus = document.getElementById('zxr_status');

  var zxrHistory = []; // 多轮对话历史 [{role, content}]

  function zxrLogData(tag, data) {
    console.log('[AI客服] ' + tag, data);
  }
  function zxrLogErr(tag, err) {
    console.error('[AI客服] ' + tag, err);
  }

  function zxrShowStatus(text, ok) {
    zxrStatus.textContent = text || '';
    zxrStatus.className = 'zxr_chat_status ' + (ok ? 'zxr_status_ok' : 'zxr_status_err');
  }

  function zxrAddMsg(role, text) {
    var div = document.createElement('div');
    div.className = 'zxr_msg ' + (role === 'user' ? 'zxr_msg_user' : role === 'tip' ? 'zxr_msg_tip' : 'zxr_msg_ai');
    div.textContent = text;
    zxrChatBox.appendChild(div);
    zxrChatBox.scrollTop = zxrChatBox.scrollHeight;
  }

  // 加载服务商列表（后端只返回名称，不返回 Key）
  function zxrLoadProviders() {
    fetch('/api/zxr_ai_providers')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        zxrLogData('服务商列表', json);
        if (json.code !== 0) {
          zxrShowStatus(json.msg || '服务商列表获取失败', false);
          return;
        }
        var names = json.data.names || {};
        json.data.providers.forEach(function (p) {
          var opt = document.createElement('option');
          opt.value = p;
          opt.textContent = names[p] || p;
          if (p === json.data.default) opt.selected = true;
          zxrProviderSelect.appendChild(opt);
        });
        zxrShowStatus('客服小福已上线，请问有什么可以帮您？', true);
      })
      .catch(function (err) {
        zxrLogErr('服务商列表请求失败', err);
        zxrShowStatus('无法连接服务器，请确认后端已启动', false);
      });
  }

  function zxrSend() {
    var text = zxrInput.value.trim();
    if (!text) return;
    if (window.location.protocol === 'file:') {
      zxrShowStatus('请通过服务器访问：http://localhost:8217/ai-chat.html', false);
      return;
    }

    zxrAddMsg('user', text);
    zxrHistory.push({ role: 'user', content: text });
    zxrInput.value = '';
    zxrSendBtn.disabled = true;
    zxrShowStatus('小福思考中...', true);

    fetch('/api/zxr_ai_chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: zxrProviderSelect.value, // 前端只传服务商名称，热切换
        message: text,
        history: zxrHistory.slice(0, -1) // 历史（不含本轮，本轮由 message 传递）
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        zxrLogData('对话响应', json);
        if (json.code !== 0) {
          // 友好提示而非白屏
          zxrAddMsg('tip', '⚠ ' + (json.msg || '服务异常，请稍后再试'));
          zxrShowStatus(json.msg || '服务异常，请稍后再试', false);
          zxrHistory.pop(); // 失败的问题不进入历史
          return;
        }
        zxrAddMsg('ai', json.data.reply);
        // 多轮对话：把本轮问答写入历史，下次一起发给后端
        zxrHistory.push({ role: 'assistant', content: json.data.reply });
        zxrShowStatus('回复成功（' + (json.data.provider || '') + '）', true);
      })
      .catch(function (err) {
        zxrLogErr('对话请求失败', err);
        zxrAddMsg('tip', '⚠ 网络异常，请确认后端服务已启动后重试');
        zxrShowStatus('网络异常，请重试', false);
        zxrHistory.pop();
      })
      .finally(function () {
        zxrSendBtn.disabled = false;
        zxrInput.focus();
      });
  }

  zxrSendBtn.addEventListener('click', zxrSend);
  zxrInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') zxrSend();
  });

  zxrClearBtn.addEventListener('click', function () {
    zxrHistory = [];
    zxrChatBox.innerHTML = '';
    zxrShowStatus('对话已清空，多轮上下文已重置', true);
    zxrLogData('清空对话', '历史消息已重置');
  });

  zxrProviderSelect.addEventListener('change', function () {
    zxrAddMsg('tip', '已切换到「' + zxrProviderSelect.options[zxrProviderSelect.selectedIndex].text + '」，后续回复由该平台生成');
    zxrLogData('切换服务商', zxrProviderSelect.value);
  });

  zxrLoadProviders();
})();
