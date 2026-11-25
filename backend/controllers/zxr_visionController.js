/*
  姓名：Zouxinru | 学号：24002120217
  时间：2026-11-25 | 大模型：GLM-5.3-Flash
  说明：图像识别控制器：上传图片 -> base64 -> 视觉模型（Qwen/Qwen3-VL-8B-Instruct）-> 返回图片描述
  服务端控制台输出发送给大模型的数据和接收自大模型的数据
*/
const fs = require('fs');

exports.zxrDescribe = async (zxrReq, zxrRes) => {
  try {
    if (!zxrReq.file) {
      return zxrRes.json({ code: 1, msg: '请选择图片文件（jpg/png/webp/gif，≤8MB）', data: null });
    }
    const zxrMime = zxrReq.file.mimetype;
    const zxrAllowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!zxrAllowed.includes(zxrMime)) {
      fs.unlinkSync(zxrReq.file.path);
      return zxrRes.json({ code: 1, msg: '仅支持 jpg/png/webp/gif 图片', data: null });
    }

    // 组装多模态消息：文本提问 + base64 图片
    const zxrBase64 = fs.readFileSync(zxrReq.file.path).toString('base64');
    fs.unlinkSync(zxrReq.file.path); // 用完即删，不长期保存原图
    const zxrDataUrl = `data:${zxrMime};base64,${zxrBase64}`;
    const zxrQuestion = (zxrReq.body.zxr_question || '请用中文详细描述这张图片的内容。').trim();

    const zxrMessages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: zxrQuestion },
          { type: 'image_url', image_url: { url: zxrDataUrl } }
        ]
      }
    ];

    // 控制台输出发送给大模型的数据（base64 过长，截断展示前 200 字符）
    console.log('\n[VISION] ========== 发送给大模型的数据 ==========');
    console.log(JSON.stringify({
      model: process.env.SILICONFLOW_VISION_MODEL,
      messages: [
        { role: 'user', content: [
          { type: 'text', text: zxrQuestion },
          { type: 'image_url', image_url: { url: zxrDataUrl.slice(0, 200) + `...(base64 共 ${zxrBase64.length} 字符，已截断展示)` } }
        ] }
      ]
    }, null, 2));

    // 调用视觉模型（与 AI 客服同一硅基流动 Key）
    const zxrResp = await fetch(`${process.env.SILICONFLOW_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.SILICONFLOW_VISION_MODEL,
        messages: zxrMessages
      })
    });
    const zxrRaw = await zxrResp.text();

    // 控制台输出接收自大模型的数据
    console.log('\n[VISION] ========== 接收自大模型的数据 ==========');
    console.log(zxrRaw);

    if (!zxrResp.ok) {
      const zxrFriendly = zxrResp.status === 401 ? 'API Key 无效，请检查后端 .env'
        : zxrResp.status === 429 ? '请求过于频繁或额度不足，请稍后再试'
        : `视觉模型服务异常（上游 ${zxrResp.status}）`;
      return zxrRes.json({ code: 1, msg: zxrFriendly, data: null });
    }
    const zxrBody = JSON.parse(zxrRaw);
    const zxrDesc = zxrBody.choices?.[0]?.message?.content;
    if (!zxrDesc) {
      return zxrRes.json({ code: 1, msg: '模型未返回描述，请重试', data: null });
    }

    zxrRes.json({
      code: 0,
      msg: 'ok',
      data: {
        description: zxrDesc,
        model: process.env.SILICONFLOW_VISION_MODEL,
        imageBytes: zxrBase64.length
      }
    });
  } catch (zxrErr) {
    console.error('[VISION] 识别失败：', zxrErr.message);
    zxrRes.json({ code: 1, msg: '识别失败：' + zxrErr.message, data: null });
  }
};
