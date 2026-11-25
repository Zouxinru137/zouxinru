/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：RAG 知识库交互逻辑（上传 / 管理 / 问答）
  服务器返回的数据和错误信息输出到浏览器控制台（console.log / console.error）
*/
(function () {
  var zxrDropZone = document.getElementById('zxr_drop_zone');
  var zxrFileInput = document.getElementById('zxr_file_input');
  var zxrUploadStatus = document.getElementById('zxr_upload_status');
  var zxrFileList = document.getElementById('zxr_file_list');
  var zxrChatBox = document.getElementById('zxr_chat_box');
  var zxrInput = document.getElementById('zxr_input');
  var zxrAskBtn = document.getElementById('zxr_ask_btn');
  var zxrAskStatus = document.getElementById('zxr_ask_status');

  function zxrLog(tag, data) { console.log('[知识库] ' + tag, data); }
  function zxrLogErr(tag, err) { console.error('[知识库] ' + tag, err); }

  function zxrShow(el, text, ok) {
    el.textContent = text || '';
    el.className = 'zxr_status ' + (ok ? 'zxr_status_ok' : 'zxr_status_err');
  }

  // ---------- 文件列表 ----------
  function zxrLoadList() {
    fetch('/api/zxr_kb_files')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('文件列表', json);
        zxrFileList.innerHTML = '';
        if (json.code !== 0) { zxrFileList.innerHTML = '<div class="zxr_empty">' + json.msg + '</div>'; return; }
        if (!json.data.length) {
          zxrFileList.innerHTML = '<div class="zxr_empty">知识库为空，请先上传文件</div>';
          return;
        }
        json.data.forEach(function (f) {
          var item = document.createElement('div');
          item.className = 'zxr_file_item';
          var kb = f.size > 1048576 ? (f.size / 1048576).toFixed(2) + ' MB' : Math.ceil(f.size / 1024) + ' KB';
          item.innerHTML =
            '<div class="zxr_file_head">' +
              '<span class="zxr_file_name">' + f.name.replace(/</g, '&lt;') + '</span>' +
              '<span class="zxr_file_tag">.' + f.ext + '</span>' +
              '<span class="zxr_file_tag">' + f.chunkCount + ' 个分块</span>' +
              '<button class="zxr_del_btn" type="button">删除</button>' +
            '</div>' +
            '<div class="zxr_file_meta">大小 ' + kb + ' ｜ 上传时间 ' + new Date(f.uploadTime).toLocaleString('zh-CN') + '</div>' +
            '<div class="zxr_file_preview">' + (f.preview || '').replace(/</g, '&lt;') + '</div>';
          item.querySelector('.zxr_del_btn').addEventListener('click', function () { zxrDelete(f.id, f.name); });
          zxrFileList.appendChild(item);
        });
      })
      .catch(function (err) { zxrLogErr('列表请求失败', err); });
  }

  function zxrDelete(id, name) {
    if (!window.confirm('确定删除「' + name + '」吗？其全部分块将从知识库移除。')) return;
    fetch('/api/zxr_kb_files/' + id, { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('删除结果', json);
        zxrShow(zxrUploadStatus, json.msg, json.code === 0);
        zxrLoadList();
      })
      .catch(function (err) { zxrLogErr('删除请求失败', err); });
  }

  // ---------- 上传 ----------
  function zxrUpload(file) {
    if (window.location.protocol === 'file:') {
      zxrShow(zxrUploadStatus, '请通过服务器访问：http://localhost:8217/kb.html', false);
      return;
    }
    var fd = new FormData();
    fd.append('zxr_kb_file', file);
    zxrShow(zxrUploadStatus, '正在上传并解析「' + file.name + '」...', true);
    fetch('/api/zxr_kb_upload', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('上传解析结果', json);
        if (json.code === 0) {
          zxrShow(zxrUploadStatus, '解析成功：' + json.data.chars + ' 字符，切分为 ' + json.data.chunks + ' 个知识块', true);
        } else {
          zxrShow(zxrUploadStatus, json.msg, false);
        }
        zxrLoadList();
      })
      .catch(function (err) {
        zxrLogErr('上传请求失败', err);
        zxrShow(zxrUploadStatus, '上传失败，请确认后端服务已启动', false);
      });
  }

  zxrDropZone.addEventListener('click', function () { zxrFileInput.click(); });
  zxrFileInput.addEventListener('change', function () {
    if (zxrFileInput.files.length) zxrUpload(zxrFileInput.files[0]);
    zxrFileInput.value = '';
  });
  zxrDropZone.addEventListener('dragover', function (e) { e.preventDefault(); zxrDropZone.classList.add('zxr_drag_over'); });
  zxrDropZone.addEventListener('dragleave', function () { zxrDropZone.classList.remove('zxr_drag_over'); });
  zxrDropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    zxrDropZone.classList.remove('zxr_drag_over');
    if (e.dataTransfer.files.length) zxrUpload(e.dataTransfer.files[0]);
  });

  // ---------- 问答 ----------
  function zxrAddMsg(cls, text) {
    var div = document.createElement('div');
    div.className = 'zxr_msg ' + cls;
    div.textContent = text;
    zxrChatBox.appendChild(div);
    zxrChatBox.scrollTop = zxrChatBox.scrollHeight;
    return div;
  }

  function zxrAsk() {
    var q = zxrInput.value.trim();
    if (!q) return;
    if (window.location.protocol === 'file:') {
      zxrShow(zxrAskStatus, '请通过服务器访问：http://localhost:8217/kb.html', false);
      return;
    }
    zxrAddMsg('zxr_msg_user', q);
    zxrInput.value = '';
    zxrAskBtn.disabled = true;
    zxrShow(zxrAskStatus, '正在检索知识库并生成回答...', true);

    fetch('/api/zxr_kb_ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('RAG 问答结果', json);
        if (json.code !== 0) {
          zxrAddMsg('zxr_msg_ai', '⚠ ' + json.msg);
          zxrShow(zxrAskStatus, json.msg, false);
          return;
        }
        zxrAddMsg('zxr_msg_ai', json.data.answer);
        zxrShow(zxrAskStatus, '回答完成（检索命中 ' + json.data.retrieved + ' 个知识块）', true);
        if (json.data.sources && json.data.sources.length) {
          zxrAddMsg('zxr_msg_src', '来源：' + json.data.sources.join('、'));
        }
      })
      .catch(function (err) {
        zxrLogErr('问答请求失败', err);
        zxrAddMsg('zxr_msg_ai', '⚠ 网络异常，请确认后端服务已启动后重试');
        zxrShow(zxrAskStatus, '网络异常，请重试', false);
      })
      .finally(function () {
        zxrAskBtn.disabled = false;
        zxrInput.focus();
      });
  }

  zxrAskBtn.addEventListener('click', zxrAsk);
  zxrInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') zxrAsk(); });

  zxrLoadList();
})();
