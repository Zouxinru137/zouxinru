/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：图像识别交互逻辑（上传预览 -> 调用视觉模型 -> 展示描述）
  服务器返回的数据和错误信息输出到浏览器控制台（console.log / console.error）
*/
(function () {
  var zxrDropZone = document.getElementById('zxr_drop_zone');
  var zxrFileInput = document.getElementById('zxr_file_input');
  var zxrPreviewWrap = document.getElementById('zxr_preview_wrap');
  var zxrPreviewImg = document.getElementById('zxr_preview_img');
  var zxrStatus = document.getElementById('zxr_status');
  var zxrRecognizeBtn = document.getElementById('zxr_recognize_btn');
  var zxrResetBtn = document.getElementById('zxr_reset_btn');
  var zxrResultCard = document.getElementById('zxr_result_card');
  var zxrResultText = document.getElementById('zxr_result_text');
  var zxrResultMeta = document.getElementById('zxr_result_meta');

  var zxrFile = null;

  function zxrLog(tag, data) { console.log('[图像识别] ' + tag, data); }
  function zxrLogErr(tag, err) { console.error('[图像识别] ' + tag, err); }
  function zxrShow(text, ok) {
    zxrStatus.textContent = text || '';
    zxrStatus.className = 'zxr_status ' + (ok ? 'zxr_status_ok' : 'zxr_status_err');
  }

  function zxrAccept(file) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      zxrShow('仅支持 jpg / png / webp / gif 图片', false);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      zxrShow('图片超过 8MB，请压缩后上传', false);
      return;
    }
    zxrFile = file;
    zxrPreviewImg.src = URL.createObjectURL(file);
    zxrPreviewWrap.hidden = false;
    zxrResultCard.hidden = true;
    zxrShow('已选择「' + file.name + '」，点击「开始识别」', true);
    zxrLog('选择文件', { name: file.name, size: file.size, type: file.type });
  }

  zxrDropZone.addEventListener('click', function () { zxrFileInput.click(); });
  zxrFileInput.addEventListener('change', function () {
    if (zxrFileInput.files.length) zxrAccept(zxrFileInput.files[0]);
    zxrFileInput.value = '';
  });
  zxrDropZone.addEventListener('dragover', function (e) {
    e.preventDefault(); zxrDropZone.classList.add('zxr_drag_over');
  });
  zxrDropZone.addEventListener('dragleave', function () { zxrDropZone.classList.remove('zxr_drag_over'); });
  zxrDropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    zxrDropZone.classList.remove('zxr_drag_over');
    if (e.dataTransfer.files.length) zxrAccept(e.dataTransfer.files[0]);
  });

  zxrRecognizeBtn.addEventListener('click', function () {
    if (!zxrFile) { zxrShow('请先选择图片', false); return; }
    if (window.location.protocol === 'file:') {
      zxrShow('请通过服务器访问：http://localhost:8217/vision.html', false);
      return;
    }
    var fd = new FormData();
    fd.append('zxr_image_file', zxrFile);
    zxrRecognizeBtn.disabled = true;
    zxrShow('正在识别...', true);
    zxrResultCard.hidden = true;

    fetch('/api/zxr_vision_describe', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('识别结果', json);
        if (json.code !== 0) {
          zxrShow(json.msg, false);
          return;
        }
        zxrShow('识别完成', true);
        zxrResultText.textContent = json.data.description;
        zxrResultMeta.textContent = '模型：' + json.data.model + ' ｜ 图片：' + zxrFile.name + '（' + Math.ceil(zxrFile.size / 1024) + ' KB）';
        zxrResultCard.hidden = false;
      })
      .catch(function (err) {
        zxrLogErr('请求失败', err);
        zxrShow('网络异常，请确认后端服务已启动后重试', false);
      })
      .finally(function () { zxrRecognizeBtn.disabled = false; });
  });

  zxrResetBtn.addEventListener('click', function () {
    zxrFile = null;
    zxrPreviewWrap.hidden = true;
    zxrResultCard.hidden = true;
    zxrShow('', true);
  });
})();
