/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：语音识别交互逻辑（MediaRecorder 录音 / 文件上传 -> /api/zxr_asr_transcribe）
  服务器返回的数据和错误信息输出到浏览器控制台（console.log / console.error）
*/
(function () {
  var zxrRecordBtn = document.getElementById('zxr_record_btn');
  var zxrPlayback = document.getElementById('zxr_playback');
  var zxrRecordStatus = document.getElementById('zxr_record_status');
  var zxrRecognizeRecBtn = document.getElementById('zxr_recognize_rec_btn');

  var zxrDropZone = document.getElementById('zxr_drop_zone');
  var zxrFileInput = document.getElementById('zxr_file_input');
  var zxrUploadStatus = document.getElementById('zxr_upload_status');
  var zxrRecognizeFileBtn = document.getElementById('zxr_recognize_file_btn');

  var zxrResultCard = document.getElementById('zxr_result_card');
  var zxrResultText = document.getElementById('zxr_result_text');
  var zxrResultMeta = document.getElementById('zxr_result_meta');

  var zxrRecorder = null;
  var zxrRecChunks = [];
  var zxrRecBlob = null;
  var zxrFileBlob = null;

  function zxrLog(tag, data) { console.log('[语音识别] ' + tag, data); }
  function zxrLogErr(tag, err) { console.error('[语音识别] ' + tag, err); }
  function zxrShow(el, text, ok) {
    el.textContent = text || '';
    el.className = 'zxr_status ' + (ok ? 'zxr_status_ok' : 'zxr_status_err');
  }

  function zxrRenderResult(json, zxrName) {
    zxrResultCard.hidden = false;
    zxrResultText.textContent = json.data.text || '（未识别到语音内容）';
    zxrResultMeta.textContent = '模型：' + json.data.model + ' ｜ 音频：' + zxrName + '（' + Math.ceil(json.data.audioBytes / 1024) + ' KB）';
  }

  function zxrTranscribe(zxrBlob, zxrName, zxrStatusEl) {
    if (window.location.protocol === 'file:') {
      zxrShow(zxrStatusEl, '请通过服务器访问：http://localhost:8217/speech.html', false);
      return;
    }
    var fd = new FormData();
    fd.append('zxr_audio_file', zxrBlob, zxrName);
    zxrShow(zxrStatusEl, '正在识别「' + zxrName + '」...', true);
    zxrResultCard.hidden = true;
    zxrRecognizeRecBtn.disabled = true;
    zxrRecognizeFileBtn.disabled = true;

    fetch('/api/zxr_asr_transcribe', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        zxrLog('识别结果', json);
        if (json.code !== 0) {
          zxrShow(zxrStatusEl, json.msg, false);
          return;
        }
        zxrShow(zxrStatusEl, '识别完成', true);
        zxrRenderResult(json, zxrName);
      })
      .catch(function (err) {
        zxrLogErr('请求失败', err);
        zxrShow(zxrStatusEl, '网络异常，请确认后端服务已启动后重试', false);
      })
      .finally(function () {
        zxrRecognizeRecBtn.disabled = false;
        zxrRecognizeFileBtn.disabled = false;
      });
  }

  // ---------- 方式一：麦克风录音 ----------
  zxrRecordBtn.addEventListener('click', function () {
    if (zxrRecorder && zxrRecorder.state === 'recording') {
      zxrRecorder.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      zxrShow(zxrRecordStatus, '当前浏览器不支持录音，请使用方式二上传音频文件', false);
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        zxrRecChunks = [];
        zxrRecBlob = null;
        zxrRecorder = new MediaRecorder(stream);
        zxrRecorder.ondataavailable = function (e) {
          if (e.data.size) zxrRecChunks.push(e.data);
        };
        zxrRecorder.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          zxrRecBlob = new Blob(zxrRecChunks, { type: zxrRecorder.mimeType || 'audio/webm' });
          zxrLog('录音完成', { mime: zxrRecBlob.type, size: zxrRecBlob.size });
          zxrPlayback.src = URL.createObjectURL(zxrRecBlob);
          zxrPlayback.hidden = false;
          zxrRecognizeRecBtn.hidden = false;
          zxrRecordBtn.textContent = '● 开始录音';
          zxrRecordBtn.classList.remove('zxr_recording');
          zxrShow(zxrRecordStatus, '录音完成，可回放后点击「识别录音」', true);
        };
        zxrRecorder.start();
        zxrRecordBtn.textContent = '■ 停止录音';
        zxrRecordBtn.classList.add('zxr_recording');
        zxrShow(zxrRecordStatus, '正在录音... 再次点击按钮结束', true);
        zxrLog('开始录音', 'MediaRecorder 已启动');
      })
      .catch(function (err) {
        zxrLogErr('获取麦克风失败', err);
        zxrShow(zxrRecordStatus, '无法访问麦克风：' + err.message + '（请检查浏览器权限，或用方式二上传文件）', false);
      });
  });

  zxrRecognizeRecBtn.addEventListener('click', function () {
    if (zxrRecBlob) zxrTranscribe(zxrRecBlob, '录音.' + (zxrRecBlob.type.indexOf('mp4') > -1 ? 'm4a' : 'webm'), zxrRecordStatus);
  });

  // ---------- 方式二：上传音频文件 ----------
  function zxrAccept(file) {
    if (file.size > 15 * 1024 * 1024) {
      zxrShow(zxrUploadStatus, '文件超过 15MB', false);
      return;
    }
    zxrFileBlob = file;
    zxrRecognizeFileBtn.hidden = false;
    zxrShow(zxrUploadStatus, '已选择「' + file.name + '」，点击「识别文件」', true);
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

  zxrRecognizeFileBtn.addEventListener('click', function () {
    if (zxrFileBlob) zxrTranscribe(zxrFileBlob, zxrFileBlob.name, zxrUploadStatus);
  });
})();
