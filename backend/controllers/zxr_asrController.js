/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：语音识别（ASR）控制器：上传/录制音频 -> 硅基流动 Qwen3-ASR 模型 -> 返回文字
  七牛渠道模型列表中无任何语音模型，故按最接近方案使用硅基流动 Qwen/Qwen3-ASR-1.7B
  服务端控制台输出发送给大模型的数据和接收自大模型的数据
*/
const fs = require('fs');

exports.zxrTranscribe = async (zxrReq, zxrRes) => {
  try {
    if (!zxrReq.file) {
      return zxrRes.json({ code: 1, msg: '请先录音或选择音频文件（wav/mp3/webm/m4a，≤15MB）', data: null });
    }
    const zxrModel = process.env.SILICONFLOW_ASR_MODEL || 'Qwen/Qwen3-ASR-1.7B';
    const zxrBuf = fs.readFileSync(zxrReq.file.path);
    fs.unlinkSync(zxrReq.file.path); // 用完即删

    // 组装 multipart 转发请求（发送给大模型的数据）
    const zxrForm = new FormData();
    zxrForm.append('file', new Blob([zxrBuf], { type: zxrReq.file.mimetype }), zxrReq.file.originalname);
    zxrForm.append('model', zxrModel);
    console.log('\n[ASR] ========== 发送给大模型的数据 ==========');
    console.log(JSON.stringify({
      endpoint: process.env.SILICONFLOW_BASE_URL + '/audio/transcriptions',
      model: zxrModel,
      audio: { name: zxrReq.file.originalname, mime: zxrReq.file.mimetype, sizeBytes: zxrBuf.length }
    }, null, 2));

    const zxrResp = await fetch(process.env.SILICONFLOW_BASE_URL + '/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}` },
      body: zxrForm
    });
    const zxrRaw = await zxrResp.text();

    // 接收自大模型的数据
    console.log('\n[ASR] ========== 接收自大模型的数据 ==========');
    console.log(zxrRaw);

    if (!zxrResp.ok) {
      const zxrFriendly = zxrResp.status === 401 ? 'API Key 无效，请检查后端 .env'
        : zxrResp.status === 429 ? '请求过于频繁或额度不足，请稍后再试'
        : `语音识别服务异常（上游 ${zxrResp.status}）`;
      return zxrRes.json({ code: 1, msg: zxrFriendly, data: null });
    }
    const zxrBody = JSON.parse(zxrRaw);
    const zxrText = zxrBody.text;
    if (typeof zxrText !== 'string') {
      return zxrRes.json({ code: 1, msg: '模型未返回识别文本，请重试', data: null });
    }

    zxrRes.json({
      code: 0,
      msg: 'ok',
      data: { text: zxrText, model: zxrModel, audioBytes: zxrBuf.length }
    });
  } catch (zxrErr) {
    console.error('[ASR] 识别失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '识别失败：' + zxrErr.message, data: null });
  }
};
